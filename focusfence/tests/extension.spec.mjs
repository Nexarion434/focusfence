// End-to-end tests: unpacked FocusFence in headless Chromium with a fake internet proxy.
import { test, expect, outcome, visit, hm } from './fixtures.mjs';
import { launchExtension } from '../scripts/launch.mjs';

const MIN = 60 * 1000;

test.describe('Free tier: domain blocking', () => {
  test('blocks reddit.com and its subdomains, leaves other sites alone', async ({ api, ext }) => {
    const r = await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    expect(r.ok).toBe(true);
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('blocked');
    expect(await outcome(ext.context, 'https://www.reddit.com/r/all')).toBe('blocked');
    expect(await outcome(ext.context, 'https://old.reddit.com/r/programming')).toBe('blocked');
    expect(await outcome(ext.context, 'https://example.com/')).toBe('reachable');
    expect(await outcome(ext.context, 'https://notreddit.com/')).toBe('reachable');
  });

  test('blocking youtube.com covers m.youtube.com', async ({ api, ext }) => {
    await api.send('addEntry', { raw: 'https://www.youtube.com/watch?v=abc', kind: 'domain' });
    expect(await outcome(ext.context, 'https://m.youtube.com/')).toBe('blocked');
    expect(await outcome(ext.context, 'https://youtube.com/feed')).toBe('blocked');
  });

  test('block page shows the site, a message and stats', async ({ api, ext }) => {
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    const page = await visit(ext.context, 'https://old.reddit.com/r/foo');
    expect(page.url()).toContain('/blocked.html#https://old.reddit.com/r/foo');
    await expect(page.locator('#site')).toHaveText('old.reddit.com');
    await expect(page.locator('#message')).not.toBeEmpty();
    await expect(page.locator('#today')).toHaveText('1');
    await expect(page.locator('#saved')).toHaveText('5 min');
    await page.close();
    const stats = await api.send('getStats', { days: 7 });
    expect(stats.summary.bySite['reddit.com']).toBe(1);
  });

  test('popup quick-adds the current tab and the on/off toggle works', async ({ api, ext }) => {
    const site = await visit(ext.context, 'https://news.ycombinator.com/');
    const tabId = await api.page.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      return tabs.find((t) => t.url && t.url.startsWith('https://news.ycombinator.com')).id;
    });
    const popup = await ext.context.newPage();
    await popup.setViewportSize({ width: 360, height: 600 });
    await popup.goto(ext.base + `popup.html?tabId=${tabId}`);
    await expect(popup.locator('#current-host')).toHaveText('news.ycombinator.com');
    await popup.click('#quick-add');
    await expect(popup.locator('#quick-add')).toHaveText('Blocked');
    await expect(site).toHaveURL(/blocked\.html#https:\/\/news\.ycombinator\.com\//);
    expect(await outcome(ext.context, 'https://news.ycombinator.com/item?id=1')).toBe('blocked');

    // toggle off -> reachable, toggle on -> blocked
    await popup.locator('#toggle-enabled').uncheck();
    await expect(popup.locator('#status-title')).toHaveText('Blocking is off');
    expect(await outcome(ext.context, 'https://news.ycombinator.com/')).toBe('reachable');
    await popup.locator('#toggle-enabled').check();
    await expect(popup.locator('#status-title')).toHaveText('Blocking is on');
    expect(await outcome(ext.context, 'https://news.ycombinator.com/')).toBe('blocked');
    await popup.close();
    await site.close();
  });

  test('options page adds and removes sites', async ({ api, ext }) => {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    await page.fill('#add-input', 'x.com');
    await page.click('#add-submit');
    await expect(page.locator('.entry .entry-label')).toHaveText(['x.com']);
    expect(await outcome(ext.context, 'https://x.com/home')).toBe('blocked');
    await page.click('.entry .remove');
    await expect(page.locator('.entry')).toHaveCount(0);
    expect(await outcome(ext.context, 'https://x.com/home')).toBe('reachable');
    await page.close();
  });
});

