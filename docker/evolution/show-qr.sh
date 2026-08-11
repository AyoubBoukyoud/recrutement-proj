#!/usr/bin/env bash
# Réaffiche un QR frais pour appairer le téléphone émetteur. Les QR WhatsApp
# tournent toutes les ~20 s : relancer ce script si celui affiché a expiré.
set -euo pipefail
cd "$(dirname "$0")/../.."
TOKEN=$(grep EVOLUTION_INSTANCE_TOKEN .env | cut -d= -f2)
BASE=${EVOLUTION_BASE_URL:-http://localhost:4000}
OUT=$(mktemp --suffix=.png)

curl -s "$BASE/instance/qr" -H "apikey: $TOKEN" \
  | python3 -c "import sys,json,base64;d=json.load(sys.stdin)['data']['qrcode'].split(',',1)[1];sys.stdout.buffer.write(base64.b64decode(d))" > "$OUT"

echo "QR: $OUT"
xdg-open "$OUT" >/dev/null 2>&1 || true
