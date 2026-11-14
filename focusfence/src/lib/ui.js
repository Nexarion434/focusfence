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

  /**
   * The fence's shape for n pills (n odd), position by position: its distance from the light (d),
   * which side of it it stands (side), its height as a share of the tallest (k), how much of the
   * light it catches (t) and how much of it shows (v).
   *   k: a gentle bell. The end pills are always 0.575 of the middle one (about 1.7 times shorter),
   *      whatever the count: with the middle pill 1.6 times as tall as wide, the ends are a little
   *      wider than tall, like the owner's reference.
   *   v: the ends fade, but only to about two thirds of their neighbour (they stay visible glass).
   */
  function pillProfile(n) {
    const m = (n - 1) / 2;
    return Array.from({ length: n }, (_, p) => {
      const d = Math.abs(p - m);
      const x = m ? d / m : 0;
      return {
        d,
        side: Math.sign(p - m),
        k: 0.575 + 0.425 * Math.cos((Math.PI * x) / 2) ** 2,
        t: d === 0 ? 1 : Math.exp(-d / 1.25),
        v: m >= 2 && d === m ? 0.6 : m >= 2 && d === m - 1 ? 0.92 : 1,
      };
    });
  }

  /** A decorative row of n pills, the light in the middle (the Plan's fence, the strict gate, the
      block page's miniature, onboarding's windows): the same shape as every fence. */
  function pillRow(node, n, { lock = false } = {}) {
    node.textContent = '';
    node.append(el('span', { class: 'fence-halo' }));
    for (const pr of pillProfile(n)) {
      const p = pill(pr, pr.d === 0 ? 'lit' : '');
      if (lock && pr.d === 0) p.appendChild(el('b', { class: 'lock' }));
      node.appendChild(p);
    }
    node.append(el('span', { class: 'fence-pool' }));
    return node;
  }

  /** One pill, shaped by its place in the profile (values set through the CSSOM: the CSP allows no inline styles). */
  function pill(prof, cls, letter) {
    const p = el('span', { class: 'pill' + (cls ? ' ' + cls : '') }, letter ? el('b', { class: 'pill-letter', text: letter }) : null);
    p.style.setProperty('--k', prof.k.toFixed(3));
    p.style.setProperty('--t0', prof.t.toFixed(3));
    p.style.setProperty('--v0', prof.v.toFixed(2));
    p.style.setProperty('--side', String(prof.side));
    p.style.setProperty('--i', String(prof.d));
    return p;
  }

  /**
   * The fence: a short row of glass pills, one per entry, the light in the middle. The lit pill is
   * the `lit` entry (default: the first), the others stand on either side in list order. The row is
   * never shorter than `min` (spare pills are fainter) nor longer than `max` (the ends fade), and
   * always odd, so it stays symmetrical. Re-rendering the same entries only changes the posture
   * (data-state), so CSS animates it; a new entry's pill rises, and with `rise` every pill rises on
   * the first render. Decorative (aria-hidden): the surrounding text says the same in words.
   *   items: [{ key, label, letter, off }]   state: up|focus|paused|down|strict|empty
   */
  function fence(node, { items = [], state = 'up', lit = null, min = 5, max = 9, progress = null, rise = false } = {}) {
    const real = items.length;
    let n = Math.min(max, Math.max(min, real));
    if (n % 2 === 0) n += n < max ? 1 : -1;
    const m = (n - 1) / 2;
    const at = Math.max(0, items.findIndex((x) => x.key === lit));
    const ordered = real ? [items[at], ...items.slice(0, at), ...items.slice(at + 1)] : [];
    const slots = new Array(n).fill(null);
    ordered.slice(0, n).forEach((it, j) => (slots[m + Math.ceil(j / 2) * (j % 2 ? -1 : 1)] = it));
    const sig = n + ':' + slots.map((x) => (x ? x.key + (x.off ? '~' : '') : '_')).join('|');
    node.setAttribute('aria-hidden', 'true');
    node.classList.add('fence');
    node.dataset.state = real ? state : 'empty';
    node.style.setProperty('--n', String(n)); // a page may size the pills from their number
    node.style.setProperty('--progress', progress === null ? '0%' : Math.round(progress * 1000) / 10 + '%');
    if (node.dataset.sig === sig) return node;
    const before = new Set([...node.querySelectorAll('.pill')].map((p) => p.dataset.key).filter(Boolean));
    const first = !node.dataset.sig;
    node.dataset.sig = sig;
    node.textContent = '';
    if (real) node.append(el('span', { class: 'fence-halo' }));
    const prof = pillProfile(n);
    slots.forEach((it, p) => {
      const pr = prof[p];
      const fresh = !!it && (first ? rise : !before.has(it.key));
      const cls = [!real ? 'ghost' : it ? '' : 'pad', it && pr.d === 0 ? 'lit' : '', it && it.off ? 'off' : '', fresh ? 'enter' : '']
        .filter(Boolean)
        .join(' ');
      const pk = pill(pr, cls, it && pr.d === 0 ? it.letter : '');
      if (it) {
        pk.dataset.key = it.key;
        if (it.label) pk.title = it.label;
      }
      node.appendChild(pk);
    });
    if (real) node.append(el('span', { class: 'fence-pool' }));
    return node;
  }

  /** Fence items for a settings entry list (keyword rules get a #). */
  function fenceItems(entries, isPro, isProEntry) {
    return entries.map((e) => ({
      key: e.id,
      label: e.label,
      letter: e.type === 'keyword' ? '#' : (String(e.host || e.label).replace(/^www\./, '')[0] || '?').toUpperCase(),
      off: !isPro && isProEntry(e),
    }));
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

  root.FFUI = { logo, send, toast, el, requestAccess, siteAvatar, siteHue, icon, fence, fenceItems, pillProfile, pill, pillRow, fmtCountdown, fmtTime, errorMessage };
})(self);
