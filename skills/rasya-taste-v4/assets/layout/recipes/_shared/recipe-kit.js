/*
  rasya-taste-v4 hero recipes, the shared kit (assets/layout/recipes/_shared/recipe-kit.js; references/hero-recipes.md).
  Every recipe.js imports this one file and nothing else of the kit (the globe also reads the print-globe's land outline).

  The mount contract every recipe keeps:
    <div class="rr rr--<id>" data-recipe="<id>" [data-rr-variant=".."] role="img" aria-label="what the picture shows">
      <.. class="rr-still"> the still: an <img> poster, a drawn <svg>, or the recipe's own markup at rest
      .. the recipe's slots (data-rr-slot="<slot>" on each asset element, as index.json names them)
    </div>
    <script type="module" src="assets/layout/recipes/<id>/recipe.js"></script>
  recipe.js mounts every [data-recipe="<id>"] on the page once (el.__rr is its controller: pause, resume, destroy) and
  sets data-rr-state on it: "still" (the still shows), "live" (the live layer drew its first frame and took over),
  "paused" (the visitor paused it), and data-rr-why when it stays still (reduced, phone, other, no-webgl, gl-budget, error).

  Rules it holds for every recipe:
    - WebGL only on site-kind software, gaming and tech; a recipe never makes a context on kind other or a place.
    - three.js loads lazily, once, at the exact pinned version, inside rtMotion.onReady (after Lenis and GSAP are in),
      never before the h1 has painted; a failed load leaves the still.
    - the page's one count of live WebGL contexts is window.__tpGl, capped by window.__tpGlMax (default 4), the same
      count effects/fx.js, the scenes and the objects keep: a recipe takes a slot or stays still.
    - under reduced motion nothing moves by itself; on a phone (under 640px) a WebGL or canvas recipe stays on its still.
    - anything that moves by itself for more than 5 s gets the kit's pause button (system.css .loop-pause).
    - a live layer renders only while it is on screen and the tab is visible; idle 3D renders on demand.
*/

