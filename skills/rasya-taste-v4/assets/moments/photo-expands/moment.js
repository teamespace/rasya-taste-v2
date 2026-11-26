/*
  photo-expands - rasya-taste-v4, ported from rasya-taste-v2 R08 (scroll expansion). One section: an h2 in two
  halves over one large photograph. From 900px wide on a screen 600px tall the section holds for one screen of
  scroll: the photograph opens from a rounded window in the middle (40% of the width) to the full width of the
  screen while the picture inside settles from 1.3 to 1, and the h2's two halves move from the centre to the page's
  left and right edges. The h2 stays on the ground above the photograph the whole time (never on the picture).
  Below 900px, under reduced motion and without script or GSAP the h2 stands as written over the photograph at full
  width: that is the finished state.

    <section class="section" data-moment="photo-expands">
      <div class="container mo-pe__stage">
        <h2 class="mo-pe__title"><span>Every desk</span> <span>in one view</span></h2>
        <figure class="mo-pe__media"><img src="…" alt="…" width="1800" height="1200"></figure>
      </div>
    </section>

  Live the section is two screens. Runs on the motion layer (lib.rt: window.rtMotion); never loads GSAP itself.
*/
export default function (root, opts, lib) {
  const title = root.querySelector('.mo-pe__title'), media = root.querySelector('.mo-pe__media');
  const img = media && media.querySelector('img');
  const halves = title ? [...title.children].filter(c => c.tagName === 'SPAN') : [];
  if (!media || !img || lib.reduced()) return {};
  let mm = null;
  const wait = lib.rt(M => {
    if (M.reduced) return;
    const { gsap } = M;
    mm = gsap.matchMedia();
    mm.add(lib.wide, () => {
      root.classList.add('is-live');
      // how far each half sits from its edge when the two are centred together
      const off = () => {
        if (halves.length !== 2) return 0;
        const w = title.clientWidth, a = halves[0].offsetWidth, b = halves[1].offsetWidth, g = parseFloat(getComputedStyle(title).columnGap) || 0;
        return Math.max(0, (w - (a + g + b)) / 2);
      };
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, refreshPriority: 1, invalidateOnRefresh: true } })
        .fromTo(media, { clipPath: 'inset(14% 30% 14% 30% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 })
        .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1 }, 0)
        .to({}, { duration: 0.15 });
      if (halves.length === 2) tl.fromTo(halves[0], { x: () => off() }, { x: 0, duration: 1 }, 0).fromTo(halves[1], { x: () => -off() }, { x: 0, duration: 1 }, 0);
      lib.refresh();
      return () => { root.classList.remove('is-live'); lib.refresh(); };
    });
  }, { name: 'photo-expands' });
  return { destroy() { wait.cancel(); if (mm) mm.revert(); } };
}
