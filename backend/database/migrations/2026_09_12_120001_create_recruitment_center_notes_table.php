<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The call log itself. Append-only like admin_activity_logs — a note is a
 * record of what was said on a given day, not a document anyone edits
 * afterwards — so there is no updated_at to track.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruitment_center_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_center_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['recruitment_center_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruitment_center_notes');
    }
};
