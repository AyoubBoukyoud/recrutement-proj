# Recruitment Platform — monorepo

- `backend/` — Laravel 13 API (PHP 8.3)
- `web-admin/` — React + Vite admin/recruiter dashboard
- `mobile/` — React Native (Expo) app
- `docs/` — project docs

## Running with Docker

Requires Docker Desktop.

```
cp .env.example .env   # optionally set GEMINI_API_KEY
docker compose up --build
```

This starts:

| Service      | URL                            | Notes                                   |
|--------------|---------------------------------|------------------------------------------|
| backend      | http://localhost:8000            | Laravel API (`php artisan serve`)         |
| queue        | —                                 | `php artisan queue:work` (OCR/assessment jobs) |
| web-admin    | http://localhost:5173            | React admin dashboard (Vite dev server)   |
| mysql        | localhost:3307                   | MySQL 8                                   |
| phpmyadmin   | http://localhost:8081            | DB admin UI                               |

First boot installs Composer/npm dependencies, generates `backend/.env` and `APP_KEY`,
runs migrations, and links `storage`, so it takes a bit longer than subsequent
`docker compose up` runs. Source files under `backend/` and `web-admin/` are
bind-mounted, so code changes are picked up without rebuilding the images —
only rebuild (`docker compose up --build`) after changing `composer.json`,
`package.json`, or a Dockerfile.

Tesseract OCR and faster-whisper (audio transcription) are installed in the
backend image, so document OCR and language-assessment jobs work out of the
box; CV extraction via Gemini additionally needs `GEMINI_API_KEY` in `.env`.

The `mobile/` app (Expo) isn't containerized — run it locally with
`npx expo start` and point it at the backend's LAN IP.

## Running without Docker

See `backend/README.md` and `web-admin/README.md`.
