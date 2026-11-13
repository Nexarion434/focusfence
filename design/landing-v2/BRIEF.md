# FocusFence landing page v2: brief, decisions and critique log

Status: **proposal on branch `design/landing-v2`** (PR #3 against `feat/focusfence-v1`, to be retargeted to `main`). Nothing outside the website was changed, apart from an opt-in `--site` mode in the screenshot script (the extension's own styles are untouched).

Round 2 (owner feedback on PR #3) added:
- a light theme that follows the system, with a light / dark / system toggle in the header;
- a richer hero that explains the product at a glance.

Round 3 (design review) fitted the hero into the first screen and showed every product image whole on phones.

Round 4 follows the approved extension redesign (PR #4, `design/extension-ui` at `b51d0c3`): the fence is now drawn as **lanterns**. Every product image is re-captured from that UI, the page closes on its block-page scene, and the copy says what the free plan really allows. See sections 2, 6, 7 and 10.

**Round 4 is in progress.** PR #4's own round 4 redraws the fence again (frosted-glass pills). This branch follows PR #4's round 3 lantern for now. The hero images and the closing fence will be re-synced to PR #4's round 4 once it is done. The copy, the capture pipeline (`--src`), the phone captures and the tests carry over unchanged.

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

- **The lantern fence** (round 4, from the extension). One picket per site, drawn with the logo's 45° tip, lettered and lit from within. The page uses the extension's own fence and nothing else:
  - in the product images;
  - in front of each kicker, the extension's 8×13 picket ornament (as on its focus-round counters);
  - at the end of the page, the extension's block-page scene: a wall of pickets on a reflecting ground, with one lantern lit in the middle (graphite at night, sage at dawn).
- **Dimmed distractions.** In two-tone headings the distracting thing is set in the muted grey.
- **One moment, told everywhere.** The hero's popup, Settings and block page show the same six sites and the same counts after the block-page visit (5 blocked today, 89 this week), and so do the stats further down. The focus card shows a session at exactly 18:42.

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

Light-theme details: cards are white with a hairline and a 1 px shadow instead of translucent white; windows get soft ink shadows instead of black ones.

**The lantern fence** (round 4) brings the extension's own picket tokens, unchanged:

| Token | Dark (night) | Light (dawn) | Use |
|---|---|---|---|
| `--wall-0` / `-1` / `-2` | `#232927` / `#151A18` / `#0B0E0D` (graphite) | `#C3D1C8` / `#D0DBD4` / `#E2E9E4` (sage) | the wall's pickets, top to foot |
| `--lit-0` / `-1` / `-2` | `#C4F4D4` / `#5CC583` / `#2C7C48` | `#52B678` / `#3A9A5B` / `#2A7845` | the lantern (the middle stop is the logo green) |
| `--rail` | `#0F1412` | `#D2DDD6` | rails, lit near the lantern |
| `--pool`, `--refl` | green at 50 %, reflection 30 % | green at 24 %, reflection 16 % | the light on the ground and the wall's reflection |

Only the sky and the ground are tuned to the page. The section starts on the page's own background and ends on the extension's ground colours, warmed slightly in light to sit on the paper.

### Theme switching, without a flash

- **Before the first paint**, an inline script in `<head>` reads `ff-theme` from `localStorage`. It sets `data-theme` (light or dark; nothing for System) and the `theme-color` metas before the styles are parsed. CSS applies the light tokens either under `prefers-color-scheme: light` (System) or under `[data-theme='light']`.
- **The toggle** is a native radio group (sun, moon, monitor), so arrow keys work. Its selected state comes from a `data-theme-pref` attribute set by the same script, so it is right from the first paint. Without JavaScript it is hidden, and the page simply follows the system.
- **Images:** every product image exists twice, one per theme. CSS shows the matching one, and every image is lazy, so the hidden theme is never downloaded. The head script preloads the hero image of the resolved theme.
- **A switch:** the script first fetches the new theme's on-screen captures (up to 450 ms), then cross-fades with the View Transitions API (skipped under reduced motion). The choice also syncs across open tabs.

## 4. Type scale

Inter (opsz 14–32, wght 100–900), `font-optical-sizing: auto`, features `cv11` and `ss01` (as in the extension). Mono is the system stack, used only for short labels, so no second font is downloaded.

| Role | Size (360 → 1440 px) | Weight | Tracking | Line height |
|---|---|---|---|---|
| Display (h1) | 40 → 64 px | 620 | −0.045em | 0.98 |
| Closing line | 38 → 72 px | 620 | −0.045em | 1.0 |
| Section (h2) | 32 → 48 px | 600 | −0.038em | 1.04 |
| Statement | 26 → 40 px | 560 | −0.03em | 1.16 |
| Card title (h3) | 17 px | 590 | −0.014em | 1.35 |
| Lead | 16 → 18 px | 400 | −0.012em | 1.55 |
| Body | 15–16 px | 400 | −0.006em | 1.6 |
| Nav, small | 13.5 px | 500 | 0 | |
| Mono kicker | 12 px, uppercase | 500 | +0.1em | 1 |

`text-wrap: balance` on headings and `pretty` on the lead and statement avoid orphans in all four languages.

## 5. Layout

- Content 1200 px; product windows up to 1280 px; prose 700 px. Gutters `clamp(20px, 4vw, 40px)`.
- Radii 8 (controls), 14 (tables), 18 (windows, cards). Pills for buttons and badges.
- Breakpoints: 1024 (two-column heads and grids stack, bento cards go full width), 860 (steps and plans stack), 720 (section links move to the footer; the hero cluster is recomposed for phones; phones get captures made for them, and every product image is shown whole), 480 (full-width buttons, smaller fence), 400 (tighter buttons). Checked at 360, 390, 768, 1024, 1280 and 1440 px: no horizontal scroll.
- The hero cluster is sized in em, so it scales as one picture: 1em is 16 px when the cluster is 1280 px wide (or 350 px on phones). On desktop it also shrinks on short screens, so all three surfaces stay in the first screen on laptops (for example 1280×800, 1366×768 and 1536×864).

## 6. Page plan (as built)

1. **Header:** logo and wordmark; Features, Pricing, Blog, Privacy; mono EN/FR/ES/DE switcher; "Add to Chrome" pill once `STORE_URL` is set. Translucent, blurred, hairline after scrolling.
2. **Hero:** kicker pill, two-tone H1 on one line in every language at 1440 px, then a split row with the lead on the left and the actions plus three ticks on the right. Until the store link exists, the primary action is an honest status ("Coming soon to the Chrome Web Store", a dot that pings three times), not a dead button.

   Below it, the product in one look, all inside the first screen at 1440×900 and 390×844 (a test checks it in every language). Each window's tab title comes from the extension's own strings.
   - **What you control:** the real Settings window (1280×740), on its Blocklist: the top bar with five destinations, your fence of six lit pickets (R, Y, X, F, N, #), the composer and the site cards.
   - **One click:** the real popup, as the extension shows it idle with Pro: its lit fence, "Blocking is on", the full-width Block site button, the focus row and the counts. It hangs from the toolbar icon, whole, at its real height (448 px in English).
   - **What you get instead:** the real block page in a 720×600 window, to the right: "reddit.com is fenced off", the quote, today's counts, and the wall with reddit.com's lantern. It slips under the popup's edge, in the page's empty margin.

   On phones, the settings window runs off the right edge behind the other two; the popup sits on the right and the block page on the left, side by side, both whole.
3. **Statement + three steps** (from onboarding): pick up to three sites, allow the block page, get back to work.
4. **Block** (`#features`): the full block page in a browser window (1280×800, the whole scene down to its reflecting ground), then the two block features. On phones the window shows the same page in a 400 px window, whole.
5. **Focus:** bento of three cards with real UI crops: the schedule with its week ribbon, the popup's focus row at 18:42 (round pickets and progress), and strict mode as the popup shows it (the fence turns amber, the switch locks).
6. **Stats:** the real stats panel, large (the 7-day chart drawn as pickets, today's lit), then a hairline grid of six smaller real features (password lock, own block-page message, export/import, light and dark, four languages, incognito check). On phones, the panel comes from the extension's own narrow layout, shown whole.
7. **Privacy:** two-tone statement, three points, and a mono card listing what FocusFence actually asks Chrome for, plus the single network exception (ExtensionPay, only after upgrading).
8. **Pricing:** Free / Pro monthly / Pro yearly (lit card, "Save 44%"), localized prices, how to upgrade, payment note. The yearly card ends with "One year of Pro": two quiet bars, 12 × Pro monthly ($35.88) against Pro yearly ($19.99), computed from the prices and written like each language's own prices (a test checks the arithmetic).
9. **FAQ:** heading and contact line left (sticky on desktop), accordion right.
10. **Closing:** logo in its light, "Get your focus back.", the action, then the extension's block-page scene: a wall of pickets on a reflecting ground, the lantern lit in the middle, its light on the rails, its neighbours and the ground. It rises in a wave from the lantern when it comes into view (section 8).
11. **Footer:** brand line, Product / Resources / Contact (contact@focusfence.dev), license and trademark notes.

## 7. Product imagery

`npm run screenshots:site` (new `--site` mode of the existing `scripts/screenshots.mjs`) drives the real extension with the same seeded data as the store shots and writes `screenshots/site/<lang>/`. Round 4 captures the redesigned UI (PR #4 at `b51d0c3`) through `--src <its focusfence/src>`, because that UI is not merged into this branch yet. Once it is, `npm run screenshots:site` gives the same images from `src/`.

- 2x captures in **both themes** (`name.webp` and `name-light.webp`), encoded to WebP by Chromium's own canvas encoder (no image tooling needed).
  - Hero: the Blocklist in a 1280×740 window (1x and 2x for `srcset`), the idle popup, and the block page in a 720×600 window.
  - Sections: the block page at 1280×800 (1x and 2x), the stats, the schedule, the popup's focus row and its strict-mode stage.
  - The largest files (the 2x settings windows) weigh 79–95 KB.
- **As the extension shows itself.** The block page and the popup are captured without a focus session, as in the extension's own screens. Captures wait for every animation to settle, since the fences rise and light up once.
- **One visit.** The block page is captured once at 1280×800, then resized to 720×600 and 400×720. A resize is not a new visit, so the counts stay 5 and 89.
- **Phones** get the extension's own narrow layouts, served by `<picture>` below 720 px, still one per theme and lazy:
  - the block page at 400 px;
  - the stats at 400 px;
  - the schedule at the narrowest window where the whole card fits: 400 px in English and Spanish, 440 px in German, 480 px in French, whose save buttons need the room.
- **Schedule.** It is switched on for its picture, so its week ribbon is green. Its "active / paused now" note depends on the clock at capture time, so it is hidden, like the Incognito warning.
- **Popup height.** The popup is captured at its real height, 448 px in English and Spanish. It is 461 px in German and 511 px in French, where the focus row and the footer wrap; the hero leaves room for that.
- **Focus timer.** It is captured at exactly 18:42; the script waits for that tick.
- **Open Graph.** `og.png` (1200×630) per language is composed from the same captures: logo, localized kicker and two-tone headline (auto-fitted, clear of the popup), ticks, the 720×600 block page and the popup.

## 8. Motion

Subtle and optional; nothing is hidden without JavaScript, and `prefers-reduced-motion` turns all of it off.

- Blocks below the fold rise 16 px and fade in once (IntersectionObserver, 0.7 s ease-out). The observer starts after `load` and never reads layout, so it costs nothing on the critical path. The hero never animates (it holds the LCP).
- A soft light follows the pointer across cards and plans (fine pointers only).
- FAQ answers open with a height transition where the browser supports it.
- No endless animation: the status dot pings three times and rests.
- The closing wall rises once, the first time it comes into view: in a wave from the lantern (24 ms per picket, the extension's spring curve), then the lantern and its pool of light fade in. It uses the extension's timings and only animates `transform` and `opacity`. Without the script, or with reduced motion, it simply stands.

## 9. Quality bar (measured)

- **Lighthouse** (v12.6, local static server with gzip). The server is shared with other agents and often saturated (6 cores, load average 3–6), so the figures are medians of three runs, with their range. These were re-measured for round 3, at a load average of 2.7–4.3:

  | Page | Perf, phone (median, range) | Perf, desktop | A11y | Best practices | SEO |
  |---|---|---|---|---|---|
  | `/` dark | 98 (98–99) | 100 | 100 | 100 | 100 |
  | `/` light | 96 (95–98) | 100 | 100 | 100 | 100 |
  | `/fr/` `/es/` `/de/`, both themes | 98–99 (92–99) | 100 (`/de/`) | 100 | 100 | 100 |
  | `/privacy.html`, both themes | 100 (99–100) | 100 (round 2) | 100 | 100 | 100 |
  | `/blog/*` (round 2) | 100 | 100 | 100 | 100 | 66: drafts carry `noindex` by design until published |

  On phones, LCP is 2.0–2.4 s on the landing pages (1.4 s on privacy) and CLS is 0. Only TBT moves with the server's load; runs at a load average of 6 dropped to 78–95. The A/B check in pass 12 shows this build costs the same as round 2. A visitor downloads only their theme's images.
- **Accessibility:** axe (WCAG 2 A/AA) passes on every page in **both themes** at 1280 px, with no horizontal scroll at 1280, 390 and 360 px (`tests/docs.spec.mjs`). The pricing bars are decorative (`aria-hidden`); their figures are plain text. Also covered:
  - skip link, landmarks and labelled navs;
  - focus-visible rings, including on the theme toggle, which is a native radio group;
  - real `<details>` for the FAQ;
  - alt text on every product image (the hidden theme's image is `display: none`, so it is never announced twice).
- **Weight:** about 190–210 KB before scrolling on a phone. That covers HTML with inline CSS (17 KB gzipped), the font (73 KB), and the three hero captures: settings 33–38 KB at 1x, popup 33–39 KB and block-page card 31–37 KB. On phones the Block section reuses that card. All of a language's product images in one theme come to 350–380 KB (dark) or 376–406 KB (light) on disk, desktop and phone variants included. A visitor fetches one theme, and one variant of each image.

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

### Round 3: design review (first screen, phone crops, pricing)

**Pass 10** (the review's findings, confirmed on the round 2 build):
1. At 390 px, the Stats frame cut the right-hand metric ("89 this week" sliced at the edge), in every language and both themes.
2. The same crop-and-fade pattern had two more victims on phones:
   - the Block section's block page, cut in half, through its own "89 this week";
   - the end of the strict-mode sentence and the schedule's buttons.
3. The hero did not fit the first screen. At 1440×900 the popup was cut through its timer, and the block-page card was entirely below the fold. At 390×844 only a sliver of Settings showed.
4. The yearly plan had two bullets and looked sparse next to Free and Monthly.

Fixes:
- **Phones get captures made for them**, served by `<picture>` below 720 px:
  - the stats panel in the extension's own narrow layout (its summary cards stack);
  - the block page's card.
- **Every product image is shown whole on phones**; the crop-and-fade rules are gone.
- **Hero:**
  - the H1 is 64 px instead of 80, with tighter spacing;
  - the cluster is sized in em, so it scales as one picture;
  - Settings is a 1280×700 window (every section and the whole blocklist);
  - the popup hangs whole from the toolbar icon;
  - the block page's card stands on the right;
  - on phones, the popup and the card sit side by side in front of the settings window.
- **The block-page card is cropped to its content with even margins** (498 px wide in English instead of 768), so it reads at small sizes.
- **Pricing:** the yearly card ends with "One year of Pro", two quiet bars: 12 × Pro monthly against Pro yearly, computed from the real prices.
- **Three new tests:**
  - all three hero surfaces in the first screen, at 1440×900 and 390×844, in every language;
  - nothing clipped at 390 px, with the phone captures in use, in every language and both themes;
  - the pricing arithmetic.
  - The first two were checked against the old rules: both fail on them.

**Pass 11** (all languages, both themes, more sizes):
1. The card's headline touched the popup's edge. The card now slips under the popup by less than its own margin (13 px clear), and the cluster is centred.
2. On phones the popup covered the "Blocklist" heading; it moved down one line.
3. On phones the status pill had shrunk to its text once "See features" was hidden; it is full width again below 480 px.
4. At 1024×768 the stacked copy pushed the card below the fold; the cluster's height budget now accounts for it (`--above`).
5. The phone stats capture first came out cut on the right: the settings page needs 648 px, and a 640 px window scrolled sideways. The capture now picks the narrowest window with no sideways scroll (684 px in English, 760 px in the other languages).
6. Checked sizes:
   - The whole cluster fits the first screen at 721×900, 768×1024, 1024×768, 1280×800, 1366×768, 1536×864, 1920×1080 and 390×844 (all four languages at 390×844 and 1440×900).
   - It does not fully fit on short phones (360×740), where the card's lower edge falls below the fold.

**Pass 12** (final, all languages, both themes):
- Full pages and 2x first screens were re-shot from the final build: `<lang>-desktop-<dark|light>.png`, `<lang>-mobile-<dark|light>.png` and `en-*-first-screen@2x.png` in `screenshots/`.
- The full test suite passes (107 tests).
- The two heaviest browser tests are marked slow: axe across 40 page loads took 58 s against the default 60 s on this busy server.
- Lighthouse was re-measured (section 9). One run of the English page scored 92 on a phone, with 215–333 ms of TBT, while the server's load average was 6 on 6 cores. Two checks on the same server, interleaved with the round 2 build, showed no regression:
  - Main-thread work without throttling: layout 31.5 vs 32.4 ms, style 10.6 vs 10.8 ms, script 7.5 vs 7.5 ms (medians of six).
  - Lighthouse, phone, dark, four runs each: round 2 scored 97, 99, 99, 99; this build scored 99, 99, 99, 99, with lower TBT.

### Round 4: the redesigned extension UI (in progress)

**Pass 13** (synced to PR #4 round 3, the lantern):
- Every product image was re-captured from PR #4's source at `b51d0c3`, through the new `--src` option, in both themes and all four languages.
- **Hero.** It shows the idle Pro popup (448 px tall in English), the Blocklist with its lit fence, and the block page in a 720×600 window. All three stay inside the first screen at 1440×900 and 390×844 in every language (tested).
- **Closing fence.** It became the extension's block-page scene, ported from its CSS. The kicker glyph took the extension's 8×13 picket geometry.
- **Copy.** The free plan "blocks as many websites as you like; paths and keywords need Pro", as in the extension's corrected onboarding, in all four languages.
- **Found and fixed:**
  - The Open Graph window cut the new, wider block page. It now uses the 720×600 capture, and the headline column clears the popup in every language; Spanish had run under it.
  - At a 400 px window, the extension's schedule footer overflows in French and German, so its save button was cut. Phone captures now use the narrowest window where the whole card fits.
  - The Block section's bottom fade hid the reflecting ground; it is gone.
  - Performance: the first scene had 61 pickets per wall, which cost about 16 ms of style and 17 ms of layout on load (unthrottled), below the fold or not. It now has 33. An interleaved Lighthouse A/B with and without the scene shows no difference (96 / 96 and 98 / 98 on phones).
- **Findings for PR #4:**
  - The French popup is 511 px tall, not 448, because its focus row wraps beside "Lancer la concentration". Its footer also wraps in French and German.
  - The schedule footer overflows a 400 px window in French and German.

## 11. Open points for the owner

- New French, Spanish and German strings in `focusfence/scripts/site-strings.mjs` deserve a native proofread, like the rest of the site. They cover the statement, steps, section heads, details, permissions card, pricing notes, the theme toggle labels and the "One year of Pro" caption.
- The German extension UI says "du" while the site says "Sie" (unchanged here; the screenshots show the product as it is).
- When the store listing is live, set `STORE_URL` in `focusfence/scripts/docs.mjs` and run `npm run docs`: the header pill and the green buttons appear automatically.
- If the extension's UI is redesigned (another branch is working on it), run `npm run screenshots:site` and `npm run docs`: every website image, in both themes and all four languages, is re-captured from the real UI.
