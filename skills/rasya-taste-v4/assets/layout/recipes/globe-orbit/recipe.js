/*
  hero recipe: globe-orbit (refs: Wise; references/hero-recipes.md). A globe rising from the hero's foot, drawn live with
  three.js: the sea in the accent, the land as dots (the kit's own coastline, assets/objects/print-globe/land.js), two
  or three routes the product really runs as arcs with a light travelling along them, and up to three cut-out objects
  of the trade (a coin, a parcel, a card: no words on them) orbiting in front. A drag spins it with a little inertia,
  the pointer tips it, it turns slowly by itself on tech (with the kit's pause button).

  <div class="rr rr--globe-orbit" data-recipe="globe-orbit" role="img" aria-label=".."
       data-rr-center="10,20"                               the longitude and latitude that face the visitor at rest
       data-rr-routes='[[-0.1,51.5,72.9,19.1],[13.4,52.5,-74,40.7]]'   lon, lat to lon, lat: routes from the brief
       data-rr-place="rise">                                rise (default: the top of the globe over the fold) | whole
    <div class="rr-still" data-rr-draw></div>               the still: the globe as an SVG, no WebGL
    <img class="rr-go__obj" data-rr-slot="object" src=".." alt="">   up to three; on the still they stand in their slots
  </div>
  WebGL: one context, software and tech (fintech, logistics, travel, networks).
*/
import { loadThree, allowance, palette, threeColor, whenReady, mountAll, setState, makeRenderer, loop, pointer, damp, pauseButton, data, mix, css } from '../_shared/recipe-kit.js';
import { LAND, LAKES } from '../../../objects/print-globe/land.js';

/* ------------------------------------------------------------------ the land as dots */
const boxes = (polys) => polys.map((p) => { let a = 999, b = -999, c = 999, d = -999; for (let i = 0; i < p.length; i += 2) { a = Math.min(a, p[i]); b = Math.max(b, p[i]); c = Math.min(c, p[i + 1]); d = Math.max(d, p[i + 1]); } return { p, a, b, c, d }; });
const LANDB = boxes(LAND), LAKEB = boxes(LAKES || []);
function inPoly(p, x, y) {
  let ins = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) ins = !ins;
  }
  return ins;
}
const inAny = (B, lon, lat) => B.some(({ p, a, b, c, d }) => [lon, lon + 360].some((x) => x >= a && x <= b && lat >= c && lat <= d && inPoly(p, x, lat)));
let DOTS = null;
function landDots(n = 42000) {
  if (DOTS) return DOTS;
  const out = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
    const lat = Math.asin(y) * 180 / Math.PI, lon = ((Math.atan2(Math.sin(t) * r, Math.cos(t) * r) * 180) / Math.PI);
    if (inAny(LANDB, lon, lat) && !inAny(LAKEB, lon, lat)) out.push(lon, lat);
  }
  return (DOTS = out);
}
// lon, lat to a point on the unit sphere (three's axes: y up, the prime meridian toward +z)
const v3 = (lon, lat, r = 1) => { const a = lon * Math.PI / 180, b = lat * Math.PI / 180; return [r * Math.cos(b) * Math.sin(a), r * Math.sin(b), r * Math.cos(b) * Math.cos(a)]; };

/* the frame: the globe's radius in px and its centre */
function frame(w, h, place) {
  if (place === 'whole') { const R = Math.min(w, h) * 0.4; return { R, cx: w / 2, cy: h / 2 }; }
  const R = Math.min(w * 0.34, h * 0.86);
  return { R, cx: w / 2, cy: h + R * 0.12 };
}
const FOV = 30;

