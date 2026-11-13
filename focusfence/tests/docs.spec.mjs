// Static site (docs/) and marketing drafts: generated correctly, drafts stay
// unindexed, accessible pages, platform limits respected.
import { test, expect, chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT } from '../scripts/launch.mjs';
import { SITE, SITE_LANGS, LANG_NAMES, OG_LOCALE } from '../scripts/site-strings.mjs';
import { S } from '../scripts/i18n/strings.mjs';

const REPO = path.resolve(ROOT, '..');
const DOCS = path.join(REPO, 'docs');
const read = (...p) => fs.readFileSync(path.join(REPO, ...p), 'utf8');

test.beforeAll(() => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/docs.mjs')], { stdio: 'ignore' });
});

test('draft blog posts are rendered with noindex and kept out of the sitemap', () => {
  const posts = fs.readdirSync(path.join(REPO, 'marketing/blog')).filter((f) => f.endsWith('.md'));
  expect(posts.length).toBe(3);
  const sitemap = read('docs/sitemap.xml');
  for (const f of posts) {
    const src = read('marketing/blog', f);
    const slug = /\nslug: (.+)\n/.exec(src)[1];
    const draft = /\ndraft: true\n/.test(src);
    const html = read('docs/blog', slug + '.html');
    expect(html.includes('<meta name="robots" content="noindex">'), slug).toBe(draft);
    expect(sitemap.includes('blog/' + slug), slug).toBe(!draft);
    // every article discloses that we make FocusFence
    expect(src).toMatch(/Disclosure/);
  }
});

