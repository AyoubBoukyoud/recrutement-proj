# Connected timetable management

The existing Next.js Amud centre shell now hosts a database-backed planner at
`/amud/centre/planning` and room dashboard at `/amud/centre/salles`. Administrators
can open it from `/admin/centres`. Both pages work with prototype flags disabled.

## Architecture and compatibility

Before this change, centre schedules, teachers, formations, groups and room names
were demo factories persisted in browser localStorage. The Laravel application had
real Sanctum users, a `Training Center` platform role and `recruitment_centers`, but
no teaching-resource or schedule tables and no account-to-centre membership.

The connected planner reuses recruitment centres with `category=training_center`,
Sanctum, account blocking middleware, the HTTP client, React Query, Amud colour
tokens, toast provider, modal, focus trap, buttons and navigation. It never imports
or silently uploads demo seeds. All options and sessions come from the API.
Existing prototype pages and their local data remain available as before; the
legacy `ScheduleFormModal` callers retain their existing local adapter. The
connected planner loads `SessionAssignmentForm` on demand, avoiding the legacy
demo-data bootstrap. Navigation shares a lightweight shell; prototype controls
load only when a prototype page is opened.

The other centre pages (attendance, remuneration, formations, etc.) still use
their existing prototype storage. They do **not** consume database-backed sessions.
Migrating those business domains is separate work; this feature does not silently
mix synthetic IDs with database IDs. Real teaching data must be entered through
**Ressources**, or migrated by a reviewed, organisation-specific data import.

## Installation and access

From `backend`, run `php artisan migrate`. No seeds or environment flags are
required for the timetable. This adds migration
`2026_11_15_100000_create_training_timetable_tables.php`:

- A revision counter on existing `recruitment_centers` rows, used to serialize writes.
- `training_center_members`: user-to-centre permissions.
- `training_teachers`, `training_modules`, `training_groups`, `training_rooms`.
- `training_sessions`: resource foreign keys, local academic date/times, version,
  request key, creator, timestamps and indexed resource/date lookups.
- `training_schedule_events`: immutable session change snapshots and actor IDs.

Existing records are preserved. No production database was migrated during
implementation; validation used temporary, isolated databases.

An existing **Administrator** account can view and manage every training centre.
Create centres using the existing centre management page, then open **Emploi du
temps et salles**. In **Ressources**, enter actual professors, modules, groups and
rooms. Names are normalized and unique within each resource type and centre;
resources referenced by sessions cannot be deleted.

For centre accounts, an administrator first grants the existing **Training Center**
platform role through account management, then uses **Ressources → Accès des membres
du centre** with that account's numeric ID. `CENTER_OWNER`, `CENTER_ADMIN` and
`COORDINATOR` can edit. `TEACHER`, `ACCOUNTANT` and `STUDENT` can read. Revoking a
membership takes effect on the next API request. A browser role selector or local
centre ID never grants access. Other platform roles cannot access timetable data.

## Local sample data

To populate the calendar for a local walkthrough, run from `backend`:

```sh
php artisan db:seed --class=TimetableDemoSeeder
```

This explicitly creates **AmudSkills — Centre de démonstration**, with 3 groups,
4 professors, 6 modules, 4 rooms and 48 classes across the current and following
academic weeks. Select that centre in the planning toolbar while signed in as an
existing administrator. Parallel classes and free periods let you explore group
filtering, room occupancy, moving/resizing and conflict prevention.

The seeder runs only in `local`/`testing`, uses the scheduling service for conflict
checks, and is never called automatically by migrations or `DatabaseSeeder`.
Repeat runs skip previously created sessions, preserving your edits. Existing
centres and their data are untouched. The sample centre is identified by
`timetable@demo.amudskills.test`.

## API

All routes are under `/api/timetable`, protected by the existing Sanctum,
`account.active` and API throttle middleware. Centre-specific routes validate
server-owned membership on every request.

| Method and suffix | Behavior |
| --- | --- |
| `GET /centers` | Accessible training centres and `can_manage` |
| `GET /centers/{center}/resources` | Real teaching resources |
| `POST /centers/{center}/resources/{kind}` | Create a named resource |
| `PUT /centers/{center}/resources/{kind}/{id}` | Rename a resource |
| `DELETE /centers/{center}/resources/{kind}/{id}` | Delete an unused resource |
| `GET /centers/{center}/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD` | Inclusive date range, maximum six weeks; optional `group_id`, `room_id` filters |
| `POST /centers/{center}/availability` | Conflicts and up to three available same-day alternatives |
| `POST /centers/{center}/sessions` | Create with a UUID `request_key` |
| `PUT /centers/{center}/sessions/{id}` | Update with current integer `version` |
| `DELETE /centers/{center}/sessions/{id}` | Delete with `{ "version": ... }` JSON body |
| `PUT /centers/{center}/members` | Administrator only: `{user_id, role}`; `role: null` revokes access |

