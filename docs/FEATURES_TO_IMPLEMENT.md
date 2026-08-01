# Features to Implement

A gap analysis of the platform as it stands today against `Project_Summary_Recruitment_Platform.md`. Sections follow the spec's own lettering so the two documents read side by side.

> **This supersedes the status claims in `MVP.md`.** That document defers OCR, AI language assessment, complaints and offline-first to "Phases 1–8". All four are built. Anyone planning off `MVP.md` will badly misjudge the state of the project. Its *roadmap* for the admin dashboard and referral growth features is still broadly accurate.

**Legend**

| Mark | Meaning |
|---|---|
| **DONE** | Implemented and working end-to-end |
| **PARTIAL** | Works, but incomplete against the spec |
| **MISSING** | No code anywhere |

Every status below cites the file that justifies it. A route existing is not evidence a feature exists — `backend/routes/api.php:55` is a catch-all returning 501 for the entire unimplemented admin surface.

---

## Status summary

| # | Feature (spec section) | Status |
|---|---|---|
| A | Candidate onboarding & authentication (§3A) | **DONE** |
| B | Comprehensive candidate profile (§3B) | **DONE** |
| C | AI-powered language assessment (§3C) | **PARTIAL** (see the caveat in C) |
| D | OCR document extraction pipeline (§3D) | **DONE** |
| E | Recruiter search space & interface (§3E) | **DONE** |
| F | Complaint & feedback management (§3F) | **DONE** |
| G | Offline-first mobile architecture (§3G) | **DONE** |
| H | UX & design language (§3H) | **DONE** |
| I | Administrative dashboard & operations (§4) | **PARTIAL** |
| J | Referral / parrainage system (§4) | **PARTIAL** |
| K | Monetization — subscriptions & payments (§2) | **MISSING** |

The single largest hole is **K**: the business model has no representation in the codebase at all.

---

## A. Candidate Onboarding & Authentication — DONE

**Done** — phone-first OTP flow, Sanctum tokens, spatie role gating, referral token bound at request time.
`mobile/src/context/AuthContext.tsx`, `mobile/src/screens/PhoneEntryScreen.tsx`, `mobile/src/screens/OtpVerifyScreen.tsx`, `backend/app/Http/Controllers/Api/AuthController.php`

- **Dual-channel delivery with fallback.** `OTP_CHANNELS=whatsapp,sms` tries the Meta WhatsApp Cloud API first and falls back to Twilio SMS; a channel whose credentials are missing is skipped rather than failed, and an exhausted chain answers 502 without persisting a code nobody received. Default stays `log`, so a fresh checkout signs in with no provider account.
  `backend/config/otp.php`, `backend/app/Services/Otp/OtpChannelManager.php`, `Channels/`
- **The `OtpChannel` abstraction.** `backend/app/Contracts/OtpChannel.php` — three methods, one per driver. A new provider is a class plus a config entry; `OtpChannelManager::extend()` registers one from a service provider without touching the package.
- **Abuse limits.** 60-second resend cooldown, 5 sends per hour per number, 5 verify attempts per code, all in `OtpService` against `otp_codes`; `throttle:otp-request` / `throttle:otp-verify` (defined in `AppServiceProvider`) bound both endpoints per number *and* per IP in front of that. Codes are stored hashed and phone numbers are normalised to E.164 at every entry point, so spacing cannot split a limit bucket.
- **Account recovery.** `POST /auth/phone/change` + `/confirm` moves a dossier to a new number from a signed-in device, proving the *new* number and revoking every other session. For a candidate who lost the number *and* every device, `PATCH /admin/users/{user}/phone` reassigns it after an administrator confirms identity off-platform; the reason is mandatory and logged.
  `backend/app/Http/Controllers/Api/PhoneChangeController.php`, `AdminAccountRecoveryController.php`, `mobile/src/components/PhoneChangeCard.tsx`
