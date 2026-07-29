<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('language_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('language', ['fr', 'ar', 'en', 'de']);
            $table->string('audio_path');
            $table->text('transcript')->nullable();
            $table->unsignedSmallInteger('words_per_minute')->nullable();
            $table->decimal('filler_word_ratio', 5, 2)->nullable();
            $table->enum('predicted_cefr', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamp('badge_awarded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('language_assessments');
    }
};
