<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A scheduled interview against one application — distinct from
 * `job_applications.status = 'interview'`, which only says a candidate has
 * reached that stage, not when, where, or by which mode. One application can
 * have several interviews over its lifetime (reschedules keep history rather
 * than overwriting).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            // Denormalised from the offer at scheduling time so a recruiter
            // switching companies (were that possible) or an offer edit later
            // doesn't rewrite history — same reasoning as `referral_registrations`.
            $table->foreignId('scheduled_by_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('type', ['in_person', 'video', 'phone'])->default('video');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['scheduled', 'confirmed', 'rescheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamps();
        });

        Schema::create('interview_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('overall');
            $table->unsignedTinyInteger('technical');
            $table->unsignedTinyInteger('communication');
            $table->unsignedTinyInteger('motivation');
            $table->unsignedTinyInteger('culture_fit');
            $table->enum('recommendation', ['strong_yes', 'yes', 'no', 'strong_no'])->default('yes');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_feedback');
        Schema::dropIfExists('interviews');
    }
};
