<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Self-service company profile — the recruiter's own equivalent of
 * `CandidateProfileController`. Before this, only an administrator could
 * touch `CompanyProfile` (status/verification only); nothing let a recruiter
 * describe their own company at all.
 */
class RecruiterProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->companyProfile()->firstOrCreate([]);

        return response()->json($this->payload($profile));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sector' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'website' => ['sometimes', 'nullable', 'string', 'max:255'],
            'employees_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'founded_year' => ['sometimes', 'nullable', 'integer', 'min:1800', 'max:'.(date('Y') + 1)],
            'company_type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'social_links' => ['sometimes', 'nullable', 'array'],
            'social_links.linkedin' => ['sometimes', 'nullable', 'string', 'max:255'],
            'social_links.facebook' => ['sometimes', 'nullable', 'string', 'max:255'],
            'social_links.twitter' => ['sometimes', 'nullable', 'string', 'max:255'],
            'social_links.instagram' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $profile = $request->user()->companyProfile()->firstOrCreate([]);
        $profile->update($data);

        return response()->json($this->payload($profile->fresh()));
    }

    /** Public marketing asset (shown on the company's offers), not a private document — plain public disk, no signed URL. */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'mimetypes:image/png,image/jpeg,image/webp', 'max:2048'],
        ]);

        $profile = $request->user()->companyProfile()->firstOrCreate([]);

        if ($profile->logo_path) {
            Storage::disk('public')->delete($profile->logo_path);
        }

        $path = $request->file('logo')->store('company-logos', 'public');
        $profile->update(['logo_path' => $path]);

        return response()->json($this->payload($profile->fresh()));
    }

    private function payload($profile): array
    {
        return $profile->toArray() + [
            'logo_url' => $profile->logo_path ? Storage::disk('public')->url($profile->logo_path) : null,
        ];
    }
}
