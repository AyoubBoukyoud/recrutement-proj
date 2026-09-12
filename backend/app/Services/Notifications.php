<?php

namespace App\Services;

use App\Jobs\SendWebPushNotification;
use App\Models\AppNotification;
use App\Models\CandidateProfile;
use App\Models\Complaint;
use App\Models\Document;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\JobOffer;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Collection;

/** The single place that defines notification types, payloads and links. */
class Notifications
{
    public function __construct(private readonly JobOfferMatching $matching) {}

    public function applicationCreated(JobApplication $application): AppNotification
    {
        $application->loadMissing('offer');

        return $this->create(
            $application->offer->employer,
            'application.created',
            ['offer_title' => $application->offer->title],
            '/recruiter/candidatures',
            'New application',
            $application->offer->title,
        );
    }

    /**
     * `accepted`/`rejected` get their own notification type (and copy) —
     * decisions the candidate should feel as a "yes" or "no", not a status
     * word next to a badge. Every other transition keeps `application.status`.
     */
    public function applicationStatusChanged(JobApplication $application): ?AppNotification
    {
        $application->loadMissing(['offer', 'candidateProfile.user']);
        $candidate = $application->candidateProfile?->user;
        if (! $candidate) {
            return null;
        }

        $type = match ($application->status) {
            'accepted' => 'application.accepted',
            'rejected' => 'application.rejected',
            default => 'application.status',
        };
        $fallback = match ($application->status) {
            'accepted' => ['Congratulations!', "Your application for {$application->offer->title} has been accepted!"],
            'rejected' => ['Update on your application', "We're sorry, your application for {$application->offer->title} was not selected this time."],
            default => ['Application updated', $application->status],
        };

        return $this->create(
            $candidate,
            $type,
            ['offer_title' => $application->offer->title, 'status' => $application->status],
            '/candidatures',
            $fallback[0],
            $fallback[1],
        );
    }

    public function offerModerated(JobOffer $offer): AppNotification
    {
        return $this->create(
            $offer->employer,
            'offer.moderated',
            ['offer_title' => $offer->title, 'status' => $offer->status],
            '/recruiter/offres',
            'Offer status updated',
            $offer->status,
        );
    }

    public function documentReviewed(Document $document): AppNotification
    {
        $document->loadMissing('candidateProfile.user');

        return $this->create(
            $document->candidateProfile->user,
            'document.reviewed',
            [
                'document_type' => $document->type,
                'status' => $document->approval_status,
                'reason' => $document->rejection_reason,
            ],
            '/documents',
            'Document reviewed',
            $document->rejection_reason ?: $document->approval_status,
        );
    }

    /**
     * The candidate app has no interview-viewing screen yet — this points at
     * `/candidatures`, the closest real surface, same reasoning as pointing a
     * moderation notice at the recruiter's offers list rather than a page
     * that doesn't exist.
     */
    public function interviewScheduled(Interview $interview): ?AppNotification
    {
        $interview->loadMissing('application.offer', 'application.candidateProfile.user');
        $candidate = $interview->application->candidateProfile?->user;

        return $candidate ? $this->create(
            $candidate,
            'interview.scheduled',
            ['offer_title' => $interview->application->offer->title, 'date' => $interview->date->toDateString(), 'time' => $interview->start_time],
            '/candidatures',
            'Interview scheduled',
            $interview->application->offer->title,
        ) : null;
    }

    public function complaintAnswered(Complaint $complaint): AppNotification
    {
        return $this->create(
            $complaint->user,
            'complaint.answered',
            ['response' => $complaint->admin_response],
            '/reclamation',
            'Complaint answered',
            (string) $complaint->admin_response,
        );
    }

    public function messageReceived(Message $message): ?AppNotification
    {
        $message->loadMissing('conversation.candidate', 'conversation.recruiter', 'conversation.application.offer');
        $conversation = $message->conversation;
        $recipient = $message->sender_id === $conversation->candidate_user_id
            ? $conversation->recruiter
            : $conversation->candidate;

        if (! $recipient) {
            return null;
        }

        $link = $recipient->hasRole('Company')
            ? "/recruiter/messages?conversation={$conversation->id}"
            : "/messages?conversation={$conversation->id}";

        return $this->create(
            $recipient,
            'message.received',
            ['offer_title' => $conversation->application?->offer?->title, 'conversation_id' => $conversation->id],
            $link,
            'New message',
            mb_strimwidth($message->body, 0, 140, '…'),
        );
    }

    /** @param Collection<int, mixed> $assignments */
    public function tasksAssigned(CandidateProfile $profile, Collection $assignments): ?AppNotification
    {
        if ($assignments->isEmpty()) {
            return null;
        }

        $day = $assignments->first()->assigned_for?->toDateString();
        $count = $profile->taskAssignments()->whereDate('assigned_for', $day)->count();
        $existing = AppNotification::where('user_id', $profile->user_id)
            ->where('type', 'tasks.assigned')
            ->whereDate('created_at', today())
            ->get()
            ->first(fn (AppNotification $notification) => ($notification->payload['date'] ?? null) === $day);

        if ($existing) {
            $existing->update([
                'body' => "{$count} task(s) assigned for {$day}",
                'payload' => ['date' => $day, 'count' => $count],
                'read_at' => null,
            ]);

            return $existing;
        }

        return $this->create(
            $profile->user,
            'tasks.assigned',
            ['date' => $day, 'count' => $count],
            '/taches',
            'Daily tasks assigned',
            "{$count} task(s) assigned for {$day}",
        );
    }

    public function matchingOfferPublished(JobOffer $offer): int
    {
        $created = 0;

        CandidateProfile::query()
            ->whereNotNull('matching_preferences')
            ->whereHas('user', fn ($query) => $query->where('status', 'active'))
            ->with('user')
            ->chunkById(200, function ($profiles) use ($offer, &$created) {
                foreach ($profiles as $profile) {
                    $score = $this->matching->score($profile, $offer);
                    if ($score === null || $score < 60) {
                        continue;
                    }

                    $this->create(
                        $profile->user,
                        'offer.matched',
                        ['offer_id' => $offer->id, 'offer_title' => $offer->title, 'match_score' => $score],
                        "/offres/{$offer->id}",
                        'New matching offer',
                        $offer->title,
                    );
                    $created++;
                }
            });

        return $created;
    }

    /** @param array<string, mixed> $payload */
    private function create(
        User $user,
        string $type,
        array $payload,
        ?string $link,
        string $fallbackTitle,
        string $fallbackBody,
    ): AppNotification {
        $notification = AppNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $fallbackTitle,
            'body' => $fallbackBody,
            'payload' => $payload,
            'link' => $link,
        ]);

        // Every notification this class defines reaches the browser through
        // the same path — no per-type wiring needed for a new one later.
        // Queued: sending is one HTTP call per subscribed device, and this
        // method runs inline in a dozen request paths.
        SendWebPushNotification::dispatch($user->id, $fallbackTitle, $fallbackBody, $link);

        return $notification;
    }
}
