<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\RecruiterShortlist;
use App\Services\RecruiterProfileView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * What a recruiter can actually *do* with a candidate: save them, track where
 * the conversation has got to, keep notes, take the contact details, and pull
 * the list out as a spreadsheet.
 *
 * Without this the dossier was a dead end — which is fatal to a
 * commission-on-placement model, where the placement is the product and the
 * platform has to be able to see one happening.
 */
class RecruiterShortlistController extends Controller
{
    /** The recruiter's own list. */
    public function index(Request $request): JsonResponse
    {
        $entries = RecruiterShortlist::where('user_id', $request->user()->id)
            ->with(['candidateProfile.languages', 'candidateProfile.user:id,phone,email'])
            ->latest('updated_at')
            ->paginate((int) $request->integer('per_page', 20));

        $entries->getCollection()->transform(fn (RecruiterShortlist $entry) => $this->present($entry));

        return response()->json($entries);
    }

    /** Save a candidate, or update the stage and notes on one already saved. */
    public function upsert(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        abort_unless(RecruiterProfileView::isVisible($candidateProfile), 404);

        $data = $request->validate([
            'stage' => ['sometimes', 'in:'.implode(',', RecruiterShortlist::STAGES)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $entry = RecruiterShortlist::firstOrNew([
            'user_id' => $request->user()->id,
            'candidate_profile_id' => $candidateProfile->id,
        ]);

        $wasNew = ! $entry->exists;
        $entry->fill($data)->save();

        return response()->json(
            $this->present($entry->load(['candidateProfile.languages', 'candidateProfile.user:id,phone,email'])),
            $wasNew ? 201 : 200,
        );
    }

    /**
     * Drop a candidate from the list. The notes go with it — they were this
     * recruiter's working memory, not a record about the candidate.
     */
    public function destroy(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        RecruiterShortlist::where('user_id', $request->user()->id)
            ->where('candidate_profile_id', $candidateProfile->id)
            ->delete();

        return response()->json(['message' => 'Removed from shortlist.']);
    }

    /**
     * Release the candidate's phone number and email to this recruiter.
     *
     * Deliberately an action rather than a field on the dossier. The platform
     * collects explicit CNDP consent, so a disclosure has to be attributable:
     * the timestamp says which recruiter took the details and when, and the
     * candidate is saved to that recruiter's list as a side effect, because
     * taking someone's number is exactly the point where they enter a pipeline.
     */
    public function revealContact(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        abort_unless(RecruiterProfileView::isVisible($candidateProfile), 404);

        $entry = RecruiterShortlist::firstOrNew([
            'user_id' => $request->user()->id,
            'candidate_profile_id' => $candidateProfile->id,
        ]);

        // Kept at the first disclosure: re-opening the dossier is not a new
        // disclosure, and overwriting it would erase when contact began.
        if (! $entry->contact_revealed_at) {
            $entry->contact_revealed_at = Carbon::now();
            if (! $entry->exists) {
                $entry->stage = 'saved';
            }
            $entry->save();

            Log::info('Recruiter took a candidate\'s contact details.', [
                'recruiter_id' => $request->user()->id,
                'candidate_profile_id' => $candidateProfile->id,
            ]);
        }

        $candidateProfile->loadMissing('user:id,phone,email');

        return response()->json([
            'contact' => [
                'phone' => $candidateProfile->user?->phone,
                'email' => $candidateProfile->user?->email,
                'revealed_at' => $entry->contact_revealed_at,
            ],
            'shortlist' => $entry,
        ]);
    }

    /**
     * The shortlist as CSV — the format a recruiter can hand to a colleague or
     * open next to their own applicant tracking spreadsheet. Contact columns
     * are filled only for candidates whose details were actually released.
     */
    public function export(Request $request): StreamedResponse
    {
        $entries = RecruiterShortlist::where('user_id', $request->user()->id)
            ->with(['candidateProfile.languages', 'candidateProfile.user:id,phone,email'])
            ->latest('updated_at')
            ->get();

        $filename = 'shortlist-'.Carbon::now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($entries) {
            $handle = fopen('php://output', 'wb');

            fputcsv($handle, [
                'Candidate', 'Profession', 'Specialisation', 'Years of experience',
                'Availability', 'Languages', 'Stage', 'Phone', 'Email', 'Contact taken', 'Notes',
            ]);

            foreach ($entries as $entry) {
                $profile = $entry->candidateProfile;
                if (! $profile) {
                    continue;
                }

                fputcsv($handle, [
                    trim("{$profile->first_name} {$profile->last_name}"),
                    $profile->profession,
                    $profile->specialization,
                    $profile->years_of_experience,
                    $profile->availability_status,
                    $profile->languages
                        ->map(fn ($l) => strtoupper($l->language).' '.($l->cefr_level ?? '—'))
                        ->implode(', '),
                    $entry->stage,
                    $entry->contact_revealed_at ? $profile->user?->phone : '',
                    $entry->contact_revealed_at ? $profile->user?->email : '',
                    $entry->contact_revealed_at?->toDateString() ?? '',
                    // Newlines inside a CSV cell survive quoting, but they make
                    // the file unreadable in half the tools that open it.
                    str_replace(["\r\n", "\n"], ' ', (string) $entry->notes),
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /** @return array<string, mixed> */
    private function present(RecruiterShortlist $entry): array
    {
        $profile = $entry->candidateProfile;

        return [
            'id' => $entry->id,
            'candidate_profile_id' => $entry->candidate_profile_id,
            'stage' => $entry->stage,
            'notes' => $entry->notes,
            'contact_revealed_at' => $entry->contact_revealed_at,
            'updated_at' => $entry->updated_at,
            'candidate' => $profile ? [
                'id' => $profile->id,
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'profession' => $profile->profession,
                'specialization' => $profile->specialization,
                'years_of_experience' => $profile->years_of_experience,
                'availability_status' => $profile->availability_status,
                'languages' => $profile->languages,
            ] : null,
            'contact' => $entry->contact_revealed_at ? [
                'phone' => $profile?->user?->phone,
                'email' => $profile?->user?->email,
            ] : null,
        ];
    }
}
