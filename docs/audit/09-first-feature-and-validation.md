# N. First working feature and O. Founder validation guide

## N. The first working feature

**Secure accounts with roles**: a person can register as an applicant, a donor, or both; confirm their email; sign in; edit their profile; choose English or French; request a copy or deletion of their data; and sign out. Staff can sign in to a separate admin dashboard only with a second factor (authenticator app), and every sensitive action they take is recorded in a tamper-resistant log.

Why this first: every later feature (verification, requests, payments) depends on knowing exactly who a user is and what they are allowed to do. Getting identity, roles and audit logging right first means later features inherit them.

## O. Founder validation guide

For each milestone, these are steps you can follow yourself, with no coding knowledge. When a step needs a terminal command, it is given exactly.

### Milestone 1 — Functional foundation

Setup (one time, about 20 minutes): follow [../guides/local-development.md](../guides/local-development.md). If you prefer not to install anything, ask for a hosted preview environment instead (needs a hosting decision).

Then check:

1. Open `http://localhost:3000`. You should see the HumanLift homepage with a yellow "Test environment — no real money" banner.
2. Click **Français** in the header. The page should switch to French. Click **English** to switch back.
3. Visit every link in the footer. Each page should open (no "page not found"). Legal pages should clearly say they are drafts awaiting legal review.
4. Click **Create account**. Register as a donor with a made-up email such as `test.donor@example.com` and a 12+ character password.
5. Open `http://localhost:3000/en/dev/outbox` (development only). You should see a "Confirm your email" message. Click its link. Your account should show as confirmed.
6. Go to **My account → Profile**, change your display name, save, refresh the page. The new name should still be there.
7. In **My account → Privacy**, click **Request a copy of my data**. You should see the request listed as "Received".
8. Sign out, then try signing in with a wrong password. You should see a generic error that does not say whether the email exists.
9. Fill in the **Contact** form and the **Report abuse** form. Each should show a confirmation.
10. Admin: run `pnpm --filter @humanlift/api seed:admin` as described in the guide. It prints a one-time setup. Open `http://localhost:3001`, sign in, scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…), enter the 6-digit code.
11. In the admin dashboard, open **Messages**: your contact message and abuse report should be there. Open **Data requests**: your data request should be there. Open **Audit log**: your sign-ins and actions should be listed.
12. Open **Countries**. Try to set France to `APPROVED_FOR_BETA` without filling in the sign-off fields: it should be refused.

What to send back: which steps passed, which failed, and screenshots of any failure.

### Milestone 2 — Verification (sandbox)

1. As an applicant, start identity verification; the provider's test page should open and clearly say "test mode".
2. Use the provider's test document that is meant to fail; your status should show "Failed" with a clear next step.
3. Upload the sample electricity bill from `docs/samples/`; check the extracted amount, date and supplier, correct one value, and submit.
4. As a verification specialist in admin, open the review queue, request additional information, then approve. Check that each step appears in the audit log.
5. Check that a donor account cannot see any document.

### Milestone 3 — Requests

1. Create a request from a verified bill; submit it; approve it in admin; publish it.
2. As a signed-out visitor, find it with filters (country, category). Check that no address, document or real name is visible when "anonymous" is chosen.
3. Edit after publishing should be blocked or re-reviewed.

### Milestone 4 — Payments (sandbox)

1. As a donor, contribute a partial amount with the provider's test card. Progress should update.
2. Use the test card that is declined: a clear error, no money recorded.
3. Complete the funding with a second donor; trigger the creditor payment in sandbox; request a refund on one contribution.
4. Download the reconciliation report: totals in the ledger should equal totals in the provider's test dashboard.

### Milestone 5 — Mobile

1. Install the test builds (Android via a link, iPhone via TestFlight).
2. Repeat the Milestone 1, 3 and 4 journeys on the phone, including photographing a sample bill.
3. Turn on large text and the screen reader (TalkBack / VoiceOver) and try registering.

### Milestones 6 to 9

These are approval milestones. You will receive a checklist (security report, DPIA, lawyer sign-off, provider acceptance letters, restore-test result) and sign each item. No country goes live without these in the system.
