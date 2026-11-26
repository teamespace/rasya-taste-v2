/*
  hero recipe: bleed-photo (refs: Cometeer, Jot, Sauz, Shopify, Opal; references/hero-recipes.md). The photo hero
  (hero-photo.html) with the picture made for it: one photograph edge to edge, composed with a calm third where the
  h1 stands (data-calm on the section says which), the subject on the far third. The recipe is mostly the asset: the
  prompt, the crop for a phone and where the calm side is. The mount is the photo hero's own layer.

  <section class="hero hero--photo" data-calm="left" data-box="none" data-tone="dark" ..>
    <img class="hero__bg rr rr--bleed-photo" data-recipe="bleed-photo" data-rr-slot="scene" src=".." alt=".."
         style="--ly-pos: 70% 50%; --ly-pos-phone: 76% 50%" fetchpriority="high">
    (tech, a film: <video class="hero__bg rr rr--bleed-photo" data-recipe="bleed-photo" data-rr-slot="film"
         src=".." poster=".." muted playsinline loop aria-label=".."></video>)
  data-rr-variant  side (default: the calm side left or right) | flatlay (a top-down table, the calm patch the words take)
                   | film (tech only: a 6 to 12 s loop, muted, with a pause button)

  Motion: on software, gaming and tech the picture drifts 6px with the pointer and eases in 6% as the hero scrolls
  away; a film plays only on tech, in view, with the kit's pause button. On every other kind the photograph is still
  (the hero's entrance is its only motion) and a film is its poster until clicked.
*/
import { allowance, mountAll, setState, loop, pointer, damp, heroScroll, pauseButton, whenReady } from '../_shared/recipe-kit.js';

mountAll('bleed-photo', (el) => {
  const a = allowance();
  const isFilm = el.tagName === 'VIDEO';
  if (isFilm) {
    el.muted = true; el.playsInline = true; el.loop = true; el.removeAttribute('autoplay');
    if (!a.selfMove) {
      setState(el, 'still', a.why || 'other');
      // kind other: the poster until a click plays it (a film is a still that plays on a click)
      if (a.other && !a.reduced) { el.style.cursor = 'pointer'; el.addEventListener('click', () => (el.paused ? el.play() : el.pause())); }
      return null;
    }
  }
  if (!a.selfMove && !isFilm) { setState(el, 'still', a.why || 'other'); return null; }
  let px = 0, py = 0, tx = 0, ty = 0, sc = 0;
  const apply = () => { el.style.transform = `translate3d(${(px * -6).toFixed(2)}px, ${(py * -4).toFixed(2)}px, 0) scale(${(1.02 + sc * 0.06).toFixed(4)})`; };
  const stopPtr = a.pointer ? pointer(el, (x, y, inside) => { tx = inside ? x : 0; ty = inside ? y : 0; L.wake(); }) : () => {};
  const L = loop(el, (dt) => { px = damp(px, tx, 3.5, dt); py = damp(py, ty, 3.5, dt); apply(); return Math.abs(px - tx) + Math.abs(py - ty) > 0.002; });
  let stopScroll = () => {};
  whenReady((m) => { stopScroll = heroScroll(el, (p) => { sc = p; apply(); }, m); });
  if (isFilm) {
    const host = el.closest('.hero') || el.parentElement;
    const io = new IntersectionObserver((es) => { for (const e of es) (e.isIntersecting && !el.dataset.rrHeld ? el.play().catch(() => {}) : el.pause()); });
    io.observe(el);
    const b = pauseButton(host, { pause() { el.dataset.rrHeld = '1'; el.pause(); }, resume() { delete el.dataset.rrHeld; el.play().catch(() => {}); } }, 'the film');
    b.classList.add('rr-bp__pause');
  }
  setState(el, 'live');
  apply();
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); stopPtr(); stopScroll(); el.style.transform = ''; } };
});
