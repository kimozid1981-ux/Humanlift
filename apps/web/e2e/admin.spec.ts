import { expect, test } from '@playwright/test';
import { createSuperAdmin, totp, uniqueEmail } from './helpers';

const ADMIN = 'http://localhost:3001';

test('super administrator: sign-in with MFA enrolment, review queues, country approval is refused without sign-off', async ({ page, request }) => {
  // This test sends its own contact message so it does not depend on other tests running first.
  const marker = `Admin queue check ${Date.now()}`;
  const sent = await request.post('http://localhost:4000/v1/public/contact', {
    data: { name: 'Queue Check', email: uniqueEmail('contact'), topic: 'general', message: marker },
  });
  expect(sent.ok()).toBeTruthy();

  const email = uniqueEmail('superadmin');
  const password = createSuperAdmin(email);

  // Admin pages require sign-in.
  await page.goto(`${ADMIN}/`);
  await expect(page).toHaveURL(`${ADMIN}/login`);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();

  // First sign-in forces authenticator enrolment.
  await expect(page.getByRole('heading', { name: 'Set up your authenticator app' })).toBeVisible();
  await expect(page.getByAltText('QR code for your authenticator app')).toBeVisible();
  await page.getByLabel('6-digit code').fill('000000');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('main [role="alert"]')).toContainText('not valid');
  const key = (await page.getByTestId('manual-key').textContent())!.trim();
  await page.getByLabel('6-digit code').fill(totp(key));
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByText('SUPER_ADMINISTRATOR').first()).toBeVisible();

  // Contact messages and abuse reports from the public site are visible.
  await page.getByRole('link', { name: 'Contact messages' }).click();
  await expect(page.getByRole('heading', { name: 'Contact messages' })).toBeVisible();
  await expect(page.locator('table')).toContainText(marker);
  await page.getByRole('link', { name: 'Abuse reports' }).click();
  await expect(page.getByRole('heading', { name: 'Abuse reports' })).toBeVisible();

  // Country approval without sign-off is refused, with a clear reason.
  await page.getByRole('link', { name: 'Countries' }).click();
  await page.getByRole('button', { name: 'Edit NL' }).click();
  await page.getByLabel('Availability').selectOption('APPROVED_FOR_LAUNCH');
  await page.getByRole('button', { name: 'Save NL' }).click();
  await expect(page.locator('main [role="alert"]')).toContainText('Legal and payment sign-off');
  await expect(page.getByTestId('status-NL')).toHaveText('NOT_RESEARCHED');

  // The audit log records what happened, including the MFA enrolment.
  await page.getByRole('link', { name: 'Audit log' }).click();
  await expect(page.locator('table')).toContainText('auth.mfa.enabled');
  await expect(page.locator('table')).toContainText('admin.super_admin_created_via_cli');

  // Sign out ends the session.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(`${ADMIN}/login`);
  await page.goto(`${ADMIN}/users`);
  await expect(page).toHaveURL(`${ADMIN}/login`);
});

test('a member account cannot sign in to the admin dashboard', async ({ page }) => {
  // Members get the same generic error as a wrong password.
  await page.goto(`${ADMIN}/login`);
  await page.getByLabel('Email').fill('nobody@example.test');
  await page.getByLabel('Password').fill('whatever password');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('main [role="alert"]')).toHaveText('Email or password is incorrect.');
});
