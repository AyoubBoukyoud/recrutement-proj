<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Mirrors candidate_languages: one row per declared skill, with a level and years. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $table->string('skill');
            $table->enum('level', ['debutant', 'intermediaire', 'avance', 'expert'])->default('intermediaire');
            $table->unsignedTinyInteger('years_of_experience')->nullable();
            $table->timestamps();

            $table->unique(['candidate_profile_id', 'skill']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_skills');
    }
};
