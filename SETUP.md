# Local setup

Monorepo with three apps:

| Folder       | What it is                        | Runs on                  |
| ------------ | --------------------------------- | ------------------------ |
| `backend/`   | Laravel 13 API                    | http://127.0.0.1:8000    |
| `web-admin/` | React + Vite admin/recruiter UI   | http://localhost:5173    |
| `mobile/`    | React Native (Expo) candidate app | Metro on port **8082**   |

MySQL + phpMyAdmin run in Docker.

---

## 1. Prerequisites

| Tool         | Version              | Check                    |
| ------------ | -------------------- | ------------------------ |
| PHP          | 8.3+ (8.4 is fine)   | `php -v`                 |
| Composer     | 2.x                  | `composer -V`            |
| Node.js      | 20+ (22 recommended) | `node -v`                |
| Docker + Compose plugin | any recent | `docker compose version` |

PHP needs these extensions: `pdo_mysql`, `mbstring`, `xml`, `curl`, `zip`, `gd`, `bcmath`.

Optional, only for the OCR / language-assessment features:
- `tesseract` (image OCR — PDFs go through Gemini instead)
- `python3` + `pip install faster-whisper` (audio transcription). Without it, a language
  assessment finishes as `failed` with `failure_reason=transcription_unavailable` rather than
  crashing the queue — the rest of the app is unaffected. The clarity/pronunciation score also
  needs word timestamps, which this package provides by default.

Both degrade gracefully when missing; the rest of the app works without them.

### Installing Docker

**Ubuntu / Debian**

```bash
# remove distro packages that conflict
sudo apt remove -y docker docker-engine docker.io containerd runc

sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

(On Debian, replace `ubuntu` with `debian` in both URLs.)

**Fedora**

```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

**Both — enable and allow non-root use**

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Log out and back in (or run `newgrp docker`) for the group change to apply, then verify:

```bash
docker run --rm hello-world
docker compose version
```

**macOS / Windows** — install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and launch it once. On Windows, work inside WSL2 (Ubuntu) and enable the WSL integration in Docker Desktop settings; running the PHP/Node toolchain from WSL rather than PowerShell avoids a pile of path issues.

---

## 2. Database (Docker)

From the repo root:

```bash
docker compose up -d
```

This starts:
- MySQL 8 on host port **3307** (db `recruitment`, user `recruitment`, password `recruitment`)
- phpMyAdmin on http://localhost:8081 (root / root)

Check both are healthy:

```bash
docker compose ps
```

> Port 8081 is taken by phpMyAdmin — that is why the Expo dev server must use 8082 (see step 4).

---

## 3. Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Now edit `backend/.env` — `.env.example` defaults to SQLite, but this project uses the Docker MySQL:

```dotenv
APP_NAME="Recruitment Platform API"
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=recruitment
DB_USERNAME=recruitment
DB_PASSWORD=recruitment

QUEUE_CONNECTION=database

# Optional: CV parsing from PDFs. Without a key, PDF extraction is skipped.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

`APP_ENV=local` matters: it makes the OTP endpoint return `debug_otp_code` in the response, so you can log in without any SMS provider. That only holds while `OTP_CHANNELS=log` (the default) — the code is never echoed back once a real provider delivers it.

To send real codes, fill the `WHATSAPP_*` and `TWILIO_*` keys in `.env.example` and set `OTP_CHANNELS=whatsapp,sms`: WhatsApp is tried first, SMS is the fallback, and a channel with missing credentials is skipped. Delivery limits (`OTP_RESEND_COOLDOWN`, `OTP_MAX_SENDS`, `OTP_MAX_ATTEMPTS`) live in `config/otp.php`.

Then:

```bash
php artisan migrate --seed
php artisan storage:link
```

Seeded accounts (phone numbers — login is by phone, not password):

| Role                | Phone           |
| ------------------- | --------------- |
| Administrator       | `+212600000001` |
| Company (recruiter) | `+212600000002` |
| Commercial Agent    | `+212600000003` |

Run the API **and** the queue worker — two terminals, both required:

```bash
# terminal 1
php artisan serve --host=0.0.0.0 --port=8000

