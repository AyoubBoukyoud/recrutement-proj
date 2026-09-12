<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Conversations are scoped to a submitted application: this keeps candidate
 * and recruiter messaging tied to a real hiring relationship and prevents a
 * user from opening arbitrary platform-wide chats.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recruiter_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_application_id')->nullable()->unique()->constrained('job_applications')->nullOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['candidate_user_id', 'last_message_at']);
            $table->index(['recruiter_user_id', 'last_message_at']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['sender_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
