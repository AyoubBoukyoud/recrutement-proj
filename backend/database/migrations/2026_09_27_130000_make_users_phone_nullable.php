<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * A first Google sign-in now creates the account (GoogleSignIn::register), so
 * an account no longer necessarily has a phone. The unique index stays: two
 * accounts still can never share a number, and SQL treats NULLs as distinct.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Fails while Google-only accounts exist — they would need a phone first.
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
        });
    }
};
