# Local setup

Monorepo with three apps:

| Folder       | What it is                                          | Runs on                  |
| ------------ | ---------------------------------------------------- | ------------------------ |
| `backend/`   | Laravel 13 API                                       | http://127.0.0.1:8000    |
| `frontend/`  | Next.js PWA — candidate, recruiter, admin, agent, one login | http://localhost:3000    |
| `mobile/`    | React Native (Expo) candidate app                    | Metro on port **8082**   |

`web-admin/` no longer exists: its recruiter search, admin console and agent referral screens were
merged into `frontend/` (see § 4), same tech stack (Next.js/TypeScript/Tailwind) and reached through
the same phone-number login as everyone else.

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

To send real codes, set `OTP_CHANNELS` to a comma-separated chain. Channels are tried left to right, the first that is configured *and* succeeds wins, and a channel with missing credentials is skipped rather than counted as a failure. Delivery limits (`OTP_RESEND_COOLDOWN`, `OTP_MAX_SENDS`, `OTP_MAX_ATTEMPTS`) live in `config/otp.php`.

| Chain | What it needs |
| --- | --- |
| `evolution,sms` | A self-hosted WhatsApp gateway paired by QR — see [§6](#6-whatsapp-otp-via-evolution-go). No Meta account. |
| `whatsapp,sms` | A Meta Business account with an approved AUTHENTICATION template (`WHATSAPP_*`). |
| `log` | Nothing — the default. |

`sms` is Twilio (`TWILIO_*`) and exists to catch candidates without WhatsApp; keep it last.

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

## 4. Web app (candidate, recruiter, admin, agent)

```bash
cd frontend
npm install
npm run dev
```

Opens on http://localhost:3000. `.env.example` points at `http://localhost:8000/api`; copy it to
`.env.local` and adjust if the backend runs elsewhere. Set `NEXT_PUBLIC_USE_MOCKS=1` there instead to
work on any of the four surfaces with no backend running at all — every screen falls back to fixture
data behind a mock seam (`src/data/`, `src/data/mockAdapter.ts`).

One login for every role: `/auth-phone` has a "Job seeker / Recruiter" toggle, but it only changes
the copy on screen — the phone number always goes through the same OTP request, and where you land
afterwards is decided by the account's actual role, never by which button was clicked. A phone
number with no elevated role always lands as a candidate, toggle notwithstanding.

| Role (Spatie)      | Seeded phone     | Lands on           |
| ------------------- | ---------------- | ------------------- |
| Administrator        | `+212600000001` | `/admin/apercu`    |
| Company (recruiter)  | `+212600000002` | `/recruiter`        |
| Commercial Agent     | `+212600000003` | `/agent`             |
| User (candidate)     | any other number | `/dashboard` (or the profile wizard, if incomplete) |

Login: enter a seeded phone number, and the OTP code is shown on screen (local env only, `OTP_CHANNELS=log`).

The admin console is itself routed into sections rather than one long page: `/admin/apercu`
(metrics), `/admin/candidats(/:id)`, `/admin/reclamations`, `/admin/stage`, `/admin/utilisateurs`,
`/admin/parrainage` — each independently addressable, with `?status=` filters on the two screens that
support one.

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

## 6. WhatsApp OTP via Evolution Go

Skip this unless you want real WhatsApp codes. `OTP_CHANNELS=log` signs you in without it.

[Evolution Go](https://github.com/evolution-foundation/evolution-go) drives an ordinary WhatsApp
account you pair by QR, so the code goes out as plain text — no Business account, no template to get
approved, no per-message fee. The trade is that delivery lives or dies with that pairing, which is
why `sms` belongs behind it in the chain.

Start the gateway (already in `docker-compose.yml`, on port 4000):

```bash
export EVOLUTION_GLOBAL_API_KEY=pick-something-long
docker compose up -d evolution-go
```

Create an instance. `GLOBAL_API_KEY` authenticates this call; the `token` you choose here becomes
the instance's own key, and it is that one — not the global key — that every send is made with:

```bash
curl -X POST http://localhost:4000/instance/create \
  -H "apikey: $EVOLUTION_GLOBAL_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"name": "recruitment-otp", "token": "pick-an-instance-token"}'
```

Connect it, then pair the phone that will send the codes:

```bash
curl -X POST http://localhost:4000/instance/connect -H "apikey: pick-an-instance-token"
curl -s http://localhost:4000/instance/qr -H "apikey: pick-an-instance-token"
```

Scan that QR from WhatsApp on the sending phone (Settings → Linked devices → Link a device). The
gateway's web manager at http://localhost:4000/manager renders it for you if you would rather not
decode the payload by hand. Confirm before wiring it up:

```bash
curl -s http://localhost:4000/instance/status -H "apikey: pick-an-instance-token"
```

Point the backend at it in `backend/.env` and restart:

```env
OTP_CHANNELS=evolution,sms
EVOLUTION_BASE_URL=http://localhost:4000
EVOLUTION_INSTANCE_TOKEN=pick-an-instance-token
```

```bash
cd backend && php artisan config:clear
```

Two things worth knowing before this reaches candidates:

- **Sending to a number with no WhatsApp account looks like success.** The gateway hands the message
  to the network and nothing bounces back. `EvolutionGoOtpChannel` therefore calls `/user/check`
  first and treats "not on WhatsApp" as a failure, so the chain falls through to SMS. Set
  `EVOLUTION_CHECK_NUMBER=false` to skip that round-trip, and accept that those candidates then get
  nothing at all.
- **This is not an official Meta channel.** The sending account is a normal WhatsApp account driven
  by an unofficial client, and Meta can ban it for bulk or unsolicited messaging. Use a dedicated
  number, keep the per-number limits in `config/otp.php` in place, and keep `sms` behind it.

---

## Daily startup

```bash
docker compose up -d                                       # db
cd backend && php artisan serve --host=0.0.0.0 --port=8000 # api
cd backend && php artisan queue:work                       # jobs
cd frontend && npm run dev                                 # candidate + recruiter + admin + agent
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
| WhatsApp codes stop arriving | The Evolution Go pairing dropped. `curl -s localhost:4000/instance/status -H "apikey: $EVOLUTION_INSTANCE_TOKEN"`; re-scan the QR if it is disconnected |
| Sign-in falls back to SMS every time | The gateway is unreachable or the instance is not connected — `docker compose logs evolution-go`, and check `EVOLUTION_INSTANCE_TOKEN` is the *instance* token, not `GLOBAL_API_KEY` |
| `429` on sign-in | Resend cooldown (60s) or the per-number hourly ceiling; `retry_after` says how long |
| Config changes ignored | `php artisan config:clear` |
