<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per charge attempt against a subscription — kept separate from
 * `subscriptions` because a subscription lives for a year and gets charged
 * repeatedly (renewal retries included), while each attempt is its own
 * pass/fail record a support conversation needs to reference individually.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->string('currency', 3)->default('MAD');
            $table->enum('status', ['pending', 'succeeded', 'failed'])->default('pending');
            $table->string('provider_reference')->nullable();
            $table->timestamp('attempted_at')->nullable();
            $table->timestamp('succeeded_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
    }
};
