/*
  hero recipe: massing-model (refs: Arcol, Intrepid; references/hero-recipes.md). An isometric massing model drawn live with
  three.js: a seeded city block of plain context boxes in the page's light greys, and in its middle the client's
  building as stacked floor plates in the accent. The floors rise once on load; a drag turns the model about its
  middle (40 degrees each way); the pointer over a floor lights it and the readout card in the recipe's slot shows
  that floor; the model pulls back a little as the hero scrolls away. It renders on demand.

  <div class="rr rr--massing-model" data-recipe="massing-model" role="img" aria-label=".."
       data-rr-floors='[{"label":"Ground floor","value":"1,260 m²","use":"Shops"}, ...]'  one entry a floor, lowest first
       data-rr-seed="7">                                                           the city around it
    <div class="rr-still" data-rr-draw></div>                                        the still: the same model as an SVG
    <div class="rr-mm__card">..the total, as the HTML reads at rest..</div>          the readout, in its slot
  </div>
  data-rr-shape   court (default: a block round a courtyard) | bar | tower
  Colours: --bg, --surface, --ink, --accent. WebGL: one context, software and tech only.
*/
import { loadThree, allowance, palette, threeColor, whenReady, mountAll, setState, makeRenderer, loop, damp, heroScroll, rng, data, mix, css } from '../_shared/recipe-kit.js';

/* ------------------------------------------------------------------ the model: boxes [x, z, w, d, h, y0, kind, floor] */
function model(seed, shape, floors) {
  const R = rng(seed);
  const boxes = [];
  const N = 6, LOT = 1, ST = 0.34, P = LOT + ST, FRAME = 4;   // the city runs past the frame; the frame fits 9 lots
  for (let gx = -N; gx <= N; gx++) for (let gz = -N; gz <= N; gz++) {
    if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue;          // the site
    const cx = gx * P, cz = gz * P;
    const far = Math.min(1, Math.hypot(gx, gz) / (FRAME * 1.42));
    const parts = 1 + Math.floor(R() * 3);
    for (let k = 0; k < parts; k++) {
      const w = parts === 1 ? LOT : LOT * (0.42 + R() * 0.12), d = parts === 1 ? LOT * (0.6 + R() * 0.4) : LOT * (0.45 + R() * 0.5);
      const x = cx + (parts === 1 ? 0 : (k % 2 ? 1 : -1) * (LOT - w) / 2), z = cz + (parts === 1 ? (LOT - d) / 2 * (R() > 0.5 ? 1 : -1) : (k > 1 ? 1 : -1) * (LOT - d) / 2);
      const h = (0.18 + R() ** 2 * 1.5) * (1.1 - far * 0.5);
      boxes.push([x, z, w, d, h, 0, 'ctx', -1]);
    }
  }
  const n = Math.max(3, floors.length || 8), fh = 0.2, gap = 0.028;
  const S = 3 * P - ST;                                               // the site's side
  for (let f = 0; f < n; f++) {
    const y0 = f * fh;
    const h = fh - gap;
    if (shape === 'tower') {
      const s = S * 0.42 * (f > n * 0.7 ? 0.86 : 1);
      boxes.push([0, 0, s, s, h, y0, 'floor', f]);
    } else if (shape === 'bar') {
      boxes.push([0, 0, S * 0.92, S * 0.36, h, y0, 'floor', f]);
    } else {
      const W = S * 0.94, D = S * 0.8, t = S * 0.26;
      const step = f >= n - 2 ? 0.12 : 0;                             // the top floors set back
      boxes.push([0, -D / 2 + t / 2 + step, W - step * 2, t, h, y0, 'floor', f]);
      boxes.push([0, D / 2 - t / 2 - step, W - step * 2, t, h, y0, 'floor', f]);
      boxes.push([-W / 2 + t / 2 + step, 0, t, D - 2 * t - step * 2, h, y0, 'floor', f]);
      if (f < n - 2) boxes.push([W / 2 - t / 2, 0, t, D - 2 * t, h, y0, 'floor', f]);
    }
  }
  return { boxes, floors: n, fh, extent: (2 * FRAME + 1) * P, city: (2 * N + 1) * P };
}
const AZ = Math.PI / 4, EL = 0.6;   // the iso view: 45 degrees round, 34 up

