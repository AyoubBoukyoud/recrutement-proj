<?php

/*
 * Where uploads live. `local` keeps them on this machine's disk, which is right
 * for the Docker Compose deploy (a named volume). A Heroku dyno's disk is wiped
 * on every restart, at least daily, so there FILE_STORAGE=s3 moves both disks
 * to S3-compatible buckets (Cloudflare R2, AWS S3...) — see deploy/HEROKU.md:
 *
 * - `local`, the private candidate files: AWS_BUCKET, never public. FileAccess
 *   hands out presigned links that expire, as it hands out signed ones here.
 * - `public`, the company logos: AWS_PUBLIC_BUCKET, linked at AWS_PUBLIC_URL
 *   (the bucket's public domain).
 *
 * The disk names stay the same so no call site has to know. The buckets get no
 * `visibility`: R2 has no per-object ACLs, public access is a bucket setting.
 */
$onBuckets = env('FILE_STORAGE', 'local') === 's3';

$bucket = fn (?string $name, ?string $url = null): array => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'auto'),
    'bucket' => $name,
    'url' => $url,
    'endpoint' => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    'retain_visibility' => false,
    'throw' => false,
    'report' => false,
];

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => $onBuckets ? $bucket(env('AWS_BUCKET')) : [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => $onBuckets ? $bucket(env('AWS_PUBLIC_BUCKET'), env('AWS_PUBLIC_URL')) : [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
