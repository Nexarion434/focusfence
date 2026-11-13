// Unit tests for the pure logic in src/lib/core.js (runs in Node, no browser).
import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../src/lib/core.js');

test.describe('parseEntry', () => {
  test('normalizes domains', () => {
    expect(C.parseEntry('https://www.Reddit.com/r/foo', 'domain')).toMatchObject({ type: 'domain', host: 'reddit.com' });
    expect(C.parseEntry('old.reddit.com', 'domain').host).toBe('old.reddit.com');
    expect(() => C.parseEntry('not a site', 'domain')).toThrow();
    expect(() => C.parseEntry('chrome://extensions', 'domain')).toThrow();
  });
  test('auto-detects paths and keywords', () => {
    expect(C.parseEntry('youtube.com/shorts/', 'auto')).toMatchObject({ type: 'path', host: 'youtube.com', path: '/shorts' });
    expect(C.parseEntry('reddit.com', 'auto').type).toBe('domain');
    expect(C.parseEntry('keyword:Poker', 'auto')).toMatchObject({ type: 'keyword', keyword: 'poker' });
    expect(() => C.parseEntry('ab', 'keyword')).toThrow();
  });
});

test.describe('matching', () => {
  const reddit = C.parseEntry('reddit.com', 'domain');
  const shorts = C.parseEntry('youtube.com/shorts', 'path');
  test('domain covers subdomains only', () => {
    expect(C.entryMatchesUrl(reddit, 'https://old.reddit.com/r/x')).toBe(true);
    expect(C.entryMatchesUrl(reddit, 'https://reddit.com')).toBe(true);
    expect(C.entryMatchesUrl(reddit, 'https://notreddit.com')).toBe(false);
  });
  test('path respects segment boundaries', () => {
    expect(C.entryMatchesUrl(shorts, 'https://www.youtube.com/shorts/abc')).toBe(true);
    expect(C.entryMatchesUrl(shorts, 'https://m.youtube.com/shorts')).toBe(true);
    expect(C.entryMatchesUrl(shorts, 'https://www.youtube.com/')).toBe(false);
    expect(C.entryMatchesUrl(shorts, 'https://www.youtube.com/shortsfoo')).toBe(false);
  });
  test('Pro entries are ignored on Free', () => {
    expect(C.findMatchingEntry([shorts], 'https://youtube.com/shorts/1', false)).toBeNull();
    expect(C.findMatchingEntry([shorts], 'https://youtube.com/shorts/1', true)).toBe(shorts);
  });
});

test.describe('schedules', () => {
  const at = (day, h, m) => {
    // 2026-11-15 is a Sunday (day 0)
    const d = new Date(2026, 10, 15 + day, h, m);
    return d;
  };
  test('daytime window', () => {
    const w = [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }];
    expect(C.isWithinSchedule(w, at(1, 9, 0))).toBe(true);
    expect(C.isWithinSchedule(w, at(1, 16, 59))).toBe(true);
    expect(C.isWithinSchedule(w, at(1, 17, 0))).toBe(false);
    expect(C.isWithinSchedule(w, at(0, 12, 0))).toBe(false);
  });
  test('overnight window spills into next day', () => {
    const w = [{ days: [5], start: '22:00', end: '02:00' }]; // Friday night
    expect(C.isWithinSchedule(w, at(5, 23, 0))).toBe(true);
    expect(C.isWithinSchedule(w, at(6, 1, 30))).toBe(true);
    expect(C.isWithinSchedule(w, at(6, 2, 30))).toBe(false);
    expect(C.isWithinSchedule(w, at(4, 23, 0))).toBe(false);
  });
  test('blockingStatus precedence: strict > focus > off > schedule', () => {
    const settings = { ...C.DEFAULT_SETTINGS, enabled: false, schedule: { enabled: true, windows: [] } };
    const now = Date.now();
    expect(C.blockingStatus({ settings, isPro: true, now }).active).toBe(false);
    expect(C.blockingStatus({ settings, isPro: true, strict: { active: true }, now }).reason).toBe('strict');
    expect(
      C.blockingStatus({ settings, isPro: true, pomodoro: { phase: 'focus', endsAt: now + 1000 }, now }).reason
    ).toBe('focus');
    expect(C.blockingStatus({ settings, isPro: false, pomodoro: { phase: 'focus', endsAt: now + 1000 }, now }).active).toBe(false);
  });
});

