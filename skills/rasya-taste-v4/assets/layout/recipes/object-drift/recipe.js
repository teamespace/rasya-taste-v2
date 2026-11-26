/*
  hero recipe: object-drift (refs: Cosmos, Flora; references/hero-recipes.md). The hero's layer: a field of cut-out objects
  (the things the product finds, sells or makes) round the centred words. On software, gaming and tech the field drifts
  slowly toward the visitor in CSS 3D (translate only, nothing turns) and the pointer steers where it comes from; a
  piece that reaches the front fades and comes back from the far end of its own slot. On every other kind, under
  reduced motion and on a phone the pieces rest in their declared slots, and on kind other the pointer moves them a few
  pixels by their depth (nothing moves by itself). No canvas, no WebGL.

  <div class="rr rr--object-drift rr--layer" data-recipe="object-drift" role="img" aria-label="..">
    <ul class="rr-od__field">
      <li class="rr-od__item"><img data-rr-slot="object" src=".." alt=""></li>   12 to 18, the recipe's slots place them
      (a photograph rather than a cut-out: li.rr-od__item.rr-od__item--tile)
    </ul>
  </div>
  data-rr-speed   px a second toward the visitor (default 36; tech only)
*/
import { allowance, mountAll, setState, loop, pointer, damp, pauseButton } from '../_shared/recipe-kit.js';

const NEAR = 260, FAR = -760;

mountAll('object-drift', (el) => {
  const items = [...el.querySelectorAll('.rr-od__item')];
  const a = allowance();
  if (!items.length) return null;
  const rest = items.map((it) => parseFloat(getComputedStyle(it).getPropertyValue('--z')) || 0);
  const depth = rest.map((z) => (z - FAR) / (NEAR - FAR));   // 0 far .. 1 near
  let px = 0, py = 0, tx = 0, ty = 0;
  const stopPtr = a.pointer ? pointer(el, (x, y, inside) => { tx = inside ? x : 0; ty = inside ? y : 0; L && L.wake(); }) : () => {};

  if (!a.selfMove) {
    // at rest in the slots; on a desktop pointer the pieces shift by their depth (kind other: the pointer only)
    if (!a.pointer) { setState(el, 'still', a.why || 'other'); return null; }
    setState(el, 'still', a.why || 'other');
    var L = loop(el, (dt) => {
      px = damp(px, tx, 5, dt); py = damp(py, ty, 5, dt);
      items.forEach((it, i) => { it.style.setProperty('--dx', (px * -14 * (0.35 + depth[i])).toFixed(2) + 'px'); it.style.setProperty('--dy', (py * -10 * (0.35 + depth[i])).toFixed(2) + 'px'); });
      return Math.abs(px - tx) > 0.001 || Math.abs(py - ty) > 0.001;
    });
    return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); stopPtr(); } };
  }

  const speed = Number(el.dataset.rrSpeed) || 36;
  const z = rest.slice();
  setState(el, 'live');
  var L = loop(el, (dt) => {
    px = damp(px, tx, 3, dt); py = damp(py, ty, 3, dt);
    el.style.perspectiveOrigin = `${(50 + px * 7).toFixed(2)}% ${(46 + py * 6).toFixed(2)}%`;
    items.forEach((it, i) => {
      if (it.offsetParent === null) return;
      z[i] += speed * dt;
      if (z[i] > NEAR) z[i] = FAR;
      const fadeIn = Math.min(1, (z[i] - FAR) / 220), fadeOut = Math.min(1, (NEAR - z[i]) / 160);
      it.style.setProperty('--z', z[i].toFixed(1) + 'px');
      it.style.opacity = Math.max(0, Math.min(fadeIn, fadeOut)).toFixed(3);
    });
    return true;
  }, { fps: 50 });
  pauseButton(el, L, 'the drifting objects');
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); stopPtr(); items.forEach((it, i) => { it.style.setProperty('--z', rest[i] + 'px'); it.style.opacity = ''; }); setState(el, 'still'); } };
});
