/*
  hero recipe: output-stack (refs: Recraft, Krea, Audienceful; references/hero-recipes.md). A stack of the product's
  outputs (generated pictures, rendered designs, a studio's finished work) in the hero's picture slot: the top one
  whole, three more stepping back up and to the right, never turned. Next and previous buttons, a drag on the top
  card and the arrow keys on the buttons deal the next one; the count reads "02 / 05". On software and tech the stack
  deals itself every 3.2 s while on screen (a card loop: it holds while the pointer or the focus is on it, and has the
  kit's pause button); on every other kind only the visitor deals it.

  <div class="rr rr--output-stack" data-recipe="output-stack" role="group" aria-roledescription="stack" aria-label="..">
    <figure class="rr-os__card"><img data-rr-slot="output" src=".." alt="what it shows"></figure>   three to six
    <div class="rr-os__ctl"><button class="rr-os__btn" data-rr-prev aria-label="Previous">..</button>
      <span class="rr-mono rr-os__n" aria-live="polite">01 / 05</span><button class="rr-os__btn" data-rr-next aria-label="Next">..</button></div>
  </div>
  The still is the markup: the first card on top.
*/
import { allowance, mountAll, setState, pauseButton } from '../_shared/recipe-kit.js';

mountAll('output-stack', (el) => {
  const cards = [...el.querySelectorAll('.rr-os__card')];
  const n = cards.length;
  if (n < 2) return null;
  const count = el.querySelector('.rr-os__n');
  const a = allowance();
  let top = 0, timer = 0, held = false, hover = false, busy = false;
  const pad = (k) => String(k).padStart(2, '0');
  const paint = () => {
    cards.forEach((c, i) => {
      const k = (i - top + n) % n;
      c.style.setProperty('--k', k);
      c.classList.toggle('is-deep', k > 3);
      c.toggleAttribute('inert', k !== 0);
      c.setAttribute('aria-hidden', String(k !== 0));
    });
    if (count) count.textContent = `${pad(top + 1)} / ${pad(n)}`;
  };
  const go = (d) => {
    if (busy) return;
    busy = true;
    const out = cards[top];
    out.classList.add(d > 0 ? 'is-out' : 'is-in');
    setTimeout(() => {
      top = (top + d + n) % n;
      paint();
      out.classList.remove('is-out', 'is-in');
      busy = false;
    }, a.reduced ? 0 : 320);
  };
  paint();
  el.querySelector('[data-rr-next]')?.addEventListener('click', () => go(1));
  el.querySelector('[data-rr-prev]')?.addEventListener('click', () => go(-1));
  el.querySelectorAll('.rr-os__btn').forEach((b) => b.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  }));
  // a drag on the top card: 60px either way deals the next or the previous
  let sx = null;
  el.addEventListener('pointerdown', (e) => { if (e.target.closest('.rr-os__card')) { sx = e.clientX; } });
  el.addEventListener('pointerup', (e) => { if (sx != null && Math.abs(e.clientX - sx) > 60) go(e.clientX < sx ? 1 : -1); sx = null; });
  el.addEventListener('pointerenter', () => { hover = true; });
  el.addEventListener('pointerleave', () => { hover = false; });
  el.addEventListener('focusin', () => { hover = true; });
  el.addEventListener('focusout', () => { hover = false; });
  if (!a.selfMove) { setState(el, 'still', a.why || 'other'); return null; }
  let onScreen = true;
  new IntersectionObserver((es) => { onScreen = es.some((x) => x.isIntersecting); }).observe(el);
  const tick = () => { if (!held && !hover && onScreen && !document.hidden) go(1); };
  timer = setInterval(tick, 3200);
  setState(el, 'live');
  const ctl = { pause() { held = true; }, resume() { held = false; }, destroy() { clearInterval(timer); } };
  pauseButton(el, ctl, 'the stack');
  return ctl;
});
