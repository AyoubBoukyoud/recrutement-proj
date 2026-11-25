<?php

namespace App\Services\LanguageTest;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

/**
 * Browsers record WebM/Opus (Chrome, Firefox) or MP4/AAC (Safari); Gemini
 * reliably reads WAV, MP3, AAC, OGG and FLAC. When ffmpeg is installed the
 * recording is converted to 16 kHz mono WAV — small, universally accepted,
 * and its length can be read straight from the file size. Camera answers
 * require extraction; an audio-only or unreadable file is never graded as video.
 */
class AudioForModel
{
    private const RATE = 16000;

    /** The oral is one video: require both tracks and extract its own sound. */
    public function prepareVideo(string $absolutePath): array
    {
        $probe = Process::timeout(30)->run([
            'ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', $absolutePath,
        ]);
        $tracks = array_column(json_decode($probe->output(), true)['streams'] ?? [], 'codec_type');
        if (! $probe->successful() || ! in_array('video', $tracks, true) || ! in_array('audio', $tracks, true)) {
            throw new InvalidOralRecording('The camera recording must contain video and audio.');
        }
        $prepared = $this->prepare($absolutePath);
        if (! $prepared['temporary']) {
            throw new InvalidOralRecording('The camera recording audio could not be extracted.');
        }

        return $prepared;
    }

    /**
     * @return array{path: string, mime: string, seconds: float|null, temporary: bool}
     */
    public function prepare(string $absolutePath, ?string $originalMime = null): array
    {
        $original = [
            'path' => $absolutePath,
            'mime' => self::modelMime($originalMime ?? (mime_content_type($absolutePath) ?: 'audio/webm')),
            'seconds' => null,
            'temporary' => false,
        ];

        if (! $this->hasFfmpeg()) {
            return $original;
        }

        $out = tempnam(sys_get_temp_dir(), 'oral');
        $result = Process::timeout(120)->run([
            'ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', $absolutePath,
            '-vn', '-ac', '1', '-ar', (string) self::RATE, '-c:a', 'pcm_s16le', '-f', 'wav', $out,
        ]);

        if (! $result->successful() || ! is_file($out) || filesize($out) <= 44) {
            Log::warning('Oral audio conversion failed: '.$result->errorOutput());
            @unlink($out);

            return $original;
        }

        return [
            'path' => $out,
            'mime' => 'audio/wav',
            'seconds' => round((filesize($out) - 44) / (self::RATE * 2), 1),
            'temporary' => true,
        ];
    }

    public function release(array $prepared): void
    {
        if ($prepared['temporary'] ?? false) {
            @unlink($prepared['path']);
        }
    }

    private function hasFfmpeg(): bool
    {
        static $has = null;

        return $has ??= Process::run(['ffmpeg', '-version'])->successful();
    }

    /** Container types the browser reports, mapped to what the model is told. */
    private static function modelMime(string $mime): string
    {
        $base = strtolower(trim(explode(';', $mime)[0]));

        return match ($base) {
            'video/webm' => 'audio/webm',
            'video/mp4', 'audio/x-m4a' => 'audio/mp4',
            default => $base,
        };
    }
}
