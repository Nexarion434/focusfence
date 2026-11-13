// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 FocusFence contributors. See LICENSE and THIRD_PARTY_NOTICES.txt.
/*
 * FocusFence SPA guard. Registered only on hosts that have a path rule
 * (e.g. youtube.com/shorts) and only after the user granted access to that host.
 * Single-page apps change the URL without a real navigation, which
 * declarativeNetRequest cannot see. This script only reports URL changes of the
 * current tab to the FocusFence service worker; it never reads page content.
 */
(() => {
  let last = location.href;
  let timer = 0;
  function stop() {
    clearInterval(timer);
    removeEventListener('popstate', check);
  }
  function check() {
    // The extension was updated or removed: this orphaned script must go quiet.
    if (!chrome.runtime || !chrome.runtime.id) return stop();
    if (location.href === last) return;
    last = location.href;
    try {
      chrome.runtime.sendMessage({ type: 'spaNav', url: last }).then(
        (r) => {
          if (r && r.ok && r.redirect) location.replace(r.redirect);
        },
        () => {}
      );
    } catch (e) {
      stop(); // "Extension context invalidated"
    }
  }
  timer = setInterval(check, 400);
  addEventListener('popstate', check);
  if (window.navigation) window.navigation.addEventListener('navigatesuccess', check);
})();