Resource kinds are exactly `teachers`, `modules`, `groups`, `rooms`. A session
contains `teacher_id`, `module_id`, `group_id`, `room_id`, `date`, `start_time`,
`end_time`. Times are `HH:mm`; end must be after start within the same academic day.
The existing single-group-per-session relationship is preserved.

`422` responses identify resource/time validation or scheduling conflicts. Conflict
responses include `available`, `conflicts`, and `alternatives`. `409` identifies
stale edits/deletes or reuse of an already completed request key with different
data. Retrying an identical creation request returns the existing session.

## Consistency and interactions

Academic dates and wall-clock times use `Africa/Casablanca`. Calendar arithmetic
uses date-only UTC arithmetic, independent of the browser's timezone and DST.
No arbitrary UTC conversion changes a course's date or local starting time.
Sessions cannot span midnight; split such a course into two sessions. The view
shows Monday–Sunday, including existing Sunday courses, with 30/60-minute grid
steps. It expands for courses outside the default 08:00–22:00 window.

The group sidebar and room view share the same weekly query/cache. All weekly
sessions are fetched once and filtered locally, so changing group or room does
not issue repeated calendar requests. Changes update cached weeks immediately,
then invalidate affected session queries. Background/focus refresh and a 30-second
poll expose other administrators' updates; this is polling, not WebSocket push.

Pointer selection opens the assignment form. Moving and resizing call the same
server mutation as form editing. The original block stays visible until the save
succeeds; conflicts leave the persisted schedule unchanged. Overlapping courses
from different groups occupy separate columns. Click/tap opens course details.
Arrow keys navigate empty slots and Enter opens creation; session buttons and
form controls also work with the keyboard. Touch users can use the Add button and
form for an equivalent editing path, alongside draggable session blocks.

Every schedule/resource/membership writer locks the persistent centre row inside
a database transaction before examining or changing data. This serializes empty
calendar bookings as well as edits across PHP workers. Time overlap uses half-open
intervals (`start < other.end && end > other.start`), permitting adjacent courses.
Foreign resources and cross-centre session IDs are rejected. Optimistic integer
versions prevent stale writes; successful mutations and audit entries commit
atomically. Deployment should use the project's transactional MySQL/InnoDB setup.
Direct SQL imports must follow the same checks/locking protocol.

Professor identity is currently per centre, matching the existing model. A shared
professor spanning different centres would require a canonical shared identity
before cross-centre collision detection can be enforced.

## Files and verification

Backend implementation: `TimetableController`, `TrainingSession`,
`Services/Timetable/SchedulingService`, API routes and the migration above.
Frontend implementation: centre planning/room pages, centre layout/shell, the
`centre/timetable` components, `services/timetableService.ts`,
`lib/amud/timetable`, `ScheduleFormModal`, the shared HTTP delete-body support,
admin centre link and demo-toolbar exclusion.

From `frontend`:

```sh
node scripts/verify-timetable-calendar.cjs
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

From `backend`:

```sh
php artisan test
./vendor/bin/pint --dirty --test
```

`TimetableTest` covers CRUD, audit, all conflict types, rejected moves, same-day
alternatives, boundaries, membership, cross-centre isolation, idempotency,
resource integrity and stale updates/deletes. `TimetableConcurrencyTest` uses two
PHP workers against MySQL/MariaDB to verify an empty slot cannot be double booked;
it skips on in-memory SQLite or without `pcntl`. Frontend calendar checks cover
timezones, week/year/leap boundaries and 4,000 randomized event-layout cases.

Implementation verification on 2026-11-15:

- Full Laravel suite: **386 tests, 2,004 assertions passed** on isolated MariaDB.
- Final timetable regression run: **10 tests, 129 assertions passed**, including
  two-process concurrency after the last server-lock adjustment.
- Production build passed, including both connected routes.
- TypeScript and ESLint passed; ESLint reported 72 existing warnings, no errors.
- Existing client-demo and demo-role/auth/proxy contract scripts passed.
- Chromium against the actual Laravel API verified resource creation, range
  selection, searchable assignments, save/reload, cross-day dragging, resizing,
  editing, confirmed deletion, group search/filter, week navigation, room
  occupancy boundaries, rejected conflicting drags, saving suggested alternatives,
  keyboard slot selection and read-only course details.
- Screenshots and overflow checks covered desktop and a 390px mobile viewport;
  the calendar scrolls horizontally within its own container.
