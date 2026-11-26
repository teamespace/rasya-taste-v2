/*
  rasya-taste-v4 footers.js - the footer library's one script (references/footers.md). A plain script, deferred,
  once a page, after assets/motion/scroll.js; footers.mjs prints the line when the dealt ending needs it:
      <script src="assets/footers/footers.js" defer></script>

  1. The fit. Every footer wordmark ([data-footer-wordmark], a direct child of footer.closing) is sized by CSS from
     --ft-fit, the word's size in vw (footers.css: clamp(--ft-min, --ft-fit * 1vw, --ft-cap)). The dealer prints an
     estimate for the name; this measures the letters as they are drawn and writes the exact --ft-fit on the footer,
     so the word runs edge to edge (less --ft-inset at each side): now, when the fonts arrive, at load and when the
     footer's width changes. The CSS cap still holds (a short name on a short screen stays centred under it). The
     footer clips the word, so nothing ever scrolls the page sideways, with or without this script.
  2. outline-fill. On footer.closing[data-footer="outline-fill"] the word's fill (--ft-p, 0 to 1) is scrubbed to the
     scroll while the footer comes up, from its top at the screen's foot to the page's end, through window.rtMotion
     (assets/motion/scroll.js: GSAP and ScrollTrigger on Lenis). Without rtMotion, under reduced motion, or when the
     scroll stack failed, nothing is made: the word stays as the HTML and CSS draw it, filled.
  Nothing else moves and nothing loops.
*/
(() => {
  'use strict';
  const marks = [...document.querySelectorAll('footer.closing > [data-footer-wordmark]')];
  if (!marks.length) return;

  // the drawn width of the word's letters (its text runs only: an ornament beside a letter is not counted)
  const lettersWidth = (word) => {
    let l = Infinity, r = -Infinity;
    const walk = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!/\S/.test(n.nodeValue) || (n.parentElement && n.parentElement.closest('svg'))) continue;
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) { if (q.width < 1) continue; l = Math.min(l, q.left); r = Math.max(r, q.right); }
    }
    return r > l ? r - l : 0;
  };

  let refreshT = 0;
  const refreshTriggers = () => {
    clearTimeout(refreshT);
    refreshT = setTimeout(() => {
      const T = window.rtMotion && window.rtMotion.ScrollTrigger;
      if (T && typeof T.refresh === 'function') { try { T.refresh(); } catch (e) { /* not ours to fix */ } }
    }, 120);
  };

  const fit = (mark) => {
    const foot = mark.parentElement, word = mark.querySelector('.ft-mark__word');
    if (!foot || !word) return;
    const W = foot.clientWidth; if (!W) return;
    const cs = getComputedStyle(word);
    const size = parseFloat(cs.fontSize); if (!size) return;
    // tightened tracking: the last letter's ink runs past its shortened advance by the tracking's size
    const track = parseFloat(cs.letterSpacing) || 0;
    const w = lettersWidth(word) + Math.max(0, -track);
    if (!w) return;
    const inset = Math.min(20, Math.max(0, parseFloat(getComputedStyle(foot).getPropertyValue('--ft-inset')) || 0));
    const target = W * (1 - (2 * inset) / 100);
    const vw = window.innerWidth / 100; if (!vw) return;
    const next = Math.round(((size * target) / w / vw) * 1000) / 1000;
    if (!Number.isFinite(next) || next <= 0) return;
    const cur = parseFloat(foot.style.getPropertyValue('--ft-fit'));
    if (Number.isFinite(cur) && Math.abs(cur - next) < 0.01) return;
    foot.style.setProperty('--ft-fit', String(next));
    if (!Number.isFinite(cur) || Math.abs(cur - next) > 0.5) refreshTriggers();
  };

  let raf = 0;
  const fitAll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => marks.forEach(fit)); };
  fitAll();
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(fitAll, () => {});
    if (typeof document.fonts.addEventListener === 'function') document.fonts.addEventListener('loadingdone', fitAll);
  }
  addEventListener('load', fitAll, { once: true });
  if (typeof ResizeObserver === 'function') {
    const widths = new WeakMap();
    const ro = new ResizeObserver((entries) => {
      let changed = false;
      for (const e of entries) {
        const w = Math.round(e.contentRect.width);
        if (widths.get(e.target) !== w) { widths.set(e.target, w); changed = true; }
      }
      if (changed) fitAll();
    });
    marks.forEach((m) => m.parentElement && ro.observe(m.parentElement));
  } else addEventListener('resize', fitAll);

  // outline-fill: the scrubbed fill, on the scroll stack only
  const fills = marks.filter((m) => m.parentElement && m.parentElement.matches('[data-footer="outline-fill"]'));
  const rt = window.rtMotion;
  const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!fills.length || still || !rt || typeof rt.onReady !== 'function') return;
  rt.onReady(({ gsap, ScrollTrigger, reduced }) => {
    if (reduced || !gsap || !ScrollTrigger) return;
    for (const mark of fills) {
      const word = mark.querySelector('.ft-mark__word'), foot = mark.parentElement;
      if (!word) continue;
      gsap.fromTo(word, { '--ft-p': 0 }, {
        '--ft-p': 1, ease: 'none', overwrite: true,
        scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
      });
    }
  });
})();
