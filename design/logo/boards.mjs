// Presentation boards + icon exports for each logo direction.
// Writes, per direction n:
//   design/logo/board-<n>.png
//   design/logo/<n>-<slug>/icon-{16,32,48,128}.{svg,png}, mark.svg, mark-mono.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, dataUri, withPage, rasterize, FONT_CSS } from './lib.mjs';
import { DIRECTIONS, COLORS } from './marks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const b64 = (buf) => 'data:image/png;base64,' + buf.toString('base64');

// Chrome 2023+ toolbar colours (light / dark) and the classic dark toolbar.
const CHROME = {
  light: { strip: '#DFE3E7', tab: '#FFFFFF', bar: '#FFFFFF', omni: '#E9EEF2', text: '#1F1F1F', muted: '#5F6368' },
  dark: { strip: '#1F2023', tab: '#35363A', bar: '#35363A', omni: '#202124', text: '#E3E3E3', muted: '#9AA0A6' },
};

const neighbours = (scale) =>
  // generic stand-ins for other extensions (not real products)
  [
    `<svg width="${16 * scale}" height="${16 * scale}" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#4A7BD0"/><circle cx="8" cy="8" r="3" fill="#fff"/></svg>`,
    `<svg width="${16 * scale}" height="${16 * scale}" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="3" fill="#D3543B"/><rect x="4" y="7" width="8" height="2" fill="#fff"/></svg>`,
    `<svg width="${16 * scale}" height="${16 * scale}" viewBox="0 0 16 16"><path d="M8 1l2.2 4.6 5 .6-3.7 3.4 1 5L8 12.2 3.5 14.6l1-5L.8 6.2l5-.6z" fill="#8A63C9"/></svg>`,
  ];

function toolbar(theme, icon, scale, badge) {
  const c = CHROME[theme];
  const s = scale;
  const btn = (inner) => `<span style="width:${28 * s}px;height:${28 * s}px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex:none">${inner}</span>`;
  const puzzle = `<svg width="${16 * s}" height="${16 * s}" viewBox="0 0 16 16"><path d="M6 2h3v2a1.2 1.2 0 0 0 2.4 0V2H14v4h-2a1.2 1.2 0 0 0 0 2.4h2V14H2V9h2a1.2 1.2 0 0 0 0-2.4H2V2z" fill="none" stroke="${c.muted}" stroke-width="1.3"/></svg>`;
  return `<div style="background:${c.bar};padding:${5 * s}px ${8 * s}px;display:flex;align-items:center;gap:${4 * s}px;width:${500 * s}px;border-radius:${10 * s}px">
    <div style="flex:1;background:${c.omni};color:${c.muted};font:${12.5 * s}px Inter;height:${30 * s}px;border-radius:${15 * s}px;display:flex;align-items:center;padding:0 ${12 * s}px">reddit.com</div>
    ${neighbours(s).map(btn).join('')}${btn(`<span style="position:relative;display:inline-flex"><img src="${icon}" width="${16 * s}" height="${16 * s}">${badge ? `<span style="position:absolute;right:${-7 * s}px;bottom:${-5 * s}px;background:#1F5A4C;color:#fff;font:700 ${9 * s}px/1 Inter;padding:${2 * s}px ${3 * s}px;border-radius:${4 * s}px">${badge}</span>` : ''}</span>`)}${btn(puzzle)}
  </div>`;
}

const wordmark = (d, dark, size) =>
  `<span style="font:${size}px/1 Inter;font-weight:700;letter-spacing:-0.025em;color:${dark ? d.word.focusDark : d.word.focus}">Focus<span style="color:${dark ? d.word.fenceDark : d.word.fence}">Fence</span></span>`;