test('marketing drafts are marked unpublished and respect platform limits', () => {
  expect(read('marketing/README.md')).toMatch(/Nothing here has been published/);
  const ph = read('marketing/product-hunt.md');
  const tagline = /\| Tagline \| (.+?) \|/.exec(ph)[1];
  expect(tagline.length).toBeLessThanOrEqual(60);
  const desc = /## Description \(≤ 260 chars\)\n\n> (.+)\n/.exec(ph)[1];
  expect(desc.length).toBeLessThanOrEqual(260);
  for (const f of ['reddit-r-productivity.md', 'reddit-r-getdisciplined.md']) {
    const r = read('marketing', f);
    expect(r, f).toMatch(/DRAFT \(not posted\)/);
    expect(r, f).toMatch(/[Dd]isclosure|I'm the developer/);
  }
  // r/getdisciplined: method post must not contain a link to the extension
  const gd = read('marketing/reddit-r-getdisciplined.md').split('### If someone asks')[0];
  expect(gd).not.toMatch(/https?:\/\/(?!.*reddit)/);
});

test('landing, privacy and blog pages pass axe (WCAG A/AA) with no horizontal scroll', async () => {
  test.slow(); // dozens of page loads in a real browser
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  try {
    const problems = [];
    const localized = SITE_LANGS.flatMap((l) => [(l === 'en' ? '' : l + '/') + 'index.html', (l === 'en' ? '' : l + '/') + 'privacy.html']);
    for (const rel of [...localized, 'blog/index.html', 'blog/block-youtube-shorts-chrome.html']) {
      for (const [width, colorScheme] of [[1280, 'dark'], [1280, 'light'], [390, 'light'], [360, 'dark']]) {
        // reduced motion: every block is in its final, visible state (no scroll reveal), so axe checks it all
        const context = await browser.newContext({ viewport: { width, height: 800 }, colorScheme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto('file://' + path.join(DOCS, rel));
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push(`${rel}@${width}: horizontal scroll`);
        if (width === 1280) {
          const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          for (const v of r.violations) problems.push(`${rel} (${colorScheme}): ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        }
        await context.close();
      }
    }
    expect(problems).toEqual([]);
  } finally {
    await browser.close();
  }
});

test('motion is optional: blocks reveal on scroll, and nothing stays hidden without JS or with reduced motion', async () => {
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  const hidden = (page) =>
    page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length);
  // the closing fence: every pill of the row standing (not sunk into the ground)
  const standing = (page) =>
    page.evaluate(() => {
      const pills = [...document.querySelectorAll('.scene .fence .pill')];
      return pills.length > 0 && pills.every((p) => ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(p).transform));
    });
  try {
    const url = 'file://' + path.join(DOCS, 'index.html');
    // motion allowed: below-the-fold blocks start hidden, and all are shown once scrolled into view
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.classList.contains('motion'))).toBe(true);
    expect(await hidden(page)).toBeGreaterThan(0);
    await page.evaluate(async () => {
      for (let y = 0; y <= document.documentElement.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    // every block has been revealed, and the transitions settle on fully opaque blocks
    await page.waitForFunction(() => document.querySelectorAll('[data-reveal]:not(.in)').length === 0, null, { timeout: 15000 });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')].every((el) => getComputedStyle(el).opacity === '1'), null, { timeout: 5000 });
    // the closing fence rose once in view, and stands
    await page.waitForFunction(() => document.querySelector('[data-rise]').classList.contains('in'), null, { timeout: 5000 });
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
    expect(await standing(page)).toBe(true);
    // a jump straight to the end (anchor, fast scroll): everything above it is revealed too
    const jump = await ctx.newPage();
    await jump.goto(url + '#faq');
    await jump.waitForFunction(
      () => {
        const seen = [...document.querySelectorAll('[data-reveal]')].filter((el) => el.getBoundingClientRect().top < innerHeight * 0.85);
        return seen.length > 10 && seen.every((el) => el.classList.contains('in'));
      },
      null,
      { timeout: 15000 }
    );
    await jump.close();
    await ctx.close();
    // reduced motion, and no JavaScript at all: everything is visible from the start
    for (const opts of [{ reducedMotion: 'reduce' }, { javaScriptEnabled: false }]) {
      const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
      const p = await c.newPage();
      await p.goto(url);
      expect(await hidden(p), JSON.stringify(opts)).toBe(0);
      expect(await standing(p), JSON.stringify(opts)).toBe(true);
      await c.close();
    }
  } finally {
    await browser.close();
  }
});

/* ------------------------------------------------------------ multilingual */
const SITE_URL = 'https://focusfence.dev/';
const dirOf = (l) => (l === 'en' ? '' : l + '/');
const all = (re, html) => [...html.matchAll(re)].map((m) => m[1]);
const allHtml = () => {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else if (e.name.endsWith('.html')) out.push(path.relative(DOCS, path.join(d, e.name)));
    }
  };
  walk(DOCS);
  return out;
};

test('landing + privacy exist in en/fr/es/de with lang, canonical, reciprocal hreflang and localized OG tags', () => {
  expect(SITE_LANGS).toEqual(['en', 'fr', 'es', 'de']);
  for (const file of ['', 'privacy.html']) {
    const expected = [...SITE_LANGS.map((l) => `${l} ${SITE_URL}${dirOf(l)}${file}`), `x-default ${SITE_URL}${file}`].sort();
    for (const lang of SITE_LANGS) {
      const rel = dirOf(lang) + (file || 'index.html');
      const html = read('docs', rel);
      const T = SITE[lang];
      expect(html, rel).toContain(`<html lang="${lang}">`);
      expect(all(/<link rel="canonical" href="([^"]+)">/g, html), rel).toEqual([SITE_URL + dirOf(lang) + file]);
      expect(all(/<meta property="og:url" content="([^"]+)">/g, html), rel).toEqual([SITE_URL + dirOf(lang) + file]);
      // every language version lists the same complete set: hreflang is reciprocal
      expect([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => m[1] + ' ' + m[2]).sort(), rel).toEqual(expected);
      expect(html, rel).toContain(`<meta property="og:locale" content="${OG_LOCALE[lang]}">`);
      expect(all(/<meta property="og:locale:alternate" content="([^"]+)">/g, html).sort(), rel).toEqual(SITE_LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]).sort());
      const title = /<title>([^<]+)<\/title>/.exec(html)[1];
      const desc = /<meta name="description" content="([^"]+)">/.exec(html)[1];
      expect(/<meta property="og:title" content="([^"]+)">/.exec(html)[1], rel).toBe(title);
      expect(/<meta property="og:description" content="([^"]+)">/.exec(html)[1], rel).toBe(desc);
      if (lang !== 'en') {
        const en = read('docs', file || 'index.html');
        expect(title, rel).not.toBe(/<title>([^<]+)<\/title>/.exec(en)[1]);
        expect(desc, rel).not.toBe(/<meta name="description" content="([^"]+)">/.exec(en)[1]);
      }
      // og:image is the localized 1200x630 Open Graph image, and exists with the declared size
      const og = /<meta property="og:image" content="([^"]+)">/.exec(html)[1];
      expect(og, rel).toBe(`${SITE_URL}assets/${lang}/og.png`);
      const ogFile = path.join(DOCS, og.slice(SITE_URL.length));
      expect(fs.existsSync(ogFile), og).toBe(true);
      const ogBuf = fs.readFileSync(ogFile);
      expect([ogBuf.readUInt32BE(16), ogBuf.readUInt32BE(20)], og).toEqual([1200, 630]);
      expect(html, rel).toContain('<meta property="og:image:width" content="1200">');
      expect(html, rel).toContain('<meta property="og:image:height" content="630">');
      expect(html, rel).toContain(`<meta name="twitter:image" content="${og}">`);
      expect(/<meta property="og:image:alt" content="([^"]+)">/.exec(html), rel).toBeTruthy();
      expect(desc.length, rel + ' description').toBeLessThanOrEqual(300);
      expect(html, rel).not.toContain('{{');
      expect(html, rel).not.toMatch(/\{(source|privacy|license)\}/);
    }
  }
});

// srcset="a.webp 1280w, b.webp 2560w" -> ['a.webp', 'b.webp']
const srcsets = (html) => all(/ srcset="([^"]+)"/g, html).flatMap((v) => v.split(',').map((c) => c.trim().split(/\s+/)[0]));
const webpSize = (file) => {
  const b = fs.readFileSync(file);
  expect(b.toString('ascii', 8, 12), file).toBe('WEBP');
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === 'VP8L') return [1 + (b.readUInt32LE(21) & 0x3fff), 1 + ((b.readUInt32LE(21) >> 14) & 0x3fff)];
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
};

// Every product capture on a page, in order: an <img>, or a <picture> whose <source> serves a
// capture made for phones. The theme class (th-d / th-l) is on the <img> or on its <picture>.
const captures = (html) => {
  const out = [];
  let pic = null;
  for (const m of html.matchAll(/<picture class="([^"]*)">|<\/picture>|<(img|source)\b([^>]*)>/g)) {
    if (m[1] !== undefined) pic = { cls: m[1], sources: [] };
    else if (m[0] === '</picture>') pic = null;
    else {
      const a = Object.fromEntries([...m[3].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
      if (m[2] === 'source') pic.sources.push({ src: a.srcset, w: +a.width, h: +a.height, media: a.media });
      else out.push({ cls: pic ? pic.cls : a.class || '', src: a.src, w: +a.width, h: +a.height, alt: a.alt, lazy: a.loading === 'lazy', narrow: pic ? pic.sources : [] });
    }
  }
  return out;
};

test('landing pages show the real, localized product UI in both themes: 2x WebP captures with matching sizes', () => {
  const SHOTS = ['blocklist', 'popup', 'block-card', 'block-page', 'schedule', 'focus', 'strict', 'stats'];
  for (const lang of SITE_LANGS) {
    const rel = dirOf(lang) + 'index.html';
    const html = read('docs', rel);
    const imgs = captures(html);
    expect(imgs.length, rel).toBe(SHOTS.length * 2);
    const dark = imgs.filter((i) => /\bth-d\b/.test(i.cls));
    const light = imgs.filter((i) => /\bth-l\b/.test(i.cls));
    expect([dark.length, light.length], rel).toEqual([SHOTS.length, SHOTS.length]);
    dark.forEach((d, i) => {
      const l = light[i];
      // each dark capture is followed by the light capture of the same screen
      expect(l.src, rel).toBe(d.src.replace(/(-1x)?\.webp$/, '-light$1.webp'));
      expect([l.w, l.h, l.alt], d.src).toEqual([d.w, d.h, d.alt]);
      expect(l.narrow.map((n) => n.src), d.src).toEqual(d.narrow.map((n) => n.src.replace(/\.webp$/, '-light.webp')));
    });
    const sized = (src, w, h) => {
      // width/height are the CSS size: half the 2x capture (no layout shift, crisp on HiDPI)
      const [W, H] = webpSize(path.join(DOCS, path.dirname(rel), src.replace('-1x.webp', '.webp')));
      expect([W / 2, H / 2], src).toEqual([w, h]);
    };
    for (const { src, w, h, alt, lazy, narrow } of imgs) {
      expect(src, rel).toContain(`assets/${lang}/`);
      expect(alt.length, src).toBeGreaterThan(20);
      // only one theme is ever downloaded: every product image is lazy, and the hero image of the
      // visitor's theme is preloaded by the inline theme script
      expect(lazy, src).toBe(true);
      sized(src, w, h);
      for (const n of narrow) {
        expect(n.media, src).toBe('(max-width: 720px)');
        sized(n.src, n.w, n.h);
      }
    }
    // phones get the extension's own narrow layouts (a 400 px window): block page, schedule, stats
    expect(dark.flatMap((d) => d.narrow.map((n) => path.basename(n.src))), rel).toEqual(['block-page-m.webp', 'schedule-m.webp', 'stats-m.webp']);
    for (const name of [...SHOTS, 'block-page-m', 'schedule-m', 'stats-m']) expect(html, `${rel} ${name}`).toMatch(new RegExp(`assets/${lang}/${name}(-1x)?\\.webp`));
    for (const src of srcsets(html)) expect(src, rel).toContain(`assets/${lang}/`);
    expect(html, rel).toContain(`assets/${lang}/blocklist-1x.webp 1280w`);
    expect(html, rel).toContain(`assets/${lang}/blocklist-light-1x.webp 1280w`);
    // the popup captures really are the localized ones (button label in that language), copied as is
    expect(html, rel).toContain(S.blockSite[lang]);
    for (const f of ['popup.webp', 'popup-light.webp']) {
      const copy = fs.readFileSync(path.join(DOCS, 'assets', lang, f));
      expect(copy.equals(fs.readFileSync(path.join(ROOT, `screenshots/site/${lang}/${f}`))), `${lang} ${f}`).toBe(true);
    }
  }
});

test('pricing: the yearly comparison and the saving are computed from the real prices', () => {
  const n = (price) => Number(/(\d+)[.,](\d\d)/.exec(price).slice(1).join('.'));
  for (const lang of SITE_LANGS) {
    const T = SITE[lang];
    const html = read('docs', dirOf(lang) + 'index.html');
    const [m, y] = [n(T.priceMonthly), n(T.priceYearly)];
    expect([m, y], lang).toEqual([2.99, 19.99]); // the same figures in dollars and in euros
    const cmp = /<div class="compare">([\s\S]*?)<\/div>/.exec(html)[1];
    const vals = all(/<span class="cmp-v">([^<]+)<\/span>/g, cmp);
    // a year of Pro both ways, written like the language's own prices
    expect(vals, lang).toEqual([T.priceMonthly.replace(/2([.,])99/, '35$188'), T.priceYearly]);
    expect(n(vals[0]), lang).toBeCloseTo(12 * m, 2);
    expect(cmp, lang).toContain(`width: ${((100 * y) / (12 * m)).toFixed(1)}%`);
    // "Save 44%" and "12 months for less than the price of 7"
    expect(T.save, lang).toContain(String(Math.round(100 * (1 - y / (12 * m)))));
    expect([6 * m < y, y < 7 * m], lang).toEqual([true, true]);
    expect(T.yearlyItems[1], lang).toMatch(/12\D+7/);
  }
});

test("the closing fence is the extension's round 5 row of glass pills in both themes, with nothing left of the older fences", () => {
  // the extension's pillProfile (src/lib/ui.js, round 5): a gentle cosine bell, the ends 0.575 of
  // the middle pill; the light falls off with the distance; the ends fade to 0.6, their neighbours 0.92
  const profile = (n) => {
    const m = (n - 1) / 2;
    return Array.from({ length: n }, (_, p) => {
      const d = Math.abs(p - m);
      return { d, k: 0.575 + 0.425 * Math.cos((Math.PI * (m ? d / m : 0)) / 2) ** 2, t: d ? Math.exp(-d / 1.25) : 1, v: d === m ? 0.6 : d === m - 1 ? 0.92 : 1 };
    });
  };
  const seven = profile(7);
  const five = profile(5);
  for (const lang of SITE_LANGS) {
    const rel = dirOf(lang) + 'index.html';
    const html = read('docs', rel);
    // nothing left of the first site's SVG fence or of round 3's lantern wall
    expect(html, rel).not.toMatch(/id="pickets"|class="wall|class="pk |class="bloom"/);
    // the row and its reflection on the floor, with the light's pool in front
    expect(all(/<div class="(fence(?: mirror)?)">/g, html), rel).toEqual(['fence mirror', 'fence']);
    expect(html, rel).toContain('<span class="fence-pool"></span>');
    const row = /<div class="fence"><span class="fence-halo"><\/span>([\s\S]*?)<\/div>/.exec(html)[1];
    const pills = [...row.matchAll(/<span class="pill( lit| far)?" style="--k:([\d.]+);--t0:([\d.]+);--v0:([\d.]+);--side:(-?\d);--i:(\d)(?:;--k5:([\d.]+);--v5:([\d.]+))?"><\/span>/g)];
    // seven pills, as on the demo's block page (six sites), the light in the middle; on narrower
    // windows the two outer ones step aside and five remain (fewer pills, not thinner ones)
    expect(pills.length, rel).toBe(7);
    expect(pills.map((p) => (p[1] || '').trim()), rel).toEqual(['far', '', '', 'lit', '', '', 'far']);
    pills.forEach(([, , k, t, v, side, i, k5, v5], p) => {
      const { d } = seven[p];
      expect([Number(i), Number(side)], `${rel} #${p}`).toEqual([d, Math.sign(p - 3)]);
      expect(Number(k), `${rel} #${p}`).toBeCloseTo(seven[p].k, 3);
      expect(Number(t), `${rel} #${p}`).toBeCloseTo(seven[p].t, 3);
      expect(Number(v), `${rel} #${p}`).toBeCloseTo(seven[p].v, 2);
      // the five-pill row: the same light, its own heights and fade
      if (d === 1 || d === 2) {
        expect(Number(k5), `${rel} #${p}`).toBeCloseTo(five[p - 1].k, 3);
        expect(Number(v5), `${rel} #${p}`).toBeCloseTo(five[p - 1].v, 2);
      } else expect(k5, `${rel} #${p}`).toBeUndefined();
    });
    // round 5's proportions: the end pills are 1.74 times shorter than the middle one
    expect(1 / seven[0].k).toBeCloseTo(1.74, 2);
  }
  const css = read('focusfence/scripts/site.css');
  // no lantern, rail or picket-tip leftovers, and no floor band or line (round 5's floor is seamless)
  expect(css).not.toMatch(/--picket:|--picket-line|--rail|--wall-|--rim-rgb|\.wall\b|\.pk\b|\.bloom\b|clip-path: polygon|lantern|--ground-line|--floor-0/i);
  // round 5's chunky pebbles: the middle pill 1.6 times as tall as wide, 9 % of a pill apart
  expect(css).toContain('--ph: calc(var(--pw) * 1.6);');
  expect(css).toContain('gap: calc(var(--pw) * 0.09);');
  // the extension's glass and light, at night (a wide halo) and by day (milky sage glass)
  for (const token of [
    '--glass-0: rgb(205 245 222 / 0.1);',
    '--glass-0: rgb(240 246 242 / 0.94);',
    '--lit-1: #3fd67a;',
    '--lit-1: #1e8a45;',
    '--light-rgb: 63 214 122;',
    '--light-rgb: 30 138 69;',
    '--halo-h: 2.05;',
    '--halo-h: 1.4;',
  ])
    expect(css).toContain(token);
});

test('the hero explains the product in the first screen: settings, popup and block page, at 1440x900 and 390x844', async () => {
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  try {
    const problems = [];
    for (const lang of SITE_LANGS) {
      for (const [width, height] of [[1440, 900], [390, 844]]) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto('file://' + path.join(DOCS, dirOf(lang), 'index.html'));
        const boxes = await page.evaluate(() =>
          Object.fromEntries(
            ['.win-hero', '.win-popup', '.win-card'].map((s) => {
              const r = document.querySelector(s).getBoundingClientRect();
              return [s, { left: r.left, top: r.top, right: r.right, bottom: r.bottom }];
            })
          )
        );
        const at = `${lang}@${width}x${height}`;
        // the popup (with its timer and footer counts) and the block page are whole on screen
        for (const s of ['.win-popup', '.win-card']) {
          const b = boxes[s];
          if (b.left < 0 || b.top < 0 || b.right > width || b.bottom > height) problems.push(`${at}: ${s} ${JSON.stringify(b)}`);
        }
        // the settings window is mostly on screen (on phones it runs off the right edge by design)
        const b = boxes['.win-hero'];
        const shown = (Math.min(b.right, width) - Math.max(b.left, 0)) * (Math.min(b.bottom, height) - Math.max(b.top, 0));
        if (b.top < 0 || shown < 0.55 * (b.right - b.left) * (b.bottom - b.top)) problems.push(`${at}: settings ${JSON.stringify(b)}`);
        await context.close();
      }
    }
    expect(problems).toEqual([]);
  } finally {
    await browser.close();
  }
});

test('on phones every product capture is shown whole (no crop), using the captures made for phones', async () => {
  test.slow(); // dozens of page loads in a real browser
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  try {
    const problems = [];
    for (const lang of SITE_LANGS) {
      for (const colorScheme of ['dark', 'light']) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto('file://' + path.join(DOCS, dirOf(lang), 'index.html'));
        const report = await page.evaluate(async () => {
          const out = [];
          // the images of the page's theme (the others are display: none), outside the hero
          // (where the settings window runs off the edge on purpose)
          const imgs = [...document.querySelectorAll('main img')].filter((i) => i.offsetParent !== null && !i.closest('.win-hero'));
          for (const img of imgs) {
            img.loading = 'eager';
            await img.decode().catch(() => {});
            const r = img.getBoundingClientRect();
            for (let el = img.parentElement; el && el !== document.body; el = el.parentElement) {
              const cs = getComputedStyle(el);
              if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.maskImage === 'none') continue;
              const c = el.getBoundingClientRect();
              if (r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5 || cs.maskImage !== 'none')
                out.push(`${img.currentSrc.split('/').pop()} clipped by ${el.className}`);
            }
            if (r.right > innerWidth + 0.5 || r.left < -0.5) out.push(`${img.currentSrc.split('/').pop()} off screen`);
          }
          return { out, srcs: imgs.map((i) => i.currentSrc.split('/').pop()) };
        });
        for (const p of report.out) problems.push(`${lang} ${colorScheme}: ${p}`);
        const t = colorScheme === 'light' ? '-light' : '';
        for (const f of [`block-page-m${t}.webp`, `schedule-m${t}.webp`, `stats-m${t}.webp`]) if (!report.srcs.includes(f)) problems.push(`${lang}: ${f} not used`);
        await context.close();
      }
    }
    expect(problems).toEqual([]);
  } finally {
    await browser.close();
  }
});

test('theme: follows the system, the header toggle switches light / dark / system, the choice persists with no flash', async () => {
  // the theme is applied by an inline script in <head>, before the styles: the first paint is already right
  for (const rel of allHtml()) {
    const html = read('docs', rel);
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head.indexOf("localStorage.getItem(\"ff-theme\")"), rel).toBeGreaterThan(-1);
    expect(head.indexOf('ff-theme'), rel).toBeLessThan(head.indexOf('<style>'));
    expect(html, rel).toMatch(/<fieldset class="theme"><legend class="sr">[^<]+<\/legend>/);
    expect((html.match(/<input type="radio" name="theme" value="(light|dark|system)">/g) || []).length, rel).toBe(3);
  }
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  const url = 'file://' + path.join(DOCS, 'index.html');
  const state = (page) =>
    page.evaluate(() => {
      const d = document.documentElement;
      const shown = (sel) => getComputedStyle(document.querySelector(sel)).display !== 'none';
      return {
        pref: d.getAttribute('data-theme-pref'),
        theme: d.getAttribute('data-theme'),
        bg: getComputedStyle(document.body).backgroundColor,
        dark: shown('.win-hero .th-d'),
        light: shown('.win-hero .th-l'),
        meta: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content),
        stored: localStorage.getItem('ff-theme'),
      };
    });
  const DARK = 'rgb(8, 9, 10)';
  const LIGHT = 'rgb(251, 250, 247)';
  try {
    // 1. no choice yet: the system decides (and the hidden theme's images are not shown)
    for (const [colorScheme, bg] of [['dark', DARK], ['light', LIGHT]]) {
      const ctx = await browser.newContext({ colorScheme });
      const page = await ctx.newPage();
      await page.goto(url);
      const st = await state(page);
      expect(st, colorScheme).toMatchObject({ pref: 'system', theme: null, bg, dark: colorScheme === 'dark', light: colorScheme === 'light' });
      await ctx.close();
    }
    // 2. a stored choice wins over the system, from the first paint
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    await ctx.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('ff-theme', 'light');
        sessionStorage.setItem('seeded', '1');
      }
    });
    const page = await ctx.newPage();
    await page.goto(url);
    expect(await state(page)).toMatchObject({ pref: 'light', theme: 'light', bg: LIGHT, dark: false, light: true, meta: ['#fbfaf7', '#fbfaf7'] });
    expect(await page.locator('.theme input[value="light"]').isChecked()).toBe(true);
    // 3. the toggle: dark, then back to system (the switch waits for the new theme's images, then cross-fades)
    await page.click('.theme label[data-v="dark"]');
    await expect.poll(() => state(page)).toMatchObject({ pref: 'dark', theme: 'dark', bg: DARK, dark: true, light: false, stored: 'dark', meta: ['#08090a', '#08090a'] });
    // Chrome commits localStorage to the browser process asynchronously: on a busy machine, a reload
    // fired at once could still read the old value (seen once in round 4). Let the write settle.
    await page.waitForTimeout(200);
    await page.reload();
    expect(await state(page)).toMatchObject({ pref: 'dark', theme: 'dark', bg: DARK });
    await page.click('.theme label[data-v="system"]');
    await expect.poll(() => state(page)).toMatchObject({ pref: 'system', theme: null, bg: DARK, stored: 'system', meta: ['#08090a', '#fbfaf7'] });
    // keyboard: the toggle is a radio group
    await page.focus('.theme input[value="system"]');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => state(page)).toMatchObject({ pref: 'dark', theme: 'dark' });
    await ctx.close();
    // 4. without JavaScript the toggle (which could not work) is hidden, and the system decides
    const ctx2 = await browser.newContext({ colorScheme: 'light', javaScriptEnabled: false });
    const p2 = await ctx2.newPage();
    await p2.goto(url);
    expect(await p2.locator('.theme').isVisible()).toBe(false);
    expect(await p2.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(LIGHT);
    await ctx2.close();
  } finally {
    await browser.close();
  }
});

