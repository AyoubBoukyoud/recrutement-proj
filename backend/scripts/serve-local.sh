#!/usr/bin/env bash
set -euo pipefail

# Cache compiled PHP code between requests and allow parallel API calls.
# Timestamp checks stay enabled, so editing application code takes effect immediately.
amud_backend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$amud_backend_dir/public"
export PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"
exec php \
  -d opcache.enable_cli=1 \
  -d opcache.validate_timestamps=1 \
  -d opcache.revalidate_freq=0 \
  -S "${AMUD_API_HOST:-127.0.0.1}:${AMUD_API_PORT:-8000}" \
  "$amud_backend_dir/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php"
