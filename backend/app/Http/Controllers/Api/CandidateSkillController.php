<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateSkill;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Candidate-owned professional skills used by recruiter search. */
class CandidateSkillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(CandidateProfileResolver::resolve($request->user())->skills()->orderBy('skill')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $profile = CandidateProfileResolver::resolve($request->user());
        $skill = $profile->skills()->updateOrCreate(['skill' => $data['skill']], $data);

        return response()->json($skill, $skill->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, CandidateSkill $skill): JsonResponse
    {
        $this->owns($request, $skill);
        $skill->update($this->validated($request, true));

        return response()->json($skill->fresh());
    }

    public function destroy(Request $request, CandidateSkill $skill): JsonResponse
    {
        $this->owns($request, $skill);
        $skill->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'skill' => [$partial ? 'sometimes' : 'required', 'string', 'max:100'],
            'level' => ['sometimes', 'in:debutant,intermediaire,avance,expert'],
            'years_of_experience' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:60'],
        ]);
    }

    private function owns(Request $request, CandidateSkill $skill): void
    {
        $profile = CandidateProfileResolver::resolve($request->user());
        abort_unless($skill->candidate_profile_id === $profile->id, 403);
    }
}