/* the still: the facing half of the globe as an SVG */
function drawStill(host, pal, center, routes, place) {
  const b = host.getBoundingClientRect();
  const w = Math.max(300, Math.round(b.width)), h = Math.max(200, Math.round(b.height));
  const { R, cx, cy } = frame(w, h, place);
  const [lon0, lat0] = center;
  const ry = -lon0 * Math.PI / 180, rx = lat0 * Math.PI / 180 * 0.8;
  const rot = ([x, y, z]) => { const x1 = x * Math.cos(ry) + z * Math.sin(ry), z1 = -x * Math.sin(ry) + z * Math.cos(ry); return [x1, y * Math.cos(rx) - z1 * Math.sin(rx), y * Math.sin(rx) + z1 * Math.cos(rx)]; };
  const D = landDots();
  let dots = '';
  for (let i = 0; i < D.length; i += 2) {
    const [x, y, z] = rot(v3(D[i], D[i + 1]));
    if (z < 0.05) continue;
    dots += `M${(cx + x * R).toFixed(1)} ${(cy - y * R).toFixed(1)}h.01`;
  }
  let arcs = '';
  for (const [a1, b1, a2, b2] of routes) {
    let d = '';
    for (let k = 0; k <= 32; k++) {
      const t = k / 32, p = slerp(v3(a1, b1), v3(a2, b2), t), lift = 1 + 0.16 * Math.sin(Math.PI * t);
      const [x, y, z] = rot(p.map((c) => c * lift));
      d += `${k ? 'L' : 'M'}${(cx + x * R).toFixed(1)} ${(cy - y * R).toFixed(1)}`;
      if (z < -0.2) { d = ''; break; }
    }
    arcs += d ? `<path d="${d}" fill="none" stroke="${css(pal.bg, 0.9)}" stroke-width="1.6" stroke-linecap="round"/>` : '';
  }
  host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${R}" fill="${css(pal.accent)}"/><path d="${dots}" stroke="${css(mix(pal.accent, pal.bg, 0.78))}" stroke-width="${Math.max(1.6, R / 240).toFixed(1)}" stroke-linecap="round"/>${arcs}</svg>`;
}
function slerp(a, b, t) {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), o = Math.acos(d), s = Math.sin(o) || 1;
  const k1 = Math.sin((1 - t) * o) / s, k2 = Math.sin(t * o) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

