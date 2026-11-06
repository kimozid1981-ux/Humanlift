# Test results

Status labels: **VERIFIED** (test executed, evidence below), **REPORTED BUT NOT VERIFIED**, **BLOCKED**, **FAILED**, **NOT TESTED**.

## Run 2026-11-05 — Milestone 1

**Environment:** cloud Linux container, Node.js 22.23, pnpm 10.28, PostgreSQL 16.15 (local), Chromium bundled with Playwright 1.63. Synthetic data only (`@example.test` addresses). Not a staging or production environment.

### API tests — VERIFIED

Command: `pnpm --filter @humanlift/api test` (Jest + Supertest against a real PostgreSQL database)

```
PASS test/admin.e2e.test.ts
PASS test/auth.e2e.test.ts
PASS test/public.e2e.test.ts
PASS test/config-and-crypto.test.ts
PASS test/rate-limit.e2e.test.ts
Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total
```

Covers: registration validation; Argon2id hashes; only token hashes stored; secure cookie flags; email verification single-use; identical errors for wrong password vs unknown email; logout revocation; password reset revokes all sessions; profile update; self-service roles limited to applicant/donor; personal data export contains no secrets; data requests; password change; member cookie rejected by admin API; staff login refused for members; MFA required before admin access; invalid TOTP rejected; MFA secret encrypted at rest; least privilege between staff roles; super admin cannot change own roles; role changes audited; suspension ends sessions; country approval refused without sign-off; data request handling recorded; **audit log UPDATE/DELETE/TRUNCATE rejected by the database**; DB-level country approval constraint; lower-case email constraint; honeypot; abuse report linked to reporter; stats report money figures as unavailable; security headers; rate limiting returns HTTP 429 after the limit; AES-GCM tamper detection; config refuses weak keys; sandbox outbox disabled in production config.

### Browser end-to-end tests — VERIFIED

Command: `CI=1 pnpm --filter @humanlift/web test:e2e` (Playwright starts the built API, web and admin servers)

```
44 passed (50.5s)
```

Projects: `desktop-chromium` (all specs) and `mobile-chromium` (Pixel 7 viewport, public pages).
Covers: language redirect, test banner, EN↔FR switch, every header/footer page returns 200 in both languages, draft notices on legal pages, honest empty states, live country data, 404, sitemap hreflang, robots blocks test env, skip link keyboard focus, **axe-core WCAG 2.2 A/AA scan with zero serious/critical violations on 8 pages**, full member journey (register → confirm email → edit profile → add role → data request → download → sign out → wrong password → sign in), accessible registration errors, French email, password reset, signed-out redirect, contact form, French abuse report, super-admin creation via CLI script, MFA enrolment with a real TOTP code, admin queues, country approval refusal, audit log entries, admin sign-out.

Note: the server log prints `Error: Internal: NoFallbackError` during the 404 test. This is Next.js logging the intended 404 and does not affect results.

### Type checks and builds — VERIFIED

`pnpm -r typecheck` and `pnpm -r build`: all three packages succeeded.

### Dependency audit — VERIFIED

`pnpm audit --prod` initially reported 58 advisories (4 critical, 29 high) in pinned framework versions. After upgrading Next.js to 15.5.29, NestJS to 11.2.8, zod to 4.6.7 and overriding multer, postcss, deepmerge-ts and sharp: `No known vulnerabilities found`.

### CI pipeline — VERIFIED after one fix

