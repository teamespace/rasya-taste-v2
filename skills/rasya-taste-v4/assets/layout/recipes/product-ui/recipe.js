/*
  hero recipe: product-ui (refs: Linear, Stacks, Attio, Polar; references/hero-recipes.md). The client's own product
  window as live HTML (a fragment from assets/ui rewritten to its names, or its own screens), in one of three framings.
  It is ONE recipe among the hero library: the dealer keeps it to about one page in five.
    cropped  the window large, 64px in from the frame's left and top, cut by its right and bottom (the collage's slot):
             the work in its top left, nothing moves but the window's own steps (data-ly-steps, layout.js)
    zoomed   one region of the window at 1.6x (data-rr-focus="x% y%": the row worked on, the diff, the total), the
             whole window coming into view as the hero scrolls away; under reduced motion it stays on the region
    angled   the window lies back 24 degrees in the frame and stands up once on load (1.1 s), then rests flat
             (house rule 5: nothing tilts at rest; layout-v4.md rule 7)
  <div class="rr rr--product-ui" data-recipe="product-ui" data-rr-variant="cropped|zoomed|angled" role="img" aria-label="..">
    <div class="rr-pu__win ly-piece d-win" aria-hidden="true">..the window..</div>
  </div>
  The still is the window itself at rest (cropped and angled: flat in its slot; zoomed: on its region).
*/
import { allowance, mountAll, setState, heroScroll, whenReady } from '../_shared/recipe-kit.js';

mountAll('product-ui', (el) => {
  const win = el.querySelector('.rr-pu__win');
  const v = el.dataset.rrVariant || 'cropped';
  const a = allowance();
  if (!win) return null;
  if (v === 'zoomed') {
    const [fx, fy] = String(el.dataset.rrFocus || '30% 30%').split(/\s+/);
    win.style.transformOrigin = `${fx} ${fy || '30%'}`;
    const z = Number(el.dataset.rrZoom) || 1.6;
    win.style.setProperty('--rr-zoom', z);
    if (a.reduced) { setState(el, 'still', 'reduced'); return null; }
    let stop = () => {};
    whenReady((m) => { stop = heroScroll(el, (p) => win.style.setProperty('--rr-zoom', (z - (z - 1) * Math.min(1, p * 1.6)).toFixed(4)), m); setState(el, 'live'); });
    return { pause() {}, resume() {}, destroy() { stop(); } };
  }
  if (v === 'angled') {
    if (a.reduced) { setState(el, 'still', 'reduced'); return null; }
    el.classList.add('is-lying');
    whenReady(() => { requestAnimationFrame(() => { el.classList.remove('is-lying'); el.classList.add('is-standing'); setState(el, 'live'); }); });
    return null;
  }
  setState(el, 'still');
  return null;
});
