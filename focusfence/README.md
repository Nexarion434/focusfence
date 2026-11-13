# FocusFence

A calm, private, freemium **Chrome extension (Manifest V3)** that blocks distracting websites.

| Free | Pro ($2.99/month or $19.99/year; €2.99 / €19.99 in the eurozone) |
|---|---|
| Unlimited blocked sites | Schedules (days + time ranges, overnight supported) |
| Domain blocking incl. subdomains (`reddit.com` → `old.reddit.com`, `m.youtube.com`, …) | Path & keyword blocking (`youtube.com/shorts` only) |
| One-click "Block site" for the current tab | Pomodoro focus sessions |
| On/off switch | Strict mode (10-minute cooling-off + typing challenge to end early) |
| Block page with quote + today's blocked count | Password lock · Stats · Custom block-page message · JSON export/import |

No backend, no analytics; nothing leaves the device except ExtensionPay license checks after a user starts an upgrade.

![Popup](screenshots/store-2-popup.png)

## Layout

```
src/                  the extension (load this folder unpacked)
  manifest.json       MV3, localized via __MSG_*__ (default_locale: en)
  _locales/           en, fr, es, de (generated from scripts/i18n/strings.mjs)
  background.js       service worker: rule sync, timers, licensing, message API
  lib/core.js         pure logic (parsing, matching, schedules, DNR rule builder, stats)
  lib/i18n.js         translations for pages (data-i18n attributes, Intl formatting)
  lib/ui.js           shared page helpers
  popup.*  options.*  blocked.*  onboarding.*   UI
  spa-guard.js        tiny content script for path rules on single-page apps
  config.js           DEV flag, ExtensionPay id (placeholder 'focusfence'), prices, URLs
  vendor/ExtPay.js    ExtensionPay library (unmodified copy of extpay@3.1.2)
  LICENSE, THIRD_PARTY_NOTICES.txt, licenses/
tests/                Playwright: unit, e2e, accessibility, i18n, onboarding, site, store, zip
scripts/              build, zip, cws-check, screenshots, icons, docs, i18n, test launcher
store/                privacy policy + translations, listings (en/fr/es/de), CWS submission checklist, screenshot plan + captions
screenshots/          UI shots + store set (en); fr/, es/, de/ localized store sets
dist/                 focusfence-<version>.zip (store package)
../docs/              static website (landing, privacy, blog drafts) for GitHub Pages
../marketing/         unpublished drafts (Product Hunt, Reddit, blog sources)
```

## How blocking works

- Every change re-computes **declarativeNetRequest dynamic rules**:
  - all domain entries collapse into **one** rule (`requestDomains` matches subdomains), redirecting to `blocked.html#<original-url>` via `regexSubstitution`;
  - each path/keyword entry gets its own regex rule.
