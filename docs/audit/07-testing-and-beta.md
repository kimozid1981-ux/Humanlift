# K. Testing strategy and L. Public beta strategy

## K. Testing strategy

### Principle

A feature is only called "working" when an automated test exercises it, or a person has followed written steps and recorded the result. Test results are copied into each milestone report exactly as produced, including failures.

### Layers

| Layer | Tool | Starts in | What it proves |
|---|---|---|---|
| Unit tests | Jest | M1 | Small pieces of logic (password rules, permissions, encryption) behave correctly |
| API integration tests | Jest + Supertest against a real PostgreSQL | M1 | Endpoints, database rules and role checks work together |
| Database rule tests | Same | M1 | Audit log cannot be edited or deleted; country cannot go live without sign-off |
| End-to-end browser tests | Playwright + Chromium | M1 | Real journeys in a real browser: register, verify email, sign in, edit profile, switch language, use contact form, staff MFA login |
| Accessibility checks | axe-core in Playwright | M1 (key pages) | Automated WCAG checks; manual screen-reader tests added in M6 |
| Migration tests | `prisma migrate deploy` on an empty database in CI | M1 | Migrations run from scratch |
| Flutter widget / integration tests | flutter_test, integration_test | M5 | Mobile screens and journeys |
| Payment sandbox tests | Provider test mode | M4 | Contributions, refunds, failures, webhooks, reconciliation |
| Security tests | Dependency audit (M1), OWASP ZAP baseline (M6), external pen test (M6) | | |
| Load tests | k6 | M6 | Only then can capacity (100 / 1,000 / 10,000 users) be stated |
| Backup restore test | Scripted restore into a scratch database | M6 | Backups are usable |

### Continuous integration

`.github/workflows/ci.yml` runs on every pull request: install, type check, lint, build, database migrations on an empty database, API tests, and Playwright tests. A pull request should not be merged while CI is red.

## L. Public beta strategy

### Phases

1. **Internal alpha** (end of M3): founder and a few trusted people, synthetic data only.
2. **Closed beta** (M7): 50–200 invited testers in the first country, recruited through partner organisations (social workers, associations), donors from the founder's network, accessibility groups and mobile-only users.
3. **Open beta** (M7, later): public sign-up to the test environment, still with **no real money**.
4. **Live pilot** (M8): real money, low limits, only after legal, payment and security approvals.

### Safety rules for testers

- The test environment is labelled "Test environment — no real money" on every page (a banner already exists in M1 when `NEXT_PUBLIC_ENVIRONMENT` is not `production`).
- Testers use synthetic identities and the provided sample invoices. They are never asked to reveal real hardship or upload real documents.
- Payment providers run in test mode only.
- Participation is voluntary, with a short plain-language consent page and a way to leave and delete data.

### AI evaluator programme (optional, M7)

- Up to 1,000 simulated personas across the ten departments in the brief, each with a written profile and scoring criteria.
- They run scripted journeys against the test environment using Playwright and report findings.
- **Their results are always labelled "AI-generated evaluation" and are never counted or presented as human testers or customers.**
- Their findings feed the same bug tracker as human findings, tagged by source.

### Feedback loop

Weekly triage of findings by severity; critical issues (security, money, privacy, broken core journey) block the next phase.
