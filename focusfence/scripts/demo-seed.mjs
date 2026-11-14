// The demo state shown in every product image: the website captures (scripts/screenshots.mjs)
// and the Chrome Web Store screenshots (scripts/store-assets.mjs) start from the same blocklist,
// schedule and week of stats, so the site and the store show the same extension.
// `send` posts a message to the extension's service worker; `page` is an extension page.

/** Six rules (four websites, a path, a keyword), two weekday time ranges (off), seven days of stats. */
export async function seed(send, page) {
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
  });
  await send('setDevPro', { on: true });
  for (const [raw, kind] of [
    ['poker', 'keyword'],
    ['news.ycombinator.com', 'domain'],
    ['facebook.com', 'domain'],
    ['x.com', 'domain'],
    ['youtube.com/shorts', 'path'],
    ['reddit.com', 'domain'],
  ]) {
    await send('addEntry', { raw, kind });
  }
  await send('setSchedule', {
    schedule: {
      enabled: false,
      windows: [
        { days: [1, 2, 3, 4, 5], start: '09:00', end: '12:30' },
        { days: [1, 2, 3, 4, 5], start: '13:30', end: '18:00' },
      ],
    },
  });
  await send('setBlockMessage', { message: '' });
  // realistic-looking local stats for the last 7 days
  await page.evaluate(async () => {
    const C = self.FFCore;
    const days = {};
    const pattern = [
      { 'reddit.com': 9, 'x.com': 6, 'youtube.com/shorts': 7, 'news.ycombinator.com': 3 },
      { 'reddit.com': 7, 'x.com': 5, 'youtube.com/shorts': 4, 'facebook.com': 2 },
      { 'reddit.com': 6, 'x.com': 3, 'youtube.com/shorts': 5, 'news.ycombinator.com': 2 },
      { 'reddit.com': 5, 'x.com': 4, 'youtube.com/shorts': 2 },
      { 'reddit.com': 3, 'x.com': 2, 'youtube.com/shorts': 3, 'news.ycombinator.com': 1 },
      { 'reddit.com': 2, 'x.com': 2, 'youtube.com/shorts': 1 },
      { 'reddit.com': 2, 'x.com': 1, 'youtube.com/shorts': 1 },
    ];
    pattern.forEach((p, i) => {
      days[C.dayKey(Date.now() - (6 - i) * 864e5)] = p;
    });
    await chrome.storage.local.set({ stats: { days } });
  });
}
