# FocusFence extension UI: brief, system and critique log

Status: **proposal on branch `design/extension-ui`** (PR #4 against `feat/focusfence-v1`). Scope: the toolbar popup, Settings (including the Plan / upgrade screen and the lock screen), the block page and the onboarding tour, in light and dark (following the system).

- **Round 1** restyled the existing layouts. The owner's verdict: a recolour of the same screens.
- **Round 2** started again from the feature list: "the living fence". The three concepts and the choice are in [`CONCEPTS.md`](CONCEPTS.md).
- **Round 3** (this update) redraws the fence itself, after the owner's verdict on round 2: "much better overall, but the fence itself is ugly". Four directions were explored; the lantern was chosen ([`CONCEPTS.md`](CONCEPTS.md), round 3). The round also makes the popup shorter and corrects the onboarding's claim about the free plan. Its critique log is in section 7.

This brief describes the system as it now stands.

Nothing about behaviour changes: same features, prices, payments (ExtensionPay), permissions, storage format and i18n semantics. One string was added, the "Focus" tab label in en, fr, es and de.

## 1. Direction: the living fence, made of light

Your blocklist is a fence. Every site you block becomes a picket, drawn with the logo's 45° tip (it rises half the picket's width) and the site's initial. The pickets are **lanterns**: while they stand guard they hold the light, and the fence's **posture and light are the state**:

| Posture | When | Look |
|---|---|---|
| up | blocking on (always or within the schedule) | standing and lit: jewel green with white initials in light, blades of light with a halo in dark |
| focus | focus session running | lit, with a stronger halo; the lower rail fills as the round goes by |
| paused | outside the schedule | a third sunk into the ground, a muted green |
| down | blocking off | unlit (sage in light, graphite in dark) and half sunk; the initials still show |
| strict | strict mode | lit amber |
| empty | nothing blocked yet | three or five outlined slots, open at the ground |

The same object greets you everywhere:
- in the popup, it is the status, readable in two seconds;
- in Settings, it is the hero of the Blocklist;
- on the block page, it is the wall you hit, and your site's picket is the lantern, the scene's only light;
- in onboarding, you build it: each site you pick rises lit into an outlined slot.

The stats chart's bars are pickets too (today's is lit), and so are the Plan view's fence and the block-page miniature in Settings.

Text always says what the fence shows, so the fence is `aria-hidden` and nobody depends on the picture.

What stays from round 1 (the owner liked it): tokens, type, hairlines, the two-tone headline and the calm Pro upsell.

## 2. Information architecture

**Popup (360 px, 448 px tall with a site on the tab; round 2 was 484), top to bottom.** Each part has one job.
1. **Stage:** your fence on a ground line. Under it, the state title and summary and the master switch.
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

**The picket material** (`.pk` in `src/styles/base.css`) is one object on every page:
- a body that darkens toward the ground (`--pk-0`, `--pk-1`, `--pk-2`);
- a tip cut in two facets, the left one catching the light;
- a shaded right face and a 1 px edge light.

All of it is CSS gradients on a `clip-path` polygon, so it is crisp at any size and needs no image. A context only sets colours:
- `.lit` turns a picket into a lantern (`--lit-*`);
- `.wall-pk` makes it a picket of the block page's wall (`--wall-*`: sage at dawn, graphite at night);
- unlit pickets use `--unlit-*`;
- `.slot-outline` makes it an empty slot: the picket's outline, open at the ground (an even-odd `clip-path` ring).

The colours are registered with `@property`, so a posture change cross-fades them instead of snapping.

**The fence** is `FFUI.fence(node, { items, state, max, progress, ghosts })` in `src/lib/ui.js`.
- **Geometry:** `--w`, `--h` and `--gap`: 16 × 48 px with 10 px gaps in the popup, 22 × 70 px with 14 px gaps in Settings. Two thin rails sit behind the pickets at 30 % and 68 % of the height, and overhang the ends by only 3 px.
- **Initials:** under the tip, at 0.6 × the width, so they still show when the fence sinks. They are white on the green in light (as in the logo), dark on the light in dark.
- **Postures** come from `data-state`. The sink (`--drop`) is a share of the fence's height: 0.34 when paused, 0.52 when down. Rails sink with the pickets. Round 2 moved the rails by a percentage of their own 3 px height, so they barely moved.
- **Ground:** the popup and the Blocklist hero stand the fence on a ground line with a soft contact shadow (light) or a pool of its light (dark), as wide as the fence (`--fence-w`, measured by the page). In dark, the fence also casts a halo (`drop-shadow` of the lantern colour).
- **Diffing:** re-rendering the same entries only changes `data-state` and `--progress`, so posture changes animate with a 26 ms stagger per picket, on a spring curve. A new entry's picket rises (`.enter`). The first render is still.
- **Long lists:** above `max` pickets (11 in the popup, 16 in Settings), the last slot becomes a "+N" count beside the fence, clear of its rails.
- **Lapsed Pro:** rules kept after Pro lapses stand unlit among the lit ones (`.off`).

