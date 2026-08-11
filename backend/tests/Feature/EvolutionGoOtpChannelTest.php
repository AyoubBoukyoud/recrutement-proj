<?php

namespace Tests\Feature;

use App\Models\OtpCode;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Sign-in over a self-hosted Evolution Go gateway, with SMS still behind it.
 *
 * The case that earns its own file is the /user/check pre-flight: the gateway
 * reports success for a number that has no WhatsApp account, so without it the
 * chain would stop at a message nobody receives.
 */
class EvolutionGoOtpChannelTest extends TestCase
{
    use RefreshDatabase;

    private const SEND = 'evo.test/send/text';

    private const CHECK = 'evo.test/user/check';

    private const TWILIO = 'api.twilio.com/*';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('otp.channels', ['evolution', 'sms']);
        config()->set('otp.connections.evolution.base_url', 'https://evo.test');
        config()->set('otp.connections.evolution.token', 'instance-token');
        config()->set('otp.connections.sms.account_sid', 'AC123');
        config()->set('otp.connections.sms.auth_token', 'twilio-secret');
        config()->set('otp.connections.sms.from', '+15550001111');
    }

    /** @param  array<string, mixed>  $overrides */
    private function fake(array $overrides = []): void
    {
        Http::fake([
            self::CHECK => Http::response(['message' => 'success', 'data' => [
                'Users' => [['Query' => '212600000001', 'IsInWhatsapp' => true]],
            ]]),
            self::SEND => Http::response(['message' => 'success', 'data' => ['Id' => 'ABC123']]),
            self::TWILIO => Http::response(['sid' => 'SM1'], 201),
            ...$overrides,
        ]);
    }

    public function test_the_code_goes_out_over_the_gateway_and_sms_is_left_alone(): void
    {
        $this->fake();

        $dispatch = $this->otpService()->send('+212600000001');

        $this->assertSame('evolution', $dispatch->channel);
        $this->assertSame('evolution', OtpCode::first()->channel);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'twilio'));

        Http::assertSent(function (Request $request) {
            if ($request->url() !== 'https://evo.test/send/text') {
                return false;
            }

            $body = $request->data();

            // The instance token, not GLOBAL_API_KEY, and bare digits so the
            // gateway's JID normalisation has nothing to strip.
            return $request->hasHeader('apikey', 'instance-token')
                && $body['number'] === '212600000001'
                && preg_match('/\b\d{6}\b/', $body['text']) === 1;
        });
    }

    public function test_a_number_with_no_whatsapp_account_falls_through_to_sms(): void
    {
        $this->fake([
            self::CHECK => Http::response(['message' => 'success', 'data' => [
                'Users' => [['Query' => '212600000001', 'IsInWhatsapp' => false]],
            ]]),
        ]);

        $this->assertSame('sms', $this->otpService()->send('+212600000001')->channel);

        // The point of the pre-flight: nothing was handed to the gateway.
        Http::assertNotSent(fn (Request $request) => $request->url() === 'https://evo.test/send/text');
    }

    public function test_an_unreachable_gateway_falls_through_to_sms(): void
    {
        $this->fake([self::SEND => Http::response(['error' => 'no session'], 500)]);

        $this->assertSame('sms', $this->otpService()->send('+212600000001')->channel);
    }

    public function test_a_check_that_fails_does_not_block_the_send(): void
    {
        // The gateway being briefly unhelpful is not evidence the candidate is
        // unreachable, so an unusable answer must not cost them their code.
        $this->fake([self::CHECK => Http::response(['error' => 'timeout'], 500)]);

        $this->assertSame('evolution', $this->otpService()->send('+212600000001')->channel);
    }

    public function test_the_check_can_be_switched_off(): void
    {
        config()->set('otp.connections.evolution.check_number', false);

        $this->fake();

        $this->assertSame('evolution', $this->otpService()->send('+212600000001')->channel);
        Http::assertNotSent(fn (Request $request) => $request->url() === 'https://evo.test/user/check');
    }

    public function test_a_gateway_without_an_instance_token_is_skipped_rather_than_attempted(): void
    {
        config()->set('otp.connections.evolution.token', null);

        $this->fake();

        $this->assertSame('sms', $this->otpService()->send('+212600000001')->channel);
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'evo.test'));
    }

    private function otpService(): OtpService
    {
        return app(OtpService::class);
    }
}
