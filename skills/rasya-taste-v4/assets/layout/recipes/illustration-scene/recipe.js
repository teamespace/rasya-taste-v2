/*
  hero recipe: illustration-scene (refs: Family, Clay, Twin; references/hero-recipes.md). The hero's layer: two
  illustrated clusters (characters and objects of the product's world, one transparent picture each) flank the centred
  words, and up to four small pieces stand in a row under the buttons. Each piece pops in once on load; the pointer
  shifts the clusters and the pieces by their depth; a piece under the pointer hops. Nothing moves by itself after
  the entrance, so it serves every kind but a place (an illustration is drawn, never passed off as a photograph).

  <div class="rr rr--illustration-scene rr--layer" data-recipe="illustration-scene" role="img" aria-label="..">
    <img class="rr-is__cluster rr-is__cluster--l" data-rr-slot="cluster" src=".." alt="">
    <img class="rr-is__cluster rr-is__cluster--r" data-rr-slot="cluster" src=".." alt="">
    <img class="rr-is__piece" data-rr-slot="piece" src=".." alt="">   up to four
  </div>
  The still is the markup itself: every piece in its declared slot (recipe.css).
*/
import { allowance, mountAll, setState, loop, pointer, damp } from '../_shared/recipe-kit.js';

mountAll('illustration-scene', (el) => {
  const parts = [...el.querySelectorAll('.rr-is__cluster, .rr-is__piece')];
  const a = allowance();
  setState(el, 'still', a.why || undefined);
  if (!a.reduced) el.classList.add('is-entering');
  setTimeout(() => el.classList.remove('is-entering'), 1600);
  if (!a.pointer || !parts.length) return null;
  const depth = parts.map((p) => Number(p.dataset.rrDepth) || (p.classList.contains('rr-is__piece') ? 1 : 0.45));
  let px = 0, py = 0, tx = 0, ty = 0;
  const stop = pointer(el, (x, y, inside, e) => {
    tx = inside ? x : 0; ty = inside ? y : 0;
    if (e) for (const p of parts) {
      if (!p.classList.contains('rr-is__piece')) continue;
      const r = p.getBoundingClientRect();
      p.classList.toggle('is-hop', e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
    } else parts.forEach((p) => p.classList.remove('is-hop'));
    L.wake();
  });
  const L = loop(el, (dt) => {
    px = damp(px, tx, 4, dt); py = damp(py, ty, 4, dt);
    parts.forEach((p, i) => { p.style.setProperty('--dx', (px * -16 * depth[i]).toFixed(2) + 'px'); p.style.setProperty('--dy', (py * -10 * depth[i]).toFixed(2) + 'px'); });
    return Math.abs(px - tx) + Math.abs(py - ty) > 0.002;
  });
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); stop(); } };
});
