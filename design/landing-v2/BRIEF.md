# FocusFence landing page v2: brief, decisions and critique log

Status: **proposal on branch `design/landing-v2`** (PR #3 against `feat/focusfence-v1`, to be retargeted to `main`). Nothing outside the website was changed, apart from an opt-in `--site` mode in the screenshot script (the extension's own styles are untouched).

Round 2 (owner feedback on PR #3) added:
- a light theme that follows the system, with a light / dark / system toggle in the header;
- a richer hero that explains the product at a glance.

Both are covered in sections 3, 6, 7 and 10.

Reference: [linear.app](https://linear.app), studied on 2026-11-13 with desktop (1440 px) and mobile (390 px) captures and its computed styles. We borrow its level of craft, not its assets, copy or brand.

## 1. What the reference does, and what we take from it

| Linear does | Measured on linear.app | FocusFence takes |
|---|---|---|
| Near-black canvas, never pure black | body `rgb(8, 9, 10)`; panels a few steps lighter; 1 px borders at ~8 % white | Same canvas `#08090A`. Panels are lit with translucent white; product screens sit on the extension's own dark background `#141917` |
| One typeface, finely tuned | Inter Variable; headings weight 510, tracking −0.022em, line-height 1.0 | Inter with the **optical-size axis** (Inter Display shapes at large sizes), one self-hosted 73 KB file, headings 590–620 with tighter tracking (our lines are shorter) |
| Two-tone headings | first sentence `#f7f8f8`, the rest `#8a8f98` | Every section heading. In the hero, *the endless feeds* is the dimmed half: the distraction is literally fenced off |
| Quiet body text | 15 px, `#8a8f98`, line-height 1.6 | 15–16 px muted body, 17–19 px lead |
| The product, shown huge and framed, with light behind it | app window ~1320 px wide, inner 1 px gradient edge, soft light pooling underneath | The real block page in a browser window with the real popup hanging from the toolbar icon, a green light behind it, and a floor fade |
| Monospace micro labels | `FIG 0.1`, uppercase, ~11 px | Section kickers, step numbers, the permissions card |
| Feature rows: heading left, paragraph right, visual below | 48 px heading left, 20 px paragraph right | Same grid for Block, Focus and Stats |
| Hairline section breaks, generous vertical space | 1 px lines, 150–200 px between blocks | Same rhythm (`clamp(88px, 11vw, 160px)`) |
| Pills, restrained colour | brand indigo almost never used | Green only for the logo, the primary action, focus states, ticks and the light |

Deliberately **not** taken: customer logos, testimonials, user counts or press (we have none and must not invent any), isometric illustrations, a mega-menu.

## 2. Direction: "lights out, fence up"

FocusFence sells the absence of noise. The page feels like the product does when it works: quiet, nothing pulling at you, one calm green light. That holds by night (the dark base design) and by day (the light theme, in the extension's own paper and ink). Every section has one idea, one real visual and a lot of air. Real screenshots do the showing (never mock-ups), and type does the telling.

Signature details:

- **The picket.** The logo's 45° picket tip is the only ornament: a 7×11 px picket in front of each kicker, and a picket fence at the end of the page (same 45° tip, rise = half the width). In dark it is a silhouette against green light; in light, a white picket fence.
- **Dimmed distractions.** In two-tone headings the distracting thing is set in the muted grey.
- **One moment, told three times.** The hero's popup and its block-page card show the same focus session at the same second (18:42 left, 5 blocked today, 89 this week), and so do the stats further down.

## 3. Palettes: dark first, light as polished

The site follows the system theme (`prefers-color-scheme`) until the visitor picks one in the header toggle. Dark remains the base design. The light theme is the extension's own light theme brought to the page: warm paper, ink, and the pine green of the product's light buttons. Product screenshots switch with the theme, since each one is a real capture of the extension in that theme. All colours are tokens in `scripts/site.css`; the light values override them in one block.

| Token | Dark | Light | Use | Contrast (dark / light) |
|---|---|---|---|---|
| `--bg` | `#08090A` | `#FBFAF7` | page | |
| `--bg-2` | `#0B0D0C` | `#F4F3EE` | footer | |
| `--screen` | `#141917` | `#F5F4EF` | behind product crops (each is the extension's own background, so crops sit seamlessly) | |
| `--line` / `-2` / `-3` | white 7.5 / 11 / 18 % | ink 8.5 / 13 / 24 % | hairlines, card edges | |
| `--text` | `#F3F5F4` | `#161D1A` | headings | 18.2 / 16.4 : 1 |
| `--text-2` | `#C9D0CC` | `#3B4842` | emphasis, list items | 12.7 / 9.2 : 1 |
| `--muted` | `#8E9893` | `#5A645F` | body, nav | 6.7 / 5.9 : 1 (5.6 on `--screen`) |
| `--dim` | `#8E9893` | `#7E8883` | dimmed half of headings, ≥ 26 px only | 6.7 / 3.5 : 1 (AA large) |
| `--green` | `#3A9A5B` | `#3A9A5B` | field green: logo tile, glows, kicker pickets (never small text) | |
| `--accent` | `#6CC58A` | `#276B5B` | ticks, step numbers, focus ring | 9.5 / 6.0 : 1 |
| `--cta` | `#5DBE7E`, ink text | `#276B5B`, white text | primary button (the product's own light button colour) | 8.3 / 6.3 : 1 |
| `--pro` | `#D9A74B` on 12 % amber | `#7D5710` on `#F7EEDB` | PRO badges (as in the extension) | 8.0 / 5.6 : 1 |

Light-theme details: cards are white with a hairline and a 1 px shadow instead of translucent white; windows get soft ink shadows instead of black ones; the closing fence becomes a white picket fence against a pale green light.

### Theme switching, without a flash

- **Before the first paint**, an inline script in `<head>` reads `ff-theme` from `localStorage`. It sets `data-theme` (light or dark; nothing for System) and the `theme-color` metas before the styles are parsed. CSS applies the light tokens either under `prefers-color-scheme: light` (System) or under `[data-theme='light']`.
- **The toggle** is a native radio group (sun, moon, monitor), so arrow keys work. Its selected state comes from a `data-theme-pref` attribute set by the same script, so it is right from the first paint. Without JavaScript it is hidden, and the page simply follows the system.
- **Images:** every product image exists twice, one per theme. CSS shows the matching one, and every image is lazy, so the hidden theme is never downloaded. The head script preloads the hero image of the resolved theme.
- **A switch:** the script first fetches the new theme's on-screen captures (up to 450 ms), then cross-fades with the View Transitions API (skipped under reduced motion). The choice also syncs across open tabs.

## 4. Type scale

Inter (opsz 14–32, wght 100–900), `font-optical-sizing: auto`, features `cv11` and `ss01` (as in the extension). Mono is the system stack, used only for short labels, so no second font is downloaded.

| Role | Size (360 → 1440 px) | Weight | Tracking | Line height |
|---|---|---|---|---|
| Display (h1) | 44 → 80 px | 620 | −0.045em | 0.98 |
| Closing line | 38 → 72 px | 620 | −0.045em | 1.0 |
| Section (h2) | 32 → 48 px | 600 | −0.038em | 1.04 |
| Statement | 26 → 40 px | 560 | −0.03em | 1.16 |
| Card title (h3) | 17 px | 590 | −0.014em | 1.35 |
| Lead | 17 → 19 px | 400 | −0.012em | 1.55 |
| Body | 15–16 px | 400 | −0.006em | 1.6 |
| Nav, small | 13.5 px | 500 | 0 | |
| Mono kicker | 12 px, uppercase | 500 | +0.1em | 1 |

`text-wrap: balance` on headings and `pretty` on the lead and statement avoid orphans in all four languages.

## 5. Layout

- Content 1200 px; product windows up to 1280 px; prose 700 px. Gutters `clamp(20px, 4vw, 40px)`.
- Radii 8 (controls), 14 (tables), 18 (windows, cards). Pills for buttons and badges.
- Breakpoints: 1024 (two-column heads and grids stack, bento cards go full width), 860 (steps and plans stack), 720 (section links move to the footer; product windows keep a legible scale and are cropped instead of shrunk), 480 (full-width buttons, stacked ticks, smaller fence), 400 (tighter buttons). Checked at 360, 390, 768, 1024, 1280 and 1440 px: no horizontal scroll.

## 6. Page plan (as built)

1. **Header:** logo and wordmark; Features, Pricing, Blog, Privacy; mono EN/FR/ES/DE switcher; "Add to Chrome" pill once `STORE_URL` is set. Translucent, blurred, hairline after scrolling.
2. **Hero:** kicker pill, two-tone H1 on one line (two in Spanish), then a split row with the lead on the left and the actions plus three ticks on the right. Until the store link exists, the primary action is an honest status ("Coming soon to the Chrome Web Store", a dot that pings three times), not a dead button.

   Below it, the product in one look. Each window's tab title comes from the extension's own strings.
   - **What you control:** the real Settings window, with every section in the sidebar and a blocklist of websites, a path and a keyword.
   - **One click and a timer:** the real popup hangs from the toolbar icon at the same scale.
   - **What you get instead:** a block-page window ("reddit.com is fenced off", with today's counts) breaks out of the frame at the bottom right.

   On phones, the settings window keeps a legible scale and runs off the right edge, and the block-page card overlaps its lower half.
3. **Statement + three steps** (from onboarding): pick up to three sites, allow the block page, get back to work.
4. **Block** (`#features`): the full block page in a browser window (the hero's settings view moved up), then the two block features.
5. **Focus:** bento of three cards with real UI crops at 1:1: schedule ranges, the popup's focus timer and strict mode switched on.
6. **Stats:** the real stats panel, large, then a hairline grid of six smaller real features (password lock, own block-page message, export/import, light and dark, four languages, incognito check).
7. **Privacy:** two-tone statement, three points, and a mono card listing what FocusFence actually asks Chrome for, plus the single network exception (ExtensionPay, only after upgrading).
8. **Pricing:** Free / Pro monthly / Pro yearly (lit card, "Save 44%"), localized prices, how to upgrade, payment note.
9. **FAQ:** heading and contact line left (sticky on desktop), accordion right.
10. **Closing:** logo in its light, "Get your focus back.", the action, the picket fence against the green light.
11. **Footer:** brand line, Product / Resources / Contact (contact@focusfence.dev), license and trademark notes.

## 7. Product imagery

`npm run screenshots:site` (new `--site` mode of the existing `scripts/screenshots.mjs`) drives the real extension with the same seeded data as the store shots and writes `screenshots/site/<lang>/`:

- 2x captures in **both themes** (`name.webp` and `name-light.webp`), encoded to WebP by Chromium's own canvas encoder (no image tooling needed): settings/blocklist and block page (1x and 2x, `srcset`), block-page card, popup, focus timer, schedule, strict mode, stats. The 2560×1600 captures weigh 40–95 KB.
- The block-page card is cropped from the very same frame as the full block page, so its countdown matches the popup's.
- The feature crops come from a 900 px window, so the cards are compact and shown at 1:1.
- Countdowns are captured at exactly 18:42 (the script waits for that tick), and the stats are captured after the block-page visit, so every number agrees across images.
- `og.png` (1200×630) per language, composed from the same captures: logo, localized kicker and two-tone headline (auto-fitted), ticks, window and popup.

## 8. Motion

Subtle and optional; nothing is hidden without JavaScript, and `prefers-reduced-motion` turns all of it off.

- Blocks below the fold rise 16 px and fade in once (IntersectionObserver, 0.7 s ease-out). The observer starts after `load` and never reads layout, so it costs nothing on the critical path. The hero never animates (it holds the LCP).
- A soft light follows the pointer across cards and plans (fine pointers only).
- FAQ answers open with a height transition where the browser supports it.
- No endless animation: the status dot pings three times and rests.

## 9. Quality bar (measured)

- **Lighthouse** (v12.6, local static server with gzip). The server is shared with other agents and was saturated during the final runs (6 cores, load average 4–6), so the figures are medians with the full range of repeated runs:

  | Page | Perf, phone (median, range) | Perf, desktop | A11y | Best practices | SEO |
  |---|---|---|---|---|---|
  | `/` dark | 98 (97–99) | 100 | 100 | 100 | 100 |
  | `/` light | 97 (95–99) | 100 | 100 | 100 | 100 |
  | `/fr/` `/es/` `/de/`, both themes | 98 (91–100) | 100 | 100 | 100 | 100 |
  | `/privacy.html`, both themes | 97 (90–100) | 100 | 100 | 100 | 100 |
  | `/blog/*` | 100 | 100 | 100 | 100 | 66: drafts carry `noindex` by design until published |

  On phones, LCP is 1.4–2.1 s and CLS 0. A visitor downloads only their theme's images (checked in the network log). Round 1, measured on a quieter server, scored 96–100.
- **Accessibility:** axe (WCAG 2 A/AA) passes on every page in **both themes** at 1280 px, with no horizontal scroll at 1280, 390 and 360 px (`tests/docs.spec.mjs`). Also covered:
  - skip link, landmarks and labelled navs;
  - focus-visible rings, including on the theme toggle, which is a native radio group;
  - real `<details>` for the FAQ;
  - alt text on every product image (the hidden theme's image is `display: none`, so it is never announced twice).
- **Weight:** about 250 KB on a first visit on a phone. That covers HTML with inline CSS (16 KB gzipped), the font (73 KB), the hero settings capture (39–41 KB at 1x), the block-page card (33–35 KB) and the next lazy screenshot. All of a language's product images come to 330 KB (dark) or 355 KB (light), and the other theme is never fetched.

## 10. Critique log

Each pass: full-page screenshots at 1440 and 390 px for en, fr, es and de, compared against the linear.app captures. The final screenshots are in `screenshots/`.

**Pass 1** (first build):
1. The product started 720 px down a 900 px screen; Linear shows it from ~530 px.
2. The hero copy was crammed left, with an empty right half.
3. The Focus crops were tiny (schedule at 0.4 scale on phones), and the strict-mode crop was a thin strip of 9 px text.
4. The stats sat in a narrow split: a three-line heading with a ragged break, chart labels around 7 px.
5. The settings capture said "Focus session" on its toggle (a session was running), which made no sense next to a blocklist.
6. The two timers disagreed (18:43 / 18:42), and so did the counts (4 vs 5 blocked today).
7. On phones, the hero crop cut the tab title and showed a sliver of the popup at the edge, which looked broken.
8. The closing fence read as a barcode.

Fixes:
- **Hero:** a split row (lead left, actions right), so the window starts at ~475 px; a mobile composition with the popup under the window.
- **Crops:** captured from a 900 px window, so the cards are compact and shown at 1:1; on phones they keep a legible scale and fade at the edge.
- **Stats:** the standard section head plus a large centred panel.
- **Captures:** ordered so that every count and timer agrees (and the toggle reads "Blocking on"), with the script waiting for the exact tick.
- **Fence:** redrawn as a silhouette against light.

**Pass 2:**
1. A stray hairline ran across the fence (the pattern rect inherited the stroke).
2. The statement broke into four lines with an orphan; it was shortened in all four languages.
3. The H2s were sized down to 48 px (Linear's size).
4. On phones, the hero window kept a hard bottom edge under its fade, and the ticks wrapped unevenly.
5. The OG popup covered the block page's headline; it was moved onto the empty side, and the headline auto-fits per language.

**Pass 3** (all languages, plus privacy and blog):
1. German used "Strikt-Modus" while the product and store listing say "strikter Modus"; the site copy was aligned with the screenshots.
2. Some leads ended in orphans; the lead is now `text-wrap: pretty`.
3. The blog index showed stray bullets.
4. On phones the popup covered the block page's buttons; it now sits in normal flow under the window, with no magic numbers.

**Pass 4** (performance):
1. Mobile Lighthouse scored 87–94, with up to 530 ms TBT. Traces showed four causes:
   - a forced layout at script start;
   - a CSS animation that could not be composited, so it ticked on the main thread every frame;
   - a container query on the hero window;
   - `local()` lookups for a metric-matched fallback font.
2. Fixes:
   - the script reads no layout and starts after `load`;
   - no endless animations;
   - percentages instead of `cqw`;
   - the fallback face was dropped (CLS stayed at 0, since the preloaded font arrives before first render).
3. `content-visibility` was tried and removed: the gain was no longer needed, and it made anchor jumps and full-page captures unreliable.

**Pass 5** (breakpoints and states):
1. The page was checked at 360, 768, 1024 and 1280 px.
2. At 360 px the English status pill wrapped to two lines; buttons are slightly smaller below 400 px.
3. The fence was oversized on phones; it is now scaled down.
4. The live-store state (`STORE_URL` set) was rendered and checked: green nav pill, primary "Add to Chrome — it's free" with an arrow, full width on phones.

**Pass 6** (end of round 1, all languages): full pages and 2x first screens re-shot from the committed build. There were no new issues, and the full test suite passed (103 tests). These dark-only images were replaced in round 2; see pass 9.

### Round 2: owner feedback (light mode, richer hero)

**Pass 7** (first build of round 2, all languages, both themes):
1. **Light theme.**
   - Built from the extension's own light theme: warm paper `#FBFAF7` page, white cards, pine `#276B5B` for accents and the primary button (the colour of the product's own light buttons), ink text.
   - Every pair is AA; the dimmed heading tone (3.5:1) is only used on large text.
   - Windows get soft ink shadows instead of black ones, and the closing fence becomes a white picket fence against a pale green light.
2. **Theme switching.**
   - An inline `<head>` script applies the stored choice before the styles, so there is no flash.
   - The toggle is a native radio group, and its selected state comes from an attribute set by the same script, so it is right from the first paint.
   - Every product image exists once per theme, and both are lazy, so the hidden theme is never downloaded. The hero image of the resolved theme is preloaded.
3. **Hero.**
   - The settings window (sidebar with every section, blocklist with websites, a path and a keyword) is now the base.
   - The popup hangs from the toolbar icon.
   - A block-page window ("reddit.com is fenced off", today's counts) breaks out of the frame at the bottom right.
   - The full block page moved down to the Block section.
   - Phones show the settings window at a legible scale, running off the right edge, with the block-page card overlapping its lower half.
4. **Found and fixed:**
   - The block-page card showed 18:41 while the popup showed 18:42: it was a second screenshot taken after the tick. It is now cropped from the same frame.
   - Blocks that a fast scroll or an anchor jump carried past the viewport could stay hidden. The observer's root now extends upward, so anything above the fold line counts as seen (covered by a test).
   - Switching themes popped the new images in late. The toggle now fetches the new theme's on-screen captures first (up to 450 ms), then cross-fades.

**Pass 8** (review in both themes, all languages):
1. In German, the longer "Zur Sperrliste hinzufügen" button peeked out as a green sliver from behind the popup. The popup now sits 2.35% from the window edge, so it covers the button in every language and still hangs under the toolbar icon.
2. In light mode, the hero window's soft shadow showed as a grey band under its faded bottom. The floor fade now extends past the window and covers it.
3. "Settings › Plan" broke after the arrow on phones; the path is now joined with non-breaking spaces in all four languages.
4. A crop came out 1121 px tall, which gave a fractional (`560.5`) CSS height. Crop rectangles now snap to whole CSS pixels, and the build refuses odd-sized captures.
5. Performance:
   - `site.js` no longer writes attributes on `<html>` or evaluates media queries at startup; motion is set up after `load`.
   - Lighthouse was re-measured in both themes on a shared, busy server: medians 96–99 on phones, 100 on desktop. Each theme downloads only its own images.

**Pass 9** (final, all languages, both themes):
- A test caught two capture bugs:
  - a crop measured before the page had finished rendering;
  - a race where the block page's random quote replaced the pinned one (French, light).
- The capture now waits for the page to finish, pins the quote, waits for the 18:42 tick, and measures and shoots in the same frame. Every dark/light pair now has identical dimensions in all four languages.
- Full pages and 2x first screens were re-shot from the final build, and the full test suite passes (104 tests). Final images are in `screenshots/`:
  - `<lang>-desktop-<dark|light>.png` and `<lang>-mobile-<dark|light>.png`
  - `en-*-first-screen@2x.png`
  - `og-en.png` and `og-all-languages.png`

## 11. Open points for the owner

- New French, Spanish and German strings in `focusfence/scripts/site-strings.mjs` deserve a native proofread, like the rest of the site. They cover the statement, steps, section heads, details, permissions card, pricing notes and the theme toggle labels.
- The German extension UI says "du" while the site says "Sie" (unchanged here; the screenshots show the product as it is).
- When the store listing is live, set `STORE_URL` in `focusfence/scripts/docs.mjs` and run `npm run docs`: the header pill and the green buttons appear automatically.
- If the extension's UI is redesigned (another branch is working on it), run `npm run screenshots:site` and `npm run docs`: every website image, in both themes and all four languages, is re-captured from the real UI.