- Chrome only allows **redirect** rules on hosts the extension has access to. Rather than asking for `<all_urls>`, FocusFence requests **optional host access per site** when the user adds it. Until granted (or if declined) the site is still blocked with a plain `block` rule (Chrome's error page).
- Path rules on SPAs (YouTube) are also enforced on in-app navigation by `spa-guard.js`, registered dynamically only on granted hosts that have path rules.
- `chrome.alarms` drives schedule boundaries (1-minute tick), Pomodoro phase changes, timed strict mode and a 12-hourly license refresh.
- The service worker is the single source of truth: Pro gating, strict mode and the password lock are enforced there, not just in the UI.

## Pro / payments

`src/config.js`:

```js
DEV: true,              // build flips this to false
EXTPAY_ID: 'focusfence' // placeholder — replace with your ExtensionPay extension id
EXTPAY_ID: 'focusfence-dev'
PRICES: {                // must match the ExtensionPay plans (amounts + nicknames)
  USD: { monthly: 2.99, yearly: 19.99, plans: { monthly: 'monthly', yearly: 'yearly' } },
  EUR: { monthly: 2.99, yearly: 19.99, plans: { monthly: 'monthly-eur', yearly: 'yearly-eur' } },
}                        // EUR when the browser locale's region is in the eurozone, else USD
```

- `DEV: true` → "Simulate Pro" switch in Settings → Plan; **no** ExtensionPay network calls.
- `DEV: false` → real `extpay.getUser()` / `openPaymentPage()`; `extpay.onPaid` unlocks Pro immediately.

## Develop

```bash
npm install
npx playwright install chromium
# load ./src as an unpacked extension in chrome://extensions (Developer mode)
```

## Test

```bash
npm test            # 100 tests: unit, e2e blocking, accessibility (axe), i18n fr/es/de, onboarding,
                    # website, store assets, production build, zip pre-submission checks
```

The e2e suite launches Playwright's Chromium (new headless) with the unpacked extension and routes all traffic through a local "fake internet" proxy (TLS terminated with a throwaway self-signed cert, so HSTS-preloaded hosts such as reddit.com work). Headless Chromium cannot click Chrome's permission prompt, so the test copy of the extension gets host access up front; one test uses the real manifest to verify the no-access fallback.

If Chromium is missing system libraries and you cannot `sudo`, extract them locally and point `FF_CHROME_LIBS` at the folder:

```bash
FF_CHROME_LIBS=/path/to/libs npm test
```

## Build & assets

```bash
npm run build            # dist/focusfence/ + dist/focusfence-1.0.0.zip (DEV=false)
npm run cws:check        # build + Chrome Web Store pre-submission checks on the zip
npm run screenshots:all  # store screenshots + promo tile in en, fr, es, de
npm run screenshots:site # website images: 2x WebP captures of the real UI + 1200x630 Open Graph image, en, fr, es, de
npm run i18n             # regenerate src/_locales from scripts/i18n/strings.mjs
npm run docs             # regenerate ../docs (website)
npm run icons            # src/icons/*.png from the Picket F logo (LOGO_SVG in src/lib/ui.js, the single source)
```

`npm run cws:check` checks the following, and fails on the usual rejection causes:
- size limits, CRC integrity and Manifest V3 keys;
- `__MSG_` keys resolvable in every locale, with name ≤ 75 and description ≤ 132 characters;
- real PNG icons at their declared sizes, and every file the manifest references present;
- no remote code (remote `<script>`/`@import`/`importScripts`, `eval`, `new Function`), no unsafe CSP, no `<all_urls>` install-time access;
- no reserved or hidden files.

## Languages

The UI, manifest name/description and store listings are available in **English (default), French, Spanish and German**.

- Single source: `scripts/i18n/strings.mjs` (one table, four languages side by side).
- `npm run i18n` writes `src/_locales/*/messages.json`; `npm run i18n:check` validates it (also part of `npm test`).
- Pages use `data-i18n`, `data-i18n-rich` and `data-i18n-attr`. JS uses `FFI18N.t()` and `plural()`. Weekdays, dates, times and prices come from `Intl`.
- To add a language: add a column to every row in `strings.mjs`, add the code to `LANGS`, run `npm run i18n`, and add a `store/listing.<lang>.md`.

## Onboarding

`src/onboarding.html` opens on first install of the store build. It has three steps: pick up to 3 sites (one permission prompt for all of them), how Incognito works, then Free vs Pro. It can be reopened from Settings → Plan.

## Website (GitHub Pages)

`npm run docs` regenerates `../docs/` (repo root). Live at https://focusfence.dev/ (GitHub Pages custom domain, `docs/CNAME` written by `npm run docs`; folder `/docs`, served from `feat/focusfence-v1` until PR #1 is merged, then from `main`). The old https://nexarion434.github.io/focusfence/ URLs redirect there.

- **Languages:** English at the root (also `x-default`), French, Spanish and German under `docs/fr/`, `docs/es/`, `docs/de/`: landing page plus `privacy.html` each.
  - Landing text: `scripts/site-strings.mjs`.
  - Privacy: `store/privacy-policy.md` plus `privacy-policy.<lang>.md`. The translations use `{{CONTACT}}`, filled from the English Contact line, so the address is entered once.
  - Product images and the Open Graph image come from `screenshots/site/<lang>/` (`npm run screenshots:site`): real captures of the extension in its dark theme at 2x, encoded to WebP in Chromium, plus a 1200×630 `og.png` per language.
  - Every page has a language switcher, `hreflang`/canonical tags, localized `og:*` tags and the localized Open Graph image. The sitemap lists every language with alternates.
- **Design:** dark, Linear-inspired (notes, palette, type scale and critique log in `../design/landing-v2/BRIEF.md`). Styles live in `scripts/site.css` and are inlined into every page; `scripts/site.js` (deferred, ~1 KB) remembers the language choice and adds subtle scroll motion, skipped under `prefers-reduced-motion`. One self-hosted font (Inter with the optical-size axis, from `@fontsource-variable/inter`), no framework, no CDN, no tracker.
- **First-visit redirect** (root `index.html` only): a visitor whose `navigator.languages` puts fr/es/de before English is sent to that language. A click in the switcher is saved in `localStorage` (`ff-lang`) and always wins. Arriving at the root from another page of the site never redirects.
- **Blog:** `blog/` is English-only, rendered from `../marketing/blog/*.md`. Posts with `draft: true` get `noindex` and stay out of the sitemap.

Marketing drafts live in `../marketing/` and are not published.

## License

FocusFence is licensed under the **GNU AGPL v3 or later** (`LICENSE`).

Why: the ExtensionPay client (`extpay`) declares `AGPL-3.0-or-later` in its package.json and source header, while its LICENSE file says `LGPL-3.0`. Shipping it inside the extension makes the package a combined work. The cleanest option that complies with either reading is to license FocusFence itself under AGPL-3.0-or-later:

- `src/vendor/ExtPay.js` is byte-for-byte `extpay@3.1.2/dist/ExtPay.js` (checked by `tests/build.spec.mjs`);
- `LICENSE`, `THIRD_PARTY_NOTICES.txt` and `licenses/` ship inside the zip;
- the zip contains the complete, unminified source (the Corresponding Source), and Settings → Plan links the license, notices and source repository.

Alternatives considered: "load extpay from npm as-is with a notice" doesn't avoid copyleft, because the library is still distributed inside the extension. A clean-room payment client against ExtensionPay's HTTP API would allow a proprietary license, but it is riskier and has to be maintained by hand. Not legal advice. Have counsel confirm before launch.

Third-party: ExtPay (AGPL-3.0-or-later), webextension-polyfill 0.7.0 bundled inside it (MPL-2.0), Inter font (SIL OFL 1.1). See `src/THIRD_PARTY_NOTICES.txt`.

## Strict mode limits

Chrome always lets users disable or remove extensions, and no extension can block `chrome://extensions`. Mitigations: timed strict sessions pause while FocusFence isn't running (heartbeat every minute, so disabling it can't run out the clock), and the options page and popup warn when FocusFence isn't allowed in Incognito. The limits are documented in the UI, the listing and the landing page FAQ.
