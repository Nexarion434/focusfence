// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/*
 * Build-time configuration. scripts/build.mjs rewrites DEV to false for the
 * store package. DEV=true enables the "Simulate Pro" switch and disables all
 * ExtensionPay network calls.
 */
self.FF_CONFIG = Object.freeze({
  DEV: true,
  EXTPAY_ID: 'focusfence', // placeholder: replace with the id registered on extensionpay.com
  SOURCE_URL: 'https://github.com/Nexarion434/focusfence', // AGPL: where users can get the source
  PRIVACY_URL: 'https://nexarion434.github.io/focusfence/privacy.html', // GitHub Pages (docs/)
  // Must match the plans configured in ExtensionPay. Displayed with Intl currency formatting.
  PRICES: { currency: 'USD', monthly: 2.99, yearly: 19.99 },
});
