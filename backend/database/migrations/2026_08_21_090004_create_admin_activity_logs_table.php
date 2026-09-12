<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The only durable "who did what, when" record anywhere in the app before
 * this was a single Log::info() call in RecruiterShortlistController — a log
 * line, not a queryable row. This table backs the admin "Historique" tabs
 * with real, append-only events. Polymorphic by hand (subject_type/id)
 * rather than a package: the only consumer is the admin surface, and it
 * only ever needs to list events for one subject at a time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            $table->string('action');
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_activity_logs');
    }
};
