# SEO audit: focusfence.dev

Audit of the live site (https://focusfence.dev, GitHub Pages serving `main` /docs at `656b26f`) and of the generator in `focusfence/scripts/`, with the fixes made on branch `seo/audit-v1` on 2026-11-14. The landing-page copy rewrite done in the same pass is described in [COPY_CHANGES.md](COPY_CHANGES.md). A second copy round the same day repositioned the page as a focus app (titles, H1, structured data category, two new FAQ entries); the rows it changed say "round 2".

## Scores, before and after

**Lighthouse SEO is 100 on every indexable page, phone and desktop, before and after.** Lighthouse's SEO checks are basic: crawlable, titled, described, valid hreflang and canonical. The site already passed them, so the gains show in the other measures.

| Measure | Before (`main`) | After (this branch) |
|---|---|---|
| Lighthouse SEO, phone and desktop | 100 on the 5 pages measured (`/`, `/fr/`, `/es/`, `/de/`, `/privacy.html`) | **100 on all 8 indexable pages** (the 4 landing and 4 privacy pages) |
| Lighthouse performance, desktop | 100 | 100 on all 8 |
| Lighthouse performance, phone | 95–99 | 94–99 after round 1; after round 2, 82–99 in one pass on a loaded server, and the same as round 1 in an interleaved A/B (see Core Web Vitals) |
| Lighthouse accessibility / best practices | 100 / 100 | 100 / 100 on all 8, phone and desktop |
| seomator 7.0.0 (`--crawl -m 20`), both builds served locally the same way | **87** (243 failed checks) | **90** (161 failed checks) after round 1; **90** (160) after round 2 |
| seomator 7.0.0 on the live site (HTTPS, GitHub's headers) | 91 | to measure after merge |
| claude-seo SEO Health Score (heuristic, see below) | **46** | **92** |
| Structured data | none | Organization, WebSite, WebPage, SoftwareApplication + offers, FAQPage, BreadcrumbList, BlogPosting |
| Titles within 30–60 characters / descriptions within 120–160 (indexable pages) | 5 of 8 / 2 of 8 (the Spanish and German privacy pages) | 8 of 8 / 8 of 8 |

**How the health score was computed.** The claude-seo skill weights seven categories (technical 22 %, content 23 %, on-page 20 %, schema 10 %, performance 10 %, AI search 10 %, images 5 %). Without its scripts, each category was scored as the share of the checks below that passed, and a check fails if any language fails it. It is a heuristic for tracking this site over time, not a Google signal.

| Category (weight) | Checks | Before | After |
|---|---|---|---|
| Technical (22 %) | HTTPS with one-hop redirects; valid robots.txt; sitemap with hreflang; sitemap lastmod; self-referencing canonicals; reciprocal hreflang + x-default; content in the initial HTML; mobile viewport, no sideways scroll; a real 404 page; security headers | 7/10 | 9/10 (headers: GitHub Pages limit) |
| Content (23 %) | unique copy; specific, verifiable claims; no AI-writing patterns; answers the main question on the page; privacy policy and contact; honest limits; about page or legal notice; reviews or other proof | 3/8 | 6/8 (legal notice and reviews: owner) |
| On-page (20 %) | title length; keyword-first titles; description length; h1 states the topic; one h1 per page; main terms in headings; alt text 10–125 characters; descriptive internal links | 2/8 | 8/8 |
| Schema (10 %) | JSON-LD present; Organization; SoftwareApplication with offers; FAQPage matching the visible FAQ; breadcrumbs or BlogPosting on inner pages | 0/5 | 5/5 |
| Performance (10 %) | Lighthouse phone performance, average | 97 | 98 |
| AI search (10 %) | content in HTML; AI crawlers allowed; an explicit AI-crawler policy; llms.txt; entity markup; question-shaped answers | 2/6 | 6/6 |
| Images (5 %) | alt on every image; alt length; width/height and modern formats; a valid 1200×630 card under ~300 KB | 3/4 | 4/4 |

## Method

- **Skills:** [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) v2.6.0 (`734998e5fdbb`): seo, seo-audit, seo-technical, seo-hreflang, seo-schema, seo-sitemap, seo-geo, seo-cluster, seo-content. Only the Markdown playbooks were installed in `.claude/skills/` (no scripts, hooks or extensions), so the bundled Python tools were not used. Their checks were run by hand with curl, Lighthouse and the generated HTML. The copy skills come from coreyhaines31/marketingskills v2.14.12 (see COPY_CHANGES.md).
- **Crawl:** the live site (12 URLs) and the local build, capped at 20 pages. Deterministic check: `npx @seomator/seo-audit@7.0.0 audit <url> --crawl -m 20 --format llm`.
- **Lighthouse 12.8.2**, mobile and desktop, on a local static server with gzip (the same set-up as the landing redesign's measurements in `design/landing-v2/BRIEF.md`). Each figure is one run unless noted. The server is shared with other agents, so Lighthouse's `benchmarkIndex` is quoted with each run.
- **Keywords:** Google's public autocomplete in each language, and SERP-overlap clustering from web searches only (no paid tool). There are no search volumes: priorities come from suggestion order and from what ranks.
- **Rules followed:** no IndexNow and no Google Indexing API pings; all four languages stay indexable; no invented ratings, reviews or user counts.

## Findings and what was done

Severity follows the skill's scale: Critical blocks indexing, High hurts rankings, Medium is an optimization, Low and Info are backlog.

### Technical (crawl, index, international)

| # | Finding (before) | Severity | Status |
|---|---|---|---|
| T1 | Missing pages got GitHub's default "Page not found · GitHub Pages" page: no branding, no way home | Medium | **Fixed.** `docs/404.html` (GitHub Pages serves it with a 404 status at any depth): `noindex`, no canonical, root-absolute links, a way home in each language |
| T2 | `/favicon.ico` returned 404; no apple-touch-icon; no web manifest | Low | **Fixed.** `favicon.ico` packed from the extension's 16/32/48 px icons; `apple-touch-icon.png` (180), `site.webmanifest` with 192, 512 and maskable icons (lab cost on text pages: see Core Web Vitals) |
| T3 | Sitemap without `<lastmod>` | Low | **Fixed.** `<lastmod>` only moves when a page's title, description, structured data or main content changes (hashes in `focusfence/scripts/sitemap-dates.json`), so the dates stay true |
| T4 | robots.txt allowed everything but did not address AI crawlers | Info | **Done.** Explicit groups for AI search crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) and training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot), all allowed. Behaviour is unchanged; the choice is now visible and easy to reverse |
| T5 | HTTPS, http→https, www→apex and github.io→custom domain redirects | Pass | Single 301 hop each |
| T6 | Canonicals: absolute, self-referencing; `/index.html` and `/privacy` (no extension) also answer 200 | Pass | The canonical covers the duplicates; internal links never use them |
| T7 | hreflang en/fr/es/de + x-default, reciprocal, in the HTML and the sitemap | Pass | Kept in both places; they agree (tested) |
| T8 | First-visit language redirect on `/` (JavaScript, `navigator.languages`) | Low risk | Kept. Googlebot renders as en-US and is not redirected; a choice in the switcher always wins |
| T9 | Pages are static HTML with all content and meta in the initial response | Pass | Nothing depends on JavaScript for indexing |
| T10 | No HSTS, CSP, X-Frame-Options, Referrer-Policy or COOP headers; 10-minute cache on every file; gzip without Brotli | Info (security and speed, not ranking) | GitHub Pages can't set headers. A free proxy such as Cloudflare in front of Pages would add them, plus Brotli and long caching for `/assets/` |
| T11 | Blog index and three articles are `noindex` and out of the sitemap | By design | They are unpublished drafts (`draft: true`). They enter the sitemap automatically when published |
| T12 | `https://extensionpay.com/privacy`, linked from the privacy policy, returns HTTP 500 (every variant tried, browser user agent too) | Medium (trust) | **Owner action**: a legal text, so it wasn't changed. See OWNER_TODO.md §11 |

### On-page

| # | Finding (before) | Severity | Status |
|---|---|---|---|
| O1 | Titles: FR 71 and ES 75 characters (cut off), EN and DE brand-first without "free" | High | **Fixed**, 53–60 characters. Round 1 put the keyword first and the brand last ("Free Website Blocker Extension for Chrome \| FocusFence"). Round 2 follows the owner's focus-first example, brand first: "FocusFence: Block Distracting Websites & Stay Focused", "FocusFence : bloquer les sites distrayants, rester concentré" (trade-off under Keyword research) |
| O2 | Meta descriptions 196–247 characters on every landing page, 167 on the French privacy page | High | **Fixed.** 122–131 characters, each written for its page, within the 120–160 character rule. The audit tool's pixel estimate (about 7 px per character) puts all of them within Google's ~920 px snippet width except the French privacy page, at 933 px: borderline, under the tool's 990 px warning level |
| O3 | Privacy titles under 30 characters (EN 27) | Low | **Fixed.** 33–41 characters (round 2 dropped "Website Blocker" from the English one) |
| O4 | Landing H1 was only the slogan; "Website blocker for Chrome" sat in a `<p>` above it | Medium | **Fixed.** Both are in the `<h1>` (eyebrow first). Same pixels on screen. Since round 2 it reads "Focus app for Chrome — Fence off distracting websites.": a focus term plus the search phrase |
| O5 | Spanish copy said "webs" where searchers type "páginas web" | Medium | **Fixed** in the title, description, H1, statement, pricing and FAQ |
| O6 | No on-page answer to the top question ("how to block a website on chrome") | Medium | **Fixed.** New FAQ entries in all four languages: how to block a website in Chrome, and whether FocusFence is free |
| O7 | Section headings without the main terms | Low | **Fixed** lightly: "Block a whole website", "Block YouTube Shorts, keep YouTube" (and the equivalent in each language). Round 2 renamed the Focus section "Protect your focus hours" |
| O8 | Alt text up to 192 characters (FR), over the ~125 that screen readers and audits handle well | Low | **Fixed.** 62–124 characters, each still describing its capture |
| O9 | No link to a primary source; internal link density just under the audit tool's minimum (0.48 links per 100 words) | Low | **Fixed.** The privacy section links Chrome's declarativeNetRequest documentation, and the permissions point links the privacy policy |
| O10 | One H1 per page, logical H2/H3 order, descriptive link text, `lang` on every page | Pass | Now tested on every page |

### Structured data

| # | Finding (before) | Severity | Status |
|---|---|---|---|
| S1 | No structured data on any page | High | **Fixed.** Landing pages: Organization, WebSite, WebPage, SoftwareApplication (BrowserApplication with the sub-category Productivity in the page's language, as in the store; Windows/macOS/Linux/ChromeOS, Chrome 120+, version from the manifest, Free / Pro monthly / Pro yearly offers in the page's own currency, with billing periods) and FAQPage built from the visible FAQ. Privacy pages: WebPage and BreadcrumbList. Articles: BlogPosting and BreadcrumbList. Blog index: BreadcrumbList. JSON-LD in the initial HTML |
| S2 | Rich-result eligibility | Info | Google's software-app rich result needs a real `aggregateRating` or `review`; there are none yet, so none were added. Add them only once real Chrome Web Store ratings can be shown on the page. Per the claude-seo notes, Google retired FAQ rich results for all sites on 2026-05-07: the FAQPage markup stays (it describes the page accurately, and you asked for it) but brings no Google snippet. BreadcrumbList rich results show on desktop only |

### Social cards

| # | Finding (before) | Severity | Status |
|---|---|---|---|
| G1 | Open Graph image: screenshots of the block page and popup; the glass pills small, UI text unreadable at preview size, 216 KB PNG | Medium | **Replaced.** `npm run site:art` draws each language's card from the site's own stylesheet: the closing glass-pill fence (lit middle pill, halo, mirror floor) under the logo, the eyebrow, the two-tone headline and the ticks (since round 2: "Focus app for Chrome", "Fence off distracting websites."). 1200×630 JPEG at quality 90, 54–62 KB: no visible difference from a 350 KB PNG at 2x zoom, and well under the ~300 KB that some apps (WhatsApp) accept for a preview |
| G2 | No `og:image:type`, no `twitter:image:alt`; articles typed `website` | Low | **Fixed.** Articles are `og:type=article` with `article:published_time` |

### AI search (GEO)

| # | Finding (before) | Severity | Status |
|---|---|---|---|
| A1 | No `/llms.txt` | Info | **Added**, generated from the same strings as the pages (product summary, plans, pages in each language, the English FAQ). It says in plain words that FocusFence is a focus app and does not block ads, so assistants don't file it with ad blockers. Google Search ignores llms.txt (Google's AI optimization guide); it is there for other assistants and agents |
| A2 | AI crawler access | Pass | Allowed (see T4). Citability in ChatGPT search depends on OAI-SearchBot, Claude on Claude-SearchBot, Perplexity on PerplexityBot; GPTBot, ClaudeBot and Google-Extended only govern training |
| A3 | Entity signals | Low | Organization + SoftwareApplication with `sameAs` (the GitHub repository). Brand mentions on Reddit, YouTube and the like correlate with AI citations far more than links; they come with the launch, not from the site |

