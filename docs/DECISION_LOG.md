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
| 14 | 2026-11-05 | Mobile app in Flutter 3.47.7 (one code base for Android and iPhone) | Brief names Flutter; one team can maintain both apps | Native Kotlin + Swift (two code bases), React Native | Claude (per brief) | Costly later |
| 15 | 2026-11-05 | Mobile sign-in uses a bearer token returned in the response body when the app sends `X-HumanLift-Client: mobile`; stored in Keychain/Keystore via flutter_secure_storage | Phones do not handle cookies like browsers; same hashed-token sessions on the server | Separate OAuth/JWT system (more moving parts) | Claude | Yes |
| 16 | 2026-11-05 | Android blocks screenshots and app-switcher previews (`FLAG_SECURE`); both platforms cover the screen when the app leaves the foreground; Android backups off | Brief: no sensitive data in screenshots or app-switcher previews | Allow screenshots (easier support, weaker privacy) | Claude | Yes |
| 17 | 2026-11-05 | First hosting setup is one EU server running Docker Compose (database, API, website, admin) behind Caddy for automatic HTTPS | Cheapest and simplest to run for one founder; works on any VPS provider, so no lock-in | Managed platforms per service (simpler upgrades, higher cost, several accounts) | Claude (recommendation) — **founder to choose provider** | Yes |
| 18 | 2026-11-05 | Registration succeeds even if the confirmation email fails to send; the failure is logged and the member can resend from the account page | Otherwise a retry says "email already used" and the person is stuck | Fail the whole registration (requires undoing the account) | Claude | Yes |
| 19 | 2026-11-05 | Help requests are publishable only with the applicant's explicit, withdrawable consent AND in a country approved for beta/launch; both checked by the API, consent also by a database rule | Brief: never published by default; country approval gates. Keeps anything from going public by accident | Publish on staff approval alone | Claude | Yes |
| 20 | 2026-11-05 | Healthcare category switched off; max 3 open requests per applicant; amounts 1 to 10,000 in whole cents | DPIA not done; abuse limit; no floating-point money | Allow all categories; no limit | Claude — **founder can change the limits** | Yes |
| 21 | 2026-11-05 | Staff identities are hidden from applicants in the request history; nobody can review their own request | Protect staff from pressure; separation of duties | Show reviewer names | Claude | Yes |
