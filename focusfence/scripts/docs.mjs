// Generates the static GitHub Pages site in ../docs (repo root):
//   docs/index.html, docs/privacy.html            English (default, x-default)
//   docs/<lang>/index.html, docs/<lang>/privacy.html  fr, es, de
//   docs/blog/                                     English-only articles
// Landing strings: scripts/site-strings.mjs. Styles: scripts/site.css (inlined in
// every page). Client script: scripts/site.js. Product images and the Open Graph
// image: screenshots/site/<lang>/ (npm run screenshots:site).
// Privacy: store/privacy-policy[.<lang>].md (translations use {{CONTACT}}, filled
// from the English file's Contact line so the address is entered once).
// Usage: npm run docs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './launch.mjs';
import { SITE, SITE_LANGS, LANG_NAMES, OG_LOCALE } from './site-strings.mjs';
import { S } from './i18n/strings.mjs';

const DOCS = path.resolve(ROOT, '..', 'docs');
const STORE_URL = null; // set to the Chrome Web Store URL once published
const SOURCE_URL = 'https://github.com/Nexarion434/focusfence';
const SITE_URL = 'https://focusfence.dev/'; // custom domain (GitHub Pages, docs/CNAME)
const LICENSE_URL = `${SOURCE_URL}/blob/main/focusfence/LICENSE`;
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
const SHOTS = ['block-page.webp', 'block-page-1x.webp', 'popup.webp', 'blocklist.webp', 'blocklist-1x.webp', 'schedule.webp', 'focus.webp', 'strict.webp', 'stats.webp', 'og.png'];
for (const lang of SITE_LANGS) {
  for (const file of SHOTS) {
    const src = `screenshots/site/${lang}/${file}`;
    if (!fs.existsSync(path.join(ROOT, src))) throw new Error(`${src} is missing: run npm run screenshots:site`);
    copy(src, `${lang}/${file}`);
  }
}
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DOCS, 'CNAME'), new URL(SITE_URL).host + '\n'); // GitHub Pages custom domain

