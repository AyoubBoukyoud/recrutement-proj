<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('language', ['fr', 'ar', 'en', 'de']);
            $table->enum('cefr_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable();
            $table->enum('source', ['self_declared', 'certified', 'ai_assessed'])->default('self_declared');
            // References documents.id; FK omitted here since the documents table
            // is created in a later migration.
            $table->unsignedBigInteger('certificate_document_id')->nullable();
            $table->timestamps();

            $table->unique(['candidate_profile_id', 'language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_languages');
    }
};
