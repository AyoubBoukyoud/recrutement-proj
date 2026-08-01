<?php

namespace Tests\Feature;

use App\Models\CandidateProfile;
use App\Models\RecruiterShortlist;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The actions that turn a dossier into a next step. Without them the recruiter
 * side of the product ends at "here is someone you cannot contact".
 */
class RecruiterShortlistTest extends TestCase
{
    use RefreshDatabase;

    private User $recruiter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->recruiter = User::factory()->create();
        $this->recruiter->assignRole('Company');
        $this->actingAs($this->recruiter, 'sanctum');
    }

    /** @param  array<string, mixed>  $attributes */
    private function candidate(array $attributes = []): CandidateProfile
    {
        $user = User::factory()->create(['phone' => '+2126'.fake()->unique()->numerify('########')]);

        return $user->candidateProfile()->create([
            'first_name' => 'Yassin',
            'last_name' => 'Benali',
            'profession' => 'Nurse',
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
            ...$attributes,
        ]);
    }

    public function test_a_recruiter_saves_a_candidate_and_keeps_notes_on_them(): void
    {
        $candidate = $this->candidate();

        $this->putJson("/api/recruiter/candidates/{$candidate->id}/shortlist", [
            'stage' => 'contacted',
            'notes' => 'Spoke Tuesday — available from October.',
        ])->assertCreated()->assertJsonPath('stage', 'contacted');

        // A second write updates rather than duplicating.
        $this->putJson("/api/recruiter/candidates/{$candidate->id}/shortlist", ['stage' => 'interviewing'])
            ->assertOk()
            ->assertJsonPath('stage', 'interviewing')
            ->assertJsonPath('notes', 'Spoke Tuesday — available from October.');

        $this->assertSame(1, RecruiterShortlist::count());
    }

    public function test_the_shortlist_lists_only_the_recruiters_own_candidates(): void
    {
        $mine = $this->candidate(['first_name' => 'Mine']);
        $theirs = $this->candidate(['first_name' => 'Theirs']);

        $this->putJson("/api/recruiter/candidates/{$mine->id}/shortlist", ['stage' => 'saved']);

        $other = User::factory()->create();
        $other->assignRole('Company');
        $this->actingAs($other, 'sanctum')
            ->putJson("/api/recruiter/candidates/{$theirs->id}/shortlist", ['stage' => 'saved']);

        $rows = $this->actingAs($this->recruiter, 'sanctum')
            ->getJson('/api/recruiter/shortlist')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame($mine->id, $rows[0]['candidate_profile_id']);
        $this->assertSame('Mine', $rows[0]['candidate']['first_name']);
    }

    public function test_removing_a_candidate_takes_the_notes_with_it(): void
    {
        $candidate = $this->candidate();
        $this->putJson("/api/recruiter/candidates/{$candidate->id}/shortlist", ['notes' => 'Not a fit.']);

        $this->deleteJson("/api/recruiter/candidates/{$candidate->id}/shortlist")->assertOk();

        $this->assertSame(0, RecruiterShortlist::count());
    }

    public function test_the_dossier_carries_no_contact_details_until_they_are_asked_for(): void
    {
        $candidate = $this->candidate();

        $this->getJson("/api/recruiter/candidates/{$candidate->id}")
            ->assertOk()
            ->assertJsonPath('contact', null)
            // …and the phone number is not hiding elsewhere in the payload.
            ->assertJsonMissing(['phone' => $candidate->user->phone]);
    }

    public function test_revealing_contact_details_records_who_took_them(): void
    {
        $candidate = $this->candidate();

        $this->postJson("/api/recruiter/candidates/{$candidate->id}/contact")
            ->assertOk()
            ->assertJsonPath('contact.phone', $candidate->user->phone);

        $entry = RecruiterShortlist::first();
        $this->assertSame($this->recruiter->id, $entry->user_id);
        $this->assertNotNull($entry->contact_revealed_at);
        // Taking someone's number is the moment they enter a pipeline.
        $this->assertSame('saved', $entry->stage);

        // Now the dossier carries them for this recruiter.
        $this->getJson("/api/recruiter/candidates/{$candidate->id}")
            ->assertOk()
            ->assertJsonPath('contact.phone', $candidate->user->phone);
    }

    public function test_reopening_a_dossier_does_not_restamp_the_disclosure(): void
    {
        $candidate = $this->candidate();

        $first = $this->postJson("/api/recruiter/candidates/{$candidate->id}/contact")->json('contact.revealed_at');
        $this->travel(2)->days();
        $second = $this->postJson("/api/recruiter/candidates/{$candidate->id}/contact")->json('contact.revealed_at');

        $this->assertSame($first, $second);
    }

    public function test_one_recruiter_taking_contact_details_does_not_release_them_to_another(): void
    {
        $candidate = $this->candidate();
        $this->postJson("/api/recruiter/candidates/{$candidate->id}/contact")->assertOk();

        $other = User::factory()->create();
        $other->assignRole('Company');

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/recruiter/candidates/{$candidate->id}")
            ->assertOk()
            ->assertJsonPath('contact', null);
    }

    public function test_a_dossier_that_is_not_discoverable_cannot_be_shortlisted_or_unlocked(): void
    {
        $hidden = $this->candidate(['cndp_consent_at' => null]);

        $this->putJson("/api/recruiter/candidates/{$hidden->id}/shortlist", ['stage' => 'saved'])->assertNotFound();
        $this->postJson("/api/recruiter/candidates/{$hidden->id}/contact")->assertNotFound();
        $this->assertSame(0, RecruiterShortlist::count());
    }

    public function test_the_shortlist_exports_as_a_csv_that_respects_the_contact_gate(): void
    {
        $contacted = $this->candidate(['first_name' => 'Amina', 'last_name' => 'Tazi']);
        $contacted->languages()->create(['language' => 'de', 'cefr_level' => 'B2', 'source' => 'self_declared']);
        $saved = $this->candidate(['first_name' => 'Omar', 'last_name' => 'Idrissi']);

        $this->postJson("/api/recruiter/candidates/{$contacted->id}/contact");
        $this->putJson("/api/recruiter/candidates/{$contacted->id}/shortlist", [
            'stage' => 'interviewing',
            'notes' => "Line one\nline two",
        ]);
        $this->putJson("/api/recruiter/candidates/{$saved->id}/shortlist", ['stage' => 'saved']);

        $response = $this->get('/api/recruiter/shortlist/export')->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $csv = $response->streamedContent();

        $this->assertStringContainsString('Amina Tazi', $csv);
        $this->assertStringContainsString('DE B2', $csv);
        $this->assertStringContainsString($contacted->user->phone, $csv);
        // Never taken, so the column stays empty rather than leaking.
        $this->assertStringNotContainsString($saved->user->phone, $csv);
        // Notes are flattened; a newline mid-cell breaks half the tools that
        // open these files.
        $this->assertStringContainsString('Line one line two', $csv);
    }

    public function test_a_candidate_cannot_shortlist_anyone(): void
    {
        $candidate = $this->candidate();
        $intruder = User::factory()->create();
        $intruder->assignRole('User');

        $this->actingAs($intruder, 'sanctum')
            ->putJson("/api/recruiter/candidates/{$candidate->id}/shortlist", ['stage' => 'saved'])
            ->assertForbidden();

        $this->actingAs($intruder, 'sanctum')
            ->postJson("/api/recruiter/candidates/{$candidate->id}/contact")
            ->assertForbidden();
    }
}
