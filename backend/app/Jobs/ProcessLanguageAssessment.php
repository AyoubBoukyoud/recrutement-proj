<?php

namespace App\Jobs;

use App\Models\LanguageAssessment;
use App\Services\LanguageAssessment\CefrScorer;
use App\Services\LanguageAssessment\WhisperTranscriber;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessLanguageAssessment implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly int $assessmentId) {}

    public function handle(WhisperTranscriber $transcriber, CefrScorer $scorer): void
    {
        $assessment = LanguageAssessment::find($this->assessmentId);
        if (! $assessment) {
            return;
        }

        $assessment->update(['status' => 'processing']);

        $absolutePath = Storage::disk('public')->path($assessment->audio_path);
        $result = $transcriber->transcribe($absolutePath);

        if (! $result) {
            $assessment->update(['status' => 'failed']);

            return;
        }

        $score = $scorer->score($assessment->language, $result['transcript'], $result['words'], $result['duration']);

        $assessment->update([
            'transcript' => $result['transcript'],
            'words_per_minute' => $score['words_per_minute'],
            'filler_word_ratio' => $score['filler_word_ratio'],
            'predicted_cefr' => $score['cefr'],
            'status' => 'completed',
            'badge_awarded_at' => now(),
        ]);

        $assessment->candidateProfile->languages()->updateOrCreate(
            ['language' => $assessment->language],
            ['cefr_level' => $score['cefr'], 'source' => 'ai_assessed'],
        );
    }
}
