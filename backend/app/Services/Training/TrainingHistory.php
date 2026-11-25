<?php

namespace App\Services\Training;

use App\Models\RecruitmentCenter;
use App\Models\TrainingMembership;
use App\Models\TrainingStudent;
use App\Models\TrainingStudentPeriod;
use App\Services\Timetable\SchedulingService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Effective-dated writes for students, memberships and formation fees.
 * Nothing that a past report relied on is overwritten: periods are closed and
 * new ones opened from an explicit date. Callers hold the centre lock.
 */
class TrainingHistory
{
    public static function today(): string
    {
        return CarbonImmutable::now(SchedulingService::TIMEZONE)->toDateString();
    }

    public static function currentMonth(): string
    {
        return substr(self::today(), 0, 7);
    }

    private static function dayBefore(string $date): string
    {
        return CarbonImmutable::parse($date)->subDay()->toDateString();
    }

    /** Ends a membership the day before $from; a period that never started is removed. */
    public function endMembership(TrainingMembership $membership, string $from): void
    {
        $joined = $membership->joined_on->format('Y-m-d');
        abort_if($from < $joined, 422, 'La date d’effet ne peut pas précéder l’entrée dans le groupe ('.$membership->joined_on->format('d/m/Y').').');
        if ($from === $joined) {
            $membership->delete(); // same-day correction: the period never took effect

            return;
        }
        $membership->update(['ended_on' => self::dayBefore($from)]);
    }

    /** Sets the current groups from $date. Unchanged memberships keep their history. */
    public function syncGroups(RecruitmentCenter $center, TrainingStudent $student, array $groupIds, string $date): void
    {
        $groupIds = array_values(array_unique(array_map('intval', $groupIds)));
        $groups = DB::table('training_groups')->where('center_id', $center->id)->whereIn('id', $groupIds)->get(['id', 'name', 'capacity', 'module_id'])->keyBy('id');
        abort_if($groups->count() !== count($groupIds), 422, 'Un des groupes sélectionnés n’appartient pas à ce centre.');
        $open = TrainingMembership::where('center_id', $center->id)->where('student_id', $student->id)->whereNull('ended_on')->get();
        $added = array_diff($groupIds, $open->pluck('group_id')->all());
        foreach ($added as $groupId) {
            $group = $groups[$groupId];
            if ($group->capacity !== null) {
                $count = TrainingMembership::where('group_id', $groupId)->whereNull('ended_on')->count();
                abort_if($count >= $group->capacity, 422, "Le groupe « {$group->name} » est complet ({$count}/{$group->capacity}).");
            }
        }
        if ($added) {
            $start = $student->periods()->whereNull('ended_on')->value('started_on');
            abort_if($start && $date < CarbonImmutable::parse($start)->toDateString(), 422, 'La date d’effet précède l’inscription de l’étudiant.');
        }
        foreach ($open as $membership) {
            if (! in_array($membership->group_id, $groupIds, true)) {
                $this->endMembership($membership, $date);
            }
        }
        foreach ($added as $groupId) {
            TrainingMembership::create(['center_id' => $center->id, 'group_id' => $groupId, 'student_id' => $student->id, 'module_id' => $groups[$groupId]->module_id, 'joined_on' => $date]);
        }
    }

    /** A group's formation changes from $date for its current members; earlier periods keep the old one. */
    public function changeGroupFormation(int $centerId, int $groupId, ?int $moduleId, string $date): void
    {
        foreach (TrainingMembership::where('center_id', $centerId)->where('group_id', $groupId)->whereNull('ended_on')->get() as $membership) {
            if ($membership->module_id === $moduleId) {
                continue;
            }
            if ($membership->joined_on->format('Y-m-d') >= $date) {
                $membership->update(['module_id' => $moduleId]);

                continue;
            }
            $membership->update(['ended_on' => self::dayBefore($date)]);
            TrainingMembership::create(['center_id' => $centerId, 'group_id' => $groupId, 'student_id' => $membership->student_id, 'module_id' => $moduleId, 'joined_on' => $date]);
        }
    }

    public function register(RecruitmentCenter $center, TrainingStudent $student, array $groupIds): void
    {
        $date = $student->registered_on->format('Y-m-d');
        TrainingStudentPeriod::create(['center_id' => $center->id, 'student_id' => $student->id, 'started_on' => $date]);
        $this->syncGroups($center, $student, $groupIds, $date);
    }

