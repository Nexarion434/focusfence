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
     holding the light; the same row again, flipped by CSS, is its reflection in the floor.
     layout() sizes it. The words come first: the pills are about 132 px wide, but never so tall
     that the words (a long note, a focus session, a short window) lose their room above them. The
     row is at most 1000 px wide; when more sites would need a wider row, fewer pills show (7 at
     most, 5 at least, always odd), never thinner ones. */
  const PW = 132;
  let scene = null; // { items, lit, state } once the blocklist is known
  function layout() {
    const wrap = document.querySelector('.wrap');
    const kids = [...wrap.children].filter((k) => k.getBoundingClientRect().height);
    const cs = getComputedStyle(wrap);
    const copy = kids.length ? kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top : 0;
    const floor = document.querySelector('.floor').getBoundingClientRect().height;
    const room = window.innerHeight - floor - 16 - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - copy;
    const rowMax = Math.min(1000, window.innerWidth - 48);
    let pw = Math.max(20, Math.min(PW, window.innerHeight * 0.2, room / 1.6));
    let n = Math.floor((rowMax + 0.09 * pw) / (1.09 * pw));
    if (n % 2 === 0) n -= 1;
    n = Math.max(5, Math.min(7, n));
    pw = Math.min(pw, rowMax / (1.09 * n - 0.09));
    document.body.style.setProperty('--scene-pw', pw.toFixed(1) + 'px');
    if (scene) for (const node of [$('wall'), $('mirror')]) fence(node, Object.assign({ min: 5, max: n, rise: true }, scene));
  }
  window.addEventListener('resize', layout);
  document.fonts.ready.then(layout);
  const here = () => [{ key: 'here', label: host, letter: (host[0] || '·').toUpperCase() }];
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
        layout();
      }
      return;
    }
    if ($('session').classList.contains('hidden')) {
      $('session').classList.remove('hidden');
      layout();
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
      scene = { items: here(), lit: 'here', state: 'up' };
      layout();
      throw e;
    }
    const entry = C.findMatchingEntry(state.settings.entries, hash, state.isPro);
    if (entry && entry.type !== 'domain') $('site').textContent = entry.label;
    const items = fenceItems(state.settings.entries, state.isPro, C.isProEntry);
    scene = { items: entry ? items : here().concat(items), lit: entry ? entry.id : 'here', state: state.strict.active ? 'strict' : state.pomodoro ? 'focus' : 'up' };
    const custom = state.isPro && state.settings.blockMessage;
    $('message').textContent = custom || C.quote(Math.floor(Math.random() * C.QUOTES.length));
    pomodoro = state.pomodoro;
    tick();
    layout();
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