- **Multi-device sessions.** `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `DELETE /auth/sessions/others`, with devices named at sign-in. Surfaced in the mobile Account tab.
  `backend/app/Http/Controllers/Api/DeviceSessionController.php`, `mobile/src/components/DeviceSessions.tsx`

Covered by `backend/tests/Feature/OtpAuthTest.php`, `OtpChannelTest.php`, `AccountSessionTest.php`.

**Remaining**

- Nothing blocking. Wiring a live provider is now credentials-only: fill `WHATSAPP_*` / `TWILIO_*` and set `OTP_CHANNELS=whatsapp,sms`. The WhatsApp template must be approved as category AUTHENTICATION first.

---

## B. Comprehensive Candidate Profile — DONE

**Done** — 7-step builder covering personal info, education, languages (with certificates),
availability, consents, presentation video and a final review/submit step; full CRUD behind it.
`mobile/src/screens/profile-builder/`, `backend/app/Http/Controllers/Api/CandidateProfileController.php`, `EducationController.php`, `CandidateLanguageController.php`

- **Language certificates.** `POST|DELETE /candidate/languages/{language}/certificate` attaches or
  removes proof, either by uploading a file inline or by pointing at a document already on the
  Documents tab. Attaching is the only path that sets `source => 'certified'`, and editing a level
  or receiving an AI assessment no longer demotes a language that has a certificate on file.
  Certificates are viewable — `Document` exposes a `url`.
- **Completeness.** `App\Services\ProfileCompleteness` is the single definition of dossier progress,
  used by the candidate's own indicator, the submit gate and the admin checklist. Every
  `/candidate/profile` response carries a `completeness` block; the builder resumes at the first
  incomplete step instead of always at step 0.
- **Review & submit.** `POST /candidate/profile/submit` stamps `candidate_profiles.submitted_at`
  and is refused (422, naming the sections) while a required section is empty. The admin dashboard
  distinguishes a submitted dossier from a draft.
- **Preview.** `GET /candidate/profile/preview` renders through the same
  `App\Services\RecruiterProfileView` the recruiter endpoint uses, so the preview cannot drift from
  what is actually published.

**Remaining** — the new candidate-facing strings are English-only; `fr`/`ar`/`de` fall back to
English, as with the rest of the builder (see the note atop `mobile/src/i18n/index.ts`).

---

## C. AI-Powered Language Assessment — PARTIAL

**Done** — per-language prompted recording with a hard 60s cap and a 20s floor, listen-back before
submit, retake, upload, status polling, CEFR result with the reasoning behind it, badge awarded,
`candidate_languages` reconciled rather than overwritten.
`mobile/src/screens/LanguageAssessmentScreen.tsx`, `backend/app/Jobs/ProcessLanguageAssessment.php`,
`backend/app/Services/LanguageAssessment/` (`WhisperTranscriber`, `PronunciationAnalyzer`, `CefrScorer`,
`LanguageLevelReconciler`), `backend/scripts/transcribe.py`

- **Speech clarity scoring.** `transcribe.py` now runs with `word_timestamps=True` and returns each
  word's probability; `PronunciationAnalyzer` turns that into a 0-100 clarity score, the words the
  engine could not place, pause count and articulation rate, and `CefrScorer` weights it at 1.5 of
  the 4 available points. **Read the caveat below** — this is intelligibility to an ASR model, not
  phoneme-level scoring.
- **Metrics surfaced.** Words per minute, filler ratio, clarity, duration, the per-component
  breakdown and the transcript are shown to the candidate (`LanguageAssessmentScreen`) and to
  recruiters (`web-admin/src/components/AssessmentMetrics.tsx`); `web-admin/src/types/candidate.ts`
  carries the full shape.
- **Explained results.** `language_assessments.score_breakdown` stores every component, what was
  measured and what it contributed, so the level is shown with its reasoning instead of asserted.
- **Bounded recording.** 60s auto-stop via `record({ forDuration })`, a live countdown, and a 20s
  minimum enforced on the device *and* in the job (`ProcessLanguageAssessment::MIN_SECONDS`), which
  also rejects clips with too little intelligible speech. Failures carry a `failure_reason` the UI
  turns into an actionable sentence.
- **Playback and retake.** Nothing uploads until the candidate has listened back and chosen to send
  it; earlier attempts stay listed.
- **An explicit precedence rule.** `LanguageLevelReconciler`: a certificate is never overwritten;
  otherwise the effective level is the *higher* of the declared and predicted levels, both are kept
  (`self_declared_cefr`, `ai_cefr`), `source` names which one won, and a gap of two bands or more
  raises `level_discrepancy` for the recruiter to see. The old code wrote an A1 prediction straight
  over a candidate's own claim.

Covered by `backend/tests/Unit/CefrScorerTest.php`, `PronunciationAnalyzerTest.php`,
`backend/tests/Feature/LanguageAssessmentTest.php`.

**Remaining**

- **Still not phonetic scoring.** Spec §3C asks for "phonetic pronunciation precision". Real
  phoneme-level scoring (goodness-of-pronunciation) needs forced alignment against a reference
  transcript with a phoneme acoustic model, and the candidate is speaking freely — there is no
  reference to align to. The clarity score is a defensible local proxy and is labelled as one in
  both UIs; closing the gap properly means either a scripted read-aloud task or a hosted
  pronunciation-assessment API, both of which are product decisions rather than code.
- No grammar assessment; the CEFR estimate remains heuristic.
- The candidate-facing strings on this screen are English-only, as with the rest of the deeper
  screens.

---

## D. OCR Document Extraction Pipeline — DONE

**Done** — upload, two-engine routing (Gemini for CVs and PDFs, Tesseract otherwise), hardened field
sanitisation, confidence threshold, candidate review screen, **write-back to the profile**, retries,
cloud escalation and multilingual local OCR.
`mobile/src/screens/DocumentsScreen.tsx`, `backend/app/Jobs/ProcessDocumentOcr.php`,
`backend/app/Services/Ocr/` (`GeminiCvExtractor`, `TesseractOcrService`, `DocumentFieldExtractor`,
`ExtractionApplier`, `TransientOcrFailure`), `backend/config/ocr.php`

- **Confirmed fields land on the profile.** `App\Services\Ocr\ExtractionApplier`, called from
  `DocumentController::review`, writes the confirmed values to `candidate_profiles`, `educations`
  and `candidate_languages` — step 3 of the spec's pipeline, which previously went nowhere. It
  *fills* rather than overwrites: what the candidate typed wins, `overwrite: true` is the explicit
  opt-out, re-confirming is idempotent, and the response names what was applied and what was kept so
  the app can say so. A CV language is treated as self-declared and goes through
  `LanguageLevelReconciler`, so it can never demote a certificate.
- **Three outcomes, not two.** `documents.ocr_status` gained `needs_review`: read but not
  confidently, so the candidate corrects a pre-filled form (every profile field is now editable
  there). `failed` now means only "nothing readable came off this page", which is the one case that
  earns a re-scan prompt with photo guidance plus `POST …/retry` (same file) and `POST …/rescan`
  (replacement file, same document id).
- **Paid second opinion.** A local pass below the threshold is escalated to Gemini and the better
  result wins (`ocr.escalate_to_cloud`). A transient failure *during escalation* keeps the local
  result rather than discarding it to retry a bonus pass.
- **Retries.** `$tries = 3` with `[30, 120]` backoff and a `failed()` handler that stops a document
  stranding on `processing`. `GeminiCvExtractor` throws `TransientOcrFailure` on 429/408/5xx and
  connection errors so the queue retries; 4xx still degrades to confidence 0 rather than burning
  attempts on a request that will fail identically.
- **Tesseract reads all four languages.** `-l eng+fra+ara+deu`, configurable, intersected with the
  packs actually installed — naming a missing pack makes tesseract exit non-zero and lose the whole
  page.
- **The heuristic path extracts what Gemini does.** `DocumentFieldExtractor` now reads date of
  birth, profession, specialisation, years of experience, education entries (level + institution)
  and languages with CEFR levels, from labels and keywords in French, Arabic, German and English.

Tested by `backend/tests/Feature/GeminiCvExtractionTest.php`, `OcrPipelineTest.php` and
`backend/tests/Unit/DocumentFieldExtractorTest.php`.

**Remaining** — `DocumentFieldExtractor` is still heuristics over OCR text and will always trail a
document-understanding model; it feeds a review screen, not the profile directly. Language packs are
an OS-level install (`tesseract-langpack-*`), not something the app can provision.

---

## E. Recruiter Search Space & Interface — DONE

**Done** — all five spec filters plus min-CEFR, free-text search, education level, three quality
toggles and a sort control; paginated results; a dossier with grouped documents, inline previews,
assessment metrics and video; and the actions that turn a dossier into a next step — contact
release, shortlist, pipeline stage, private notes and CSV export.
`web-admin/src/pages/RecruiterSearch.tsx`, `web-admin/src/components/` (`CandidateDossier`,
`ShortlistPanel`, `DocumentList`, `Pagination`), `backend/app/Http/Controllers/Api/RecruiterCandidateController.php`,
`RecruiterShortlistController.php`, `backend/app/Services/RecruiterCandidateSearch.php`

- **Contact, and a pipeline behind it.** `POST /recruiter/candidates/{id}/contact` releases the
  phone number and email, stamps `contact_revealed_at` against that recruiter and adds the
  candidate to their shortlist. The dossier carries no contact details until then: the platform
  collects explicit CNDP consent, so a disclosure has to be attributable. `PUT`/`DELETE
  …/shortlist` carry a stage (saved → contacted → interviewing → placed/rejected) and private
  notes, one row per recruiter per candidate — the first place a placement is visible to the
  business that earns commission on it.
- **Export.** `GET /recruiter/shortlist/export` streams CSV; contact columns are filled only for
  candidates whose details were actually released. A dossier prints through the browser with the
  console's own controls suppressed (`.no-print`).
- **Pagination.** `Pagination` renders page state, totals and prev/next on both the results grid and
  the shortlist. Candidate #21 is reachable, and a new search resets to page 1.
- **Documents as evidence.** `RecruiterProfileView` no longer hands out `ocr_status` or the raw
  extraction — a scanner's "failed" read as a verdict on the candidate. Documents are grouped by
  type, a certificate attached as proof of a language level is marked `verified`, and images and
  PDFs preview inline.
- **The rest of the search surface.** Free-text across name/profession/specialisation (every word
  must land, so a second term narrows), education-level filter, has-video / verified-assessment /
  dossier-submitted toggles, and sort by recency, experience (nulls last) or name. Result cards
  carry the same marks plus the recruiter's own shortlist stage.
- **The min-CEFR filter is no longer accidental.** It compared an ENUM column with `>=` and
  happened to order correctly in MySQL and SQLite for different reasons; it now matches an explicit
  set of levels at or above the one chosen (`RecruiterCandidateSearch::levelsAtLeast`).

Covered by `backend/tests/Feature/RecruiterSearchTest.php` and `RecruiterShortlistTest.php`.

**Remaining**

- Media is still served from public storage — a released contact detail is gated, a CV URL is not.
  See *Security*; it is the same fix for the whole platform, not a recruiter-side one.
- No saved searches or alerts, and no bulk actions across a result set.

---

## F. Complaint & Feedback Management — DONE

**Done** — ubiquitous entry point, text and voice submission, haptic confirmation, storage, real
administrator alerts, full triage including `in_review`, and a reply that reaches the candidate.
`mobile/src/components/ComplaintFab.tsx`, `backend/app/Http/Controllers/Api/ComplaintController.php`,
`backend/app/Jobs/NotifyAdminsOfComplaint.php`, `backend/app/Notifications/ComplaintSubmitted.php`,
`backend/config/complaints.php`, `web-admin/src/pages/AdminDashboard.tsx`

- **Administrators are actually told.** `NotifyAdminsOfComplaint` (queued, 3 tries) mails every
  Administrator holding an email address plus an optional ops mailbox
  (`COMPLAINT_ALERT_EMAIL`), and posts to a Slack incoming webhook when one is configured — a plain
  `Http::post` rather than a dependency for one message. `MAIL_MAILER` defaults to `log`, so a fresh
  checkout writes the alert rather than appearing to send one.
- **`admin_notified_at` now means what it says.** It is written by the job once a channel has
  accepted the message, not stamped at insert against a delivery that never happened. A complaint
  nobody could be told about stays null and is badged *not alerted* on the dashboard, so a
  deployment with no reachable administrator is visible instead of silent.
- **Full triage.** `PATCH /admin/complaints/{id}` takes status and/or a reply; the dashboard has
  Move to review, Mark resolved, Reopen, and status filters. `GET /admin/complaints?status=` filters
  server-side.
- **The candidate hears back.** `complaints.admin_response` / `responded_at` / `responded_by_id`,
  surfaced through `GET /complaints` (the candidate's own reports) with the reply, the status in
  plain words, and an unread badge on the "Report a problem" strip that `POST /complaints/{id}/seen`
  clears. Editing a reply makes it unread again.

Covered by `backend/tests/Feature/ComplaintTest.php` (16 tests).

**Remaining** — no push notification to the candidate; the reply is picked up by a two-minute poll
while the app is open, since the project has no push infrastructure yet. Complaint strings in the
mobile app are English-only, as with the rest of the deeper screens.

---

## G. Offline-First Mobile Architecture — DONE

**Done** — every write in the candidate app goes through the queue, media included; a
connectivity-triggered flush; a pending-changes banner and a named list of what is still held on
the device; and explicit conflict resolution when two devices edit the same dossier.
`mobile/src/lib/offlineQueue.ts` (+ `.web.ts`, `.types.ts`), `mobile/src/components/OfflineBanner.tsx`,
`PendingChanges.tsx`, `backend/app/Http/Controllers/Api/CandidateProfileController.php`

- **Every write path enqueues.** The profile steps (personal, education, languages, availability,
  consents), certificates, documents and rescans, the presentation video, assessment recordings and
  both kinds of complaint. Each carries a label, so "3 changes not synced" is a list of named things
  rather than a number.
- **Media has its own strategy, chosen rather than defaulted.** `queueOrSendFile` copies the picked
  or recorded file out of the cache directory — which the OS may reclaim — into
  `Paths.document/offline-uploads/`, and the queue row points at that copy; it is deleted when the
  upload lands or when the candidate discards it. A file that disappears anyway is reported, not
  silently dropped: the candidate believed it was saved. Needs `expo-file-system`, added for this.
- **Conflict handling.** `PUT /candidate/profile` accepts `base_updated_at` and answers `409` with
  the server's version when the dossier moved on since the edit was composed. The queue holds that
  mutation aside instead of replaying it, and `PendingChanges` asks the candidate: keep mine
  (re-sends with `force`) or discard mine. Multi-device sessions made this reachable — see A.
- **Submitting is deliberately online-only.** It is a declaration the server answers, naming the
  sections that are still empty; queueing it would swallow that answer and replay it hours later
  against a dossier that has since changed. Everything that *fills* the dossier works offline.
  The refusal says so in those terms.

Covered for the server half by `backend/tests/Feature/ProfileConflictTest.php`; both bundles
(`expo export --platform android|web`) build, and the web build pulls in none of the native file
APIs.

**Remaining**

- **Uploads are online-only on the web build**, by decision. A `File` handle cannot be put in
  localStorage, and persisting megabytes of video into IndexedDB to serve a target that exists for
  demoing and testing in a browser buys very little. An offline browser gets a clear refusal from
  the calling screen rather than a promise to sync that this build cannot keep.
- Conflict detection covers the profile record. Education rows, language rows and documents are
  separate resources where last-write-wins is defensible; if that changes, the same
  `base_updated_at` mechanism extends to them.
- There are no mobile tests, here or anywhere — the queue is exercised by hand and by the two
  bundle builds.

---

## H. User Experience & Design Language — DONE

**Done** — multi-step animated form with fade transitions, a navigable progress ledger, a hand-built
design system (`mobile/src/theme.ts`, `mobile/src/components/ui.tsx`), custom typography, haptic
feedback, and one consistent way of showing waiting and failure.

- **The ledger navigates.** `StepLedger` takes `onStepPress` / `furthestStep` / `stepLabels`; cells
  at or below the furthest step reached become `Pressable` with a proper `accessibilityRole`, label
  and 44pt hit area, and tapping one jumps back to that step. Nothing is lost by going back — each
  step saves on Continue. Passing no handler keeps the old read-only rendering, which is what the
  two auth screens want.
- **Resume, and the ledger follows it.** `resumeStep` (added in B) drops a returning candidate on
  the first incomplete step; it now also seeds `furthest`, so landing on step 4 leaves steps 1-3
  reachable rather than stranding the candidate deep in the form.
- **One failure surface.** `MutationNotice` in `ui.tsx` takes a react-query error and renders the
  parsed message, the offline message, or a caller-supplied fallback. Every mutation in the app uses
  it. Five steps (personal info, education, availability, consents, video) previously showed
  *nothing at all* when a save failed — the tap simply did not work.
- **No `Alert.alert` anywhere.** It is a no-op on react-native-web, so the failures routed through
  it were invisible on the web build. The last three — video recording, the RTL restart prompt, and
  the microphone refusal — are inline notices now. `setAppLanguage` returns whether a restart is
  needed instead of raising an alert from inside a lib function, which was the wrong layer as well
  as the wrong widget.
- **One waiting surface.** `Loading` replaces per-screen `ActivityIndicator` spellings; Documents and
  Language assessment used to render an empty list during their first fetch, which reads as "you
  have nothing here".

**Remaining** — nothing against §3H. Deeper-screen copy is still English-only, tracked under B.

---

## I. Administrative Dashboard & Operations — PARTIAL

**Done** — the 4-item completeness checklist exactly as specced, complaint triage, connectivity status.
`web-admin/src/pages/AdminDashboard.tsx`, `backend/app/Http/Controllers/Api/AdminCandidateController.php`

**Missing**

- **Daily remote internship / task tracking is entirely absent.** This is a spec pillar (§4, "~1 hour per day") with no table, no endpoint, no page and no type. Requires schema before any UI.
- **No candidate detail view for admins.** An admin sees a checklist row and cannot open the dossier.
- **No user or role management UI**, despite four roles being defined.
- **No pagination** — the defect recruiter search no longer has; `Pagination` is there to reuse. The header reads `{data.data.length} candidates`, which will say "20 candidates" forever once the platform crosses 20.
- The checklist is display-only by design; there is no admin override, no "verified by admin" flag and no document approval workflow.
- No system metrics or analytics of any kind.
- Anything an admin UI requests beyond `/admin/ping`, `/admin/candidates` and `/admin/complaints` hits the 501 catch-all at `backend/routes/api.php:55`.

---

## J. Referral / Parrainage System — PARTIAL

**Done** — token generation and rotation, client-side QR rendering, and a complete attribution loop: token → `users.pending_referral_agent_id` → consumed at profile creation → `referral_registrations` row → surfaced as `referred_by` in the admin list.
`web-admin/src/pages/AgentDashboard.tsx`, `backend/app/Http/Controllers/Api/ReferralAgentController.php`, `backend/app/Services/CandidateProfileResolver.php`

**Missing**

- **No in-app QR scanner.** `mobile/app.json`'s camera permission copy tells the user it is needed to "scan referral QR codes", but no scanning code exists — registration relies on the phone's native camera opening the `recruitment://register?ref=TOKEN` deep link. Either build the scanner or fix the permission copy; as written it is a false statement to the user at the permission prompt.
- **Commission tracking does not exist** — no rates, no amounts, no payout state. Spec §4 says registrations are attributed "for commission tracking"; only the attribution half is built.
- **Agents see a count, not a list.** No view of who they referred, and no earnings.
- **Rotating a token silently invalidates every printed QR already in circulation** — no warning, no confirmation dialog, no grace period.
- No download, print or share action for the QR; a field agent can only screenshot it.

