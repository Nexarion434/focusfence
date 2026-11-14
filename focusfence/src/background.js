// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/* FocusFence service worker (classic script so ExtPay's bundle can be importScripts-ed). */
'use strict';

importScripts('config.js', 'vendor/ExtPay.js', 'lib/core.js');

const C = self.FFCore;
const M = (key, ...subs) => C.T(key, key, ...subs); // localized message (falls back to the key)
const CONFIG = self.FF_CONFIG;
const BLOCKED_PAGE = chrome.runtime.getURL('blocked.html');
const SPA_SCRIPT_ID = 'ff-spa-guard';
const UNLOCK_SESSION_MS = 15 * C.MINUTE;

/* ------------------------------------------------------------- payments */

const extpay = ExtPay(CONFIG.EXTPAY_ID);
extpay.startBackground();
try {
  extpay.onPaid.addListener((user) => {
    saveLicense(user).then(() => queueSync());
  });
} catch (e) {
  console.warn('[FocusFence] ExtPay onPaid unavailable', e);
}

async function saveLicense(user) {
  const license = {
    paid: !!(user && user.paid),
    plan: user && user.plan ? user.plan.interval || user.plan.nickname || null : null,
    status: (user && user.subscriptionStatus) || null,
    checkedAt: Date.now(),
    lastError: null,
  };
  await chrome.storage.local.set({ license });
  return license;
}

/** ExtPay throws strings, Responses or TypeErrors; turn them into one friendly error. */
function paymentError(e) {
  const raw = e && e.message ? e.message : String(e);
  console.warn('[FocusFence] ExtensionPay error', raw);
  return new FFError('NETWORK', M('errNetwork'));
}

async function refreshLicense() {
  if (CONFIG.DEV) return null; // never talk to the network in DEV builds
  try {
    const user = await extpay.getUser();
    return await saveLicense(user);
  } catch (e) {
    // Offline or service down: keep the last known status, remember the failure.
    const { license } = await chrome.storage.local.get('license');
    const kept = Object.assign({ paid: false }, license, {
      lastError: e && e.message ? e.message : String(e),
      lastErrorAt: Date.now(),
    });
    await chrome.storage.local.set({ license: kept });
    console.warn('[FocusFence] license check failed (keeping cached value)', kept.lastError);
    return null;
  }
}

/* -------------------------------------------------------------- storage */

async function loadAll() {
  const st = await chrome.storage.local.get([
    'settings', 'pomodoro', 'strict', 'stats', 'license', 'devPro', 'lock',
  ]);
  st.settings = Object.assign(C.deepClone(C.DEFAULT_SETTINGS), st.settings || {});
  st.pomodoro = st.pomodoro || null;
  st.strict = st.strict || { active: false };
  st.stats = st.stats || { days: {} };
  st.license = st.license || { paid: false };
  return st;
}

/** EUR in the eurozone, USD elsewhere: based on the browser's preferred languages. */
function userLocales() {
  const langs = (self.navigator && self.navigator.languages) || [];
  if (langs.length) return langs;
  try {
    return [chrome.i18n.getUILanguage()];
  } catch (e) {
    return [];
  }
}

function currentPricing() {
  return C.pricingFor(CONFIG.PRICES, userLocales());
}

function isProFrom(st) {
  if (CONFIG.DEV && st.devPro) return true;
  return !!(st.license && st.license.paid);
}

async function isUnlocked(st) {
  if (!st.lock) return true;
  const s = await chrome.storage.session.get('unlockedUntil');
  return (s.unlockedUntil || 0) > Date.now();
}

/* Serialize every state mutation so read-modify-write never interleaves. */
let chain = Promise.resolve();
function serial(fn) {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

class FFError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const proRequired = () => new FFError('PRO_REQUIRED', M('errProRequired'));
const strictBlocked = () =>
  new FFError('STRICT', M('errStrict'));
const lockedErr = () => new FFError('LOCKED', M('errLocked'));

/* ------------------------------------------------------- password lock */

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, saltHex, iterations) {
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return bufToHex(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ---------------------------------------------------------- rule sync */

async function accessChecker(entries) {
  const perms = await chrome.permissions.getAll();
  const origins = new Set(perms.origins || []);
  const all = origins.has(C.ALL_SITES_ORIGIN) || origins.has('<all_urls>');
  const map = {};
  for (const e of entries) {
    if (all) map[e.id] = true;
    else if (e.type === 'keyword') map[e.id] = false;
    else map[e.id] = C.hostCovered(e.host, origins);
  }
  return { all, map, has: (e) => !!map[e.id] };
}

let syncQueued = null;
function queueSync() {
  if (!syncQueued) {
    syncQueued = serial(async () => {
      syncQueued = null;
      await syncNow();
    });
  }
  return syncQueued;
}

async function applyRules(rules) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: rules });
  } catch (e) {
    // One bad rule must not disable everything: add rules one by one.
    console.warn('[FocusFence] bulk rule update failed, retrying individually', e);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    for (const r of rules) {
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [r] });
      } catch (err) {
        console.warn('[FocusFence] skipped invalid rule', r, err);
      }
    }
  }
}

