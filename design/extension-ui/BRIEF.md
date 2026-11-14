# FocusFence extension UI: brief, system and critique log

Status: **proposal on branch `design/extension-ui`** (PR #4 against `feat/focusfence-v1`). Scope: the toolbar popup, Settings (including the Plan / upgrade screen and the lock screen), the block page and the onboarding tour, in light and dark (following the system).

- **Round 1** restyled the existing layouts. The owner's verdict: a recolour of the same screens.
- **Round 2** started again from the feature list: "the living fence". The three concepts and the choice are in [`CONCEPTS.md`](CONCEPTS.md).
- **Round 3** redrew the fence itself after the owner's verdict on round 2 ("much better overall, but the fence itself is ugly"): four directions, and the lantern. It also made the popup shorter and corrected the onboarding's claim about the free plan.
- **Round 4** followed the owner's own decision: from AI reference renders, they picked an **abstract** fence, a short row of frosted-glass pills with the current site lit ([`CONCEPTS.md`](CONCEPTS.md), round 4). It also fixed two findings logged by the website's branch (the popup's height in French and German, the schedule footer in a 400 px window).
- **Round 5** (this update) is a polish pass after a side-by-side review against the owner's references: chunky pills instead of slender arches, every pill mirrored on a seamless glossy floor, end pills that stay visible in light, a soft and wide halo. Its critique log is in section 7.

This brief describes the system as it now stands.

Nothing about behaviour changes: same features, prices, payments (ExtensionPay), permissions, storage format and i18n semantics. Strings: round 2 added the "Focus" tab label in en, fr, es and de; round 3 corrected the onboarding's sentence on the free plan; round 4 shortened two labels in French and one in German so the popup keeps its height.

## 1. Direction: the living fence, in glass and light

Your blocklist is a fence. Every site you block becomes a **pill**: a wide, soft arch, a rectangle with a full semicircle on top, in frosted glass, chunky like a pebble: the middle pill is 1.6 times as tall as wide, the end pills a little wider than tall. The pills stand in a short, symmetrical row, tallest in the middle and stepping down gently toward the ends (the middle one about 1.7 times as tall as the end ones), never a full-width barcode. A glossy floor mirrors every pill. The pill in the middle **holds the light**: it glows from inside, a halo rises behind it, its neighbours catch the light (green near it, grey-green farther out) and a pool of it lies on the ground. Which site holds the light depends on where you are:
- on the block page, the site you just tried;
- in the popup, the site on this tab when it's on your list, otherwise your newest site;
- in Settings and onboarding, your newest site (in onboarding, your first pick).

The fence's **light is the state**:

| Posture | When | Look |
|---|---|---|
| up | blocking on (always or within the schedule) | lit: a solid saturated green pill with a soft bloom (light), a bright emerald pill with a volumetric halo (dark) |
| focus | focus session running | lit, with a stronger halo; the light rises inside the lit pill as the round goes by |
| paused | outside the schedule | no light, the pills a fifth sunk into the ground |
| down | blocking off | no light, the pills almost half sunk; the initial still shows |
| strict | strict mode | lit amber |
| empty | nothing blocked yet | five outlines, waiting |

Light theme: warm paper (`#F7F8F5`), milky pills in very pale sage, greener toward the light. Dark theme: near-black with a deep green tint at the horizon, fading to pure black at the top; translucent, faintly emissive glass with a brighter rim along each pill's top.

The same object greets you everywhere:
- in the popup, it is the status, readable in two seconds;
- in Settings, it is the hero of the Blocklist;
- on the block page, it is the fence you hit, with your site in the light, on a glossy ground that reflects it;
- in onboarding, you build it: each site you pick rises into one of three outlined slots.

The stats chart's bars are pills too (today's holds the light), and so are the Plan view's fence (amber for the offer, green once you have Pro), the Strict mode gate (amber, with a lock), the block-page miniature in Settings and the small counters (focus rounds, the Free and Pro marks).

Text always says what the fence shows, so the fence is `aria-hidden` and nobody depends on the picture.

What stays from round 1 (the owner liked it): tokens, type, hairlines, the two-tone headline and the calm Pro upsell.

## 2. Information architecture

**Popup (360 px, 448 px tall with a site on the tab in every language; round 2 was 484), top to bottom.** Each part has one job.
1. **Stage:** your fence, a compact row of glass pills on a ground line, the site on this tab (or your newest) in the light. Under it, the state title and summary and the master switch.
2. **This tab:** the site's monogram, host and note, and one full-width primary action, "Block site". A site already on the list shows a confirmed "✓ Blocked"; browser pages show only the note.
3. **Add:** a typed field (Enter adds).
4. **Focus:** one line while idle (what a session does, plus Start). While running, the row becomes the timer, with round pickets and a progress bar, and the stage fence glows.
5. **Footer:** blocked today and this week (counts only, never a time estimate), and All settings.

**Settings.** Nine sections in a sidebar scroll became five destinations in a top bar:

| Destination | Holds | Old links that open it |
|---|---|---|
| Blocklist | the fence, the composer (website / path / keyword), site cards, host access, block-page message with a live miniature | `#blocklist`, `#blockpage` |
| Focus | focus session (big clock), schedule with a week ribbon | `#focus`, `#schedule` |
| Strict mode | strict mode (a locked gate), password lock | `#strict`, `#security` |
| Stats | today and this week, the 7-day picket chart, top sites, backup | `#stats`, `#backup` |
| Plan | plans with prices, features, payments, licence and links, developer panel | `#plan` |

- The on/off switch lives in the bar, because it is global state.
- Free users see a PRO tag on the three Pro tabs. Opening one shows an offer card with the real prices under the page title; the real controls are shown softened and taken out of the keyboard order.
- A single Pro section inside a Free page (the block-page message) gets a slim bar instead.
- Every old section id still works as a link: the router opens the view that holds it, so the popup, onboarding and the tests all deep-link.

**Block page.** A scene, not a dialog:
- a sky, a ground that reflects, and a fence standing on it across the window, fading into haze (light) or darkness (dark) away from the middle;
- the site's picket stands in the middle, taller, lettered and lit from within: it rims its neighbours' facing edges, lights the stretch of rail around it, pools on the ground and shows in its reflection;
- above it, the two-tone headline (the distraction dimmed), the quote or your own note, the focus pill when a session runs, the counts, "Back to work" and "Settings", and the URL in mono.

In light it is dawn: sage pickets, soft as stone, and a jewel-green lantern. In dark it is night: graphite pickets and a lantern of green light, as at the end of the website.

**Onboarding.** A step on the left, a live stage on the right:
1. Three outlined slots wait among the wall's pickets. Each site you pick rises lit into one, and the names show on the ground. The copy says what Free really allows: as many **websites** as you like; paths and keywords need Pro.
2. A normal window and an Incognito one. The second's fence is only an outline until FocusFence is allowed there.
3. The fence with an amber lantern carrying a lock, for Pro.

Below 900 px the stage sits above the step.

## 3. The fence component

**The pill** (`.pill` in `src/styles/base.css`) is one object on every page: a `border-radius` arch with three layers of gradient (the glass, the green it takes on near the light, the light on the side that faces it), an inset rim highlight along its top, a hairline edge, an inner glow and a `backdrop-filter` frost. `.pill.lit` is the light: a vertical gradient (`--lit-0/1/2`), a bright core low in the pill, an inner glow and a bloom (`--lit-bloom`). `.fence-halo` (the halo rising behind it) and `.fence-pool` (its light on the ground) belong to the same row.

**The shape** comes from `FFUI.pillProfile(n)` in `src/lib/ui.js`. For position *p* of *n* (always odd, so the row stays symmetrical), at distance *d* from the middle and with m = (n − 1) / 2:
- height, as a share of the middle pill: `k = 0.575 + 0.425 · cos²(π · d / 2m)`, a gentle bell whose ends are always 0.575 of the middle (about 1.7 times shorter), whatever the count. With the middle pill 1.6 times as tall as wide, the end pills are 0.92 times as tall as wide;
- the light it catches: `t = e^(−d / 1.25)`;
- how much of it shows: 1, then 0.92 for the next-to-last and 0.6 for the last pills (the ends fade to about two thirds of their neighbour, and stay visible glass);
- which side of the light it stands on (`--side`), so the light spills onto the facing side.

Each pill gets these values through the CSSOM (`--k`, `--t0`, `--v0`, `--side`, `--i`), never through markup: the extension's CSP forbids inline style attributes. The decorative rows (the block-page miniature, the Plan's fence and the Strict gate in Settings, the windows in onboarding) are built by `FFUI.pillRow(node, n)` from the same profile.

