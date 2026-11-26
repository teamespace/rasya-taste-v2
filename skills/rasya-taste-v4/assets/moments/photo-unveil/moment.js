/*
  photo-unveil - rasya-taste-v4, ported from rasya-taste-v2 R02 (image mask reveal + scroll drift) and R13 (clip-path
  reveal on enter). One large photograph (or a row of two to six) is uncovered once as it comes on screen: a wipe
  from its foot (a row: from the foot, the left and the right in turn, 0.12 s apart), 1.3 s, while the picture inside
  settles from 1.4 to 1 (a row: 1.25), 1.8 s. A single photograph then drifts 6% against the page as it crosses the
  screen (the only photo parallax a page may hold). It waits for the picture to decode (1.2 s at most), so no empty box
  is ever wiped in. Runs on a phone too (one clip and one transform a picture); reduced motion, no script or GSAP: the
  photographs stand.

    <section class="section" data-moment="photo-unveil">
      <div class="container"> <div class="section-head"><h2>…</h2></div>
        <figure class="mo-pu__frame"><img src="…" alt="…" width="1800" height="1200"></figure>
      </div>
    </section>

  opts: drift true (a single photograph), false turns it off. Runs on the motion layer (lib.rt); never loads GSAP itself.
*/
export const phone = true;
export default function (root, opts, lib) {
  const frames = [...root.querySelectorAll('.mo-pu__frame')].filter(f => f.querySelector('img'));
  if (!frames.length || lib.reduced()) return {};
  let seen = null, drift = null, dead = false;
  const wait = lib.rt(M => {
    if (M.reduced || dead) return;
    const { gsap } = M;
    const one = frames.length === 1, imgs = frames.map(f => f.querySelector('img'));
    const from = ['inset(100% 0% 0% 0%)', 'inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 100%)'];
    // a single photograph drifts: the picture sits in a layer 16% taller than its frame, so the drift never shows an edge
    if (one && opts.drift !== false) {
      const f = frames[0], r = f.getBoundingClientRect();
      if (r.height) f.style.aspectRatio = `${(r.width / r.height).toFixed(4)}`;
      const par = document.createElement('div');
      par.className = 'mo-pu__par';
      imgs[0].replaceWith(par); par.append(imgs[0]);
      f.classList.add('has-drift');
      drift = gsap.fromTo(par, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    gsap.set(frames, { clipPath: i => (one ? from[0] : from[i % 3]) });
    gsap.set(imgs, { scale: one ? 1.4 : 1.25 });
    root.classList.add('is-live');
    const play = () => {
      const ready = Promise.race([Promise.all(imgs.map(im => (im.decode ? im.decode().catch(() => {}) : null))), new Promise(r => setTimeout(r, 1200))]);
      ready.then(() => {
        if (dead) return;
        gsap.to(frames, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', stagger: 0.12 });
        gsap.to(imgs, { scale: 1, duration: 1.8, ease: 'expo.out', stagger: 0.12, delay: 0.2 });
      });
    };
    seen = lib.once(frames[0], play, { threshold: 0.25 });
    lib.refresh();
  }, { name: 'photo-unveil' });
  return { destroy() { dead = true; wait.cancel(); if (seen) seen.destroy(); if (drift) { drift.scrollTrigger?.kill(); drift.kill(); } } };
}
