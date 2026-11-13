// Store-readiness checks: listing limits, manifest consistency, screenshot assets.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/launch.mjs';
import { S } from '../scripts/i18n/strings.mjs';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pngSize = (f) => {
  const b = fs.readFileSync(path.join(ROOT, f));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test('manifest is localized and each store listing matches its locale', () => {
  const mf = JSON.parse(read('src/manifest.json'));
  expect(mf.default_locale).toBe('en');
  expect(mf.name).toBe('__MSG_extName__');
  expect(mf.description).toBe('__MSG_extDescription__');
  for (const [lang, file] of [['en', 'store/listing.md'], ['fr', 'store/listing.fr.md'], ['es', 'store/listing.es.md'], ['de', 'store/listing.de.md']]) {
    const listing = read(file);
    expect(S.extName[lang].length, lang).toBeLessThanOrEqual(75);
    expect(S.extDescription[lang].length, lang).toBeLessThanOrEqual(132);
    expect(listing, file + ' title').toContain('\n' + S.extName[lang] + '\n');
    expect(listing, file + ' short description').toContain('\n' + S.extDescription[lang] + '\n');
  }
});

test('five 1280x800 store screenshots + 440x280 promo tile per language, captions documented', () => {
  const { shots, promo } = JSON.parse(read('store/screenshots.json'));
  const plan = read('store/screenshots.md');
  expect(shots).toHaveLength(5);
  for (const lang of ['en', 'fr', 'es', 'de']) {
    const dir = lang === 'en' ? 'screenshots/' : `screenshots/${lang}/`;
    for (const s of shots) {
      expect(pngSize(dir + s.file), dir + s.file).toEqual([1280, 800]);
      expect(plan, `${lang} headline in plan`).toContain(s.text[lang].headline);
    }
    expect(pngSize(dir + 'promo-tile-440x280.png'), lang).toEqual([440, 280]);
    expect(promo[lang].headline).toBeTruthy();
  }
  expect(pngSize('src/icons/icon128.png')).toEqual([128, 128]);
});

test('CWS submission checklist: every permission justified (≤ 1000 chars), values match manifest, listing and config', () => {
  const doc = read('store/cws-submission.md');
  const mf = JSON.parse(read('src/manifest.json'));
  const block = (label) => {
    const m = new RegExp('\\*\\*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\*[^\\n]*\\n```\\n([\\s\\S]*?)\\n```').exec(doc);
    return m && m[1];
  };
  for (const p of mf.permissions) {
    const j = block(p);
    expect(j, `justification for ${p}`).toBeTruthy();
    expect(j.length, p).toBeLessThanOrEqual(1000);
  }
  const host = block('Host permission');
  expect(host.length).toBeLessThanOrEqual(1000);
  for (const h of [...mf.optional_host_permissions, ...mf.content_scripts.flatMap((c) => c.matches)]) expect(host).toContain(h);
  const single = /## Single purpose description\n\n```\n([\s\S]*?)\n```/.exec(doc)[1];
  expect(single.length).toBeLessThanOrEqual(1000);
  expect(read('store/listing.md')).toContain(single);
  const privacyUrl = /PRIVACY_URL: '([^']+)'/.exec(read('src/config.js'))[1];
  expect(doc).toContain('```\n' + privacyUrl + '\n```');
  expect(doc).toContain(S.extName.en);
});

test('no estimated "time saved / reclaimed" claims anywhere users can see them', () => {
  // The extension only knows real blocked counts; any minutes-saved figure would be made up.
  const claim = /minutes?\s*saved|time\s*(saved|reclaimed)|reclaim|MINUTES_SAVED|minutesSaved|temps\s*(regagné|gagné|récupéré)|regagn|tiempo\s*(recuperado|ahorrado)|ahorrado|gewonnene?n?\s*Zeit|Zeit\s*(gewonnen|gespart|zurück)|zurückgewinn/i;
  const REPO = path.resolve(ROOT, '..');
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|mjs|html|json|md|css)$/.test(e.name)) files.push(p);
    }
  };
  for (const d of ['focusfence/src', 'focusfence/store', 'docs', 'marketing']) walk(path.join(REPO, d));
  files.push(path.join(ROOT, 'scripts/i18n/strings.mjs'), path.join(ROOT, 'scripts/site-strings.mjs'), path.join(ROOT, 'README.md'));
  const hits = files.flatMap((f) =>
    fs.readFileSync(f, 'utf8').split('\n').flatMap((line, i) => (claim.test(line) ? [`${path.relative(REPO, f)}:${i + 1}: ${line.trim().slice(0, 100)}`] : []))
  );
  expect(hits).toEqual([]);
});

test('icons are the chosen Picket F logo, rendered from the shared SVG, crisp at 16 px', async () => {
  const { chromium } = await import('@playwright/test');
  const { LOGO_SVG, iconSvg } = await import('../scripts/icons.mjs');
  // exact geometry picked by the owner (design/logo direction 1, commit 8e87f19)
  expect(LOGO_SVG).toContain('viewBox="0 0 16 16"');
  expect(LOGO_SVG).toContain('<rect x="0" y="0" width="16" height="16" rx="3.5" fill="#3A9A5B"/>');
  expect(LOGO_SVG).toContain('<polygon points="4,14 4,3.5 5.5,2 7,3.5 7,5 12,5 12,7 7,7 7,9 11,9 11,11 7,11 7,14" fill="#FFFFFF"/>');
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const size of [16, 32, 48, 128]) {
      const uri = 'data:image/svg+xml;base64,' + Buffer.from(iconSvg(size)).toString('base64');
      await page.setContent(`<body style="margin:0;background:transparent"><img id="i" src="${uri}" width="${size}" height="${size}"></body>`);
      await page.waitForFunction(() => document.getElementById('i').complete);
      const fresh = await page.locator('#i').screenshot({ omitBackground: true });
      expect(fresh.equals(fs.readFileSync(path.join(ROOT, `src/icons/icon${size}.png`))), `icon${size}.png matches the logo SVG`).toBe(true);
    }
    // 16 px crispness: the F's vertical/horizontal edges are pure white or pure tile green, no grey seams
    await page.setContent(`<canvas id="c" width="16" height="16"></canvas>`);
    const bad = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const ctx = document.getElementById('c').getContext('2d');
      ctx.drawImage(img, 0, 0);
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data).slice(0, 3).join(',');
      const out = [];
      // stem column x=4..6 between y=4..13, top arm row y=5..6 x=7..11, middle arm y=9..10 x=7..10: all white
      for (let y = 4; y < 14; y++) for (let x = 4; x < 7; x++) if (px(x, y) !== '255,255,255') out.push(`stem ${x},${y}=${px(x, y)}`);
      for (const [y0, x1] of [[5, 12], [9, 11]]) for (let y = y0; y < y0 + 2; y++) for (let x = 7; x < x1; x++) if (px(x, y) !== '255,255,255') out.push(`arm ${x},${y}=${px(x, y)}`);
      // pixels just outside those edges are pure tile green
      for (const [x, y] of [[3, 8], [7, 4], [12, 5], [11, 9], [7, 12], [7, 8]]) if (px(x, y) !== '58,154,91') out.push(`tile ${x},${y}=${px(x, y)}`);
      return out;
    }, 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'src/icons/icon16.png')).toString('base64'));
    expect(bad).toEqual([]);
  } finally {
    await browser.close();
  }
});
