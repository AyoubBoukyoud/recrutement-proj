<?php

namespace App\Services\Timetable;

use App\Models\RecruitmentCenter;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SchedulingService
{
    public const TIMEZONE = 'Africa/Casablanca';

    public const WRITE_ROLES = ['CENTER_OWNER', 'CENTER_ADMIN', 'COORDINATOR'];

    /** Student records hold personal data: hidden from the STUDENT member role. */
    public const STUDENT_READ_ROLES = ['CENTER_OWNER', 'CENTER_ADMIN', 'COORDINATOR', 'TEACHER', 'ACCOUNTANT'];

    /** Payments and financial reports. */
    public const FINANCE_ROLES = ['CENTER_OWNER', 'CENTER_ADMIN', 'ACCOUNTANT'];

    public function authorize(User $user, RecruitmentCenter $center, bool $write = false): void
    {
        $this->authorizeRoles($user, $center, $write ? self::WRITE_ROLES : null, 'Accès au planning non autorisé.');
    }

    /** Platform administrators pass; centre accounts need a membership whose role is listed (any role when null). */
    public function authorizeRoles(User $user, RecruitmentCenter $center, ?array $roles, string $message = 'Accès non autorisé pour ce centre.'): void
    {
        abort_unless($center->category === 'training_center', 404);
        if ($user->hasRole('Administrator')) {
            return;
        }
        abort_unless($user->hasRole('Training Center'), 403);
        $role = $this->memberRole($user, $center->id);
        abort_unless($role && ($roles === null || in_array($role, $roles, true)), 403, $message);
    }

    public function memberRole(User $user, int $centerId): ?string
    {
        return DB::table('training_center_members')->where('center_id', $centerId)->where('user_id', $user->id)->value('role');
    }

    /** Lock a persistent parent, even when no sessions exist yet. Every writer
     * takes this lock before reading sessions. The update also serializes SQLite
     * transactions; MySQL/PostgreSQL use the row lock across PHP workers. */
    public function lock(RecruitmentCenter $center): void
    {
        $locked = DB::table('recruitment_centers')->where('id', $center->id)->lockForUpdate()->first();
        abort_unless($locked, 404);
        $center->category = $locked->category;
        DB::table('recruitment_centers')->where('id', $center->id)->increment('timetable_revision');
    }

    public function conflicts(int $centerId, array $data, ?int $exclude = null): array
    {
        $sessions = TrainingSession::where('center_id', $centerId)->where('date', $data['date'])
            ->when($exclude, fn ($q) => $q->where('id', '!=', $exclude))
            ->where('start_time', '<', $data['end_time'])->where('end_time', '>', $data['start_time'])
            ->where(fn ($q) => $q->where('teacher_id', $data['teacher_id'])->orWhere('room_id', $data['room_id'])->orWhere('group_id', $data['group_id']))
            ->orderBy('start_time')->get();
        $conflicts = [];
        foreach ($sessions as $session) {
            foreach (['teacher_id' => 'Le professeur', 'room_id' => 'La salle', 'group_id' => 'Le groupe'] as $field => $label) {
                if ((int) $session->$field === (int) $data[$field]) {
                    $conflicts[] = ['type' => $field, 'session_id' => $session->id, 'message' => "$label est déjà occupé(e) de ".substr($session->start_time, 0, 5).' à '.substr($session->end_time, 0, 5).'.'];
                }
            }
        }

        return $conflicts;
    }

    public function availability(int $centerId, array $data, ?int $exclude = null): array
    {
        $conflicts = $this->conflicts($centerId, $data, $exclude);
        $alternatives = [];
        if ($conflicts) {
            $duration = $this->minutes($data['end_time']) - $this->minutes($data['start_time']);
            // One bounded query for alternatives rather than a request per cell.
            $busy = TrainingSession::where('center_id', $centerId)->where('date', $data['date'])
                ->when($exclude, fn ($q) => $q->where('id', '!=', $exclude))
                ->where(fn ($q) => $q->where('teacher_id', $data['teacher_id'])->orWhere('room_id', $data['room_id'])->orWhere('group_id', $data['group_id']))->get();
            for ($start = 8 * 60; $start + $duration <= 22 * 60 && count($alternatives) < 3; $start += 30) {
                if (! $busy->contains(fn ($s) => $this->minutes($s->start_time) < $start + $duration && $this->minutes($s->end_time) > $start)) {
                    $alternatives[] = ['date' => $data['date'], 'start_time' => $this->time($start), 'end_time' => $this->time($start + $duration)];
                }
            }
        }

        return ['available' => ! $conflicts, 'conflicts' => $conflicts, 'alternatives' => $alternatives];
    }

    public function save(User $actor, RecruitmentCenter $center, array $data, ?int $id = null): TrainingSession
    {
        return DB::transaction(function () use ($actor, $center, $data, $id) {
            $this->lock($center);
            $this->authorize($actor, $center, true);
            // Validate again inside the lock, so deleting a resource cannot race a save.
            foreach (['teacher_id' => 'teachers', 'module_id' => 'modules', 'group_id' => 'groups', 'room_id' => 'rooms'] as $field => $table) {
                if (! DB::table('training_'.$table)->where('center_id', $center->id)->where('id', $data[$field])->exists()) {
                    throw ValidationException::withMessages([$field => 'Cette ressource n’appartient pas à ce centre.']);
                }
            }
            $session = $id ? TrainingSession::where('center_id', $center->id)->findOrFail($id) : null;
            if ($session) {
                abort_if($session->version !== (int) $data['version'], 409, 'Ce cours a été modifié par un autre utilisateur. Actualisez le planning.');
            } else {
                $retry = TrainingSession::where('center_id', $center->id)->where('request_key', $data['request_key'])->first();
                if ($retry) {
                    foreach (['teacher_id', 'module_id', 'group_id', 'room_id', 'date', 'start_time', 'end_time'] as $field) {
                        abort_if((string) $retry->toArray()[$field] !== (string) $data[$field], 409, 'Cette demande a déjà créé un cours. Actualisez le planning.');
                    }

                    return $retry;
                }
            }
            $availability = $this->availability($center->id, $data, $id);
            if (! $availability['available']) {
                abort(response()->json(['message' => 'Ce créneau présente un conflit.', ...$availability], 422));
            }
            $before = $session?->toArray();
            unset($data['version']);
            if ($session) {
                unset($data['request_key']);
                $session->fill([...$data, 'version' => $session->version + 1])->save();
            } else {
                $session = TrainingSession::create([...$data, 'center_id' => $center->id, 'created_by' => $actor->id]);
                $session->refresh();
            }
            $this->audit($actor, $center, $session, $before ? 'update' : 'create', $before, $session->toArray());

            return $session;
        }, 5);
    }

    public function delete(User $actor, RecruitmentCenter $center, int $id, int $version): void
    {
        DB::transaction(function () use ($actor, $center, $id, $version) {
            $this->lock($center);
            $this->authorize($actor, $center, true);
            $session = TrainingSession::where('center_id', $center->id)->findOrFail($id);
            abort_if($session->version !== $version, 409, 'Ce cours a été modifié. Actualisez le planning avant de le supprimer.');
            $this->audit($actor, $center, $session, 'delete', $session->toArray(), null);
            $session->delete();
        }, 5);
    }

    private function audit(User $actor, RecruitmentCenter $center, TrainingSession $session, string $action, ?array $before, ?array $after): void
    {
        DB::table('training_schedule_events')->insert(['center_id' => $center->id, 'actor_id' => $actor->id, 'session_id' => $session->id, 'action' => $action, 'before' => $before ? json_encode($before, JSON_THROW_ON_ERROR) : null, 'after' => $after ? json_encode($after, JSON_THROW_ON_ERROR) : null, 'created_at' => CarbonImmutable::now()]);
    }

    private function minutes(string $time): int
    {
        return (int) substr($time, 0, 2) * 60 + (int) substr($time, 3, 2);
    }

    private function time(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }
}
