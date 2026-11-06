import { expect, test } from '@playwright/test';
import { confirmEmail, registerViaUi, signInNewAdmin, uniqueEmail } from './helpers';

const ADMIN = 'http://localhost:3001';

test('help request journey: draft, send for review, sent back, resubmit, approve; publishing is refused without consent and an approved country', async ({ page, request }) => {
  const email = uniqueEmail('applicant');
  await registerViaUi(page, email, { applicant: true });
  await confirmEmail(page, request, email);

  // Applicant creates a draft.
  await page.goto('/en/account');
  await page.getByTestId('my-requests-link').click();
  await expect(page.getByRole('heading', { name: 'My help requests', level: 1 })).toBeVisible();
  await expect(page.getByText('You have no requests yet.')).toBeVisible();
  const form = page.getByTestId('request-form');
  // Healthcare is not offered.
  await expect(form.getByLabel('Type of need').locator('option', { hasText: 'healthcare' })).toHaveCount(0);
  await form.getByLabel('Short title').fill('Electricity bill for October');
  await form.getByLabel('What is the need?').fill('My electricity bill is overdue after a job loss and I need help to avoid disconnection.');
  await form.getByLabel('Type of need').selectOption('ENERGY');
  await form.getByLabel('Amount needed').fill('240,50');
  await form.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByTestId('request-status')).toHaveText('Draft');
  await expect(page.getByText('€240.50')).toBeVisible();
  const requestUrl = page.url();

  // Draft is private: not on the public list.
  const id = requestUrl.split('/').pop()!;
  expect((await request.get(`/en/requests/${id}`)).status()).toBe(404);

  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByTestId('request-status')).toHaveText('Sent for review');
  await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCount(0);

  // Staff reviews and sends it back with a reason.
  await signInNewAdmin(page);
  await page.getByRole('link', { name: 'Help requests' }).click();
  await page.getByRole('button', { name: 'Electricity bill for October' }).first().click();
  const detail = page.getByTestId('request-detail');
  await expect(detail).toContainText(email);
  await detail.getByRole('button', { name: 'Start review' }).click();
  await expect(page.getByTestId('detail-status')).toHaveText('UNDER_REVIEW');
  await detail.getByRole('button', { name: 'Send back for changes' }).click();
  await expect(detail.getByRole('alert')).toContainText('Write a reason first');
  await detail.getByLabel(/Reason/).fill('Please say which supplier the bill is from.');
  await detail.getByRole('button', { name: 'Send back for changes' }).click();
  await expect(page.getByTestId('detail-status')).toHaveText('DRAFT');

  // Applicant sees the message, edits and resubmits.
  await page.goto(requestUrl);
  await expect(page.getByTestId('decision-note')).toContainText('Please say which supplier the bill is from.');
  await page.getByTestId('request-form').getByLabel('What is the need?').fill('My electricity bill from the national supplier is overdue after a job loss and I need help to avoid disconnection.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByTestId('request-status')).toHaveText('Sent for review');

  // Staff approves; publishing is refused (no consent, then country not approved).
  await page.goto(`${ADMIN}/requests`);
  await page.getByRole('button', { name: 'Electricity bill for October' }).first().click();
  await detail.getByRole('button', { name: 'Start review' }).click();
  await detail.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByTestId('detail-status')).toHaveText('APPROVED');
  await detail.getByRole('button', { name: 'Publish' }).click();
  await expect(detail.getByRole('alert')).toContainText('has not agreed to public visibility');

  await page.goto(requestUrl);
  await expect(page.getByTestId('request-status')).toHaveText('Approved');
  await page.getByRole('button', { name: 'I agree' }).click();
  await expect(page.getByTestId('consent-state')).toContainText('You agreed');

  await page.goto(`${ADMIN}/requests`);
  await page.getByLabel('Status').selectOption('APPROVED');
  await page.getByRole('button', { name: 'Electricity bill for October' }).first().click();
  await detail.getByRole('button', { name: 'Publish' }).click();
  await expect(detail.getByRole('alert')).toContainText('not approved for beta or launch');

  // History is visible to the applicant, and nothing is public.
  await page.goto(requestUrl);
  await expect(page.getByTestId('request-history')).toContainText('Approved');
  await page.goto('/en/requests');
  await expect(page.getByText(/There are no published requests yet/)).toBeVisible();
});

test('French applicant sees the request pages in French and a donor is asked to become an applicant first', async ({ page, request }) => {
  const email = uniqueEmail('fr-applicant');
  await registerViaUi(page, email, { applicant: true, locale: 'fr' });
  await confirmEmail(page, request, email, 'fr');
  await page.goto('/fr/account/requests');
  await expect(page.getByRole('heading', { name: "Mes demandes d'aide", level: 1 })).toBeVisible();
  const form = page.getByTestId('request-form');
  await form.getByLabel('Titre court').fill('Loyer de novembre');
  await form.getByLabel('Quel est le besoin ?').fill('Je dois payer mon loyer de novembre et il me manque une partie du montant.');
  await form.getByLabel('Type de besoin').selectOption('HOUSING');
  await form.getByLabel('Montant nécessaire').fill('abc');
  await form.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await expect(page.getByText('Indiquez un montant entre 1 et 10 000.')).toBeVisible();
  await form.getByLabel('Montant nécessaire').fill('300');
  await form.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await expect(page.getByTestId('request-status')).toHaveText('Brouillon');

  const donor = uniqueEmail('donor-only');
  await page.context().clearCookies();
  await registerViaUi(page, donor, { donor: true });
  await page.goto('/en/account/requests');
  await expect(page.getByText('first press "I also want to request assistance"')).toBeVisible();
  await expect(page.getByTestId('request-form')).toHaveCount(0);
});