### Core Web Vitals

No field data exists yet (CrUX needs real Chrome traffic), so these are lab numbers:

| Page (mobile, Lighthouse 12.8.2) | LCP before | LCP after | TBT before → after | CLS | benchmarkIndex before / after |
|---|---|---|---|---|---|
| `/` | 2.1 s | 2.0 s | 80 → 100 ms | 0 | 1208 / 1362 |
| `/fr/` | 2.1 s | 2.1 s | 210 → 50 ms | 0 | 1210 / 1334 |
| `/es/` | 2.0 s | 2.1 s | 110 → 210 ms | 0 | 1102 / 1270 |
| `/de/` | 2.2 s | 2.3 s | 200 → 60 ms | 0 | 1254 / 1386 |
| `/privacy.html` | 1.5 s | 1.5–1.7 s (see A/B) | 110 → 200 ms | 0 | 1230 / 1060 |

All of it is within Google's "good" thresholds (LCP ≤ 2.5 s, CLS ≤ 0.1).

**Round 2 (focus-first copy).** One Lighthouse pass gave SEO 100 on all 8 pages, phone and desktop, desktop performance 100, and phone performance 82–99. The low scores were `/de/` (82, at benchmarkIndex 601, a loaded machine) and `/es/` (90), both from Total Blocking Time. An interleaved phone A/B against round 1 (`558a7f7`) gave medians of 93 → 98 on `/es/` (3 runs each) and 97 → 95 on `/de/` (9 runs each, order alternated), with the same LCP (2.0–2.3 s) and CLS 0. The slow runs on either build come from a single task that balloons, which is how CPU contention shows up. Chrome's own counters, which load can't move, show the same work on both builds: `Performance.getMetrics` medians on `/de/` give 1127 → 1161 DOM nodes and 781 → 795 layout objects (the two new FAQ entries), layout 141 → 140 ms and total task time 262 → 271 ms, and `/es/` matches. The copy change costs nothing measurable.

