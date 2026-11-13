// Design review captures: every screen and state of the extension, in light and dark.
// Usage: npm run design:shots                          -> ../design/extension-ui/screenshots/
//        node scripts/design-shots.mjs --out <dir>     another folder (e.g. one per critique pass)
//        node scripts/design-shots.mjs --only popup    only captures whose name contains "popup"
//        node scripts/design-shots.mjs --theme dark    one theme only
// Popups are captured at 2x (they are small); pages at 1x. Set FF_CHROME_LIBS if Chromium needs local libs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, launchExtension, startFakeInternet } from './launch.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};
const OUT = path.resolve(arg('--out') || path.join(ROOT, '..', 'design', 'extension-ui', 'screenshots'));
const ONLY = arg('--only');
const THEMES = arg('--theme') ? [arg('--theme')] : ['light', 'dark'];
const LANG = arg('--lang'); // e.g. de: Chrome UI language for chrome.i18n; names get a -de suffix
const LEFT = (18 * 60 + 42) * 1000; // the moment every capture shows: 18:42 left in round 1
fs.mkdirSync(OUT, { recursive: true });

const ENTRIES = [
  ['poker', 'keyword'],
  ['news.ycombinator.com', 'domain'],
  ['facebook.com', 'domain'],
  ['x.com', 'domain'],
  ['youtube.com/shorts', 'path'],
  ['reddit.com', 'domain'],
];
const STATS = [
  { 'reddit.com': 9, 'x.com': 6, 'youtube.com/shorts': 7, 'news.ycombinator.com': 3 },
  { 'reddit.com': 7, 'x.com': 5, 'youtube.com/shorts': 4, 'facebook.com': 2 },
  { 'reddit.com': 6, 'x.com': 3, 'youtube.com/shorts': 5, 'news.ycombinator.com': 2 },
  { 'reddit.com': 5, 'x.com': 4, 'youtube.com/shorts': 2 },
  { 'reddit.com': 3, 'x.com': 2, 'youtube.com/shorts': 3, 'news.ycombinator.com': 1 },
  { 'reddit.com': 2, 'x.com': 2, 'youtube.com/shorts': 1 },
  { 'reddit.com': 2, 'x.com': 1, 'youtube.com/shorts': 1 },
];

const want = (name) => !ONLY || ONLY.split(',').some((o) => name.includes(o));
const written = [];

