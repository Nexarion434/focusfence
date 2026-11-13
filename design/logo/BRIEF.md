# FocusFence logo: brief, directions and critique

Status: **proposal, nothing replaced.** `focusfence/src/icons/` still holds the current icons; Nicolas picks a direction first.

## 1. Competitor research (icons fetched from each product's site, 2026-11-13)

| Product | Icon | Shape / container | Colour |
|---|---|---|---|
| Freedom | Outline butterfly | Rounded-square tile | Light green |
| Cold Turkey | Turkey mascot | Rounded-square tile | Dark grey, white mark |
| BlockSite | Prohibition sign ⊘ | Shield | Red |
| LeechBlock NG | Script "L" | Shield | **Teal-green** |
| StayFocusd | Clock face | Segmented ring | Multicolour |
| Opal | Rounded pebble outline | Ring on black tile | Black / white |
| one sec | Gradient ring with a notch | Ring on dark tile | Blue gradient |

What the category does, and therefore what to avoid:

- **Every icon sits in a container:** a tile, a shield or a ring. Two use shields, and two put rings on dark tiles.
- **Three of seven are built on a circle or ring** (clock, pebble, timer ring). Circles read as "timer" in this category.
- **Prohibition signs and shields** say "security / parental control", not calm focus.
- **Mascots and illustration** (turkey, butterfly) are charming but can't be drawn on a 16 px grid.
- **Green is taken twice.** LeechBlock's teal-green on a shield is the closest neighbour to FocusFence's current colour.

## 2. Concept

FocusFence doesn't punish you; it **fences off** the noise you chose, so the thing you care about stays in view. The fence is a boundary you set yourself: calm, deliberate, slightly warm. The mark should feel built (a constructed object), not drawn (an illustration), and own the **picket**: the pointed vertical board. No competitor uses it, and it survives at 16 px.

## 3. Palette

One icon file serves both light and dark Chrome (MV3 has no themed toolbar icons), so contrast is measured against both. The non-text minimum is 3:1 (WCAG 1.4.11).

| Token | Hex | Use | Contrast |
|---|---|---|---|
| Field green | `#3A9A5B` | Freestanding marks (directions 1 and 3) | 3.5:1 on white, 3.4:1 on `#35363A`, 4.1:1 on `#282A2C` |
| Pine | `#1F5A4C` | Tile (direction 2), "Fence" in wordmarks on light | 8.0:1 on white, 1.5:1 on the dark toolbar (tile edge only) |
| Mint | `#A9D6C8` | Pickets on pine | 5.0:1 on pine |
| Lantern | `#F2B84B` | The focus dot (direction 2) | 4.5:1 on pine |
| Ink | `#1C2622` | "Focus" in wordmarks, dark promo background | |
| Paper | `#F5F4EF` | Light backgrounds | |

The existing brand green `#276B5B` (UI accent) reaches only 1.9:1 on the dark toolbar, so a freestanding mark can't use it. Field green was chosen over teal shades because it is ≥ 3.4:1 on all three toolbar backgrounds and sits yellower than LeechBlock's teal.

## 4. Shape rules

- **Grid:** 16 × 16 units; 1 unit = 1 px at 16, 2 px at 32, 3 px at 48. All edges sit on whole units, except picket apexes on half units (the diagonals are antialiased anyway). The 128 px store icon uses the same art at 6× (96 px) inside the 16 px transparent margin the Chrome Web Store asks for, so its edges land on whole pixels too.
- **Picket tip:** a 45° point (rise = half the picket width). It's the signature detail: never round it, never make it steeper (it turns into a pencil or rocket).
- **Weights:** pickets 3–4 units, rails 2–3 units, with at least 1 unit of air between separate elements at 16 px.
- **No outlines, gradients or shadows.** Solid fills only, so the mono version is the same drawing in one ink.
- **Mono:** every mark must work in pure black and pure white. Tiles use knock-outs (transparent holes), not painted-on white.
- **Badge-safe:** Chrome draws the countdown badge over the bottom-right of the icon during focus sessions, so the key element must stay readable with that quadrant covered.
- **Wordmark:** "FocusFence" in Inter Bold (700, bundled in the extension), tracking −2.5 %, "Focus" in ink, "Fence" in the direction's green. On dark backgrounds use paper + mint or field green.

## 5. Directions

All drawn in `marks.mjs` (`A5`, `B5`, `C10`). Exports for each are in `design/logo/<n>-<slug>/` (`icon-{16,32,48,128}.{svg,png}`, `mark.svg`, `mark-mono.svg`).

### Direction 1: Picket F (`board-1.png`)

A monogram: the F of FocusFence, its stem cut like a fence picket.

