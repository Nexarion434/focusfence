// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
'use strict';
(function () {
  const C = self.FFCore;
  const { send, toast, logo, el, requestAccess, siteAvatar, fmtCountdown, fmtTime, errorMessage } = self.FFUI;
  const { t, plural, rich, fmt } = self.FFI18N;
  const $ = (id) => document.getElementById(id);
  // Localized day names from Intl (2026-11-15 is a Sunday).
  const dayDate = (d) => new Date(2026, 10, 15 + d, 12);
  const DAY_NAMES = [0, 1, 2, 3, 4, 5, 6].map((d) => fmt.weekday(dayDate(d), 'narrow'));
  const DAY_TITLES = [0, 1, 2, 3, 4, 5, 6].map((d) => fmt.weekday(dayDate(d), 'long'));
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const SUGGESTIONS = ['reddit.com', 'youtube.com', 'x.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'news.ycombinator.com'];

  let state = null;
  let addType = 'domain';
  let scheduleDraft = null;
  let pomoDirty = false;
  let messageDirty = false;

  $('logo').insertAdjacentHTML('afterbegin', logo(26));
  $('lock-logo').innerHTML = logo(44);
  $('empty-logo').innerHTML = logo(40);

  // Pro gate overlays
  document.querySelectorAll('.panel[data-pro]').forEach((panel) => {
    const gate = el(
      'div',
      { class: 'pro-gate' },
      el('span', { text: t('proGate') }),
      el('a', { class: 'btn btn-pro btn-sm', href: '#plan', text: t('upgrade') })
    );
    panel.appendChild(gate);
  });

  /* ------------------------------------------------------------ helpers */

  async function act(fn, okMsg) {
    try {
      const r = await fn();
      if (okMsg) toast(okMsg);
      return r;
    } catch (err) {
      if (err.code === 'LOCKED') showLock();
      toast(errorMessage(err), 'error');
      return null;
    } finally {
      await refresh();
    }
  }

  function showLock() {
    $('lock-overlay').classList.remove('hidden');
    setTimeout(() => $('lock-password').focus(), 30);
  }

  /* -------------------------------------------------------------- render */

  function render() {
    const s = state;
    document.body.classList.toggle('is-pro', s.isPro);
    document.body.classList.toggle('is-strict', s.strict.active);
    document.querySelectorAll('.panel[data-pro]').forEach((p) => {
      p.classList.toggle('pro-locked', !s.isPro);
      // Locked Pro panels are dimmed for the eye and removed from the keyboard/AT tree.
      for (const child of p.querySelectorAll(':scope > :not(.panel-head):not(.pro-gate), :scope > .panel-head .master')) {
        child.inert = !s.isPro;
      }
    });
    const locked = s.hasPassword && s.locked;
    const wasLocked = !$('lock-overlay').classList.contains('hidden');
    $('lock-overlay').classList.toggle('hidden', !locked);
    $('layout').inert = locked; // modal: nothing behind the dialog is reachable
    if (locked && !wasLocked) setTimeout(() => $('lock-password').focus(), 30);

    // sidebar plan card
    $('side-plan-title').textContent = s.isPro ? t('sidePlanPro') : t('sidePlanFree');
    $('side-plan-badge').textContent = s.isPro ? t('planPro') : t('planFree');
    $('side-plan-badge').className = 'badge ' + (s.isPro ? 'badge-pro' : '');
    $('side-plan-text').textContent = s.isPro ? t('sidePlanProText') : t('sidePlanFreeText');
    $('side-plan-btn').textContent = s.isPro ? t('managePlan') : t('seePro');
    $('side-plan-btn').className = 'btn btn-sm btn-block ' + (s.isPro ? '' : 'btn-pro');

    // strict banner
    $('strict-banner').classList.toggle('hidden', !s.strict.active);
    $('strict-banner-text').textContent = s.strict.active
      ? s.strict.endsAt
        ? t('strictBannerUntil', fmtTime(s.strict.endsAt))
        : t('strictBannerOn')
      : '';

    renderMaster();
    renderEntries();
    renderSchedule();
    renderPomodoro();
    renderStrict();
    renderMessage();
    renderPassword();
    renderStats();
    renderPlan();
    renderIncognito();
  }

  function renderMaster() {
    const s = state;
    const master = $('master-toggle');
    master.checked = s.settings.enabled || s.strict.active;
    master.disabled = s.strict.active;
    const r = s.status.reason;
    $('master-label').textContent =
      r === 'strict' ? t('statusStrict') :
      r === 'focus' ? t('statusFocus') :
      r === 'off' ? t('masterOff') :
      r === 'outside-schedule' ? t('masterPaused') :
      t('masterOn');
  }

  function renderEntries() {
    const s = state;
    const list = $('entries');
    list.textContent = '';
    const entries = s.settings.entries;
    $('entries-empty').classList.toggle('hidden', entries.length > 0);

    let missing = 0;
    for (const e of entries) {
      const inactive = C.isProEntry(e) && !s.isPro;
      const hasAccess = !!s.access[e.id];
      if (!hasAccess && !inactive && e.type !== 'keyword') missing++;
      const avatar = e.type === 'keyword' ? el('span', { class: 'avatar kw', text: '#' }) : siteAvatar(e.host);
      const meta = el('div', { class: 'entry-meta' });
      const typeLabel = e.type === 'domain' ? t('entryDomain') : e.type === 'path' ? t('entryPath') : t('entryKeyword');
      meta.appendChild(el('span', { class: 'muted small', text: typeLabel }));
      if (inactive) meta.appendChild(el('span', { class: 'badge badge-pro', text: t('entryInactive') }));
      else if (!hasAccess) {
        meta.appendChild(
          el('span', {
            class: 'badge badge-warn',
            text: t('entryErrorPage'),
            title: t('entryErrorPageTitle'),
          })
        );
      }
      const remove = el(
        'button',
        {
          class: 'btn btn-ghost icon-btn remove',
          title: s.strict.active ? t('removeStrictTitle') : t('remove'),
          'aria-label': t('removeAria', e.label),
          disabled: s.strict.active,
          onclick: () => act(() => send('removeEntry', { id: e.id }), t('toastRemoved', e.label)),
        },
        el('span', { html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' })
      );
      list.appendChild(
        el(
          'li',
          { class: 'entry' + (inactive ? ' inactive' : ''), dataset: { id: e.id, type: e.type } },
          avatar,
          el('div', { class: 'entry-main' }, el('div', { class: 'entry-label', text: e.label }), meta),
          remove
        )
      );
    }

    const kwMissing = entries.some((e) => e.type === 'keyword' && !s.access[e.id] && s.isPro);
    const banner = $('access-banner');
    banner.classList.toggle('hidden', !missing && !kwMissing);
    if (missing) {
      $('access-title').textContent = t('accessTitle');
      $('access-text').textContent = plural(missing, 'accessText');
    } else if (kwMissing) {
      $('access-title').textContent = t('accessKwTitle');
      $('access-text').textContent = t('accessKwText');
    }

    // suggestions
    const chips = $('suggestions');
    chips.textContent = '';
    for (const sug of SUGGESTIONS) {
      chips.appendChild(el('button', { class: 'chip', type: 'button', text: '+ ' + sug, onclick: () => addEntry(sug, 'domain') }));
    }
  }

  function scheduleModel() {
    return scheduleDraft || C.deepClone(state.settings.schedule);
  }

  function renderSchedule() {
    const s = state;
    const model = scheduleModel();
    $('schedule-toggle').checked = model.enabled;
    $('schedule-toggle').disabled = s.strict.active;
    const wrap = $('windows');
    wrap.textContent = '';
    if (!model.windows.length) {
      wrap.appendChild(el('p', { class: 'muted small windows-empty', text: t('windowsEmpty') }));
    }
    model.windows.forEach((w, idx) => {
      const days = el('div', { class: 'days', role: 'group', 'aria-label': t('daysAria') });
      for (const d of DAY_ORDER) {
        days.appendChild(
          el('button', {
            type: 'button',
            class: 'day',
            title: DAY_TITLES[d],
            'aria-label': DAY_TITLES[d],
            'aria-pressed': w.days.includes(d) ? 'true' : 'false',
            text: DAY_NAMES[d],
            disabled: s.strict.active,
            onclick: () => {
              const m = scheduleModel();
              const win = m.windows[idx];
              win.days = win.days.includes(d) ? win.days.filter((x) => x !== d) : [...win.days, d];
              scheduleDraft = m;
              renderSchedule();
            },
          })
        );
      }
      const mkTime = (key) =>
        el('input', {
          class: 'input',
          type: 'time',
          value: w[key],
          disabled: s.strict.active,
          'aria-label': key === 'start' ? t('startTime') : t('endTime'),
          onchange: (ev) => {
            const m = scheduleModel();
            m.windows[idx][key] = ev.target.value;
            scheduleDraft = m;
            renderSchedule();
          },
        });
      const crosses = C.parseHM(w.start) > C.parseHM(w.end);
      wrap.appendChild(
        el(
          'div',
          { class: 'window', role: 'listitem' },
          days,
          el('div', { class: 'times' }, mkTime('start'), el('span', { class: 'muted', text: '–' }), mkTime('end')),
          crosses ? el('span', { class: 'badge', text: t('overnight') }) : null,
          el('span', { class: 'spacer' }),
          el('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            text: t('remove'),
            disabled: s.strict.active,
            onclick: () => {
              const m = scheduleModel();
              m.windows.splice(idx, 1);
              scheduleDraft = m;
              renderSchedule();
            },
          })
        )
      );
    });
    $('window-add').disabled = s.strict.active;
    $('schedule-save').disabled = s.strict.active;
    const st = s.status.reason;
    $('schedule-state').textContent = scheduleDraft
      ? t('unsaved')
      : s.settings.schedule.enabled && s.settings.schedule.windows.length
        ? st === 'schedule' ? t('activeNow') : st === 'outside-schedule' ? t('pausedNow') : ''
        : '';
  }

  function renderPomodoro() {
    const s = state;
    const cfg = s.settings.pomodoro;
    if (!pomoDirty) {
      $('pomo-focus').value = cfg.focusMin;
      $('pomo-break').value = cfg.breakMin;
      $('pomo-cycles').value = cfg.cycles;
    }
    const p = s.pomodoro;
    $('pomo-live').classList.toggle('hidden', !p);
    $('pomo-start').classList.toggle('hidden', !!p);
    $('pomo-stop').classList.toggle('hidden', !p);
    if (p) {
      $('pomo-phase').textContent = t('focusRound', p.phase === 'focus' ? t('phaseFocus') : t('phaseBreak'), p.cycle, p.totalCycles);
    }
    tick();
  }

  function renderStrict() {
    const s = state;
    const on = s.strict.active;
    $('strict-off').classList.toggle('hidden', on);
    $('strict-on').classList.toggle('hidden', !on);
    if (!on) return;
    $('strict-until').textContent = s.strict.endsAt
      ? t('strictEndsAt', fmt.dateTime(s.strict.endsAt))
      : t('strictStaysOn');
    const phase = s.strict.unlock.phase;
    $('strict-locked').classList.toggle('hidden', phase !== 'locked');
    $('strict-waiting').classList.toggle('hidden', phase !== 'waiting');
    $('strict-challenge').classList.toggle('hidden', phase !== 'challenge');
    if (phase === 'challenge') $('strict-phrase').textContent = s.strict.unlock.challenge;
    const paused = Math.round((s.strict.pausedMs || 0) / 60000);
    $('strict-paused').hidden = !paused;
    $('strict-paused').textContent = paused
      ? t('strictPaused', C.formatMinutes(paused))
      : '';
    tick();
  }

  async function renderIncognito() {
    let allowed = true;
    try {
      allowed = await chrome.extension.isAllowedIncognitoAccess();
    } catch (e) {
      allowed = true;
    }
    $('incognito-warning').hidden = allowed;
    return allowed;
  }

  function renderMessage() {
    if (!messageDirty) $('message').value = state.settings.blockMessage || '';
    $('message-count').textContent = $('message').value.length + ' / 280';
  }

  function renderPassword() {
    const s = state;
    $('password-state').textContent = s.hasPassword ? t('passwordSet') : t('passwordNone');
    $('password-save').textContent = s.hasPassword ? t('changePassword') : t('setPassword');
    $('password-lock').classList.toggle('hidden', !s.hasPassword);
    $('password-remove').classList.toggle('hidden', !s.hasPassword);
  }

  function renderStats() {
    const st = state.stats;
    $('stat-today').textContent = st.today;
    $('stat-week').textContent = st.total;
    $('stat-saved').textContent = C.formatMinutes(st.minutesSaved);
    const chart = $('chart');
    chart.textContent = '';
    chart.setAttribute(
      'aria-label',
      t('chartAria', st.byDay.map((d) => fmt.weekday(new Date(d.day + 'T12:00:00')) + ' ' + d.count).join(', '))
    );
    const max = Math.max(1, ...st.byDay.map((d) => d.count));
    st.byDay.forEach((d, i) => {
      const date = new Date(d.day + 'T12:00:00');
      const fill = el('div', { class: 'bar-fill' });
      fill.style.height = Math.round((d.count / max) * 100) + '%';
      chart.appendChild(
        el(
          'div',
          { class: 'bar' + (i === st.byDay.length - 1 ? ' today' : ''), title: t('barTitle', d.count) },
          el('span', { class: 'bar-count', text: String(d.count) }),
          fill,
          el('span', { class: 'bar-label', text: i === st.byDay.length - 1 ? t('today') : fmt.weekday(date, 'short') })
        )
      );
    });
    const top = $('top-sites');
    top.textContent = '';
    const sites = Object.entries(st.bySite).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!sites.length) top.appendChild(el('li', { class: 'muted small', text: t('topSitesNone') }));
    const topMax = sites.length ? sites[0][1] : 1;
    for (const [site, n] of sites) {
      const bar = el('span');
      bar.style.width = Math.round((n / topMax) * 100) + '%';
      top.appendChild(el('li', {}, el('span', { text: site }), el('div', { class: 'meter' }, bar), el('span', { class: 'n', text: String(n) })));
    }
  }

  function renderPlan() {
    const s = state;
    $('plan-title').textContent = s.isPro ? t('planTitlePro') : t('sidePlanPro');
    $('plan-sub').textContent = s.isPro ? (s.devPro ? t('planSubProDev') : t('planSubPro')) : t('planSub');
    $('price-monthly').textContent = fmt.price(s.prices.monthly, s.prices.currency);
    $('price-yearly').textContent = fmt.price(s.prices.yearly, s.prices.currency);
    $('dev-panel').classList.toggle('hidden', !s.dev);
    const lic = s.license || {};
    $('license-note').hidden = !(lic.lastError && !s.dev);
    $('license-note').textContent = lic.lastError
      ? lic.checkedAt
        ? t('licenseNoteDate', fmt.date(lic.checkedAt))
        : t('licenseNote')
      : '';
    $('source-link').href = s.sourceUrl;
    $('privacy-link').href = s.privacyUrl;
    $('dev-pro').checked = s.devPro;
  }

  function tick() {
    if (!state) return;
    const now = Date.now();
    const p = state.pomodoro;
    if (p) {
      const left = p.endsAt - now;
      $('pomo-clock').textContent = fmtCountdown(left);
      if (left <= 0) refresh();
    }
    const u = state.strict.unlock;
    if (state.strict.active && u.phase === 'waiting') {
      const left = u.readyAt - now;
      $('strict-countdown').textContent = fmtCountdown(left);
      if (left <= 0) refresh();
    }
  }

  async function refresh() {
    state = await send('getState');
    render();
  }

  /* -------------------------------------------------------------- events */

  async function addEntry(raw, type) {
    try {
      const res = await send('addEntry', { raw, kind: type });
      if (res.duplicate) toast(t('toastAlreadyOnList', res.entry.label));
      else {
        toast(t('toastAdded', res.entry.label));
        if (res.entry.type !== 'keyword') requestAccess(res.origins);
      }
      $('add-input').value = '';
    } catch (err) {
      if (err.code === 'PRO_REQUIRED') location.hash = '#plan';
      toast(errorMessage(err), 'error');
    }
    await refresh();
  }

  const HINTS = {
    domain: ['reddit.com', t('hintDomain')],
    path: ['youtube.com/shorts', t('hintPath')],
    keyword: ['poker', t('hintKeyword')],
  };
  $('type-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-type]');
    if (!b) return;
    addType = b.dataset.type;
    document.querySelectorAll('#type-seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('add-input').placeholder = HINTS[addType][0];
    $('add-hint').textContent = HINTS[addType][1];
    $('add-input').focus();
  });

  $('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('add-input').value.trim();
    if (raw) addEntry(raw, addType);
  });

  $('access-grant').addEventListener('click', async () => {
    const s = state;
    const origins = new Set();
    let needAll = false;
    for (const e of s.settings.entries) {
      if (s.access[e.id]) continue;
      if (e.type === 'keyword') needAll = true;
      else C.originsForHost(e.host).forEach((o) => origins.add(o));
    }
    const list = origins.size ? [...origins] : needAll ? [C.ALL_SITES_ORIGIN] : [];
    const ok = await requestAccess(list);
    toast(ok ? t('toastAccessGranted') : t('toastNoChanges'));
    await refresh();
  });

  $('master-toggle').addEventListener('change', (e) => act(() => send('setEnabled', { enabled: e.target.checked })));

  $('schedule-toggle').addEventListener('change', (e) => {
    const m = scheduleModel();
    m.enabled = e.target.checked;
    if (m.enabled && !m.windows.length) m.windows.push({ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' });
    scheduleDraft = m;
    saveSchedule();
  });
  $('window-add').addEventListener('click', () => {
    const m = scheduleModel();
    m.windows.push({ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' });
    scheduleDraft = m;
    renderSchedule();
  });
  async function saveSchedule() {
    const draft = scheduleModel();
    const r = await act(() => send('setSchedule', { schedule: draft }), t('toastScheduleSaved'));
    if (r) scheduleDraft = null;
    renderSchedule();
  }
  $('schedule-save').addEventListener('click', saveSchedule);

  ['pomo-focus', 'pomo-break', 'pomo-cycles'].forEach((id) => $(id).addEventListener('input', () => (pomoDirty = true)));
  async function savePomo() {
    const pomodoro = { focusMin: $('pomo-focus').value, breakMin: $('pomo-break').value, cycles: $('pomo-cycles').value };
    const r = await act(() => send('setPomodoroConfig', { pomodoro }));
    if (r) pomoDirty = false;
    return r;
  }
  $('pomo-save').addEventListener('click', async () => {
    if (await savePomo()) toast(t('toastFocusSaved'));
  });
  $('pomo-start').addEventListener('click', async () => {
    if (pomoDirty && !(await savePomo())) return;
    act(() => send('startPomodoro'), t('toastFocusStarted'));
  });
  $('pomo-stop').addEventListener('click', () => act(() => send('stopPomodoro'), t('toastSessionStopped')));

  $('strict-start').addEventListener('click', () => {
    const hours = Number($('strict-hours').value);
    const label = hours ? plural(hours, 'dur') : t('durForeverLower');
    const incognitoNote = $('incognito-warning').hidden ? '' : '\n\n' + t('confirmStrictIncognito');
    if (!confirm(t('confirmStrict', label) + incognitoNote)) return;
    act(() => send('startStrict', { hours }), t('toastStrictOn'));
  });
  $('strict-request').addEventListener('click', () => act(() => send('requestStrictUnlock'), t('toastUnlockRequested')));
  $('strict-cancel').addEventListener('click', () => act(() => send('cancelStrictUnlock'), t('toastGoodCall')));
  $('strict-cancel-2').addEventListener('click', () => act(() => send('cancelStrictUnlock'), t('toastGoodCall')));
  const typed = $('strict-typed');
  ['paste', 'drop'].forEach((ev) =>
    typed.addEventListener(ev, (e) => {
      e.preventDefault();
      toast(t('toastNoPaste'), 'error');
    })
  );
  $('strict-phrase').addEventListener('copy', (e) => e.preventDefault());
  $('strict-challenge').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await act(() => send('completeStrictUnlock', { typed: typed.value }));
    if (r) {
      typed.value = '';
      toast(t('toastStrictEnded'));
    }
  });

  $('incognito-open').addEventListener('click', () =>
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id })
  );

  $('message').addEventListener('input', () => {
    messageDirty = true;
    $('message-count').textContent = $('message').value.length + ' / 280';
  });
  $('message-save').addEventListener('click', async () => {
    const r = await act(() => send('setBlockMessage', { message: $('message').value }), t('toastMessageSaved'));
    if (r) messageDirty = false;
  });

  $('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = $('password-new').value;
    const b = $('password-confirm').value;
    if (a !== b) return toast(t('toastPwMismatch'), 'error');
    const r = await act(() => send('setPassword', { password: a }), t('toastPwSaved'));
    if (r) {
      $('password-new').value = '';
      $('password-confirm').value = '';
    }
  });
  $('password-lock').addEventListener('click', () => act(() => send('lockNow')));
  $('password-remove').addEventListener('click', () => {
    if (confirm(t('confirmRemovePw'))) act(() => send('removePassword'), t('toastPwRemoved'));
  });
  $('lock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await send('unlock', { password: $('lock-password').value });
      $('lock-password').value = '';
      toast(t('toastUnlocked15'));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    await refresh();
  });

  $('stats-clear').addEventListener('click', () => {
    if (confirm(t('confirmClearStats'))) act(() => send('clearStats'), t('toastStatsCleared'));
  });

  $('export-btn').addEventListener('click', async () => {
    const r = await act(() => send('exportSettings'));
    if (!r) return;
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'focusfence-settings-' + C.dayKey(Date.now()) + '.json' });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    toast(t('toastExported'));
  });
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast(t('errFileTooLarge'), 'error');
    const text = await file.text();
    if (!confirm(t('confirmImport', file.name))) return;
    const r = await act(() => send('importSettings', { data: text }));
    if (r) toast(t('toastImported', r.count));
  });

  document.querySelectorAll('[data-plan]').forEach((b) =>
    b.addEventListener('click', () => act(() => send('openPayment', { plan: b.dataset.plan })))
  );
  $('restore-link').addEventListener('click', (e) => {
    e.preventDefault();
    act(() => send('openLogin'));
  });
  $('dev-pro').addEventListener('change', (e) =>
    act(() => send('setDevPro', { on: e.target.checked }), e.target.checked ? t('toastProSimulated') : t('toastBackToFree'))
  );


  // duration options with localized plurals
  for (const opt of $('strict-hours').options) {
    const h = Number(opt.value);
    if (h) opt.textContent = plural(h, 'dur');
  }

  // nav highlighting
  const links = [...document.querySelectorAll('#nav a')];
  const obs = new IntersectionObserver(
    (items) => {
      for (const it of items) {
        if (it.isIntersecting) {
          links.forEach((l) => {
            const on = l.dataset.nav === it.target.id;
            l.classList.toggle('active', on);
            if (on) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
          });
        }
      }
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  document.querySelectorAll('.panel').forEach((p) => obs.observe(p));
  links[0].classList.add('active');

  chrome.storage.onChanged.addListener(() => refresh().catch(() => {}));
  setInterval(tick, 1000);
  refresh()
    .then(() => {
      // Re-check the license when settings open (e.g. right after paying).
      if (!state.dev) return send('refreshLicense').then(refresh);
    })
    .catch((e) => toast(errorMessage(e), 'error'));
})();
