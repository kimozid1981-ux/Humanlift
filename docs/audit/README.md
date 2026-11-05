# HumanLift — Project Audit and Execution Plan (Milestone 0)

**Date of audit:** 5 November 2026
**Status:** Draft for founder review. Nothing in this document is legal advice. Every legal or regulatory point is a research lead that needs confirmation by a qualified professional before it is relied on.

## How to read this

The brief (section 26) asks for fifteen items, A to O. They are split into short files so each one can be reviewed and changed on its own.

| Item | Topic | File |
|---|---|---|
| A | Product architecture | [01-architecture.md](01-architecture.md) |
| B | Technology stack and justification | [01-architecture.md](01-architecture.md#b-technology-stack) |
| C | Database design | [02-database.md](02-database.md) |
| D | Security architecture | [03-security.md](03-security.md) |
| E | Identity and address verification providers | [04-providers.md](04-providers.md#e-identity-and-address-verification) |
| F | Payment providers | [04-providers.md](04-providers.md#f-payment-providers) |
| G | International legal research strategy | [05-legal-and-first-country.md](05-legal-and-first-country.md) |
| H | First-country recommendation | [05-legal-and-first-country.md](05-legal-and-first-country.md#h-first-country-recommendation) |
| I | Implementation roadmap | [06-roadmap-and-costs.md](06-roadmap-and-costs.md) |
| J | Development and operating costs | [06-roadmap-and-costs.md](06-roadmap-and-costs.md#j-estimated-costs) |
| K | Testing strategy | [07-testing-and-beta.md](07-testing-and-beta.md) |
| L | Public beta strategy | [07-testing-and-beta.md](07-testing-and-beta.md#l-public-beta-strategy) |
| M | Risks and mitigation | [08-risks.md](08-risks.md) |
| N | First working feature | [09-first-feature-and-validation.md](09-first-feature-and-validation.md) |
| O | Founder validation steps per milestone | [09-first-feature-and-validation.md](09-first-feature-and-validation.md#o-founder-validation-guide) |

## What the audit found (Milestone 0 checklist)

| Check | Finding |
|---|---|
| Existing repository | `kimozid1981-ux/Humanlift` was **completely empty**: no commits, no branches, no files. There was no existing work to preserve or overwrite. A one-line `main` branch was created so pull requests have something to merge into. |
| Development environment | Cloud Linux container with Node.js 22, pnpm 10, PostgreSQL 16, Python 3.13, Docker and a Chromium browser for automated tests. **Flutter is not installed**, so mobile work (Milestone 5) needs a Flutter toolchain, plus a Mac with Xcode for iOS builds. |
| Credentials and integrations | **None found.** No payment, identity, email, SMS, cloud or AI provider keys exist in the repository or environment. That is expected and correct at this stage. Every integration in Milestone 1 is therefore a clearly labelled sandbox (for example, emails are written to a development outbox instead of being sent). |
| Existing working features | None before this work. |
| Missing infrastructure | Hosting account, domain name, transactional email provider, error monitoring, backups, staging environment, payment and identity provider contracts. |
| Budget constraints | Not stated in the brief. The cost section gives ranges so you can choose. **Founder input needed.** |
| Company structure | Not stated. The legal section shows this is one of the biggest open questions, because the legal status of the company decides which payment model is allowed. **Founder input needed.** |

## The five most important findings

1. **The money flow is the hardest problem, not the software.** Stripe's own policy lists "bill pay or crowdfunding services" among businesses it cannot support without explicit approval ([Stripe FAQ](https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs), read 5 Nov 2026). Paying a donor's money to a third-party creditor is likely to be treated as a regulated payment service in the EU. HumanLift must work through a licensed payment partner or a regulated structure. This is decided with a lawyer, not in code.
2. **In France, a donation platform has a defined legal status.** The French markets regulator (AMF) states that since 1 March 2017 a donation platform must operate as an *intermédiaire en financement participatif* (IFP) registered with ORIAS ([AMF leaflet, 2024](https://www.amf-france.org/sites/institutionnel/files/private/2024-07/depliant_finance_participative_2024.pdf)). That gives a clear, known path, which is part of why France is the provisional first-country candidate.
3. **Health-related requests carry special-category data under GDPR.** The "essential healthcare" category should stay switched off until a data protection impact assessment is done.
4. **No single "trust score".** The design keeps separate indicators (identity, address, invoice, payment destination), as the brief requires.
5. **The brand name is unverified.** Trademark, domain and app-store checks for "HumanLift" have not been done. Do this before spending on branding.

## What has been built so far

Milestone 1 (functional foundation) is in this pull request. See [../milestones/milestone-1-report.md](../milestones/milestone-1-report.md) for what works, what was tested and what remains.