async function run({ grantAll = true, captures }) {
  const net = await startFakeInternet();
  // 2x device pixels: popups are saved at 2x, pages are scaled back to CSS pixels (1x).
  const ext = await launchExtension({ proxyPort: net.port, grantAll, deviceScaleFactor: 2, ...(LANG ? { lang: LANG } : {}) });
  const { context, base } = ext;
  try {
    const api = await context.newPage();
    await api.goto(base + 'options.html');
    const send = (type, payload = {}) => api.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
    const store = (fn, arg) => api.evaluate(fn, arg);
    const tabIdFor = (needle) =>
      api.evaluate(async (n) => (await chrome.tabs.query({})).find((t) => t.url && t.url.includes(n)).id, needle);

    const h = {
      send,
      base,
      context,
      async reset({ pro = false, entries = ENTRIES, stats = true } = {}) {
        await store(async () => {
          await chrome.storage.local.clear();
          await chrome.storage.session.clear();
        });
        await send('sync');
        if (pro) await send('setDevPro', { on: true });
        for (const [raw, kind] of entries) {
          if (kind !== 'domain' && !pro) continue;
          await send('addEntry', { raw, kind });
        }
        if (pro) {
          await send('setSchedule', {
            schedule: {
              enabled: false,
              windows: [
                { days: [1, 2, 3, 4, 5], start: '09:00', end: '12:30' },
                { days: [1, 2, 3, 4, 5], start: '13:30', end: '18:00' },
              ],
            },
          });
        }
        if (stats) {
          await store(async (pattern) => {
            const C = self.FFCore;
            const days = {};
            pattern.forEach((p, i) => (days[C.dayKey(Date.now() - (6 - i) * 864e5)] = p));
            await chrome.storage.local.set({ stats: { days } });
          }, STATS);
        }
      },
      async focus(left = LEFT) {
        await send('startPomodoro');
        await store(async (l) => {
          const { pomodoro } = await chrome.storage.local.get('pomodoro');
          pomodoro.endsAt = Date.now() + l;
          await chrome.storage.local.set({ pomodoro });
        }, left);
      },
      async strictChallenge() {
        await store(async () => {
          const { strict } = await chrome.storage.local.get('strict');
          strict.unlockRequestedAt = Date.now() - 11 * 60 * 1000;
          await chrome.storage.local.set({ strict });
        });
      },
      tabIdFor,
      /** Countdowns tick: start a little above 18:42 and wait for that exact value, so every capture agrees. */
      waitText: (p, sel, text) =>
        p.waitForFunction(([s, t]) => (document.querySelector(s)?.textContent || '').includes(t), [sel, text], { polling: 50, timeout: 10000 }),
      async page(theme, url, viewport) {
        const p = await context.newPage();
        await p.emulateMedia({ colorScheme: theme });
        await p.setViewportSize(viewport);
        await p.goto(url);
        await p.waitForTimeout(450);
        return p;
      },
      async shot(p, name, opts = {}) {
        const file = path.join(OUT, name + '.png');
        await p.evaluate(() => document.fonts.ready);
        await p.screenshot({ path: file, scale: 'css', ...opts });
        written.push(path.basename(file));
      },
      /** Popup at its natural height (2x). */
      async popup(theme, name, query = '', before, ready) {
        const p = await h.page(theme, base + 'popup.html' + query, { width: 360, height: 600 });
        if (before) await before(p);
        await p.waitForTimeout(250);
        // Chrome sizes the popup to its content, up to 600 px
        const height = await p.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height));
        await p.setViewportSize({ width: 360, height: Math.min(600, height) });
        await p.waitForTimeout(150);
        if (ready) await ready(p);
        await h.shot(p, name, { scale: 'device' });
        await p.close();
      },
      async options(theme, name, { hash = '', scrollTo, block = 'start', fullPage = false, width = 1280, before, ready } = {}) {
        const p = await h.page(theme, base + 'options.html' + hash, { width, height: 800 });
        await p.addStyleTag({ content: '#incognito-warning{display:none!important}' }).catch(() => {});
        if (before) await before(p);
        if (scrollTo) {
          await p.evaluate(([sel, b]) => document.querySelector(sel).scrollIntoView({ block: b }), [scrollTo, block]);
          await p.waitForTimeout(350);
        }
        if (fullPage) await p.evaluate(() => window.scrollTo(0, 0));
        if (ready) await ready(p);
        await h.shot(p, name, { fullPage });
        await p.close();
      },
    };

    for (const [name, fn] of captures) {
      for (const theme of THEMES) {
        const full = `${name}${LANG ? '-' + LANG : ''}-${theme}`;
        if (!want(full)) continue;
        await fn(h, theme, full);
      }
    }
  } finally {
    await ext.close();
    await net.close();
  }
}

