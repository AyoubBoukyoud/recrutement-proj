<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Services\CandidateProfileResolver;
use App\Services\CandidateTimeline;
use App\Services\ProfileCompleteness;
use App\Services\RecruiterProfileView;
use App\Services\ReferralCommissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CandidateProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($this->payload($profile));
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
            'matching_preferences' => ['sometimes', 'nullable', 'array'],
            'matching_preferences.regions' => ['sometimes', 'array'],
            'matching_preferences.regions.*' => ['string', 'max:255'],
            'matching_preferences.sectors' => ['sometimes', 'array'],
            'matching_preferences.sectors.*' => ['string', 'max:255'],
            'matching_preferences.min_salary' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'orientation_result' => ['sometimes', 'nullable', 'string', 'max:255'],
            'orientation_score' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'terms_accepted' => ['sometimes', 'boolean'],
            'cndp_accepted' => ['sometimes', 'boolean'],
            // Optimistic concurrency: what the client believed the dossier
            // looked like when the candidate started editing. Optional, so a
            // client that does not care keeps last-write-wins.
            'base_updated_at' => ['sometimes', 'nullable', 'date'],
            // "I know, apply mine anyway" — the resolution of a 409.
            'force' => ['sometimes', 'boolean'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        $this->guardAgainstConflict($profile, $data);
        unset($data['base_updated_at'], $data['force']);

        if (array_key_exists('terms_accepted', $data)) {
            $data['terms_consent_at'] = $data['terms_accepted'] ? now() : null;
            unset($data['terms_accepted']);
        }

        if (array_key_exists('cndp_accepted', $data)) {
            $data['cndp_consent_at'] = $data['cndp_accepted'] ? now() : null;
            unset($data['cndp_accepted']);
        }

        $profile->update($data);

        return response()->json($this->payload($profile->fresh()));
    }

    /**
     * Refuse a write that was composed against a version of the dossier
     * somebody has since replaced.
     *
     * Sessions run on several devices at once and edits can sit in an offline
     * queue for hours, so "the last request to arrive wins" quietly destroys
     * work — the candidate fills in a page on a phone with no signal, edits
     * the same page on a laptop, and the phone's copy overwrites it on
     * reconnect with no sign that anything happened. A 409 hands that decision
     * back to the person whose data it is; the offline queue holds the
     * mutation aside and asks.
     *
     * @param  array<string, mixed>  $data
     */
    private function guardAgainstConflict(CandidateProfile $profile, array $data): void
    {
        $base = $data['base_updated_at'] ?? null;

        if (! $base || filter_var($data['force'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        // Second resolution: the column stores seconds, so a same-second edit
        // is indistinguishable from no edit and is let through rather than
        // raising a conflict nobody can explain.
        if ($profile->updated_at?->gt(Carbon::parse($base))) {
            abort(response()->json([
                'message' => 'This dossier was changed on another device after you started editing.',
                'reason' => 'conflict',
                'server_updated_at' => $profile->updated_at,
                'server' => $this->payload($profile),
            ], 409));
        }
    }

    public function uploadVideo(Request $request): JsonResponse
    {
        $request->validate([
            // webm is what MediaRecorder actually produces in every browser
            // that lacks native mp4 recording (Chrome, Firefox) — the web
            // candidate flow would 422 on every real recording without it.
            // mp4/quicktime cover the native mobile recorder.
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime,video/webm', 'max:51200'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        if ($profile->presentation_video_path) {
            Storage::disk('local')->delete($profile->presentation_video_path);
        }

        $path = $request->file('video')->store('videos', 'local');
        $profile->update(['presentation_video_path' => $path]);

        return response()->json($this->payload($profile->fresh()));
    }

    /**
     * The dossier as a recruiter will actually receive it, so the candidate can
     * check it before submitting rather than after.
     */
    public function preview(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json([
            'visible_to_recruiters' => RecruiterProfileView::isVisible($profile),
            'profile' => RecruiterProfileView::for($profile),
        ]);
    }

    /**
     * The candidate declares the dossier finished. Refused while a required
     * section is still empty, and the response names them so the review step
     * can send the candidate back to the step that is missing something.
     */
    public function submit(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());
        $completeness = ProfileCompleteness::for($profile);

        if (! $completeness['can_submit']) {
            throw ValidationException::withMessages([
                'missing_required' => $completeness['missing_required'],
            ]);
        }

        // Re-submitting after an edit is normal and re-stamps the date rather
        // than being rejected as "already submitted".
        $profile->update(['submitted_at' => now()]);

        // The milestone a referral commission is earned on — idempotent, so a
        // re-submission does not re-earn it.
        app(ReferralCommissions::class)->qualify($profile);

        return response()->json($this->payload($profile->fresh()));
    }

    /** Derived milestones for the candidate's own "profil" screen — see CandidateTimeline. */
    public function timeline(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json(CandidateTimeline::for($profile));
    }

    /** Every profile response carries its own progress, so no client recomputes it. */
    private function payload(CandidateProfile $profile): array
    {
        // documents is loaded because completeness reads the CV and certificate
        // flags off it — and having it here spares the builder a second request.
        $profile->load(['educations', 'languages.certificateDocument', 'skills', 'documents']);

        return $profile->toArray() + ['completeness' => ProfileCompleteness::for($profile)];
    }
}
