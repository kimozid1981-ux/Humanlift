# G. International legal research strategy and H. First-country recommendation

> **This is not legal advice.** It is a plan for how research should be done and a list of questions for qualified lawyers. HumanLift must not claim to be legally compliant anywhere until a professional has signed off.

## G. Legal research strategy

### The method (applies to every country)

Each legal conclusion is recorded as one entry in a country research file (`docs/compliance/<country>.md`, created when research starts), with:

| Field | Example |
|---|---|
| Jurisdiction | France |
| Topic | Status of donation platforms |
| Official source | AMF leaflet on crowdfunding (URL) |
| Publication / update date | July 2024 (from the file path) |
| Effective date | 1 March 2017 |
| Why it applies to HumanLift | HumanLift lets the public give money to projects/people through a website |
| Uncertainty | Whether paying creditors directly changes the status needed |
| Professional review needed | Yes — financial regulation lawyer |
| Last reviewed | 5 Nov 2026 by (name) |

Rules:
1. Prefer official sources: regulators (AMF, ACPR, CNIL, FCA, ICO…), legislation databases (Légifrance, EUR-Lex, legislation.gov.uk), government sites.
2. Never rely on AI memory for a legal conclusion. AI may help find and summarise sources; a human checks the source.
3. A country can only reach `APPROVED_FOR_BETA` or `APPROVED_FOR_LAUNCH` in the system when the sign-off fields are filled in (who approved, when, which document). This rule is enforced in the Milestone 1 code.

### Research areas per country

| Area | EU / EEA questions |
|---|---|
| Platform status | Is a licence or registration needed to host donation requests? (France: IFP — see below) |
| Payments | Does collecting and forwarding funds count as a payment service under the Payment Services Directive (PSD2, and its replacement once in force — to check status)? Can HumanLift act as agent of a licensed provider, or must it stay outside the flow of funds? |
| AML / CFT | Does HumanLift itself have anti-money-laundering obligations, or only the payment provider? Sanctions screening of donors and applicants. |
| Data protection | GDPR; national rules (France: CNIL guidance). Health-related requests involve special-category data (GDPR Art. 9). DPIA likely required. International transfers to non-EU processors. |
| Platform regulation | Digital Services Act obligations for hosting user content (notice-and-action, reporting). |
| Consumer protection | Fee transparency, terms fairness, withdrawal rights for donors (to check if applicable to donations). |
| Fundraising / charity law | Rules on public appeals for generosity; whether donations to individuals are treated differently from donations to charities. |
| Tax | Tax treatment of donations to individuals (likely no tax relief for donors, unlike donations to eligible organisations — to confirm); whether recipients must declare amounts; VAT on platform fees. |
| Accessibility | European Accessibility Act (applies from 28 June 2025 to certain services — check whether HumanLift's services are in scope). |
| App stores | Apple and Google rules on fundraising and donations inside apps. |

### Other markets (later)

United Kingdom, United States, Canada and Australia each need their own research file. In the US, fundraising rules differ by state, which makes the US a poor early market.

## H. First-country recommendation

### Recommendation: **France, for a closed sandbox beta first** — provisional

This is a recommendation for **where to do the first legal deep-dive and closed test**, not a decision to launch with real money.

### Evidence for France

1. **A defined legal route exists for donation platforms.** The AMF states that since 1 March 2017 a donation platform must operate as an *intermédiaire en financement participatif* (IFP) and be registered with ORIAS, with the ORIAS number shown in the legal notices ([AMF leaflet, 2024](https://www.amf-france.org/sites/institutionnel/files/private/2024-07/depliant_finance_participative_2024.pdf), read 5 Nov 2026). A known route is easier to follow than an unclear one.
2. **Payment and identity providers are available in euros.** Stripe publishes French prices for cards and Identity ([stripe.com/fr/pricing](https://stripe.com/fr/pricing)). Mangopay is an e-money institution regulated in Luxembourg, an EU member state ([mangopay.com/legal-notice](https://mangopay.com/legal-notice)); EU licences can usually be "passported" to France (to confirm for Mangopay specifically).
3. **Language:** French is one of the two Milestone 1 languages.
4. **The brief's own example is in euros** and uses French-style bills, suggesting the founder's network and market knowledge are there (founder to confirm).

### Evidence against, or unknowns

- Paying third-party creditors may require HumanLift to be a payment service agent, or to stay entirely outside the flow of funds. **Unknown until a lawyer reviews it.**
- Market need and competition in France were **not researched** in this audit.
- Belgium (French-speaking, euro) and the UK (English, clearer charity-platform market) are reasonable alternatives to compare.

### What must happen before France can move past `LEGAL_REVIEW_REQUIRED`

1. A French financial-regulation lawyer answers: IFP registration, payment-services status of the creditor-payment flow, AML duties, tax treatment.
2. A data protection review and DPIA (possibly with a DPO).
3. Written acceptance from a payment provider for the exact flow.
4. Company formation and insurance (IFPs need professional liability insurance — to confirm the amount with the lawyer).