seomator on the same two local builds: 90 and 90, with 161 then 160 failed checks. The content category moves 90 → 89, because the two new FAQ answers add words without links: `/fr` and `/es` fall to 0.44 links per 100 words, under the tool's 0.5 heuristic for article text. One new critical appeared on a draft and is fixed: "schema name not found in visible content" on `/fr/`. The French title's words ("rester concentré") weren't visible above the footer, and the French subhead now opens with "Restez concentré au travail." The German description lost "Ihre" so its estimated width falls under ~920 px. TBT, the lab stand-in for INP, moves with the shared server's load more than with the page; the site's only script is 6 KB and deferred. Desktop: LCP 0.4–0.5 s, TBT 0 ms, CLS 0 on every page, before and after.

**One measurable lab cost: the web manifest.** On the privacy pages the LCP element is text, so it reacts to anything that joins the first requests. An interleaved A/B on `/privacy.html` (phone) gave 1.5 s on `main` in 3 of 3 runs, against 1.5, 1.7 and 1.7 s on this branch. With the manifest link removed, the branch measured 1.5 s twice, and with it, 1.7 s twice. Linking the manifest from `site.js` after load didn't help: the request still falls inside Lighthouse's simulated LCP window. The manifest stays as a standard `<link>`: the page is still well within "good", and real visitors' browsers fetch the 0.6 KB file at low priority over the same HTTP/2 connection. If the lab number matters more, delete the `<link rel="manifest">` line in `focusfence/scripts/docs.mjs`; nothing else depends on it. The landing pages are unaffected, because their LCP is the hero image.

