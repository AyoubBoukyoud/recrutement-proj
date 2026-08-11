# Platform Overview

*What this product is, who it serves, and the exact moment its two sides meet.*

This document describes **what exists in this repository today**, not what was promised. Where
something is unbuilt or weaker than it sounds, it says so. For the original pitch see
[Project_Summary_Recruitment_Platform.md](Project_Summary_Recruitment_Platform.md); for a
feature-by-feature audit see [FEATURES_TO_IMPLEMENT.md](FEATURES_TO_IMPLEMENT.md); for running the
stack see [../README.md](../README.md).

---

## 1. What this is

A two-sided recruitment platform that connects **Moroccan job seekers** with **German employers**.

It is not a job board. A job board takes a CV and forwards it. This platform does the work in
between: it takes a candidate who has a trade and a phone, and turns them into a *dossier a foreign
employer can act on* — identity and education in structured fields rather than prose, language
levels stated per language and backed by evidence, diplomas and certificates attached as files, and
optionally a spoken assessment and a presentation video. Recruiters then search that pool by the attributes they actually hire on, and pay when a placement happens.

The product's value is in that preparation step. Anyone can collect CVs; the hard part is making a
candidate in Casablanca legible to a hiring manager in Stuttgart.

---

## 2. The two sides, and why each needs the other

**The job seeker's problem** is distance and proof. They may be a perfectly qualified nurse or
electrician, but they have no route to a German employer, no way to demonstrate that their German is
really B1 rather than a claim on a CV, and no way to make a Moroccan diploma mean something to
someone who has never seen one. Their CV is a PDF in a format no German recruiter reads fluently.

**The recruiter's problem** is the mirror image: trust at distance. They can find hundreds of
foreign candidates; what they cannot do is tell, from a document, which ones can hold a conversation
on a ward or a building site, which ones have paperwork that will survive scrutiny, and which ones
are actually available in the next two months rather than "interested in principle".

What the platform puts between them is **a structured, evidenced dossier and a filter over it**. The
candidate's claims are broken into fields a search can reason about; documents sit attached as
evidence; a language level carries its source (self-declared, machine-assessed, or backed by a
certificate). The recruiter never reads a pile of PDFs — they narrow a pool and open the few
dossiers worth their time.

---

## 3. One login, four spaces

There is **one web application** and one way into it: a phone number and a one-time code sent by
WhatsApp or SMS. No passwords, no email sign-up — the audience is mobile-first, and a phone number
is the one identifier every candidate has.

The account's role decides where it lands, and the app enforces that on every route
(`src/lib/roleDestination.ts`, `src/middleware.ts`):

| Role | Lands on | Who they are |
| --- | --- | --- |
| Candidate | `/dashboard` | The job seeker building a dossier |
| Company | `/recruiter` | The employer searching the pool |
| Commercial Agent | `/agent` | Field staff who bring candidates in and earn commission |
| Administrator | `/admin/dashboard` | Staff who vet dossiers and keep candidates moving |

The same account can be signed in on several devices, and every session is listed and revocable.
Losing the phone number is a recoverable situation rather than a lost account: the number can be
moved from a signed-in device, or reassigned by an administrator when every session is gone.

---

## 4. The job seeker's journey

**Sign in.** Phone number, then the code.

**Build the dossier.** A multi-step form covering personal details (legal first and last name, date
of birth), education (each entry with level, field, institution and dates), languages, availability,
and consents. Languages are the part that matters most to a German employer: French, Arabic, English
and German, each with a CEFR level from A1 to C2. Availability is one of three answers a recruiter
can filter on — *immediately*, *within one month*, *within two months*. The consents are the Terms
of Use and the CNDP declaration required by Moroccan data-protection law.

**Add a CV, and let it fill the form in.** Rather than typing all of the above, the candidate
uploads or photographs their CV. The platform reads it and pre-fills name, date of birth,
profession, specialisation, years of experience, education entries and language levels; the
candidate then confirms or corrects what was read, and only what they confirm is written to their
profile. What they typed themselves is never silently overwritten — where the document disagrees
with something already on the profile, the platform says so and lets them choose. If a page was too
poor to read, they are offered the two remedies that actually differ: run the same file again, or
replace it with a better photograph.

**Optionally, prove the language.** The candidate is given a topic and speaks freely for up to a
minute. The recording is transcribed locally, and the result is a CEFR estimate shown *with its
reasoning* — speaking pace, filler-word ratio, how clearly each word was recognised, duration —
rather than asserted as a verdict. A certificate they have attached always outranks the machine, and
where the machine and the candidate disagree by two bands or more, the discrepancy is flagged for
the recruiter rather than hidden.

**Optionally, record a short presentation video** — the one part of the dossier that shows
personality rather than facts.

**Submit.** Submission requires the five essential sections to be complete: personal details,
education, languages, availability and consents. The CV, certificates and video count towards
progress but never block it. Submitting stamps the dossier as ready — but note that it is *not*
what makes the candidate visible. That is section 6.

---

## 5. The recruiter's journey

**Search the pool.** Free text across name, profession and specialisation, plus filters on
profession, specialisation, a language *with a minimum CEFR level*, minimum years of experience,
availability, education level, and two quality flags — has a presentation video, has a completed
language assessment. Results can be narrowed to submitted dossiers only, or to candidates already
shortlisted, and sorted by recency, experience or name.

**Read the dossier.** One pane: personal facts, full education history, every language with its
level and where that level came from, the assessment metrics and transcript, the presentation video,
and the documents as openable files. Documents are presented as *evidence* — what each one is, and
whether a language certificate actually backs a claimed level — and never as scanner status, so an
internal failure to read a page can't be misread as a mark against the candidate.

