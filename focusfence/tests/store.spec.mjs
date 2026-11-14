// Store-readiness checks: listing texts and limits, manifest consistency, the submission guide,
// the data disclosures against the privacy policy, and the store images.
import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/launch.mjs';
import { S } from '../scripts/i18n/strings.mjs';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const png = (f) => {
  const b = fs.readFileSync(path.join(ROOT, f));
  expect(b.readUInt32BE(0), f).toBe(0x89504e47);
  return { size: [b.readUInt32BE(16), b.readUInt32BE(20)], colorType: b[25] };
};
const LANGS = ['en', 'fr', 'es', 'de'];
const listing = (lang) => read(`store/listing/${lang}.md`);
/** The code block after a bold label such as **storage** (the label line may go on). */
const labelled = (doc, label) => {
  const m = new RegExp('\\*\\*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\*[^\\n]*\\n```\\n([\\s\\S]*?)\\n```').exec(doc);
  return m && m[1];
};
/** The first code block of a listing is its detailed description. */
const description = (lang) => /```\n([\s\S]*?)\n```/.exec(listing(lang))[1];
const SITE_URL = /const SITE_URL = '([^']+)'/.exec(read('scripts/docs.mjs'))[1];
const MANIFEST = JSON.parse(read('src/manifest.json'));

test('the store name and summary come from the package and lead with focus, in every listing', () => {
  expect(MANIFEST.default_locale).toBe('en');
  expect(MANIFEST.name).toBe('__MSG_extName__');
  expect(MANIFEST.description).toBe('__MSG_extDescription__');
  const focus = { en: /focus/i, fr: /concentr/i, es: /conc[eé]ntr/i, de: /fokus|konzentr/i };
  for (const lang of LANGS) {
    expect(S.extName[lang].length, lang).toBeLessThanOrEqual(75);
    expect(S.extDescription[lang].length, lang).toBeLessThanOrEqual(132);
    // a focus app first; "website blocker" (bloqueur, bloqueador, Blocker) stays as the search term
    expect(S.extName[lang], lang).toMatch(focus[lang]);
    expect(S.extName[lang], lang).toMatch(/blocker|bloqueur|bloqueador/i);
    expect(S.extDescription[lang].split(':')[0], lang).toMatch(focus[lang]);
    const doc = listing(lang);
    expect(doc, `${lang} name`).toContain('\n' + S.extName[lang] + '\n');
    expect(doc, `${lang} summary`).toContain('\n' + S.extDescription[lang] + '\n');
    expect(doc, lang).toContain('Workflow & Planning');
  }
});

test('listing descriptions: focus first, never an ad blocker, an honest ADHD answer, real prices and links', () => {
  const focus = { en: /focus/i, fr: /concentr/i, es: /conc[eé]ntr/i, de: /fokus|konzentr/i };
  const adBlocker = { en: /ad ?blocker|adblock/i, fr: /bloqueur de pub/i, es: /bloqueador de anuncios/i, de: /werbeblocker/i };
  const adhd = { en: 'ADHD', fr: 'TDAH', es: 'TDAH', de: 'ADHS' };
  const medical = { en: /medical/, fr: /médical/, es: /médica/, de: /Medizin/ };
  const claims = /(?<!\p{L})(cures?|treats|heals|clinically|proven|guaranteed?|guérit|soigne|traite|cliniquement|prouvée?s?|garantie?s?|cura|trata|clínicamente|probado|garantizado|heilt|behandelt|klinisch|bewiesen|garantiert)(?!\p{L})/iu;
  const prices = /PRICES: Object\.freeze\(\{[\s\S]*?\n\s*\}\),/.exec(read('src/config.js'))[0];
  for (const lang of LANGS) {
    const d = description(lang);
    expect(d.length, lang).toBeLessThanOrEqual(16000); // the dashboard's limit
    const paragraphs = d.split('\n\n');
    expect(paragraphs[0], `${lang}: the first paragraph says what FocusFence is for`).toMatch(focus[lang]);
    expect(d, `${lang}: never called an ad blocker`).not.toMatch(adBlocker[lang]);
    // one ADHD answer, opening with the disclaimer, and no medical promise anywhere
    const answers = paragraphs.filter((p) => p.includes(adhd[lang]));
    expect(answers.length, lang).toBe(1);
    expect(answers[0].split('\n')[1].split('. ')[0], lang).toMatch(medical[lang]);
    expect(d, lang).not.toMatch(claims);
    // the prices the extension charges (src/config.js), in dollars and euros
    for (const amount of ['2.99', '19.99']) {
      expect(prices, amount).toContain(amount);
      expect(d, `${lang} ${amount}`).toContain(lang === 'en' ? amount : amount.replace('.', ','));
    }
    expect(d, lang).toMatch(/US\$|\$ US/); // 2.99 US$ (fr: 2,99 $ US)
    expect(d, lang).toContain('€');
    // links: the site and privacy policy in the listing's language, support, source
    const home = SITE_URL + (lang === 'en' ? '' : lang + '/');
    expect(d, lang).toContain(home + '\n');
    expect(d, lang).toContain(home + 'privacy.html');
    expect(d, lang).toContain('contact@focusfence.dev');
    expect(d, lang).toContain('https://github.com/Nexarion434/focusfence');
  }
});