---

## K. Monetization — Subscriptions & Payments — MISSING

Nothing exists. No table, no model, no controller, no column, no package in `composer.json`, no SDK in either `package.json`, no paywall gating on any route or screen.

Both halves of the business model (§2) are unimplemented:

- **B2C** — the 100 MAD/year candidate subscription. Needs a plan/subscription schema, a Moroccan-market payment provider (CMI or similar; Stripe does not serve MAD cards well), renewal and expiry handling, and a decision about what actually degrades when a subscription lapses.
- **B2B** — success-based commission on placement. Needs placement tracking first: there is currently no concept of a candidate being hired, so there is nothing to charge a commission against. This depends on E (recruiter contact actions) existing at all.

Treat this as its own project, not a feature.

---

## Implemented but misleading

Things that read as finished and are not. These matter more than the plain gaps because they are the ones most likely to be wrongly ticked off.

| # | Appears to work | Reality |
|---|---|---|
| 1 | ~~Admins are notified of complaints~~ | Fixed. `NotifyAdminsOfComplaint` mails every administrator and posts to Slack; `admin_notified_at` is written only once a channel accepted the alert, and an unalerted complaint is badged as such. |
| 2 | ~~OCR pre-fills the profile~~ | Fixed. `App\Services\Ocr\ExtractionApplier` writes confirmed fields to `candidate_profiles`, `educations` and `candidate_languages`, filling blanks by default and reporting what it kept. |
| 3 | ~~Recruiters review assessment metrics~~ | Fixed. Pace, clarity, filler ratio, duration, the score breakdown and the transcript render in `AssessmentMetrics.tsx`. |
| 4 | ~~Language certificates can be certified~~ | Fixed. `POST /candidate/languages/{language}/certificate` is the one path that writes `certificate_document_id` and `source='certified'`. |
| 5 | Lists are paginated | Fixed for recruiter search and the shortlist. **The admin dashboard still has no pagination UI** (I) and silently truncates at 20. |
| 6 | ~~OTP delivery is swappable~~ | Fixed. `App\Contracts\OtpChannel` with log, WhatsApp and Twilio drivers behind `config/otp.php`. |
| 7 | Logging out ends the session | Web-admin `logout()` clears localStorage and never calls `POST /auth/logout` — the Sanctum token stays valid. |

