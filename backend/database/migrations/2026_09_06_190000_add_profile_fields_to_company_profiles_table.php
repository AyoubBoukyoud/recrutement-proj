<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The recruiter-facing "Mon entreprise" screen needs fields
 * `company_profiles` never had — nothing here was collected at signup, and
 * until now no route let a recruiter edit their own profile at all (only an
 * administrator could, and only status/verification).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->text('description')->nullable()->after('sector');
            $table->string('address')->nullable()->after('city');
            $table->string('country')->nullable()->after('address');
            $table->unsignedSmallInteger('founded_year')->nullable()->after('employees_count');
            $table->string('company_type')->nullable()->after('founded_year');
            $table->string('logo_path')->nullable()->after('company_type');
            // linkedin/facebook/twitter/instagram, all optional — kept as one
            // JSON column rather than four nullable strings since none of them
            // is ever queried on, only displayed.
            $table->json('social_links')->nullable()->after('logo_path');
        });
    }

    public function down(): void
    {
        Schema::table('company_profiles', function (Blueprint $table) {
            $table->dropColumn(['description', 'address', 'country', 'founded_year', 'company_type', 'logo_path', 'social_links']);
        });
    }
};
