// Generates the static GitHub Pages site in ../docs (repo root):
//   docs/index.html    landing page
//   docs/privacy.html  rendered from store/privacy-policy.md (single source of truth)
// Usage: npm run docs   — then enable Pages on branch "main", folder "/docs".
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './launch.mjs';

const DOCS = path.resolve(ROOT, '..', 'docs');
const STORE_URL = null; // set to the Chrome Web Store URL once published
const SOURCE_URL = 'https://github.com/Nexarion434/focusfence';
const SITE_URL = 'https://nexarion434.github.io/focusfence/';

fs.rmSync(DOCS, { recursive: true, force: true });
fs.mkdirSync(path.join(DOCS, 'assets'), { recursive: true });
const copy = (from, to) => fs.copyFileSync(path.join(ROOT, from), path.join(DOCS, 'assets', to));
copy('src/icons/icon128.png', 'icon128.png');
copy('src/icons/icon32.png', 'favicon.png');
copy('src/fonts/inter-var-latin.woff2', 'inter.woff2');
copy('screenshots/popup.png', 'popup.png');
copy('screenshots/block-page.png', 'block-page.png');
copy('screenshots/options-stats.png', 'stats.png');
copy('screenshots/options-schedule.png', 'schedule.png');
copy('screenshots/promo-tile-440x280.png', 'social.png');
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');

