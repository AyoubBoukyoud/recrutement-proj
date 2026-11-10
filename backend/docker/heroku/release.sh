#!/usr/bin/env bash
# heroku.yml's `release` command: once per deploy, before the new image takes
# traffic. If it fails, the deploy stops and the previous release keeps
# serving. The same steps as RUN_MIGRATIONS=1 in entrypoint.prod.sh (the
# reasons for each are there), minus the wait: the database is a managed one.
set -euo pipefail
cd /var/www/html

php artisan migrate --force
php artisan db:seed --class='Database\Seeders\RoleSeeder' --force
php artisan db:seed --class='Database\Seeders\AdminPhoneSeeder' --force