test('every referenced local file exists (src, href and srcset)', () => {
  for (const rel of allHtml()) {
    const html = read('docs', rel);
    for (const ref of [...all(/(?:src|href)="([^"#:]+)(?:#[^"]*)?"/g, html), ...srcsets(html)]) {
      if (!ref) continue;
      const target = path.join(DOCS, path.dirname(rel), ref);
      const ok = fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
      expect(ok, `${rel} -> ${ref}`).toBe(true);
    }
  }
});

test('every page has a language switcher with all 4 languages, the current one marked, links resolving', () => {
  const pages = allHtml();
  expect(pages.length).toBe(12); // 4 x (landing + privacy) + blog index + 3 articles
  for (const rel of pages) {
    const html = read('docs', rel);
    const nav = /<nav class="langs" aria-label="([^"]+)">([\s\S]*?)<\/nav>/.exec(html);
    expect(nav, rel).toBeTruthy();
    const pageLang = /<html lang="(\w+)">/.exec(html)[1];
    expect(nav[1], rel).toBe(SITE[pageLang].langLabel);
    const links = [...nav[2].matchAll(/<a href="([^"]+)" hreflang="(\w+)" lang="\w+" data-set-lang="(\w+)"( aria-current="page")?>.*?<span class="sr">([^<]+)<\/span><\/a>/g)];
    expect(links.map((m) => m[2]), rel).toEqual(SITE_LANGS);
    expect(links.filter((m) => m[4]).map((m) => m[2]), rel).toEqual([pageLang]);
    for (const [, href, hl, setLang, , name] of links) {
      expect(setLang).toBe(hl);
      expect(name).toBe(LANG_NAMES[hl]);
      const target = path.join(DOCS, path.dirname(rel), href);
      const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
      expect(fs.existsSync(file), `${rel} -> ${href}`).toBe(true);
      expect(read('docs', path.relative(DOCS, file)), `${rel} -> ${href}`).toContain(`<html lang="${hl}">`);
    }
    // localized pages switch to the same page in the other language
    if (/^(\w\w\/)?(index|privacy)\.html$/.test(rel)) {
      const file = path.basename(rel);
      for (const [, href, hl] of links) expect(path.normalize(path.join(path.dirname(rel), href, href.endsWith('/') ? 'index.html' : '')), rel).toBe(path.normalize(dirOf(hl) + (file === 'index.html' ? 'index.html' : file)).replace(/index\.html\/index\.html$/, 'index.html'));
    }
    expect(html, rel).toContain('assets/site.js');
  }
  // the first-visit redirect lives on the root landing page only
  for (const rel of pages) expect(read('docs', rel).includes('location.replace'), rel).toBe(rel === 'index.html');
});

