<?php

namespace App\Support;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\Local\LocalFilesystemAdapter;

/**
 * Tesseract and Whisper are command-line tools: they read a file on this
 * machine's disk. On the `local` driver a stored file already is one. In a
 * bucket (FILE_STORAGE=s3, config/filesystems.php) it is copied to a temporary
 * file for the length of the callback, then removed.
 */
final class LocalFile
{
    /**
     * @template T
     *
     * @param  callable(string): T  $callback  receives the absolute path
     * @return T
     *
     * @throws UnreadableStoredFile
     */
    public static function use(string $disk, string $path, callable $callback): mixed
    {
        $storage = Storage::disk($disk);

        if ($storage instanceof FilesystemAdapter && $storage->getAdapter() instanceof LocalFilesystemAdapter) {
            return $callback($storage->path($path));
        }

        $source = $storage->readStream($path);
        if (! is_resource($source)) {
            throw new UnreadableStoredFile("Stored file [{$path}] could not be read from the [{$disk}] disk.");
        }

        // The extension is kept for the tools that go by it.
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $copy = sys_get_temp_dir().'/'.Str::random(40).($extension !== '' ? ".{$extension}" : '');

        try {
            $target = fopen($copy, 'wb');
            stream_copy_to_stream($source, $target);
            fclose($target);

            return $callback($copy);
        } finally {
            fclose($source);
            @unlink($copy);
        }
    }
}
