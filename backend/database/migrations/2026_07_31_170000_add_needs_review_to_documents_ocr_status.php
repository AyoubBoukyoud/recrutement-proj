<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const STATUSES = ['pending', 'processing', 'completed', 'needs_review', 'failed'];

    /**
     * `failed` used to mean two unrelated things: "the page was unreadable"
     * and "we read it but are not confident". The first needs a re-scan, the
     * second needs the candidate to correct a pre-filled form — so they get
     * separate statuses.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->enum('ocr_status', self::STATUSES)->default('pending')->change();
        });
    }

    public function down(): void
    {
        // Collapse the new status back into the one it was split out of, or
        // the rollback leaves rows the old constraint rejects.
        DB::table('documents')->where('ocr_status', 'needs_review')->update(['ocr_status' => 'failed']);

        Schema::table('documents', function (Blueprint $table) {
            $table->enum('ocr_status', ['pending', 'processing', 'completed', 'failed'])
                ->default('pending')
                ->change();
        });
    }
};
