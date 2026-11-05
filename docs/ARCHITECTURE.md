# Architecture

**Last updated:** 2026-11-05. Full reasoning: [audit/01-architecture.md](audit/01-architecture.md), data model: [audit/02-database.md](audit/02-database.md), security: [audit/03-security.md](audit/03-security.md).

## As built (Milestone 1)

```
Browser ──► apps/web    (Next.js 15, :3000) ── /api/* proxy ──┐
Staff   ──► apps/admin  (Next.js 15, :3001) ── /api/* proxy ──┤
Phone   ──► apps/mobile (Flutter, Android + iOS) ─ Bearer ────┤
                                                              ▼
                     services/api (NestJS 11, :4000, /v1) ──► PostgreSQL 16
                       └─ SandboxMailer → DevOutboxEmail table (dev/test only)
```

- **Same-origin proxy:** each web app forwards `/api/*` to the API, so session cookies are first-party `HttpOnly` cookies and the API needs no CORS.
- **Two cookie names:** `hl_session` (members) and `hl_admin_session` (staff). A staff session is only valid on admin endpoints and only after MFA.
- **Mobile sessions:** the app sends `X-HumanLift-Client: mobile`; the API then returns the session token in the response body instead of a cookie, and accepts `Authorization: Bearer <token>`. The server still stores only the token's hash. The app keeps the token in Keychain (iOS) / Keystore (Android).
- **API versioning:** every route is under `/v1`.
- **Authorisation:** guards in `services/api/src/auth/guards.ts`. Admin endpoints are deny-by-default: each must declare allowed roles.
- **Validation:** every request body is validated with zod (`common/zod.pipe.ts`) and returns field-level errors.
- **Database rules in SQL** (`prisma/migrations/*_init/migration.sql`): append-only `AuditLog` trigger; `Country` approval requires legal + payment sign-off; lower-case emails.
- **i18n:** `apps/web/src/i18n/` — `en.ts`, `fr.ts`; all eight launch languages declared in `config.ts`, Arabic marked RTL; `<html lang dir>` set per locale; hreflang alternates and sitemap.
- **Provider adapters:** `Mailer` interface with `SandboxMailer`. Identity, payment, storage adapters follow the same pattern in later milestones.

## Environments

| Env | Status |
|---|---|
| development (local) | Working — see guides/local-development.md |
| test (CI) | `.github/workflows/ci.yml` (API + web + admin) and `.github/workflows/mobile.yml` (Flutter checks, Android test APK; iPhone build on demand) |
| staging / production | Do not exist. Need a hosting decision and founder approval |

## Known technical debt

- Next.js 15 / TypeScript 5.9 / Prisma 6 were chosen over newer majors for stability; plan an upgrade window.
- No shared types package yet between API and web; small duplicated unions (roles, statuses).
- No structured logging or error monitoring yet.
