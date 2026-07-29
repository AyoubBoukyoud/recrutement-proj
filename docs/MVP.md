Recruitment Platform MVP — Implementation Plan

Context

docs/Project_Summary_Recruitment_Platform.md specifies a mobile-first international recruitment platform (candidate profiles, OCR, AI language assessment, recruiter search, referral QR system, admin dashboard) built on Laravel + React Native + React + MySQL. The repo is currently empty except for that doc. The user wants:
- A working monorepo scaffold (not just a document) that runs entirely locally — no hosting/deployment concerns yet.
- Free/local tooling for OCR and AI language assessment (no paid cloud APIs), so it can actually be tested.
- A phased roadmap for the remaining features beyond the initial scaffold.

This plan defines the Phase 0 scaffold that will be built now (three apps talking to each other end-to-end through one real feature slice: phone-OTP login + candidate profile CRUD), and a written roadmap for Phases 1–8 to implement in later sessions.

Repo Layout (monorepo)

mobile-app-rent/
  backend/        Laravel 11 API
  web-admin/      React + Vite admin/recruiter dashboard
  mobile/         React Native (Expo) app
  docker-compose.yml   MySQL + phpMyAdmin for local dev
  docs/           (existing)

Free/local tooling decisions

- OTP delivery: OtpChannel abstraction in Laravel with a log driver (writes code to storage/logs/laravel.log and echoes it back in the API response when APP_ENV=local) as the default — no Twilio/WhatsApp Business account needed to test. Interface is swappable for a real SMS/WhatsA
- OCR: thiagoalessio/tesseract_ocr (PHP wrapper around Tesseract OCR) — fully local, free, no API key. Matches the doc's
own "local open-source OCR" option.
- AI language assessment: local openai-whisper (or whisper.cpp) CLI invoked from a Laravel queued job to transcribe the
candidate's audio, then a rule-based scorer io, filler-word ratio, vocabulary-complexitymatch against a CEFR wordlist) maps the transcript to an approximate CEFR level. This is a pragmatic MVP approximation,
not real pronunciation-scoring ML — flagged DME so it's not mistaken for production-gradeassessment.
- Queue: Laravel database queue driver (no R php artisan queue:work.
- File storage: local disk (storage/app/public).

Backend (Laravel) — Phase 0 scope

- laravel new backend, install laravel/sanctum (API tokens) and spatie/laravel-permission (roles: Administrator, User, Commercial Agent, Company).
- docker-compose.yml at repo root: mysql:8 + phpmyadmin, backend .env pointed at it.
- Migrations for the full core schema (so laers, not more tables):
  - users (+ phone, phone_verified_at, role via spatie pivot)
  - candidate_profiles (first/last name, dobconsent_at, terms_consent_at)
  - educations (candidate_id, level, field, institution, dates)
  - candidate_languages (candidate_id, langu, self_declared|certified,certificate_document_id)
  - documents (owner_id, type[cv|certificateatus)
  - document_extractions (document_id, extracted_fields json, confidence, reviewed_at)
  - language_assessments (candidate_id, lang, wpm, filler_ratio, predicted_cefr,badge_awarded_at)
  - complaints (user_id, type[text|voice], bn_notified_at)
  - referral_agents (user_id, qr_code_token)                                                                                - referral_registrations (agent_id, candid
- Vertical slice implemented now (proves the stack end-to-end):                                                             - POST /api/auth/otp/request and /api/authg-driver OTP) → returns Sanctum token.
  - GET/PUT /api/candidate/profile — authenticated CRUD on candidate_profiles.                                              - Role middleware wired via spatie, applieand /api/recruiter/ping route to prove rolegating works.                                                                                                             - Everything else (OCR pipeline, assessment , referrals, admin checklist) is stubbed asroutes returning 501/placeholder so the API surface exists, but full logic is roadmap (Phases 1–8 below).                
Web Admin/Recruiter (React + Vite) — Phase 0 scope                                                                       
- npm create vite@latest web-admin -- --template react-ts; add react-router-dom, @tanstack/react-query, axios.            - Bearer-token auth against the Sanctum API simplest for local dev across ports).
- Screens: Login, empty Admin dashboard shell, empty Recruiter search shell — just enough to prove the web app            authenticates against the same backend as mo
                                                                                                                          Mobile (React Native / Expo) — Phase 0 scope
                                                                                                                          - npx create-expo-app mobile (Expo chosen ovc, QR scanner, haptics, notifications, and SQLite all as first-party modules with no native build step — critical for fast free local testing via Expo Go).                 - Add react-navigation, @tanstack/react-quer8next (pre-wire ar/fr/en/de resource files + RTLtoggle for Arabic, even if only English strings are filled in initially).                                                 - Screens: Phone entry → OTP verify → minimaame, last name, dob) hitting the real backendendpoints above.                                                                                                         
Roadmap (Phases 1–8, built in later sessions)                                                                            
1. Full profile builder — multi-step animated form (education, languages with CEFR progress bars, availability, consents, in-app video presentation recording via expo
2. Document upload + OCR — camera/file upload → Tesseract job → pre-fill review screen → confidence-threshold fallback to manual entry.
3. AI language assessment — record 1-minute prompt via expo-av, upload, Whisper transcription job, CEFR heuristic
scoring, badge on profile.
4. Recruiter web portal — multi-filter search (profession, specialization, language, experience, availability), unified
candidate card (CV/certs download, assessmen
5. Complaints (Réclamation) — persistent FAB, text/voice input, admin notification, expo-haptics feedback on submit.
6. Referral system — agent dashboard generatents), mobile deep-link scan binds agent toregistration session, attribution tracked in referral_registrations.
7. Admin dashboard — candidate progress chec completeness), daily task tracking view.
8. Offline-first + full i18n polish — local SQLite-backed form queue (expo-sqlite), NetInfo-triggered background sync,
complete ar/fr/en/de translations with RTL l/transition polish.

Verification (Phase 0)

- docker compose up -d → MySQL reachable; phainst it.
- Backend: php artisan serve, then curl the OTP request/verify flow and confirm a Sanctum token is returned; confirm the code appears in laravel.log (or response in
- Web admin: npm run dev, log in with the same phone/OTP, confirm the dashboard shell loads with the authenticated user.
- Mobile: npx expo start, run in Expo Go, coedit flow against the local backend (use LAN IP, not localhost, for device/simulator reachability), confirm the edit persists via GET /api/candidate/profile.
