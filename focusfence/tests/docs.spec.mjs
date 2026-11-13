// Static site (docs/) and marketing drafts: generated correctly, drafts stay
// unindexed, accessible pages, platform limits respected.
import { test, expect, chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/launch.mjs';

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
    for (const rel of ['index.html', 'privacy.html', 'blog/index.html', 'blog/block-youtube-shorts-chrome.html']) {
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
