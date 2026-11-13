/*
 * Build-time configuration. scripts/build.mjs rewrites DEV to false for the
 * store package. DEV=true enables the "Simulate Pro" switch and disables all
 * ExtensionPay network calls.
 */
self.FF_CONFIG = Object.freeze({
  DEV: true,
  EXTPAY_ID: 'focusfence', // placeholder: replace with the id registered on extensionpay.com
  PRICES: { monthly: '$2.99/month', yearly: '$19.99/year' },
});