/* the still: the same model as an SVG, faces shaded, painted back to front */
function drawStill(host, el, m, pal) {
  const r = host.getBoundingClientRect();
  const W = Math.max(320, Math.round(r.width)), H = Math.max(240, Math.round(r.height));
  const ca = Math.cos(AZ), sa = Math.sin(AZ), ce = Math.cos(EL), se = Math.sin(EL);
  const pr = (x, y, z) => { const xr = x * ca - z * sa, zr = x * sa + z * ca; return [xr, -(y * ce - zr * se), zr * ce + y * se]; };
  const k = (Math.min(W / (m.extent * 1.02), H / (m.extent * 0.72))) * 1.08;
  const ox = W / 2, oy = H * 0.5;
  const shade = (c, t) => css(mix(c, pal.ink, t));
  const ctxTop = mix(pal.bg, pal.ink, 0.035), floorTop = pal.accent, floorMid = mix(pal.accent, pal.surface, 0.55);
  const polys = [];
  for (const [x, z, w, d, h, y0, kind, f] of m.boxes) {
    const top = kind === 'floor' ? (f < 2 ? floorTop : floorMid) : ctxTop;
    const c = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]];
    const depth = pr(x, y0 + h / 2, z)[2];
    const face = (pts, fill) => polys.push({ depth, d: pts.map(([px, py, pz], i) => { const q = pr(px, py, pz); return `${i ? 'L' : 'M'}${(ox + q[0] * k).toFixed(1)} ${(oy + q[1] * k).toFixed(1)}`; }).join('') + 'Z', fill, edge: kind === 'floor' });
    const y1 = y0 + h;
    // the camera stands at +x +z (AZ): the faces toward +z and +x show
    face([[c[3][0], y0, c[3][1]], [c[2][0], y0, c[2][1]], [c[2][0], y1, c[2][1]], [c[3][0], y1, c[3][1]]], shade(top, 0.1));
    face([[c[1][0], y0, c[1][1]], [c[2][0], y0, c[2][1]], [c[2][0], y1, c[2][1]], [c[1][0], y1, c[1][1]]], shade(top, 0.2));
    face(c.map(([px, pz]) => [px, y1, pz]), css(top));
  }
  polys.sort((a, b) => a.depth - b.depth);   // the farthest first
  const line = css(mix(pal.bg, pal.ink, 0.3));
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">${polys.map((p) => `<path d="${p.d}" fill="${p.fill}" stroke="${p.edge ? css(mix(pal.accent, pal.ink, 0.45)) : line}" stroke-width=".6" stroke-linejoin="round"/>`).join('')}</svg>`;
}

