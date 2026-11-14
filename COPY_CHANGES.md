# FocusFence landing page: copy changes

Branch `seo/audit-v1`, 2026-11-14. The landing page text lives in `focusfence/scripts/site-strings.mjs` (one block per language). `npm run docs` builds `docs/` from it. The SEO side of the same work is in [SEO_AUDIT.md](SEO_AUDIT.md).

## How the copy was reviewed

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

## What changed in English, and why

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

## French, Spanish, German

They were brought to parity with the English, written for each market rather than translated word for word:

- **French** keeps *vous*, the formal register of the existing site and of French software. Search phrases are woven in where they read naturally: "bloqueur de sites gratuit" in the title, "Extension Chrome gratuite pour bloquer… les sites distrayants" in the description ("extension chrome bloquer site" is the French query the landing page can win), the FAQ question "Comment bloquer un site sur Chrome ?" (the top French query). "Machinalement" carries the autopilot image; "quand la volonté flanche" stays. The site's French typography (non-breaking spaces before `? ! : ;`) now works: the helper replaced a space with a space since it was written.
- **Spanish** switches the key places to **"páginas web"**. Searchers type "bloquear páginas web en chrome", "extensión para bloquear páginas web" and "bloqueador de páginas web"; "bloqueador de webs" barely registers in Google's suggestions. The description opens "Extensión gratis para bloquear páginas web en Chrome". The rest keeps the site's informal *tú* and "webs", which reads naturally in Spain. Prices stay in US$ with the euro note, because the Spanish page also serves Latin America (the extension charges in euros only in the eurozone).
- **German** keeps *Sie*. The description uses "Webseiten blockieren" (as common as "Websites blockieren" in searches), the rest "Website", as before. "Ganz automatisch öffnen" carries the autopilot image, "wenn die Willenskraft nachlässt" stays.

In the meta descriptions, schedules are something Pro *applies*: "applique vos horaires", "aplica tus horarios", "wendet Ihre Zeitpläne an". An earlier draft said the blocker "follows" your hours ("suit vos horaires"), which reads oddly in French; the Spanish draft could be read as "blocking of Shorts and of schedules", and the German one had no verb.

Each language gets the same two new FAQ entries, the same Pomodoro and strict-mode specifics, alt text under 125 characters, and no em dash in short copy (checked by `tests/docs.spec.mjs`).

## Conversion review (cro)

**Quick wins, done in this pass:** a clear value proposition in the first screen (what it is, what is free, what Pro adds), a secondary CTA that says where it goes, objections answered next to the decision (is it free, how do I block a site, can strict mode be bypassed), and a closing line that is an instruction.

**High-impact, needs the owner:**

1. **The primary CTA is a status, not a button**, until the Chrome Web Store listing exists. Setting `STORE_URL` in `focusfence/scripts/docs.mjs` turns on the "Add to Chrome for free" buttons, the header CTA and the install URL in the structured data. Until then, nothing on the page converts. A "Get notified at launch" email field would capture interest, but it needs a mailing tool and a privacy-policy update, so it was not added.
2. **No proof yet.** After launch, real store ratings near the pricing table are the strongest missing element. Never seed them.
3. **"Cancel anytime"** next to the prices, once confirmed (see the table above).

**Test ideas** once there is traffic (Search Console impressions and store installs are enough to start):

- Headline: "Fence off the endless feeds." against a literal one such as "Block the sites you open on autopilot."
- Ticks: "Open source" against "Your list stays on your computer".
- Pricing: show yearly first, or keep the order Free, monthly, yearly.

## Panel check (copy-editing)

The copy-editing skill's quality gate: four reviewer personas score the result 1–10. The same agent ran it, so read it as a checklist, not an independent verdict.

| Reviewer | Score | Remaining critique |
|---|---|---|
| Conversion copywriter | 8 | The page can't convert until the store button exists; the hero is otherwise clear in five seconds |
| UX writer | 8 | Scannable; the FAQ now has eight entries, the upper end of useful |
| Target reader (a student who opens Reddit between tasks) | 8 | "Sites you open on autopilot" and "Block YouTube Shorts, keep YouTube" land; wants to see a rating before installing |
| Brand strategist | 8 | Voice and fence metaphor intact; the closing line is more concrete than the old one |

## Screenshots

- Before: `design/landing-v2/screenshots/{en,fr}-{desktop,mobile}-{dark,light}-first-screen@2x.png` and `og-all-languages.png` (unchanged in this branch).
- After: `design/seo-copy/screenshots/` (same names), made with `npm run site:shots`.

## Blog article ideas

The SERP-overlap research (SEO_AUDIT.md, "Keyword research") shows where articles can rank: the how-to and comparison results, not the store-listing ones. All three existing drafts aim at results pages with zero or one article slot ("free website blocker chrome", "block websites during work hours chrome" and "block youtube shorts on chrome" are 9–10/10 store listings), so they are worth publishing for readers, but they won't carry the search traffic. These five can:

1. **How to block a website on Chrome (with and without an extension).** Target: *block websites on chrome*, *how to block a website on chrome*; a section on *block reddit on chrome*. The 10/10 how-to results are guides from Kinsta, Hostinger, Laptop Mag and others. To beat them, cover every method honestly (Chrome has no site blocker for personal use; Family Link, the hosts file, router or DNS filters, an extension), then the one-click way. This is the pillar the other articles link to.
2. **The same guide in French, Spanish and German**, written for each market rather than translated. Targets: *bloquer un site sur chrome* (FR, 9/10 how-to), *bloquear páginas web en chrome* together with *extensión para bloquear páginas web* and *bloqueador de páginas web* (ES, one page by overlap), *websites blockieren chrome* together with *webseiten blockieren chrome* (DE, overlap 9). This needs a localized blog (`docs/fr/blog/` and so on), which the generator doesn't have yet. It is the largest content gap on the site: today no French, Spanish or German page can rank for these informational queries.
3. **BlockSite alternatives: free website blockers without a three-site limit.** Target: *blocksite alternative* (8/10 listicles and reviews; AlternativeTo, TechRadar), then *bloqueur de site gratuit* (FR) and *website blocker chrome kostenlos* (DE). An honest comparison table (free-plan limits, partial blocking, schedules, privacy, price), with the disclosure the drafts already use. Check every competitor fact on the day of publication.
4. **How to block distracting websites and make it stick.** Target: *block distracting websites* (5 of 10 results are articles, mostly on vendor blogs: Freedom, RescueTime). The angle the founder can own: start with three sites, block a path instead of a whole site, schedule instead of willpower, and what strict mode can't stop.
5. **How to block YouTube Shorts on a computer, in French, Spanish and German.** Targets: *bloquer shorts youtube*, *bloquear shorts de youtube*, *youtube shorts blockieren* (6/10 how-to or news). The English Shorts draft adapted per language; the English results are store listings, the other languages still have guide slots.

Each article should link to the landing page of its language (anchor: the product category, e.g. "website blocker for Chrome"), the landing FAQ should link to the article that expands it, and every article gets the BlogPosting markup the generator already writes.
