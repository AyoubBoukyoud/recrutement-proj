<?php

namespace App\Console\Commands;

use App\Jobs\ProcessDocumentOcr;
use App\Models\Document;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Catch-up scanning for documents nothing ever picked up.
 *
 * Uploading dispatches ProcessDocumentOcr onto the database queue, so a
 * document whose job is never worked sits at `pending` forever and the app
 * shows the candidate "Queued for scanning…" indefinitely — no error, no
 * retry, nothing to click. The usual cause is simply that `queue:work` is not
 * running, which is easy to do on a dev machine and not much harder in
 * production after a deploy.
 *
 * This runs the same job inline for anything that has been waiting too long.
 * Safe to schedule: the age threshold keeps it from racing a worker that has
 * just claimed a job, and re-scanning a document overwrites its extraction
 * rather than duplicating it.
 */
class ScanPendingDocuments extends Command
{
    protected $signature = 'documents:scan-pending
        {--minutes=5 : Only documents waiting at least this long}
        {--limit=25 : Most documents to scan in one run}';

    protected $description = 'Scan documents left waiting — the catch-up for a queue worker that was not running';

    public function handle(): int
    {
        $waitingSince = Carbon::now()->subMinutes((int) $this->option('minutes'));

        $documents = Document::query()
            // `processing` too: a worker killed mid-job leaves that behind, and
            // it is just as stuck as `pending`.
            ->whereIn('ocr_status', ['pending', 'processing'])
            ->where('updated_at', '<=', $waitingSince)
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get();

        if ($documents->isEmpty()) {
            $this->info('Nothing waiting.');

            return self::SUCCESS;
        }

        $this->info("Scanning {$documents->count()} document(s) left waiting.");

        foreach ($documents as $document) {
            $this->line("  #{$document->id} {$document->type} … ");

            // Called through the container so the extractors are injected the
            // same way the queue would inject them.
            app()->call([new ProcessDocumentOcr($document->id), 'handle']);

            $document->refresh()->loadMissing('extraction');
            $this->line("    → {$document->ocr_status} (confidence ".($document->extraction->confidence ?? '—').')');
        }

        return self::SUCCESS;
    }
}
