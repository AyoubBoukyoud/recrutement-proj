<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use Illuminate\Http\JsonResponse;

class AdminCandidateController extends Controller
{
    public function index(): JsonResponse
    {
        $profiles = CandidateProfile::query()
            ->with(['user:id,phone', 'documents', 'referralRegistration.referralAgent.user:id,name,phone'])
            ->latest('updated_at')
            ->paginate(20);

        $profiles->getCollection()->transform(fn (CandidateProfile $profile) => [
            'id' => $profile->id,
            'phone' => $profile->user->phone,
            'name' => trim("{$profile->first_name} {$profile->last_name}") ?: null,
            'availability_status' => $profile->availability_status,
            'referred_by' => $profile->referralRegistration?->referralAgent?->user?->name
                ?? $profile->referralRegistration?->referralAgent?->user?->phone,
            'checklist' => [
                'profile_completed' => (bool) ($profile->first_name && $profile->last_name && $profile->availability_status),
                'cv_uploaded' => $profile->documents->contains(fn ($d) => $d->type === 'cv' && $d->ocr_status === 'completed'),
                'certificates_uploaded' => $profile->documents->contains('type', 'certificate'),
                'video_recorded' => (bool) $profile->presentation_video_path,
            ],
        ]);

        return response()->json($profiles);
    }
}
