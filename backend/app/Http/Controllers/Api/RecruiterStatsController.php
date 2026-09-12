<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\RecruiterShortlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "My stats" — nothing like this existed for a single recruiter before
 * (only `AdminMetricsController`, platform-wide and admin-only). Every
 * number here is derived on read from tables that already exist; nothing new
 * is stored.
 */
class RecruiterStatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['days' => ['sometimes', 'integer', 'min:1', 'max:365']]);
        $days = $data['days'] ?? 30;
        $userId = $request->user()->id;
        $since = now()->subDays($days - 1)->startOfDay();

        $offers = JobOffer::where('user_id', $userId)->get(['id', 'title', 'status']);
        $offerIds = $offers->pluck('id');

        $applications = JobApplication::whereIn('job_offer_id', $offerIds)
            ->with('candidateProfile:id,city,profession')
            ->get(['id', 'job_offer_id', 'candidate_profile_id', 'status', 'applied_at', 'status_changed_at']);

        $applicationsInRange = $applications->where('applied_at', '>=', $since);
        $accepted = $applications->where('status', 'accepted');
        $interviewsCount = Interview::whereIn('job_application_id', $applications->pluck('id'))->count();
        $finalistes = RecruiterShortlist::where('user_id', $userId)->whereIn('stage', ['interviewing', 'placed'])->count();

        $avgDelayDays = $accepted->isEmpty() ? null : round(
            $accepted->avg(fn (JobApplication $a) => $a->status_changed_at?->diffInDays($a->applied_at) ?? 0),
            1,
        );

        $evolution = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $since->copy()->addDays($i);
            $evolution[] = [
                'date' => $day->toDateString(),
                'value' => $applicationsInRange->filter(fn (JobApplication $a) => $a->applied_at->isSameDay($day))->count(),
            ];
        }

        $byOffer = $offers->map(fn (JobOffer $o) => [
            'label' => $o->title,
            'value' => $applications->where('job_offer_id', $o->id)->count(),
        ])->sortByDesc('value')->values();

        $byCity = $applications->groupBy(fn (JobApplication $a) => $a->candidateProfile?->city ?: 'Non renseignée')
            ->map(fn ($group, $city) => ['label' => $city, 'value' => $group->count()])
            ->sortByDesc('value')->values();

        $byProfession = $applications->groupBy(fn (JobApplication $a) => $a->candidateProfile?->profession ?: 'Non renseigné')
            ->map(fn ($group, $profession) => ['label' => $profession, 'value' => $group->count()])
            ->sortByDesc('value')->values()->take(8);

        return response()->json([
            'kpis' => [
                'offres_actives' => $offers->where('status', 'published')->count(),
                'candidatures' => $applicationsInRange->count(),
                'preselectionnes' => $applicationsInRange->whereIn('status', ['viewed', 'interview', 'accepted'])->count(),
                'entretiens' => $interviewsCount,
                'finalistes' => $finalistes,
                'recrutements' => $accepted->count(),
                'delai_moyen_jours' => $avgDelayDays,
            ],
            'funnel' => [
                ['label' => 'Candidatures', 'value' => $applications->count()],
                ['label' => 'Vues', 'value' => $applications->whereIn('status', ['viewed', 'interview', 'accepted'])->count()],
                ['label' => 'Entretiens', 'value' => $applications->whereIn('status', ['interview', 'accepted'])->count()],
                ['label' => 'Recrutements', 'value' => $accepted->count()],
            ],
            'evolution_candidatures' => $evolution,
            'candidatures_par_offre' => $byOffer,
            'candidats_par_ville' => $byCity,
            'top_postes_recherches' => $byProfession,
        ]);
    }
}
