<?php

namespace Tests\Feature;

use App\Contracts\OtpChannel;
use App\Models\OtpCode;
use App\Services\Otp\Exceptions\OtpDeliveryException;
use App\Services\Otp\OtpChannelManager;
use App\Services\OtpService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The dual-channel requirement: WhatsApp first, SMS behind it, and nothing in
 * the codebase needing to change to swap either one out.
 */
class OtpChannelTest extends TestCase
{
    use RefreshDatabase;

    private const WHATSAPP = 'graph.facebook.com/*';

    private const TWILIO = 'api.twilio.com/*';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('otp.channels', ['whatsapp', 'sms']);
        config()->set('otp.connections.whatsapp.token', 'meta-token');
        config()->set('otp.connections.whatsapp.phone_number_id', '10203040');
        config()->set('otp.connections.sms.account_sid', 'AC123');
        config()->set('otp.connections.sms.auth_token', 'twilio-secret');
        config()->set('otp.connections.sms.from', '+15550001111');
    }

    private function otp(): OtpService
    {
        return app(OtpService::class);
    }

    public function test_whatsapp_is_tried_first_and_sms_is_left_alone(): void
    {
        Http::fake([
            self::WHATSAPP => Http::response(['messages' => [['id' => 'wamid.abc']]]),
            self::TWILIO => Http::response(['sid' => 'SM1']),
        ]);

        $dispatch = $this->otp()->send('+212600000001');

        $this->assertSame('whatsapp', $dispatch->channel);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'twilio'));

        Http::assertSent(function (Request $request) {
            $body = $request->data();

            return $request->url() === 'https://graph.facebook.com/v21.0/10203040/messages'
                && $request->hasHeader('Authorization', 'Bearer meta-token')
                // The Cloud API wants bare digits, not E.164.
                && $body['to'] === '212600000001'
                && $body['template']['name'] === 'otp_code'
                && strlen($body['template']['components'][0]['parameters'][0]['text']) === 6
                // One-tap copy-code button repeats the code.
                && $body['template']['components'][1]['parameters'][0]['text']
                    === $body['template']['components'][0]['parameters'][0]['text'];
        });
    }

    public function test_sms_takes_over_when_whatsapp_fails(): void
    {
        Http::fake([
            self::WHATSAPP => Http::response(['error' => ['message' => 'Template not approved']], 400),
            self::TWILIO => Http::response(['sid' => 'SM1'], 201),
        ]);

        $dispatch = $this->otp()->send('+212600000001');

        $this->assertSame('sms', $dispatch->channel);
        $this->assertSame('sms', OtpCode::first()->channel);

        Http::assertSent(function (Request $request) {
            $body = $request->data();

            return str_contains($request->url(), 'api.twilio.com/2010-04-01/Accounts/AC123/Messages.json')
                && $body['To'] === '+212600000001'
                && $body['From'] === '+15550001111'
                && preg_match('/\b\d{6}\b/', $body['Body']) === 1;
        });
    }

    public function test_a_messaging_service_replaces_the_from_number_when_set(): void
    {
        config()->set('otp.channels', ['sms']);
        config()->set('otp.connections.sms.messaging_service_sid', 'MG999');

        Http::fake([self::TWILIO => Http::response(['sid' => 'SM1'], 201)]);

        $this->otp()->send('+212600000001');

        Http::assertSent(fn (Request $request) => $request->data()['MessagingServiceSid'] === 'MG999'
            && ! isset($request->data()['From']));
    }

    public function test_a_channel_missing_credentials_is_skipped_rather_than_attempted(): void
    {
        config()->set('otp.connections.whatsapp.token', null);

        Http::fake([
            self::WHATSAPP => Http::response([], 500),
            self::TWILIO => Http::response(['sid' => 'SM1'], 201),
        ]);

        $this->assertSame('sms', $this->otp()->send('+212600000001')->channel);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'facebook'));
    }

    public function test_no_code_is_stored_when_every_channel_fails(): void
    {
        Http::fake([
            self::WHATSAPP => Http::response(['error' => ['message' => 'down']], 500),
            self::TWILIO => Http::response(['message' => 'down'], 500),
        ]);

        try {
            $this->otp()->send('+212600000001');
            $this->fail('Expected the exhausted chain to throw.');
        } catch (OtpDeliveryException $e) {
            $this->assertArrayHasKey('whatsapp', $e->failures);
            $this->assertArrayHasKey('sms', $e->failures);
        }

        // A code the candidate cannot possibly have must not start a cooldown.
        $this->assertSame(0, OtpCode::count());
    }

    public function test_a_failed_send_surfaces_as_a_bad_gateway_not_a_crash(): void
    {
        $this->seed(RoleSeeder::class);

        Http::fake([
            self::WHATSAPP => Http::response([], 500),
            self::TWILIO => Http::response([], 500),
        ]);

        $this->postJson('/api/auth/otp/request', ['phone' => '+212600000001'])
            ->assertStatus(502)
            ->assertJsonPath('message', 'We could not send your code right now. Please try again in a moment.');
    }

    public function test_a_new_provider_can_be_added_without_touching_existing_code(): void
    {
        $log = new \ArrayObject;

        app(OtpChannelManager::class)->extend('carrier-x', fn (array $config, string $name) => new class($log) implements OtpChannel
        {
            public function __construct(private readonly \ArrayObject $log) {}

            public function name(): string
            {
                return 'carrier-x';
            }

            public function isConfigured(): bool
            {
                return true;
            }

            public function send(string $phone, string $code, int $ttlMinutes): void
            {
                $this->log[] = [$phone, $code];
            }
        });

        config()->set('otp.channels', ['carrier-x']);
        config()->set('otp.connections.carrier-x', ['driver' => 'carrier-x']);

        $this->assertSame('carrier-x', $this->otp()->send('+212600000001')->channel);
        $this->assertSame('+212600000001', $log[0][0]);
    }
}