First GitHub run (2026-11-05, [run 42107799254](https://github.com/kimozid1981-ux/Humanlift/actions/runs/42107799254)): install, audit, migrations, API tests and builds passed; **1 of 44 browser tests FAILED**. The admin test expected a contact message that another test creates later; on GitHub the tests ran in a different order. Fix: the admin test now sends its own message first. After the fix, the full browser suite was re-run locally in CI mode on a database that already held API-test data: **44 passed**. GitHub re-run on commit d9d6a86 ([run 42111653135](https://github.com/kimozid1981-ux/Humanlift/actions/runs/42111653135)): **passed**.

## Run 2026-11-06 — Help requests (test mode, no money)

**Environment:** same cloud container, local PostgreSQL 16, Chromium from Playwright. Synthetic data only. A fictional country "ZZ / Testland" with test-only sign-off is used by the API tests to check publication, then switched back to NOT_RESEARCHED.

| Check | Result |
|---|---|
| API tests | **VERIFIED: 53 passed** (10 new for requests: only applicants create; drafts private; amount, currency, healthcare-off, display name and deadline validation; max 3 open; confirmed email to submit; drafts-only editing; full review with reasons; publication refused without consent and without an approved country; publication in an approved country hides the applicant's identity; withdrawing consent takes it offline; nobody reviews their own request; history rows cannot be edited; database refuses public status without consent and funding above the amount; requests in the data export) |
| Mutation check | **VERIFIED:** with the country check deliberately switched off, the publication test failed as it should; check restored |
| Browser tests (`CI=true pnpm test:e2e`) | **VERIFIED: 46 passed** (2 new: English journey draft → review → sent back with reason → resubmit → approve → publish refused without consent → consent → publish refused for an unapproved country → nothing public; French form labels and amount error, and a donor is told to add the applicant role first) |
| Typecheck (all packages) | **VERIFIED** |
| Admin queue and public request pages in a real browser beyond these tests | **NOT TESTED** manually |
| Mobile app request screens | **NOT BUILT** yet (web only for now) |

## Run 2026-11-05 (evening) — Production setup

**Environment:** same cloud container, Docker 29.9.2. Images built from a copy of `Dockerfile` that only adds this sandbox's network proxy settings (the sandbox blocks direct internet from containers). Local PostgreSQL 16 on a fresh database. A local test mail server (aiosmtpd) stood in for a real email provider. Synthetic `@example.test` addresses only.

| Check | Result |
|---|---|
| API tests (`pnpm --filter @humanlift/api test`) | **VERIFIED: 43 passed** (new: empty email settings count as not set; production/staging refuse to start without SMTP; SMTP adapter sends from the configured sender; server boots with real email on; registration still succeeds when the email service is down) |
| `pnpm audit --prod` after adding the email library | **VERIFIED: no known vulnerabilities** (the first version picked, nodemailer 7, had 20 advisories and was replaced by 10.3.1) |
| `docker build` targets api, web, admin | **VERIFIED** |
| API container on a fresh database: migrations applied, 15 countries seeded, starts in production mode | **VERIFIED** |
| Website `/en` and admin `/login` return 200 from their containers; robots.txt allows indexing in production | **VERIFIED** |
| Sign-up through the website proxy in French: HTTP 201, cookie `HttpOnly; Secure; SameSite=Lax`, French confirmation email delivered over SMTP with the right sender | **VERIFIED** |
| Email confirmation link: page loads, confirmation recorded in the database | **VERIFIED** |
| Sandbox outbox route in production | **VERIFIED: 404** |
| Mobile-style sign-up (header `X-HumanLift-Client: mobile`): 201, no cookie, Bearer token accepted | **VERIFIED** |
| Super-admin creation inside the container; staff sign-in through the admin app asks for authenticator setup | **VERIFIED** |
| `docker compose config` on `deploy/docker-compose.yml` | **VERIFIED** |
| Caddy HTTPS config (`caddy validate`) and certificates | Config: **VERIFIED on GitHub** by the `server-images` check on commit 781b483 ([run 42141530991](https://github.com/kimozid1981-ux/Humanlift/actions/runs/42141530991)), which also built the three production images and validated the Compose file. Real certificates: **NOT TESTED** (needs a server with a domain) |
| On a real server with a real email provider | **NOT TESTED** (no server or accounts yet) |

**Bugs found and fixed by this run:** (1) the server could not start with real email on (dependency wiring), which a unit test had missed; a start-up test now covers it. (2) if the email service failed during sign-up, the account was created but the person saw an error; sign-up now succeeds and the failure is logged.

## Run 2026-11-05 — Mobile app (Flutter)

**Environment:** same cloud container, Flutter 3.47.7 / Dart 3.13, Linux. No Android SDK (download blocked here), no macOS.

### Static analysis — VERIFIED
`flutter analyze`: `No issues found!`

### Widget tests — VERIFIED (13 passed)
`flutter test` against a fake API (no real server, no real phone): welcome screen and test banner; French locale; registration validation (role, terms, 12-character password, nothing sent while invalid); registration stores the token in secure storage and sends `X-HumanLift-Client: mobile`; profile name edit and adding the applicant role; privacy request and duplicate refusal; sign out clears the token, wrong password shows a generic error, sign in works; saved session restored on start; clear network-error message; contact form; Android and iOS tap-target and text-contrast guidelines; layout at 200% text size; privacy cover when the app leaves the foreground.

### API support for the app — VERIFIED
`services/api/test/mobile.e2e.test.ts` (part of the 37 API tests): mobile registration returns a token and sets no cookie; the bearer token works on member endpoints; logout revokes it.

### Android debug APK build — VERIFIED (builds; not installed on a device)
GitHub run on commit d9d6a86 ([run 42111653279](https://github.com/kimozid1981-ux/Humanlift/actions/runs/42111653279)): `flutter analyze`, `flutter test` and `flutter build apk --debug` passed. The APK is attached to the run as `humanlift-android-debug-apk` (kept 14 days).

### iPhone build — NOT TESTED
Unsigned build is available as a manual GitHub job on macOS. Not run yet (uses paid-rate macOS minutes; run it from the Actions tab when wanted).

### On a real device, emulator or simulator — NOT TESTED
Needs Android Studio or Xcode on a computer, or a phone with developer mode. See `apps/mobile/README.md`.

### NOT TESTED (features not built)

Load/performance, mobile apps on real devices, real screen readers (web and mobile), real email delivery, payments, verification, backups/restore, penetration testing, other browsers (Firefox, Safari).
