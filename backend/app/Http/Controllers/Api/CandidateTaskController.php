<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskAssignment;
use App\Services\CandidateProfileResolver;
use App\Services\TaskEngagement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The candidate's half of the daily internship: what is due today, what was
 * missed, and marking work done.
 */
class CandidateTaskController extends Controller
{
    /** How far back the "catch up" list reaches before it stops nagging. */
    private const BACKLOG_DAYS = 14;

    public function index(Request $request): JsonResponse
    {
        $profile = CandidateProfileResolver::resolve($request->user());

        $assignments = $profile->taskAssignments()
            ->with('task')
            ->where('assigned_for', '>=', today()->subDays(self::BACKLOG_DAYS))
            ->orderBy('assigned_for')
            ->get();

        return response()->json([
            'today' => $assignments->filter(fn ($a) => $a->assigned_for->isToday())->values(),
            // Still open and the day has gone. Bounded, because a list of
            // sixty missed activities is a reason to give up, not to start.
            'overdue' => $assignments->filter(fn ($a) => $a->is_overdue)->values(),
            'upcoming' => $assignments->filter(fn ($a) => $a->assigned_for->isFuture())->values(),
            'recently_completed' => $assignments
                ->where('status', 'completed')
                ->sortByDesc('completed_at')
                ->take(5)
                ->values(),
            // Loaded above, so this costs nothing extra.
            'engagement' => TaskEngagement::fromAssignments($profile->taskAssignments()->with('task')->get()),
        ]);
    }

    /**
     * Mark an activity done (or deliberately skipped), with how long it really
     * took — the number that tells an administrator whether the estimates are
     * honest, and the candidate that the hour is being counted.
     */
    public function update(Request $request, TaskAssignment $assignment): JsonResponse
    {
        abort_unless(
            $assignment->candidate_profile_id === $request->user()->candidateProfile?->id,
            403,
        );

        $data = $request->validate([
            // The candidate cannot mark their own work `skipped` on someone
            // else's behalf beyond this; an administrator owns the rest.
            'status' => ['required', 'in:assigned,completed,skipped'],
            'minutes_spent' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:480'],
            'candidate_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $assignment->fill($data);

        // Re-opening something ticked by mistake has to clear the timestamp,
        // or it stays in the streak forever.
        $assignment->completed_at = $data['status'] === 'completed'
            ? ($assignment->completed_at ?? now())
            : null;

        $assignment->save();

        return response()->json($assignment->fresh('task'));
    }
}
