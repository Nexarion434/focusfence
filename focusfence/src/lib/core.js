// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/*
 * FocusFence core logic.
 * Pure functions shared by the service worker, the extension pages and the
 * Node unit tests. No chrome.* calls in here.
 */
(function (root) {
  'use strict';

  const MINUTE = 60 * 1000;
  const STRICT_UNLOCK_DELAY_MS = 10 * MINUTE;
  const STATS_RETENTION_DAYS = 90;
  const ALL_SITES_ORIGIN = '*://*/*';
  const MAX_PATH_LENGTH = 512;
  // Countries and territories that use the euro (2026: Bulgaria joined on 1 January),
  // plus the microstates and French overseas regions that use it as their currency.
  const EUROZONE = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
    'AD', 'MC', 'SM', 'VA', 'ME', 'XK', 'AX', 'GF', 'GP', 'MQ', 'RE', 'YT', 'PM', 'BL', 'MF',
  ]);
  // Chrome allows at most 1000 regex rules per extension; path/keyword entries use one each.
  const MAX_PATTERN_ENTRIES = 500;
  const MAX_SCHEDULE_WINDOWS = 50;
  const STRICT_HOURS = [0, 1, 2, 4, 8, 24, 48, 72, 168];

  const DEFAULT_SETTINGS = Object.freeze({
    version: 1,
    enabled: true,
    entries: [],
    schedule: { enabled: false, windows: [] },
    pomodoro: { focusMin: 25, breakMin: 5, cycles: 4 },
    blockMessage: '',
  });

  const QUOTES = [
    'The successful warrior is the average person, with laser-like focus. — Bruce Lee',
    'Starve your distractions, feed your focus.',
    'Where focus goes, energy flows. — Tony Robbins',
    'You will never reach your destination if you stop at every distraction.',
    'Concentrate all your thoughts upon the work at hand. — Alexander Graham Bell',
    'It is not that we have a short time to live, but that we waste a lot of it. — Seneca',
    'Deep work is the superpower of the 21st century. — Cal Newport',
    'Small daily improvements are the key to staggering long-term results.',
    'The future depends on what you do today. — Mahatma Gandhi',
    'Do the hard thing first. The feed will still be there later.',
  ];

  const CHALLENGE_WORDS = [
    'quiet', 'river', 'focus', 'garden', 'steady', 'ember', 'harbor', 'lantern',
    'meadow', 'patient', 'orbit', 'granite', 'willow', 'compass', 'summit',
    'anchor', 'breeze', 'canvas', 'horizon', 'marble', 'thistle', 'cobalt',
    'juniper', 'pebble', 'saddle', 'timber', 'velvet', 'whistle', 'zephyr',
  ];

  /* ------------------------------------------------------------- i18n */
  // Uses chrome.i18n when available (extension), English fallbacks otherwise (Node tests).
  let translate =
    typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage
      ? (key, subs) => chrome.i18n.getMessage(key, subs.map(String))
      : null;
  function setTranslator(fn) {
    translate = fn;
  }
  function T(key, fallback, ...subs) {
    if (translate) {
      const m = translate(key, subs);
      if (m) return m;
    }
    return fallback.replace(/\$(\d)/g, (_, i) => String(subs[Number(i) - 1]));
  }
  function quote(i) {
    return T('quote' + (i + 1), QUOTES[i]);
  }

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  /* ---------------------------------------------------------------- parsing */

  const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

  function stripWww(host) {
    return host.replace(/^www\./, '');
  }

  /** Extract a normalized hostname (lowercase, punycode, no www.) or null. */
  function hostFromInput(raw) {
    if (typeof raw !== 'string') return null;
    let s = raw.trim().toLowerCase();
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = 'http://' + s;
    let url;
    try {
      url = new URL(s);
    } catch (e) {
      return null;
    }
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = stripWww(url.hostname.replace(/\.$/, ''));
    return HOST_RE.test(host) ? host : null;
  }

  /**
   * Parse a user-entered blocklist item.
   * type: 'domain' | 'path' | 'keyword' | 'auto'
   * Returns { type, host?, path?, keyword?, label } or throws Error(message).
   */
  function parseEntry(raw, type) {
    const text = String(raw || '').trim();
    if (!text) throw new Error(T('errEnterSite', 'Enter a website, path or keyword.'));
    let t = type || 'auto';

    if (t === 'auto') {
      if (/^keyword:/i.test(text)) t = 'keyword';
      else {
        const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : 'http://' + text;
        let p = '';
        try {
          p = new URL(withScheme).pathname;
        } catch (e) {
          /* fallthrough */
        }
        t = p && p !== '/' ? 'path' : 'domain';
      }
    }

    if (t === 'keyword') {
      const kw = text.replace(/^keyword:/i, '').trim().toLowerCase();
      if (kw.length < 3) throw new Error(T('errKeywordShort', 'Keywords need at least 3 characters.'));
      if (kw.length > 64) throw new Error(T('errKeywordLong', 'Keywords can be at most 64 characters.'));
      if (!/^[\p{L}\p{N} _.\-]+$/u.test(kw)) {
        throw new Error(T('errKeywordChars', 'Keywords may only contain letters, digits, spaces, "-", "_" and ".".'));
      }
      return { type: 'keyword', keyword: kw, label: kw };
    }

    const host = hostFromInput(text);
    if (!host) throw new Error(T('errInvalidSite', 'That does not look like a valid website (e.g. reddit.com).'));

    if (t === 'domain') return { type: 'domain', host, label: host };

    if (t === 'path') {
      const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : 'http://' + text;
      const parsedUrl = new URL(withScheme);
      if (parsedUrl.search || parsedUrl.hash) {
        // e.g. youtube.com/watch?v=abc would otherwise silently block every video
        throw new Error(T('errPathQuery', 'Path rules match the path only. Remove the "?…" part, or use a keyword rule.'));
      }
      let path = parsedUrl.pathname || '/';
      path = path.replace(/\/{2,}/g, '/');
      if (path.length > 1) path = path.replace(/\/$/, '');
      if (path === '/' || path === '') {
        throw new Error(T('errPathMissing', 'Add a path after the domain, e.g. youtube.com/shorts.'));
      }
      if (path.length > MAX_PATH_LENGTH) throw new Error(T('errPathLong', 'That path is too long.'));
      return { type: 'path', host, path, label: host + path };
    }
    throw new Error(T('errUnknownType', 'Unknown rule type.'));
  }

  function entryKey(e) {
    if (e.type === 'domain') return 'd:' + e.host;
    if (e.type === 'path') return 'p:' + e.host + e.path.toLowerCase();
    return 'k:' + e.keyword;
  }

  function isProEntry(e) {
    return e.type === 'path' || e.type === 'keyword';
  }

  /* --------------------------------------------------------------- matching */

  function hostMatches(host, ruleHost) {
    host = String(host || '').toLowerCase().replace(/\.$/, '');
    return host === ruleHost || host.endsWith('.' + ruleHost);
  }

  function pathMatches(pathname, rulePath) {
    const p = String(pathname || '/').toLowerCase();
    const r = rulePath.toLowerCase();
    if (!p.startsWith(r)) return false;
    if (r.endsWith('/')) return true;
    const next = p.charAt(r.length);
    return next === '' || next === '/' || next === '?' || next === '#';
  }

  /** Does a single entry match the given URL string? */
  function entryMatchesUrl(entry, urlStr) {
    let url;
    try {
      url = new URL(urlStr);
    } catch (e) {
      return false;
    }
    if (!/^https?:$/.test(url.protocol)) return false;
    if (entry.type === 'domain') return hostMatches(url.hostname, entry.host);
    if (entry.type === 'path') {
      return hostMatches(url.hostname, entry.host) && pathMatches(url.pathname, entry.path);
    }
    if (entry.type === 'keyword') {
      let full = url.href.toLowerCase();
      try {
        full = decodeURIComponent(full);
      } catch (e) {
        /* keep raw */
      }
      return full.includes(entry.keyword);
    }
    return false;
  }

  /** Entries that are effective given the plan (Pro unlocks path/keyword). */
  function effectiveEntries(entries, isPro) {
    return (entries || []).filter((e) => isPro || !isProEntry(e));
  }

  function findMatchingEntry(entries, urlStr, isPro) {
    return effectiveEntries(entries, isPro).find((e) => entryMatchesUrl(e, urlStr)) || null;
  }

  /* -------------------------------------------------------------- schedules */

  function parseHM(hm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || ''));
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 24 || min > 59 || (h === 24 && min !== 0)) return null;
    return h * 60 + min;
  }

  function cleanDays(days) {
    return Array.isArray(days)
      ? [...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b)
      : [];
  }

  function validateWindow(w) {
    if (!w || typeof w !== 'object' || !Array.isArray(w.days)) return T('errPickDay', 'Pick at least one day.');
    const days = cleanDays(w.days);
    if (!days.length) return T('errPickDay', 'Pick at least one day.');
    if (typeof w.start !== 'string' || typeof w.end !== 'string') return T('errTimeFormat', 'Use a 24-hour time like 09:00.');
    const s = parseHM(w.start);
    const e = parseHM(w.end);
    if (s === null || e === null) return T('errTimeFormat', 'Use a 24-hour time like 09:00.');
    if (s === e) return T('errTimeSame', 'Start and end time must differ.');
    return null;
  }

  /** Is `date` inside any of the schedule windows? Supports overnight windows. */
  function isWithinSchedule(windows, date) {
    const d = date.getDay();
    const mins = date.getHours() * 60 + date.getMinutes();
    const prev = (d + 6) % 7;
    return (windows || []).some((w) => {
      const s = parseHM(w.start);
      const e = parseHM(w.end);
      if (s === null || e === null || s === e) return false;
      if (s < e) return w.days.includes(d) && mins >= s && mins < e;
      // overnight: e.g. 22:00 -> 06:00
      return (w.days.includes(d) && mins >= s) || (w.days.includes(prev) && mins < e);
    });
  }

  /**
   * Central decision: should blocking rules be installed right now?
   * Returns { active: boolean, reason: string }.
   */
  function blockingStatus({ settings, isPro, pomodoro, strict, now }) {
    const date = new Date(now);
    if (strict && strict.active) return { active: true, reason: 'strict' };
    if (isPro && pomodoro && pomodoro.phase === 'focus' && pomodoro.endsAt > now) {
      return { active: true, reason: 'focus' };
    }
    if (!settings.enabled) return { active: false, reason: 'off' };
    if (isPro && settings.schedule && settings.schedule.enabled && settings.schedule.windows.length) {
      return isWithinSchedule(settings.schedule.windows, date)
        ? { active: true, reason: 'schedule' }
        : { active: false, reason: 'outside-schedule' };
    }
    return { active: true, reason: 'on' };
  }

  /* ------------------------------------------------------------ DNR rules */

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  }

  function originsForHost(host) {
    return ['*://' + host + '/*', '*://*.' + host + '/*'];
  }

  /**
   * Build declarativeNetRequest dynamic rules.
   * hasAccess(entry) -> boolean: whether we hold host permission for the entry
   * (needed for redirecting to the block page; otherwise we fall back to a plain block).
   */
  function buildRules({ entries, isPro, active, blockedPageUrl, hasAccess }) {
    if (!active) return [];
    const eff = effectiveEntries(entries, isPro);
    const rules = [];
    let id = 1;
    const redirectAction = {
      type: 'redirect',
      redirect: { regexSubstitution: blockedPageUrl + '#\\0' },
    };
    const base = { resourceTypes: ['main_frame'], isUrlFilterCaseSensitive: false };

    const domains = eff.filter((e) => e.type === 'domain');
    const granted = domains.filter((e) => hasAccess(e)).map((e) => e.host);
    const notGranted = domains.filter((e) => !hasAccess(e)).map((e) => e.host);
    if (granted.length) {
      rules.push({
        id: id++,
        priority: 1,
        action: redirectAction,
        condition: Object.assign({}, base, { regexFilter: '^https?://.*$', requestDomains: granted }),
      });
    }
    if (notGranted.length) {
      rules.push({
        id: id++,
        priority: 1,
        action: { type: 'block' },
        condition: { resourceTypes: ['main_frame'], requestDomains: notGranted },
      });
    }

    for (const e of eff) {
      if (e.type === 'domain') continue;
      let condition;
      if (e.type === 'path') {
        let p = escapeRegex(e.path);
        const tail = e.path.endsWith('/') ? '.*' : '(?:[/?#].*)?';
        condition = Object.assign({}, base, {
          regexFilter: '^https?://[^/?#]+' + p + tail + '$',
          requestDomains: [e.host],
        });
      } else {
        condition = Object.assign({}, base, {
          regexFilter: '^https?://.*' + escapeRegex(e.keyword).replace(/ /g, '(?: |%20|\\+|-)') + '.*$',
        });
      }
      rules.push({
        id: id++,
        priority: 1,
        action: hasAccess(e) ? redirectAction : { type: 'block' },
        condition,
      });
    }
    return rules;
  }

  /* ------------------------------------------------------------------ stats */

  function dayKey(date) {
    const d = new Date(date);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function recordBlock(stats, label, now) {
    const s = stats && stats.days ? deepClone(stats) : { days: {} };
    const k = dayKey(now);
    s.days[k] = s.days[k] || {};
    s.days[k][label] = (s.days[k][label] || 0) + 1;
    // prune old days
    const d = new Date(now);
    const cutoffKey = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - STATS_RETENTION_DAYS, 12));
    for (const key of Object.keys(s.days)) {
      if (key < cutoffKey) delete s.days[key];
    }
    return s;
  }

  function summarizeStats(stats, now, days) {
    const out = { total: 0, today: 0, bySite: {}, byDay: [] };
    const daysObj = (stats && stats.days) || {};
    const base = new Date(now);
    for (let i = days - 1; i >= 0; i--) {
      // calendar arithmetic, not "now - i*24h", so DST changes never skip or repeat a day
      const k = dayKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() - i, 12));
      const bucket = daysObj[k] || {};
      let n = 0;
      for (const [site, c] of Object.entries(bucket)) {
        n += c;
        out.bySite[site] = (out.bySite[site] || 0) + c;
      }
      out.byDay.push({ day: k, count: n });
      out.total += n;
      if (i === 0) out.today = n;
    }
    return out;
  }

  function formatMinutes(min) {
    if (min < 60) return T('unitMin', '$1 min', min);
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? T('unitHourMin', '$1h $2m', h, m) : T('unitHour', '$1h', h);
  }

  /* ------------------------------------------------------- import / export */

  function exportSettings(settings) {
    return {
      app: 'FocusFence',
      format: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        enabled: settings.enabled,
        entries: settings.entries.map((e) => {
          const o = { type: e.type };
          if (e.host) o.host = e.host;
          if (e.path) o.path = e.path;
          if (e.keyword) o.keyword = e.keyword;
          return o;
        }),
        schedule: settings.schedule,
        pomodoro: settings.pomodoro,
        blockMessage: settings.blockMessage,
      },
    };
  }

  /** Validate an imported JSON object. Returns a full settings object or throws. */
  function validateImport(obj, current) {
    if (!obj || typeof obj !== 'object' || obj.app !== 'FocusFence' || !obj.settings) {
      throw new Error(T('errNotExport', 'This file is not a FocusFence export.'));
    }
    const src = obj.settings;
    const out = Object.assign(deepClone(DEFAULT_SETTINGS), deepClone(current || {}));
    if (typeof src.enabled === 'boolean') out.enabled = src.enabled;
    if (Array.isArray(src.entries)) {
      const seen = new Set();
      out.entries = [];
      for (const raw of src.entries.slice(0, 5000)) {
        let parsed;
        try {
          if (raw.type === 'domain') parsed = parseEntry(raw.host, 'domain');
          else if (raw.type === 'path') parsed = parseEntry(raw.host + raw.path, 'path');
          else if (raw.type === 'keyword') parsed = parseEntry(raw.keyword, 'keyword');
        } catch (e) {
          continue;
        }
        if (!parsed || seen.has(entryKey(parsed))) continue;
        seen.add(entryKey(parsed));
        out.entries.push(Object.assign({ id: uid(), addedAt: Date.now() }, parsed));
      }
    }
    if (src.schedule && Array.isArray(src.schedule.windows)) {
      out.schedule = {
        enabled: !!src.schedule.enabled,
        windows: src.schedule.windows
          .filter((w) => !validateWindow(w))
          .slice(0, MAX_SCHEDULE_WINDOWS)
          .map((w) => ({ id: uid(), days: cleanDays(w.days), start: w.start, end: w.end })),
      };
    }
    if (src.pomodoro) {
      const p = validatePomodoro(src.pomodoro);
      if (p) out.pomodoro = p;
    }
    if (typeof src.blockMessage === 'string') out.blockMessage = src.blockMessage.slice(0, 280);
    return out;
  }

  function validatePomodoro(p) {
    const f = Math.round(Number(p.focusMin));
    const b = Math.round(Number(p.breakMin));
    const c = Math.round(Number(p.cycles));
    if (!(f >= 1 && f <= 180 && b >= 1 && b <= 60 && c >= 1 && c <= 12)) return null;
    return { focusMin: f, breakMin: b, cycles: c };
  }

  /* ----------------------------------------------------- strict mode helper */

  function makeChallenge(rand) {
    const r = rand || Math.random;
    const words = [];
    for (let i = 0; i < 8; i++) words.push(CHALLENGE_WORDS[Math.floor(r() * CHALLENGE_WORDS.length)]);
    return words.join(' ');
  }

  function strictUnlockState(strict, now) {
    if (!strict || !strict.active) return { phase: 'inactive' };
    if (!strict.unlockRequestedAt) return { phase: 'locked' };
    const readyAt = strict.unlockRequestedAt + STRICT_UNLOCK_DELAY_MS;
    if (now < readyAt) return { phase: 'waiting', readyAt, remainingMs: readyAt - now };
    return { phase: 'challenge', readyAt };
  }

  /**
   * Does a set of granted origin patterns let us redirect every request to `host`
   * and its subdomains? Access to a parent domain (*://*.reddit.com/*) covers
   * old.reddit.com too.
   */
  function hostCovered(host, origins) {
    const set = origins instanceof Set ? origins : new Set(origins || []);
    if (set.has(ALL_SITES_ORIGIN) || set.has('<all_urls>') || set.has('*://*/*')) return true;
    const labels = host.split('.');
    for (let i = 0; i < labels.length - 1; i++) {
      const parent = labels.slice(i).join('.');
      if (set.has('*://*.' + parent + '/*')) return true;
    }
    return false;
  }

  /**
   * Advance a Pomodoro session to `now`, replaying phases on the session's own
   * timeline (so a sleeping service worker or closed browser never restarts a
   * stale session). Returns the new session or null when it is over.
   */
  function advancePomodoroTo(p, now) {
    let cur = p ? Object.assign({}, p) : null;
    let guard = 0;
    while (cur && cur.endsAt <= now && guard++ < 100) {
      const t = cur.endsAt;
      if (cur.phase === 'focus') {
        cur = cur.cycle < cur.totalCycles
          ? Object.assign({}, cur, { phase: 'break', startedAt: t, endsAt: t + cur.breakMin * MINUTE })
          : null;
      } else {
        cur = Object.assign({}, cur, { phase: 'focus', cycle: cur.cycle + 1, startedAt: t, endsAt: t + cur.focusMin * MINUTE });
      }
    }
    return cur;
  }

  const STRICT_GAP_TOLERANCE_MS = 3 * MINUTE;

  /**
   * Timed strict mode only counts time while FocusFence is actually running.
   * The worker records a heartbeat every minute; if it was not running for a
   * while (extension disabled, browser closed, computer asleep), the end time is
   * pushed back by that gap so switching FocusFence off cannot "run out the clock".
   * Returns { strict, pausedMs }.
   */
  function applyStrictHeartbeat(strict, now) {
    if (!strict || !strict.active) return { strict, pausedMs: 0 };
    const next = Object.assign({}, strict);
    const last = next.heartbeatAt || next.startedAt || now;
    const gap = now - last;
    let pausedMs = 0;
    if (next.endsAt && gap > STRICT_GAP_TOLERANCE_MS && now < next.endsAt + gap) {
      pausedMs = gap - MINUTE; // one regular tick interval counts as running time
      next.endsAt += pausedMs;
      next.pausedMs = (next.pausedMs || 0) + pausedMs;
    }
    next.heartbeatAt = now;
    return { strict: next, pausedMs };
  }

  /**
   * Region of the user's first preferred locale ('fr' -> 'FR', 'en' -> 'US', 'es-MX' -> 'MX'),
   * or null if it can't be determined.
   */
  function localeRegion(locales) {
    const first = (Array.isArray(locales) ? locales : [locales]).find((l) => typeof l === 'string' && l.trim());
    if (!first) return null;
    try {
      const loc = new Intl.Locale(first.replace(/_/g, '-'));
      return (loc.region || loc.maximize().region || '').toUpperCase() || null;
    } catch (e) {
      return null;
    }
  }

  /** 'EUR' for eurozone regions, 'USD' otherwise (including when the region is unknown). */
  function currencyForLocales(locales) {
    return EUROZONE.has(localeRegion(locales)) ? 'EUR' : 'USD';
  }

  /** The price set (amounts + plan nicknames) to show and sell for these locales. */
  function pricingFor(prices, locales) {
    return prices[currencyForLocales(locales)] || prices.USD;
  }

  /** ExtensionPay plan nickname for 'monthly' | 'yearly' in this price set, or null. */
  function planNickname(pricing, plan) {
    return (plan === 'monthly' || plan === 'yearly') && pricing && pricing.plans ? pricing.plans[plan] || null : null;
  }

  const api = {
    EUROZONE,
    localeRegion,
    currencyForLocales,
    pricingFor,
    planNickname,
    MINUTE,
    STRICT_UNLOCK_DELAY_MS,
    ALL_SITES_ORIGIN,
    DEFAULT_SETTINGS,
    QUOTES,
    deepClone,
    uid,
    hostFromInput,
    parseEntry,
    entryKey,
    isProEntry,
    hostMatches,
    pathMatches,
    entryMatchesUrl,
    effectiveEntries,
    findMatchingEntry,
    parseHM,
    validateWindow,
    isWithinSchedule,
    blockingStatus,
    escapeRegex,
    originsForHost,
    buildRules,
    dayKey,
    recordBlock,
    summarizeStats,
    formatMinutes,
    exportSettings,
    validateImport,
    validatePomodoro,
    makeChallenge,
    strictUnlockState,
    applyStrictHeartbeat,
    setTranslator,
    T,
    quote,
    hostCovered,
    advancePomodoroTo,
    cleanDays,
    MAX_PATTERN_ENTRIES,
    MAX_SCHEDULE_WINDOWS,
    STRICT_HOURS,
  };

  root.FFCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);