Changes that touch performance: about 5 KB of JSON-LD per landing page (about 1.5 KB gzipped), two `<link>` tags, and the 0.6 KB web manifest that Chrome fetches early at low priority (above). The page weight on a phone stays around 220 KB.

The audit tool and Lighthouse both flag the hero image as "lazy-loaded LCP". The site lazy-loads both theme variants of each capture, so a visitor downloads only their theme, and an inline script preloads the right hero image with high priority. An interleaved A/B on the same server (three Lighthouse mobile runs each, benchmarkIndex 923–1192) gave the same LCP (2.18–2.26 s against 2.26 s with eager loading); eager loading only added 29 KB. Render delay, not loading, dominates the phone LCP. The design stays as it is.

### Content and trust (E-E-A-T)

| # | Finding | Severity | Status |
|---|---|---|---|
| C1 | Copy with AI-writing patterns (negation lists, colon reveals, an em dash in the CTA, a generic closing line) and vague claims | Medium | **Fixed**, see COPY_CHANGES.md |
| C2 | No about page, no named author, no legal notice | Medium (trust) | **Owner action.** France requires *mentions légales* and Germany an *Impressum* on a commercial site; both need the publisher's legal name and address |
| C3 | No reviews, ratings or press | Info | Expected before launch. Nothing was invented |
| C4 | Privacy policy, contact address, open source code, honest limits in the FAQ | Pass | Strong trust signals for a new extension |

