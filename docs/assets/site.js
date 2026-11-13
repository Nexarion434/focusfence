// FocusFence website: the only script (deferred, ~1 KB, no dependencies).
// 1. Remembers an explicit language choice from the switcher.
// 2. Shows the header hairline once the page scrolls.
// 3. Subtle motion: blocks fade up once as they enter the viewport, and cards get
//    a soft light under the pointer. Nothing is hidden without this script, and
//    all motion is skipped under prefers-reduced-motion.
// No layout is read at startup, so the first render is never held up.
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-set-lang]');
    if (a) {
      try {
        localStorage.setItem('ff-lang', a.getAttribute('data-set-lang'));
      } catch (err) {}
    }
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

  var mq = window.matchMedia;
  if (!mq || mq('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  // Reveal on scroll, set up after load (off the critical path). The observer's
  // first callback reports what is already on screen, so nothing is measured here.
  function setupReveal() {
    var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
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
      { rootMargin: '0px 0px -8% 0px' }
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
  if (document.readyState === 'complete') setupReveal();
  else window.addEventListener('load', setupReveal);

  // Pointer light on cards and plans (fine pointers only).
  if (mq('(hover: hover) and (pointer: fine)').matches) {
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
