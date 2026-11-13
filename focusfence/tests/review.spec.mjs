// Regression tests for the code/security review: CSP, input validation, edge cases
// of blocking rules and timers, message hardening, password throttling, keyboard use.
import { test, expect, outcome, visit } from './fixtures.mjs';

test.describe('CSP and page errors', () => {
  test('no CSP violations or script errors on any extension page', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    const problems = [];
    const watch = (p) => {
      p.on('console', (m) => {
        if (m.type() === 'error' || /Content Security Policy/i.test(m.text())) problems.push(p.url() + ' :: ' + m.text());
      });
      p.on('pageerror', (e) => problems.push(p.url() + ' :: ' + e.message));
    };
    for (const url of [ext.base + 'popup.html', ext.base + 'options.html']) {
      const p = await ext.context.newPage();
      watch(p);
      await p.goto(url);
      await p.waitForTimeout(400);
      await p.close();
    }
    const blocked = await ext.context.newPage();
    watch(blocked);
    await blocked.goto('https://reddit.com/');
    await blocked.waitForTimeout(400);
    await blocked.close();
    expect(problems).toEqual([]);
    const csp = (await ext.sw.evaluate(() => chrome.runtime.getManifest())).content_security_policy.extension_pages;
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).not.toContain('unsafe');
  });
});

test.describe('input validation & message hardening', () => {
  test('malformed messages get clean errors, never crash the worker', async ({ api }) => {
    expect(await api.send('addEntry', { raw: 42 })).toMatchObject({ ok: false, code: 'INVALID' });
    expect(await api.send('addEntry', { raw: 'x'.repeat(5000) })).toMatchObject({ ok: false, code: 'INVALID' });
    expect(await api.send('addEntry', { raw: 'not a site' })).toMatchObject({ ok: false, code: 'INVALID' });
    await api.send('setDevPro', { on: true });
    expect(await api.send('setSchedule', { schedule: null })).toMatchObject({ ok: false, code: 'INVALID' });
    expect(await api.send('setSchedule', { schedule: { windows: 'nope' } })).toMatchObject({ ok: false, code: 'INVALID' });
    expect(
      await api.send('setSchedule', { schedule: { enabled: true, windows: [{ days: [1, 'x', 9, 1], start: '09:00', end: '10:00' }] } })
    ).toMatchObject({ ok: true });
    expect((await api.send('getState')).settings.schedule.windows[0].days).toEqual([1]);
    expect(await api.send('setPassword', { password: 'x'.repeat(300) })).toMatchObject({ ok: false, code: 'INVALID' });
    // unknown message types are ignored
    expect(await api.send('definitelyNotAHandler')).toBeUndefined();
    // worker still healthy
    expect((await api.send('getState')).ok).toBe(true);
  });

  test('path rules refuse query strings instead of over-blocking', async ({ api }) => {
    await api.send('setDevPro', { on: true });
    const r = await api.send('addEntry', { raw: 'youtube.com/watch?v=abc', kind: 'auto' });
    expect(r).toMatchObject({ ok: false, code: 'INVALID' });
    expect(r.error).toMatch(/path only/);
  });

  test('stats can only be recorded by the block page itself', async ({ api }) => {
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    await api.send('recordBlock', { url: 'https://reddit.com/' }); // from the options page: ignored
    expect((await api.send('getStats', { days: 7 })).summary.total).toBe(0);
  });

  test('SPA reports must match the reporting page origin', async ({ api }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
    // an extension page claiming a youtube URL is not a youtube.com content script
    expect(await api.send('spaNav', { url: 'https://www.youtube.com/shorts/1' })).toEqual({ ok: true });
  });
});

