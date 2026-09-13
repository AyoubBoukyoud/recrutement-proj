<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\User;
use App\Services\Notifications;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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

    /**
     * Post an offer on a recruiter's behalf — the same shape a recruiter
     * posts through `/recruiter/offers`, minus the implicit "for myself":
     * an administrator has to say which company it belongs to. Exists for
     * recruiters who reach the platform by phone or in person rather than
     * signing in themselves, and for staff filling one in from a brief.
     */
    public function storeOffer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'responsibilities' => ['nullable', 'string', 'max:10000'],
            'requirements' => ['nullable', 'string', 'max:10000'],
            'benefits' => ['nullable', 'string', 'max:10000'],
            'sector' => ['required', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'workplace_type' => ['nullable', 'in:onsite,hybrid,remote'],
            'weekly_hours' => ['nullable', 'integer', 'min:1', 'max:80'],
            'experience_level' => ['nullable', 'in:none,less_than_one,one_to_three,three_to_five,five_plus'],
            'education_level' => ['nullable', 'in:none,vocational,high_school,bachelor,master,doctorate'],
            'required_cefr_level' => ['nullable', 'in:A1,A2,B1,B2,C1,C2'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'gte:salary_min'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'contract_type' => ['required', 'in:permanent,fixed_term,apprenticeship,temporary,internship'],
            'start_date' => ['nullable', 'date'],
            'application_deadline' => ['nullable', 'date'],
            'positions_count' => ['sometimes', 'integer', 'min:1', 'max:999'],
            'status' => ['sometimes', 'in:draft,published,closed'],
        ]);

        if (! User::find($data['user_id'])->hasRole('Company')) {
            throw ValidationException::withMessages(['user_id' => 'The selected user is not a recruiter.']);
        }

        if (($data['status'] ?? 'draft') === 'published') {
            $data['published_at'] = now();
        }

        $offer = JobOffer::create($data);
        AdminActivityLog::record($request->user(), $offer, 'offer_created');
        if ($offer->status === 'published') {
            $this->notifications->matchingOfferPublished($offer);
        }

        return response()->json($offer->fresh('employer.companyProfile'), 201);
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

    /**
     * Move an application along the pipeline from the admin console —
     * mirrors CandidateApplicationController::updateStatus (the recruiter's
     * own equivalent), minus `submitted`/`withdrawn`, which are not an
     * admin's to set: the former is the application's initial state, the
     * latter is the candidate's own action.
     */
    public function updateApplicationStatus(Request $request, JobApplication $application): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:viewed,interview,accepted,rejected']);
        $before = $application->status;
        $application->update(['status' => $data['status'], 'status_changed_at' => now()]);
        AdminActivityLog::record($request->user(), $application, 'application_status_changed', [
            'from' => $before,
            'to' => $data['status'],
        ]);
        $this->notifications->applicationStatusChanged($application);

        return response()->json($application->fresh(['offer.employer.companyProfile', 'candidateProfile.user']));
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
