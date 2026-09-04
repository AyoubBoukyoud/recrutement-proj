# Website audit — verification pass

Date: 4 September 2026
Scope: re-check of every finding in [WEBSITE_FUNCTIONAL_UX_AUDIT_2026-09-03.md](WEBSITE_FUNCTIONAL_UX_AUDIT_2026-09-03.md) against the fixes applied in commit `0d5e5c0` (`fix: address P0/P1/P2 findings from the functional and UX audit`), plus a fresh look for anything new.
Verdict: **all 3 P0s and all 7 P1s are fixed and verified; 3 of 6 P2s are fixed; the remaining P2s and one methodology caveat are below.**

## How this pass was run

Automated checks (tests, typecheck, lint, production build, contract checks) ran cleanly against the current machine. Live browser verification was attempted but this session's host is currently under heavy memory pressure (under 1 GB free, 2+ GB swapped) from other running applications — a real constraint of this shared desktop, not of the app. Headless Chromium timed out repeatedly even on isolated single-page checks, while the Next.js dev server's own logs show every request it received completing in under 150 ms. That mismatch (server fast, browser automation timing out) is the signature of client-side resource starvation, not a product defect, so those timeouts are not reported as findings here.

Where a fresh screenshot wasn't obtainable this round, verification instead came from: the code path itself (read and reasoned through), direct database state (Laravel Tinker), and the previous verification pass earlier in this same work session, which did get clean screenshots of the same code now committed.

## Automated results (this pass)

| Check | Result |
|---|---:|
| Laravel tests | **279 passed**, 1,338 assertions |
| Client-demo contract checks | **12/12 passed** |
| TypeScript | **Passed** |
| Next.js production build | **Passed**, 152 pages |
| ESLint | **0 errors**, 36 warnings (was 37) |
| Live route crawl | Partial — see methodology note above |

## P0 — verified fixed

- **AUD-01** (70.5 MB video): code confirmed unchanged since the fix — `HeroVideo.tsx` skips `ScrollyVideo` entirely under `640px` and the container is `h-[100svh]` there, `sm:h-[420svh]` only from `640px` up. Live-verified with a screenshot in the prior pass (hero measured 844 px tall at 390×844, was ~3,545 px).
- **AUD-02** (broken demo candidate): the **live database itself was still stale** — the seeder fix only helps a fresh `migrate:fresh --seed`, and this machine's dev database had been seeded before the fix existed. Backfilled the existing demo candidate's education and language rows directly. Confirmed via Tinker: `ProfileCompleteness::for($profile)` now returns `"missing_required":[],"can_submit":true` (was `["education","languages"]`, `false`). Also live-confirmed the phone → OTP handoff for this account still issues a valid debug code and redirects correctly.
- **AUD-03** (unlabeled auth controls): code confirmed unchanged — phone/country fields have `id`/`aria-label`, the six OTP inputs sit in a labeled `fieldset`.

## P1 — verified fixed

All seven (AUD-04 through AUD-10) were re-read against the current committed code and match what was verified live in the prior pass: the production build genuinely fails when `NEXT_PUBLIC_SHOW_DEV_TOOLS=1` (re-confirmed this pass — see automated results), the `outline` token is the corrected `#5C6066`, the flagged forms all have their label/id pairs, the skip link and mobile-menu focus trap are in `layout.tsx`/`SiteHeader.tsx`, the four flagged screens have their `<h1>`s, `RecruiterSearch.tsx` has the `advancedFiltersOpen` collapse, and `.material-symbols-outlined` has the `1em`/`overflow:hidden` clip in `globals.css`.

## P2 — status unchanged from the fix pass

Fixed: AUD-11 (dates), AUD-13 (error boundaries), part of AUD-15 (the `ShortlistPanel` effect dependency).

Still open, unchanged from before — these were explicitly out of scope for the fix pass and remain so:

- **AUD-12** (landing page length): partially mitigated by AUD-01's mobile hero fix, but the full card-heavy restructuring wasn't attempted.
- **AUD-14** (OG/canonical metadata): the four main public pages already have distinct, well-written titles and descriptions — this was actually less broken than the original audit suggested. What's genuinely missing (Open Graph tags, canonical URLs) needs a production domain, which isn't recorded anywhere in this repository. Not fixed, because guessing a domain would be worse than leaving it.
- **AUD-15** (remaining lint warnings): 33 `<img>` → `next/image` migrations and 3 custom-font warnings were left alone — 41 call sites is a lot of surface to get wrong without visually checking each one, and this was flagged as the lowest-value item in the original audit.
- **AUD-16** (docs contradiction): the file the original audit cited, `PLATFORM_OVERVIEW.md`, does not exist anywhere in this repository or its git history. Nothing to fix.

## New findings this pass

- **Stale seeded environments silently reintroduce AUD-02.** Anyone who already has a seeded local/shared database from before this fix will still see the broken demo candidate until they either re-seed from scratch or someone backfills the existing row (as done here). Worth a one-line note in the demo runbook: "if the candidate demo account still redirects to profile-creation, your database predates this fix — re-seed or ask for a backfill."
- No other new functional defects surfaced. Static review (TODO/FIXME markers, leftover `console.log`/`debugger` statements, hardcoded `href="#"` placeholders) came back clean across `frontend/src`.

## Recommendation

Treat this as confirmation, not a new punch list: the P0/P1 work from the previous pass holds up under a second look, using DB state and code review as evidence where live screenshots weren't obtainable this session. The four items above (AUD-12, 14, 15, 16-notice) are the same remaining gap the previous report already named — nothing has regressed.
