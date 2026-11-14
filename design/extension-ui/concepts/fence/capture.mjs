// Round 3 fence explorations. Draws each direction on the real block page (light and dark), a
// popup-scale board for each (6 sites, 1 site, 16 sites, blocking off), and the two extra light-mode
// studies for the lantern (dawn, glass), into design/extension-ui/screenshots/fence-explorations/.
// The block page's copy, buttons and type are the shipping ones; only the scene is swapped.
// Usage (from the repo root; FF_CHROME_LIBS as for the tests):
//   node design/extension-ui/concepts/fence/capture.mjs [--only lantern,hairline] [--out <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const { launchExtension, startFakeInternet } = await import(path.join(REPO, 'focusfence/scripts/launch.mjs'));
const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const OUT = arg('--out') ? path.resolve(arg('--out')) : path.join(REPO, 'design/extension-ui/screenshots/fence-explorations');
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const want = (id) => !ONLY || ONLY.includes(id);
const DIRECTIONS = ['lantern', 'hairline', 'extruded', 'horizon'].filter(want);
const STUDIES = ['dawn', 'glass'].filter((s) => want('lantern') || want('lantern-' + s));
const SCRIPT = fs.readFileSync(path.join(HERE, 'directions.js'), 'utf8');
const FONT = fs.readFileSync(path.join(REPO, 'focusfence/src/fonts/inter-var-latin.woff2')).toString('base64');
const BASE_CSS = fs.readFileSync(path.join(REPO, 'focusfence/src/styles/base.css'), 'utf8').replace(
  "url('../fonts/inter-var-latin.woff2')",
  `url(data:font/woff2;base64,${FONT})`
);
fs.mkdirSync(OUT, { recursive: true });

const STATS = [
  { 'reddit.com': 9, 'x.com': 6, 'youtube.com': 7, 'news.ycombinator.com': 3 },
  { 'reddit.com': 7, 'x.com': 5, 'youtube.com': 4, 'facebook.com': 2 },
  { 'reddit.com': 6, 'x.com': 3, 'youtube.com': 5, 'news.ycombinator.com': 2 },
  { 'reddit.com': 5, 'x.com': 4, 'youtube.com': 2 },
  { 'reddit.com': 3, 'x.com': 2, 'youtube.com': 3, 'news.ycombinator.com': 1 },
  { 'reddit.com': 2, 'x.com': 2, 'youtube.com': 1 },
  { 'reddit.com': 2, 'x.com': 1, 'youtube.com': 1 },
];

