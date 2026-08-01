<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * The administrator's half of the daily internship: maintain the catalogue of
 * preparation activities, hand them out, and read back what came of it.
 */
class AdminTaskController extends Controller
{
    /** The catalogue. Retired activities are included so their history reads. */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'include_inactive' => ['sometimes', 'boolean'],
        ]);

        $query = Task::query()->withCount('assignments')->latest();

        if (! filter_var($filters['include_inactive'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_active', true);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'category' => ['sometimes', 'in:'.implode(',', Task::CATEGORIES)],
            'estimated_minutes' => ['sometimes', 'integer', 'min:5', 'max:480'],
        ]);

        $task = Task::create($data + ['created_by_id' => $request->user()->id]);

        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'category' => ['sometimes', 'in:'.implode(',', Task::CATEGORIES)],
            'estimated_minutes' => ['sometimes', 'integer', 'min:5', 'max:480'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $task->update($data);

        return response()->json($task->fresh());
    }

    /**
     * Retire an activity. Never a hard delete: assignments already made would
     * lose the only record of what the candidate was asked to do.
     */
    public function destroy(Task $task): JsonResponse
    {
        $task->update(['is_active' => false]);

        return response()->json($task->fresh());
    }

    /** What one candidate has been given, newest day first. */
    public function assignments(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        return response()->json(
            $candidateProfile->taskAssignments()
                ->with(['task', 'assignedBy:id,name,phone'])
                ->orderByDesc('assigned_for')
                ->paginate(30)
        );
    }

    /**
     * Assign one or more activities to a candidate for a given day.
     *
     * Bulk because a day's work is "~1 hour", which is usually two or three
     * activities rather than one — assigning them one request at a time would
     * make a half-assigned day a normal outcome of a dropped connection.
     */
    public function assign(Request $request, CandidateProfile $candidateProfile): JsonResponse
    {
        $data = $request->validate([
            'task_ids' => ['required', 'array', 'min:1', 'max:10'],
            'task_ids.*' => ['integer'],
            'assigned_for' => ['sometimes', 'date'],
        ]);

        $tasks = Task::whereIn('id', $data['task_ids'])->where('is_active', true)->get();

        if ($tasks->count() !== count(array_unique($data['task_ids']))) {
            throw ValidationException::withMessages([
                'task_ids' => 'One or more of those activities do not exist or have been retired.',
            ]);
        }

        $day = isset($data['assigned_for']) ? Carbon::parse($data['assigned_for'])->startOfDay() : today();

        $assignments = $tasks->map(function (Task $task) use ($candidateProfile, $day, $request) {
            // whereDate rather than updateOrCreate on the raw value: the `date`
            // cast persists midnight as 'Y-m-d H:i:s', so matching against a
            // date string finds nothing and the insert hits the unique index.
            $assignment = $candidateProfile->taskAssignments()
                ->where('task_id', $task->id)
                ->whereDate('assigned_for', $day)
                ->first()
                ?? $candidateProfile->taskAssignments()->make([
                    'task_id' => $task->id,
                    'assigned_for' => $day,
                ]);

            $assignment->assigned_by_id = $request->user()->id;
            $assignment->save();

            return $assignment;
        });

        return response()->json($assignments->load('task')->values(), 201);
    }

    /** Administrator feedback, or correcting a status on the candidate's behalf. */
    public function updateAssignment(Request $request, TaskAssignment $assignment): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:'.implode(',', TaskAssignment::STATUSES)],
            'admin_feedback' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        if (($data['status'] ?? null) === 'completed' && ! $assignment->completed_at) {
            $data['completed_at'] = now();
        }

        $assignment->update($data);

        return response()->json($assignment->fresh(['task', 'assignedBy:id,name,phone']));
    }

    public function destroyAssignment(TaskAssignment $assignment): JsonResponse
    {
        $assignment->delete();

        return response()->json(null, 204);
    }
}
