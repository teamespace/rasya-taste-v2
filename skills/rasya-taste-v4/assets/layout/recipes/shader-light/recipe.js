/*
  hero recipe: shader-light (refs: Raycast, Reflect, Lovable, ElevenLabs; references/hero-recipes.md). An abstract light
  as the hero's layer, from the kit's own focal effects (assets/effects): soft bars of light (soft-light-bars, Raycast),
  a ring or orb of light rising from the foot (orb-sphere, Reflect), a beam (spotlight-cone), curtains (aurora-curtains,
  dark pages) or rays (god-rays, dark pages). The light is the page's one effect: system.js mounts it like every hero
  ground (live in the hero, its pause button, a still under reduced motion, baked on a phone, its CSS picture without
  WebGL). This recipe adds the composition and the pointer: the light is drawn 24px past the hero on each side and
  leans up to 14px toward the pointer; the words keep the calm part the effect is told about (calmX, calmY).

  <div class="rr rr--shader-light rr--layer" data-recipe="shader-light" role="img" aria-label=".."
       data-fx="soft-light-bars" data-fx-seed="4" data-fx-params='{"calmX":0.5,"calmY":0.42}'></div>
  data-rr-variant  bars | ring | beam | curtains | rays (the dealer prints the matching data-fx id)
  Software only: an effect never stands where a product, a device or a game's world should be (effects-usage.md).
*/
import { allowance, mountAll, setState, loop, pointer, damp } from '../_shared/recipe-kit.js';

mountAll('shader-light', (el) => {
  const a = allowance({ webgl: true });
  if (!el.dataset.fx) console.warn('[hero recipe shader-light] the mount has no data-fx: write the effect id the dealer printed');
  if (!a.live) { setState(el, 'still', a.why); return null; }
  // the effect's canvas arrives when system.js has mounted it; the recipe follows it
  let px = 0, py = 0, tx = 0, ty = 0, canvas = null;
  const find = () => (canvas = canvas || el.querySelector(':scope > canvas'));
  const mo = new MutationObserver(() => { if (find()) { setState(el, 'live'); mo.disconnect(); } });
  mo.observe(el, { childList: true });
  if (find()) setState(el, 'live');
  const stop = a.pointer ? pointer(el, (x, y, inside) => { tx = inside ? x : 0; ty = inside ? y : 0; L.wake(); }) : () => {};
  const L = loop(el, (dt) => {
    px = damp(px, tx, 2.5, dt); py = damp(py, ty, 2.5, dt);
    if (find()) canvas.style.translate = `${(px * 14).toFixed(2)}px ${(py * 10).toFixed(2)}px`;
    return Math.abs(px - tx) + Math.abs(py - ty) > 0.002;
  });
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); stop(); mo.disconnect(); } };
});
