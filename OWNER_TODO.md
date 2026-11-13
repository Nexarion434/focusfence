# FocusFence: owner actions before publication

Everything below needs the owner's accounts, money or decisions, so it was left for you. Paths are relative to the repo root; the extension lives in `focusfence/`.
Current state: PR #1 open, 69 automated tests green, store zip in `focusfence/dist/`.

## Costs at a glance

| # | Expense | Amount | When | Required? |
|---|---|---|---|---|
| 1 | Chrome Web Store developer registration | **US$5, one-time** (covers all your extensions; confirm the amount on the registration page) | Before the first upload | **Yes** |
| 2 | Stripe card processing (through ExtensionPay) | **≈ 2.9% + US$0.30 per US card payment**, about +1–1.5% for international cards, +1% if currency conversion applies. No monthly fee | Per sale | Yes, if you sell Pro |
| 3 | ExtensionPay service fee | **To verify on extensionpay.com.** It may take its own cut on top of Stripe; not confirmed while preparing this | Per sale | Yes, if you sell Pro |
| 4 | GitHub Pages while the repo stays **private** | **≈ US$4/month** for GitHub Pro (from memory, check github.com/pricing); **US$0** if the repo is made public | Monthly | Only if you keep the repo private *and* host the site on GitHub |
| 5 | Sales tax / VAT handling (e.g. Stripe Tax or an accountant) | Variable, to check with your accountant | Ongoing | Depends on where you sell |
| 6 | Legal review of AGPL licensing / privacy policy | Variable | Once | Optional, recommended |
| 7 | Custom domain for the website | Optional, not needed (GitHub Pages URL works) | Yearly | No |

**Fee impact on prices (Stripe US rates only, before any ExtensionPay fee):**
- $2.99/month loses about **$0.39 per payment (≈ 13%)**, because the fixed 30¢ hurts small amounts.
- $19.99/year loses about **$0.88 (≈ 4.4%)**.
- So promote the yearly plan, or consider $3.99/month.

## 1. Merge the code

- [ ] Review and merge **PR #1** (`feat/focusfence-v1` → `main`): https://github.com/Nexarion434/focusfence/pull/1
      Agents are not allowed to merge on this server.

## 2. Repository visibility + website (owner decision, not done)

The repo is **private**, and GitHub Pages is **not enabled**: both are your call.

- [ ] Decide on the website host. Either make the repo public (free Pages, and it also satisfies the AGPL "source available" link in the extension), or keep it private and pay for GitHub Pro (cost #4), or host `docs/` anywhere else that serves static files.
      Make public: `gh repo edit Nexarion434/focusfence --visibility public --accept-visibility-change-consequences`
- [ ] Enable Pages from `main` / `/docs` (after step 1):
      `gh api -X POST repos/Nexarion434/focusfence/pages -f 'source[branch]=main' -f 'source[path]=/docs'`
- [ ] Check that https://nexarion434.github.io/focusfence/ and `/privacy.html` load.
- [ ] If the repo stays private, AGPL users can't follow the "Source code" link. The zip itself contains the full source, but publish the source somewhere public or change `SOURCE_URL` in `focusfence/src/config.js`.
- [ ] If the account, repo or host changes, update `SOURCE_URL`/`PRIVACY_URL` in `focusfence/src/config.js`, `SOURCE_URL`/`SITE_URL` in `focusfence/scripts/docs.mjs` and the URLs in `focusfence/store/*.md`. Then run `npm run docs && npm run build`.

## 3. Privacy policy contact

- [ ] Replace `[CONTACT EMAIL — to be filled in before publication]` in `focusfence/store/privacy-policy.md` with a dedicated support address.
- [ ] `cd focusfence && npm run docs`, then commit `docs/` and push.

## 4. Licensing decision

- [ ] Confirm you accept distributing FocusFence under **AGPL-3.0-or-later** (see `focusfence/README.md` → License). The ExtensionPay client declares AGPL-3.0-or-later (its LICENSE file says LGPL-3.0); AGPL for the whole extension complies with either.
- [ ] Optional: ask ExtensionPay which license applies and/or get a legal review (cost #6).

## 5. ExtensionPay (payments)

- [ ] Create an account at https://extensionpay.com, register the extension and note its **extension id**. Check their fee (cost #3).
- [ ] Set `EXTPAY_ID` in `focusfence/src/config.js` (currently the placeholder `focusfence`).
- [ ] Connect Stripe and create two plans with the **nicknames** `monthly` = $2.99/month and `yearly` = $19.99/year. The Settings buttons call `openPaymentPage('monthly' | 'yearly')`.
- [ ] Set up tax handling (cost #5).

## 6. Manual QA in a real Chrome

Load `focusfence/dist/focusfence/` unpacked after `npm run build`. These checks can't be automated headless.

- [ ] Add a site from the popup and accept Chrome's permission prompt: the block page appears, not the error page.
- [ ] Decline the prompt for another site: it is still blocked (error page) and Settings offers "Allow".
- [ ] Real YouTube: block `youtube.com/shorts`. Shorts are blocked when opened directly and when clicked from the home page; regular videos still play.
- [ ] Real purchase in ExtensionPay **test mode**: Pro unlocks; "Restore purchase" works on a second profile; offline, Settings shows the "Couldn't reach ExtensionPay" note and keeps Pro.
- [ ] Strict mode: the Incognito warning shows until "Allow in Incognito" is on. Disabling FocusFence during a timed session pauses its clock.
- [ ] Screen reader spot check (e.g. ChromeVox or NVDA) on the popup and Settings. Automated axe checks already pass.

## 7. Chrome Web Store submission

- [ ] Register the developer account (cost #1) and turn on 2-step verification.
- [ ] Complete the **trader / non-trader** declaration (EU Digital Services Act) and the publisher contact details.
- [ ] `cd focusfence && npm test && npm run build`, then upload `focusfence/dist/focusfence-1.0.0.zip`.
- [ ] Copy listing text, single-purpose statement, permission justifications and privacy answers from `focusfence/store/listing.md`.
- [ ] Upload the 5 screenshots in the order given in `focusfence/store/screenshots.md`, plus `promo-tile-440x280.png`.
- [ ] Privacy policy URL: the published `privacy.html` (from step 2).
- [ ] Submit for review. Expect questions about the optional `*://*/*` host permission; the justification is in the listing file.

## 8. After approval

- [ ] Set `STORE_URL` in `focusfence/scripts/docs.mjs` to the store link, run `npm run docs`, commit and push.
- [ ] Add localized listings (FR, DE, ES, PT-BR) and reply to early reviews.
