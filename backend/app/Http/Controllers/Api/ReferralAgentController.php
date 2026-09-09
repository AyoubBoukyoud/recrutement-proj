<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralAgent;
use App\Models\ReferralRegistration;
use App\Services\ReferralCommissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ReferralAgentController extends Controller
{
    public function __construct(private readonly ReferralCommissions $commissions) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->withStats($this->resolve($request)));
    }

    /**
     * Issue a new token. The one it replaces keeps working for a grace period,
     * so the flyers an agent handed out last week do not stop attributing the
     * moment they press this.
     */
    public function rotate(Request $request): JsonResponse
    {
        $agent = $this->resolve($request);
        $graceDays = (int) config('referrals.previous_token_grace_days');

        $agent->update([
            'previous_qr_code_token' => $graceDays > 0 ? $agent->qr_code_token : null,
            'previous_token_expires_at' => $graceDays > 0 ? Carbon::now()->addDays($graceDays) : null,
            'qr_code_token' => Str::random(24),
        ]);

        return response()->json($this->withStats($agent));
    }

    /**
     * Who this agent brought in, and what each one is worth.
     *
     * Names only — an agent is owed a commission and an explanation of it, not
     * access to the dossier the candidate filled in for employers.
     */
    public function registrations(Request $request): JsonResponse
    {
        $agent = $this->resolve($request);

        $registrations = ReferralRegistration::where('referral_agent_id', $agent->id)
            ->with(['candidateProfile:id,first_name,last_name,profession,submitted_at'])
            ->latest('registered_at')
            ->paginate((int) $request->integer('per_page', 20));

        $registrations->getCollection()->transform(fn (ReferralRegistration $registration) => [
            'id' => $registration->id,
            'candidate_name' => trim(sprintf(
                '%s %s',
                $registration->candidateProfile?->first_name,
                $registration->candidateProfile?->last_name,
            )) ?: null,
            'profession' => $registration->candidateProfile?->profession,
            'registered_at' => $registration->registered_at,
            'commission_status' => $registration->commission_status,
            'commission_amount' => $registration->commission_amount,
            'commission_currency' => $registration->commission_currency,
            'qualified_at' => $registration->qualified_at,
            'paid_at' => $registration->paid_at,
        ]);

        return response()->json($registrations);
    }

    private function resolve(Request $request): ReferralAgent
    {
        return ReferralAgent::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['qr_code_token' => Str::random(24)],
        );
    }

    /** @return array<string, mixed> */
    private function withStats(ReferralAgent $agent): array
    {
        return [
            'qr_code_token' => $agent->qr_code_token,
            'registrations_count' => $agent->registrations()->count(),
            'commission_rate' => $agent->commissionAmount(),
            // Shown to the agent so a rotation says what it actually did.
            'previous_token_active_until' => $agent->previous_qr_code_token
                && $agent->previous_token_expires_at?->isFuture()
                    ? $agent->previous_token_expires_at
                    : null,
            'grace_days' => (int) config('referrals.previous_token_grace_days'),
            'earnings' => $this->commissions->summaryFor($agent->id),
        ];
    }
}
