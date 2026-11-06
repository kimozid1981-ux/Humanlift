# Security register

**Last updated:** 2026-11-05. Design: [audit/03-security.md](audit/03-security.md).

## Controls in place (VERIFIED by tests listed in TEST_RESULTS.md)

Argon2id password hashing · hashed session tokens · HttpOnly/SameSite cookies (Secure in staging/production) · server-side session revocation · staff MFA (TOTP, encrypted secret) · deny-by-default staff role checks · no self role changes · per-IP rate limits on sensitive endpoints · no account enumeration on login/reset · append-only audit log (DB trigger) · zod input validation · Helmet security headers · no CORS · honeypot on public forms · sandbox mailer refuses to run in staging/production · dependency audit clean.

## Open risks

| ID | Risk | Severity | Status / plan |
|---|---|---|---|
| S1 | No CAPTCHA/bot challenge beyond honeypot and rate limits | Medium | Add privacy-friendly challenge before public beta |
| S2 | Per-IP rate limits only; no per-account lockout | Medium | Add progressive delays per account (M6) |
| S3 | No breached-password check | Low | Add k-anonymity check (M6) |
| S4 | Rate-limit counters are in memory; reset on restart, not shared across instances | Medium | Move to Redis when deployed with >1 instance |
| S5 | `trust proxy` defaults to loopback; wrong setting behind a cloud load balancer breaks IP-based limits | Medium | Set `TRUST_PROXY` per environment at deployment |
| S6 | No Content-Security-Policy yet on web apps | Medium | Add nonce-based CSP (M6) |
| S7 | Admin dashboard has no IP allow-list | Medium | Restrict at hosting layer once hosted |
| S8 | No CSRF token; relies on SameSite=Lax + JSON-only bodies + same-origin proxy | Low–Medium | Review in pen test; add Origin header check (M6) |
| S9 | No encryption-key rotation procedure for `MFA_ENCRYPTION_KEY` | Medium | Document and implement versioned keys before production |
| S10 | IP addresses stored in sessions and audit log are personal data | Privacy | Define retention (e.g. truncate after N months) in data map |
| S11 | No independent security review | High (pre-launch) | Pen test before real money (founder approval for cost) |

| S12 | Mobile session token can be read on a rooted/jailbroken phone despite Keychain/Keystore | Medium | Consider device-integrity checks (Play Integrity, App Attest) before real money |
| S13 | iPhone: screenshots are not blocked (only the app-switcher preview is covered) | Low–Medium | Review when sensitive screens (documents, addresses) are added |
| S14 | Mobile app has no certificate pinning | Low–Medium | Decide with the hosting choice; pinning adds rotation risk |
| S15 | Request text is free text written by applicants and could contain personal or sensitive details once public | Medium | Staff review before publishing (manual today); form warns not to include address, ID or health details; automated detection later |
| S16 | Requests can be approved before identity, address and bill verification exist (Milestone 2) | High (before any country opens) | Publication is blocked until a country has legal + payment sign-off; do not approve a country before verification is built (F14) |

**A scanner reporting no findings is not a security audit.** Independent expert review is required before production.