**The reflection** (`.fence.mirror` in `base.css`) is the same row again, put over the row it mirrors and flipped at the ground line: every pill mirrored faintly as a silhouette in its own tint (glass doesn't mirror as glass), the light brightest, all fading downward. The floor itself has no band and no line.

**The fence** is `FFUI.fence(node, { items, state, lit, min, max, progress, rise })`.
- **Order:** the `lit` entry stands in the middle; the others alternate right and left in list order.
- **Count:** never fewer than `min` pills (spare pills are a little fainter, `.pad`), never more than `max` (5 to 7 in the popup, 5 to 9 in Settings, 5 to 7 on the block page), always odd. Beyond `max`, the words say how many sites are fenced.
- **Postures** come from `data-state`: no light when paused or down, and the pills sink (`--drop`: 0.22 and 0.42 of their height); amber when strict.
- **Diffing:** re-rendering the same entries only changes `data-state` and `--progress`, so posture changes animate, staggered from the middle (30 ms a step). A new entry's pill rises (`.enter`); with `rise`, every pill rises on the first render (the block page).
- **Size:** each page sets `--pw` (pill width) and `--ph` (the middle pill's height, 1.6 × `--pw`); the gap is 9 % of the width. Popup: 37 × 59 px. Settings: 58 × 93 px. Onboarding: 72 × 115 px (five pills).
- **Lapsed Pro:** rules kept after Pro lapses stand in the row without catching any light (`.off`).

**The block page** draws your fence with the same component, twice: the second copy is its reflection in the glossy floor, fading out before the window's edge.
- `layout()` in `blocked.js` sizes it. Pills are about 132 px wide (at most a fifth of the window's height). The row is at most 1000 px wide: when more sites would need a wider row, fewer pills show (7 at most, 5 at least), never thinner ones. Only below about 760 px of width do the pills narrow, keeping their proportions.
- The words come first. They sit in the top half, centred while they fit; otherwise they grow upward, never into the fence. When a long note, a focus session or a short window leaves them too little room, `layout()` measures them and makes the pills smaller instead.
- `layout()` runs again on resize, when the fonts load and when a focus session starts or ends.

## 4. Tokens

The tokens are round 1's, plus the fence's glass and light (round 4, the four rows after `--pro`). They live in `src/styles/base.css`. The older names (`--bg`, `--surface`, `--ink`, `--accent`, `--pro-soft`, …) keep working for the store compositions.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F7F6` | `#0A0C0B` | canvas |
| `--surface` / `-2` / `-3` | `#FFFFFF` / `#F5F6F5` / `#EDEFEE` | `#111413` / `#171A19` / `#1D2120` | cards, hover, pressed |
| `--line` / `-2` / `-3` | `#E5E8E6` / `#D7DBD9` / `#C2C8C5` | white 7 / 11 / 18 % | hairlines and borders |
| `--ink` / `--ink-2` / `--muted` | `#111513` / `#3A423E` / `#5E6763` | `#F1F4F2` / `#C9D0CC` / `#8E9893` | text |
| `--signal` | `#3A9A5B` | `#3A9A5B` | the logo green: icons, dots, progress. Never small text |
| `--accent` / `--accent-solid` | `#287743` | `#6CC58A` / `#5DBE7E` | green text, primary buttons, focus ring |
| `--pro` / `--pro-solid` | `#8A5A0B` / `#D9A13F` | `#D9A74B` | Pro and strict mode |
| `--lit-0` / `-1` / `-2` | `#33A861` / `#1E8A45` / `#17723A` | `#66E396` / `#3FD67A` / `#1E9F55` | the pill that holds the light, top to foot |
| `--light-rgb` | `30 138 69` | `63 214 122` | the light: halo, pool, the tint it gives the glass |
| `--glass-0` / `-1` | white 94 % / `#F3F7F4` 80 % | `#CDF5DE` 10 % / `#78BE96` 3.5 % | the glass, top to foot; `--glass-rim` is its top highlight |
| `--amber-rgb` | `217 161 63` | `230 178 82` | the light in strict mode and on the Pro offer |
| `--danger` / `--warn` | `#B42318` / `#9A5B00` | `#F2766B` / `#E5B567` | errors, warnings |

All text pairs are at least 4.5:1. The switch and icons are at least 3:1. The measured table is in round 1, below.

**Type.** Inter (variable weight and optical size, the website's 73 KB Latin file, bundled), with `cv11` and `ss01`. Display sizes take the display cut automatically.

| Role | Size | Weight |
|---|---|---|
| Block-page headline | 34–64 px | 620 |
| Big clocks | 64 px | 600 |
| Onboarding title | 36 px | 620 |
| Settings page title | 28 px | 620 |
| Settings section title | 18 px | 600 |
| Popup state | 17 px | 620 |
| Body | 13.5–15.5 px | 400 |
| UI | 12.5–14 px | 500–600 |
| Mono label | 11 px | 500 |

Headlines use −0.03 to −0.045em tracking.

**Radius:** 6 for segments, 8 for buttons and inputs, 10 for chips, 12 for cards, 16 for the composer and dialogs, 24 for the onboarding stage.

## 5. Motion and micro-interactions

Every motion runs once per change, nothing loops, and `prefers-reduced-motion` turns all of it off.

- The light breathes in once wherever a fence appears: the halo fades and swells into place over 1.8 s.
- The fence rises when blocking turns on and sinks when it turns off, staggered from the middle.
- A new site's pill rises in the popup and in Settings.
- On the block page, the fence and its reflection rise from the ground, then the light breathes in and the copy fades up.
- In onboarding, each picked site rises into its slot.
- The schedule's week ribbon redraws as you toggle days and times, before you save.
- The block-page miniature shows your note as you type.
- The idle focus clock follows the length and rounds fields.
- Switching Settings views fades in. A tab click moves focus to the view's title, for screen readers.

## 6. Accessibility

- **axe (WCAG 2.1 A/AA)** passes on:
  - the popup, Free and Pro;
  - all five Settings views, Free and Pro;
  - the block page and the lock screen;
  - every onboarding step;
  
  in light and dark.
- `tests/a11y.spec.mjs` now walks every Settings view: with one view at a time, it would otherwise only audit the first.
- **Keyboard:**
  - every control is reachable;
  - locked Pro controls are `inert`;
  - the lock screen traps focus;
  - focus rings are 2 px green with a 2 px offset.
- Tabs use `aria-current="page"`. Every fence (with its reflection), the stage, the week ribbon and the miniature are `aria-hidden`; the surrounding text says the same in words.
- No inline styles: the CSP (`style-src 'self'`) stays strict. Per-pill values are set through the CSSOM, and the static rows take theirs from CSS.
- Reduced motion: no rise, no breathing light, no fade. Every fence appears in its final posture.
- Windows high contrast: the switch is drawn with system colours.
- Text never clips:
  - the onboarding field gets the full width below 560 px;
  - placeholders were shortened to fit 390 px in en, fr, es and de;
  - typed sites fit;
  - the block page's words keep their room above the fence at any window size (the fence shrinks instead);
  - Settings fit a 400 px window in every language: card footers and the backup buttons wrap.

## 7. Critique log

### Round 5: closer to the references

A side-by-side review of round 4 against the owner's reference renders asked for four changes. Each was measured on the block page (1280 × 800, 1366 × 600, 1280 × 540, 1024 × 640, 900 × 700, 420 × 800, 1920 × 1080; 1, 9 and 11 sites; with a focus session and a three-line note), then checked on every surface in both themes.

1. **Proportions.** Round 4's pills were slender arches (the ends 1:1.45, the middle 1:2.7) and read as tall windows. The middle pill is now 1.6 times as tall as wide and the ends 0.92, with a gentler step (the middle is 1.74 times the ends, for any count). Pills are 38 % wider on the block page (132 px; seven make a 995 px row), and 42 to 64 % wider elsewhere (popup 37 px, Settings 58 px, onboarding 72 px). To stay within 1000 px, the block page shows fewer pills rather than thinner ones: 7 at most, 5 in windows under about 1050 px. The popup shows up to 7, Settings up to 9, onboarding 5.
2. **Floor.** The dark block page had a hard floor band with almost no reflection, and the light one a flat grey band with only the middle pill mirrored. The floor is now seamless (no band, no line), and every pill is mirrored as a faint silhouette in its own tint, fading downward, with the light brightest and its pool under the middle. The same reflection was added to onboarding's card, and the ground lines in the popup, Settings and the decorative rows were softened.
3. **Light falloff.** The end pills had faded to almost nothing in light. They now show at 0.6 (about two thirds of their neighbour), the light-theme glass is a milkier sage with a visible rim and edge, and spare pills are only a little fainter (× 0.85 instead of × 0.55).
4. **Dark halo.** It is wider and taller (2.05 × the middle pill's height) and softer, and the light spills further onto the facing sides of the neighbours.

Also: the decorative rows (miniature, Plan, Strict gate, onboarding's windows) are now built from the shared profile instead of numbers copied into CSS; and in step 3 of onboarding, the Pro pill stands at the end of the row, so it opts out of the end fade.

### Round 4: glass pills

Each pass captured every state × 2 themes (`npm run design:shots`), the block page at 1280 × 800, 1366 × 600, 1280 × 540, 1024 × 640, 900 × 700, 420 × 800 and 1920 × 1080 with 1, 9 and 11 sites, a focus session and a three-line note, and the popup and Settings in en, fr, es and de at 400 px.

**Pass 1** (first build):
1. The halo's tall column of light read as a grey-green stain on paper, as the round 2 glow did. In light it is now a soft bloom around the lit pill (1.3 × its height); dark keeps the volumetric column (1.65 ×).
2. In the popup, the stage clipped the halo into a hard-edged rectangle. The light now stays inside the stage and fades out before its edge.
3. On the block page, the halo climbed behind the counts. It now fades out below the URL, so the top half is left to the words.

**Pass 2:**
1. With a focus session, the block page's copy was taller than its space. Centred, it overflowed both ways and the URL slid behind the tallest pill. The copy is now centred while it fits and grows upward when it doesn't (two flexible spacers, aligned to the bottom).
2. In short windows it then left the screen at the top (93 px at 1280 × 540 with a note and a session). `fit()` now measures the copy and caps the pill width, so the fence gets smaller instead. The headline also scales with the window's height.
3. Growing upward made the URL collapse to zero height: a flex item that clips its overflow has no automatic minimum height. The copy no longer shrinks; only the spacers do.
4. With 11 sites, the row would have run the window's width. Pills now narrow as sites are added, and the row is at most 1000 px wide.

**Pass 3:**
1. The small counters still had pointed tops: the focus rounds in the popup and in Settings, and the Free and Pro marks in onboarding. They are small pills now.
2. The Strict mode gate had kept round 2's flat pickets and rails. It is now five pills in amber light, the middle one carrying a lock; the lock is shared with onboarding's Pro pill.

**Findings from the website's branch** (`design/landing-v2`, round 4):
1. The French popup was 511 px tall: its focus row wrapped beside "Lancer la concentration", and the footer wrapped in French and German (461 px). The French button is now "Démarrer" and the footer link "Réglages →" (German "Einstellungen →"). The idle popup is 448 px in all four languages.
2. In a 400 px window, the schedule's footer overflowed in French and German (the save button by 34 and 10 px). Card footers now wrap, the main button staying on the right. The same check found the backup buttons overflowing in French and German (by 17 and 66 px); they wrap too. Nothing in Settings overflows a 400 px window in any language now.

### Round 3: the fence

Each pass captured every state × 2 themes (`npm run design:shots`), plus the fence at 1, 3, 10 and 25 sites in the popup and Settings, the block page at 1280 × 800, 1366 × 600, 1280 × 540, 900 × 700 and 420 px wide, and 2x detail crops.

**Explorations** (four directions, two passes, two light studies): see `CONCEPTS.md`, round 3.

**Pass 1** (first build of the lantern):
1. `-webkit-box-reflect` drew nothing on the masked wall, so the reflection is a second, flipped wall.
2. The wall's box was wider than the window, so its edge mask faded mostly off-screen. The wall is now as wide as the window, and the pickets overflow it evenly.
3. Lowered fences: the rails stayed up while the pickets sank. Rails and pickets now sink by the same share of the fence's height.
4. The popup's facets were too contrasted at 16 px (pencils). Facets and shade were softened for small pickets.

**Pass 2:**
1. The empty fence (ghost pickets) looked like white pickets again. Empty slots became outlines.
2. Lapsed rules looked lit: a custom property that referenced itself (`--pk-0: color-mix(… var(--pk-0) …)`) is invalid at computed time and silently inherited the lit green. They now use the unlit tokens.
3. "+N" sat on the rails, so it looked like part of the fence. It now hangs beside the fence.
4. The CSP review test caught inline `style` attributes in the miniature and the plan fence, and in the reflection built with `innerHTML`. Both are now CSSOM or CSS.

**Pass 3:**
1. In light, the wall still read as a long repeat to the window's edges. A stronger falloff and a wider edge fade make it dissolve into the haze around the lantern.
2. Captures waited for a fixed time and caught the wall mid-rise. The design captures, the store script and the axe test now wait for animations to settle. The axe test had been auditing the block page's copy while it was still fading in, and failed on the focus pill at 4.12:1 depending on timing; the settled colours meet 4.5:1.
3. Short windows (1280 × 540, 1366 × 600) keep the message clear of the fence.

### Round 2

Each pass captures 39 states × 2 themes (`npm run design:shots`), plus German and French spot checks.

**Pass 1** (first build of concept A):
1. In onboarding, the side-fade mask on the fence clipped the picked sites' names. The names moved under the ground, outside the mask.
2. The empty blocklist showed two fences: the hero's empty slots and an illustration. The illustration went.
3. The Focus page had no hero before a session starts. A big idle clock with one picket per round now follows the fields.
4. The block page's mask also clipped the lit picket's tip. The wall box is now 44 px taller than the fence.
5. In light, the Blocklist hero's glow sat to the right of a left-aligned fence and read as a smudge. On white the light is now a faint wash at the foot of the fence; dark keeps a pool of light behind it.
6. The capture scripts scrolled to sections that now live in other views. They navigate by link instead: the design captures, the store screenshots, and the a11y and two other tests.

**Pass 2:**
1. In dark, the hero clipped its own glow into a rectangle. The hero no longer clips; the fence row does.
2. Chrome re-applies its own fragment jump after load, so a routed view could sit 20 px down. The first section of each view now has a scroll margin larger than its offset, so a jump to it always lands on 0.
3. In German, the bar overflowed at 1280 px ("Tarif" ran into the plan chip). The bar now uses the full width and shows "Pro ansehen" or the PRO badge, never both.

**Pass 3:**
1. The stats chart's `.bar` class collided with the new top bar's `.bar`, which became a centred flex column. The bar is now `.topbar`.
2. Dead styles were removed (the old empty-state illustration, label rows).
3. Rechecked:
   - the block page at 420 px;
   - onboarding at 390 px with a typed site;
   - Settings at 760 px (the bar wraps, tabs on a second row);
   - the German bar;
   - lapsed Pro, no host access, strict mode on.

No structural issues left.

**Owner review fixes** (also in round 1's last commit, kept here):
- the onboarding field at 390 px: full width, shorter placeholders, typed text checked;
- "m.reddit.com ." in the Blocklist helper and the strict-mode limits: inline code no longer has a chip, so its padding no longer reads as a space before the period, in every language.

## 8. Results

Round 5:
- **Tests:** 101 passed (`npm test`, the full suite).
- **Final screenshots:** `design/extension-ui/screenshots/` (`npm run design:shots`), every state in light and dark.
- **Store assets, website, zip:** regenerated (`npm run screenshots:all`, `npm run docs`, `npm run build`).

Round 4:
- **Tests:** 101 passed (`npm test`, the full suite).
- **Final screenshots:** `design/extension-ui/screenshots/` (`npm run design:shots`). The round 3 lantern explorations stay in `screenshots/fence-explorations/` for the record.
- **Store assets:** `npm run screenshots:all` regenerated the screenshots in en, fr, es and de, and `npm run docs` refreshed the website's copies.
- **Zip:** `npm run build` rebuilt `dist/focusfence-1.0.0.zip`. `manifest.json`, `background.js`, `config.js` and `vendor/ExtPay.js` are unchanged; `_locales` changed `startFocus` (fr) and `allSettings` (fr, de).

Round 3:
- **Tests:** 101 passed (`npm test`, the full suite). Two test helpers changed:
  - the axe test waits for animations to settle before auditing;
  - the store script waits for the block page's scene to settle.
- **Final screenshots:** `design/extension-ui/screenshots/` (`npm run design:shots`); the explorations are in `screenshots/fence-explorations/`.
- **Store assets:** `npm run screenshots:all` regenerated the screenshots in en, fr, es and de, and `npm run docs` refreshed the website's copies; the promo tile is unchanged.
- **Zip:** `npm run build` rebuilt `dist/focusfence-1.0.0.zip`. `manifest.json`, `background.js`, `config.js` and `vendor/ExtPay.js` are unchanged; `_locales` changed only `ob1Text`.

Round 2:
- **Tests:** 101 passed. Three tests changed with the markup:
  - the Pro-gating test clicks the Plan tab;
  - the offline-license test opens `#plan`;
  - the axe test audits every view.
- **Final screenshots:** `design/extension-ui/screenshots/` (`npm run design:shots`). Popups are at 2x, pages at 1x, in light and dark.
- **Concept boards:** `design/extension-ui/concepts/`.
- **Store assets:**
  - `npm run screenshots:all` regenerated the five screenshots and the promo tile in en, fr, es and de;
  - the store script opens Settings views by link;
  - `npm run docs` refreshed the website's copies.
- **Zip:** `npm run build` rebuilt `dist/focusfence-1.0.0.zip`. `manifest.json`, `background.js`, `config.js` and `vendor/ExtPay.js` are unchanged; `_locales` gained the "Focus" tab label.

## 9. Open points for the owner

- Round 4's shorter labels deserve a native proofread: fr "Démarrer" (start focus) and "Réglages →", de "Einstellungen →".
- The website (`design/landing-v2`) shows the round 3 lantern; its BRIEF plans to re-sync its captures and closing scene to these pills once this round lands.

- The store's promo tile (`scripts/screenshots.mjs`) still draws its own faint repeating fence. It could adopt the glass pills in a later pass.
- The new onboarding sentence ("Later, add as many websites as you like on the free plan; paths and keywords need Pro.") deserves a native proofread in fr, es and de.

- PR #3's `--site` captures scroll to `#stats`, `#schedule .card` and `#strict-on` with `scrollIntoView`. With one Settings view at a time, they need `location.hash = '#stats'` (or `#focus`, `#strict`) first. After both PRs merge:
  - re-run `npm run screenshots:site`;
  - set the site's `--screen` token to `#0A0C0B`.
- The new "Focus" tab label (fr "Concentration", es "Concentración", de "Fokus") deserves a native proofread, like the rest.

---

## Round 1 (history)

What round 1 found in the original UI (pass 0):
- **Popup:** card soup; two stacked amber blocks in strict mode; a fake idle timer; noisy letter avatars; a washed-out disabled button.
- **Settings:** a warm-beige palette unrelated to the brand; Pro sections greyed out under floating cards; seven PRO pills; a chunky chart; link-buttons underlined on hover.
- **Block page:** muddy gradients and a barcode-like fence; the distraction in brand green.
- **Onboarding:** a generic card.

Round 1 built the token system above (measured contrast below), the components (buttons, inputs, a 3:1 switch, badges, notices, segmented control, monograms), the optical-size font, and four critique passes (status class collision, fake timer, light-mode glow as a stain, chunked summaries, calm Pro gates, toast centring, drawn chevron, disabled ghost buttons, optical badge centring, forced colours, timer captures at the exact tick, a store-caption class collision).

| Pair (WCAG 2.1) | Light | Dark |
|---|---|---|
| ink on surface | 18.4 | 16.7 |
| muted on surface / canvas / track | 5.8 / 5.4 / 5.1 | 6.2 / 6.6 / 5.7 |
| accent text on surface / canvas | 5.5 / 5.1 | 8.8 / 9.3 |
| primary button text | 5.5 | 8.3 |
| pro text on pro-soft | 5.2 | 7.5 |
| upgrade button text | 8.0 | 8.5 |
| danger on surface | 6.6 | 6.7 |
| switch track (off) vs surface, knob vs track | 3.3 / 3.3 | 3.2 / 5.8 |
| faint icons vs surface | 3.2 | 3.3 |
