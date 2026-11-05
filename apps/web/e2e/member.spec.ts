import { expect, test } from '@playwright/test';
import { latestEmail, linkIn, PASSWORD, registerViaUi, uniqueEmail } from './helpers';

test('full member journey: register, confirm email, edit profile, add role, privacy request, sign out, sign in', async ({ page, request }) => {
  const email = uniqueEmail('donor');
  await registerViaUi(page, email, { donor: true });

  // Account page shows the new account, unconfirmed.
  await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
  await expect(page.getByText('Please confirm your email address')).toBeVisible();
  await expect(page.getByTestId('roles')).toHaveText('Donor');

  // Confirm via the link in the sandbox email.
  const mail = await latestEmail(request, email);
  expect(mail.subject).toBe('Confirm your email address — HumanLift');
  await page.goto(linkIn(mail.body));
  await page.getByRole('button', { name: 'Confirm your email' }).click();
  await expect(page.getByText('Thank you, your email address is confirmed.')).toBeVisible();
  await page.getByRole('link', { name: 'My account' }).last().click();
  await expect(page.getByText('Email address confirmed')).toBeVisible();

  // Edit profile and check it persists after reload.
  await page.getByLabel('Name to display').fill('Renamed Donor');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name to display')).toHaveValue('Renamed Donor');
  await expect(page.getByText('Hello, Renamed Donor')).toBeVisible();

  // Add the applicant role.
  await page.getByRole('button', { name: 'I also want to request assistance' }).click();
  await expect(page.getByTestId('roles')).toContainText('Applicant');

  // Data access request appears in the list.
  await page.getByRole('button', { name: 'Request a full copy of my data' }).click();
  await expect(page.getByText('Your request has been received.')).toBeVisible();
  await expect(page.getByTestId('data-requests')).toContainText('Copy of my data');
  await expect(page.getByTestId('data-requests')).toContainText('Received');

  // Immediate download works.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download a copy of my data now' }).click();
  expect((await download).suggestedFilename()).toBe('humanlift-my-data.json');

  // Sign out, then wrong password gives a generic error, right password works.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await page.goto('/en/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('not the right password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('main [role="alert"]')).toHaveText('Email or password is incorrect.');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/en\/account/);
});

test('registration shows accessible errors for missing choices and short passwords', async ({ page }) => {
  await page.goto('/en/register');
  await page.getByLabel('Email address').fill(uniqueEmail());
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Name to display').fill('X');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Choose at least one option.')).toBeVisible();
  await expect(page.getByText('You need to accept to continue.')).toBeVisible();
  await page.locator('input[value="APPLICANT"]').check();
  await page.locator('input[name="acceptTerms"]').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Your password must be at least 12 characters.')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true');
});

test('French registration sends a French email and opens the French account page', async ({ page, request }) => {
  const email = uniqueEmail('fr');
  await registerViaUi(page, email, { applicant: true, locale: 'fr' });
  await expect(page.getByRole('heading', { name: 'Mon compte' })).toBeVisible();
  const mail = await latestEmail(request, email);
  expect(mail.subject).toBe('Confirmez votre adresse e-mail — HumanLift');
});

test('password reset by email', async ({ page, request }) => {
  const email = uniqueEmail('reset');
  await registerViaUi(page, email);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await page.goto('/en/forgot-password');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/a reset link is on its way/)).toBeVisible();
  const mail = await latestEmail(request, email);
  await page.goto(linkIn(mail.body));
  await page.getByLabel('New password').fill('my brand new long password');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByText(/Your password has been changed/)).toBeVisible();
  await page.goto('/en/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('my brand new long password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/en\/account/);
});

test('account page redirects to sign-in when signed out', async ({ page }) => {
  await page.goto('/en/account');
  await expect(page).toHaveURL(/\/en\/login/);
});

test('contact form and abuse report are received', async ({ page }) => {
  await page.goto('/en/contact');
  await page.getByLabel('Your name').fill('E2E Visitor');
  await page.getByLabel('Email address').fill('visitor@example.test');
  await page.getByLabel('Topic').selectOption('donor');
  await page.getByLabel('Message').fill('E2E contact message: how will donations work?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Thank you. Your message has been received.')).toBeVisible();

  await page.goto('/fr/report-abuse');
  await page.getByLabel('Quel est le problème ?').selectOption('fraud');
  await page.getByLabel("Que s'est-il passé ?").fill('Rapport E2E : cette demande semble copiée.');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText('Merci. Votre signalement a bien été reçu et sera examiné.')).toBeVisible();
});
