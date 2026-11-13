# Chrome Web Store screenshots: plan and captions

Five screenshots, **1280×800 PNG**, uploaded in this order, in **four languages**: English (`screenshots/`), French (`screenshots/fr/`), Spanish (`screenshots/es/`) and German (`screenshots/de/`). Each folder also has its own 440×280 promo tile. The first one is the most important: it shows in search results and at the top of the listing.
Captions live in [`screenshots.json`](screenshots.json), the single source used by the screenshot script. Edit the texts there, never in the images. The UI inside each image is the real extension running in that language.

| # | File | Kicker | Headline | Subtitle | What the UI shows | Why it's in this slot |
|---|---|---|---|---|---|---|
| 1 | `screenshots/store-1-block-page.png` | BLOCK PAGE | **Distractions hit a calm wall** | Blocked sites show a gentle reminder and today's count, not an error. | `reddit.com is fenced off`, quote, "5 blocked today · 89 this week", *Back to work* | The moment users will actually live with. It is distinctive and calm, unlike competitors' red stop signs. |
| 2 | `screenshots/store-2-popup.png` | (brand) | **Fence off the endless feeds.** | Block distracting sites in one click, or just the worst part, like YouTube Shorts. + 4 bullet benefits | Toolbar popup over instagram.com: one-click **Block site**, Pro focus session running (18:42) | Shows the core action (one click) and the differentiator (Shorts-only blocking). |
| 3 | `screenshots/store-3-options-blocklist.png` | BLOCKLIST | **Block whole sites, or just the worst part** | Subdomains included. Pro blocks paths like youtube.com/shorts, or any keyword. | Blocklist with domains, a path rule (`youtube.com/shorts`) and a keyword (`poker`); Website / Path / Keyword switch | Answers the question "does it block old.reddit.com / m.youtube.com?" and shows Pro precision. |
| 4 | `screenshots/store-4-schedule-focus-strict.png` | SCHEDULES · FOCUS · STRICT MODE | **Focus on your schedule** | Block during work hours, run Pomodoro sessions, lock it in with strict mode. | Two weekday time ranges, Pomodoro settings (25/5 × 4), strict-mode start | Groups the three Pro features people search for (schedule, pomodoro, strict). |
| 5 | `screenshots/store-5-stats.png` | PRIVATE STATS | **See what you skipped** | Blocked attempts per site and per day, counted on your device only. | 7-day bar chart (decreasing), top sites, blocked today / this week | Motivation plus the privacy promise; closes the scroll on a positive result. |

Small promo tile (440×280): `promo-tile-440x280.png` in each language folder:

| Lang | Headline | Subtitle |
|---|---|---|
| en | Fence off distractions. Get your focus back. | Block sites, schedule focus, stay in strict mode. |
| fr | Bloquez les distractions. Retrouvez votre concentration. | Bloquez des sites, planifiez, passez en mode strict. |
| es | Bloquea distracciones. Recupera la concentración. | Bloquea webs, planifica tu foco, usa el modo estricto. |
| de | Ablenkungen aussperren. Fokus zurückholen. | Seiten sperren, Fokus planen, strikter Modus. |

## Translated captions (fr, es, de)

| # | Lang | Kicker | Headline | Subtitle |
|---|---|---|---|---|
| 1 | fr | Page de blocage | **Les distractions butent sur un mur apaisant** | Les sites bloqués affichent un rappel bienveillant et le compte du jour, pas une erreur. |
| 1 | es | Página de bloqueo | **Las distracciones chocan con un muro tranquilo** | Las webs bloqueadas muestran un recordatorio amable y el recuento de hoy, no un error. |
| 1 | de | Sperrseite | **Ablenkungen prallen an einer ruhigen Wand ab** | Gesperrte Seiten zeigen eine freundliche Erinnerung und den heutigen Zähler – keinen Fehler. |
| 2 | fr | En un clic | **Bloquez les fils sans fin.** | Bloquez les sites qui vous distraient en un clic, ou seulement le pire, comme YouTube Shorts. |
| 2 | es | Con un clic | **Corta los feeds infinitos.** | Bloquea las webs que te distraen con un clic, o solo lo peor, como YouTube Shorts. |
| 2 | de | Ein Klick | **Schluss mit endlosen Feeds.** | Blockiere ablenkende Seiten mit einem Klick – oder nur das Schlimmste, wie YouTube Shorts. |
| 3 | fr | Liste de blocage | **Bloquez un site entier, ou juste le pire** | Sous-domaines compris. Pro bloque des chemins comme youtube.com/shorts, ou un mot-clé. |
| 3 | es | Lista de bloqueo | **Bloquea webs enteras, o solo lo peor** | Subdominios incluidos. Pro bloquea rutas como youtube.com/shorts o una palabra clave. |
| 3 | de | Sperrliste | **Ganze Seiten sperren – oder nur das Schlimmste** | Subdomains inklusive. Pro sperrt Pfade wie youtube.com/shorts oder Stichwörter. |
| 4 | fr | Horaires · Concentration · Mode strict | **Concentrez-vous selon vos horaires** | Bloquez pendant le travail, lancez des sessions Pomodoro, verrouillez avec le mode strict. |
| 4 | es | Horarios · Concentración · Modo estricto | **Concéntrate según tu horario** | Bloquea en horas de trabajo, haz sesiones Pomodoro y blíndalo con el modo estricto. |
| 4 | de | Zeitpläne · Fokus · Strikter Modus | **Fokus nach deinem Zeitplan** | Sperre während der Arbeit, starte Pomodoro-Sitzungen, sichere alles mit dem strikten Modus. |
| 5 | fr | Statistiques privées | **Voyez ce que vous avez évité** | Tentatives bloquées par site et par jour, comptées uniquement sur votre appareil. |
| 5 | es | Estadísticas privadas | **Mira lo que has evitado** | Intentos bloqueados por web y por día, contados solo en tu dispositivo. |
| 5 | de | Private Statistik | **Sieh, was du ausgelassen hast** | Blockierte Versuche pro Seite und Tag, nur auf deinem Gerät gezählt. |

In the dashboard, upload each set under its language: **Store listing → language → Screenshots**.

## Rules followed

- Real UI only: every screen is the actual extension rendered by Playwright with seeded demo data, no mock-ups. Store policy forbids misleading imagery.
- One message per image, readable at thumbnail size: 46 px headline (shrunk automatically if a translation is longer), subtitle on one line where possible.
- No third-party logos or trademarks in the artwork. Site names appear only as text inside the real UI.
- Same frame, colours and type across all five, so the set reads as one product.
- Environment-dependent warnings (e.g. "Incognito windows are not blocked") are hidden in marketing shots only. The real product shows them.

## Regenerate

```bash
cd focusfence
npm run screenshots:all                 # en + fr + es + de
node scripts/screenshots.mjs --lang fr  # one language
node scripts/screenshots.mjs --dark     # optional dark-mode variants (*-dark.png, English)
```

Raw, uncaptioned UI captures are written next to them (`block-page.png`, `popup.png`, `options*.png`). The landing page in `docs/` uses those.
