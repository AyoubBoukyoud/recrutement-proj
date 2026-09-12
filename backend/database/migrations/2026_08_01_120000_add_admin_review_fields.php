<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The checklist was display-only: an administrator could see that a dossier
 * looked complete and had no way to say they had actually checked it, or to
 * reject a document that was the wrong thing entirely.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            // A human has read this dossier and vouches for it. Distinct from
            // `submitted_at`, which is only the candidate's own declaration.
            $table->timestamp('verified_at')->nullable()->after('submitted_at');
            $table->foreignId('verified_by_id')->nullable()->after('verified_at')
                ->constrained('users')->nullOnDelete();
            // Internal follow-up notes. Never leaves the admin surface.
            $table->text('admin_notes')->nullable()->after('verified_by_id');
        });

        Schema::table('documents', function (Blueprint $table) {
            // Separate from ocr_status, which is about our scanner. This is
            // about the document: a legible photograph of the wrong diploma
            // scans perfectly and is still not acceptable.
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])
                ->default('pending')->after('ocr_status');
            $table->foreignId('reviewed_by_id')->nullable()->after('approval_status')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by_id');
            // Mandatory on rejection: "rejected" with no reason gives the
            // candidate nothing to act on.
            $table->text('rejection_reason')->nullable()->after('reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by_id');
            $table->dropColumn(['verified_at', 'admin_notes']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by_id');
            $table->dropColumn(['approval_status', 'reviewed_at', 'rejection_reason']);
        });
    }
};
