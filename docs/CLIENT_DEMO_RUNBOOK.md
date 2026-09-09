# Client demo runbook

This walkthrough uses the real Laravel API and the canonical Next.js pages. Prototype routes,
fixture-backed screens, and developer account shortcuts remain off.

## Demo configuration

Create `frontend/.env.local` from `frontend/.env.example` and keep these values:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCKS=0
NEXT_PUBLIC_SHOW_DEV_TOOLS=0
NEXT_PUBLIC_ENABLE_PROTOTYPES=0
```

The default Laravel development configuration uses SQLite, private local file storage, the database
queue, and the `log` OTP channel. A real client-facing OTP demonstration requires configured
WhatsApp/SMS provider credentials. With `OTP_CHANNELS=log`, obtain the code from the Laravel log or
the local API response; never use that channel in production.

## Start the stack

Use separate terminals from the repository root:

```bash
docker compose up -d

cd backend
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000

cd backend
php artisan queue:work

cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. The root redirects to `/accueil-public`.

## Truthful walkthrough

1. On the public home, switch languages, open a real trade card, and return to the home page.
2. Open the employer overview. Its recruiter action goes to `/auth-phone?intent=recruiter`; the
   recruiter tab should already be selected.
3. Sign in with a seeded role account through OTP. The role returned by the API—not the selected
   tab—chooses the destination:
   - `+212600000001`: administrator
   - `+212600000002`: recruiter
   - `+212600000003`: commercial agent
   - `+212600000004`: candidate
4. Candidate: inspect offers, applications, documents, language estimate, visibility controls,
   notifications, account export, and account/session controls. Do not delete the demo account
   unless that destructive action is specifically part of the walkthrough.
5. Recruiter: manage offers, review applications, search visible candidates, shortlist a profile,
   and use the explicit contact-reveal action.
6. Administrator: review metrics, candidates, recruiters, offers, applications, complaints,
   referrals, tasks, users, and the activity log.

Candidate visibility requires accepted terms and active data-processing consent. Pausing or
withdrawing that consent must remove the candidate from recruiter search; it does not require a
submitted application. Attached language documents and automatic spoken-language results are not
presented as official certificates.

## Pre-demo checks

```bash
cd backend && php artisan test --compact
cd frontend && npm run test:client-demo
cd frontend && npx tsc --noEmit
cd frontend && npm run lint
cd frontend && npm run build
cd mobile-expo && npx tsc --noEmit
```

Also verify at narrow and desktop widths: public mobile menu, recruiter horizontal navigation,
candidate bottom navigation, all primary CTAs, and expired-session redirection. A 403 must remain an
authorization error and must not log the user out.

## Claims intentionally excluded

The demo does not claim CNDP registration, full GDPR/DSGVO certification, guaranteed hiring,
guaranteed document-review times, official language certification, salary accuracy, visa or
relocation services, recruiter self-service approval, subscriptions, or payments. These require
business, legal, operational, or provider decisions outside this implementation.
