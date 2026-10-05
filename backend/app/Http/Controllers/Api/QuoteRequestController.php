<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuoteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The quote form on the public company page. `store` is unauthenticated
 * (see routes/api.php, next to the contact form) — a prospect has no account.
 * `index`/`update` are the administrator's follow-up queue.
 */
class QuoteRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'service' => ['required', 'in:'.implode(',', QuoteRequest::SERVICES)],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $quote = QuoteRequest::create([
            ...$data,
            'status' => 'new',
        ]);

        return response()->json(['id' => $quote->id], 201);
    }

    /** Administrator follow-up queue. */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'in:'.implode(',', QuoteRequest::STATUSES)],
            'service' => ['sometimes', 'in:'.implode(',', QuoteRequest::SERVICES)],
        ]);

        $query = QuoteRequest::query()->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['service'])) {
            $query->where('service', $filters['service']);
        }

        return response()->json($query->paginate(20));
    }

    /** Moves a request along: new, contacted, closed. */
    public function update(Request $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', QuoteRequest::STATUSES)],
        ]);

        $quoteRequest->update($data);

        return response()->json($quoteRequest);
    }
}
