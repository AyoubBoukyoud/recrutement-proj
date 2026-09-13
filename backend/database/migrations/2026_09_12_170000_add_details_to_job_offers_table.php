<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_offers', function (Blueprint $table) {
            $table->text('responsibilities')->nullable();
            $table->text('requirements')->nullable();
            $table->text('benefits')->nullable();
            $table->string('workplace_type')->nullable();
            $table->unsignedTinyInteger('weekly_hours')->nullable();
            $table->string('experience_level')->nullable();
            $table->string('education_level')->nullable();
            $table->date('start_date')->nullable();
            $table->date('application_deadline')->nullable();
            $table->unsignedSmallInteger('positions_count')->default(1);
        });
    }

    public function down(): void
    {
        Schema::table('job_offers', function (Blueprint $table) {
            $table->dropColumn([
                'responsibilities',
                'requirements',
                'benefits',
                'workplace_type',
                'weekly_hours',
                'experience_level',
                'education_level',
                'start_date',
                'application_deadline',
                'positions_count',
            ]);
        });
    }
};
