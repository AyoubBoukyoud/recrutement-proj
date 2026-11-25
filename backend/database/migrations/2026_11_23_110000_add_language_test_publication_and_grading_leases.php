<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('language_tests', function (Blueprint $table) {
            $table->timestamp('published_at')->nullable();
        });
        Schema::table('language_test_responses', function (Blueprint $table) {
            $table->uuid('grading_token')->nullable();
            $table->timestamp('grading_due_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('language_test_responses', fn (Blueprint $table) => $table->dropColumn(['grading_token', 'grading_due_at']));
        Schema::table('language_tests', fn (Blueprint $table) => $table->dropColumn('published_at'));
    }
};
