<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use App\Services\ActivityFeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Mirrors AdminCandidateController's shape. There is no separate "Recruiter"
 * model: a recruiter is a User with the "Company" role, and its company
 * details live in the one-to-one CompanyProfile — see [[company_profiles]]
 * migration and the plan this was built from for why (no job-board layer
 * exists in this product; recruiters work a shortlist pipeline, not job
 * postings).
 */
class AdminRecruiterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'sector' => ['sometimes', 'string', 'max:100'],
            'account_status' => ['sometimes', 'in:active,inactive,blocked'],
            'verified' => ['sometimes', 'boolean'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ]);

        $query = User::role('Company')
            ->with('companyProfile')
            ->withCount([
                'shortlist as shortlists_count',
                'shortlist as interviewing_count' => fn ($q) => $q->where('stage', 'interviewing'),
                'shortlist as placed_count' => fn ($q) => $q->where('stage', 'placed'),
            ])
            ->withMax('shortlist', 'updated_at');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhereHas('companyProfile', fn ($c) => $c->where('company_name', 'like', $term));
            });
        }

        if (! empty($filters['city'])) {
            $query->whereHas('companyProfile', fn ($c) => $c->where('city', 'like', '%'.$filters['city'].'%'));
        }

        if (! empty($filters['sector'])) {
            $query->whereHas('companyProfile', fn ($c) => $c->where('sector', $filters['sector']));
        }

        if (! empty($filters['account_status'])) {
            $query->where('status', $filters['account_status']);
        }

        if (array_key_exists('verified', $filters)) {
            $verified = filter_var($filters['verified'], FILTER_VALIDATE_BOOLEAN);
            $query->whereHas('companyProfile', fn ($c) => $verified ? $c->whereNotNull('verified_at') : $c->whereNull('verified_at'));
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $recruiters = $query->latest('created_at')->paginate($filters['per_page'] ?? 20)->withQueryString();

        $recruiters->getCollection()->transform(fn (User $recruiter) => [
            'id' => $recruiter->id,
            'name' => $recruiter->name,
            'phone' => $recruiter->phone,
            'email' => $recruiter->email,
            'account_status' => $recruiter->status,
            'company_name' => $recruiter->companyProfile?->company_name,
            'sector' => $recruiter->companyProfile?->sector,
            'city' => $recruiter->companyProfile?->city,
            'verified_at' => $recruiter->companyProfile?->verified_at?->toJSON(),
            'shortlists_count' => $recruiter->shortlists_count,
            'interviewing_count' => $recruiter->interviewing_count,
            'placed_count' => $recruiter->placed_count,
            'last_activity_at' => $recruiter->shortlist_max_updated_at,
            'created_at' => $recruiter->created_at?->toJSON(),
        ]);

        return response()->json($recruiters);
    }

    public function show(User $recruiter): JsonResponse
    {
        abort_unless($recruiter->hasRole('Company'), 404);

        $recruiter->load([
            'companyProfile.verifiedBy:id,name,phone',
            'shortlist.candidateProfile:id,first_name,last_name,profession,city',
        ]);

        return response()->json([
            'id' => $recruiter->id,
            'name' => $recruiter->name,
            'phone' => $recruiter->phone,
            'email' => $recruiter->email,
            'status' => $recruiter->status,
            'status_reason' => $recruiter->status_reason,
            'created_at' => $recruiter->created_at?->toJSON(),
            'company' => $recruiter->companyProfile,
            'shortlist' => $recruiter->shortlist,
        ]);
    }

    /** Company profile fields — created on first edit, since none exists at signup. */
    public function update(Request $request, User $recruiter): JsonResponse
    {
        abort_unless($recruiter->hasRole('Company'), 404);

        $data = $request->validate([
            'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sector' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'website' => ['sometimes', 'nullable', 'string', 'max:255'],
            'employees_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        $profile = $recruiter->companyProfile()->firstOrNew();
        $profile->fill($data);
        $profile->user_id = $recruiter->id;
        $profile->save();

        return response()->json($profile->fresh());
    }

    /** Activate/deactivate/block — same server-side enforcement as candidates. */
    public function updateStatus(Request $request, User $recruiter): JsonResponse
    {
        abort_unless($recruiter->hasRole('Company'), 404);

        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,blocked'],
            'status_reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $recruiter->update([
            'status' => $data['status'],
            'status_reason' => $data['status_reason'] ?? null,
            'status_changed_at' => now(),
            'status_changed_by_id' => $request->user()->id,
        ]);

        AdminActivityLog::record($request->user(), $recruiter, 'status_changed', [
            'status' => $data['status'],
            'reason' => $data['status_reason'] ?? null,
        ]);

        return response()->json($recruiter->fresh());
    }

    /** Distinct from `status`: verification is a judgement on the company, not account access. */
    public function verify(Request $request, User $recruiter): JsonResponse
    {
        abort_unless($recruiter->hasRole('Company'), 404);

        $data = $request->validate(['verified' => ['required', 'boolean']]);
        $verified = filter_var($data['verified'], FILTER_VALIDATE_BOOLEAN);

        $profile = $recruiter->companyProfile()->firstOrNew();
        $profile->user_id = $recruiter->id;
        $profile->verified_at = $verified ? now() : null;
        $profile->verified_by_id = $verified ? $request->user()->id : null;
        $profile->save();

        AdminActivityLog::record($request->user(), $recruiter, $verified ? 'verified' : 'verification_removed');

        return response()->json($profile->fresh());
    }

    /** The derived "Activités"/"Historique" feed — see App\Services\ActivityFeed. */
    public function activity(User $recruiter): JsonResponse
    {
        abort_unless($recruiter->hasRole('Company'), 404);

        return response()->json(ActivityFeed::forRecruiter($recruiter));
    }

    public function bulk(Request $request): JsonResponse|StreamedResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'action' => ['required', 'in:activate,deactivate,block,delete,export'],
        ]);

        $recruiters = User::role('Company')->whereIn('id', $data['ids'])->with('companyProfile')->get();

        if ($data['action'] === 'export') {
            return $this->exportCsv($recruiters);
        }

        if ($data['action'] === 'delete') {
            foreach ($recruiters as $recruiter) {
                AdminActivityLog::record($request->user(), $recruiter, 'deleted');
                $recruiter->companyProfile?->delete();
            }

            return response()->json(['updated' => $recruiters->count(), 'action' => 'delete']);
        }

        $statusByAction = ['activate' => 'active', 'deactivate' => 'inactive', 'block' => 'blocked'];
        $status = $statusByAction[$data['action']];

        foreach ($recruiters as $recruiter) {
            $recruiter->update([
                'status' => $status,
                'status_changed_at' => now(),
                'status_changed_by_id' => $request->user()->id,
            ]);
            AdminActivityLog::record($request->user(), $recruiter, 'status_changed', ['status' => $status]);
        }

        return response()->json(['updated' => $recruiters->count(), 'action' => $data['action']]);
    }

    /** @param  Collection<int, User>  $recruiters */
    private function exportCsv(Collection $recruiters): StreamedResponse
    {
        $filename = 'recruteurs-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($recruiters) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Nom', 'Téléphone', 'Email', 'Entreprise', 'Secteur', 'Ville', 'Statut du compte', 'Vérifié', 'Inscription']);

            foreach ($recruiters as $recruiter) {
                fputcsv($out, [
                    $recruiter->name,
                    $recruiter->phone,
                    $recruiter->email,
                    $recruiter->companyProfile?->company_name,
                    $recruiter->companyProfile?->sector,
                    $recruiter->companyProfile?->city,
                    $recruiter->status,
                    $recruiter->companyProfile?->verified_at ? 'oui' : 'non',
                    $recruiter->created_at?->toDateString(),
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Removes the company profile, not the account — same reasoning as
     * AdminCandidateController::destroy: the recruiter keeps their login and
     * their shortlist, they'd just have an empty company page again.
     */
    public function destroy(Request $request, User $recruiter): JsonResponse
    {
        abort_unless($recruiter->hasRole('Company'), 404);

        AdminActivityLog::record($request->user(), $recruiter, 'deleted');
        $recruiter->companyProfile?->delete();

        return response()->json(status: 204);
    }
}
