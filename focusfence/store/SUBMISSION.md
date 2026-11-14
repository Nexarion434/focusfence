# FocusFence: Chrome Web Store submission, step by step

Every screen of the Chrome Web Store Developer Dashboard, in order, with what to paste or upload. Nothing has been submitted: you submit. Text in a code block is pasted as is. Paths are relative to `focusfence/`.

| What | Where |
|---|---|
| Package | `dist/focusfence-1.0.1.zip` (version 1.0.1, 206 KB, SHA-256 `c78a3f71231a282fc45e7620fed9799d46839151b86c081816de318608f9e405`) |
| Listing texts, per language | `store/listing/en.md`, `fr.md`, `es.md`, `de.md` |
| Images | `store/assets/` (what goes where: `store/assets/README.md`) |
| Privacy policy | https://focusfence.dev/privacy.html (French, Spanish, German under `/fr/`, `/es/`, `/de/`) |
| Support | contact@focusfence.dev |

`tests/store.spec.mjs` keeps this file, the listings, the manifest and the images consistent. Dashboard labels can move a little between dashboard versions; the values stay the same.

## 0. Before you open the dashboard

- [ ] **Merge the release PR (`release/cws-v1`) first.** It updates the privacy policy (effective November 14, 2026): the policy now says that, for Pro buyers, the ExtensionPay library keeps the email address they paid with, their plan and payment date in Chrome storage. The data-usage answers in step 4 rely on that text. GitHub Pages builds `main` `/docs`, so the new policy goes live a minute or two after the merge. Check that https://focusfence.dev/privacy.html shows the new date.
- [x] **ExtensionPay privacy link (fixed).** `https://extensionpay.com/privacy` answers HTTP 500 with `{"message":"Not found","code":404}`, as do `/privacy-policy`, `/terms` and `/legal` (checked 2026-11-14), and the home page links no privacy or terms page. The policy now links https://extensionpay.com/ and quotes the answer to "What about user privacy?" from its FAQ, word for word in English and faithfully translated in French, Spanish and German. If ExtensionPay publishes a privacy page later, link it in `store/privacy-policy*.md` and run `npm run docs`.
- [ ] Run the checks and confirm the zip:
      ```
      cd focusfence
      npm test
      npm run cws:check
      ```
      `cws:check` rebuilds the zip and must end with `PASSED`. The zip is reproducible: `sha256sum dist/focusfence-1.0.1.zip` must print the hash above.
