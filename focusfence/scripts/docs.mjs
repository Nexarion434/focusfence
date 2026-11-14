// Generates the static GitHub Pages site in ../docs (repo root):
//   docs/index.html, docs/privacy.html            English (default, x-default)
//   docs/<lang>/index.html, docs/<lang>/privacy.html  fr, es, de
//   docs/blog/                                     English-only articles
//   docs/404.html, robots.txt, sitemap.xml, llms.txt, site.webmanifest, favicon.ico
// Landing strings: scripts/site-strings.mjs. Styles: scripts/site.css (inlined in
// every page). Client script: scripts/site.js. Product images: screenshots/site/<lang>/
// (npm run screenshots:site). Open Graph images and icons: site-art/ (npm run site:art).
// Privacy: store/privacy-policy[.<lang>].md (translations use {{CONTACT}}, filled
// from the English file's Contact line so the address is entered once).
// Usage: npm run docs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './launch.mjs';
import { SITE, SITE_LANGS, LANG_NAMES, OG_LOCALE } from './site-strings.mjs';
import { S } from './i18n/strings.mjs';
import { LOGO, FENCE } from './site-parts.mjs';

const DOCS = path.resolve(ROOT, '..', 'docs');
const STORE_URL = null; // set to the Chrome Web Store URL once published
const SOURCE_URL = 'https://github.com/Nexarion434/focusfence';
const SITE_URL = 'https://focusfence.dev/'; // custom domain (GitHub Pages, docs/CNAME)
// The site's root path ('/' on the custom domain): the 404 page and the web manifest are served
// at any depth, so they address files from the root.
const ROOT_PATH = new URL(SITE_URL).pathname;
const LICENSE_URL = `${SOURCE_URL}/blob/main/focusfence/LICENSE`;
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/manifest.json'), 'utf8'));
export const LANG_STORAGE_KEY = 'ff-lang';
// Inter with the optical-size axis (Inter Display shapes at large sizes), latin subset.
const FONT = 'node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2';

const dirOf = (lang) => (lang === 'en' ? '' : lang + '/');

/* ---------------------------------------------------------------- assets */
fs.rmSync(DOCS, { recursive: true, force: true });
fs.mkdirSync(path.join(DOCS, 'assets'), { recursive: true });
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(DOCS, 'assets', to)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, from), path.join(DOCS, 'assets', to));
};
if (!fs.existsSync(path.join(ROOT, FONT))) throw new Error(`${FONT} is missing: run npm install`);
copy(FONT, 'inter.woff2');
copy('src/icons/icon128.png', 'icon128.png');
copy('src/icons/icon32.png', 'favicon.png');
// Localized product images (npm run screenshots:site): screenshots/site/<lang>/.
const THEMED = [
  'block-page.webp',
  'block-page-1x.webp',
  'block-page-m.webp',
  'block-card.webp',
  'popup.webp',
  'blocklist.webp',
  'blocklist-1x.webp',
  'schedule.webp',
  'schedule-m.webp',
  'focus.webp',
  'strict.webp',
  'stats.webp',
  'stats-m.webp',
];
const SHOTS = [...THEMED, ...THEMED.map((f) => f.replace(/(-1x)?\.webp$/, '-light$1.webp'))];
for (const lang of SITE_LANGS) {
  for (const file of SHOTS) {
    const src = `screenshots/site/${lang}/${file}`;
    if (!fs.existsSync(path.join(ROOT, src))) throw new Error(`${src} is missing: run npm run screenshots:site`);
    copy(src, `${lang}/${file}`);
  }
}
// The site's own artwork (npm run site:art, rendered from the site's CSS and the logo): one Open
// Graph image per language (assets/<lang>/og.jpg), and the icons for phones' home screens and the
// web manifest.
const OG = 'og.jpg';
const SITE_ICONS = ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
for (const [from, to] of [...SITE_ICONS.map((f) => [f, f]), ...SITE_LANGS.map((l) => [`og-${l}.jpg`, `${l}/${OG}`])]) {
  if (!fs.existsSync(path.join(ROOT, 'site-art', from))) throw new Error(`site-art/${from} is missing: run npm run site:art`);
  copy(`site-art/${from}`, to);
}
// /favicon.ico, for the browsers and crawlers that ask for it whatever the page says: the
// extension's own 16, 32 and 48 px icons, stored as PNG inside the ICO container.
const ico = (pngs) => {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach((png, i) => {
    const [w, h, e] = [png.readUInt32BE(16), png.readUInt32BE(20), 6 + 16 * i];
    head.writeUInt8(w % 256, e); // 0 means 256
    head.writeUInt8(h % 256, e + 1);
    head.writeUInt16LE(1, e + 4); // colour planes
    head.writeUInt16LE(32, e + 6); // bits per pixel
    head.writeUInt32LE(png.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...pngs]);
};
fs.writeFileSync(path.join(DOCS, 'favicon.ico'), ico([16, 32, 48].map((s) => fs.readFileSync(path.join(ROOT, `src/icons/icon${s}.png`)))));
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DOCS, 'CNAME'), new URL(SITE_URL).host + '\n'); // GitHub Pages custom domain

/** Pixel size of a PNG, JPEG or WebP (VP8, VP8L or VP8X) file under docs/. */
function imageSize(rel) {
  const b = fs.readFileSync(path.join(DOCS, rel));
  if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: walk the segments to the start-of-frame (SOF0-15 but DHT, JPG and DAC): height, width
    for (let i = 2; i + 9 < b.length; i += 2 + b.readUInt16BE(i + 2)) {
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    }
  }
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  if (chunk === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  throw new Error('unknown image format: ' + rel);
}