test('submission guide: every permission justified (≤ 1000 chars) and identical in the guide and the English listing', () => {
  const guide = read('store/SUBMISSION.md');
  const en = listing('en');
  for (const p of MANIFEST.permissions) {
    const j = labelled(guide, p);
    expect(j, `justification for ${p}`).toBeTruthy();
    expect(j.length, p).toBeLessThanOrEqual(1000);
    expect(labelled(en, p), p).toBe(j);
    // the translations, for reference, cover every permission too
    for (const lang of ['fr', 'es', 'de']) expect(labelled(listing(lang), p), `${lang} ${p}`).toBeTruthy();
  }
  const host = labelled(guide, 'Host permissions');
  expect(host.length).toBeLessThanOrEqual(1000);
  expect(labelled(en, 'Host permissions')).toBe(host);
  for (const lang of ['fr', 'es', 'de']) {
    const h = labelled(listing(lang), 'Host permissions');
    expect(h.length, lang).toBeLessThanOrEqual(1000);
    for (const m of [...MANIFEST.optional_host_permissions, ...MANIFEST.content_scripts.flatMap((c) => c.matches)]) expect(h, lang).toContain(m);
  }
  for (const h of [...MANIFEST.optional_host_permissions, ...MANIFEST.content_scripts.flatMap((c) => c.matches)]) expect(host).toContain(h);
  const single = /### Single purpose description\n\n```\n([\s\S]*?)\n```/.exec(guide)[1];
  expect(single.length).toBeLessThanOrEqual(1000);
  expect(/## Single purpose\n\n```\n([\s\S]*?)\n```/.exec(en)[1]).toBe(single);
  // the privacy policy: on the site, in the guide, and the extension's own link
  expect(guide).toContain('```\n' + SITE_URL + 'privacy.html\n```');
  expect(/PRIVACY_URL: '([^']+)'/.exec(read('src/config.js'))[1]).toBe(SITE_URL + 'privacy.html');
  expect(guide).toContain(S.extName.en);
  expect(guide).toContain(S.extDescription.en);
  expect(guide).toContain('contact@focusfence.dev');
  expect(guide).toContain('`' + SITE_URL + '`'); // homepage URL
});

test('submission guide names the package to upload, with its real version and checksum', () => {
  const guide = read('store/SUBMISSION.md');
  const zip = `dist/focusfence-${MANIFEST.version}.zip`;
  expect(JSON.parse(read('package.json')).version).toBe(MANIFEST.version);
  expect(guide).toContain('`' + zip + '`');
  expect(guide).toContain('`' + MANIFEST.version + '`');
  // the build is reproducible: after any change to src/, run npm run build and quote the new hash
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, zip))).digest('hex');
  expect(guide, `SUBMISSION.md must quote the SHA-256 of ${zip}`).toContain(sha);
  // no other package lies around in dist/ to be uploaded by mistake
  expect(fs.readdirSync(path.join(ROOT, 'dist')).filter((f) => f.endsWith('.zip'))).toEqual([path.basename(zip)]);
});

