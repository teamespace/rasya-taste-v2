/*
  rasya-taste-v4 navs.js - the nav library's one script (references/navs.md). A plain script, deferred, once a page,
  after assets/motion/scroll.js; nav.mjs prints the line:
      <script src="assets/navs/navs.js" defer></script>

  It runs the bar's scroll states on header.nav[data-nav] and adds no second menu handler: system.js keeps the phone
  sheet, Escape, aria-expanded and lenis.stop() while the menu is open. What it does:
  1. Scroll states, as classes on the header (the shared contract), from data-nav-scroll (or the nav's default):
       is-scrolled   always: the page has moved past 8px
       solid         is-solid past the hero (main's first child, or [data-nav-solid-at]): the nav's second state
       hide          is-hidden while the page scrolls down past two bar heights, gone on the first move up; never
                     while the header holds the focus, the pointer or the open menu
       pill          is-pill once the page moves past 24px; the capsule's width and the two shifts are measured here
                     (--nv-pill-w, --nv-shift-l, --nv-shift-r), so the logo and the action glide in by transform
       section       aria-current="location" on the link of the section on screen (never over an inner page's
                     aria-current="page"), the path [data-nav-path] and data-nav-on from the section's data-nav-theme
     The scroll position comes from window.rtMotion.lenis (assets/motion/scroll.js) when it is there, else from the
     window; one update a frame. Under reduced motion every state is still set; navs.css takes the transitions off.
  2. Datums in the bar, each only from a real fact of the brief:
       [data-nav-datum data-from data-to data-for="#section" data-decimals]   the number follows the scroll from where
         that section's top enters the screen to where its middle reaches the middle (under reduced motion: data-to)
       [data-nav-clock="Europe/Oslo"] > time        the local time there, every 15 s (24-hour, the page's language)
       [data-nav-countdown="2026-12-01" | "monthly:1"] > [data-n]   whole days to that date ([data-unit] takes
         data-one / data-many; [data-zero] shows on the day)
  3. Anchor jumps from the bar land under it: a link to a section that pads its own top (main > section,
     footer.closing) lands on the section's top, as scroll.js does; any other target lands the bar's height lower.
     Through Lenis when it runs (lenis.scrollTo with an offset), else window.scrollTo; a keyboard activation moves
     the focus to the target.
  4. Menus: a full-screen takeover keeps the Tab key inside the header while open; a tap on the dimmed page behind a
     sheet or a dock sheet closes it (through the toggle, so system.js does the rest); a scroll closes the mega panel
     of preview-mega until the pointer moves again; split-mark's --nv-fold (half the word, for the symbol's move).
  Nothing here loops or animates by itself; a nav without data-nav does nothing. Demo frames may set ?scroll=, ?open=1
  and ?mega=1 through the template's own helper, never through this file.
*/
(() => {
  'use strict';
  const nav = document.querySelector('header.nav[data-nav]');
  if (!nav || nav.__nvBound) return;
  nav.__nvBound = true;

  const id = nav.getAttribute('data-nav') || '';
  const KIT = /^nav-(mega|cards|centre|split)$/.test(id);
  const DEFAULTS = {
    ruled: 'section', 'split-mark': 'solid section', 'over-media': 'solid hide section', pill: 'pill section',
    dock: 'solid section', 'mono-strip': 'hide section', 'corner-index': 'solid hide section', 'preview-mega': 'hide section',
    takeover: 'solid hide', rail: 'section', live: 'hide section', object: 'hide section'
  };
  const want = new Set(String(nav.getAttribute('data-nav-scroll') || DEFAULTS[id] || (KIT ? 'section' : 'hide section')).split(/[\s,]+/).filter(Boolean));
  const root = document.documentElement;
  const lang = root.getAttribute('lang') || undefined;
  const reducedQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const reduced = () => reducedQ.matches || !!(window.rtMotion && window.rtMotion.reduced);
  const lenis = () => (window.rtMotion && window.rtMotion.lenis) || null;
  const scrollY0 = () => { const L = lenis(); return L && typeof L.scroll === 'number' ? L.scroll : (window.scrollY || root.scrollTop || 0); };
  const toggle = nav.querySelector('.nav__toggle');
  const set = (c, on) => { if (nav.classList.contains(c) !== on) nav.classList.toggle(c, on); };
  const open = () => nav.classList.contains('is-open');

  // ------------------------------------------------------------------ geometry, read once a frame
  const hero = () => document.querySelector('[data-nav-solid-at]') || document.querySelector('main > .hero, main > .section--hero, main > section:first-of-type, main > :first-child');
  const barH = () => nav.offsetHeight || 72;
  let heroEnd = 400;
  const measure = () => {
    const h = hero();
    if (h) { const r = h.getBoundingClientRect(); heroEnd = Math.max(barH(), r.bottom + scrollY0() - barH() - 1); }
    fold(); pill();
  };

  // split-mark: the symbol moves by half the word and the gap to the centre line once the word folds away
  function fold() {
    if (id !== 'split-mark') return;
    const w = nav.querySelector('.nv-word'), s = nav.querySelector('.nv-symbol'), logo = nav.querySelector('.nav__logo');
    if (!w || !s || !logo) return;
    const gap = parseFloat(getComputedStyle(logo).columnGap || getComputedStyle(logo).gap) || 0;
    nav.style.setProperty('--nv-fold', ((w.offsetWidth + gap) / 2).toFixed(1) + 'px');
  }
  // pill: a capsule as wide as the logo, the words and the actions need, centred; the logo and the actions slide in
  function pill() {
    if (!want.has('pill')) return;
    const bar = nav.querySelector('.nav__bar'), logo = nav.querySelector('.nav__logo'), links = nav.querySelector('.nav__links'), acts = nav.querySelector('.nav__actions');
    if (!bar || !logo || !links || !acts || window.innerWidth < 1024) { ['--nv-pill-w', '--nv-shift-l', '--nv-shift-r'].forEach((p) => nav.style.removeProperty(p)); return; }
    const W = bar.clientWidth, gap = 28, padL = 24, padR = 8;
    const side = Math.max(logo.offsetWidth + padL, acts.offsetWidth + padR);
    const pw = Math.min(W, Math.ceil(2 * side + links.offsetWidth + 2 * gap));
    const edge = (W - pw) / 2;
    nav.style.setProperty('--nv-pill-w', pw + 'px');
    nav.style.setProperty('--nv-shift-l', Math.max(0, edge + padL).toFixed(1) + 'px');
    nav.style.setProperty('--nv-shift-r', Math.max(0, edge + padR).toFixed(1) + 'px');
  }

  // ------------------------------------------------------------------ the section on screen
  const pageMarked = !!nav.querySelector('[aria-current="page"]');
  const hashLinks = [...nav.querySelectorAll('a[href^="#"]')].filter((a) => {
    const h = a.getAttribute('href');
    return h.length > 1 && h !== '#top' && !a.closest('.nav__menu, .nav__actions, .nv-aside') && !a.matches('.btn, .nav__logo, .nv-tile, .nv-new');
  });
  const targets = hashLinks.map((a) => {
    let t = null; try { t = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); } catch (e) { t = null; }
    return { a, t, label: (a.getAttribute('data-nav-label') || a.textContent || '').replace(/\s+/g, ' ').trim() };
  }).filter((x) => x.t);
  const paths = [...nav.querySelectorAll('[data-nav-path]')];
  paths.forEach((p) => { if (!p.hasAttribute('data-nav-path-home')) p.setAttribute('data-nav-path-home', p.textContent.trim()); });
  const themed = [...document.querySelectorAll('main > [data-nav-theme], footer.closing[data-nav-theme]')];
  let current = null;
  function section() {
    if (!want.has('section')) return;
    const line = barH() + window.innerHeight * 0.3;
    let best = null;
    if (!pageMarked) {
      for (const x of targets) {
        const r = x.t.getBoundingClientRect();
        if (r.top <= line && r.bottom > barH()) best = x;
      }
      if (best !== current) {
        current = best;
        for (const x of targets) {
          if (x === best) { x.a.setAttribute('aria-current', 'location'); x.a.classList.add('is-current'); }
          else if (x.a.getAttribute('aria-current') === 'location') { x.a.removeAttribute('aria-current'); x.a.classList.remove('is-current'); }
        }
        for (const p of paths) p.textContent = best ? best.label : p.getAttribute('data-nav-path-home');
        if (best) nav.setAttribute('data-nav-at', best.t.id); else nav.removeAttribute('data-nav-at');
      }
    }
    if (themed.length) {
      let on = null;
      for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= barH() / 2 && r.bottom > barH() / 2) on = s.getAttribute('data-nav-theme'); }
      if (on) nav.setAttribute('data-nav-on', on); else nav.removeAttribute('data-nav-on');
    }
  }

  // ------------------------------------------------------------------ datums
  const nf = (dec) => { try { return new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec }); } catch (e) { return new Intl.NumberFormat(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }); } };
  const datums = [...nav.querySelectorAll('[data-nav-datum]')].map((el) => {
    const from = parseFloat(el.getAttribute('data-from')), to = parseFloat(el.getAttribute('data-to'));
    const dec = Math.max(0, Math.min(3, parseInt(el.getAttribute('data-decimals') || '0', 10) || 0));
    let sec = null; try { sec = el.getAttribute('data-for') ? document.querySelector(el.getAttribute('data-for')) : null; } catch (e) { sec = null; }
    return { el, from, to, sec, fmt: nf(dec), last: null, ok: Number.isFinite(from) && Number.isFinite(to) };
  }).filter((d) => d.ok);
  function datum(y) {
    for (const d of datums) {
      let v = d.to;
      if (!reduced() && d.sec) {
        const r = d.sec.getBoundingClientRect(), top = r.top + y, vh = window.innerHeight;
        const a = top - vh, b = top + r.height / 2 - vh / 2;
        const p = b > a ? Math.min(1, Math.max(0, (y - a) / (b - a))) : 1;
        v = d.from + (d.to - d.from) * p;
      }
      const s = d.fmt.format(v);
      if (s !== d.last) { d.el.textContent = s; d.last = s; }
    }
  }
  nav.querySelectorAll('[data-nav-clock]').forEach((el) => {
    const t = el.querySelector('time') || el;
    let fmt;
    try { fmt = new Intl.DateTimeFormat(lang || 'en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: el.getAttribute('data-nav-clock') }); } catch (e) { return; }
    const tick = () => { const now = new Date(); t.textContent = fmt.format(now); if (t.tagName === 'TIME') t.setAttribute('datetime', now.toISOString()); };
    tick(); setInterval(tick, 15000);
  });
  nav.querySelectorAll('[data-nav-countdown]').forEach((el) => {
    const spec = el.getAttribute('data-nav-countdown') || '';
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let due = null;
    const m = /^monthly:(\d{1,2})$/.exec(spec);
    if (m) {
      const day = Math.min(28, Math.max(1, +m[1]));
      due = new Date(today.getFullYear(), today.getMonth(), day);
      if (due < today) due = new Date(today.getFullYear(), today.getMonth() + 1, day);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(spec)) {
      const [y, mo, d] = spec.split('-').map(Number); due = new Date(y, mo - 1, d);
    }
    if (!due || Number.isNaN(+due)) return;
    const n = Math.max(0, Math.round((due - today) / 86400000));
    const nEl = el.querySelector('[data-n]'), unit = el.querySelector('[data-unit]');
    const when = el.querySelector('[data-when]'), zero = el.querySelector('[data-zero]');
    if (nEl) nEl.textContent = nf(0).format(n);
    if (unit) unit.textContent = n === 1 ? (unit.getAttribute('data-one') || unit.textContent) : (unit.getAttribute('data-many') || unit.textContent);
    if (when && zero) { when.hidden = n === 0; zero.hidden = n !== 0; }
  });

  // ------------------------------------------------------------------ the frame loop
  let lastY = scrollY0(), hidden = false, queued = false, hovering = false;
  const hideAt = () => Math.max(barH() * 2, 160);
  const shutOnScroll = id === 'preview-mega' && !!nav.querySelector('.nav__menu');
  function update() {
    queued = false;
    const y = scrollY0();
    set('is-scrolled', y > 8);
    if (want.has('solid')) set('is-solid', y >= heroEnd);
    if (want.has('pill')) set('is-pill', y > 24);
    if (want.has('hide')) {
      const lock = open() || hovering || nav.contains(document.activeElement) || nav.classList.contains('nv-hold');
      if (lock || y < hideAt()) hidden = false;
      else if (y > lastY + 6) hidden = true;
      else if (y < lastY - 6) hidden = false;
      set('is-hidden', hidden);
    }
    if (shutOnScroll && Math.abs(y - lastY) > 4) { set('nv-shut', true); const f = document.activeElement; if (f && f.closest && f.closest('.nav__menu')) f.blur(); }
    section();
    datum(y);
    lastY = y;
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  if (shutOnScroll) nav.addEventListener('pointermove', () => set('nv-shut', false));
  nav.addEventListener('pointerenter', () => { hovering = true; });
  nav.addEventListener('pointerleave', () => { hovering = false; });
  addEventListener('scroll', schedule, { passive: true });
  let boundLenis = null;
  const bind = (L) => { if (!L || L === boundLenis || typeof L.on !== 'function') return; boundLenis = L; L.on('scroll', schedule); schedule(); };
  if (window.rtMotion && typeof window.rtMotion.onReady === 'function') window.rtMotion.onReady((R) => bind(R.lenis));
  document.addEventListener('rt:ready', (e) => bind(e.detail && e.detail.lenis), { once: true });
  const remeasure = () => { measure(); schedule(); };
  addEventListener('resize', remeasure, { passive: true });
  addEventListener('load', remeasure, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure).catch(() => {});
  try { new MutationObserver(remeasure).observe(root, { attributes: true, attributeFilter: ['data-ready', 'data-moments-ready'] }); } catch (e) { /* no observer */ }
  // the menu opening (system.js sets is-open): show the bar, keep it shown
  try { new MutationObserver(() => { if (open()) { hidden = false; set('is-hidden', false); } schedule(); }).observe(nav, { attributes: true, attributeFilter: ['class'] }); } catch (e) { /* no observer */ }
  measure();
  update();

  // ------------------------------------------------------------------ anchor jumps under the bar
  const SECTIONLIKE = 'main > *, footer.closing, main';
  const offsetFor = (t) => {
    const pad = t.matches(SECTIONLIKE) ? (parseFloat(getComputedStyle(t).paddingTop) || 0) : 0;
    const edge = nav.querySelector('.nv-edge');
    return Math.max(0, barH() + (edge ? edge.offsetHeight : 0) - pad);
  };
  function jump(t, keyboard) {
    const off = offsetFor(t), L = lenis();
    if (L && !L.isStopped && typeof L.scrollTo === 'function') L.scrollTo(t, { offset: -off, immediate: reduced() || keyboard });
    else window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.scrollY - off), behavior: reduced() || keyboard ? 'auto' : 'smooth' });
    if (keyboard) {
      if (!t.matches('a[href], button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1');
      try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
    }
  }
  nav.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || !nav.contains(a) || a.hasAttribute('data-lenis-native')) return;
    const h = a.getAttribute('href').slice(1);
    if (!h) return;
    let t = null; try { t = document.getElementById(decodeURIComponent(h)); } catch (x) { return; }
    if (!t) return;
    e.preventDefault();
    const keyboard = e.detail === 0;
    // after system.js has closed the sheet and started Lenis again (its handler runs on the same click)
    requestAnimationFrame(() => jump(t, keyboard));
    if (location.hash !== '#' + h) { try { history.pushState(null, '', '#' + h); } catch (x) { /* file: or sandboxed */ } }
  });

  // ------------------------------------------------------------------ menus
  const menu = nav.getAttribute('data-nav-menu') || '';
  const shown = (el) => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !open()) return;
    const full = menu === 'takeover' || id === 'takeover';
    if (!full) return;
    const f = [...nav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(shown);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!nav.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });
  // a tap on the dimmed page behind a sheet (body::after) closes it, through the toggle so system.js does the rest
  if (menu === 'sheet' || menu === 'dock') {
    document.addEventListener('click', (e) => { if (open() && toggle && (e.target === document.body || e.target === root)) toggle.click(); });
  }
})();
