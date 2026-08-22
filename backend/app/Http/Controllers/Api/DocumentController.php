<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessDocumentOcr;
use App\Models\Document;
use App\Services\CandidateProfileResolver;
use App\Services\Ocr\ExtractionApplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(private readonly ExtractionApplier $applier) {}

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->documents()->with('extraction')->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:cv,certificate,diploma,identity'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());
        $path = $request->file('file')->store('documents', 'local');

        $document = $profile->documents()->create([
            'type' => $data['type'],
            'file_path' => $path,
            'ocr_status' => 'pending',
        ]);

        // An ID photo has no CV-shaped fields to extract — OCR here would
        // just burn a Gemini call on nothing usable. Admin approval (below)
        // is the real verification step for this type.
        if ($data['type'] !== 'identity') {
            ProcessDocumentOcr::dispatch($document->id);
        }

        return response()->json($document, 201);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        return response()->json($document->load('extraction'));
    }

    /**
     * Candidate confirms (optionally correcting) the OCR-extracted fields —
     * and the confirmed values become their profile. This is the step the
     * pipeline was missing: the review screen used to stamp `reviewed_at` and
     * leave the data sealed in the extraction row.
     *
     * By default only blank profile fields are filled; `overwrite` lets the
     * candidate deliberately replace what they typed with what the document
     * says. Either way the response names what was written and what was left
     * alone, so the app can say so instead of implying everything landed.
     */
    public function review(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        $data = $request->validate([
            'extracted_fields' => ['sometimes', 'array'],
            'apply' => ['sometimes', 'boolean'],
            'overwrite' => ['sometimes', 'boolean'],
        ]);

        $extraction = $document->extraction;
        abort_unless($extraction, 404);

        $extraction->update([
            'extracted_fields' => $data['extracted_fields'] ?? $extraction->extracted_fields,
            'reviewed_at' => now(),
        ]);

        $result = ($data['apply'] ?? true)
            ? $this->applier->apply($document->fresh('extraction'), $data['overwrite'] ?? false)
            : ['applied' => [], 'skipped' => []];

        return response()->json($document->fresh('extraction')->toArray() + ['profile_update' => $result]);
    }

    /**
     * Run the pipeline again over the same file. The reason a document failed
     * is usually the API having a bad minute, not the page being unreadable,
     * and a candidate who has to re-photograph a perfectly good CV to get
     * past that is being asked to fix someone else's problem.
     */
    public function retry(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        // Queueing a second pass over a document already in flight would race
        // the first one to write the extraction row.
        abort_if(in_array($document->ocr_status, ['pending', 'processing'], true), 409, 'Already being scanned.');

        $document->update(['ocr_status' => 'pending']);
        ProcessDocumentOcr::dispatch($document->id);

        return response()->json($document->fresh('extraction'));
    }

    /**
     * Replace the file — the answer when the page genuinely was unreadable.
     * The document keeps its id so anything pointing at it (a language
     * certificate, for one) still points at the right thing.
     */
    public function rescan(Request $request, Document $document): JsonResponse
    {
        $this->authorizeOwnership($request, $document);

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $previous = $document->file_path;

        $document->update([
            'file_path' => $request->file('file')->store('documents', 'local'),
            'ocr_status' => 'pending',
        ]);

        if ($previous && $previous !== $document->file_path) {
            Storage::disk('local')->delete($previous);
        }

        ProcessDocumentOcr::dispatch($document->id);

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
