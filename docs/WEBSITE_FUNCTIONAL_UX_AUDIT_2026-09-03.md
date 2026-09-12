# Website functional and UX audit

Date: 3 September 2026  
Scope: canonical Next.js PWA and Laravel API in the current local, real-API configuration (`NEXT_PUBLIC_USE_MOCKS=0`, prototypes disabled).  
Verdict: **functionally stable, but not ready for a public production launch without fixing the landing-page payload, accessibility failures, and demo-account/configuration blockers.**

## Executive summary

The application has a strong functional base. The complete Laravel suite passes, the Next.js production build succeeds, every canonical route renders without a runtime or network error, authentication and role guards work, and representative search/calculation/localization interactions behave correctly.

The principal risks are at the experience layer:

1. The public landing page preloads a **73,885,911-byte (70.5 MB) MP4** and makes the visitor traverse a `420svh` scroll track before the main proposition. The rendered page is 10,797 px tall at desktop and 16,938 px at 390 px mobile width.
2. The documented candidate demo account is incomplete and is forcibly redirected away from all 20 candidate destinations to profile creation step 3. This makes the documented candidate walkthrough impossible.
3. Automated WCAG checks found violations on **33 of 58 page/viewport checks**, representing 168 affected DOM nodes. The core sign-in/OTP flow includes unlabeled controls.
4. The current local configuration exposes a large development shortcut/catalog panel on the public authentication screen, contrary to the client-demo runbook.
5. Mobile operations screens technically fit, but navigation/filter density and fixed controls make them inefficient and visually obstructive.

## Test coverage and results

| Check | Result |
|---|---:|
| Laravel tests | **279 passed**, 1,338 assertions |
| Client-demo contract checks | **12/12 passed** |
| TypeScript | **Passed** |
| Next.js production build | **Passed**, 152 generated pages |
| ESLint | **0 errors**, 37 warnings |
| Canonical rendered route/viewport checks | **58 passed** |
| Runtime page errors | **0** |
| Browser console errors | **0** |
| Failed/HTTP-error subresources | **0** |
| Broken rendered images | **0** |
| WCAG rule instances | **37** across 168 nodes |
| Pages/viewports with WCAG violations | **33/58** |

The 58 rendered checks comprise 48 canonical desktop route templates and 10 representative mobile renders. They cover the public, candidate, recruiter, administrator, and commercial-agent experiences. The 111 `/amud/*` localStorage prototype pages were deliberately excluded because middleware redirects them when prototypes are disabled; they are not part of the current production surface.

Representative interactions tested successfully:

- Unauthenticated guards for candidate, recruiter, admin, and agent routes.
- Invalid phone validation with an inline message.
- Full phone → local OTP → verification flow and server-authorized role destination.
- Public mobile navigation opening.
- French-to-Arabic switch, including `<html lang="ar" dir="rtl">`.
- Light-to-dark theme switch.
- Candidate offer search, including the expected `q=Infirmier` API request and HTTP 200 response.
- Candidate salary calculation after profession and experience input.
- Recruiter candidate search and no-result response.
- All four audit-created API sessions were revoked after the route audit.

## Prioritized findings

### P0 — Release blockers

#### AUD-01: Landing-page video is an extreme mobile payload

Evidence:

