# Project master plan

**Last updated:** 2026-11-05. Detailed analysis lives in [audit/](audit/README.md) (items A–O of the first brief). This file maps both founder briefs onto one sequence.

## Mapping between the two briefs

| Milestone (brief 1) | Phases (consolidated brief) | Status on 2026-11-05 |
|---|---|---|
| M0 Audit | Phase 0, 1 | Done — `docs/audit/` |
| M1 Foundation | Phases 2, 3, 4, part of 10 and 13 | Built, in review |
| M2 Verification | Phases 5, 6 | Not started |
| M3 Requests | Phases 7, 8 | Not started |
| M4 Payments | Phase 9 | Not started (sandbox only when started) |
| M5 Mobile | Phase 11 | Blocked: Flutter not installed here; iOS needs macOS + Xcode |
| — | Phase 12 AI assistance | After M2 (needs documents) |
| M6 Security & legal | Phases 14, 17, 18 | Not started |
| M7 Beta | Phases 15, 16 | Not started |
| M8 First country | Phases 18, 19 | Not started; needs founder approvals |
| M9 Expansion | Phases 20, 21 | Not started |

## Prioritised gap analysis

1. **Funds-flow legality and provider acceptance** — highest risk, outside code. Founder + counsel.
2. **Verification and document security** (M2) — the core trust feature; needs object storage and a scanner.
3. **Request lifecycle with server-enforced states** (M3). Consolidated brief: requests are never published by default; explicit applicant consent to visibility.
4. **Ledger and sandbox payments** (M4).
5. **Hosting, staging, backups, monitoring** — needed before any external tester sees the product.
6. **Mobile** (M5).

## Milestone 2 acceptance criteria (draft)

- Upload accepts only PDF/JPEG/PNG/HEIC up to 10 MB, checked by content, not extension; rejected files return a clear error.
- Every file is malware-scanned before anyone can open it; scanner unavailable ⇒ file stays quarantined.
- Files live in private storage; staff access only through signed URLs that expire in ≤ 5 minutes, every access audited.
- Identity, address, phone, invoice, payment-destination checks each have their own status (NOT_STARTED … RESTRICTED).
- Identity provider runs in test mode only, behind an adapter; no result is ever invented.
- Specialist queue: request more information, approve, reject with reason code; applicant sees plain-language next step and can appeal.
- Tests cover success, failure, expired, duplicate and malicious upload cases.
