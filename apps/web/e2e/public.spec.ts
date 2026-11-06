import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FOOTER_PATHS = ['about', 'countries', 'transparency', 'safety', 'contact', 'faq', 'report-abuse', 'privacy', 'terms', 'cookies', 'accessibility', 'legal', 'responsible-fundraising'];
const HEADER_PATHS = ['how-it-works', 'applicants', 'donors', 'requests', 'trust', 'login', 'register'];

test('root redirects to a language and shows the test-environment banner', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real people. Verified needs. Meaningful help.');
  await expect(page.getByText(/Test environment\. No real money/)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('language switcher changes the page to French and back', async ({ page }) => {
  await page.goto('/en/how-it-works');
  await page.getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr\/how-it-works$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Comment fonctionne HumanLift');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How HumanLift works');
});

for (const locale of ['en', 'fr']) {
  test(`every header and footer page opens in ${locale}`, async ({ page }) => {
    for (const p of [...HEADER_PATHS, ...FOOTER_PATHS]) {
      const res = await page.goto(`/${locale}/${p}`);
      expect(res?.status(), `/${locale}/${p}`).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
}

test('legal pages are clearly marked as drafts awaiting legal review', async ({ page }) => {
  for (const p of ['privacy', 'terms', 'cookies', 'legal', 'accessibility', 'responsible-fundraising']) {
    await page.goto(`/en/${p}`);
    await expect(page.getByText(/Draft — awaiting legal review/)).toBeVisible();
  }
});

test('requests and transparency pages show honest empty states, not invented figures', async ({ page }) => {
  await page.goto('/en/requests');
  await expect(page.getByText(/There are no published requests yet/)).toBeVisible();
  await page.goto('/en/transparency');
  await expect(page.getByText('Not available yet').first()).toBeVisible();
  await expect(page.getByTestId('countries-open')).toHaveText('0');
});

test('country availability is read live from the database', async ({ page }) => {
  await page.goto('/fr/countries');
  await expect(page.getByRole('row', { name: /France/ })).toContainText('Étude en cours');
});

test('unknown pages return 404', async ({ page }) => {
  const res = await page.goto('/en/this-does-not-exist');
  expect(res?.status()).toBe(404);
});

test('sitemap lists both languages and robots blocks test environments', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/fr/how-it-works');
  expect(sitemap).toContain('hreflang="fr"');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/Disallow: \//);
});

test('keyboard users can skip to the main content', async ({ page }) => {
  await page.goto('/en');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
});

for (const path of ['/en', '/fr', '/en/register', '/en/login', '/en/contact', '/en/report-abuse', '/en/countries', '/en/privacy']) {
  test(`no serious or critical automated accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}