- `frontend/public/assets/videos/landing/video_hero.mp4` is **73,885,911 bytes**.
- The component selects that asset at [HeroVideo.tsx](../frontend/src/components/home/HeroVideo.tsx#L16), sets `preload = "auto"` at line 89, and uses a `420svh` track at line 182.
- The main value proposition appears after this scroll-scrub experience, while the full mobile landing page measures 16,938 px tall.

Impact: slow first visit, high mobile-data cost, decode/memory pressure, delayed comprehension, and likely poor LCP/engagement on typical Moroccan mobile connections. The implementation also bypasses the existing 3.2 MB and 4.7 MB WebM alternatives.

Recommendation: put the proposition and primary CTA in the first viewport; use responsive `<source>` assets, `preload="metadata"` or `none`, and a poster-first experience. Treat the scroll video as progressive enhancement. Set a practical initial-transfer budget (for example, under 2 MB on mobile) and verify it on a throttled production build.

#### AUD-02: The documented candidate demo journey is blocked

Evidence:

- Signing in as the documented candidate redirects `/dashboard` and every other candidate destination to `/profile-creation?step=3`.
- The global candidate layout forces that redirect whenever any required profile section is missing ([candidate layout](../frontend/src/app/%28candidate%29/layout.tsx#L36)).
- The seeded candidate only receives a `verified()` profile in [DatabaseSeeder.php](../backend/database/seeders/DatabaseSeeder.php#L45), but the record has no education or language rows.
- As a result, 20 of 21 initial candidate route checks rendered the same onboarding screen instead of the requested feature.

Impact: the runbook instruction to inspect offers, applications, documents, visibility, notifications, and account controls cannot be followed with its stated candidate account. Stakeholder demos appear broken even though the screens themselves work with a complete candidate.

Recommendation: seed a genuinely complete candidate dossier, including education and a CEFR language, or change the runbook to use a complete seeded account. Add a contract test that signs in with every documented account and asserts its documented landing route.

#### AUD-03: Core authentication controls fail accessible-name requirements

Evidence:

- The phone country `<select>` and phone `<input>` share a visual label but have no programmatic label or `aria-label` ([auth-phone page](../frontend/src/app/auth-phone/page.tsx#L140)).
- All six OTP digit inputs lack an accessible name ([OTP page](../frontend/src/app/otp/page.tsx#L210)).
- Axe reports `select-name` and `label` as **critical** violations on authentication pages.

Impact: screen-reader and voice-control users cannot reliably identify or operate the login fields. This blocks entry to the entire product.

Recommendation: associate labels using unique `id`/`htmlFor` pairs; group OTP inputs with a fieldset/legend and give each digit an explicit localized label, or use one accessible OTP input with visual segmentation. Announce verification errors with `role="alert"` or an assertive live region.

### P1 — High priority

#### AUD-04: Current auth screen exposes development shortcuts

The current `.env.local` has `NEXT_PUBLIC_SHOW_DEV_TOOLS=1`, so the public mobile sign-in screen includes direct admin/recruiter/agent shortcuts, prototype links, and a route catalog. This contradicts [CLIENT_DEMO_RUNBOOK.md](CLIENT_DEMO_RUNBOOK.md), which requires the flag to be `0`.

Impact: an embarrassing client demo and a serious deployment-integrity risk if the same build flag reaches a shared environment. Server authorization still protects roles, but the interface advertises internal accounts and routes.

Recommendation: make production/demo builds fail when this flag is enabled, rather than relying on a manual environment check. Keep the tooling in a separately gated development route.

#### AUD-05: Color contrast fails across public and candidate screens

Axe found serious contrast violations on public home, employer, product, trade, dashboard, profile, referral, documents, complaints, and admin-user screens. Common targets are `text-outline`, low-opacity footer copy, inactive bottom-navigation labels, muted icons, and secondary badges.

Impact: key supporting text and navigation states become difficult to read for low-vision users and on low-quality outdoor phone screens.

Recommendation: establish WCAG-tested text/icon tokens for every surface. In particular, replace `text-outline` as body/label text, raise inactive-navigation contrast, and test light/dark variants at 4.5:1 for normal text and 3:1 for large text/UI graphics.

#### AUD-06: More candidate forms have unlabeled controls

Critical label/select-name failures also occur in matching preferences, profile creation, complaints, salary simulation, and account settings. Additional serious/critical issues include unnamed buttons on video and identity-verification screens, an unnamed link on video, and an unnamed progressbar on daily tasks.

Impact: several core dossier-completion tasks are incomplete or confusing for assistive-technology users.

Recommendation: add a reusable field component that always binds label, description, error, and control IDs. Extend CI with axe coverage for auth, onboarding, dashboard, profile, documents, complaints, salary, video, identity, and tasks.

#### AUD-07: No global keyboard skip path; mobile menu ignores Escape

No skip-to-content link exists in the source. The mobile public menu opens and locks body scrolling, but pressing Escape does not close it; there is also no dialog semantics or explicit focus trap/return behavior.

Impact: keyboard users must traverse repeated navigation on every page and can become disoriented inside the mobile menu.

Recommendation: add a first-focusable “Skip to main content” link and stable `main` IDs. Treat the mobile menu as a modal navigation surface: Escape close, focus containment, initial focus, and focus return to the trigger.

#### AUD-08: Recruiter and agent pages lack a page-level `<h1>`

The recruiter search, recruiter applications, recruiter notifications, and agent dashboard rendered a `<main>` but no `<h1>`. Their visible context is supplied by a styled wordmark/subtitle instead of a semantic page heading.

Impact: screen-reader navigation and page orientation are weaker, and document outlines are inconsistent between roles.

Recommendation: render the current page title as an `<h1>` in the main content or make the TopBar title a real heading with one consistent page-level hierarchy.

#### AUD-09: Mobile operations UX is dense and obstructive

At 390 px:

- Recruiter search places the full multi-field filter form above every result; the first page becomes roughly 3,850 px long.
- Admin/recruiter primary navigation is a clipped horizontal strip with no strong overflow cue.
- `TopBar` becomes a fixed bottom block containing brand, role, phone, language, theme, and logout ([TopBar.tsx](../frontend/src/components/TopBar.tsx#L24)); it consumes a large fraction of the viewport and obscures context while scrolling.

Recommendation: collapse filters behind a “Filters (n)” sheet on mobile, keep search/sort visible, add a visible nav overflow treatment, and replace the bottom TopBar with a compact mobile app bar plus account menu.

#### AUD-10: External icon font creates transient horizontal overflow

The mobile `/offres` audit measured a 412 px document width in a 390 px viewport; `/profil` reached 402 px during the route crawl. Overflow elements were Material Symbols ligature strings such as `help_outline`, `light_mode`, and `arrow_back` before/while the external font resolved. All main fonts and icons are loaded from Google in [layout.tsx](../frontend/src/app/layout.tsx#L53).

Impact: layout shift, brief visible icon names, and broken controls when Google Fonts is slow or blocked.

Recommendation: self-host critical fonts, preferably render icons as SVGs, and constrain icon boxes so ligature fallback cannot change layout. Re-test with Google Fonts blocked and with Slow 3G.

### P2 — Medium priority

#### AUD-11: Candidate profile displays raw API timestamps

The profile timeline displays values such as `2026-09-03T09:16:22.000000Z`. [Timeline.tsx](../frontend/src/components/shared/Timeline.tsx#L35) outputs `step.date` verbatim.

Recommendation: format with `Intl.DateTimeFormat` using the selected locale and a deliberate date/time policy.

#### AUD-12: Landing page is overlong and repetitive

Beyond the 420svh intro, the page stacks journey cards, process cards, recruiter cards, trade cards, dossier cards, technology cards, proof cards, FAQ, CTA, and footer. Mobile height is 16,938 px. The visual language is coherent, but repeated card grids weaken hierarchy and delay decision-making.

Recommendation: reduce the public story to one promise, one proof sequence, one role split, and one primary CTA. Move detailed technology/process content to `/produit` and employer-specific proof to `/employeurs`.

#### AUD-13: No branded 404 or route-level error boundaries

There is no `not-found.tsx`, `error.tsx`, or `global-error.tsx` in the app tree. Unknown trade URLs therefore use the default Next.js error experience.

Recommendation: add localized, branded recovery pages with links to home, trade search, and sign-in. Add role-aware error boundaries for API-backed spaces.

#### AUD-14: Metadata is global and generic

All routes inherit `Amud Skills Recruitment App` and one French description from [layout.tsx](../frontend/src/app/layout.tsx#L5). Open Graph/Twitter data, canonical URLs, and per-route localized titles are absent.

Recommendation: give public pages unique localized metadata; add sharing imagery and canonical URLs. Keep private dashboards out of indexing.

#### AUD-15: Lint warnings include a stale shortlist-state risk

ESLint reports 37 warnings: 33 repeated `<img>` optimization warnings, three custom-font warnings, and one missing `useEffect` dependency in `ShortlistPanel.tsx` (`entry?.notes`). The dependency warning can leave private notes stale when the selected shortlist entry changes.

Recommendation: fix the hook dependency first, migrate meaningful images to `next/image`, and self-host/load fonts through `next/font`.

#### AUD-16: Product documentation contradicts the current web implementation

`PLATFORM_OVERVIEW.md` says the candidate web space is “mostly mock screens,” while the current repositories select real HTTP implementations when `NEXT_PUBLIC_USE_MOCKS=0`. It also names `/admin/dashboard` as the admin destination, while the application routes to `/admin`.

Impact: teams may plan, sell, or test the wrong product state.

Recommendation: update the overview from verified route/repository behavior and add documentation checks to the client-demo contract script.

## What is working well

- Role authorization and unauthenticated route protection behave consistently.
- The API is the strongest layer: comprehensive feature/unit tests pass across authentication, profiles, privacy, documents/OCR, language assessment, marketplace, recruiter, admin, referrals, tasks, complaints, sessions, and rate limiting.
- Real candidate, recruiter, admin, and agent pages load without runtime failures.
- Loading and empty-state components are present across many routes.
- Invalid phone input is handled inline rather than by a blocking browser alert.
- RTL direction and document language update correctly when Arabic is selected.
- Dark mode changes the root document state correctly.
- Public internal links and all eight valid trade-detail routes resolve.
- No placeholder `href="#"` links exist in the canonical production surface.
- The PWA manifest is valid and an offline fallback is configured.

## Recommended fix order

1. Replace/reframe the landing hero and set a hard mobile transfer budget.
2. Repair the seeded demo candidate and add role-destination smoke tests.
3. Remove development tools from demo/shared environments with a build-time guard.
4. Fix authentication and onboarding accessible names, then the remaining critical axe failures.
5. Correct contrast tokens and add automated accessibility checks in CI.
6. Redesign recruiter/admin mobile navigation and filter presentation.
7. Self-host fonts or replace the icon font, then resolve horizontal overflow/CLS.
8. Format dates, add headings/skip navigation, branded error states, and route metadata.
9. Clear the hook and image/font lint warnings.
10. Refresh product documentation so it matches the real web application.

## Audit constraints

- Destructive production-like actions such as deleting accounts, changing roles, withdrawing consent, generating replacement referral codes, or altering real demo records were not performed. Their server behavior is covered by the passing backend suite.
- Camera, microphone, file-picker, printing, and physical-device PWA installation were inspected in code and through their rendered entry states, but not completed with real hardware/media.
- `/amud/*` prototype screens were excluded because the audited configuration redirects them and explicitly labels them non-production.
- Performance was assessed from actual asset sizes, network behavior, DOM dimensions, and implementation choices. A numerical Lighthouse score was not reported because the active server was a development server; such a score would be misleading.
