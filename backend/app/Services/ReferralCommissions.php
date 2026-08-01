<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\ReferralRegistration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * When a referral becomes money, and what happens to it after that.
 *
 * The rule: a registration qualifies when the candidate submits their dossier.
 * Scanning a QR code costs an agent nothing and proves nothing — a signed-up
 * phone number that never fills anything in is not worth a commission — while
 * a submitted dossier is the thing the business can actually place. That is
 * also the only milestone already recorded, so nothing has to be invented to
 * measure it.
 *
 * From there it is deliberately manual: qualified → approved → paid, moved by
 * an administrator. There is no payment rail in this codebase (see K), so
 * pretending an amount was disbursed would be a lie in the schema.
 */
class ReferralCommissions
{
    /**
     * Called when a candidate submits. Idempotent: re-submitting after an edit
     * is normal and must not re-earn, re-price or reset an approved commission.
     */
    public function qualify(CandidateProfile $profile): ?ReferralRegistration
    {
        $registration = ReferralRegistration::with('referralAgent')
            ->where('candidate_profile_id', $profile->id)
            ->first();

        if (! $registration || $registration->commission_status !== 'pending') {
            return $registration;
        }

        $agent = $registration->referralAgent;

        $registration->update([
            'commission_status' => 'qualified',
            // Stamped at qualification, not read live: an agent's rate may
            // change later, and a commission already earned must not move.
            'commission_amount' => $agent?->commissionAmount() ?? config('referrals.commission.default_amount'),
            'commission_currency' => config('referrals.commission.currency'),
            'qualified_at' => Carbon::now(),
        ]);

        Log::info('Referral commission qualified.', [
            'registration_id' => $registration->id,
            'referral_agent_id' => $registration->referral_agent_id,
            'amount' => $registration->commission_amount,
        ]);

        return $registration;
    }

    /**
     * An administrator moving a commission along, or refusing it.
     *
     * @param  array{payout_reference?: string|null, payout_note?: string|null}  $details
     */
    public function resolve(ReferralRegistration $registration, string $status, array $details = []): ReferralRegistration
    {
        $registration->fill([
            'commission_status' => $status,
            'payout_reference' => $details['payout_reference'] ?? $registration->payout_reference,
            'payout_note' => $details['payout_note'] ?? $registration->payout_note,
        ]);

        // Timestamps are set once and left: an approval date that moves every
        // time somebody re-saves the row is not an audit trail.
        if ($status === 'approved' && ! $registration->approved_at) {
            $registration->approved_at = Carbon::now();
        }

        if ($status === 'paid') {
            $registration->approved_at ??= Carbon::now();
            $registration->paid_at ??= Carbon::now();
        }

        $registration->save();

        return $registration;
    }

    /**
     * What an agent has earned, is owed, and has been paid.
     *
     * @return array<string, mixed>
     */
    public function summaryFor(int $agentId): array
    {
        $rows = ReferralRegistration::where('referral_agent_id', $agentId)
            ->selectRaw('commission_status, COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as total')
            ->groupBy('commission_status')
            ->get()
            ->keyBy('commission_status');

        $sum = fn (array $statuses) => (float) collect($statuses)
            ->sum(fn (string $status) => (float) ($rows[$status]->total ?? 0));

        return [
            'currency' => config('referrals.commission.currency'),
            'registrations' => (int) $rows->sum('count'),
            'counts' => [
                'pending' => (int) ($rows['pending']->count ?? 0),
                'qualified' => (int) ($rows['qualified']->count ?? 0),
                'approved' => (int) ($rows['approved']->count ?? 0),
                'paid' => (int) ($rows['paid']->count ?? 0),
                'rejected' => (int) ($rows['rejected']->count ?? 0),
            ],
            // Earned but not yet handed over — the number an agent actually
            // wants to see.
            'owed' => $sum(ReferralRegistration::OWED_STATUSES),
            'paid' => $sum(['paid']),
            'lifetime' => $sum([...ReferralRegistration::OWED_STATUSES, 'paid']),
        ];
    }
}
