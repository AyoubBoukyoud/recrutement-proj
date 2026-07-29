<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecruiterCandidateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'profession' => ['sometimes', 'string'],
            'specialization' => ['sometimes', 'string'],
            'language' => ['sometimes', 'in:fr,ar,en,de'],
            'cefr_level' => ['sometimes', 'in:A1,A2,B1,B2,C1,C2'],
            'min_experience' => ['sometimes', 'integer', 'min:0'],
            'availability_status' => ['sometimes', 'in:immediate,within_1_month,within_2_months'],
        ]);

        $query = CandidateProfile::query()
            ->with(['languages'])
            // Only candidates who've completed the compliance step are discoverable.
            ->whereNotNull('terms_consent_at')
            ->whereNotNull('cndp_consent_at');

        if (! empty($filters['profession'])) {
            $query->where('profession', 'like', '%'.$filters['profession'].'%');
        }
        if (! empty($filters['specialization'])) {
            $query->where('specialization', 'like', '%'.$filters['specialization'].'%');
        }
        if (! empty($filters['min_experience'])) {
            $query->where('years_of_experience', '>=', $filters['min_experience']);
        }
        if (! empty($filters['availability_status'])) {
            $query->where('availability_status', $filters['availability_status']);
        }
        if (! empty($filters['language'])) {
            $query->whereHas('languages', function ($q) use ($filters) {
                $q->where('language', $filters['language']);
                if (! empty($filters['cefr_level'])) {
                    $q->where('cefr_level', '>=', $filters['cefr_level']);
                }
            });
        }

        return response()->json(
            $query->latest('updated_at')->paginate(20)
        );
    }

    public function show(CandidateProfile $candidateProfile): JsonResponse
    {
        abort_unless($candidateProfile->terms_consent_at && $candidateProfile->cndp_consent_at, 404);

        return response()->json(
            $candidateProfile->load(['educations', 'languages', 'documents.extraction', 'languageAssessments'])
        );
    }
}
