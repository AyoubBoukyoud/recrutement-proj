<?php

namespace App\Services\Otp\Channels;

use App\Contracts\OtpChannel;
use App\Services\Otp\Exceptions\OtpDeliveryException;
use App\Support\PhoneNumber;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Evolution Go — a self-hosted WhatsApp gateway driving a real linked device
 * (github.com/evolution-foundation/evolution-go).
 *
 * The trade against WhatsAppOtpChannel: no Business account, no template to get
 * approved and no per-message fee, because the code leaves as ordinary text
 * from a WhatsApp account paired by QR. The cost is that delivery depends on
 * that pairing staying alive and on Meta tolerating it, so this belongs in
 * front of a channel that depends on neither — see the chain in config/otp.php.
 *
 * `apikey` here is the *instance* token chosen at /instance/create, not the
 * server's GLOBAL_API_KEY: only the /instance admin routes accept the latter.
 */
class EvolutionGoOtpChannel implements OtpChannel
{
    /** @param  array<string, mixed>  $config */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'evolution';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['base_url']) && ! empty($this->config['token']);
    }

    public function send(string $phone, string $code, int $ttlMinutes): void
    {
        $number = PhoneNumber::digits($phone);

        $this->guardNumberIsOnWhatsApp($number);

        $text = strtr((string) $this->config['message'], [
            ':code' => $code,
            ':minutes' => (string) $ttlMinutes,
        ]);

        $response = $this->post('/send/text', ['number' => $number, 'text' => $text]);

        if ($response->failed()) {
            throw new OtpDeliveryException(
                "Evolution Go rejected the message ({$response->status()}): {$this->errorFrom($response)}"
            );
        }
    }

    /**
     * Sending to a number that has no WhatsApp account succeeds as far as the
     * gateway is concerned — whatsmeow hands the message to the network and
     * nothing bounces. Without this pre-flight the chain would count that as a
     * delivery and never reach SMS, so a candidate without WhatsApp could never
     * sign in. One extra round-trip is worth that.
     *
     * A check that errors or answers unrecognisably is treated as "unknown" and
     * lets the send proceed: the gateway being briefly unhelpful is not
     * evidence the candidate is unreachable.
     */
    private function guardNumberIsOnWhatsApp(string $number): void
    {
        if (! ($this->config['check_number'] ?? true)) {
            return;
        }

        try {
            $response = $this->post('/user/check', ['number' => [$number]]);
        } catch (OtpDeliveryException) {
            return;
        }

        if ($response->failed()) {
            return;
        }

        // No json tags on the Go structs, so the keys come back PascalCase.
        $registered = $response->json('data.Users.0.IsInWhatsapp');

        if ($registered === false) {
            throw new OtpDeliveryException("{$number} has no WhatsApp account.");
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     *
     * @throws OtpDeliveryException when the gateway could not be reached at all
     */
    private function post(string $path, array $payload): Response
    {
        $url = rtrim((string) $this->config['base_url'], '/').$path;

        try {
            return Http::withHeaders(['apikey' => (string) $this->config['token']])
                ->timeout((int) $this->config['timeout'])
                ->asJson()
                ->post($url, $payload);
        } catch (ConnectionException $e) {
            throw new OtpDeliveryException("Evolution Go unreachable: {$e->getMessage()}");
        }
    }

    private function errorFrom(Response $response): string
    {
        $error = $response->json('error');

        return is_string($error) && $error !== '' ? $error : $response->body();
    }
}
