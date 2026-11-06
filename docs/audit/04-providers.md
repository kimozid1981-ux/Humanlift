# E. Identity and address verification providers and F. Payment providers

**How to read this:** facts marked with a source were checked on the provider's own site on 5 November 2026. Everything else is marked "to confirm" and must be confirmed directly with the provider in writing before signing. Prices change; ask for a written quote.

## E. Identity and address verification

### Comparison

| Provider | What was confirmed | Pricing | Strengths for HumanLift | Concerns / to confirm |
|---|---|---|---|---|
| **Stripe Identity** | Supports ID documents from "over 100 countries" ([stripe.com/identity](https://stripe.com/identity)) | **€1.25 per successful verification** and €0.40 per lookup on the French price list ([stripe.com/fr/pricing](https://stripe.com/fr/pricing)); US list shows $1.50 ([stripe.com/pricing](https://stripe.com/pricing)) | Simple API, pay-as-you-go, no minimum, combines well if Stripe is also the payment provider | Does not do proof-of-address checks out of the box (to confirm). Coverage list per country to confirm. |
| **Veriff** | Not checked first-hand in this audit | Quote-based (to confirm) | Strong document coverage and liveness, EU-based (Estonia) — to confirm | Pricing and minimum commitment |
| **Sumsub** | Not checked first-hand | Quote-based (to confirm) | Offers identity, proof of address and AML screening in one product (to confirm) | Data residency options; minimum commitment |
| **Persona** | Not checked first-hand | Quote-based (to confirm) | Very configurable workflows | Mostly US-focused team; EU data residency to confirm |
| **Onfido (Entrust)** | Not checked first-hand | Quote-based (to confirm) | Long track record in the UK/EU | Product changes after the Entrust acquisition; to confirm roadmap |

### Recommendation

1. **Build against an adapter interface** (`IdentityProvider`), so the choice can change without rewriting the product.
2. **Sandbox first with Stripe Identity** in Milestone 2: it has a free test mode, public prices, and no sales call is needed. This is a development choice, not a final vendor decision.
3. **Before launch, run a written comparison of Stripe Identity, Sumsub and Veriff** on: country coverage for the first country, proof-of-address support, liveness quality, EU data residency, data retention controls, accessibility of the capture flow, price at 1,000 and 10,000 checks per month.

### Address verification

No provider was confirmed to cover every country's address documents. Plan:

- Applicant uploads a recent document (utility bill, rent receipt, official letter). The rules per country (which documents, how recent) live in the `Country` configuration.
- OCR extracts name, address and document date; the system checks the date window and compares the name with the verified identity.
- Ambiguous results go to manual review. Address verification is a **separate** status from identity, as the brief requires.
- Sumsub's proof-of-address product is worth evaluating to reduce manual work (to confirm).

## F. Payment providers

### The key finding first

Stripe's support page states that Stripe "can't support many financial services businesses, including … peer-to-peer money transmission, **bill pay or crowdfunding services** …", and that crowdfunding platforms must be explicitly **approved by Stripe** to use Stripe Connect ([Stripe FAQ, read 5 Nov 2026](https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs)). HumanLift is close to both "bill pay" and "crowdfunding". **No provider can be assumed to accept HumanLift.** Applications to providers should start early, in parallel with legal work.

### Comparison

| Provider | What was confirmed | Fit for HumanLift | Concerns / to confirm |
|---|---|---|---|
| **Stripe Connect** | Crowdfunding platforms need Stripe approval; "bill pay" listed as restricted (source above). Connect is included at no extra charge on standard pricing; EEA standard cards **1.5% + €0.25** on the French price list ([stripe.com/fr/pricing](https://stripe.com/fr/pricing)) | Excellent developer tools and test mode; good for building the sandbox | Approval for the HumanLift model is uncertain. Paying third-party creditors is the sensitive part. |
| **Mangopay** | Licensed **electronic money institution supervised by the CSSF, Luxembourg** ([mangopay.com/legal-notice](https://mangopay.com/legal-notice)). Wallet-based infrastructure for platforms. | Wallet model fits "hold contributions per request, then pay the creditor". Historically linked to the French donation pot service Leetchi (press coverage, to confirm current relationship). | Pricing is quote-based (to confirm). Must confirm it accepts payments to third-party creditors for individuals' bills. |
| **Adyen for Platforms** | Not checked first-hand | Enterprise-grade, strong in Europe | Typically targets larger volumes; minimums to confirm |
| **PayPal** | Not checked first-hand | Familiar to donors | Account holds and dispute handling for donations to individuals to confirm |

### Recommended payment model (to validate with counsel)

1. **Contributions go to a licensed provider, never to a HumanLift bank account.** HumanLift does not hold money itself.
2. **Pay the verified creditor directly** (for example, the electricity supplier) when the creditor can be paid by bank transfer with the applicant's customer reference.
3. **Fallback models** for creditors that cannot be paid directly, to be assessed by counsel:
   - a partner registered charity or endowment fund that receives donations and pays the bill, or
   - payout to the applicant only after extra checks, with proof of payment afterwards.
4. **Development uses a clearly labelled sandbox adapter** with no real money (Milestone 4).

### Next step for the founder

Open a conversation with **Mangopay** and **Stripe** (sales or platform team) describing the exact flow: donors → per-request pot → payment to verified creditor. Ask each in writing whether they will support it, in which countries, and at what price. Do this in parallel with Milestones 2 and 3.
