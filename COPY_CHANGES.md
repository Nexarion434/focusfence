# FocusFence landing page: copy changes

Branch `seo/audit-v1`, 2026-11-14. The landing page text lives in `focusfence/scripts/site-strings.mjs` (one block per language). `npm run docs` builds `docs/` from it. The SEO side of the same work is in [SEO_AUDIT.md](SEO_AUDIT.md).

There were two passes. **Round 2** (first below, the latest) repositions the page around focus after the owner's review. **Round 1** is the full rewrite it builds on. Where they differ, round 2 is current.

## Round 2: a focus app first, never an ad blocker

**The feedback.** The page read like a generic blocker, and could be mistaken for an ad blocker. FocusFence is a focus app: it cuts off the sites you open on autopilot (feeds, Shorts, news), with focus sessions, schedules and strict mode. Blocking is how it works, not what it is. The owner also asked for an honest ADHD angle, with no medical claims.

**Diagnosis (copywriting): still situation B**, a real voice, with a positioning change the owner asked for. After round 1, "block" or "blocker" opened the badge, the title, the description, the subhead, the secondary button, the statement under the hero and the footer, and nothing near the top said what kind of blocking. Search behaviour shows why that matters: Google's first completion for "adhd app to block" is "adhd app to block ads". The pass keeps the voice, the fence metaphor and the honest FAQ, and changes the category the page names first. Blocking stays the mechanism in the sections that explain it.

Skills used, as in round 1: copywriting (diagnosis, unit by unit, the three-question gate and the AI-tell rules), then cro (below).

### What changed in English, and why

Before is round 1 (`558a7f7`); after is this commit.

