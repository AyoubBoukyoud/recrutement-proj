<?php

use App\Models\CandidateLanguage;
use App\Models\LanguageTest;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('language_tests')->where('status', 'validated')->whereNull('published_at')
            ->update(['published_at' => DB::raw('COALESCE(reviewed_at, completed_at, updated_at)')]);

        // Remove the former approval gate for sittings already waiting at deployment.
        LanguageTest::where('status', 'awaiting_review')->orderBy('id')->each(function (LanguageTest $test) {
            DB::transaction(function () use ($test) {
                $scores = $test->skill_scores ?? [];
                $complete = $test->ai_cefr !== null
                    && count(array_filter(array_intersect_key($scores, array_flip(['reading', 'listening', 'writing', 'speaking'])), fn ($s) => $s !== null)) === 4
                    && ! $test->responses()->where('status', 'failed')->exists();
                $test->update([
                    'status' => $complete ? 'validated' : 'failed',
                    'final_cefr' => $complete ? $test->ai_cefr : null,
                    'published_at' => $complete ? now() : null,
                    'needs_attention' => $test->needs_attention || ! $complete,
                ]);
                if ($complete) {
                    app(LanguageLevelReconciler::class)->applyValidatedTest($test);
                }
            });
        });

        CandidateLanguage::whereNotNull('tested_cefr')->each(function (CandidateLanguage $row) {
            app(LanguageLevelReconciler::class)->refreshCertificateConfirmation($row);
            $row->save();
        });
    }

    public function down(): void
    {
        // Published results are retained; rolling back cannot invent prior approvals.
    }
};
