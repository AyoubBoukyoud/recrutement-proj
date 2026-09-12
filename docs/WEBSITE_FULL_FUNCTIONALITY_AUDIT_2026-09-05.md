# Full functionality audit — every major flow

Date: 5 September 2026
Scope: systematic pass over every major feature area — public/marketing pages, authentication, the full candidate app, recruiter/employer workflows, the admin console, the commercial-agent/referral system, notifications, and messaging — cross-checking each frontend flow against its actual backend route and controller, not just whether a page renders.
Method: full-file code review (frontend pages/components against `backend/routes/api.php` and the matching controllers), plus a fresh automated-suite run. Supersedes the narrower 3 September UX audit for functional coverage; that document's accessibility/performance findings still stand and are not repeated here except where status changed.

## Automated baseline (fresh run today)

| Check | Result |
|---|---:|
| Laravel tests | **279 passed**, 1,338 assertions |
| TypeScript | **Passed** |
| ESLint | **0 errors**, 36 warnings |
| Production build | **Passed** |

## Executive summary

The platform's core transactional loop — a candidate builds a dossier, a recruiter searches and shortlists it, an offer gets created and matched — is genuinely built and working end to end, not decorative. Every route in that loop has a real controller behind it, verified by reading the implementation, not just confirming a 200 response.

The real gap is on the **admin side**: the backend has a materially larger admin API than the admin console's frontend surfaces. Concretely, three backend capabilities have **no admin page that calls them at all**:

1. **Identity-document approval** (`PATCH /admin/documents/{document}/approval`) — candidates upload an ID photo, the backend explicitly skips OCR for this document type because "admin approval is the real verification step," and then nothing in the shipped UI can ever perform that approval. Every identity document is stuck at `pending` forever unless someone calls the API directly.
2. **Task assignment** (`POST /admin/tasks`, `POST /admin/candidates/{id}/assignments`) — the candidate-facing task list, streaks, and completion tracking are fully built and correctly wired, but nothing in the product ever creates a task for anyone to see. The feature is complete and permanently empty.
3. **Complaints, referral-commission approval, and per-candidate/recruiter admin detail views** (`/admin/complaints`, `/admin/referrals`, `/admin/candidates/{id}`, `/admin/recruiters/{id}`) — all have working backend logic, none have a frontend page. The admin dashboard shows a live *count* of open complaints as a KPI tile, with no way to click through and act on one.

Everything else audited — recruiter search/shortlist/offers, candidate documents/OCR, matching preferences, visibility controls, the agent/referral commission pipeline — is real and functionally sound. There is **no in-app messaging/chat feature** anywhere in the shipped product; a "messages" UI exists only inside the disconnected `/amud` prototype sub-app, backed by `localStorage`, with zero backend behind it.

## Findings by area

### Public / marketing pages — Working

`/accueil-public`, `/produit`, `/employeurs`, `/metiers/[slug]` all render real, localized content with no placeholder links or fake data (confirmed by the existing `verify-client-demo.mjs` contract suite, 12/12 passing). Covered in depth by the 3 September audit; the mobile-hero/menu-animation regressions found afterward (dead scroll-video 70MB payload, then a broken merge reintroducing it, then dead CSS-animation classes from an unmerged Tailwind plugin) have all since been fixed and deployed.

### Authentication — Working

Phone → OTP → role-routed destination is real (WhatsApp/SMS/Evolution-Go channels behind `AuthController`), covered by passing tests, and the accessible-name/labeling issues found in the original audit are fixed.

### Candidate app

| Flow | Verdict | Note |
|---|---|---|
| Dashboard, offers search & apply | Working | Offers carry a real `match_score` from `JobOfferMatching`, not a placeholder |
| Document upload + OCR (Gemini/Tesseract) | Working | Full pipeline: upload → OCR → correction form → `review()` writes to profile |
| Salary calculator | Working (client-side) | Fixed assumptions, clearly framed as indicative — not mis-sold as live market data |
| Matching preferences | Working | A stale code comment claims nothing consumes these — false; `JobOfferMatching::score()` and the "matching offer published" notification both read them |
| Video presentation | Working | Real upload endpoint, validated, no stub |
| Identity verification (candidate side) | Working, but see Admin console | Upload + status polling is real; the review step it's waiting on doesn't exist in the UI |
| Tasks (candidate side) | Working, but see Admin console | Full read/complete/streak logic; nothing ever creates an assignment in the shipped app |
| Referral / parrainage | Working | Real attribution at signup, real commission qualification; one dead button ("Voir les récompenses" has no `onClick`) |
| Visibility controls | Working | Verified cross-wired: pausing/withdrawing genuinely removes the candidate from `RecruiterCandidateSearch`'s query, not just a local toggle |
| Complaints (submission) | Working | Submits and polls for a response correctly — see Admin console for the other half |