test('data disclosures: the four ticked categories match the guide and are stated in the privacy policy', () => {
  const ticked = (doc) =>
    doc
      .split('\n')
      .filter((l) => /^\| [^|]+ \| \*\*Yes\*\* \|/.test(l))
      .map((l) => l.split('|')[1].trim())
      .sort();
  const expected = ['Authentication information', 'Financial and payment information', 'Personally identifiable information', 'Web history'];
  expect(ticked(listing('en'))).toEqual(expected);
  expect(ticked(read('store/SUBMISSION.md'))).toEqual(expected);
  // what each ticked box points to is in the published policy (store/privacy-policy.md -> docs/)
  const policy = read('store/privacy-policy.md');
  for (const fact of ['the email address you paid with', 'your subscription status and plan', 'payment date', 'salted PBKDF2-SHA-256 hash', 'random identifier (an API key)', 'Blocked-attempt counts per blocked site per day', 'read the address of the current tab']) {
    expect(policy, fact).toContain(fact);
  }
  // and the translations say it too (the site serves them)
  for (const [lang, phrase] of [['fr', 'l’adresse e-mail avec laquelle vous avez payé'], ['es', 'el correo electrónico con el que pagaste'], ['de', 'die E-Mail-Adresse, mit der Sie bezahlt haben']]) {
    expect(read(`store/privacy-policy.${lang}.md`), lang).toContain(phrase);
  }
});

test('store images: 5 screenshots per language, promo tile, marquee and icon, at the exact sizes, documented', () => {
  const { shots } = JSON.parse(read('store/screenshots.json'));
  const readme = read('store/assets/README.md');
  expect(shots.map((s) => s.file)).toEqual(['1-block-page.png', '2-popup.png', '3-focus-session.png', '4-strict-mode.png', '5-blocklist.png']);
  for (const lang of LANGS) {
    const dir = `store/assets/${lang}/`;
    expect(fs.readdirSync(path.join(ROOT, dir)).sort(), lang).toEqual(shots.map((s) => s.file));
    for (const s of shots) {
      const img = png(dir + s.file);
      expect(img.size, dir + s.file).toEqual([1280, 800]);
      expect(img.colorType, `${dir}${s.file}: 24-bit, no alpha`).toBe(2);
      const t = s.text[lang];
      for (const k of ['kicker', 'headline', 'dim', 'sub']) expect(t[k], `${lang} ${s.file} ${k}`).toBeTruthy();
      // the README lists every caption, and each listing names its screenshots in upload order
      expect(readme, `${lang} ${s.file}`).toContain(lang === 'en' ? `**${t.headline}** ${t.dim}` : `${t.headline} ${t.dim}`);
    }
    const order = shots.map((s) => listing(lang).indexOf('`' + s.file + '`'));
    expect(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), `${lang} lists the screenshots in order`).toBe(true);
  }
  const small = png('store/assets/promo-small-440x280.png');
  expect(small.size).toEqual([440, 280]);
  expect(small.colorType).toBe(2);
  const marquee = png('store/assets/marquee-1400x560.png');
  expect(marquee.size).toEqual([1400, 560]);
  expect(marquee.colorType).toBe(2);
  expect(png('store/assets/icon-128.png').size).toEqual([128, 128]);
  expect(fs.readFileSync(path.join(ROOT, 'store/assets/icon-128.png')).equals(fs.readFileSync(path.join(ROOT, 'src/icons/icon128.png')))).toBe(true);
  const guide = read('store/SUBMISSION.md');
  for (const f of ['store/assets/icon-128.png', 'store/assets/promo-small-440x280.png', 'store/assets/marquee-1400x560.png']) expect(guide, f).toContain(f);
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