test('privacy translations: same structure as English and the same contact placeholder everywhere', () => {
  const en = read('focusfence/store/privacy-policy.md');
  const contact = /## Contact\n\n[^\n]*\*\*(.+?)\*\*/.exec(en)[1];
  expect(contact).toBe('contact@focusfence.dev');
  const shape = (md) => ({
    h2: (md.match(/^## /gm) || []).length,
    rows: (md.match(/^\|/gm) || []).length,
    bullets: (md.match(/^- /gm) || []).length,
    steps: (md.match(/^\d+\. /gm) || []).length,
    links: (md.match(/https?:\/\/[^\s)>]+/g) || []).sort(),
    code: (md.match(/`[^`]+`/g) || []).sort(),
  });
  for (const lang of ['fr', 'es', 'de']) {
    const md = read(`focusfence/store/privacy-policy.${lang}.md`);
    expect(md, lang).toContain('{{CONTACT}}');
    expect(md, lang).not.toContain('CONTACT EMAIL');
    expect(md, lang).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/);
    expect(shape(md), lang).toEqual(shape(en));
  }
  for (const lang of SITE_LANGS) {
    const html = read('docs', dirOf(lang) + 'privacy.html');
    expect(html, lang).toContain(`<strong><a href="mailto:${contact}">${contact}</a></strong>`);
    expect(html, lang).not.toContain('CONTACT EMAIL');
  }
});

test('site strings: every language has the same keys and shapes as English, and is actually translated', () => {
  const keys = Object.keys(SITE.en).sort();
  const same = { navBlog: 1, faqH2: 1, footContact: 1 }; // identical in some languages on purpose
  for (const lang of ['fr', 'es', 'de']) {
    expect(Object.keys(SITE[lang]).sort(), lang).toEqual(keys);
    for (const k of keys) {
      const a = SITE.en[k];
      const b = SITE[lang][k];
      expect(Array.isArray(b), `${lang}.${k}`).toBe(Array.isArray(a));
      if (Array.isArray(a)) {
        expect(b.length, `${lang}.${k}`).toBe(a.length);
        expect(JSON.stringify(b.map((x) => (Array.isArray(x) ? x.length : 1))), `${lang}.${k}`).toBe(JSON.stringify(a.map((x) => (Array.isArray(x) ? x.length : 1))));
      } else if (!same[k]) {
        expect(b, `${lang}.${k} untranslated`).not.toBe(a);
      }
      // same HTML tags and tokens in the same quantities
      const tags = (v) => (JSON.stringify(v).match(/<\/?\w+|\{\w+\}/g) || []).sort().join();
      expect(tags(b), `${lang}.${k} markup`).toBe(tags(a));
    }
    // prices match the store listing for that language
    const listing = read(`focusfence/store/listing.${lang}.md`);
    for (const k of ['priceMonthly', 'priceYearly']) expect(listing, `${lang}.${k}`).toContain(SITE[lang][k]);
  }
});

test('custom domain: docs/CNAME matches the canonical site origin', () => {
  expect(read('docs/CNAME')).toBe(new URL(SITE_URL).host + '\n');
  expect(new URL(SITE_URL).host).toBe('focusfence.dev');
  expect(read('docs/robots.txt')).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
});

test('sitemap lists every language with hreflang alternates', () => {
  const sm = read('docs/sitemap.xml');
  expect(sm).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  for (const file of ['', 'privacy.html']) {
    for (const l of SITE_LANGS) {
      expect(sm).toContain(`<loc>${SITE_URL}${dirOf(l)}${file}</loc>`);
      expect(sm).toContain(`<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${dirOf(l)}${file}"/>`);
    }
  }
});

test('first-visit redirect: root only, follows navigator.language, never overrides an explicit choice', async () => {
  // Serve docs/ under /focusfence/ like GitHub Pages does.
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith('/focusfence/')) return res.writeHead(404).end();
    p = path.join(DOCS, p.slice('/focusfence/'.length));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!p.startsWith(DOCS) || !fs.existsSync(p)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }).end(fs.readFileSync(p));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const root = `http://127.0.0.1:${server.address().port}/focusfence/`;
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  const at = async (page) => {
    await page.waitForLoadState('load');
    return page.url().slice(root.length);
  };
  try {
    // 1. Browser language picks the page on a first visit to the root
    for (const [locale, expected] of [['fr-FR', 'fr/'], ['es-MX', 'es/'], ['de-AT', 'de/'], ['en-GB', ''], ['pt-BR', ''], ['ja', '']]) {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto(root);
      expect(await at(page), locale).toBe(expected);
      await ctx.close();
    }
    // 2. The hash survives the redirect; deep pages and other languages are never redirected
    const ctx = await browser.newContext({ locale: 'fr-FR' });
    const page = await ctx.newPage();
    await page.goto(root + '#pricing');
    expect(await at(page)).toBe('fr/#pricing');
    for (const rel of ['privacy.html', 'de/', 'es/privacy.html', 'blog/']) {
      await page.goto(root + rel);
      expect(await at(page), rel).toBe(rel);
    }
    // 3. Explicit choice: clicking EN in the switcher on /fr/ sticks, even on later root visits
    await page.goto(root + 'fr/');
    await page.click('nav.langs a[hreflang="en"]');
    expect(await at(page)).toBe('');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('ff-lang'))).toBe('en');
    await page.goto(root);
    expect(await at(page)).toBe('');
    // 4. Choosing DE from a privacy page leads to the German privacy page and to /de/ from the root later
    await page.goto(root + 'privacy.html');
    await page.click('nav.langs a[hreflang="de"]');
    expect(await at(page)).toBe('de/privacy.html');
    await page.goto(root);
    expect(await at(page)).toBe('de/');
    await ctx.close();
    // 5. Without localStorage (blocked storage) the page still works: falls back to detection
    const ctx2 = await browser.newContext({ locale: 'es-ES' });
    await ctx2.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    const p2 = await ctx2.newPage();
    const errors = [];
    p2.on('pageerror', (e) => errors.push(e.message));
    await p2.goto(root);
    expect(await at(p2)).toBe('es/');
    // in-site navigation to the root (switcher EN link) is an explicit choice: no bounce back
    await p2.click('nav.langs a[hreflang="en"]');
    expect(await at(p2)).toBe('');
    await expect(p2.locator('html')).toHaveAttribute('lang', 'en');
    expect(errors).toEqual([]);
    await ctx2.close();
  } finally {
    await browser.close();
    server.close();
  }
});
