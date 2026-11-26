/*
  scroll-stage - rasya-taste-v4, ported from rasya-taste-v2 R05 (scroll-stage hero), set in a section of its own
  (a hero stays one screen, house rule 3). One product photograph (a cut-out or a framed shot) and three short notes
  beside one h2. From 900px wide on a screen 600px tall the section holds for two screens of scroll: the product
  moves between three framings (it shifts, turns up to 6 degrees and scales between 0.82 and 1.12) while the notes
  take turns under the h2, each next note in before the last has gone. The h2 never moves. Below 900px, under
  reduced motion and without script or GSAP the h2, the three notes as a list and the photograph stand side by side
  (stacked on a phone): that is the finished state.

    <section class="section" data-moment="scroll-stage">
      <div class="container mo-ss__stage">
        <div class="mo-ss__copy">
          <h2>A kettle that holds the degree</h2>
          <ol class="mo-ss__notes"><li><b>Four minutes</b> to 93 degrees.</li><li>…</li><li>…</li></ol>
        </div>
        <figure class="mo-ss__obj"><img src="…" alt="…"></figure>
      </div>
    </section>

  Live the section is three screens. Runs on the motion layer (lib.rt: window.rtMotion); never loads GSAP itself.
*/
export default function (root, opts, lib) {
  const obj = root.querySelector('.mo-ss__obj'), notes = [...root.querySelectorAll('.mo-ss__notes > li')];
  if (!obj || notes.length < 2 || lib.reduced()) return {};
  let mm = null;
  const wait = lib.rt(M => {
    if (M.reduced) return;
    const { gsap } = M;
    mm = gsap.matchMedia();
    mm.add(lib.wide, () => {
      root.classList.add('is-live');
      const W = f => () => innerWidth * f, H = f => () => innerHeight * f;
      const frames = [
        { x: W(0.06), y: H(0.04), rotate: 6, scale: 0.82 },
        { x: W(-0.05), y: H(-0.02), rotate: -4, scale: 1 },
        { x: 0, y: 0, rotate: 0, scale: 1.12 },
      ];
      gsap.set(notes.slice(1), { autoAlpha: 0, y: 16 });
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, refreshPriority: 1, invalidateOnRefresh: true } });
      tl.to({}, { duration: 0.3 });
      for (let i = 1; i < notes.length; i++) {
        const f = frames[Math.min(i - 1, frames.length - 1)];
        tl.to(obj, { ...f, duration: 1, ease: 'power2.inOut' })
          .to(notes[i], { autoAlpha: 1, y: 0, duration: 0.35 }, '<0.35')            // the next note is in before the last leaves
          .to(notes[i - 1], { autoAlpha: 0, y: -16, duration: 0.3 }, '<0.2')
          .to({}, { duration: 0.35 });
      }
      if (notes.length < 4) tl.to(obj, { ...frames[2], duration: 1, ease: 'power2.inOut' }).to({}, { duration: 0.3 });
      lib.refresh();
      return () => { root.classList.remove('is-live'); lib.refresh(); };
    });
  }, { name: 'scroll-stage' });
  return { destroy() { wait.cancel(); if (mm) mm.revert(); } };
}