async function syncSpaGuard(st, isPro, access) {
  // Single-page apps (e.g. YouTube) change paths without a network navigation,
  // so path rules also get a tiny content script on the hosts the user granted.
  const hosts = new Set();
  if (isPro) {
    for (const e of st.settings.entries) {
      if (e.type === 'path' && access.has(e)) hosts.add(e.host);
    }
  }
  const matches = [...hosts].flatMap(C.originsForHost);
  let registered = [];
  try {
    registered = await chrome.scripting.getRegisteredContentScripts({ ids: [SPA_SCRIPT_ID] });
  } catch (e) {
    registered = [];
  }
  try {
    if (!matches.length) {
      if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: [SPA_SCRIPT_ID] });
      return;
    }
    const def = {
      id: SPA_SCRIPT_ID,
      js: ['spa-guard.js'],
      matches,
      runAt: 'document_start',
      persistAcrossSessions: true,
    };
    if (registered.length) await chrome.scripting.updateContentScripts([def]);
    else await chrome.scripting.registerContentScripts([def]);
  } catch (e) {
    console.warn('[FocusFence] content script registration failed', e);
  }
}

async function updateBadge(st, status) {
  let text = '';
  let color = '#1F5A4C'; // pine: stands out on the field-green icon, 8:1 with white text
  let title = 'FocusFence';
  const now = Date.now();
  if (st.pomodoro && st.pomodoro.endsAt > now && isProFrom(st)) {
    const mins = Math.max(1, Math.ceil((st.pomodoro.endsAt - now) / C.MINUTE));
    text = mins + 'm';
    color = st.pomodoro.phase === 'focus' ? '#1F5A4C' : '#7A8A84';
    title = st.pomodoro.phase === 'focus' ? M('titleFocus') : M('titleBreak');
  } else if (!status.active) {
    text = status.reason === 'off' ? M('badgeOff') : '';
    color = '#8A938F';
    title = status.reason === 'off' ? M('titleOff') : M('titleOutside');
  } else if (st.strict && st.strict.active) {
    title = M('titleStrict');
  } else {
    title = M('titleOn');
  }
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  await chrome.action.setTitle({ title });
}

async function syncNow() {
  const st = await loadAll();
  const isPro = isProFrom(st);
  const now = Date.now();

  // strict-mode clock pauses while FocusFence was not running (disabled / asleep)
  if (st.strict.active) {
    const hb = C.applyStrictHeartbeat(st.strict, now);
    st.strict = hb.strict;
    await chrome.storage.local.set({ strict: st.strict });
  }
  // expire timers that ended while the worker was asleep
  if (st.strict.active && st.strict.endsAt && st.strict.endsAt <= now) {
    st.strict = { active: false };
    await chrome.storage.local.set({ strict: st.strict });
  }
  if (st.pomodoro && st.pomodoro.endsAt <= now) {
    st.pomodoro = C.advancePomodoroTo(st.pomodoro, now);
    if (st.pomodoro) await chrome.storage.local.set({ pomodoro: st.pomodoro });
    else await chrome.storage.local.remove('pomodoro');
  }

  const status = C.blockingStatus({ settings: st.settings, isPro, pomodoro: st.pomodoro, strict: st.strict, now });
  const access = await accessChecker(st.settings.entries);
  const rules = C.buildRules({
    entries: st.settings.entries,
    isPro,
    active: status.active,
    blockedPageUrl: BLOCKED_PAGE,
    hasAccess: access.has,
  });
  await applyRules(rules);
  await syncSpaGuard(st, isPro, access);
  await updateBadge(st, status);
  await ensureAlarms(st);
  return { status, rules: rules.length };
}

/* --------------------------------------------------------------- alarms */

