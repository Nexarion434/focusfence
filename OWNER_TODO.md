# FocusFence: owner actions before publication

Everything below needs the owner's accounts, money or decisions, so it was left for you. Paths are relative to the repo root; the extension lives in `focusfence/`.
Current state: PR #1 open, 100 automated tests green. Repo **public**; site **live** at https://focusfence.dev/ (custom domain; privacy: `/privacy.html`), also in French (`/fr/`), Spanish (`/es/`) and German (`/de/`). The store zip `focusfence/dist/focusfence-1.0.1.zip` passes the pre-submission checks (`npm run cws:check`: MV3, icons, no remote code, 206 KB). UI, listings and screenshots in English, French, Spanish and German. Logo: **Picket F** (design/logo direction 1) is integrated in the icons, UI, website, screenshots and promo tiles.

## Costs at a glance

| # | Expense | Amount | When | Required? |
|---|---|---|---|---|
| 1 | Chrome Web Store developer registration | **US$5, one-time** (covers all your extensions; confirm the amount on the registration page) | Before the first upload | **Yes** |
| 2 | Stripe card processing (through ExtensionPay) | **≈ 2.9% + US$0.30 per US card payment** (EUR payments are charged at Stripe's rate for European cards, which depends on your account country: check stripe.com/pricing), about +1–1.5% for international cards, +1% if currency conversion applies. No monthly fee | Per sale | Yes, if you sell Pro |
| 3 | ExtensionPay service fee | **5% per transaction, at time of charge.** No up-front cost, no monthly fee (source: extensionpay.com pricing section, checked 2026-11-13; "lower fees and flat monthly rates are available for high-volume accounts"). Payments land in **your own Stripe account**, so Stripe's fees (#2) come **on top** | Per sale | Yes, if you sell Pro |
| 4 | GitHub Pages (custom domain focusfence.dev) | **US$0**: the repo is public | — | Done, free |
| 5 | Sales tax / VAT handling (e.g. Stripe Tax or an accountant) | Variable, to check with your accountant | Ongoing | Depends on where you sell |
| 6 | Legal review of AGPL licensing / privacy policy | Variable | Once | Optional, recommended |
| 7 | Domain `focusfence.dev` | **Already registered** by you at Hostinger (check the yearly renewal price there). Mail is handled by iCloud. Pointing the website at it is optional | Yearly renewal | Yes, for the contact email |

**What you actually keep per payment** (ExtensionPay 5% + Stripe 2.9% + $0.30, US cards; international cards cost more; before taxes):

| Plan | Price | ExtensionPay (5%) | Stripe (2.9% + $0.30) | Total fees | You keep |
|---|---|---|---|---|---|
| Monthly | $2.99 | $0.15 | $0.39 | **$0.54 (≈ 18%)** | **≈ $2.45** |
| Yearly | $19.99 | $1.00 | $0.88 | **$1.88 (≈ 9.4%)** | **≈ $18.11** |

On the monthly plan, 18% goes to fees, mostly because of Stripe's fixed 30¢. Over 12 months a monthly subscriber nets ≈ $29.45 and a yearly one ≈ $18.11. Monthly brings more per user but has higher churn. Consider promoting yearly, or $3.99/month (fees ≈ 15%).

## 1. Merge the code

- [ ] Review and merge **PR #1** (`feat/focusfence-v1` → `main`): https://github.com/Nexarion434/focusfence/pull/1
      Agents are not allowed to merge on this server.

## 2. Repository, website and custom domain

Repo made public on 2026-11-13 after a history scan: gitleaks 8.21.2 found 0 leaks, and a grep of every blob found no tokens, keys, `.env`, local paths or personal emails. The only identity in the history is the commit author `Steve (agents-paradev) <hello@retype.studio>`.

- [x] Repo **public**; GitHub Pages serves `/docs`, currently from **`feat/focusfence-v1`** because `main` isn't merged yet.
- [x] Custom domain **https://focusfence.dev/**:
  - DNS at Hostinger: the 4 GitHub Pages A records on the apex, `www` as a CNAME to `nexarion434.github.io`, and the iCloud MX/SPF records kept.
  - `docs/CNAME` contains `focusfence.dev`; it is written by `npm run docs`, so it survives regeneration.
  - The Pages custom domain is set to `focusfence.dev`.
  - The old https://nexarion434.github.io/focusfence/ URLs redirect to it.
- [ ] **Merge PR #1** (agents may not merge on this server):
      `gh pr merge 1 --repo Nexarion434/focusfence --merge`
- [ ] **Then switch Pages to `main`.** Otherwise the site stops updating, and breaks if the branch is deleted:
      `gh api -X PUT repos/Nexarion434/focusfence/pages -f 'source[branch]=main' -f 'source[path]=/docs' -f cname=focusfence.dev`
      Check that https://focusfence.dev/, `/fr/`, `/es/`, `/de/` and `/privacy.html` return 200, and that the footer's "GNU AGPL v3" link (`/blob/main/focusfence/LICENSE`) works. It returns 404 until `main` has the code.
- [ ] **Enforce HTTPS** once GitHub has issued the certificate for focusfence.dev (Settings → Pages shows it, usually within an hour of the DNS being right):
      `gh api -X PUT repos/Nexarion434/focusfence/pages -F https_enforced=true`
- [ ] Recommended: **verify the domain** for your account (GitHub → Settings → Pages → Verified domains, a TXT record at Hostinger). This prevents domain takeover.
- [x] **Extension privacy link:** since 1.0.1, `PRIVACY_URL` in `focusfence/src/config.js` is `https://focusfence.dev/privacy.html` (it was the github.io address, which redirects).
- [ ] If the domain or repo changes again, update `SITE_URL` in `focusfence/scripts/docs.mjs` (it also writes `docs/CNAME`), `SOURCE_URL`/`PRIVACY_URL` in `focusfence/src/config.js` and the URLs in `focusfence/store/*.md`. Then run `npm run docs` (plus `npm run build` if `config.js` changed).

## 3. Privacy policy contact

- [x] Contact address set to **contact@focusfence.dev**. The live privacy pages in all 4 languages show it as a mailto link (done 2026-11-13).
      To change it later, edit the English file only (`focusfence/store/privacy-policy.md`, Contact line). The French, Spanish and German policies use `{{CONTACT}}` and pick up the same address. Then run `cd focusfence && npm run docs`, commit `docs/` and push.
- [ ] Send a test email to contact@focusfence.dev and check it arrives in iCloud Mail (MX/SPF/DKIM records at Hostinger). Reviewers and users will write there.
- [ ] Custom domain for the website (e.g. `focusfence.dev` → GitHub Pages) is **not** configured. That's your DNS step. If you do it, update `SITE_URL` in `focusfence/scripts/docs.mjs`, `PRIVACY_URL` in `focusfence/src/config.js` and the URLs in `focusfence/store/*.md`, then run `npm run docs && npm run build`.

## 4. Licensing decision

- [ ] Confirm you accept distributing FocusFence under **AGPL-3.0-or-later** (see `focusfence/README.md` → License). The ExtensionPay client declares AGPL-3.0-or-later (its LICENSE file says LGPL-3.0); AGPL for the whole extension complies with either.
- [ ] Optional: ask ExtensionPay which license applies and/or get a legal review (cost #6).

## 5. ExtensionPay (payments)

- [x] ExtensionPay account created and the extension registered: **extension id `focusfence-dev`**, set as `EXTPAY_ID` in `focusfence/src/config.js`. Fee: 5% per transaction (cost #3).
- [x] Stripe connected, with four plans (nicknames), all wired in `PRICES`:
  - `monthly`: US$2.99/month
  - `yearly`: US$19.99/year
  - `monthly-eur`: €2.99/month
  - `yearly-eur`: €19.99/year
- How the currency is chosen: users whose browser locale region is in the eurozone (e.g. `fr`, `de-AT`, `es-ES`, `en-IE`) see € prices and get the EUR plan; everyone else sees $ and gets the USD plan (`es-MX`, `fr-CA` and `en-GB` → USD). The Settings buttons call `openPaymentPage(<nickname>)`.
- [ ] If you change a price or nickname in ExtensionPay, change `PRICES` in `focusfence/src/config.js` to match, then run `npm run build`.
- [ ] Set up tax handling (cost #5). EU VAT matters now that you sell in EUR.

## 6. Manual QA in a real Chrome

Load `focusfence/dist/focusfence/` unpacked after `npm run build`. These checks can't be automated headless.

- [ ] Add a site from the popup and accept Chrome's permission prompt: the block page appears, not the error page.
- [ ] Decline the prompt for another site: it is still blocked (error page) and Settings offers "Allow".
- [ ] Real YouTube: block `youtube.com/shorts`. Shorts are blocked when opened directly and when clicked from the home page; regular videos still play.
- [ ] Real purchase in ExtensionPay **test mode**, once with Chrome's language set to an English (US) locale (USD plan) and once to a eurozone locale such as French or German (EUR plan): the right plan opens and Pro unlocks; "Restore purchase" works on a second profile; offline, Settings shows the "Couldn't reach ExtensionPay" note and keeps Pro.
- [ ] Strict mode: the Incognito warning shows until "Allow in Incognito" is on. Disabling FocusFence during a timed session pauses its clock.
- [ ] Screen reader spot check (e.g. ChromeVox or NVDA) on the popup and Settings. Automated axe checks already pass.

## 7. Chrome Web Store submission

Follow **`focusfence/store/SUBMISSION.md`** screen by screen. It has every value to paste and every file to upload:
- the package, `focusfence/dist/focusfence-1.0.1.zip`
- the listing texts, `focusfence/store/listing/<lang>.md`, and the images, `focusfence/store/assets/`
- the Privacy tab: single purpose, one justification per permission plus host permissions, remote code (No), data usage (four categories ticked; the guide explains why) and the privacy URL
- distribution, reviewer test instructions, the ExtensionPay and Stripe settings to check, and what to do after approval

`tests/store.spec.mjs` keeps the guide in sync with the manifest, the listings, the privacy policy and the images.

- [ ] Merge the release PR (`release/cws-v1`) first: it updates the privacy policy that the data-usage answers rely on.
- [ ] Settle the ExtensionPay privacy link (§11) before the review.
- [ ] Register the developer account (cost #1) and turn on 2-step verification.
- [ ] Complete the **trader / non-trader** declaration (EU Digital Services Act) and the publisher contact details.
- [ ] `cd focusfence && npm test && npm run cws:check`, then upload `focusfence/dist/focusfence-1.0.1.zip`.
- [ ] Fill the Store listing (English, then French, Spanish and German), Privacy, Distribution and Test instructions tabs from the guide.
- [ ] Submit for review. Expect questions about the optional `*://*/*` host permission; the justification is in the guide.

## 8. Translations

- [ ] In the dashboard, add the **French, Spanish and German** listings from `focusfence/store/listing/fr.md`, `es.md` and `de.md`. The name and summary come from `src/_locales/<lang>/messages.json`.
- [ ] For each of those languages, upload its own five screenshots from `focusfence/store/assets/fr/`, `es/` and `de/` (same order as English). The store can't localize promo tiles: one set serves every language.
- [ ] Optional: have a native speaker proofread the UI strings (`focusfence/scripts/i18n/strings.mjs`, one table for all four languages), then run `npm run i18n`.
- [ ] Optional but recommended: have the **website** translations proofread too: `focusfence/scripts/site-strings.mjs` (landing) and `focusfence/store/privacy-policy.{fr,es,de}.md`. The translated policies say the English version prevails. Then run `npm run docs`.

## 9. Marketing (drafts only; nothing was posted)

All drafts are in `marketing/`. Each needs your own account on the platform and your decision to publish.

- [ ] **Product Hunt** (`marketing/product-hunt.md`): launch only after the store listing is live. Never ask for upvotes (PH rules).
- [ ] **Reddit** (`marketing/reddit-r-productivity.md`, `marketing/reddit-r-getdisciplined.md`): read each subreddit's **current** sidebar rules first. They couldn't be fetched while drafting. Use the self-promotion thread if one exists, disclose you're the developer, and keep the r/getdisciplined post link-free.
- [ ] **Blog** (`marketing/blog/*.md`, rendered to `docs/blog/`): proofread, re-check the competitor facts (checked 2026-11-13), then set `draft: false` and run `cd focusfence && npm run docs`. Drafts are rendered with `noindex` and left out of the sitemap, so enabling Pages doesn't index them until you flip the flag.

## 10. After approval

- [ ] Set `STORE_URL` in `focusfence/scripts/docs.mjs` to the store link, run `npm run docs` and `npm test`, commit and open a PR. This replaces the "Coming soon to the Chrome Web Store" status with "Add to Chrome" buttons and adds the install URL to the structured data (details: `focusfence/store/SUBMISSION.md` §9).
- [ ] Reply to early reviews. A Brazilian Portuguese listing would first need a `pt_BR` locale in the extension.

## 11. Search visibility (details in `SEO_AUDIT.md`)

- [ ] **Google Search Console:** add `focusfence.dev` as a *domain* property (a TXT record at Hostinger), then submit `https://focusfence.dev/sitemap.xml`. Search Console is the only first-party source for impressions, queries and indexing.
- [ ] **Bing Webmaster Tools:** import the site from Search Console (one click once GSC is verified). Bing's index also powers Copilot answers.
- [ ] **Legal notice:** France requires *mentions légales* on a commercial site, and Germany an *Impressum*. Both need your legal name and address, so they were not written for you.
- [ ] **ExtensionPay privacy link:** `https://extensionpay.com/privacy`, cited in the privacy policy, still returns HTTP 500 (re-checked 2026-11-14 for the release, with `/privacy-policy`, `/terms` and `/legal`). ExtensionPay has no privacy page, only a privacy paragraph in its home-page FAQ. Options in `focusfence/store/SUBMISSION.md` §0; settle it before the store review.
- [x] **Store name and summary vs. the site:** renamed in 1.0.1 to "FocusFence – Focus App & Website Blocker" (fr "Appli de concentration & bloqueur de sites", es "App de concentración y bloqueador de páginas web", de "Fokus-App & Website-Blocker"), and the summaries now lead with focus (release PR `release/cws-v1`).
- [ ] **Links to the site:** set the GitHub repository's *Website* field to https://focusfence.dev, and use the store listing's website field. Launch posts (Product Hunt, Reddit, AlternativeTo as an alternative to BlockSite or StayFocusd) bring the first links and brand mentions.
