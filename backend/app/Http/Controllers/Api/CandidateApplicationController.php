<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Services\CandidateProfileResolver;
use App\Services\Notifications;
use App\Services\RecruiterCandidateSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Candidate and recruiter actions around a submitted job application. */
class CandidateApplicationController extends Controller
{
    public function __construct(private readonly Notifications $notifications) {}

    public function recruiterIndex(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => 'sometimes|in:submitted,viewed,interview,accepted,rejected,withdrawn',
            'offer_id' => 'sometimes|integer',
            'per_page' => 'sometimes|integer|min:5|max:100',
            'page' => 'sometimes|integer|min:1',
        ]);
        $query = JobApplication::whereHas('offer', fn ($offer) => $offer->where('user_id', $request->user()->id))
            ->with(['offer', 'candidateProfile.user', 'candidateProfile.languages']);

        foreach (['status', 'offer_id'] as $field) {
            if (isset($data[$field])) {
                $query->where($field, $data[$field]);
            }
        }

        return response()->json($query->latest('applied_at')->paginate($data['per_page'] ?? 20));
    }

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json(
            $profile->jobApplications()
                ->with('offer.employer.companyProfile')
                ->latest('applied_at')
                ->paginate(min(100, max(1, $request->integer('per_page', 20))))
        );
    }

    public function apply(Request $request, JobOffer $offer): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());
        abort_unless($offer->status === 'published', 404);
        abort_unless($profile->submitted_at, 422, 'Submit your candidate profile before applying.');

        if ($offer->required_cefr_level) {
            $hasRequiredLevel = $profile->languages()
                ->whereIn('cefr_level', RecruiterCandidateSearch::levelsAtLeast($offer->required_cefr_level))
                ->exists();
            abort_unless($hasRequiredLevel, 422, 'Required CEFR level not met.');
        }

        $application = JobApplication::firstOrCreate(
            ['candidate_profile_id' => $profile->id, 'job_offer_id' => $offer->id],
            ['status' => 'submitted', 'applied_at' => now(), 'status_changed_at' => now()],
        );
        abort_unless($application->wasRecentlyCreated, 409, 'You already applied to this offer.');

        $this->notifications->applicationCreated($application);

        return response()->json($application->load('offer'), 201);
    }

    public function withdraw(Request $request, JobApplication $application): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());
        abort_unless($application->candidate_profile_id === $profile->id, 403);
        abort_if(in_array($application->status, ['accepted', 'rejected', 'withdrawn'], true), 409);
        $application->update([
            'status' => 'withdrawn',
            'withdrawn_at' => now(),
            'status_changed_at' => now(),
        ]);

        return response()->json($application);
    }

    public function updateStatus(Request $request, JobApplication $application): JsonResponse
    {
        abort_unless($application->offer->user_id === $request->user()->id, 403);
        abort_if($application->anonymized_at, 409, 'An anonymized application cannot be updated.');
        $data = $request->validate(['status' => 'required|in:viewed,interview,accepted,rejected']);
        $application->update(['status' => $data['status'], 'status_changed_at' => now()]);
        $this->notifications->applicationStatusChanged($application);

        return response()->json($application);
    }
}
