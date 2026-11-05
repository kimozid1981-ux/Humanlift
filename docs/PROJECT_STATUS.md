# Project status

**Last updated:** 2026-11-05
**Current phase:** Milestone 1 (functional foundation) delivered for review. Maps to consolidated-brief Phases 0–4 plus part of Phase 10 (basic admin) and Phase 13 (EN/FR).
**Branch / PR:** `claude/project-thread-895mx1` → `main`

## Verified facts (evidence in TEST_RESULTS.md)

- Repository was empty before 2026-11-05. Nothing was overwritten.
- API (NestJS + Prisma + PostgreSQL 16) runs; 34 automated API tests pass.
- Website + web app (Next.js, EN/FR) and admin dashboard (Next.js) build and run; 44 Playwright browser tests pass in Chromium (desktop + one mobile viewport).
- Dependency audit (`pnpm audit --prod`): no known vulnerabilities after upgrades and overrides on 2026-11-05.

## What a person can do today (locally / in a test environment)

Register (applicant, donor or both), confirm email (sandbox outbox), sign in/out, reset password, edit profile and language, add a role, download personal data, request access/correction/deletion, send a contact message, report abuse, view country status and transparency page. Staff: sign in with mandatory authenticator-app MFA, view users, change roles (super admin), suspend/reactivate users, handle messages, abuse reports and data requests, edit countries (approval blocked without sign-off), read the append-only audit log.

## Not built yet (NOT TESTED because it does not exist)

Identity/address verification, document upload, OCR, assistance requests, donor discovery, payments, ledger, notifications other than sandbox email, Flutter mobile apps, AI features, the 1,000-persona evaluator harness, hosting/staging/production, monitoring, backups.

## Blockers

See FOUNDER_ACTIONS.md. Main ones: hosting choice and budget; company structure and lawyer for the funds flow; payment provider acceptance; Flutter/Xcode toolchain for mobile.

## Next actions (proposed Milestone 2, acceptance criteria in PROJECT_MASTER_PLAN.md)

1. Secure document storage + upload validation + malware scanning (sandbox).
2. Identity verification adapter with Stripe Identity test mode.
3. Verification statuses per check type and the specialist review queue.
