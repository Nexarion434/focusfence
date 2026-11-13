# FocusFence extension UI: brief, system and critique log

Status: **proposal on branch `design/extension-ui`** (PR #4 against `feat/focusfence-v1`). Scope: the toolbar popup, Settings (including the Plan / upgrade screen and the lock screen), the block page and the onboarding tour, in light and dark (following the system).

- **Round 1** restyled the existing layouts. The owner's verdict: a recolour of the same screens.
- **Round 2** (this document) starts again from the feature list.
  - The three concepts and the choice are in [`CONCEPTS.md`](CONCEPTS.md).
  - This brief describes the system that was built and logs its critique passes.

Nothing about behaviour changes: same features, prices, payments (ExtensionPay), permissions, storage format and i18n semantics. One string was added, the "Focus" tab label in en, fr, es and de.

## 1. Direction: the living fence

Your blocklist is a fence. Every site you block becomes a picket, drawn with the logo's 45° tip (it rises half the picket's width) and the site's initial. The fence's **posture is the state**:

| Posture | When | Look |
|---|---|---|
| up | blocking on (always or within the schedule) | standing, field green; in dark, a green light behind it |
| focus | focus session running | standing and glowing; the lower rail fills as the round goes by |
| paused | outside the schedule | half lowered, grey-green |
| down | blocking off | lowered into the ground, grey |
| strict | strict mode | standing, amber, amber light |
| empty | nothing blocked yet | three or five pale slots |

The same object greets you everywhere:
- in the popup, it is the status, readable in two seconds;
- in Settings, it is the hero of the Blocklist;
- on the block page, it is the wall you hit, and your site's picket is the lit one;
- in onboarding, you build it, one picket per site.

The stats chart's bars are pickets too.

Text always says what the fence shows, so the fence is `aria-hidden` and nobody depends on the picture.

What stays from round 1 (the owner liked it): tokens, type, hairlines, the two-tone headline and the calm Pro upsell.

## 2. Information architecture

**Popup (360 px), top to bottom.** Each part has one job.
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
- a sky, and a picket fence across the horizon, built to the window's width;
- the site's picket stands in the middle, taller, lit and lettered;
- above it, the two-tone headline (the distraction dimmed), the quote or your own note, the focus pill when a session runs, the counts, "Back to work" and "Settings", and the URL in mono.

In light it is a white picket fence at dawn; in dark, a silhouette against green light, as at the end of the website.

**Onboarding.** A step on the left, a live stage on the right:
1. Each site you pick rises into one of three lit slots, and the names show under the ground.
2. A normal window and an Incognito one. The second's fence is dashed until FocusFence is allowed there.
3. The fence with an amber picket carrying a lock, for Pro.

Below 900 px the stage sits above the step.

## 3. The fence component

`FFUI.fence(node, { items, state, max, progress, ghosts })` in `src/lib/ui.js`, with styles in `src/styles/base.css` (`.fence`).

- **Geometry:** CSS variables `--w`, `--h` and `--gap`. Pickets are `clip-path` polygons whose tip rises `--w / 2`. Two rails sit behind them, at 24 % and 60 % of the height. Letters are 0.56 × the width.
- **Diffing:** re-rendering the same entries only changes `data-state` and `--progress`, so posture changes animate with a 26 ms stagger per picket, on a spring curve. A new entry's picket rises (`.enter`). The first render is still, so nothing animates on every popup open.
- **Long lists:** above `max` pickets (13 in the popup, 18 in Settings), the last slot becomes `+N`.
- **Lapsed Pro:** rules kept after Pro lapses are drawn faded (`.off`).
- **Wall:** the block page draws its own fence in `blocked.js`, one picket every 36 px. Each one rises in a wave that starts at the lit picket. Resizing rebuilds it without animating.

## 4. Tokens

The tokens are unchanged from round 1 and live in `src/styles/base.css`. The older names (`--bg`, `--surface`, `--ink`, `--accent`, `--pro-soft`, …) keep working for the store compositions.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F7F6` | `#0A0C0B` | canvas |
| `--surface` / `-2` / `-3` | `#FFFFFF` / `#F5F6F5` / `#EDEFEE` | `#111413` / `#171A19` / `#1D2120` | cards, hover, pressed |
| `--line` / `-2` / `-3` | `#E5E8E6` / `#D7DBD9` / `#C2C8C5` | white 7 / 11 / 18 % | hairlines and borders |
| `--ink` / `--ink-2` / `--muted` | `#111513` / `#3A423E` / `#5E6763` | `#F1F4F2` / `#C9D0CC` / `#8E9893` | text |
| `--signal` | `#3A9A5B` | `#3A9A5B` | the logo green: pickets, light, chart. Never small text |
| `--accent` / `--accent-solid` | `#287743` | `#6CC58A` / `#5DBE7E` | green text, primary buttons, focus ring |
| `--pro` / `--pro-solid` | `#8A5A0B` / `#D9A13F` | `#D9A74B` | Pro and strict mode |
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

- The fence rises when blocking turns on and lowers when it turns off.
- A new site's picket rises in the popup and in Settings.
- On the block page, the fence rises in a wave from your picket and the copy fades up.
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
- Tabs use `aria-current="page"`. The fence, the stage, the wall, the week ribbon and the miniature are all `aria-hidden`; the surrounding text says the same in words.
- Windows high contrast: the switch is drawn with system colours.
- Text never clips:
  - the onboarding field gets the full width below 560 px;
  - placeholders were shortened to fit 390 px in en, fr, es and de;
  - typed sites fit.

## 7. Critique log, round 2

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
