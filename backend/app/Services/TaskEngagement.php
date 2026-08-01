<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\TaskAssignment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * "Is this candidate keeping up?" — the question the daily internship exists
 * to answer, in one shape used by the admin dashboard, the candidate's own
 * progress strip and the metrics rollup.
 *
 * Deliberately measures *assigned* work, not raw activity: a candidate nobody
 * has assigned anything to is not disengaged, and showing them as 0% would
 * blame them for an administrator's omission.
 */
class TaskEngagement
{
    /** The spec's "~1 hour per day". */
    public const DAILY_MINUTES_TARGET = 60;

    /** How far back the rolling figures look. */
    private const WINDOW_DAYS = 7;

    /**
     * @return array{
     *     assigned: int,
     *     completed: int,
     *     completion_rate: int|null,
     *     overdue: int,
     *     minutes_last_7_days: int,
     *     daily_target_minutes: int,
     *     streak_days: int,
     *     active_today: bool,
     *     last_activity_on: string|null,
     * }
     */
    public static function for(CandidateProfile $profile): array
    {
        $assignments = $profile->relationLoaded('taskAssignments')
            ? $profile->taskAssignments
            : $profile->taskAssignments()->get();

        return self::fromAssignments($assignments);
    }

    /**
     * @param  Collection<int, TaskAssignment>  $assignments
     * @return array<string, mixed>
     */
    public static function fromAssignments(Collection $assignments): array
    {
        $assigned = $assignments->count();
        $completed = $assignments->where('status', 'completed')->count();
        $windowStart = today()->subDays(self::WINDOW_DAYS - 1);

        $recentlyCompleted = $assignments
            ->where('status', 'completed')
            ->filter(fn (TaskAssignment $a) => $a->completed_at?->gte($windowStart->copy()->startOfDay()));

        // `assigned_for` is the day the work belonged to; `completed_at` is when
        // it was actually done. A streak is about turning up, so it counts the
        // latter — finishing three days of backlog in one sitting is one day of
        // engagement, not three.
        $activeDays = $assignments
            ->where('status', 'completed')
            ->map(fn (TaskAssignment $a) => $a->completed_at?->toDateString())
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return [
            'assigned' => $assigned,
            'completed' => $completed,
            // Null rather than 0 when nothing was ever assigned: "no data" and
            // "did none of it" must not render as the same thing.
            'completion_rate' => $assigned === 0 ? null : (int) round($completed / $assigned * 100),
            'overdue' => $assignments->filter(fn (TaskAssignment $a) => $a->is_overdue)->count(),
            'minutes_last_7_days' => (int) $recentlyCompleted->sum(
                fn (TaskAssignment $a) => $a->minutes_spent ?? $a->task?->estimated_minutes ?? 0,
            ),
            'daily_target_minutes' => self::DAILY_MINUTES_TARGET,
            'streak_days' => self::streak($activeDays),
            'active_today' => $activeDays->contains(today()->toDateString()),
            'last_activity_on' => $activeDays->last(),
        ];
    }

    /**
     * Consecutive days ending today or yesterday.
     *
     * Yesterday still counts: a candidate who did their hour last night and
     * has not started this morning has not broken anything, and resetting the
     * count at midnight would punish them for the time of day they opened the
     * app.
     *
     * @param  Collection<int, string>  $activeDays  ascending Y-m-d
     */
    private static function streak(Collection $activeDays): int
    {
        if ($activeDays->isEmpty()) {
            return 0;
        }

        $days = $activeDays->reverse()->values();
        $last = Carbon::parse($days->first());

        if ($last->diffInDays(today()) > 1) {
            return 0;
        }

        $streak = 1;
        $cursor = $last;

        foreach ($days->skip(1) as $day) {
            $date = Carbon::parse($day);
            if ($cursor->copy()->subDay()->isSameDay($date)) {
                $streak++;
                $cursor = $date;

                continue;
            }
            break;
        }

        return $streak;
    }
}
