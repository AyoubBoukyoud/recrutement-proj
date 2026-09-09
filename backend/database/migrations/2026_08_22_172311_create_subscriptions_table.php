<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One candidate's relationship to a plan over time. `provider` /
 * `provider_customer_reference` / `provider_subscription_reference` are
 * nullable and provider-agnostic on purpose — no gateway is wired up yet
 * (PayZone looks like the fit for recurring billing, CMI does not support
 * it natively; see the plan doc's payment-provider comparison), and this
 * schema should not have to change once one is chosen.
 *
 * The entitlement rule — does an expired subscription hide a candidate from
 * recruiter search regardless of consent? — is flagged in the plan as a
 * still-open product decision. Nothing reads this table yet; wiring it into
 * `RecruiterProfileView::isVisible()` is a deliberately separate, later step.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->enum('status', ['trialing', 'active', 'past_due', 'canceled', 'expired'])->default('trialing');
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancel_at')->nullable();
            $table->string('provider')->nullable();
            $table->string('provider_customer_reference')->nullable();
            $table->string('provider_subscription_reference')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
