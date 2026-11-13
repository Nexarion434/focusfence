// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
'use strict';
(function () {
  const C = self.FFCore;
  const { send, toast, logo, el, errorMessage, siteAvatar, pill, pillProfile, pillRow } = self.FFUI;
  const { t, plural, fmt } = self.FFI18N;
  const $ = (id) => document.getElementById(id);
  const MAX = 3;
  const SUGGESTIONS = ['reddit.com', 'youtube.com', 'x.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'news.ycombinator.com', 'netflix.com'];

  const selected = new Set();
  const options = [...SUGGESTIONS];
  let step = 1;

  $('logo').insertAdjacentHTML('afterbegin', logo(24));
  // the two windows of step 2: a fence of five pills each
  for (const row of document.querySelectorAll('.win-fence')) pillRow(row, 5);

  function renderChoices() {
    const wrap = $('choices');
    wrap.textContent = '';
    for (const host of options) {
      const on = selected.has(host);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.dataset.host = host;
      b.setAttribute('aria-pressed', String(on));
      b.append(siteAvatar(host), document.createTextNode(host));
      b.addEventListener('click', () => toggle(host));
      wrap.appendChild(b);
    }
    $('counter').textContent = t('obSelectedCount', selected.size);
    renderStage();
    $('block-selected').disabled = selected.size === 0;
  }

  /* The stage: your fence in the making, and its reflection. Five pills; the three in the middle
     are yours, filled centre first (that one holds the light), then left, then right; a spare pill
     stands at each end (in step 3, the right one is the Pro pill, amber, with a lock). A newly
     picked site's pill rises (decorative; the counter says the same in words). */
  const shownOn = new Set();
  function renderStage() {
    const picked = [...selected];
    const n = 5;
    const m = (n - 1) / 2;
    const order = [m, m - 1, m + 1]; // where the first, second and third picks stand
    const lit = picked.length > 0;
    const prof = pillProfile(n);
    for (const id of ['slots', 'slots-mirror']) {
      const pills = $(id);
      pills.textContent = '';
      for (let p = 0; p < n; p++) {
        const k = order.indexOf(p);
        const host = k >= 0 ? picked[k] : null;
        let cls;
        if (step === 3 && p === n - 1) cls = 'lit pro';
        else if (k < 0) cls = 'pad' + (lit ? '' : ' off');
        else if (!host) cls = 'ghost';
        else cls = k === 0 ? 'lit' : '';
        if (host && !shownOn.has(host)) cls += ' enter';
        const pk = pill(prof[p], cls.trim(), k === 0 && host ? host[0].toUpperCase() : '');
        if (step === 3 && p === n - 1) pk.appendChild(el('b', { class: 'lock' }));
        pills.appendChild(pk);
      }
    }
    for (const h of picked) shownOn.add(h);
    for (const h of [...shownOn]) if (!selected.has(h)) shownOn.delete(h);
    $('ob-row').classList.toggle('is-lit', lit);
    $('ob-mirror').classList.toggle('is-lit', lit);
    $('picked').textContent = picked.join(' · ');
  }

  function toggle(host) {
    if (selected.has(host)) selected.delete(host);
    else if (selected.size >= MAX) {
      $('max-note').hidden = false;
      return;
    } else selected.add(host);
    $('max-note').hidden = true;
    renderChoices();
    const btn = $('choices').querySelector(`[data-host="${CSS.escape(host)}"]`);
    if (btn) btn.focus();
  }

  function go(n) {
    step = n;
    $('ob-stage').dataset.step = String(n);
    renderStage();
    for (const i of [1, 2, 3]) $('step-' + i).hidden = i !== n;
    document.querySelectorAll('.dots li').forEach((d, i) => d.classList.toggle('on', i < n));
    $('step-label').textContent = t('obStep', n, 3);
    const h = $('step-' + n).querySelector('h1');
    h.setAttribute('tabindex', '-1');
    h.focus();
    if (n === 2) checkIncognito();
  }

  async function checkIncognito() {
    let ok = false;
    try {
      ok = await chrome.extension.isAllowedIncognitoAccess();
    } catch (e) {
      ok = false;
    }
    $('incognito-status').classList.toggle('ok', ok);
    $('ob-stage').classList.toggle('incog-ok', ok);
    $('incognito-status-text').textContent = ok ? t('ob2StatusOn') : t('ob2StatusOff');
    return ok;
  }

  $('custom-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('custom-input').value.trim();
    if (!raw) return;
    let parsed;
    try {
      parsed = C.parseEntry(raw, 'domain');
    } catch (err) {
      toast(errorMessage(err), 'error');
      return;
    }
    if (!options.includes(parsed.host)) options.unshift(parsed.host);
    $('custom-input').value = '';
    if (!selected.has(parsed.host)) toggle(parsed.host);
    else renderChoices();
  });

  $('block-selected').addEventListener('click', async () => {
    const hosts = [...selected];
    // Ask for host access for all picked sites in ONE prompt, inside the click gesture.
    const origins = hosts.flatMap(C.originsForHost);
    const permission = chrome.permissions.request({ origins }).catch(() => false);
    let added = 0;
    for (const host of hosts) {
      try {
        const r = await send('addEntry', { raw: host, kind: 'domain' });
        if (!r.duplicate) added++;
      } catch (err) {
        toast(errorMessage(err), 'error');
      }
    }
    await permission;
    if (added) toast(plural(added, 'obAdded'));
    go(2);
  });
  $('skip-1').addEventListener('click', () => go(2));
  $('open-details').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id }));
  $('recheck').addEventListener('click', checkIncognito);
  // Coming back from chrome://extensions: refresh the status automatically.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && step === 2) checkIncognito();
  });
  $('back-2').addEventListener('click', () => go(1));
  $('next-2').addEventListener('click', () => go(3));
  $('back-3').addEventListener('click', () => go(2));

  (async () => {
    try {
      const st = await send('getState');
      $('pro-price').textContent = t(
        'ob3Price',
        fmt.price(st.prices.monthly, st.prices.currency),
        fmt.price(st.prices.yearly, st.prices.currency)
      );
      // Sites already on the list start out selected (e.g. when the tour is reopened).
      for (const e of st.settings.entries) if (e.type === 'domain' && options.includes(e.host) && selected.size < MAX) selected.add(e.host);
    } catch (e) {
      /* worker still starting: prices fill in on the next visit */
    }
    renderChoices();
    $('step-label').textContent = t('obStep', 1, 3);
    document.querySelector('.dots li').classList.add('on');
  })();
})();
