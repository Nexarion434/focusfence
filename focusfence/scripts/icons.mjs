// Renders the FocusFence logo (the LOGO_SVG in src/lib/ui.js) to the PNG icons
// 16/32/48/128 with headless Chromium. The 128 px store icon is the art at 96 px
// inside a 16 px transparent margin (Chrome Web Store guideline); because the
// mark sits on a 16-unit grid, every edge lands on a whole pixel at all sizes.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './launch.mjs';

export const LOGO_SVG = fs
  .readFileSync(path.join(ROOT, 'src/lib/ui.js'), 'utf8')
  .match(/const LOGO_SVG =\s*([\s\S]*?);\n/)[1]
  .split('\n')
  .map((l) => l.trim().replace(/^\+?\s*'/, '').replace(/'\s*\+?$/, ''))
  .join('')
  .replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"');

export const iconSvg = (size) =>
  LOGO_SVG.replace(/SIZE/g, String(size)).replace('viewBox="0 0 16 16"', size === 128 ? 'viewBox="-2.6667 -2.6667 21.3333 21.3333"' : 'viewBox="0 0 16 16"');

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const env = Object.assign({}, process.env);
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 32, 48, 128]) {
    const uri = 'data:image/svg+xml;base64,' + Buffer.from(iconSvg(size)).toString('base64');
    await page.setContent(`<body style="margin:0;background:transparent"><img id="i" src="${uri}" width="${size}" height="${size}"></body>`);
    await page.waitForFunction(() => document.getElementById('i').complete);
    await page.locator('#i').screenshot({ path: path.join(ROOT, 'src/icons', `icon${size}.png`), omitBackground: true });
  }
  await browser.close();
  console.log('icons written');
}
