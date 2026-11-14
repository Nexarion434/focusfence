// First-run onboarding: pick up to 3 sites, private browsing, Free vs Pro.
import { test, expect, outcome } from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';

const axe = async (page) =>
  (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`
  );

test('pick 3 sites, learn about Incognito and Pro, then land in Settings', async ({ api, ext }) => {
  const page = await ext.context.newPage();
  await page.goto(ext.base + 'onboarding.html');
  await expect(page.getByRole('heading', { level: 1, name: 'Pick 3 sites that steal your focus' })).toBeVisible();
  await expect(page.locator('#step-label')).toHaveText('Step 1 of 3');
  await expect(page.locator('#block-selected')).toBeDisabled();
  expect(await axe(page)).toEqual([]);

  for (const host of ['reddit.com', 'youtube.com', 'x.com']) await page.locator(`.choice[data-host="${host}"]`).click();
  await expect(page.locator('#counter')).toHaveText('3 of 3 selected');
  // a 4th pick is refused with a friendly note
  await page.locator('.choice[data-host="tiktok.com"]').click();
  await expect(page.locator('#max-note')).toBeVisible();
  await expect(page.locator('.choice[data-host="tiktok.com"]')).toHaveAttribute('aria-pressed', 'false');
  // unselect one, add a custom site instead
  await page.locator('.choice[data-host="x.com"]').click();
  await page.fill('#custom-input', 'https://www.Twitch.tv/directory');
  await page.press('#custom-input', 'Enter');
  await expect(page.locator('.choice[data-host="twitch.tv"]')).toHaveAttribute('aria-pressed', 'true');

  await page.click('#block-selected');
  await expect(page.locator('#step-2')).toBeVisible();
  await expect(page.locator('#step-label')).toHaveText('Step 2 of 3');
  const st = await api.send('getState');
  expect(st.settings.entries.map((e) => e.host).sort()).toEqual(['reddit.com', 'twitch.tv', 'youtube.com']);
  expect(await outcome(ext.context, 'https://www.twitch.tv/')).toBe('blocked');

  // headless Chromium: extension not allowed in Incognito -> warning state
  await expect(page.locator('#incognito-status')).not.toHaveClass(/ok/);
  await expect(page.locator('#incognito-status-text')).toHaveText('FocusFence is not allowed in Incognito yet.');
  expect(await axe(page)).toEqual([]);
  await page.click('#next-2');

  await expect(page.locator('#step-3')).toBeVisible();
  await expect(page.locator('#pro-price')).toHaveText('$2.99/month or $19.99/year. No account needed.');
  expect(await axe(page)).toEqual([]);
  await page.click('#finish');
  await expect(page).toHaveURL(/options\.html#blocklist/);
  await page.close();
});

test('onboarding is fully keyboard-operable and can be skipped', async ({ api, ext }) => {
  const page = await ext.context.newPage();
  await page.goto(ext.base + 'onboarding.html');
  await page.locator('.choice[data-host="reddit.com"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice[data-host="reddit.com"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.choice[data-host="reddit.com"]')).toBeFocused();
  await page.locator('#skip-1').focus();
  await page.keyboard.press('Enter');
  // skipping adds nothing; focus moves to the new step heading
  await expect(page.locator('#ob2-title')).toBeFocused();
  expect((await api.send('getState')).settings.entries).toHaveLength(0);
  await page.locator('#back-2').click();
  await expect(page.locator('#step-1')).toBeVisible();
  await page.close();
});