test.describe('Pro gating (simulated via DEV flag)', () => {
  test('Pro features are rejected on Free and unlocked by Simulate Pro', async ({ api, ext }) => {
    let r = await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
    expect(r).toMatchObject({ ok: false, code: 'PRO_REQUIRED' });
    for (const [type, payload] of [
      ['setSchedule', { schedule: { enabled: true, windows: [] } }],
      ['startPomodoro', {}],
      ['startStrict', { hours: 1 }],
      ['setPassword', { password: 'secret' }],
      ['setBlockMessage', { message: 'hi' }],
      ['exportSettings', {}],
    ]) {
      r = await api.send(type, payload);
      expect(r, type).toMatchObject({ ok: false, code: 'PRO_REQUIRED' });
    }

    // UI shows locked Pro panels
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    await expect(page.locator('#schedule')).toHaveClass(/pro-locked/);
    await expect(page.locator('#dev-panel')).toBeVisible();
    await page.locator('#dev-pro').check();
    await expect(page.locator('#schedule')).not.toHaveClass(/pro-locked/);
    await expect(page.locator('#side-plan-badge')).toHaveText('PRO');

    r = await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
    expect(r.ok).toBe(true);
    r = await api.send('exportSettings');
    expect(r.ok).toBe(true);
    await page.close();
  });

  test('path rules stop applying if Pro lapses', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
    expect(await outcome(ext.context, 'https://www.youtube.com/shorts/abc')).toBe('blocked');
    await api.send('setDevPro', { on: false });
    expect(await outcome(ext.context, 'https://www.youtube.com/shorts/abc')).toBe('reachable');
  });
});

test.describe('Pro: path & keyword blocking', () => {
  test('blocks only youtube.com/shorts; youtube.com stays reachable', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    const r = await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'auto' });
    expect(r.entry).toMatchObject({ type: 'path', host: 'youtube.com', path: '/shorts' });

    expect(await outcome(ext.context, 'https://www.youtube.com/shorts/abc123')).toBe('blocked');
    expect(await outcome(ext.context, 'https://youtube.com/shorts')).toBe('blocked');
    expect(await outcome(ext.context, 'https://m.youtube.com/shorts/xyz?feature=share')).toBe('blocked');
    expect(await outcome(ext.context, 'https://www.youtube.com/')).toBe('reachable');
    expect(await outcome(ext.context, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('reachable');
    expect(await outcome(ext.context, 'https://www.youtube.com/shortsfan')).toBe('reachable');
  });

  test('in-app (SPA) navigation to /shorts is caught too', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
    const page = await visit(ext.context, 'https://www.youtube.com/');
    await expect(page.locator('#origin')).toHaveText('origin:www.youtube.com/');
    await page.click('#spa-shorts');
    await expect(page).toHaveURL(/blocked\.html#https:\/\/www\.youtube\.com\/shorts\/abc123/, { timeout: 5000 });
    await page.close();
  });

  test('keyword rules match anywhere in the URL', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'poker', kind: 'keyword' });
    expect(await outcome(ext.context, 'https://games.example.com/online-poker-rooms')).toBe('blocked');
    expect(await outcome(ext.context, 'https://games.example.com/chess')).toBe('reachable');
  });
});