    /** Inactive from $date (first inactive day): closes the activity period and the student's groups. */
    public function deactivate(RecruitmentCenter $center, TrainingStudent $student, string $date): void
    {
        $period = $student->periods()->whereNull('ended_on')->first();
        abort_unless($period, 422, 'Cet étudiant est déjà inactif.');
        abort_if($date < $period->started_on->format('Y-m-d'), 422, 'La date de désactivation précède le début de la période active ('.$period->started_on->format('d/m/Y').').');
        foreach (TrainingMembership::where('center_id', $center->id)->where('student_id', $student->id)->whereNull('ended_on')->get() as $membership) {
            $this->endMembership($membership, max($date, $membership->joined_on->format('Y-m-d')));
        }
        $date === $period->started_on->format('Y-m-d') ? $period->delete() : $period->update(['ended_on' => self::dayBefore($date)]);
        $student->update(['status' => 'inactive', 'deactivated_on' => $date]);
    }

    /** Active again from $date; groups are reassigned explicitly afterwards. */
    public function reactivate(RecruitmentCenter $center, TrainingStudent $student, string $date): void
    {
        abort_if($student->periods()->whereNull('ended_on')->exists(), 422, 'Cet étudiant est déjà actif.');
        $lastEnd = $student->periods()->max('ended_on');
        abort_if($lastEnd && $date <= CarbonImmutable::parse($lastEnd)->toDateString(), 422, 'La réactivation doit être postérieure à la dernière période active.');
        TrainingStudentPeriod::create(['center_id' => $center->id, 'student_id' => $student->id, 'started_on' => $date]);
        $student->update(['status' => 'active', 'deactivated_on' => null]);
    }

    /** Corrects the registration date: the first period and the groups assigned at registration move with it. */
    public function moveRegistration(TrainingStudent $student, string $date): void
    {
        $old = $student->registered_on->format('Y-m-d');
        if ($old === $date) {
            return;
        }
        $first = $student->periods()->first();
        abort_if($first && $first->ended_on && $date > $first->ended_on->format('Y-m-d'), 422, 'La date d’inscription dépasse la fin de la première période active.');
        $memberships = $student->memberships()->get();
        abort_if($memberships->contains(fn ($m) => $m->joined_on->format('Y-m-d') !== $old && $m->joined_on->format('Y-m-d') < $date), 422, 'Des affectations commencent avant cette date.');
        foreach ($memberships as $membership) {
            if ($membership->joined_on->format('Y-m-d') === $old) {
                abort_if($membership->ended_on && $membership->ended_on->format('Y-m-d') < $date, 422, 'Une affectation se termine avant cette date.');
                $membership->update(['joined_on' => $date]);
            }
        }
        $first?->update(['started_on' => $date]);
        $student->update(['registered_on' => $date]);
    }

    /** Records the fee for a formation from $month. Re-sending the fee already in force changes nothing. */
    public function setFee(int $centerId, int $moduleId, ?float $amount, string $month, ?int $actorId): void
    {
        $current = DB::table('training_formation_fees')->where('module_id', $moduleId)->where('effective_from', '<=', $month)->orderByDesc('effective_from')->first();
        $amount = $amount === null ? null : round($amount, 2);
        if ($current && $current->effective_from !== $month && ($current->amount === null ? null : round((float) $current->amount, 2)) === $amount) {
            return;
        }
        if (! $current && $amount === null) {
            return;
        }
        DB::table('training_formation_fees')->updateOrInsert(
            ['module_id' => $moduleId, 'effective_from' => $month],
            ['center_id' => $centerId, 'amount' => $amount, 'created_by' => $actorId, 'updated_at' => now(), 'created_at' => now()],
        );
    }

    /** Every fee row of a centre, grouped by formation and ordered by month. */
    public static function feeHistory(int $centerId): array
    {
        $history = [];
        foreach (DB::table('training_formation_fees')->where('center_id', $centerId)->orderBy('effective_from')->get(['module_id', 'effective_from', 'amount']) as $row) {
            $history[(int) $row->module_id][] = ['effective_from' => $row->effective_from, 'amount' => $row->amount === null ? null : (float) $row->amount];
        }

        return $history;
    }

    /** The fee row in force for $month, or null when none applies. */
    public static function feeAt(array $history, int $moduleId, string $month): ?array
    {
        $found = null;
        foreach ($history[$moduleId] ?? [] as $row) {
            if ($row['effective_from'] <= $month) {
                $found = $row;
            }
        }

        return $found;
    }
}
