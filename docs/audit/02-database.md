# C. Database design

PostgreSQL, managed through Prisma migrations in `services/api/prisma/`. Tables marked **(M1)** exist in this pull request. The others are the planned design and will be built in their milestone.

## Identity and access

| Table | Purpose | Key columns |
|---|---|---|
| `User` **(M1)** | One row per account | `email` (unique, lower-case), `passwordHash` (Argon2id, never the password), `displayName`, `locale`, `countryCode`, `status` (ACTIVE, SUSPENDED, PENDING_DELETION), `emailVerifiedAt`, `mfaSecretEnc` (encrypted, staff only) |
| `UserRole` **(M1)** | Roles per user (a user can be both applicant and donor) | `userId`, `role` ∈ APPLICANT, DONOR, VERIFICATION_SPECIALIST, COMPLIANCE_SPECIALIST, ADMINISTRATOR, SUPER_ADMINISTRATOR |
| `Session` **(M1)** | Signed-in sessions | `tokenHash` (SHA-256 of a random token; the token itself is only in the user's cookie), `expiresAt`, `mfaVerifiedAt`, `revokedAt` |
| `OneTimeToken` **(M1)** | Email verification and password reset | `tokenHash`, `purpose`, `expiresAt`, `usedAt` |

## Governance

| Table | Purpose |
|---|---|
| `AuditLog` **(M1)** | Who did what, when, to what. A database trigger **blocks UPDATE and DELETE**, so entries cannot be altered even by the application. |
| `DataRequest` **(M1)** | GDPR-style access, correction and deletion requests, with status and handler |
| `ContactMessage` **(M1)** | Contact form submissions |
| `AbuseReport` **(M1)** | Reports of suspicious requests or behaviour |
| `Country` **(M1)** | Jurisdiction configuration: availability status, languages, currencies, review dates, compliance owner. Every country starts as `NOT_RESEARCHED`, and real-money activation is impossible without a recorded legal and payment sign-off. |
| `DevOutboxEmail` **(M1, development only)** | Sandbox email outbox. Disabled in production. |

## Planned: verification (Milestone 2)

- `VerificationCheck` — `userId`, `kind` (IDENTITY, ADDRESS, PHONE, INVOICE, PAYMENT_DESTINATION), `status` (NOT_STARTED … RESTRICTED from the brief), `provider`, `providerReference`, `decidedBy`, `reason`, `expiresAt`. One row per kind, so identity never implies address.
- `Document` — `ownerId`, `purpose`, `storageKey` (private bucket), `sha256` (duplicate detection), `scanStatus`, `retentionUntil`. Never public.
- `DocumentExtraction` — OCR output (amount, currency, creditor, dates, reference) with confidence scores and a human-corrected version.

## Planned: requests (Milestone 3)

- `AssistanceRequest` — `applicantId`, `category`, `countryCode`, `currency`, `amountRequestedMinor` (integer cents, never floating point), `deadline`, `status` (DRAFT … CANCELLED from the brief), `publicDisplayName` or anonymous flag.
- `RequestStatusChange` — every status transition with actor and reason (auditable, append-only).
- `Creditor` — verified payee details (supplier name, payment reference), kept private.

## Planned: money (Milestone 4)

- `LedgerAccount` — e.g. donor clearing, request escrow (held by the licensed provider, mirrored here), creditor payable, platform fees, refunds.
- `LedgerEntry` — double-entry lines; each `JournalTransaction` must have debits = credits, enforced by a database constraint. Append-only; corrections are reversing entries.
- `Contribution`, `Payout`, `Refund`, `Chargeback` — each with `providerReference`, `idempotencyKey` (unique), state, and reconciliation status.
- Amounts are stored as integers in the currency's minor unit, together with the ISO 4217 currency code. Exchange-rate conversions are stored with rate, source and timestamp and are always shown as estimates.

## Rules that apply everywhere

- Primary keys are random UUIDs, so IDs do not reveal how many users exist.
- Timestamps are stored in UTC.
- Personal data columns are listed in the privacy data map (Milestone 6) with their retention period.
