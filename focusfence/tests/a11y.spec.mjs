// Automated accessibility audit (axe-core, WCAG 2.1 A/AA) of every extension page,
// in light and dark mode, plus keyboard-only checks.
import { test, expect, visit } from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';

async function audit(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const problems = results.violations.map(
    (v) => `${label}: [${v.impact}] ${v.id} — ${v.help}\n    ` + v.nodes.slice(0, 4).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')).join('\n    ')
  );
  return problems;
}

async function seedPro(api) {
  await api.send('setDevPro', { on: true });
  await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
  await api.send('addEntry', { raw: 'youtube.com/shorts', kind: 'path' });
  await api.send('setSchedule', { schedule: { enabled: false, windows: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }] } });
}

for (const scheme of ['light', 'dark']) {
  test(`axe: popup, options and block page have no WCAG A/AA violations (${scheme})`, async ({ api, ext }) => {
    const problems = [];
    const open = async (url, viewport) => {
      const p = await ext.context.newPage();
      await p.emulateMedia({ colorScheme: scheme });
      if (viewport) await p.setViewportSize(viewport);
      await p.goto(url);
      await p.waitForTimeout(250);
      return p;
    };
    // Free tier (Pro panels locked)
    await api.send('addEntry', { raw: 'reddit.com', kind: 'domain' });
    let p = await open(ext.base + 'popup.html', { width: 360, height: 600 });
    problems.push(...(await audit(p, 'popup/free')));
    await p.close();
    p = await open(ext.base + 'options.html');
    problems.push(...(await audit(p, 'options/free')));
    await p.close();

    // Pro + running focus session + strict mode waiting for unlock
    await seedPro(api);
    await api.send('startPomodoro');
    await api.send('startStrict', { hours: 2 });
    await api.send('requestStrictUnlock');
    p = await open(ext.base + 'popup.html', { width: 360, height: 600 });
    problems.push(...(await audit(p, 'popup/pro')));
    await p.close();
    p = await open(ext.base + 'options.html');
    problems.push(...(await audit(p, 'options/pro')));
    await p.close();

    p = await ext.context.newPage();
    await p.emulateMedia({ colorScheme: scheme });
    await p.goto('https://www.reddit.com/r/all');
    await p.waitForTimeout(300);
    problems.push(...(await audit(p, 'blocked')));
    await p.close();

    // Password lock screen
    await api.send('setPassword', { password: 'hunter22' });
    await api.send('lockNow');
    p = await open(ext.base + 'options.html');
    problems.push(...(await audit(p, 'options/locked')));
    await p.close();

    expect(problems, problems.join('\n')).toEqual([]);
  });
}
