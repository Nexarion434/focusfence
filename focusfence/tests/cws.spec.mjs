// Chrome Web Store readiness of the final zip: the validator passes on the real
// package, the extracted zip itself loads and works, and the validator catches
// the usual rejection causes (so a green result means something).
import { test, expect, outcome } from './fixtures.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, launchExtension } from '../scripts/launch.mjs';
import { checkZip } from '../scripts/cws-check.mjs';
import { readZip, writeZip } from '../scripts/zip.mjs';

const ZIP = path.join(ROOT, 'dist/focusfence-1.0.0.zip');

function extract(zip) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusfence-zip-'));
  for (const { name, data } of readZip(zip)) {
    fs.mkdirSync(path.join(dir, path.dirname(name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), data);
  }
  return dir;
}
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])).sort();

/** Build a broken variant of the package and return the validator's errors. */
function brokenErrors(mutate) {
  const dir = extract(ZIP);
  mutate(dir);
  const zip = path.join(os.tmpdir(), `focusfence-broken-${process.pid}-${Math.random().toString(36).slice(2)}.zip`);
  writeZip(walk(dir), dir, zip);
  const { errors } = checkZip(zip);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(zip, { force: true });
  return errors.join('\n');
}

test.beforeAll(() => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'ignore' });
});

test('the store zip passes every pre-submission check', () => {
  const { errors, warnings, info } = checkZip(ZIP);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
  expect(info.manifest_version).toBe(3);
  expect(info.locales).toEqual(['de', 'en', 'es', 'fr']);
  expect(info.zipBytes).toBeLessThan(1024 * 1024);
  expect(info.optional_host_permissions).toEqual(['*://*/*']);
});

test('the extracted zip (not the dist folder) loads in Chromium and blocks', async ({ net }) => {
  const dir = extract(ZIP);
  const ext = await launchExtension({ proxyPort: net.port, srcDir: dir });
  try {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    const r = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'addEntry', raw: 'reddit.com', kind: 'domain' }));
    expect(r.ok).toBe(true);
    expect(await outcome(ext.context, 'https://old.reddit.com/')).toBe('blocked');
    expect(await page.evaluate(() => chrome.i18n.getMessage('extName'))).toContain('FocusFence');
    // production build: real ExtensionPay id, DEV off, Pro can't be unlocked for free
    const cfg = fs.readFileSync(path.join(dir, 'config.js'), 'utf8');
    expect(cfg).toMatch(/DEV:\s*false/);
    expect(cfg).toContain("EXTPAY_ID: 'focusfence-dev'");
    const send = (type, payload = {}) => page.evaluate(([type, payload]) => chrome.runtime.sendMessage({ type, ...payload }), [type, payload]);
    expect((await send('setDevPro', { on: true })).code).toBe('DEV_ONLY');
    await page.evaluate(() => chrome.storage.local.set({ devPro: true })); // even a leftover DEV flag is ignored
    const st = await send('getState');
    expect(st.dev).toBe(false);
    expect(st.isPro).toBe(false);
    expect(await outcome(ext.context, 'https://old.reddit.com/')).toBe('blocked'); // free features still work
  } finally {
    await ext.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the validator rejects the usual causes of store rejection', () => {
  const edit = (dir, f, fn) => fs.writeFileSync(path.join(dir, f), fn(fs.readFileSync(path.join(dir, f), 'utf8')));
  const mf = (fn) => (dir) => edit(dir, 'manifest.json', (s) => JSON.stringify(fn(JSON.parse(s))));

  expect(brokenErrors((d) => edit(d, 'popup.html', (s) => s.replace('</head>', '<script src="https://cdn.example.com/x.js"></script></head>')))).toMatch(/remote script/);
  expect(brokenErrors((d) => edit(d, 'styles/base.css', (s) => s + '\n@import url("https://fonts.example.com/a.css");'))).toMatch(/remote @import|remote url/);
  expect(brokenErrors((d) => edit(d, 'popup.js', (s) => s + '\neval("1");'))).toMatch(/eval/);
  expect(brokenErrors((d) => edit(d, 'background.js', (s) => s + "\nimportScripts('https://evil.example/x.js');"))).toMatch(/remote importScripts/);
  expect(brokenErrors((d) => fs.copyFileSync(path.join(d, 'icons/icon16.png'), path.join(d, 'icons/icon128.png')))).toMatch(/icon .*128\.png is 16x16/);
  expect(brokenErrors((d) => edit(d, '_locales/de/messages.json', (s) => {
    const m = JSON.parse(s);
    m.extDescription.message = 'x'.repeat(140);
    return JSON.stringify(m);
  }))).toMatch(/description is 140 chars.*\[de\]/);
  expect(brokenErrors((d) => fs.writeFileSync(path.join(d, '_debug.js'), ''))).toMatch(/reserved name/);
  expect(brokenErrors((d) => fs.writeFileSync(path.join(d, '.DS_Store'), ''))).toMatch(/hidden file/);
  expect(brokenErrors(mf((m) => ({ ...m, manifest_version: 2 })))).toMatch(/manifest_version must be 3/);
  expect(brokenErrors(mf((m) => ({ ...m, host_permissions: ['<all_urls>'] })))).toMatch(/all sites/);
  expect(brokenErrors(mf((m) => ({ ...m, background: { service_worker: 'missing.js' } })))).toMatch(/missing file: missing\.js/);
  expect(brokenErrors(mf((m) => ({ ...m, version: '1.0.0.0.1' })))).toMatch(/invalid version/);
});
