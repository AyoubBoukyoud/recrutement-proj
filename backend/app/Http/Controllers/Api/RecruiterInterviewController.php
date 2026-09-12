<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Services\Notifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Interview scheduling — one recruiter's own pipeline. Distinct from
 * `JobApplication::status`, which only names the stage; this carries the
 * actual date/time/mode/location, and can be rescheduled without losing the
 * application's status history.
 */
class RecruiterInterviewController extends Controller
{
    public function __construct(private readonly Notifications $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:scheduled,confirmed,rescheduled,completed,cancelled'],
        ]);

        $query = Interview::whereHas('application.offer', fn ($offer) => $offer->where('user_id', $request->user()->id))
            ->with(['application.offer', 'application.candidateProfile.user', 'feedback.author:id,name']);

        if (isset($data['status'])) {
            $query->where('status', $data['status']);
        }

        return response()->json($query->orderBy('date')->orderBy('start_time')->get());
    }

    public function show(Request $request, Interview $interview): JsonResponse
    {
        $this->authorizeOwnership($request, $interview);
        $interview->load(['application.offer', 'application.candidateProfile.user', 'feedback.author:id,name']);

        return response()->json($interview);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_application_id' => ['required', 'integer', 'exists:job_applications,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'type' => ['required', 'in:in_person,video,phone'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $application = JobApplication::whereHas('offer', fn ($offer) => $offer->where('user_id', $request->user()->id))
            ->findOrFail($data['job_application_id']);

        $interview = Interview::create($data + ['scheduled_by_id' => $request->user()->id]);

        // Scheduling an interview is the moment the pipeline actually moves
        // to that stage — mirrors what the admin/recruiter status endpoints
        // already do for every other transition.
        if ($application->status === 'submitted' || $application->status === 'viewed') {
            $application->update(['status' => 'interview', 'status_changed_at' => now()]);
            $this->notifications->applicationStatusChanged($application);
        }

        $this->notifications->interviewScheduled($interview);

        return response()->json($interview->load(['application.offer', 'application.candidateProfile.user']), 201);
    }

    public function update(Request $request, Interview $interview): JsonResponse
    {
        $this->authorizeOwnership($request, $interview);

        $data = $request->validate([
            'date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'type' => ['sometimes', 'in:in_person,video,phone'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'in:scheduled,confirmed,rescheduled,completed,cancelled'],
        ]);

        $wasRescheduled = isset($data['date']) && $data['date'] !== $interview->date->toDateString();
        if ($wasRescheduled && ! isset($data['status'])) {
            $data['status'] = 'rescheduled';
        }

        $interview->update($data);

        if ($wasRescheduled) {
            $this->notifications->interviewScheduled($interview->fresh());
        }

        return response()->json($interview->fresh(['application.offer', 'application.candidateProfile.user']));
    }

    public function storeFeedback(Request $request, Interview $interview): JsonResponse
    {
        $this->authorizeOwnership($request, $interview);

        $data = $request->validate([
            'overall' => ['required', 'integer', 'min:1', 'max:5'],
            'technical' => ['required', 'integer', 'min:1', 'max:5'],
            'communication' => ['required', 'integer', 'min:1', 'max:5'],
            'motivation' => ['required', 'integer', 'min:1', 'max:5'],
            'culture_fit' => ['required', 'integer', 'min:1', 'max:5'],
            'recommendation' => ['required', 'in:strong_yes,yes,no,strong_no'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $feedback = $interview->feedback()->create($data + ['author_id' => $request->user()->id]);

        return response()->json($feedback->load('author:id,name'), 201);
    }

    private function authorizeOwnership(Request $request, Interview $interview): void
    {
        $interview->loadMissing('application.offer');
        abort_unless($interview->application->offer->user_id === $request->user()->id, 404);
    }
}
