<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Services\Notifications;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Administrative moderation and reporting for the job marketplace. */
class AdminMarketplaceController extends Controller
{
    public function __construct(private readonly Notifications $notifications) {}

    public function offers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => 'sometimes|string|max:100',
            'status' => 'sometimes|in:draft,published,closed',
            'user_id' => 'sometimes|integer|exists:users,id',
            'per_page' => 'sometimes|integer|min:5|max:100',
        ]);
        $query = JobOffer::with('employer.companyProfile')->withCount('applications');
        if (! empty($data['q'])) {
            $search = $data['q'];
            $query->where(fn (Builder $builder) => $builder
                ->where('title', 'like', "%{$search}%")
                ->orWhere('city', 'like', "%{$search}%")
                ->orWhere('sector', 'like', "%{$search}%"));
        }
        foreach (['status', 'user_id'] as $field) {
            if (isset($data[$field])) {
                $query->where($field, $data[$field]);
            }
        }

        return response()->json($query->latest()->paginate($data['per_page'] ?? 20));
    }

    public function updateOffer(Request $request, JobOffer $offer): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:draft,published,closed',
            'reason' => 'required_if:status,draft,closed|nullable|string|max:1000',
        ]);
        $before = $offer->status;
        $offer->update([
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published' ? ($offer->published_at ?? now()) : $offer->published_at,
        ]);
        AdminActivityLog::record($request->user(), $offer, 'offer_status_changed', [
            'from' => $before,
            'to' => $data['status'],
            'reason' => $data['reason'] ?? null,
        ]);
        $this->notifications->offerModerated($offer);
        if ($before !== 'published' && $offer->status === 'published') {
            $this->notifications->matchingOfferPublished($offer);
        }

        return response()->json($offer);
    }

    public function applications(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => 'sometimes|in:submitted,viewed,interview,accepted,rejected,withdrawn',
            'offer_id' => 'sometimes|integer|exists:job_offers,id',
            'per_page' => 'sometimes|integer|min:5|max:100',
        ]);
        $query = JobApplication::with(['offer.employer.companyProfile', 'candidateProfile.user']);
        foreach (['status', 'offer_id'] as $field) {
            if (isset($data[$field])) {
                $query->where($field, $data[$field]);
            }
        }

        return response()->json($query->latest('applied_at')->paginate($data['per_page'] ?? 20));
    }

    public function activity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'action' => 'sometimes|string|max:100',
            'actor_id' => 'sometimes|integer|exists:users,id',
            'per_page' => 'sometimes|integer|min:5|max:100',
        ]);
        $query = AdminActivityLog::with('actor:id,name,phone');
        foreach (['action', 'actor_id'] as $field) {
            if (isset($data[$field])) {
                $query->where($field, $data[$field]);
            }
        }

        return response()->json($query->latest()->paginate($data['per_page'] ?? 50));
    }
}
