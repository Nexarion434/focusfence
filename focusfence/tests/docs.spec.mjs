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
  const env = { ...process.env };
  if (process.env.FF_CHROME_LIBS) env.LD_LIBRARY_PATH = process.env.FF_CHROME_LIBS;
  const browser = await chromium.launch({ env });
  try {
    const problems = [];
    const localized = SITE_LANGS.flatMap((l) => [(l === 'en' ? '' : l + '/') + 'index.html', (l === 'en' ? '' : l + '/') + 'privacy.html']);
    for (const rel of [...localized, 'blog/index.html', 'blog/block-youtube-shorts-chrome.html']) {
      for (const width of [1280, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 800 } });
        const page = await context.newPage();
        await page.goto('file://' + path.join(DOCS, rel));
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push(`${rel}@${width}: horizontal scroll`);
        if (width === 1280) {
          const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          for (const v of r.violations) problems.push(`${rel}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        }
        await context.close();
      }
    }
    expect(problems).toEqual([]);
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
      // og:image is the localized promo tile, and exists
      const og = /<meta property="og:image" content="([^"]+)">/.exec(html)[1];
      expect(og, rel).toBe(`${SITE_URL}assets/${lang}/social.png`);
      expect(fs.existsSync(path.join(DOCS, og.slice(SITE_URL.length))), og).toBe(true);
      expect(desc.length, rel + ' description').toBeLessThanOrEqual(300);
      expect(html, rel).not.toContain('{{');
      expect(html, rel).not.toMatch(/\{(source|privacy|license)\}/);
    }
  }
});

test('landing pages use the localized screenshots, and every referenced local file exists', () => {
  for (const lang of SITE_LANGS) {
    const rel = dirOf(lang) + 'index.html';
    const html = read('docs', rel);
    const imgs = all(/<img[^>]* src="([^"]+)"/g, html);
    expect(imgs.length, rel).toBe(4);
    for (const src of imgs) expect(src, rel).toContain(`assets/${lang}/`);
    // the popup screenshot really is the localized one (button label in that language)
    expect(html, rel).toContain(S.blockSite[lang]);
    const popup = fs.readFileSync(path.join(DOCS, 'assets', lang, 'popup.png'));
    const source = fs.readFileSync(path.join(ROOT, lang === 'en' ? 'screenshots/popup.png' : `screenshots/${lang}/popup.png`));
    expect(popup.equals(source), lang).toBe(true);
  }
  for (const rel of allHtml()) {
    const html = read('docs', rel);
    for (const ref of all(/(?:src|href)="([^"#:]+)(?:#[^"]*)?"/g, html)) {
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
    expect(html, rel).toContain('assets/lang.js');
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
  const same = { navBlog: 1, faqH2: 1 }; // identical in some languages on purpose
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
