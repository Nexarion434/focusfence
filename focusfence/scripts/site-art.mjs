// The website's own artwork, rendered with headless Chromium from the site's stylesheet
// (scripts/site.css) and the logo, so it always matches the site:
//   site-art/og-<lang>.jpg           Open Graph / X card, 1200x630, one per language: the page's
//                                    closing scene (the extension's glass-pill fence on its glossy
//                                    floor, the middle pill holding the light) under the hero's
//                                    words. JPEG at quality 90: no visible difference from a PNG at a
//                                    sixth of the weight (about 55 KB against 350 KB), well under the
//                                    ~300 KB some apps (WhatsApp) accept for a link preview.
//   site-art/apple-touch-icon.png    180x180, full bleed (iOS rounds the corners itself)
//   site-art/icon-192.png, icon-512.png  the logo tile, for the web manifest
//   site-art/icon-maskable-512.png   full bleed, the mark inside the maskable safe zone
// scripts/docs.mjs copies them into docs/assets. Usage: npm run site:art (then npm run docs)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './launch.mjs';
import { SITE, SITE_LANGS } from './site-strings.mjs';
import { LOGO, LOGO_SVG, FENCE } from './site-parts.mjs';

const OUT = path.join(ROOT, 'site-art');
const FONT = path.join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2');
if (!fs.existsSync(FONT)) throw new Error(`${FONT} is missing: run npm install`);
// The page is set from a string (no origin), so the font is inlined rather than fetched.
const CSS = fs
  .readFileSync(path.join(ROOT, 'scripts/site.css'), 'utf8')
  .replace("url('inter.woff2')", `url('data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}')`);

/* ------------------------------------------------------------- Open Graph */
// The card is the site's dark theme (its base design): the closing section (.final) at 1200x630, with
// the fence a little smaller than on a wide screen so the words fit above it. Everything but the
// layout comes from site.css: colours, type, the eyebrow, the ticks, the pills, the halo and the floor.
const OG_CSS = `
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--bg); }
  .final.og { --floor-h: 86px; --pw: 92px; box-sizing: border-box; width: 1200px; height: 630px; padding: 0; }
  .og .scene { position: absolute; left: 0; right: 0; bottom: 0; margin: 0; }
  .og-copy { position: absolute; z-index: 5; top: 50px; left: 60px; right: 60px; display: grid; justify-items: center; }
  .og-brand { display: flex; align-items: center; gap: 14px; color: var(--text); font-size: 30px; font-weight: 620; letter-spacing: -0.02em; }
  .og .eyebrow { margin-top: 26px; height: 38px; gap: 12px; padding: 0 18px 0 15px; font-size: 18px; }
  .og .eyebrow-dot { width: 8px; height: 8px; }
  .og-h { margin-top: 22px; max-width: 1080px; font-size: 72px; font-weight: 620; line-height: 1.02; letter-spacing: -0.045em; text-wrap: balance; }
  .og-h em { font-style: normal; color: var(--dim); }
  .og .ticks { justify-content: center; margin-top: 26px; gap: 10px 30px; font-size: 19px; }
  .og .ticks .i { width: 20px; height: 20px; }
`;
const ogHtml = (lang) => {
  const T = SITE[lang];
  const ticks = T.heroSmall
    .split(' · ')
    .map((t) => `<li><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>${t}</li>`)
    .join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${CSS}${OG_CSS}</style></head><body>
<section class="final og">
  <div class="og-copy">
    <p class="og-brand">${LOGO(52)}<span>FocusFence</span></p>
    <p class="eyebrow"><span class="eyebrow-dot"></span>${T.eyebrow}</p>
    <h1 class="og-h">${T.h1}</h1>
    <ul class="ticks">${ticks}</ul>
  </div>
  <div class="scene"><div class="floor"></div>${FENCE('fence mirror')}${FENCE('fence')}<span class="fence-pool"></span></div>
</section></body></html>`;
};

/* ------------------------------------------------------------------ icons */
const MARK = /<polygon[^>]*\/>/.exec(LOGO_SVG)[0];
const GREEN = /<rect[^>]*fill="([^"]+)"/.exec(LOGO_SVG)[1];
const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 16 16">${inner}</svg>`;
const ICONS = {
  // the logo tile, rounded, on transparency
  'icon-192.png': [192, LOGO_SVG.replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"')],
  'icon-512.png': [512, LOGO_SVG.replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"')],
  // full bleed: the platform applies its own mask
  'apple-touch-icon.png': [180, svg(`<rect width="16" height="16" fill="${GREEN}"/>${MARK}`)],
  // the mark scaled into the maskable safe zone (a circle of 40 % radius)
  'icon-maskable-512.png': [512, svg(`<rect width="16" height="16" fill="${GREEN}"/><g transform="translate(8 8) scale(0.78) translate(-8 -8)">${MARK}</g>`)],
};

const env = { ...process.env };
if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
const browser = await chromium.launch({ env });
try {
  fs.mkdirSync(OUT, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const lang of SITE_LANGS) {
    await page.setContent(ogHtml(lang), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // Translations differ in length: one line if it fits at 60 px or more, else two balanced lines.
    const fit = await page.evaluate(() => {
      const h = document.querySelector('.og-h');
      const lines = () => Math.round(h.getBoundingClientRect().height / (parseFloat(getComputedStyle(h).fontSize) * 1.02));
      let size = 72;
      while (lines() > 1 && size > 60) h.style.fontSize = --size + 'px';
      if (lines() > 1) h.style.fontSize = (size = 66) + 'px';
      // the words stay clear of the fence: the ticks end above the middle pill
      const ticks = document.querySelector('.og .ticks').getBoundingClientRect().bottom;
      const pill = document.querySelector('.og .fence:not(.mirror) .pill.lit').getBoundingClientRect().top;
      return { size, lines: lines(), clearance: Math.round(pill - ticks) };
    });
    if (fit.clearance < 12) throw new Error(`og-${lang}: the words run into the fence (${JSON.stringify(fit)})`);
    await page.screenshot({ path: path.join(OUT, `og-${lang}.jpg`), type: 'jpeg', quality: 90 });
    console.log(`og-${lang}.jpg`, fit);
  }
  for (const [file, [size, art]] of Object.entries(ICONS)) {
    const uri = 'data:image/svg+xml;base64,' + Buffer.from(art.replace(/SIZE/g, String(size))).toString('base64');
    await page.setContent(`<body style="margin:0;background:transparent"><img id="i" src="${uri}" width="${size}" height="${size}"></body>`);
    await page.waitForFunction(() => document.getElementById('i').complete);
    await page.locator('#i').screenshot({ path: path.join(OUT, file), omitBackground: true });
    console.log(file);
  }
} finally {
  await browser.close();
}
console.log('site art written to', OUT);
