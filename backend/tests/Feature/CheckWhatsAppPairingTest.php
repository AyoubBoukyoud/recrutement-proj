<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Tests\TestCase;

/**
 * The pairing watchdog: a dropped WhatsApp session used to be discovered by a
 * candidate who could not sign in.
 */
class CheckWhatsAppPairingTest extends TestCase
{
    private const STATUS = 'evo.test/instance/status';

    private const CONNECT = 'evo.test/instance/connect';

    private const SLACK = 'hooks.slack.test/*';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('cache.default', 'array');
        config()->set('otp.channels', ['evolution']);
        config()->set('otp.connections.evolution.base_url', 'https://evo.test');
        config()->set('otp.connections.evolution.token', 'instance-token');
        config()->set('complaints.slack_webhook', 'https://hooks.slack.test/services/T/B/X');
        config()->set('complaints.alert_email', null);

        Cache::flush();
        Sleep::fake();
    }

    private function pairing(bool $connected, bool $loggedIn = true): array
    {
        return ['message' => 'success', 'data' => ['Connected' => $connected, 'LoggedIn' => $loggedIn]];
    }

    private function slackMessages(): array
    {
        return Http::recorded(fn (Request $request) => str_contains($request->url(), 'hooks.slack.test'))
            ->map(fn (array $pair) => $pair[0]['text'])->values()
            ->all();
    }

    public function test_a_connected_pairing_is_quiet(): void
    {
        Http::fake([self::STATUS => Http::response($this->pairing(true))]);

        $this->artisan('otp:check-whatsapp')->assertSuccessful();

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => $request->hasHeader('apikey', 'instance-token'));
    }

    public function test_a_dropped_session_that_reconnects_does_not_alert(): void
    {
        Http::fake([
            self::STATUS => Http::sequence()->push($this->pairing(false))->push($this->pairing(true)),
            self::CONNECT => Http::response(['message' => 'success']),
        ]);

        $this->artisan('otp:check-whatsapp')->assertSuccessful();

        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/instance/connect')
            && $request['subscribe'] === ['MESSAGE']);
        $this->assertSame([], $this->slackMessages());
    }

    public function test_it_alerts_on_the_second_failure_then_stays_quiet_then_announces_recovery(): void
    {
        Http::fake([
            self::STATUS => Http::sequence()
                ->push($this->pairing(false))->push($this->pairing(false))   // run 1
                ->push($this->pairing(false))->push($this->pairing(false))   // run 2
                ->push($this->pairing(false))->push($this->pairing(false))   // run 3
                ->push($this->pairing(true)),                               // run 4
            self::CONNECT => Http::response(['message' => 'success']),
            self::SLACK => Http::response('ok'),
        ]);

        $this->artisan('otp:check-whatsapp')->assertFailed();
        $this->assertCount(0, $this->slackMessages(), 'one failed check is not an outage yet');

        $this->artisan('otp:check-whatsapp')->assertFailed();
        $this->assertCount(1, $this->slackMessages());
        $this->assertStringContainsString('sign-in codes are down', $this->slackMessages()[0]);

        $this->artisan('otp:check-whatsapp')->assertFailed();
        $this->assertCount(1, $this->slackMessages(), 'no reminder before the repeat interval');

        $this->artisan('otp:check-whatsapp')->assertSuccessful();
        $this->assertCount(2, $this->slackMessages());
        $this->assertStringContainsString('working again', $this->slackMessages()[1]);
    }

    public function test_it_reminds_again_once_the_repeat_interval_has_passed(): void
    {
        Http::fake([
            self::STATUS => Http::response($this->pairing(false)),
            self::CONNECT => Http::response(['message' => 'success']),
            self::SLACK => Http::response('ok'),
        ]);

        $this->artisan('otp:check-whatsapp')->assertFailed();
        $this->artisan('otp:check-whatsapp')->assertFailed();
        $this->assertCount(1, $this->slackMessages());

        $this->travel(7)->hours();

        $this->artisan('otp:check-whatsapp')->assertFailed();
        $this->assertCount(2, $this->slackMessages());
    }

    public function test_a_logged_out_device_and_an_unreachable_gateway_both_count_as_down(): void
    {
        Http::fake([
            self::STATUS => Http::response($this->pairing(true, loggedIn: false)),
            self::CONNECT => Http::response(['message' => 'success']),
            self::SLACK => Http::response('ok'),
        ]);

        $this->artisan('otp:check-whatsapp', ['--failures' => 1])->assertFailed();
        $this->assertStringContainsString('QR code', $this->slackMessages()[0]);

        Cache::flush();
        Http::fake([
            self::STATUS => Http::response('boom', 500),
            self::CONNECT => Http::response('boom', 500),
            self::SLACK => Http::response('ok'),
        ]);

        $this->artisan('otp:check-whatsapp', ['--failures' => 1])->assertFailed();
    }

    public function test_it_does_nothing_when_whatsapp_is_not_the_sign_in_channel(): void
    {
        config()->set('otp.channels', ['log']);
        Http::fake();

        $this->artisan('otp:check-whatsapp')->assertSuccessful();

        Http::assertNothingSent();
    }
}
