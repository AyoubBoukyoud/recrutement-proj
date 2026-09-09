<?php

namespace Tests\Feature;

use App\Jobs\NotifyAdminsOfComplaint;
use App\Models\Complaint;
use App\Models\User;
use App\Notifications\ComplaintSubmitted;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * A complaint is a conversation with two ends: somebody has to be told one
 * arrived, and the person who raised it has to hear back.
 */
class ComplaintTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config(['complaints.alert_email' => null, 'complaints.slack_webhook' => null]);
    }

    private function candidate(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    private function administrator(?string $email = 'ops@example.com'): User
    {
        $admin = User::factory()->create(['email' => $email]);
        $admin->assignRole('Administrator');

        return $admin;
    }

    private function complaintFrom(User $user, array $attributes = []): Complaint
    {
        return $user->complaints()->create([
            'type' => 'text',
            'body' => 'The upload button does nothing.',
            'status' => 'open',
            ...$attributes,
        ]);
    }

    // --- Administrator alerts ---------------------------------------------

    public function test_submitting_a_complaint_queues_an_admin_alert_and_does_not_claim_one_was_sent(): void
    {
        Bus::fake([NotifyAdminsOfComplaint::class]);
        $this->candidate();

        $response = $this->postJson('/api/complaints', [
            'type' => 'text',
            'body' => 'The upload button does nothing.',
        ])->assertCreated();

        // The column used to be stamped at insert while nothing was sent.
        $this->assertNull($response->json('admin_notified_at'));
        Bus::assertDispatched(NotifyAdminsOfComplaint::class);
    }

    public function test_every_administrator_with_an_email_is_notified(): void
    {
        Notification::fake();

        $first = $this->administrator('ops@example.com');
        $second = $this->administrator('lead@example.com');
        // Not an administrator, and must not be told about other people's problems.
        $bystander = User::factory()->create(['email' => 'nosy@example.com']);

        $complaint = $this->complaintFrom(User::factory()->create());

        (new NotifyAdminsOfComplaint($complaint->id))->handle();

        Notification::assertSentTo([$first, $second], ComplaintSubmitted::class);
        Notification::assertNotSentTo($bystander, ComplaintSubmitted::class);
        $this->assertNotNull($complaint->fresh()->admin_notified_at);
    }

    public function test_the_ops_mailbox_covers_a_deployment_where_no_admin_has_an_email(): void
    {
        Notification::fake();
        config(['complaints.alert_email' => 'alerts@example.com']);

        // Phone-first accounts: an administrator with no email is normal.
        $this->administrator(email: null);

        $complaint = $this->complaintFrom(User::factory()->create());

        (new NotifyAdminsOfComplaint($complaint->id))->handle();

        Notification::assertSentOnDemand(ComplaintSubmitted::class);
        $this->assertNotNull($complaint->fresh()->admin_notified_at);
    }

    public function test_a_slack_webhook_is_posted_when_one_is_configured(): void
    {
        Notification::fake();
        Http::fake(['*' => Http::response('ok')]);
        config(['complaints.slack_webhook' => 'https://hooks.slack.test/abc']);

        $complaint = $this->complaintFrom(User::factory()->create(['phone' => '+212600000001']));

        (new NotifyAdminsOfComplaint($complaint->id))->handle();

        Http::assertSent(fn ($request) => $request->url() === 'https://hooks.slack.test/abc'
            && str_contains($request['text'], 'The upload button does nothing.'));

        // Slack alone is enough to count as announced.
        $this->assertNotNull($complaint->fresh()->admin_notified_at);
    }

    public function test_a_complaint_nobody_could_be_told_about_stays_unnotified(): void
    {
        Notification::fake();
        Log::spy();

        $complaint = $this->complaintFrom(User::factory()->create());

        (new NotifyAdminsOfComplaint($complaint->id))->handle();

        Notification::assertNothingSent();
        $this->assertNull($complaint->fresh()->admin_notified_at);
        Log::shouldHaveReceived('warning')->once();
    }

    public function test_a_failing_slack_webhook_does_not_undo_a_delivered_email(): void
    {
        Notification::fake();
        Http::fake(['*' => Http::response('nope', 500)]);
        config(['complaints.slack_webhook' => 'https://hooks.slack.test/abc']);

        $this->administrator();
        $complaint = $this->complaintFrom(User::factory()->create());

        (new NotifyAdminsOfComplaint($complaint->id))->handle();

        $this->assertNotNull($complaint->fresh()->admin_notified_at);
    }

    public function test_an_already_announced_complaint_is_not_announced_twice(): void
    {
        Notification::fake();
        $this->administrator();

        $complaint = $this->complaintFrom(User::factory()->create(), ['admin_notified_at' => now()]);

        (new NotifyAdminsOfComplaint($complaint->id))->handle();

        Notification::assertNothingSent();
    }

    // --- Triage ------------------------------------------------------------

    public function test_an_administrator_can_move_a_complaint_into_review(): void
    {
        $admin = $this->administrator();
        $complaint = $this->complaintFrom(User::factory()->create());

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/complaints/{$complaint->id}", ['status' => 'in_review'])
            ->assertSuccessful()
            ->assertJsonPath('status', 'in_review');
    }

    public function test_the_triage_queue_can_be_filtered_by_status(): void
    {
        $admin = $this->administrator();
        $candidate = User::factory()->create();

        $this->complaintFrom($candidate);
        $this->complaintFrom($candidate, ['status' => 'resolved']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/complaints?status=resolved')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'resolved');
    }

    // --- The reply channel --------------------------------------------------

    public function test_an_administrator_reply_reaches_the_candidate(): void
    {
        $admin = $this->administrator();
        $candidate = User::factory()->create();
        $complaint = $this->complaintFrom($candidate);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/complaints/{$complaint->id}", [
                'status' => 'resolved',
                'response' => 'Fixed in this morning’s release — please try again.',
            ])
            ->assertSuccessful()
            ->assertJsonPath('responded_by_id', $admin->id);

        $this->app['auth']->forgetGuards();

        $this->actingAs($candidate, 'sanctum')
            ->getJson('/api/complaints')
            ->assertSuccessful()
            ->assertJsonPath('0.status', 'resolved')
            ->assertJsonPath('0.admin_response', 'Fixed in this morning’s release — please try again.')
            ->assertJsonPath('0.has_unread_response', true);
    }

    public function test_reading_a_reply_clears_the_unread_badge(): void
    {
        $candidate = $this->candidate();
        $complaint = $this->complaintFrom($candidate, [
            'admin_response' => 'Sorted.',
            'responded_at' => now(),
        ]);

        $this->postJson("/api/complaints/{$complaint->id}/seen")
            ->assertSuccessful()
            ->assertJsonPath('has_unread_response', false);

        $this->assertNotNull($complaint->fresh()->response_seen_at);
    }

    public function test_a_new_reply_makes_the_complaint_unread_again(): void
    {
        $admin = $this->administrator();
        $candidate = User::factory()->create();
        $complaint = $this->complaintFrom($candidate, [
            'admin_response' => 'Looking into it.',
            'responded_at' => now()->subDay(),
            'response_seen_at' => now()->subDay(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/complaints/{$complaint->id}", ['response' => 'Now fixed.'])
            ->assertSuccessful()
            ->assertJsonPath('has_unread_response', true);
    }

    public function test_a_candidate_only_sees_their_own_reports(): void
    {
        $stranger = User::factory()->create();
        $theirs = $this->complaintFrom($stranger);

        $this->candidate();

        $this->getJson('/api/complaints')->assertSuccessful()->assertJsonCount(0);
        $this->postJson("/api/complaints/{$theirs->id}/seen")->assertForbidden();
    }

    public function test_a_candidate_cannot_answer_their_own_complaint(): void
    {
        $candidate = $this->candidate();
        $complaint = $this->complaintFrom($candidate);

        $this->patchJson("/api/admin/complaints/{$complaint->id}", ['response' => 'All good, ignore me.'])
            ->assertForbidden();
    }
}
