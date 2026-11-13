// Captures UI screenshots + Chrome Web Store assets.
// Usage: npm run screenshots                       English  -> ./screenshots/
//        node scripts/screenshots.mjs --lang fr    French   -> ./screenshots/fr/  (also es, de)
//        npm run screenshots:all                   all four languages
//        node scripts/screenshots.mjs --site [--lang fr]  website images -> ./screenshots/site/<lang>/
//        npm run screenshots:site                  website images, all four languages
// (set FF_CHROME_LIBS if Chromium needs local libs)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, launchExtension, startFakeInternet } from './launch.mjs';

const argLang = process.argv.indexOf('--lang');
const LANG = argLang > 0 ? process.argv[argLang + 1] : 'en';
const OUT = LANG === 'en' ? path.join(ROOT, 'screenshots') : path.join(ROOT, 'screenshots', LANG);
const CAPTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'store/screenshots.json'), 'utf8'));
if (!CAPTIONS.promo[LANG]) throw new Error('no captions for language ' + LANG);
const SHOTS = CAPTIONS.shots.map((x) => ({ file: x.file, raw: x.raw, ...x.text[LANG] }));
const shot = (file) => SHOTS.find((x) => x.file === file);
const escHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
fs.mkdirSync(OUT, { recursive: true });
console.log('language:', LANG, '->', OUT);
const DARK = process.argv.includes('--dark');
const MIN = 60 * 1000;

const LOGO = fs
  .readFileSync(path.join(ROOT, 'src/lib/ui.js'), 'utf8')
  .match(/const LOGO_SVG =\s*([\s\S]*?);\n/)[1]
  .split('\n')
  .map((l) => l.trim().replace(/^\+?\s*'/, '').replace(/'\s*\+?$/, ''))
  .join('');

function frameHtml({ title, body, popupQuery, popupHeight }) {
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles/base.css">
<style>
  body{width:1280px;height:800px;overflow:hidden;margin:0;display:grid;grid-template-columns:1fr 520px;align-items:center;
    background:radial-gradient(900px 600px at 0% 0%, var(--accent-soft), transparent 60%),radial-gradient(700px 500px at 100% 100%, var(--pro-soft), transparent 65%),var(--bg);}
  .copy{padding:0 40px 0 96px}
  .brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:20px;letter-spacing:-.02em;margin-bottom:34px}
  h1{font-size:54px;line-height:1.05;letter-spacing:-.035em;font-weight:760;margin:0 0 20px}
  h1 em{font-style:normal;color:var(--accent)}
  p.lead{font-size:20px;color:var(--ink-2);max-width:520px;line-height:1.5}
  ul{list-style:none;padding:0;margin:30px 0 0;display:flex;flex-direction:column;gap:12px;font-size:16.5px;color:var(--ink-2)}
  li{display:flex;gap:12px;align-items:center}
  li::before{content:'';width:20px;height:20px;border-radius:6px;background:var(--accent-soft) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5 10.5l3 3 7-7' fill='none' stroke='%232E7D6B' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/16px no-repeat;flex:none}
  .device{justify-self:start;width:392px;border-radius:18px;background:var(--surface);box-shadow:0 2px 6px rgba(28,38,34,.06),0 40px 80px rgba(28,38,34,.18);overflow:hidden;border:1px solid var(--line)}
  .chrome{height:40px;display:flex;align-items:center;gap:7px;padding:0 14px;background:var(--bg-2);border-bottom:1px solid var(--line)}
  .chrome i{width:11px;height:11px;border-radius:50%;background:var(--line-2);display:block}
  .chrome .url{margin-left:12px;flex:1;height:24px;border-radius:8px;background:var(--surface);font-size:12px;color:var(--muted);display:flex;align-items:center;padding:0 10px}
  .chrome .ext{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:var(--accent-soft)}
  .pop{padding:16px}
  iframe{border:0;width:360px;height:${popupHeight || 520}px;display:block;border-radius:12px;box-shadow:var(--shadow);background:var(--bg)}
</style></head><body>
<div class="copy"><div class="brand">${LOGO.replace(/SIZE/g, '32')}FocusFence</div>${title}${body}</div>
<div class="device"><div class="chrome"><i></i><i></i><i></i><span class="url">instagram.com</span><span class="ext">${LOGO.replace(/SIZE/g, '16')}</span></div>
<div class="pop"><iframe src="popup.html${popupQuery || ''}"></iframe></div></div>
</body></html>`;
}

/** 1280x800 store screenshot: caption on top, the real UI in a browser frame bleeding off the bottom. */
function captionHtml({ kicker, headline, sub }, img) {
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles/base.css">
<style>
  body{width:1280px;height:800px;overflow:hidden;margin:0;position:relative;
    background:radial-gradient(900px 520px at 0% 0%, var(--accent-soft), transparent 62%),radial-gradient(800px 500px at 100% 0%, var(--pro-soft), transparent 60%),var(--bg);}
  .cap{position:absolute;left:0;right:0;top:56px;text-align:center}
  .kicker{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
  h1{font-size:46px;line-height:1.08;letter-spacing:-.035em;font-weight:760;margin:14px 0 12px}
  p{font-size:20px;color:var(--ink-2);margin:0 auto;max-width:1000px}
  .win{position:absolute;left:120px;top:256px;width:1040px;border-radius:16px 16px 0 0;overflow:hidden;background:var(--surface);
    box-shadow:0 2px 6px rgba(28,38,34,.06),0 40px 80px rgba(28,38,34,.18);border:1px solid var(--line)}
  .bar{height:34px;display:flex;align-items:center;gap:7px;padding:0 14px;background:var(--bg-2);border-bottom:1px solid var(--line)}
  .bar i{width:10px;height:10px;border-radius:50%;background:var(--line-2);display:block}
  .win img{display:block;width:1040px;height:650px}
</style></head><body>
<div class="cap"><div class="kicker">${LOGO.replace(/SIZE/g, '24')}${escHtml(kicker)}</div><h1>${escHtml(headline)}</h1><p>${escHtml(sub)}</p></div>
<div class="win"><div class="bar"><i></i><i></i><i></i></div><img src="${img}" alt=""></div>
</body></html>`;
}

