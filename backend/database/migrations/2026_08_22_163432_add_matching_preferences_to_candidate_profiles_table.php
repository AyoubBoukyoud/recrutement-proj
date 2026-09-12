<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A single JSON blob rather than a new table: the candidate app's own
 * `/matching-preferences` screen is the only reader and writer today, and
 * there is no recruiter-search filter or matching engine consuming this yet
 * to justify normalising it further.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->json('matching_preferences')->nullable()->after('availability_status');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn('matching_preferences');
        });
    }
};
