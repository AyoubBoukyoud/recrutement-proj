<?php

namespace App\Services\Otp\Channels;

use App\Contracts\OtpChannel;
use App\Services\Otp\Exceptions\OtpDeliveryException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Twilio Programmable SMS — the fallback for candidates who do not have
 * WhatsApp, or whose WhatsApp send failed.
 *
 * Called over plain HTTP rather than the Twilio SDK: one form POST does not
 * justify the dependency, and it keeps this driver mockable with Http::fake().
 */
class TwilioSmsOtpChannel implements OtpChannel
{
    /** @param  array<string, mixed>  $config */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'sms';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['account_sid'])
            && ! empty($this->config['auth_token'])
            && (! empty($this->config['from']) || ! empty($this->config['messaging_service_sid']));
    }

    public function send(string $phone, string $code, int $ttlMinutes): void
    {
        $url = sprintf(
            '%s/2010-04-01/Accounts/%s/Messages.json',
            rtrim((string) $this->config['base_url'], '/'),
            $this->config['account_sid'],
        );

        $body = strtr((string) $this->config['message'], [
            ':code' => $code,
            ':minutes' => (string) $ttlMinutes,
        ]);

        $params = ['To' => $phone, 'Body' => $body];

        // A Messaging Service picks a compliant sender per destination country;
        // a bare `from` number is the simpler single-country setup.
        if (! empty($this->config['messaging_service_sid'])) {
            $params['MessagingServiceSid'] = $this->config['messaging_service_sid'];
        } else {
            $params['From'] = $this->config['from'];
        }

        try {
            $response = Http::withBasicAuth($this->config['account_sid'], $this->config['auth_token'])
                ->timeout((int) $this->config['timeout'])
                ->asForm()
                ->post($url, $params);
        } catch (ConnectionException $e) {
            throw new OtpDeliveryException("Twilio unreachable: {$e->getMessage()}");
        }

        if ($response->failed()) {
            $error = $response->json('message') ?? $response->body();

            throw new OtpDeliveryException("Twilio rejected the message ({$response->status()}): {$error}");
        }
    }
}
