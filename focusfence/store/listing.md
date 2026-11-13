# Chrome Web Store listing — FocusFence

> The **title** and **short description** come from `src/manifest.json` (`name`, `description`) and must match what is entered in the dashboard. Everything else is pasted into the Developer Dashboard.

## Title (≤ 75 chars, 51 used)

FocusFence – Website Blocker & Pomodoro Focus Timer

## Short description (≤ 132 chars, 127 used)

Block distracting websites in one click, or just YouTube Shorts. Schedules, Pomodoro focus timer and strict mode. 100% private.

## Category · Language

Productivity → Tools. English (United States). Translated listings: `listing.fr.md`, `listing.es.md`, `listing.de.md`.

## Full description

```
Block distracting websites in one click and get your focus back. FocusFence is a calm, private website blocker for Chrome: block all of a site, or only its worst part, like YouTube Shorts.

Unlike most site blockers, FocusFence doesn't read the pages you visit. Blocking runs in Chrome's built-in rule engine, and your blocklist never leaves your computer.

━━━━━━━━━━━━━━━━━━━━
FREE: UNLIMITED SITES, FOREVER
━━━━━━━━━━━━━━━━━━━━
✓ Block as many websites as you like
✓ Subdomains included: block reddit.com and old.reddit.com, m.reddit.com and www.reddit.com are blocked too
✓ One click: open the popup on any site and press "Block site"
✓ On/off switch for breaks
✓ A calm block page with a motivational quote and the time you've reclaimed today

━━━━━━━━━━━━━━━━━━━━
FOCUSFENCE PRO: $2.99/MONTH OR $19.99/YEAR
━━━━━━━━━━━━━━━━━━━━
✓ Block YouTube Shorts but keep YouTube: path rules block a single section (youtube.com/shorts), including when you click into it from inside YouTube
✓ Keyword blocking: block any page whose address contains a word
✓ Schedules: block websites only during work or study hours, on the days you pick. Overnight ranges supported (e.g. 22:00–06:00)
✓ Pomodoro focus timer: focus rounds and breaks, with everything on your list blocked while you focus. The countdown shows on the toolbar icon
✓ Strict mode: blocking can't be switched off and sites can't be removed. Ending early takes a 10-minute cooling-off period plus a typing challenge
✓ Password lock: protect your settings (great with an accountability partner)
✓ Stats: blocked attempts per site and per day, plus estimated time saved
✓ Custom block page message: leave a note for your future self
✓ Export and import your settings as JSON

━━━━━━━━━━━━━━━━━━━━
PRIVATE BY DESIGN
━━━━━━━━━━━━━━━━━━━━
• No account, no analytics, no tracking, no ads
• Your blocklist, settings and stats stay on your device
• Site access is requested one site at a time, only for sites you block. If you decline, the site is still blocked
• Open source under the GNU AGPL v3
• Available in English, French, Spanish and German

━━━━━━━━━━━━━━━━━━━━
GOOD TO KNOW (HONEST LIMITS)
━━━━━━━━━━━━━━━━━━━━
• Chrome always lets you disable or remove an extension, and no extension can block chrome://extensions. In strict mode, a timed session pauses while FocusFence is off, so switching it off doesn't make the time run out.
• Incognito windows are only covered if you turn on "Allow in Incognito" for FocusFence. FocusFence warns you when it's off.
• Other browsers and devices aren't covered.

━━━━━━━━━━━━━━━━━━━━
HOW TO USE
━━━━━━━━━━━━━━━━━━━━
1. Pin FocusFence to your toolbar.
2. When you install, pick 3 sites to block. Later, open the popup on any site and click "Block site", or add sites in Settings.
3. Allow site access when Chrome asks, so FocusFence can show its block page.
4. Pro: set a schedule, start a focus session, or turn on strict mode before a deadline.

Payments are processed by ExtensionPay (Stripe). No FocusFence account needed.
Privacy policy: https://nexarion434.github.io/focusfence/privacy.html
Source code: https://github.com/Nexarion434/focusfence
```

## SEO notes (Chrome Web Store search)

The store ranks mainly on the **title**, then the **short description**, then the full description, plus install count, rating and engagement. Choices made here:

