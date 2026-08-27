<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\CandidateProfile;
use App\Models\Complaint;
use App\Models\Document;
use App\Models\JobApplication;
use App\Models\JobOffer;
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
            "/recruiter/offers/{$application->offer->id}/applications",
            'New application',
            $application->offer->title,
        );
    }

    public function applicationStatusChanged(JobApplication $application): ?AppNotification
    {
        $application->loadMissing(['offer', 'candidateProfile.user']);
        $candidate = $application->candidateProfile?->user;

        return $candidate ? $this->create(
            $candidate,
            'application.status',
            ['offer_title' => $application->offer->title, 'status' => $application->status],
            '/candidatures',
            'Application updated',
            $application->status,
        ) : null;
    }

    public function offerModerated(JobOffer $offer): AppNotification
    {
        return $this->create(
            $offer->employer,
            'offer.moderated',
            ['offer_title' => $offer->title, 'status' => $offer->status],
            "/recruiter/offers/{$offer->id}",
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
        return AppNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $fallbackTitle,
            'body' => $fallbackBody,
            'payload' => $payload,
            'link' => $link,
        ]);
    }
}
