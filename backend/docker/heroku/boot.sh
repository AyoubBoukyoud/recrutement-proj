#!/usr/bin/env bash
# Dyno start-up, shared by web.sh and worker.sh. Runs here rather than at build
# time because Heroku's config vars only exist once the dyno is running.
set -euo pipefail
cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is required (heroku config:set APP_KEY=...)" >&2
    exit 1
fi

mkdir -p /tmp/nginx \
    storage/app/private \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

php artisan config:cache
php artisan view:cache
