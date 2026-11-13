# Chrome Web Store screenshots: plan and captions

Five screenshots, **1280×800 PNG**, uploaded in this order. The first one is the most important: it shows in search results and at the top of the listing.
Captions live in [`screenshots.json`](screenshots.json), the single source used by `npm run screenshots`. Edit the texts there, never in the images.

| # | File | Kicker | Headline | Subtitle | What the UI shows | Why it's in this slot |
|---|---|---|---|---|---|---|
| 1 | `screenshots/store-1-block-page.png` | BLOCK PAGE | **Distractions hit a calm wall** | Blocked sites show a gentle reminder and today's reclaimed time, not an error. | `reddit.com is fenced off`, quote, "5 blocked today · 25 min reclaimed · 89 this week", *Back to work* | The moment users will actually live with. It is distinctive and calm, unlike competitors' red stop signs. |
| 2 | `screenshots/store-2-popup.png` | (brand) | **Fence off the endless feeds.** | Block distracting sites in one click, or just the worst part, like YouTube Shorts. + 4 bullet benefits | Toolbar popup over instagram.com: one-click **Block site**, Pro focus session running (18:42) | Shows the core action (one click) and the differentiator (Shorts-only blocking). |
| 3 | `screenshots/store-3-options-blocklist.png` | BLOCKLIST | **Block whole sites, or just the worst part** | Subdomains included. Pro blocks paths like youtube.com/shorts, or any keyword. | Blocklist with domains, a path rule (`youtube.com/shorts`) and a keyword (`poker`); Website / Path / Keyword switch | Answers the question "does it block old.reddit.com / m.youtube.com?" and shows Pro precision. |
| 4 | `screenshots/store-4-schedule-focus-strict.png` | SCHEDULES · FOCUS · STRICT MODE | **Focus on your schedule** | Block during work hours, run Pomodoro sessions, lock it in with strict mode. | Two weekday time ranges, Pomodoro settings (25/5 × 4), strict-mode start | Groups the three Pro features people search for (schedule, pomodoro, strict). |
| 5 | `screenshots/store-5-stats.png` | PRIVATE STATS | **See the time you take back** | Blocked attempts per site and per day, counted on your device only. | 7-day bar chart (decreasing), top sites, "7h 25m reclaimed" | Motivation plus the privacy promise; closes the scroll on a positive result. |

Small promo tile (440×280): `screenshots/promo-tile-440x280.png`, "Fence off distractions. Get your focus back."

## Rules followed

- Real UI only: every screen is the actual extension rendered by Playwright with seeded demo data, no mock-ups. Store policy forbids misleading imagery.
- One message per image, readable at thumbnail size: 46 px headline, one-line subtitle.
- No third-party logos or trademarks in the artwork. Site names appear only as text inside the real UI.
- Same frame, colours and type across all five, so the set reads as one product.
- Environment-dependent warnings (e.g. "Incognito windows are not blocked") are hidden in marketing shots only. The real product shows them.

## Regenerate

```bash
cd focusfence
npm run screenshots            # light mode (store set)
node scripts/screenshots.mjs --dark   # optional dark-mode variants (*-dark.png)
```

Raw, uncaptioned UI captures are written next to them (`block-page.png`, `popup.png`, `options*.png`). The landing page in `docs/` uses those.
