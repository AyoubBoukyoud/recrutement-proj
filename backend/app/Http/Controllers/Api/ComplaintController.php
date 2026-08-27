<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\NotifyAdminsOfComplaint;
use App\Models\Complaint;
use App\Services\Notifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function __construct(private readonly Notifications $notifications) {}

    /** Administrator triage queue. */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'in:open,in_review,resolved'],
        ]);

        $query = Complaint::with(['user:id,name,phone', 'respondedBy:id,name,phone'])->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * The candidate's own reports, so a reply has somewhere to land. Without
     * this a complaint was write-only: it could be resolved, and the person
     * who raised it was never told.
     */
    public function mine(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->complaints()->with('respondedBy:id,name')->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:text,voice'],
            'body' => ['required_if:type,text', 'nullable', 'string', 'max:5000'],
            'audio' => ['required_if:type,voice', 'nullable', 'file', 'mimes:wav,mp3,m4a,mp4,webm,aac,caf', 'max:20480'],
        ]);

        $audioPath = $request->hasFile('audio') ? $request->file('audio')->store('complaints', 'local') : null;

        $complaint = $request->user()->complaints()->create([
            'type' => $data['type'],
            'body' => $data['body'] ?? null,
            'audio_path' => $audioPath,
            'status' => 'open',
            // Left null on purpose: the job stamps it once a channel has
            // accepted the alert. Stamping it here asserted a delivery that
            // had not happened, because nothing was ever sent.
            'admin_notified_at' => null,
        ]);

        NotifyAdminsOfComplaint::dispatch($complaint->id);

        return response()->json($complaint, 201);
    }

    /**
     * Triage: move the complaint along, and answer it. A reply is what closes
     * the loop — `resolved` on its own tells the candidate nothing, since
     * until now they could not see the status either.
     */
    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:open,in_review,resolved'],
            'response' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        if (array_key_exists('status', $data)) {
            $complaint->status = $data['status'];
        }

        if (filled($data['response'] ?? null)) {
            $complaint->admin_response = $data['response'];
            $complaint->responded_at = now();
            $complaint->responded_by_id = $request->user()->id;
            // An edited reply is a new thing to read.
            $complaint->response_seen_at = null;
        }

        $complaint->save();

        if (filled($data['response'] ?? null)) {
            $this->notifications->complaintAnswered($complaint);
        }

        return response()->json($complaint->fresh(['user:id,name,phone', 'respondedBy:id,name,phone']));
    }

    /** The candidate has read the reply — clears the badge. */
    public function markResponseSeen(Request $request, Complaint $complaint): JsonResponse
    {
        abort_unless($complaint->user_id === $request->user()->id, 403);

        if ($complaint->responded_at && ! $complaint->response_seen_at) {
            $complaint->forceFill(['response_seen_at' => now()])->save();
        }

        return response()->json($complaint->fresh('respondedBy:id,name'));
    }
}
