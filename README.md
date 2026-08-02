# Recruitment Platform

Connects Moroccan candidates with German employers: candidates build a verified dossier on their
phone — profile, education, language levels, scanned documents, a spoken language assessment — and
recruiters search that pool from a web console. Commercial agents bring candidates in with a QR
code and earn commission on the ones who complete a dossier.

| Directory | What it is | Runs on |
| --- | --- | --- |
| `backend/` | Laravel API — the only thing that talks to the database | `:8000` |
| `mobile/` | React Native (Expo) candidate app | Metro `:8082` |
| `web-admin/` | React + Vite console for admins, recruiters and agents | `:5173` |
| `docs/` | Spec, MVP notes, and the feature-by-feature status report | — |

This file covers **running** the project. For first-time installation — Docker, PHP extensions,
Tesseract, Whisper — see [SETUP.md](SETUP.md), which also has a troubleshooting table.

---

## Run it

Four processes, in this order. Each wants its own terminal.

```bash
# 1. Database (MySQL on :3307, phpMyAdmin on :8081)
docker compose up -d

# 2. API — bind 0.0.0.0, not localhost, or a phone cannot reach it
cd backend && php artisan serve --host=0.0.0.0 --port=8000

# 3. Queue worker — not optional, see below
cd backend && php artisan queue:work

# 4a. Web console
cd web-admin && npm run dev          # http://localhost:5173

# 4b. Candidate app
cd mobile && npx expo start --port 8082
```

Then open the app: press `w` in the Expo terminal for the browser target, or scan the QR code with
Expo Go on a phone.

### First time only

```bash
cd backend  && composer install && cp -n .env.example .env && php artisan key:generate
docker compose up -d
php artisan migrate --seed          # creates the four roles
cd ../web-admin && npm install
cd ../mobile    && npm install
```

---

## The two things that bite every time

**The mobile app finds the API by itself — leave `mobile/.env` alone.** It derives the address from
the Metro server the device is already talking to (`src/lib/api.ts`), so a phone that reached Metro
at `192.168.1.43:8082` calls the API at `192.168.1.43:8000`, and the browser target calls
`localhost:8000`. Nothing to edit when your IP changes. Metro prints the address it resolved on
startup: `[api] http://…:8000/api`.

Set `EXPO_PUBLIC_API_URL` only when the derivation cannot work — a real build, `expo start --tunnel`,
or an API somewhere other than port 8000 of this machine. If you do set it, **Metro inlines it at
startup**, so restart with `npx expo start --port 8082 --clear` after editing.

**The queue worker is part of the app, not an optimisation.** Document OCR and language assessments
are queued jobs. Without `php artisan queue:work`, every upload sits at `ocr_status=pending` and the
app shows "Queued for scanning…" forever, with no error to explain it. If that has already happened:

```bash
cd backend && php artisan documents:scan-pending --minutes=0
```

Metro uses **8082** because `8081` is phpMyAdmin's. `npx expo start` without the flag will prompt to
change ports and die in a non-interactive shell.

---

## Signing in

There is no password anywhere — every account signs in with a phone number and a six-digit code.
In `local` env the API returns the code in its own response and both clients print it on screen, so
no SMS provider is needed to develop.

```bash
curl -X POST http://127.0.0.1:8000/api/auth/otp/request \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"phone":"+212600000001"}'
# → {"message":"OTP sent.", ..., "debug_otp_code":"123456"}
```

A number that has never been seen becomes a candidate. Which console the web app shows you depends
on your role — `Administrator`, `Company` (recruiter) or `Commercial Agent` — which an administrator
assigns; grant one by hand with:

```bash
cd backend && php artisan tinker --execute='App\Models\User::where("phone","+212600000001")->first()->assignRole("Company");'
```

To send real codes instead, fill the `WHATSAPP_*` / `TWILIO_*` keys in `.env` and set
`OTP_CHANNELS=whatsapp,sms`. WhatsApp is tried first, SMS is the fallback.

---

## Check it is actually working

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/up     # 200
curl -s http://localhost:8082/status                                  # packager-status:running
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173        # 200
```

Use `localhost:5173`, not `127.0.0.1:5173` — Vite binds the IPv6 loopback only, and the IPv4
address is refused.

If the mobile app's requests hang, check the `[api] …` line Metro printed on startup: that is the
address it is calling. A phone must reach your machine's LAN IP, so both must be on the same
network and port 8000 must be open in the firewall.

---

## Tests and checks

```bash
cd backend   && php artisan test          # 183 tests
cd backend   && ./vendor/bin/pint         # formatter
cd mobile    && npx tsc --noEmit
cd web-admin && npx tsc --noEmit -p tsconfig.app.json
```

Optional local tooling, all degrading gracefully when absent: `GEMINI_API_KEY` for reading CV PDFs,
Tesseract for scanned images, `pip install faster-whisper` for the spoken language assessment.
Without them those features report an honest failure instead of crashing.

---

## Where things stand

[`docs/FEATURES_TO_IMPLEMENT.md`](docs/FEATURES_TO_IMPLEMENT.md) tracks every feature against the
spec, section by section, with the file that justifies each claim. Start there before planning work
— it supersedes the status claims in `docs/MVP.md`.
