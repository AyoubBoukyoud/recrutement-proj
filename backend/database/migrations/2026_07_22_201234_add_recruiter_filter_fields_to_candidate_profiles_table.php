<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->string('profession')->nullable()->after('last_name');
            $table->string('specialization')->nullable()->after('profession');
            $table->unsignedTinyInteger('years_of_experience')->nullable()->after('specialization');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn(['profession', 'specialization', 'years_of_experience']);
        });
    }
};