/* ------------------------------------------------ tiny markdown renderer */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const strip = (s) => s.replace(/<[^>]+>/g, '');
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
        `<div class="table"><table><thead><tr>${head.map((h) => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>` +
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
// French: non-breaking space before ? ! : ; » and after « (written as  : an editor or a
// formatter can silently turn a literal no-break space back into a plain one).
const NBSP = ' ';
const typo = (lang, s) => (lang === 'fr' ? s.replace(/ ([?!:;»])/g, NBSP + '$1').replace(/« /g, '«' + NBSP) : s);

/* ------------------------------------------------------- language plumbing */
// Root only: first-visit redirect from navigator.languages. An explicit choice
// (a click in the language switcher, stored in localStorage) always wins, and
// English is never redirected away from once chosen. Arriving from another page
// of the site (e.g. the EN link of the switcher) never redirects either, so the
// choice holds even when localStorage is blocked.
const REDIRECT_JS = `(function(){try{var L=${JSON.stringify(SITE_LANGS.filter((l) => l !== 'en'))},K=${JSON.stringify(LANG_STORAGE_KEY)},s=null,r=document.referrer,b=location.origin+location.pathname.replace(/[^/]*$/,'');if(r&&r.indexOf(b)===0)return;try{s=localStorage.getItem(K)}catch(e){}if(s==='en')return;var t=L.indexOf(s)>=0?s:null;if(!t&&!s){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];for(var i=0;i<n.length;i++){var c=String(n[i]).toLowerCase().split('-')[0];if(c==='en')break;if(L.indexOf(c)>=0){t=c;break}}}if(t)location.replace(t+'/'+location.search+location.hash)}catch(e){}})();`;
// Theme: 'light' | 'dark' | 'system' (default) in localStorage. Runs in <head> before the
// styles, so the first paint already has the right theme. Also preloads the hero image of
// that theme (the hero images are lazy so that only one theme is ever downloaded).
export const THEME_STORAGE_KEY = 'ff-theme';
const THEME_COLOR = { dark: '#08090a', light: '#fbfaf7' };
const themeJs = (pre) =>
  `(function(){var d=document.documentElement,p='system',t;try{p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||p}catch(e){}` +
  `if(p!=='light'&&p!=='dark')p='system';d.setAttribute('data-theme-pref',p);` +
  `if(p==='system')t=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';` +
  `else{t=p;d.setAttribute('data-theme',p);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute('content',p==='light'?'${THEME_COLOR.light}':'${THEME_COLOR.dark}')}` +
  (pre
    ? `var l=document.createElement('link');l.rel='preload';l.as='image';l.setAttribute('fetchpriority','high');l.setAttribute('imagesizes',${JSON.stringify(pre.sizes)});l.setAttribute('imagesrcset',t==='light'?${JSON.stringify(pre.light)}:${JSON.stringify(pre.dark)});document.head.appendChild(l);`
    : '') +
  `})();`;
const SITE_JS = fs
  .readFileSync(path.join(ROOT, 'scripts/site.js'), 'utf8')
  .replace('__LANG_KEY__', LANG_STORAGE_KEY)
  .replaceAll('__THEME_KEY__', THEME_STORAGE_KEY)
  .replace('__THEME_DARK__', THEME_COLOR.dark)
  .replace('__THEME_LIGHT__', THEME_COLOR.light);
const CSS = fs.readFileSync(path.join(ROOT, 'scripts/site.css'), 'utf8');

/* ------------------------------------------------------------ shared bits */
fs.writeFileSync(path.join(DOCS, 'assets', 'favicon.svg'), LOGO(32).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));

// Privacy contact, entered once in store/privacy-policy.md.
const privacyMd = (lang) => fs.readFileSync(path.join(ROOT, `store/privacy-policy${lang === 'en' ? '' : '.' + lang}.md`), 'utf8');
const enPrivacy = privacyMd('en');
const contactMatch = /## Contact\n\n[^\n]*\*\*(.+?)\*\*/.exec(enPrivacy);
if (!contactMatch) throw new Error('store/privacy-policy.md: no **contact** on the line after "## Contact"');
export const CONTACT = contactMatch[1];
const MAILTO = `<a href="mailto:${CONTACT}">${CONTACT}</a>`;

// Small line icons (24-unit grid, 1.6 stroke), most of them shared with the extension's settings.
const ICON = {
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  page: '<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  backup: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.4 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.4-3.5-8.5s1.1-6 3.5-8.5z"/>',
  incognito: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/><path d="M4.5 4.5l15 15"/>',
  device: '<rect x="3.5" y="5" width="17" height="11.5" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/>',
  eyeoff: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><path d="M4.5 4.5l15 15"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41"/>',
  moon: '<path d="M19.5 14.6A7.5 7.5 0 0 1 9.4 4.5a7.5 7.5 0 1 0 10.1 10.1z"/>',
  monitor: '<rect x="3.5" y="4.5" width="17" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const PRO = '<span class="pro">PRO</span>';
// The closing scene's glass-pill fence (FENCE) and the logo come from scripts/site-parts.mjs,
// shared with the Open Graph images (scripts/site-art.mjs).
// Prices as written in each language ('$2.99', '2,99 €', '2,99 US$'): the amount, and an amount
// formatted the same way. The yearly card compares a year of each plan from these figures.
const amount = (price) => Number(/(\d+)[.,](\d\d)/.exec(price).slice(1).join('.'));
const priceLike = (price, value) => price.replace(/(\d+)[.,](\d\d)/, (m) => value.toFixed(2).replace('.', m.includes(',') ? ',' : '.'));

/* ------------------------------------------------- structured data (JSON-LD) */
// Everything here repeats what the page shows (Google's rule for structured data): the prices of the
// pricing table, the visible questions and answers. Never add ratings or reviews that don't exist.
const ORG_ID = SITE_URL + '#organization';
const organization = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'FocusFence',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: SITE_URL + 'assets/icon-512.png', width: 512, height: 512 },
  email: CONTACT,
  sameAs: [SOURCE_URL],
});
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});
/** Plain text of a trusted HTML string (tags dropped, the few entities the strings use decoded). */
const plain = (s) => strip(s).replace(/&nbsp;/g, NBSP).replace(/&amp;/g, '&');
/** <script type="application/ld+json"> with "<" escaped, so no string can close the element. */
const jsonLd = (nodes) =>
  `\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c')}</script>`;

