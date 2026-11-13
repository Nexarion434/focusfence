// Captures UI screenshots + Chrome Web Store assets.
// Usage: npm run screenshots                       English  -> ./screenshots/
//        node scripts/screenshots.mjs --lang fr    French   -> ./screenshots/fr/  (also es, de)
//        npm run screenshots:all                   all four languages
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
<div class="copy"><div class="brand">${LOGO.replace(/SIZE/g, '34')}FocusFence</div>${title}${body}</div>
<div class="device"><div class="chrome"><i></i><i></i><i></i><span class="url">instagram.com</span><span class="ext">${LOGO.replace(/SIZE/g, '18')}</span></div>
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
<div class="cap"><div class="kicker">${LOGO.replace(/SIZE/g, '22')}${escHtml(kicker)}</div><h1>${escHtml(headline)}</h1><p>${escHtml(sub)}</p></div>
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
  body{width:440px;height:280px;margin:0;overflow:hidden;background:#2E7D6B;color:#fff;position:relative;font-family:Inter,sans-serif}
  .glow{position:absolute;inset:0;background:radial-gradient(320px 220px at 85% 10%, rgba(255,255,255,.18), transparent 70%),radial-gradient(260px 200px at 0% 100%, rgba(0,0,0,.18), transparent 70%)}
  .fence{position:absolute;left:0;right:0;bottom:0;height:86px;background:repeating-linear-gradient(90deg, transparent 0 22px, rgba(255,255,255,.10) 22px 34px);mask-image:linear-gradient(to top,#000 10%,transparent)}
  .in{position:relative;padding:34px 34px}
  .brand{display:flex;align-items:center;gap:12px;font-weight:750;font-size:30px;letter-spacing:-.03em}
  .brand svg rect:first-child{fill:#fff}
  .brand svg path{fill:#2E7D6B}
  .brand svg rect:not(:first-child){fill:#9BCBBB}
  h2{font-size:25px;line-height:1.15;letter-spacing:-.025em;font-weight:720;margin:24px 0 10px;max-width:340px}
  p{font-size:14px;opacity:.85;margin:0}
  .pill{position:absolute;right:28px;top:36px;font-size:11px;font-weight:700;letter-spacing:.08em;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.16)}
</style></head><body><div class="glow"></div><div class="fence"></div>
<div class="in"><div class="brand">${LOGO.replace(/SIZE/g, '44')}FocusFence</div>
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
