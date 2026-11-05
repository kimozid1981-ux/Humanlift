# D. Security architecture

Status key: **Built (M1)** means implemented in this pull request and covered by tests listed in the milestone report. **Planned** means designed, not built.

## Accounts and sessions

| Control | Status | Detail |
|---|---|---|
| Password hashing with Argon2id | Built (M1) | Passwords are never stored or logged. |
| Password rules | Built (M1) | Minimum 12 characters; maximum 128. Checking against breached-password lists is planned (M6). |
| Session cookies | Built (M1) | Random 256-bit token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production). Only a SHA-256 hash is stored in the database, so a database leak does not leak live sessions. |
| Session expiry and sign-out | Built (M1) | 7 days for members, 8 hours for staff; sign-out revokes the session server-side. |
| Login rate limiting | Built (M1) | Per-IP limits on login, registration, password reset and public forms. |
| No account enumeration | Built (M1) | Login and password-reset answers are the same whether or not an email exists. |
| Staff multi-factor authentication | Built (M1) | Staff roles cannot use any admin endpoint until a TOTP code is verified for that session. The TOTP secret is encrypted with AES-256-GCM using a key from the environment. |
| Passkeys / Face ID | Planned (M5–M6) | |
| Bot protection (CAPTCHA alternative) | Planned (M6) | A privacy-friendly challenge on registration and public forms. A hidden "honeypot" field is already on public forms (M1). |

## Authorisation

- Role-based access control is enforced **in the API**, never only in the screen. Every admin endpoint declares the roles it accepts. (Built, M1)
- Least privilege: a verification specialist cannot change roles or countries; only a super administrator can change roles; nobody can change their own roles. (Built, M1)
- Access to identity documents will be limited to verification specialists working on an assigned case, through signed URLs that expire in minutes, and every view is logged. (Planned, M2)

## Audit logging

- Built (M1): every login, failed login, MFA enrolment, role change, country change, data request decision and abuse report decision writes an `AuditLog` row.
- The table is protected by a database trigger that rejects UPDATE and DELETE. Tested in M1.
- Planned (M6): ship audit logs to separate write-once storage.

## Data protection

- Encryption in transit: HTTPS everywhere in staging/production (hosting decision pending). Security headers (HSTS, frame denial, no-sniff, referrer policy) are set by the API and web apps. (Built, M1)
- Encryption at rest: managed database and storage encryption from the hosting provider (planned, depends on hosting choice); field-level encryption for MFA secrets (built) and later for sensitive identifiers.
- Secrets: only from environment variables. `.env` files are git-ignored. An example file with **no real values** is provided.
- Uploads (M2): size and type allow-list, magic-byte checking, malware scanning before any human or AI sees a file, stored outside the web root.
- Sensitive applicant documents are never used to train AI models and never sent to public AI tools.

## Operations (planned, Milestones 4–6)

- Dependency and vulnerability scanning in CI (dependency audit is in the M1 CI file).
- Daily encrypted backups with **tested** restores (a release cannot ship without a restore test, as the brief's quality gate requires).
- Monitoring and alerting, incident response plan, breach notification procedure (GDPR Article 33 requires notification to the supervisory authority within 72 hours where applicable).
- Independent penetration test before any real money moves.
