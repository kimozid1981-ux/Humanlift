# Project status

**Last updated:** 2026-11-05
**Current phase:** Milestone 1 (functional foundation) delivered for review, plus the first Android/iPhone app (Flutter) with the same account features. Maps to consolidated-brief Phases 0–4 plus part of Phase 10 (basic admin) and Phase 13 (EN/FR).
**Branch / PR:** `claude/project-thread-895mx1` → `main`

## Verified facts (evidence in TEST_RESULTS.md)

- Repository was empty before 2026-11-05. Nothing was overwritten.
- API (NestJS + Prisma + PostgreSQL 16) runs; 37 automated API tests pass (including 3 for mobile sign-in).
- Website + web app (Next.js, EN/FR) and admin dashboard (Next.js) build and run; 44 Playwright browser tests pass in Chromium (desktop + one mobile viewport).
- Mobile app (Flutter 3.47.7, one code base for Android and iPhone): `flutter analyze` clean; 13 automated screen tests pass against a fake server. **Not yet run on a real phone, emulator or simulator** (this environment cannot download the Android SDK, and iPhone builds need macOS). GitHub builds an Android test APK on each pull request.
- Production setup (containers + one-command deployment) built and tested in a sandbox in production mode: sign-up through the website, a real email delivered over SMTP (to a local test mail server), email confirmation, mobile sign-in, admin creation and staff sign-in. **Not yet run on a real server.** See guides/go-live.md.
- Dependency audit (`pnpm audit --prod`): no known vulnerabilities after upgrades and overrides on 2026-11-05.

## What a person can do today (locally / in a test environment)

**New:** applicants can prepare a help request, send it for review, read the team's feedback, agree or not to public visibility, and cancel. Staff can review, send back, approve, reject, suspend and publish. Publishing only works in a country approved for beta or launch, and none is approved, so nothing is public. No verification and no money yet.

Register (applicant, donor or both), confirm email (sandbox outbox), sign in/out, reset password, edit profile and language, add a role, download personal data, request access/correction/deletion, send a contact message, report abuse, view country status and transparency page. Staff: sign in with mandatory authenticator-app MFA, view users, change roles (super admin), suspend/reactivate users, handle messages, abuse reports and data requests, edit countries (approval blocked without sign-off), read the append-only audit log.

## Not built yet (NOT TESTED because it does not exist)

Identity/address verification, document upload, OCR, evidence for requests, donations, payments, ledger, notifications other than sandbox email, AI features, store releases of the mobile app, the 1,000-persona evaluator harness, a running staging or production server, monitoring, tested backups.

## Blockers

See FOUNDER_ACTIONS.md. Main ones: hosting choice and budget; company structure and lawyer for the funds flow; payment provider acceptance; Apple and Google developer accounts before the app can be installed on real phones outside of developer tools.

## Next actions (proposed Milestone 2, acceptance criteria in PROJECT_MASTER_PLAN.md)

1. Secure document storage + upload validation + malware scanning (sandbox).
2. Identity verification adapter with Stripe Identity test mode.
3. Verification statuses per check type and the specialist review queue.