/** Pixel size of a PNG or WebP (VP8, VP8L or VP8X) file under docs/. */
function imageSize(rel) {
  const b = fs.readFileSync(path.join(DOCS, rel));
  if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
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
const typo = (lang, s) => (lang === 'fr' ? s.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ') : s);

/* ------------------------------------------------------- language plumbing */
// Root only: first-visit redirect from navigator.languages. An explicit choice
// (a click in the language switcher, stored in localStorage) always wins, and
// English is never redirected away from once chosen. Arriving from another page
// of the site (e.g. the EN link of the switcher) never redirects either, so the
// choice holds even when localStorage is blocked.
const REDIRECT_JS = `(function(){try{var L=${JSON.stringify(SITE_LANGS.filter((l) => l !== 'en'))},K=${JSON.stringify(LANG_STORAGE_KEY)},s=null,r=document.referrer,b=location.origin+location.pathname.replace(/[^/]*$/,'');if(r&&r.indexOf(b)===0)return;try{s=localStorage.getItem(K)}catch(e){}if(s==='en')return;var t=L.indexOf(s)>=0?s:null;if(!t&&!s){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];for(var i=0;i<n.length;i++){var c=String(n[i]).toLowerCase().split('-')[0];if(c==='en')break;if(L.indexOf(c)>=0){t=c;break}}}if(t)location.replace(t+'/'+location.search+location.hash)}catch(e){}})();`;
const SITE_JS = fs.readFileSync(path.join(ROOT, 'scripts/site.js'), 'utf8').replace('__LANG_KEY__', LANG_STORAGE_KEY);
const CSS = fs.readFileSync(path.join(ROOT, 'scripts/site.css'), 'utf8');

/* ------------------------------------------------------------ shared bits */
const LOGO_SVG = fs
  .readFileSync(path.join(ROOT, 'src/lib/ui.js'), 'utf8')
  .match(/const LOGO_SVG =\s*([\s\S]*?);\n/)[1]
  .split('\n')
  .map((l) => l.trim().replace(/^\+?\s*'/, '').replace(/'\s*\+?$/, ''))
  .join('');
const LOGO = (size) => LOGO_SVG.replace(/SIZE/g, String(size));
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
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const PRO = '<span class="pro">PRO</span>';

/**
 * @param o.lang        page language
 * @param o.base        relative path to the site root ('' | '../')
 * @param o.file        file name within the language folder ('' for index, 'privacy.html')
 * @param o.translated  true if the page exists in every language (emits hreflang)
 * @param o.switchHref  lang -> href for the switcher (defaults to the same page in that language)
 * @param o.head        extra <head> markup (preloads)
 */
function page({ lang, base, file, translated, title, description, body, canonical, noindex, redirect, switchHref, head = '' }) {
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
  const ogImage = `${SITE_URL}assets/${lang}/og.png`;
  const [ogW, ogH] = imageSize(`assets/${lang}/og.png`);
  const css = CSS.replace("url('inter.woff2')", `url('${base}assets/inter.woff2')`);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${redirect ? `\n<script>${REDIRECT_JS}</script>` : ''}
<title>${attr(title)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${canonical}">${alternates}${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#08090a">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="FocusFence">
<meta property="og:locale" content="${OG_LOCALE[lang]}">${ogAlt}
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="${ogW}">
<meta property="og:image:height" content="${ogH}">
<meta property="og:image:alt" content="${attr(typo(lang, T.ogAlt))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/favicon.png" type="image/png" sizes="32x32">
<link rel="preload" href="${base}assets/inter.woff2" as="font" type="font/woff2" crossorigin>${head}
<style>${css}</style>
<script src="${base}assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">${T.skip}</a>
<header class="top"><div class="wrap top-in">
  <a class="brand" href="${homeHref}">${LOGO(24)}<span>FocusFence</span></a>
  <nav class="links" aria-label="${attr(T.navLabel)}"><a href="${homeHref}#features">${T.navFeatures}</a><a href="${homeHref}#pricing">${T.navPricing}</a><a href="${base}blog/" hreflang="en">${T.navBlog}</a><a href="${home}privacy.html">${T.navPrivacy}</a></nav>
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
    return (
      `<img${cls ? ` class="${cls}"` : ''} src="${A}${srcset ? file.replace('.webp', '-1x.webp') : file}"` +
      (srcset ? ` srcset="${A}${file.replace('.webp', '-1x.webp')} ${w / 2}w, ${A}${file} ${w}w" sizes="${sizes}"` : '') +
      ` width="${w / 2}" height="${h / 2}"${lazy ? ' loading="lazy"' : ''} decoding="async"${priority ? ' fetchpriority="high"' : ''} alt="${attr(alt)}">`
    );
  };
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
  const heroSizes = '(max-width: 720px) 680px, min(1280px, calc(100vw - 48px))';

  const body = `
<main id="main">
<section class="hero">
  <div class="wrap hero-copy">
    <p class="eyebrow"><span class="eyebrow-dot" aria-hidden="true"></span>${T.eyebrow}</p>
    <h1 class="display">${T.h1}</h1>
    <div class="hero-row">
      <p class="lead">${T.lead}</p>
      <div class="hero-actions"><div class="cta">${CTA}<a class="btn btn-ghost" href="#features">${T.ctaFeatures}</a></div>${ticks}</div>
    </div>
  </div>
  <div class="stage">
    <div class="win-wrap">
      <div class="win win-hero">
        ${winBar(S.blockedDocTitleHost[lang].replace('$1', 'reddit.com'), true)}
        <div class="win-body">${img('block-page.webp', T.altBlock, { cls: 'win-img', lazy: false, priority: true, srcset: true, sizes: heroSizes })}</div>
      </div>
      <div class="win-popup">${img('popup.webp', T.altPopup, { lazy: false })}</div>
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
        ${winBar(S.optionsTitle[lang])}
        <div class="win-body">${img('blocklist.webp', T.altBlocklist, { cls: 'win-img', srcset: true, sizes: '(max-width: 720px) 760px, min(1200px, calc(100vw - 48px))' })}</div>
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
        <div class="screen">${img('schedule.webp', T.altSchedule)}</div>
      </article>
      <article class="card card-timer" data-reveal>
        <div class="card-text"><h3>${T.focusFeatures[1][0]}</h3><p>${T.focusFeatures[1][1]}</p></div>
        <div class="screen">${img('focus.webp', T.altFocus)}</div>
      </article>
      <article class="card card-strict" data-reveal>
        <div class="card-text"><h3>${T.focusFeatures[2][0]}</h3><p>${T.focusFeatures[2][1]}</p></div>
        <div class="screen">${img('strict.webp', T.altStrict)}</div>
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
    <div class="screen screen-stats" data-reveal>${img('stats.webp', T.altStats)}</div>
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
  <svg class="fence" aria-hidden="true" focusable="false"><defs><pattern id="pickets" x="50%" width="44" height="180" patternUnits="userSpaceOnUse"><path d="M10.5 180V36l12-12 12 12v144z"/></pattern></defs><rect class="rail" y="88" width="100%" height="10"/><rect class="rail" y="146" width="100%" height="10"/><rect class="pickets" width="100%" height="180" fill="url(#pickets)"/></svg>
</section>
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
for (const post of posts) {
  fs.writeFileSync(
    path.join(DOCS, 'blog', post.slug + '.html'),
    blogPage(
      {
        title: post.title + ' — FocusFence',
        description: post.description,
        canonical: SITE_URL + 'blog/' + post.slug + '.html',
        noindex: post.draft,
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
      title: 'Blog — FocusFence',
      description: 'Guides on blocking distracting websites in Chrome, focus routines and privacy.',
      canonical: SITE_URL + 'blog/',
      noindex: posts.every((p) => p.draft),
      body: `<main class="doc" id="main"><div class="wrap prose"><h1>Blog</h1><p class="doc-lead">Guides on blocking distracting websites in Chrome, focus routines and privacy.</p><ul class="posts">${posts
        .map((p) => `<li><a href="${p.slug}.html"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="post-t">${esc(p.title)}</span><span class="post-d">${esc(p.description)}</span></a></li>`)
        .join('')}</ul></div></main>`,
    },
    './'
  )
);

/* ------------------------------------------------- js, robots, sitemap */
fs.writeFileSync(path.join(DOCS, 'assets', 'site.js'), SITE_JS);
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
