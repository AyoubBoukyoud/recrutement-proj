<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            // The moment the candidate declared the dossier finished. Distinct
            // from "complete": a dossier can satisfy every required section and
            // still be a draft the candidate is fiddling with.
            $table->timestamp('submitted_at')->nullable()->after('presentation_video_path');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn('submitted_at');
        });
    }
};