/* ------------------------------------------------------------------ live */
async function live(el, m, opts, motion) {
  const THREE = await loadThree();
  const r = makeRenderer(THREE, el, { alpha: true });
  if (!r) return setState(el, 'still', (window.__tpGl || 0) >= (window.__tpGlMax || 4) ? 'gl-budget' : 'no-webgl');
  const { renderer, canvas, dispose } = r;
  canvas.setAttribute('data-rr-input', '');
  const pal = palette(el);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, threeColor(THREE, mix(pal.bg, pal.ink, 0.2)), 1.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(-3, 6, 4);
  scene.add(sun);
  const C = (c) => threeColor(THREE, c);
  const ctxMat = new THREE.MeshLambertMaterial({ color: C(mix(pal.bg, pal.ink, 0.02)) });
  const lowMat = new THREE.MeshLambertMaterial({ color: C(pal.accent) });
  const midMat = new THREE.MeshLambertMaterial({ color: C(mix(pal.accent, pal.surface, 0.55)) });
  const hotMat = new THREE.MeshLambertMaterial({ color: C(mix(pal.accent, pal.ink, 0.25)) });
  const edgeCtx = new THREE.LineBasicMaterial({ color: C(mix(pal.bg, pal.ink, 0.32)) });
  const edgeFloor = new THREE.LineBasicMaterial({ color: C(mix(pal.accent, pal.ink, 0.45)) });
  const unit = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const unitEdges = new THREE.EdgesGeometry(unit);
  const root = new THREE.Group();
  scene.add(root);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(m.city * 1.4, m.city * 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C(mix(pal.bg, pal.ink, 0.05)) }));
  root.add(ground);
  const floors = [];
  for (const [x, z, w, d, h, y0, kind, f] of m.boxes) {
    const g = new THREE.Group();
    g.position.set(x, y0, z);
    const mesh = new THREE.Mesh(unit, kind === 'floor' ? (f < 2 ? lowMat : midMat) : ctxMat);
    mesh.scale.set(w, h, d);
    const edges = new THREE.LineSegments(unitEdges, kind === 'floor' ? edgeFloor : edgeCtx);
    edges.scale.copy(mesh.scale);
    g.add(mesh, edges);
    root.add(g);
    if (kind === 'floor') { mesh.userData.floor = f; mesh.userData.base = mesh.material; floors.push({ g, mesh, f }); }
  }
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
  let w = 0, h = 0, zoom = 1, az = AZ, tAz = AZ, pull = 0;
  const place = () => {
    const ce = Math.cos(EL), se = Math.sin(EL), dist = 20;
    cam.position.set(Math.sin(az) * ce * dist, se * dist, Math.cos(az) * ce * dist);
    cam.lookAt(0, 0.35, 0);
    const k = Math.min(w / (m.extent * 1.02), h / (m.extent * 0.72)) * 1.08 * zoom * (1 - pull * 0.12);
    cam.left = -w / 2 / k; cam.right = w / 2 / k; cam.top = h / 2 / k; cam.bottom = -h / 2 / k;
    cam.updateProjectionMatrix();
  };
  const size = () => { const b = el.getBoundingClientRect(); w = Math.max(1, b.width); h = Math.max(1, b.height); renderer.setSize(w, h, false); place(); };
  size();
  const ro = new ResizeObserver(() => { size(); L.wake(); });
  ro.observe(el);

  // the readout: the floor under the pointer, else the total the HTML wrote
  const card = el.querySelector('.rr-mm__card');
  const rest = card ? card.innerHTML : '';
  const list = data(el, 'rrFloors', []);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hot = -1, drag = null;
  const show = (f) => {
    if (f === hot) return;
    hot = f;
    for (const fl of floors) fl.mesh.material = fl.f === f ? hotMat : fl.mesh.userData.base;
    if (card) {
      const it = list[f];
      card.innerHTML = f >= 0 && it ? `<span class="rr-mono rr-mm__k">${it.label || 'Level ' + f}</span><strong class="rr-mm__v">${it.value || ''}</strong>${it.use ? `<span class="rr-mm__u">${it.use}</span>` : ''}` : rest;
    }
    L.wake();
  };
  const onMove = (e) => {
    const b = canvas.getBoundingClientRect();
    if (drag) { tAz = Math.max(AZ - 0.7, Math.min(AZ + 0.7, drag.az + (e.clientX - drag.x) / b.width * 2.2)); L.wake(); return; }
    if (!opts.pointer) return;
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(floors.map((x) => x.mesh), false)[0];
    show(hit ? hit.object.userData.floor : -1);
  };
  const onDown = (e) => { drag = { x: e.clientX, az: tAz }; canvas.setPointerCapture(e.pointerId); };
  const onUp = () => { drag = null; };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', () => { if (!drag) show(-1); });
  const stopScroll = heroScroll(el, (p) => { pull = p; L.wake(); }, motion);

  let grow = opts.grow ? 0 : 1, first = true;
  const L = loop(el, (dt) => {
    if (grow < 1) grow = Math.min(1, grow + dt / 1.6);
    for (const fl of floors) {
      const t = Math.min(1, Math.max(0, grow * (m.floors + 2) - fl.f) / 2);
      fl.g.scale.y = 1 - (1 - t) ** 3;
      fl.g.visible = t > 0;
    }
    az = damp(az, tAz, 6, dt);
    place();
    renderer.render(scene, cam);
    if (first) { first = false; setState(el, 'live'); }
    return grow < 1 || Math.abs(az - tAz) > 0.0005;
  });
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); ro.disconnect(); stopScroll(); dispose(); setState(el, 'still'); } };
}

mountAll('massing-model', (el) => {
  const shape = ['bar', 'tower'].includes(el.dataset.rrShape) ? el.dataset.rrShape : 'court';
  const m = model(Number(el.dataset.rrSeed) || 7, shape, data(el, 'rrFloors', []));
  const still = el.querySelector('.rr-still[data-rr-draw]');
  if (still) {
    const draw = () => drawStill(still, el, m, palette(el));
    draw();
    new ResizeObserver(() => { if (el.dataset.rrState !== 'live') draw(); }).observe(el);
  }
  const a = allowance({ webgl: true });
  if (!a.live) { setState(el, 'still', a.why); return null; }
  let ctl = null;
  whenReady((motion) => live(el, m, { pointer: a.pointer, grow: true }, motion).then((c) => { if (c) { ctl = c; el.__rr = c; } }).catch((e) => { setState(el, 'still', 'error'); console.error('[hero recipe massing-model]', e); }));
  return { pause: () => ctl && ctl.pause(), resume: () => ctl && ctl.resume(), destroy: () => ctl && ctl.destroy() };
});
