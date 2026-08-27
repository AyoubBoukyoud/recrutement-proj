<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/** Permanently erase candidate data after the reversible 30-day window. */
class PurgeDeletedCandidates extends Command
{
    protected $signature = 'candidates:purge-deleted {--limit=100 : Most accounts to purge in one run}';

    protected $description = 'Purge candidate accounts whose deletion grace period has expired';

    public function handle(): int
    {
        $users = User::query()
            ->whereNotNull('deletion_requested_at')
            ->where('deletion_requested_at', '<=', now())
            ->whereHas('roles', fn ($query) => $query->where('name', 'User'))
            ->with([
                'candidateProfile.documents',
                'candidateProfile.languageAssessments',
                'candidateProfile.jobApplications',
                'complaints',
            ])
            ->orderBy('id')
            ->limit(max(1, (int) $this->option('limit')))
            ->get();

        foreach ($users as $user) {
            $profile = $user->candidateProfile;
            $paths = collect([
                $profile?->presentation_video_path,
                ...($profile?->documents->pluck('file_path')->all() ?? []),
                ...($profile?->languageAssessments->pluck('audio_path')->all() ?? []),
                ...$user->complaints->pluck('audio_path')->all(),
            ])->filter()->unique()->values();

            DB::transaction(function () use ($user, $profile) {
                if ($profile) {
                    $profile->jobApplications()->update([
                        'candidate_profile_id' => null,
                        'anonymized_at' => now(),
                    ]);
                }
                $user->delete();
            });

            Storage::disk('local')->delete($paths->all());
            Log::notice('Candidate account purged after deletion grace period.', [
                'user_id' => $user->id,
                'files_deleted' => $paths->count(),
            ]);
            $this->line("Purged candidate #{$user->id}.");
        }

        $this->info("Purged {$users->count()} candidate account(s).");

        return self::SUCCESS;
    }
}
