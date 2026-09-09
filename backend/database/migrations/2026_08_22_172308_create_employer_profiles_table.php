<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The billing entity behind a `Company`-role user. Today that role is a bare
 * `users` row with no legal name, ICE, or billing address — none of which
 * B2B invoicing can work without. One employer profile per user for now;
 * if a single company ever needs several recruiter logins sharing one
 * billing identity, this is the table that would grow a `company_id` and
 * become many-to-one instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('legal_name');
            // Identifiant Commun de l'Entreprise — the Moroccan business
            // registry number CMI's onboarding and any real invoice will ask for.
            $table->string('ice')->nullable();
            $table->text('billing_address')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employer_profiles');
    }
};
