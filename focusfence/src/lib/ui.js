/* Shared helpers for FocusFence extension pages. */
(function (root) {
  'use strict';

  const LOGO_SVG =
    '<svg width="SIZE" height="SIZE" viewBox="0 0 32 32" aria-hidden="true">' +
    '<rect width="32" height="32" rx="9" fill="#2E7D6B"/>' +
    '<rect x="6" y="13" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/>' +
    '<rect x="6" y="19" width="20" height="2.4" rx="1.2" fill="#A9D6C8"/>' +
    '<path d="M8.5 10.2 10.5 7l2 3.2V25h-4zM14 10.2 16 7l2 3.2V25h-4zM19.5 10.2 21.5 7l2 3.2V25h-4z" fill="#fff"/>' +
    '</svg>';

  function logo(size) {
    return LOGO_SVG.replace(/SIZE/g, String(size || 24));
  }

  async function send(type, payload) {
    const res = await chrome.runtime.sendMessage(Object.assign({ type }, payload || {}));
    if (!res) throw Object.assign(new Error('No response from FocusFence.'), { code: 'NO_RESPONSE' });
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

  function siteColor(label) {
    let h = 0;
    for (const ch of String(label)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return 'hsl(' + h + ' 32% 46%)';
  }

  function siteAvatar(label) {
    const letter = (String(label).replace(/^www\./, '')[0] || '?').toUpperCase();
    const a = el('span', { class: 'avatar', text: letter });
    a.style.background = siteColor(label);
    return a;
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

  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function errorMessage(err) {
    return (err && err.message) || 'Something went wrong.';
  }

  root.FFUI = { logo, send, toast, el, requestAccess, siteAvatar, fmtCountdown, fmtTime, errorMessage };
})(self);
