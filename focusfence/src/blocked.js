// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
'use strict';
(function () {
  const C = self.FFCore;
  const { send, logo, fence, fenceItems, fmtCountdown } = self.FFUI;
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

  $('mark').innerHTML = logo(20);
  $('site').textContent = host || t('thisSite');

  /* The scene: your fence, one glass pill per blocked site, the site you tried in the middle
     holding the light; the same row again, flipped by CSS, is its reflection in the ground. The
     pills are sized by CSS from the window, so resizing needs no rebuild. */
  function buildWall(items, lit, state) {
    for (const node of [$('wall'), $('mirror')]) fence(node, { items, lit, state, min: 5, max: 11, rise: true });
  }
  const here = () => [{ key: 'here', label: host, letter: (host[0] || '·').toUpperCase() }];

  /* The words come first: in a short window, or with a long note and a focus session, the fence
     gets smaller (narrower, so shorter pills) until the words have their room above it. */
  function fit() {
    const wrap = document.querySelector('.wrap');
    const kids = [...wrap.children].filter((k) => k.getBoundingClientRect().height);
    if (!kids.length) return;
    const cs = getComputedStyle(wrap);
    const copy = kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
    const floor = document.querySelector('.floor').getBoundingClientRect().height;
    const room = window.innerHeight - floor - 16 - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - copy;
    document.body.style.setProperty('--pw-fit', Math.max(24, Math.floor(room / 2.7)) + 'px');
  }
  window.addEventListener('resize', fit);
  document.fonts.ready.then(fit);
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
      if (!$('session').classList.contains('hidden')) {
        $('session').classList.add('hidden');
        fit();
      }
      return;
    }
    if ($('session').classList.contains('hidden')) {
      $('session').classList.remove('hidden');
      fit();
    }
    $('session-text').textContent = t(
      'sessionLeft',
      pomodoro.phase === 'focus' ? t('statusFocus') : t('phaseBreak'),
      fmtCountdown(left)
    );
  }

  async function init() {
    let state;
    try {
      state = await send('getState');
    } catch (e) {
      buildWall(here(), 'here', 'up');
      throw e;
    }
    const entry = C.findMatchingEntry(state.settings.entries, hash, state.isPro);
    if (entry && entry.type !== 'domain') $('site').textContent = entry.label;
    const items = fenceItems(state.settings.entries, state.isPro, C.isProEntry);
    buildWall(entry ? items : here().concat(items), entry ? entry.id : 'here', state.strict.active ? 'strict' : state.pomodoro ? 'focus' : 'up');
    const custom = state.isPro && state.settings.blockMessage;
    $('message').textContent = custom || C.quote(Math.floor(Math.random() * C.QUOTES.length));
    fit();
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
