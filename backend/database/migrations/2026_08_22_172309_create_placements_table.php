<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The auditable event the B2B success fee is charged against — not the
 * `recruiter_shortlists.stage` string, which today accepts `'placed'` with
 * no attached behaviour at all (no date, no confirmation, no fee). This
 * table is deliberately separate from that pipeline: `recruiter_shortlist_id`
 * links back to the row that led here without repurposing its `stage` enum
 * as a source of truth for money.
 *
 * Mirrors the stamp-the-rate-at-the-triggering-event discipline already
 * proven in `referral_registrations` (see
 * 2026_08_01_140000_add_commissions_and_token_grace_to_referrals): the fee
 * is fixed at confirmation, so a later rate change can never move money
 * already earned.
 *
 * No payment gateway wiring here — this table only records that a
 * placement happened and what is owed for it. Charging it is a later step.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employer_profile_id')->constrained()->cascadeOnDelete();
            // Nullable: a placement is conceptually reachable without having
            // gone through the recruiter shortlist pipeline (e.g. an
            // administrator recording one directly), even though today's
            // only real path to one is via that pipeline.
            $table->foreignId('recruiter_shortlist_id')->nullable()->constrained('recruiter_shortlists')->nullOnDelete();
            $table->enum('status', ['proposed', 'confirmed_by_employer', 'confirmed_by_candidate', 'active', 'ended'])
                ->default('proposed');
            $table->date('placement_date')->nullable();
            $table->timestamp('employer_confirmed_at')->nullable();
            $table->timestamp('candidate_confirmed_at')->nullable();
            // Stamped once, at confirmation — not read live from a rate
            // table, for the same reason referral commissions are stamped.
            $table->unsignedInteger('fee_amount')->nullable();
            $table->string('fee_currency', 3)->default('MAD');
            $table->enum('invoice_status', ['not_invoiced', 'invoiced', 'paid', 'disputed'])->default('not_invoiced');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('placements');
    }
};