### What the audit tool reported that isn't a site problem

seomator's score moves less than the fixes because most of what it still flags can't change here. Its categories, before → after on the local builds: core 82 → 93, schema 77 → 91, social 71 → 85, geo 77 → 82, HTML validity 93 → 100, technical 96 → 100, i18n 91 → 93, while security stays at 63 (headers), and mobile and links dip slightly (74, 87) for the reasons below.

seomator strips trailing slashes before resolving links (`/blog/` becomes `/blog`), so `blog/<slug>.html` resolved to `/<slug>.html`, which doesn't exist. Those three URLs produced most of its "critical" items (no viewport, no description, no canonical, duplicate content, thin content, redirect ending in a 404). The same normalization explains its hreflang "missing self-reference" warning on `/fr`, `/es`, `/de`. Browsers and Googlebot resolve links from the final URL after the redirect, so the real pages are fine. The new 404 page now answers those URLs properly anyway. Because it is a real page with the site's stylesheet, the tool now also applies its mobile checks to those three URLs: a sub-12 px declaration in the stylesheet (the small PRO badges) and, on the local run, root-relative links it reports as "localhost" links. That is why the mobile and links categories dip. Its other flags are GitHub Pages limits (security headers, Brotli, cache), deliberate choices (inline CSS, which lowers the text-to-HTML ratio; the lazy hero, see above) or out of scope (share buttons, social profiles that don't exist yet, Markdown copies of pages).

## Keyword research and targets

Method: Google's public autocomplete in each language (2026-11-14), then SERP-overlap clustering from the claude-seo `seo-cluster` playbook: 28 keywords, one web search each, overlap = shared URLs in the top 10 (7–10 same page, 4–6 same cluster, 2–3 interlink). The searches came from a US-only search tool, not google.fr/.es/.de, and there are no volumes, so treat the FR/ES/DE results as provisional. focusfence.dev appeared in none of the 28 result lists (expected for a new site). The overlap matrices and the normalized results are in `design/seo-copy/keywords/` (`clusters.md`, `serp.json`).

**Two kinds of results.** 12 of the 16 English keywords return 7–10 store listings out of 10 ("website blocker chrome extension", "site blocker chrome", "free website blocker chrome", "chrome extension to block websites", the YouTube Shorts and work-hours phrasings). For those the **Chrome Web Store listing** is the page that can rank; the landing page supports it. The informational queries ("block websites on chrome", "how to block a website on chrome", and the same questions in French, Spanish and German) return 8–10 how-to guides out of 10: only a **guide** can rank there.

| Cluster | Primary keyword (secondary) | Intent, what ranks | Target |
|---|---|---|---|
| EN-1 | block websites on chrome (how to block a website on chrome; block reddit on chrome as a section) | Informational, 10/10 how-to | A blog guide (new) |
| EN-2 | website blocker chrome extension (site blocker chrome, free website blocker chrome, website blocker with password chrome) | Transactional, 9–10/10 listings | Store listing (its name says "Website Blocker"). Round 1 put these terms in the landing title and H1; round 2 moved those to the focus terms (see below) |
| EN-3 | chrome extension to block websites | Transactional, 8/10 listings | Store listing + landing page |
| EN-4 | block youtube shorts on chrome (chrome extension to block youtube shorts) | Transactional, 9–10/10 listings, one how-to slot | Store listing; the Shorts draft article for the one guide slot; landing H3 "Block YouTube Shorts, keep YouTube" |
| EN-5 | block websites during work hours chrome (…at certain times) | Transactional, 9–10/10 listings | Store listing; the landing schedule card ("Block only during work hours") |
| EN-6 | block distracting websites | Mixed: 5 listings, 5 guides | **Landing page** since round 2 (the phrase in the title and description, "distracting websites" in the H1 and footer), and a blog guide |
| EN-7/8 | pomodoro timer chrome extension with website blocker; focus mode chrome extension | Transactional, listings and directories | Store listing (low priority) |
| EN-9 | blocksite alternative | Commercial, 8/10 listicles and reviews | A comparison page (new) |
| FR-1 | bloquer un site sur chrome | Informational, 9/10 how-to | A French guide (new); the French FAQ answers it |
| FR-2 | extension chrome bloquer site | Commercial, mixed | **French landing page** (round 2: title "bloquer les sites distrayants", description "Extension Chrome gratuite…") + French store listing |
| FR-3 | bloqueur de site gratuit | Commercial, listicles | French store listing ("Bloqueur de sites" in its name); a French comparison page later. Round 2 moved the landing title off this phrase |
| ES-1 | bloquear páginas web en chrome (extensión para bloquear páginas web: overlap 7, same page; bloqueador de páginas web: 5–6) | Informational, 9–10/10 how-to | A Spanish guide (new); the Spanish landing page now speaks of "páginas web" |
| DE-1 | websites blockieren chrome (webseiten blockieren chrome: overlap 9, same page) | Informational, 8/10 how-to | A German guide (new) |
| DE-1b | website blocker chrome kostenlos | Commercial, mixed | German store listing ("Website-Blocker" in its name); the landing description keeps "Kostenlose Chrome-Erweiterung, die ablenkende Websites… sperrt" |
| FR-4, ES-2, DE-2 | bloquer shorts youtube; bloquear shorts de youtube; youtube shorts blockieren | Informational, 6/10 how-to or news | Localized Shorts guides |

The competitors that appear most often outside the store are how-to publishers (techlockdown.com in 9 of 28 lists, kinsta.com 7, hostinger.com 6, mackeeper.com 6, airdroid.com 5). In the store, FocusGuard and BlockSite recur. BlockSite's free tier is limited to three sites (Hostinger's French guide and other 2025–2026 reviews), so "free, unlimited sites" is the line to lead with in every language, and the copy now does.

