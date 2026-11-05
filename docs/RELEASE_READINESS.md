# Release readiness

**Last updated:** 2026-11-05. **Overall: NOT READY for any public release.** This is expected at Milestone 1.

| Gate | Web | Android | iOS | Evidence / note |
|---|---|---|---|---|
| Core journeys working | Partial (accounts only) | Accounts only; automated screen tests pass; not tried on a device | Same as Android; no iPhone build run yet | TEST_RESULTS.md |
| No critical security vulnerabilities | Dependency audit clean | — | — | No pen test yet |
| Payments reconcile | N/A (no payments) | — | — | |
| Sensitive data not public | Verified for what exists | Token in Keystore, no backups, screenshots blocked | Token in Keychain, app-switcher cover | No documents stored yet |
| Country launch approval | None approved | — | — | Enforced in code |
| Legal notices present | Drafts only | — | — | Need lawyer |
| Accessibility | Automated checks pass on 8 pages | — | — | No manual / user testing |
| Backups validated | Not set up | — | — | Needs hosting |
| Monitoring / incident response | Not set up | — | — | |
| Store accounts / signing | — | Not set up (F11) | Not set up (F11) | |
| Founder approval | Not requested | Not requested | Not requested | |
