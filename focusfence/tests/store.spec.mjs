// Store-readiness checks: listing limits, manifest consistency, screenshot assets.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/launch.mjs';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pngSize = (f) => {
  const b = fs.readFileSync(path.join(ROOT, f));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test('listing title and short description match the manifest and store limits', () => {
  const mf = JSON.parse(read('src/manifest.json'));
  const listing = read('store/listing.md');
  expect(mf.name.length).toBeLessThanOrEqual(75);
  expect(mf.description.length).toBeLessThanOrEqual(132);
  expect(listing).toContain('\n' + mf.name + '\n');
  expect(listing).toContain('\n' + mf.description + '\n');
});

test('five 1280x800 store screenshots + 440x280 promo tile, captions documented', () => {
  const { shots } = JSON.parse(read('store/screenshots.json'));
  const plan = read('store/screenshots.md');
  expect(shots).toHaveLength(5);
  for (const s of shots) {
    expect(pngSize('screenshots/' + s.file), s.file).toEqual([1280, 800]);
    expect(plan).toContain(s.headline);
    expect(plan).toContain(s.sub);
  }
  expect(pngSize('screenshots/promo-tile-440x280.png')).toEqual([440, 280]);
  expect(pngSize('src/icons/icon128.png')).toEqual([128, 128]);
});
