# M. Risks and mitigation plan

Likelihood and impact are rated High / Medium / Low.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | No payment provider accepts the "pay a creditor on behalf of an individual" model | High | High | Contact Mangopay and Stripe early with the exact flow; design adapters so the provider can change; prepare a fallback via a partner charity; do not build real-money features beyond sandbox until accepted |
| 2 | HumanLift needs a licence or registration it does not have (e.g. IFP in France, payment agent) | High | High | Lawyer review before beta with money; country status stays `LEGAL_REVIEW_REQUIRED` until sign-off; enforced in code |
| 3 | Fraud: fake invoices, identity theft, collusion between applicant and "creditor" | High | High | Separate verification of identity, address, invoice and payee; duplicate-document hashing; pay creditors directly; manual review; transaction limits in the pilot |
| 4 | Data breach exposing identity documents | Medium | Very high | Documents in a separate private store, signed short-lived URLs, staff role limits, audit logs, encryption, pen test, breach response plan |
| 5 | Harm to vulnerable applicants (public shaming, pressure, false hope) | Medium | High | Anonymous display option, no rankings, no countdowns, clear "funding is not guaranteed" wording, human review and appeal routes |
| 6 | Health data handled unlawfully | Medium | High | Keep the healthcare category off until a DPIA is completed |
| 7 | Brand name conflict (trademark, domain, app store) | Unknown | Medium | Trademark search before any branding spend |
| 8 | Cost overrun from building too much too early | Medium | Medium | Milestone gates; nothing built before it is needed; founder approval at each milestone |
| 9 | Donor chargebacks after funds are paid to a creditor | Medium | Medium | Ledger reserve, provider dispute tools, clear donor terms, pay out only after a hold period (to define with provider) |
| 10 | Over-reliance on AI for verification decisions | Medium | High | AI only assists; humans decide; AI output stored with confidence scores; appeals |
| 11 | Single founder / key-person dependency | Medium | High | Documentation in repo, infrastructure as code, no knowledge held only in chat |
| 12 | App store rejection (fundraising rules) | Medium | Medium | Review Apple/Google donation rules in M5; web app works without the stores |
| 13 | Translation errors in legal or safety text | Medium | Medium | Machine translation only for drafts; professional review for legal pages |
| 14 | Software dependencies with vulnerabilities | Medium | Medium | Dependency audit in CI; regular upgrades |