**Work the pipeline.** A candidate can be saved to the recruiter's own shortlist with private notes
and moved through five stages: **saved → contacted → interviewing → placed → rejected**. Each
recruiter's shortlist, notes and stages are their own. The shortlist exports as CSV for anyone who
would rather work in a spreadsheet or their own applicant-tracking system.

**Reveal contact details.** Phone and email are not in the search results and not in the dossier. A
recruiter must ask for them explicitly, and that moment is recorded.

---

## 6. The link — how a candidate becomes visible to a recruiter

This is the mechanism the whole product turns on, and it is governed by four rules.

**The gate is consent, not completeness.** A candidate enters the searchable pool the moment both
consents — Terms of Use and CNDP — are recorded. Not when their profile is finished, not when an
administrator approves them, not when they submit. This is a deliberate legal position rather than a
product one: the platform may show a person to an employer exactly when that person has agreed their
data may be processed, and never before.

**Submitting is a signal, not a switch.** "Dossier submitted" tells recruiters this candidate
considers themselves ready, and it is a filter they can apply. It is also the milestone that earns a
referring agent their commission. It does not control visibility — a consenting candidate with a
half-built profile is already findable, they simply present poorly.

**Contact details are withheld until asked for.** Search results and dossiers carry no phone number
and no email. Revealing them is a separate, deliberate action that stamps the moment and writes a
log entry naming the recruiter and the candidate. This is what makes the business model
enforceable: the platform earns on successful placements, so it must be able to show when a
recruiter was first given the means to contact someone.

**Documents are evidence, not pipeline state.** What a recruiter sees is what a document is and
whether anything corroborates it. The internal scanning status stays internal.

The consequence worth holding onto: **the candidate controls their own visibility, and it costs them
one checkbox.** Everything else — completeness, submission, administrative validation — changes how
*attractive* a candidate looks, not whether they can be found.

---

## 7. The supporting cast

**Commercial agents** are the growth loop. An agent generates a QR code from their dashboard; a
prospective candidate scans it, which opens registration with the agent's identity bound to the
session. The referral is tracked from there. A commission *qualifies* when the referred candidate
submits a dossier — not when they scan, because a signed-up phone number that never fills anything
in is worth nothing to the business. The amount is stamped at qualification so a later rate change
cannot move a commission already earned. From qualified, an administrator moves it to approved and
then paid by hand; there is no payment rail in the code, and the schema does not pretend otherwise.

**Administrators** do the work that no automated check can. They read dossiers and mark them
verified, they accept or reject individual documents (a perfectly legible photograph of the wrong
diploma scans fine and is still not acceptable), they run the daily remote internship — a catalogue
of roughly one hour of preparation activity a day, assigned per candidate and tracked — and they
answer complaints. Complaints can be text or a voice note, and every administrator is notified when
one arrives.

---

## 8. What is real today, and what isn't

| Area | Reality |
| --- | --- |
| **Laravel API** | The whole product is here and works: profiles, education, languages, documents and extraction, assessments, recruiter search, shortlists, admin tooling, referrals, complaints. This is the strongest part of the codebase. |
| **Recruiter / admin / agent spaces** | Ported into the webapp and talking to the real API. These screens do what section 5 and section 7 describe. |
| **Candidate space** | **Mostly mock screens.** Only sign-in and the CV/documents screen reach the API. The profile, language test and complaint screens still read local placeholder data — they look finished and are not. This is the single biggest gap between how the app appears and what it does. |
| **CV extraction** | Real, end-to-end, and the one candidate feature fully wired: upload, read, confirm, write to profile. |
| **Language assessment** | Real but honestly labelled. Local transcription plus a *clarity* score derived from how confidently each word was recognised, combined with pace and filler ratio into a CEFR estimate. This is intelligibility to a speech model, **not** phoneme-level pronunciation scoring — closing that gap needs a scripted read-aloud task or a paid API, which is a product decision. Note the candidate-facing screen for this exists only in the older React Native app. |
| **Money** | Candidate subscriptions and payments have **no code at all**. The only money the system models is agent commission tracking, and even that stops at "mark it paid by hand". |
| **`web-admin/`** | The React + Vite console these recruiter/admin/agent screens were ported *from*. Superseded by the webapp; kept only until the move is finished. |
| **`mobile-expo/`** | The earlier React Native candidate app. It is the one where the full candidate experience actually works today, but it is not the direction of travel. |

---

## 9. Where things live

| Directory | What it is |
| --- | --- |
| `backend/` | The Laravel API — the only thing that talks to the database. Every client is a view onto this. |
| `user-app/` | The webapp. Next.js, all four roles, one login. |
| `docs/` | The spec, the feature audit, and this document. |

To run it, see [../README.md](../README.md). One operational note deserves repeating here because it
looks like a bug and isn't: **document scanning and language assessment run as queued background
jobs**. Without a queue worker running, an uploaded CV sits unscanned forever and the app shows
"scanning…" with nothing behind it and no error.

---

## 10. Open questions

Three decisions this document surfaces but does not make:

1. **The candidate screens need finishing against the real API.** Today a candidate can sign in and
   upload a CV for real; everything else they touch is a mock. That is the gap between a demo and a
   product.
2. **The subscription model is unbuilt.** The business plan charges candidates 100 MAD a year and
   takes a commission from employers. Neither exists in code. The commission side is at least
   *measurable* today, because contact reveals are logged.
3. **`web-admin/` needs an end date.** Its screens now exist in two places. Whichever way it goes,
   running both means fixing everything twice.
