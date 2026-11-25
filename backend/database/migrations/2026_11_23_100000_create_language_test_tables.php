<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The AMUD level exam: a bank of items per level, an exam sitting per
 * candidate, one response per item, and the exam's verdict carried onto
 * `candidate_languages` next to the certificate it confirms (or doesn't).
 */
return new class extends Migration
{
    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    public function up(): void
    {
        Schema::create('language_test_items', function (Blueprint $table) {
            $table->id();
            $table->string('language', 2);
            $table->enum('cefr_level', self::LEVELS);
            $table->enum('skill', ['reading', 'listening', 'read_aloud', 'writing', 'oral']);
            $table->string('task_type', 40);
            $table->string('sector', 30)->default('general');
            $table->string('title')->nullable();
            // What the candidate is shown (stimulus, questions, instructions).
            $table->json('content');
            // Never sent to a candidate: correct options / accepted field values.
            $table->json('answer_key')->nullable();
            $table->string('audio_path')->nullable();
            $table->enum('status', ['draft', 'approved', 'retired'])->default('draft');
            $table->string('generated_by', 80)->nullable();
            $table->foreignId('reviewed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index(['language', 'cefr_level', 'skill', 'task_type', 'status'], 'lt_items_pick_index');
        });

        Schema::create('language_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $table->string('language', 2);
            $table->enum('exam_level', self::LEVELS);
            $table->enum('level_source', ['certificate', 'declared', 'chosen']);
            // The blueprint as it was when the exam started, so tuning the
            // config later never rewrites how a past exam was scored.
            $table->json('blueprint');
            $table->enum('status', ['in_progress', 'scoring', 'awaiting_review', 'validated', 'abandoned', 'failed'])->default('in_progress');
            $table->string('current_section', 20)->nullable();
            // Per section: status (pending|active|done), started_at, deadline_at, completed_at.
            $table->json('sections')->nullable();
            $table->json('skill_scores')->nullable();
            $table->json('skill_results')->nullable();
            $table->string('outcome', 40)->nullable();
            $table->enum('provisional_cefr', self::LEVELS)->nullable();
            $table->enum('ai_cefr', self::LEVELS)->nullable();
            $table->enum('final_cefr', self::LEVELS)->nullable();
            $table->json('summary')->nullable();
            $table->json('integrity')->nullable();
            $table->boolean('needs_attention')->default(false);
            $table->foreignId('reviewed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'needs_attention']);
        });

        Schema::create('language_test_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('language_test_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('language_test_items')->restrictOnDelete();
            $table->string('section', 20);
            $table->unsignedSmallInteger('position')->default(0);
            // Listening: how many times the clip has been handed out.
            $table->unsignedTinyInteger('plays')->default(0);
            // Live oral: when the situation was shown. The recording must land within
            // prep + answer time of this moment, so the task cannot be rehearsed.
            $table->timestamp('revealed_at')->nullable();
            $table->json('answer')->nullable();
            $table->string('audio_path')->nullable();
            $table->string('video_path')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->unsignedTinyInteger('score')->nullable();
            $table->unsignedInteger('time_ms')->nullable();
            $table->json('evaluation')->nullable();
            $table->enum('status', ['pending', 'answered', 'grading', 'graded', 'failed'])->default('pending');
            $table->timestamps();

            $table->unique(['language_test_id', 'item_id']);
        });

        Schema::table('candidate_languages', function (Blueprint $table) {
            $table->enum('tested_cefr', self::LEVELS)->nullable()->after('ai_assessed_at');
            $table->timestamp('tested_at')->nullable()->after('tested_cefr');
            $table->foreignId('language_test_id')->nullable()->after('tested_at')->constrained()->nullOnDelete();
            // null = never tested against the certificate; false = the exam did not confirm it.
            $table->boolean('certificate_confirmed')->nullable()->after('language_test_id');
        });

        Schema::table('candidate_languages', function (Blueprint $table) {
            $table->enum('source', ['self_declared', 'certified', 'ai_assessed', 'amud_tested'])->default('self_declared')->change();
        });
    }

    public function down(): void
    {
        Schema::table('candidate_languages', function (Blueprint $table) {
            $table->enum('source', ['self_declared', 'certified', 'ai_assessed'])->default('self_declared')->change();
        });

        Schema::table('candidate_languages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('language_test_id');
            $table->dropColumn(['tested_cefr', 'tested_at', 'certificate_confirmed']);
        });

        Schema::dropIfExists('language_test_responses');
        Schema::dropIfExists('language_tests');
        Schema::dropIfExists('language_test_items');
    }
};
