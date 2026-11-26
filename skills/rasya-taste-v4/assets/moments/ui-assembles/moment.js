/*
  ui-assembles - rasya-taste-v4, ported from rasya-taste-v2 R03 (UI assembly). The product's own UI, written as
  live HTML in one window, builds itself once when its section comes on screen: the window rises 60px and settles,
  then its parts arrive in order (the side list slides in, the figures lift, the chart's bars grow, the rows wipe in
  from the left, the notice comes last), about 2.3 s in all. Nothing moves with the scroll after that. Under
  reduced motion, on a phone, without script or GSAP the window stands as written: that is the finished state.

    <section class="section" data-moment="ui-assembles">
      <div class="container demo-split"> <div class="section-head"><h2>…</h2>…</div>
        <div class="frame"><div class="dw" data-ua="window">
          … <span data-ua="side">…</span> … <div data-ua="card">…</div> … <i data-ua="bar" style="--v: 40%"></i> …
          <div class="dw__row" data-ua="row">…</div> … <div data-ua="toast">…</div>
        </div></div>
      </div>
    </section>

  Parts are marked data-ua="window | side | card | bar | row | toast" (a .dw window's .dw__side items and .dw__row
  rows are found without the marks). Six groups at most: more reads as a loading screen. For a section, never the
  hero (the hero's entrance is the motion layer's). Runs on the motion layer (lib.rt); never loads GSAP itself.
*/
export default function (root, opts, lib) {
  const win = root.querySelector('[data-ua="window"]') || root.querySelector('.dw, .app-frame');
  if (!win || lib.reduced()) return {};
  const q = (mark, fb) => { const a = [...root.querySelectorAll(`[data-ua="${mark}"]`)]; return a.length ? a : (fb ? [...win.querySelectorAll(fb)] : []); };
  let seen = null, tl = null, dead = false;
  const wait = lib.rt(M => {
    if (M.reduced || dead) return;
    const { gsap } = M;
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .from(win, { y: 60, scale: 0.96, autoAlpha: 0, duration: 1.1, ease: 'expo.out' });
    const side = q('side', '.dw__side > *'), cards = q('card'), bars = q('bar'), rows = q('row', '.dw__row'), toast = q('toast');
    if (side.length) tl.from(side, { x: -16, autoAlpha: 0, duration: 0.5, stagger: 0.04 }, '-=0.6');
    if (cards.length) tl.from(cards, { y: 28, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '<0.1');
    if (bars.length) tl.from(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.03 }, '<0.2');
    if (rows.length) tl.from(rows, { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.6, stagger: 0.06, ease: 'power2.inOut' }, '<0.1');
    if (toast.length) tl.from(toast, { y: 16, scale: 0.9, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.2');
    root.classList.add('is-live');
    seen = lib.once(win, () => tl.play(), { threshold: 0.3 });
  }, { name: 'ui-assembles' });
  return { destroy() { dead = true; wait.cancel(); if (seen) seen.destroy(); if (tl) { tl.progress(1); tl.kill(); } root.classList.remove('is-live'); } };
}
