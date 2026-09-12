<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per browser/device the user has granted notification permission
 * on — a user can have several (phone, laptop...). `endpoint` is the push
 * service's own subscription URL, unique per device; `p256dh`/`auth` are the
 * encryption keys the browser generated for it, both required to encrypt a
 * payload that service can deliver.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->unique();
            $table->string('p256dh');
            $table->string('auth');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
