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

### CI pipeline — NOT TESTED yet

`.github/workflows/ci.yml` has not run yet; it will run on the pull request. Result to be recorded here.

### NOT TESTED (features not built)

Load/performance, mobile apps, real screen readers, real email delivery, payments, verification, backups/restore, penetration testing, other browsers (Firefox, Safari).
