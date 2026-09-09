<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Identity verification (verification-identite) reuses the existing document
 * upload + admin approval pipeline rather than a parallel one — an ID photo
 * is just another document type, approved or rejected the same way a diploma
 * is.
 *
 * MySQL needs a raw MODIFY to widen an enum in place; SQLite (the test
 * suite's driver) compiles `enum()` to a `varchar check (...)` constraint
 * that MySQL's ALTER syntax cannot touch, and SQLite itself has no MODIFY
 * COLUMN — the column is dropped and re-added instead, which is safe here
 * only because tests always run this against a freshly migrated database.
 */
return new class extends Migration
{
    private const TYPES = ['cv', 'certificate', 'diploma', 'identity'];

    private const PREVIOUS_TYPES = ['cv', 'certificate', 'diploma'];

    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            $this->replaceColumn(self::TYPES);

            return;
        }

        DB::statement('ALTER TABLE documents MODIFY COLUMN type ENUM(\''.implode("', '", self::TYPES).'\') NOT NULL');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            $this->replaceColumn(self::PREVIOUS_TYPES);

            return;
        }

        DB::statement('ALTER TABLE documents MODIFY COLUMN type ENUM(\''.implode("', '", self::PREVIOUS_TYPES).'\') NOT NULL');
    }

    /** @param  list<string>  $types */
    private function replaceColumn(array $types): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('documents', function (Blueprint $table) use ($types) {
            $table->enum('type', $types)->after('candidate_profile_id');
        });
    }
};