**Iterations:**
- A1: first F.
- A2/A3: rails piercing the stem, which read as a signpost or cactus. Rejected.
- A4: arrow-cut arm ends, mushy at 16 px. Rejected.
- A5: lower arm lengthened from 4 to 5 units for a proper F proportion. Kept.
- A6: uniform 3-unit stroke. More elegant large, but the picket tip collapsed to one grey pixel at 16 px. Rejected.

**Self-critique:**
- **Strengths:**
  - Strongest silhouette in mono.
  - Reads as "F" from 16 px up, and is clearly not a shield, ring or tile.
  - Pairs naturally with the wordmark.
- **Weaknesses:**
  - A letter is the least ownable idea; many brands use an F.
  - The picket point is a 1–2 px nub at 16 px, so the fence story only shows from 32 px up.
  - Lighter than neighbouring toolbar icons (11 px wide).
  - **The countdown badge covers both arms, leaving only the stem**: the worst badge behaviour of the three.

### Direction 2: Gate (`board-2.png`)

Two pickets frame a warm dot: the fence keeps the noise out, and the one thing you chose stays in view.

**Iterations:**
- B1: corner brackets around a dot. Read as a camera or QR scanner, and failed mono. Rejected.
- B2: ink tile.
- B3: freestanding, which drifted toward media-player symbols. Rejected.
- B4: pine tile, but the dot touched the pickets.
- B5: pickets narrowed to 3 units with 1 unit of air.
- After the badge test, **the dot was raised from y=9 to y=7** so the countdown badge no longer hides it. It now also reads as a sun rising between gateposts.

**Self-critique:**
- **Strengths:**
  - The most finished and app-like of the three.
  - Readable at every size.
  - The only direction that keeps the current UI pine, so the extension and site stay coherent.
  - The mint and lantern parts clear 4.5:1 on the tile, so it reads on both toolbars.
  - Survives the badge.
- **Weaknesses:**
  - It uses a tile, the very container the category leans on; the differentiation has to come from the content.
  - On dark toolbars the tile edge itself disappears (1.5:1); only the inner mark carries.
  - At 16 px it can pass for "| • |".

### Direction 3: Fence line (`board-3.png`)

The fence itself, drawn as one bold silhouette: three pickets, two rails, nothing else.

**Iterations:**
- C1: picket + rail, which read as a rocket or cross. Rejected.
- C2/C4: sunrise over rails, which read as sea or horizon. Rejected.
- C3: rising pickets, which read as a mobile signal indicator. Rejected.
- C5–C8: sun and picket combinations; negative pickets looked like jellyfish. Rejected.
- C9: one rail, which read as "HH". Rejected.
- C11: amber middle picket, which looked like a pencil. Rejected.
- C12: taller middle picket, which looked like a castle. Rejected.
- C10: equal pickets, two rails. Kept.

**Self-critique:**
- **Strengths:**
  - Instantly says "fence" with no explanation.
  - Fills the full 16 px width, so it has the most presence in the toolbar.
  - Works in mono.
  - Still reads as a fence with the badge covering one picket.
- **Weaknesses:**
  - The most literal and least ownable; it's close to generic clip-art or emoji.
  - Large, it feels heavy and stencil-like.
  - Conceptually it's an evolution of the current icon (three pickets, two rails) rather than a new idea, so if the current one feels "AI-generic", this risks the same verdict.

## 6. Recommendation

**Direction 2, Gate.** It is the only one that:
- passes every practical test: 16 px, both toolbar themes, mono and the countdown badge;
- tells the product's story (boundary + focus) rather than just its name;
- keeps the existing pine of the UI and website.

Direction 3 is the safe fallback if instant literal recognition matters more than distinctiveness. Direction 1 works best as a secondary mark next to the wordmark rather than as the toolbar icon.

## 7. After a choice (not done)

1. Copy the chosen `icon-{16,32,48,128}.png` into `focusfence/src/icons/`.
2. Run `npm run build`, `npm run cws:check`, `npm run screenshots:all` and `npm run docs`, so the store and website pick up the new icon and social tiles.
3. Replace the inline logo SVG in `focusfence/scripts/docs.mjs` and the popup/options headers with the chosen `mark.svg`.
4. Check the badge colour against the new icon.

## Regenerate

```bash
# from the repo root; FF_CHROME_LIBS as for the test suite
node design/logo/build.mjs boards              # all boards + exports
node design/logo/build.mjs boards 2            # one direction
node design/logo/build.mjs explore out.png A5 B5 C10   # side-by-side exploration sheet
```

The boards are rendered by Chromium from HTML (Inter is embedded), so they are reproducible. The competitor icons were only viewed for research and are not stored in the repo (third-party trademarks).
