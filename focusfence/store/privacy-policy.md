# FocusFence Privacy Policy

_Effective date: November 13, 2026_

FocusFence ("the extension") is a Chrome extension that blocks websites you choose so you can stay focused. It is built to work entirely on your device. This policy explains what the extension stores, what (very little) it ever sends over the network, and the choices you have.

## The short version

- **No account, no analytics, no tracking, no ads.** We do not run a server and we never receive your data.
- **Your blocklist, settings and stats stay on your device**, in Chrome's local extension storage.
- **The extension does not read page content.** Blocking is done by Chrome's built-in `declarativeNetRequest` engine, which matches addresses against your list without exposing your browsing to the extension.
- **The only network communication is with ExtensionPay**, and only once you choose to upgrade to Pro (details below).

## What is stored on your device

| Data | Why | Where |
|---|---|---|
| Your blocklist (domains, paths, keywords) | To block those sites | `chrome.storage.local` |
| Settings (on/off, schedule, focus timer lengths, block-page message) | To apply your preferences | `chrome.storage.local` |
| Focus-session and strict-mode timers | To keep sessions running across browser restarts | `chrome.storage.local` |
| Blocked-attempt counts per blocked site per day (last 90 days) | To show your Stats and "time reclaimed" | `chrome.storage.local` |
| Password lock: a salted PBKDF2-SHA-256 hash (never the password itself) | To protect your settings | `chrome.storage.local` |
| "Unlocked" flag for 15 minutes after you enter your password | Convenience | `chrome.storage.session` (cleared when the browser closes) |

Stats only record visits that were **blocked**, labelled by the matching rule (for example `reddit.com`). FocusFence does not keep a history of the sites you visit.

You can delete stats at any time (Settings → Stats → Clear stats). Uninstalling the extension deletes all of the data above.

## What leaves your device

**Nothing, unless you decide to upgrade to Pro.**

Payments are handled by [ExtensionPay](https://extensionpay.com), a payment service for browser extensions that uses Stripe for card processing. When you click an upgrade or "restore purchase" button:

1. The extension asks ExtensionPay for a random identifier (an API key) for your installation and opens ExtensionPay's checkout page in a new tab.
2. You enter your payment details and email **directly on ExtensionPay/Stripe pages**. FocusFence never sees or stores your card details.
3. Afterwards, the extension periodically (at browser start-up, about every 12 hours, and when you open Settings) sends that identifier to ExtensionPay to check whether your subscription is active. No browsing data, blocklist or stats are ever sent.

The ExtensionPay library stores the identifier, the install date and your subscription status in `chrome.storage.sync`. If you have Chrome Sync turned on, Chrome syncs this data to your Google account so your purchase follows you to your other computers. ExtensionPay's own privacy policy applies to the data you give them: <https://extensionpay.com/privacy>.

## Permissions and why they are needed

- **storage** — save your blocklist, settings and stats locally.
- **declarativeNetRequest** — let Chrome block or redirect navigations to sites on your list.
- **alarms** — run schedules, focus timers and strict-mode timers.
- **activeTab** — read the address of the current tab only when you open the FocusFence popup, so you can block it in one click.
- **scripting** — for path rules (e.g. `youtube.com/shorts`), register a tiny script only on that site so in-app navigation is also blocked. It only reports the page address to FocusFence; it does not read or change page content.
- **Optional site access** — requested one site at a time, when you add that site, so FocusFence can show its block page instead of Chrome's error page. If you decline, the site is still blocked.
- **extensionpay.com** — the ExtensionPay script runs only on extensionpay.com to confirm a completed payment.

## Children

FocusFence is not directed at children under 13 and does not knowingly collect personal information from anyone.

## Data sales and sharing

We do not sell, rent, or share your data. We do not use or transfer your data for purposes unrelated to the extension's single purpose, and we do not use it to determine creditworthiness or for lending.

## Changes

If this policy changes, the new version will be published at the same address with a new effective date. Material changes will be noted in the extension's release notes.

## Contact

Questions about privacy: **[CONTACT EMAIL — to be filled in before publication]**
