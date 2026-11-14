// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/*
 * Tiny i18n layer over chrome.i18n (strings live in _locales/<lang>/messages.json,
 * generated from scripts/i18n/strings.mjs).
 *
 *   t('key', ...subs)                 translated string ($1…$9 substitutions)
 *   plural(n, 'base', ...subs)        uses baseOne / baseOther, $1 = n
 *   apply(root)                       fills [data-i18n], [data-i18n-rich], [data-i18n-attr]
 *   rich(el, text)                    renders {code}/{strong}/{em} markers without innerHTML
 *
 * Markup:
 *   <h2 data-i18n="navSchedule">Schedule</h2>
 *   <p data-i18n-rich="blocklistDesc">…</p>
 *   <input data-i18n-attr="placeholder:addPlaceholder;aria-label:addAria">
 */
(function (root) {
  'use strict';
  const hasI18n = typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage;

  function t(key, ...subs) {
    if (!hasI18n) return key;
    const msg = chrome.i18n.getMessage(key, subs.map((s) => String(s)));
    if (!msg) {
      console.warn('[FocusFence] missing translation', key);
      return key;
    }
    return msg;
  }

  function plural(n, base, ...subs) {
    // Chrome i18n has no plural rules; One/Other covers en/fr/es/de for our counts.
    // (French treats 0 and 1 as singular.)
    const one = n === 1 || (n === 0 && lang().startsWith('fr'));
    return t(base + (one ? 'One' : 'Other'), n, ...subs);
  }

  function lang() {
    try {
      return chrome.i18n.getUILanguage() || 'en';
    } catch (e) {
      return 'en';
    }
  }

  const TAGS = { code: 'code', strong: 'strong', em: 'em' };
  function rich(el, text) {
    el.textContent = '';
    const re = /\{(code|strong|em)\}([\s\S]*?)\{\/\1\}/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      const node = document.createElement(TAGS[m[1]]);
      node.textContent = m[2];
      el.appendChild(node);
      last = re.lastIndex;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
  }

  function apply(scope) {
    const rootEl = scope || document;
    rootEl.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    rootEl.querySelectorAll('[data-i18n-rich]').forEach((el) => rich(el, t(el.dataset.i18nRich)));
    rootEl.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      for (const pair of el.dataset.i18nAttr.split(';')) {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      }
    });
  }

  /** Localized helpers built on Intl (no translation tables needed). */
  const fmt = {
    weekday(date, style) {
      return new Intl.DateTimeFormat(lang(), { weekday: style || 'long' }).format(date);
    },
    time(ts) {
      return new Date(ts).toLocaleTimeString(lang(), { hour: '2-digit', minute: '2-digit' });
    },
    dateTime(ts) {
      return new Date(ts).toLocaleString(lang(), { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    },
    date(ts) {
      return new Date(ts).toLocaleDateString(lang());
    },
    price(amount, currency) {
      return new Intl.NumberFormat(lang(), { style: 'currency', currency: currency || 'USD' }).format(amount);
    },
  };

  root.FFI18N = { t, plural, apply, rich, lang, fmt };

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang();
    // Page scripts are at the end of <body>, so the DOM is ready here.
    apply(document);
    const title = document.querySelector('title[data-i18n]');
    if (title) document.title = t(title.dataset.i18n);
  }
})(typeof self !== 'undefined' ? self : globalThis);
