# FocusFence: Chrome Web Store listing, English (default)

> Field-by-field instructions: [`../SUBMISSION.md`](../SUBMISSION.md). Text in a code block is pasted as is.
> The name and the summary are read from the package (`src/_locales/en/messages.json`): they are shown here for review, not typed into the dashboard.
> The Privacy tab (single purpose, permissions, data usage) is entered once, in English, from this file. The French, Spanish and German files translate it for reference only.

## Name (from the package, 40 of 75 characters)

FocusFence – Focus App & Website Blocker

## Summary (from the package, 131 of 132 characters)

Stay focused: block distracting websites for free, with no limit. Pro adds focus sessions, strict mode and YouTube Shorts blocking.

## Category

Productivity › **Workflow & Planning**. Google describes this category as "Extensions to help users perform their tasks more efficiently. They could range from time trackers, tools to stay focused, to-do list managers, email organizers, document editors, and calendar utilities, among others." If the dashboard only offers top-level groups, pick Productivity.

## Detailed description

```
Stay focused in Chrome. FocusFence blocks the websites you open on autopilot, like a social feed or a news site, and shows a calm page in their place. The free plan blocks as many websites as you like, for as long as you use it. Pro adds focus sessions, schedules, strict mode and YouTube Shorts blocking.

Free, for as many websites as you like
• Open the FocusFence popup on a site and press "Block site", or type an address in the popup or in Settings.
• Blocking reddit.com also blocks old.reddit.com, m.reddit.com and every other subdomain.
• One switch turns blocking off for a break and back on after it.
• A blocked site shows a calm page with a quote and your blocked attempts today and this week.

FocusFence Pro: US$2.99 a month or US$19.99 a year (€2.99 or €19.99 in the eurozone)
• Focus sessions: Pomodoro rounds of 25 minutes of focus and a 5-minute break, four times by default, and you can change all three. Everything on your list stays blocked while you focus, and the minutes left show on the toolbar icon.
• Schedules: block only during the hours and on the days you choose. Overnight ranges work too, such as 22:00–06:00.
• Strict mode for when willpower runs out: pick a length from 1 hour to 1 week, or until you unlock it. Until then, blocking can't be switched off and sites can't be removed. To end it early, you wait 10 minutes, then retype eight random words.
• Block YouTube Shorts and keep YouTube: a path rule such as youtube.com/shorts blocks that section only, including Shorts you open from inside YouTube.
• Keyword rules block any address that contains a word you choose.
• Password lock: turning blocking off, removing sites or changing settings takes a password, which someone else can keep for you.
• Stats: blocked attempts per day and per site over the last 7 days.
• Your own message on the block page, and export and import of your settings as a JSON file.

Does FocusFence help with ADHD?
FocusFence isn't a medical or treatment tool. It can make your browser more ADHD-friendly by putting friction between an impulse and a feed. The sites on your list stay closed until you switch blocking off. With Pro, strict mode makes switching off take a 10-minute wait and eight retyped words, focus sessions split your work into Pomodoro rounds, and schedules start blocking at the hours you set.

Private by design
• Works without an account. Your blocklist, settings and stats stay in Chrome on your computer.
• Chrome's built-in rule engine (declarativeNetRequest) does the blocking, so FocusFence never reads the pages you visit.
• Site access is requested one site at a time, only for the sites you block. If you decline, the site is still blocked, with Chrome's error page instead of the FocusFence page.
• FocusFence contains no analytics or ad code. Its only network traffic is ExtensionPay checking your Pro license, after you choose to upgrade.
• Open source under the GNU AGPL v3. Available in English, French, Spanish and German.

Good to know
• FocusFence leaves ads alone. It blocks only what is on your list, and every other site loads as before.
• Chrome always lets you disable or remove an extension, and no extension can block the Extensions page. A timed strict session pauses while FocusFence is off, so its time can't run out in the background.
• Incognito windows are covered only if you allow FocusFence in Incognito, and FocusFence tells you when it isn't allowed.
• Other browsers, Chrome profiles and devices aren't covered.

Getting started
1. Pin FocusFence to the toolbar.
2. When you install it, pick up to three sites to block. Add more later from the popup or Settings.
3. Allow site access when Chrome asks, so FocusFence can show its block page.
4. With Pro, set your focus hours, start a focus session, or turn on strict mode before a deadline.

Payments are processed by ExtensionPay (Stripe), and you don't need a FocusFence account.
Website: https://focusfence.dev/
Privacy policy: https://focusfence.dev/privacy.html
Support: contact@focusfence.dev
Source code: https://github.com/Nexarion434/focusfence
```

## Single purpose

```
FocusFence is a focus tool with a single purpose: helping the user stay focused by blocking the websites, or parts of websites, that the user chooses. Every feature (the block page, schedules, Pomodoro focus sessions, strict mode, the password lock and the blocked-attempt stats) controls when and how those user-chosen sites are blocked.
```

## Permission justifications

One box per permission in the Privacy tab. The manifest asks for `storage`, `declarativeNetRequest`, `alarms`, `activeTab` and `scripting`, an optional host permission (`*://*/*`) and one content script (on `https://extensionpay.com/*`).

**storage**
```
Saves the user's blocklist, settings, focus-session and strict-mode timers, the blocked-attempt counts shown in the stats (kept for 90 days) and, if the user sets one, a salted hash of the settings password. All of it stays in Chrome's storage on the device. The bundled ExtensionPay payment library also keeps the Pro license record in Chrome storage.
```

