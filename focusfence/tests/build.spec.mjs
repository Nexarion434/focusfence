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
  } finally {
    await ext.close();
  }
});
