<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessDocumentOcr;
use App\Models\Document;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->documents()->with('extraction')->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:cv,certificate,diploma'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());
        $path = $request->file('file')->store('documents', 'public');

        $document = $profile->documents()->create([
            'type' => $data['type'],
            'file_path' => $path,
            'ocr_status' => 'pending',
        ]);

        ProcessDocumentOcr::dispatch($document->id);

        return response()->json($document, 201);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        return response()->json($document->load('extraction'));
    }

    /** Candidate confirms (optionally correcting) the OCR-extracted fields. */
    public function review(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        $data = $request->validate([
            'extracted_fields' => ['sometimes', 'array'],
        ]);

        $extraction = $document->extraction;
        abort_unless($extraction, 404);

        $extraction->update([
            'extracted_fields' => $data['extracted_fields'] ?? $extraction->extracted_fields,
            'reviewed_at' => now(),
        ]);

        return response()->json($document->fresh('extraction'));
    }

    private function authorizeOwnership(Request $request, Document $document): void
    {
        abort_unless(
            $document->candidate_profile_id === $request->user()->candidateProfile?->id,
            403,
        );
    }
}