function boardHtml(d, png, mono) {
  const panel = (bg, inner, extra = '') => `<div style="background:${bg};border-radius:18px;padding:22px 26px;${extra}">${inner}</div>`;
  const label = (t, dark) => `<div style="font:600 12px Inter;letter-spacing:.08em;text-transform:uppercase;color:${dark ? '#9AA0A6' : '#6B746F'};margin-bottom:14px">${t}</div>`;
  const sizes = (dark) =>
    `<div style="display:flex;align-items:flex-end;gap:20px">` +
    [128, 48, 32, 16].map((s) => `<div style="text-align:center;font:12px Inter;color:${dark ? '#9AA0A6' : '#6B746F'}"><img src="${png[s]}" width="${s}" height="${s}" style="display:block;margin:0 auto 8px">${s}</div>`).join('') +
    `<div style="text-align:center;font:12px Inter;color:${dark ? '#9AA0A6' : '#6B746F'}"><img src="${png[16]}" width="96" height="96" style="image-rendering:pixelated;display:block;margin:0 auto 8px;outline:1px dashed ${dark ? '#55585e' : '#cfd3cf'}">16 px, 6× zoom</div>` +
    `</div>`;
  const promoDark = d.promo.dark;
  return `<!doctype html><html><head><style>${FONT_CSS}
  *{box-sizing:border-box} body{margin:0;width:1600px;height:1000px;background:#E9E8E2;font-family:Inter;color:${COLORS.ink};padding:32px 40px;display:grid;grid-template-columns:520px 978px;grid-template-rows:44px 872px;gap:20px 22px;overflow:hidden}
  </style></head><body>
  <header style="grid-column:1/3;display:flex;align-items:baseline;gap:18px">
    <div style="font:700 15px Inter;color:#6B746F;letter-spacing:.06em">DIRECTION ${d.n}</div>
    <div style="font:750 34px Inter;letter-spacing:-.02em">${d.name}</div>
    <div style="font:400 17px Inter;color:#3B4842">${d.tagline}</div>
  </header>
  <div style="display:grid;grid-template-rows:672px 180px;gap:20px">
    ${panel(COLORS.paper, `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px"><img src="${dataUri(svgDoc(d.mark({ size: 512 }), 16).replace('width="16" height="16"', 'width="300" height="300"'))}" width="300" height="300">${wordmark(d, false, 46)}</div>`, 'height:100%')}
    ${panel('#ffffff', label('Mono') + `<div style="display:flex;gap:18px;align-items:center">` +
      [['#000', '#fff'], ['#fff', '#111']].map(([ink, bg]) => `<div style="background:${bg};padding:14px;border-radius:12px;display:flex;gap:16px;align-items:center;border:1px solid #e3e1d9"><img src="${dataUri(svgDoc(mono(ink), 16).replace('width="16" height="16"', 'width="72" height="72"'))}" width="72" height="72"><img src="${dataUri(svgDoc(mono(ink), 32))}" width="32" height="32"><img src="${dataUri(svgDoc(mono(ink), 16))}" width="16" height="16"></div>`).join('') + `</div>`)}
  </div>
  <div style="display:grid;grid-template-columns:478px 478px;grid-template-rows:220px 250px 362px;gap:20px 22px;width:978px">
    ${panel('#ffffff', label('Icon sizes · light') + sizes(false))}
    ${panel('#282A2C', label('Icon sizes · dark', true) + sizes(true))}
    <div style="grid-column:1/3;display:grid;grid-template-columns:560px 396px;gap:22px">
      ${panel('#F1F3F4', label('Chrome toolbar · 1× (16 px icon)') + toolbar('light', png[16], 1) + '<div style="height:10px"></div>' + toolbar('dark', png[16], 1) +
      `<table style="margin-top:16px;font:12.5px Inter;color:#3B4842;border-collapse:collapse">` +
      d.contrast.map(([what, fg, bg]) => { const r = ratio(fg, bg); return `<tr><td style="padding:2px 14px 2px 0">${what}</td><td style="padding:2px 10px 2px 0"><span style="display:inline-block;width:10px;height:10px;background:${fg};border:1px solid #0002;vertical-align:-1px"></span> on <span style="display:inline-block;width:10px;height:10px;background:${bg};border:1px solid #0002;vertical-align:-1px"></span></td><td style="font-weight:650;color:${r >= 3 ? '#1F5A4C' : '#9A3B2A'}">${r.toFixed(1)}:1 ${r >= 3 ? '✓' : '✗ < 3:1'}</td></tr>`; }).join('') + '</table>')}
      ${panel('#F1F3F4', label('2× (HiDPI, 32 px) with countdown badge') + `<div style="width:344px;overflow:hidden;border-radius:10px;direction:rtl"><div style="direction:ltr;width:max-content">${toolbar('light', png[32], 2, '24')}</div></div><div style="height:12px"></div><div style="width:344px;overflow:hidden;border-radius:10px;direction:rtl"><div style="direction:ltr;width:max-content">${toolbar('dark', png[32], 2, '24')}</div></div>`, 'overflow:hidden')}
    </div>
    <div style="grid-column:1/3;display:grid;grid-template-columns:478px 478px;gap:22px">
      ${panel('#ffffff', label('Chrome Web Store') + `<div style="display:flex;gap:16px;align-items:center">
        <img src="${png[128]}" width="128" height="128" style="border-radius:0">
        <div><div style="font:600 18px Inter;line-height:1.25;margin-bottom:4px">FocusFence – Website Blocker &amp; Pomodoro Focus Timer</div>
        <div style="font:13px Inter;color:#5F6368">focusfence · <span style="color:#1F1F1F">★★★★★</span> 4.9 · Productivity</div>
        <div style="margin-top:10px;display:inline-block;background:#0B57D0;color:#fff;font:600 13px Inter;padding:8px 16px;border-radius:18px">Add to Chrome</div></div></div>
        <div style="font:600 12px Inter;letter-spacing:.08em;color:#6B746F;margin:24px 0 10px">CHROME://EXTENSIONS · 48 PX</div>
        <div style="display:flex;gap:14px;align-items:center;border:1px solid #DADCE0;border-radius:8px;padding:14px 16px;width:420px">
          <img src="${png[48]}" width="48" height="48">
          <div style="flex:1"><div style="font:500 14px Inter">FocusFence – Website Blocker &amp; Pomo…</div><div style="font:12px Inter;color:#5F6368;margin-top:3px">Block distracting websites in one click…</div></div>
          <div style="width:30px;height:16px;border-radius:8px;background:#0B57D0;position:relative"><div style="position:absolute;right:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#fff"></div></div>
        </div>`)}
      ${panel('#ffffff', label('Small promo tile 440×280') + `<div style="width:440px;height:280px;transform:scale(.97);transform-origin:0 0;border-radius:6px;background:${d.promo.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;border:1px solid #e3e1d9">
        <img src="${dataUri(svgDoc(d.promo.mark({ size: 96 }), 16).replace('width="16" height="16"', 'width="96" height="96"'))}" width="96" height="96">
        ${wordmark(d, promoDark, 38)}
        <div style="font:500 15px Inter;color:${promoDark ? '#C9D0CC' : '#3B4842'}">Block distractions. Keep your focus.</div></div>`)}
    </div>
  </div>
  </body></html>`;
}

export async function buildBoards(only) {
  await withPage(async (page) => {
    for (const d of DIRECTIONS) {
      if (only && !only.includes(d.n)) continue;
      const dir = path.join(HERE, `${d.n}-${d.slug}`);
      fs.mkdirSync(dir, { recursive: true });
      const png = {};
      for (const s of [16, 32, 48, 128]) {
        const svg = svgDoc(d.mark({ size: s }), s);
        fs.writeFileSync(path.join(dir, `icon-${s}.svg`), svg + '\n');
        const buf = await rasterize(page, svg, s);
        fs.writeFileSync(path.join(dir, `icon-${s}.png`), buf);
        png[s] = b64(buf);
      }
      const mono = (ink) => d.mark({ ink, mono: ink });
      fs.writeFileSync(path.join(dir, 'mark.svg'), svgDoc(d.mark({ size: 512 }), 16).replace('width="16" height="16"', 'width="512" height="512"') + '\n');
      fs.writeFileSync(path.join(dir, 'mark-mono.svg'), svgDoc(mono('#000'), 16).replace('width="16" height="16"', 'width="512" height="512"') + '\n');
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.setContent(boardHtml(d, png, mono));
      await page.evaluate(() => document.fonts.ready);
      const out = path.join(HERE, `board-${d.n}.png`);
      await page.screenshot({ path: out });
      console.log('board ->', path.relative(process.cwd(), out));
    }
  });
}