async function ensureAlarms(st) {
  const tick = await chrome.alarms.get('ff-tick');
  if (!tick) await chrome.alarms.create('ff-tick', { periodInMinutes: 1 });
  const lic = await chrome.alarms.get('ff-license');
  if (!lic) await chrome.alarms.create('ff-license', { periodInMinutes: 12 * 60 });
  if (st.pomodoro && st.pomodoro.endsAt) {
    await chrome.alarms.create('ff-pomodoro', { when: st.pomodoro.endsAt });
  } else {
    await chrome.alarms.clear('ff-pomodoro');
  }
  if (st.strict && st.strict.active && st.strict.endsAt) {
    await chrome.alarms.create('ff-strict-end', { when: st.strict.endsAt });
  } else {
    await chrome.alarms.clear('ff-strict-end');
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'ff-license') {
    refreshLicense().then(() => queueSync());
    return;
  }
  // ff-tick (schedule boundaries / badge), ff-pomodoro, ff-strict-end all resolve in syncNow
  queueSync();
});

/* ------------------------------------------------------------- actions */

function stripSecrets(st) {
  return Object.assign({}, st.settings);
}

async function getState() {
  const st = await loadAll();
  const isPro = isProFrom(st);
  const now = Date.now();
  const status = C.blockingStatus({ settings: st.settings, isPro, pomodoro: st.pomodoro, strict: st.strict, now });
  const access = await accessChecker(st.settings.entries);
  let unlock = C.strictUnlockState(st.strict, now);
  if (unlock.phase === 'challenge') {
    if (!st.strict.challenge) {
      st.strict.challenge = C.makeChallenge();
      await chrome.storage.local.set({ strict: st.strict });
    }
    unlock = Object.assign({}, unlock, { challenge: st.strict.challenge });
  }
  return {
    dev: CONFIG.DEV,
    prices: currentPricing(),
    sourceUrl: CONFIG.SOURCE_URL,
    privacyUrl: CONFIG.PRIVACY_URL,
    isPro,
    license: st.license,
    devPro: !!st.devPro,
    settings: stripSecrets(st),
    hasPassword: !!st.lock,
    locked: !(await isUnlocked(st)),
    status,
    pomodoro: st.pomodoro && st.pomodoro.endsAt > now ? st.pomodoro : null,
    strict: {
      active: !!st.strict.active,
      endsAt: st.strict.endsAt || null,
      startedAt: st.strict.startedAt || null,
      pausedMs: st.strict.pausedMs || 0,
      unlock,
    },
    access: access.map,
    allSitesAccess: access.all,
    stats: C.summarizeStats(st.stats, now, 7),
    blockedPageUrl: BLOCKED_PAGE,
    now,
  };
}

async function mutateSettings(fn) {
  const st = await loadAll();
  const settings = C.deepClone(st.settings);
  const result = await fn(settings, st);
  await chrome.storage.local.set({ settings });
  return result;
}

