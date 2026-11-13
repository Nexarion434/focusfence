# FocusFence: owner actions before publication

Everything below needs the owner's accounts, money or legal judgment, so it was left for you. Paths are relative to the repo root; the extension lives in `focusfence/`.

## 1. Merge the code

- [ ] Review and merge **PR #1** (`feat/focusfence-v1` → `main`): https://github.com/Nexarion434/focusfence/pull/1
      The agent did not merge it. The server rules forbid merges by agents.

## 2. Repository visibility + website (GitHub Pages)

GitHub Pages is free only for **public** repositories; a private repo needs a paid plan.
Making the repo public is also the simplest way to honour the AGPL "source available" link shown in the extension.

- [ ] Decide: make the repo public (recommended), or keep it private and pay for Pages.
      `gh repo edit Nexarion434/focusfence --visibility public --accept-visibility-change-consequences`
- [ ] Enable Pages from `main` / `/docs` (after step 1):
      `gh api -X POST repos/Nexarion434/focusfence/pages -f 'source[branch]=main' -f 'source[path]=/docs'`
- [ ] Check https://nexarion434.github.io/focusfence/ and https://nexarion434.github.io/focusfence/privacy.html load.
- [ ] If the repo or account name changes, update `SOURCE_URL` and `PRIVACY_URL` in `focusfence/src/config.js`, `SOURCE_URL`/`SITE_URL` in `focusfence/scripts/docs.mjs`, and the URLs in `focusfence/store/*.md`. Then run `npm run docs && npm run build`.

## 3. Privacy policy contact

- [ ] Replace `[CONTACT EMAIL — to be filled in before publication]` in `focusfence/store/privacy-policy.md` with a support address. Use a dedicated one, not a personal inbox.
- [ ] `cd focusfence && npm run docs`, then commit `docs/` and push.

## 4. Licensing (needs a human decision)

- [ ] Confirm you accept distributing FocusFence under **AGPL-3.0-or-later** (see `focusfence/README.md` → License).
      Reason: the ExtensionPay client declares AGPL-3.0-or-later (its LICENSE file says LGPL-3.0). AGPL for the whole extension complies with either reading.
- [ ] Optional: ask ExtensionPay which license applies (the package is inconsistent) and/or get a quick legal review.
      If a proprietary license is required, the alternative is a clean-room payment client against ExtensionPay's HTTP API. That is not implemented.

## 5. ExtensionPay (payments)

- [ ] Create an account at https://extensionpay.com and register the extension. Note its **extension id**.
- [ ] Set `EXTPAY_ID` in `focusfence/src/config.js` (currently the placeholder `focusfence`).
- [ ] Connect Stripe in ExtensionPay and create two plans with these **nicknames**: `monthly` = $2.99/month and `yearly` = $19.99/year. The Settings buttons call `openPaymentPage('monthly' | 'yearly')`.
- [ ] Check ExtensionPay's and Stripe's fees and your tax setup (VAT/sales tax) before launch.

## 6. Manual QA in a real Chrome (load `focusfence/dist/focusfence/` unpacked after `npm run build`)

- [ ] Add a site from the popup: accept Chrome's permission prompt. The block page should appear, not Chrome's error page.
- [ ] Decline the prompt for another site: it should still be blocked (error page) and Settings should offer "Allow".
- [ ] Real YouTube: block `youtube.com/shorts`. Shorts are blocked when opened directly and when clicked from the home page; regular videos still play.
- [ ] Real purchase with a test card in ExtensionPay's test mode: Pro unlocks; "Restore purchase" works on a second profile.
- [ ] Strict mode: Incognito warning appears until "Allow in Incognito" is on. Disabling FocusFence during a timed session pauses its clock.
- [ ] Light and dark mode, and the popup at 100% and 125% zoom.

## 7. Chrome Web Store

- [ ] Register a Chrome Web Store developer account (one-time US$5 fee) and turn on 2-step verification.
- [ ] Complete the **trader / non-trader** declaration (EU Digital Services Act) and publisher contact details.
- [ ] `cd focusfence && npm test && npm run build`, then upload `focusfence/dist/focusfence-1.0.0.zip`.
- [ ] Copy listing text, single-purpose statement, permission justifications and privacy answers from `focusfence/store/listing.md`.
- [ ] Upload screenshots `focusfence/screenshots/store-1…5-*.png` and the promo tile `promo-tile-440x280.png`.
- [ ] Privacy policy URL: https://nexarion434.github.io/focusfence/privacy.html
- [ ] Submit for review. Expect questions about the optional `*://*/*` host permission. The justification is in the listing file.

## 8. After approval

- [ ] Set `STORE_URL` in `focusfence/scripts/docs.mjs` to the store link, run `npm run docs`, commit and push. The landing page CTA then becomes "Add to Chrome".
- [ ] Add localized listings (FR, DE, ES, PT-BR) for store search, and reply to early reviews.
