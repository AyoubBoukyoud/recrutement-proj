<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Applications already delivered to an employer are retained as an
 * unattributable contractual trace after a candidate account is purged. The
 * profile foreign key therefore becomes nullable and is cleared on deletion.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropForeign(['candidate_profile_id']);
            $table->foreignId('candidate_profile_id')->nullable()->change();
            $table->foreign('candidate_profile_id')->references('id')->on('candidate_profiles')->nullOnDelete();
            $table->timestamp('anonymized_at')->nullable()->after('withdrawn_at');
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropForeign(['candidate_profile_id']);
            $table->dropColumn('anonymized_at');
            $table->foreignId('candidate_profile_id')->nullable(false)->change();
            $table->foreign('candidate_profile_id')->references('id')->on('candidate_profiles')->cascadeOnDelete();
        });
    }
};
