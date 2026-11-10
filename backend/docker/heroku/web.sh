#!/usr/bin/env bash
# The `web` process (heroku.yml): php-fpm behind nginx on $PORT.
#
# RUN_WORKER_IN_WEB=1 also runs worker.sh in this dyno, so one Basic dyno is
# the whole backend. With a separate worker dyno, set it to 0, or the
# scheduler runs twice.
set -euo pipefail
cd /var/www/html

docker/heroku/boot.sh

sed "s/__PORT__/${PORT:?Heroku sets PORT}/" docker/heroku/nginx.conf > /tmp/nginx.conf

php-fpm --nodaemonize &
nginx -e /dev/stderr -c /tmp/nginx.conf -g 'daemon off;' &

if [ "${RUN_WORKER_IN_WEB:-0}" = "1" ]; then
    SKIP_BOOT=1 docker/heroku/worker.sh &
fi

# One of them stopping stops the dyno, and Heroku restarts all of it, rather
# than leave a dyno up with half the stack gone. On shutdown Heroku signals
# every process in the dyno itself.
wait -n
