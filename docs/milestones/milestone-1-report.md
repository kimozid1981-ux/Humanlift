# Milestone 1 report — Functional foundation

**Date:** 2026-11-05

## What was built

- **API** (`services/api`): registration, sign-in/out, sessions, email verification, password reset and change, profiles, applicant/donor roles, staff roles, mandatory staff MFA, data export and data-rights requests, contact form, abuse reports, country configuration, transparency stats, append-only audit log, rate limiting, security headers.
- **Database**: one migration with 10 tables, plus SQL safety rules (audit log cannot be changed; countries cannot be approved without sign-off).
- **Website and web app** (`apps/web`): all 20 public pages from the brief in English and French, registration/login, password reset, email confirmation, account area (overview, profile, security, privacy), contact and abuse forms, test-environment banner, sitemap with hreflang, robots rules.
- **Admin dashboard** (`apps/admin`): staff sign-in with authenticator app, users and roles, abuse reports, contact messages, data requests, countries, audit log.
- **CI**: GitHub Actions workflow running migrations, type checks, API tests, builds and browser tests.
- **Docs**: audit (A–O), project records, local guide.

## What works (verified)

Everything listed above, per TEST_RESULTS.md: **34 API tests and 44 browser tests passed** on 2026-11-05.

## What failed

During development 4 browser tests failed on first run because of test-selector mistakes (Next.js adds its own hidden "alert" element; one navigation race). The tests were corrected, not the product behaviour; all pass now. The dependency audit found 58 known vulnerabilities in the first chosen versions; all were fixed by upgrades and overrides.

## What remains

Everything from Milestone 2 onward. In Milestone 1 scope: CSP header, bot challenge, per-account lockout, Arabic/other languages content (structure is ready), real email provider, hosting.

## Security implications

New attack surface: public registration and forms, admin login. Mitigations listed in SECURITY_REGISTER.md; open items S1–S11.

## Estimated costs

€0 spent. Running costs start only when hosting is approved (estimate €50–€400/month at beta scale).

## Founder approval required

See FOUNDER_ACTIONS.md (F1–F10). Most urgent: review the PR (F1), budget (F3), first country (F4), lawyer and company structure (F5).
