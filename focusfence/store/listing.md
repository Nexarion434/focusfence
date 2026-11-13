# Chrome Web Store listing — FocusFence

## Title (≤ 75 chars)

FocusFence — Website Blocker & Focus Timer

## Short description (≤ 132 chars)

Block distracting sites in one click. Pro adds schedules, YouTube Shorts-only blocking, Pomodoro focus & strict mode. 100% private.

## Category

Productivity → Workflow & Planning

## Language

English

## Full description

**Fence off the endless feeds and get your focus back.**

FocusFence is a calm, private website blocker. Add the sites that steal your attention and FocusFence quietly turns them into a gentle reminder to get back to work — with a block page that tells you how much time you've reclaimed.

**FREE — forever**
• Unlimited blocked sites
• Domain-level blocking that includes subdomains: block reddit.com and old.reddit.com, m.reddit.com and www.reddit.com are covered too
• One-click "Block this site" from the toolbar popup
• On/off switch whenever you need a break
• A beautiful, calm block page with motivational quotes

**FOCUSFENCE PRO — $2.99/month or $19.99/year**
• Schedules — block only on the days and hours you choose (overnight ranges supported)
• Path and keyword blocking — block just youtube.com/shorts while the rest of YouTube keeps working, or block any URL containing a keyword
• Pomodoro focus sessions — timed focus rounds and breaks; everything on your list is blocked while you focus
• Strict mode — for when willpower runs out. Blocking can't be switched off and sites can't be removed. Ending early takes a 10-minute cooling-off period plus a typing challenge
• Password lock — protect your settings with a password (ideal for accountability partners)
• Stats — blocked attempts per site and per day, with "time reclaimed"
• Custom block-page message — a note to your future self
• Export & import your settings as JSON

**PRIVATE BY DESIGN**
• No account, no analytics, no tracking, no ads
• Your blocklist, settings and stats never leave your device
• Blocking uses Chrome's built-in declarativeNetRequest engine — FocusFence never reads the pages you visit
• Site access is requested one site at a time, only for the sites you choose to block

Payments are processed securely by ExtensionPay (Stripe). No account needed.

## Single purpose statement

FocusFence has a single purpose: to block websites (or parts of websites) that the user chooses, so the user can stay focused. All features — schedules, focus sessions, strict mode, password lock, stats and the block page — control when and how those user-chosen sites are blocked.

## Permission justifications

| Permission | Justification |
|---|---|
| `declarativeNetRequest` | Core feature. Creates dynamic rules that block or redirect top-level navigations to the sites on the user's blocklist, sending them to the extension's block page. Rules are evaluated by Chrome; the extension does not observe the user's traffic. |
| `storage` | Stores the user's blocklist, settings, timers, local block statistics and a salted hash of the optional password, all on the device. |
| `alarms` | Wakes the service worker at schedule boundaries, at the end of Pomodoro focus/break periods, when timed strict mode ends, and periodically to refresh the Pro license status. |
| `activeTab` | When the user opens the popup, reads the current tab's URL so the user can block the current site with one click ("Block this site") and reload it. No access to other tabs. |
| `scripting` | Used only for Pro path rules (e.g. youtube.com/shorts) on hosts the user has granted. Registers a small content script (`spa-guard.js`) on those hosts that reports in-app URL changes (single-page-app navigation, which declarativeNetRequest cannot see) so the path can be blocked. It does not read or modify page content. |
| Optional host permission `*://*/*` | Never requested at install. When the user adds a site, the extension requests access to that site only (e.g. `*://*.reddit.com/*`). Chrome requires host access for declarativeNetRequest *redirect* rules, which show the FocusFence block page; without it the site is still blocked, but with Chrome's generic error page. Access to all sites is only requested if the user explicitly asks for keyword rules to show the block page. |
| Content script on `https://extensionpay.com/*` | Part of the ExtensionPay payments library: detects on ExtensionPay's own checkout page that a payment completed, so Pro unlocks immediately. Runs on no other site. |

**Remote code:** No. All JavaScript is packaged with the extension. No `eval`, no remotely hosted scripts.

## Data usage disclosures (Privacy practices tab)

- Personally identifiable information: **not collected**
- Health, financial and payment information: **not collected by the extension** (payments happen on ExtensionPay/Stripe pages)
- Authentication information: **not collected** (the optional password is stored only as a local salted hash)
- Personal communications, location, web history, user activity, website content: **not collected**

Certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

Privacy policy URL: host `store/privacy-policy.md` publicly (e.g. GitHub Pages) and paste the URL here.

## Assets

| Asset | File |
|---|---|
| Store icon 128×128 | `src/icons/icon128.png` |
| Screenshot 1 (1280×800) — block page | `screenshots/store-1-block-page.png` |
| Screenshot 2 (1280×800) — popup | `screenshots/store-2-popup.png` |
| Screenshot 3 (1280×800) — blocklist | `screenshots/store-3-options-blocklist.png` |
| Screenshot 4 (1280×800) — schedule, focus, strict | `screenshots/store-4-schedule-focus-strict.png` |
| Screenshot 5 (1280×800) — stats | `screenshots/store-5-stats.png` |
| Small promo tile 440×280 | `screenshots/promo-tile-440x280.png` |
| Package | `dist/focusfence-1.0.0.zip` |
