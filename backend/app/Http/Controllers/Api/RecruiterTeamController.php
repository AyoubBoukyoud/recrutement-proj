<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyTeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The recruiter's own team roster — contacts to loop in on hiring, not a
 * second way to sign in to the platform. See the migration for why this
 * doesn't touch `users`/authentication at all.
 */
class RecruiterTeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user()->companyProfile()->firstOrCreate([]);

        return response()->json($profile->teamMembers()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'position' => ['sometimes', 'nullable', 'string', 'max:100'],
            'role' => ['sometimes', 'in:admin,recruiter,assistant'],
        ]);

        $profile = $request->user()->companyProfile()->firstOrCreate([]);
        $member = $profile->teamMembers()->create($data);

        return response()->json($member, 201);
    }

    public function update(Request $request, CompanyTeamMember $teamMember): JsonResponse
    {
        $this->authorizeOwnership($request, $teamMember);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'position' => ['sometimes', 'nullable', 'string', 'max:100'],
            'role' => ['sometimes', 'in:admin,recruiter,assistant'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $teamMember->update($data);

        return response()->json($teamMember->fresh());
    }

    public function destroy(Request $request, CompanyTeamMember $teamMember): JsonResponse
    {
        $this->authorizeOwnership($request, $teamMember);
        $teamMember->delete();

        return response()->json(status: 204);
    }

    private function authorizeOwnership(Request $request, CompanyTeamMember $teamMember): void
    {
        abort_unless($teamMember->company_profile_id === $request->user()->companyProfile?->id, 404);
    }
}
