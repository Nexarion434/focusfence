// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/*
 * Build-time configuration. scripts/build.mjs rewrites DEV to false for the
 * store package. DEV=true enables the "Simulate Pro" switch and disables all
 * ExtensionPay network calls.
 */
self.FF_CONFIG = Object.freeze({
  DEV: true,
  EXTPAY_ID: 'focusfence-dev', // extension id registered on extensionpay.com
  SOURCE_URL: 'https://github.com/Nexarion434/focusfence', // AGPL: where users can get the source
  PRIVACY_URL: 'https://nexarion434.github.io/focusfence/privacy.html', // GitHub Pages (docs/)
  // Must match the plans configured in ExtensionPay (amounts and plan nicknames).
  // EUR for users whose locale region is in the eurozone, USD for everyone else
  // (see FFCore.pricingFor). Displayed with Intl currency formatting.
  PRICES: Object.freeze({
    USD: Object.freeze({ currency: 'USD', monthly: 2.99, yearly: 19.99, plans: Object.freeze({ monthly: 'monthly', yearly: 'yearly' }) }),
    EUR: Object.freeze({ currency: 'EUR', monthly: 2.99, yearly: 19.99, plans: Object.freeze({ monthly: 'monthly-eur', yearly: 'yearly-eur' }) }),
  }),
});