# terminal 2
php artisan queue:work
```

The queue worker is not optional: document OCR and language assessment are queued jobs. Without it, every upload sits at `ocr_status=pending` and looks broken — the app shows "Queued for scanning…" with nothing behind it.

If that has already happened, `php artisan documents:scan-pending --minutes=0` scans everything left waiting, inline. The same command is scheduled every ten minutes (`routes/console.php`) as a safety net, which only runs if `php artisan schedule:work` — or a real cron entry — is running.

Sanity check: `curl http://127.0.0.1:8000/api/auth/otp/request -H 'Accept: application/json' -d 'phone=+212600000001'` should return JSON containing `debug_otp_code`. A second identical call within 60 seconds is meant to return `429` with a `retry_after` — that is the resend cooldown, not a bug.

---

## 4. Web admin

```bash
cd web-admin
npm install
npm run dev
```

Opens on http://localhost:5173 — Vite binds the IPv6 loopback only, so `127.0.0.1:5173` is refused. `web-admin/.env` already points at `http://127.0.0.1:8000/api`.

Login: enter a seeded phone number, and the OTP code is shown on screen (local env only).

---

## 5. Mobile app (Expo)

```bash
cd mobile
npm install
```

**No API URL to set.** The app derives it from the Metro dev server the device is already connected
to (`src/lib/api.ts`), so a phone that reached Metro on your LAN IP calls the API on the same IP,
port 8000. Metro logs what it resolved: `[api] http://…:8000/api`.

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` only for a real build, for `expo start --tunnel`, or for
an API that is not on port 8000 of this machine. It wins over the derivation when present, and Metro
inlines it at startup — restart with `--clear` after changing it.

Start Metro on 8082 (8081 is phpMyAdmin's):

```bash
npx expo start --port 8082
```

Then either:
- **Web** — press `w`. Fastest path, no device needed.
- **Device** — scan the QR with Expo Go. Expo Go must be current enough for SDK 57; if you get "Project is incompatible with this version of Expo Go", update it from the Play Store / App Store.

Your phone and laptop must be on the same network, and port 8000 must not be blocked by the firewall (`sudo firewall-cmd --add-port=8000/tcp` on Fedora, `sudo ufw allow 8000` on Ubuntu).

---

## Daily startup

```bash
docker compose up -d                                       # db
cd backend && php artisan serve --host=0.0.0.0 --port=8000 # api
cd backend && php artisan queue:work                       # jobs
cd web-admin && npm run dev                                # admin
cd mobile && npx expo start --port 8082                    # app
```

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `SQLSTATE[HY000] [2002] Connection refused` | Docker not up, or `DB_PORT` isn't `3307` |
| Expo prompts to change port / exits | Port 8081 held by phpMyAdmin — pass `--port 8082` |
| App requests hang or `ERR_CONNECTION_REFUSED` | `EXPO_PUBLIC_API_URL` has a stale IP, or `php artisan serve` isn't running / isn't bound to `0.0.0.0` |
| Uploads stuck at `pending` | `php artisan queue:work` isn't running. To scan what is already waiting: `php artisan documents:scan-pending --minutes=0` |
| A change "saved" on the phone never reaches the server | It is in the device's offline queue — Account → *Saved on this device* lists what is waiting and anything that needs a decision |
| Uploads fail in the browser build with no queueing | Expected: media uploads are online-only on web, by design (G) |
| No OTP code shown | `APP_ENV` isn't `local`, or `OTP_CHANNELS` is not `log` |
| `429` on sign-in | Resend cooldown (60s) or the per-number hourly ceiling; `retry_after` says how long |
| Config changes ignored | `php artisan config:clear` |
