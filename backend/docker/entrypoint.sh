#!/usr/bin/env bash
set -e

cd /var/www/html

if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if [ ! -f .env ]; then
    cp .env.example .env
fi

if ! grep -q '^APP_KEY=.\+$' .env; then
    php artisan key:generate --force
fi

if [ ! -d public/build ] || [ -z "$(ls -A public/build 2>/dev/null)" ]; then
    npm install
    npm run build
fi

until php artisan migrate --force; do
    echo "Waiting for the database..."
    sleep 2
done

php artisan storage:link 2>/dev/null || true

exec "$@"
