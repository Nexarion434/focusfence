// Generates the static GitHub Pages site in ../docs (repo root):
//   docs/index.html, docs/privacy.html            English (default, x-default)
//   docs/<lang>/index.html, docs/<lang>/privacy.html  fr, es, de
//   docs/blog/                                     English-only articles
// Landing strings: scripts/site-strings.mjs. Privacy: store/privacy-policy[.<lang>].md
// (translations use {{CONTACT}}, filled from the English file's Contact line so
// the address is entered once). Usage: npm run docs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './launch.mjs';
import { SITE, SITE_LANGS, LANG_NAMES, OG_LOCALE } from './site-strings.mjs';

const DOCS = path.resolve(ROOT, '..', 'docs');
const STORE_URL = null; // set to the Chrome Web Store URL once published
const SOURCE_URL = 'https://github.com/Nexarion434/focusfence';
const SITE_URL = 'https://nexarion434.github.io/focusfence/';
const LICENSE_URL = `${SOURCE_URL}/blob/main/focusfence/LICENSE`;
export const LANG_STORAGE_KEY = 'ff-lang';

const dirOf = (lang) => (lang === 'en' ? '' : lang + '/');

/* ---------------------------------------------------------------- assets */
fs.rmSync(DOCS, { recursive: true, force: true });
fs.mkdirSync(path.join(DOCS, 'assets'), { recursive: true });
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(DOCS, 'assets', to)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, from), path.join(DOCS, 'assets', to));
};
copy('src/icons/icon128.png', 'icon128.png');
copy('src/icons/icon32.png', 'favicon.png');
copy('src/fonts/inter-var-latin.woff2', 'inter.woff2');
// Localized UI screenshots (scripts/screenshots.mjs --lang): screenshots/ = en, screenshots/<lang>/ otherwise.
const SHOTS = { popup: 'popup.png', 'block-page': 'block-page.png', stats: 'options-stats.png', schedule: 'options-schedule.png', social: 'promo-tile-440x280.png' };
for (const lang of SITE_LANGS) {
  for (const [name, file] of Object.entries(SHOTS)) {
    const localized = lang === 'en' ? `screenshots/${file}` : `screenshots/${lang}/${file}`;
    copy(fs.existsSync(path.join(ROOT, localized)) ? localized : `screenshots/${file}`, `${lang}/${name}.png`);
  }
}
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
const pngSize = (rel) => {
  const b = fs.readFileSync(path.join(DOCS, rel));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

/* ------------------------------------------------ tiny markdown renderer */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
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
      const id = m[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

/* ------------------------------------------------------------ typography */
// French: non-breaking space before ? ! : ; » and after «.
const typo = (lang, s) => (lang === 'fr' ? s.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ') : s);

/* ------------------------------------------------------- language plumbing */
// Root only: first-visit redirect from navigator.languages. An explicit choice
// (a click in the language switcher, stored in localStorage) always wins, and
// English is never redirected away from once chosen. Arriving from another page
// of the site (e.g. the EN link of the switcher) never redirects either, so the
// choice holds even when localStorage is blocked.
const REDIRECT_JS = `(function(){try{var L=${JSON.stringify(SITE_LANGS.filter((l) => l !== 'en'))},K=${JSON.stringify(LANG_STORAGE_KEY)},s=null,r=document.referrer,b=location.origin+location.pathname.replace(/[^/]*$/,'');if(r&&r.indexOf(b)===0)return;try{s=localStorage.getItem(K)}catch(e){}if(s==='en')return;var t=L.indexOf(s)>=0?s:null;if(!t&&!s){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];for(var i=0;i<n.length;i++){var c=String(n[i]).toLowerCase().split('-')[0];if(c==='en')break;if(L.indexOf(c)>=0){t=c;break}}}if(t)location.replace(t+'/'+location.search+location.hash)}catch(e){}})();`;
const LANG_JS = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-set-lang]');if(a){try{localStorage.setItem(${JSON.stringify(LANG_STORAGE_KEY)},a.getAttribute('data-set-lang'))}catch(err){}}});\n`;

/* ------------------------------------------------------------ shared bits */
const LOGO = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#2E7D6B"/><rect x="6" y="13" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/><rect x="6" y="19" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/><path d="M8.5 10.2 10.5 7l2 3.2V25h-4zM14 10.2 16 7l2 3.2V25h-4zM19.5 10.2 21.5 7l2 3.2V25h-4z" fill="#fff"/></svg>`;

/**
 * @param o.lang        page language
 * @param o.base        relative path to the site root ('' | '../')
 * @param o.file        file name within the language folder ('' for index, 'privacy.html')
 * @param o.translated  true if the page exists in every language (emits hreflang)
 * @param o.switchHref  lang -> href for the switcher (defaults to the same page in that language)
 */
function page({ lang, base, file, translated, title, description, body, canonical, noindex, redirect, switchHref }) {
  const T = SITE[lang];
  const home = base + dirOf(lang);
  const sameIn = (l) => base + dirOf(l) + file;
  const switcher = SITE_LANGS.map((l) => {
    const href = (switchHref ? switchHref(l) : sameIn(l)) || './';
    const current = l === lang ? ' aria-current="page"' : '';
    return `<a href="${href}" hreflang="${l}" lang="${l}" data-set-lang="${l}"${current}><span aria-hidden="true">${l.toUpperCase()}</span><span class="sr">${LANG_NAMES[l]}</span></a>`;
  }).join('');
  const alternates = translated
    ? SITE_LANGS.map((l) => `\n<link rel="alternate" hreflang="${l}" href="${SITE_URL}${dirOf(l)}${file}">`).join('') +
      `\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}${file}">`
    : '';
  const ogAlt = translated
    ? SITE_LANGS.filter((l) => l !== lang).map((l) => `\n<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`).join('')
    : '';
  const fill = (s) => typo(lang, s).replace(/\{license\}/g, LICENSE_URL).replace(/\{source\}/g, SOURCE_URL).replace(/\{privacy\}/g, home + 'privacy.html');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${redirect ? `\n<script>${REDIRECT_JS}</script>` : ''}
<title>${attr(title)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${canonical}">${alternates}${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="FocusFence">
<meta property="og:locale" content="${OG_LOCALE[lang]}">${ogAlt}
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:image" content="${SITE_URL}assets/${lang}/social.png">
<meta property="og:image:width" content="440">
<meta property="og:image:height" content="280">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="${base}assets/favicon.png">
<link rel="stylesheet" href="${base}assets/site.css">
<script src="${base}assets/lang.js" defer></script>
</head>
<body>
<header class="nav"><div class="wrap nav-in">
  <a class="brand" href="${home || './'}">${LOGO(28)}<span>FocusFence</span></a>
  <div class="nav-right">
    <nav><a href="${home || './'}#features">${T.navFeatures}</a><a href="${home || './'}#pricing">${T.navPricing}</a><a href="${base}blog/" hreflang="en">${T.navBlog}</a><a href="${home}privacy.html">${T.navPrivacy}</a></nav>
    <nav class="langs" aria-label="${attr(T.langLabel)}">${switcher}</nav>
  </div>
</div></header>
${fill(body)}
<footer class="foot"><div class="wrap foot-in">
  <div class="brand">${LOGO(22)}<span>FocusFence</span></div>
  <p>${fill(T.footLicense)} · <a href="${SOURCE_URL}">${T.footSource}</a> · <a href="${home}privacy.html">${T.footPrivacy}</a> · <a href="${base}blog/" hreflang="en">${T.footBlog}</a></p>
  <p class="muted">${fill(T.footNotAffiliated)}</p>
</div></footer>
</body>
</html>
`;
}

/* --------------------------------------------------------------- landing */
function landing(lang) {
  const T = SITE[lang];
  const img = (name, alt, cls, extra = '') => {
    const rel = `assets/${lang}/${name}.png`;
    const [w, h] = pngSize(rel);
    return `<img${cls ? ` class="${cls}"` : ''} src="${dirOf(lang) ? '../' : ''}${rel}" width="${w}" height="${h}"${extra} alt="${attr(alt)}">`;
  };
  const CTA = STORE_URL
    ? `<a class="btn btn-primary" href="${STORE_URL}">${T.ctaAdd}</a>`
    : `<span class="btn btn-primary is-soon" aria-disabled="true">${T.ctaSoon}</span>`;
  const li = (t) => `<li>${t}</li>`;
  const PRO = [false, true, true, true, true, true];
  const body = `
<main>
<section class="hero"><div class="wrap hero-in">
  <div class="hero-copy">
    <p class="eyebrow">${T.eyebrow}</p>
    <h1>${T.h1}</h1>
    <p class="lead">${T.lead}</p>
    <div class="cta">${CTA}<a class="btn" href="#features">${T.ctaFeatures}</a></div>
    <p class="small muted">${T.heroSmall}</p>
  </div>
  <div class="hero-shot">${img('popup', T.altPopup, '')}</div>
</div></section>

<section class="band"><div class="wrap">
  ${img('block-page', T.altBlock, 'wide', ' loading="lazy"')}
</div></section>

<section id="features"><div class="wrap">
  <h2>${T.featuresH2}</h2>
  <div class="grid3">
${T.features.map(([h, p], i) => `    <div class="feat"><h3>${h}${PRO[i] ? ' <span class="pro">PRO</span>' : ''}</h3><p>${p}</p></div>`).join('\n')}
  </div>
  <div class="shots">
    ${img('schedule', T.altSchedule, '', ' loading="lazy"')}
    ${img('stats', T.altStats, '', ' loading="lazy"')}
  </div>
</div></section>

<section class="privacy-band"><div class="wrap grid3">
${T.privacyBand.map(([h, p]) => `  <div><h3>${h}</h3><p>${p}</p></div>`).join('\n')}
</div></section>

<section id="pricing"><div class="wrap">
  <h2>${T.pricingH2}</h2>
  <div class="prices">
    <div class="price"><h3>${T.planFree}</h3><div class="amt">${T.priceFree}</div><ul class="checks">${T.freeItems.map(li).join('')}</ul></div>
    <div class="price"><h3>${T.planMonthly}</h3><div class="amt">${T.priceMonthly}<span>${T.perMonth}</span></div><ul class="checks">${T.monthlyItems.map(li).join('')}</ul></div>
    <div class="price featured"><h3>${T.planYearly} <span class="save">${T.save}</span></h3><div class="amt">${T.priceYearly}<span>${T.perYear}</span></div><ul class="checks">${T.yearlyItems.map(li).join('')}</ul></div>
  </div>
  <p class="small muted center">${T.paymentsNote}</p>
</div></section>

<section id="faq"><div class="wrap narrow">
  <h2>${T.faqH2}</h2>
${T.faq.map(([q, a]) => `  <details><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</div></section>

<section class="final"><div class="wrap center">
  <h2>${T.finalH2}</h2>
  <div class="cta center">${CTA}</div>
</div></section>
</main>`;
  return page({
    lang,
    base: dirOf(lang) ? '../' : '',
    file: '',
    translated: true,
    redirect: lang === 'en',
    title: typo(lang, T.title),
    description: typo(lang, T.description),
    canonical: SITE_URL + dirOf(lang),
    body,
  });
}

/* ---------------------------------------------------------------- privacy */
const privacyMd = (lang) => fs.readFileSync(path.join(ROOT, `store/privacy-policy${lang === 'en' ? '' : '.' + lang}.md`), 'utf8');
const enPrivacy = privacyMd('en');
const contactMatch = /## Contact\n\n[^\n]*\*\*(.+?)\*\*/.exec(enPrivacy);
if (!contactMatch) throw new Error('store/privacy-policy.md: no **contact** on the line after "## Contact"');
export const CONTACT = contactMatch[1];
const linkContact = (html) =>
  /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(CONTACT) ? html.split(`<strong>${CONTACT}</strong>`).join(`<strong><a href="mailto:${CONTACT}">${CONTACT}</a></strong>`) : html;

function privacy(lang) {
  const T = SITE[lang];
  let md = privacyMd(lang);
  if (lang !== 'en') {
    if (!md.includes('{{CONTACT}}')) throw new Error(`privacy-policy.${lang}.md must use {{CONTACT}} for the contact address`);
    md = typo(lang, md).split('{{CONTACT}}').join(CONTACT);
  }
  return page({
    lang,
    base: dirOf(lang) ? '../' : '',
    file: 'privacy.html',
    translated: true,
    title: typo(lang, T.privacyTitle),
    description: typo(lang, T.privacyDescription),
    canonical: SITE_URL + dirOf(lang) + 'privacy.html',
    body: `<main class="doc"><div class="wrap narrow prose">${linkContact(markdown(md))}</div></main>`,
  });
}

for (const lang of SITE_LANGS) {
  fs.mkdirSync(path.join(DOCS, dirOf(lang)), { recursive: true });
  fs.writeFileSync(path.join(DOCS, dirOf(lang), 'index.html'), landing(lang));
  fs.writeFileSync(path.join(DOCS, dirOf(lang), 'privacy.html'), privacy(lang));
}

/* ------------------------------------------------------------------ blog */
// Sources: ../marketing/blog/*.md with front-matter. Drafts are rendered with
// <meta name="robots" content="noindex"> and left out of the sitemap.
// Articles are English-only: their language switcher leads to each language's home page.
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
const blogPage = (o, selfFile) =>
  page({ ...o, lang: 'en', base: '../', file: '', translated: false, switchHref: (l) => (l === 'en' ? selfFile : '../' + dirOf(l)) });
for (const post of posts) {
  fs.writeFileSync(
    path.join(DOCS, 'blog', post.slug + '.html'),
    blogPage(
      {
        title: post.title + ' — FocusFence',
        description: post.description,
        canonical: SITE_URL + 'blog/' + post.slug + '.html',
        noindex: post.draft,
        body: `<main class="doc"><article class="wrap narrow prose"><p class="muted small">${post.date}</p>${markdown(post.body)}</article></main>`,
      },
      post.slug + '.html'
    )
  );
}
fs.writeFileSync(
  path.join(DOCS, 'blog', 'index.html'),
  blogPage(
    {
      title: 'Blog — FocusFence',
      description: 'Guides on blocking distracting websites in Chrome, focus routines and privacy.',
      canonical: SITE_URL + 'blog/',
      noindex: posts.every((p) => p.draft),
      body: `<main class="doc"><div class="wrap narrow prose"><h1>Blog</h1>${posts
        .map((p) => `<h2><a href="${p.slug}.html">${esc(p.title)}</a></h2><p>${esc(p.description)}</p>`)
        .join('\n')}</div></main>`,
    },
    './'
  )
);

/* ------------------------------------------------- css, js, robots, sitemap */
fs.writeFileSync(path.join(DOCS, 'assets', 'site.css'), fs.readFileSync(path.join(ROOT, 'scripts/site.css')));
fs.writeFileSync(path.join(DOCS, 'assets', 'lang.js'), LANG_JS);
fs.writeFileSync(path.join(DOCS, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
const alt = (file) =>
  SITE_LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${dirOf(l)}${file}"/>`).join('') +
  `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${file}"/>`;
fs.writeFileSync(
  path.join(DOCS, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    ['', 'privacy.html'].flatMap((file) => SITE_LANGS.map((l) => `<url><loc>${SITE_URL}${dirOf(l)}${file}</loc>${alt(file)}</url>\n`)).join('') +
    posts.filter((p) => !p.draft).map((p) => `<url><loc>${SITE_URL}blog/${p.slug}.html</loc></url>\n`).join('') +
    `</urlset>\n`
);
console.log('docs written to', DOCS);
