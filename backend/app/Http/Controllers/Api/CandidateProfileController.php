<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CandidateProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->load(['educations', 'languages']));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'profession' => ['sometimes', 'nullable', 'string', 'max:255'],
            'specialization' => ['sometimes', 'nullable', 'string', 'max:255'],
            'years_of_experience' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:60'],
            'date_of_birth' => ['sometimes', 'date'],
            'availability_status' => ['sometimes', 'in:immediate,within_1_month,within_2_months'],
            'terms_accepted' => ['sometimes', 'boolean'],
            'cndp_accepted' => ['sometimes', 'boolean'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        if (array_key_exists('terms_accepted', $data)) {
            $data['terms_consent_at'] = $data['terms_accepted'] ? now() : null;
            unset($data['terms_accepted']);
        }

        if (array_key_exists('cndp_accepted', $data)) {
            $data['cndp_consent_at'] = $data['cndp_accepted'] ? now() : null;
            unset($data['cndp_accepted']);
        }

        $profile->update($data);

        return response()->json($profile->fresh(['educations', 'languages']));
    }

    public function uploadVideo(Request $request): JsonResponse
    {
        $request->validate([
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime', 'max:51200'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        if ($profile->presentation_video_path) {
            Storage::disk('public')->delete($profile->presentation_video_path);
        }

        $path = $request->file('video')->store('videos', 'public');
        $profile->update(['presentation_video_path' => $path]);

        return response()->json($profile->fresh());
    }
}
