<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The public "contact us" form at the bottom of the homepage. `store` is
 * unauthenticated (see routes/api.php, next to the OTP endpoints) — a
 * visitor writing in has no account yet. `index`/`update` are for the
 * administrator triage queue only.
 */
class ContactMessageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $message = ContactMessage::create([
            ...$data,
            'status' => 'new',
        ]);

        return response()->json(['id' => $message->id], 201);
    }

    /** Administrator triage queue. */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'in:'.implode(',', ContactMessage::STATUSES)],
        ]);

        $query = ContactMessage::query()->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->paginate(20));
    }

    /** Marks a message read or archived — there is no reply channel, unlike complaints. */
    public function update(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', ContactMessage::STATUSES)],
        ]);

        $contactMessage->update($data);

        return response()->json($contactMessage);
    }
}
