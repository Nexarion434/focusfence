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

One icon file serves both light and dark Chrome (MV3 has no themed toolbar icons), so contrast is measured against white, the classic dark toolbar `#35363A` and the GM3 dark `#282A2C`. The non-text minimum is 3:1 (WCAG 1.4.11). **Rule:** on any toolbar, either the outer edge of the icon or a deliberate rim must reach 3:1.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| Field green | `#3A9A5B` | Picket F tile, Knothole mark | 3.5:1 on white, 3.4:1 on `#35363A`, 4.1:1 on `#282A2C` |
| Pine | `#1F5A4C` | Gate tile, "Fence" in wordmarks on light | 8.0:1 on white (1.5:1 on dark, hence the rim) |
| Rim | `#5FB08C` | Gate's outer rim | 4.6:1 on `#35363A`, 5.5:1 on `#282A2C` |
| Mint | `#A9D6C8` | Gate pickets | 5.0:1 on pine |
| Lantern | `#F2B84B` | Gate's focus dot | 4.5:1 on pine |
| Glow | `#FFEDB8` | Knothole light | 3.0:1 on field green (the warmest cream that passes; lantern yellow only reaches 2.0:1) |
| White | `#FFFFFF` | Picket F letter | 3.5:1 on field green |
| Ink | `#1C2622` | "Focus" in wordmarks, dark promo background | |
| Paper | `#F5F4EF` | Light backgrounds | |

The existing UI green `#276B5B` reaches only 1.9:1 on the dark toolbar, so a freestanding mark or a tile edge can't rely on it.

## 4. Shape rules

- **Grid:** 16 × 16 units; 1 unit = 1 px at 16, 2 px at 32, 3 px at 48. All edges sit on whole units, except picket apexes on half units (the diagonals are antialiased anyway). The 128 px store icon uses the same art at 6× (96 px) inside the 16 px transparent margin the Chrome Web Store asks for, so its edges land on whole pixels too.
- **Picket tip:** a 45° point (rise = half the picket width). It's the signature detail: never round it, never make it steeper (it turns into a pencil or rocket).
- **Weights:** pickets 3–4 units, rails 2–3 units, with at least 1 unit of air between separate elements at 16 px.
- **No outlines, gradients or shadows.** Solid fills only, so the mono version is the same drawing in one ink.
- **Mono:** every mark must work in pure black and pure white. Tiles use knock-outs (transparent holes), not painted-on white.
- **Rims:** 1 unit at 16 and 32 px (where they are needed), ⅔ unit at 48, ½ unit at 128 and above, so the large mark never looks like a sticker border.
- **Badge-safe:** Chrome draws the countdown badge over the bottom-right of the icon during focus sessions, so the key element must stay readable with that quadrant covered.
- **Wordmark:** "FocusFence" in Inter Bold (700, bundled in the extension), tracking −2.5 %, "Focus" in ink, "Fence" in the direction's green. On dark backgrounds use paper + mint or field green.

## 5. Directions

All drawn in `marks.mjs`: Picket F `A7`, Gate `B10`, Knothole `C26` (the candidate ids from the exploration). Exports for each are in `design/logo/<n>-<slug>/` (`icon-{16,32,48,128}.{svg,png}`, `mark.svg`, `mark-mono.svg`).

### Direction 1: Picket F (`board-1.png`)

A monogram drawn as one outline: the F of FocusFence, its stem a fence picket, white on a field-green tile.

**Round 1:**
- A1: first F.
- A2/A3: rails piercing the stem, which read as a signpost or cactus. Rejected.
- A4: arrow-cut arm ends, mushy at 16 px. Rejected.
- A5: freestanding green F. The review found it clunky: the middle arm looked detached, like a flag or a construction error.
- A6: uniform 3-unit stroke. More elegant large, but the tip vanished at 16 px. Rejected.

**Round 2 (review):**
- The F is now **one polygon** (stem, picket tip and both arms), so no arm can read as a separate piece.
- Weights: stem 3 units, arms 2; arm lengths 5 and 4 (80 %).
- The letter is centred on the tile (x 4–12, y 2–14).
- It gets its own treatment, white on a **field-green tile**: both the tile edge and the letter pass 3:1 on every toolbar without a rim.
- Rejected variants:
  - A8: pointed top arm, which brought the flag back.
  - A9: 3-unit arms, which land on half pixels and show grey seams at 32 px.

