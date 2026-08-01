<?php

namespace Tests\Feature;

use App\Models\CandidateProfile;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecruiterSearchTest extends TestCase
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
        // Through the relation: `user_id` is not fillable on the profile.
        return User::factory()->create()->candidateProfile()->create([
            'first_name' => 'Yassin',
            'last_name' => 'Benali',
            'profession' => 'Nurse',
            'specialization' => 'ICU',
            'years_of_experience' => 5,
            'availability_status' => 'immediate',
            // Discoverability depends on both consents being on record.
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
            ...$attributes,
        ]);
    }

    /** @return list<int> */
    private function search(array $params = []): array
    {
        return array_column(
            $this->getJson('/api/recruiter/candidates?'.http_build_query($params))->assertOk()->json('data'),
            'id',
        );
    }

    public function test_a_dossier_without_both_consents_is_not_discoverable(): void
    {
        $visible = $this->candidate();
        $this->candidate(['cndp_consent_at' => null]);

        $this->assertSame([$visible->id], $this->search());
    }

    public function test_free_text_matches_a_name_a_profession_or_a_specialisation(): void
    {
        $nurse = $this->candidate(['first_name' => 'Amina', 'last_name' => 'Tazi', 'profession' => 'Nurse']);
        $welder = $this->candidate(['first_name' => 'Omar', 'last_name' => 'Idrissi', 'profession' => 'Welder', 'specialization' => 'MIG']);

        $this->assertSame([$nurse->id], $this->search(['q' => 'amina']));
        $this->assertSame([$welder->id], $this->search(['q' => 'welder']));
        $this->assertSame([$welder->id], $this->search(['q' => 'mig']));
    }

    public function test_every_word_in_a_free_text_search_has_to_land(): void
    {
        $target = $this->candidate(['first_name' => 'Amina', 'last_name' => 'Tazi', 'profession' => 'Nurse']);
        $this->candidate(['first_name' => 'Amina', 'last_name' => 'Fassi', 'profession' => 'Welder']);

        // "amina nurse" is a narrowing, not a widening — an OR across the
        // whole phrase would have returned both.
        $this->assertSame([$target->id], $this->search(['q' => 'amina nurse']));
    }

    public function test_the_minimum_cefr_filter_includes_every_higher_band(): void
    {
        $b1 = $this->candidate();
        $b1->languages()->create(['language' => 'de', 'cefr_level' => 'B1', 'source' => 'self_declared']);

        $c1 = $this->candidate();
        $c1->languages()->create(['language' => 'de', 'cefr_level' => 'C1', 'source' => 'self_declared']);

        $a2 = $this->candidate();
        $a2->languages()->create(['language' => 'de', 'cefr_level' => 'A2', 'source' => 'self_declared']);

        $found = $this->search(['language' => 'de', 'cefr_level' => 'B1']);

        sort($found);
        $this->assertSame([$b1->id, $c1->id], $found);
    }

    public function test_the_language_filter_does_not_match_a_level_held_in_another_language(): void
    {
        $candidate = $this->candidate();
        $candidate->languages()->create(['language' => 'fr', 'cefr_level' => 'C2', 'source' => 'self_declared']);
        $candidate->languages()->create(['language' => 'de', 'cefr_level' => 'A1', 'source' => 'self_declared']);

        $this->assertSame([], $this->search(['language' => 'de', 'cefr_level' => 'B2']));
    }

    public function test_education_level_filters_on_what_the_candidate_studied(): void
    {
        $graduate = $this->candidate();
        $graduate->educations()->create(['level' => 'bachelor', 'field' => 'Nursing']);

        $trained = $this->candidate();
        $trained->educations()->create(['level' => 'vocational', 'field' => 'Welding']);

        $this->assertSame([$graduate->id], $this->search(['education_level' => 'bachelor']));
    }

    public function test_the_toggles_narrow_to_video_assessment_and_submitted_dossiers(): void
    {
        $complete = $this->candidate([
            'presentation_video_path' => 'videos/a.mp4',
            'submitted_at' => now(),
        ]);
        $complete->languageAssessments()->create([
            'language' => 'de', 'audio_path' => 'a.m4a', 'status' => 'completed', 'predicted_cefr' => 'B2',
        ]);

        $bare = $this->candidate();
        // A failed assessment is not a verified one.
        $bare->languageAssessments()->create([
            'language' => 'de', 'audio_path' => 'b.m4a', 'status' => 'failed',
        ]);

        $this->assertSame([$complete->id], $this->search(['has_video' => 1]));
        $this->assertSame([$complete->id], $this->search(['submitted_only' => 1]));
        $this->assertSame([$complete->id], $this->search(['verified_assessment' => 1]));
        $this->assertCount(2, $this->search(['has_video' => 0]));
    }

    public function test_a_verified_assessment_in_another_language_does_not_count(): void
    {
        $candidate = $this->candidate();
        $candidate->languageAssessments()->create([
            'language' => 'fr', 'audio_path' => 'a.m4a', 'status' => 'completed', 'predicted_cefr' => 'C1',
        ]);
        $candidate->languages()->create(['language' => 'de', 'cefr_level' => 'B2', 'source' => 'self_declared']);
        $candidate->languages()->create(['language' => 'fr', 'cefr_level' => 'C1', 'source' => 'ai_assessed']);

        // Speaks both, but only French has been through an assessment — a
        // German vacancy is not served by a French recording.
        $this->assertSame([], $this->search(['language' => 'de', 'verified_assessment' => 1]));
        $this->assertSame([$candidate->id], $this->search(['language' => 'fr', 'verified_assessment' => 1]));
    }

    public function test_results_can_be_sorted_by_experience_with_unknowns_last(): void
    {
        $junior = $this->candidate(['years_of_experience' => 2]);
        $senior = $this->candidate(['years_of_experience' => 12]);
        $unknown = $this->candidate(['years_of_experience' => null]);

        $this->assertSame([$senior->id, $junior->id, $unknown->id], $this->search(['sort' => 'experience']));
    }

    public function test_results_can_be_sorted_by_name(): void
    {
        $z = $this->candidate(['first_name' => 'Zineb']);
        $a = $this->candidate(['first_name' => 'Adam']);

        $this->assertSame([$a->id, $z->id], $this->search(['sort' => 'name']));
    }

    public function test_results_are_paginated_and_the_second_page_is_reachable(): void
    {
        foreach (range(1, 7) as $i) {
            $this->candidate(['first_name' => "Candidate {$i}"]);
        }

        $first = $this->getJson('/api/recruiter/candidates?per_page=5')->assertOk();
        $this->assertCount(5, $first->json('data'));
        $this->assertSame(7, $first->json('total'));
        $this->assertSame(2, $first->json('last_page'));

        // The 6th and 7th candidates used to be unreachable: the API paginated
        // and nothing ever asked for page two.
        $second = $this->getJson('/api/recruiter/candidates?per_page=5&page=2')->assertOk();
        $this->assertCount(2, $second->json('data'));
    }

    public function test_a_result_carries_the_marks_a_recruiter_needs_to_triage_it(): void
    {
        $candidate = $this->candidate(['presentation_video_path' => 'videos/a.mp4']);
        $this->putJson("/api/recruiter/candidates/{$candidate->id}/shortlist", ['stage' => 'contacted']);

        $row = $this->getJson('/api/recruiter/candidates')->assertOk()->json('data.0');

        $this->assertTrue($row['has_video']);
        $this->assertTrue($row['shortlisted']);
        $this->assertSame('contacted', $row['shortlist_stage']);
        $this->assertFalse($row['contact_revealed']);
    }

    public function test_shortlist_marks_are_per_recruiter(): void
    {
        $candidate = $this->candidate();
        $this->putJson("/api/recruiter/candidates/{$candidate->id}/shortlist", ['stage' => 'interviewing']);

        $other = User::factory()->create();
        $other->assignRole('Company');

        $row = $this->actingAs($other, 'sanctum')
            ->getJson('/api/recruiter/candidates')->assertOk()->json('data.0');

        $this->assertFalse($row['shortlisted']);
        $this->assertNull($row['shortlist_stage']);
    }

    public function test_the_dossier_hides_scanner_state_and_marks_attested_certificates(): void
    {
        $candidate = $this->candidate();
        $certificate = $candidate->documents()->create([
            'type' => 'certificate', 'file_path' => 'documents/goethe.pdf', 'ocr_status' => 'failed',
        ]);
        $candidate->documents()->create([
            'type' => 'cv', 'file_path' => 'documents/cv.pdf', 'ocr_status' => 'completed',
        ]);
        $candidate->languages()->create([
            'language' => 'de',
            'cefr_level' => 'B2',
            'source' => 'certified',
            'certificate_document_id' => $certificate->id,
        ]);

        $documents = $this->getJson("/api/recruiter/candidates/{$candidate->id}")->assertOk()->json('documents');

        // "failed" is a verdict on our scanner, not on the candidate.
        $this->assertArrayNotHasKey('ocr_status', $documents[0]);
        $this->assertArrayNotHasKey('extraction', $documents[0]);

        $byType = collect($documents)->keyBy('type');
        $this->assertTrue($byType['certificate']['verified']);
        $this->assertFalse($byType['cv']['verified']);
        $this->assertNotNull($byType['cv']['url']);
    }

    public function test_a_candidate_cannot_use_the_recruiter_search(): void
    {
        $candidate = User::factory()->create();
        $candidate->assignRole('User');

        $this->actingAs($candidate, 'sanctum')->getJson('/api/recruiter/candidates')->assertForbidden();
    }
}
