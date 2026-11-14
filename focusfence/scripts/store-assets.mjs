// Chrome Web Store images -> store/assets/ (npm run store:assets; one language: -- --lang fr)
//   <lang>/1-block-page.png … 5-blocklist.png
//       Five 1280x800 screenshots per language (en, fr, es, de). Each one is the real extension,
//       captured at 2x in its dark theme from the website's demo state (scripts/demo-seed.mjs),
//       in a browser window like the website's product shots, under a caption from
//       store/screenshots.json. Captions, window and colours come from the website's own stylesheet
//       (scripts/site.css), so the store looks like focusfence.dev.
//   promo-small-440x280.png, marquee-1400x560.png
//       The promo tiles. The store can't localize them and Google asks for little or no text, so they
//       show the logo and the name over the website's closing scene: the glass-pill fence on its floor.
//   icon-128.png
//       The store icon: src/icons/icon128.png as is (96 px art in a 16 px transparent margin).
// Every image is checked: exact size, 24-bit PNG (the screenshots and tiles have no alpha channel).
// (set FF_CHROME_LIBS if Chromium needs local libs)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, launchExtension, startFakeInternet } from './launch.mjs';
import { seed } from './demo-seed.mjs';
import { LOGO, FENCE } from './site-parts.mjs';
import { S } from './i18n/strings.mjs';

const ALL = ['en', 'fr', 'es', 'de'];
const argLang = process.argv.indexOf('--lang');
const LANGS = argLang > 0 ? [process.argv[argLang + 1]] : ALL;
for (const l of LANGS) if (!ALL.includes(l)) throw new Error('unknown language ' + l);

const OUT = path.join(ROOT, 'store', 'assets');
const CAPTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'store/screenshots.json'), 'utf8'));

// Screenshot geometry (CSS px): the window starts under the caption and runs off the bottom edge.
const W = 1280;
const H = 800;
const WIN_X = 120;
const WIN_W = W - 2 * WIN_X; // 1040
const WIN_TOP = 252;
const BAR_H = 42; // .win-bar in site.css
const BODY_H = H - WIN_TOP - BAR_H; // what the window shows of the page: 1040 x 506
// Settings is captured in a 1280 px window, the desktop width it is designed for, and shown at
// 1040/1280: narrower, its top bar can't hold every French tab (the Plan tab gets clipped).
const SETTINGS_W = 1280;
const SETTINGS_H = Math.ceil((BODY_H * SETTINGS_W) / WIN_W);

const FONT = path.join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2');
if (!fs.existsSync(FONT)) throw new Error(`${FONT} is missing: run npm install`);
// The pages are set from strings (no origin), so the font is inlined rather than fetched.
const SITE_CSS = fs
  .readFileSync(path.join(ROOT, 'scripts/site.css'), 'utf8')
  .replace("url('inter.woff2')", `url('data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}')`);

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const png64 = (buf) => 'data:image/png;base64,' + buf.toString('base64');

/** Width, height and colour type of a PNG (2 = RGB, 6 = RGBA). */
function pngInfo(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
}
function check(file, width, height, { alpha = false } = {}) {
  const i = pngInfo(file);
  if (i.width !== width || i.height !== height) throw new Error(`${file} is ${i.width}x${i.height}, expected ${width}x${height}`);
  if (!alpha && i.colorType !== 2) throw new Error(`${file} must be a 24-bit PNG without alpha (colour type ${i.colorType})`);
}

/* ---------------------------------------------------------------- captures */

/**
 * The five scenes of one language, as 2x PNG buffers, in the dark theme:
 * block page, popup, Blocklist, Focus (a running session) and Strict mode (cooling off).
 * Order matters: visiting the block page counts a blocked attempt (5 today, 89 this week),
 * and strict mode can't be switched off again, so it comes last.
 */
