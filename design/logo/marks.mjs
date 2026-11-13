// FocusFence logo directions, hand-built on a 16-unit grid.
// 1 unit = 1 px at 16 px, 2 px at 32, 3 px at 48. The 128 px store icon uses
// the same art at 6x (96 px) inside the 16 px transparent margin the Chrome Web
// Store asks for, so every edge stays on the pixel grid at every size.
//
// Each mark is a function (palette) -> SVG children for viewBox "0 0 16 16".
// Palettes: 'color' (default), 'onDark' (if the mark needs a dark-UI variant
// for the board only — the shipped icon must work on both), 'mono' (one ink,
// passed as `ink`).

export const COLORS = {
  pine: '#1F5A4C',
  mint: '#A9D6C8',
  ink: '#1C2622',
  paper: '#F5F4EF',
  amber: '#E8A33D',
};

const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}"/>`;
const rect = (x, y, w, h, fill, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''} fill="${fill}"/>`;
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

// knock-out helper: children drawn black inside a mask are cut out of `body`
let maskSeq = 0;
const knock = (body, holes) => {
  const id = 'k' + ++maskSeq;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-4" y="-4" width="24" height="24"><rect x="-4" y="-4" width="24" height="24" fill="#fff"/>${holes}</mask></defs><g mask="url(#${id})">${body}</g>`;
};
const picket = (x, top, w, rise, fill) => poly([[x, 15], [x, top + rise], [x + w / 2, top], [x + w, top + rise], [x + w, 15]], fill);
const G = '#2E8F6E';

