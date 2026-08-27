<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Candidate privacy export and the reversible account-deletion window. */
class CandidateAccountController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'deletion_requested_at' => $request->user()->deletion_requested_at,
            'deletion_pending' => $request->user()->deletion_requested_at !== null,
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'candidateProfile.educations',
            'candidateProfile.languages.certificateDocument',
            'candidateProfile.skills',
            'candidateProfile.documents',
            'candidateProfile.languageAssessments',
            'candidateProfile.jobApplications.offer',
            'complaints',
            'subscriptions',
        ]);
        $profile = $user->candidateProfile;

        return response()->json([
            'exported_at' => now(),
            // Kept for clients released before the structured export. It no
            // longer exposes the raw Eloquent model or any hidden columns.
            'user' => ['id' => $user->id],
            'identity' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'account_created_at' => $user->created_at,
            ],
            'dossier' => $profile ? [
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'profession' => $profile->profession,
                'specialization' => $profile->specialization,
                'years_of_experience' => $profile->years_of_experience,
                'city' => $profile->city,
                'date_of_birth' => $profile->date_of_birth,
                'availability_status' => $profile->availability_status,
                'matching_preferences' => $profile->matching_preferences,
                'orientation_result' => $profile->orientation_result,
                'orientation_score' => $profile->orientation_score,
                'submitted_at' => $profile->submitted_at,
                'verified_at' => $profile->verified_at,
            ] : null,
            'consents' => $profile ? [
                'terms_accepted_at' => $profile->terms_consent_at,
                'cndp_accepted_at' => $profile->cndp_consent_at,
                'cndp_withdrawn_at' => $profile->cndp_withdrawn_at,
                'visibility_paused_at' => $profile->visibility_paused_at,
            ] : null,
            'educations' => $profile?->educations->map->only([
                'level', 'field', 'institution', 'started_at', 'ended_at',
            ])->values() ?? [],
            'languages' => $profile?->languages->map->only([
                'language', 'cefr_level', 'self_declared_cefr', 'ai_cefr', 'source', 'certificate_document_id',
            ])->values() ?? [],
            'skills' => $profile?->skills->map->only([
                'skill', 'level', 'years_of_experience',
            ])->values() ?? [],
            'documents' => $profile?->documents->map(fn ($document) => [
                'type' => $document->type,
                'file_name' => basename($document->file_path),
                'ocr_status' => $document->ocr_status,
                'approval_status' => $document->approval_status,
                'rejection_reason' => $document->rejection_reason,
                'reviewed_at' => $document->reviewed_at,
                'uploaded_at' => $document->created_at,
            ])->values() ?? [],
            'language_assessments' => $profile?->languageAssessments->map(fn ($assessment) => [
                'language' => $assessment->language,
                'file_name' => basename($assessment->audio_path),
                'status' => $assessment->status,
                'predicted_cefr' => $assessment->predicted_cefr,
                'score_breakdown' => $assessment->score_breakdown,
                'created_at' => $assessment->created_at,
            ])->values() ?? [],
            'applications' => $profile?->jobApplications->map(fn ($application) => [
                'offer' => $application->offer?->only(['title', 'sector', 'city', 'country', 'contract_type']),
                'status' => $application->status,
                'applied_at' => $application->applied_at,
                'status_changed_at' => $application->status_changed_at,
            ])->values() ?? [],
            'complaints' => $user->complaints->map(fn ($complaint) => [
                'type' => $complaint->type,
                'body' => $complaint->body,
                'audio_file_name' => $complaint->audio_path ? basename($complaint->audio_path) : null,
                'status' => $complaint->status,
                'admin_response' => $complaint->admin_response,
                'responded_at' => $complaint->responded_at,
                'created_at' => $complaint->created_at,
            ])->values(),
            'subscriptions' => $user->subscriptions->map->only([
                'status', 'current_period_start', 'current_period_end', 'cancel_at', 'created_at',
            ])->values(),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'deletion_requested_at' => now()->addDays(30),
            'status' => 'blocked',
            'status_reason' => 'Account deletion requested',
            'status_changed_at' => now(),
        ]);

        // A later OTP login receives a recovery-only session; every existing
        // session is revoked immediately when the request is made.
        $user->tokens()->delete();

        return response()->json(['deletion_scheduled_at' => $user->deletion_requested_at]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->deletion_requested_at, 409, 'No account deletion is pending.');
        $user->update([
            'deletion_requested_at' => null,
            'status' => 'active',
            'status_reason' => null,
            'status_changed_at' => now(),
        ]);

        return response()->json(['cancelled' => true]);
    }
}