export const THREE_VERSION = '0.170.0';
// jsDelivr's +esm bundles: the addons import "/npm/three@0.170.0/+esm", so core and addons are one module instance
export const THREE_URL = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/+esm`;
export const threeAddon = (p) => `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/${p}/+esm`;

let threeP = null;
const addonP = {};
/* three.js, once a page; resolves to the module namespace */
export function loadThree() {
  if (!threeP) threeP = import(THREE_URL);
  return threeP;
}
/* an addon by its path under examples/jsm (loaders/GLTFLoader.js, environments/RoomEnvironment.js, loaders/SVGLoader.js) */
export function loadAddon(p) {
  if (!addonP[p]) addonP[p] = import(threeAddon(p));
  return addonP[p];
}

/* ------------------------------------------------------------------ the page and the visitor */
export const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
export const phone = () => !!(window.matchMedia && matchMedia('(max-width: 639px)').matches);
export const coarse = () => !!(window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches);
/* the site kind: software, gaming, tech, or other (every other kind, a place included) */
export function siteKind() {
  const m = document.querySelector('meta[name="site-kind"]');
  const v = (m && m.content || '').trim().toLowerCase();
  if (document.documentElement.dataset.type === 'place') return 'other';
  if (['software', 'gaming', 'tech'].includes(v)) return v;
  if (v) return 'other';
  return document.documentElement.dataset.type === 'software' ? 'software' : 'other';
}
export const isTech = () => siteKind() !== 'other';
/* what this recipe may do here: live (draw a moving layer), selfMove (move without the pointer), pointer */
export function allowance({ webgl = false, canvas = false } = {}) {
  const r = reduced(), p = phone(), other = !isTech();
  let why = '';
  if ((webgl || canvas) && other) why = 'other';
  else if (r) why = 'reduced';
  else if ((webgl || canvas) && p) why = 'phone';
  return { live: !why, why, selfMove: !why && !other && !p, pointer: !r && !coarse(), other, reduced: r, phone: p };
}

/* ------------------------------------------------------------------ colours */
let probeCtx = null;
/* any CSS colour (a token, a color-mix) as [r, g, b, a] 0..255, read off one canvas pixel */
export function rgba(css, host = document.documentElement) {
  const el = document.createElement('i');
  el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;color:' + css;
  host.appendChild(el);
  const c = getComputedStyle(el).color;
  el.remove();
  if (!probeCtx) { const cv = document.createElement('canvas'); cv.width = cv.height = 1; probeCtx = cv.getContext('2d', { willReadFrequently: true }); }
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillStyle = '#000';
  probeCtx.fillStyle = c;
  probeCtx.fillRect(0, 0, 1, 1);
  return [...probeCtx.getImageData(0, 0, 1, 1).data];
}
export const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
export const css = (c, a = 1) => `rgb(${c[0]} ${c[1]} ${c[2]} / ${a})`;
export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/* the palette the element sees: --bg, --surface, --ink, --muted, --accent, --accent-ink (as on its ground) */
export function palette(el) {
  const p = {};
  for (const k of ['bg', 'surface', 'ink', 'muted', 'accent', 'accent-ink']) p[k.replace('-i', 'I')] = rgba(`var(--rr-${k}, var(--${k}))`, el);
  p.line = mix(p.bg, p.ink, 0.16);
  return p;
}
/* a three.js Color in the sRGB the page means */
export function threeColor(THREE, c) { return new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace); }

/* ------------------------------------------------------------------ timing */
/* cb once the motion stack is in (rtMotion.onReady), or at window load when the page has no scroll.js; never before
   the first paint. When scroll.js failed (data-rt-scroll="off") the recipe still runs after load: it never needs GSAP */
export function whenReady(cb) {
  let done = false;
  const go = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(() => cb(window.rtMotion || null))); };
  const onLoad = (f) => (document.readyState === 'complete' ? f() : addEventListener('load', f, { once: true }));
  if (window.rtMotion && typeof window.rtMotion.onReady === 'function') {
    window.rtMotion.onReady(go);
    onLoad(() => setTimeout(() => { if (document.documentElement.getAttribute('data-rt-scroll') === 'off') go(); }, 50));
    setTimeout(() => onLoad(go), 9000);   // scroll.js gives up after 8 s: the recipe goes on without it
  } else onLoad(go);
}
/* mount every [data-recipe="id"] once the DOM is parsed; mount(el) returns its controller */
export function mountAll(id, mount) {
  const run = () => document.querySelectorAll(`[data-recipe="${id}"]`).forEach((el) => {
    if (el.__rr) return;
    el.__rr = { pause() {}, resume() {}, destroy() {} };
    if (!el.dataset.rrState) setState(el, 'still');
    try {
      const c = mount(el);
      if (c && typeof c.then === 'function') c.then((x) => { if (x) el.__rr = x; }).catch((e) => fail(el, e));
      else if (c) el.__rr = c;
    } catch (e) { fail(el, e); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
export function setState(el, state, why) {
  el.dataset.rrState = state;
  if (why) el.dataset.rrWhy = why; else if (state === 'live') delete el.dataset.rrWhy;
}
export function fail(el, e) {
  setState(el, 'still', 'error');
  console.error(`[hero recipe ${el.dataset.recipe}]`, e);
}

/* ------------------------------------------------------------------ WebGL */
let glProbe = null;
export function webglOK() {
  if (glProbe === null) {
    try { const g = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); glProbe = !!g; g && g.getExtension('WEBGL_lose_context')?.loseContext(); } catch { glProbe = false; }
  }
  return glProbe;
}
/* take one of the page's live contexts (window.__tpGl, at most window.__tpGlMax, default 4); null when none is left */
export function glSlot() {
  const held = window.__tpGl || 0, max = window.__tpGlMax || 4;
  if (held + 1 > max) return null;
  window.__tpGl = held + 1;
  let freed = false;
  return () => { if (!freed) { freed = true; window.__tpGl = Math.max(0, (window.__tpGl || 1) - 1); } };
}
/* a three.js renderer on a canvas of its own, its context counted; null when WebGL or a slot is missing */
export function makeRenderer(THREE, el, { alpha = true, antialias = true, maxDpr = 1.5 } = {}) {
  if (!webglOK()) return null;
  const release = glSlot();
  if (!release) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha, antialias, powerPreference: 'low-power', preserveDrawingBuffer: false });
  } catch (e) { release(); return null; }
  renderer.setPixelRatio(Math.min(maxDpr, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'rr-live';
  canvas.setAttribute('aria-hidden', 'true');
  el.appendChild(canvas);
  const dispose = () => {
    try { renderer.dispose(); renderer.forceContextLoss(); } catch { /* gone */ }
    canvas.remove();
    release();
  };
  return { renderer, canvas, dispose };
}

/* ------------------------------------------------------------------ the loop, visibility, the pointer */
/* run(dt, t) every frame while on screen and wanted; wake() asks for frames again (an on-demand renderer sleeps
   when run returns false) */
export function loop(el, run, { fps = 60 } = {}) {
  let raf = 0, last = 0, onScreen = true, paused = false, awake = true, t = 0;
  const step = (now) => {
    raf = 0;
    if (!onScreen || paused || document.hidden) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    if (fps < 60 && last && now - last < 1000 / fps - 2) { raf = requestAnimationFrame(step); return; }
    last = now; t += dt;
    awake = run(dt, t) !== false;
    if (awake) raf = requestAnimationFrame(step); else last = 0;
  };
  const kick = () => { if (!raf && onScreen && !paused && !document.hidden) { last = 0; raf = requestAnimationFrame(step); } };
  const io = new IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting); if (onScreen) kick(); }, { rootMargin: '80px' });
  io.observe(el);
  const vis = () => kick();
  document.addEventListener('visibilitychange', vis);
  kick();
  return {
    wake() { awake = true; kick(); },
    pause() { paused = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
    resume() { paused = false; kick(); },
    get paused() { return paused; },
    stop() { if (raf) cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', vis); },
  };
}
/* the pointer over host (default the hero section), as x and y in -1..1 from its centre; cb(x, y, inside) */
export function pointer(el, cb, host) {
  const h = host || el.closest('.hero, .section--hero, section') || el;
  const move = (e) => {
    const r = h.getBoundingClientRect();
    cb(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1, true, e);
  };
  const leave = () => cb(0, 0, false);
  h.addEventListener('pointermove', move, { passive: true });
  h.addEventListener('pointerleave', leave, { passive: true });
  return () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerleave', leave); };
}
export const damp = (cur, target, k, dt) => target + (cur - target) * Math.exp(-k * dt);

/* the kit's pause button (system.css .loop-pause) in the mount's lower right corner */
const ICON_PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2h2.4v10H3.5zM8.1 2h2.4v10H8.1z"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 1.8v10.4L12 7z"/></svg>';
export function pauseButton(el, ctl, what = 'the animation') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'loop-pause rr-pause';
  const paint = (p) => { b.innerHTML = p ? ICON_PLAY : ICON_PAUSE; b.setAttribute('aria-label', (p ? 'Play ' : 'Pause ') + what); b.setAttribute('aria-pressed', String(!!p)); };
  let p = false;
  paint(p);
  b.addEventListener('click', () => {
    p = !p; paint(p);
    if (p) { ctl.pause(); setState(el, 'paused'); } else { ctl.resume(); setState(el, 'live'); }
  });
  el.appendChild(b);
  return b;
}

/* a small seeded random (mulberry32) */
export function rng(seed = 1) {
  let s = (typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* JSON from a data attribute, or the fallback */
export function data(el, key, fallback) {
  const v = el.dataset[key];
  if (v == null || v === '') return fallback;
  try { return JSON.parse(v); } catch { return v; }
}
/* the scroll progress of the hero (0 at the top, 1 when it has left), through ScrollTrigger when it runs */
export function heroScroll(el, cb, motion) {
  const hero = el.closest('.hero, .section--hero, section') || el;
  const M = motion || window.rtMotion;
  if (M && M.ScrollTrigger && !M.reduced) {
    const st = M.ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => cb(s.progress) });
    return () => st.kill();
  }
  if (reduced()) return () => {};
  const f = () => { const r = hero.getBoundingClientRect(); cb(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)))); };
  addEventListener('scroll', f, { passive: true });
  return () => removeEventListener('scroll', f);
}
