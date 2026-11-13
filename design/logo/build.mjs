// Renders the logo exploration sheets and presentation boards with Chromium.
// Usage (from the repo root):
//   FF_CHROME_LIBS=... node design/logo/build.mjs explore <out.png> [ids...]
//   FF_CHROME_LIBS=... node design/logo/build.mjs boards [n...]
// Playwright is resolved from focusfence/node_modules.
import { svgDoc, dataUri, withPage, rasterize } from './lib.mjs';

async function explore(out, ids) {
  const { CANDIDATES } = await import('./marks.mjs?' + Date.now());
  ids = ids.length ? ids : Object.keys(CANDIDATES);
  await withPage(async (page) => {
    const rows = [];
    for (const id of ids) {
      const m = CANDIDATES[id];
      const zoom = (await rasterize(page, svgDoc(m(), 16), 16)).toString('base64');
      const zoomMono = (await rasterize(page, svgDoc(m({ ink: '#000', mono: '#000' }), 16), 16)).toString('base64');
      const cell = (bg) =>
        `<div style="background:${bg};display:flex;align-items:center;gap:18px;padding:14px 18px;border-radius:10px">` +
        [128, 48, 32, 16].map((s) => `<img src="${dataUri(svgDoc(m(), s))}" width="${s}" height="${s}">`).join('') +
        `<img src="data:image/png;base64,${zoom}" width="128" height="128" style="image-rendering:pixelated">` +
        `</div>`;
      rows.push(
        `<div style="display:flex;gap:14px;align-items:center"><b style="width:40px">${id}</b>${cell('#fff')}${cell('#35363A')}` +
          `<img src="data:image/png;base64,${zoomMono}" width="64" height="64" style="image-rendering:pixelated;background:#fff;padding:8px"></div>`
      );
    }
    await page.setViewportSize({ width: 1500, height: 40 + rows.length * 190 });
    await page.setContent(`<body style="margin:0;padding:20px;background:#ddd;font:16px sans-serif;display:grid;gap:14px">${rows.join('')}</body>`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: out, fullPage: true });
  });
  console.log('explore ->', out);
}

const [mode, ...rest] = process.argv.slice(2);
if (mode === 'explore') await explore(rest[0], rest.slice(1));
else if (mode === 'boards') await (await import('./boards.mjs')).buildBoards(rest.length ? rest.map(Number) : undefined);
