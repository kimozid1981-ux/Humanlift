# HumanLift

**Real people. Verified needs. Meaningful help.** (working name — trademark not yet checked)

HumanLift will connect people facing an essential bill with people who want to help, with every request verified before anyone contributes.

> **Status (2026-11-05): early development.** No real money, no real requests, no country open. See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).

## Repository

| Path | What it is |
|---|---|
| `apps/web` | Public website + applicant/donor web app (Next.js, English and French) |
| `apps/admin` | Staff administration dashboard (Next.js) |
| `apps/mobile` | Android and iPhone app (Flutter, English and French). See [apps/mobile/README.md](apps/mobile/README.md) |
| `services/api` | Backend API (NestJS), database schema and migrations (Prisma, PostgreSQL) |
| `docs/` | Audit and plan, project records, guides |
| `.github/workflows` | Continuous integration |

## Start here

- Run it locally: [docs/guides/local-development.md](docs/guides/local-development.md)
- Audit and execution plan: [docs/audit/README.md](docs/audit/README.md)
- What is built and tested: [docs/milestones/milestone-1-report.md](docs/milestones/milestone-1-report.md), [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md)
- Decisions needed from the founder: [docs/FOUNDER_ACTIONS.md](docs/FOUNDER_ACTIONS.md)

## Ground rules

No fake verification, payments, users or statistics. No production deployment, app-store submission, paid service or real-money processing without explicit founder approval. Never commit secrets.