const handlers = {
  async getState() {
    return getState();
  },

  async addEntry({ raw, kind }) {
    return mutateSettings(async (settings, st) => {
      if (typeof raw !== 'string' || raw.length > 2048) throw new FFError('INVALID', M('errEnterSite'));
      let parsed;
      try {
        parsed = C.parseEntry(raw, kind || 'auto');
      } catch (e) {
        throw new FFError('INVALID', e.message);
      }
      if (C.isProEntry(parsed) && !isProFrom(st)) throw proRequired();
      if (C.isProEntry(parsed) && settings.entries.filter(C.isProEntry).length >= C.MAX_PATTERN_ENTRIES) {
        throw new FFError('LIMIT', M('errPatternLimit', C.MAX_PATTERN_ENTRIES));
      }
      const key = C.entryKey(parsed);
      const existing = settings.entries.find((e) => C.entryKey(e) === key);
      if (existing) return { entry: existing, duplicate: true };
      const entry = Object.assign({ id: C.uid(), addedAt: Date.now() }, parsed);
      settings.entries.unshift(entry);
      return { entry, origins: entry.type === 'keyword' ? [C.ALL_SITES_ORIGIN] : C.originsForHost(entry.host) };
    });
  },

  async removeEntry({ id }) {
    return mutateSettings(async (settings, st) => {
      if (st.strict.active) throw strictBlocked();
      if (!(await isUnlocked(st))) throw lockedErr();
      settings.entries = settings.entries.filter((e) => e.id !== id);
      return {};
    });
  },

  async setEnabled({ enabled }) {
    return mutateSettings(async (settings, st) => {
      if (!enabled) {
        if (st.strict.active) throw strictBlocked();
        if (!(await isUnlocked(st))) throw lockedErr();
      }
      settings.enabled = !!enabled;
      return { enabled: settings.enabled };
    });
  },

  async setSchedule({ schedule }) {
    return mutateSettings(async (settings, st) => {
      if (!isProFrom(st)) throw proRequired();
      if (st.strict.active) throw strictBlocked();
      if (!(await isUnlocked(st))) throw lockedErr();
      if (!schedule || typeof schedule !== 'object' || (schedule.windows && !Array.isArray(schedule.windows))) {
        throw new FFError('INVALID', M('errInvalidSchedule'));
      }
      if ((schedule.windows || []).length > C.MAX_SCHEDULE_WINDOWS) {
        throw new FFError('INVALID', M('errScheduleMax', C.MAX_SCHEDULE_WINDOWS));
      }
      const windows = (schedule.windows || []).map((w) => {
        const err = C.validateWindow(w);
        if (err) throw new FFError('INVALID', err);
        return { id: typeof w.id === 'string' ? w.id : C.uid(), days: C.cleanDays(w.days), start: w.start, end: w.end };
      });
      settings.schedule = { enabled: !!schedule.enabled, windows };
      return { schedule: settings.schedule };
    });
  },

  async setPomodoroConfig({ pomodoro }) {
    return mutateSettings(async (settings, st) => {
      if (!isProFrom(st)) throw proRequired();
      if (!(await isUnlocked(st))) throw lockedErr();
      const p = C.validatePomodoro(pomodoro || {});
      if (!p) throw new FFError('INVALID', M('errPomodoro'));
      settings.pomodoro = p;
      return { pomodoro: p };
    });
  },

  async startPomodoro() {
    const st = await loadAll();
    if (!isProFrom(st)) throw proRequired();
    const cfg = st.settings.pomodoro;
    const now = Date.now();
    const pomodoro = {
      phase: 'focus',
      cycle: 1,
      totalCycles: cfg.cycles,
      focusMin: cfg.focusMin,
      breakMin: cfg.breakMin,
      startedAt: now,
      endsAt: now + cfg.focusMin * C.MINUTE,
    };
    await chrome.storage.local.set({ pomodoro });
    return { pomodoro };
  },

  async stopPomodoro() {
    const st = await loadAll();
    if (!(await isUnlocked(st))) throw lockedErr();
    await chrome.storage.local.remove('pomodoro');
    return {};
  },

  async startStrict({ hours }) {
    const st = await loadAll();
    if (!isProFrom(st)) throw proRequired();
    if (st.strict.active) return { strict: st.strict };
    const h = typeof hours === 'number' ? hours : typeof hours === 'string' && hours.trim() !== '' ? Number(hours) : NaN;
    // A bad value must never fall back to "until I unlock it".
    if (!C.STRICT_HOURS.includes(h)) throw new FFError('INVALID', M('errStrictDuration'));
    const now = Date.now();
    const strict = {
      active: true,
      startedAt: now,
      endsAt: h ? now + h * 60 * C.MINUTE : null,
      unlockRequestedAt: null,
      challenge: null,
      heartbeatAt: now,
      pausedMs: 0,
    };
    const settings = Object.assign({}, st.settings, { enabled: true });
    await chrome.storage.local.set({ strict, settings });
    return { strict };
  },

  async requestStrictUnlock() {
    const st = await loadAll();
    if (!st.strict.active) return {};
    if (!st.strict.unlockRequestedAt) {
      st.strict.unlockRequestedAt = Date.now();
      st.strict.challenge = null;
      await chrome.storage.local.set({ strict: st.strict });
    }
    return { unlock: C.strictUnlockState(st.strict, Date.now()) };
  },

  async cancelStrictUnlock() {
    const st = await loadAll();
    if (!st.strict.active) return {};
    st.strict.unlockRequestedAt = null;
    st.strict.challenge = null;
    await chrome.storage.local.set({ strict: st.strict });
    return {};
  },

  async completeStrictUnlock({ typed }) {
    const st = await loadAll();
    if (!st.strict.active) return { done: true };
    const u = C.strictUnlockState(st.strict, Date.now());
    if (u.phase !== 'challenge') {
      throw new FFError('STRICT_WAIT', M('errStrictWait'));
    }
    if (!st.strict.challenge || String(typed || '').trim() !== st.strict.challenge) {
      throw new FFError('CHALLENGE', M('errChallenge'));
    }
    await chrome.storage.local.set({ strict: { active: false } });
    return { done: true };
  },

  async setPassword({ password }) {
    const st = await loadAll();
    if (!isProFrom(st)) throw proRequired();
    if (!(await isUnlocked(st))) throw lockedErr();
    if (typeof password !== 'string' || password.length < 4 || password.length > 256) {
      throw new FFError('INVALID', M('errPasswordLength'));
    }
    const salt = bufToHex(crypto.getRandomValues(new Uint8Array(16)));
    const iterations = 150000;
    const hash = await hashPassword(password, salt, iterations);
    await chrome.storage.local.set({ lock: { salt, iterations, hash } });
    await chrome.storage.session.set({ unlockedUntil: Date.now() + UNLOCK_SESSION_MS });
    return {};
  },

  async removePassword() {
    const st = await loadAll();
    if (!(await isUnlocked(st))) throw lockedErr();
    await chrome.storage.local.remove('lock');
    await chrome.storage.session.remove('unlockedUntil');
    return {};
  },

  async unlock({ password }) {
    const st = await loadAll();
    if (!st.lock) return { unlocked: true };
    const now = Date.now();
    const sess = await chrome.storage.session.get(['failedUnlocks', 'unlockBlockedUntil']);
    if ((sess.unlockBlockedUntil || 0) > now) {
      const secs = Math.ceil((sess.unlockBlockedUntil - now) / 1000);
      throw new FFError('THROTTLED', M('errThrottled', secs));
    }
    const h = await hashPassword(String(password || '').slice(0, 1024), st.lock.salt, st.lock.iterations);
    if (!timingSafeEqual(h, st.lock.hash)) {
      const failed = (sess.failedUnlocks || 0) + 1;
      // after 5 misses: 30 s, then doubling up to 15 min
      const wait = failed >= 5 ? Math.min(15 * 60, 30 * 2 ** (failed - 5)) * 1000 : 0;
      await chrome.storage.session.set({ failedUnlocks: failed, unlockBlockedUntil: wait ? now + wait : 0 });
      throw new FFError('BAD_PASSWORD', M('errBadPassword'));
    }
    await chrome.storage.session.set({ unlockedUntil: now + UNLOCK_SESSION_MS, failedUnlocks: 0, unlockBlockedUntil: 0 });
    return { unlocked: true };
  },

  async lockNow() {
    await chrome.storage.session.remove('unlockedUntil');
    return {};
  },

  async setBlockMessage({ message }) {
    return mutateSettings(async (settings, st) => {
      if (!isProFrom(st)) throw proRequired();
      if (!(await isUnlocked(st))) throw lockedErr();
      settings.blockMessage = String(message || '').slice(0, 280);
      return {};
    });
  },

  async exportSettings() {
    const st = await loadAll();
    if (!isProFrom(st)) throw proRequired();
    return { data: C.exportSettings(st.settings) };
  },

  async importSettings({ data }) {
    const st = await loadAll();
    if (!isProFrom(st)) throw proRequired();
    if (st.strict.active) throw strictBlocked();
    if (!(await isUnlocked(st))) throw lockedErr();
    let obj = data;
    if (typeof data === 'string' && data.length > 2 * 1024 * 1024) throw new FFError('INVALID', M('errFileTooLarge'));
    if (typeof data === 'string') {
      try {
        obj = JSON.parse(data);
      } catch (e) {
        throw new FFError('INVALID', M('errNotJson'));
      }
    }
    let settings;
    try {
      settings = C.validateImport(obj, st.settings);
    } catch (e) {
      throw new FFError('INVALID', e.message);
    }
    await chrome.storage.local.set({ settings });
    return { count: settings.entries.length };
  },

  async recordBlock({ url }, sender) {
    // only our own block page may record stats
    if (!sender.url || !sender.url.startsWith(BLOCKED_PAGE) || !sender.tab || sender.frameId !== 0) return {};
    if (typeof url !== 'string' || url.length > 8192) return {};
    const st = await loadAll();
    const isPro = isProFrom(st);
    const entry = C.findMatchingEntry(st.settings.entries, url, isPro);
    let label = entry ? entry.label : null;
    if (!label) {
      try {
        label = new URL(url).hostname.replace(/^www\./, '');
      } catch (e) {
        label = 'unknown';
      }
    }
    const stats = C.recordBlock(st.stats, label, Date.now());
    await chrome.storage.local.set({ stats });
    return { label, entry, summary: C.summarizeStats(stats, Date.now(), 7) };
  },

  async getStats({ days }) {
    const st = await loadAll();
    return { summary: C.summarizeStats(st.stats, Date.now(), Math.min(90, Number(days) || 7)), isPro: isProFrom(st) };
  },

  async clearStats() {
    const st = await loadAll();
    if (!(await isUnlocked(st))) throw lockedErr();
    await chrome.storage.local.set({ stats: { days: {} } });
    return {};
  },

  async spaNav({ url }, sender) {
    try {
      if (typeof url !== 'string' || new URL(url).origin !== new URL(sender.url).origin) return {};
    } catch (e) {
      return {};
    }
    const st = await loadAll();
    const isPro = isProFrom(st);
    const status = C.blockingStatus({
      settings: st.settings, isPro, pomodoro: st.pomodoro, strict: st.strict, now: Date.now(),
    });
    if (!status.active) return {};
    const entry = C.findMatchingEntry(st.settings.entries, url, isPro);
    return entry ? { redirect: BLOCKED_PAGE + '#' + url } : {};
  },

  async setDevPro({ on }) {
    if (!CONFIG.DEV) throw new FFError('DEV_ONLY', M('errDevOnly'));
    await chrome.storage.local.set({ devPro: !!on });
    return { devPro: !!on };
  },

  async openPayment({ plan }) {
    // the plan in the user's currency: monthly / yearly (USD) or monthly-eur / yearly-eur (EUR)
    const nickname = C.planNickname(currentPricing(), plan);
    if (!nickname) throw new FFError('INVALID', M('errBadPlan'));
    if (CONFIG.DEV) {
      throw new FFError('DEV_ONLY', M('errDevPayments'));
    }
    try {
      await extpay.openPaymentPage(nickname);
    } catch (e) {
      throw paymentError(e);
    }
    return {};
  },

  async openLogin() {
    if (CONFIG.DEV) throw new FFError('DEV_ONLY', M('errDevPayments'));
    try {
      await extpay.openLoginPage();
    } catch (e) {
      throw paymentError(e);
    }
    return {};
  },

  async refreshLicense() {
    await refreshLicense();
    const { license } = await chrome.storage.local.get('license');
    return { license: license || { paid: false } };
  },

  async sync() {
    return {};
  },
};

