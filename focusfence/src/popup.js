// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
'use strict';
(function () {
  const C = self.FFCore;
  const { send, toast, logo, fmtCountdown, fmtTime, requestAccess, errorMessage } = self.FFUI;
  const $ = (id) => document.getElementById(id);

  let state = null;
  let tab = null;
  let pendingAfterUnlock = null;

  $('logo').insertAdjacentHTML('afterbegin', logo(24));

  async function getTargetTab() {
    // ?tabId= lets automated tests point the popup at a specific tab.
    const q = new URLSearchParams(location.search).get('tabId');
    if (q) {
      try {
        return await chrome.tabs.get(Number(q));
      } catch (e) {
        return null;
      }
    }
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    return t || null;
  }

  function openOptions(hash) {
    const url = chrome.runtime.getURL('options.html' + (hash || ''));
    chrome.tabs.create({ url });
    window.close();
  }

  function statusText(s) {
    const n = s.settings.entries.length;
    const sites = n === 1 ? '1 site fenced' : n + ' sites fenced';
    const r = s.status.reason;
    if (s.strict.active) {
      return {
        title: 'Strict mode',
        sub: s.strict.endsAt ? 'Locked until ' + fmtTime(s.strict.endsAt) + ' · ' + sites : 'Locked until you unlock it · ' + sites,
        cls: 'strict',
      };
    }
    if (r === 'focus') return { title: 'Focus session', sub: 'Everything on your list is blocked · ' + sites, cls: '' };
    if (r === 'off') return { title: 'Blocking is off', sub: sites + ' · turn on to block', cls: 'off' };
    if (r === 'outside-schedule') return { title: 'Outside schedule', sub: sites + ' · resumes at next window', cls: 'off' };
    if (r === 'schedule') return { title: 'Blocking is on', sub: 'Schedule active · ' + sites, cls: '' };
    return { title: 'Blocking is on', sub: sites, cls: '' };
  }

  function render() {
    const s = state;
    $('app').setAttribute('aria-busy', 'false');
    const badge = $('plan-badge');
    badge.textContent = s.isPro ? 'PRO' : 'FREE';
    badge.className = 'badge ' + (s.isPro ? 'badge-pro' : '');

    const st = statusText(s);
    $('status-title').textContent = st.title;
    $('status-sub').textContent = st.sub;
    $('status-card').className = 'status card ' + st.cls;

    const toggle = $('toggle-enabled');
    toggle.checked = s.settings.enabled || s.strict.active;
    toggle.disabled = s.strict.active;
    toggle.parentElement.title = s.strict.active ? 'Strict mode is on — blocking cannot be turned off' : 'Turn blocking on or off';

    renderCurrent();
    if (s.strict.active) {
      chrome.extension
        .isAllowedIncognitoAccess()
        .then((ok) => ($('incognito-note').hidden = ok))
        .catch(() => {});
    } else {
      $('incognito-note').hidden = true;
    }

    // focus
    const card = $('focus-card');
    const p = s.pomodoro;
    const cfg = s.settings.pomodoro;
    $('focus-pro').classList.toggle('hidden', s.isPro);
    card.classList.toggle('locked', !s.isPro);
    card.classList.toggle('running', !!p);
    if (p) {
      $('focus-sub').textContent =
        (p.phase === 'focus' ? 'Focusing' : 'Break') + ' · round ' + p.cycle + ' of ' + p.totalCycles;
      $('focus-start').classList.add('hidden');
      $('focus-stop').classList.remove('hidden');
    } else {
      $('focus-sub').textContent = s.isPro
        ? cfg.focusMin + ' min focus · ' + cfg.breakMin + ' min break · ' + cfg.cycles + ' rounds'
        : 'Pomodoro sessions that block everything on your list';
      $('focus-start').classList.remove('hidden');
      $('focus-start').textContent = s.isPro ? 'Start focus' : 'Unlock Pro';
      $('focus-start').className = 'btn ' + (s.isPro ? 'btn-primary' : 'btn-pro');
      $('focus-stop').classList.add('hidden');
    }
    tickTimer();

    const today = s.stats.today;
    $('today-stats').textContent =
      today === 0
        ? 'Nothing blocked yet today'
        : today + ' blocked today · ≈' + C.formatMinutes(s.stats.todayMinutesSaved) + ' reclaimed';
  }

  function renderCurrent() {
    const s = state;
    const host = tab && tab.url ? C.hostFromInput(tab.url) : null;
    const btn = $('quick-add');
    const avatar = $('current-avatar');
    if (!host || !/^https?:/.test(tab.url)) {
      $('current-host').textContent = 'This page';
      $('current-note').textContent = "Browser pages can't be blocked";
      avatar.textContent = '–';
      avatar.style.background = '';
      btn.disabled = true;
      btn.textContent = 'Block site';
      return;
    }
    const fresh = self.FFUI.siteAvatar(host);
    avatar.textContent = fresh.textContent;
    avatar.style.background = fresh.style.background;
    $('current-host').textContent = host;
    const already = s.settings.entries.find((e) => e.type === 'domain' && C.hostMatches(host, e.host));
    if (already) {
      $('current-note').textContent = already.host === host ? 'Already on your blocklist' : 'Covered by ' + already.host;
      btn.disabled = true;
      btn.textContent = 'Blocked';
    } else {
      $('current-note').textContent = 'Current tab';
      btn.disabled = false;
      btn.textContent = 'Block site';
    }
  }

  function tickTimer() {
    const s = state;
    if (!s) return;
    const p = s.pomodoro;
    if (p) {
      const left = p.endsAt - Date.now();
      $('focus-timer').textContent = fmtCountdown(left);
      if (left <= 0) refresh();
    } else {
      $('focus-timer').textContent = fmtCountdown(s.settings.pomodoro.focusMin * 60000);
    }
  }

  async function refresh() {
    state = await send('getState');
    render();
  }

  async function addEntry(raw, type) {
    const res = await send('addEntry', { raw, kind: type });
    if (res.duplicate) {
      toast(res.entry.label + ' is already blocked');
      return res;
    }
    toast('Blocked ' + res.entry.label);
    // Host access lets FocusFence show its block page instead of Chrome's error page.
    if (res.origins && res.entry.type !== 'keyword') requestAccess(res.origins);
    return res;
  }

  function showUnlock(after) {
    pendingAfterUnlock = after;
    $('unlock-form').classList.remove('hidden');
    $('unlock-password').focus();
  }

  async function guarded(fn) {
    try {
      await fn();
    } catch (err) {
      if (err.code === 'LOCKED') showUnlock(fn);
      else if (err.code === 'PRO_REQUIRED') openOptions('#plan');
      else toast(errorMessage(err), 'error');
    }
    await refresh();
  }

  $('toggle-enabled').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    guarded(() => send('setEnabled', { enabled }));
  });

  $('quick-add').addEventListener('click', () =>
    guarded(async () => {
      const host = C.hostFromInput(tab.url);
      await addEntry(host, 'domain');
      // Reload so the block applies to the page that is open right now.
      if (tab.id !== undefined) chrome.tabs.reload(tab.id).catch(() => {});
    })
  );

  $('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('add-input').value.trim();
    if (!raw) return;
    guarded(async () => {
      await addEntry(raw, 'auto');
      $('add-input').value = '';
    });
  });

  $('unlock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await send('unlock', { password: $('unlock-password').value });
      $('unlock-form').classList.add('hidden');
      $('unlock-password').value = '';
      const fn = pendingAfterUnlock;
      pendingAfterUnlock = null;
      if (fn) await guarded(fn);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  $('focus-start').addEventListener('click', () => {
    if (!state.isPro) return openOptions('#plan');
    guarded(() => send('startPomodoro'));
  });
  $('focus-stop').addEventListener('click', () => guarded(() => send('stopPomodoro')));
  $('open-options').addEventListener('click', () => openOptions(''));
  $('incognito-fix').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    window.close();
  });
  $('open-options-2').addEventListener('click', (e) => {
    e.preventDefault();
    openOptions('');
  });

  chrome.storage.onChanged.addListener(() => refresh().catch(() => {}));
  setInterval(tickTimer, 1000);

  (async () => {
    tab = await getTargetTab();
    await refresh();
  })().catch((e) => toast(errorMessage(e), 'error'));
})();
