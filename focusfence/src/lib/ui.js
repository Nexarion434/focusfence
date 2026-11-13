// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/* Shared helpers for FocusFence extension pages. */
(function (root) {
  'use strict';

  // Picket F logo (design/logo, direction 1). 16-unit grid: crisp at sizes that are
  // multiples of 16 (and of 8 on HiDPI screens). Keep in sync with scripts/icons.mjs.
  const LOGO_SVG =
    '<svg width="SIZE" height="SIZE" viewBox="0 0 16 16" aria-hidden="true">' +
    '<rect x="0" y="0" width="16" height="16" rx="3.5" fill="#3A9A5B"/>' +
    '<polygon points="4,14 4,3.5 5.5,2 7,3.5 7,5 12,5 12,7 7,7 7,9 11,9 11,11 7,11 7,14" fill="#FFFFFF"/>' +
    '</svg>';

  function logo(size) {
    return LOGO_SVG.replace(/SIZE/g, String(size || 24));
  }

  async function send(type, payload) {
    const res = await chrome.runtime.sendMessage(Object.assign({ type }, payload || {}));
    if (!res) throw Object.assign(new Error(i18n('errNoResponse', 'No response from FocusFence.')), { code: 'NO_RESPONSE' });
    if (!res.ok) throw Object.assign(new Error(res.error), { code: res.code });
    return res;
  }

  let toastWrap;
  function toast(message, kind) {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toast-wrap';
      toastWrap.setAttribute('role', 'status');
      toastWrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastWrap);
    }
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'error' ? ' error' : '');
    t.textContent = message;
    toastWrap.appendChild(t);
    setTimeout(() => t.remove(), kind === 'error' ? 4200 : 2600);
  }

  function el(tag, attrs, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  /** Ask Chrome for host access so the block page (instead of an error page) is shown. */
  async function requestAccess(origins) {
    if (!origins || !origins.length) return false;
    try {
      return await chrome.permissions.request({ origins });
    } catch (e) {
      console.warn('permission request failed', e);
      return false;
    }
  }

  /** Stable hue for a site name; the monogram's colours come from it in CSS (see .avatar). */
  function siteHue(label) {
    let h = 0;
    for (const ch of String(label)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  function siteAvatar(label) {
    const letter = (String(label).replace(/^www\./, '')[0] || '?').toUpperCase();
    const a = el('span', { class: 'avatar', text: letter, 'aria-hidden': 'true' });
    a.style.setProperty('--h', String(siteHue(label)));
    return a;
  }

  // In-house icon set: 24-unit grid, 1.7 px rounded strokes (styled by .icon in base.css).
  // Icons in static markup are inlined in the HTML; these are the ones built from script.
  const ICONS = {
    x: '<path d="M7.5 7.5l9 9M16.5 7.5l-9 9"/>',
    plus: '<path d="M12 6.5v11M6.5 12h11"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  };
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function fmtCountdown(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return h + ':' + String(m % 60).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    }
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  function i18n(key, fallback) {
    return root.FFI18N ? root.FFI18N.t(key) : fallback;
  }

  function fmtTime(ts) {
    return root.FFI18N ? root.FFI18N.fmt.time(ts) : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function errorMessage(err) {
    return (err && err.message) || i18n('errGeneric', 'Something went wrong.');
  }

  root.FFUI = { logo, send, toast, el, requestAccess, siteAvatar, siteHue, icon, fmtCountdown, fmtTime, errorMessage };
})(self);
