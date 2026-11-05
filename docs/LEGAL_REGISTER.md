# Legal register

> Research leads, not legal advice. **No item here is a legal approval.** Confidence: H (official source read), M (official source, applicability unclear), L (secondary source or memory, must be verified).

| # | Jurisdiction | Topic | Source (checked 2026-11-05) | Finding | Confidence | Open questions | Professional review |
|---|---|---|---|---|---|---|---|
| L1 | France | Status of donation platforms | AMF leaflet *Financement participatif* (2024) — https://www.amf-france.org/sites/institutionnel/files/private/2024-07/depliant_finance_participative_2024.pdf | Since 1 March 2017 a donation platform must operate as an IFP registered with ORIAS; ORIAS number shown in legal notices | H (source read) | Does HumanLift's model (pay creditor on behalf of individual) fit IFP-dons? Insurance amount? | French financial-regulation lawyer |
| L2 | EU / France | Payment services | Not yet researched from official text | Collecting and forwarding funds is likely a regulated payment service unless done by/through a licensed provider | L | Agent of a PSP vs staying out of the flow of funds; PSD2 successor status | Lawyer |
| L3 | Provider policy | Stripe restricted businesses | https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs | Lists "bill pay or crowdfunding services" as not supported without approval; crowdfunding platforms need Stripe approval | H (provider policy, not law) | Will Stripe approve this model? | Stripe, in writing |
| L4 | Luxembourg / EU | Mangopay status | https://mangopay.com/legal-notice | E-money institution supervised by CSSF | H | Acceptance of HumanLift's flow; passporting to target countries | Mangopay, in writing |
| L5 | EU | GDPR special-category data (health) | Not yet re-read from EUR-Lex | Health-related requests likely Art. 9 data; DPIA likely | M | Lawful basis; whether to offer the category at all | DPO / privacy lawyer |
| L6 | EU | European Accessibility Act | Not yet re-read from official source | Applies from 28 June 2025 to certain services | M | Is HumanLift in scope? | Lawyer |
| L7 | All | Tax treatment of gifts to individuals | Not researched | Likely no donor tax relief unlike registered charities | L | Per-country rules; recipient reporting | Tax adviser |
| L8 | All | Digital Services Act duties | Not researched | Hosting user content may bring notice-and-action duties | L | Size thresholds | Lawyer |

Countries in scope of the consolidated brief (FR, BE, DE, ES, PT, NL, LU, UK, US, CA) are all `NOT_RESEARCHED` in the system except France (`RESEARCH_IN_PROGRESS`). The approval checklist is enforced in code: a country cannot reach `APPROVED_FOR_BETA`/`APPROVED_FOR_LAUNCH` without named legal and payment sign-off and document references.
