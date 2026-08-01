<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\RecruiterShortlist;
use App\Services\RecruiterCandidateSearch;
use App\Services\RecruiterProfileView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecruiterCandidateController extends Controller
{
    public function __construct(private readonly RecruiterCandidateSearch $search) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            // Free text across name, profession and specialisation.
            'q' => ['sometimes', 'string', 'max:100'],
            'profession' => ['sometimes', 'string', 'max:100'],
            'specialization' => ['sometimes', 'string', 'max:100'],
            'language' => ['sometimes', 'in:fr,ar,en,de'],
            'cefr_level' => ['sometimes', 'in:'.implode(',', RecruiterCandidateSearch::CEFR_ORDER)],
            'min_experience' => ['sometimes', 'integer', 'min:0'],
            'availability_status' => ['sometimes', 'in:immediate,within_1_month,within_2_months'],
            'education_level' => ['sometimes', 'in:'.implode(',', RecruiterCandidateSearch::EDUCATION_LEVELS)],
            'has_video' => ['sometimes', 'boolean'],
            'verified_assessment' => ['sometimes', 'boolean'],
            'submitted_only' => ['sometimes', 'boolean'],
            'shortlisted_only' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'in:'.implode(',', RecruiterCandidateSearch::SORTS)],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:50'],
        ]);

        $recruiterId = $request->user()->id;
        $results = $this->search->paginate($filters, $recruiterId);

        // Transformed rather than dumped: a result card needs the facts it
        // shows and the marks that tell a recruiter where they left off, not
        // every column on the model.
        $results->getCollection()->transform(function (CandidateProfile $profile) {
            $entry = $profile->shortlistEntries->first();

            return [
                'id' => $profile->id,
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'profession' => $profile->profession,
                'specialization' => $profile->specialization,
                'years_of_experience' => $profile->years_of_experience,
                'availability_status' => $profile->availability_status,
                'languages' => $profile->languages,
                'has_video' => (bool) $profile->presentation_video_path,
                'has_verified_assessment' => $profile->languageAssessments
                    ->contains(fn ($a) => $a->status === 'completed' && $a->predicted_cefr),
                'submitted' => (bool) $profile->submitted_at,
                'shortlisted' => (bool) $entry,
                'shortlist_stage' => $entry?->stage,
                'contact_revealed' => (bool) $entry?->contact_revealed_at,
                'updated_at' => $profile->updated_at,
            ];
        });

        return response()->json($results);
    }

    public function show(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        abort_unless(RecruiterProfileView::isVisible($candidateProfile), 404);

        $entry = RecruiterShortlist::where('user_id', $request->user()->id)
            ->where('candidate_profile_id', $candidateProfile->id)
            ->first();

        return response()->json([
            ...RecruiterProfileView::for($candidateProfile),
            'shortlist' => $entry,
            // The details themselves arrive only through the contact endpoint,
            // which records the disclosure; this just says whether that has
            // already happened for this recruiter.
            'contact' => $entry?->contact_revealed_at
                ? [
                    'phone' => $candidateProfile->user?->phone,
                    'email' => $candidateProfile->user?->email,
                    'revealed_at' => $entry->contact_revealed_at,
                ]
                : null,
        ]);
    }
}
