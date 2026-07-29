<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateLanguageController extends Controller
{
    private const LANGUAGES = ['fr', 'ar', 'en', 'de'];
    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->languages);
    }

    /** Upsert a single language's self-declared CEFR level (one row per language, per candidate). */
    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'language' => ['required', 'in:'.implode(',', self::LANGUAGES)],
            'cefr_level' => ['nullable', 'in:'.implode(',', self::LEVELS)],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        $language = $profile->languages()->updateOrCreate(
            ['language' => $data['language']],
            ['cefr_level' => $data['cefr_level'] ?? null, 'source' => 'self_declared'],
        );

        return response()->json($language);
    }
}