// --------------------------------------------------------------------------- captures
const MAIN = [
  // ---- popup
  ['popup-free', async (h, theme, name) => {
    await h.reset({ pro: false });
    const insta = await h.context.newPage();
    await insta.goto('https://www.instagram.com/');
    await h.popup(theme, name, '?tabId=' + (await h.tabIdFor('instagram.com')));
    await insta.close();
  }],
  ['popup-pro-focus', async (h, theme, name) => {
    await h.reset({ pro: true });
    const insta = await h.context.newPage();
    await insta.goto('https://www.instagram.com/');
    const tabId = await h.tabIdFor('instagram.com');
    await h.focus(LEFT + 2500);
    await h.popup(theme, name, '?tabId=' + tabId, null, (p) => h.waitText(p, '#focus-timer', '18:42'));
    await insta.close();
  }],
  ['popup-pro-idle', async (h, theme, name) => {
    await h.reset({ pro: true });
    const insta = await h.context.newPage();
    await insta.goto('https://www.instagram.com/');
    await h.popup(theme, name, '?tabId=' + (await h.tabIdFor('instagram.com')));
    await insta.close();
  }],
  ['popup-off-listed-site', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('setEnabled', { enabled: false });
    const site = await h.context.newPage();
    await site.goto('https://old.reddit.com/r/programming');
    await h.popup(theme, name, '?tabId=' + (await h.tabIdFor('old.reddit.com')));
    await site.close();
  }],
  ['popup-strict', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('startStrict', { hours: 2 });
    await h.popup(theme, name);
  }],
  ['popup-paused-schedule', async (h, theme, name) => {
    await h.reset({ pro: true });
    const now = new Date();
    const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    await h.send('setSchedule', {
      schedule: { enabled: true, windows: [{ days: [0, 1, 2, 3, 4, 5, 6], start: hm(new Date(+now + 2 * 3600e3)), end: hm(new Date(+now + 3 * 3600e3)) }] },
    });
    await h.popup(theme, name);
  }],
  ['popup-locked', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('setPassword', { password: 'hunter22' });
    await h.send('lockNow');
    await h.popup(theme, name, '', async (p) => {
      await p.click('#toggle-enabled');
      await p.waitForSelector('#unlock-form:not(.hidden)');
      await p.locator('#unlock-password').blur();
    });
  }],
  ['popup-new', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    await h.popup(theme, name);
  }],

  // ---- block page
  ['block', async (h, theme, name) => {
    await h.reset({ pro: false });
    const p = await h.page(theme, 'https://www.reddit.com/r/all/', { width: 1280, height: 800 });
    await p.evaluate(() => (document.getElementById('message').textContent = self.FFCore.quote(1)));
    await p.waitForTimeout(500);
    await h.shot(p, name);
    await p.close();
  }],
  ['block-session', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.focus(LEFT + 2500);
    const p = await h.page(theme, 'https://www.youtube.com/shorts/abc123', { width: 1280, height: 800 });
    await p.evaluate(() => (document.getElementById('message').textContent = self.FFCore.quote(1)));
    await p.waitForTimeout(500);
    await h.waitText(p, '#session-text', '18:42');
    await h.shot(p, name);
    await p.close();
  }],
  ['block-message-small', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('setBlockMessage', { message: 'You promised yourself the thesis chapter first. Close the tab and open the draft.' });
    const p = await h.page(theme, 'https://news.ycombinator.com/item?id=4242424242', { width: 420, height: 800 });
    await p.waitForTimeout(500);
    await h.shot(p, name);
    await p.close();
  }],

  // ---- options
  ['options-blocklist-pro', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name);
  }],
  ['options-blocklist-free', async (h, theme, name) => {
    await h.reset({ pro: false });
    await h.options(theme, name);
  }],
  ['options-free-locked', async (h, theme, name) => {
    await h.reset({ pro: false });
    await h.options(theme, name, { scrollTo: '#schedule' });
  }],
  ['options-empty', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    await h.options(theme, name);
  }],
  ['options-schedule-focus', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name, { scrollTo: '#schedule' });
  }],
  ['options-focus-running', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.focus(LEFT + 2500);
    await h.options(theme, name, { scrollTo: '#focus', ready: (p) => h.waitText(p, '#pomo-clock', '18:42') });
  }],
  ['options-strict-waiting', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('startStrict', { hours: 2 });
    await h.send('requestStrictUnlock');
    await h.options(theme, name, { scrollTo: '#strict' });
  }],
  ['options-strict-challenge', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('startStrict', { hours: 0 });
    await h.send('requestStrictUnlock');
    await h.strictChallenge();
    await h.options(theme, name, { scrollTo: '#strict' });
  }],
  ['options-blockpage-password', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name, { scrollTo: '#blockpage' });
  }],
  ['options-stats', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name, { scrollTo: '#stats' });
  }],
  ['options-plan-free', async (h, theme, name) => {
    await h.reset({ pro: false });
    await h.options(theme, name, { scrollTo: '#plan' });
  }],
  ['options-plan-pro', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name, { scrollTo: '#plan', block: 'end' });
  }],
  ['options-lock', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('setPassword', { password: 'hunter22' });
    await h.send('lockNow');
    await h.options(theme, name, { before: (p) => p.locator('#lock-password').blur() });
  }],
  ['options-narrow', async (h, theme, name) => {
    await h.reset({ pro: false });
    await h.options(theme, name, { width: 760 });
  }],
  ['options-strict-top', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.send('startStrict', { hours: 4 });
    await h.options(theme, name);
  }],
  ['options-lapsed', async (h, theme, name) => {
    // Pro rules kept after Pro lapses: shown as inactive
    await h.reset({ pro: true });
    await h.send('setDevPro', { on: false });
    await h.options(theme, name);
  }],
  ['options-toast', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name, {
      before: async (p) => {
        await p.evaluate(() => {
          self.FFUI.toast(self.FFI18N.t('toastAdded', 'tiktok.com'));
          self.FFUI.toast(self.FFI18N.t('toastPwMismatch'), 'error');
        });
        await p.waitForTimeout(260);
      },
    });
  }],
  ['options-full', async (h, theme, name) => {
    await h.reset({ pro: true });
    await h.options(theme, name, { fullPage: true });
  }],

  // ---- onboarding
  ['onboarding-1', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    const p = await h.page(theme, h.base + 'onboarding.html', { width: 1280, height: 800 });
    for (const host of ['reddit.com', 'youtube.com']) await p.locator(`.choice[data-host="${host}"]`).click();
    await p.locator('#custom-input').focus();
    await p.locator('#custom-input').blur();
    await h.shot(p, name);
    await p.close();
  }],
  ['onboarding-1-max', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    const p = await h.page(theme, h.base + 'onboarding.html', { width: 1280, height: 800 });
    for (const host of ['reddit.com', 'youtube.com', 'x.com', 'tiktok.com']) await p.locator(`.choice[data-host="${host}"]`).click();
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await h.shot(p, name);
    await p.close();
  }],
  ['onboarding-2', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    const p = await h.page(theme, h.base + 'onboarding.html', { width: 1280, height: 800 });
    await p.click('#skip-1');
    await p.waitForTimeout(300);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await h.shot(p, name);
    await p.close();
  }],
  ['onboarding-3', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    const p = await h.page(theme, h.base + 'onboarding.html', { width: 1280, height: 800 });
    await p.click('#skip-1');
    await p.click('#next-2');
    await p.waitForTimeout(300);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await h.shot(p, name);
    await p.close();
  }],
  ['onboarding-small-typed', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    const p = await h.page(theme, h.base + 'onboarding.html', { width: 390, height: 844 });
    await p.locator('#custom-input').fill('news.ycombinator.com');
    await h.shot(p, name, { fullPage: true });
    await p.close();
  }],
  ['onboarding-small', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [], stats: false });
    const p = await h.page(theme, h.base + 'onboarding.html', { width: 390, height: 844 });
    await p.locator('.choice[data-host="reddit.com"]').click();
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await h.shot(p, name, { fullPage: true });
    await p.close();
  }],
];

// Without host access (the user declined Chrome's prompt): the access banner and the error-page badge.
const NO_ACCESS = [
  ['options-no-access', async (h, theme, name) => {
    await h.reset({ pro: false, entries: [['reddit.com', 'domain'], ['x.com', 'domain']] });
    await h.options(theme, name);
  }],
];

await run({ captures: MAIN });
if (NO_ACCESS.some(([n]) => THEMES.some((t) => want(`${n}-${t}`)))) await run({ grantAll: false, captures: NO_ACCESS });
console.log(`${written.length} captures in ${path.relative(process.cwd(), OUT) || OUT}`);
