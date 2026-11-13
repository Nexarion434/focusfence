// Payments UI: prices in the user's currency (EUR in the eurozone, USD elsewhere) and plan checks.
import { test, expect } from './fixtures.mjs';
import { launchExtension } from '../scripts/launch.mjs';

test('English (US) browser: USD prices and the USD plans', async ({ api, ext }) => {
  const st = await api.send('getState');
  expect(st.prices).toMatchObject({ currency: 'USD', plans: { monthly: 'monthly', yearly: 'yearly' } });
  const page = await ext.context.newPage();
  await page.goto(ext.base + 'options.html#plan');
  await expect(page.locator('#price-monthly')).toHaveText('$2.99');
  await expect(page.locator('#price-yearly')).toHaveText('$19.99');
  await expect(page.locator('#price-note')).toHaveText('Prices in US dollars.');
  await page.close();
  // unknown plans are refused before anything is opened; valid ones reach the DEV guard
  expect((await api.send('openPayment', { plan: 'lifetime' })).code).toBe('INVALID');
  expect((await api.send('openPayment', { plan: 'yearly' })).code).toBe('DEV_ONLY');
});

for (const [lang, monthly, yearly, note] of [
  ['fr', /^2,99\s€$/, /^19,99\s€$/, 'Prix en euros.'],
  ['de', /^2,99\s€$/, /^19,99\s€$/, 'Preise in Euro.'],
]) {
  test(`${lang} browser (eurozone): EUR prices in Settings and onboarding`, async ({ net }) => {
    const ext = await launchExtension({ proxyPort: net.port, lang });
    try {
      const page = await ext.context.newPage();
      await page.goto(ext.base + 'options.html#plan');
      const st = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'getState' }));
      expect(st.prices).toMatchObject({ currency: 'EUR', plans: { monthly: 'monthly-eur', yearly: 'yearly-eur' } });
      await expect(page.locator('#price-monthly')).toHaveText(monthly);
      await expect(page.locator('#price-yearly')).toHaveText(yearly);
      await expect(page.locator('#price-note')).toHaveText(note);
      await page.goto(ext.base + 'onboarding.html');
      await expect(page.locator('#pro-price')).toContainText('€');
      await expect(page.locator('#pro-price')).not.toContainText('$');
    } finally {
      await ext.close();
    }
  });
}
