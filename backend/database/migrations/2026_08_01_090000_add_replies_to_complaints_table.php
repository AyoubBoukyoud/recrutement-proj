<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A complaint was a one-way channel: the candidate spoke, an administrator
     * marked it resolved, and the candidate was never told anything happened.
     * These columns turn it into a conversation with an end.
     */
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->text('admin_response')->nullable()->after('status');
            $table->timestamp('responded_at')->nullable()->after('admin_response');
            $table->foreignId('responded_by_id')->nullable()->after('responded_at')
                ->constrained('users')->nullOnDelete();
            // Lets the app badge a reply the candidate has not read yet.
            $table->timestamp('response_seen_at')->nullable()->after('responded_by_id');
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropConstrainedForeignId('responded_by_id');
            $table->dropColumn(['admin_response', 'responded_at', 'response_seen_at']);
        });
    }
};
