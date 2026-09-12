#!/usr/bin/env bash
set -euo pipefail

env_file="${1:-deploy/.env.prod}"
backup_dir="${2:-deploy/backups}"

if [ ! -f "$env_file" ]; then
    echo "Missing production environment file: $env_file" >&2
    exit 1
fi

umask 077
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$backup_dir/recruitment-$timestamp.sql.gz"

docker compose --env-file "$env_file" -f deploy/docker-compose.prod.yml exec -T mysql \
    sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --routines --events "$MYSQL_DATABASE"' \
    | gzip -9 > "$output"

if [ ! -s "$output" ]; then
    rm -f "$output"
    echo "Backup command produced an empty archive." >&2
    exit 1
fi

gzip -t "$output"
echo "Created verified backup: $output"
