<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobOffer;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Candidate-owned saved offers. */
class CandidateFavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json(
            $profile->favoriteOffers()
                ->where('status', 'published')
                ->latest('job_offer_favorites.created_at')
                ->paginate(min(100, max(1, $request->integer('per_page', 20))))
        );
    }

    public function store(Request $request, JobOffer $offer): JsonResponse
    {
        abort_unless($offer->status === 'published', 404);
        $profile = CandidateProfileResolver::resolve($request->user());
        $profile->favoriteOffers()->syncWithoutDetaching([$offer->id]);

        return response()->json(['favorited' => true], 201);
    }

    public function destroy(Request $request, JobOffer $offer): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());
        $profile->favoriteOffers()->detach($offer->id);

        return response()->json([], 204);
    }
}