test.describe('blocking rule edge cases', () => {
  test('thousands of blocked domains collapse into one rule and all work', async ({ api, ext }) => {
    await api.page.evaluate(async () => {
      const C = self.FFCore;
      const entries = [];
      for (let i = 0; i < 5000; i++) entries.push({ id: 'd' + i, addedAt: 1, ...C.parseEntry(`site${i}.example`, 'domain') });
      const { settings } = await chrome.storage.local.get('settings');
      await chrome.storage.local.set({ settings: { ...(settings || C.DEFAULT_SETTINGS), entries } });
    });
    await api.send('sync');
    const rules = await ext.sw.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
    expect(rules).toHaveLength(1);
    expect(rules[0].condition.requestDomains).toHaveLength(5000);
    expect(await outcome(ext.context, 'https://www.site4999.example/')).toBe('blocked');
    expect(await outcome(ext.context, 'https://site0.example/x')).toBe('blocked');
  });

  test('path/keyword rules are capped below Chrome’s regex-rule limit and all install', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    const max = await api.page.evaluate(async () => {
      const C = self.FFCore;
      const entries = [];
      for (let i = 0; i < C.MAX_PATTERN_ENTRIES; i++) entries.push({ id: 'p' + i, addedAt: 1, ...C.parseEntry(`video${i}.example/shorts`, 'path') });
      const { settings } = await chrome.storage.local.get('settings');
      await chrome.storage.local.set({ settings: { ...(settings || C.DEFAULT_SETTINGS), entries } });
      return C.MAX_PATTERN_ENTRIES;
    });
    await api.send('sync');
    const rules = await ext.sw.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
    expect(rules).toHaveLength(max);
    expect(await api.send('addEntry', { raw: 'one-more.example/x', kind: 'path' })).toMatchObject({ ok: false, code: 'LIMIT' });
    // plain domains stay unlimited
    expect((await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' })).ok).toBe(true);
    expect(await outcome(ext.context, 'https://video499.example/shorts/1')).toBe('blocked');
  });

  test('regex special characters, spaces and IDN hosts', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    expect((await api.send('addEntry', { raw: 'example.org/a+b(c)', kind: 'path' })).ok).toBe(true);
    expect((await api.send('addEntry', { raw: 'online poker', kind: 'keyword' })).ok).toBe(true);
    const idn = await api.send('addEntry', { raw: 'bücher.example', kind: 'domain' });
    expect(idn.entry.host).toBe('xn--bcher-kva.example');
    expect(await outcome(ext.context, 'https://example.org/a+b(c)/page')).toBe('blocked');
    expect(await outcome(ext.context, 'https://example.org/a+bc')).toBe('reachable');
    expect(await outcome(ext.context, 'https://games.example/search?q=online+poker')).toBe('blocked');
    expect(await outcome(ext.context, 'https://games.example/online%20poker')).toBe('blocked');
    expect(await outcome(ext.context, 'https://xn--bcher-kva.example/')).toBe('blocked');
  });
});

test.describe('timer edge cases', () => {
  test('a stale Pomodoro session is replayed on its own timeline and ends', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('startPomodoro');
    await api.page.evaluate(async () => {
      const { pomodoro } = await chrome.storage.local.get('pomodoro');
      pomodoro.endsAt = Date.now() - 3 * 3600e3; // browser was closed for 3 hours
      await chrome.storage.local.set({ pomodoro });
    });
    await ext.sw.evaluate(() => self.queueSync());
    expect((await api.send('getState')).pomodoro).toBeNull();
    expect(await ext.sw.evaluate(() => chrome.action.getBadgeText({}))).toBe('');
  });

  test('a Pomodoro alarm that fires late keeps the original schedule', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('setPomodoroConfig', { pomodoro: { focusMin: 25, breakMin: 5, cycles: 4 } });
    await api.send('startPomodoro');
    const focusEnd = await api.page.evaluate(async () => {
      const { pomodoro } = await chrome.storage.local.get('pomodoro');
      pomodoro.endsAt = Date.now() - 2 * 60e3; // alarm fired 2 minutes late
      await chrome.storage.local.set({ pomodoro });
      return pomodoro.endsAt;
    });
    await ext.sw.evaluate(() => self.queueSync());
    const p = (await api.send('getState')).pomodoro;
    expect(p).toMatchObject({ phase: 'break', cycle: 1 });
    expect(p.endsAt).toBe(focusEnd + 5 * 60e3); // not "now + 5 min"
  });

  test('invalid strict durations never fall back to "until unlocked"', async ({ api }) => {
    await api.send('setDevPro', { on: true });
    for (const hours of ['abc', -1, 3, 1000, null]) {
      expect(await api.send('startStrict', { hours }), String(hours)).toMatchObject({ ok: false, code: 'INVALID' });
    }
    expect((await api.send('getState')).strict.active).toBe(false);
  });

  test('alarms are registered for running timers', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('startPomodoro');
    await api.send('startStrict', { hours: 1 });
    const names = (await ext.sw.evaluate(() => chrome.alarms.getAll())).map((a) => a.name).sort();
    expect(names).toEqual(['ff-license', 'ff-pomodoro', 'ff-strict-end', 'ff-tick']);
    await api.send('stopPomodoro');
    const after = (await ext.sw.evaluate(() => chrome.alarms.getAll())).map((a) => a.name);
    expect(after).not.toContain('ff-pomodoro');
  });
});

