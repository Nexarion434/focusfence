// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
'use strict';
(function () {
  const C = self.FFCore;
  const { send, logo, fmtCountdown } = self.FFUI;
  const { t } = self.FFI18N;
  const $ = (id) => document.getElementById(id);

  // The original URL arrives after '#', put there by the redirect rule.
  const hash = location.hash.slice(1);
  let original = hash;
  try {
    original = decodeURI(hash);
  } catch (e) {
    /* keep raw */
  }
  let host = '';
  try {
    host = new URL(hash).hostname.replace(/^www\./, '');
  } catch (e) {
    host = '';
  }

  $('mark').innerHTML = logo(64);
  $('site').textContent = host || t('thisSite');
  $('url').textContent = original;
  $('url').title = original;
  document.title = host ? t('blockedDocTitleHost', host) : t('blockedDocTitle');

  let pomodoro = null;

  function renderStats(sum) {
    $('today').textContent = sum.today;
    $('week').textContent = sum.total;
  }

  function tick() {
    if (!pomodoro) return;
    const left = pomodoro.endsAt - Date.now();
    if (left <= 0) {
      $('session').classList.add('hidden');
      return;
    }
    $('session').classList.remove('hidden');
    $('session-text').textContent = t(
      'sessionLeft',
      pomodoro.phase === 'focus' ? t('statusFocus') : t('phaseBreak'),
      fmtCountdown(left)
    );
  }

  async function init() {
    const state = await send('getState');
    const entry = C.findMatchingEntry(state.settings.entries, hash, state.isPro);
    if (entry && entry.type !== 'domain') $('site').textContent = entry.label;
    const custom = state.isPro && state.settings.blockMessage;
    $('message').textContent = custom || C.quote(Math.floor(Math.random() * C.QUOTES.length));
    pomodoro = state.pomodoro;
    tick();
    setInterval(tick, 1000);
    renderStats(state.stats);
    // Record the attempt (reloads and back/forward don't count). Stats stay on this device.
    const nav = performance.getEntriesByType('navigation')[0];
    const repeat = nav && (nav.type === 'reload' || nav.type === 'back_forward');
    if (hash && !repeat) {
      const r = await send('recordBlock', { url: hash });
      if (r && r.summary) renderStats(r.summary);
    }
  }

  $('back').addEventListener('click', async () => {
    if (history.length > 1) {
      history.back();
      // If going back lands nowhere (opened in a fresh tab), close the tab instead.
      setTimeout(async () => {
        const tab = await chrome.tabs.getCurrent();
        if (tab) chrome.tabs.update(tab.id, { url: 'chrome://newtab/' });
      }, 400);
    } else {
      const tab = await chrome.tabs.getCurrent();
      if (tab) chrome.tabs.update(tab.id, { url: 'chrome://newtab/' });
    }
  });

  init().catch((e) => console.warn(e));
})();