test.describe('rules', () => {
  test('domains collapse into one redirect rule, missing access falls back to block', () => {
    const entries = ['reddit.com', 'x.com', 'tiktok.com'].map((d, i) => ({ id: 'e' + i, ...C.parseEntry(d, 'domain') }));
    const rules = C.buildRules({
      entries,
      isPro: false,
      active: true,
      blockedPageUrl: 'chrome-extension://abc/blocked.html',
      hasAccess: (e) => e.host !== 'tiktok.com',
    });
    expect(rules).toHaveLength(2);
    expect(rules[0].action.type).toBe('redirect');
    expect(rules[0].condition.requestDomains).toEqual(['reddit.com', 'x.com']);
    expect(rules[1].action.type).toBe('block');
    expect(rules[1].condition.requestDomains).toEqual(['tiktok.com']);
  });
  test('path regex matches like entryMatchesUrl', () => {
    const e = { id: 'p', ...C.parseEntry('youtube.com/shorts', 'path') };
    const [rule] = C.buildRules({ entries: [e], isPro: true, active: true, blockedPageUrl: 'x', hasAccess: () => true });
    const re = new RegExp(rule.condition.regexFilter, 'i');
    expect(re.test('https://www.youtube.com/shorts/abc')).toBe(true);
    expect(re.test('https://www.youtube.com/shorts?x=1')).toBe(true);
    expect(re.test('https://www.youtube.com/watch?v=1')).toBe(false);
    expect(re.test('https://www.youtube.com/shortsfoo')).toBe(false);
  });
  test('inactive => no rules', () => {
    const e = { id: 'a', ...C.parseEntry('reddit.com', 'domain') };
    expect(C.buildRules({ entries: [e], isPro: true, active: false, blockedPageUrl: 'x', hasAccess: () => true })).toEqual([]);
  });
});

test.describe('stats, import/export, strict helpers', () => {
  test('stats accumulate and summarize', () => {
    const now = Date.now();
    let s = C.recordBlock(null, 'reddit.com', now);
    s = C.recordBlock(s, 'reddit.com', now);
    s = C.recordBlock(s, 'x.com', now - 24 * 3600e3);
    const sum = C.summarizeStats(s, now, 7);
    expect(sum.today).toBe(2);
    expect(sum.total).toBe(3);
    expect(sum.bySite['reddit.com']).toBe(2);
    // only real counts: no estimated minutes
    expect(sum).not.toHaveProperty('minutesSaved');
    expect(sum).not.toHaveProperty('todayMinutesSaved');
    expect(C).not.toHaveProperty('MINUTES_SAVED_PER_BLOCK');
  });
  test('export/import round-trip drops invalid rows', () => {
    const settings = {
      ...C.DEFAULT_SETTINGS,
      entries: [{ id: '1', ...C.parseEntry('reddit.com', 'domain') }, { id: '2', ...C.parseEntry('youtube.com/shorts', 'path') }],
      blockMessage: 'Back to work',
    };
    const out = C.exportSettings(settings);
    out.settings.entries.push({ type: 'domain', host: '%%%bad' });
    const back = C.validateImport(JSON.parse(JSON.stringify(out)), C.DEFAULT_SETTINGS);
    expect(back.entries.map((e) => e.label)).toEqual(['reddit.com', 'youtube.com/shorts']);
    expect(back.blockMessage).toBe('Back to work');
    expect(() => C.validateImport({ foo: 1 })).toThrow();
  });
  test('strict unlock phases', () => {
    const now = Date.now();
    expect(C.strictUnlockState({ active: false }, now).phase).toBe('inactive');
    expect(C.strictUnlockState({ active: true }, now).phase).toBe('locked');
    expect(C.strictUnlockState({ active: true, unlockRequestedAt: now - 60e3 }, now).phase).toBe('waiting');
    expect(C.strictUnlockState({ active: true, unlockRequestedAt: now - 10 * 60e3 }, now).phase).toBe('challenge');
    expect(C.makeChallenge().split(' ')).toHaveLength(8);
  });
});

test.describe('strict mode clock', () => {
  test('pauses while FocusFence was not running', () => {
    const now = Date.now();
    const strict = { active: true, startedAt: now - 60 * 60e3, endsAt: now + 30 * 60e3, heartbeatAt: now - 40 * 60e3 };
    const { strict: next, pausedMs } = C.applyStrictHeartbeat(strict, now);
    expect(pausedMs).toBe(39 * 60e3);
    expect(next.endsAt).toBe(strict.endsAt + 39 * 60e3);
    expect(next.heartbeatAt).toBe(now);
  });
  test('normal ticks do not move the end time; untimed sessions are untouched', () => {
    const now = Date.now();
    const t = C.applyStrictHeartbeat({ active: true, endsAt: now + 1e6, heartbeatAt: now - 60e3 }, now);
    expect(t.pausedMs).toBe(0);
    const u = C.applyStrictHeartbeat({ active: true, endsAt: null, heartbeatAt: now - 3600e3 }, now);
    expect(u.strict.endsAt).toBeNull();
  });
});

