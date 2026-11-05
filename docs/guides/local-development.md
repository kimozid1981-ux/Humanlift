# Local development guide

This runs HumanLift on your own computer with fake data. Nothing is sent to anyone and no money is involved.

## 1. Install (one time)

- **Node.js 22** — https://nodejs.org (choose the "LTS" installer)
- **pnpm** — after Node is installed, open a terminal and run: `corepack enable`
- **PostgreSQL 16** — https://www.postgresql.org/download/ (or Docker: `docker run -d --name humanlift-db -e POSTGRES_USER=humanlift -e POSTGRES_PASSWORD=humanlift -e POSTGRES_DB=humanlift_dev -p 5432:5432 postgres:16`)

## 2. Get the code and install packages

```bash
git clone https://github.com/kimozid1981-ux/Humanlift.git
cd Humanlift
pnpm install
```

## 3. Configure the API

```bash
cp services/api/.env.example services/api/.env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Open `services/api/.env` and paste the printed value after `MFA_ENCRYPTION_KEY=`. If you did not use the Docker command above, create the database and user `humanlift` / password `humanlift` in PostgreSQL first.

## 4. Create the database tables and country list

```bash
pnpm --filter @humanlift/api db:migrate
pnpm --filter @humanlift/api db:seed
```

## 5. Start everything

```bash
pnpm dev
```

- Website and web app: http://localhost:3000
- Admin dashboard: http://localhost:3001
- API health check: http://localhost:4000/v1/health
- Sandbox email outbox: http://localhost:3000/en/dev/outbox

## 6. Create your super administrator (one time)

```bash
pnpm --filter @humanlift/api seed:admin -- you@example.com "Your Name"
```

It prints a password once. Save it in a password manager. At first sign-in to http://localhost:3001 you will set up an authenticator app.

## 7. Run the tests

```bash
pnpm --filter @humanlift/api test            # API tests (uses database humanlift_test; create it first)
pnpm -r build && pnpm --filter @humanlift/web exec playwright install chromium
pnpm --filter @humanlift/web test:e2e        # browser tests
```

## Environment variables (API)

| Name | Meaning |
|---|---|
| `APP_ENV` | `development`, `test`, `staging` or `production`. The sandbox outbox only works in development/test. |
| `PORT` | API port (default 4000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `WEB_BASE_URL` | Used to build links in emails |
| `MFA_ENCRYPTION_KEY` | 32 random bytes, base64. Encrypts staff MFA secrets. Never commit it. |
| `AUTH_RATE_LIMIT` | Attempts per minute per IP on sign-in, registration, reset and public forms (default 10) |
| `TRUST_PROXY` | Express trust-proxy setting (default `loopback`) |

Web apps: `API_URL` (default `http://localhost:4000`), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENVIRONMENT` (`production` hides the test banner and allows indexing).