**declarativeNetRequest**
```
Core feature. FocusFence turns the user's blocklist into dynamic rules. Chrome then blocks top-level navigations to those sites, or redirects them to FocusFence's own block page. Chrome evaluates the rules itself, so the extension never sees the user's traffic.
```

**alarms**
```
Wakes the service worker once a minute to start or stop blocking at the user's schedule boundaries, update the countdown on the toolbar icon and pause a timed strict mode while the extension wasn't running; at the end of each Pomodoro focus or break period; when a timed strict mode ends; and every 12 hours to refresh the Pro license status.
```

**activeTab**
```
When the user opens the popup, FocusFence reads the active tab's address to show which site it is and to block it in one click, then reloads that tab so the block takes effect. It never accesses other tabs.
```

**scripting**
```
Used only for Pro path rules (such as youtube.com/shorts), and only on sites the user granted access to. FocusFence registers a small content script, spa-guard.js, on those sites. Single-page apps change the address without a real navigation, which declarativeNetRequest can't see, so the script reads only the page address, reports changes to the service worker and sends the tab to the block page when the address matches a rule. It never reads or changes page content.
```

**Host permissions**
```
The optional host permission *://*/* is never requested at install. When the user adds a site to the blocklist, FocusFence asks for access to that site only (for example *://reddit.com/* and *://*.reddit.com/*), because Chrome only allows a redirect to the block page on sites the extension can access. If the user declines, the site is still blocked, with Chrome's error page. Access to all sites is requested only if the user asks keyword rules to show the block page. The content script on https://extensionpay.com/* is part of the ExtensionPay payments library: on ExtensionPay's own checkout pages it tells the extension that a payment went through, so Pro unlocks right away. It runs on no other site.
```

## Remote code

Answer **No, I am not using remote code**. If the dashboard asks for a justification:

```
All JavaScript ships in the package, unminified, including the ExtensionPay library (vendor/ExtPay.js, an unmodified copy of extpay 3.1.2). There is no eval and no remotely hosted script. The only network requests go to extensionpay.com, to check the Pro license.
```

## Data usage

Google asks extensions to disclose user data they handle "even when data is processed or stored locally on a user's device and is not transmitted to external servers or third parties" ([User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), question 3). Each answer below matches the [privacy policy](https://focusfence.dev/privacy.html).

| Dashboard category | Tick | What FocusFence handles |
|---|---|---|
| Personally identifiable information | **Yes** | Pro buyers only: the email address they paid with. ExtensionPay returns it with the license record and its library keeps it in Chrome storage (`chrome.storage.sync`). FocusFence never sends it anywhere. |
| Health information | No | Nothing. |
| Financial and payment information | **Yes** | Pro buyers only: subscription status, plan and payment date, returned by ExtensionPay. Card details are typed on Stripe's checkout page and never reach the extension. |
| Authentication information | **Yes** | The optional password lock: the password is turned into a salted PBKDF2 hash on the device and only the hash is stored. Also the random license key ExtensionPay issues to the installation. |
| Personal communications | No | Nothing. |
| Location | No | No location is read. The region in the browser's language setting (for example fr-FR) only picks euro or dollar prices. |
| Web history | **Yes** | Blocked-attempt counts per blocked site and per day, kept on the device for 90 days for the stats; the active tab's address when the popup is opened; on sites with a path rule, the page address, checked against the list. None of it is sent anywhere. |
| User activity | No | No clicks, keystrokes, mouse movements or network traffic are recorded. |
| Website content | No | Page content is never read. |

Tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy

`https://focusfence.dev/privacy.html`

The same policy in French, Spanish and German: `https://focusfence.dev/fr/privacy.html`, `https://focusfence.dev/es/privacy.html`, `https://focusfence.dev/de/privacy.html`.

## Links and contact

| Field | Value |
|---|---|
| Homepage URL | `https://focusfence.dev/` |
| Support URL | `https://focusfence.dev/#faq` (the FAQ ends with the support address) |
| Support email | `contact@focusfence.dev` |

## Screenshots and promo images

Upload in this order, from [`../assets/en/`](../assets/en/) (captions in [`../assets/README.md`](../assets/README.md)):

1. `1-block-page.png`: Fence off distracting websites.
2. `2-popup.png`: Block the site you're on.
3. `3-focus-session.png`: Work in Pomodoro rounds. (Pro)
4. `4-strict-mode.png`: Lock it in before a deadline. (Pro)
5. `5-blocklist.png`: Block a whole website. Or just the bad part.

Store icon, small promo tile and marquee (the same in every language): `../assets/icon-128.png`, `../assets/promo-small-440x280.png`, `../assets/marquee-1400x560.png`.

## Search notes

- The name keeps the brand first, then the positioning ("Focus App"), then the query with the most intent in the store, "Website Blocker". No other brand appears in the name, which Google treats as keyword spam.
- The summary leads with the outcome (stay focused), then the free promise, then three Pro features people search for: focus sessions, strict mode and YouTube Shorts.
- The description says "ADHD-friendly" once, inside an honest answer that opens with "isn't a medical or treatment tool". "website blocker for adhd" and "adhd chrome extension" are searched, and their results are mostly store listings (`COPY_CHANGES.md`, round 2).
- Each other phrase appears once, in a sentence: block distracting websites, block YouTube Shorts, Pomodoro, schedules, strict mode, password lock. There's no keyword list and no claim about another product.
- The description never calls FocusFence an ad blocker. "Good to know" says it leaves ads alone, as the website's FAQ does.