test.describe('Pro: schedules', () => {
  const windowAround = (offsetStartMin, offsetEndMin) => {
    const now = Date.now();
    return {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: hm(new Date(now + offsetStartMin * MIN)),
      end: hm(new Date(now + offsetEndMin * MIN)),
    };
  };

  test('blocks inside the window, pauses outside, and ignores the schedule when disabled', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });

    // window covering now -> blocked
    let r = await api.send('setSchedule', { schedule: { enabled: true, windows: [windowAround(-60, 60)] } });
    expect(r.ok).toBe(true);
    expect((await api.send('getState')).status.reason).toBe('schedule');
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('blocked');

    // window later today -> paused
    await api.send('setSchedule', { schedule: { enabled: true, windows: [windowAround(120, 180)] } });
    expect((await api.send('getState')).status.reason).toBe('outside-schedule');
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('reachable');

    // schedule switched off -> always on again
    await api.send('setSchedule', { schedule: { enabled: false, windows: [windowAround(120, 180)] } });
    expect((await api.send('getState')).status.reason).toBe('on');
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('blocked');
  });

  test('schedule can be toggled from the options UI', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html#schedule');
    await page.locator('#schedule-toggle').check();
    await expect(page.locator('.window')).toHaveCount(1);
    const s = (await api.send('getState')).settings.schedule;
    expect(s.enabled).toBe(true);
    expect(s.windows[0]).toMatchObject({ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' });
    await page.locator('#schedule-toggle').uncheck();
    await expect.poll(async () => (await api.send('getState')).settings.schedule.enabled).toBe(false);
    await page.close();
  });

  test('invalid windows are rejected', async ({ api }) => {
    await api.send('setDevPro', { on: true });
    const r = await api.send('setSchedule', { schedule: { enabled: true, windows: [{ days: [], start: '09:00', end: '10:00' }] } });
    expect(r).toMatchObject({ ok: false, code: 'INVALID' });
  });
});

test.describe('Pro: strict mode', () => {
  test('cannot be disabled; unlock needs 10 minutes plus a typing challenge', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    const { entry } = await api.send('addEntry', { raw: 'x.com', kind: 'domain' });
    // a schedule that would currently be paused must not weaken strict mode
    await api.send('setSchedule', {
      schedule: { enabled: true, windows: [{ days: [0, 1, 2, 3, 4, 5, 6], start: hm(new Date(Date.now() + 120 * MIN)), end: hm(new Date(Date.now() + 180 * MIN)) }] },
    });
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('reachable');

    expect((await api.send('startStrict', { hours: 0 })).ok).toBe(true);
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('blocked');

    // every escape hatch is closed
    expect(await api.send('setEnabled', { enabled: false })).toMatchObject({ ok: false, code: 'STRICT' });
    expect(await api.send('removeEntry', { id: entry.id })).toMatchObject({ ok: false, code: 'STRICT' });
    expect(await api.send('setSchedule', { schedule: { enabled: false, windows: [] } })).toMatchObject({ ok: false, code: 'STRICT' });
    expect(await api.send('importSettings', { data: '{}' })).toMatchObject({ ok: false, code: 'STRICT' });
    // adding is still allowed
    expect((await api.send('addEntry', { raw: 'tiktok.com', kind: 'domain' })).ok).toBe(true);

    // popup reflects strict mode
    const popup = await ext.context.newPage();
    await popup.goto(ext.base + 'popup.html');
    await expect(popup.locator('#status-title')).toHaveText('Strict mode');
    await expect(popup.locator('#toggle-enabled')).toBeDisabled();
    await popup.close();

    // unlock flow
    expect((await api.send('requestStrictUnlock')).unlock.phase).toBe('waiting');
    expect(await api.send('completeStrictUnlock', { typed: 'anything' })).toMatchObject({ ok: false, code: 'STRICT_WAIT' });

    // simulate the 10-minute cooling-off elapsing
    await api.page.evaluate(async () => {
      const { strict } = await chrome.storage.local.get('strict');
      strict.unlockRequestedAt = Date.now() - 11 * 60 * 1000;
      await chrome.storage.local.set({ strict });
    });
    const st = await api.send('getState');
    expect(st.strict.unlock.phase).toBe('challenge');
    const phrase = st.strict.unlock.challenge;
    expect(phrase.split(' ')).toHaveLength(8);
    expect(await api.send('completeStrictUnlock', { typed: phrase.toUpperCase() })).toMatchObject({ ok: false, code: 'CHALLENGE' });

    // complete it through the UI by typing (paste is blocked)
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html#strict');
    await expect(page.locator('#strict-phrase')).toHaveText(phrase);
    await page.locator('#strict-typed').pressSequentially(phrase, { delay: 2 });
    await page.click('#strict-challenge button[type=submit]');
    await expect(page.locator('#strict-off')).toBeVisible();
    await page.close();

    expect((await api.send('getState')).strict.active).toBe(false);
    expect((await api.send('setEnabled', { enabled: false })).ok).toBe(true);
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('reachable');
  });

  test('timed strict mode ends by itself', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    await api.send('startStrict', { hours: 1 });
    expect(await api.send('setEnabled', { enabled: false })).toMatchObject({ ok: false, code: 'STRICT' });
    // fast-forward: pretend the hour is over, then let the worker resync (as the alarm would)
    await api.page.evaluate(async () => {
      const { strict } = await chrome.storage.local.get('strict');
      strict.endsAt = Date.now() - 1000;
      await chrome.storage.local.set({ strict });
    });
    await ext.sw.evaluate(() => self.queueSync());
    expect((await api.send('getState')).strict.active).toBe(false);
    expect((await api.send('setEnabled', { enabled: false })).ok).toBe(true);
  });
});