// Messages that change state trigger a rule sync afterwards.
const READ_ONLY = new Set(['getState', 'getStats', 'exportSettings', 'spaNav', 'refreshLicense']);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string' || !Object.prototype.hasOwnProperty.call(handlers, msg.type)) {
    return false; // not ours (e.g. ExtPay's internal messages)
  }
  // Only accept messages from our own pages, plus spaNav from our content script.
  if (sender.id !== chrome.runtime.id) return false;
  const fromExtensionPage = sender.url && sender.url.startsWith(chrome.runtime.getURL(''));
  if (!fromExtensionPage && msg.type !== 'spaNav') return false;

  const run = serial(() => handlers[msg.type](msg, sender));
  run
    .then(async (result) => {
      if (!READ_ONLY.has(msg.type)) await queueSync();
      sendResponse(Object.assign({ ok: true }, result));
    })
    .catch((err) => {
      if (!(err instanceof FFError)) console.error('[FocusFence] handler failed', msg.type, err);
      const known = err instanceof FFError;
      sendResponse({
        ok: false,
        code: known ? err.code : 'ERROR',
        error: known ? err.message : M('errGeneric'),
      });
    });
  return true;
});

/* ----------------------------------------------------------- lifecycle */

chrome.runtime.onInstalled.addListener(async (details) => {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) await chrome.storage.local.set({ settings: C.deepClone(C.DEFAULT_SETTINGS) });
  if (details.reason === 'install' && !CONFIG.DEV) {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
  await refreshLicense();
  queueSync();
});

chrome.runtime.onStartup.addListener(() => {
  refreshLicense().then(() => queueSync());
});

chrome.permissions.onAdded.addListener(() => queueSync());
chrome.permissions.onRemoved.addListener(() => queueSync());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.devPro || changes.license)) queueSync();
});

// Worker wake-ups (alarms, messages) always start from a consistent state.
queueSync();
