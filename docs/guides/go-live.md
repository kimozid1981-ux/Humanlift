# Putting HumanLift online (early access, no money)

**Last updated:** 2026-11-05. **Status:** the setup in `deploy/` was tested in a sandbox (see TEST_RESULTS.md). It has **not** been run on a real server yet.

This guide puts the website, the admin dashboard and the server for the phone app on one rented server with HTTPS. Clients can create accounts, confirm their email and manage their privacy. **No help requests and no donations exist yet**, and real money must stay off until a lawyer and a payment provider approve the funds flow (FOUNDER_ACTIONS F5, F6).

## Before you announce it: two things that are legally required

1. **Privacy notice and terms reviewed by a lawyer.** The site collects names and email addresses, so GDPR applies from the first sign-up. The current pages are drafts marked "awaiting legal review".
2. **Your legal identity on the site.** French law requires a "mentions légales" page with the publisher's name and address. A company or association is not required for early access, but you need to decide who the publisher is.

You can do the technical steps below first and keep the site private (use `APP_ENV=staging`, which hides it from search engines and shows a test banner) until those are done.

## What you need to create (only you can do this)

| # | What | Requirements | Examples (check the current price on their own site) |
|---|---|---|---|
| 1 | A domain name | Any registrar | OVHcloud, Gandi, Namecheap |
| 2 | A server (VPS) in the EU | Ubuntu 24.04, at least 2 CPUs, 4 GB memory, 40 GB disk | Hetzner, Scaleway, OVHcloud |
| 3 | An email sending service with SMTP | Lets you verify your domain (SPF and DKIM); EU data location preferred | Brevo, Mailjet, Scaleway Transactional Email |

All three are paid or have usage limits. Choosing and paying is your decision (FOUNDER_ACTIONS F7, F8).

## Steps

1. **DNS.** At your domain registrar, create three `A` records pointing to your server's IP address: `@` (the bare domain), `admin` and `api`.
2. **Email.** In your email service, add your domain and copy the DNS records it gives you (SPF, DKIM). Then find its SMTP settings: host, port, username, password.
3. **Install Docker on the server.** Log in to the server and run `curl -fsSL https://get.docker.com | sh`.
4. **Get the code.** `git clone https://github.com/kimozid1981-ux/Humanlift.git && cd Humanlift/deploy`
5. **Settings.** `cp .env.example .env`, then open `.env` and fill in each line. The file explains each one. Keep a copy of `MFA_ENCRYPTION_KEY` and `POSTGRES_PASSWORD` in a password manager.
6. **Start.** `docker compose up -d --build`. The first build takes about 10 minutes. HTTPS certificates are created automatically.
7. **Check.** Open `https://your-domain/en`, create an account, and confirm the email arrives.
8. **Create your admin account.** `docker compose exec api node_modules/.bin/tsx scripts/create-super-admin.ts you@your-domain "Your Name"`. It shows a password once. Then open `https://admin.your-domain` and set up your authenticator app.

## Every day: backups

Run this on the server to make a daily database copy (at 03:00), then copy the `backups` folder somewhere else regularly:

```
mkdir -p ~/backups
(crontab -l 2>/dev/null; echo '0 3 * * * cd ~/Humanlift/deploy && docker compose exec -T db pg_dump -U humanlift humanlift | gzip > ~/backups/humanlift-$(date +\%F).sql.gz') | crontab -
```

A backup is only proven once it has been restored. A restore test is still to do (RELEASE_READINESS: "Backups validated").

## Updating to a new version

`cd ~/Humanlift && git pull && cd deploy && docker compose up -d --build`. Database changes are applied automatically when the server starts.

## The phone app against the live server

Build it with your domain:
`flutter build apk --release --dart-define=API_BASE_URL=https://api.your-domain/v1 --dart-define=APP_ENVIRONMENT=production`.
Putting it in Google Play or the App Store needs the developer accounts (FOUNDER_ACTIONS F11) and your approval for store submission.

## What this setup does not do yet

- No monitoring or alerts if the server goes down.
- No restore test of the backups.
- No independent security review (needed before real money, SECURITY_REGISTER S11).
- Images are large (about 3 GB on disk) because they contain the full build. Making them smaller is a later clean-up.
