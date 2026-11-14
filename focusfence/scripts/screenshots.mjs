// Captures the website's product images: crisp 2x captures of the real extension UI, in the dark
// and light themes, encoded to WebP -> ./screenshots/site/<lang>/ (read by scripts/docs.mjs).
// Usage: node scripts/screenshots.mjs --site [--lang fr]   one language (en, fr, es, de)
//        npm run screenshots:site                          all four languages
// (set FF_CHROME_LIBS if Chromium needs local libs)
// The Chrome Web Store screenshots and promo tiles are made by scripts/store-assets.mjs
// (npm run store:assets), from the same demo state (scripts/demo-seed.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, launchExtension, startFakeInternet } from './launch.mjs';
import { seed } from './demo-seed.mjs';

const argLang = process.argv.indexOf('--lang');
const LANG = argLang > 0 ? process.argv[argLang + 1] : 'en';
if (!['en', 'fr', 'es', 'de'].includes(LANG)) throw new Error('unknown language ' + LANG);
if (!process.argv.includes('--site')) {
  throw new Error('scripts/screenshots.mjs only makes the website images (--site). Store assets: npm run store:assets');
}

/* ------------------------------------------------------------------ website
 * --site: crisp 2x captures of the real UI for the website (docs/), in the dark and
 * light themes (the site follows the visitor's theme), encoded to WebP in the browser
 * (no image tooling needed). Output: screenshots/site/<lang>/ (read by scripts/docs.mjs).
 * The Open Graph images are drawn from the site's own fence: scripts/site-art.mjs.
 */
/**
 * One theme of the website images. The extension follows the system theme, so the
 * same seeded demo state is captured once in dark and once in light.
 * Dark files keep their plain names (name.webp); light ones get a suffix (name-light.webp).
 */
