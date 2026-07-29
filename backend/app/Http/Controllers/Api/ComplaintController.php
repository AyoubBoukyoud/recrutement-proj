<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Complaint::with('user:id,name,phone')->latest()->paginate(20)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:text,voice'],
            'body' => ['required_if:type,text', 'nullable', 'string', 'max:5000'],
            'audio' => ['required_if:type,voice', 'nullable', 'file', 'mimes:wav,mp3,m4a,mp4,webm,aac,caf', 'max:20480'],
        ]);

        $audioPath = $request->hasFile('audio') ? $request->file('audio')->store('complaints', 'public') : null;

        $complaint = $request->user()->complaints()->create([
            'type' => $data['type'],
            'body' => $data['body'] ?? null,
            'audio_path' => $audioPath,
            'status' => 'open',
            'admin_notified_at' => now(),
        ]);

        return response()->json($complaint, 201);
    }

    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,in_review,resolved'],
        ]);

        $complaint->update($data);

        return response()->json($complaint);
    }
}
