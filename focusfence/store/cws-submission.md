# Chrome Web Store submission checklist

Every field of the Developer Dashboard, in order, with the exact value to paste. Values in `code blocks` are copied verbatim. The long texts (full descriptions) live in `listing*.md`. `tests/store.spec.mjs` checks that this file stays consistent with the manifest and `listing.md`.

Nothing here has been submitted. Dashboard field names can shift slightly between dashboard versions; the content stays the same.

## 0. Before you open the dashboard

- [ ] PR #1 merged, and GitHub Pages switched to `main` / `/docs` (see `OWNER_TODO.md` step 2).
- [ ] `EXTPAY_ID` set in `src/config.js` (`OWNER_TODO.md` step 5).
- [ ] Contact email filled in `store/privacy-policy.md`, then `npm run docs` (the live privacy page must not show the placeholder).
- [ ] `cd focusfence && npm test && npm run cws:check`. Expect `PASSED`, and use the zip it names: `dist/focusfence-1.0.0.zip`.
- [ ] These URLs return 200 in a browser:
      `https://nexarion434.github.io/focusfence/` and `https://nexarion434.github.io/focusfence/privacy.html`

## 1. Account (one time)

| Field | Value |
|---|---|
| Registration fee | US$5, one-time (owner pays) |
| Publisher display name | `FocusFence` (or your studio name) |
| Contact email | the dedicated support address (must be verified) |
| Trader / non-trader declaration (EU DSA) | **Trader** if you sell Pro as a business; this shows your address/contact to EU users. Decide with your accountant. |
| 2-step verification | On (required to publish) |

## 2. Package tab

- [ ] Upload `focusfence/dist/focusfence-1.0.0.zip`. The name, short description, icon and version are read from the manifest:
  - name `FocusFence – Website Blocker & Pomodoro Focus Timer`
  - 4 locales: en (default), fr, es, de
  - version `1.0.0`

## 3. Store listing tab

Repeat for each language (dashboard language selector). English first.

| Field | Value |
|---|---|
| Description | the code block under "Full description" in `store/listing.md` (fr/es/de: `listing.fr.md`, `listing.es.md`, `listing.de.md`) |
| Category | `Productivity` → `Tools` (if only one level is offered: `Productivity`) |
| Language | `English (United States)`; add `Français`, `Español`, `Deutsch` |
| Store icon (128×128) | `src/icons/icon128.png` |
| Screenshots (1280×800, in this order) | `screenshots/store-1-block-page.png`, `store-2-popup.png`, `store-3-options-blocklist.png`, `store-4-schedule-focus-strict.png`, `store-5-stats.png` (per language: `screenshots/fr/`, `es/`, `de/`) |
| Small promo tile (440×280) | `screenshots/promo-tile-440x280.png` (per language: same folders) |
| Marquee promo tile (1400×560) | leave empty (optional; only used if Google features the item) |
| Official URL | leave empty unless you verify the site in Google Search Console |
| Homepage URL | `https://nexarion434.github.io/focusfence/` |
| Support URL | `https://github.com/Nexarion434/focusfence/issues` |
| Mature content | `No` |

## 4. Privacy tab

### Single purpose description

```
FocusFence has a single purpose: to block websites (or parts of websites) that the user chooses, so the user can stay focused. All features (schedules, focus sessions, strict mode, password lock, stats and the block page) control when and how those user-chosen sites are blocked.
```

### Permission justifications (one box per permission)

**declarativeNetRequest**
```
Core feature. Creates dynamic rules that block or redirect top-level navigations to the sites on the user's blocklist, sending them to the extension's block page. Rules are evaluated by Chrome; the extension does not observe the user's traffic.
```

**storage**
```
Stores the user's blocklist, settings, timers, local block statistics and a salted hash of the optional password, all on the device.
```

**alarms**
```
Wakes the service worker at schedule boundaries, at the end of Pomodoro focus/break periods, when timed strict mode ends (and to pause strict-mode time while the extension wasn't running), and periodically to refresh the Pro license status.
```

**activeTab**
```
When the user opens the popup, reads the current tab's URL so the user can block the current site with one click and reload it. No access to other tabs.
```

**scripting**
```
Used only for Pro path rules (e.g. youtube.com/shorts) on hosts the user has granted. Registers a small content script (spa-guard.js) on those hosts that reports in-app URL changes (single-page-app navigation, which declarativeNetRequest cannot see) so the path can be blocked. It does not read or modify page content.
```

**Host permission** (covers the optional `*://*/*` and the content script on `https://extensionpay.com/*`)
```
Optional host permission *://*/* is never requested at install. When the user adds a site to the blocklist, the extension requests access to that site only (e.g. *://*.reddit.com/*). Chrome requires host access for declarativeNetRequest redirect rules, which show the FocusFence block page; if the user declines, the site is still blocked with Chrome's generic error page. Access to all sites is only requested if the user explicitly asks for keyword rules to show the block page. The content script on https://extensionpay.com/* is part of the ExtensionPay payments library: it detects on ExtensionPay's own checkout page that a payment completed, so Pro unlocks immediately. It runs on no other site.
```

### Remote code

`No, I am not using remote code`, with this justification if a box is shown:
```
All JavaScript is included in the package, unminified. No eval, no remotely hosted scripts. The only network call is to extensionpay.com to check the Pro license.
```

### Data usage

Tick **none** of the data categories:
- personally identifiable info
- health info
- financial and payment info
- authentication info
- personal communications
- location
- web history
- user activity
- website content

Payments happen on ExtensionPay/Stripe pages, not in the extension. The optional password is stored only as a local salted hash.

Tick all three certifications:
- [ ] I do not sell or transfer user data to third parties, outside of the approved use cases
- [ ] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [ ] I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

```
https://nexarion434.github.io/focusfence/privacy.html
```

## 5. Distribution tab

| Field | Value |
|---|---|
| Payments | `Contains in-app purchases` (Pro via ExtensionPay) |
| Visibility | `Public` (or `Unlisted` for a soft launch with friends first) |
| Regions | All regions (restrict only if your tax setup requires it) |

## 6. Test instructions tab (for the reviewer)

```
No account or login is needed. Free features: open the popup on any site and click "Block site", accept Chrome's site-access prompt, then reload: the FocusFence block page appears. Settings lists blocked sites and has an on/off switch. Pro features (schedules, path/keyword rules such as youtube.com/shorts, Pomodoro, strict mode, password lock, stats) are unlocked by a purchase through ExtensionPay (Stripe); the Upgrade buttons in Settings open the ExtensionPay checkout. Source code: https://github.com/Nexarion434/focusfence
```

## 7. Submit

- [ ] Click **Submit for review**. Choose "publish automatically after approval" or defer publishing, as you prefer.
- [ ] Reviews of new items with host permissions typically take a few days to a few weeks. Answer any reviewer email from the account's contact address.
- [ ] After approval: set `STORE_URL` in `scripts/docs.mjs`, run `npm run docs`, commit, push (`OWNER_TODO.md` step 10).