---

## Security & compliance

Flagged separately because the platform collects explicit CNDP consent, which raises the stakes on all three.

- **Rate limiting: the auth endpoints only.** `/auth/otp/request` and `/auth/otp/verify` are now throttled per number and per IP (`AppServiceProvider::configureOtpRateLimiting`), on top of the per-number cooldown and 5-attempt cap in `OtpService`. **Every other route is still unbounded** — profile, document upload and the recruiter search have no `throttle` middleware.
- **All uploaded media is served unauthenticated.** `storageUrl()` in `CandidateDossier.tsx` and `AdminDashboard.tsx:8`, and `Document::url`, all build direct public-disk `/storage/...` URLs. Every CV, certificate, diploma, complaint voice note and presentation video is readable by anyone who has or guesses the path. Needs signed URLs or an authenticated streaming endpoint. This directly contradicts the CNDP consent the app collects.
- **No account deletion and no data export.** Both are standard obligations under the data-protection regime the consent flow invokes.
- No 401 interceptor in `web-admin/src/lib/api.ts` — an expired token renders errors instead of redirecting to login.
- Models are serialized raw to JSON throughout; there are no API Resources, FormRequests or Policies, so response shape is whatever the model happens to hold.

---

## Correctness bugs

*Fixed in C:* the `filler_word_ratio` column truncating every realistic ratio to `0.00`
(now `decimal(6,4)`), multi-word fillers being unmatchable, and `transcribe.py` never passing a
language hint to Whisper. *Fixed in E:* the min-CEFR filter comparing an ENUM column with `>=`.

