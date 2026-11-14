// Settings' top bar keeps all five tabs whole in every language, from 1280 px down to 761 px (at
// 760 px and below the tabs get a row of their own). Translations differ a lot in length: before
// fitTopbar() (options.js), French and Spanish clipped the Plan tab below 1200 px, German below
// 1100 px, English around 1000 px.
import { test, expect } from '@playwright/test';
import { launchExtension, startFakeInternet } from '../scripts/launch.mjs';
import { S } from '../scripts/i18n/strings.mjs';

const WIDTHS = [1280, 1200, 1100, 1024, 961, 960, 900, 800, 761];
const nextFrame = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const measure = (page) =>
  page.evaluate(() => {
    const tabs = document.querySelector('.tabs');
    const box = tabs.getBoundingClientRect();
    return {
      overflow: tabs.scrollWidth - tabs.clientWidth,
      clipped: [...tabs.querySelectorAll('a')]
        .filter((a) => {
          const r = a.getBoundingClientRect();
          return r.left < box.left - 0.5 || r.right > box.right + 0.5;
        })
        .map((a) => a.dataset.nav),
      bar: document.querySelector('.bar-in').scrollWidth - document.querySelector('.bar-in').clientWidth,
      shed: document.querySelector('.topbar').className.replace('topbar', '').trim(),
    };
  });

for (const lang of ['en', 'fr', 'es', 'de']) {
  test(`${lang}: every Settings tab stays whole, Free and Pro, from 1280 to 761 px`, async () => {
    test.slow(); // three states x nine widths
    const net = await startFakeInternet();
    const ext = await launchExtension({ proxyPort: net.port, ...(lang === 'en' ? {} : { lang }) });
    try {
      const page = await ext.context.newPage();
      await page.goto(ext.base + 'options.html#plan');
      const send = (type, payload = {}) => page.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
      const check = async (state) => {
        await page.setViewportSize({ width: 1280, height: 700 });
        await page.reload();
        await page.evaluate(() => document.fonts.ready);
        await nextFrame(page);
        // with room to spare, nothing is shed
        expect((await measure(page)).shed, `${lang}, ${state}, 1280 px`).toBe('');
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 700 });
          await nextFrame(page);
          const m = await measure(page);
          expect(m.clipped, `${lang}, ${state}, ${width} px: clipped tabs (shed: ${m.shed})`).toEqual([]);
          expect(m.overflow, `${lang}, ${state}, ${width} px`).toBeLessThanOrEqual(0);
          expect(m.bar, `${lang}, ${state}, ${width} px: the bar itself`).toBeLessThanOrEqual(0);
        }
        // and everything comes back when the window widens again
        await page.setViewportSize({ width: 1280, height: 700 });
        await nextFrame(page);
        expect((await measure(page)).shed, `${lang}, ${state}, back to 1280 px`).toBe('');
      };
      await check('Free, blocking on');
      await send('setEnabled', { enabled: false });
      await check('Free, blocking off');
      await send('setEnabled', { enabled: true });
      await send('setDevPro', { on: true });
      await send('startPomodoro'); // the longest switch label: "Session de concentration"
      await check('Pro, focus session');
      // the Plan's subscription button speaks the language too
      await expect(page.locator('#manage-sub')).toHaveText(S.manageSubscription[lang]);
      await expect(page.locator('#manage-note')).toHaveText(S.manageSubscriptionText[lang]);
    } finally {
      await ext.close();
      await net.close();
    }
  });
}