async function captureTheme(theme, SITE_OUT, written) {
  const sfx = theme === 'light' ? '-light' : '';
  const net = await startFakeInternet();
  const ext = await launchExtension({
    proxyPort: net.port,
    colorScheme: theme,
    deviceScaleFactor: 2,
    ...(LANG === 'en' ? {} : { lang: LANG }),
    mutate(mf) {
      // the captures inject small <style> tags (hiding the Incognito warning, the schedule state)
      mf.content_security_policy.extension_pages = mf.content_security_policy.extension_pages.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
    },
  });
  const { context, base } = ext;
  // WebP encoding in a blank page: Chromium's canvas encoder, optional downscale.
  const encoder = await context.newPage();
  // crop: a region in CSS px of a 2x capture (so a crop comes from the very same frame)
  const webp = async (png, name, { scale = 1, quality = 0.88, crop = null } = {}) => {
    const file = name.replace(/(-1x)?\.webp$/, `${sfx}$1.webp`);
    const b64 = await encoder.evaluate(
      async ([src, k, q, r]) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const [sx, sy, sw, sh] = r ? [r.x * 2, r.y * 2, r.width * 2, r.height * 2].map(Math.round) : [0, 0, img.naturalWidth, img.naturalHeight];
        const c = document.createElement('canvas');
        c.width = Math.round(sw * k);
        c.height = Math.round(sh * k);
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        return c.toDataURL('image/webp', q).split(',')[1];
      },
      ['data:image/png;base64,' + png.toString('base64'), scale, quality, crop]
    );
    fs.writeFileSync(path.join(SITE_OUT, file), Buffer.from(b64, 'base64'));
    written.push(file);
  };
  const clipOf = async (page, selector, padX, padY = padX) => {
    const r = await page.locator(selector).first().evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    });
    // whole CSS pixels, so every 2x crop has even dimensions (exact 1x width/height attributes)
    const x = Math.max(0, Math.floor(r.x - padX));
    const y = Math.max(0, Math.floor(r.y - padY));
    return { x, y, width: Math.ceil(r.x + r.width + padX) - x, height: Math.ceil(r.y + r.height + padY) - y };
  };
  try {
    const api = await context.newPage();
    await api.goto(base + 'options.html');
    const send = (type, payload = {}) => api.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
    await seed(send, api);
    const insta = await context.newPage();
    await insta.goto('https://www.instagram.com/');
    const tabId = await api.evaluate(async () => (await chrome.tabs.query({})).find((t) => t.url && t.url.includes('instagram.com')).id);
    const hideIncognito = (pg) => pg.addStyleTag({ content: '#incognito-warning{display:none!important}' });
    const LEFT = (18 * 60 + 42) * 1000;
    const setLeft = (ms) =>
      api.evaluate(async (left) => {
        const { pomodoro } = await chrome.storage.local.get('pomodoro');
        pomodoro.endsAt = Date.now() + left;
        await chrome.storage.local.set({ pomodoro });
      }, ms);
    const waitFor = (pg, sel, text) =>
      pg.waitForFunction(([s, t]) => (document.querySelector(s)?.textContent || '').includes(t), [sel, text], { polling: 50, timeout: 10000 });
    // fences rise and light up once (nothing loops): capture the settled picture
    const settle = async (pg) => {
      await pg.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
      await pg.waitForTimeout(150);
    };
    // a section of Settings, below the sticky top bar, whole in the window
    const shoot = async (pg, selector, pad, name) => {
      await pg.evaluate((sel) => {
        const el = document.querySelector(sel);
        window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 96));
      }, selector);
      await pg.waitForTimeout(200);
      await webp(await pg.screenshot({ clip: await clipOf(pg, selector, pad) }), name);
    };

    // ---- the block page, as the extension shows it (no focus session), in a 1280x800 window.
    // This visit is today's 5th blocked attempt: 5 today, 89 this week, as in the popup below.
    const blocked = await context.newPage();
    await blocked.setViewportSize({ width: 1280, height: 800 });
    await blocked.goto('https://www.reddit.com/r/all/');
    // The page fills itself in asynchronously (a random quote, then the counts once the visit is
    // recorded). Then pin the quote, so every language and theme shows the same one.
    await waitFor(blocked, '#week', '89');
    await blocked.evaluate(() => {
      document.getElementById('message').textContent = self.FFCore.quote(1);
    });
    await settle(blocked);
    const blockPng = await blocked.screenshot();
    await webp(blockPng, 'block-page.webp');
    await webp(blockPng, 'block-page-1x.webp', { scale: 0.5 });
    // The same page in smaller windows: the hero's, and a narrow one for phones. A resize is not a
    // new visit, and the wall is rebuilt in place, standing.
    for (const [name, width, height] of [
      ['block-card.webp', 720, 600],
      ['block-page-m.webp', 400, 720],
    ]) {
      await blocked.setViewportSize({ width, height });
      await blocked.waitForTimeout(500);
      await settle(blocked);
      const png = await blocked.screenshot();
      await webp(png, name);
    }
    await blocked.close();

    // ---- the popup, idle: 360 CSS px wide, 448 tall with a site on the tab
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 640 });
    await popup.goto(base + 'popup.html?tabId=' + tabId);
    await waitFor(popup, '#today-stats', '89');
    await settle(popup);
    const h = await popup.evaluate(() => Math.ceil(document.querySelector('.popup').getBoundingClientRect().height));
    await popup.setViewportSize({ width: 360, height: h });
    await settle(popup);
    const popupPng = await popup.screenshot();
    await popup.close();
    await webp(popupPng, 'popup.webp');

    // ---- Settings, Blocklist: the fence of your sites, the composer and the site cards
    const opt = await context.newPage();
    await opt.setViewportSize({ width: 1280, height: 740 });
    await opt.goto(base + 'options.html#blocklist');
    await hideIncognito(opt);
    await opt.waitForTimeout(600);
    await settle(opt);
    const optPng = await opt.screenshot();
    await webp(optPng, 'blocklist.webp');
    await webp(optPng, 'blocklist-1x.webp', { scale: 0.5 });
    // Settings show one destination at a time: open each by its link.
    const view = async (hash) => {
      await opt.evaluate((h) => (location.hash = h), hash);
      await opt.waitForTimeout(500);
      await settle(opt);
    };
    // The stats (the 7-day picket chart) and the schedule (its week ribbon), in a 1280 px window and
    // in the narrow layout for phones (a 400 px window, which the page fits without scrolling sideways).
    // The schedule is switched on for its picture; its "active / paused now" note depends on the
    // clock at capture time, so it is left out, like the Incognito warning.
    const WINDOWS = [
      { days: [1, 2, 3, 4, 5], start: '09:00', end: '12:30' },
      { days: [1, 2, 3, 4, 5], start: '13:30', end: '18:00' },
    ];
    await send('setSchedule', { schedule: { enabled: true, windows: WINDOWS } });
    // whether everything inside an element stays inside it (in French and German, some of the narrow
    // layout's buttons need more than 400 px)
    const fits = (pg, selector) =>
      pg.evaluate((sel) => {
        const box = document.querySelector(sel).getBoundingClientRect();
        return [...document.querySelectorAll(sel + ' *')].every((e) => {
          const r = e.getBoundingClientRect();
          return !r.width || (r.left >= box.left - 0.5 && r.right <= box.right + 0.5);
        });
      }, selector);
    for (const [hash, selector, name] of [
      ['#stats', '#stats', 'stats'],
      ['#schedule', '#schedule .card', 'schedule'],
    ]) {
      // a 1280 px window, then the narrowest phone-like window in which the section fits whole
      for (const width of [1280, 400, 440, 480, 520, 560]) {
        await opt.setViewportSize({ width, height: 1000 });
        await opt.reload();
        await hideIncognito(opt);
        await opt.addStyleTag({ content: '#schedule-state{visibility:hidden!important}' });
        await view(hash);
        if (width > 760) {
          await shoot(opt, selector, selector === '#stats' ? 24 : 1, `${name}.webp`);
        } else if (await fits(opt, selector)) {
          await shoot(opt, selector, selector === '#stats' ? 16 : 1, `${name}-m.webp`);
          break;
        }
      }
    }
    await send('setSchedule', { schedule: { enabled: false, windows: WINDOWS } });

    // ---- the popup during a focus session: its focus row, at exactly 18:42 left
    await send('startPomodoro');
    await setLeft(LEFT + 3000);
    const focus = await context.newPage();
    await focus.setViewportSize({ width: 360, height: 720 });
    await focus.goto(base + 'popup.html?tabId=' + tabId);
    await waitFor(focus, '#focus-timer', '18:42');
    const focusPng = await focus.screenshot({ clip: await clipOf(focus, '#focus-card', 1) });
    await focus.close();
    await webp(focusPng, 'focus.webp');
    await send('stopPomodoro');

    // ---- strict mode switched on ("until I unlock it": no time in the picture): the popup's stage,
    // where the fence turns amber and the switch locks
    await send('startStrict', { hours: 0 });
    const strict = await context.newPage();
    await strict.setViewportSize({ width: 360, height: 720 });
    await strict.goto(base + 'popup.html?tabId=' + tabId);
    await waitFor(strict, '#today-stats', '89');
    await settle(strict);
    await webp(await strict.screenshot({ clip: await clipOf(strict, '#status-card', 0) }), 'strict.webp');
    await strict.close();

  } finally {
    await ext.close();
    await net.close();
  }
}

async function captureSite() {
  const SITE_OUT = path.join(ROOT, 'screenshots', 'site', LANG);
  fs.rmSync(SITE_OUT, { recursive: true, force: true });
  fs.mkdirSync(SITE_OUT, { recursive: true });
  const written = [];
  for (const theme of ['dark', 'light']) await captureTheme(theme, SITE_OUT, written);
  console.log('site images written to', SITE_OUT, '\n ', written.join(' '));
}

await captureSite();
process.exit(0);