- `TesseractOcrService::isAvailable()` shells `command -v tesseract` on every call rather than caching.
- `users.pending_referral_agent_id` has no foreign key (deliberate, per the migration comment, due to ordering) — worth revisiting with a follow-up constraint migration.

---

## Cross-cutting

- **i18n coverage is partial by design.** The comment in `mobile/src/i18n/index.ts` states only auth-flow and navigation strings are translated across en/fr/ar/de; the profile builder, documents and language assessment screens are hardcoded English. The mechanism (including real RTL via `I18nManager.forceRTL` in `mobile/src/lib/language.ts`) is sound — what remains is a content pass. Spec §6 lists full internationalisation as MVP scope.
- **Test coverage is nine suites plus the CV extractor.** `GeminiCvExtractionTest.php` is genuinely good, and OTP delivery, throttling, sessions and recovery are covered by `OtpAuthTest`/`OtpChannelTest`/`AccountSessionTest`. Recruiter search, the shortlist and the contact gate are covered by `RecruiterSearchTest`/`RecruiterShortlistTest`. Untested: profile CRUD, education, languages, the admin checklist, referral attribution. `CefrScorer`, `PronunciationAnalyzer` and the assessment pipeline now have unit and feature suites. No factories exist for any domain model beyond `User`. No frontend or mobile tests at all.
- **Dead dependency:** `zustand` is in `mobile/package.json` and used nowhere in `src` — all client state is Context plus TanStack Query. Remove it or adopt it.
- **Permission copy vs behaviour:** the QR-scanning claim in `mobile/app.json`, covered in J.
- **Endpoints the backend exposes that mobile never calls:** `GET /auth/me`, `GET /candidate/educations`, `GET /candidate/languages`, `GET /candidate/documents/{id}`, `GET /candidate/language-assessments/{id}`. Either wire them or drop them.