test.describe('password lock throttling', () => {
  test('repeated wrong passwords are throttled', async ({ api }) => {
    await api.send('setDevPro', { on: true });
    await api.send('setPassword', { password: 'hunter22' });
    await api.send('lockNow');
    for (let i = 0; i < 5; i++) expect((await api.send('unlock', { password: 'wrong' })).code).toBe('BAD_PASSWORD');
    const r = await api.send('unlock', { password: 'hunter22' });
    expect(r).toMatchObject({ ok: false, code: 'THROTTLED' });
    // after the wait the right password works again
    await api.page.evaluate(() => chrome.storage.session.set({ unlockBlockedUntil: Date.now() - 1 }));
    expect((await api.send('unlock', { password: 'hunter22' })).ok).toBe(true);
  });
});

test.describe('keyboard-only use', () => {
  test('popup: add a site and toggle blocking with the keyboard', async ({ api, ext }) => {
    const popup = await ext.context.newPage();
    await popup.setViewportSize({ width: 360, height: 600 });
    await popup.goto(ext.base + 'popup.html');
    await popup.locator('#add-input').focus();
    await popup.keyboard.type('reddit.com');
    await popup.keyboard.press('Enter');
    await expect.poll(async () => (await api.send('getState')).settings.entries.length).toBe(1);
    await popup.locator('#toggle-enabled').focus();
    await popup.keyboard.press('Space');
    await expect(popup.locator('#status-title')).toHaveText('Blocking is off');
    await popup.close();
  });

  test('options: Tab reaches every control in order, rule type switches by keyboard', async ({ api, ext }) => {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    // Tab through the sidebar into the add form
    const seen = [];
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim().slice(0, 20)));
    }
    expect(seen).toContain('master-toggle');
    expect(seen).toContain('add-input');
    // Free tier: locked Pro panels are not reachable by keyboard
    const lockedFocusable = await page.evaluate(
      () => [...document.querySelectorAll('#schedule button, #schedule input')].filter((e) => !e.closest('[inert]')).length
    );
    expect(lockedFocusable).toBe(0);
    await page.close();
  });

  test('lock screen is a modal dialog that traps focus', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('setPassword', { password: 'hunter22' });
    await api.send('lockNow');
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    await expect(page.getByRole('dialog', { name: 'Settings are locked' })).toBeVisible();
    await expect(page.locator('#lock-password')).toBeFocused();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement.closest('#lock-overlay') || document.activeElement === document.body)).toBe(true);
    }
    await page.close();
  });

  test('block page "Back to work" leaves the block page even in a fresh tab', async ({ api, ext }) => {
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    const page = await visit(ext.context, 'https://reddit.com/');
    await expect(page).toHaveURL(/blocked\.html/);
    await page.getByRole('button', { name: 'Back to work' }).click();
    await expect(page).not.toHaveURL(/blocked\.html/, { timeout: 5000 });
    await page.close();
  });
});
