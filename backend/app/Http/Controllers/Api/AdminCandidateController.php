<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\CandidateProfile;
use App\Models\Document;
use App\Services\ActivityFeed;
use App\Services\Notifications;
use App\Services\ProfileCompleteness;
use App\Services\TaskEngagement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminCandidateController extends Controller
{
    public function __construct(private readonly Notifications $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:100'],
            'status' => ['sometimes', 'in:draft,submitted,verified'],
            'account_status' => ['sometimes', 'in:active,inactive,blocked'],
            'city' => ['sometimes', 'string', 'max:100'],
            'education_level' => ['sometimes', 'string', 'max:50'],
            'min_experience' => ['sometimes', 'integer', 'min:0'],
            'availability_status' => ['sometimes', 'in:immediate,within_1_month,within_2_months'],
            'profile_complete' => ['sometimes', 'boolean'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'min_shortlists' => ['sometimes', 'integer', 'min:0'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ]);

        $query = CandidateProfile::query()
            // educations, languages and documents are eager-loaded for
            // ProfileCompleteness, and taskAssignments for TaskEngagement —
            // both of which would otherwise query once per candidate per row.
            ->with([
                'user:id,phone,name,email,status',
                'documents',
                'educations',
                'languages',
                'skills',
                'taskAssignments.task',
                'referralRegistration.referralAgent.user:id,name,phone',
            ])
            ->withCount([
                'shortlistEntries as shortlists_count',
                'shortlistEntries as interviews_count' => fn ($q) => $q->where('stage', 'interviewing'),
                'shortlistEntries as placements_count' => fn ($q) => $q->where('stage', 'placed'),
            ]);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('profession', 'like', $term)
                    ->orWhere('city', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', $term)->orWhere('email', 'like', $term))
                    ->orWhereHas('skills', fn ($s) => $s->where('skill', 'like', $term));
            });
        }

        match ($filters['status'] ?? null) {
            'draft' => $query->whereNull('submitted_at'),
            'submitted' => $query->whereNotNull('submitted_at')->whereNull('verified_at'),
            'verified' => $query->whereNotNull('verified_at'),
            default => null,
        };

        if (! empty($filters['account_status'])) {
            $query->whereHas('user', fn ($u) => $u->where('status', $filters['account_status']));
        }

        if (! empty($filters['city'])) {
            $query->where('city', 'like', '%'.$filters['city'].'%');
        }

        if (! empty($filters['education_level'])) {
            $query->whereHas('educations', fn ($q) => $q->where('level', $filters['education_level']));
        }

        if (isset($filters['min_experience'])) {
            $query->where('years_of_experience', '>=', $filters['min_experience']);
        }

        if (! empty($filters['availability_status'])) {
            $query->where('availability_status', $filters['availability_status']);
        }

        if (array_key_exists('profile_complete', $filters)) {
            // No stored "complete" flag exists — approximated at the query
            // level from the same required sections ProfileCompleteness
            // computes in PHP (see App\Services\ProfileCompleteness::flags),
            // so a filter doesn't have to materialise every row to apply.
            $complete = filter_var($filters['profile_complete'], FILTER_VALIDATE_BOOLEAN);
            $query->when($complete, function ($q) {
                $q->whereNotNull('first_name')->whereNotNull('last_name')->whereNotNull('date_of_birth')
                    ->whereNotNull('availability_status')
                    ->whereNotNull('terms_consent_at')->whereNotNull('cndp_consent_at')
                    ->whereHas('educations')
                    ->whereHas('languages', fn ($q) => $q->whereNotNull('cefr_level'));
            }, function ($q) {
                $q->where(function ($sub) {
                    $sub->whereNull('first_name')->orWhereNull('last_name')->orWhereNull('date_of_birth')
                        ->orWhereNull('availability_status')
                        ->orWhereNull('terms_consent_at')->orWhereNull('cndp_consent_at')
                        ->orWhereDoesntHave('educations')
                        ->orWhereDoesntHave('languages', fn ($q) => $q->whereNotNull('cefr_level'));
                });
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $profiles = $query->latest('updated_at')->paginate($filters['per_page'] ?? 20)->withQueryString();

        if (isset($filters['min_shortlists'])) {
            // withCount + having would need a raw column reference across
            // drivers; filtering the already-paginated collection is simpler
            // for what is expected to be a rarely-used, narrow filter.
            $profiles->setCollection(
                $profiles->getCollection()->filter(fn (CandidateProfile $p) => $p->shortlists_count >= $filters['min_shortlists'])->values(),
            );
        }

        $profiles->getCollection()->transform(fn (CandidateProfile $profile) => [
            'id' => $profile->id,
            'phone' => $profile->user->phone,
            'email' => $profile->user->email,
            'name' => trim("{$profile->first_name} {$profile->last_name}") ?: null,
            'city' => $profile->city,
            'account_status' => $profile->user->status,
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
            'top_skills' => $profile->skills->take(3)->pluck('skill')->all(),
            'shortlists_count' => $profile->shortlists_count,
            'interviews_count' => $profile->interviews_count,
            'placements_count' => $profile->placements_count,
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
            'user:id,name,phone,email,status,status_reason,created_at',
            'educations',
            'languages.certificateDocument',
            'skills',
            'documents.extraction',
            'documents.reviewedBy:id,name,phone',
            'languageAssessments',
            'taskAssignments.task',
            'verifiedBy:id,name,phone',
            'referralRegistration.referralAgent.user:id,name,phone',
            'shortlistEntries.user:id,name,phone',
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

        if (array_key_exists('admin_notes', $data)) {
            AdminActivityLog::record($request->user(), $candidateProfile, 'notes_updated');
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

        $this->notifications->documentReviewed($document);

        return response()->json($document->fresh(['extraction', 'reviewedBy:id,name,phone']));
    }

    /**
     * Activate/deactivate/block a candidate's account. Separate from `update`
     * (dossier judgement) because this is about platform access, enforced
     * server-side by EnsureAccountIsActive and AuthController — not just a
     * label shown in a table.
     */
    public function updateStatus(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,blocked'],
            'status_reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $candidateProfile->loadMissing('user');
        $candidateProfile->user->update([
            'status' => $data['status'],
            'status_reason' => $data['status_reason'] ?? null,
            'status_changed_at' => now(),
            'status_changed_by_id' => $request->user()->id,
        ]);

        AdminActivityLog::record($request->user(), $candidateProfile, 'status_changed', [
            'status' => $data['status'],
            'reason' => $data['status_reason'] ?? null,
        ]);

        return response()->json($candidateProfile->user->fresh());
    }

    /** The derived "Activités"/"Historique" feed — see App\Services\ActivityFeed. */
    public function activity(CandidateProfile $candidateProfile): JsonResponse
    {
        return response()->json(ActivityFeed::forCandidate($candidateProfile));
    }

    /**
     * Activate/deactivate/block/delete/export a batch at once. `export`
     * short-circuits into a CSV stream instead of a JSON summary — same
     * pattern as RecruiterShortlistController::export.
     */
    public function bulk(Request $request): JsonResponse|StreamedResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'action' => ['required', 'in:activate,deactivate,block,delete,export'],
        ]);

        $profiles = CandidateProfile::whereIn('id', $data['ids'])->with('user')->get();

        if ($data['action'] === 'export') {
            return $this->exportCsv($profiles);
        }

        if ($data['action'] === 'delete') {
            foreach ($profiles as $profile) {
                AdminActivityLog::record($request->user(), $profile, 'deleted');
                $profile->delete();
            }

            return response()->json(['updated' => $profiles->count(), 'action' => 'delete']);
        }

        $statusByAction = ['activate' => 'active', 'deactivate' => 'inactive', 'block' => 'blocked'];
        $status = $statusByAction[$data['action']];

        foreach ($profiles as $profile) {
            $profile->user->update([
                'status' => $status,
                'status_changed_at' => now(),
                'status_changed_by_id' => $request->user()->id,
            ]);
            AdminActivityLog::record($request->user(), $profile, 'status_changed', ['status' => $status]);
        }

        return response()->json(['updated' => $profiles->count(), 'action' => $data['action']]);
    }

    /** @param  Collection<int, CandidateProfile>  $profiles */
    private function exportCsv(Collection $profiles): StreamedResponse
    {
        $filename = 'candidats-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($profiles) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Nom', 'Téléphone', 'Email', 'Ville', 'Statut du compte', 'Profil %', 'Inscription']);

            foreach ($profiles as $profile) {
                fputcsv($out, [
                    trim("{$profile->first_name} {$profile->last_name}"),
                    $profile->user->phone,
                    $profile->user->email,
                    $profile->city,
                    $profile->user->status,
                    ProfileCompleteness::for($profile)['percent'],
                    $profile->created_at?->toDateString(),
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Removes the dossier, not the account: `candidateProfile->user` keeps
     * their login, they'd just build a fresh profile if they came back.
     * Documents, educations, languages, assessments, task assignments and
     * shortlist entries all cascade at the database level (see the
     * `cascadeOnDelete` migrations), so nothing here needs to walk them by hand.
     */
    public function destroy(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        AdminActivityLog::record($request->user(), $candidateProfile, 'deleted');
        $candidateProfile->delete();

        return response()->json(status: 204);
    }
}
