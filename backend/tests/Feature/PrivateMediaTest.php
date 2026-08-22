<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentOcr;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use App\Services\FileAccess;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Every candidate file (CV/diploma/ID documents, presentation video,
 * language-assessment audio, complaint voice notes) lives on the private
 * `local` disk and is only ever handed out as a short-lived signed URL — and
 * only to a viewer FileAccess actually authorizes. This is the fix for the
 * previous behaviour, where every one of these was a bare, unauthenticated
 * public URL.
 */
class PrivateMediaTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $writtenPaths = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Bus::fake([ProcessDocumentOcr::class]);

        // Storage::fake() installs a stub temporaryUrl() that returns a plain
        // "?expiration=" placeholder rather than a real signed route — it
        // can't be used to test the signature check itself. These tests
        // write to the real `local` disk instead, tracked here for cleanup.
    }

    protected function tearDown(): void
    {
        foreach ($this->writtenPaths as $path) {
            Storage::disk('local')->delete($path);
        }

        parent::tearDown();
    }

    private function candidateWithDocument(bool $discoverable = false): array
    {
        $user = User::factory()->create();
        $profile = CandidateProfileResolver::resolve($user);

        if ($discoverable) {
            $profile->update(['terms_consent_at' => now(), 'cndp_consent_at' => now()]);
        }

        $path = 'documents/'.uniqid('cv-', true).'.pdf';
        Storage::disk('local')->put($path, 'PDF CONTENT');
        $this->writtenPaths[] = $path;

        $document = $profile->documents()->create([
            'type' => 'cv',
            'file_path' => $path,
            'ocr_status' => 'completed',
        ]);

        return [$user, $profile->fresh(), $document];
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');

        return $admin;
    }

    private function recruiter(): User
    {
        $recruiter = User::factory()->create();
        $recruiter->assignRole('Company');

        return $recruiter;
    }

    // --- The owning candidate ----------------------------------------------

    public function test_a_candidate_can_open_their_own_document_via_its_signed_url(): void
    {
        [$user, , $document] = $this->candidateWithDocument();

        $url = $this->actingAs($user)->getJson("/api/candidate/documents/{$document->id}")
            ->assertOk()
            ->json('url');

        $this->assertNotNull($url);
        // Streamed via BinaryFileResponse, so getContent() is not readable
        // here — the status is what proves the signature was accepted.
        $this->get($url)->assertOk();
    }

    public function test_the_raw_storage_path_is_not_reachable_without_a_valid_signature(): void
    {
        [$user, , $document] = $this->candidateWithDocument();
        $this->actingAs($user);

        // No signature at all — this is the shape the old public URL had.
        $this->get('/storage/'.$document->file_path)->assertStatus(403);
    }

    public function test_a_signed_url_stops_working_after_it_expires(): void
    {
        [$user, , $document] = $this->candidateWithDocument();

        $url = $this->actingAs($user)->getJson("/api/candidate/documents/{$document->id}")
            ->json('url');

        $this->travel(11)->minutes();

        $this->get($url)->assertStatus(403);
    }

    // --- Administrators ------------------------------------------------------

    public function test_an_administrator_can_open_any_candidates_document(): void
    {
        [, , $document] = $this->candidateWithDocument();
        $admin = $this->admin();

        $url = $this->actingAs($admin)->getJson("/api/admin/candidates/{$document->candidate_profile_id}")
            ->assertOk()
            ->json('documents.0.url');

        $this->assertNotNull($url);
        $this->get($url)->assertOk();
    }

    // --- Recruiters — gated by the same consent rule as search visibility --

    public function test_a_recruiter_gets_no_document_url_for_a_non_discoverable_candidate(): void
    {
        [, $profile, $document] = $this->candidateWithDocument(discoverable: false);
        $recruiter = $this->recruiter();

        // Not visible at all — the dossier endpoint itself 404s.
        $this->actingAs($recruiter)->getJson("/api/recruiter/candidates/{$profile->id}")->assertNotFound();

        // Direct unit check too: even if a document object were serialized to
        // this viewer some other way, FileAccess must still refuse it.
        $this->assertNull(FileAccess::dossierUrl($document->file_path, $profile, $recruiter));
    }

    public function test_a_recruiter_gets_a_working_document_url_once_the_candidate_is_discoverable(): void
    {
        [, $profile] = $this->candidateWithDocument(discoverable: true);
        $recruiter = $this->recruiter();

        $url = $this->actingAs($recruiter)->getJson("/api/recruiter/candidates/{$profile->id}")
            ->assertOk()
            ->json('documents.0.url');

        $this->assertNotNull($url);
        $this->get($url)->assertOk();
    }

    // --- Complaint audio: never recruiter-visible, unlike dossier evidence -

    public function test_complaint_audio_is_visible_to_the_complainant_and_an_administrator_only(): void
    {
        $candidate = User::factory()->create();
        $audioPath = 'complaints/'.uniqid('note-', true).'.wav';
        Storage::disk('local')->put($audioPath, 'AUDIO');
        $this->writtenPaths[] = $audioPath;

        $complaint = $candidate->complaints()->create([
            'type' => 'voice',
            'audio_path' => $audioPath,
            'status' => 'open',
            'admin_notified_at' => null,
        ]);

        $this->assertNotNull(FileAccess::complaintUrl($complaint->audio_path, $complaint->user_id, $candidate));
        $this->assertNotNull(FileAccess::complaintUrl($complaint->audio_path, $complaint->user_id, $this->admin()));

        // A recruiter is never an authorized viewer of a complaint, discoverable or not.
        $this->assertNull(FileAccess::complaintUrl($complaint->audio_path, $complaint->user_id, $this->recruiter()));

        // Nor is an unrelated candidate.
        $this->assertNull(FileAccess::complaintUrl($complaint->audio_path, $complaint->user_id, User::factory()->create()));
    }

    public function test_an_unauthenticated_viewer_gets_no_url_at_all(): void
    {
        [, $profile, $document] = $this->candidateWithDocument();

        $this->assertNull(FileAccess::dossierUrl($document->file_path, $profile, null));
    }
}
