/*
  gallery-runs - rasya-taste-v4, ported from rasya-taste-v2 R07 (horizontal scroll gallery). One section of 5 to 8
  photographs (work, a collection, places) in one row. From 900px wide on a screen 600px tall the section holds on a
  sticky stage, its h2 on screen the whole time, and the row runs sideways as the visitor scrolls down; each
  photograph pans 12% inside its frame as it crosses. Below 900px, under reduced motion and without script or GSAP
  the row is a native swipe row with snap points: that is the finished state. No caption under a photograph
  (house rule 1): the alt text names it.

    <section class="section" data-moment="gallery-runs">
      <div class="container mo-gr__stage">
        <div class="section-head"><h2>Rooms we finished this year</h2></div>
        <div class="mo-gr__view"><div class="mo-gr__track">
          <figure class="mo-gr__item"><img src="…" alt="…" width="1000" height="1250"></figure> …
        </div></div>
      </div>
    </section>

  Live the section is (hold + 1) screens: hold 1 when the row overflows by up to 1.2 screens' height, else 2.
  Runs on the motion layer (lib.rt: window.rtMotion, GSAP + ScrollTrigger); never loads GSAP itself.
*/
export default function (root, opts, lib) {
  const view = root.querySelector('.mo-gr__view'), track = root.querySelector('.mo-gr__track');
  const items = track ? [...track.querySelectorAll('.mo-gr__item')] : [];
  if (!view || items.length < 3 || lib.reduced()) return {};
  let mm = null;
  const wait = lib.rt(M => {
    if (M.reduced) return;
    const { gsap } = M;
    mm = gsap.matchMedia();
    mm.add(lib.wide, () => {
      root.classList.add('is-live');
      const dist = () => Math.max(0, track.scrollWidth - view.clientWidth);
      root.style.setProperty('--mo-hold', String(opts.hold || (dist() > innerHeight * 1.2 ? 2 : 1)));
      // the hold first (refreshPriority 1): it changes the section's height
      const move = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, refreshPriority: 1, invalidateOnRefresh: true } })
        .to({}, { duration: 0.08 })
        .to(track, { x: () => -dist(), duration: 1 })
        .to({}, { duration: 0.08 });
      items.forEach(it => {
        const img = it.querySelector('img');
        if (img) gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: it, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } });
      });
      lib.refresh();
      return () => { root.classList.remove('is-live'); root.style.removeProperty('--mo-hold'); lib.refresh(); };
    });
  }, { name: 'gallery-runs' });
  return { destroy() { wait.cancel(); if (mm) mm.revert(); } };
}
