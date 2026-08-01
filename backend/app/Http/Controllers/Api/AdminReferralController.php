<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralRegistration;
use App\Services\ReferralCommissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * The payout side of the referral programme. Commissions qualify on their own
 * when a referred candidate submits; approving and paying them is a human
 * decision, because there is no payment rail in this codebase to make it
 * anything else.
 */
class AdminReferralController extends Controller
{
    public function __construct(private readonly ReferralCommissions $commissions) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'in:pending,qualified,approved,paid,rejected'],
        ]);

        $registrations = ReferralRegistration::query()
            ->with(['referralAgent.user:id,name,phone', 'candidateProfile:id,first_name,last_name,submitted_at'])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('commission_status', $status))
            // Money owed first: the reason to open this screen is to pay
            // someone, not to browse history.
            ->orderByRaw("commission_status = 'qualified' DESC")
            ->latest('registered_at')
            ->paginate((int) $request->integer('per_page', 20));

        $registrations->getCollection()->transform(fn (ReferralRegistration $registration) => [
            'id' => $registration->id,
            'agent' => $registration->referralAgent?->user?->name
                ?? $registration->referralAgent?->user?->phone,
            'agent_id' => $registration->referral_agent_id,
            'candidate' => trim(sprintf(
                '%s %s',
                $registration->candidateProfile?->first_name,
                $registration->candidateProfile?->last_name,
            )) ?: null,
            'candidate_submitted' => (bool) $registration->candidateProfile?->submitted_at,
            'registered_at' => $registration->registered_at,
            'commission_status' => $registration->commission_status,
            'commission_amount' => $registration->commission_amount,
            'commission_currency' => $registration->commission_currency,
            'qualified_at' => $registration->qualified_at,
            'approved_at' => $registration->approved_at,
            'paid_at' => $registration->paid_at,
            'payout_reference' => $registration->payout_reference,
            'payout_note' => $registration->payout_note,
        ]);

        return response()->json($registrations);
    }

    public function update(Request $request, ReferralRegistration $registration): JsonResponse
    {
        $data = $request->validate([
            'commission_status' => ['required', 'in:'.implode(',', ReferralRegistration::RESOLVABLE_STATUSES)],
            // Bank transfer reference, cash receipt number — whatever the
            // finance side used, so a dispute can be traced off-platform.
            'payout_reference' => ['sometimes', 'nullable', 'string', 'max:100'],
            'payout_note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $updated = $this->commissions->resolve($registration, $data['commission_status'], $data);

        Log::info('Referral commission resolved by an administrator.', [
            'admin_id' => $request->user()->id,
            'registration_id' => $updated->id,
            'status' => $updated->commission_status,
            'amount' => $updated->commission_amount,
        ]);

        return response()->json($updated->fresh());
    }
}
