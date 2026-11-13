/*
 * Round 3 fence explorations: four ways to draw the same fence.
 * Each direction draws the block-page scene (sky, ground, fence, the lit picket) as one SVG at the
 * window's size, and a popup-scale row (one lettered picket per site). Injected into the real block
 * page by capture.mjs, so the copy, buttons and type around it are the shipping ones.
 *
 *   lantern   soft depth: light and shade, a lit picket that holds the light, a glossy ground
 *   hairline  line art: a drawn fence, the lit picket the only solid shape, its outline echoing
 *   extruded  2.5D: pickets with real thickness (front, bevel, side), flat-shaded like a 3D icon
 *   horizon   layered silhouettes: three fences receding into haze, a landscape
 */
(function (root) {
  'use strict';
  const r = (n) => Math.round(n * 100) / 100;
  /** The logo's picket: a 45° tip that rises half the width. (x, y) is the apex box's top-left. */
  const pent = (x, y, w, h, t = w / 2) =>
    `M${r(x)} ${r(y + t)}L${r(x + w / 2)} ${r(y)}L${r(x + w)} ${r(y + t)}L${r(x + w)} ${r(y + h)}L${r(x)} ${r(y + h)}Z`;
  const poly = (pts) => 'M' + pts.map((p) => r(p[0]) + ' ' + r(p[1])).join('L') + 'Z';
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  /** Pickets across the window, the lit one in the middle; d = distance (in pickets) from it. */
  function layout(W, w, gap, wLit, extra = 80) {
    const cx = W / 2;
    const out = [{ x: cx - wLit / 2, w: wLit, d: 0, lit: true, side: 0 }];
    let off = wLit / 2 + gap;
    let d = 1;
    while (off < W / 2 + extra) {
      out.push({ x: cx + off, w, d, side: 1 });
      out.push({ x: cx - off - w, w, d, side: -1 });
      off += w + gap;
      d++;
    }
    return out.sort((a, b) => a.x - b.x);
  }

  const edgeFade = (id, W, inner = 0.16) => `
    <linearGradient id="${id}g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="${inner}" stop-color="#fff" stop-opacity="1"/>
      <stop offset="${1 - inner}" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="4000">
      <rect x="0" y="0" width="${W}" height="4000" fill="url(#${id}g)"/>
    </mask>`;

  const letterText = (x, y, size, fill, ch, extra = '') =>
    `<text x="${r(x)}" y="${r(y)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="650" font-size="${size}" fill="${fill}" ${extra}>${ch}</text>`;

  /** How much of a picket you see at distance d from the lit one: light falls off, the fence recedes. */
  const vis = (d, k = 5.5) => Math.exp(-d / k);

  const LANTERN_LIGHT = { sky0: '#fcfdfc', sky1: '#e7eee9', glow: 'rgba(58,154,91,0.13)', b0: '#f7f9f8', b1: '#eef2ef', b2: '#e1e8e3', shade: 'rgba(17,21,19,0.05)',
    capL: 'rgba(255,255,255,0.95)', capR: 'rgba(17,21,19,0.07)', hi: 'rgba(255,255,255,0.9)', rim: '#3a9a5b', rail: '#dfe6e1', railHi: 'rgba(255,255,255,0.9)',
    floor0: '#e1e8e3', floor1: '#f3f6f4', refl: 0.12, ground: 'rgba(17,21,19,0.09)', l0: '#52b679', l1: '#3a9a5b', l2: '#2a7845', ink: '#ffffff', bloom: 0.4, pool: 'rgba(58,154,91,0.24)' };
  /** Light-mode studies for the lantern: backlit at dawn (sage silhouettes, bright rims), and glass. */
  const LIGHT_STUDIES = {
    dawn: { sky0: '#fbfcfb', sky1: '#eef5f0', glow: 'rgba(255,255,255,0.0)', b0: '#c3d1c8', b1: '#d0dbd4', b2: '#e2e9e4', shade: 'rgba(17,21,19,0.05)',
      capL: 'rgba(255,255,255,0.55)', capR: 'rgba(17,21,19,0.06)', hi: 'rgba(255,255,255,0.75)', rail: '#d2ddd6', railHi: 'rgba(255,255,255,0.6)', floor0: '#e4ece6', floor1: '#f5f8f6', refl: 0.16 },
    glass: { sky0: '#fbfcfb', sky1: '#e3eee7', glow: 'rgba(58,154,91,0.2)', b0: 'rgba(255,255,255,0.92)', b1: 'rgba(255,255,255,0.55)', b2: 'rgba(255,255,255,0.18)', shade: 'rgba(17,21,19,0.035)',
      capL: 'rgba(255,255,255,0.9)', capR: 'rgba(17,21,19,0.05)', hi: 'rgba(255,255,255,1)', rail: 'rgba(255,255,255,0.55)', railHi: 'rgba(255,255,255,0.9)', floor0: '#dfe9e2', floor1: '#f3f6f4', refl: 0.14 },
  };

  // ------------------------------------------------------------------ A. Lantern
  const lantern = {
    title: 'Lantern — soft depth: light and shade; the lit picket holds the light',
    wall(opts) {
      const { W, Hv, theme, letter } = opts;
      const dark = theme === 'dark';
      const G = Math.round(Math.min(100, Math.max(56, Hv * 0.11)));
      const yg = Hv - G;
      const h = Math.round(Math.min(178, Math.max(112, Hv * 0.19)));
      const w = 14, gap = 28, wLit = 22, hLit = h + 56;
      const c = opts.palette ? Object.assign({}, LANTERN_LIGHT, opts.palette) : dark
        ? { sky0: '#030504', sky1: '#08100c', glow: 'rgba(58,154,91,0.34)', b0: '#232927', b1: '#151a18', b2: '#0b0e0d', shade: 'rgba(0,0,0,0.30)',
            capL: 'rgba(255,255,255,0.07)', capR: 'rgba(0,0,0,0.35)', hi: 'rgba(255,255,255,0.05)', rim: '#7fd9a0', rail: '#0f1412', railHi: 'rgba(255,255,255,0.035)',
            floor0: '#080b0a', floor1: '#030404', refl: 0.3, ground: 'rgba(255,255,255,0.06)',
            l0: '#c4f4d4', l1: '#5cc583', l2: '#2c7c48', ink: '#04170b', bloom: 0.85, pool: 'rgba(76,184,115,0.5)' }
        : { sky0: '#fcfdfc', sky1: '#e7eee9', glow: 'rgba(58,154,91,0.13)', b0: '#f7f9f8', b1: '#eef2ef', b2: '#e1e8e3', shade: 'rgba(17,21,19,0.05)',
            capL: 'rgba(255,255,255,0.95)', capR: 'rgba(17,21,19,0.07)', hi: 'rgba(255,255,255,0.9)', rim: '#3a9a5b', rail: '#dfe6e1', railHi: 'rgba(255,255,255,0.9)',
            floor0: '#e1e8e3', floor1: '#f3f6f4', refl: 0.12, ground: 'rgba(17,21,19,0.09)',
            l0: '#52b679', l1: '#3a9a5b', l2: '#2a7845', ink: '#ffffff', bloom: 0.4, pool: 'rgba(58,154,91,0.24)' };
      const items = layout(W, w, gap, wLit);
      const cx = W / 2;
      const lit = items.find((i) => i.lit);
      let pk = '';
      for (const it of items) {
        if (it.lit) continue;
        const x = it.x, x2 = x + it.w, xm = x + it.w / 2, t = it.w / 2, y = yg - h;
        const rim = Math.exp(-it.d / 2.3);
        const right = it.side < 0; // its right edge faces the lantern
        pk += `<g opacity="${r(0.28 + 0.72 * vis(it.d))}">
          <path d="${pent(x, y, it.w, h)}" fill="url(#body)"/>
          <path d="${poly([[xm, y], [x2, y + t], [x2, yg], [xm, yg]])}" fill="${c.shade}"/>
          <path d="${poly([[x, y + t], [xm, y], [xm, y + t]])}" fill="${c.capL}"/>
          <path d="${poly([[xm, y], [x2, y + t], [xm, y + t]])}" fill="${c.capR}"/>
          <rect x="${r(x)}" y="${r(y + t)}" width="1" height="${r(h - t)}" fill="${c.hi}"/>
          ${rim > 0.06 ? `<path d="${right ? poly([[xm, y], [x2, y + t], [xm, y + t]]) : poly([[x, y + t], [xm, y], [xm, y + t]])}" fill="${c.rim}" opacity="${r(0.6 * rim)}"/>
          <rect x="${r(right ? x2 - 5 : x)}" y="${r(y + t)}" width="5" height="${r(h - t)}" fill="url(#${right ? 'rimR' : 'rimL'})" opacity="${r(rim)}"/>` : ''}
        </g>`;
      }
      const ly = yg - hLit, lt = wLit / 2;
      const litSvg = `<path d="${pent(lit.x, ly, wLit, hLit)}" fill="url(#litb)"/>
        <path d="${poly([[lit.x + lt, ly], [lit.x + wLit, ly + lt], [lit.x + wLit, yg], [lit.x + lt, yg]])}" fill="rgba(0,0,0,0.09)"/>
        <path d="${poly([[lit.x, ly + lt], [lit.x + lt, ly], [lit.x + lt, ly + lt]])}" fill="rgba(255,255,255,${dark ? 0.45 : 0.28})"/>
        <path d="${poly([[lit.x + lt, ly], [lit.x + wLit, ly + lt], [lit.x + lt, ly + lt]])}" fill="rgba(0,0,0,0.08)"/>
        <rect x="${r(lit.x)}" y="${r(ly + lt)}" width="1" height="${r(hLit - lt)}" fill="rgba(255,255,255,${dark ? 0.5 : 0.25})"/>
        ${letterText(cx, ly + lt + 25, 14, c.ink, letter)}`;
      const rails = [0.3, 0.68]
        .map((f) => {
          const yr = Math.round(yg - h * f);
          return `<rect x="0" y="${yr}" width="${W}" height="3" fill="${c.rail}"/><rect x="0" y="${yr}" width="${W}" height="1" fill="${c.railHi}"/>
            <rect x="${cx - 300}" y="${yr}" width="600" height="3" fill="url(#railLit)"/>`;
        })
        .join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hv}" viewBox="0 0 ${W} ${Hv}">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.sky0}"/><stop offset="0.42" stop-color="${c.sky0}"/><stop offset="1" stop-color="${c.sky1}"/></linearGradient>
          <radialGradient id="glow"><stop offset="0" stop-color="${c.glow}"/><stop offset="1" stop-color="${rgba('#3a9a5b', 0)}"/></radialGradient>
          <linearGradient id="body" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.b0}"/><stop offset="0.5" stop-color="${c.b1}"/><stop offset="1" stop-color="${c.b2}"/></linearGradient>
          <linearGradient id="litb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.l0}"/><stop offset="0.36" stop-color="${c.l1}"/><stop offset="1" stop-color="${c.l2}"/></linearGradient>
          <linearGradient id="rimL" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${c.rim}" stop-opacity="0.95"/><stop offset="0.25" stop-color="${c.rim}" stop-opacity="0.45"/><stop offset="1" stop-color="${c.rim}" stop-opacity="0"/></linearGradient>
          <linearGradient id="rimR" x1="1" x2="0" y1="0" y2="0"><stop offset="0" stop-color="${c.rim}" stop-opacity="0.95"/><stop offset="0.25" stop-color="${c.rim}" stop-opacity="0.45"/><stop offset="1" stop-color="${c.rim}" stop-opacity="0"/></linearGradient>
          <linearGradient id="railLit" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${c.rim}" stop-opacity="0"/><stop offset="0.5" stop-color="${c.rim}" stop-opacity="${dark ? 0.6 : 0.4}"/><stop offset="1" stop-color="${c.rim}" stop-opacity="0"/></linearGradient>
          <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.floor0}"/><stop offset="1" stop-color="${c.floor1}"/></linearGradient>
          <radialGradient id="pool"><stop offset="0" stop-color="${c.pool}"/><stop offset="1" stop-color="${rgba('#3a9a5b', 0)}"/></radialGradient>
          <filter id="bloom" x="-300%" y="-50%" width="700%" height="200%"><feGaussianBlur stdDeviation="17"/></filter>
          <linearGradient id="reflg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${c.refl}"/><stop offset="0.75" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <mask id="refl" maskUnits="userSpaceOnUse" x="0" y="${yg}" width="${W}" height="${G}"><rect x="0" y="${yg}" width="${W}" height="${G}" fill="url(#reflg)"/></mask>
          ${edgeFade('fade', W, 0.2)}
        </defs>
        <rect width="${W}" height="${Hv}" fill="url(#sky)"/>
        <ellipse cx="${cx}" cy="${yg}" rx="${r(W * 0.34)}" ry="${r(Hv * 0.56)}" fill="url(#glow)"/>
        <rect x="0" y="${yg}" width="${W}" height="${G}" fill="url(#floor)"/>
        <g mask="url(#fade)">
          ${rails}
          <g id="pk">${pk}</g>
          <g mask="url(#refl)"><use href="#pk" transform="matrix(1 0 0 -1 0 ${2 * yg})"/><use href="#litg" transform="matrix(1 0 0 -1 0 ${2 * yg})"/></g>
          <rect x="0" y="${yg}" width="${W}" height="1" fill="${c.ground}"/>
        </g>
        <ellipse cx="${cx}" cy="${yg + 4}" rx="210" ry="20" fill="url(#pool)"/>
        <path d="${pent(lit.x - 3, ly + 8, wLit + 6, hLit - 8)}" fill="${c.l1}" filter="url(#bloom)" opacity="${c.bloom}"/>
        <g id="litg">${litSvg}</g>
      </svg>`;
      return { svg, top: ly };
    },
    row({ letters, state, theme }) {
      const dark = theme === 'dark';
      const w = 16, gap = 10, h = 50, H = 78, t = w / 2;
      const n = letters.length;
      const Wd = n * w + (n - 1) * gap + 48;
      const down = state === 'down';
      const drop = down ? h * 0.56 : 0;
      const yg = H - 20;
      const g = down
        ? dark ? { b0: '#3a423f', b1: '#2c3330', b2: '#232927', ink: '#a2aca7', rail: 'rgba(255,255,255,0.08)', hi: 0.12 } : { b0: '#e6ebe8', b1: '#dce2de', b2: '#d2d9d5', ink: '#69736e', rail: 'rgba(17,21,19,0.07)', hi: 0.7 }
        : dark ? { b0: '#c6f5d6', b1: '#5fc887', b2: '#2a7a46', ink: '#03160a', rail: 'rgba(108,197,138,0.34)', hi: 0.55 } : { b0: '#5cc183', b1: '#3a9a5b', b2: '#2a7a46', ink: '#ffffff', rail: 'rgba(58,154,91,0.26)', hi: 0.38 };
      let out = '';
      let shadows = '';
      letters.forEach((ch, i) => {
        const x = 24 + i * (w + gap);
        const y = yg - h + drop;
        const p = pent(x, y, w, yg - y);
        out += `<g><path d="${p}" fill="url(#rb)"/>
          <path d="${p}" fill="url(#cyl)"/>
          <path d="M${r(x + 0.5)} ${r(yg)}V${r(y + t + 0.2)}L${r(x + t)} ${r(y + 0.7)}" fill="none" stroke="#fff" stroke-opacity="${g.hi}" stroke-width="1"/>
          ${ch ? letterText(x + w / 2, y + t + 13.5, 9.5, g.ink, ch, dark || down ? '' : 'style="paint-order:stroke" stroke="rgba(0,0,0,0.12)" stroke-width="1.2"') : ''}</g>`;
        shadows += `<ellipse cx="${r(x + w / 2)}" cy="${yg + 0.5}" rx="${r(w * 0.75)}" ry="1.8"/>`;
      });
      const rails = [0.3, 0.68].map((f) => `<rect x="16" y="${r(yg - h * f + drop * 0.92 - 1)}" width="${Wd - 32}" height="2" rx="1" fill="${g.rail}"/>`).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${H}" viewBox="0 0 ${Wd} ${H}" style="overflow:visible">
        <defs><linearGradient id="rb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${g.b0}"/><stop offset="0.42" stop-color="${g.b1}"/><stop offset="1" stop-color="${g.b2}"/></linearGradient>
        <linearGradient id="cyl" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.16 : 0.12}"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.16 : 0.1}"/></linearGradient>
        <linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="${dark ? '#fff' : '#111513'}" stop-opacity="0"/><stop offset="0.2" stop-color="${dark ? '#fff' : '#111513'}" stop-opacity="${dark ? 0.12 : 0.13}"/><stop offset="0.8" stop-color="${dark ? '#fff' : '#111513'}" stop-opacity="${dark ? 0.12 : 0.13}"/><stop offset="1" stop-color="${dark ? '#fff' : '#111513'}" stop-opacity="0"/></linearGradient>
        <linearGradient id="rf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="rm" maskUnits="userSpaceOnUse" x="0" y="${yg}" width="${Wd}" height="20"><rect x="0" y="${yg}" width="${Wd}" height="20" fill="url(#rf)"/></mask>
        <clipPath id="rc"><rect x="-20" y="-40" width="${Wd + 40}" height="${yg + 40}"/></clipPath>
        <filter id="rbl" x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
        <filter id="sb" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
        ${!down && dark ? `<rect x="34" y="${yg - h + 18}" width="${Wd - 68}" height="${h - 14}" fill="#3a9a5b" filter="url(#rbl)" opacity="0.42"/>` : ''}
        <g clip-path="url(#rc)">${rails}<g id="rw">${out}</g></g>
        ${dark ? `<g mask="url(#rm)"><use href="#rw" transform="matrix(1 0 0 -1 0 ${2 * yg})"/></g>` : `<g fill="rgba(17,21,19,${down ? 0.08 : 0.16})" filter="url(#sb)">${shadows}</g>`}
        <rect x="0" y="${yg}" width="${Wd}" height="1" fill="url(#gl)"/>
      </svg>`;
    },
  };

  // ------------------------------------------------------------------ B. Hairline
  const hairline = {
    title: 'Hairline — line art; the lit picket is the only solid shape',
    wall({ W, Hv, theme, letter }) {
      const dark = theme === 'dark';
      const G = Math.round(Math.min(100, Math.max(56, Hv * 0.11)));
      const yg = Hv - G;
      const h = Math.round(Math.min(178, Math.max(112, Hv * 0.19)));
      const w = 16, gap = 28, wLit = 22, hLit = h + 56, sw = 1.25;
      const c = dark
        ? { bg0: '#060808', bg1: '#0a0f0c', line: '#e8f0eb', lineA: 0.22, green: '#6cc58a', dot: 'rgba(232,240,235,0.08)', knock: '#07100a', glow: 'rgba(58,154,91,0.22)', l0: '#a6e6bd', l1: '#3f9f60' }
        : { bg0: '#fbfcfb', bg1: '#f2f6f3', line: '#111513', lineA: 0.24, green: '#2f8a50', dot: 'rgba(17,21,19,0.09)', knock: '#ffffff', glow: 'rgba(58,154,91,0.10)', l0: '#4cb374', l1: '#2c8250' };
      const items = layout(W, w, gap, wLit);
      const cx = W / 2;
      let lines = '';
      let tint = '';
      for (const it of items) {
        if (it.lit) continue;
        const d = pent(it.x + sw / 2, yg - h + sw / 2, it.w - sw, h - sw / 2);
        lines += `<path d="${d}" stroke-opacity="${r(c.lineA * (0.25 + 0.75 * vis(it.d, 6)))}"/>`;
        const a = 0.95 * Math.exp(-it.d / 1.8);
        if (a > 0.05) tint += `<path d="${d}" stroke-opacity="${r(a)}"/>`;
      }
      let rails = '';
      for (let i = 0; i < items.length - 1; i++) {
        const a = items[i], b = items[i + 1];
        const op = r(c.lineA * (0.25 + 0.75 * vis(Math.min(a.d, b.d), 6)));
        for (const f of [0.3, 0.68]) rails += `<path d="M${r(a.x + a.w + 3.5)} ${r(yg - h * f)}H${r(b.x - 3.5)}" stroke-opacity="${op}"/>`;
      }
      const lit = items.find((i) => i.lit);
      const ly = yg - hLit;
      const echoes = [9, 19, 30]
        .map((e, i) => `<path d="${pent(lit.x - e, ly - e * Math.SQRT2, wLit + 2 * e, hLit + e * Math.SQRT2 + 2)}" fill="none" stroke="${c.green}" stroke-width="1.25" stroke-opacity="${[0.55, 0.28, 0.16][i]}" ${i === 2 ? 'stroke-dasharray="1.5 4" stroke-linecap="round"' : ''}/>`)
        .join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hv}" viewBox="0 0 ${W} ${Hv}">
        <defs>
          <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.bg0}"/><stop offset="1" stop-color="${c.bg1}"/></linearGradient>
          <radialGradient id="glow"><stop offset="0" stop-color="${c.glow}"/><stop offset="1" stop-color="${rgba('#3a9a5b', 0)}"/></radialGradient>
          <linearGradient id="litb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.l0}"/><stop offset="0.5" stop-color="${c.l1}"/><stop offset="1" stop-color="${c.l1}"/></linearGradient>
          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="${c.dot}"/></pattern>
          <linearGradient id="dotfade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <mask id="dotm" maskUnits="userSpaceOnUse" x="0" y="${yg}" width="${W}" height="${G}"><rect x="0" y="${yg}" width="${W}" height="${G}" fill="url(#dotfade)"/></mask>
          <clipPath id="above"><rect x="0" y="0" width="${W}" height="${yg}"/></clipPath>
          ${edgeFade('fade', W, 0.22)}
        </defs>
        <rect width="${W}" height="${Hv}" fill="url(#bg)"/>
        <ellipse cx="${cx}" cy="${yg}" rx="${r(W * 0.28)}" ry="${r(Hv * 0.42)}" fill="url(#glow)"/>
        <g mask="url(#fade)">
          <rect x="0" y="${yg + 7}" width="${W}" height="${G}" fill="url(#dots)" mask="url(#dotm)"/>
          <g fill="none" stroke="${c.line}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">${lines}${rails}</g>
          <g fill="none" stroke="${c.green}" stroke-width="${sw}" stroke-linejoin="round">${tint}</g>
          <path d="M0 ${yg + 0.6}H${W}" stroke="${c.line}" stroke-opacity="${c.lineA}" stroke-width="1.25"/>
        </g>
        <g clip-path="url(#above)">${echoes}</g>
        <path d="${pent(lit.x, ly, wLit, hLit)}" fill="url(#litb)"/>
        ${letterText(cx, ly + wLit / 2 + 25, 14, c.knock, letter)}
      </svg>`;
      return { svg, top: ly - 30 * Math.SQRT2 };
    },
    row({ letters, state, theme }) {
      const dark = theme === 'dark';
      const w = 16, gap = 10, h = 50, H = 78, sw = 1.25;
      const n = letters.length;
      const Wd = n * w + (n - 1) * gap + 48;
      const down = state === 'down';
      const drop = down ? h * 0.56 : 0;
      const yg = H - 20;
      const stroke = down ? (dark ? 'rgba(232,240,235,0.32)' : 'rgba(17,21,19,0.32)') : dark ? '#6cc58a' : '#2f8a50';
      const card = dark ? '#111413' : '#ffffff';
      let out = '';
      letters.forEach((ch, i) => {
        const x = 24 + i * (w + gap);
        const y = yg - h + drop;
        out += `<path d="${pent(x + sw / 2, y + sw / 2, w - sw, h)}" fill="${card}"/>
          <path d="${pent(x + sw / 2, y + sw / 2, w - sw, h)}" fill="${down ? 'transparent' : dark ? 'rgba(108,197,138,0.08)' : 'rgba(47,138,80,0.06)'}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
          ${ch ? letterText(x + w / 2, y + w / 2 + 13.5, 9.5, stroke, ch) : ''}`;
      });
      const rails = [0.3, 0.68].map((f) => `<path d="M12 ${r(yg - h * f + drop)}H${Wd - 12}"/>`).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${H}" viewBox="0 0 ${Wd} ${H}">
        <defs><clipPath id="rc"><rect x="-20" y="-40" width="${Wd + 40}" height="${yg + 40}"/></clipPath>
        <linearGradient id="rl" x1="0" x2="1"><stop offset="0" stop-color="${stroke}" stop-opacity="0"/><stop offset="0.15" stop-color="${stroke}" stop-opacity="0.45"/><stop offset="0.85" stop-color="${stroke}" stop-opacity="0.45"/><stop offset="1" stop-color="${stroke}" stop-opacity="0"/></linearGradient></defs>
        <g clip-path="url(#rc)"><g fill="none" stroke="url(#rl)" stroke-width="1">${rails}</g>${out}</g>
        <path d="M0 ${yg + 0.5}H${Wd}" stroke="${dark ? 'rgba(232,240,235,0.14)' : 'rgba(17,21,19,0.14)'}"/>
      </svg>`;
    },
  };

  // ------------------------------------------------------------------ C. Extruded
  /** Oblique (cabinet) projection: depth runs up and to the right at 45°, so the front face keeps
   *  its true shape (letters stay crisp) and the right bevel and right side show. With a 45° tip the
   *  left bevel is exactly edge-on, so each picket is three faces. */
  function prism(x, y, w, k, yg) {
    const t = w / 2;
    return {
      front: pent(x, y, w, yg - y),
      bevel: poly([[x + w / 2, y], [x + w, y + t], [x + w + k, y + t - k], [x + w / 2 + k, y - k]]),
      side: poly([[x + w, y + t], [x + w, yg], [x + w + k, yg - k], [x + w + k, y + t - k]]),
    };
  }
  const extruded = {
    title: 'Extruded — 2.5D pickets with real thickness, flat-shaded',
    wall({ W, Hv, theme, letter }) {
      const dark = theme === 'dark';
      const G = Math.round(Math.min(100, Math.max(60, Hv * 0.11)));
      const yg = Hv - G;
      const h = Math.round(Math.min(172, Math.max(110, Hv * 0.185)));
      const w = 16, gap = 26, wLit = 22, hLit = h + 54, k = 6;
      const c = dark
        ? { sky0: '#030504', sky1: '#09100c', glow: 'rgba(58,154,91,0.32)', f0: '#1e2422', f1: '#121615', bevel: '#2d3532', side: '#090c0b',
            railF: '#0f1312', railT: '#1a201e', floor0: '#090c0b', floor1: '#040505', rim: '#7fd9a0',
            lf0: '#62c889', lf1: '#2f8550', lb: '#b8f0cb', ls: '#1c5631', ink: '#ffffff', pool: 'rgba(58,154,91,0.45)' }
        : { sky0: '#fcfdfc', sky1: '#e9f0eb', glow: 'rgba(58,154,91,0.12)', f0: '#f2f6f3', f1: '#e6ece8', bevel: '#ffffff', side: '#d1dbd4',
            railF: '#e3e9e5', railT: '#f6f8f7', floor0: '#e3eae5', floor1: '#f3f6f4', rim: '#3a9a5b',
            lf0: '#45ad6b', lf1: '#2c7c48', lb: '#86d6a4', ls: '#1f5f37', ink: '#ffffff', pool: 'rgba(58,154,91,0.22)' };
      const items = layout(W, w, gap, wLit, 120);
      const cx = W / 2;
      let pk = '';
      for (const it of items) {
        if (it.lit) continue;
        const p = prism(it.x, yg - h, it.w, k, yg);
        const rim = Math.exp(-it.d / 2.3);
        const lit = it.side < 0 ? p.side : `M${r(it.x)} ${yg}V${r(yg - h + it.w / 2)}`;
        pk += `<g opacity="${r(0.3 + 0.7 * vis(it.d))}"><path d="${p.side}" fill="${c.side}"/><path d="${p.bevel}" fill="${c.bevel}"/><path d="${p.front}" fill="url(#fr)"/>
          ${rim > 0.06 ? (it.side < 0 ? `<path d="${lit}" fill="${c.rim}" opacity="${r(0.55 * rim)}"/>` : `<path d="${lit}" stroke="${c.rim}" stroke-width="1.5" opacity="${r(rim)}"/>`) : ''}</g>`;
      }
      const lit = items.find((i) => i.lit);
      const ly = yg - hLit;
      const lp = prism(lit.x, ly, wLit, k + 1, yg);
      const rails = [0.3, 0.68]
        .map((f) => {
          const yr = r(yg - h * f - k);
          const rk = 4;
          return `<path d="${poly([[k, yr], [W + k, yr], [W + k + rk, yr - rk], [k + rk, yr - rk]])}" fill="${c.railT}"/><rect x="${k}" y="${yr}" width="${W}" height="5" fill="${c.railF}"/>
            <rect x="${cx - 300}" y="${yr - rk}" width="600" height="${5 + rk}" fill="url(#railLit)"/>`;
        })
        .join('');
      const contact = items.map((it) => `<ellipse cx="${r(it.x + it.w / 2 + 3)}" cy="${yg}" rx="${r(it.w * 0.9)}" ry="2.4" fill="rgba(0,0,0,${dark ? 0.5 : 0.1})"/>`).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hv}" viewBox="0 0 ${W} ${Hv}">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.sky0}"/><stop offset="0.45" stop-color="${c.sky0}"/><stop offset="1" stop-color="${c.sky1}"/></linearGradient>
          <radialGradient id="glow"><stop offset="0" stop-color="${c.glow}"/><stop offset="1" stop-color="${rgba('#3a9a5b', 0)}"/></radialGradient>
          <linearGradient id="fr" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.f0}"/><stop offset="1" stop-color="${c.f1}"/></linearGradient>
          <linearGradient id="lf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.lf0}"/><stop offset="1" stop-color="${c.lf1}"/></linearGradient>
          <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.floor0}"/><stop offset="1" stop-color="${c.floor1}"/></linearGradient>
          <linearGradient id="railLit" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${c.rim}" stop-opacity="0"/><stop offset="0.5" stop-color="${c.rim}" stop-opacity="${dark ? 0.5 : 0.3}"/><stop offset="1" stop-color="${c.rim}" stop-opacity="0"/></linearGradient>
          <radialGradient id="pool"><stop offset="0" stop-color="${c.pool}"/><stop offset="1" stop-color="${rgba('#3a9a5b', 0)}"/></radialGradient>
          <filter id="bloom" x="-300%" y="-50%" width="700%" height="200%"><feGaussianBlur stdDeviation="17"/></filter>
          <filter id="soft" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.6"/></filter>
          ${edgeFade('fade', W, 0.2)}
        </defs>
        <rect width="${W}" height="${Hv}" fill="url(#sky)"/>
        <ellipse cx="${cx}" cy="${yg - 30}" rx="${r(W * 0.34)}" ry="${r(Hv * 0.55)}" fill="url(#glow)"/>
        <rect x="0" y="${yg}" width="${W}" height="${G}" fill="url(#floor)"/>
        <g mask="url(#fade)">
          <g filter="url(#soft)">${contact}</g>
          ${rails}
          ${pk}
          <rect x="0" y="${yg}" width="${W}" height="1" fill="${dark ? 'rgba(255,255,255,0.06)' : 'rgba(17,21,19,0.08)'}"/>
        </g>
        <ellipse cx="${cx + 4}" cy="${yg}" rx="180" ry="18" fill="url(#pool)"/>
        <path d="${lp.front}" fill="${c.lf0}" filter="url(#bloom)" opacity="${dark ? 0.75 : 0.38}"/>
        <path d="${lp.side}" fill="${c.ls}"/><path d="${lp.bevel}" fill="${c.lb}"/><path d="${lp.front}" fill="url(#lf)"/>
        ${letterText(cx, ly + wLit / 2 + 25, 14, c.ink, letter)}
      </svg>`;
      return { svg, top: ly - k };
    },
    row({ letters, state, theme }) {
      const dark = theme === 'dark';
      const w = 16, gap = 11, h = 48, H = 66, k = 4;
      const n = letters.length;
      const Wd = n * w + (n - 1) * gap + 48;
      const down = state === 'down';
      const drop = down ? h * 0.56 : 0;
      const yg = H - 8;
      const g = down
        ? dark ? { f0: '#353d3a', f1: '#2b3230', b: '#4a534f', s: '#1d2220', ink: '#a2aca7', rf: '#232927', rt: '#2e3532' } : { f0: '#e5eae7', f1: '#dbe1dd', b: '#f1f4f2', s: '#c5cec9', ink: '#6b7570', rf: '#e4e9e6', rt: '#f1f4f2' }
        : dark ? { f0: '#5cc583', f1: '#2f8550', b: '#b5efc8', s: '#1c5631', ink: '#04170b', rf: '#225c37', rt: '#3a8a57' } : { f0: '#45ad6b', f1: '#2c7c48', b: '#86d6a4', s: '#1f5f37', ink: '#ffffff', rf: '#b3dcc1', rt: '#d6eedf' };
      let out = '';
      letters.forEach((ch, i) => {
        const x = 24 + i * (w + gap);
        const y = yg - h + drop;
        const p = prism(x, y, w, k, yg + drop);
        out += `<path d="${p.side}" fill="${g.s}"/><path d="${p.bevel}" fill="${g.b}"/><path d="${p.front}" fill="url(#xf)"/>${ch ? letterText(x + w / 2, y + w / 2 + 13, 9.5, g.ink, ch) : ''}`;
      });
      const rails = [0.3, 0.68].map((f) => {
        const yr = r(yg - h * f + drop - k);
        return `<path d="${poly([[12 + k, yr], [Wd - 16 + k, yr], [Wd - 16 + k + 2.5, yr - 2.5], [12 + k + 2.5, yr - 2.5]])}" fill="${g.rt}"/><rect x="${12 + k}" y="${yr}" width="${Wd - 28}" height="3" fill="${g.rf}"/>`;
      }).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${H}" viewBox="0 0 ${Wd} ${H}">
        <defs><linearGradient id="xf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${g.f0}"/><stop offset="1" stop-color="${g.f1}"/></linearGradient>
        <clipPath id="rc"><rect x="-20" y="-40" width="${Wd + 40}" height="${yg + 40}"/></clipPath></defs>
        <g clip-path="url(#rc)">${rails}${out}</g>
        <rect x="0" y="${yg}" width="${Wd}" height="1" fill="${dark ? 'rgba(255,255,255,0.10)' : 'rgba(17,21,19,0.12)'}"/>
      </svg>`;
    },
  };

  // ------------------------------------------------------------------ D. Horizon
  const horizon = {
    title: 'Horizon — three fences receding into the haze',
    wall({ W, Hv, theme, letter }) {
      const dark = theme === 'dark';
      const h = Math.round(Math.min(170, Math.max(108, Hv * 0.18)));
      const w = 18, gap = 22, wLit = 26, hLit = h + 48;
      const c = dark
        ? { sky0: '#030504', sky1: '#0c1812', glow: 'rgba(58,154,91,0.55)', rows: ['#10201a', '#09130e', '#030504'], haze: '#0d1a13',
            lit0: '#a4e8bb', lit1: '#3a9a5b', ink: '#04170b' }
        : { sky0: '#fbfcfb', sky1: '#e6f0ea', glow: 'rgba(58,154,91,0.20)', rows: ['#e2ebe5', '#d0ddd5', '#bccbc2'], haze: '#eef4f0',
            lit0: '#6fd193', lit1: '#2f8a50', ink: '#ffffff' };
      const cx = W / 2;
      const rows = [
        { s: 0.36, yg: Hv - Math.round(Hv * 0.215), fill: c.rows[0], ph: 0.5 },
        { s: 0.6, yg: Hv - Math.round(Hv * 0.14), fill: c.rows[1], ph: 0.25 },
        { s: 1, yg: Hv - Math.round(Hv * 0.05), fill: c.rows[2], ph: 0, front: true },
      ];
      let layers = '';
      rows.forEach((row, ri) => {
        const rw = w * row.s, rg = gap * row.s, rh = h * row.s;
        const items = row.front ? layout(W, w, gap, wLit) : (() => {
          const out = [];
          const step = rw + rg;
          for (let x = -step + row.ph * step; x < W + step; x += step) out.push({ x, w: rw, d: 9 });
          return out;
        })();
        let pk = '';
        for (const it of items) if (!it.lit) pk += `<path d="${pent(it.x, row.yg - rh, it.w, rh + 1)}"/>`;
        const rails = [0.3, 0.7].map((f) => `<rect x="0" y="${r(row.yg - rh * f)}" width="${W}" height="${r(Math.max(1.5, 4 * row.s))}"/>`).join('');
        layers += `<g fill="${row.fill}">${rails}${pk}<rect x="0" y="${row.yg}" width="${W}" height="${Hv - row.yg}"/></g>`;
        if (ri < 2) layers += `<rect x="0" y="${row.yg - rh * 1.6}" width="${W}" height="${rh * 1.6 + (Hv - row.yg)}" fill="url(#haze${ri})"/>`;
        if (row.front) {
          const lit = items.find((i) => i.lit);
          const ly = row.yg - hLit;
          layers += `<path d="${pent(lit.x - 2, ly + 6, wLit + 4, hLit - 6)}" fill="${c.lit1}" filter="url(#bloom)" opacity="${dark ? 0.8 : 0.45}"/>
            <path d="${pent(lit.x, ly, wLit, hLit + 1)}" fill="url(#litb)"/>
            ${letterText(cx, ly + wLit / 2 + 27, 15, c.ink, letter)}`;
          row.top = ly;
        }
      });
      const hazeDefs = [0, 1]
        .map((i) => `<linearGradient id="haze${i}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.haze}" stop-opacity="0"/><stop offset="1" stop-color="${c.haze}" stop-opacity="${dark ? 0.0 : 0.35}"/></linearGradient>`)
        .join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hv}" viewBox="0 0 ${W} ${Hv}">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.sky0}"/><stop offset="0.4" stop-color="${c.sky0}"/><stop offset="1" stop-color="${c.sky1}"/></linearGradient>
          <radialGradient id="glow"><stop offset="0" stop-color="${c.glow}"/><stop offset="1" stop-color="${rgba('#3a9a5b', 0)}"/></radialGradient>
          <linearGradient id="litb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.lit0}"/><stop offset="0.45" stop-color="${c.lit1}"/><stop offset="1" stop-color="${c.lit1}"/></linearGradient>
          <filter id="bloom" x="-200%" y="-50%" width="500%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
          ${hazeDefs}
        </defs>
        <rect width="${W}" height="${Hv}" fill="url(#sky)"/>
        <ellipse cx="${cx}" cy="${Hv - Hv * 0.2}" rx="${r(W * 0.46)}" ry="${r(Hv * 0.5)}" fill="url(#glow)"/>
        ${layers}
      </svg>`;
      return { svg, top: rows[2].top };
    },
    row({ letters, state, theme }) {
      const dark = theme === 'dark';
      const w = 18, gap = 9, h = 50, H = 64;
      const n = letters.length;
      const Wd = n * w + (n - 1) * gap + 40;
      const down = state === 'down';
      const drop = down ? h * 0.56 : 0;
      const yg = H - 6;
      const back = dark ? '#16241d' : '#e1eae4';
      const front = down ? (dark ? '#3b4340' : '#c9d1cc') : dark ? '#3a9a5b' : '#3a9a5b';
      const ink = down ? (dark ? '#9aa49f' : '#ffffff') : dark ? '#04170b' : '#ffffff';
      let bk = '';
      for (let x = 4; x < Wd; x += 11) bk += `<path d="${pent(x, yg - 26, 7, 27)}"/>`;
      let out = '';
      letters.forEach((ch, i) => {
        const x = 20 + i * (w + gap);
        const y = yg - h + drop;
        out += `<path d="${pent(x, y, w, h)}" fill="${front}"/>${ch ? letterText(x + w / 2, y + w / 2 + 14, 10, ink, ch) : ''}`;
      });
      const rails = [0.3, 0.7].map((f) => `<rect x="12" y="${r(yg - h * f + drop)}" width="${Wd - 24}" height="3" fill="${front}" opacity="0.5"/>`).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${H}" viewBox="0 0 ${Wd} ${H}">
        <defs><clipPath id="rc"><rect x="-20" y="-40" width="${Wd + 40}" height="${yg + 40}"/></clipPath></defs>
        <g fill="${back}">${bk}</g>
        <g clip-path="url(#rc)">${rails}${out}</g>
        <rect x="0" y="${yg}" width="${Wd}" height="${H - yg}" fill="${dark ? '#0d1310' : '#eef3f0'}"/>
      </svg>`;
    },
  };

  const DIRECTIONS = { lantern, hairline, extruded, horizon };
  for (const [k, palette] of Object.entries(LIGHT_STUDIES)) {
    DIRECTIONS['lantern-' + k] = { title: 'Lantern, light study: ' + k, wall: (o) => lantern.wall(Object.assign({}, o, { palette })), row: lantern.row };
  }

  /** Replace the block page's sky and wall with a direction's scene (fixed, behind the copy). */
  function mountWall(id, theme) {
    const dir = DIRECTIONS[id];
    const W = window.innerWidth, Hv = window.innerHeight;
    const letter = (document.querySelector('#wall .pk.lit') || {}).textContent || 'R';
    // hide the shipping scene (sky, ground, wall and its reflection) and draw this direction's instead
    for (const sel of ['.sky', '.floor', '#wall', '#mirror']) {
      const n = document.querySelector(sel);
      if (n) n.style.display = 'none';
    }
    let host = document.getElementById('xscene');
    if (!host) {
      host = document.createElement('div');
      host.id = 'xscene';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:fixed;inset:0;pointer-events:none';
      document.body.prepend(host);
    }
    const out = dir.wall({ W, Hv, theme, letter });
    host.innerHTML = out.svg;
    // keep the copy clear of the fence
    document.querySelector('.wrap').style.bottom = Math.max(0, Hv - out.top + 12) + 'px';
  }

  root.FENCE_DIRECTIONS = DIRECTIONS;
  root.mountFenceDirection = mountWall;
})(self);
