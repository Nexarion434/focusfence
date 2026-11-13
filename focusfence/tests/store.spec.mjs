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
