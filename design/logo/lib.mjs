// Shared rendering helpers for the logo boards (Chromium via Playwright).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const require = createRequire(path.join(REPO, 'focusfence/package.json'));
const { chromium } = require('@playwright/test');

/** Full SVG document for a mark. size 128 gets the 16 px store margin. */
export function svgDoc(children, size) {
  const vb = size === 128 ? '-2.6667 -2.6667 21.3333 21.3333' : '0 0 16 16';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}">${children}</svg>`;
}
export const dataUri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

export async function withPage(fn, { width = 1600, height = 1000 } = {}) {
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    return await fn(page);
  } finally {
    await browser.close();
  }
}

/** Rasterize an SVG at its own size, returns a PNG buffer (transparent). */
export async function rasterize(page, svg, size) {
  await page.setContent(`<body style="margin:0;background:transparent"><img id="i" src="${dataUri(svg)}" width="${size}" height="${size}"></body>`);
  await page.waitForFunction(() => document.getElementById('i').complete);
  return page.locator('#i').screenshot({ omitBackground: true });
}

const FONT = 'data:font/woff2;base64,' + fs.readFileSync(path.join(REPO, 'focusfence/src/fonts/inter-var-latin.woff2')).toString('base64');
export const FONT_CSS = `@font-face{font-family:Inter;src:url(${FONT}) format('woff2');font-weight:100 900}`;