/* ------------------------------------------------------------------ live */
async function live(el, opts) {
  const THREE = await loadThree();
  const r = makeRenderer(THREE, el, { alpha: true, maxDpr: 1.75 });
  if (!r) return setState(el, 'still', (window.__tpGl || 0) >= (window.__tpGlMax || 4) ? 'gl-budget' : 'no-webgl');
  const { renderer, canvas, dispose } = r;
  canvas.setAttribute('data-rr-input', '');
  const pal = palette(el), C = (c) => threeColor(THREE, c);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, C(mix(pal.accent, pal.ink, 0.6)), 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-2, 3, 4); scene.add(key);
  const globe = new THREE.Group(), spin = new THREE.Group();
  scene.add(globe); globe.add(spin);
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshLambertMaterial({ color: C(pal.accent) })));
  const D = landDots(), pos = new Float32Array((D.length / 2) * 3);
  for (let i = 0, k = 0; i < D.length; i += 2, k += 3) pos.set(v3(D[i], D[i + 1], 1.004), k);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dotMat = new THREE.PointsMaterial({ color: C(mix(pal.accent, pal.bg, 0.78)), size: 1.9, sizeAttenuation: false });
  spin.add(new THREE.Points(dg, dotMat));
  // the routes: a lifted arc each, a light travelling along it
  const travellers = [];
  for (const [a1, b1, a2, b2] of opts.routes) {
    const pts = [];
    for (let k = 0; k <= 64; k++) { const t = k / 64, lift = 1 + 0.16 * Math.sin(Math.PI * t); pts.push(new THREE.Vector3(...slerp(v3(a1, b1), v3(a2, b2), t).map((c) => c * lift))); }
    spin.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: C(pal.bg), transparent: true, opacity: 0.85 })));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 8), new THREE.MeshBasicMaterial({ color: C(pal.bg) }));
    spin.add(dot);
    travellers.push({ pts, dot, t: Math.random() });
  }
  // the objects: sprites on their own orbits in front of the globe
  const objs = [...el.querySelectorAll('img.rr-go__obj')].slice(0, 3);
  const sprites = [];
  await Promise.all(objs.map((img, i) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })).then(() => {
    if (!img.naturalWidth) return;
    const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    s.renderOrder = 5;
    const k = 0.34 - i * 0.04; s.scale.set(k, k * img.naturalHeight / img.naturalWidth, 1);
    globe.add(s);
    sprites.push({ s, r: 1.34 + i * 0.06, ph: [1.0, 2.2, 1.6][i] || i, sp: 0.09 - i * 0.02, lift: [0.6, 0.66, 0.85][i] || 0.6 });
  })));

  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  let w = 0, h = 0;
  const size = () => {
    const b = el.getBoundingClientRect(); w = Math.max(1, b.width); h = Math.max(1, b.height);
    renderer.setSize(w, h, false);
    const { R, cx, cy } = frame(w, h, opts.place);
    const f = (h / 2) / Math.tan((FOV / 2) * Math.PI / 180);
    cam.aspect = w / h;
    cam.position.set(0, 0, Math.sqrt(1 + (f / R) ** 2));
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(w, h, -(cx - w / 2), -(cy - h / 2), w, h);
    cam.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(() => { size(); L.wake(); });
  ro.observe(el);
  const [lon0, lat0] = opts.center;
  let rotY = -lon0 * Math.PI / 180, vel = 0, tilt = lat0 * Math.PI / 180 * 0.8, tTilt = tilt, drag = null, lastX = 0;
  const baseTilt = tilt;
  const stopPtr = opts.pointer ? pointer(el, (x, y, inside) => { tTilt = baseTilt + (inside ? y * 0.12 : 0); L.wake(); }) : () => {};
  canvas.addEventListener('pointerdown', (e) => { drag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); L.wake(); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const d = (e.clientX - lastX) / Math.max(1, w) * 4; rotY += d; vel = d * 40; lastX = e.clientX; L.wake(); });
  canvas.addEventListener('pointerup', () => { drag = false; });
  let first = true, held = false;
  const L = loop(el, (dt, t) => {
    if (!drag) { rotY += vel * dt + (opts.selfMove && !held ? 0.05 * dt : 0); vel = damp(vel, 0, 2.2, dt); }
    tilt = damp(tilt, tTilt, 3, dt);
    spin.rotation.y = rotY;
    globe.rotation.x = tilt;
    for (const tr of travellers) { tr.t = (tr.t + dt / 3.2) % 1; const i = tr.t * (tr.pts.length - 1), a = tr.pts[Math.floor(i)], b = tr.pts[Math.min(tr.pts.length - 1, Math.floor(i) + 1)]; tr.dot.position.lerpVectors(a, b, i % 1); }
    // the objects swing on arcs in front of the upper globe, never behind it
    for (const o of sprites) { const a = o.ph + Math.sin(t * o.sp * (opts.selfMove ? 1 : 0)) * 0.35; const x = Math.cos(a), y = o.lift + Math.sin(a * 2) * 0.06, z = 0.55 + Math.sin(a) * 0.25; const k = o.r / Math.hypot(x, y, z); o.s.position.set(x * k, y * k, z * k); }
    renderer.render(scene, cam);
    if (first) { first = false; setState(el, 'live'); }
    return opts.selfMove || drag || Math.abs(vel) > 0.0005 || Math.abs(tilt - tTilt) > 0.0005;
  }, { fps: 50 });
  if (opts.selfMove) pauseButton(el, { pause() { held = true; L.pause(); }, resume() { held = false; L.resume(); } }, 'the globe');
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); ro.disconnect(); stopPtr(); dispose(); setState(el, 'still'); } };
}

mountAll('globe-orbit', (el) => {
  const center = String(el.dataset.rrCenter || '10,25').split(',').map(Number);
  const routes = data(el, 'rrRoutes', [[-0.1, 51.5, 72.9, 19.1], [13.4, 52.5, -74, 40.7], [2.35, 48.86, 18.4, -33.9]]);
  const place = el.dataset.rrPlace === 'whole' ? 'whole' : 'rise';
  const still = el.querySelector('.rr-still[data-rr-draw]');
  if (still) {
    const draw = () => drawStill(still, palette(el), center, routes, place);
    draw();
    new ResizeObserver(() => { if (el.dataset.rrState !== 'live') draw(); }).observe(el);
  }
  const a = allowance({ webgl: true });
  if (!a.live) { setState(el, 'still', a.why); return null; }
  let ctl = null;
  whenReady(() => live(el, { center, routes, place, pointer: a.pointer, selfMove: a.selfMove }).then((c) => { if (c) { ctl = c; el.__rr = c; } }).catch((e) => { setState(el, 'still', 'error'); console.error('[hero recipe globe-orbit]', e); }));
  return { pause: () => ctl && ctl.pause(), resume: () => ctl && ctl.resume(), destroy: () => ctl && ctl.destroy() };
});