async function capture(lang) {
  const net = await startFakeInternet();
  const ext = await launchExtension({
    proxyPort: net.port,
    colorScheme: 'dark',
    deviceScaleFactor: 2,
    ...(lang === 'en' ? {} : { lang }),
    mutate(mf) {
      // the captures inject small <style> tags (hiding the Incognito warning and the schedule's
      // "active now" note, which depend on the viewer's settings and the clock)
      mf.content_security_policy.extension_pages = mf.content_security_policy.extension_pages.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
    },
  });
  const { context, base } = ext;
  const shots = {};
  try {
    const api = await context.newPage();
    await api.goto(base + 'options.html');
    const send = (type, payload = {}) => api.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
    await seed(send, api);
    const insta = await context.newPage();
    await insta.goto('https://www.instagram.com/');
    const tabId = await api.evaluate(async () => (await chrome.tabs.query({})).find((t) => t.url && t.url.includes('instagram.com')).id);
    const waitFor = (pg, sel, text) =>
      pg.waitForFunction(([s, t]) => (document.querySelector(s)?.textContent || '').includes(t), [sel, text], { polling: 50, timeout: 15000 });
    // pages rise and light up once (nothing loops): capture the settled picture
    const settle = async (pg) => {
      await pg.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
      await pg.waitForTimeout(150);
    };
    const quiet = (pg) => pg.addStyleTag({ content: '#incognito-warning,#incognito-note{display:none!important}#schedule-state{visibility:hidden!important}' });

    // 1. the block page, in a window the size of the screenshot's (5 blocked today, 89 this week)
    const blocked = await context.newPage();
    await blocked.setViewportSize({ width: WIN_W, height: BODY_H });
    await blocked.goto('https://www.reddit.com/r/all/');
    await waitFor(blocked, '#week', '89');
    // the quote is picked at random: pin one, so every language shows the same
    await blocked.evaluate(() => {
      document.getElementById('message').textContent = self.FFCore.quote(1);
    });
    await settle(blocked);
    shots.block = await blocked.screenshot();
    await blocked.close();

    // 2. the popup on a site that isn't blocked yet: 360 px wide, as tall as its content
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 720 });
    await popup.goto(base + 'popup.html?tabId=' + tabId);
    await quiet(popup);
    await waitFor(popup, '#today-stats', '89');
    await settle(popup);
    const ph = await popup.evaluate(() => Math.ceil(document.querySelector('.popup').getBoundingClientRect().height));
    await popup.setViewportSize({ width: 360, height: ph });
    await settle(popup);
    shots.popup = await popup.screenshot();
    await popup.close();

    // Settings, one view at a time (opened by its link), freshly loaded
    const view = async (hash, { ready, scrollTo } = {}) => {
      const pg = await context.newPage();
      await pg.setViewportSize({ width: SETTINGS_W, height: SETTINGS_H });
      await pg.goto(base + 'options.html' + hash);
      await quiet(pg);
      await pg.waitForTimeout(400);
      await settle(pg);
      // every tab and the switch must fit in the top bar, in every language
      const overflow = await pg.evaluate(() => {
        const over = (el) => el.scrollWidth - el.clientWidth;
        return { tabs: over(document.querySelector('.tabs')), bar: over(document.querySelector('.bar-in')) };
      });
      if (overflow.tabs > 1 || overflow.bar > 1) throw new Error(`${lang} ${hash}: the Settings top bar overflows ${JSON.stringify(overflow)}`);
      if (scrollTo) {
        // bring a section up under the sticky top bar (60 px); the bar is made fully opaque, or the
        // text scrolled under it would show through its 86 % background as a faint, broken line
        await pg.addStyleTag({ content: '.topbar{background:var(--bg)!important}' });
        await pg.evaluate((sel) => {
          const el = document.querySelector(sel);
          window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 82));
        }, scrollTo);
        await pg.waitForTimeout(250);
      }
      if (ready) await waitFor(pg, ...ready);
      const png = await pg.screenshot();
      await pg.close();
      return png;
    };

    // 5. the Blocklist, scrolled to the composer (website, path or keyword) and the six rules
    shots.blocklist = await view('#blocklist', { scrollTo: '#add-form' });

    // 3. a focus session running, at exactly 18:42 left (round 1 of 4)
    await send('startPomodoro');
    await api.evaluate(async (left) => {
      const { pomodoro } = await chrome.storage.local.get('pomodoro');
      pomodoro.endsAt = Date.now() + left;
      await chrome.storage.local.set({ pomodoro });
    }, (18 * 60 + 42) * 1000 + 3000);
    shots.focus = await view('#focus', { ready: ['#pomo-clock', '18:42'] });
    await send('stopPomodoro');

    // 4. strict mode "until I unlock it" (no clock time in the picture), an unlock requested:
    // the 10-minute cooling-off at exactly 08:24 left
    await send('startStrict', { hours: 0 });
    await send('requestStrictUnlock');
    await api.evaluate(async (elapsed) => {
      const { strict } = await chrome.storage.local.get('strict');
      strict.unlockRequestedAt = Date.now() - elapsed;
      await chrome.storage.local.set({ strict });
    }, (10 * 60 - (8 * 60 + 24)) * 1000 - 3000);
    shots.strict = await view('#strict', { ready: ['#strict-countdown', '08:24'] });
  } finally {
    await ext.close();
    await net.close();
  }
  return shots;
}

