'use strict';
(function () {
  const C = self.FFCore;
  const { send, toast, logo, el, requestAccess, siteAvatar, fmtCountdown, fmtTime, errorMessage } = self.FFUI;
  const $ = (id) => document.getElementById(id);
  const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAY_TITLES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
      el('span', { text: 'Available with FocusFence Pro' }),
      el('a', { class: 'btn btn-pro btn-sm', href: '#plan', text: 'Upgrade' })
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
    document.querySelectorAll('.panel[data-pro]').forEach((p) => p.classList.toggle('pro-locked', !s.isPro));
    $('lock-overlay').classList.toggle('hidden', !(s.hasPassword && s.locked));

    // sidebar plan card
    $('side-plan-title').textContent = s.isPro ? 'FocusFence Pro' : 'Free plan';
    $('side-plan-badge').textContent = s.isPro ? 'PRO' : 'FREE';
    $('side-plan-badge').className = 'badge ' + (s.isPro ? 'badge-pro' : '');
    $('side-plan-text').textContent = s.isPro
      ? 'Thanks for supporting FocusFence. All features unlocked.'
      : 'Unlimited sites. Upgrade for schedules, focus sessions and strict mode.';
    $('side-plan-btn').textContent = s.isPro ? 'Manage plan' : 'See Pro';
    $('side-plan-btn').className = 'btn btn-sm btn-block ' + (s.isPro ? '' : 'btn-pro');

    // strict banner
    $('strict-banner').classList.toggle('hidden', !s.strict.active);
    $('strict-banner-text').textContent = s.strict.active
      ? 'Strict mode is on' + (s.strict.endsAt ? ' until ' + fmtTime(s.strict.endsAt) : '') + '. Your blocklist can only grow.'
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
  }

  function renderMaster() {
    const s = state;
    const t = $('master-toggle');
    t.checked = s.settings.enabled || s.strict.active;
    t.disabled = s.strict.active;
    const r = s.status.reason;
    $('master-label').textContent =
      r === 'strict' ? 'Strict mode' :
      r === 'focus' ? 'Focus session' :
      r === 'off' ? 'Blocking off' :
      r === 'outside-schedule' ? 'Paused (schedule)' :
      'Blocking on';
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
      const typeLabel = e.type === 'domain' ? 'Website + subdomains' : e.type === 'path' ? 'Path' : 'Keyword in URL';
      meta.appendChild(el('span', { class: 'muted small', text: typeLabel }));
      if (inactive) meta.appendChild(el('span', { class: 'badge badge-pro', text: 'PRO · inactive' }));
      else if (!hasAccess) {
        meta.appendChild(
          el('span', {
            class: 'badge badge-warn',
            text: 'Error page',
            title: "FocusFence can't show its block page here yet. Chrome's error page is shown instead.",
          })
        );
      }
      const remove = el(
        'button',
        {
          class: 'btn btn-ghost icon-btn remove',
          title: s.strict.active ? 'Strict mode: sites cannot be removed' : 'Remove',
          'aria-label': 'Remove ' + e.label,
          disabled: s.strict.active,
          onclick: () => act(() => send('removeEntry', { id: e.id }), 'Removed ' + e.label),
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
      $('access-title').textContent = 'Show the FocusFence block page';
      $('access-text').textContent =
        (missing === 1 ? '1 site is' : missing + ' sites are') +
        " blocked with Chrome's error page because FocusFence hasn't been given access yet. Allow access to see the calm block page and count stats.";
    } else if (kwMissing) {
      $('access-title').textContent = 'Keyword rules use Chrome’s error page';
      $('access-text').textContent =
        'Keywords can appear on any site, so showing the block page for them needs access to all sites. Optional — blocking works either way.';
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
      wrap.appendChild(el('p', { class: 'muted small windows-empty', text: 'No time ranges yet. Add one, e.g. weekdays 09:00 – 17:00.' }));
    }
    model.windows.forEach((w, idx) => {
      const days = el('div', { class: 'days', role: 'group', 'aria-label': 'Days' });
      for (const d of DAY_ORDER) {
        days.appendChild(
          el('button', {
            type: 'button',
            class: 'day',
            title: DAY_TITLES[d],
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
          'aria-label': key === 'start' ? 'Start time' : 'End time',
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
          { class: 'window' },
          days,
          el('div', { class: 'times' }, mkTime('start'), el('span', { class: 'muted', text: '–' }), mkTime('end')),
          crosses ? el('span', { class: 'badge', text: 'overnight' }) : null,
          el('span', { class: 'spacer' }),
          el('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            text: 'Remove',
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
      ? 'Unsaved changes'
      : s.settings.schedule.enabled && s.settings.schedule.windows.length
        ? st === 'schedule' ? 'Active now' : st === 'outside-schedule' ? 'Paused right now' : ''
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
      $('pomo-phase').textContent = (p.phase === 'focus' ? 'Focus' : 'Break') + ' · round ' + p.cycle + ' of ' + p.totalCycles;
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
      ? 'Ends automatically at ' + new Date(s.strict.endsAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Stays on until you unlock it';
    const phase = s.strict.unlock.phase;
    $('strict-locked').classList.toggle('hidden', phase !== 'locked');
    $('strict-waiting').classList.toggle('hidden', phase !== 'waiting');
    $('strict-challenge').classList.toggle('hidden', phase !== 'challenge');
    if (phase === 'challenge') $('strict-phrase').textContent = s.strict.unlock.challenge;
    tick();
  }

  function renderMessage() {
    if (!messageDirty) $('message').value = state.settings.blockMessage || '';
    $('message-count').textContent = $('message').value.length + ' / 280';
  }

  function renderPassword() {
    const s = state;
    $('password-state').textContent = s.hasPassword ? 'Password is set. Unlocked for this session.' : 'No password set.';
    $('password-save').textContent = s.hasPassword ? 'Change password' : 'Set password';
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
    const max = Math.max(1, ...st.byDay.map((d) => d.count));
    st.byDay.forEach((d, i) => {
      const date = new Date(d.day + 'T12:00:00');
      const fill = el('div', { class: 'bar-fill' });
      fill.style.height = Math.round((d.count / max) * 100) + '%';
      chart.appendChild(
        el(
          'div',
          { class: 'bar' + (i === st.byDay.length - 1 ? ' today' : ''), title: d.count + ' blocked' },
          el('span', { class: 'bar-count', text: String(d.count) }),
          fill,
          el('span', { class: 'bar-label', text: i === st.byDay.length - 1 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' }) })
        )
      );
    });
    const top = $('top-sites');
    top.textContent = '';
    const sites = Object.entries(st.bySite).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!sites.length) top.appendChild(el('li', { class: 'muted small', text: 'No blocked visits yet. That is a good sign.' }));
    const topMax = sites.length ? sites[0][1] : 1;
    for (const [site, n] of sites) {
      const bar = el('span');
      bar.style.width = Math.round((n / topMax) * 100) + '%';
      top.appendChild(el('li', {}, el('span', { text: site }), el('div', { class: 'meter' }, bar), el('span', { class: 'n', text: String(n) })));
    }
  }

  function renderPlan() {
    const s = state;
    $('plan-title').textContent = s.isPro ? 'You have FocusFence Pro' : 'FocusFence Pro';
    $('plan-sub').textContent = s.isPro
      ? 'All Pro features are unlocked on this browser.' + (s.devPro ? ' (simulated in DEV build)' : '')
      : 'Everything in Free, plus the tools that make focus stick.';
    $('price-monthly').textContent = s.prices.monthly.split('/')[0];
    $('price-yearly').textContent = s.prices.yearly.split('/')[0];
    $('dev-panel').classList.toggle('hidden', !s.dev);
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
      if (res.duplicate) toast(res.entry.label + ' is already on your list');
      else {
        toast('Added ' + res.entry.label);
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
    domain: ['reddit.com', 'Blocks the whole site, including every subdomain.'],
    path: ['youtube.com/shorts', 'Blocks only that section. youtube.com stays reachable; youtube.com/shorts/… is blocked.'],
    keyword: ['poker', 'Blocks any page whose address contains this word.'],
  };
  $('type-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-type]');
    if (!b) return;
    addType = b.dataset.type;
    document.querySelectorAll('#type-seg button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
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
    toast(ok ? 'Access granted — the block page is on' : 'No changes made');
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
    const r = await act(() => send('setSchedule', { schedule: draft }), 'Schedule saved');
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
    if (await savePomo()) toast('Focus settings saved');
  });
  $('pomo-start').addEventListener('click', async () => {
    if (pomoDirty && !(await savePomo())) return;
    act(() => send('startPomodoro'), 'Focus session started');
  });
  $('pomo-stop').addEventListener('click', () => act(() => send('stopPomodoro'), 'Session stopped'));

  $('strict-start').addEventListener('click', () => {
    const hours = Number($('strict-hours').value);
    const label = hours ? hours + (hours === 1 ? ' hour' : ' hours') : 'until you unlock it';
    if (!confirm('Start strict mode for ' + label + '?\n\nYou will not be able to turn blocking off or remove sites. Ending early takes a 10-minute wait and a typing challenge.')) return;
    act(() => send('startStrict', { hours }), 'Strict mode is on');
  });
  $('strict-request').addEventListener('click', () => act(() => send('requestStrictUnlock'), 'Unlock requested — 10 minute cooling-off started'));
  $('strict-cancel').addEventListener('click', () => act(() => send('cancelStrictUnlock'), 'Good call. Strict mode stays on.'));
  $('strict-cancel-2').addEventListener('click', () => act(() => send('cancelStrictUnlock'), 'Good call. Strict mode stays on.'));
  const typed = $('strict-typed');
  ['paste', 'drop'].forEach((ev) =>
    typed.addEventListener(ev, (e) => {
      e.preventDefault();
      toast('Type it out — pasting is disabled.', 'error');
    })
  );
  $('strict-phrase').addEventListener('copy', (e) => e.preventDefault());
  $('strict-challenge').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await act(() => send('completeStrictUnlock', { typed: typed.value }));
    if (r) {
      typed.value = '';
      toast('Strict mode ended');
    }
  });

  $('message').addEventListener('input', () => {
    messageDirty = true;
    $('message-count').textContent = $('message').value.length + ' / 280';
  });
  $('message-save').addEventListener('click', async () => {
    const r = await act(() => send('setBlockMessage', { message: $('message').value }), 'Message saved');
    if (r) messageDirty = false;
  });

  $('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = $('password-new').value;
    const b = $('password-confirm').value;
    if (a !== b) return toast('Passwords do not match', 'error');
    const r = await act(() => send('setPassword', { password: a }), 'Password saved');
    if (r) {
      $('password-new').value = '';
      $('password-confirm').value = '';
    }
  });
  $('password-lock').addEventListener('click', () => act(() => send('lockNow')));
  $('password-remove').addEventListener('click', () => {
    if (confirm('Remove the password lock?')) act(() => send('removePassword'), 'Password removed');
  });
  $('lock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await send('unlock', { password: $('lock-password').value });
      $('lock-password').value = '';
      toast('Unlocked for 15 minutes');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    await refresh();
  });

  $('stats-clear').addEventListener('click', () => {
    if (confirm('Clear all stats?')) act(() => send('clearStats'), 'Stats cleared');
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
    toast('Settings exported');
  });
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('That file is too large.', 'error');
    const text = await file.text();
    if (!confirm('Replace your current blocklist and settings with the contents of ' + file.name + '?')) return;
    const r = await act(() => send('importSettings', { data: text }));
    if (r) toast('Imported ' + r.count + ' rules');
  });

  document.querySelectorAll('[data-plan]').forEach((b) =>
    b.addEventListener('click', () => act(() => send('openPayment', { plan: b.dataset.plan })))
  );
  $('restore-link').addEventListener('click', (e) => {
    e.preventDefault();
    act(() => send('openLogin'));
  });
  $('dev-pro').addEventListener('change', (e) =>
    act(() => send('setDevPro', { on: e.target.checked }), e.target.checked ? 'Pro simulated' : 'Back to Free')
  );

  $('welcome-close').addEventListener('click', () => {
    $('welcome').classList.add('hidden');
    history.replaceState(null, '', location.pathname);
  });
  if (location.hash === '#welcome') $('welcome').classList.remove('hidden');

  // nav highlighting
  const links = [...document.querySelectorAll('#nav a')];
  const obs = new IntersectionObserver(
    (items) => {
      for (const it of items) {
        if (it.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.dataset.nav === it.target.id));
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
