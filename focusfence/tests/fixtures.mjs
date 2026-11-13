import { test as base, expect } from '@playwright/test';
import { launchExtension, startFakeInternet } from '../scripts/launch.mjs';

/**
 * Worker-scoped browser with the unpacked extension + fake internet.
 * Each test starts from a clean extension state.
 */
export const test = base.extend({
  net: [
    async ({}, use) => {
      const net = await startFakeInternet();
      await use(net);
      await net.close();
    },
    { scope: 'worker' },
  ],
  ext: [
    async ({ net }, use) => {
      const ext = await launchExtension({ proxyPort: net.port });
      await use(ext);
      await ext.close();
    },
    { scope: 'worker' },
  ],
  // An extension page used to talk to the service worker like the real UI does.
  api: async ({ ext }, use) => {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    const send = (type, payload = {}) =>
      page.evaluate(([type, payload]) => chrome.runtime.sendMessage({ type, ...payload }), [type, payload]);
    await page.evaluate(async () => {
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();
    });
    await send('sync');
    await use({ page, send, ext });
    await page.close();
  },
});

export { expect };

export async function visit(context, url) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (e) {
    page.__error = e.message;
  }
  return page;
}

/** Visit `url` and report whether FocusFence blocked it. */
export async function outcome(context, url) {
  const page = await visit(context, url);
  const u = page.url();
  let result;
  if (u.startsWith('chrome-extension://') && u.includes('/blocked.html')) result = 'blocked';
  else if (page.__error && /ERR_BLOCKED_BY_CLIENT/.test(page.__error)) result = 'blocked-error-page';
  else {
    const text = await page.textContent('#origin').catch(() => null);
    result = text && text.startsWith('origin:') ? 'reachable' : 'unknown:' + (page.__error || u);
  }
  await page.close();
  return result;
}

export function hm(date) {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
