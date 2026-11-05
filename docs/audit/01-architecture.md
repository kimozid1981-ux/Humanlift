# A. Product architecture and B. Technology stack

## A. Product architecture

### In plain English

HumanLift is one product with several "doors":

- a **public website** anyone can read,
- a **web application** where applicants and donors sign in,
- **Android and iPhone apps** that do the same things as the web application,
- a separate **administration dashboard** for staff.

All of these doors talk to one **back-end service** (the API). The API is the only part that touches the database, files and outside providers (identity checks, payments, email). That way, security rules live in one place and cannot be skipped by a badly built screen.

### Diagram

```
 Browsers ──► Website + Web app (Next.js) ─┐
 Staff    ──► Admin dashboard (Next.js) ───┼──► API (NestJS, versioned /v1) ──► PostgreSQL
 Phones   ──► Mobile apps (Flutter) ───────┘          │                      ──► Protected file storage
                                                        │
                                       Provider adapters (swappable):
                                       identity · address · payments · email · SMS · OCR · AI
```

### Main modules inside the API

The API is a **modular monolith**: one deployable service, split into modules with clear boundaries. This is cheaper and easier to run than many small services, and modules can be split out later if traffic justifies it (the brief asks for this).

| Module | Responsibility | Milestone |
|---|---|---|
| `auth` | Registration, login, sessions, password reset, email verification, staff MFA | 1 |
| `users` | Profiles, roles, account settings, data access and deletion requests | 1 |
| `audit` | Append-only log of sensitive actions | 1 |
| `jurisdictions` | Country configuration and availability status | 1 (basic), 8 (full) |
| `public` | Contact form, abuse reports, public statistics from real records | 1 |
| `admin` | Staff-only endpoints, every action audited | 1 (basic) |
| `verification` | Identity, address, phone verification through provider adapters | 2 |
| `documents` | Upload, malware scan, OCR, extraction, duplicate detection, signed URLs | 2 |
| `requests` | Assistance requests and their status machine | 3 |
| `payments` + `ledger` | Contributions, refunds, double-entry ledger, reconciliation | 4 |
| `notifications` | Email, SMS, push | 2 to 5 |

### Provider adapters

Each outside service sits behind an interface, for example `IdentityProvider.startCheck()` / `getResult()`. Milestone 1 already uses this pattern for email: a `SandboxMailer` writes messages to a development outbox table instead of sending them. A real provider is added by writing one new class, without touching the rest of the product.

### Data separation

- **Public data** (request title, amount, progress, display name or "Anonymous") is the only thing the public pages can read.
- **Private data** (identity documents, addresses, invoices) lives in a separate protected file store and separate tables. Staff see it only through short-lived signed links, and only staff whose role allows it.
- **Financial data** is written once and never edited. Corrections are new entries (Milestone 4).

## B. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Website and web app | **Next.js 15 + TypeScript + React 19** | Server rendering is good for search engines and slow phones. Strong accessibility tooling. One language (TypeScript) shared with the API. Huge hiring pool. |
| Admin dashboard | **Separate Next.js app** | Lives on its own address, so it can be locked down (IP allow-list, MFA) without affecting the public site. |
| Mobile | **Flutter** (Milestone 5) | One code base for Android and iOS with native-quality UI, as the brief requests. |
| API | **NestJS 11 (TypeScript)** | Built-in module system matches the modular monolith. Guards make role checks consistent. Same language as the web apps. FastAPI would also work; NestJS was chosen to keep one language across web and back end. |
| Database | **PostgreSQL 16** | Reliable transactions (essential for money), strong constraints, row-level permissions, mature backups. |
| Database access | **Prisma 6** | Typed queries and versioned migrations that are checked into the repository. Raw SQL is used where Prisma cannot express a rule (for example the append-only audit table trigger). |
| Password hashing | **Argon2id** | Current recommendation of the OWASP Password Storage Cheat Sheet. |
| Staff MFA | **TOTP** (authenticator apps) | Works offline, no SMS cost. Passkeys/WebAuthn planned for Milestone 6. |
| Tests | **Jest + Supertest** (API), **Playwright** (browser), Flutter test tools (mobile) | Playwright is requested in the brief. |
| Queues / cache | **Redis** — not added yet | Only needed when background jobs arrive (OCR, notifications) in Milestone 2. Adding it earlier would be unused complexity. |
| Hosting | **Not chosen yet** | Must be an EU region if the first country is in the EU. Candidates to compare in Milestone 6: Scaleway or OVHcloud (French/EU providers), AWS `eu-west-3` (Paris), Google Cloud `europe-west9` (Paris). Decision needs cost and data-transfer analysis. |

### Versions

Stable, widely used major versions were pinned on purpose (for example Next.js 15 and TypeScript 5.9) even though newer majors exist on 5 November 2026. Upgrading is a routine task once the foundation is stable.

### Repository layout (actual)

```
apps/web          Public website + applicant/donor web app (EN, FR; structure ready for 8 languages incl. Arabic RTL)
apps/admin        Staff administration dashboard
services/api      NestJS API, Prisma schema and migrations
docs/             Audit, milestone reports, guides
.github/workflows Continuous integration
```

The brief's suggested layout has more folders (`services/payments`, `packages/design-system`, …). They will be created when there is real code to put in them, rather than as empty folders.
