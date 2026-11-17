# Website performance

The public site and connected training timetable share the same design and API
behavior. This optimization changes what they load and render, and improves the
local serving setup.

## Changes

- `CentreShell` shares a lightweight navigation frame. Prototype search, local
  centre/role selectors, notifications and demo collections load through
  `CentrePrototypeShell` only when a prototype page is actually opened.
- The connected planner loads its session form and resource manager on demand.
  Its initial import graph no longer includes the legacy localStorage scheduler.
- Real planning/room navigation still prefetches. Links to legacy centre screens
  wait until clicked instead of downloading every prototype in the background.
- The calendar memoizes its slots and event blocks separately from drag previews.
  Stable callbacks prevent rebuilding the calendar when typing in group search
  or refreshing toolbar status. Keyboard navigation retains one active tab stop.
- Inter, Material Symbols and IBM Plex Mono are served from `public/fonts` with
  their licenses. CSS uses `font-display: swap`, the primary Inter subset is
  preloaded, and fonts are cached with the existing public asset headers.
- The homepage starts its decorative video after initial content, prefers the
  smaller 720p WebM source, and pauses playback off-screen or in a hidden tab.
  Existing mobile, reduced-motion and data-saver restrictions remain in place.
- `backend/scripts/serve-local.sh` enables PHP OPcache for the local server and
  four API workers. Timestamp validation remains enabled for source-code edits.
  Authentication, query scoping, conflict detection and database data are unchanged.

## Run the faster local preview

The frontend currently runs its optimized build at `http://localhost:3000`.
For an updated preview after editing source:

```sh
cd frontend
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

`npm run dev` remains available for hot reload. Development mode includes large
unminified bundles and compiles routes on demand; its first-load speed is not
representative of the production build.

The local API is on port 8010 to match this workspace's `frontend/.env.local`:

```sh
cd backend
AMUD_API_PORT=8010 OTP_CHANNELS=log bash scripts/serve-local.sh
```

The script defaults to port 8000 if `AMUD_API_PORT` is omitted. The existing queue
worker must also remain running (`php artisan queue:work`). No production database
settings, user roles, sample sessions or authentication policies are changed.

## Measurement

Measured in headless Chromium at 1440×1000 against the local Laravel database,
using fresh browser contexts with service workers disabled. Google Analytics was
stubbed during measurement to avoid counting test visits. Payload sizes are decoded
JavaScript bytes, including scripts prefetched within 2.5 seconds of readiness.
Timing is indicative and varies with host load; this is not a network-throttled
mobile benchmark.

The initial development-mode calendar loaded about 19 MB of JavaScript and took
6.5 seconds to become ready. The production baseline before these changes loaded
1.78 MB, issued 102 resource requests in the measurement window, and created 44
localStorage keys on first visiting the API-backed calendar.

| Local measurement | Before | After |
| --- | ---: | ---: |
| Calendar JavaScript | 1.78 MB | 0.68 MB |
| Calendar resource requests | 102 | 36 |
| Calendar ready | 1.90 s | 1.21 s |
| Calendar main-thread long-task time | 281 ms | 118 ms |
| Browser storage entries after calendar load | 44 | 2 |
| Homepage LCP | 2.13 s | 0.86 s |

The initial calendar JavaScript reduction is approximately 62%. The homepage
loaded a single 1.52 MB WebM video, replacing retries totaling about 9.83 MB in
the baseline browser. Host timings include the improved local API setup.

The font files include the Inter and IBM Plex Mono SIL Open Font License notices
and the Material Symbols Apache 2.0 license, alongside the assets. Their source
is the same Google Fonts families previously requested from external stylesheets.

## Second pass (2026-11-17): assets, charts and sign-in

| Change | Before | After |
| --- | ---: | ---: |
| Material Symbols font (every page with icons) | 1.14 MB | 120 KB |
| `amud-logo-brand.svg` | 67 KB | 21 KB |
| `favicon.svg` | 67 KB | 16 KB |

- **Icon font subset.** `public/fonts/material-symbols-outlined.<hash>.woff2` keeps only the
  icon names found in `src` (FILL and weight axes preserved; all icons verified pixel-identical
  to the full font). `npm run build` first runs `scripts/icons/material-symbols.cjs`, which fails
  if code uses an icon missing from the subset. Regenerate with `npm run icons:subset`
  (`pip install fonttools brotli`); the full font lives in `scripts/icons/`.
- **Logo masks** were 1254 px PNGs inside the SVGs; they are now sized for the largest display.
- **Charts.** recharts (~320 KB) is loaded by `components/amud/analytics/plots.tsx` through
  `lazyPlots.tsx`, after the dashboard renders. Each plot keeps its final height (CLS 0).
- **Sign-in country picker.** The Base UI dialog and the localised country list load when the
  browser is idle or on first hover/focus, instead of during the first render.
- **Planner.** For a returning user, the remembered centre's resources and current week are
  requested together with `/centers` instead of after it.

A/B on the same machine, mobile profile (390 px, 4x CPU slowdown, 9 Mbit/s, 70 ms latency),
two rounds each, before = same tree with these changes reverted:

| Page | Transfer before → after | Ready before → after |
| --- | ---: | ---: |
| `/auth-phone` | 1,565 → 524 KB | 1.70 → 0.75–1.10 s |
| `/metiers` | 1,580 → 547 KB | 1.73 → 0.79–1.16 s |
| `/admin` | 1,682 → 669 KB | 2.02–2.60 → 1.11–1.26 s |
| `/amud/centre/planning` | 1,491 → 475 KB | 2.37–2.78 → 2.30–2.48 s |
| `/` | 551 → 515 KB | unchanged (no icon font) |

Main-thread blocking on `/admin` (~1.5 s at 4x CPU) is unchanged: recharts still runs, only later.
