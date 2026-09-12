<?php

namespace App\Jobs;

use App\Models\LanguageAssessment;
use App\Services\LanguageAssessment\CefrScorer;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use App\Services\LanguageAssessment\PronunciationAnalyzer;
use App\Services\LanguageAssessment\WhisperTranscriber;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessLanguageAssessment implements ShouldQueue
{
    use Queueable;

    /**
     * Below this there is not enough speech to place anyone. The prompt asks
     * for a minute; the recorder enforces the same floor before it will let a
     * clip be submitted, and this is the server-side half of that.
     */
    public const MIN_SECONDS = 20;

    /** Nothing intelligible came back — scoring silence would invent a level. */
    private const MIN_WORDS = 15;

    public function __construct(private readonly int $assessmentId) {}

    public function handle(
        WhisperTranscriber $transcriber,
        CefrScorer $scorer,
        PronunciationAnalyzer $pronunciationAnalyzer,
        LanguageLevelReconciler $reconciler,
    ): void {
        $assessment = LanguageAssessment::find($this->assessmentId);
        if (! $assessment) {
            return;
        }

        $assessment->update(['status' => 'processing', 'failure_reason' => null]);

        $absolutePath = Storage::disk('local')->path($assessment->audio_path);

        // The language being tested is known, so Whisper is told rather than
        // left to guess — auto-detect misfires on short, accented clips.
        $result = $transcriber->transcribe($absolutePath, $assessment->language);

        if (! $result) {
            $this->fail($assessment, 'transcription_unavailable');

            return;
        }

        if ($result['duration'] < self::MIN_SECONDS) {
            $this->fail($assessment, 'too_short', $result);

            return;
        }

        if ($result['words'] < self::MIN_WORDS) {
            $this->fail($assessment, 'unintelligible', $result);

            return;
        }

        $pronunciation = $pronunciationAnalyzer->analyze($result['word_details'], $result['duration']);

        $score = $scorer->score(
            $assessment->language,
            $result['transcript'],
            $result['words'],
            $result['duration'],
            $pronunciation,
        );

        $assessment->update([
            'transcript' => $result['transcript'],
            'duration_seconds' => round($result['duration'], 2),
            'words_per_minute' => $score['words_per_minute'],
            'filler_word_ratio' => $score['filler_word_ratio'],
            'pronunciation_score' => $pronunciation['score'] ?? null,
            'predicted_cefr' => $score['cefr'],
            'score_breakdown' => [
                ...$score['breakdown'],
                'pronunciation' => $pronunciation,
            ],
            'status' => 'completed',
            'badge_awarded_at' => now(),
        ]);

        // Not a blind overwrite any more: a certificate is never demoted, and a
        // self-declared level is never lowered on the strength of one recording.
        $reconciler->applyAssessment($assessment->candidateProfile, $assessment->language, $score['cefr']);
    }

    /** @param  array<string, mixed>|null  $result */
    private function fail(LanguageAssessment $assessment, string $reason, ?array $result = null): void
    {
        $assessment->update([
            'status' => 'failed',
            'failure_reason' => $reason,
            // Kept even on failure: "you spoke for 8 seconds" is what makes a
            // too-short result understandable rather than mysterious.
            'duration_seconds' => isset($result['duration']) ? round($result['duration'], 2) : null,
            'transcript' => $result['transcript'] ?? null,
        ]);
    }
}
