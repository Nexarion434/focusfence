// FocusFence website: the only script (deferred, ~2 KB, no dependencies).
// 1. Remembers an explicit language choice from the switcher.
// 2. Theme toggle (light / dark / system). The choice is applied before the first
//    paint by a small inline script in <head>; this file wires the toggle.
// 3. Shows the header hairline once the page scrolls.
// 4. Subtle motion: blocks fade up once as they enter the viewport, and cards get
//    a soft light under the pointer. Nothing is hidden without this script, and
//    all motion is skipped under prefers-reduced-motion.
// No layout is read at startup, so the first render is never held up.
(function () {
  'use strict';
  var root = document.documentElement;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-set-lang]');
    if (a) {
      try {
        localStorage.setItem('__LANG_KEY__', a.getAttribute('data-set-lang'));
      } catch (err) {}
    }
  });

  // ---- theme
  var COLORS = { dark: '__THEME_DARK__', light: '__THEME_LIGHT__' };
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  var radios = document.querySelectorAll('.theme input[name="theme"]');
  function applyTheme(pref) {
    if (pref !== 'light' && pref !== 'dark') pref = 'system';
    root.setAttribute('data-theme-pref', pref);
    if (pref === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', pref);
    for (var i = 0; i < metas.length; i++) {
      var dark = /dark/.test(metas[i].getAttribute('media') || '');
      metas[i].setAttribute('content', pref === 'system' ? COLORS[dark ? 'dark' : 'light'] : COLORS[pref]);
    }
    for (var j = 0; j < radios.length; j++) radios[j].checked = radios[j].value === pref;
  }
  // The inline <head> script already applied the theme: only sync the radios (no attribute writes).
  var current = root.getAttribute('data-theme-pref') || 'system';
  for (var c = 0; c < radios.length; c++) radios[c].checked = radios[c].value === current;
  function resolved(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  // A visitor's switch: fetch the other theme's on-screen captures first (they are lazy and
  // hidden), so the new theme appears complete, then cross-fade where supported.
  function switchTheme(pref) {
    root.setAttribute('data-theme-pref', pref); // the toggle reacts at once
    var want = resolved(pref);
    var waits = [];
    if (want !== resolved(root.getAttribute('data-theme') || 'system')) {
      // each capture is an <img> or a <picture> (phone crop), right next to its twin
      var els = document.querySelectorAll(want === 'light' ? '.th-l' : '.th-d');
      for (var i = 0; i < els.length; i++) {
        var twin = want === 'light' ? els[i].previousElementSibling : els[i].nextElementSibling;
        var r = twin && twin.getBoundingClientRect();
        var im = els[i].tagName === 'IMG' ? els[i] : els[i].querySelector('img');
        if (im && r && r.width && r.bottom > -innerHeight / 2 && r.top < innerHeight * 1.5) {
          im.loading = 'eager';
          if (im.decode) waits.push(im.decode().catch(function () {}));
        }
      }
    }
    var done = false;
    function go() {
      if (done) return;
      done = true;
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !reduce)
        document.startViewTransition(function () {
          applyTheme(pref);
        });
      else applyTheme(pref);
    }
    Promise.all(waits).then(go);
    setTimeout(go, 450);
  }
  for (var k = 0; k < radios.length; k++) {
    radios[k].addEventListener('change', function (e) {
      switchTheme(e.target.value);
      try {
        localStorage.setItem('__THEME_KEY__', e.target.value);
      } catch (err) {}
    });
  }
  // another tab changed the theme
  window.addEventListener('storage', function (e) {
    if (e.key === '__THEME_KEY__') applyTheme(e.newValue);
  });

  // Pages open at the top, and a jump to an anchor fires a scroll event.
  var top = document.querySelector('.top');
  if (top) {
    window.addEventListener(
      'scroll',
      function () {
        top.classList.toggle('is-stuck', window.scrollY > 4);
      },
      { passive: true }
    );
  }

  // Motion is set up after load, off the critical path (even the media queries wait).
  function setupMotion() {
    var mq = window.matchMedia;
    if (!mq || mq('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    setupReveal();
    if (mq('(hover: hover) and (pointer: fine)').matches) setupPointerLight();
  }
  if (document.readyState === 'complete') setupMotion();
  else window.addEventListener('load', setupMotion);

  // Reveal on scroll. The observer's first callback reports what is already on screen,
  // so nothing is measured here.
  function setupReveal() {
    // [data-reveal] blocks rise and fade in; [data-rise] is the closing fence, which rises itself
    var items = [].slice.call(document.querySelectorAll('[data-reveal], [data-rise]'));
    document.documentElement.classList.add('motion');
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      // The root reaches far above the viewport: a block that skipped past it (fast scroll,
      // jump to an anchor) counts as seen and is revealed too, so nothing stays hidden.
      { rootMargin: '99999px 0px -8% 0px' }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
    window.addEventListener('beforeprint', function () {
      items.forEach(function (el) {
        el.classList.add('in');
      });
    });
  }

  // Pointer light on cards and plans (fine pointers only).
  function setupPointerLight() {
    document.addEventListener(
      'pointermove',
      function (e) {
        var c = e.target.closest && e.target.closest('.card, .plan');
        if (!c) return;
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', e.clientX - r.left + 'px');
        c.style.setProperty('--my', e.clientY - r.top + 'px');
      },
      { passive: true }
    );
  }
})();
