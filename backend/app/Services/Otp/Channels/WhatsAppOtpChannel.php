<?php

namespace App\Services\Otp\Channels;

use App\Contracts\OtpChannel;
use App\Services\Otp\Exceptions\OtpDeliveryException;
use App\Support\PhoneNumber;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Meta WhatsApp Business Cloud API.
 *
 * First in the chain because it is what the target audience actually reads,
 * and because a WhatsApp authentication template costs a fraction of an
 * international SMS to Morocco.
 *
 * The message must be a pre-approved AUTHENTICATION template: outside a
 * 24-hour customer service window — which a sign-in always is — Meta will not
 * deliver free-form text.
 */
class WhatsAppOtpChannel implements OtpChannel
{
    /** @param  array<string, mixed>  $config */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'whatsapp';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config['token'])
            && ! empty($this->config['phone_number_id'])
            && ! empty($this->config['template']);
    }

    public function send(string $phone, string $code, int $ttlMinutes): void
    {
        $url = sprintf(
            '%s/%s/%s/messages',
            rtrim((string) $this->config['base_url'], '/'),
            $this->config['api_version'],
            $this->config['phone_number_id'],
        );

        try {
            $response = Http::withToken($this->config['token'])
                ->timeout((int) $this->config['timeout'])
                ->asJson()
                ->post($url, $this->payload($phone, $code));
        } catch (ConnectionException $e) {
            throw new OtpDeliveryException("WhatsApp unreachable: {$e->getMessage()}");
        }

        if ($response->failed()) {
            // Meta nests the useful part; the raw body is the fallback.
            $error = $response->json('error.message') ?? $response->body();

            throw new OtpDeliveryException("WhatsApp rejected the message ({$response->status()}): {$error}");
        }
    }

    /** @return array<string, mixed> */
    private function payload(string $phone, string $code): array
    {
        $components = [
            ['type' => 'body', 'parameters' => [['type' => 'text', 'text' => $code]]],
        ];

        if ($this->config['copy_code_button'] ?? true) {
            $components[] = [
                'type' => 'button',
                'sub_type' => 'url',
                'index' => '0',
                'parameters' => [['type' => 'text', 'text' => $code]],
            ];
        }

        return [
            'messaging_product' => 'whatsapp',
            // The Cloud API wants bare digits, not E.164 with a plus.
            'to' => PhoneNumber::digits($phone),
            'type' => 'template',
            'template' => [
                'name' => $this->config['template'],
                'language' => ['code' => $this->config['template_language']],
                'components' => $components,
            ],
        ];
    }
}
