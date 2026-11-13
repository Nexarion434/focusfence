# FocusFence extension UI: brief, system and critique log

Status: **proposal on branch `design/extension-ui`** (PR against `feat/focusfence-v1`). Scope: the toolbar popup, Settings (options page, including the Plan / upgrade screen and the lock screen), the block page and the onboarding tour, in light and dark.

Companion to the landing page brief (`design/landing-v2/BRIEF.md`, PR #3). The landing sells the product in a dark room with one green light; the extension is the instrument people actually hold. Same brand and type, but light and dark are both first-class, and the density is a tool's, not a poster's.

Nothing about behaviour changes: same features, prices, payments (ExtensionPay), permissions, storage format and i18n keys. Element ids the tests, the store screenshots and the landing's `--site` captures rely on are kept.

## 1. Where we started (pass 0)

`npm run design:shots` captures 32 states in light and dark (popup in eight states, Settings in sixteen, the block page in three, onboarding in five). What was wrong:

**Popup**
1. Card soup: status, current tab, add field, focus timer and footer are five boxes of equal weight. Nothing leads.
2. In strict mode, two amber blocks are stacked (status, then the Incognito note), and amber already means "Pro" elsewhere.
3. The idle focus card shows a large `25:00` that isn't counting. It's louder than the blocking status.
4. Letter avatars use random saturated hues (purple, brown, slate blue). That's colour noise unrelated to the brand.
5. The disabled "Block site" button is a washed-out green that still looks clickable.
6. The light theme is warm beige (`#F5F4EF`) with a teal pine (`#276B5B`), an older palette. Neither matches the Picket F green or the near-black landing.

**Settings**

7. Every section has the same 22 px bold heading, a 600 px paragraph and a bordered box. Controls and descriptions have no rhythm.
8. Pro-locked sections are greyed to 45 % with an "Available with Pro" card floating over the controls. It reads as broken, not as an offer. Seven PRO pills shout in the sidebar.
9. The chart is chunky (44 px bars at 85 % green, with numbers on top), and the top-site meters are as loud as the bars.
10. Link-buttons underline on hover because of a global `a:hover` rule (e.g. "Start focusing", "See Pro").
11. The full-page capture showed the sticky sidebar at the bottom of the page. This was a capture artefact: both capture scripts now scroll to the top first.

**Block page**

12. Two gradients (green top, amber corner) muddy the background, and the picket stripes read as a barcode. The landing fixed the same problem.
13. The headline puts the site in brand green, so the distraction gets the brand colour.

**Onboarding**

14. A generic card sits at the top of an empty page, with tiny progress dots and colourful avatars. The Pro tier differs from Free only by an amber border.

## 2. Direction: "the quiet instrument"

FocusFence is something you glance at, not something you browse. It should feel like a precise instrument: neutral surfaces, hairlines, crisp type and **one green signal that means "the fence is up"**. Amber appears only where commitment or money is involved: Pro and strict mode. Everything else is ink on paper (light) or light on graphite (dark).

Principles:

- **State before words.** Every screen answers "am I protected right now?" before anything else: a status light in the popup, a lit fence on the block page, the switch at the top of the blocklist.
- **Hairlines over boxes.** Group with spacing and 1 px rules. Use one surface per region, and add a card only where content is an object (a site, a plan, a time range).
- **Green is a signal, not a decoration.** Green marks active blocking, primary actions, focus rings, ticks and the light. It is never used for a heading or a distraction.
- **Numbers are instruments.** Timers and counts use Inter's display optical size with tabular figures and tight tracking.
- **Both themes designed, not inverted.** Light is crisp white on a cool grey canvas. Dark is the landing's near-black with lifted panels and translucent hairlines. Each colour pair is checked in both themes.

Signature details, shared with the landing:

- **The picket.** The logo's 45° picket tip (rise = half the width) is the only ornament:
  - the **status lamp** in the popup: a lit picket that glows green when blocking is on, amber in strict mode and hollow grey when blocking is off or paused, with a soft light behind it;
  - **round counters** in a focus session, with done, current and remaining pickets;
  - the **selection counter** in onboarding, where three pickets light up as you pick sites;
  - the **empty fence** in an empty blocklist;
  - the **fence silhouette** against the light at the foot of the block page.
- **Dimmed distractions.** Two-tone headline on the block page: the site is muted, "is fenced off" is bright, as in the landing's hero.
- **Mono micro-labels.** Uppercase system mono at 11 px for kickers and section labels.

## 3. Tokens

All tokens live in `src/styles/base.css` on `:root`, overridden under `prefers-color-scheme: dark`. The older token names (`--bg`, `--surface`, `--ink`, `--accent`, `--pro-soft`, …) are kept, with new values, so the store-screenshot compositions and the landing's `--site` captures keep working.

### Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F7F6` | `#0A0C0B` | page canvas (Settings, block page, onboarding) |
| `--bg-2` | `#EDEFEE` | `#191D1B` | tracks: segmented control, meters, code |
| `--surface` | `#FFFFFF` | `#111413` | cards, popup, sidebar items |
| `--surface-2` | `#F5F6F5` | `#171A19` | hover, input fill |
| `--surface-3` | `#EDEFEE` | `#1D2120` | pressed |
| `--line` / `-2` / `-3` | `#E5E8E6` / `#D7DBD9` / `#C2C8C5` | white 7 / 11 / 18 % | hairlines, control borders, hover borders |
| `--ink` | `#111513` | `#F1F4F2` | primary text |
| `--ink-2` | `#3A423E` | `#C9D0CC` | secondary emphasis |
| `--muted` | `#5E6763` | `#8E9893` | body, meta, the dimmed half of headlines |
| `--faint` | `#8A938E` | `#5F6964` | icons and decoration only (never text) |
| `--signal` | `#3A9A5B` | `#3A9A5B` | logo field green: lamp, light, chart, fence. Never small text |
| `--accent` | `#287743` | `#6CC58A` | green text, links, icons, focus ring |
| `--accent-solid` / `--accent-ink` | `#287743` / white | `#5DBE7E` / `#04130A` | primary button |
| `--accent-soft` | `#E8F3EC` | green 12 % | selected chips, today's bar label |
| `--pro` / `--pro-soft` | `#8A5A0B` / `#FBF0DA` | `#D9A74B` / amber 12 % | PRO badges, strict mode |
| `--pro-solid` / `--pro-ink` | `#D9A13F` / `#1C1305` | `#D9A74B` / `#1A1206` | upgrade button |
| `--danger` | `#B42318` | `#F2766B` | destructive actions, errors |
| `--warn` | `#9A5B00` | `#E5B567` | warning icons and text |
| `--switch-off` | `#868F8B` | `#5E6863` | off track (3:1 against its surface) |

Dark values follow the landing: same text, muted and accent greens, and the same amber. The canvas `#0A0C0B` is the landing's `#08090A` with a hint of the field green, so panels can sit one step lighter.

Contrast (WCAG 2.1, measured):

| Pair | Light | Dark |
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

White on field green is only 3.5:1, so `--signal` never carries text. The light primary button uses a deeper green on the same hue (141°).

### Type

Inter (variable: weight and optical size, the same Latin subset as the landing, bundled, 73 KB) with `font-optical-sizing: auto` and the landing's features `cv11` and `ss01`. Large numbers get the display cut automatically. Mono is the system stack, for micro-labels and URLs only.

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Block-page headline | 46 px (clamp 30–46) / 1.06 | 620 | −0.035em |
| Display numbers (timers, counts, prices) | 26–40 px / 1 | 600–620 | −0.03 to −0.035em |
| Onboarding title | 28 px / 1.12 | 620 | −0.03em |
| Section title (Settings h2) | 18 px / 24 | 600 | −0.016em |
| Popup status | 16 px / 20 | 600 | −0.012em |
| Body (Settings descriptions) | 13.5 px / 20 | 400 | 0 |
| UI (popup, rows, buttons) | 13 px / 18 | 450–550 | 0 |
| Meta | 12 px / 16 | 450 | 0 |
| Mono label | 11 px / 14, uppercase | 500 | +0.08em |
| Badge | 10.5 px / 16, uppercase | 600 | +0.04em |

### Space, radius, elevation, motion

- 4 px grid. Popup padding 16 px. Settings content is a 720 px column centred next to a 248 px sidebar; sections are separated by a hairline with 40 px above and below it.
- Radius: 6 (segments, small controls), 8 (buttons, inputs), 10 (rows, chips), 12 (cards), 16 (dialogs, onboarding), pill (badges, status pill).
- Elevation: light uses soft two-layer shadows. Dark uses a 1 px inner top highlight (white 4 %) plus black shadows, like the landing's lit panels.
- Motion: 120 ms for hover and colour, 180 ms for the switch (ease-out), 280–400 ms for entrances (fade + 6–8 px rise). Nothing loops, and `prefers-reduced-motion` turns all of it off.

## 4. Components

- **Button**: 32 px (`sm` 28, `lg` 40). Variants: default (surface + border), primary (accent solid), pro (amber solid, dark ink), ghost, danger (red text, red-tint hover), icon (28 px square). Link-buttons never underline.
- **Input**: 34–36 px with a 1 px border. Hover strengthens the border; focus shows a green border and a 3 px soft ring. Placeholders use `--muted`.
- **Switch**: 34 × 20 px. Off is a mid-grey track with a white knob (3:1 both ways). On is green. Disabled is 50 %.
- **Badge**: pill, 10.5 px uppercase. PRO is amber on amber-soft with a hairline; FREE and neutral badges are grey.
- **Card**: surface, 1 px line, radius 12. Optional footer separated by a hairline, for actions.
- **Row**: 52 px, hairline dividers. Remove buttons are quiet icons that turn red on hover.
- **Monogram**: 28 px rounded square. The tint is derived from the site name (same hash as before), but low-chroma: about 93 % lightness in light, 16 % in dark, with letters at 5:1 or better.
- **Notice**: neutral surface with a hairline and an amber icon, so warnings stay calm and don't read as Pro.
- **Segmented control**: track on `--bg-2`; the active segment is a raised surface.
- **Mono label**, **status lamp**, **picket counter**, **progress bar** (3 px), **stat** (display number + 12 px label).
- **Toast**: inverted (ink background), radius 10, rises 6 px.

Icons: one in-house set, drawn on a 24 grid with 1.7 px rounded strokes (settings sliders, pickets, calendar, timer, lock, key, page, chart, archive, sparkle, plus, x, check, warning, arrow). Original drawings, no icon library.

## 5. Screens

**Popup (360 px).** One surface with hairline sections:
1. A header with the logo, wordmark, plan badge and settings button.
2. The status block: lamp, status title and summary, and the switch, with the light behind the lamp.
3. The current tab as an object row (monogram, host, note, "Block site").
4. The add field with its button.
5. The focus section, with a mono label, a display timer, round pickets and a phase progress bar while running.
6. The footer: today's and this week's blocked attempts (the numbers emphasised, never a time estimate) and the link to all settings.

Free users see the focus section as a quiet Pro teaser instead of a fake timer. Strict mode tints the lamp amber and turns the Incognito note into a neutral notice.

**Settings.**
- The sidebar has the brand, the Blocklist, then a single "PRO" group label above the seven Pro sections instead of seven pills, then Plan, plus the plan card at the bottom.
- Each section has an 18 px title, a muted description and a control on the right where one exists. Content sits in cards with footers for actions.
- Locked Pro sections show their real controls, softened. A gate bar at the top of the section explains the offer and links to the plans, instead of a card floating over the controls.
- The chart has 7 slim bars on a hairline baseline. Today's bar is lit; earlier days are signal green at about 40 %.
- Plan: two plan cards (the yearly card is lit amber, with "Save 44 %"), the features as a ticked two-column list, then the payments, licence and links.
- Lock screen: a blurred canvas behind a 360 px dialog.

**Block page.** Centred on the canvas, top to bottom:
- the mark in its light;
- a mono kicker;
- the two-tone headline;
- the quote;
- the focus pill when a session is running;
- the two counts in one hairline group;
- "Back to work" and "Settings";
- the URL in mono.

A picket fence, silhouetted against a soft green light, closes the page.

**Onboarding.**
- Logo and a 3-segment progress bar.
- A 640 px dialog with a 28 px display title and its actions in a footer bar.
- Site chips with low-chroma monograms and a drawn check when selected.
- The counter has three pickets that light up.
- Free and Pro are shown side by side; the Pro tier is lit and carries the price.

## 6. Process

1. Pass 0: capture the existing UI in every state (`npm run design:shots`) and list what's wrong (section 1).
2. Implement the system in `base.css` and the four pages.
3. Repeat at least three times: capture all states in light and dark, critique as a senior designer, fix. Each pass is logged below.
4. Keep the full test suite green, regenerate the store screenshots in all four languages and the website assets that embed them, then rebuild the zip.

## 7. Critique log

Each pass captures every state in light and dark (`npm run design:shots`: 32 states, 35 from pass 2), reviews them side by side, then fixes. The full suite runs after each pass.

**Pass 1** (first build of the system; tests: 101 passed, axe clean in both themes):

Popup:
1. The status block stacked vertically because its `focus` state class collided with the focus card's `.focus` rules. States are now `is-focus`, `is-off` and `is-strict`.
2. The phase progress was about 0 % whenever a session's end time was moved (as the store screenshots do). It now follows the phase length, the same source as the countdown.
3. On white, the light behind the lamp read as a stain. The light now exists only in the dark theme; light mode keeps a crisp lamp.
4. The idle `25:00` was a static timer. Idle and Free now say what a session does, next to the action; the big timer only exists while it counts.
5. The amber "Unlock Pro" outweighed "Block site". It is now a soft amber button.
6. The status summary broke inside a phrase ("6 / sites fenced"). Its chunks no longer break.
7. "Browser pages can't be blocked" was truncated. It wraps now.
8. The title and lamp were a size too small to lead (15 → 16 px, lamp 10 → 11 px).
9. An empty list lit the lamp, so "Blocking is on · 0 sites fenced" looked active. The lamp is now hollow until something is fenced.
10. On browser pages, the disabled "Block site" was noise next to the note that says why. It is now hidden.
11. "Blocked" looked like a greyed-out button. It is now a confirmed green state with a tick.

Settings:
12. The Blocklist icon read as an "m", and the Block page icon was a second "no entry" sign. They are now a circle-slash and a window with text lines.
13. At 760 px, the plan card and its full-width amber button pushed the settings below the fold. The card is now hidden in the narrow layout; the Plan link stays.
14. The live session in Settings had none of the popup's round pickets and progress. Both are added.
15. In light mode, the strict-mode card's radial glow read as a cream smudge. It is now a 64 px amber wash at the top of the card.

Block page:
16. In light mode, the halo banded, and the vertical fade erased the picket tips, so the fence read as stripes again. There is no halo on white now. The fence keeps its tips and fades sideways: pale green pickets in light, a black silhouette against the green light in dark.

Onboarding:
17. The dialog hugged the top of a tall, empty page. It now sits at an optical centre (11 vh).

**Pass 2** (all states again, plus German and French, keyboard focus and toasts; tests: 101 passed):
1. On Free, the seven Pro gates were seven amber bars down the page, which felt naggy. Each gate is now a neutral bar; only the lock icon and one small Upgrade button are amber.
2. German and French were checked in the popup, Settings, the block page and onboarding (`--lang de|fr`). Everything fits at 360 px; the long footer wraps between its chunks, never inside one.
3. Toasts centred on the window, half under the sidebar. They now centre on the content column.
4. The native disclosure triangle on "What strict mode can't prevent" was the one untouched browser default. It is now a drawn chevron that turns open.
5. Keyboard focus was checked by tabbing through the popup and Settings: a 2 px green ring with a 2 px offset on every control, plus a green border and soft ring on inputs, in both themes.
6. The capture set gained the strict banner at the top of Settings, Pro rules kept after Pro lapses, and toasts.

**Pass 3** (all 35 states at 2x for popups; tests: 101 passed):
1. In strict mode, the disabled remove buttons turned into bordered grey boxes, because the generic disabled style beat the ghost variant. Disabled ghost buttons now stay borderless and faint.
2. Uppercase badges (PRO, FREE, SAVE 44 %) sat about 1 px high, because line-height centres the em box rather than the caps. They are now optically centred.
3. In Windows high-contrast mode, system colours replace backgrounds, so the switch would vanish. It is now drawn with system colours there (Canvas, CanvasText and Highlight), as checked with Chromium's forced-colours emulation.
4. No structural issues left. The popup, block page and onboarding read as one family with the website: the same green, amber, type, picket and two-tone headline.

**Pass 4** (final set, store assets; tests: 101 passed):
1. The light and dark captures of a running session showed different seconds (18:42 and 18:40), because the timer kept ticking between them. The capture script now waits for the exact 18:42 tick, so every image shows the same moment, as the website's captures do.
2. The store captions' composition has its own `.kicker` class, which picked up the new mono label of the same name. The utility is now `.mono-label`, and the captions render exactly as before.
3. The tick in the store popup frame's bullet list still used the old pine. It now uses the accent.

## 8. Results

- **Tests:** 101 passed: unit, e2e, axe in light and dark, i18n fr/es/de, onboarding, store, build and zip checks. No test had to change, because every id, role and text the tests rely on is preserved.
- **Final screenshots:** `design/extension-ui/screenshots/` holds 35 states in light and dark (70 PNGs). Popups are at 2x, pages at 1x.
- **Store assets:** `npm run screenshots:all` regenerated the five screenshots and the promo tile in en, fr, es and de. `npm run docs` then refreshed the website copies, which the docs test requires to be byte-identical.
- **Zip:** `npm run build` rebuilt `dist/focusfence-1.0.0.zip` (165 KB → 194 KB, mostly the optical-size font).
  - Same 34 files; 16 changed: the four pages, their scripts and styles, `lib/ui.js`, the font and its notice.
  - `manifest.json`, `background.js`, `config.js`, `_locales` and `vendor/ExtPay.js` are byte-identical.
- **Strings:** no new strings. The sidebar's PRO group label reuses `planPro`.

## 9. Open points for the owner

- The landing page (PR #3) embeds captures of this UI. Once both PRs are merged:
  - re-run `npm run screenshots:site`;
  - set the site's `--screen` token to the extension's new dark canvas `#0A0C0B` (it was `#141917`), so product crops still sit seamlessly.
- The extension now bundles the same Inter file as the website (weight + optical size), which adds 25 KB to the zip. The file keeps its name, and `THIRD_PARTY_NOTICES.txt` says which cut it is.
- Unchanged behaviour of the store script: `store-2-popup.png` loads the popup about a second after `popup.png`, so its timer can read 18:41.

