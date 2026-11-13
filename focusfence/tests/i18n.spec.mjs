// Internationalization: catalog integrity, no hard-coded keys missing, and real
// French / Spanish / German UIs in Chromium (chrome.i18n follows the browser language).
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, launchExtension, startFakeInternet } from '../scripts/launch.mjs';
import { S, LANGS } from '../scripts/i18n/strings.mjs';

const src = (f) => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');

test('catalog is complete and _locales are generated from it', () => {
  // exits non-zero on missing translations, placeholder/marker mismatches, store limits or stale files
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/i18n/build.mjs'), '--check'], { stdio: 'pipe' });
  for (const lang of LANGS) {
    const msgs = JSON.parse(fs.readFileSync(path.join(ROOT, `src/_locales/${lang}/messages.json`), 'utf8'));
    expect(Object.keys(msgs).sort()).toEqual(Object.keys(S).sort());
  }
});

test('every key referenced by HTML and JS exists in the catalog', () => {
  const used = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.html'))) {
    const html = src(f);
    for (const m of html.matchAll(/data-i18n(?:-rich)?="([^"]+)"/g)) used.add(m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(';')) used.add(pair.split(':')[1].trim());
  }
  for (const f of ['popup.js', 'options.js', 'blocked.js', 'onboarding.js', 'background.js', 'lib/core.js', 'lib/ui.js']) {
    const js = src(f);
    // literal keys only (dynamic ones like 'quote' + n are checked separately below)
    for (const m of js.matchAll(/\b(?:t|M|T|i18n)\('([A-Za-z0-9_]+)'\s*[,)]/g)) used.add(m[1]);
    for (const m of js.matchAll(/plural\([^,]+,\s*'([A-Za-z0-9_]+)'/g)) {
      used.add(m[1] + 'One');
      used.add(m[1] + 'Other');
    }
  }
  const missing = [...used].filter((k) => !S[k]);
  expect(missing).toEqual([]);
  expect(used.size).toBeGreaterThan(200);
  // quotes are looked up dynamically
  for (let i = 1; i <= 10; i++) expect(S['quote' + i]).toBeTruthy();
});

test('manifest strings are localized', () => {
  const mf = JSON.parse(src('manifest.json'));
  expect(mf.default_locale).toBe('en');
  for (const k of ['name', 'short_name', 'description']) expect(mf[k]).toMatch(/^__MSG_\w+__$/);
});

const EXPECT = {
  fr: { popupStatus: 'Blocage activé', nav: 'Liste de blocage', fenced: ' est bloqué', back: 'Retour au travail', invalid: /pas un site valide/, price: /2,99/ },
  es: { popupStatus: 'Bloqueo activado', nav: 'Lista de bloqueo', fenced: ' está bloqueada', back: 'Volver al trabajo', invalid: /no parece una web válida/i, price: /2,99/ },
  de: { popupStatus: 'Blockieren ist an', nav: 'Sperrliste', fenced: ' ist gesperrt', back: 'Zurück an die Arbeit', invalid: /keine? gültige|nicht nach einer gültigen/, price: /2,99/ },
};

for (const lang of ['fr', 'es', 'de']) {
  test(`whole UI renders in ${lang}`, async () => {
    const net = await startFakeInternet();
    const ext = await launchExtension({ proxyPort: net.port, lang });
    const e = EXPECT[lang];
    try {
      const page = await ext.context.newPage();
      const errors = [];
      page.on('console', (m) => /missing translation/.test(m.text()) && errors.push(m.text()));
      await page.goto(ext.base + 'options.html');
      const send = (type, payload = {}) => page.evaluate(([t, p]) => chrome.runtime.sendMessage({ type: t, ...p }), [type, payload]);
      expect(await page.evaluate(() => chrome.i18n.getUILanguage())).toMatch(new RegExp('^' + lang));
      expect(await page.evaluate(() => document.documentElement.lang)).toMatch(new RegExp('^' + lang));
      expect(await page.evaluate(() => chrome.i18n.getMessage('extName'))).toBe(S.extName[lang]);
      await expect(page.locator('[data-nav="blocklist"]')).toContainText(e.nav);
      await expect(page.locator('#price-monthly')).toHaveText(e.price);
      // errors coming from the service worker / core are localized too
      const bad = await send('addEntry', { raw: 'not a site', kind: 'domain' });
      expect(bad.error).toMatch(e.invalid);
      // localized day buttons (Intl) on the schedule
      await send('setDevPro', { on: true });
      await send('setSchedule', { schedule: { enabled: false, windows: [{ days: [1], start: '09:00', end: '17:00' }] } });
      await page.reload();
      const monday = new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(new Date(2026, 10, 16));
      await expect(page.locator('.day[aria-label="' + monday + '"]')).toHaveAttribute('aria-pressed', 'true');
      // no English left in the visible text of key areas
      expect(await page.locator('#add-submit').textContent()).toBe(S.addToBlocklist[lang]);

      const popup = await ext.context.newPage();
      await popup.goto(ext.base + 'popup.html');
      await expect(popup.locator('#status-title')).toHaveText(e.popupStatus);
      await expect(popup.locator('#quick-add')).toHaveText(S.blockSite[lang]);

      await send('addEntry', { raw: 'reddit.com', kind: 'domain' });
      const blocked = await ext.context.newPage();
      await blocked.goto('https://reddit.com/');
      await expect(blocked.locator('h1')).toHaveText('reddit.com' + e.fenced);
      await expect(blocked.locator('#back')).toHaveText(e.back);
      const quote = await blocked.locator('#message').textContent();
      expect(Object.keys(S).filter((k) => /^quote\d+$/.test(k)).map((k) => S[k][lang])).toContain(quote);
      expect(errors).toEqual([]);
    } finally {
      await ext.close();
      await net.close();
    }
  });
}
