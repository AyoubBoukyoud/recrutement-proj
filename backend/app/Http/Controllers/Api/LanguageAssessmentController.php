<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessLanguageAssessment;
use App\Models\LanguageAssessment;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LanguageAssessmentController extends Controller
{
    private const LANGUAGES = ['fr', 'ar', 'en', 'de'];

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->languageAssessments()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'language' => ['required', 'in:'.implode(',', self::LANGUAGES)],
            'audio' => ['required', 'file', 'mimes:wav,mp3,m4a,mp4,webm,aac,caf', 'max:20480'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());
        $path = $request->file('audio')->store('assessments', 'local');

        $assessment = $profile->languageAssessments()->create([
            'language' => $data['language'],
            'audio_path' => $path,
            'status' => 'pending',
        ]);

        ProcessLanguageAssessment::dispatch($assessment->id);

        return response()->json($assessment, 201);
    }

    public function show(Request $request, LanguageAssessment $languageAssessment): JsonResponse
    {
        abort_unless(
            $languageAssessment->candidate_profile_id === $request->user()->candidateProfile?->id,
            403,
        );

        return response()->json($languageAssessment);
    }
}