test.describe('Strict mode bypass mitigations', () => {
  test('timed strict mode pauses while the extension was not running', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('startStrict', { hours: 1 });
    // pretend the worker was gone (extension disabled) for 45 minutes with 5 minutes left
    const before = await api.page.evaluate(async () => {
      const { strict } = await chrome.storage.local.get('strict');
      strict.heartbeatAt = Date.now() - 45 * 60e3;
      strict.endsAt = Date.now() + 5 * 60e3;
      await chrome.storage.local.set({ strict });
      return strict.endsAt;
    });
    await ext.sw.evaluate(() => self.queueSync());
    const st = await api.send('getState');
    expect(st.strict.active).toBe(true);
    expect(st.strict.endsAt - before).toBeGreaterThan(43 * 60e3);
    expect(st.strict.pausedMs).toBeGreaterThan(43 * 60e3);
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html#strict');
    await expect(page.locator('#strict-paused')).toContainText('Paused for 44 min');
    await page.close();
  });

  test('warns when FocusFence is not allowed in Incognito', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html#strict');
    await expect(page.locator('#incognito-warning')).toBeVisible();
    await expect(page.locator('details.limits summary')).toHaveText("What strict mode can't prevent");
    await page.close();

    const popup = await ext.context.newPage();
    await popup.goto(ext.base + 'popup.html');
    await expect(popup.locator('#incognito-note')).toBeHidden();
    await api.send('startStrict', { hours: 0 });
    await popup.reload();
    await expect(popup.locator('#incognito-note')).toBeVisible();
    await popup.close();
  });
});