async function captioned(context, base, extDir, spec) {
  const name = 'cap-' + spec.file.replace('.png', '.html');
  fs.copyFileSync(path.join(OUT, spec.raw.replace('.png', suffix + '.png')), path.join(extDir, 'raw-' + spec.raw));
  fs.writeFileSync(path.join(extDir, name), captionHtml(spec, 'raw-' + spec.raw));
  const p = await context.newPage();
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.goto(base + name);
  await p.waitForTimeout(500);
  // Translations differ in length: keep the headline on one line and put the
  // browser frame right under the caption.
  await p.evaluate(() => {
    const h1 = document.querySelector('h1');
    let size = 46;
    while (h1.scrollWidth > 1180 && size > 30) h1.style.fontSize = --size + 'px';
    h1.style.whiteSpace = 'nowrap';
    const cap = document.querySelector('.cap').getBoundingClientRect();
    document.querySelector('.win').style.top = Math.max(232, Math.round(cap.bottom + 36)) + 'px';
  });
  await p.screenshot({ path: path.join(OUT, spec.file.replace('.png', suffix + '.png')) });
  await p.close();
}

function promoHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles/base.css">
<style>
  :root{color-scheme:light}
  body{width:440px;height:280px;margin:0;overflow:hidden;background:#1F5A4C;color:#fff;position:relative;font-family:Inter,sans-serif}
  .glow{position:absolute;inset:0;background:radial-gradient(320px 220px at 85% 10%, rgba(255,255,255,.18), transparent 70%),radial-gradient(260px 200px at 0% 100%, rgba(0,0,0,.18), transparent 70%)}
  .fence{position:absolute;left:0;right:0;bottom:0;height:86px;background:repeating-linear-gradient(90deg, transparent 0 22px, rgba(255,255,255,.10) 22px 34px);mask-image:linear-gradient(to top,#000 10%,transparent)}
  .in{position:relative;padding:34px 34px}
  .brand{display:flex;align-items:center;gap:12px;font-weight:750;font-size:30px;letter-spacing:-.03em}
  .brand svg{flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.22);border-radius:11px}
  h2{font-size:25px;line-height:1.15;letter-spacing:-.025em;font-weight:720;margin:24px 0 10px;max-width:340px}
  p{font-size:14px;opacity:.85;margin:0}
  .pill{position:absolute;right:28px;top:36px;font-size:11px;font-weight:700;letter-spacing:.08em;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.16)}
</style></head><body><div class="glow"></div><div class="fence"></div>
<div class="in"><div class="brand">${LOGO.replace(/SIZE/g, '48')}FocusFence</div>
<h2>${escHtml(CAPTIONS.promo[LANG].headline)}</h2><p>${escHtml(CAPTIONS.promo[LANG].sub)}</p></div>
</body></html>`;
}

async function seed(send, page) {
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
  });
  await send('setDevPro', { on: true });
  for (const [raw, kind] of [
    ['poker', 'keyword'],
    ['news.ycombinator.com', 'domain'],
    ['facebook.com', 'domain'],
    ['x.com', 'domain'],
    ['youtube.com/shorts', 'path'],
    ['reddit.com', 'domain'],
  ]) {
    await send('addEntry', { raw, kind });
  }
  await send('setSchedule', {
    schedule: {
      enabled: false,
      windows: [
        { days: [1, 2, 3, 4, 5], start: '09:00', end: '12:30' },
        { days: [1, 2, 3, 4, 5], start: '13:30', end: '18:00' },
      ],
    },
  });
  await send('setBlockMessage', { message: '' });
  // realistic-looking local stats for the last 7 days
  await page.evaluate(async () => {
    const C = self.FFCore;
    const days = {};
    const pattern = [
      { 'reddit.com': 9, 'x.com': 6, 'youtube.com/shorts': 7, 'news.ycombinator.com': 3 },
      { 'reddit.com': 7, 'x.com': 5, 'youtube.com/shorts': 4, 'facebook.com': 2 },
      { 'reddit.com': 6, 'x.com': 3, 'youtube.com/shorts': 5, 'news.ycombinator.com': 2 },
      { 'reddit.com': 5, 'x.com': 4, 'youtube.com/shorts': 2 },
      { 'reddit.com': 3, 'x.com': 2, 'youtube.com/shorts': 3, 'news.ycombinator.com': 1 },
      { 'reddit.com': 2, 'x.com': 2, 'youtube.com/shorts': 1 },
      { 'reddit.com': 2, 'x.com': 1, 'youtube.com/shorts': 1 },
    ];
    pattern.forEach((p, i) => {
      days[C.dayKey(Date.now() - (6 - i) * 864e5)] = p;
    });
    await chrome.storage.local.set({ stats: { days } });
  });
}

/* ------------------------------------------------------------------ website
 * --site: crisp 2x captures of the real UI for the website (docs/), in the dark and
 * light themes (the site follows the visitor's theme), encoded to WebP in the browser
 * (no image tooling needed), plus the localized 1200x630 Open Graph image.
 * Output: screenshots/site/<lang>/ (read by scripts/docs.mjs).
 */
function ogHtml(T) {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face{font-family:'InterOG';src:url('fonts/inter-opsz.woff2') format('woff2');font-weight:100 900}
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{width:1200px;height:630px;margin:0;overflow:hidden;position:relative;background:#08090A;color:#F3F5F4;
    font-family:InterOG,sans-serif;font-feature-settings:'cv11','ss01';-webkit-font-smoothing:antialiased}
  .light{position:absolute;inset:0;background:
    radial-gradient(560px 380px at 86% 62%, rgba(58,154,91,.26), transparent 70%),
    radial-gradient(900px 500px at 70% -10%, rgba(58,154,91,.08), transparent 70%)}
  .copy{position:absolute;left:72px;top:66px;width:496px}
  .brand{display:flex;align-items:center;gap:14px;font-weight:620;font-size:25px;letter-spacing:-.02em}
  .brand svg{border-radius:10px}
  .kicker{margin-top:64px;display:inline-flex;align-items:center;gap:10px;height:34px;padding:0 15px 0 13px;border-radius:999px;
    font-size:16px;font-weight:500;color:#C9D0CC;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);background:rgba(255,255,255,.03)}
  .kicker i{width:7px;height:7px;border-radius:50%;background:#3A9A5B;box-shadow:0 0 0 3px rgba(58,154,91,.22),0 0 12px 2px rgba(58,154,91,.6)}
  h1{margin:22px 0 0;font-size:68px;line-height:1;letter-spacing:-.046em;font-weight:620;text-wrap:balance}
  h1 em{font-style:normal;color:#8E9893}
  .foot{position:absolute;left:72px;bottom:56px;display:grid;gap:10px;font-size:17px;color:#8E9893;letter-spacing:-.01em}
  .foot span{display:flex;align-items:center;gap:9px}
  .foot svg{width:17px;height:17px;fill:none;stroke:#6CC58A;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .win{position:absolute;left:640px;top:84px;width:760px;border-radius:16px;overflow:hidden;background:#141917;
    box-shadow:0 0 0 1px rgba(255,255,255,.11),0 40px 90px rgba(0,0,0,.65)}
  .bar{height:34px;display:flex;align-items:center;gap:7px;padding:0 14px;background:#0E1211;border-bottom:1px solid rgba(255,255,255,.07)}
  .bar i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.13)}
  .win img{display:block;width:760px;height:475px}
  .pop{position:absolute;left:592px;top:300px;width:250px;border-radius:13px;overflow:hidden;
    box-shadow:0 0 0 1px rgba(255,255,255,.14),0 30px 70px rgba(0,0,0,.7),0 2px 8px rgba(0,0,0,.5)}
  .pop img{display:block;width:250px}
</style></head><body><div class="light"></div>
<div class="win"><div class="bar"><i></i><i></i><i></i></div><img src="og-block.png" alt=""></div>
<div class="pop"><img src="og-popup.png" alt=""></div>
<div class="copy"><div class="brand">${LOGO.replace(/SIZE/g, '44')}FocusFence</div>
<div class="kicker"><i></i>${T.eyebrow}</div><h1>${T.h1}</h1></div>
<div class="foot">${T.heroSmall.split(' · ').map((x) => `<span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>${x}</span>`).join('')}</div>
</body></html>`;
}

