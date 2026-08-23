<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * No account had any activation state before this: an administrator could
 * see a candidate or a recruiter and had no way to actually stop them
 * signing in — only to hide them in a list. `status` is enforced server-side
 * (see EnsureAccountIsActive and AuthController), not just displayed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active')->after('phone');
            $table->string('status_reason')->nullable()->after('status');
            $table->timestamp('status_changed_at')->nullable()->after('status_reason');
            $table->foreignId('status_changed_by_id')->nullable()->after('status_changed_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('status_changed_by_id');
            $table->dropColumn(['status', 'status_reason', 'status_changed_at']);
        });
    }
};