**Self-critique:**
- **Strengths:**
  - Reads as a deliberate F from 16 px up.
  - The simplest contrast story: one colour pair, passing everywhere.
  - Strongest mono version.
  - Sits next to Gate as a real alternative: same quality, brighter and more "letter-led".
- **Weaknesses:**
  - "Letter on a tile" is a familiar pattern.
  - The picket tip is a small detail at 16 px; the fence idea only shows from 32 px.
  - The badge covers the arms during focus sessions; the tile still identifies it.

### Direction 2: Gate (`board-2.png`)

Two pickets frame a warm dot: the fence keeps the noise out, and the one thing you chose stays in view.

**Round 1:**
- B1: brackets around a dot, which read as a camera or QR scanner. Rejected.
- B2: ink tile.
- B3: freestanding, which drifted toward media symbols. Rejected.
- B4: pine tile, but the dot touched the pickets.
- B5: 3-unit pickets with air around the dot.
- After the badge test, the dot was raised from y=9 to y=7.

**Round 2 (review): fixing the 1.5:1 tile on dark toolbars.** I tried:
- B6: a field-green rim, which fixed dark but looked like a button border on light.
- B8: a lighter tile, which lost the depth.
- B7: a softer `#5FB08C` rim, the best of these.

I kept the B7 rim (4.6:1 on dark, while the pine tile gives 8:1 on light). It is 1 px at 16 and 32 px and thins out at larger sizes. A tile-less dark variant isn't possible, because Chrome ships one icon for both themes. **The dot was too small at 16 px:**
- r 2 gave 4 px with soft corners.
- r 2.5 (B9) touched the pickets.
- **r 2.25** (B10) is clearly visible and keeps clear air.

**Self-critique:**
- **Strengths:**
  - Passes every test: 16 px, both themes (now including the tile edge), mono and the badge.
  - Tells the product story.
  - Keeps the UI's pine, so the extension and website stay coherent.
- **Weaknesses:**
  - Still a tile, the category's usual container.
  - The rim adds a second green that has to be respected in future assets.

### Direction 3: Knothole (`board-3.png`, replaces "Fence line")

A fence with one knothole that glows: you look through it at the one thing that matters.

**Round 1 ("Fence line"):**
- Rejected candidates:
  - C1: rocket or cross
  - C2/C4: sea or horizon
  - C3: signal-strength bars
  - C5–C8: jellyfish shapes
  - C9: "HH"
  - C11: pencil
  - C12: castle
- C10 was kept, but the review rightly called it generic clip-art.

**Round 2 (review), pushing for distinctiveness:**
- Rejected:
  - C13: perspective fence, unreadable at 16 px.
  - C15: tile with a sunrise behind the fence, which reads as the generic "image placeholder" icon.
  - C16: taller centre picket without rails, which reads as buildings or a bar chart.
  - C24: knothole on a tile, too busy.
  - C25: glowing gaps, which read as building windows.
  - C27: wider centre picket, which reads as a church or rocket.
- C23 introduced the **knothole**: negative space that means focus, while staying a fence. At 16 px its lit hole sat in a row with two empty rail gaps.
- **C26 drops to a single low rail**, so the knothole is the only enclosed opening.
- The glow is cream `#FFEDB8`, not lantern yellow, because yellow can't reach 3:1 on field green. On a white toolbar it looks like a true hole; on dark it glows.

**Self-critique:**
- **Strengths:**
  - The most distinctive of the three; no competitor uses anything like it.
  - Still unmistakably a fence.
  - A story that rewards a second look.
  - The knothole survives the badge and 16 px.
- **Weaknesses:**
  - As a freestanding mark it carries less toolbar weight than the two tiles.
  - The knothole is 3 px at 16 px: readable, but a detail rather than a headline.
  - The single rail makes it slightly more abstract than a classic fence.

## 6. Recommendation

**Gate is still the safest choice.** It is app-ready, passes every test and keeps the existing UI palette.

**Knothole is the most distinctive** and is now a serious alternative if Nicolas prefers a freestanding mark and a stronger story over a tile.

**Picket F** is the right pick if the brand should lead with its name. It also works as a secondary mark next to the wordmark whatever the toolbar icon is.

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
node design/logo/build.mjs explore out.png A7 B10 C26  # side-by-side exploration sheet
```

The boards are rendered by Chromium from HTML (Inter is embedded), so they are reproducible. The competitor icons were only viewed for research and are not stored in the repo (third-party trademarks).