test.describe('Licensing', () => {
  test('options page links license, notices and source', async ({ ext }) => {
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html#plan');
    await expect(page.locator('#source-link')).toHaveAttribute('href', /^https:\/\/github\.com\//);
    const [lic, notices] = await page.evaluate(() =>
      Promise.all(['LICENSE', 'THIRD_PARTY_NOTICES.txt'].map((f) => fetch(f).then((r) => r.text())))
    );
    expect(lic).toContain('GNU AFFERO GENERAL PUBLIC LICENSE');
    expect(notices).toContain('ExtPay');
    await page.close();
  });
});

test.describe('Pro: focus sessions, password lock, block message, backup', () => {
  test('a focus session blocks even while blocking is switched off', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    await api.send('setEnabled', { enabled: false });
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('reachable');

    await api.send('setPomodoroConfig', { pomodoro: { focusMin: 25, breakMin: 5, cycles: 2 } });
    expect((await api.send('startPomodoro')).pomodoro.phase).toBe('focus');
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('blocked');
    const badge = await ext.sw.evaluate(() => chrome.action.getBadgeText({}));
    expect(badge).toMatch(/^\d+m$/);

    // focus ends -> break (blocking follows the normal on/off state again)
    await api.page.evaluate(async () => {
      const { pomodoro } = await chrome.storage.local.get('pomodoro');
      pomodoro.endsAt = Date.now() - 1000;
      await chrome.storage.local.set({ pomodoro });
    });
    await ext.sw.evaluate(() => self.queueSync());
    const st = await api.send('getState');
    expect(st.pomodoro).toMatchObject({ phase: 'break', cycle: 1 });
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('reachable');

    await api.send('stopPomodoro');
    expect((await api.send('getState')).pomodoro).toBeNull();
  });

  test('password lock protects settings', async ({ api }) => {
    await api.send('setDevPro', { on: true });
    const { entry } = await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    expect((await api.send('setPassword', { password: 'hunter22' })).ok).toBe(true);
    await api.send('lockNow');
    expect((await api.send('getState')).locked).toBe(true);
    expect(await api.send('setEnabled', { enabled: false })).toMatchObject({ ok: false, code: 'LOCKED' });
    expect(await api.send('removeEntry', { id: entry.id })).toMatchObject({ ok: false, code: 'LOCKED' });
    // adding sites (stricter) is always allowed
    expect((await api.send('addEntry', { raw: 'x.com' })).ok).toBe(true);
    expect(await api.send('unlock', { password: 'nope' })).toMatchObject({ ok: false, code: 'BAD_PASSWORD' });
    expect((await api.send('unlock', { password: 'hunter22' })).ok).toBe(true);
    expect((await api.send('setEnabled', { enabled: false })).ok).toBe(true);
    // the stored secret is a salted hash, never the password
    const stored = await api.page.evaluate(() => chrome.storage.local.get('lock'));
    expect(JSON.stringify(stored)).not.toContain('hunter22');
    expect(stored.lock.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('options page shows the lock screen when locked', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('setPassword', { password: 'hunter22' });
    await api.send('lockNow');
    const page = await ext.context.newPage();
    await page.goto(ext.base + 'options.html');
    await expect(page.locator('#lock-overlay')).toBeVisible();
    await page.fill('#lock-password', 'hunter22');
    await page.press('#lock-password', 'Enter');
    await expect(page.locator('#lock-overlay')).toBeHidden();
    await page.close();
  });

  test('custom block page message', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    await api.send('setBlockMessage', { message: 'Thesis chapter first.' });
    const page = await visit(ext.context, 'https://reddit.com/');
    await expect(page.locator('#message')).toHaveText('Thesis chapter first.');
    await page.close();
  });

  test('export and import settings as JSON', async ({ api, ext }) => {
    await api.send('setDevPro', { on: true });
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
    const { data } = await api.send('exportSettings');
    expect(data.app).toBe('FocusFence');
    expect(data.settings.entries).toHaveLength(2);
    expect(JSON.stringify(data)).not.toMatch(/hash|salt|stats/);

    // wipe the list, then import it back
    const st = await api.send('getState');
    for (const e of st.settings.entries) await api.send('removeEntry', { id: e.id });
    expect((await api.send('getState')).settings.entries).toHaveLength(0);
    const r = await api.send('importSettings', { data: JSON.stringify(data) });
    expect(r).toMatchObject({ ok: true, count: 2 });
    expect(await outcome(ext.context, 'https://www.youtube.com/shorts/1')).toBe('blocked');
    expect(await outcome(ext.context, 'https://reddit.com/')).toBe('blocked');
    expect(await api.send('importSettings', { data: 'not json' })).toMatchObject({ ok: false, code: 'INVALID' });
  });
});

test.describe('without host access (real manifest, permission not yet granted)', () => {
  test('falls back to a plain block instead of the block page', async ({ net }) => {
    const ext = await launchExtension({ grantAll: false, proxyPort: net.port });
    try {
      const page = await ext.context.newPage();
      await page.goto(ext.base + 'options.html');
      await page.evaluate(() => chrome.runtime.sendMessage({ type: 'addEntry', raw: 'reddit.com' }));
      const st = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'getState' }));
      expect(st.settings.entries).toHaveLength(1);
      expect(Object.values(st.access)).toEqual([false]);
      const rules = await ext.sw.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
      expect(rules.map((r) => r.action.type)).toEqual(['block']);
      expect(await outcome(ext.context, 'https://old.reddit.com/')).toBe('blocked-error-page');
      await expect(page.locator('#access-banner')).toBeVisible();
      // manifest asks for no host access up-front
      const mf = await ext.sw.evaluate(() => chrome.runtime.getManifest());
      expect(mf.host_permissions).toBeUndefined();
      expect(mf.optional_host_permissions).toEqual(['*://*/*']);
    } finally {
      await ext.close();
    }
  });
});