/* ------------------------------------------------ tiny markdown renderer */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>');
}
function markdown(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    let m;
    if ((m = /^(#{1,3}) (.*)$/.exec(line))) {
      const level = m[1].length;
      const id = m[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      out.push(`<h${level} id="${id}">${inline(m[2])}</h${level}>`);
      i++;
    } else if (/^\s*[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-*] /.test(lines[i]) || /^\d+\. /.test(lines[i]))) {
        items.push(`<li>${inline(lines[i].replace(/^\s*([-*]|\d+\.) /, ''))}</li>`);
        i++;
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(
        `<div class="table"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>` +
          body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') +
          '</tbody></table></div>'
      );
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#|\||\s*[-*] |\d+\. )/.test(lines[i])) para.push(lines[i++]);
      out.push(`<p>${inline(para.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

/* ------------------------------------------------------------ shared bits */
const LOGO = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#2E7D6B"/><rect x="6" y="13" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/><rect x="6" y="19" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/><path d="M8.5 10.2 10.5 7l2 3.2V25h-4zM14 10.2 16 7l2 3.2V25h-4zM19.5 10.2 21.5 7l2 3.2V25h-4z" fill="#fff"/></svg>`;

let BASE = ''; // '' for root pages, '../' for pages in docs/blog/
const CTA = STORE_URL
  ? `<a class="btn btn-primary" href="${STORE_URL}">Add to Chrome — it's free</a>`
  : `<span class="btn btn-primary is-soon" aria-disabled="true">Coming soon to the Chrome Web Store</span>`;

function page({ title, description, body, canonical, noindex }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${SITE_URL}assets/social.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="${BASE}assets/favicon.png">
<link rel="stylesheet" href="${BASE}assets/site.css">
</head>
<body>
<header class="nav"><div class="wrap nav-in">
  <a class="brand" href="${BASE}./">${LOGO(28)}<span>FocusFence</span></a>
  <nav><a href="${BASE}./#features">Features</a><a href="${BASE}./#pricing">Pricing</a><a href="${BASE}blog/">Blog</a><a href="${BASE}privacy.html">Privacy</a></nav>
</div></header>
${body}
<footer class="foot"><div class="wrap foot-in">
  <div class="brand">${LOGO(22)}<span>FocusFence</span></div>
  <p>Free software under the <a href="${SOURCE_URL}/blob/main/focusfence/LICENSE">GNU AGPL v3</a> · <a href="${SOURCE_URL}">Source code</a> · <a href="${BASE}privacy.html">Privacy policy</a> · <a href="${BASE}blog/">Blog</a></p>
  <p class="muted">Not affiliated with Google. Chrome is a trademark of Google LLC.</p>
</div></footer>
</body>
</html>
`;
}

/* --------------------------------------------------------------- landing */
const check = (t) => `<li>${t}</li>`;
const landing = page({
  title: 'FocusFence — Website Blocker & Focus Timer for Chrome',
  description:
    'Block distracting websites in Chrome. Block YouTube Shorts but keep YouTube, schedule focus hours, run Pomodoro sessions and lock yourself in with strict mode. Private: nothing leaves your device.',
  canonical: SITE_URL,
  body: `
<main>
<section class="hero"><div class="wrap hero-in">
  <div class="hero-copy">
    <p class="eyebrow">Website blocker for Chrome</p>
    <h1>Fence off the <em>endless feeds.</em></h1>
    <p class="lead">FocusFence blocks the sites that steal your attention, in one click. Block all of Reddit, or only YouTube Shorts. Set focus hours. When willpower runs out, turn on strict mode.</p>
    <div class="cta">${CTA}<a class="btn" href="#features">See features</a></div>
    <p class="small muted">Free forever for unlimited sites · No account · No tracking</p>
  </div>
  <div class="hero-shot"><img src="assets/popup.png" width="360" height="437" alt="FocusFence popup with a running focus session and a one-click Block site button"></div>
</div></section>

<section class="band"><div class="wrap">
  <img class="wide" src="assets/block-page.png" width="1280" height="800" loading="lazy" alt="The FocusFence block page: reddit.com is fenced off, with a motivational quote and time reclaimed today">
</div></section>

<section id="features"><div class="wrap">
  <h2>Everything you need to stay focused. Nothing you don't.</h2>
  <div class="grid3">
    <div class="feat"><h3>Block a site in one click</h3><p>Open the popup and press <strong>Block site</strong>. Blocking reddit.com also blocks old.reddit.com, m.reddit.com and every other subdomain.</p></div>
    <div class="feat"><h3>Block only the bad part <span class="pro">PRO</span></h3><p>Block <code>youtube.com/shorts</code> and keep the rest of YouTube for tutorials and talks. Clicking into Shorts from inside YouTube is caught too. Keyword rules block any URL that contains a word.</p></div>
    <div class="feat"><h3>Schedules <span class="pro">PRO</span></h3><p>Block only during work hours, on the days you choose. Overnight ranges work too, e.g. 22:00–06:00 for better sleep.</p></div>
    <div class="feat"><h3>Pomodoro focus sessions <span class="pro">PRO</span></h3><p>Timed focus rounds and breaks. Everything on your list is blocked while you focus. The countdown sits on the toolbar icon.</p></div>
    <div class="feat"><h3>Strict mode <span class="pro">PRO</span></h3><p>While strict mode is on, blocking can't be switched off and sites can't be removed. Ending it early takes a 10-minute cooling-off period and a typing challenge.</p></div>
    <div class="feat"><h3>Stats, password lock &amp; more <span class="pro">PRO</span></h3><p>See blocked attempts per site and time reclaimed. Lock settings with a password, write your own block-page message, export and import your setup.</p></div>
  </div>
  <div class="shots">
    <img src="assets/schedule.png" width="1280" height="800" loading="lazy" alt="Schedule, focus session and strict mode settings">
    <img src="assets/stats.png" width="1280" height="800" loading="lazy" alt="Stats: blocked attempts per day and top sites">
  </div>
</div></section>

<section class="privacy-band"><div class="wrap grid3">
  <div><h3>Your data stays on your device</h3><p>Your blocklist, settings and stats live in Chrome's local storage. No account, no analytics, no ads.</p></div>
  <div><h3>FocusFence doesn't read your pages</h3><p>Blocking runs in Chrome's built-in rule engine (declarativeNetRequest). FocusFence never sees the content of the pages you visit.</p></div>
  <div><h3>Minimal permissions</h3><p>FocusFence asks for site access one site at a time, only for sites you block. If you say no, the site is still blocked.</p></div>
</div></section>

<section id="pricing"><div class="wrap">
  <h2>Simple pricing</h2>
  <div class="prices">
    <div class="price"><h3>Free</h3><div class="amt">$0</div><ul class="checks">${['Unlimited blocked sites', 'Subdomains included', 'One-click block from the popup', 'On/off switch', 'Calm block page'].map(check).join('')}</ul></div>
    <div class="price"><h3>Pro monthly</h3><div class="amt">$2.99<span>/month</span></div><ul class="checks">${['Everything in Free', 'Schedules', 'Path & keyword blocking', 'Pomodoro focus sessions', 'Strict mode', 'Password lock, stats, custom message, backup'].map(check).join('')}</ul></div>
    <div class="price featured"><h3>Pro yearly <span class="save">Save 44%</span></h3><div class="amt">$19.99<span>/year</span></div><ul class="checks">${['Everything in Pro monthly', '12 months for less than the price of 7'].map(check).join('')}</ul></div>
  </div>
  <p class="small muted center">Payments are processed by ExtensionPay (Stripe).</p>
</div></section>

<section id="faq"><div class="wrap narrow">
  <h2>Questions</h2>
  <details><summary>Can I block YouTube Shorts but still use YouTube?</summary><p>Yes, with Pro. Add <code>youtube.com/shorts</code> as a path rule. youtube.com, videos and search keep working. Shorts links and in-app navigation to Shorts are blocked.</p></details>
  <details><summary>Does blocking reddit.com also block old.reddit.com?</summary><p>Yes. A domain rule covers every subdomain, in Free and Pro.</p></details>
  <details><summary>Why does Chrome ask for permission when I add a site?</summary><p>Chrome only lets an extension redirect to its own block page on sites it has access to. FocusFence asks for that one site only. If you decline, the site is still blocked, but you'll see Chrome's error page instead of the FocusFence block page.</p></details>
  <details><summary>Can strict mode be bypassed?</summary><p>Honest answer: Chrome always lets you disable or remove an extension, and FocusFence can't block the extensions page. A timed strict session <strong>pauses</strong> while FocusFence is off, so its time can't run out in the background. Incognito windows are only covered if you allow FocusFence in Incognito, and FocusFence warns you when it isn't. Other browsers and devices aren't covered.</p></details>
  <details><summary>What data do you collect?</summary><p>None. See the <a href="privacy.html">privacy policy</a>. The only network traffic is ExtensionPay checking your license, and only after you choose to upgrade.</p></details>
  <details><summary>Is FocusFence open source?</summary><p>Yes, under the GNU AGPL v3. <a href="${SOURCE_URL}">Read the code</a>.</p></details>
</div></section>

<section class="final"><div class="wrap center">
  <h2>Get your focus back.</h2>
  <div class="cta center">${CTA}</div>
</div></section>
</main>`,
});

/* ---------------------------------------------------------------- privacy */
const md = fs.readFileSync(path.join(ROOT, 'store/privacy-policy.md'), 'utf8');
const privacy = page({
  title: 'Privacy Policy — FocusFence',
  description: 'FocusFence privacy policy: no account, no analytics, no tracking. Your blocklist and stats stay on your device.',
  canonical: SITE_URL + 'privacy.html',
  body: `<main class="doc"><div class="wrap narrow prose">${markdown(md)}</div></main>`,
});

fs.writeFileSync(path.join(DOCS, 'index.html'), landing);
fs.writeFileSync(path.join(DOCS, 'privacy.html'), privacy);

/* ------------------------------------------------------------------ blog */
// Sources: ../marketing/blog/*.md with front-matter. Drafts are rendered with
// <meta name="robots" content="noindex"> and left out of the sitemap.
const BLOG_SRC = path.resolve(ROOT, '..', 'marketing', 'blog');
const posts = fs
  .readdirSync(BLOG_SRC)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = fs.readFileSync(path.join(BLOG_SRC, f), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    if (!m) throw new Error('missing front-matter in ' + f);
    const meta = Object.fromEntries(
      m[1].split('\n').map((l) => {
        const i = l.indexOf(':');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
    );
    return { ...meta, draft: meta.draft === 'true', body: m[2] };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));
fs.mkdirSync(path.join(DOCS, 'blog'), { recursive: true });
BASE = '../';
for (const post of posts) {
  fs.writeFileSync(
    path.join(DOCS, 'blog', post.slug + '.html'),
    page({
      title: post.title + ' — FocusFence',
      description: post.description,
      canonical: SITE_URL + 'blog/' + post.slug + '.html',
      noindex: post.draft,
      body: `<main class="doc"><article class="wrap narrow prose"><p class="muted small">${post.date}</p>${markdown(post.body)}</article></main>`,
    })
  );
}
fs.writeFileSync(
  path.join(DOCS, 'blog', 'index.html'),
  page({
    title: 'Blog — FocusFence',
    description: 'Guides on blocking distracting websites in Chrome, focus routines and privacy.',
    canonical: SITE_URL + 'blog/',
    noindex: posts.every((p) => p.draft),
    body: `<main class="doc"><div class="wrap narrow prose"><h1>Blog</h1>${posts
      .map((p) => `<h2><a href="${p.slug}.html">${esc(p.title)}</a></h2><p>${esc(p.description)}</p>`)
      .join('\n')}</div></main>`,
  })
);
BASE = '';
fs.writeFileSync(path.join(DOCS, 'assets', 'site.css'), fs.readFileSync(path.join(ROOT, 'scripts/site.css')));
fs.writeFileSync(
  path.join(DOCS, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`
);
fs.writeFileSync(
  path.join(DOCS, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${SITE_URL}</loc></url>\n<url><loc>${SITE_URL}privacy.html</loc></url>\n` +
    posts.filter((p) => !p.draft).map((p) => `<url><loc>${SITE_URL}blog/${p.slug}.html</loc></url>\n`).join('') +
    `</urlset>\n`
);
console.log('docs written to', DOCS);