**The block page** draws its own wall in `blocked.js`:
- pickets 14 px wide, 28 px apart, across the window;
- the lantern in the middle, 22 px wide and 56 px taller;
- each picket's distance from the lantern sets its fade (`--v`) and how much of the lantern's light it catches on its facing edge and tip facet (`--rim`);
- the reflection is the same wall built a second time and flipped at the ground line. It is built through the CSSOM because the extension's CSP forbids inline style attributes, and `-webkit-box-reflect` does not render with the wall's edge mask;
- the ground carries the lantern's pool of light.

Resizing rebuilds the wall without animating; short windows get a lower fence (`max-height` 700 and 560 px).

## 4. Tokens

The tokens are round 1's, plus the picket materials added in round 3 (the last three rows). They live in `src/styles/base.css`. The older names (`--bg`, `--surface`, `--ink`, `--accent`, `--pro-soft`, …) keep working for the store compositions.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F7F6` | `#0A0C0B` | canvas |
| `--surface` / `-2` / `-3` | `#FFFFFF` / `#F5F6F5` / `#EDEFEE` | `#111413` / `#171A19` / `#1D2120` | cards, hover, pressed |
| `--line` / `-2` / `-3` | `#E5E8E6` / `#D7DBD9` / `#C2C8C5` | white 7 / 11 / 18 % | hairlines and borders |
| `--ink` / `--ink-2` / `--muted` | `#111513` / `#3A423E` / `#5E6763` | `#F1F4F2` / `#C9D0CC` / `#8E9893` | text |
| `--signal` | `#3A9A5B` | `#3A9A5B` | the logo green: pickets, light, chart. Never small text |
| `--accent` / `--accent-solid` | `#287743` | `#6CC58A` / `#5DBE7E` | green text, primary buttons, focus ring |
| `--pro` / `--pro-solid` | `#8A5A0B` / `#D9A13F` | `#D9A74B` | Pro and strict mode |
| `--lit-0` / `-1` / `-2` | `#52B678` / `#3A9A5B` / `#2A7845` | `#C4F4D4` / `#5CC583` / `#2C7C48` | a lantern's body, top to foot (the middle stop is the logo green) |
| `--unlit-0` / `-1` / `-2` | `#E1E7E3` / `#D5DDD8` / `#CBD4CE` | `#3B4340` / `#2E3532` / `#252B29` | a picket that holds no light (fence down, lapsed rule) |
| `--wall-0` / `-1` / `-2` | `#C3D1C8` / `#D0DBD4` / `#E2E9E4` (sage, dawn) | `#232927` / `#151A18` / `#0B0E0D` (graphite, night) | the block page's other pickets |
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

- The fence rises when blocking turns on and sinks when it turns off; its colours cross-fade between lit and unlit as it moves.
- A new site's picket rises in the popup and in Settings.
- On the block page, the fence and its reflection rise in a wave from your picket, then the lantern lights up (its halo and its pool of light fade in) and the copy fades up.
- In onboarding, each picked site rises lit into its slot.
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
- Tabs use `aria-current="page"`. The fence, the stage, the wall and its reflection, the week ribbon and the miniature are all `aria-hidden`; the surrounding text says the same in words.
- No inline styles: the CSP (`style-src 'self'`) stays strict. Per-picket values are set through the CSSOM, and the static fences take their distances from CSS.
- Reduced motion: no rise, no wave, no light-up, no cross-fade. Every fence appears in its final posture.
- Windows high contrast: the switch is drawn with system colours.
- Text never clips:
  - the onboarding field gets the full width below 560 px;
  - placeholders were shortened to fit 390 px in en, fr, es and de;
  - typed sites fit.

## 7. Critique log

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

- The store's promo tile (`scripts/screenshots.mjs`) still draws its own faint repeating fence. It could adopt the lantern in a later pass.
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
