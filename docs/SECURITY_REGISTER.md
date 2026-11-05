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

**A scanner reporting no findings is not a security audit.** Independent expert review is required before production.
