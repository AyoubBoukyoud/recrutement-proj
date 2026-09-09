<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // References referral_agents.id; FK omitted since that table is
            // created much later in migration order (see candidate_languages
            // for the same pattern).
            $table->unsignedBigInteger('pending_referral_agent_id')->nullable()->after('otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pending_referral_agent_id');
        });
    }
};
