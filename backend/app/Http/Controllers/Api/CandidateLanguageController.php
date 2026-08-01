<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessDocumentOcr;
use App\Models\CandidateProfile;
use App\Models\Document;
use App\Services\CandidateProfileResolver;
use App\Services\LanguageAssessment\LanguageLevelReconciler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CandidateLanguageController extends Controller
{
    private const LANGUAGES = ['fr', 'ar', 'en', 'de'];

    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    /** Document types that can stand as proof of a language level. */
    private const CERTIFICATE_TYPES = ['certificate', 'diploma'];

    public function __construct(private readonly LanguageLevelReconciler $reconciler) {}

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        return response()->json($profile->languages()->with('certificateDocument')->get());
    }

    /** Upsert a single language's declared CEFR level (one row per language, per candidate). */
    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'language' => ['required', 'in:'.implode(',', self::LANGUAGES)],
            'cefr_level' => ['nullable', 'in:'.implode(',', self::LEVELS)],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        $language = $profile->languages()->firstOrNew(['language' => $data['language']]);

        // Editing the declared level must not silently demote a language that
        // already has a certificate or an assessment behind it. The precedence
        // rule lives in one place for both write paths.
        $this->reconciler->applyDeclaration($language, $data['cefr_level'] ?? null);

        return response()->json($language->load('certificateDocument'));
    }

    /**
     * Attach proof for a language: either a document already uploaded on the
     * Documents screen (`document_id`) or a file picked inline here (`file`).
     * This is the only path that can produce a `certified` language.
     */
    public function attachCertificate(Request $request, string $language): JsonResponse
    {
        $this->assertKnownLanguage($language);

        $data = $request->validate([
            'document_id' => ['required_without:file', 'integer'],
            'file' => ['required_without:document_id', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'cefr_level' => ['sometimes', 'nullable', 'in:'.implode(',', self::LEVELS)],
        ]);

        $profile = CandidateProfileResolver::resolve($request->user());

        $document = $request->hasFile('file')
            ? $this->storeUploadedCertificate($request, $profile)
            : $this->existingCertificate($profile, $data['document_id']);

        $row = $profile->languages()->firstOrNew(['language' => $language]);
        if (array_key_exists('cefr_level', $data)) {
            $row->cefr_level = $data['cefr_level'];
            // Recorded as the candidate's own claim too, so detaching the
            // certificate later leaves the level they stated intact.
            $row->self_declared_cefr = $data['cefr_level'];
        }
        $row->certificate_document_id = $document->id;
        $row->source = 'certified';
        $row->save();

        return response()->json($row->load('certificateDocument'), $row->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Detach the proof. The declared level survives — the candidate said they
     * speak B2 whether or not a certificate is on file — but the row drops back
     * to self-declared. The document itself stays in Documents.
     */
    public function detachCertificate(Request $request, string $language): JsonResponse
    {
        $this->assertKnownLanguage($language);

        $profile = CandidateProfileResolver::resolve($request->user());
        $row = $profile->languages()->where('language', $language)->firstOrFail();

        $row->certificate_document_id = null;
        // Drops back to whichever of the declared level and the assessment is
        // higher — the same rule every other write path uses.
        $this->reconciler->applyDeclaration($row, $row->self_declared_cefr ?? $row->cefr_level);

        return response()->json($row->load('certificateDocument'));
    }

    private function assertKnownLanguage(string $language): void
    {
        abort_unless(in_array($language, self::LANGUAGES, true), 404);
    }

    private function storeUploadedCertificate(Request $request, CandidateProfile $profile): Document
    {
        $document = $profile->documents()->create([
            'type' => 'certificate',
            'file_path' => $request->file('file')->store('documents', 'public'),
            'ocr_status' => 'pending',
        ]);

        ProcessDocumentOcr::dispatch($document->id);

        return $document;
    }

    private function existingCertificate(CandidateProfile $profile, int $documentId): Document
    {
        $document = $profile->documents()->find($documentId);

        // A 404 here would leak whether the id exists on someone else's dossier;
        // as a validation failure it is indistinguishable from a bad id.
        if (! $document || ! in_array($document->type, self::CERTIFICATE_TYPES, true)) {
            throw ValidationException::withMessages([
                'document_id' => 'Select a certificate or diploma you have uploaded.',
            ]);
        }

        return $document;
    }
}