/**
 * @param o.lang        page language
 * @param o.base        relative path to the site root ('' | '../')
 * @param o.file        file name within the language folder ('' for index, 'privacy.html')
 * @param o.translated  true if the page exists in every language (emits hreflang)
 * @param o.switchHref  lang -> href for the switcher (defaults to the same page in that language)
 * @param o.head        extra <head> markup (preloads)
 * @param o.canonical   absolute URL of the page, or null for a page without one (404)
 * @param o.ld          JSON-LD nodes describing the page (structured data), or null
 * @param o.article     { published: 'YYYY-MM-DD' } for a blog post (og:type article)
 */
function page({ lang, base, file, translated, title, description, body, canonical, noindex, redirect, switchHref, head = '', preload = null, ld = null, article = null }) {
  const T = SITE[lang];
  const home = base + dirOf(lang);
  const homeHref = home || './';
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
  const fill = (s) =>
    typo(lang, s)
      .replace(/\{license\}/g, LICENSE_URL)
      .replace(/\{source\}/g, SOURCE_URL)
      .replace(/\{privacy\}/g, home + 'privacy.html')
      .replace(/\{contact\}/g, MAILTO);
  const ogImage = `${SITE_URL}assets/${lang}/${OG}`;
  const [ogW, ogH] = imageSize(`assets/${lang}/${OG}`);
  const css = CSS.replace("url('inter.woff2')", `url('${base}assets/inter.woff2')`);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${redirect ? `\n<script>${REDIRECT_JS}</script>` : ''}
<title>${attr(title)}</title>
<meta name="description" content="${attr(description)}">${canonical ? `\n<link rel="canonical" href="${canonical}">` : ''}${alternates}${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="${THEME_COLOR.dark}" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="${THEME_COLOR.light}" media="(prefers-color-scheme: light)">
<script>${themeJs(preload)}</script>
<meta property="og:type" content="${article ? 'article' : 'website'}">${canonical ? `\n<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:site_name" content="FocusFence">
<meta property="og:locale" content="${OG_LOCALE[lang]}">${ogAlt}
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="${ogW}">
<meta property="og:image:height" content="${ogH}">
<meta property="og:image:alt" content="${attr(typo(lang, T.ogAlt))}">${article ? `\n<meta property="article:published_time" content="${article.published}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImage}">
<meta name="twitter:image:alt" content="${attr(typo(lang, T.ogAlt))}">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/favicon.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${base}assets/apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preload" href="${base}assets/inter.woff2" as="font" type="font/woff2" crossorigin>${head}${ld ? jsonLd(ld) : ''}
<style>${css}</style>
<script src="${base}assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">${T.skip}</a>
<header class="top"><div class="wrap top-in">
  <a class="brand" href="${homeHref}">${LOGO(24)}<span>FocusFence</span></a>
  <nav class="links" aria-label="${attr(T.navLabel)}"><a href="${homeHref}#features">${T.navFeatures}</a><a href="${homeHref}#pricing">${T.navPricing}</a><a href="${base}blog/" hreflang="en">${T.navBlog}</a><a href="${home}privacy.html">${T.navPrivacy}</a></nav>
  <fieldset class="theme"><legend class="sr">${T.themeLabel}</legend>${[
    ['light', T.themeLight, 'sun'],
    ['dark', T.themeDark, 'moon'],
    ['system', T.themeSystem, 'monitor'],
  ]
    .map(([v, label, ic]) => `<label data-v="${v}" title="${attr(label)}"><input type="radio" name="theme" value="${v}">${icon(ic)}<span class="sr">${label}</span></label>`)
    .join('')}</fieldset>
  <nav class="langs" aria-label="${attr(T.langLabel)}">${switcher}</nav>${STORE_URL ? `\n  <a class="btn btn-primary btn-sm top-cta" href="${STORE_URL}">${T.ctaNav}</a>` : ''}
</div></header>
${fill(body)}
<footer class="foot"><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand"><a class="brand" href="${homeHref}">${LOGO(24)}<span>FocusFence</span></a><p>${fill(T.footTagline)}</p></div>
    <div class="foot-col"><p class="foot-h">${T.footProduct}</p><ul><li><a href="${homeHref}#features">${T.navFeatures}</a></li><li><a href="${homeHref}#pricing">${T.navPricing}</a></li><li><a href="${homeHref}#faq">${T.faqH2}</a></li></ul></div>
    <div class="foot-col"><p class="foot-h">${T.footResources}</p><ul><li><a href="${base}blog/" hreflang="en">${T.footBlog}</a></li><li><a href="${SOURCE_URL}">${T.footSource}</a></li><li><a href="${home}privacy.html">${T.footPrivacy}</a></li></ul></div>
    <div class="foot-col"><p class="foot-h">${T.footContact}</p><ul><li>${MAILTO}</li></ul></div>
  </div>
  <div class="foot-base"><p>${fill(T.footLicense)}</p><p>${fill(T.footNotAffiliated)}</p></div>
</div></footer>
</body>
</html>
`;
}

/* --------------------------------------------------------------- landing */
function landing(lang) {
  const T = SITE[lang];
  const A = `${dirOf(lang) ? '../' : ''}assets/${lang}/`;
  const size = (file) => imageSize(`assets/${lang}/${file}`);
  /** <img> with intrinsic size in CSS pixels (all product images are 2x). */
  const img = (file, alt, { cls = '', lazy = true, srcset = '', sizes = '', priority = false } = {}) => {
    const [w, h] = size(file);
    if (w % 2 || h % 2) throw new Error(`${file}: a 2x capture needs even dimensions, got ${w}x${h}`);
    return (
      `<img${cls ? ` class="${cls}"` : ''} src="${A}${srcset ? file.replace('.webp', '-1x.webp') : file}"` +
      (srcset ? ` srcset="${A}${file.replace('.webp', '-1x.webp')} ${w / 2}w, ${A}${file} ${w}w" sizes="${sizes}"` : '') +
      ` width="${w / 2}" height="${h / 2}"${lazy ? ' loading="lazy"' : ''} decoding="async"${priority ? ' fetchpriority="high"' : ''} alt="${attr(alt)}">`
    );
  };
  /** The same capture in both themes: CSS shows the one matching the page theme, and lazy
   * loading means the other one is never downloaded. `narrow` names a capture made for phones
   * (the extension's own narrow layout, or a tighter crop), served below 720px by <picture>. */
  const shot = (file, alt, opts = {}) =>
    ['', '-light']
      .map((theme) => {
        const th = theme ? 'th-l' : 'th-d';
        const f = file.replace('.webp', `${theme}.webp`);
        if (!opts.narrow) return img(f, alt, { ...opts, cls: `${opts.cls ? opts.cls + ' ' : ''}${th}` });
        const n = opts.narrow.replace('.webp', `${theme}.webp`);
        const [w, h] = size(n);
        if (w % 2 || h % 2) throw new Error(`${n}: a 2x capture needs even dimensions, got ${w}x${h}`);
        return `<picture class="${th}"><source media="(max-width: 720px)" srcset="${A}${n}" width="${w / 2}" height="${h / 2}">${img(f, alt, opts)}</picture>`;
      })
      .join('');
  const winBar = (title, ext) =>
    `<div class="win-bar" aria-hidden="true"><span class="win-dots"><i></i><i></i><i></i></span><span class="win-tab">${LOGO(14)}<span>${esc(title)}</span></span>${
      ext ? `<span class="win-ext">${LOGO(16)}</span>` : ''
    }</div>`;
  const CTA = STORE_URL
    ? `<a class="btn btn-primary" href="${STORE_URL}">${T.ctaAdd}${icon('arrow', 'i i-arrow')}</a>`
    : `<span class="btn btn-soon"><span class="pulse" aria-hidden="true"></span>${T.ctaSoon}</span>`;
  const ticks = `<ul class="ticks">${T.heroSmall
    .split(' · ')
    .map((t) => `<li>${icon('check')}${t}</li>`)
    .join('')}</ul>`;
  const h2 = ([bright, dim], cls = 'h2') => `<h2 class="${cls}">${bright} <span class="dim">${dim}</span></h2>`;
  const kicker = (text, pro) => `<p class="kicker"><span class="picket" aria-hidden="true"></span>${text}${pro ? PRO : ''}</p>`;
  const checks = (items) => `<ul class="checks">${items.map((t) => `<li>${icon('check')}<span>${t}</span></li>`).join('')}</ul>`;
  const DETAIL_ICONS = ['shield', 'page', 'backup', 'theme', 'globe', 'incognito'];
  const DETAIL_PRO = [true, true, true, false, false, false];
  const POINT_ICONS = ['device', 'eyeoff', 'lock'];
  // the settings window is 54/80 of the hero cluster (37.5em of 21.875em on phones), see site.css
  const heroSizes = '(max-width: 720px) 600px, min(864px, calc((100vw - 80px) * 0.675))';
  const blockedTitle = S.blockedDocTitleHost[lang].replace('$1', 'reddit.com');
  const pre = (name) => `${A}${name}-1x.webp 1280w, ${A}${name}.webp 2560w`;

  const body = `
<main id="main">
<section class="hero">
  <div class="wrap hero-copy">
    <h1 class="hero-h"><span class="eyebrow"><span class="eyebrow-dot" aria-hidden="true"></span>${T.eyebrow}</span><span class="sr"> — </span><span class="display">${T.h1}</span></h1>
    <div class="hero-row">
      <p class="lead">${T.lead}</p>
      <div class="hero-actions"><div class="cta">${CTA}<a class="btn btn-ghost" href="#features">${T.ctaFeatures}</a></div>${ticks}</div>
    </div>
  </div>
  <div class="stage">
    <div class="win-wrap">
      <div class="win win-hero">
        ${winBar(S.optionsTitle[lang], true)}
        <div class="win-body">${shot('blocklist.webp', T.altBlocklist, { cls: 'win-img', priority: true, srcset: true, sizes: heroSizes })}</div>
      </div>
      <div class="win-popup">${shot('popup.webp', T.altPopup)}</div>
      <div class="win win-card">
        ${winBar(blockedTitle)}
        <div class="win-body">${shot('block-card.webp', T.altBlock)}</div>
      </div>
    </div>
  </div>
</section>

<section class="sec sec-intro" aria-labelledby="intro-h">
  <div class="wrap">
    <h2 class="statement" id="intro-h" data-reveal>${T.statement[0]} <span class="dim">${T.statement[1]}</span></h2>
    <ol class="steps" data-reveal>
${T.steps.map(([h, p], i) => `      <li class="step"><span class="step-n">0${i + 1}</span><h3>${h}</h3><p>${p}</p></li>`).join('\n')}
    </ol>
  </div>
</section>

<section class="sec" id="features" aria-labelledby="block-h">
  <div class="wrap">
    <header class="sec-head" data-reveal>
      <div>${kicker(T.blockKicker)}${h2(T.blockH2).replace('<h2 ', '<h2 id="block-h" ')}</div>
      <p class="sec-lead">${T.blockLead}</p>
    </header>
    <div class="shot" data-reveal>
      <div class="win">
        ${winBar(blockedTitle)}
        <div class="win-body">${shot('block-page.webp', T.altBlock, { cls: 'win-img', srcset: true, sizes: 'min(1200px, calc(100vw - 48px))', narrow: 'block-page-m.webp' })}</div>
      </div>
    </div>
    <div class="feats" data-reveal>
${T.blockFeatures.map(([h, p], i) => `      <div class="feat"><h3>${h}${i ? PRO : ''}</h3><p>${p}</p></div>`).join('\n')}
    </div>
  </div>
</section>

<section class="sec" id="focus" aria-labelledby="focus-h">
  <div class="wrap">
    <header class="sec-head" data-reveal>
      <div>${kicker(T.focusKicker, true)}${h2(T.focusH2).replace('<h2 ', '<h2 id="focus-h" ')}</div>
      <p class="sec-lead">${T.focusLead}</p>
    </header>
    <div class="bento">
      <article class="card card-schedule" data-reveal>
        <div class="card-text"><h3>${T.focusFeatures[0][0]}</h3><p>${T.focusFeatures[0][1]}</p></div>
        <div class="screen">${shot('schedule.webp', T.altSchedule, { narrow: 'schedule-m.webp' })}</div>
      </article>
      <article class="card card-timer" data-reveal>
        <div class="card-text"><h3>${T.focusFeatures[1][0]}</h3><p>${T.focusFeatures[1][1]}</p></div>
        <div class="screen">${shot('focus.webp', T.altFocus)}</div>
      </article>
      <article class="card card-strict" data-reveal>
        <div class="card-text"><h3>${T.focusFeatures[2][0]}</h3><p>${T.focusFeatures[2][1]}</p></div>
        <div class="screen">${shot('strict.webp', T.altStrict)}</div>
      </article>
    </div>
  </div>
</section>

<section class="sec" id="stats" aria-labelledby="stats-h">
  <div class="wrap">
    <header class="sec-head" data-reveal>
      <div>${kicker(T.statsKicker, true)}${h2(T.statsH2).replace('<h2 ', '<h2 id="stats-h" ')}</div>
      <p class="sec-lead">${T.statsLead}</p>
    </header>
    <div class="screen screen-stats" data-reveal>${shot('stats.webp', T.altStats, { narrow: 'stats-m.webp' })}</div>
    <ul class="details" data-reveal>
${T.details.map(([h, p], i) => `      <li>${icon(DETAIL_ICONS[i])}<h3>${h}${DETAIL_PRO[i] ? PRO : ''}</h3><p>${p}</p></li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="sec" id="privacy" aria-labelledby="privacy-h">
  <div class="wrap">
    <header class="sec-head sec-head-solo" data-reveal><div>${kicker(T.privacyKicker)}${h2(T.privacyH2).replace('<h2 ', '<h2 id="privacy-h" ')}</div></header>
    <div class="privacy-grid">
      <ul class="points" data-reveal>
${T.privacyBand.map(([h, p], i) => `        <li>${icon(POINT_ICONS[i])}<div><h3>${h}</h3><p>${p}</p></div></li>`).join('\n')}
      </ul>
      <figure class="manifest" data-reveal>
        <figcaption>${T.permsTitle}</figcaption>
        <dl>
${T.perms.map(([k, v]) => `          <div><dt>${/^[A-Za-z]+$/.test(k) ? `<code>${k}</code>` : k}</dt><dd>${v}</dd></div>`).join('\n')}
        </dl>
        <p class="manifest-net">${T.permsNet}</p>
      </figure>
    </div>
  </div>
</section>

<section class="sec" id="pricing" aria-labelledby="pricing-h">
  <div class="wrap">
    <header class="sec-head sec-head-center" data-reveal><h2 class="h2" id="pricing-h">${T.pricingH2}</h2><p class="sec-lead">${T.pricingSub}</p></header>
    <div class="plans" data-reveal>
      <article class="plan">
        <h3>${T.planFree}</h3>
        <p class="price"><span class="amt">${T.priceFree}</span></p>
        <p class="plan-note">${T.freeNote}</p>
        ${checks(T.freeItems)}
      </article>
      <article class="plan">
        <h3>${T.planMonthly}</h3>
        <p class="price"><span class="amt">${T.priceMonthly}</span><span class="per">${T.perMonth}</span></p>
        <p class="plan-note">${T.monthlyNote}</p>
        ${checks(T.monthlyItems)}
      </article>
      <article class="plan plan-best">
        <h3>${T.planYearly} <span class="save">${T.save}</span></h3>
        <p class="price"><span class="amt">${T.priceYearly}</span><span class="per">${T.perYear}</span></p>
        <p class="plan-note">${T.yearlyNote}</p>
        ${checks(T.yearlyItems)}
        <div class="compare">
          <p class="compare-h">${T.compareH}</p>
          <ul>
            <li><span>12 × ${T.planMonthly}</span><span class="cmp-v">${priceLike(T.priceMonthly, 12 * amount(T.priceMonthly))}</span><span class="cmp-bar" aria-hidden="true"><i style="width: 100%"></i></span></li>
            <li class="cmp-best"><span>${T.planYearly}</span><span class="cmp-v">${T.priceYearly}</span><span class="cmp-bar" aria-hidden="true"><i style="width: ${((100 * amount(T.priceYearly)) / (12 * amount(T.priceMonthly))).toFixed(1)}%"></i></span></li>
          </ul>
        </div>
      </article>
    </div>
    <div class="plans-foot" data-reveal><p>${T.proHow}</p><p>${T.paymentsNote}</p></div>
  </div>
</section>

<section class="sec" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq">
    <div class="faq-head" data-reveal><h2 class="h2" id="faq-h">${T.faqH2}</h2><p>${T.faqSub}</p></div>
    <div class="faq-list" data-reveal>
${T.faq.map(([q, a]) => `      <details><summary><span>${q}</span>${icon('plus', 'i faq-i')}</summary><div class="faq-a"><p>${a}</p></div></details>`).join('\n')}
    </div>
  </div>
</section>

<section class="final" aria-labelledby="final-h">
  <div class="wrap final-in" data-reveal>
    <div class="final-mark" aria-hidden="true">${LOGO(56)}</div>
    <h2 class="final-h" id="final-h">${T.finalH2}</h2>
    <div class="cta">${CTA}</div>
    ${ticks}
  </div>
  <div class="scene" aria-hidden="true" data-rise>
    <div class="floor"></div>
    ${FENCE('fence mirror')}
    ${FENCE('fence')}
    <span class="fence-pool"></span>
  </div>
</section>
</main>`;
  const url = SITE_URL + dirOf(lang);
  const cur = T.priceMonthly.includes('€') ? 'EUR' : 'USD';
  const price = (p) => amount(p).toFixed(2);
  const offer = (name, p, billingDuration) => ({
    '@type': 'Offer',
    name,
    price: p ? price(p) : '0',
    priceCurrency: cur,
    ...(billingDuration ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: price(p), priceCurrency: cur, billingDuration } } : {}),
    ...(STORE_URL ? { url: STORE_URL } : {}),
  });
  // the visible answers, with absolute links, and code shown as plain text
  const answer = (a) =>
    typo(lang, a)
      .replace(/\{privacy\}/g, url + 'privacy.html')
      .replace(/\{source\}/g, SOURCE_URL)
      .replace(/<\/?code>/g, '');
  const ld = [
    organization(),
    { '@type': 'WebSite', '@id': SITE_URL + '#website', url: SITE_URL, name: 'FocusFence', inLanguage: SITE_LANGS, publisher: { '@id': ORG_ID } },
    {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url,
      name: typo(lang, T.title),
      description: typo(lang, T.description),
      inLanguage: lang,
      isPartOf: { '@id': SITE_URL + '#website' },
      about: { '@id': SITE_URL + '#app' },
      primaryImageOfPage: { '@type': 'ImageObject', url: SITE_URL + `assets/${lang}/${OG}`, width: 1200, height: 630 },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': SITE_URL + '#app',
      name: 'FocusFence',
      url,
      description: typo(lang, T.description),
      applicationCategory: 'BrowserApplication',
      applicationSubCategory: T.appCategory,
      operatingSystem: 'Windows, macOS, Linux, ChromeOS',
      softwareRequirements: `Google Chrome ${MANIFEST.minimum_chrome_version}+`,
      softwareVersion: MANIFEST.version,
      inLanguage: SITE_LANGS,
      isAccessibleForFree: true,
      license: LICENSE_URL,
      image: SITE_URL + `assets/${lang}/${OG}`,
      screenshot: ['block-page.webp', 'popup.webp', 'blocklist.webp'].map((f) => SITE_URL + `assets/${lang}/${f}`),
      featureList: [...T.freeItems, ...T.monthlyItems.slice(1)].map((f) => typo(lang, plain(f))),
      offers: [offer(T.planFree, null), offer(T.planMonthly, T.priceMonthly, 'P1M'), offer(T.planYearly, T.priceYearly, 'P1Y')],
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      ...(STORE_URL ? { downloadUrl: STORE_URL, installUrl: STORE_URL } : {}),
    },
    {
      '@type': 'FAQPage',
      '@id': url + '#faq',
      inLanguage: lang,
      mainEntity: T.faq.map(([q, a]) => ({ '@type': 'Question', name: typo(lang, q), acceptedAnswer: { '@type': 'Answer', text: answer(a) } })),
    },
  ];
  return page({
    lang,
    base: dirOf(lang) ? '../' : '',
    file: '',
    translated: true,
    redirect: lang === 'en',
    preload: { sizes: heroSizes, dark: pre('blocklist'), light: pre('blocklist-light') },
    title: typo(lang, T.title),
    description: typo(lang, T.description),
    canonical: url,
    ld,
    body,
  });
}

/* ---------------------------------------------------------------- privacy */
const linkContact = (html) =>
  /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(CONTACT) ? html.split(`<strong>${CONTACT}</strong>`).join(`<strong><a href="mailto:${CONTACT}">${CONTACT}</a></strong>`) : html;

function privacy(lang) {
  const T = SITE[lang];
  let md = privacyMd(lang);
  if (lang !== 'en') {
    if (!md.includes('{{CONTACT}}')) throw new Error(`privacy-policy.${lang}.md must use {{CONTACT}} for the contact address`);
    md = typo(lang, md).split('{{CONTACT}}').join(CONTACT);
  }
  const url = SITE_URL + dirOf(lang) + 'privacy.html';
  return page({
    lang,
    base: dirOf(lang) ? '../' : '',
    file: 'privacy.html',
    translated: true,
    title: typo(lang, T.privacyTitle),
    description: typo(lang, T.privacyDescription),
    canonical: url,
    ld: [
      {
        '@type': 'WebPage',
        '@id': url + '#webpage',
        url,
        name: typo(lang, T.privacyTitle),
        description: typo(lang, T.privacyDescription),
        inLanguage: lang,
        isPartOf: { '@id': SITE_URL + '#website' },
      },
      crumbs([
        ['FocusFence', SITE_URL + dirOf(lang)],
        [T.footPrivacy, url],
      ]),
    ],
    body: `<main class="doc" id="main"><div class="wrap prose">${linkContact(markdown(md))}</div></main>`,
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
const fmtDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const BLOG_URL = SITE_URL + 'blog/';
const BLOG_TITLE = 'Website Blocking & Focus Guides';
for (const post of posts) {
  const url = BLOG_URL + post.slug + '.html';
  // seo_title (optional front-matter): a shorter title for search results, where about 60
  // characters fit; the article keeps its full title as its heading.
  const title = (post.seo_title || post.title) + ' | FocusFence';
  fs.writeFileSync(
    path.join(DOCS, 'blog', post.slug + '.html'),
    blogPage(
      {
        title,
        description: post.description,
        canonical: url,
        noindex: post.draft,
        article: { published: post.date },
        ld: [
          organization(),
          {
            '@type': 'BlogPosting',
            '@id': url + '#article',
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.updated || post.date,
            inLanguage: 'en',
            url,
            mainEntityOfPage: url,
            image: SITE_URL + `assets/en/${OG}`,
            author: { '@id': ORG_ID },
            publisher: { '@id': ORG_ID },
          },
          crumbs([
            ['FocusFence', SITE_URL],
            ['Blog', BLOG_URL],
            [post.title, url],
          ]),
        ],
        body: `<main class="doc" id="main"><article class="wrap prose"><p class="doc-meta"><a href="./">Blog</a><span aria-hidden="true">/</span><time datetime="${post.date}">${fmtDate(post.date)}</time></p>${markdown(post.body)}</article></main>`,
      },
      post.slug + '.html'
    )
  );
}
fs.writeFileSync(
  path.join(DOCS, 'blog', 'index.html'),
  blogPage(
    {
      title: BLOG_TITLE + ' | FocusFence Blog',
      description: 'Guides to blocking distracting websites in Chrome, from YouTube Shorts to work-hours schedules, by the makers of FocusFence.',
      canonical: BLOG_URL,
      noindex: posts.every((p) => p.draft),
      ld: [
        crumbs([
          ['FocusFence', SITE_URL],
          ['Blog', BLOG_URL],
        ]),
      ],
      body: `<main class="doc" id="main"><div class="wrap prose"><h1>${esc(BLOG_TITLE)}</h1><p class="doc-lead">How to block distracting websites in Chrome and keep them blocked, written by the people who make FocusFence.</p><ul class="posts">${posts
        .map((p) => `<li><a href="${p.slug}.html"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="post-t">${esc(p.title)}</span><span class="post-d">${esc(p.description)}</span></a></li>`)
        .join('')}</ul></div></main>`,
    },
    './'
  )
);

/* ------------------------------------------------------------------- 404 */
// GitHub Pages answers any missing path, at any depth, with docs/404.html and a 404 status. So the
// page addresses every link and file from the site root, has no canonical URL and is never indexed.
// One page for every language: a way home in each.
const HOME_IN = { en: 'Go to the home page', fr: 'Retour à l’accueil', es: 'Volver al inicio', de: 'Zur Startseite' };
fs.writeFileSync(
  path.join(DOCS, '404.html'),
  page({
    lang: 'en',
    base: ROOT_PATH,
    file: '',
    translated: false,
    canonical: null,
    noindex: true,
    title: 'Page not found | FocusFence',
    description: 'This page does not exist. FocusFence is a free focus app for Chrome that blocks distracting websites and keeps your list on your computer.',
    switchHref: (l) => ROOT_PATH + dirOf(l),
    body: `<main class="doc" id="main"><div class="wrap prose"><h1>Page not found</h1><p class="doc-lead">This page doesn’t exist, or it has moved. FocusFence, the calm focus app for Chrome, is one click away:</p><ul>${SITE_LANGS.map(
      (l) => `<li lang="${l}"><a href="${ROOT_PATH}${dirOf(l)}" hreflang="${l}">${HOME_IN[l]}</a> (${LANG_NAMES[l]})</li>`
    ).join('')}</ul></div></main>`,
  })
);

/* ------------------------------------------------- js, robots, sitemap */
fs.writeFileSync(path.join(DOCS, 'assets', 'site.js'), SITE_JS);
// Web app manifest: the name, colours and icons for "Add to Home screen" and browser UI.
fs.writeFileSync(
  path.join(DOCS, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'FocusFence',
      short_name: 'FocusFence',
      description: SITE.en.footTagline,
      lang: 'en',
      start_url: ROOT_PATH,
      scope: ROOT_PATH,
      display: 'browser',
      background_color: THEME_COLOR.dark,
      theme_color: THEME_COLOR.dark,
      icons: [
        { src: `${ROOT_PATH}assets/icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${ROOT_PATH}assets/icon-512.png`, sizes: '512x512', type: 'image/png' },
        { src: `${ROOT_PATH}assets/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2
  ) + '\n'
);
// robots.txt: the whole site is open to every crawler. The AI crawlers are named in two groups so
// the choice is explicit and easy to change: the ones that fetch pages for AI search answers
// (citations in ChatGPT, Claude and Perplexity), and the ones that collect training data. Deleting
// a group's lines, or turning its Allow into Disallow, opts those crawlers out.
const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
fs.writeFileSync(
  path.join(DOCS, 'robots.txt'),
  `# FocusFence: every crawler may read the whole site.\nUser-agent: *\nAllow: /\n\n` +
    `# AI search crawlers (pages cited in AI answers)\n${AI_SEARCH.map((b) => `User-agent: ${b}\n`).join('')}Allow: /\n\n` +
    `# AI training crawlers (the site and the extension are free software)\n${AI_TRAINING.map((b) => `User-agent: ${b}\n`).join('')}Allow: /\n\n` +
    `Sitemap: ${SITE_URL}sitemap.xml\n`
);

// llms.txt (llmstxt.org): a plain summary and map of the site for language models and AI agents.
// Google Search ignores it; it costs nothing and keeps the facts in one place, written from the
// same strings as the pages.
{
  const E = SITE.en;
  const live = posts.filter((p) => !p.draft);
  const faq = E.faq.map(([q, a]) => `### ${q}\n\n${plain(a.replace(/\{privacy\}/g, SITE_URL + 'privacy.html').replace(/\{source\}/g, SOURCE_URL).replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '[$2]($1)'))}\n`).join('\n');
  fs.writeFileSync(
    path.join(DOCS, 'llms.txt'),
    `# FocusFence\n\n> ${plain(E.description)}\n\n` +
      `FocusFence is a focus app for Chrome on computers: a Manifest V3 extension that blocks the distracting websites you choose, such as social feeds, YouTube Shorts or news sites. It does not block ads, and the sites you don't block load unchanged. ` +
      `Blocking runs in Chrome's built-in rule engine (declarativeNetRequest); the blocklist, settings and stats stay in Chrome's local storage, and there is no account. ` +
      `${STORE_URL ? `Install it from the Chrome Web Store: ${STORE_URL}` : 'It is coming soon to the Chrome Web Store.'}\n\n` +
      `- Free plan: ${E.freeItems.map(plain).join('; ')}.\n` +
      `- Pro, ${E.priceMonthly}${E.perMonth} or ${E.priceYearly}${E.perYear} (€2.99 or €19.99 in the eurozone): ${E.monthlyItems.slice(1).map(plain).join('; ')}.\n` +
      `- Languages: English, French, Spanish, German.\n- License: GNU AGPL v3 (${SOURCE_URL}).\n- Contact: ${CONTACT}\n\n` +
      `## Pages\n\n` +
      SITE_LANGS.map((l) => `- [${SITE[l].title}](${SITE_URL}${dirOf(l)}): ${plain(SITE[l].description)}\n`).join('') +
      `- [${E.privacyTitle}](${SITE_URL}privacy.html): ${plain(E.privacyDescription)}\n` +
      live.map((p) => `- [${p.title}](${SITE_URL}blog/${p.slug}.html): ${p.description}\n`).join('') +
      `\n## FAQ\n\n${faq}\n## Optional\n\n- [Source code](${SOURCE_URL}): the extension and this website\n`
  );
}

// sitemap.xml, with hreflang alternates and <lastmod>. A page's lastmod is the day its content last
// changed: the title, description, structured data and main content of every page are hashed, and
// the hashes and dates kept in scripts/sitemap-dates.json. Regenerating an unchanged page keeps its
// date; a changed page gets today's (commit the JSON file with docs/). Articles use their own dates.
const DATES_FILE = path.join(ROOT, 'scripts/sitemap-dates.json');
const dates = fs.existsSync(DATES_FILE) ? JSON.parse(fs.readFileSync(DATES_FILE, 'utf8')) : {};
const datesBefore = JSON.stringify(dates);
const lastmod = (url, rel) => {
  const html = fs.readFileSync(path.join(DOCS, rel), 'utf8');
  const parts = [/<title>[\s\S]*?<\/title>/, /<meta name="description"[^>]*>/, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, /<main[\s\S]*<\/main>/];
  const hash = crypto.createHash('sha256').update(parts.map((re) => (re.exec(html) || [''])[0]).join('\n')).digest('hex').slice(0, 16);
  if (!dates[url] || dates[url].hash !== hash) dates[url] = { hash, date: new Date().toISOString().slice(0, 10) };
  return dates[url].date;
};
const alt = (file) =>
  SITE_LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${dirOf(l)}${file}"/>`).join('') +
  `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${file}"/>`;
fs.writeFileSync(
  path.join(DOCS, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    ['', 'privacy.html']
      .flatMap((file) =>
        SITE_LANGS.map((l) => {
          const url = SITE_URL + dirOf(l) + file;
          return `<url><loc>${url}</loc><lastmod>${lastmod(url, dirOf(l) + (file || 'index.html'))}</lastmod>${alt(file)}</url>\n`;
        })
      )
      .join('') +
    posts.filter((p) => !p.draft).map((p) => `<url><loc>${SITE_URL}blog/${p.slug}.html</loc><lastmod>${p.updated || p.date}</lastmod></url>\n`).join('') +
    `</urlset>\n`
);
const sorted = Object.fromEntries(Object.keys(dates).sort().map((k) => [k, dates[k]]));
if (JSON.stringify(dates) !== datesBefore || !fs.existsSync(DATES_FILE)) fs.writeFileSync(DATES_FILE, JSON.stringify(sorted, null, 2) + '\n');
console.log('docs written to', DOCS);
