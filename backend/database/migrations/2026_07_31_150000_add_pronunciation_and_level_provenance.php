<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('language_assessments', function (Blueprint $table) {
            // How clearly a multilingual ASR model recognised the speech, 0-100.
            $table->unsignedTinyInteger('pronunciation_score')->nullable()->after('filler_word_ratio');
            // Every component that fed the CEFR estimate, so the candidate can
            // be told how the level was reached instead of just being handed it.
            $table->json('score_breakdown')->nullable()->after('predicted_cefr');
            $table->decimal('duration_seconds', 6, 2)->nullable()->after('score_breakdown');
            // Why a failed assessment failed: too_short, unintelligible,
            // transcription_unavailable. "Failed" alone is not actionable.
            $table->string('failure_reason')->nullable()->after('status');
        });

        // decimal(5,2) truncated every ratio the scorer produces — it rounds to
        // 3 decimals, so anything under 0.005 persisted as 0.00. Ratios are
        // small by nature; 4 decimals is the resolution the metric needs.
        Schema::table('language_assessments', function (Blueprint $table) {
            $table->decimal('filler_word_ratio', 6, 4)->nullable()->change();
        });

        Schema::table('candidate_languages', function (Blueprint $table) {
            // `cefr_level` is the effective level a recruiter sees. These two
            // keep the evidence behind it separable, so an AI estimate can no
            // longer silently erase what the candidate said about themselves.
            $table->enum('self_declared_cefr', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable()->after('cefr_level');
            $table->enum('ai_cefr', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable()->after('self_declared_cefr');
            $table->timestamp('ai_assessed_at')->nullable()->after('ai_cefr');
        });

        // Existing rows: whatever is on file was self-declared unless a
        // certificate backs it, which is exactly what `source` already records.
        DB::table('candidate_languages')
            ->where('source', 'self_declared')
            ->update(['self_declared_cefr' => DB::raw('cefr_level')]);
    }

    public function down(): void
    {
        Schema::table('language_assessments', function (Blueprint $table) {
            $table->dropColumn(['pronunciation_score', 'score_breakdown', 'duration_seconds', 'failure_reason']);
            $table->decimal('filler_word_ratio', 5, 2)->nullable()->change();
        });

        Schema::table('candidate_languages', function (Blueprint $table) {
            $table->dropColumn(['self_declared_cefr', 'ai_cefr', 'ai_assessed_at']);
        });
    }
};