/* ---------------------------------------------------------- compositions */

const STORE_CSS = `
  html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    position: relative;
    background:
      radial-gradient(820px 340px at 50% ${WIN_TOP + 40}px, rgb(63 214 122 / 0.11), transparent 70%),
      radial-gradient(1200px 520px at 50% -160px, rgb(255 255 255 / 0.035), transparent 70%),
      var(--bg);
  }
  .cap { position: absolute; z-index: 2; top: 46px; left: 48px; right: 48px; display: grid; justify-items: center; text-align: center; }
  .cap .eyebrow { height: 34px; gap: 10px; padding: 0 16px 0 14px; font-size: 15px; }
  .cap .eyebrow-dot { width: 7px; height: 7px; }
  .cap .pro { height: 21px; margin-left: 2px; font-size: 11px; }
  .cap-h { margin-top: 18px; font-size: 52px; font-weight: 620; line-height: 1.06; letter-spacing: -0.045em; white-space: nowrap; }
  .cap-h em { font-style: normal; color: var(--dim); }
  .cap-sub { margin-top: 12px; max-width: 1000px; color: var(--text-2); font-size: 20px; line-height: 1.45; letter-spacing: -0.012em; text-wrap: balance; }
  .store-win { position: absolute; z-index: 1; left: ${WIN_X}px; top: ${WIN_TOP}px; width: ${WIN_W}px; box-shadow: var(--win-shadow); }
  .store-win .win-body { position: relative; height: ${BODY_H}px; border-radius: 0; background: var(--screen); }
  .store-win .win-body > img { display: block; width: ${WIN_W}px; height: auto; max-width: none; }
  .win-ext { position: relative; }
  .win-ext.on { background: rgb(255 255 255 / 0.14); box-shadow: inset 0 0 0 1px var(--line-3); }
  .badge { position: absolute; right: -8px; bottom: -1px; min-width: 22px; height: 14px; padding: 0 4px; border-radius: 4px;
    display: grid; place-items: center; color: #fff; background: #1f5a4c; font: 600 10px/1 var(--sans); letter-spacing: 0;
    box-shadow: 0 0 0 1.5px var(--bar); }
  .fav { width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, #3d4441, #262b29); }
  /* the page under the popup: a quiet, generic feed (no real site's look) */
  .feed { position: absolute; inset: 0; display: grid; grid-template-columns: 210px 470px; gap: 36px; padding: 28px 36px; background: #0e100f; }
  .feed .side { display: grid; align-content: start; gap: 18px; padding-top: 6px; }
  .feed .side i { display: block; height: 10px; border-radius: 5px; background: #1c201e; }
  .feed .side i:nth-child(2n) { width: 70%; }
  .feed .post { margin-bottom: 22px; padding: 18px; border-radius: 14px; background: #131614; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04); }
  .feed .who { display: flex; align-items: center; gap: 10px; }
  .feed .who b { width: 30px; height: 30px; border-radius: 50%; background: #232826; }
  .feed .who i { width: 120px; height: 9px; border-radius: 5px; background: #222725; }
  .feed .media { height: 190px; margin-top: 14px; border-radius: 10px; background: linear-gradient(160deg, #1d2321, #151917); }
  .feed .line { height: 9px; margin-top: 12px; border-radius: 5px; background: #1e2220; }
  .feed .line.s { width: 60%; }
  .pop { position: absolute; z-index: 3; top: 6px; right: 14px; border-radius: 12px; overflow: hidden; box-shadow: var(--pop-shadow); }
  .pop img { display: block; max-width: none; }
`;

