# I. Implementation roadmap and J. Estimated costs

## I. Roadmap

Durations assume one experienced full-stack engineer working with AI assistance, plus part-time design and legal help. They are planning estimates, not promises. Legal and provider approvals often take longer than code.

| Milestone | Content | Engineering estimate | Runs in parallel (non-code) |
|---|---|---|---|
| 0. Audit | This document | Done | |
| 1. Foundation | Website, auth, profiles, roles, web app shell, database, basic admin, EN/FR | In this pull request | Brand-name and trademark check; choose hosting |
| 2. Verification | Identity adapter (sandbox), address and invoice upload, malware scan, OCR, manual review queue, verification statuses | 4–6 weeks | Provider comparison and contracts |
| 3. Requests | Request creation, approval workflow, public request pages, search and filters, funding progress (no real money) | 3–5 weeks | French legal review starts |
| 4. Payments (sandbox) | Payment adapter, contributions, partial funding, refunds, double-entry ledger, reconciliation, creditor-payment workflow | 5–8 weeks | Payment provider application |
| 5. Mobile | Flutter apps for Android and iOS: login, document capture, requests, donations, push notifications | 6–10 weeks | Apple and Google developer accounts |
| 6. Security and legal readiness | Pen test, DPIA, retention jobs, incident response, accessibility audit, backup restore tests | 3–5 weeks | Legal sign-off, insurance |
| 7. Public beta (no real money) | Test environment, recruited testers, AI evaluator programme, fixes | 6–8 weeks | Tester recruitment |
| 8. First-country pilot | Real money with low limits, in one country, after approvals | Variable | Registration (e.g. ORIAS), provider go-live |
| 9. Expansion | One country at a time | Per country | Per-country legal file |

**Rough total to a controlled real-money pilot:** about 8 to 12 months, assuming legal and provider approvals do not block.

## J. Estimated costs

All figures are **estimates for planning**, in euros, excluding VAT. Provider prices marked with a source were read on 5 November 2026; everything else must be replaced by real quotes.

### Per-transaction and per-user costs (from published prices)

| Item | Cost | Source |
|---|---|---|
| Card payment, standard EEA card | 1.5% + €0.25 | [stripe.com/fr/pricing](https://stripe.com/fr/pricing) |
| Identity verification (Stripe Identity) | €1.25 per successful verification | [stripe.com/fr/pricing](https://stripe.com/fr/pricing) |

Example: a €20 donation by card costs about €0.55 in card fees (2.75%). On a €240 bill funded by twelve €20 donations, card fees are about €6.60. Verifying one applicant's identity costs about €1.25.

### Monthly operating costs (estimates, beta scale)

| Item | Low | High | Notes |
|---|---|---|---|
| Hosting (API, web, database, storage, backups) | €50 | €400 | EU region; managed PostgreSQL |
| Email delivery | €0 | €50 | Many providers have free tiers at low volume |
| Error monitoring and uptime | €0 | €80 | |
| Domain, certificates | ~€2 | ~€5 | Certificates are typically free |
| Apple developer account | ~€8/month equivalent | | Apple charges an annual fee (to confirm current price) |
| Google Play developer account | one-off fee | | To confirm current price |

### One-off and professional costs (wide ranges, to be quoted)

| Item | Range | Notes |
|---|---|---|
| Legal: French financial regulation, IFP, payment flow, terms, privacy policy | €8,000 – €40,000 | Depends heavily on structure chosen |
| DPIA / data protection advice | €2,000 – €10,000 | |
| Penetration test before real money | €5,000 – €20,000 | |
| Accessibility audit | €2,000 – €8,000 | |
| Trademark search and filing (EU) | €1,000 – €3,000 | Official EUIPO fees plus attorney (to confirm) |
| Professional liability insurance | to quote | Likely required for IFP status (to confirm) |

### Development cost

- With a freelance or in-house senior engineer in France, a typical daily rate is roughly €450–€750 (market estimate, unverified). 8–12 months of engineering would be roughly €80,000–€170,000.
- AI-assisted development (as in this project) can reduce this, but human review of security, payment and legal-sensitive code remains essential.

### Break-even (structure only, numbers needed from the founder)

The brief's revenue options (voluntary platform tips, sponsorships, grants, institutional subscriptions) all need a decision. A financial model spreadsheet will be prepared once the founder chooses which to pursue and gives a budget range. **Founder input needed.**
