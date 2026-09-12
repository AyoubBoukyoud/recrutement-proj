<?php

namespace App\Services\Otp;

use App\Contracts\OtpChannel;
use App\Services\Otp\Channels\EvolutionGoOtpChannel;
use App\Services\Otp\Channels\LogOtpChannel;
use App\Services\Otp\Channels\TwilioSmsOtpChannel;
use App\Services\Otp\Channels\WhatsAppOtpChannel;
use App\Services\Otp\Exceptions\OtpDeliveryException;
use Closure;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Builds channels from config/otp.php and walks the fallback chain.
 *
 * The dual-channel requirement lives here rather than in any driver: a channel
 * only knows how to send, and this decides what "WhatsApp with SMS fallback"
 * means. Reordering or replacing the chain is an .env change.
 */
class OtpChannelManager
{
    /** @var array<string, class-string<OtpChannel>> */
    private const DRIVERS = [
        'log' => LogOtpChannel::class,
        'whatsapp' => WhatsAppOtpChannel::class,
        'evolution' => EvolutionGoOtpChannel::class,
        'twilio' => TwilioSmsOtpChannel::class,
    ];

    /** @var array<string, OtpChannel> */
    private array $resolved = [];

    /** @var array<string, Closure(array<string, mixed>, string): OtpChannel> */
    private array $custom = [];

    public function __construct(private readonly Repository $config) {}

    /**
     * Register a driver the package does not ship — call from a service
     * provider. Lets a new provider be added without touching this class.
     *
     * @param  Closure(array<string, mixed>, string): OtpChannel  $factory
     */
    public function extend(string $driver, Closure $factory): self
    {
        $this->custom[$driver] = $factory;
        $this->resolved = [];

        return $this;
    }

    /** Connection names in the order they will be attempted. */
    public function chain(): array
    {
        return (array) $this->config->get('otp.channels', ['log']);
    }

    public function channel(string $name): OtpChannel
    {
        if (isset($this->resolved[$name])) {
            return $this->resolved[$name];
        }

        $connection = $this->config->get("otp.connections.{$name}");

        if (! is_array($connection)) {
            throw new InvalidArgumentException("OTP channel [{$name}] is not defined in config/otp.php.");
        }

        $driver = $connection['driver'] ?? $name;

        if (isset($this->custom[$driver])) {
            return $this->resolved[$name] = ($this->custom[$driver])($connection, $name);
        }

        if (! isset(self::DRIVERS[$driver])) {
            throw new InvalidArgumentException("OTP driver [{$driver}] has no implementation.");
        }

        $class = self::DRIVERS[$driver];

        return $this->resolved[$name] = new $class($connection);
    }

    /**
     * Try each configured channel in turn.
     *
     * @return string the channel that delivered
     *
     * @throws OtpDeliveryException if every channel is unconfigured or failed
     */
    public function send(string $phone, string $code, int $ttlMinutes): string
    {
        $failures = [];

        foreach ($this->chain() as $name) {
            $channel = $this->channel($name);

            if (! $channel->isConfigured()) {
                $failures[$name] = 'not configured';

                continue;
            }

            try {
                $channel->send($phone, $code, $ttlMinutes);

                return $channel->name();
            } catch (OtpDeliveryException $e) {
                $failures[$name] = $e->getMessage();

                // Warning, not error: the next channel may well succeed, and a
                // candidate who receives the SMS had no failure to speak of.
                Log::warning("OTP channel [{$name}] failed, falling through.", [
                    'phone' => $phone,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::error('Every OTP channel failed.', ['phone' => $phone, 'failures' => $failures]);

        throw OtpDeliveryException::chainExhausted($failures);
    }
}
