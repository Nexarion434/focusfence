// Pro subscribers manage or cancel their subscription from Settings › Plan. The button calls
// ExtensionPay's official extpay.openPaymentPage() without a plan: for a user who has paid,
// ExtensionPay shows that page as the subscription page (Stripe's billing portal).
import { test, expect } from './fixtures.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { launchExtension } from '../scripts/launch.mjs';
import { S } from '../scripts/i18n/strings.mjs';

test('Settings › Plan: Free sees the plans and Restore purchase, Pro sees Manage subscription instead', async ({ api, ext }) => {
  const page = await ext.context.newPage();
  await page.goto(ext.base + 'options.html#plan');
  await expect(page.locator('#plans')).toBeVisible();
  await expect(page.locator('#restore-link')).toBeVisible();
  await expect(page.locator('#manage-sub')).toBeHidden();

  await api.send('setDevPro', { on: true });
  await page.reload();
  const button = page.locator('#manage-sub');
  await expect(button).toBeVisible();
  await expect(button).toHaveText(S.manageSubscription.en);
  await expect(page.locator('#manage-note')).toHaveText(S.manageSubscriptionText.en);
  await expect(page.locator('#plans')).toBeHidden();
  await expect(page.locator('#restore-link')).toBeHidden(); // "Already paid?" makes no sense once you have Pro

  // the DEV build never talks to ExtensionPay: the button explains why instead
  await button.click();
  await expect(page.locator('.toast.error')).toContainText('Payments are disabled in the DEV build');
  expect((await api.send('manageSubscription')).code).toBe('DEV_ONLY');
  await page.close();
});

test('store build: Manage subscription opens ExtensionPay for this install, with no plan', async ({ net }) => {
  // DEV off, as in the zip: real ExtensionPay calls (answered by the fake internet)
  const ext = await launchExtension({
    proxyPort: net.port,
    mutate(mf, dir) {
      const cfg = path.join(dir, 'config.js');
      fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/DEV:\s*true/, 'DEV: false'));
    },
  });
  try {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html#plan');
    // the first license check (at install) has run: no key yet, so "not paid"
    await expect.poll(() => page.evaluate(async () => !!(await chrome.storage.local.get('license')).license)).toBe(true);
    // A paying install: ExtensionPay's key (its library keeps it in sync storage) and the cached license.
    // Settings re-checks the license on open; the fake internet can't answer, so the cached status holds.
    await page.evaluate(async () => {
      await chrome.storage.sync.set({ extensionpay_api_key: 'test-key' });
      await chrome.storage.local.set({ license: { paid: true, plan: 'month', status: 'active', checkedAt: Date.now(), lastError: null } });
    });
    await page.reload();
    const button = page.locator('#manage-sub');
    await expect(button).toBeVisible();
    await button.click();
    // openPaymentPage() with no plan nickname: ExtensionPay's own page for this install's key
    // (a plan button would open /choose-plan/<nickname>)
    await expect
      .poll(() => ext.context.pages().map((p) => p.url()).find((u) => u.startsWith('https://extensionpay.com/extension/')) || '', { timeout: 15000 })
      .toBe('https://extensionpay.com/extension/focusfence-dev/choose-plan?api_key=test-key');
    await expect(page.locator('.toast.error')).toHaveCount(0);
  } finally {
    await ext.close();
  }
});
