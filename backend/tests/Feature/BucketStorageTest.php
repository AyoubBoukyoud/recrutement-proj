<?php

namespace Tests\Feature;

use App\Support\LocalFile;
use App\Support\UnreadableStoredFile;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

/**
 * FILE_STORAGE=s3 (the Heroku deploy, deploy/HEROKU.md) keeps uploads in
 * buckets, where the OCR and Whisper jobs cannot just open a path the way
 * they do on the local disk.
 */
class BucketStorageTest extends TestCase
{
    public function test_a_local_upload_is_used_in_place(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('assessments/clip.webm', 'audio');

        $seen = LocalFile::use('local', 'assessments/clip.webm', fn (string $path) => $path);

        $this->assertSame(Storage::disk('local')->path('assessments/clip.webm'), $seen);
        Storage::disk('local')->assertExists('assessments/clip.webm');
    }

    public function test_a_bucket_upload_is_copied_for_the_callback_and_removed_after(): void
    {
        $this->bucketReturning(fopen('data://text/plain,%PDF-1.7 scan', 'rb'));

        [$path, $contents] = LocalFile::use(
            'local',
            'documents/cv.pdf',
            fn (string $path) => [$path, file_get_contents($path)],
        );

        $this->assertSame('%PDF-1.7 scan', $contents);
        $this->assertStringEndsWith('.pdf', $path);
        $this->assertFileDoesNotExist($path);
    }

    public function test_an_unreadable_bucket_upload_is_reported(): void
    {
        $this->bucketReturning(null);

        $this->expectException(UnreadableStoredFile::class);

        LocalFile::use('local', 'documents/gone.pdf', fn () => $this->fail('The callback must not run.'));
    }

    public function test_file_storage_s3_puts_both_upload_disks_on_buckets(): void
    {
        $disks = $this->filesystemsConfigWith([
            'FILE_STORAGE' => 's3',
            'AWS_ACCESS_KEY_ID' => 'key',
            'AWS_SECRET_ACCESS_KEY' => 'secret',
            'AWS_ENDPOINT' => 'https://account.r2.cloudflarestorage.com',
            'AWS_BUCKET' => 'amud-private',
            'AWS_PUBLIC_BUCKET' => 'amud-public',
            'AWS_PUBLIC_URL' => 'https://files.example.test',
        ])['disks'];

        $this->assertSame('s3', $disks['local']['driver']);
        $this->assertSame('amud-private', $disks['local']['bucket']);
        $this->assertSame('auto', $disks['local']['region']);
        $this->assertArrayNotHasKey('visibility', $disks['local']);
        $this->assertSame('amud-public', $disks['public']['bucket']);

        // Signed and public links are built locally, without calling the bucket.
        $signed = Storage::build($disks['local'])->temporaryUrl('documents/cv.pdf', now()->addMinutes(10));
        $this->assertStringStartsWith('https://amud-private.account.r2.cloudflarestorage.com/documents/cv.pdf?', $signed);
        $this->assertStringContainsString('X-Amz-Signature=', $signed);

        $this->assertSame(
            'https://files.example.test/company-logos/acme.png',
            Storage::build($disks['public'])->url('company-logos/acme.png'),
        );
    }

    public function test_the_local_disks_stay_local_by_default(): void
    {
        $disks = $this->filesystemsConfigWith([])['disks'];

        $this->assertSame('local', $disks['local']['driver']);
        $this->assertSame('local', $disks['public']['driver']);
    }

    /** @param  resource|null  $stream */
    private function bucketReturning($stream): void
    {
        $bucket = Mockery::mock(Filesystem::class);
        $bucket->shouldReceive('readStream')->andReturn($stream);

        Storage::shouldReceive('disk')->with('local')->andReturn($bucket);
    }

    /**
     * config/filesystems.php evaluated under the given environment.
     *
     * @param  array<string, string>  $env
     * @return array<string, mixed>
     */
    private function filesystemsConfigWith(array $env): array
    {
        // Cleared unless given, so the developer's own .env cannot leak in.
        $keys = array_unique(['FILE_STORAGE', 'AWS_DEFAULT_REGION', 'AWS_USE_PATH_STYLE_ENDPOINT', ...array_keys($env)]);
        $previous = [];
        foreach ($keys as $key) {
            $raw = getenv($key);
            $previous[$key] = $_ENV[$key] ?? $_SERVER[$key] ?? ($raw === false ? null : $raw);
        }

        try {
            foreach ($keys as $key) {
                $this->setEnv($key, $env[$key] ?? null);
            }

            return require config_path('filesystems.php');
        } finally {
            foreach ($previous as $key => $value) {
                $this->setEnv($key, $value);
            }
        }
    }

    private function setEnv(string $key, ?string $value): void
    {
        if ($value === null) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);

            return;
        }

        putenv("{$key}={$value}");
        $_ENV[$key] = $_SERVER[$key] = $value;
    }
}
