<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\Document;
use App\Services\ProfileCompleteness;
use App\Services\TaskEngagement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCandidateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:100'],
            'status' => ['sometimes', 'in:draft,submitted,verified'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ]);

        $query = CandidateProfile::query()
            // educations, languages and documents are eager-loaded for
            // ProfileCompleteness, and taskAssignments for TaskEngagement —
            // both of which would otherwise query once per candidate per row.
            ->with([
                'user:id,phone,name',
                'documents',
                'educations',
                'languages',
                'taskAssignments.task',
                'referralRegistration.referralAgent.user:id,name,phone',
            ]);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('profession', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', $term));
            });
        }

        match ($filters['status'] ?? null) {
            'draft' => $query->whereNull('submitted_at'),
            'submitted' => $query->whereNotNull('submitted_at')->whereNull('verified_at'),
            'verified' => $query->whereNotNull('verified_at'),
            default => null,
        };

        $profiles = $query->latest('updated_at')->paginate($filters['per_page'] ?? 20)->withQueryString();

        $profiles->getCollection()->transform(fn (CandidateProfile $profile) => [
            'id' => $profile->id,
            'phone' => $profile->user->phone,
            'name' => trim("{$profile->first_name} {$profile->last_name}") ?: null,
            'availability_status' => $profile->availability_status,
            'referred_by' => $profile->referralRegistration?->referralAgent?->user?->name
                ?? $profile->referralRegistration?->referralAgent?->user?->phone,
            'submitted_at' => $profile->submitted_at?->toJSON(),
            'verified_at' => $profile->verified_at?->toJSON(),
            'completion_percent' => ProfileCompleteness::for($profile)['percent'],
            'checklist' => ProfileCompleteness::adminChecklist($profile),
            'documents_awaiting_approval' => $profile->documents
                ->where('approval_status', 'pending')->count(),
            'engagement' => TaskEngagement::for($profile),
        ]);

        return response()->json($profiles);
    }

    /**
     * The whole dossier. An administrator could previously see a checklist row
     * and had no way to open what it was describing — which made every
     * follow-up conversation guesswork.
     */
    public function show(CandidateProfile $candidateProfile): JsonResponse
    {
        $candidateProfile->load([
            'user:id,name,phone,created_at',
            'educations',
            'languages.certificateDocument',
            'documents.extraction',
            'documents.reviewedBy:id,name,phone',
            'languageAssessments',
            'taskAssignments.task',
            'verifiedBy:id,name,phone',
            'referralRegistration.referralAgent.user:id,name,phone',
        ]);

        return response()->json($candidateProfile->toArray() + [
            'completeness' => ProfileCompleteness::for($candidateProfile),
            'checklist' => ProfileCompleteness::adminChecklist($candidateProfile),
            'engagement' => TaskEngagement::for($candidateProfile),
        ]);
    }

    /**
     * The administrator's own judgement on the dossier, which the checklist
     * deliberately is not: the checklist reports what exists, this records
     * that a person looked at it.
     */
    public function update(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        $data = $request->validate([
            'verified' => ['sometimes', 'boolean'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        if (array_key_exists('verified', $data)) {
            $verified = filter_var($data['verified'], FILTER_VALIDATE_BOOLEAN);
            $data['verified_at'] = $verified ? now() : null;
            $data['verified_by_id'] = $verified ? $request->user()->id : null;
            unset($data['verified']);
        }

        $candidateProfile->update($data);

        return response()->json($candidateProfile->fresh('verifiedBy:id,name,phone'));
    }

    /**
     * Accept or reject a document. Separate from `ocr_status`, which is about
     * our scanner: a legible photograph of the wrong diploma scans perfectly
     * and is still not acceptable.
     */
    public function reviewDocument(Request $request, Document $document): JsonResponse
    {
        $data = $request->validate([
            'approval_status' => ['required', 'in:pending,approved,rejected'],
            // Mandatory on rejection — "rejected" with no reason gives the
            // candidate nothing to act on.
            'rejection_reason' => ['required_if:approval_status,rejected', 'nullable', 'string', 'max:2000'],
        ]);

        $document->update([
            'approval_status' => $data['approval_status'],
            'rejection_reason' => $data['approval_status'] === 'rejected' ? $data['rejection_reason'] : null,
            'reviewed_by_id' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json($document->fresh(['extraction', 'reviewedBy:id,name,phone']));
    }

    /**
     * Removes the dossier, not the account: `candidateProfile->user` keeps
     * their login, they'd just build a fresh profile if they came back.
     * Documents, educations, languages, assessments, task assignments and
     * shortlist entries all cascade at the database level (see the
     * `cascadeOnDelete` migrations), so nothing here needs to walk them by hand.
     */
    public function destroy(CandidateProfile $candidateProfile): JsonResponse
    {
        $candidateProfile->delete();

        return response()->json(status: 204);
    }
}