**Round 2: focus terms and ADHD.** The owner repositioned the page as a focus app, so the landing page now leads with focus terms and keeps blocking as the mechanism. These were checked with Google's autocomplete only (no SERP-overlap clustering, no volumes), plus one search for the ADHD query:

| Terms | What ranks / what the suggestions show | Target |
|---|---|---|
| focus app chrome, focus extension chrome (focus mode extension chrome); stay focused | Not measured. The "stay focused chrome extension" completions read like searches for one product (StayFocusd) | Landing badge (first words of the H1), statement, footer, Open Graph card; "Stay Focused" in the title |
| productivity extension chrome (best productivity extensions for chrome) | Not measured; the "best …" suggestions point to listicles | Landing description and the structured data's sub-category. Listicles are won by being listed in them (outreach), not by a page |
| adhd website blocker (website blocker for adhd, adhd chrome extension, adhd friendly chrome extension) | Store listings of small ADHD-named extensions, and vendor blogs | One FAQ entry per language; blog ideas 6–7 in COPY_CHANGES.md; the store listing if the owner adds the term |
| FR application concentration, rester concentré, tdah application; ES app para concentrarse, app para bloquear distracciones, tdah app; DE fokus app, konzentriert bleiben app, adhs app | Not measured | The badge and title in each language; the ADHD FAQ entry (TDAH, ADHS) |