const winBar = ({ title, fav, ext = 'idle', badge }) =>
  `<div class="win-bar" aria-hidden="true"><span class="win-dots"><i></i><i></i><i></i></span>` +
  `<span class="win-tab">${fav ? '<i class="fav"></i>' : LOGO(14)}<span>${esc(title)}</span></span>` +
  `<span class="win-ext${ext === 'on' ? ' on' : ''}">${LOGO(16)}${badge ? `<span class="badge">${esc(badge)}</span>` : ''}</span></div>`;

function screenshotHtml(lang, spec, shots) {
  const t = spec.text[lang];
  const settingsTitle = S.optionsTitle[lang];
  let bar;
  let body;
  if (spec.scene === 'popup') {
    const [w, h] = [shots.popup.readUInt32BE(16) / 2, shots.popup.readUInt32BE(20) / 2];
    const k = Math.min(1.12, (BODY_H - 12) / h);
    const post = '<div class="post"><div class="who"><b></b><i></i></div><div class="media"></div><div class="line"></div><div class="line s"></div></div>';
    bar = winBar({ title: 'instagram.com', fav: true, ext: 'on' });
    body =
      `<div class="feed"><div class="side">${'<i></i>'.repeat(7)}</div><div>${post}${post}</div></div>` +
      `<div class="pop"><img src="${png64(shots.popup)}" width="${Math.round(w * k)}" height="${Math.round(h * k)}" alt=""></div>`;
  } else {
    const titles = {
      block: S.blockedDocTitleHost[lang].replace('$1', 'reddit.com'),
      blocklist: settingsTitle,
      focus: settingsTitle,
      strict: settingsTitle,
    };
    bar = winBar({ title: titles[spec.scene], badge: spec.scene === 'focus' ? '19m' : null });
    body = `<img src="${png64(shots[spec.scene])}" alt="">`;
  }
  const pro = spec.pro ? ' <span class="pro">PRO</span>' : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${SITE_CSS}${STORE_CSS}</style></head><body>
<div class="cap">
  <p class="eyebrow"><span class="eyebrow-dot" aria-hidden="true"></span>${esc(t.kicker)}${pro}</p>
  <h1 class="cap-h">${esc(t.headline)} <em>${esc(t.dim)}</em></h1>
  <p class="cap-sub">${esc(t.sub)}</p>
</div>
<div class="win store-win">${bar}<div class="win-body">${body}</div></div>
</body></html>`;
}

/* The promo tiles: the website's closing scene (.final in site.css): the pills on their glossy floor,
 * the middle one holding the light, under the logo and the name. 440 px is narrow enough for
 * site.css to show five pills instead of seven, as the extension does in small windows. */
const PROMO_CSS = `
  html, body { margin: 0; overflow: hidden; background: var(--bg); }
  .final.tile { box-sizing: border-box; padding: 0; }
  .tile .scene { position: absolute; left: 0; right: 0; bottom: 0; margin: 0; }
  .tile-brand { position: absolute; z-index: 5; left: 0; right: 0; display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 620; letter-spacing: -0.03em; }
  .tile-brand svg { flex: none; border-radius: 22%; box-shadow: var(--mark-shadow); }
  .small { width: 440px; height: 280px; --floor-h: 46px; --pw: 50px; }
  .small .tile-brand { top: 34px; gap: 14px; font-size: 38px; }
  .marquee { width: 1400px; height: 560px; --floor-h: 104px; --pw: 104px; }
  .marquee .tile-brand { top: 76px; gap: 26px; font-size: 76px; }
`;
const promoHtml = (cls, logo) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${SITE_CSS}${PROMO_CSS}</style></head><body>
<section class="final tile ${cls}">
  <p class="tile-brand">${LOGO(logo)}<span>FocusFence</span></p>
  <div class="scene"><div class="floor"></div>${FENCE('fence mirror')}${FENCE('fence')}<span class="fence-pool"></span></div>
</section></body></html>`;

/* ------------------------------------------------------------------- run */

const env = { ...process.env };
if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
const written = [];
fs.mkdirSync(OUT, { recursive: true });

const captures = {};
for (const lang of LANGS) {
  captures[lang] = await capture(lang);
  console.log(`${lang}: captured ${Object.keys(captures[lang]).join(', ')}`);
}

const browser = await chromium.launch({ env });
try {
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const lang of LANGS) {
    const dir = path.join(OUT, lang);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (const spec of CAPTIONS.shots) {
      await page.setViewportSize({ width: W, height: H });
      await page.setContent(screenshotHtml(lang, spec, captures[lang]), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      // Translations differ in length: the headline stays on one line and the subhead within two,
      // and the caption must end above the window.
      const fit = await page.evaluate((top) => {
        const h = document.querySelector('.cap-h');
        const sub = document.querySelector('.cap-sub');
        let size = 52;
        while (h.scrollWidth > 1180 && size > 36) h.style.fontSize = --size + 'px';
        let subSize = 20;
        const lines = () => Math.round(sub.getBoundingClientRect().height / (subSize * 1.45));
        while (lines() > 2 && subSize > 16) sub.style.fontSize = --subSize + 'px';
        const bottom = document.querySelector('.cap').getBoundingClientRect().bottom;
        return { size, subSize, lines: lines(), clearance: Math.round(top - bottom), overflow: h.scrollWidth > 1180 };
      }, WIN_TOP);
      if (fit.overflow || fit.clearance < 18) throw new Error(`${lang}/${spec.file}: the caption doesn't fit (${JSON.stringify(fit)})`);
      const file = path.join(dir, spec.file);
      await page.screenshot({ path: file });
      check(file, W, H);
      written.push(path.relative(ROOT, file) + ` (headline ${fit.size}px, sub ${fit.subSize}px x${fit.lines})`);
    }
  }
  if (LANGS.length === ALL.length || process.argv.includes('--promo')) {
    for (const [file, cls, w, h, logo] of [
      ['promo-small-440x280.png', 'small', 440, 280, 50],
      ['marquee-1400x560.png', 'marquee', 1400, 560, 96],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(promoHtml(cls, logo), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const out = path.join(OUT, file);
      await page.screenshot({ path: out });
      check(out, w, h);
      written.push(path.relative(ROOT, out));
    }
    const icon = path.join(OUT, 'icon-128.png');
    fs.copyFileSync(path.join(ROOT, 'src/icons/icon128.png'), icon);
    check(icon, 128, 128, { alpha: true });
    written.push(path.relative(ROOT, icon));
  }
} finally {
  await browser.close();
}
console.log('store assets written:\n  ' + written.join('\n  '));
process.exit(0);
