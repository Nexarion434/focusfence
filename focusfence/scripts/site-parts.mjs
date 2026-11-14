// Markup shared by the website (scripts/docs.mjs) and its artwork (scripts/site-art.mjs):
// the logo and the glass-pill fence. No side effects: safe to import anywhere.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './launch.mjs';

/** The extension's logo (src/lib/ui.js LOGO_SVG), with SIZE as a placeholder. */
export const LOGO_SVG = fs
  .readFileSync(path.join(ROOT, 'src/lib/ui.js'), 'utf8')
  .match(/const LOGO_SVG =\s*([\s\S]*?);\n/)[1]
  .split('\n')
  .map((l) => l.trim().replace(/^\+?\s*'/, '').replace(/'\s*\+?$/, ''))
  .join('');
export const LOGO = (size) => LOGO_SVG.replace(/SIZE/g, String(size));

/* The closing scene is the extension's block page (design/extension-ui: src/lib/ui.js FFUI.fence and
 * pillProfile, src/styles/base.css .fence and .pill, src/styles/blocked.css): a short row of glass
 * pills, one per blocked site, stepping down gently from the light in the middle (round 5: chunky
 * pebbles, the middle one 1.6 times as tall as wide, the ends 0.92). Each pill's place sets its
 * height (--k), how much of the light it catches (--t0), how much of it shows (--v0: the ends fade
 * to about two thirds), which side of the light it stands (--side) and its distance from it (--i:
 * the rise's stagger), with the extension's own formulas. Seven pills, as on the demo's block page
 * (six sites); the glossy floor mirrors every one of them (the mirror). Like the block page, narrower
 * windows show fewer pills rather than thinner ones: five, so the two outer pills are marked `far`
 * and the others also carry their place in a five-pill row (--k5, --v5; the light is the same). */
export const pillProfile = (n) => {
  const m = (n - 1) / 2;
  return Array.from({ length: n }, (_, p) => {
    const d = Math.abs(p - m);
    const x = m ? d / m : 0;
    return {
      d,
      side: Math.sign(p - m),
      k: 0.575 + 0.425 * Math.cos((Math.PI * x) / 2) ** 2,
      t: d === 0 ? 1 : Math.exp(-d / 1.25),
      v: m >= 2 && d === m ? 0.6 : m >= 2 && d === m - 1 ? 0.92 : 1,
    };
  });
};
export const PILLS = (() => {
  const five = pillProfile(5);
  return pillProfile(7)
    .map(({ d, side, k, t, v }) => {
      const near = five.find((q) => q.d === d && q.side === side);
      let style = `--k:${k.toFixed(3)};--t0:${t.toFixed(3)};--v0:${v.toFixed(2)};--side:${side};--i:${d}`;
      if (near && d) style += `;--k5:${near.k.toFixed(3)};--v5:${near.v.toFixed(2)}`;
      return `<span class="pill${!d ? ' lit' : near ? '' : ' far'}" style="${style}"></span>`;
    })
    .join('');
})();
export const FENCE = (cls) => `<div class="${cls}"><span class="fence-halo"></span>${PILLS}</div>`;
