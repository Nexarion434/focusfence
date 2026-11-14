// First-screen captures of the website (docs/) for design and copy reviews, at 2x:
//   <lang>-desktop-<theme>-first-screen@2x.png  1440x900
//   <lang>-mobile-<theme>-first-screen@2x.png   390x844
// plus og-all-languages.png, the four Open Graph images side by side.
// docs/ is served over HTTP, as on focusfence.dev. Run npm run docs (and npm run site:art) first.
// Usage: npm run site:shots -- --out <dir> [--lang en,fr]   (default: ../design/seo-copy/screenshots, en and fr)
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT } from './launch.mjs';
import { SITE_LANGS } from './site-strings.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};
const DOCS = path.resolve(ROOT, '..', 'docs');
const OUT = path.resolve(arg('--out') || path.join(ROOT, '..', 'design', 'seo-copy', 'screenshots'));
const LANGS = (arg('--lang') || 'en,fr').split(',');
fs.mkdirSync(OUT, { recursive: true });

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = path.join(DOCS, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(DOCS) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }).end(fs.readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}/`;

const env = { ...process.env };
if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
const browser = await chromium.launch({ env });
const written = [];
try {
  for (const lang of LANGS) {
    for (const [device, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      for (const theme of ['dark', 'light']) {
        // reduced motion: every block in its final state, as a reader sees it once it has settled
        const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        await page.goto(origin + (lang === 'en' ? '' : lang + '/'));
        await page.evaluate(() => document.fonts.ready);
        // the images of the page's theme that are on screen, decoded
        await page.evaluate(() =>
          Promise.all(
            [...document.images]
              .filter((i) => i.offsetParent !== null && i.getBoundingClientRect().top < innerHeight)
              .map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => i.addEventListener('load', r, { once: true }))))
          )
        );
        await page.waitForTimeout(300);
        const file = `${lang}-${device}-${theme}-first-screen@2x.png`;
        await page.screenshot({ path: path.join(OUT, file) });
        written.push(file);
        await ctx.close();
      }
    }
  }
  // the Open Graph images, 2 x 2, at half size
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const cells = SITE_LANGS.map((l) => `<img src="data:image/jpeg;base64,${fs.readFileSync(path.join(DOCS, 'assets', l, 'og.jpg')).toString('base64')}">`).join('');
  await og.setContent(`<body style="margin:0;display:grid;grid-template-columns:600px 600px;background:#000">${cells.replace(/<img /g, '<img style="width:600px;height:315px;display:block" ')}</body>`);
  await og.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await og.screenshot({ path: path.join(OUT, 'og-all-languages.png') });
  written.push('og-all-languages.png');
} finally {
  await browser.close();
  server.close();
}
console.log('screenshots written to', OUT, '\n ', written.join(' '));
