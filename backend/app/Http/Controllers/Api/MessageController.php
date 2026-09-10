<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\JobApplication;
use App\Models\Message;
use App\Services\Notifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Application-scoped private messaging for candidates and recruiters. */
class MessageController extends Controller
{
    public function __construct(private readonly Notifications $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $this->ensureMessagingRole($request);

        $conversations = Conversation::query()
            ->where(fn ($query) => $query
                ->where('candidate_user_id', $userId)
                ->orWhere('recruiter_user_id', $userId))
            ->with([
                'candidate:id,name,phone',
                'recruiter:id,name,phone',
                'application.offer:id,title',
                'latestMessage.sender:id,name,phone',
            ])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $userId),
            ])
            ->orderByDesc('last_message_at')
            ->paginate(min(50, max(1, $request->integer('per_page', 20))));

        $conversations->getCollection()->transform(fn (Conversation $conversation) => $this->presentConversation($conversation, $userId));

        return response()->json($conversations);
    }

    /** Start the thread on the first message for an application. */
    public function store(Request $request): JsonResponse
    {
        $this->ensureMessagingRole($request);
        $data = $request->validate([
            'application_id' => ['required', 'integer', 'exists:job_applications,id'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $application = JobApplication::with(['candidateProfile.user', 'offer.employer'])->findOrFail($data['application_id']);
        $candidateUser = $application->candidateProfile?->user;
        $recruiterUser = $application->offer?->employer;
        abort_unless($candidateUser && $recruiterUser, 404);
        abort_unless(in_array($request->user()->id, [$candidateUser->id, $recruiterUser->id], true), 403);

        $conversation = Conversation::firstOrCreate(
            ['job_application_id' => $application->id],
            [
                'candidate_user_id' => $candidateUser->id,
                'recruiter_user_id' => $recruiterUser->id,
            ],
        );

        $message = $this->append($conversation, $request->user()->id, $data['body']);

        return response()->json([
            'conversation' => $this->presentConversation($conversation->fresh(['candidate:id,name,phone', 'recruiter:id,name,phone', 'application.offer:id,title', 'latestMessage.sender:id,name,phone']), $request->user()->id),
            'message' => $this->presentMessage($message, $request->user()->id),
        ], 201);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);

        $conversation->load([
            'candidate:id,name,phone',
            'recruiter:id,name,phone',
            'application.offer:id,title',
            'messages.sender:id,name,phone',
        ]);

        return response()->json([
            'conversation' => $this->presentConversation($conversation, $request->user()->id),
            'messages' => $conversation->messages->sortBy('created_at')->values()->map(
                fn (Message $message) => $this->presentMessage($message, $request->user()->id),
            ),
        ]);
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);

        return response()->json(
            $this->presentMessage($this->append($conversation, $request->user()->id, $data['body']), $request->user()->id),
            201,
        );
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);
        $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $request->user()->id)
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    private function append(Conversation $conversation, int $senderId, string $body): Message
    {
        $message = $conversation->messages()->create([
            'sender_id' => $senderId,
            'body' => trim($body),
        ]);
        $conversation->forceFill(['last_message_at' => $message->created_at])->save();
        $this->notifications->messageReceived($message);

        return $message->load('sender:id,name,phone');
    }

    private function authorizeParticipant(Request $request, Conversation $conversation): void
    {
        $this->ensureMessagingRole($request);
        abort_unless(in_array($request->user()->id, [$conversation->candidate_user_id, $conversation->recruiter_user_id], true), 403);
    }

    private function ensureMessagingRole(Request $request): void
    {
        abort_unless($request->user()->hasAnyRole(['User', 'Company']), 403);
    }

    /** @return array<string, mixed> */
    private function presentConversation(Conversation $conversation, int $viewerId): array
    {
        $other = $viewerId === $conversation->candidate_user_id ? $conversation->recruiter : $conversation->candidate;

        return [
            'id' => $conversation->id,
            'application_id' => $conversation->job_application_id,
            'offer_title' => $conversation->application?->offer?->title,
            // Phone/email disclosure is a separate, attributable recruiter
            // action. Messaging must never bypass that contact gate.
            'other_user' => $other ? ['id' => $other->id, 'name' => $other->name] : null,
            'last_message' => $conversation->latestMessage ? $this->presentMessage($conversation->latestMessage, $viewerId) : null,
            'unread_count' => (int) ($conversation->unread_count ?? 0),
            'last_message_at' => $conversation->last_message_at,
        ];
    }

    /** @return array<string, mixed> */
    private function presentMessage(Message $message, int $viewerId): array
    {
        return [
            'id' => $message->id,
            'body' => $message->body,
            'sender_id' => $message->sender_id,
            // Never fall back to a phone number: it would bypass the contact
            // disclosure rules merely because a profile has no display name.
            'sender_name' => $message->sender?->name ?? 'Utilisateur',
            'is_mine' => $message->sender_id === $viewerId,
            'read_at' => $message->read_at,
            'created_at' => $message->created_at,
        ];
    }
}