---

## Not in the spec, needed before launch

- ~~Real OTP delivery, with the channel abstraction built first (A).~~ Built — provider credentials are all that is outstanding.
- **Rate limiting on the rest of the API** (*Security*) — the auth endpoints are covered, nothing else is.
- **Authenticated media access** (*Security*).
- **Consistent error and retry UX** — several failure paths currently surface as a bare `Alert` or nothing at all.
- **Analytics and crash reporting.** No SDK in any of the three apps; there will be no visibility into failures in the field.
- **Account deletion and data export**, per the consent the app collects.

---

## Suggested order

Roughly by value-per-effort, given the current state:

1. **Make OCR review write back to the profile** (D) — the pipeline's whole purpose, and the surrounding machinery already works.
2. ~~Real OTP delivery + rate limiting (A, *Security*).~~ Done, minus provider credentials.
3. **Authenticated media URLs** (*Security*) — a live privacy exposure today.
4. ~~Recruiter contact + shortlist actions (E).~~ Built.
5. **Pagination on the admin dashboard** (I) — small fix, currently hiding data; the recruiter side is done.
6. **Real admin notification for complaints** (F) — and drop or correct `admin_notified_at`.
7. **i18n content pass** (*Cross-cutting*) — MVP scope, and mechanical.
8. **Tests for recruiter filters and the admin checklist** (*Cross-cutting*) — `CefrScorer` and auth are covered now.
9. **Daily task tracking** (I) — needs schema design first; largest genuinely new build.
10. **Subscriptions and payments** (K) — its own project.
