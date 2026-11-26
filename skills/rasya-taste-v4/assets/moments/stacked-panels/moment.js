/*
  stacked-panels - rasya-taste-v4, ported from rasya-taste-v2 R09 (sticky stacking cards). One section of 2 to 5
  panels (a plan, a principle, a case: a title, two lines, one picture or none). From 900px wide on a screen 600px
  tall the section holds on a sticky stage, its h2 on screen the whole time, while each next panel slides up over
  the last; the ones under it step back (scale 1 - 0.04 for each panel above) and fade toward the ground, so their
  top edges show as a 14px stack. Below 900px, under reduced motion, without script or GSAP, the panels stand one
  under another: that is the finished state.

    <section class="section" style="--h: 2" data-moment="stacked-panels">
      <div class="container mo-sp__stage">
        <div class="section-head"><h2>Three plans, one bill</h2></div>
        <div class="mo-sp__deck">
          <article class="mo-sp__panel"><div><h3>Team</h3><p>Two lines.</p></div><img …></article>
          …
        </div>
      </div>
    </section>

  Live the section is (hold + 1) screens: hold 1 for 2 or 3 panels, 2 for 4 or 5 (opts.hold sets it).
  Runs on the motion layer (lib.rt: window.rtMotion, GSAP + ScrollTrigger); never loads GSAP itself.
*/
export default function (root, opts, lib) {
  const stage = root.querySelector('.mo-sp__stage'), deck = root.querySelector('.mo-sp__deck');
  const panels = deck ? [...deck.querySelectorAll('.mo-sp__panel')] : [];
  if (!stage || panels.length < 2 || lib.reduced()) return {};
  const n = panels.length, step = 14;
  root.style.setProperty('--mo-hold', String(opts.hold || (n > 3 ? 2 : 1)));
  root.style.setProperty('--mo-n', String(n));
  panels.forEach(p => { if (!p.querySelector('.mo-sp__shade')) { const s = document.createElement('i'); s.className = 'mo-sp__shade'; s.setAttribute('aria-hidden', 'true'); p.append(s); } });
  let mm = null;
  const wait = lib.rt(M => {
    if (M.reduced) return;
    const { gsap } = M;
    mm = gsap.matchMedia();
    mm.add(lib.wide, () => {
      root.classList.add('is-live');
      // the hold first (refreshPriority 1): it changes the section's height, so every trigger below is measured after it
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, refreshPriority: 1, invalidateOnRefresh: true } });
      panels.forEach((p, i) => gsap.set(p, { zIndex: i + 1, transformOrigin: '50% 0%' }));
      for (let i = 1; i < n; i++) {
        const under = panels.slice(0, i);
        tl.to({}, { duration: 0.35 })                                                       // hold: the panel reads
          .fromTo(panels[i], { y: () => deck.clientHeight + 40 }, { y: i * step, duration: 1, ease: 'power2.inOut' })
          .to(under, { scale: k => 1 - (i - k) * 0.04, duration: 1, ease: 'power2.inOut' }, '<')
          .to(under.map(p => p.querySelector('.mo-sp__shade')), { opacity: k => Math.min(0.6, (i - k) * 0.32), duration: 1 }, '<');
      }
      tl.to({}, { duration: 0.35 });
      lib.refresh();
      return () => { root.classList.remove('is-live'); lib.refresh(); };
    });
  }, { name: 'stacked-panels' });
  return { destroy() { wait.cancel(); if (mm) mm.revert(); } };
}