- [ ] Load `dist/focusfence/` unpacked in your own Chrome once (chrome://extensions → Developer mode → Load unpacked): the welcome tab opens, you can block a site, and the store name reads "FocusFence – Focus App & Website Blocker".

## 1. Developer account (once)

Open https://chrome.google.com/webstore/devconsole with the Google account that will own FocusFence.

| Field | Value |
|---|---|
| Registration fee | US$5, once per account |
| 2-Step Verification | On, for the Google account (required to publish) |
| Publisher name | `FocusFence` |
| Contact email | `contact@focusfence.dev`. The dashboard sends a verification email: check it reaches iCloud Mail. Reviewers write here |
| Trader or non-trader (EU Digital Services Act) | **Trader** if you sell Pro as a business: your address, phone and email are then shown to EU users. Decide with your accountant |
| Verified site (optional, for "Official URL") | Verify `focusfence.dev` in Google Search Console as a domain property (one TXT record at Hostinger, the same step as `OWNER_TODO.md` §11) |

## 2. Package

**Items → New item**, then upload `dist/focusfence-1.0.1.zip`.

The dashboard reads these from the package, so they are not typed anywhere:

| Read from the manifest | Value |
|---|---|
| Name | `FocusFence – Focus App & Website Blocker` (40/75; fr 55, es 61, de 40) |
| Summary | `Stay focused: block distracting websites for free, with no limit. Pro adds focus sessions, strict mode and YouTube Shorts blocking.` (131/132; fr 130, es 129, de 126) |
| Version | `1.0.1` |
| Languages | English (default), French, Spanish, German |
| Icon | `icons/icon128.png` |

## 3. Store listing tab

Fill English first, then pick **Français**, **Español** and **Deutsch** in the language selector at the top and repeat the localizable fields (description and screenshots).

| Field | Value |
|---|---|
| Description | The code block under "Detailed description" in `store/listing/en.md` (`fr.md`, `es.md`, `de.md` for the other languages). About 4,100–4,900 characters each. Google doesn't document the limit; the dashboard's counter (16,000 by most accounts) has the final word |
| Category | Productivity › **Workflow & Planning**. Google's own description of it: "time trackers, tools to stay focused, to-do list managers…". If only top-level groups are shown, choose Productivity |
| Language | English is the default, from `default_locale`; the other three come from `_locales/` |
| Store icon (128×128) | `store/assets/icon-128.png` (96 px art, 16 px transparent margin) |
| Global promo video | Leave empty |
| Screenshots (1280×800), in this order | `store/assets/<lang>/1-block-page.png`, `2-popup.png`, `3-focus-session.png`, `4-strict-mode.png`, `5-blocklist.png` |
| Small promo tile (440×280) | `store/assets/promo-small-440x280.png` (the store can't localize tiles, so they carry only the logo and the name) |
| Marquee promo tile (1400×560) | `store/assets/marquee-1400x560.png` (only used if Google features FocusFence) |
| Official URL | `https://focusfence.dev` once the domain is verified (step 1); otherwise leave empty |
| Homepage URL | `https://focusfence.dev/` |
| Support URL | `https://focusfence.dev/#faq` (the FAQ ends with contact@focusfence.dev) |
| Mature content | Off |

## 4. Privacy tab

Entered once, in English. The same texts, translated for reference, are in the French, Spanish and German listing files.

### Single purpose description

```
FocusFence is a focus tool with a single purpose: helping the user stay focused by blocking the websites, or parts of websites, that the user chooses. Every feature (the block page, schedules, Pomodoro focus sessions, strict mode, the password lock and the blocked-attempt stats) controls when and how those user-chosen sites are blocked.
```

### Permission justification (one box per permission)

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

**Host permissions** (the box covers the optional `*://*/*` and the content script on `https://extensionpay.com/*`)
```
The optional host permission *://*/* is never requested at install. When the user adds a site to the blocklist, FocusFence asks for access to that site only (for example *://reddit.com/* and *://*.reddit.com/*), because Chrome only allows a redirect to the block page on sites the extension can access. If the user declines, the site is still blocked, with Chrome's error page. Access to all sites is requested only if the user asks keyword rules to show the block page. The content script on https://extensionpay.com/* is part of the ExtensionPay payments library: on ExtensionPay's own checkout pages it tells the extension that a payment went through, so Pro unlocks right away. It runs on no other site.
```

Expect reviewer questions about `*://*/*` even though it is optional; the answer is the box above.

### Remote code

Choose **No, I am not using remote code**. If a justification box appears:

```
All JavaScript ships in the package, unminified, including the ExtensionPay library (vendor/ExtPay.js, an unmodified copy of extpay 3.1.2). There is no eval and no remotely hosted script. The only network requests go to extensionpay.com, to check the Pro license.
```

### Data usage

Google's User Data FAQ (question 3): "Extensions are required to disclose how they handle user data, even when data is processed or stored locally on a user's device and is not transmitted to external servers or third parties." The earlier checklist (`store/cws-submission.md`) ticked nothing, on the reading that nothing leaves the device. That reading doesn't match the FAQ, and undisclosed handling is a common rejection reason, so tick these four:

| Category | Tick | Why |
|---|---|---|
| Personally identifiable information | **Yes** | Pro buyers: ExtensionPay returns the email they paid with, and its library keeps it in `chrome.storage.sync` |
| Health information | No | |
| Financial and payment information | **Yes** | Pro buyers: subscription status, plan and payment date, from ExtensionPay (never card details) |
| Authentication information | **Yes** | The optional password lock (stored only as a salted PBKDF2 hash) and ExtensionPay's random license key |
| Personal communications | No | |
| Location | No | The browser language's region only picks euro or dollar prices |
| Web history | **Yes** | Per-day blocked-attempt counts for each blocked site (90 days, on the device); the active tab's address when the popup opens; page addresses on sites with a path rule, checked against the list |
| User activity | No | |
| Website content | No | |

Each line matches the privacy policy as updated by the release PR. The store page will then list these categories under "Privacy". The listing explains what stays on the device.

Tick all three certifications:

- [ ] I do not sell or transfer user data to third parties, outside of the approved use cases
- [ ] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [ ] I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

```
https://focusfence.dev/privacy.html
```

## 5. Distribution tab

| Field | Value |
|---|---|
| In-app purchases | If the dashboard offers "Contains in-app purchases", tick it: Pro is bought from inside FocusFence through ExtensionPay. The store then shows an "in-app purchases" badge |
| Visibility | `Public`. For a soft launch: `Unlisted` (only people with the link) or `Private` (trusted testers set in the account settings) |
| Regions | All regions, unless your tax setup says otherwise |

## 6. Test instructions tab (optional, recommended)

Reviewers can't unlock Pro without paying. Paste this:

```
FocusFence needs no account for its free features.
1. Open a website (for example https://www.reddit.com), click the FocusFence toolbar icon and press "Block site". Accept Chrome's site-access prompt: the tab reloads to the FocusFence block page.
2. If you decline the prompt, the site is still blocked, with Chrome's error page.
3. "All settings" opens Settings: the blocklist, the Website / Path / Keyword rule types and the on/off switch.
Pro features (schedules, path and keyword rules such as youtube.com/shorts, Pomodoro focus sessions, strict mode, password lock, stats, a custom block-page message, settings export and import) are sold through ExtensionPay (Stripe). On the free plan their screens are visible and locked. Settings > Plan opens ExtensionPay's checkout.
If you test strict mode, pick the 1-hour duration: ending it early takes a 10-minute wait and a typing challenge.
Source code: https://github.com/Nexarion434/focusfence
```

Optional: let the reviewer unlock Pro for free with a Stripe promotion code (100 % off, at most 3 redemptions, expiring in 30 days; Stripe → Product catalog → Coupons, with "Use customer-facing coupon codes" on, as in ExtensionPay's discount-code guide). Add one line: `Promotion code for review: <CODE> (Settings > Plan > Choose monthly, then "Add promotion code" on the Stripe page).` Test the code yourself first, and deactivate it after the review.

## 7. Submit

- [ ] **Submit for review.** Untick "publish automatically" if you want to choose the launch moment; the dashboard then shows how long you have to publish the approved version.
- [ ] Most reviews take a few days; host permissions can make them longer. Answer reviewer emails from contact@focusfence.dev.

## 8. ExtensionPay and Stripe: check before you submit

ExtensionPay (https://extensionpay.com/home):

- [ ] The extension id is `focusfence-dev`, the `EXTPAY_ID` in `src/config.js`.
- [ ] Subscription plans and nicknames match `PRICES` in `src/config.js` exactly, in **live** mode: `monthly` US$2.99/month, `yearly` US$19.99/year, `monthly-eur` €2.99/month, `yearly-eur` €19.99/year. Settings → Plan opens `monthly`/`yearly` for every browser locale outside the eurozone and the `-eur` plans inside it.
- [ ] Stripe is connected in live mode. Unpacked installs are "development" installs, which ExtensionPay keeps in test mode (it asks for your ExtensionPay password before checkout). Installs from the store are live.
- [ ] Test the whole flow on the unpacked `dist/focusfence/` with Stripe's test card `4242 4242 4242 4242`: Pro unlocks right after paying; "Already paid? Restore purchase" unlocks a second Chrome profile through the emailed login link; offline, Settings → Plan shows the "Couldn't reach ExtensionPay" note and keeps Pro.
- [ ] **Cancelling (known gap).** For a paying user, Settings → Plan hides the plan buttons, and nothing in FocusFence opens ExtensionPay's subscription page (`extpay.openPaymentPage()` after payment, which shows Stripe's "Cancel subscription"). In test mode, find out where a subscriber can cancel (ExtensionPay's emails, the Stripe customer portal). Then either document it in the FAQ, or add a "Manage subscription" button to Settings → Plan in the next release, as ExtensionPay's docs recommend.

Stripe (https://dashboard.stripe.com):

- [ ] Account activated for live payments: business details, identity, and a bank account for payouts.
- [ ] Settings → Public details: business name `FocusFence`, support email `contact@focusfence.dev`, website `https://focusfence.dev`, statement descriptor such as `FOCUSFENCE`.
- [ ] Settings → Billing → Subscriptions and emails, as ExtensionPay recommends: Smart Retries (up to 4 times within 2 weeks), "Send emails when card payments fail" and "Send emails about expiring cards" on, and after the last failed retry cancel the subscription and mark the invoice uncollectible.
- [ ] Settings → Customer emails: receipts for successful payments and refunds on.
- [ ] Settings → Billing → Customer portal: customers can cancel their subscription and update their card.
- [ ] Settings → Payment methods: cards plus the wallets (Apple Pay, Google Pay, Link). ExtensionPay advises turning on as many methods as you can.
- [ ] Tax: the EUR plans sell to EU consumers, which brings EU VAT (One-Stop Shop) rules for digital services. Stripe Tax or your accountant (cost #5 in `OWNER_TODO.md`).

## 9. After approval

- [ ] Copy the listing URL from the dashboard: `https://chromewebstore.google.com/detail/<item id>` (32 letters a–p).
- [ ] Set `STORE_URL` in `focusfence/scripts/docs.mjs` (line 21, `null` today) to that URL, then:
      ```
      cd focusfence
      npm run docs
      npm test
      ```
      Commit `docs/` and `scripts/sitemap-dates.json` on a branch, open a PR and merge it. This turns the "Coming soon to the Chrome Web Store" status (hero and closing section of every landing page, in all four languages: "Bientôt sur le Chrome Web Store", "Muy pronto en Chrome Web Store", "Bald im Chrome Web Store") into "Add to Chrome for free" buttons, adds an "Add to Chrome" button to every page header, puts the store link in the structured data (`url`, `downloadUrl`, `installUrl`), and replaces "coming soon" in `llms.txt` with the install link.
- [ ] Update `OWNER_TODO.md` §10, the GitHub repository's Website field (https://focusfence.dev) and the marketing drafts (`marketing/README.md` waits for this link).
- [ ] Answer early reviews, and use the dashboard's Support tab or contact@focusfence.dev for questions.
- [ ] Next releases: raise `version` in `src/manifest.json` (and `package.json`), run `npm test && npm run cws:check`, then upload the new zip on the Package tab. If the UI changed, run `npm run store:assets` and replace the screenshots.
