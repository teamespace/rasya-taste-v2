/*
  phrase-marks - rasya-taste-v4, ported from rasya-taste-v2 R12 (highlighter sweep). One to three key phrases in one
  large statement (or an h2) are marked: a flat tint draws behind each from left to right, across its line breaks,
  as the phrase climbs from 85% to 55% of the screen's height, scrubbed (it runs back on the way up). The text's own
  colour never changes. The CSS ships the finished marks, so reduced motion, no script and no GSAP show them drawn.
  Runs on a phone too (one background size a phrase).

    <section class="section statement" data-moment="phrase-marks">
      <div class="container"><p class="mo-pm__text">Close the month in <mark>two days, not ten</mark>, with every …</p></div>
    </section>

  The tint is --mo-mark (the accent at 24% on the ground); one flat colour, never two. Runs on the motion layer
  (lib.rt: window.rtMotion); never loads GSAP itself.
*/
export const phone = true;
export default function (root, opts, lib) {
  const marks = [...root.querySelectorAll('mark')].slice(0, 3);
  if (!marks.length || lib.reduced()) return {};
  const tweens = [];
  const wait = lib.rt(M => {
    if (M.reduced) return;
    const { gsap } = M;
    root.classList.add('is-live');
    marks.forEach(el => tweens.push(gsap.fromTo(el, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 55%', scrub: true } })));
  }, { name: 'phrase-marks' });
  return { destroy() { wait.cancel(); tweens.forEach(t => { t.scrollTrigger?.kill(); t.revert(); }); root.classList.remove('is-live'); } };
}