// ---------------------------------------------------------------- candidates
export const CANDIDATES = {
  A1: ({ ink = G } = {}) => picket(3, 1, 4, 2, ink) + rect(7, 5, 7, 3, ink) + rect(7, 10, 4, 3, ink),
  // rails pierce the stem (fence rails pass through the picket)
  A2: ({ ink = G } = {}) => picket(4, 1, 4, 2, ink) + rect(2, 5, 12, 3, ink) + rect(2, 10, 8, 3, ink),
  A3: ({ ink = G } = {}) => picket(4, 1, 4, 2, ink) + rect(1, 5, 14, 3, ink) + rect(1, 10, 10, 3, ink),
  // arm ends cut like picket tips (pointing forward)
  A4: ({ ink = G } = {}) =>
    picket(3, 1, 4, 2, ink) + poly([[7, 5], [12, 5], [14, 6.5], [12, 8], [7, 8]], ink) + poly([[7, 10], [9, 10], [11, 11.5], [9, 13], [7, 13]], ink),
  // B: blinkers — two pickets bracket a focus dot
  B2: ({ tile = '#1C2622', ink = '#fff', dot = '#E8A33D', mono } = {}) =>
    mono
      ? knock(rect(0, 0, 16, 16, mono, 3.5), picket(3, 3, 3, 1.5, '#000') + picket(10, 3, 3, 1.5, '#000') + circle(8, 9, 1.5, '#000'))
      : rect(0, 0, 16, 16, tile, 3.5) + picket(3, 3, 3, 1.5, ink).replace(/15/g, '13') + picket(10, 3, 3, 1.5, ink).replace(/15/g, '13') + circle(8, 9, 1.5, dot),
  B3: ({ ink = G, dot = '#E8A33D', mono } = {}) =>
    picket(1, 1, 4, 2, mono || ink) + picket(11, 1, 4, 2, mono || ink) + circle(8, 9, 2.5, mono || dot),
  B4: ({ tile = '#1F5A4C', ink = '#A9D6C8', dot = '#F2B84B', mono } = {}) =>
    mono
      ? knock(rect(0, 0, 16, 16, mono, 3.5), picket(2, 2, 4, 2, '#000').replace(/,15/g, ',14') + picket(10, 2, 4, 2, '#000').replace(/,15/g, ',14') + circle(8, 9, 2, '#000'))
      : rect(0, 0, 16, 16, tile, 3.5) + picket(2, 2, 4, 2, ink).replace(/,15/g, ',14') + picket(10, 2, 4, 2, ink).replace(/,15/g, ',14') + circle(8, 9, 2, dot),
  // C: horizon — sun rising behind the fence
  C2: ({ ink = G, sun = '#E8A33D', mono } = {}) =>
    knock(circle(8, 9, 6, mono || sun), rect(-1, 8, 18, 1, '#000') + rect(-1, 11, 18, 5, '#000')) + rect(0, 9, 16, 2, mono || ink) + rect(0, 12, 16, 2, mono || ink),
  C4: ({ ink = G, sun = '#E39B2D', mono } = {}) =>
    knock(circle(8, 10, 6, mono || sun), rect(-1, 9, 18, 9, '#000')) + rect(0, 10, 16, 2, mono || ink) + rect(0, 13, 16, 2, mono || ink),
  C5: ({ ink = G, sun = '#E39B2D', mono } = {}) =>
    knock(circle(8, 8, 6.5, mono || sun), picket(2, 4, 3, 1.5, '#000') + picket(6.5, 4, 3, 1.5, '#000') + picket(11, 4, 3, 1.5, '#000') + rect(-1, 9, 18, 4, '#000').replace('/>', ' opacity="0"/>')) +
    [2, 6.5, 11].map((x) => picket(x, 5, 3, 1.5, mono || ink)).join('') + rect(0, 10, 16, 2, mono || ink),
  A5: ({ ink = G } = {}) => picket(3, 1, 4, 2, ink) + rect(7, 5, 7, 3, ink) + rect(7, 10, 5, 3, ink),
  B5: ({ tile = '#1F5A4C', ink = '#A9D6C8', dot = '#F2B84B', mono } = {}) => {
    const pk = (x, f) => poly([[x, 13], [x, 4.5], [x + 1.5, 3], [x + 3, 4.5], [x + 3, 13]], f);
    return mono
      ? knock(rect(0, 0, 16, 16, mono, 3.5), pk(2, '#000') + pk(11, '#000') + circle(8, 7, 2, '#000'))
      : rect(0, 0, 16, 16, tile, 3.5) + pk(2, ink) + pk(11, ink) + circle(8, 7, 2, dot);
  },
  // disc with three pickets + rail cut out of its lower half (negative space)
  C6: ({ sun = '#E39B2D', mono } = {}) =>
    knock(circle(8, 8, 7, mono || sun), [2.5, 6.5, 10.5].map((x) => poly([[x, 16], [x, 9.5], [x + 1.5, 8], [x + 3, 9.5], [x + 3, 16]], '#000')).join('') + rect(-1, 11, 18, 1, '#000')),
  C7: ({ sun = G, mono } = {}) => CANDIDATES.C6({ sun, mono }),
  // two-tone: green pickets in front of an amber disc, 1-unit halo between
  C8: ({ ink = G, sun = '#E39B2D', mono } = {}) => {
    const pk = (x, f, grow = 0) => poly([[x - grow, 16], [x - grow, 7.5 - grow], [x + 1.5, 6 - grow * 1.5], [x + 3 + grow, 7.5 - grow], [x + 3 + grow, 16]], f);
    const xs = [2.5, 6.5, 10.5];
    return knock(circle(8, 8, 7, mono || sun), xs.map((x) => pk(x, '#000', 1)).join('') + rect(-1, 14, 18, 3, '#000')) + knock(xs.map((x) => pk(x, mono || ink)).join(''), rect(-1, 14, 18, 3, '#000'));
  },
  // the fence itself: three pickets bridged by rail segments, one silhouette
  C9: ({ ink = G, mono } = {}) =>
    [0, 6, 12].map((x) => picket(x, 1, 4, 2, mono || ink)).join('') + rect(4, 9, 2, 2, mono || ink) + rect(10, 9, 2, 2, mono || ink),
  C10: ({ ink = G, mono } = {}) =>
    [0, 6, 12].map((x) => picket(x, 1, 4, 2, mono || ink)).join('') + [5, 11].map((y) => rect(4, y, 2, 2, mono || ink) + rect(10, y, 2, 2, mono || ink)).join(''),
  // middle picket in the warm accent: the one thing that matters
  C11: ({ ink = G, accent = '#E39B2D', mono } = {}) =>
    picket(0, 3, 4, 2, mono || ink) + picket(6, 1, 4, 2, mono || accent) + picket(12, 3, 4, 2, mono || ink) + [6, 11].map((y) => rect(4, y, 2, 2, mono || ink) + rect(10, y, 2, 2, mono || ink)).join(''),
  C12: ({ ink = G, mono } = {}) =>
    picket(0, 4, 4, 2, mono || ink) + picket(6, 1, 4, 2, mono || ink) + picket(12, 4, 4, 2, mono || ink) + [7, 11].map((y) => rect(4, y, 2, 2, mono || ink) + rect(10, y, 2, 2, mono || ink)).join(''),
  // uniform 3-unit stroke: stem = arms
  A6: ({ ink = G } = {}) => poly([[4, 15], [4, 2.5], [5.5, 1], [7, 2.5], [7, 15]], ink) + rect(7, 4, 7, 3, ink) + rect(7, 9, 5, 3, ink),
  // ---- round 2 (review): Gate rim / dot, Picket F on a tile, Fence line pushed further
  // Gate + 1-unit field-green rim: the tile edge reads on dark toolbars too
  // rim: 1 unit where the icon is small (16/32 px), thinner when large so it doesn't look like a sticker border
  B6: ({ rim = '#3A9A5B', tile = '#1F5A4C', ink = '#A9D6C8', dot = '#F2B84B', r = 2, size = 16, mono } = {}) => {
    const w = size <= 32 ? 1 : size <= 48 ? 2 / 3 : 0.5;
    const pk = (x, f) => poly([[x, 13], [x, 4.5], [x + 1.5, 3], [x + 3, 4.5], [x + 3, 13]], f);
    return mono
      ? knock(rect(0, 0, 16, 16, mono, 3.5), pk(2, '#000') + pk(11, '#000') + circle(8, 7, r, '#000'))
      : rect(0, 0, 16, 16, rim, 3.5) + rect(w, w, 16 - 2 * w, 16 - 2 * w, tile, 3.5 - w) + pk(2, ink) + pk(11, ink) + circle(8, 7, r, dot);
  },
  B7: (o = {}) => CANDIDATES.B6({ rim: '#5FB08C', ...o }),
  B8: (o = {}) => CANDIDATES.B6({ tile: '#276B5B', ...o }),
  B9: (o = {}) => CANDIDATES.B6({ r: 2.5, ...o }),
  // Picket F as ONE outline (no separate arms), white on a field-green tile
  A7: ({ tile = '#3A9A5B', ink = '#FFFFFF', mono, cut = false } = {}) => {
    const top = cut ? [[7, 5], [12, 5], [13, 6], [12, 7]] : [[7, 5], [12, 5], [12, 7]];
    const f = poly([[4, 14], [4, 3.5], [5.5, 2], [7, 3.5], ...top, [7, 7], [7, 9], [11, 9], [11, 11], [7, 11], [7, 14]], mono ? '#000' : ink);
    return mono ? knock(rect(0, 0, 16, 16, mono, 3.5), f) : rect(0, 0, 16, 16, tile, 3.5) + f;
  },
  A8: (o = {}) => CANDIDATES.A7({ cut: true, ...o }),
  // heavier arms (3 units) for balance with the 3-unit stem
  A9: ({ tile = '#3A9A5B', ink = '#FFFFFF', mono } = {}) => {
    const f = poly([[4, 14], [4, 3.5], [5.5, 2], [7, 3.5], [7, 4], [12, 4], [12, 7], [7, 7], [7, 8.5], [11, 8.5], [11, 11.5], [7, 11.5], [7, 14]], mono ? '#000' : ink);
    return mono ? knock(rect(0, 0, 16, 16, mono, 3.5), f) : rect(0, 0, 16, 16, tile, 3.5) + f;
  },
  // Fence in perspective: pickets shrink toward a focal point on the right
  C13: ({ ink = '#3A9A5B', mono } = {}) => {
    const c = mono || ink;
    const pk = (x, w, top, bot) => poly([[x, bot], [x, top + w / 2], [x + w / 2, top], [x + w, top + w / 2], [x + w, bot]], c);
    return pk(0, 3, 1, 15) + pk(4, 3, 2.5, 13.5) + pk(8, 3, 4, 12) + pk(12, 3, 5.5, 10.5) +
      poly([[3, 5], [12, 7], [12, 8.5], [3, 7]], c) + poly([[3, 10], [12, 9.5], [12, 10.5], [3, 12]], c).replace(/,/g, ',');
  },
  // Gate palette: tile, mint fence across the lower half, lantern sun rising behind the centre
  C15: ({ tile = '#1F5A4C', ink = '#A9D6C8', sun = '#F2B84B', rim = '#3A9A5B', mono } = {}) => {
    const fence = (f) => [2, 6, 10].map((x) => poly([[x, 14], [x, 8.5], [x + 2, 6.5], [x + 4, 8.5], [x + 4, 14]], f)).join('');
    if (mono) return knock(rect(0, 0, 16, 16, mono, 3.5), knock(circle(8, 6, 3.5, '#000'), [2, 6, 10].map((x) => poly([[x - 1, 15], [x - 1, 8.5], [x + 2, 5.5], [x + 5, 8.5], [x + 5, 15]], '#000')).join('')) + fence('#000'));
    return rect(0, 0, 16, 16, rim, 3.5) + rect(1, 1, 14, 14, tile, 2.5) +
      knock(circle(8, 6, 3.5, sun), [2, 6, 10].map((x) => poly([[x - 1, 15], [x - 1, 8.5], [x + 2, 5.5], [x + 5, 8.5], [x + 5, 15]], '#000')).join('')) + fence(ink);
  },
  // centre picket taller and wider: the fence "focuses" on the middle
  C16: ({ tile = '#1F5A4C', ink = '#A9D6C8', rim = '#3A9A5B', mono } = {}) => {
    const f = (c) => poly([[2, 14], [2, 7], [3.5, 5.5], [5, 7], [5, 14]], c) + poly([[6, 14], [6, 4], [8, 2], [10, 4], [10, 14]], c) + poly([[11, 14], [11, 7], [12.5, 5.5], [14, 7], [14, 14]], c);
    return mono ? knock(rect(0, 0, 16, 16, mono, 3.5), f('#000')) : rect(0, 0, 16, 16, rim, 3.5) + rect(1, 1, 14, 14, tile, 2.5) + f(ink);
  },
  B10: (o = {}) => CANDIDATES.B6({ rim: '#5FB08C', r: 2.25, ...o }),
  // knothole: the fence with a hole in the middle picket you look through
  C23: ({ ink = '#3A9A5B', light = '#F2B84B', hr = 1.5, mono } = {}) => {
    const body = [0, 6, 12].map((x) => picket(x, 1, 4, 2, mono || ink)).join('') + [5, 11].map((y) => rect(4, y, 2, 2, mono || ink) + rect(10, y, 2, 2, mono || ink)).join('');
    return knock(body, circle(8, 9, hr, '#000')) + (mono ? '' : circle(8, 9, hr - 0.01, light));
  },
  C24: ({ tile = '#1F5A4C', ink = '#A9D6C8', light = '#F2B84B', rim = '#5FB08C', mono } = {}) => {
    const fence = (c) => [2, 6.5, 11].map((x) => poly([[x, 14], [x, 4.5], [x + 1.5, 3], [x + 3, 4.5], [x + 3, 14]], c)).join('') + [6, 10.5].map((y) => rect(5, y, 1.5, 1.5, c) + rect(9.5, y, 1.5, 1.5, c)).join('');
    if (mono) return knock(rect(0, 0, 16, 16, mono, 3.5), knock(fence('#000'), circle(8, 8.5, 1, '#fff')).replace(/<mask/, '<mask') );
    return rect(0, 0, 16, 16, rim, 3.5) + rect(1, 1, 14, 14, tile, 2.5) + knock(fence(ink), circle(8, 8.5, 1, '#000')) + circle(8, 8.5, 0.99, light);
  },
  // C10 silhouette, the two enclosed gaps glowing: light through the fence
  C25: ({ ink = '#3A9A5B', light = '#F2B84B', mono } = {}) =>
    [0, 6, 12].map((x) => picket(x, 1, 4, 2, mono || ink)).join('') + [5, 11].map((y) => rect(4, y, 2, 2, mono || ink) + rect(10, y, 2, 2, mono || ink)).join('') + (mono ? '' : rect(4, 7, 2, 4, light) + rect(10, 7, 2, 4, light)),
  // knothole, one low rail: the lit hole is the only enclosed opening
  C26: ({ ink = '#3A9A5B', light = '#F2B84B', mono } = {}) => {
    const body = [0, 6, 12].map((x) => picket(x, 1, 4, 2, mono || ink)).join('') + rect(4, 10, 2, 3, mono || ink) + rect(10, 10, 2, 3, mono || ink);
    return knock(body, circle(8, 6.5, 1.5, '#000')) + (mono ? '' : circle(8, 6.5, 1.49, light));
  },
  // knothole, rails touching (no gap between rail and picket bottoms), wider centre picket
  C27: ({ ink = '#3A9A5B', light = '#F2B84B', mono } = {}) => {
    const c = mono || ink;
    const body = picket(0, 3, 4, 2, c) + poly([[5, 15], [5, 3.5], [8, 0.5], [11, 3.5], [11, 15]], c) + picket(12, 3, 4, 2, c) + rect(4, 10, 1, 3, c) + rect(11, 10, 1, 3, c);
    return knock(body, circle(8, 7, 1.75, '#000')) + (mono ? '' : circle(8, 7, 1.74, light));
  },
};

