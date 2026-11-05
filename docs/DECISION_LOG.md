# Decision log

Each entry: date, decision, reason, alternatives, who decided, reversible?

| # | Date | Decision | Reason | Alternatives considered | Decided by | Reversible |
|---|---|---|---|---|---|---|
| 1 | 2026-11-05 | Create a stub `main` branch in the empty repo | A pull request needs a base branch | Push everything to `main` directly (rejected: no review) | Claude | Yes |
| 2 | 2026-11-05 | Monorepo with pnpm workspaces: `apps/web`, `apps/admin`, `services/api` | One place for code, docs, CI; shared tooling | Separate repos (more overhead for one founder) | Claude | Yes |
| 3 | 2026-11-05 | NestJS (TypeScript) API, modular monolith | Same language as web; module boundaries; brief asks to avoid early microservices | FastAPI (good, but second language) | Claude | Costly later |
| 4 | 2026-11-05 | PostgreSQL + Prisma migrations; safety rules as SQL triggers/constraints | Money and audit need DB-level guarantees, not only app code | ORM-only rules | Claude | Yes |
| 5 | 2026-11-05 | Own session-based auth (Argon2id, hashed opaque tokens, HttpOnly cookies) instead of a hosted auth provider | No credentials/budget available yet; keeps data in-house; simple to audit | Auth0/Clerk/Supabase Auth (cost, data transfer, vendor lock-in) | Claude | Medium effort |
| 6 | 2026-11-05 | Mandatory TOTP MFA for all staff roles | Brief requires MFA for privileged accounts; TOTP works offline and is free | SMS (cost, SIM-swap risk), passkeys (planned M6) | Claude | Yes |
| 7 | 2026-11-05 | Separate admin app and separate staff cookie | Lets the admin be locked down independently | Admin pages inside the web app | Claude | Yes |
| 8 | 2026-11-05 | Email via sandbox adapter only | No email provider credentials; must not fake sending | Real provider (needs founder account + approval for paid service) | Claude | Yes |
| 9 | 2026-11-05 | Legal pages published as clearly marked drafts | Required pages must exist; no legal review has happened | Leave pages empty (confusing) or write "final" text (dishonest) | Claude | Yes |
| 10 | 2026-11-05 | Transparency figures shown as "Not available yet", not 0 | Payments do not exist; zero would imply measured data | Show 0 | Claude | Yes |
| 11 | 2026-11-05 | France as provisional first-country candidate for research only | Known IFP/ORIAS route; EUR providers; FR language | Belgium, UK | Claude (recommendation) — **founder to confirm** | Yes |
| 12 | 2026-11-05 | Pin stable majors (Next 15.5.29, Nest 11.2.8, Prisma 6.19.3, TS 5.9) and patch all known advisories via upgrades/overrides | Stability; zero known vulns at time of writing | Latest majors (Next 16, TS 7, Prisma 7) | Claude | Yes |
| 13 | 2026-11-05 | Email verification needs a button click on the landing page | Email security scanners pre-open links; a GET must not change state | Verify on page load | Claude | Yes |