- **Title** leads with the brand and then the two highest-intent generic queries: *website blocker* and *pomodoro / focus timer*. No third-party brand names in the title. Google's policy treats those as keyword spam and they risk rejection.
- **Short description** names the main differentiator in plain words (*just YouTube Shorts*), which is a common search intent, plus *schedules*, *Pomodoro focus timer*, *strict mode* and *private*.
- **First 2 lines of the full description** (shown before "Read more") restate *block distracting websites* and *website blocker* naturally, then give the privacy hook.
- Secondary phrases appear once each, in sentences: *site blocker*, *block YouTube Shorts*, *block websites during work or study hours*, *focus timer*, *time saved*. No keyword lists, no repetition, no claims about other products. All of these would violate the store's [program policies](https://developer.chrome.com/docs/webstore/program-policies/) on keyword spam.
- Screenshots carry short captions in the image (block page, popup, blocklist, schedule/strict, stats), because users decide from screenshots.
- After launch: answer reviews, ship small updates (freshness), and add localized listings (FR, DE, ES, PT-BR) with translated titles. Each locale is indexed separately.

## Single purpose statement

FocusFence has a single purpose: to block websites (or parts of websites) that the user chooses, so the user can stay focused. All features (schedules, focus sessions, strict mode, password lock, stats and the block page) control when and how those user-chosen sites are blocked.

## Permission justifications

| Permission | Justification |
|---|---|
| `declarativeNetRequest` | Core feature. Creates dynamic rules that block or redirect top-level navigations to the sites on the user's blocklist, sending them to the extension's block page. Rules are evaluated by Chrome; the extension does not observe the user's traffic. |
| `storage` | Stores the user's blocklist, settings, timers, local block statistics and a salted hash of the optional password, all on the device. |
| `alarms` | Wakes the service worker at schedule boundaries, at the end of Pomodoro focus/break periods, when timed strict mode ends (and to pause strict-mode time while the extension wasn't running), and periodically to refresh the Pro license status. |
| `activeTab` | When the user opens the popup, reads the current tab's URL so the user can block the current site with one click and reload it. No access to other tabs. |
| `scripting` | Used only for Pro path rules (e.g. youtube.com/shorts) on hosts the user has granted. Registers a small content script (`spa-guard.js`) on those hosts that reports in-app URL changes (single-page-app navigation, which declarativeNetRequest cannot see) so the path can be blocked. It does not read or modify page content. |
| Optional host permission `*://*/*` | Never requested at install. When the user adds a site, the extension requests access to that site only (e.g. `*://*.reddit.com/*`). Chrome requires host access for declarativeNetRequest *redirect* rules, which show the FocusFence block page; without it the site is still blocked, with Chrome's generic error page. Access to all sites is only requested if the user explicitly asks for keyword rules to show the block page. |
| Content script on `https://extensionpay.com/*` | Part of the ExtensionPay payments library. Detects on ExtensionPay's own checkout page that a payment completed, so Pro unlocks immediately. Runs on no other site. |

**Remote code:** No. All JavaScript ships in the package, unminified. No `eval`, no remotely hosted scripts.

## Data usage disclosures (Privacy practices tab)

- Personally identifiable information: **not collected**
- Health, financial and payment information: **not collected by the extension** (payments happen on ExtensionPay/Stripe pages)
- Authentication information: **not collected** (the optional password is stored only as a local salted hash)
- Personal communications, location, web history, user activity, website content: **not collected**

Certifications (all three apply):
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

Privacy policy URL: `https://nexarion434.github.io/focusfence/privacy.html` (live since 2026-11-13). Field-by-field submission values: `store/cws-submission.md`.

## Assets

| Asset | File |
|---|---|
| Store icon 128×128 | `src/icons/icon128.png` |
| Screenshots (1280×800), 5 per language | `screenshots/` (en), `screenshots/fr/`, `screenshots/es/`, `screenshots/de/`; order and captions in `store/screenshots.md` |
| Screenshot 1 (1280×800): block page | `screenshots/store-1-block-page.png` |
| Screenshot 2 (1280×800): popup | `screenshots/store-2-popup.png` |
| Screenshot 3 (1280×800): blocklist | `screenshots/store-3-options-blocklist.png` |
| Screenshot 4 (1280×800): schedule, focus, strict | `screenshots/store-4-schedule-focus-strict.png` |
| Screenshot 5 (1280×800): stats | `screenshots/store-5-stats.png` |
| Small promo tile 440×280 | `screenshots/promo-tile-440x280.png` (+ `fr/`, `es/`, `de/` versions) |
| Package | `dist/focusfence-1.0.0.zip`: run `npm run cws:check` before uploading |
