<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('phone');
            // login | phone_change — a candidate changing their number has a
            // live code for a phone that is not theirs yet, so the pair is what
            // must be unique, not the phone alone.
            $table->string('purpose')->default('login');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Hashed, not the code itself: a database leak must not hand an
            // attacker every in-flight sign-in.
            $table->string('code_hash');
            $table->string('channel')->nullable();
            $table->timestamp('expires_at');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('consumed_at')->nullable();
            // Resend cooldown and per-window send ceiling.
            $table->timestamp('last_sent_at')->nullable();
            $table->unsignedSmallInteger('sends')->default(0);
            $table->timestamp('window_started_at')->nullable();
            $table->timestamps();

            $table->unique(['phone', 'purpose']);
        });

        // The user columns this table replaces. Leaving them would give two
        // sources of truth for whether a code is live.
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['otp_code', 'otp_expires_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('otp_code', 6)->nullable()->after('phone_verified_at');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
        });

        Schema::dropIfExists('otp_codes');
    }
};
