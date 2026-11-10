#!/usr/bin/env bash
# The queue worker and the scheduler: heroku.yml's `worker` process, or run
# inside the web dyno by web.sh (RUN_WORKER_IN_WEB=1).
set -euo pipefail
cd /var/www/html

if [ "${SKIP_BOOT:-0}" != "1" ]; then
    docker/heroku/boot.sh
fi

# queue:work stops itself after --max-time so no PHP process lives for days;
# on the Compose deploy Docker starts it again, here the loop does. A crash
# (database unreachable...) waits a few seconds before the next try.
(while true; do php artisan queue:work --sleep=3 --tries=3 --timeout=300 --max-time=3600 || sleep 5; done) &
(while true; do php artisan schedule:work || sleep 5; done) &

wait
