# FocusFence: keyword clusters by SERP overlap

Run date: 2026-11-14. Source: WebSearch tool, mode "standard", one search per keyword. 28 keywords: EN 16, FR 4, ES 4, DE 4.
Method: claude-seo SERP-overlap methodology (`.claude/skills/seo-cluster/references/serp-overlap-methodology.md`).
Overlap = number of normalized URLs two keywords share in their top 10, computed only within one language.
Thresholds: **7-10 same page, 4-6 same cluster, 2-3 interlink, 0-1 separate**.

## 1. Caveats (read first)

1. **Not Google, and US-only.** WebSearch returns a flat list of links from its own index and says it is US-only. It has no country or language setting, so the FR/ES/DE lists are not google.fr / google.es / google.de results. Some are mostly foreign-language pages: F4 has 3 French pages out of 10 and S4 has 4 Spanish pages out of 10 (section 8). Treat the FR/ES/DE conclusions as provisional.
2. **No SERP features.** Ads, featured snippets and "People also ask" can't be told apart from the list. "Top 10" means the first 10 unique normalized links in the order returned.
3. **One run per keyword**, as briefed. The methodology recommends several WebSearch runs per keyword because results vary between sessions.
4. **No search volume.** WebSearch gives none, so each cluster's primary keyword is its broadest phrasing (or the keyword that connects the cluster), not the highest-volume one. Check volumes before finalizing.
5. **No failures.** All 28 searches returned between 15 and 24 links, and every keyword produced 10 unique normalized URLs. Nothing had to be estimated.
6. **Normalization**, as briefed: lowercase host; strip the protocol, `www.`, the trailing slash, the query string and the fragment. Both `chrome.google.com/webstore/...` and `chromewebstore.google.com/...` become `chromewebstore.google.com/detail/<id>`, which merges the `?hl=`, `/reviews`, `/related` and slug variants of one store item. When normalization made two results inside the top 10 identical, I kept the first one and filled the list from the next result. This affected 13 keywords (section 11). The pair tables also show three sensitivity variants: **literal first-10** (no filling), **`/amp` copies merged**, and **all returned results** (15-24 links).
7. **Query stripping** merged two different justgeek.fr articles (`?p=52857` and `?p=72646`) into one URL, `justgeek.fr`. This affects only F2 and changes no overlap. Every `?p=` URL shared by two keywords came from the identical raw URL in both.
8. **Low overlap between store-listing SERPs is partly structural.** The index holds dozens of near-identical blocker extensions, plus chromeboard.com copies of them. Each phrasing surfaces a different subset, so URL overlap stays at 0-3 even when the result type is the same (9-10/10 listings).
9. **focusfence.dev does not appear** in any of the 28 result lists (0 raw links mention "focusfence").

## 2. Summary: clusters and target pages

