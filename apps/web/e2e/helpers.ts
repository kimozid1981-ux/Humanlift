import { APIRequestContext, expect, Page } from '@playwright/test';
import { createHmac, randomUUID } from 'crypto';
import { execFileSync } from 'child_process';
import path from 'path';

export const PASSWORD = 'a long test password for e2e';
export const uniqueEmail = (p = 'e2e') => `${p}.${randomUUID().slice(0, 8)}@example.test`;

/** Reads the newest sandbox email for an address from the development outbox. */
export async function latestEmail(request: APIRequestContext, to: string) {
  const res = await request.get('http://localhost:4000/v1/dev/outbox');
  expect(res.ok()).toBeTruthy();
  const { items } = await res.json();
  const mail = items.find((m: any) => m.to === to);
  expect(mail, `email to ${to}`).toBeTruthy();
  return mail as { subject: string; body: string };
}

export function linkIn(body: string) {
  const m = body.match(/https?:\/\/\S+/);
  if (!m) throw new Error('no link');
  return m[0].replace('http://localhost:3000', '');
}

/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits) — what authenticator apps compute. */
export function totp(base32Secret: string, now = Date.now()) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of base32Secret.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)));
  const h = createHmac('sha1', key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
  return code;
}

/** Creates a super administrator with the real CLI script and returns the one-time password it prints. */
export function createSuperAdmin(email: string) {
  const out = execFileSync('pnpm', ['--filter', '@humanlift/api', 'seed:admin', '--', email, 'E2E Super Admin'], {
    cwd: path.resolve(__dirname, '../../..'),
    encoding: 'utf8',
  });
  const m = out.match(/Password: (\S+)/);
  if (!m) throw new Error(`could not read password from script output`);
  return m[1];
}

export async function registerViaUi(page: Page, email: string, opts: { applicant?: boolean; donor?: boolean; locale?: 'en' | 'fr' } = { donor: true }) {
  await page.goto(`/${opts.locale ?? 'en'}/register`);
  await page.getByLabel(opts.locale === 'fr' ? 'Adresse e-mail' : 'Email address').fill(email);
  await page.getByLabel(opts.locale === 'fr' ? 'Mot de passe' : 'Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel(opts.locale === 'fr' ? 'Nom affiché' : 'Name to display').fill('Test Person');
  if (opts.applicant) await page.locator('input[value="APPLICANT"]').check();
  if (opts.donor) await page.locator('input[value="DONOR"]').check();
  await page.locator('input[name="acceptTerms"]').check();
  await page.getByRole('button', { name: opts.locale === 'fr' ? 'Créer le compte' : 'Create account' }).click();
  await expect(page).toHaveURL(new RegExp(`/${opts.locale ?? 'en'}/account`));
}

/** Creates a super administrator and signs in to the admin dashboard, including authenticator setup. */
export async function signInNewAdmin(page: Page, adminUrl = 'http://localhost:3001') {
  const email = uniqueEmail('admin');
  const password = createSuperAdmin(email);
  await page.goto(`${adminUrl}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Set up your authenticator app' })).toBeVisible();
  const key = (await page.getByTestId('manual-key').textContent())!.trim();
  await page.getByLabel('6-digit code').fill(totp(key));
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
}

/** Confirms a member's email through the link in the sandbox outbox. */
export async function confirmEmail(page: Page, request: APIRequestContext, email: string, locale: 'en' | 'fr' = 'en') {
  const mail = await latestEmail(request, email);
  await page.goto(linkIn(mail.body));
  await page.getByRole('button', { name: locale === 'fr' ? 'Confirmer votre adresse e-mail' : 'Confirm your email' }).click();
}
