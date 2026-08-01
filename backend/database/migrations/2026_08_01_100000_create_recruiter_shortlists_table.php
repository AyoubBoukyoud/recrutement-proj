<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_shortlists', function (Blueprint $table) {
            $table->id();
            // The recruiter. Their own list — two companies looking at the same
            // candidate keep separate notes and separate stages.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            // Where this candidate has got to with this recruiter. The business
            // model is commission on placement, so the pipeline has to be
            // recorded somewhere for anyone to know a placement happened.
            $table->enum('stage', ['saved', 'contacted', 'interviewing', 'placed', 'rejected'])->default('saved');
            $table->text('notes')->nullable();
            // When the recruiter asked for the phone number. The dossier does
            // not carry contact details until this is stamped: the platform
            // collects explicit CNDP consent, so who reached a candidate and
            // when has to be answerable.
            $table->timestamp('contact_revealed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'candidate_profile_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_shortlists');
    }
};
