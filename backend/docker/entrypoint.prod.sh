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
    until php artisan migrate --force --isolated; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 30 ]; then
            echo "Database did not become ready after 30 attempts" >&2
            exit 1
        fi
        echo "Waiting for the database (attempt $attempts/30)..." >&2
        sleep 3
    done
fi

exec "$@"