/**
 * One theme of the website images. The extension follows the system theme, so the
 * same seeded demo state is captured once in dark and once in light.
 * Dark files keep their plain names (name.webp); light ones get a suffix (name-light.webp).
 */
async function captureTheme(theme, SITE_OUT, written) {
  const { SITE } = await import('./site-strings.mjs');
  const OG_FONT = path.join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2');
  const sfx = theme === 'light' ? '-light' : '';
  const net = await startFakeInternet();
  const ext = await launchExtension({
    proxyPort: net.port,
    colorScheme: theme,
    deviceScaleFactor: 2,
    ...(LANG === 'en' ? {} : { lang: LANG }),
    mutate(mf, dir) {
      mf.content_security_policy.extension_pages = mf.content_security_policy.extension_pages.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
      fs.copyFileSync(OG_FONT, path.join(dir, 'fonts', 'inter-opsz.woff2'));
    },
  });
  const { context, base, extDir } = ext;
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
    // ---- a running focus session: the block page and the popup show the same moment, 18:42 left.
    // The countdowns tick, so each capture starts a little above 18:42 and waits for that exact value.
    await send('startPomodoro');
    const setLeft = (ms) =>
      api.evaluate(async (left) => {
        const { pomodoro } = await chrome.storage.local.get('pomodoro');
        pomodoro.endsAt = Date.now() + left;
        await chrome.storage.local.set({ pomodoro });
      }, ms);
    const LEFT = (18 * 60 + 42) * 1000;
    const waitFor = (pg, sel, text) =>
      pg.waitForFunction(([s, t]) => (document.querySelector(s)?.textContent || '').includes(t), [sel, text], { polling: 50, timeout: 10000 });
    // block page, 1280x800 CSS px (this visit is today's 5th blocked attempt), and a crop of its content
    await setLeft(LEFT + 2500);
    const blocked = await context.newPage();
    await blocked.setViewportSize({ width: 1280, height: 800 });
    await blocked.goto('https://www.reddit.com/r/all/');
    // the page fills itself in asynchronously (random quote, counts, session): once that is done,
    // pin the quote so every language and theme shows the same one
    await waitFor(blocked, '#session-text', ':');
    await blocked.evaluate(() => {
      document.getElementById('message').textContent = self.FFCore.quote(1);
    });
    await blocked.waitForTimeout(600); // entrance animation
    await waitFor(blocked, '#session-text', '18:42');
    // measured once the page is complete (the session line is shown), same frame as the capture
    const cardRect = await clipOf(blocked, 'main.wrap', 64, 44);
    const blockPng = await blocked.screenshot();
    await blocked.close();
    await webp(blockPng, 'block-page.webp');
    await webp(blockPng, 'block-page-1x.webp', { scale: 0.5 });
    await webp(blockPng, 'block-card.webp', { crop: cardRect });
    if (theme === 'dark') fs.writeFileSync(path.join(extDir, 'og-block.png'), blockPng);
    // popup (360 CSS px wide) and its focus-session card
    await setLeft(LEFT + 2500);
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 640 });
    await popup.goto(base + 'popup.html?tabId=' + tabId);
    await popup.waitForTimeout(300);
    const h = await popup.evaluate(() => Math.ceil(document.querySelector('.popup').getBoundingClientRect().height));
    await popup.setViewportSize({ width: 360, height: h });
    await waitFor(popup, '#focus-timer', '18:42');
    const popupPng = await popup.screenshot();
    const focusPng = await popup.screenshot({ clip: await clipOf(popup, '#focus-card', 1) });
    await popup.close();
    await webp(popupPng, 'popup.webp');
    await webp(focusPng, 'focus.webp');
    if (theme === 'dark') fs.writeFileSync(path.join(extDir, 'og-popup.png'), popupPng);
    await send('stopPomodoro');

    // ---- settings at 1280 px: the blocklist (full window) and the stats panel
    const opt = await context.newPage();
    await opt.setViewportSize({ width: 1280, height: 800 });
    await opt.goto(base + 'options.html');
    await hideIncognito(opt);
    await opt.waitForTimeout(600);
    const optPng = await opt.screenshot();
    await webp(optPng, 'blocklist.webp');
    await webp(optPng, 'blocklist-1x.webp', { scale: 0.5 });
    await opt.evaluate(() => document.getElementById('stats').scrollIntoView());
    await opt.waitForTimeout(300);
    await webp(await opt.screenshot({ clip: await clipOf(opt, '#stats', 24) }), 'stats.webp');
    // ---- settings at 900 px: compact cards for the feature crops
    await opt.setViewportSize({ width: 900, height: 800 });
    await opt.waitForTimeout(300);
    await opt.evaluate(() => document.getElementById('schedule').scrollIntoView());
    await opt.waitForTimeout(300);
    await webp(await opt.screenshot({ clip: await clipOf(opt, '#schedule .card', 1) }), 'schedule.webp');

    // ---- strict mode switched on ("until I unlock it": no date in the picture), 900 px window
    await send('startStrict', { hours: 0 });
    await opt.reload();
    await hideIncognito(opt);
    await opt.waitForTimeout(600);
    await opt.evaluate(() => document.getElementById('strict').scrollIntoView());
    await opt.waitForTimeout(300);
    await webp(await opt.screenshot({ clip: await clipOf(opt, '#strict-on', 1) }), 'strict.webp');

    // ---- Open Graph image, 1200x630, from the dark captures (PNG: the most widely supported format for link previews)
    if (theme === 'dark') {
      fs.writeFileSync(path.join(extDir, 'og.html'), ogHtml(SITE[LANG]));
      const og = await context.newPage();
      await og.setViewportSize({ width: 1200, height: 630 });
      await og.goto(base + 'og.html');
      await og.evaluate(() => document.fonts.ready);
      // Translations differ in length: shrink the headline until it clears the bottom list.
      await og.evaluate(() => {
        const h1 = document.querySelector('h1');
        const limit = document.querySelector('.foot').getBoundingClientRect().top - 36;
        let size = 68;
        while (h1.getBoundingClientRect().bottom > limit && size > 44) h1.style.fontSize = --size + 'px';
      });
      await og.waitForTimeout(400);
      fs.writeFileSync(path.join(SITE_OUT, 'og.png'), await og.screenshot({ scale: 'css' }));
      written.push('og.png');
    }
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

