<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The daily remote internship (spec §4): administrators assign preparation
 * activities and watch whether candidates actually keep up with them.
 *
 * Two tables rather than one because the same activity is assigned to hundreds
 * of candidates — the wording, the estimate and whether it is still in use
 * belong to the activity, not to each candidate's copy of it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('category', ['language', 'documents', 'culture', 'admin', 'other'])->default('other');
            // The spec's "~1 hour per day" is a budget across a day's
            // assignments, so each activity carries its own share of it.
            $table->unsignedSmallInteger('estimated_minutes')->default(30);
            // Retired rather than deleted: assignments already made still need
            // to name what they were.
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by_id')->nullable()->constrained('users')->nullOnDelete();
            // The day this is meant to be done. Engagement is measured per day,
            // so it is a date rather than a timestamp.
            $table->date('assigned_for');
            $table->enum('status', ['assigned', 'completed', 'skipped'])->default('assigned');
            $table->timestamp('completed_at')->nullable();
            // What the candidate says it actually took, which is the number
            // that tells an administrator whether the estimate is honest.
            $table->unsignedSmallInteger('minutes_spent')->nullable();
            $table->text('candidate_note')->nullable();
            $table->text('admin_feedback')->nullable();
            $table->timestamps();

            // The same activity twice on one day is a mis-click, not an intent.
            // Named explicitly: the generated name runs past MySQL's 64-char
            // identifier limit and the migration fails outright.
            $table->unique(['candidate_profile_id', 'task_id', 'assigned_for'], 'task_assignments_unique_per_day');
            $table->index(['candidate_profile_id', 'assigned_for'], 'task_assignments_candidate_day_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assignments');
        Schema::dropIfExists('tasks');
    }
};