| Unit | Before | After | Why |
|---|---|---|---|
| Badge (the start of the `<h1>`) | Website blocker for Chrome | Focus app for Chrome | The first words on the page are the category the reader files FocusFence under. "focus app chrome" and "focus extension chrome" are Google suggestions |
| Headline | Fence off the endless feeds. | Fence off distracting websites. | Same fence verb; the object is now the phrase people search for ("block distracting websites"). The whole `<h1>` reads "Focus app for Chrome — Fence off distracting websites.": a focus term plus "distracting websites", as asked |
| Subhead | Block the sites you open on autopilot, as many as you like, on the free plan. With Pro, block only YouTube Shorts, or turn on strict mode when willpower runs out. | Stay focused and get deep work done. FocusFence blocks the sites you open on autopilot, unlimited on the free plan. Pro adds focus sessions, strict mode and YouTube Shorts blocking. | Outcome first, then how, then what is free and what Pro adds. It stays within the hero's length budget: the layout test keeps the product captures on the first screen at 1440×900 and 390×844. "When willpower runs out" didn't fit; strict mode is still named. Keyword blocking, in the owner's example, didn't fit either; it is in the pricing list and the "Is FocusFence free?" answer |
| Secondary button | See what it blocks | See how it works | "What it blocks" invites the ad-blocker reading. It still leads to the Block section, which shows the block page and how a site gets on the list |
| Statement under the hero | A calm, private website blocker for Chrome. | A calm, private focus app for Chrome. | Same sentence, new category. Its second half ("Block a whole site, or only its worst part…") already describes the mechanism |
| Focus section heading | Block websites on a schedule. Or lock yourself in. | Protect your focus hours. Or lock yourself in. | The section is about time (schedules, Pomodoro sessions, strict mode), and the heading now names what the reader protects |
| Footer tagline (also the web manifest's description) | A calm, private website blocker for Chrome. | A calm, private focus app for Chrome that blocks distracting websites. | Category, then mechanism, in one line |
| Title tag | Free Website Blocker Extension for Chrome \| FocusFence | FocusFence: Block Distracting Websites & Stay Focused | The owner's example without "(Free Chrome Extension)", which would make it 77 characters against a limit of 60. "Free" and "Chrome" moved to the description. Brand first, as in the example. 53 characters |
| Meta description | Block distracting websites in Chrome in one click, with no limit on the free plan. Pro adds YouTube Shorts blocking and schedules. | A free productivity extension for Chrome that blocks distracting websites, with no limit. Pro adds focus sessions and strict mode. | Names the category the store uses (Productivity) and keeps free, Chrome, distracting websites and unlimited. 130 characters |
| Privacy page title | Privacy Policy \| FocusFence Website Blocker | Privacy Policy \| FocusFence for Chrome | Drops the blocker label |
| Open Graph card and its alt text | Website blocker for Chrome / Fence off the endless feeds. | Focus app for Chrome / Fence off distracting websites. | Same generator (`npm run site:art`); the headline stays on one line in every language |
| Structured data | `applicationSubCategory`: "Website blocker for Chrome" | "Productivity" (Productivité, Productividad, Produktivität) | The store category is Productivity → Tools (`focusfence/store/listing.md`). `applicationCategory` stays `BrowserApplication`, because Google's list of supported values has no productivity category |
| FAQ, 2nd question (new) | | Is FocusFence an ad blocker? | See below |
| FAQ, 4th question (new) | | Does FocusFence help with ADHD? | See below |
| 404 page, `llms.txt` | "website blocker" | "focus app"; `llms.txt` also says that FocusFence does not block ads | Assistants describe the product from these lines |

Unchanged on purpose: the sections that explain the mechanism ("Block a whole website. Or just the bad part.", "Block YouTube Shorts, keep YouTube"), the how-to question ("How do I block a website in Chrome?"), pricing ("Unlimited websites, free forever"), the ticks under the CTA, the closing line, and the French description's "applique vos horaires" from the previous fix.

### French, Spanish, German

Written for each market, with the same structure:

| Unit | French | Spanish | German |
|---|---|---|---|
| Badge | Appli de concentration pour Chrome | App de concentración para Chrome | Fokus-App für Chrome |
| Headline | Clôturez les sites qui vous distraient. | Ponle una valla a las distracciones. | Zäunen Sie Ablenkungen ein. |
| Subhead opens with | Restez concentré au travail. | Concéntrate en tu trabajo. | Bleiben Sie konzentriert. |
| Title | FocusFence : bloquer les sites distrayants, rester concentré | FocusFence: bloquear páginas que distraen y concentrarte | FocusFence: Ablenkende Websites blockieren, Fokus behalten |
| Description | Extension Chrome gratuite et illimitée contre les distractions. Pro ajoute des sessions de concentration et applique vos horaires. | Extensión gratis para bloquear páginas web que te distraen, sin límite. Pro añade sesiones de concentración y aplica tus horarios. | Kostenlose Chrome-Erweiterung, die ablenkende Websites unbegrenzt sperrt. Pro bringt Fokus-Sitzungen und wendet Zeitpläne an. |

- **French** uses the owner's phrasing ("les sites qui vous distraient", "rester concentré"). "Appli" rather than "application" keeps the badge on one line on phones. The subhead opens with "Restez concentré au travail.", which says what the title promises, as the English "Stay focused" does. It is also the autocomplete phrase ("rester concentré au travail"). A first draft opened with "Gardez la tête au travail."; with it, the audit tool reported that the French title's words weren't visible on the page ("schema name not found in visible content").
- **Spanish:** "Ponle una valla a las webs que te distraen" was the first choice. On a 1440×900 screen it wraps to two lines and pushes the block-page capture below the first screen (the layout test fails), so the headline says "las distracciones", and the title and description carry "páginas (web) que (te) distraen".
- **German:** "Zäunen Sie ablenkende Websites ein" wraps to three lines on phones, and at 360×800 the captures fall below the first screen. "Ablenkungen" fits; "ablenkende Websites" is in the title, the description and the footer. The description says "wendet Zeitpläne an" without "Ihre": with it, the audit tool estimated 934 px, over the ~920 px a snippet shows. The verb from the earlier fix stays.

### "Is FocusFence an ad blocker?"

> No. FocusFence is a focus app, and it leaves ads alone. It blocks only what you put on your list, such as a social network, YouTube Shorts or a news site. Every other site loads exactly as before.

It is the second question, near the top of the list. Checked in the code: FocusFence changes nothing on pages it doesn't block. It runs a script inside web pages in two cases only: `src/spa-guard.js`, on hosts that have a path rule and that you allowed (it reports URL changes to the extension and never reads or edits the page), and ExtensionPay's own script on extensionpay.com while you pay for Pro (`content_scripts` in `src/manifest.json`). The French, Spanish and German questions use each language's usual term: *bloqueur de publicités*, *bloqueador de anuncios*, *Werbeblocker*.

### ADHD

**Where it appears:** one FAQ entry per language (the fourth question), and nowhere in the hero, title or description. The owner asked for no keyword stuffing, and these are the most visible places. The answer:

> FocusFence isn't a medical or treatment tool. It can make your browser more ADHD-friendly by putting friction between an impulse and a feed. The sites on your list stay closed until you switch blocking off. With Pro, strict mode makes switching off take a 10-minute wait and eight retyped words, focus sessions split your work into Pomodoro rounds, and schedules start blocking at the hours you set.

- It opens with the disclaimer, then ties "ADHD-friendly" to things the reader can check: friction (blocking, then strict mode), structure (Pomodoro rounds) and not having to remember (schedules). The first two sentences have the "isn't X. It can Y" shape that the AI-tell rules avoid; here it is deliberate, because an honest answer starts with what the product isn't.
- Facts from the code: ending strict mode early takes 10 minutes and eight retyped words (`STRICT_UNLOCK_DELAY_MS`, `makeChallenge`). Schedules block only inside the hours you set, with the main switch on, while strict mode and focus sessions keep blocking on even if the switch is off (`blockingStatus` in `src/lib/core.js`).
- French says "adapté au TDAH" (people also type "application tdah friendly"), Spanish "más adaptado al TDAH", German "ADHS-freundlicher". The German disclaimer reads "kein Medizinprodukt und keine Therapie", the usual legal wording.
- A test guards all this (`positioning` in `focusfence/tests/docs.spec.mjs`): one ADHD question per language; an answer that opens with the medical disclaimer; none of cure, treats, heals, clinically, proven, guaranteed or their French, Spanish and German equivalents. The same test checks that only that FAQ entry mentions ad blockers, that the title, description, badge, subhead, statement and footer carry the focus term, and that the structured data says Productivity.

**Claims declined, and what would unlock them:**

| Claim | Why it is not on the page | What would unlock it |
|---|---|---|
| "ADHD-friendly" or "for ADHD" in the badge, headline, title or description | A health-related promise in the most visible places, for a product no one with ADHD has tested on record | Feedback from users with ADHD (interviews, or quotes they agree to publish); then the store listing first |
| "Helps with ADHD symptoms", "beat procrastination", any number | Medical or outcome claims; nothing was measured | A published study on website blockers and ADHD, cited as general evidence, never as proof of FocusFence's effect |
| "Designed with ADHD experts", "recommended by CHADD or ADDitude" | Not true. CHADD's Attention magazine has an article on Chrome extensions against distraction ([December 2020](https://chadd.org/attention-article/use-chrome-extensions-to-reduce-distraction-and-increase-productivity/)), and a "Dear ADHD Family Coach" column suggests adding friction before each phone unlock ([Order Out of Chaos](https://oooc.squarespace.com/dear-adhd-family-coach/i-need-a-digital-detox-how-do-i-break-a-social-media-habit)). Neither mentions FocusFence, and only their search snippets were read | An expert who reviews the product and agrees to be named. For articles, read and quote the full source |

### Keyword re-check

Google's public autocomplete on 2026-11-14 (no paid tools, so no volumes), plus one search per ADHD query to see what ranks:

| Language | Terms checked (suggestions worth noting) | Where they are now |
|---|---|---|
| EN | block distracting websites (…chrome, …extension); focus extension chrome and focus app chrome (focus app chrome extension, focus mode extension chrome); stay focused (the "stay focused chrome extension" completions read like searches for one product, StayFocusd); productivity extension (productivity extensions chrome, best productivity extensions for chrome); distraction blocker (…chrome extension) | Title: "Block Distracting Websites", "Stay Focused". Headline and footer: "distracting websites". Subhead: "Stay focused". Badge, statement, footer and card: "focus app". Description and structured data: "productivity" |
| EN, ADHD | adhd website blocker (…chrome, …extension, …chrome extension); website blocker for adhd (…adults, …students, …free); adhd chrome extension (adhd friendly chrome extension, adhd focus chrome extension); adhd focus app | The FAQ question and answer ("ADHD", "ADHD-friendly"). The results are mostly store listings of small ADHD-named extensions (ADHD Website Blocker, Monora, ImpulsePause, Pls Stop Me, Tomato Timeout) and vendor blogs, so the store listing and an article (ideas below) are where these queries can rank |
| FR | application concentration (…gratuite, …pc, …travail); rester concentré au travail; tdah application (…adulte, …gratuite, application tdah friendly) | Badge "Appli de concentration", title "rester concentré", FAQ "TDAH" and "adapté au TDAH" |
| ES | app para concentrarse; app para bloquear distracciones, aplicaciones para bloquear distracciones; concentrarse en el trabajo; tdah app | Badge "App de concentración", headline "las distracciones", subhead "Concéntrate en tu trabajo", FAQ "TDAH" |
| DE | fokus app (mostly Apple's Focus mode); konzentriert bleiben app; adhs app (…kostenlos, …erwachsene); adhs konzentration verbessern erwachsene | Badge "Fokus-App", subhead "Bleiben Sie konzentriert", title "Fokus behalten", FAQ "ADHS" |

The trade-off: the English, French and German titles no longer say "website blocker" (*bloqueur de sites*, *Website-Blocker*). Those queries return 9–10 store listings out of 10 (see SEO_AUDIT.md), so the store listing, whose name still says "Website Blocker", is the page that can rank for them. "Block distracting websites" has a mixed results page (5 listings, 5 articles), where a landing page has a better chance. SEO_AUDIT.md has the updated targets.

### Conversion review (cro)

**The five-second test on the first screen:** what it is (a focus app for Chrome), what it does (fences off distracting websites), what is free (unlimited sites, no account) and what Pro adds (focus sessions, strict mode, Shorts). The captures under the text show the popup's focus-session control and a "reddit.com is fenced off" page. Nothing there suggests ads.

**Quick wins, done in this pass:** the category first in the badge, title, statement, footer and card; an outcome-first subhead; a secondary button without the "blocks" ambiguity; the two new objections answered high in the FAQ (ad blocker 2nd, ADHD 4th); structured data in the store's category.

**High impact, needs the owner:**

1. **`STORE_URL`** (unchanged from round 1). Before launch the primary CTA is the "Coming soon to the Chrome Web Store" status, so "See how it works" is the only active button in the hero. Under 720 px the stylesheet hides it, so a phone visitor has nothing to tap on the first screen. Showing it on phones is a design call: it would push the product captures down, and the layout test would have to allow that.
2. **Match the store listing to the site.** The store title is still "FocusFence – Website Blocker & Pomodoro Focus Timer", from `src/_locales/*/messages.json`. A visitor who arrives from the site should find the same category there. One option that keeps the store's highest-intent query is "FocusFence – Focus App & Website Blocker". It changes the extension build, so it isn't part of this PR (OWNER_TODO.md §11).
3. **Talk to a few users with ADHD** before saying more than the FAQ does. That is the unlock for the claims declined above.

**Test ideas.** The site has no analytics, by design, so tests run one after the other and are read in Search Console (click-through rate per title) and, after launch, in the store dashboard (installs):

- Badge: "Focus app for Chrome" against "Distraction blocker for Chrome", the owner's other option. It matches "distraction blocker chrome extension", but it puts "blocker" first again.
- Title: "FocusFence: Block Distracting Websites & Stay Focused" against "Focus App for Chrome: Block Distracting Websites | FocusFence" (59 characters), four weeks each, comparing click-through at similar average positions.
- FAQ order: the ad-blocker question first, if store reviews or support mail show that the confusion persists.

**Alternatives considered:**

- Headline. A (shipped): "Fence off distracting websites." keeps the brand verb and the search phrase, on one line on desktop in every language. B: "Stay focused. Fence off distracting websites." puts the outcome in the headline, but it broke the hero layout in French, Spanish and German. C: "Block the sites you open on autopilot." is literal, but it drops the fence and puts "block" first again.
- Badge. A (shipped): "Focus app for Chrome". B: "Focus extension for Chrome" is the exact suggestion and more precise, but "app" is the word most people use. C: "Distraction blocker for Chrome" (see the test ideas).
- Secondary button. A (shipped): "See how it works". B: "See the focus tools", jumping to the Focus section; its three cards are all Pro, so the free plan would come second.

### Blog article ideas for the ADHD angle

Numbered after the five in round 1:

6. **Website blockers and ADHD: what a blocker can and can't do.** Targets: *website blocker for adhd*, *adhd website blocker chrome*, *adhd friendly chrome extension*. The results today are store listings and vendor blogs, so a candid guide has room. The angle: friction instead of willpower. What blocking helps with (no one-click route to the feed, a slow way out, timed structure) and what it can't do (it isn't treatment, and any extension can be switched off from Chrome's extensions page). Read CHADD's and ADDitude's material in full before citing it, use no statistic without a primary source, and ask someone with ADHD to review the draft.
7. **A focus setup for ADHD in Chrome: three sites, one schedule, one strict session.** Targets: *adhd focus app chrome*, *adhd chrome extension*, then *application TDAH concentration*, *app TDAH para concentrarse* and *ADHS App Konzentration* once the blog has other languages. A walkthrough: start with three sites, block YouTube Shorts instead of all of YouTube, set a schedule so blocking starts by itself, work in Pomodoro rounds with the countdown on the toolbar, turn on strict mode before a deadline, and give the password to someone you trust. The same disclaimer as the FAQ.

### Screenshots

- After round 2: `design/seo-copy/screenshots/{en,fr}-{desktop,mobile}-{dark,light}-first-screen@2x.png` and `og-all-languages.png`, regenerated with `npm run site:shots`.
- Before round 2: the same paths at `558a7f7`, e.g. `git show 558a7f7:design/seo-copy/screenshots/en-desktop-dark-first-screen@2x.png > before.png`. Before round 1: `design/landing-v2/screenshots/`.

## Round 1: the full rewrite

### How the copy was reviewed

The pass used three skills from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) v2.14.12, installed in `.claude/skills/`, in this order:

1. **copywriting**: diagnose first, then rewrite unit by unit (headline, subhead, CTAs, each section). Every line had to pass three tests: can the reader picture it, can it be proven true or false, and could a competitor write it unchanged. The skill's "AI tells" blacklist applies: no "not X, it's Y" reveals, no "No X. No Y." lists, no trailing comma pile-ons, no colon reveals, no em dashes in short copy.
2. **cro**: value proposition clarity, CTA hierarchy, objections and friction, page by page. Findings are below.
3. **copy-editing**: the seven sweeps (clarity, voice, so what, prove it, specificity, emotion, zero risk), then the AI-tell check again on the result.

**Diagnosis: situation B, a real voice.** The page already argues something specific in the founder's voice: a calm, private blocker, the fence metaphor ("Fence off the endless feeds"), and an unusually honest FAQ that admits strict mode can be bypassed. The job was to keep that voice and argument, fix the buried or vague lines, and remove the tells. The headline, the two-tone heading device and most of the section copy stay. About a third of the strings changed.

**Facts checked in the extension's code** before writing any claim:

| Claim on the page | Where it is true |
|---|---|
| Free blocks unlimited websites, subdomains included | No limit on domain entries (`background.js` `addEntry`); rules use `requestDomains`, which covers subdomains (`lib/core.js`) |
| Paths and keywords are Pro | `isProEntry` + `proRequired()` in `addEntry`; up to 500 pattern entries |
| Schedules, Pomodoro, strict mode, password lock, custom message, export/import are Pro | `proRequired()` in `setSchedule`, `setPomodoroConfig`, `startPomodoro`, `startStrict`, `setPassword`, `setBlockMessage`, `exportSettings`, `importSettings` |
| Stats are Pro | The Stats view is `data-pro` in `options.html` and locked for free users |
| Pomodoro default: 25 min focus, 5 min break, 4 rounds, all adjustable | `lib/core.js` defaults `{ focusMin: 25, breakMin: 5, cycles: 4 }`; `setPomodoroConfig` |
| Ending strict mode early: wait 10 minutes, then retype eight random words | `STRICT_UNLOCK_DELAY_MS = 10 * MINUTE`, `makeChallenge()` joins 8 words |
| Onboarding asks for up to three sites | `onboarding.js` `MAX = 3` |
| Open source | AGPL-3.0-or-later, public repository |

**Claims declined, and what would unlock them:**

| Claim | Why it is not on the page | What would unlock it |
|---|---|---|
| "Cancel anytime" (a strong risk reverser next to the prices) | Nothing in the repo or the store listing documents how a subscriber cancels | Confirm that ExtensionPay's "Manage plan" page lets subscribers cancel, then add it to the pricing note and the store listing |
| Ratings, review counts, user numbers, testimonials, press | None exist yet; the extension is not published | Real Chrome Web Store ratings after launch, or named quotes from users who agreed to be quoted |
| "Works in Edge, Brave, Opera" | Not tested | Load the release zip in each browser and run the e2e suite there |
| "Set up in 30 seconds" or any time figure | Never measured | Time a few first installs |

### What changed in English, and why

Before is `main` at `656b26f`; after is this branch.

| Unit | Before | After | Why |
|---|---|---|---|
| Title tag | FocusFence — Website Blocker & Focus Timer for Chrome | Free Website Blocker Extension for Chrome \| FocusFence | Leads with the query people type ("website blocker chrome extension", "free website blocker chrome"), brand last, 54 characters. A pipe instead of an em dash |
| Meta description | Block distracting websites in Chrome. Block YouTube Shorts but keep YouTube, schedule focus hours, run Pomodoro sessions and lock yourself in with strict mode. Private: nothing leaves your device. (196 characters) | Block distracting websites in Chrome in one click, with no limit on the free plan. Pro adds YouTube Shorts blocking and schedules. (130) | The old one was cut off in search results and ended on a colon reveal. The new one keeps the two strongest differentiators: unlimited sites for free (BlockSite's free tier stops at three sites, per Hostinger's guide and other 2025–2026 reviews) and Shorts-only blocking |
| H1 | Fence off the endless feeds. (eyebrow above it in a `<p>`) | Website blocker for Chrome + Fence off the endless feeds., in one `<h1>` | Moving the eyebrow into the heading changed no pixels (checked at 1440, 390 and 360 px before the copy rewrite). The heading now states what the page is about before the metaphor |
| Subhead | FocusFence blocks the sites that steal your attention, in one click. Block all of Reddit, or only YouTube Shorts. Set focus hours. When willpower runs out, turn on strict mode. | Block the sites you open on autopilot, as many as you like, on the free plan. With Pro, block only YouTube Shorts, or turn on strict mode when willpower runs out. | "Steal your attention" is a stock phrase; "the sites you open on autopilot" is the moment the reader recognizes. The old version implied Shorts blocking was free and ran four short sentences in a row; the new one says what Free and Pro each do. "When willpower runs out" is the founder's line and stays |
| Primary CTA (once the store link exists) | Add to Chrome — it's free | Add to Chrome for free | No em dash in a button; same promise |
| Secondary CTA | See features | See what it blocks | "See features" is a "Learn more" button. The new label answers the visitor's actual question and leads to the Block section |
| Ticks under the CTA | Free forever for unlimited websites · No account · No tracking | Free for unlimited websites · No account · Open source | Two absences in a row is a negation list. "Open source" is a different and checkable trust signal; the privacy section proves "no tracking" with the permission list |
| How it works, step 1 | …it asks for the sites that steal your focus. Start small with up to three… | …it asks for the three sites you open without thinking. Three is enough to start… | A stated opinion ("three is enough") instead of a cliché, and the same fact |
| How it works, step 3 | …a calm page with today's count… | …a calm page that counts today's attempts… | Says what the count counts |
| Block section heading | Block the whole site. Or just the bad part. | Block a whole website. Or just the bad part. | "Website" is the word people search for; the line keeps its shape |
| Feature: partial blocking | Block only the bad part | Block YouTube Shorts, keep YouTube | The heading names the flagship example. "Chrome extension to block YouTube Shorts" is the second Google suggestion after "chrome extension to block" |
| Focus section heading | Block on a schedule. Or lock yourself in. | Block websites on a schedule. Or lock yourself in. | Matches "block websites during work hours" without changing the rhythm |
| Pomodoro card | Timed focus rounds and breaks… | 25 minutes of focus, then a 5-minute break, for four rounds by default, and you can change all three… | Specific numbers from the code instead of a fragment |
| Strict mode card | …a 10-minute cooling-off period and a typing challenge. | …you wait 10 minutes, then retype eight random words. | The reader can picture the friction; "typing challenge" was vague |
| Privacy heading | Private by design. No account. No analytics. No ads. | Private by design. Your list, settings and stats stay on your computer. | The dimmed half was a negation list in three fragments. Now it states where the data lives |
| Privacy point 1 | Your data stays on your device / …No account, no analytics, no ads. | Works without an account / Install it and start blocking… FocusFence contains no analytics or ad code. | One absence, stated as a fact, instead of a list |
| Privacy point 2 | FocusFence doesn't read your pages | Chrome does the blocking, with a link to Chrome's declarativeNetRequest documentation | A positive claim plus a primary source the reader (and a search engine) can check |
| Pricing heading | Simple pricing | Unlimited websites, free forever | A label heading becomes the claim that matters most on a pricing table |
| Pricing subhead | …Pro adds paths, keywords and the tools that make focus stick. | Pro adds paths, keywords, schedules, focus sessions and strict mode. | "The tools that make focus stick" told the reader nothing |
| FAQ (new) | | How do I block a website in Chrome? / Is FocusFence free? | The two most-searched questions, answered on the page that should rank for them |
| FAQ: strict mode | Honest answer: Chrome always lets you… | Yes, if you work at it. Chrome always lets you… | "Honest answer:" is throat-clearing; the honesty is in the content |
| Closing heading | Get your focus back. | Pick the three sites that cost you the most. | The old line could close any productivity page. The new one is the first step of onboarding, so the last thing the page says is what to do |
| Image alt text | Up to 159 characters | 125 characters or fewer, still describing each capture | Screen readers and the SEO audit rules both cap useful alt text at about 125 characters |
| Privacy page title and description | Privacy Policy — FocusFence (27 characters) / …no account, no analytics, no tracking… | Privacy Policy \| FocusFence Website Blocker / What FocusFence keeps on your computer and why it needs each Chrome permission. With Pro, ExtensionPay checks your license. | Title within 30–60 characters; the description says what the page answers, without a negation list |
| Privacy point 3 | …If you say no, the site is still blocked. | …If you say no, the site is still blocked. The privacy policy explains every permission. | A link where a reader wants the detail (and one more internal link for the page) |

Unchanged on purpose: the headline, the statement under the hero, the Block and Stats leads, the schedule card, the six detail cards, the plan lists (the tests check "12 months for less than the price of 7"), every FAQ answer that was already plain, and the footer.

### French, Spanish, German

They were brought to parity with the English, written for each market rather than translated word for word:

- **French** keeps *vous*, the formal register of the existing site and of French software. Search phrases are woven in where they read naturally: "bloqueur de sites gratuit" in the title, "Extension Chrome gratuite pour bloquer… les sites distrayants" in the description ("extension chrome bloquer site" is the French query the landing page can win), the FAQ question "Comment bloquer un site sur Chrome ?" (the top French query). "Machinalement" carries the autopilot image; "quand la volonté flanche" stays. The site's French typography (non-breaking spaces before `? ! : ;`) now works: the helper replaced a space with a space since it was written.
- **Spanish** switches the key places to **"páginas web"**. Searchers type "bloquear páginas web en chrome", "extensión para bloquear páginas web" and "bloqueador de páginas web"; "bloqueador de webs" barely registers in Google's suggestions. The description opens "Extensión gratis para bloquear páginas web en Chrome". The rest keeps the site's informal *tú* and "webs", which reads naturally in Spain. Prices stay in US$ with the euro note, because the Spanish page also serves Latin America (the extension charges in euros only in the eurozone).
- **German** keeps *Sie*. The description uses "Webseiten blockieren" (as common as "Websites blockieren" in searches), the rest "Website", as before. "Ganz automatisch öffnen" carries the autopilot image, "wenn die Willenskraft nachlässt" stays.

In the meta descriptions, schedules are something Pro *applies*: "applique vos horaires", "aplica tus horarios", "wendet Ihre Zeitpläne an". An earlier draft said the blocker "follows" your hours ("suit vos horaires"), which reads oddly in French; the Spanish draft could be read as "blocking of Shorts and of schedules", and the German one had no verb.

Each language gets the same two new FAQ entries, the same Pomodoro and strict-mode specifics, alt text under 125 characters, and no em dash in short copy (checked by `tests/docs.spec.mjs`).

### Conversion review (cro)

**Quick wins, done in this pass:** a clear value proposition in the first screen (what it is, what is free, what Pro adds), a secondary CTA that says where it goes, objections answered next to the decision (is it free, how do I block a site, can strict mode be bypassed), and a closing line that is an instruction.

**High-impact, needs the owner:**

1. **The primary CTA is a status, not a button**, until the Chrome Web Store listing exists. Setting `STORE_URL` in `focusfence/scripts/docs.mjs` turns on the "Add to Chrome for free" buttons, the header CTA and the install URL in the structured data. Until then, nothing on the page converts. A "Get notified at launch" email field would capture interest, but it needs a mailing tool and a privacy-policy update, so it was not added.
2. **No proof yet.** After launch, real store ratings near the pricing table are the strongest missing element. Never seed them.
3. **"Cancel anytime"** next to the prices, once confirmed (see the table above).

**Test ideas** once there is traffic (Search Console impressions and store installs are enough to start):

- Headline: "Fence off the endless feeds." against a literal one such as "Block the sites you open on autopilot."
- Ticks: "Open source" against "Your list stays on your computer".
- Pricing: show yearly first, or keep the order Free, monthly, yearly.

### Panel check (copy-editing)

The copy-editing skill's quality gate: four reviewer personas score the result 1–10. The same agent ran it, so read it as a checklist, not an independent verdict.

| Reviewer | Score | Remaining critique |
|---|---|---|
| Conversion copywriter | 8 | The page can't convert until the store button exists; the hero is otherwise clear in five seconds |
| UX writer | 8 | Scannable; the FAQ now has eight entries, the upper end of useful |
| Target reader (a student who opens Reddit between tasks) | 8 | "Sites you open on autopilot" and "Block YouTube Shorts, keep YouTube" land; wants to see a rating before installing |
| Brand strategist | 8 | Voice and fence metaphor intact; the closing line is more concrete than the old one |

### Screenshots

- Before: `design/landing-v2/screenshots/{en,fr}-{desktop,mobile}-{dark,light}-first-screen@2x.png` and `og-all-languages.png` (unchanged in this branch).
- After: `design/seo-copy/screenshots/` (same names), made with `npm run site:shots`.

### Blog article ideas

Ideas 6 and 7, for the ADHD angle, are in round 2 above.

The SERP-overlap research (SEO_AUDIT.md, "Keyword research") shows where articles can rank: the how-to and comparison results, not the store-listing ones. All three existing drafts aim at results pages with zero or one article slot ("free website blocker chrome", "block websites during work hours chrome" and "block youtube shorts on chrome" are 9–10/10 store listings), so they are worth publishing for readers, but they won't carry the search traffic. These five can:

1. **How to block a website on Chrome (with and without an extension).** Target: *block websites on chrome*, *how to block a website on chrome*; a section on *block reddit on chrome*. The 10/10 how-to results are guides from Kinsta, Hostinger, Laptop Mag and others. To beat them, cover every method honestly (Chrome has no site blocker for personal use; Family Link, the hosts file, router or DNS filters, an extension), then the one-click way. This is the pillar the other articles link to.
2. **The same guide in French, Spanish and German**, written for each market rather than translated. Targets: *bloquer un site sur chrome* (FR, 9/10 how-to), *bloquear páginas web en chrome* together with *extensión para bloquear páginas web* and *bloqueador de páginas web* (ES, one page by overlap), *websites blockieren chrome* together with *webseiten blockieren chrome* (DE, overlap 9). This needs a localized blog (`docs/fr/blog/` and so on), which the generator doesn't have yet. It is the largest content gap on the site: today no French, Spanish or German page can rank for these informational queries.
3. **BlockSite alternatives: free website blockers without a three-site limit.** Target: *blocksite alternative* (8/10 listicles and reviews; AlternativeTo, TechRadar), then *bloqueur de site gratuit* (FR) and *website blocker chrome kostenlos* (DE). An honest comparison table (free-plan limits, partial blocking, schedules, privacy, price), with the disclosure the drafts already use. Check every competitor fact on the day of publication.
4. **How to block distracting websites and make it stick.** Target: *block distracting websites* (5 of 10 results are articles, mostly on vendor blogs: Freedom, RescueTime). The angle the founder can own: start with three sites, block a path instead of a whole site, schedule instead of willpower, and what strict mode can't stop.
5. **How to block YouTube Shorts on a computer, in French, Spanish and German.** Targets: *bloquer shorts youtube*, *bloquear shorts de youtube*, *youtube shorts blockieren* (6/10 how-to or news). The English Shorts draft adapted per language; the English results are store listings, the other languages still have guide slots.

Each article should link to the landing page of its language (anchor: the product category, e.g. "website blocker for Chrome"), the landing FAQ should link to the article that expands it, and every article gets the BlogPosting markup the generator already writes.
