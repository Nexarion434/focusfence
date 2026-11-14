# Chrome Web Store images

Made by `npm run store:assets` (`scripts/store-assets.mjs`); don't edit them by hand. Every screenshot is the real extension, captured from the current `src/` in its dark theme, at 2x, from the same demo state as the website (`scripts/demo-seed.mjs`). Each one sits in a browser window under a caption, both drawn with the website's own stylesheet (`scripts/site.css`). Captions live in `store/screenshots.json`. `tests/store.spec.mjs` checks every size and format below.

| File | Size | Dashboard field |
|---|---|---|
| `icon-128.png` | 128×128, PNG with transparency | Store icon. A copy of `src/icons/icon128.png`: 96 px art in a 16 px transparent margin, as Google asks |
| `promo-small-440x280.png` | 440×280, 24-bit PNG | Small promo tile |
| `marquee-1400x560.png` | 1400×560, 24-bit PNG | Marquee promo tile |
| `en/`, `fr/`, `es/`, `de/` | 5 × 1280×800, 24-bit PNG | Screenshots, uploaded in each language of the listing |

The promo tiles show the logo and the name over the website's closing scene: the glass-pill fence on its glossy floor, the middle pill holding the light. The store can't localize them, and Google asks for little or no text on them, so they carry no tagline.

## Screenshots, in upload order

| # | File | Scene (real UI) | English caption |
|---|---|---|---|
| 1 | `1-block-page.png` | The block page for reddit.com: 5 blocked today, 89 this week | **Fence off** distracting websites. Sites on your list open this calm page instead. Free for as many websites as you like. |
| 2 | `2-popup.png` | The toolbar popup on a site that isn't blocked yet, with the one-click Block site button | **Block the site** you're on. Open FocusFence on any site and press Block site. Its subdomains are blocked too. |
| 3 | `3-focus-session.png` | Settings › Focus: a Pomodoro session at 18:42, round 1 of 4, and the minutes left on the toolbar icon (PRO) | **Work in Pomodoro rounds.** Your list stays blocked. 25 minutes of focus and a 5-minute break, four times by default. The minutes left show on the toolbar icon. |
| 4 | `4-strict-mode.png` | Settings › Strict mode, on, with an unlock requested: the 10-minute cooling-off at 08:24 (PRO) | **Lock it in** before a deadline. While it's on, blocking can't be switched off. Ending early takes a 10-minute wait, then eight retyped words. |
| 5 | `5-blocklist.png` | Settings › Blocklist: the Website / Path / Keyword composer and six rules, including youtube.com/shorts and a keyword | **Block a whole website.** Or just the bad part. Subdomains are included for free. With Pro, block a path such as youtube.com/shorts, or any keyword. |

The other languages use the same scenes, with the extension's own interface and the captions in that language (`store/screenshots.json`):

| # | Français | Español | Deutsch |
|---|---|---|---|
| 1 | Clôturez les sites qui vous distraient. | Ponle una valla a las distracciones. | Ablenkende Websites bleiben draußen. |
| 2 | Bloquez le site où vous êtes. | Bloquea la web en la que estás. | Blockiere die Seite, auf der du bist. |
| 3 | Travaillez par cycles. Votre liste reste bloquée. | Trabaja por rondas. Tu lista sigue bloqueada. | Arbeite in Runden. Deine Liste bleibt blockiert. |
| 4 | Verrouillez tout avant une échéance. | Ciérralo con llave antes de una entrega. | Schließ dich ein, bevor die Deadline kommt. |
| 5 | Bloquez tout le site. Ou juste la mauvaise partie. | Bloquea la web entera. O solo la parte mala. | Ganze Website sperren. Oder nur den schlechten Teil. |

Why this order: the block page is the screen people live with and the brand's signature (the glass-pill fence), so it leads; the popup is the core free action; then the three focus tools: focus sessions, strict mode and precise rules. Pro scenes say PRO in their caption.

## Regenerate

```
cd focusfence
npm run store:assets              # all four languages, the promo tiles and the icon
node scripts/store-assets.mjs --lang fr   # one language (screenshots only)
```

Run it after any change to the extension's interface, to `store/screenshots.json` or to the website's stylesheet. The script fails if a caption doesn't fit, if the Settings top bar overflows in any language, or if an image isn't exactly the size the store expects.