if (process.argv.includes('--site')) {
  await captureSite();
  process.exit(0);
}

const net = await startFakeInternet();
let frameQuery = '';
const ext = await launchExtension({
  proxyPort: net.port,
  colorScheme: DARK ? 'dark' : 'light',
  ...(LANG === 'en' ? {} : { lang: LANG }),
  mutate(mf, dir) {
    // the marketing compositions below use inline <style>; relax CSP in this throwaway copy only
    mf.content_security_policy.extension_pages = mf.content_security_policy.extension_pages.replace(
      "style-src 'self'",
      "style-src 'self' 'unsafe-inline'"
    );
    fs.writeFileSync(path.join(dir, 'promo.html'), promoHtml());
  },
});
const { context, base } = ext;
const suffix = DARK ? '-dark' : '';
try {
  const api = await context.newPage();
  await api.goto(base + 'options.html');
  const send = (type, payload = {}) =>
    api.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
  await seed(send, api);

  // a tab on a site that is not blocked yet, for the popup's "current site" row
  const insta = await context.newPage();
  await insta.goto('https://www.instagram.com/');
  const tabId = await api.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((t) => t.url && t.url.includes('instagram.com')).id;
  });
  frameQuery = `?tabId=${tabId}`;

  // ---- block page
  const blocked = await context.newPage();
  await blocked.setViewportSize({ width: 1280, height: 800 });
  await blocked.goto('https://www.reddit.com/r/all/');
  await blocked.evaluate(() => {
    document.getElementById('message').textContent = self.FFCore.quote(1); // same quote in every language
  });
  await blocked.waitForTimeout(700);
  await blocked.screenshot({ path: path.join(OUT, `block-page${suffix}.png`) });

  // ---- options page
  const opt = await context.newPage();
  await opt.setViewportSize({ width: 1280, height: 800 });
  await opt.goto(base + 'options.html');
  await opt.waitForTimeout(500);
  await opt.screenshot({ path: path.join(OUT, `options${suffix}.png`) });
  // The incognito warning depends on the viewer's Chrome settings; keep it out of marketing shots.
  await opt.addStyleTag({ content: '#incognito-warning{display:none!important}' });
  await opt.evaluate(() => document.getElementById('schedule').scrollIntoView());
  await opt.waitForTimeout(400);
  await opt.screenshot({ path: path.join(OUT, `options-schedule${suffix}.png`) });
  await opt.evaluate(() => document.getElementById('stats').scrollIntoView());
  await opt.waitForTimeout(400);
  await opt.screenshot({ path: path.join(OUT, `options-stats${suffix}.png`) });
  await opt.evaluate(() => document.getElementById('plan').scrollIntoView({ block: 'end' }));
  await opt.waitForTimeout(300);
  await opt.screenshot({ path: path.join(OUT, `options-plan${suffix}.png`) });
  await opt.screenshot({ path: path.join(OUT, `options-full${suffix}.png`), fullPage: true });

  // ---- popup (with a running focus session)
  await send('startPomodoro');
  await api.evaluate(async () => {
    const { pomodoro } = await chrome.storage.local.get('pomodoro');
    pomodoro.endsAt = Date.now() + (18 * 60 + 42) * 1000;
    await chrome.storage.local.set({ pomodoro });
  });
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 360, height: 600 });
  await popup.goto(base + 'popup.html' + frameQuery);
  await popup.waitForTimeout(500);
  const h = await popup.evaluate(() => document.querySelector('.popup').getBoundingClientRect().height);
  await popup.setViewportSize({ width: 360, height: Math.ceil(h) });
  await popup.screenshot({ path: path.join(OUT, `popup${suffix}.png`) });

  // ---- store screenshot with the popup in context
  fs.writeFileSync(
    path.join(ext.extDir, 'frame.html'),
    frameHtml({
      title: `<h1>${escHtml(CAPTIONS.popupFrame[LANG].pre)}<em>${escHtml(CAPTIONS.popupFrame[LANG].em)}</em></h1>`,
      body:
        `<p class="lead">${escHtml(shot('store-2-popup.png').sub)}</p>` +
        `<ul>${CAPTIONS.popupFrame[LANG].bullets.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul>`,
      popupQuery: frameQuery,
      popupHeight: Math.ceil(h),
    })
  );
  const frame = await context.newPage();
  await frame.setViewportSize({ width: 1280, height: 800 });
  await frame.goto(base + 'frame.html');
  await frame.waitForTimeout(900);
  await frame.screenshot({ path: path.join(OUT, `store-2-popup${suffix}.png`) });

  // ---- captioned store screenshots 1, 3, 4, 5 (texts from store/screenshots.json)
  for (const spec of SHOTS) {
    if (spec.file === 'store-2-popup.png') continue;
    await captioned(context, base, ext.extDir, spec);
  }

  // ---- promo tile
  if (!DARK) {
    const promo = await context.newPage();
    await promo.setViewportSize({ width: 440, height: 280 });
    await promo.goto(base + 'promo.html');
    await promo.waitForTimeout(400);
    await promo.evaluate(() => {
      const h2 = document.querySelector('h2');
      let size = 25;
      while (document.body.scrollHeight > 280 - 18 && size > 18) h2.style.fontSize = --size + 'px';
      const inner = document.querySelector('.in');
      while (inner.getBoundingClientRect().bottom > 262 && size > 16) h2.style.fontSize = --size + 'px';
    });
    await promo.screenshot({ path: path.join(OUT, 'promo-tile-440x280.png') });
  }
  console.log('screenshots written to', OUT);
} finally {
  await ext.close();
  await net.close();
}
