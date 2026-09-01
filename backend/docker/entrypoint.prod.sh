#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is required" >&2
    exit 1
fi

mkdir -p \
    storage/app/private \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

php artisan config:cache
php artisan view:cache
php artisan storage:link >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
    attempts=0
    # This is the only service allowed to migrate. Do not use --isolated on a
    # fresh database: its lock uses CACHE_STORE=database before the cache table
    # has itself been created by the first migration batch.
    until php artisan migrate --force; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 30 ]; then
            echo "Database did not become ready after 30 attempts" >&2
            exit 1
        fi
        echo "Waiting for the database (attempt $attempts/30)..." >&2
        sleep 3
    done

    # Roles are required reference data, not demo content. Keep them present
    # on fresh databases without running DatabaseSeeder's test accounts and
    # demo records in production.
    php artisan db:seed --class='Database\Seeders\RoleSeeder' --force
fi

exec "$@"
