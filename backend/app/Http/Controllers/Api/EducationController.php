<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Education;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducationController extends Controller
{
    private const LEVELS = ['general_school', 'vocational', 'professional_training', 'bachelor', 'master', 'other'];

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->educations()->orderByDesc('started_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $profile = CandidateProfileResolver::resolve($request->user());

        $education = $profile->educations()->create($data);

        return response()->json($education, 201);
    }

    public function update(Request $request, Education $education): JsonResponse
    {
        $this->authorizeOwnership($request, $education);

        $education->update($this->validated($request, sometimes: true));

        return response()->json($education->fresh());
    }

    public function destroy(Request $request, Education $education): JsonResponse
    {
        $this->authorizeOwnership($request, $education);
        $education->delete();

        return response()->json(status: 204);
    }

    private function validated(Request $request, bool $sometimes = false): array
    {
        $presence = $sometimes ? 'sometimes' : 'required';

        return $request->validate([
            'level' => [$presence, 'in:'.implode(',', self::LEVELS)],
            'field' => ['nullable', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'started_at' => ['nullable', 'date'],
            'ended_at' => ['nullable', 'date'],
        ]);
    }

    private function authorizeOwnership(Request $request, Education $education): void
    {
        abort_unless(
            $education->candidate_profile_id === $request->user()->candidateProfile?->id,
            403,
        );
    }
}