### Recruiter / employer — Working

Candidate search/filtering, the candidate dossier view, shortlist management (save/note/reveal-contact/export-CSV), applications review, and full offer create/edit/delete are all real, substantive controllers — not stubs. Offer creation in particular is a complete feature (`/recruiter/offres`, modal form, `JobOfferController::store`), not a gap. Minor issue: notification payloads link to `/recruiter/offers/{id}/applications`, a route that doesn't exist in the frontend (currently harmless because the shared notification list component never renders the link field at all — see Notifications).

### Admin console — Significant gaps

Built: user/role management (`/admin/utilisateurs`), offer moderation (`/admin/offres`), application oversight (`/admin/candidatures`), activity log (`/admin/journal`), notifications, and dashboard KPIs.

**Missing entirely** (backend exists, no frontend page anywhere calls it):
- Identity-document approval queue — `PATCH /admin/documents/{document}/approval`
- Task creation/assignment — `POST /admin/tasks`, `POST /admin/candidates/{id}/assignments`
- Complaints management — `GET/PATCH /admin/complaints`
- Referral commission approval — `GET/PATCH /admin/referrals`
- Per-candidate admin detail (activity, assignments, status) — `GET /admin/candidates/{id}*`
- Per-recruiter admin detail and verification — `GET /admin/recruiters/{id}*`, `PATCH /admin/recruiters/{id}/verify`

Of these, recruiter "verification" is lower-stakes — nothing in the codebase actually gates behavior on `verified_at` today, so it's an informational field with no way to set it, not a broken safety control. Identity-document approval and complaints are the two that matter most: one is a described trust/safety step with no way to execute it, the other is a support channel candidates can write into but admins can only see a number, never a list.

### Commercial agent / referral — Working

QR token issuance, rotation with a grace period, registration attribution at signup, and commission summary are all real and correctly wired end to end.

### Notifications — Partially working

Centrally triggered from one service (`Notifications.php`) on real events (new application, status change, document reviewed, complaint answered, task assigned, matching offer published) — not decorative. Two issues:
- All three roles' notification screens call the same `/candidate/notifications*` endpoint (works, since it's scoped by `user_id` not role, but the naming is misleading).
- The recruiter/admin notification list component never renders the `link` field the backend provides, so recruiters and admins can never click through to the item a notification is about (the candidate's own notifications page does render it correctly).

### Messaging — Not implemented

No message/conversation model, migration, controller, or route exists anywhere in the real backend. A messaging UI exists only inside `frontend/src/app/amud/**`, a separate prototype sub-app backed entirely by `localStorage` with zero network calls — it is not reachable from the real candidate or recruiter route trees and should not be mistaken for a working feature.

## Recommended fix order

1. Build an admin identity-document approval queue — the one gap with an explicit "this is the real safety check" comment in the backend and no way to act on it.
2. Build an admin complaints list/response page — candidates already have a working submission channel; admins currently see only a count.
3. Decide the task feature's fate: either build the minimal admin flow to assign tasks (the candidate side is complete and waiting), or intentionally shelve it — right now it ships fully built and permanently empty, which is worse than not having it.
4. Add a referral-commission approval page, or fold it into the existing admin/utilisateurs-style pattern.
5. Fix the dead "Voir les récompenses" button on `/parrainage`.
6. Make `NotificationsFeed.tsx` render the `link` field so recruiters/admins can click through — and either add the missing `/recruiter/offers/{id}` detail routes the backend already links to, or change those links to point at the existing list pages.
7. Correct the stale "nothing consumes this" comment in `matching-preferences/page.tsx`.
8. Lower priority: per-candidate/per-recruiter admin detail views and recruiter verification, since nothing currently depends on them functioning.

## What's confirmed solid

Every core transactional path a candidate or recruiter actually needs — sign in, build a dossier, get matched, get found, apply, shortlist, hire — is real, tested, and consistent between frontend and backend. The gaps are concentrated in admin oversight tooling for features that already work correctly from the other side.