const net = await startFakeInternet();
const ext = await launchExtension({ proxyPort: net.port, grantAll: true, deviceScaleFactor: 2 });
try {
  const api = await ext.context.newPage();
  await api.goto(ext.base + 'options.html');
  const send = (type, payload = {}) => api.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
  for (const host of ['news.ycombinator.com', 'facebook.com', 'x.com', 'youtube.com', 'reddit.com']) await send('addEntry', { raw: host, kind: 'domain' });
  // the same counts on every render (each visit to the block page records an attempt)
  const resetStats = () =>
    api.evaluate(async (pattern) => {
      const C = self.FFCore;
      const days = {};
      pattern.forEach((p, i) => (days[C.dayKey(Date.now() - (6 - i) * 864e5)] = p));
      await chrome.storage.local.set({ stats: { days } });
    }, STATS);

  async function blockPage(id, theme, file) {
    await resetStats();
    const p = await ext.context.newPage();
    await p.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await p.setViewportSize({ width: 1280, height: 800 });
    await p.goto('https://www.reddit.com/r/all/');
    await p.waitForTimeout(600);
    await p.evaluate(() => (document.getElementById('message').textContent = self.FFCore.quote(1)));
    await p.evaluate(SCRIPT);
    await p.evaluate(([i, t]) => self.mountFenceDirection(i, t), [id, theme]);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(OUT, file), scale: 'css' });
    await p.close();
  }

  for (const id of DIRECTIONS) for (const theme of ['light', 'dark']) await blockPage(id, theme, `${id}-block-${theme}.png`);
  for (const s of STUDIES) await blockPage('lantern-' + s, 'light', `lantern-light-study-${s}.png`);

  // Popup-scale boards: each direction at popup size (2x), light and dark side by side.
  const board = await ext.context.newPage();
  await board.setViewportSize({ width: 820, height: 600 });
  for (const id of DIRECTIONS) {
    const html = (theme) => `
      <div class="col ${theme}">
        <p class="cap">${theme}</p>
        ${[
          [['R', 'Y', 'X', 'F', 'N', '#'], 'up', 'Blocking is on', '6 sites fenced'],
          [['R'], 'up', 'Blocking is on', '1 site fenced'],
          [['R', 'Y', 'X', 'F', 'N', '#', 'I', 'T', 'N', 'L', 'P', 'G'], 'up', 'Blocking is on', '16 sites fenced', '+4'],
          [['R', 'Y', 'X', 'F', 'N', '#'], 'down', 'Blocking is off', '6 sites, not blocked'],
        ]
          .map(
            ([letters, state, title, sub, more]) => `
          <div class="pop"><div class="stage"><div class="row" data-letters="${letters.join('')}" data-state="${state}" data-theme="${theme}"></div>${more ? `<span class="more">${more}</span>` : ''}</div>
          <div class="state"><div><h2>${title}</h2><p>${sub}</p></div><span class="sw ${state === 'down' ? 'off' : ''}"></span></div></div>`
          )
          .join('')}
      </div>`;
    await board.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
      body{margin:0;display:flex;background:#888}
      .col{flex:1;padding:18px 20px 22px;display:flex;flex-direction:column;gap:14px;align-items:center}
      .col.light{background:#f6f7f6;color:#111513}
      .col.dark{background:#0a0c0b;color:#f1f4f2;color-scheme:dark}
      .cap{font:500 11px/1 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;opacity:.55;align-self:flex-start}
      .pop{width:360px;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 1px rgba(0,0,0,.06)}
      .light .pop{background:#fff}.dark .pop{background:#111413;box-shadow:0 0 0 1px rgba(255,255,255,.07)}
      .stage{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:6px;padding:12px 16px 0;height:76px}
      .more{font:600 12px/1 Inter;opacity:.6;margin:0 0 14px -12px}
      .state{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 12px}
      .state h2{font-size:15px;line-height:20px;font-weight:620;letter-spacing:-.018em}
      .state p{font-size:12px;opacity:.65}
      .sw{width:34px;height:20px;border-radius:99px;background:#287743;position:relative}
      .dark .sw{background:#5dbe7e}
      .sw.off{background:#868f8b}.dark .sw.off{background:#5e6863}
      .sw::after{content:'';position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff}
      .sw.off::after{right:auto;left:2px}
      </style></head><body>${html('light')}${html('dark')}</body></html>`);
    await board.evaluate(SCRIPT);
    await board.evaluate((dirId) => {
      document.querySelectorAll('.row').forEach((row, i) => {
        const svg = self.FENCE_DIRECTIONS[dirId].row({ letters: [...row.dataset.letters], state: row.dataset.state, theme: row.dataset.theme });
        // ids inside each SVG must be unique in the page
        row.innerHTML = svg.replace(/id="([^"]+)"/g, `id="$1_${i}"`).replace(/url\(#([^)]+)\)/g, `url(#$1_${i})`).replace(/href="#([^"]+)"/g, `href="#$1_${i}"`);
      });
    }, id);
    await board.evaluate(() => document.fonts.ready);
    const h = await board.evaluate(() => document.body.scrollHeight);
    await board.setViewportSize({ width: 820, height: h });
    await board.screenshot({ path: path.join(OUT, `${id}-popup-scale.png`) });
  }
  console.log(`${fs.readdirSync(OUT).length} files in ${path.relative(process.cwd(), OUT)}`);
} finally {
  await ext.close();
  await net.close();
}
