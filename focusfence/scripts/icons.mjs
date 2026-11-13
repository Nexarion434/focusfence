// Renders the FocusFence logo SVG to PNG icons (16/32/48/128) with headless Chromium.
import { chromium } from 'playwright';
import path from 'node:path';
import { ROOT } from './launch.mjs';

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
<rect width="32" height="32" rx="${size <= 16 ? 7 : 9}" fill="#2E7D6B"/>
<rect x="6" y="13" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/>
<rect x="6" y="19" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/>
<path d="M8.5 10.2 10.5 7l2 3.2V25h-4zM14 10.2 16 7l2 3.2V25h-4zM19.5 10.2 21.5 7l2 3.2V25h-4z" fill="#fff"/></svg>`;

const env = Object.assign({}, process.env);
if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
const browser = await chromium.launch({ env });
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  // 128px store icon: 96px artwork with 16px transparent padding (Chrome Web Store guideline)
  const art = size === 128 ? 112 : size;
  const pad = (size - art) / 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div style="padding:${pad}px">${svg(art)}</div></body></html>`
  );
  await page.screenshot({ path: path.join(ROOT, 'src/icons', `icon${size}.png`), omitBackground: true });
}
await browser.close();
console.log('icons written');
