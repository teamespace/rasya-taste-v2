/*
  rasya-taste-v4 scroll.js - the scroll half of the motion stack (references/motion.md, Scroll). Every page loads it:
  Lenis smooth scroll on every page, GSAP 3.13.0 with ScrollTrigger and SplitText for the page's 2-3 scroll moments.
  Load it once, as a plain script (not a module, not deferred) after system.js and motion.js; the page's own scroll
  moments go in one script after it:
    <script src="assets/motion/scroll.js"></script>
    <script>rtMotion.onReady(({ gsap, ScrollTrigger, reduced }) => { if (reduced) return; ... });</script>

  The libraries come from jsDelivr at exact versions with their SRI hashes (the bytes match the verified v3 bootstrap's
  cdnjs copies of GSAP; cdnjs has no Lenis). Never change a version, a host or a hash; never add a second copy.

  The contract (agents and pages code against it; keep it exactly):
    window.rtMotion = { gsap, ScrollTrigger, SplitText, lenis, reduced, onReady(cb) }
      gsap, ScrollTrigger, SplitText, lenis: null until the libraries are in, then the live objects (lenis is also
        window.lenis, which the checker reads)
      reduced: true under prefers-reduced-motion (read once, at load)
      onReady(cb): cb(rtMotion) once the libraries are in, or at once when they already are; never when they failed
    document event 'rt:ready' (detail: rtMotion), once, when the libraries are in.

  What it does:
  - Lenis on every page, driven by GSAP's ticker (one clock: the ticker drives Lenis, Lenis drives ScrollTrigger);
    html.lenis is on. Scrubbed tweens use scrub: true and ease: 'none'; never add a second requestAnimationFrame loop
    or scrub lag on top of Lenis.
  - The pins-first safety net: after window load, after every onReady callback, when the fonts are in and when
    system.js or the moments mark the page ready (html data-ready, data-moments-ready), ScrollTrigger.sort() and
    ScrollTrigger.refresh() run once (debounced). A trigger made outside onReady after that is the page's to order:
    consistency.mjs trigger-sort FAILs one that moves more than 120px after a sort and refresh.
  - Reduced motion: Lenis runs without smoothing (the wheel scrolls natively; lenis.stop() and scrollTo still work),
    the callbacks still run (they read rtMotion.reduced and build nothing that moves), and afterwards every
    ScrollTrigger left is killed and its tween reverted, so every moment stands at its still state (the HTML as
    written: content lives in the HTML, script only animates it) and nothing is hidden.
  - In-page links (#id) clicked with a mouse or a finger glide through Lenis; a keyboard activation keeps the
    browser's own jump (it moves the focus start), and data-lenis-native on a link opts it out.
  - Menus and loaders: rtMotion.lenis.stop() while open, .start() after (system.js does it for the phone sheet).
    A panel that scrolls inside the page carries data-lenis-prevent (system.js marks the sheet's .nav__links).
  - Loud failure: a script that fails (404, blocked, bad SRI) or a boot later than 8 s sets
    <html data-rt-scroll="off" data-rt-scroll-error="...">, records the URL in window.__rtMotionFailed and calls
    console.error; nothing is hidden, so the page stands as written. Otherwise data-rt-scroll is "boot", then "on" or
    "reduced". (Not data-motion: that is the hover layer's switch, and data-motion="off" turns it off.)
  - window.motionSelfTest(): libraries and versions, Lenis running, failed loads, trigger counts (references/motion.md,
    The self-test). It exists even when every CDN failed. Without reduced motion it fails a page under 2 scroll
    moments (ScrollTriggers, scrubs, holds or the kit's scroll moments, one a section) and one whose GSAP drives nothing
    (0 ScrollTriggers and 0 onReady callbacks).
  It never tests the user agent and hides nothing with CSS.
*/
(function () {
  'use strict';
  if (window.rtMotion) return; // loaded twice: the first copy runs the page

  var html = document.documentElement;
  var LIBS = [
    { key: 'gsap', src: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js', sri: 'sha384-HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc' },
    { key: 'ScrollTrigger', src: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js', sri: 'sha384-P8VzCVnT9NBUkMrpcIZrJbA7EBjJvh/fJS6PmP+4nLIM284DtsImIv8D0fFjIkeh' },
    { key: 'SplitText', src: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js', sri: 'sha384-xb96EMJeax+NLXMC88ZBa1xAeAW+kn+horHh/zFlbMLG2UPWhMJJSlv7fi57hS+Q' },
    { key: 'Lenis', src: 'https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js', sri: 'sha384-4EgXbGZLDwcPHcRGrHOxm1OvumWUqhr/ts6eapdZnak6ORZAsSE3fMd0niykaSkw' },
  ];
  var VERSIONS = { gsap: '3.13.0', lenis: '1.3.17' };
  var BOOT_MS = 8000;
  var reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var failed = window.__rtMotionFailed = [];
  var queue = [], ready = false, dead = false, loaded = document.readyState === 'complete';
  var counts = { run: 0, threw: 0 };

  var R = window.rtMotion = { gsap: null, ScrollTrigger: null, SplitText: null, lenis: null, reduced: reduced, onReady: onReady };
  html.setAttribute('data-rt-scroll', 'boot');

  // Lenis 1.3.17's own stylesheet (lenis.css, MIT, darkroom.engineering), first in <head> so page CSS can override it
  try {
    var css = document.createElement('style');
    css.setAttribute('data-rt-scroll-css', '');
    css.textContent = 'html.lenis,html.lenis body{height:auto}.lenis:not(.lenis-autoToggle).lenis-stopped{overflow:clip}' +
      '.lenis [data-lenis-prevent],.lenis [data-lenis-prevent-wheel],.lenis [data-lenis-prevent-touch]{overscroll-behavior:contain}' +
      '.lenis.lenis-smooth iframe{pointer-events:none}' +
      '.lenis.lenis-autoToggle{transition-property:overflow;transition-duration:1ms;transition-behavior:allow-discrete}';
    (document.head || html).insertBefore(css, (document.head || html).firstChild);
  } catch (e) { /* no head yet: Lenis still runs */ }

  function fail(msg) {
    if (ready) return;
    dead = true;
    html.setAttribute('data-rt-scroll', 'off');
    html.setAttribute('data-rt-scroll-error', msg);
    console.error('[rt-scroll] OFF: ' + msg);
  }

  // ------------------------------------------------------------ onReady and the pins-first safety net
  function call(cb) {
    counts.run++;
    try { cb(R); } catch (e) { counts.threw++; console.error('[rt-scroll] an onReady callback threw:', e); }
  }
  function onReady(cb) {
    if (typeof cb !== 'function') return;
    // before the libraries (or after a failure, in case they still arrive late) the callback waits in the queue
    if (ready) { call(cb); settle(); } else queue.push(cb);
  }
  var settleTimer = 0;
  function settle() {
    if (!ready) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      var ST = R.ScrollTrigger;
      if (!ST) return;
      try { ST.sort(); ST.refresh(); } catch (e) { console.error('[rt-scroll] ScrollTrigger.sort/refresh threw:', e); }
      if (reduced) still();
    }, 30);
  }
  // reduced motion: no ScrollTrigger survives; each tween goes back to the HTML as written and each pin lets go
  function still() {
    var ST = R.ScrollTrigger;
    if (!ST) return;
    ST.getAll().forEach(function (t) { try { t.kill(true); } catch (e) { /* already gone */ } });
  }

  // ------------------------------------------------------------ in-page links glide through Lenis
  function anchors(lenis) {
    document.addEventListener('click', function (e) {
      // a keyboard activation (detail 0) keeps the browser's jump, which also moves the focus start
      if (e.defaultPrevented || e.button !== 0 || e.detail === 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a || a.hasAttribute('data-lenis-native') || lenis.isStopped) return;
      var id = a.getAttribute('href').slice(1), el = null;
      if (!id) return;
      try { el = document.getElementById(decodeURIComponent(id)); } catch (x) { return; }
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { immediate: reduced });
      if (location.hash !== '#' + id) { try { history.pushState(null, '', '#' + id); } catch (x) { /* file: or sandboxed */ } }
    });
  }

  // ------------------------------------------------------------ boot
  function init() {
    if (ready) return;
    var missing = LIBS.filter(function (l) { return !window[l.key]; }).map(function (l) { return l.key; });
    if (missing.length) { fail('missing ' + missing.join(', ') + ' (a CDN URL 404ed, was blocked or failed its SRI hash)'); return; }
    if (window.gsap.version !== VERSIONS.gsap) console.error('[rt-scroll] GSAP ' + window.gsap.version + ' is loaded: the kit runs ' + VERSIONS.gsap + ' only (a second copy on the page?)');
    if (window.lenisVersion && window.lenisVersion !== VERSIONS.lenis) console.error('[rt-scroll] Lenis ' + window.lenisVersion + ' is loaded: the kit runs ' + VERSIONS.lenis + ' only');
    var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText, lenis;
    try {
      gsap.registerPlugin(ST, Split);
      // one clock: GSAP's ticker drives Lenis, Lenis drives ScrollTrigger (no autoRaf, no second rAF loop)
      lenis = new window.Lenis({ smoothWheel: !reduced, syncTouch: false, lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1.2, autoRaf: false, anchors: false });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } catch (e) { fail('init threw: ' + (e && e.message)); return; }
    R.gsap = gsap; R.ScrollTrigger = ST; R.SplitText = Split; R.lenis = lenis;
    window.lenis = lenis; // the checker, the nav and older scripts read window.lenis
    if (html.getAttribute('data-rt-scroll-error')) console.warn('[rt-scroll] booted late; was: ' + html.getAttribute('data-rt-scroll-error'));
    html.removeAttribute('data-rt-scroll-error');
    html.setAttribute('data-rt-scroll', reduced ? 'reduced' : 'on');
    dead = false;
    ready = true;
    anchors(lenis);
    var q = queue; queue = [];
    q.forEach(call);
    try { document.dispatchEvent(new CustomEvent('rt:ready', { detail: R })); } catch (e) { /* old browser */ }
    if (loaded) settle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    // system.js (data-ready) and the moments (data-moments-ready) change the page's height when they mount
    try {
      new MutationObserver(settle).observe(html, { attributes: true, attributeFilter: ['data-ready', 'data-moments-ready'] });
    } catch (e) { /* no observer */ }
    if (reduced) still();
  }
  if (!loaded) addEventListener('load', function () { loaded = true; setTimeout(settle, 0); }, { once: true });

  // the libraries, in order (async = false keeps their order), each with its SRI hash; one already on the page is kept
  var left = 0;
  LIBS.forEach(function (l) {
    if (window[l.key]) return;
    left++;
    var s = document.createElement('script');
    s.src = l.src;
    s.async = false;
    s.integrity = l.sri;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-rt-scroll-lib', l.key);
    s.onload = function () { if (--left === 0) init(); };
    s.onerror = function () { failed.push(l.src); fail('could not load ' + l.src + ' (404, blocked, offline or a failed SRI hash)'); };
    (document.head || html).appendChild(s);
  });
  if (!left) init();
  setTimeout(function () { if (!ready && !dead) fail('the libraries did not load within ' + BOOT_MS / 1000 + ' s (CDN slow or blocked)'); }, BOOT_MS);

  // ------------------------------------------------------------ the self-test (references/motion.md)
  window.motionSelfTest = function () {
    var L = R.lenis, ST = R.ScrollTrigger || window.ScrollTrigger, all = ST && ST.getAll ? ST.getAll() : [];
    var animated = 0, els = document.querySelectorAll('body *'), i;
    for (i = 0; i < els.length; i++) if (els[i]._gsap) animated++;
    var h1 = document.querySelector('h1');
    // the scroll moments: each section holding a ScrollTrigger that pins, scrubs or runs something (an animation or a
    // callback), or a mounted kit moment the scroll drives (assets/moments/index.json kind scroll or transition, not
    // picture-develops; a text, hover or liquid moment, or one left still, is none), counted once a section
    var KIT_SCROLL = /^(gallery-runs|giant-type-pass|letters-assemble|marquee-row|photo-chapters|photo-expands|pinned-chapters|scroll-stage|stacked-panels|window-parallax|word-highlight|closing-lift|iris-opens|line-carries-colour|photo-unveil|ui-assembles)$/;
    var secOf = function (e) { return (e && e.nodeType === 1 && e.closest && e.closest('main > *, section, footer')) || e; };
    var secs = [];
    all.forEach(function (t) {
      var v = t.vars || {}, el = t.pin && t.pin.nodeType === 1 ? t.pin : t.trigger;
      if (!el || v.containerAnimation) return;
      if (!(t.pin || v.scrub || t.animation || v.onUpdate || v.onEnter || v.onToggle || v.toggleClass || v.onLeave || v.onEnterBack || v.onLeaveBack)) return;
      var s = secOf(el); if (s && secs.indexOf(s) < 0) secs.push(s);
    });
    var kit = document.querySelectorAll('[data-moment][data-moment-mounted]');
    for (i = 0; i < kit.length; i++) {
      if (kit[i].hasAttribute('data-moment-still') || kit[i].hasAttribute('data-moment-failed') || !KIT_SCROLL.test(kit[i].getAttribute('data-moment') || '')) continue;
      var ks = secOf(kit[i]); if (ks && secs.indexOf(ks) < 0) secs.push(ks);
    }
    var r = {
      state: html.getAttribute('data-rt-scroll'),
      error: html.getAttribute('data-rt-scroll-error'),
      reduced: reduced,
      lenis: !!L && html.classList.contains('lenis') && !L.isStopped,
      htmlLenis: html.classList.contains('lenis'),
      smooth: !!(L && L.options && L.options.smoothWheel),
      libs: { gsap: !!window.gsap, ScrollTrigger: !!window.ScrollTrigger, SplitText: !!window.SplitText, Lenis: !!window.Lenis },
      versions: { gsap: window.gsap ? window.gsap.version : null, lenis: window.lenisVersion || null },
      failedScripts: failed.slice(),
      scrollTriggers: all.length,
      pinned: all.filter(function (t) { return !!t.pin; }).length,
      scrubbed: all.filter(function (t) { return !!(t.vars && t.vars.scrub); }).length,
      animated: animated,
      scrollMoments: secs.length,
      callbacks: { run: counts.run, threw: counts.threw, waiting: queue.length },
    };
    var f = [];
    if (r.failedScripts.length) f.push('failed loads: ' + r.failedScripts.join(', '));
    if (r.state !== 'on' && r.state !== 'reduced') f.push('scroll stack is ' + r.state + (r.error ? ' (' + r.error + ')' : ''));
    Object.keys(r.libs).forEach(function (k) { if (!r.libs[k]) f.push(k + ' missing'); });
    if (r.versions.gsap && r.versions.gsap !== VERSIONS.gsap) f.push('GSAP ' + r.versions.gsap + ', not ' + VERSIONS.gsap);
    if (r.versions.lenis && r.versions.lenis !== VERSIONS.lenis) f.push('Lenis ' + r.versions.lenis + ', not ' + VERSIONS.lenis);
    if (!r.htmlLenis) f.push('html.lenis missing: Lenis did not start');
    if (counts.threw) f.push(counts.threw + ' onReady callback(s) threw');
    if (reduced) {
      if (r.smooth) f.push('Lenis smooths the wheel under reduced motion');
      if (r.scrollTriggers) f.push(r.scrollTriggers + ' ScrollTrigger(s) alive under reduced motion');
      if (!h1 || getComputedStyle(h1).visibility === 'hidden' || +getComputedStyle(h1).opacity < 0.1) f.push('h1 hidden under reduced motion');
    } else {
      if (L && L.isStopped) f.push('Lenis is stopped (a menu or loader never called lenis.start())');
      if (!r.smooth) f.push('Lenis does not smooth the wheel');
      // real scroll-driven motion (motion.md, the budget): GSAP that drives nothing, or fewer than 2 scroll moments, fails
      if (r.state === 'on' && !r.scrollTriggers && !counts.run) f.push('GSAP drives nothing: 0 ScrollTriggers and 0 rtMotion.onReady callbacks');
      if (r.scrollMoments < 2) f.push(r.scrollMoments + ' scroll moment(s): 2-3 a page, from ScrollTriggers, scrubs, holds or the kit\'s scroll moments');
    }
    r.fails = f;
    r.pass = f.length === 0;
    return r;
  };
})();