test.describe('review edge cases', () => {
  test('host access via a parent domain counts', () => {
    expect(C.hostCovered('old.reddit.com', ['*://*.reddit.com/*'])).toBe(true);
    expect(C.hostCovered('reddit.com', ['*://*.reddit.com/*'])).toBe(true);
    expect(C.hostCovered('reddit.com', ['*://*.old.reddit.com/*'])).toBe(false);
    expect(C.hostCovered('notreddit.com', ['*://*.reddit.com/*'])).toBe(false);
    expect(C.hostCovered('a.b', ['*://*/*'])).toBe(true);
  });
  test('schedule boundaries: end is exclusive, 24:00 and week wrap-around work', () => {
    const d = (day, h, m) => new Date(2026, 10, 15 + day, h, m); // day 0 = Sunday
    expect(C.isWithinSchedule([{ days: [1], start: '09:00', end: '17:00' }], d(1, 16, 59))).toBe(true);
    expect(C.isWithinSchedule([{ days: [1], start: '09:00', end: '17:00' }], d(1, 17, 0))).toBe(false);
    expect(C.isWithinSchedule([{ days: [1], start: '20:00', end: '24:00' }], d(1, 23, 59))).toBe(true);
    // Saturday 22:00 -> Sunday 02:00 (week wraps from day 6 to day 0)
    expect(C.isWithinSchedule([{ days: [6], start: '22:00', end: '02:00' }], d(0, 1, 0))).toBe(true);
    expect(C.validateWindow({ days: [1], start: '25:00', end: '10:00' })).toBeTruthy();
    expect(C.validateWindow({ days: [1], start: 9, end: '10:00' })).toBeTruthy();
    expect(C.cleanDays([3, 3, 'x', 9, 1])).toEqual([1, 3]);
  });
  test('7-day stats never skip or repeat a day across DST changes', () => {
    const prev = process.env.TZ;
    process.env.TZ = 'Europe/Paris';
    try {
      // 2026-10-25 is the autumn DST change in Europe (25-hour day)
      for (const t of [new Date(2026, 9, 25, 23, 30), new Date(2026, 9, 26, 0, 30), new Date(2026, 2, 29, 23, 30)]) {
        const days = C.summarizeStats({ days: {} }, t.getTime(), 7).byDay.map((x) => x.day);
        expect(new Set(days).size).toBe(7);
        expect(days[6]).toBe(C.dayKey(t));
      }
    } finally {
      process.env.TZ = prev;
    }
  });
  test('path rules reject query strings and very long paths', () => {
    expect(() => C.parseEntry('youtube.com/watch?v=abc', 'path')).toThrow(/path only/);
    expect(() => C.parseEntry('example.com/' + 'a'.repeat(600), 'path')).toThrow(/too long/);
  });
  test('keyword with a space matches %20, + and -', () => {
    const e = { id: 'k', ...C.parseEntry('online poker', 'keyword') };
    const [rule] = C.buildRules({ entries: [e], isPro: true, active: true, blockedPageUrl: 'x', hasAccess: () => true });
    const re = new RegExp(rule.condition.regexFilter, 'i');
    for (const u of ['https://a.b/online%20poker', 'https://a.b/?q=online+poker', 'https://a.b/online-poker']) expect(re.test(u), u).toBe(true);
  });
  test('Pomodoro replay', () => {
    const now = Date.now();
    const p = { phase: 'focus', cycle: 1, totalCycles: 2, focusMin: 25, breakMin: 5, endsAt: now - 6 * 60e3 };
    // focus ended 6 min ago -> 5-min break also over -> round 2 focus, 1 min in
    const r = C.advancePomodoroTo(p, now);
    expect(r).toMatchObject({ phase: 'focus', cycle: 2 });
    expect(r.endsAt).toBe(p.endsAt + 5 * 60e3 + 25 * 60e3);
    expect(C.advancePomodoroTo({ ...p, cycle: 2 }, now)).toBeNull();
  });
});