// ---------------------------------------------------------------- directions
// Field green: ≥ 3.4:1 against white and both Chrome dark toolbars (#35363A,
// #282A2C), so a single icon file works in light and dark Chrome.
export const FIELD = '#3A9A5B';

export const GLOW = '#FFEDB8'; // warmest cream ≥ 3:1 on field green
export const RIM = '#5FB08C'; // Gate rim: ≥ 4.6:1 on dark toolbars

export const DIRECTIONS = [
  {
    n: 1,
    slug: 'picket-f',
    name: 'Picket F',
    tagline: 'A monogram drawn as one outline: the F of FocusFence, its stem a fence picket, white on a field-green tile.',
    mark: (o = {}) => CANDIDATES.A7(o),
    word: { focus: COLORS.ink, fence: COLORS.pine, focusDark: COLORS.paper, fenceDark: FIELD },
    promo: { bg: COLORS.paper, mark: (o) => CANDIDATES.A7(o) },
    contrast: [['Tile on light toolbar', FIELD, '#FFFFFF'], ['Tile on dark toolbar', FIELD, '#35363A'], ['Tile on GM3 dark', FIELD, '#282A2C'], ['F on tile', '#FFFFFF', FIELD]],
  },
  {
    n: 2,
    slug: 'gate',
    name: 'Gate',
    tagline: 'Two pickets frame a warm dot: the fence keeps the noise out, the one thing you chose stays in view.',
    mark: (o = {}) => CANDIDATES.B10(o),
    word: { focus: COLORS.ink, fence: COLORS.pine, focusDark: COLORS.paper, fenceDark: COLORS.mint },
    promo: { bg: COLORS.pine, dark: true, mark: (o) => CANDIDATES.B10(o) },
    contrast: [['Tile on light toolbar', COLORS.pine, '#FFFFFF'], ['Rim on dark toolbar', RIM, '#35363A'], ['Rim on GM3 dark', RIM, '#282A2C'], ['Pickets on tile', COLORS.mint, COLORS.pine], ['Dot on tile', '#F2B84B', COLORS.pine]],
  },
  {
    n: 3,
    slug: 'knothole',
    name: 'Knothole',
    tagline: 'A fence with one knothole that glows: you look through it at the one thing that matters.',
    mark: (o = {}) => CANDIDATES.C26({ light: GLOW, ...o }),
    word: { focus: COLORS.ink, fence: COLORS.pine, focusDark: COLORS.paper, fenceDark: FIELD },
    promo: { bg: COLORS.ink, dark: true, mark: (o) => CANDIDATES.C26({ light: GLOW, ...o }) },
    contrast: [['Mark on light toolbar', FIELD, '#FFFFFF'], ['Mark on dark toolbar', FIELD, '#35363A'], ['Mark on GM3 dark', FIELD, '#282A2C'], ['Knothole glow on mark', GLOW, FIELD]],
  },
];
