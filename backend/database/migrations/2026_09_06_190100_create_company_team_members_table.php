<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A roster of the recruiter's own colleagues — "who to loop in", not a
 * second way to sign in. `company_profiles.user_id` stays unique (one
 * account owns the platform login for a company); a team member here is a
 * contact record the owner keeps, not a `User` row, so this does not touch
 * authentication at all.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('position')->nullable();
            $table->enum('role', ['admin', 'recruiter', 'assistant'])->default('recruiter');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_team_members');
    }
};
