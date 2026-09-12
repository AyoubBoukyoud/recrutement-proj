#!/usr/bin/env bash
set -euo pipefail

usage() {
    echo "Usage: $0 [--bootstrap-http] [env-file]" >&2
    echo "       default mode requires HTTPS and secure session cookies" >&2
}

bootstrap_http=0
env_file="deploy/.env.prod"

while [ "$#" -gt 0 ]; do
    case "$1" in
        --bootstrap-http)
            bootstrap_http=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -* )
            usage
            exit 2
            ;;
        *)
            env_file="$1"
            shift
            ;;
    esac
done

if [ ! -f "$env_file" ]; then
    echo "Missing production environment file: $env_file" >&2
    echo "Copy deploy/.env.prod.example to deploy/.env.prod and fill it first." >&2
    exit 1
fi

env_value() {
    local name="$1"
    awk -v name="$name" '
        index($0, name "=") == 1 {
            value = substr($0, length(name) + 2)
            gsub(/^"|"$/, "", value)
            gsub(/^'"'"'|'"'"'$/, "", value)
            print value
            exit
        }
    ' "$env_file"
}

require_value() {
    local name="$1"
    local value
    value="$(env_value "$name")"
    if [ -z "$value" ]; then
        echo "$name must be set in $env_file" >&2
        return 1
    fi
}

for required in APP_KEY MYSQL_PASSWORD MYSQL_ROOT_PASSWORD EVOLUTION_DB_PASSWORD EVOLUTION_GLOBAL_API_KEY EVOLUTION_INSTANCE_TOKEN ADMIN_PHONES SITE_ADDRESS PUBLIC_URL DOMAIN_HOSTS SESSION_SECURE_COOKIE OTP_CHANNELS; do
    require_value "$required"
done

app_key="$(env_value APP_KEY)"
if [ "${#app_key}" -lt 20 ]; then
    echo "APP_KEY is too short; generate a real Laravel key." >&2
    exit 1
fi

public_url="$(env_value PUBLIC_URL)"
site_address="$(env_value SITE_ADDRESS)"
secure_cookie="$(env_value SESSION_SECURE_COOKIE)"
otp_channels="$(env_value OTP_CHANNELS)"
otp_channels_compact="${otp_channels//[[:space:]]/}"

if [ "$bootstrap_http" -eq 1 ]; then
    case "$public_url" in
        http://*) ;;
        *) echo "--bootstrap-http requires PUBLIC_URL to use http://" >&2; exit 1 ;;
    esac
else
    case "$public_url" in
        https://*) ;;
        *) echo "PUBLIC_URL must use https:// outside bootstrap mode." >&2; exit 1 ;;
    esac
    case "$site_address" in
        http://*) echo "SITE_ADDRESS must use HTTPS outside bootstrap mode." >&2; exit 1 ;;
    esac
    if [ "$secure_cookie" != "true" ]; then
        echo "SESSION_SECURE_COOKIE=true is required outside bootstrap mode." >&2
        exit 1
    fi
fi

case ",$otp_channels_compact," in
    *,log,*) echo "OTP_CHANNELS cannot include log in production." >&2; exit 1 ;;
esac

if [ "$otp_channels_compact" != "evolution" ]; then
    echo "Production OTP_CHANNELS must be exactly evolution; Twilio/SMS is not enabled." >&2
    exit 1
fi

vapid_public="$(env_value VAPID_PUBLIC_KEY)"
vapid_private="$(env_value VAPID_PRIVATE_KEY)"
browser_public="$(env_value NEXT_PUBLIC_VAPID_PUBLIC_KEY)"
if [ -n "$vapid_public" ] || [ -n "$vapid_private" ] || [ -n "$browser_public" ]; then
    require_value VAPID_PUBLIC_KEY
    require_value VAPID_PRIVATE_KEY
    require_value VAPID_SUBJECT
    if [ "$vapid_public" != "$browser_public" ]; then
        echo "VAPID_PUBLIC_KEY and NEXT_PUBLIC_VAPID_PUBLIC_KEY must match." >&2
        exit 1
    fi
fi

echo "Production environment passed preflight: $env_file"