Target vocabulary: **Blog guide**, **Comparison page**, **Landing page**, and **Chrome Web Store listing** (for store-listing queries, where the landing page can't win alone; FocusFence is not on the store yet).

| Cluster | Primary keyword | Secondary keywords | Intent | Evidence (top-10 overlap; dominant result type) | Target page |
|---|---|---|---|---|---|
| EN-1 | block websites on chrome | how to block a website on chrome | informational | 2 = interlink (6 across all returned results); how-to 10/10 in both | Blog guide (one guide for both: judgment call, see EN-1) |
| EN-2 | website blocker chrome extension | site blocker chrome; free website blocker chrome; website blocker with password chrome | transactional | 2-3 = interlink; listings 9-10/10 | Chrome Web Store listing + landing page |
| EN-3 | chrome extension to block websites | none | transactional | max 1 = separate; listings 8/10 | Chrome Web Store listing + landing page |
| EN-4 | block youtube shorts on chrome | chrome extension to block youtube shorts | transactional | 4 = same cluster; listings 9-10/10 | Chrome Web Store listing; blog guide for the 1 how-to slot |
| EN-5 | block websites during work hours chrome | chrome extension to block websites at certain times | transactional | 2 = interlink; listings 10/10 and 9/10 | Chrome Web Store listing + landing-page section |
| EN-6 | block distracting websites | none | commercial (mixed) | 0; 5 listings + 5 how-to | Blog guide |
| EN-7 | pomodoro timer chrome extension with website blocker | none | transactional | 0; listings 7/10 | Chrome Web Store listing + landing-page section |
| EN-8 | focus mode chrome extension | none | transactional (name-ambiguous) | 0; directory pages 9/10 | Chrome Web Store listing (low priority) |
| EN-9 | blocksite alternative | none | commercial | 0; listicles/reviews 8/10 | Comparison page |
| EN-10 | block reddit on chrome | none | transactional (mixed) | 2 with E1 = interlink; listings 7/10 | Section of the EN-1 guide; mention in the listing |
| FR-1 | bloquer un site sur chrome | none | informational | 2 with F3 = interlink; how-to 9/10 | Blog guide (FR) |
| FR-2 | extension chrome bloquer site | none | commercial (mixed) | 2 with F1 = interlink; mixed | Landing page (FR) + French store listing |
| FR-3 | bloqueur de site gratuit | none | commercial | 0; listicles/reviews 6/10 | Comparison page (FR) |
| FR-4 | bloquer shorts youtube | none | informational | 0; news 6/10 | Blog guide (FR), low confidence |
| ES-1 | bloquear páginas web en chrome | extensión para bloquear páginas web (7 = same page); bloqueador de páginas web (5-6 = same cluster) | informational | 5-7; how-to 9-10/10 | Blog guide (ES), one page |
| ES-2 | bloquear shorts de youtube | none | informational | 0; how-to 6/10 | Blog guide (ES) |
| DE-1a | websites blockieren chrome | webseiten blockieren chrome (9 = same page) | informational | 9; how-to 8/10 | Blog guide (DE), one page |
| DE-1b | website blocker chrome kostenlos | none (same cluster as D1: 4) | commercial | 4 with D1, 3 with D2; mixed (4 listings, 3 listicles) | Comparison page (DE) + German store listing |
| DE-2 | youtube shorts blockieren | none | informational | 0; how-to 6/10 | Blog guide (DE) |

## 3. EN

### Keywords

| Code | Keyword | Short label | Intent | Dominant result type | Flag |
|---|---|---|---|---|---|
| E1 | block websites on chrome | block-sites-chrome | informational | dominated by how-to guides (10/10): how-to guides 10 | NEEDS A GUIDE (10/10 how-to) |
| E2 | how to block a website on chrome | how-to-block-site | informational | dominated by how-to guides (10/10): how-to guides 10 | NEEDS A GUIDE (10/10 how-to) |
| E3 | website blocker chrome extension | blocker-extension | transactional | dominated by store listings (10/10): store listings 10 (Chrome Web Store 7, extension-directory mirrors 3) | STORE-LISTING QUERY (10/10 listings, 7 on the Chrome Web Store) |
| E4 | free website blocker chrome | free-blocker | transactional | dominated by store listings (9/10): store listings 9 (Chrome Web Store 7, extension-directory mirrors 2); listicles/reviews 1 | STORE-LISTING QUERY (9/10 listings, 7 on the Chrome Web Store) |
| E5 | chrome extension to block websites | ext-to-block-sites | transactional | dominated by store listings (8/10): store listings 8 (Chrome Web Store 7, extension-directory mirrors 1); listicles/reviews 1; how-to guides 1 | STORE-LISTING QUERY (8/10 listings, 7 on the Chrome Web Store) |
| E6 | block distracting websites | block-distracting | commercial (mixed with informational) | mixed: store listings 5 (Firefox Add-ons 2, App Store 2, Chrome Web Store 1); how-to guides 5 | mixed SERP |
| E7 | site blocker chrome | site-blocker | transactional | dominated by store listings (10/10): store listings 10 (Chrome Web Store 5, extension-directory mirrors 5) | STORE-LISTING QUERY (10/10 listings, 5 on the Chrome Web Store) |
| E8 | chrome extension to block youtube shorts | shorts-extension | transactional | dominated by store listings (10/10): store listings 10 (Chrome Web Store 3, extension-directory mirrors 7) | STORE-LISTING QUERY (10/10 listings, 3 on the Chrome Web Store) |
| E9 | block youtube shorts on chrome | block-shorts-chrome | transactional | dominated by store listings (9/10): store listings 9 (Chrome Web Store 4, extension-directory mirrors 5); how-to guides 1 | STORE-LISTING QUERY (9/10 listings, 4 on the Chrome Web Store) |
| E10 | block websites during work hours chrome | work-hours | transactional | dominated by store listings (10/10): store listings 10 (Chrome Web Store 10) | STORE-LISTING QUERY (10/10 listings, 10 on the Chrome Web Store) |
| E11 | chrome extension to block websites at certain times | certain-times | transactional | dominated by store listings (9/10): store listings 9 (Chrome Web Store 9); other 1 (open-source project directory) | STORE-LISTING QUERY (9/10 listings, 9 on the Chrome Web Store) |
| E12 | pomodoro timer chrome extension with website blocker | pomodoro-blocker | transactional | dominated by store listings (7/10): store listings 7 (Chrome Web Store 7); listicles/reviews 1; other 1 (wiki page about one extension); unclassified ?p= shortlinks 1 | STORE-LISTING QUERY (7/10 listings, 7 on the Chrome Web Store) |
| E13 | focus mode chrome extension | focus-mode | transactional (name-ambiguous: many different extensions are called 'Focus Mode') | dominated by store listings (9/10): store listings 9 (extension-directory mirrors 9); other 1 (code repository) | STORE-LISTING QUERY (9/10 listings, 0 on the Chrome Web Store) |
| E14 | website blocker with password chrome | password-blocker | transactional | dominated by store listings (9/10): store listings 9 (Chrome Web Store 5, Firefox Add-ons 3, extension-directory mirrors 1); unclassified ?p= shortlinks 1 | STORE-LISTING QUERY (9/10 listings, 5 on the Chrome Web Store) |
| E15 | blocksite alternative | blocksite-alt | commercial | dominated by listicles/reviews (8/10): listicles/reviews 8 (listicles 6, reviews/write-ups 2); unclassified ?p= shortlinks 1; forum threads 1 | COMPARISON/LISTICLE QUERY (8/10) |
| E16 | block reddit on chrome | block-reddit | transactional (mixed with informational) | dominated by store listings (7/10): store listings 7 (Chrome Web Store 4, extension-directory mirrors 2, Firefox Add-ons 1); how-to guides 2; forum threads 1 | STORE-LISTING QUERY (7/10 listings, 4 on the Chrome Web Store) |

### Overlap matrix (shared top-10 URLs; bold = 4 or more)

| | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12 | E13 | E14 | E15 | E16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **E1** block-sites-chrome | 10 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| **E2** how-to-block-site | 2 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **E3** blocker-extension | 0 | 0 | 10 | 2 | 1 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| **E4** free-blocker | 0 | 0 | 2 | 10 | 1 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 3 | 0 | 0 |
| **E5** ext-to-block-sites | 0 | 0 | 1 | 1 | 10 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 |
| **E6** block-distracting | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **E7** site-blocker | 0 | 0 | 2 | 2 | 0 | 0 | 10 | 0 | 0 | 1 | 0 | 0 | 0 | 2 | 0 | 0 |
| **E8** shorts-extension | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | **4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **E9** block-shorts-chrome | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **4** | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **E10** work-hours | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 10 | 2 | 0 | 0 | 1 | 0 | 0 |
| **E11** certain-times | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 10 | 0 | 0 | 0 | 0 | 0 |
| **E12** pomodoro-blocker | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 |
| **E13** focus-mode | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 |
| **E14** password-blocker | 0 | 0 | 1 | 3 | 1 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 10 | 0 | 0 |
| **E15** blocksite-alt | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 |
| **E16** block-reddit | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |

### Pairs with overlap 2+ under any variant

| Pair | Top-10 overlap | Class | Shared hosts (top-10) | Literal first-10 | /amp merged | All returned results | Shared URLs |
|---|---|---|---|---|---|---|---|
| E1-E2 | 2 | interlink | 2 | 2 (interlink) | 2 (interlink) | 6 (same cluster) | `kinsta.com`<br>`laptopmag.com/how-to/how-to-block-a-website-on-google-chrome` |
| E1-E16 | 2 | interlink | 1 | 2 (interlink) | 2 (interlink) | 2 (interlink) | `kinsta.com/blog/how-to-block-a-website-on-chrome`<br>`kinsta.com/se/blog/hur-man-kan-blockera-webbplatser-chrome` |
| E3-E4 | 2 | interlink | 2 | 2 (interlink) | 2 (interlink) | 3 (interlink) | `chromewebstore.google.com/detail/ifdepgnnjpnbkcgempionjablajancjc`<br>`chromewebstore.google.com/detail/pohdmcmfjhjnocjjhoobmhbgonebakad` |
| E3-E5 | 1 | separate | 2 | 1 (separate) | 1 (separate) | 5 (same cluster) | `chromewebstore.google.com/detail/pohdmcmfjhjnocjjhoobmhbgonebakad` |
| E3-E7 | 2 | interlink | 2 | 2 (interlink) | 2 (interlink) | 4 (same cluster) | `chromewebstore.google.com/detail/gppkhppnogcgodjackcgcfoepdngfcpm`<br>`chromewebstore.google.com/detail/ifdepgnnjpnbkcgempionjablajancjc` |
| E3-E10 | 1 | separate | 1 | 1 (separate) | 1 (separate) | 3 (interlink) | `chromewebstore.google.com/detail/ifdepgnnjpnbkcgempionjablajancjc` |
| E4-E5 | 1 | separate | 2 | 1 (separate) | 1 (separate) | 2 (interlink) | `chromewebstore.google.com/detail/pohdmcmfjhjnocjjhoobmhbgonebakad` |
| E4-E7 | 2 | interlink | 2 | 1 (separate) | 2 (interlink) | 2 (interlink) | `chromewebstore.google.com/detail/eiimnmioipafcokbfikbljfdeojpcgbh`<br>`chromewebstore.google.com/detail/ifdepgnnjpnbkcgempionjablajancjc` |
| E4-E14 | 3 | interlink | 2 | 2 (interlink) | 3 (interlink) | 3 (interlink) | `chromewebstore.google.com/detail/eiimnmioipafcokbfikbljfdeojpcgbh`<br>`chromewebstore.google.com/detail/ifdepgnnjpnbkcgempionjablajancjc`<br>`chromewebstore.google.com/detail/pgoeobojimoocdnilcajmjihiabcmabn` |
| E7-E14 | 2 | interlink | 2 | 2 (interlink) | 2 (interlink) | 2 (interlink) | `chromewebstore.google.com/detail/eiimnmioipafcokbfikbljfdeojpcgbh`<br>`chromewebstore.google.com/detail/ifdepgnnjpnbkcgempionjablajancjc` |
| E8-E9 | 4 | same cluster | 2 | 4 (same cluster) | 4 (same cluster) | 11 (same page) | `chromeboard.com/extension/block-youtube-shorts-dahbkndkpjkpahhldlkeoodleojbcokn`<br>`chromeboard.com/extension/block-youtube-shorts-—-sh-hineadfehgklomeomhnofpihfpoahkpf`<br>`chromewebstore.google.com/detail/iiohlajanokhbaimiclmahallbcifcdj`<br>`chromewebstore.google.com/detail/mdfinipnjnpgkdhmopphfgbnjhbipelk` |
| E10-E11 | 2 | interlink | 1 | 0 (separate) | 2 (interlink) | 2 (interlink) | `chromewebstore.google.com/detail/ijoanhpbaehdhndeebfefblgnelcmllc`<br>`chromewebstore.google.com/detail/mfpkhkclkiccmflolbijcdfdpemlbllg` |

### Strict threshold result (connected groups at overlap 4+)

- {E8, E9}: E8-E9=4
- Singletons (no overlap >= 4 with any same-language keyword): E1, E2, E3, E4, E5, E6, E7, E10, E11, E12, E13, E14, E15, E16

### Clusters and target pages

Only one EN pair reaches the same-cluster threshold. The groupings below follow the thresholds and use the methodology's tie-break for the 3-4 range. Any recommendation that goes beyond the strict numbers is flagged as such.

**EN-1 How to block websites on Chrome**
- Primary: `block websites on chrome` (E1). Secondary: `how to block a website on chrome` (E2).
- Evidence: both SERPs are 10/10 how-to guides, but the top-10 overlap is only 2 (interlink). Across all returned results they share 6 URLs: Kinsta ×2, Laptop Mag, Setapp, Android Authority and WP Engine. E2's top 10 contains 5 laptopmag.com URLs, 2 of them `/uk/` and `/au/` copies of the same article, which pushes the shared URLs below position 10.
- Intent: informational. **Needs a guide.**
- Target: **one blog guide**. This is a judgment call. The strict threshold (2) says two interlinked pages, but intent and result type are identical and overlap below position 10 is high. To follow the threshold strictly, give E2 its own short page that links to the E1 guide.
- Interlink: E16 `block reddit on chrome` shares both Kinsta guides with E1 (overlap 2). Add a "block one specific site, e.g. Reddit" section.

**EN-2 Website blocker extension (store-listing group)**
- Primary: `website blocker chrome extension` (E3). Secondary: `site blocker chrome` (E7), `free website blocker chrome` (E4), `website blocker with password chrome` (E14).
- Evidence: store listings and directory mirrors fill 10, 10, 9 and 9 of the 10 results. E4-E14 = 3 is in the ambiguous range; the tie-break (same intent, same result type) keeps them together. E3-E4, E3-E7, E4-E7 and E7-E14 = 2 each (interlink). No pair reaches 4. FocusGuard (`ifdep…`) recurs in E3, E4, E7, E14 and E10, and BlockSite (`eiimn…`) in E4, E7 and E14.
- Intent: transactional. **Store-listing queries: the landing page can't win them alone.**
- Target: the **Chrome Web Store listing**, whose title, summary and description should carry "website blocker", "site blocker", "free" and "password". The **landing page** should use E3 as its head term and link to the listing once it is live. E4's only non-listing result is a listicle (opal.so, #1). E14 includes 3 Firefox Add-ons pages, which a Chrome listing can't take.

**EN-3 `chrome extension to block websites` (E5)**
- Evidence: max overlap 1 (with E3, E4, E11 and E14), so separate by threshold. It shares 5 URLs with E3 across all returned results. Listings take 8/10, plus a Slashgear listicle and a Tom's Guide how-to.
- Intent: transactional. **Store-listing query.**
- Target: **Chrome Web Store listing + landing page**, the same assets as EN-2. Because the threshold makes it a separate cluster, cover this phrasing in the listing copy rather than giving it its own page.

**EN-4 YouTube Shorts blocking (the only EN threshold cluster)**
- Primary: `block youtube shorts on chrome` (E9). Secondary: `chrome extension to block youtube shorts` (E8).
- Evidence: overlap 4, same cluster: Remove Shorts for YouTube, Shorts Blocker for YouTube and 2 chromeboard pages. They share 11 URLs across all returned results. Listings take 10/10 (E8) and 9/10 (E9); the only other result is a dev.to how-to (E9, #4).
- Intent: transactional. **Store-listing queries.**
- Target: **Chrome Web Store listing** that leads with the path rule (block youtube.com/shorts and keep the rest of YouTube). A **blog guide** can compete for the one how-to slot.

**EN-5 Scheduled blocking**
- Primary: `block websites during work hours chrome` (E10). Secondary: `chrome extension to block websites at certain times` (E11).
- Evidence: overlap 2, interlink (DistractBlock, Time Blocker); 0 in the literal first-10 variant. Listings take 10/10 (all Chrome Web Store) and 9/10.
- Intent: transactional. **Store-listing queries.**
- Target: **Chrome Web Store listing** (schedules) plus a schedules section on the **landing page**. Neither top 10 contains a how-to or any other article.

**EN-6 `block distracting websites` (E6)**: 0 overlap with every EN keyword.
- Evidence: mixed. 5 listings (Firefox Add-ons 2, App Store 2, Chrome Web Store 1) and 5 how-to/advice posts. 4 of those posts are on vendor blogs (Freedom ×2, CurrentWare, RescueTime); the fifth is on Substack.
- Intent: commercial, mixed with informational.
- Target: **blog guide**. The article half is winnable; most listings are for other browsers or platforms. The landing page can also use the phrase in its copy.

**EN-7 `pomodoro timer chrome extension with website blocker` (E12)**: 0 overlap.
- Evidence: 7/10 Chrome Web Store listings, 1 gridfiti listicle, 1 Habitica wiki page and 1 unclassified gridfiti shortlink.
- Intent: transactional. **Store-listing query.**
- Target: **Chrome Web Store listing** (mention Pomodoro focus sessions in the summary) plus a landing-page feature section.

**EN-8 `focus mode chrome extension` (E13)**: 0 overlap.
- Evidence: 9/10 extension-directory pages (chromeboard 7, extensionauditor 2) for different extensions literally named "Focus Mode", plus 1 GitHub repo. No Chrome Web Store page is in the top 10.
- Intent: transactional, but the name is ambiguous. **Store-listing query (directory-dominated).**
- Target: use "focus mode" in the **Chrome Web Store listing** copy. Low priority.

**EN-9 `blocksite alternative` (E15)**: 0 overlap.
- Evidence: 8/10 listicles/reviews: AlternativeTo, theme404, TaskGate, Rigorous Themes, Digital Zen, Compsmag, a TechRadar review and a Cisdem review. The rest are 1 Mozilla support thread and 1 unclassified link. Two of the listicles are competitors' own "BlockSite alternative" pages (TaskGate, Digital Zen).
- Intent: commercial.
- Target: **comparison page** (FocusFence as a BlockSite alternative).

**EN-10 `block reddit on chrome` (E16)**: interlinks with E1 (2).
- Evidence: 7/10 listings, mostly Reddit-specific blockers (Reddit Liberation, Reddit Blocker). Also 2 how-to (the Kinsta guides shared with E1) and 1 NextDNS forum thread.
- Intent: transactional, mixed with informational. **Store-listing query.**
- Target: a Reddit section in the **EN-1 guide** to compete for the how-to slots, and a mention of Reddit in the store listing. Reddit-specific extensions hold the listing slots.

## 4. FR

### Keywords

| Code | Keyword | Short label | Intent | Dominant result type | Flag |
|---|---|---|---|---|---|
| F1 | bloquer un site sur chrome | bloquer-site-chrome | informational | dominated by how-to guides (9/10): how-to guides 9; unclassified ?p= shortlinks 1 | NEEDS A GUIDE (9/10 how-to) |
| F2 | bloqueur de site gratuit | bloqueur-gratuit | commercial | dominated by listicles/reviews (6/10): listicles/reviews 6 (reviews/write-ups 2, listicles 4); how-to guides 2; other 2 (software download portal x2) | COMPARISON/LISTICLE QUERY (6/10) |
| F3 | extension chrome bloquer site | extension-bloquer | commercial (mixed with informational) | mixed: listicles/reviews 5 (reviews/write-ups 4, listicles 1); how-to guides 4; store listings 1 (Chrome Web Store 1) | mixed SERP |
| F4 | bloquer shorts youtube | bloquer-shorts | informational | dominated by news articles (6/10): news articles 6; how-to guides 3; unclassified ?p= shortlinks 1 | NEWS-DRIVEN (6/10 news) |

### Overlap matrix

| | F1 | F2 | F3 | F4 |
|---|---|---|---|---|
| **F1** bloquer-site-chrome | 10 | 0 | 2 | 0 |
| **F2** bloqueur-gratuit | 0 | 10 | 0 | 0 |
| **F3** extension-bloquer | 2 | 0 | 10 | 0 |
| **F4** bloquer-shorts | 0 | 0 | 0 | 10 |

### Pairs with overlap 2+ under any variant

| Pair | Top-10 overlap | Class | Shared hosts (top-10) | Literal first-10 | /amp merged | All returned results | Shared URLs |
|---|---|---|---|---|---|---|---|
| F1-F3 | 2 | interlink | 2 | 2 (interlink) | 2 (interlink) | 4 (same cluster) | `avg.com/fr/signal/how-to-block-websites-chrome`<br>`mackeeper.com/fr/blog/bloquer-un-site-sur-chrome` |

### Strict threshold result

- Singletons (no overlap >= 4 with any same-language keyword): F1, F2, F3, F4

### Clusters and target pages

No FR pair reaches 4. The highest is F1-F3 = 2 (interlink).

**FR-1 `bloquer un site sur chrome` (F1)**: interlinks with F3 (2: AVG, MacKeeper; 4 across all returned results).
- Evidence: 9/10 how-to guides (OpenReplay, MacKeeper, Proton, Kinsta, AVG, Guru99, Hostinger, Google's Chrome Enterprise help, FlashGet) and 1 unclassified Kinsta shortlink. All 10 pages are in French.
- Intent: informational. **Needs a guide.**
- Target: **blog guide (FR)**.

**FR-2 `extension chrome bloquer site` (F3)**
- Evidence: mixed. 4 write-ups, all versions of one Korben article about the Block Site extension (FR ×2, EN, JA); 4 how-to (Avast, MacKeeper, AVG FR, AVG PT); 1 Spanish listicle; 1 Chrome Web Store listing (BlockSite, `hl=pt-BR`). Only 5 of the 10 pages are in French.
- Intent: commercial, mixed with informational.
- Target: **landing page (FR)**, linked from the FR-1 guide, plus a French store listing. The EN counterpart (E5) is store-dominated (8/10), but only 1 listing appears here. That gap may come from the US-only index rather than from google.fr; this tool can't tell.

**FR-3 `bloqueur de site gratuit` (F2)**: 0 overlap.
- Evidence: 6/10 listicles/reviews, 2 how-to and 2 download portals (Clubic, FileHippo). One listicle is about ad blockers (codeur.com) and two are Spanish/Portuguese AirDroid lists.
- Intent: commercial.
- Target: **comparison page (FR)** on free site blockers; also put "gratuit" in the FR landing-page copy. Expect mixed intent: the SERP also covers ad blockers and desktop software (URL Blocker, URL Disabler).

**FR-4 `bloquer shorts youtube` (F4)**: 0 overlap.
- Evidence: 6/10 news articles about YouTube's own Shorts limit (Siècle Digital, January 2026; Korben; Root Nation; others), 3 how-to and 1 unclassified link. Only 3 of the 10 pages are in French, and 4 of its top-10 URLs also appear in the ES Shorts SERP (S4).
- Intent: informational.
- Target: **blog guide (FR)** that covers YouTube's built-in Shorts limit as well as blocking youtube.com/shorts in Chrome. Low confidence in this SERP.

## 5. ES

### Keywords

| Code | Keyword | Short label | Intent | Dominant result type | Flag |
|---|---|---|---|---|---|
| S1 | bloquear páginas web en chrome | bloquear-chrome | informational | dominated by how-to guides (10/10): how-to guides 10 | NEEDS A GUIDE (10/10 how-to) |
| S2 | bloqueador de páginas web | bloqueador | informational | dominated by how-to guides (9/10): how-to guides 9; other 1 (tag archive page) | NEEDS A GUIDE (9/10 how-to) |
| S3 | extensión para bloquear páginas web | extension-bloquear | informational | dominated by how-to guides (9/10): how-to guides 9; store listings 1 (Firefox Add-ons 1) | NEEDS A GUIDE (9/10 how-to) |
| S4 | bloquear shorts de youtube | bloquear-shorts | informational | dominated by how-to guides (6/10): how-to guides 6; news articles 3; store listings 1 (Chrome Web Store 1) | NEEDS A GUIDE (6/10 how-to) |

### Overlap matrix

| | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| **S1** bloquear-chrome | 10 | **5** | **7** | 0 |
| **S2** bloqueador | **5** | 10 | **6** | 0 |
| **S3** extension-bloquear | **7** | **6** | 10 | 0 |
| **S4** bloquear-shorts | 0 | 0 | 0 | 10 |

### Pairs with overlap 2+ under any variant

| Pair | Top-10 overlap | Class | Shared hosts (top-10) | Literal first-10 | /amp merged | All returned results | Shared URLs |
|---|---|---|---|---|---|---|---|
| S1-S2 | 5 | same cluster | 3 | 5 (same cluster) | 6 (same cluster) | 6 (same cluster) | `genbeta.com/paso-a-paso/como-bloquear-pagina-web-google-chrome`<br>`hostinger.com/ar/tutoriales/como-bloquear-una-pagina-web-en-chrome`<br>`hostinger.com/co/tutoriales`<br>`hostinger.com/mx/tutoriales`<br>`nordvpn.com/es/blog/como-bloquear-una-pagina-web` |
| S1-S3 | 7 | same page | 3 | 7 (same page) | 6 (same cluster) | 7 (same page) | `genbeta.com/navegadores/como-bloquear-paginas-web-google-chrome`<br>`genbeta.com/paso-a-paso/como-bloquear-pagina-web-google-chrome`<br>`genbeta.com/paso-a-paso/como-bloquear-pagina-web-google-chrome/amp`<br>`hostinger.com/ar/tutoriales/como-bloquear-una-pagina-web-en-chrome`<br>`hostinger.com/co/tutoriales`<br>`hostinger.com/mx/tutoriales`<br>`nordvpn.com/es/blog/como-bloquear-una-pagina-web` |
| S2-S3 | 6 | same cluster | 4 | 6 (same cluster) | 6 (same cluster) | 8 (same page) | `genbeta.com/paso-a-paso/como-bloquear-pagina-web-google-chrome`<br>`hostinger.com/ar/tutoriales/como-bloquear-una-pagina-web-en-chrome`<br>`hostinger.com/co/tutoriales`<br>`hostinger.com/es/tutoriales/como-bloquear-una-pagina-web-en-chrome`<br>`hostinger.com/mx/tutoriales`<br>`nordvpn.com/es/blog/como-bloquear-una-pagina-web` |

### Strict threshold result

- {S1, S2, S3}: S1-S2=5, S1-S3=7, S2-S3=6
- Singletons (no overlap >= 4 with any same-language keyword): S4

### Clusters and target pages

**ES-1 Bloquear páginas web (threshold cluster)**
- Primary: `bloquear páginas web en chrome` (S1). Secondary: `extensión para bloquear páginas web` (S3, same page at 7) and `bloqueador de páginas web` (S2, same cluster at 5 with S1 and 6 with S3).
- Evidence: 9-10/10 how-to in all three. The shared core is Genbeta, Hostinger (co/mx/ar/es) and NordVPN. S1-S3 drops from 7 to 6 if Genbeta's `/amp` copies are merged with their originals.
- Intent: informational. **Needs a guide.**
- Target: **one blog guide (ES)** for all three. S2 could get its own post if its volume justifies it (no volume data here). Unlike the EN equivalent, S3's top 10 contains no Chrome Web Store page.

**ES-2 `bloquear shorts de youtube` (S4)**: 0 overlap.
- Evidence: 6/10 how-to, 3 news and 1 Chrome Web Store listing (Remove Shorts for YouTube). 5 of the 10 pages are in Portuguese.
- Intent: informational. **Needs a guide.**
- Target: **blog guide (ES)**.

## 6. DE

### Keywords

| Code | Keyword | Short label | Intent | Dominant result type | Flag |
|---|---|---|---|---|---|
| D1 | websites blockieren chrome | websites-blockieren | informational | dominated by how-to guides (8/10): how-to guides 8; unclassified ?p= shortlinks 1; listicles/reviews 1 | NEEDS A GUIDE (8/10 how-to) |
| D2 | webseiten blockieren chrome | webseiten-blockieren | informational | dominated by how-to guides (8/10): how-to guides 8; unclassified ?p= shortlinks 1; listicles/reviews 1 | NEEDS A GUIDE (8/10 how-to) |
| D3 | website blocker chrome kostenlos | blocker-kostenlos | commercial | mixed: store listings 4 (Chrome Web Store 3, Firefox Add-ons 1); listicles/reviews 3; how-to guides 2; unclassified ?p= shortlinks 1 | mixed SERP |
| D4 | youtube shorts blockieren | shorts-blockieren | informational | dominated by how-to guides (6/10): how-to guides 6; store listings 2 (Firefox Add-ons 2); news articles 2 | NEEDS A GUIDE (6/10 how-to) |

### Overlap matrix

| | D1 | D2 | D3 | D4 |
|---|---|---|---|---|
| **D1** websites-blockieren | 10 | **9** | **4** | 0 |
| **D2** webseiten-blockieren | **9** | 10 | 3 | 0 |
| **D3** blocker-kostenlos | **4** | 3 | 10 | 0 |
| **D4** shorts-blockieren | 0 | 0 | 0 | 10 |

### Pairs with overlap 2+ under any variant

| Pair | Top-10 overlap | Class | Shared hosts (top-10) | Literal first-10 | /amp merged | All returned results | Shared URLs |
|---|---|---|---|---|---|---|---|
| D1-D2 | 9 | same page | 8 | 9 (same page) | 9 (same page) | 13 (same page) | `avast.com/de-de/c-block-websites-chrome`<br>`giga.de/downloads/google-chrome/tipps/seiten-sperren-webseiten-unter-firefox-chrome-blockieren`<br>`guru99.com/de/how-to-block-websites-on-google-chrome.html`<br>`hostinger.com/de/tutorials`<br>`kinsta.com/de`<br>`kinsta.com/de/blog/wie-man-webseiten-auf-chrome-blockiert`<br>`mackeeper.com/de/blog/websiten-in-chrome-blockieren`<br>`proton.me/de/blog/how-to-block-websites-chrome`<br>`techlockdown.com/de/artikel/erwachsenen-websites-blockieren-chrome` |
| D1-D3 | 4 | same cluster | 3 | 4 (same cluster) | 4 (same cluster) | 5 (same cluster) | `kinsta.com/de`<br>`kinsta.com/de/blog/wie-man-webseiten-auf-chrome-blockiert`<br>`mackeeper.com/de/blog/websiten-in-chrome-blockieren`<br>`techlockdown.com/de/artikel/Chrome-Erweiterungen-zum-Blockieren-von-Websites` |
| D2-D3 | 3 | interlink | 3 | 3 (interlink) | 3 (interlink) | 3 (interlink) | `kinsta.com/de`<br>`kinsta.com/de/blog/wie-man-webseiten-auf-chrome-blockiert`<br>`mackeeper.com/de/blog/websiten-in-chrome-blockieren` |

### Strict threshold result

- {D1, D2, D3}: D1-D2=9, D1-D3=4, D2-D3=3
- Singletons (no overlap >= 4 with any same-language keyword): D4

### Clusters and target pages

**DE-1 Websites blockieren (threshold cluster, two pages)**
- **DE-1a.** Primary: `websites blockieren chrome` (D1). Secondary: `webseiten blockieren chrome` (D2). They are the same page: 9 shared URLs in the top 10, 13 across all returned results. Both are 8/10 how-to. Intent: informational. **Needs a guide.** Target: **one blog guide (DE)**. D1 is primary because it is the keyword linked to D3; choose by volume if you have it.
- **DE-1b.** `website blocker chrome kostenlos` (D3) is in the same cluster through D1 (4) and interlinks with D2 (3, ambiguous range). Tie-break: its intent differs (commercial, not informational), so it gets its own page. The SERP is mixed: 4 listings (Chrome Web Store 3, Firefox Add-ons 1), 3 listicles (FamiSafe, AirDroid, techlockdown), 2 how-to and 1 unclassified link. Target: **comparison page (DE)** on free website blockers for Chrome, plus a German store listing for the listing slots. Link it both ways with DE-1a, and put "kostenlos" in the DE landing-page copy.

**DE-2 `youtube shorts blockieren` (D4)**: 0 overlap.
- Evidence: 6/10 how-to, 2 Firefox Add-ons listings and 2 news articles.
- Intent: informational. **Needs a guide.**
- Target: **blog guide (DE)**.

## 7. Result types per keyword

Flags are set at 6 or more of 10 results. **STORE-LISTING QUERY** counts official store listings (Chrome Web Store, Firefox Add-ons, App Store) together with third-party extension-directory copies (chromeboard.com, extensionauditor.com, browsertotal). **NEEDS A GUIDE** counts how-to guides. Below 6 for every type, the SERP is marked mixed.

| Code | CWS | Firefox AMO | App Store | Ext. directory mirrors | How-to | Listicle | Review | Forum | News | Other | Unclassified | Flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NEEDS A GUIDE (10/10 how-to) |
| E2 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NEEDS A GUIDE (10/10 how-to) |
| E3 | 7 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (10/10 listings, 7 on the Chrome Web Store) |
| E4 | 7 | 0 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (9/10 listings, 7 on the Chrome Web Store) |
| E5 | 7 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (8/10 listings, 7 on the Chrome Web Store) |
| E6 | 1 | 2 | 2 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | mixed SERP |
| E7 | 5 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (10/10 listings, 5 on the Chrome Web Store) |
| E8 | 3 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (10/10 listings, 3 on the Chrome Web Store) |
| E9 | 4 | 0 | 0 | 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (9/10 listings, 4 on the Chrome Web Store) |
| E10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | STORE-LISTING QUERY (10/10 listings, 10 on the Chrome Web Store) |
| E11 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | STORE-LISTING QUERY (9/10 listings, 9 on the Chrome Web Store) |
| E12 | 7 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 1 | STORE-LISTING QUERY (7/10 listings, 7 on the Chrome Web Store) |
| E13 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | STORE-LISTING QUERY (9/10 listings, 0 on the Chrome Web Store) |
| E14 | 5 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | STORE-LISTING QUERY (9/10 listings, 5 on the Chrome Web Store) |
| E15 | 0 | 0 | 0 | 0 | 0 | 6 | 2 | 1 | 0 | 0 | 1 | COMPARISON/LISTICLE QUERY (8/10) |
| E16 | 4 | 1 | 0 | 2 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | STORE-LISTING QUERY (7/10 listings, 4 on the Chrome Web Store) |
| F1 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 1 | NEEDS A GUIDE (9/10 how-to) |
| F2 | 0 | 0 | 0 | 0 | 2 | 4 | 2 | 0 | 0 | 2 | 0 | COMPARISON/LISTICLE QUERY (6/10) |
| F3 | 1 | 0 | 0 | 0 | 4 | 1 | 4 | 0 | 0 | 0 | 0 | mixed SERP |
| F4 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 6 | 0 | 1 | NEWS-DRIVEN (6/10 news) |
| S1 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | NEEDS A GUIDE (10/10 how-to) |
| S2 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 1 | 0 | NEEDS A GUIDE (9/10 how-to) |
| S3 | 0 | 1 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | NEEDS A GUIDE (9/10 how-to) |
| S4 | 1 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 3 | 0 | 0 | NEEDS A GUIDE (6/10 how-to) |
| D1 | 0 | 0 | 0 | 0 | 8 | 1 | 0 | 0 | 0 | 0 | 1 | NEEDS A GUIDE (8/10 how-to) |
| D2 | 0 | 0 | 0 | 0 | 8 | 1 | 0 | 0 | 0 | 0 | 1 | NEEDS A GUIDE (8/10 how-to) |
| D3 | 3 | 1 | 0 | 0 | 2 | 3 | 0 | 0 | 0 | 0 | 1 | mixed SERP |
| D4 | 0 | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 2 | 0 | 0 | NEEDS A GUIDE (6/10 how-to) |

- **Store-listing queries** (the landing page can't win them alone): E3, E4, E5, E7, E8, E9, E10, E11, E12, E13, E14 and E16. That is 12 of the 16 EN keywords; no FR, ES or DE keyword qualifies (caveat 1). E13's listings are all directory pages; it has no Chrome Web Store page.
- **Needs a guide** (how-to dominated): E1, E2, F1, S1, S2, S3, S4, D1, D2 and D4.
- **Comparison/listicle**: E15 and F2. **News-driven**: F4. **Mixed**: E6, F3 and D3.

## 8. Language mix of FR/ES/DE results

Languages are judged from each result's URL locale and returned title. Store and directory pages are listed separately, with the locale the raw link carried.

| Code | Keyword | Target-language pages | Other-language pages | Store/directory pages (locale) |
|---|---|---|---|---|
| F1 | bloquer un site sur chrome | 10 | 0 | 0 |
| F2 | bloqueur de site gratuit | 8 | es 1, pt 1 | 0 |
| F3 | extension chrome bloquer site | 5 | es 1, en 1, ja 1, pt 1 | hl=pt-BR |
| F4 | bloquer shorts youtube | 3 | es 5, pt 2 | 0 |
| S1 | bloquear páginas web en chrome | 10 | 0 | 0 |
| S2 | bloqueador de páginas web | 10 | 0 | 0 |
| S3 | extensión para bloquear páginas web | 9 | 0 | es-CL |
| S4 | bloquear shorts de youtube | 4 | pt 5 | hl=es-419 |
| D1 | websites blockieren chrome | 10 | 0 | 0 |
| D2 | webseiten blockieren chrome | 10 | 0 | 0 |
| D3 | website blocker chrome kostenlos | 6 | 0 | hl=lv, no locale, de, hl=ro |
| D4 | youtube shorts blockieren | 7 | uk 1 | nl, de |

## 9. Competitors

### Hosts appearing most often (all hosts, top-10 sets)

| Host | Keyword SERPs (of 28) | URL slots | EN/FR/ES/DE SERPs |
|---|---|---|---|
| chromewebstore.google.com | 15 | 74 | 12/1/1/1 |
| chromeboard.com | 9 | 33 | 9/0/0/0 |
| techlockdown.com | 9 | 10 | 0/2/3/4 |
| kinsta.com | 7 | 14 | 3/1/0/3 |
| hostinger.com | 6 | 14 | 0/1/3/2 |
| addons.mozilla.org | 6 | 10 | 3/0/1/2 |
| mackeeper.com | 6 | 6 | 0/2/1/3 |
| airdroid.com | 5 | 7 | 0/1/2/2 |
| genbeta.com | 3 | 8 | 0/0/3/0 |
| korben.info | 3 | 6 | 0/3/0/0 |
| parental-control.flashget.com | 3 | 4 | 0/2/0/1 |
| avast.com | 3 | 3 | 0/1/0/2 |

### Competing domains in 2+ SERPs (excluding stores, extension directories, code hosts and Google/Mozilla help)

| Host | Keyword SERPs (of 28) | URL slots | EN/FR/ES/DE SERPs |
|---|---|---|---|
| techlockdown.com | 9 | 10 | 0/2/3/4 |
| kinsta.com | 7 | 14 | 3/1/0/3 |
| hostinger.com | 6 | 14 | 0/1/3/2 |
| mackeeper.com | 6 | 6 | 0/2/1/3 |
| airdroid.com | 5 | 7 | 0/1/2/2 |
| genbeta.com | 3 | 8 | 0/0/3/0 |
| korben.info | 3 | 6 | 0/3/0/0 |
| parental-control.flashget.com | 3 | 4 | 0/2/0/1 |
| avast.com | 3 | 3 | 0/1/0/2 |
| giga.de | 3 | 3 | 0/0/0/3 |
| guru99.com | 3 | 3 | 0/1/0/2 |
| nordvpn.com | 3 | 3 | 0/0/3/0 |
| proton.me | 3 | 3 | 0/1/0/2 |
| laptopmag.com | 2 | 6 | 2/0/0/0 |
| avg.com | 2 | 3 | 0/2/0/0 |
| dio.me | 2 | 3 | 0/1/1/0 |
| famisafe.wondershare.com | 2 | 3 | 0/1/0/1 |
| marketing4ecommerce.net | 2 | 2 | 0/1/1/0 |
| movieguide.org | 2 | 2 | 0/1/1/0 |

The top 5 competing domains are techlockdown.com (9 SERPs), kinsta.com (7), hostinger.com (6, or 7 counting hostinger.ph in E1), mackeeper.com (6) and airdroid.com (5). Most of their appearances are in FR/ES/DE SERPs, as localized vendor how-to content. In EN, the non-store results are thinly spread: kinsta.com appears in 3 SERPs, laptopmag.com in 2 and every other host in 1. Vendors of blocking or parental-control products appear with their own content: Freedom, Opal, RescueTime and CurrentWare (E4, E6); TaskGate and Digital Zen (E15); FamiSafe, FlashGet and AirDroid (FR/ES/DE).

### Per language

- **EN** (16 SERPs): all hosts: chromewebstore.google.com 12, chromeboard.com 9, addons.mozilla.org 3, kinsta.com 3, laptopmag.com 2; excluding stores/directories: kinsta.com 3, laptopmag.com 2, alternativeto.net 1, androidauthority.com 1, awesome.ecosyste.ms 1
- **FR** (4 SERPs): all hosts: korben.info 3, avg.com 2, mackeeper.com 2, parental-control.flashget.com 2, techlockdown.com 2; excluding stores/directories: korben.info 3, avg.com 2, mackeeper.com 2, parental-control.flashget.com 2, techlockdown.com 2
- **ES** (4 SERPs): all hosts: genbeta.com 3, hostinger.com 3, nordvpn.com 3, techlockdown.com 3, airdroid.com 2; excluding stores/directories: genbeta.com 3, hostinger.com 3, nordvpn.com 3, techlockdown.com 3, airdroid.com 2
- **DE** (4 SERPs): all hosts: techlockdown.com 4, giga.de 3, kinsta.com 3, mackeeper.com 3, addons.mozilla.org 2; excluding stores/directories: techlockdown.com 4, giga.de 3, kinsta.com 3, mackeeper.com 3, airdroid.com 2

### Competing extensions (Chrome Web Store items in 2+ top-10 sets)

| Extension (name from returned titles/slugs) | ID | SERPs as CWS listing | SERPs incl. chromeboard mirror | Keywords |
|---|---|---|---|---|
| FocusGuard - Free Site Blocker | `ifdepgnnjpnbkcgempionjablajancjc` | 5 | 5 | E3, E4, E7, E10, E14 |
| BlockSite: Block Websites & Stay Focused | `eiimnmioipafcokbfikbljfdeojpcgbh` | 4 | 4 | E4, E7, E14, D3 |
| Remove Shorts for YouTube | `mdfinipnjnpgkdhmopphfgbnjhbipelk` | 3 | 3 | E8, E9, S4 |
| Website Blocker | `pohdmcmfjhjnocjjhoobmhbgonebakad` | 3 | 3 | E3, E4, E5 |
| Web Site Blocker | `aoabjfoanlljmgnohepbkimcekolejjn` | 2 | 2 | E3, D3 |
| Site Blocker Free | `glelkmjlfnjmjejlnimifmmopjnocgkk` | 2 | 2 | E5, E11 |
| Lightweight Blocker | `gppkhppnogcgodjackcgcfoepdngfcpm` | 2 | 2 | E3, E7 |
| Shorts Blocker for YouTube | `iiohlajanokhbaimiclmahallbcifcdj` | 2 | 2 | E8, E9 |
| Time Blocker | `ijoanhpbaehdhndeebfefblgnelcmllc` | 2 | 2 | E10, E11 |
| Block Site (password-protected) | `lebiggkccaodkkmjeimmbogdedcpnmfb` | 2 | 2 | E5, E14 |
| DistractBlock | `mfpkhkclkiccmflolbijcdfdpemlbllg` | 2 | 2 | E10, E11 |
| SiteSentry / Site Blocker | `pgoeobojimoocdnilcajmjihiabcmabn` | 2 | 2 | E4, E14 |
| Website Blocker - Block Sites, Focus Timer & Productivity Tools | `kniediipngcpmbmpeacaoinhoeipfina` | 1 | 2 | E3, E4 |
| (name not captured) | `dahbkndkpjkpahhldlkeoodleojbcokn` | 0 | 2 | E8, E9 |
| (name not captured) | `hineadfehgklomeomhnofpihfpoahkpf` | 0 | 2 | E8, E9 |

## 10. Existing FocusFence blog posts against these SERPs

These matches come from the post slugs in `docs/blog/`; I did not read the posts.
- `best-free-website-blocker-chrome-2026` matches E4: 9/10 listings. Its only article slot is a listicle (opal.so, #1).
- `block-websites-during-work-hours-chrome` matches E10: 10/10 Chrome Web Store listings and no article in the top 10.
- `block-youtube-shorts-chrome` matches E9: 9/10 listings and one how-to slot (dev.to).

In this sample, all three target SERPs mainly reward store listings.

## 11. Data-quality checks

- Raw results returned per keyword: min 15, max 24. Every keyword yielded 10 unique normalized URLs.
- Keywords where normalization merged duplicate results inside the top-10 window (filled from the next results): E3 (2 collapsed, 10th unique URL at raw position 12); E4 (5 collapsed, 10th unique URL at raw position 15); E5 (3 collapsed, 10th unique URL at raw position 13); E7 (2 collapsed, 10th unique URL at raw position 12); E8 (1 collapsed, 10th unique URL at raw position 11); E11 (6 collapsed, 10th unique URL at raw position 16); E12 (1 collapsed, 10th unique URL at raw position 11); E14 (5 collapsed, 10th unique URL at raw position 15); E15 (1 collapsed, 10th unique URL at raw position 11); E16 (4 collapsed, 10th unique URL at raw position 14); F2 (1 collapsed, 10th unique URL at raw position 11); F3 (1 collapsed, 10th unique URL at raw position 11); D3 (1 collapsed, 10th unique URL at raw position 11)
- URLs in top-10 sets that came from a `?p=` URL (query stripped per the rule): `alternativeto.net/software/blocksite` <- ?p=2, ?p=3 [E15] (pagination of one page merged); `compsmag.com` <- ?p=347766 [E15] (single source); `gridfiti.com` <- ?p=10965 [E12] (single source); `hostinger.com/co/tutoriales` <- ?p=36306 [S1, S2, S3] (single source); `hostinger.com/de/tutorials` <- ?p=4179 [D1, D2] (single source); `hostinger.com/mx/tutoriales` <- ?p=36306 [S1, S2, S3] (single source); `hostinger.ph/tutorials` <- ?p=36288 [E1] (single source); `justgeek.fr` <- ?p=52857, ?p=72646 [F2] (DIFFERENT pages merged); `kinsta.com` <- ?p=78912 [E1, E2] (single source); `kinsta.com/de` <- ?p=38618 [D1, D2, D3] (single source); `kinsta.com/fr` <- ?p=42005 [F1] (single source); `logmeonce.com/resources` <- ?p=16887 [E14] (single source); `merca20.com` <- ?p=775535 [F4] (single source); `softwaretestinghelp.com` <- ?p=180985 [E2] (single source)
- Percent-decoding collisions among all 360 normalized URLs: 0; case-only collisions: 0.
- Cross-language observation, not used for clustering: 4 of F4's top-10 URLs also appear in S4's top 10 (movieguide.org/es, techlockdown.com/es, marketing4ecommerce.net, dio.me).

## 12. Files

- `clusters.md` (this file) and `serp.json` (for each keyword: its language, the 10 normalized URLs in order, intent and result types) are kept in `design/seo-copy/keywords/`.
- The raw search results and the throwaway analysis scripts were not committed. To refresh the data, rerun the method in `.claude/skills/seo-cluster/references/serp-overlap-methodology.md` with the keyword list in section 2.
