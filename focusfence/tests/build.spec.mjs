// Builds the store zip and smoke-tests the production package (DEV=false).
import { test, expect, outcome } from './fixtures.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, launchExtension } from '../scripts/launch.mjs';

test('store build: DEV flag off, no Simulate Pro, Free blocking works', async ({ net }) => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'ignore' });
  const zip = path.join(ROOT, 'dist/focusfence-1.0.0.zip');
  expect(fs.existsSync(zip)).toBe(true);
  expect(fs.readFileSync(path.join(ROOT, 'dist/focusfence/config.js'), 'utf8')).toMatch(/DEV: false/);
  // AGPL compliance: license texts + notices ship in the package, ExtPay is unmodified from npm
  for (const f of ['LICENSE', 'THIRD_PARTY_NOTICES.txt', 'licenses/Inter-OFL-1.1.txt', 'licenses/webextension-polyfill-MPL-2.0.txt']) {
    expect(fs.existsSync(path.join(ROOT, 'dist/focusfence', f)), f).toBe(true);
  }
  expect(
    fs.readFileSync(path.join(ROOT, 'dist/focusfence/vendor/ExtPay.js')).equals(
      fs.readFileSync(path.join(ROOT, 'node_modules/extpay/dist/ExtPay.js'))
    )
  ).toBe(true);
  const zipText = fs.readFileSync(zip).toString('latin1');
  for (const f of ['LICENSE', 'THIRD_PARTY_NOTICES.txt', 'vendor/ExtPay.js']) expect(zipText).toContain(f);

  const ext = await launchExtension({ proxyPort: net.port, srcDir: path.join(ROOT, 'dist/focusfence') });
  try {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    const send = (type, payload = {}) =>
      page.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
    expect(await send('setDevPro', { on: true })).toMatchObject({ ok: false, code: 'DEV_ONLY' });
    const st = await send('getState');
    expect(st.dev).toBe(false);
    expect(st.isPro).toBe(false);
    await expect(page.locator('#dev-panel')).toBeHidden();
    expect(await send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' })).toMatchObject({ ok: false, code: 'PRO_REQUIRED' });
    expect((await send('addEntry', { raw: 'reddit.com', kind: 'domain' })).ok).toBe(true);
    expect(await outcome(ext.context, 'https://old.reddit.com/')).toBe('blocked');
    // first install of the store build opens the onboarding tour
    expect(ext.context.pages().some((p) => p.url().endsWith('/onboarding.html'))).toBe(true);
  } finally {
    await ext.close();
  }
});

test('store build: ExtensionPay offline keeps the cached license and fails gracefully', async () => {
  const { startFakeInternet } = await import('../scripts/launch.mjs');
  const net = await startFakeInternet({ downHosts: ['extensionpay.com'] });
  const ext = await launchExtension({ proxyPort: net.port, srcDir: path.join(ROOT, 'dist/focusfence') });
  try {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    const send = (type, payload = {}) =>
      page.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);

    // Without an ExtensionPay key nothing is fetched at all (privacy: no network for Free users).
    const before = net.hits.filter((h) => h.includes('extensionpay')).length;
    expect((await send('refreshLicense')).license.paid).toBe(false);
    expect(net.hits.filter((h) => h.includes('extensionpay')).length).toBe(before);

    // A paying user goes offline: Pro stays unlocked from the cached status.
    await page.evaluate(async () => {
      await chrome.storage.sync.set({ extensionpay_api_key: 'test-key' });
      await chrome.storage.local.set({ license: { paid: true, checkedAt: Date.now() - 864e5 } });
    });
    const r = await send('refreshLicense');
    expect(r.ok).toBe(true);
    expect(r.license.paid).toBe(true);
    expect(r.license.lastError).toBeTruthy();
    expect(net.hits.some((h) => h.includes('extensionpay.com'))).toBe(true);
    const st = await send('getState');
    expect(st.isPro).toBe(true);
    await page.reload();
    await expect(page.locator('#license-note')).toBeVisible();
    await expect(page.locator('#license-note')).toContainText("Couldn't reach ExtensionPay");

    // With a key, checkout simply opens ExtensionPay's page in a tab (Chrome shows its own offline page).
    const tab = ext.context.waitForEvent('page');
    expect((await send('openPayment', { plan: 'yearly' })).ok).toBe(true);
    expect((await tab).url()).toMatch(/extensionpay\.com|chrome-error:/); // offline: Chrome's own error page

    // First-time checkout must create a key over the network: offline -> friendly, typed error.
    await page.evaluate(() => chrome.storage.sync.remove('extensionpay_api_key'));
    const pay = await send('openPayment', { plan: 'yearly' });
    expect(pay).toMatchObject({ ok: false, code: 'NETWORK' });
    expect(pay.error).toMatch(/Check your connection/);
  } finally {
    await ext.close();
    await net.close();
  }
});
