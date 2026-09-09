<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The B2C plan catalogue — today just the 100 MAD/year candidate plan from
 * the spec, but kept as a table rather than a config constant since a price
 * change should not silently reprice an already-active subscription (see
 * `subscriptions.plan_id`, a foreign key rather than a copied price).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('price_amount');
            $table->string('price_currency', 3)->default('MAD');
            $table->enum('interval', ['monthly', 'yearly'])->default('yearly');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
