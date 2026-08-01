<?php

namespace Tests\Feature;

use App\Jobs\ProcessLanguageAssessment;
use App\Models\CandidateProfile;
use App\Models\LanguageAssessment;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\LanguageAssessment\WhisperTranscriber;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The pipeline from a recorded clip to a level on the dossier — in particular
 * what happens when the estimate disagrees with the candidate.
 */
class LanguageAssessmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function profile(): CandidateProfile
    {
        return CandidateProfileResolver::resolve(User::factory()->create());
    }

    /**
     * Stands in for whisper. `quality` drives the word confidences, so a test
     * can ask for speech that is clear or mumbled without owning the arithmetic.
     */
    private function fakeTranscript(int $wordCount, float $duration, float $quality = 0.9, float $gap = 0.1): void
    {
        $words = [];
        $cursor = 0.0;
        for ($i = 0; $i < $wordCount; $i++) {
            $words[] = [
                'word' => "wort{$i}",
                'probability' => $quality,
                'start' => round($cursor, 3),
                'end' => round($cursor + 0.3, 3),
            ];
            $cursor += 0.3 + $gap;
        }

        $transcriber = $this->createMock(WhisperTranscriber::class);
        $transcriber->method('transcribe')->willReturn([
            'transcript' => implode(' ', array_column($words, 'word')),
            'words' => $wordCount,
            'duration' => $duration,
            'detected_language' => 'de',
            'word_details' => $words,
        ]);

        $this->app->instance(WhisperTranscriber::class, $transcriber);
    }

    private function assess(CandidateProfile $profile, string $language = 'de'): LanguageAssessment
    {
        $assessment = $profile->languageAssessments()->create([
            'language' => $language,
            'audio_path' => 'assessments/fake.m4a',
            'status' => 'pending',
        ]);

        app()->call([new ProcessLanguageAssessment($assessment->id), 'handle']);

        return $assessment->refresh();
    }

    public function test_a_completed_assessment_records_every_metric_and_its_reasoning(): void
    {
        $this->fakeTranscript(wordCount: 140, duration: 60, quality: 0.92);

        $assessment = $this->assess($this->profile());

        $this->assertSame('completed', $assessment->status);
        $this->assertSame(140, $assessment->words_per_minute);
        $this->assertNotNull($assessment->pronunciation_score);
        $this->assertNotNull($assessment->transcript);
        $this->assertSame(60.0, $assessment->duration_seconds);
        $this->assertNotNull($assessment->badge_awarded_at);

        // The explanation is stored with the result, not recomputed later.
        $this->assertSame(
            ['speech_rate', 'vocabulary', 'clarity'],
            array_column($assessment->score_breakdown['components'], 'key'),
        );
        $this->assertNotNull($assessment->score_breakdown['pronunciation']['mean_confidence']);
    }

    public function test_a_clip_that_is_too_short_is_refused_with_a_reason(): void
    {
        $this->fakeTranscript(wordCount: 20, duration: 8);

        $assessment = $this->assess($this->profile());

        $this->assertSame('failed', $assessment->status);
        $this->assertSame('too_short', $assessment->failure_reason);
        $this->assertNull($assessment->predicted_cefr);
        // The duration is kept so the candidate can be told what went wrong.
        $this->assertSame(8.0, $assessment->duration_seconds);
    }

    public function test_a_clip_with_almost_no_speech_is_refused(): void
    {
        $this->fakeTranscript(wordCount: 4, duration: 45);

        $assessment = $this->assess($this->profile());

        $this->assertSame('failed', $assessment->status);
        $this->assertSame('unintelligible', $assessment->failure_reason);
    }

    public function test_an_unavailable_transcriber_fails_the_assessment_not_the_job(): void
    {
        $transcriber = $this->createMock(WhisperTranscriber::class);
        $transcriber->method('transcribe')->willReturn(null);
        $this->app->instance(WhisperTranscriber::class, $transcriber);

        $assessment = $this->assess($this->profile());

        $this->assertSame('failed', $assessment->status);
        $this->assertSame('transcription_unavailable', $assessment->failure_reason);
    }

    public function test_a_first_assessment_sets_the_level_when_nothing_was_declared(): void
    {
        $this->fakeTranscript(wordCount: 140, duration: 60, quality: 0.92);
        $profile = $this->profile();

        $assessment = $this->assess($profile);
        $row = $profile->languages()->where('language', 'de')->first();

        $this->assertSame($assessment->predicted_cefr, $row->cefr_level);
        $this->assertSame('ai_assessed', $row->source);
        $this->assertNull($row->self_declared_cefr);
    }

    public function test_a_weak_assessment_never_demotes_what_the_candidate_declared(): void
    {
        $profile = $this->profile();
        $profile->languages()->create([
            'language' => 'de',
            'cefr_level' => 'C1',
            'self_declared_cefr' => 'C1',
            'source' => 'self_declared',
        ]);

        // Slow, mumbled, heavily paused: the old code would have written A1
        // straight over the candidate's own claim.
        $this->fakeTranscript(wordCount: 30, duration: 60, quality: 0.3, gap: 1.5);
        $assessment = $this->assess($profile);

        $row = $profile->languages()->where('language', 'de')->first();

        $this->assertContains($assessment->predicted_cefr, ['A1', 'A2']);
        $this->assertSame('C1', $row->cefr_level);
        $this->assertSame('self_declared', $row->source);
        // Recorded rather than discarded — and flagged, because it is two
        // bands away from what the candidate said.
        $this->assertSame($assessment->predicted_cefr, $row->ai_cefr);
        $this->assertTrue($row->level_discrepancy);
    }

    public function test_a_stronger_assessment_raises_the_level(): void
    {
        $profile = $this->profile();
        $profile->languages()->create([
            'language' => 'de',
            'cefr_level' => 'A2',
            'self_declared_cefr' => 'A2',
            'source' => 'self_declared',
        ]);

        $this->fakeTranscript(wordCount: 150, duration: 60, quality: 0.95);
        $assessment = $this->assess($profile);

        $row = $profile->languages()->where('language', 'de')->first();

        $this->assertSame($assessment->predicted_cefr, $row->cefr_level);
        $this->assertSame('ai_assessed', $row->source);
        $this->assertSame('A2', $row->self_declared_cefr);
    }

    public function test_a_certificate_outranks_any_assessment(): void
    {
        $profile = $this->profile();
        $document = $profile->documents()->create([
            'type' => 'certificate', 'file_path' => 'documents/goethe.pdf', 'ocr_status' => 'completed',
        ]);
        $profile->languages()->create([
            'language' => 'de',
            'cefr_level' => 'B2',
            'self_declared_cefr' => 'B2',
            'source' => 'certified',
            'certificate_document_id' => $document->id,
        ]);

        $this->fakeTranscript(wordCount: 150, duration: 60, quality: 0.95);
        $assessment = $this->assess($profile);

        $row = $profile->languages()->where('language', 'de')->first();

        $this->assertSame('B2', $row->cefr_level);
        $this->assertSame('certified', $row->source);
        // Still recorded: a recruiter can see the estimate beside the proof.
        $this->assertSame($assessment->predicted_cefr, $row->ai_cefr);
    }

    public function test_editing_the_declared_level_does_not_erase_an_assessment(): void
    {
        $this->fakeTranscript(wordCount: 140, duration: 60, quality: 0.92);
        $user = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($user);
        $assessment = $this->assess($profile);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/candidate/languages', ['language' => 'de', 'cefr_level' => 'A1'])
            ->assertOk();

        $row = $profile->languages()->where('language', 'de')->first();

        $this->assertSame('A1', $row->self_declared_cefr);
        $this->assertSame($assessment->predicted_cefr, $row->ai_cefr);
        // The higher of the two still wins, whichever way round they arrived.
        $this->assertSame($assessment->predicted_cefr, $row->cefr_level);
    }

    public function test_the_candidate_gets_the_transcript_and_the_metrics_back(): void
    {
        $this->fakeTranscript(wordCount: 140, duration: 60, quality: 0.92);
        $user = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($user);
        $this->assess($profile);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/candidate/language-assessments')
            ->assertOk();

        $result = $response->json('0');

        $this->assertNotEmpty($result['transcript']);
        $this->assertNotNull($result['words_per_minute']);
        $this->assertNotNull($result['filler_word_ratio']);
        $this->assertNotNull($result['pronunciation_score']);
        $this->assertNotEmpty($result['score_breakdown']['components']);
    }

    public function test_a_recruiter_sees_the_assessment_metrics_on_the_dossier(): void
    {
        $this->fakeTranscript(wordCount: 140, duration: 60, quality: 0.92);
        $profile = $this->profile();
        $profile->update(['terms_consent_at' => now(), 'cndp_consent_at' => now()]);
        $this->assess($profile);

        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');

        $response = $this->actingAs($recruiter, 'sanctum')
            ->getJson("/api/recruiter/candidates/{$profile->id}")
            ->assertOk();

        $assessment = $response->json('language_assessments.0');

        $this->assertNotNull($assessment['words_per_minute']);
        $this->assertNotNull($assessment['pronunciation_score']);
        $this->assertNotNull($assessment['filler_word_ratio']);
    }
}
