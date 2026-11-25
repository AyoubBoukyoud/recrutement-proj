<?php

use App\Models\LanguageTest;
use App\Services\LanguageTest\ExamFinalizer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        $sqlite = DB::getDriverName() === 'sqlite';
        $sql = $sqlite ? DB::table('sqlite_master')->where('name', 'language_tests')->value('sql') : '';
        // Fresh databases already use an extensible string. Older SQLite databases
        // need a rebuild with foreign keys disabled outside a transaction, otherwise
        // dropping the old table would cascade-delete recordings and profile links.
        if (! $sqlite || str_contains(strtolower($sql ?? ''), 'check ("outcome"')) {
            if ($sqlite && DB::transactionLevel() > 0) {
                throw new RuntimeException('Run this legacy SQLite upgrade outside a transaction.');
            }
            Schema::withoutForeignKeyConstraints(function () {
                Schema::table('language_tests', fn (Blueprint $table) => $table->string('outcome', 40)->nullable()->change());
            });
        }
        // Retain human corrections. Reassess automatic results under the new rules,
        // including removing unsupported levels from profiles and recruiter filters.
        LanguageTest::where('status', 'validated')->whereNull('reviewed_by_id')
            ->eachById(fn ($test) => app(ExamFinalizer::class)->maybeFinalize($test, reassess: true));
    }

    public function down(): void
    {
        // Evidence-based results cannot safely be restored to inferred levels.
    }
};