The trade-off: "website blocker" (and *bloqueur de sites*, *Website-Blocker*) left the landing titles. Those results pages are 9–10 store listings out of 10, so the store listing, which keeps the term in its name, is the page that can rank there; "block distracting websites" has room for a landing page (5 of 10 results are not listings). If Search Console later shows impressions for "website blocker" queries on the landing page with a low click-through, that is the signal to test a title with both terms.

**Store listing note** (`focusfence/store/listing*.md`, not changed here): since the listing is the page that can rank for most commercial queries, its summary should keep "website blocker", "block YouTube Shorts", "schedules", "Pomodoro" and "free". It already does in all four languages; the description could add "site blocker" and "password" once, naturally. Since round 2 the site calls FocusFence a focus app while the store name still says "Website Blocker"; whether to align them is the owner's call (OWNER_TODO.md §11).

## What's left

Ordered by what unblocks the most. Each item says how to tell whether it worked.

1. **Publish the store listing and set `STORE_URL`** (`focusfence/scripts/docs.mjs`). Until then the page has no conversion and the structured data no install URL. *Check:* the hero shows "Add to Chrome for free"; installs start in the store dashboard.
2. **Search Console and Bing Webmaster Tools** (OWNER_TODO.md §11): verify the domain, submit the sitemap. *Leading indicator:* the 8 indexable pages reported as indexed within a few weeks; impressions for "block distracting websites", "focus app chrome" and "bloquer un site sur chrome". *Failed if:* pages stay "Discovered, not indexed" after a month (then the site needs links, item 4).
3. **Legal notice / Impressum and an about page** with the publisher's identity. *Check:* linked from every footer.
4. **First links and mentions:** the GitHub repository's Website field, the store listing, Product Hunt, AlternativeTo, the drafted Reddit posts. *Leading indicator:* referring domains in Search Console's Links report.
5. **Publish the blog drafts** after proofreading (they become indexable and enter the sitemap by themselves), then the new articles in COPY_CHANGES.md. Link each article from the landing FAQ entry it expands, and back to the landing page. *Leading indicator:* impressions on long-tail queries such as "block youtube shorts chrome".
6. **Ratings** in the structured data and on the page, only once real store ratings exist.
7. **Optional hardening:** a proxy in front of GitHub Pages for security headers, Brotli and long-lived caching of `/assets/`. No ranking change expected; better repeat-visit speed.
8. **Re-audit** a month after launch: rerun `npx @seomator/seo-audit@7.0.0 audit https://focusfence.dev --crawl -m 20` and Lighthouse, and read Search Console's queries for each language. If French, Spanish or German pages get impressions for English queries (or the reverse), revisit hreflang and titles.

What this audit could not measure: search volumes, real rankings, field Core Web Vitals and AI-answer citations. Search Console (and, after launch, the store's analytics) close those gaps.
