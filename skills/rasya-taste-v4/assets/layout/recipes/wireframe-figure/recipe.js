/*
  hero recipe: wireframe-figure (refs: Yellow3D; references/hero-recipes.md). A wireframe or point-cloud figure drawn
  live with three.js on the hero's dark ground: a procedural bust (no model file, no licence) built from a profile of
  rings, or the client's own low-poly model (data-rr-src, a .glb they own or a CC0 one credited in NOTICE.md).
  It turns its head to the pointer, reveals itself top to bottom once, lowers its gaze as the hero scrolls away and
  otherwise rests (it renders on demand: no frame is drawn while nothing moves).

  <div class="rr rr--wireframe-figure" data-recipe="wireframe-figure" role="img" aria-label="..">
    <div class="rr-still" data-rr-draw></div>          the still: recipe.js draws the same figure as an SVG, no WebGL
  </div>
  data-rr-variant  lines (default) | points
  data-rr-shape    bust (default) | model (data-rr-src="assets/img/recipes/figure.glb", data-rr-slot="figure" on the mount)
  data-rr-place    auto (default: right of centre in a wide frame, centred in a tall one) | centre | right
  data-rr-scroll   on (default) | off: the gaze follows the hero's scroll
  Colours: --accent (the lines), --bg (the ground that hides the back lines). WebGL: one context, software, gaming, tech.
*/
import { loadThree, loadAddon, allowance, palette, threeColor, whenReady, mountAll, setState, makeRenderer, loop, pointer, damp, heroScroll, css } from '../_shared/recipe-kit.js';

/* ------------------------------------------------------------------ the bust: a profile of rings, then the face */
// v (0 crown .. 1 chest), y, rx (half width), rz (half depth), zc (forward offset), n (cross-section squareness)
const PROFILE = [
  [0.00, 1.00, 0.00, 0.00, 0.00, 2.0],
  [0.04, 0.98, 0.17, 0.20, 0.00, 2.0],
  [0.10, 0.92, 0.30, 0.35, 0.00, 2.0],
  [0.17, 0.82, 0.38, 0.45, 0.01, 2.0],
  [0.25, 0.67, 0.445, 0.52, 0.02, 2.0],
  [0.33, 0.50, 0.45, 0.53, 0.03, 2.1],
  [0.41, 0.34, 0.415, 0.50, 0.045, 2.2],
  [0.49, 0.18, 0.39, 0.465, 0.055, 2.2],
  [0.56, 0.03, 0.345, 0.41, 0.065, 2.1],
  [0.62, -0.09, 0.26, 0.33, 0.055, 2.0],
  [0.665, -0.17, 0.19, 0.22, -0.01, 2.0],
  [0.71, -0.30, 0.19, 0.205, -0.04, 2.0],
  [0.75, -0.42, 0.24, 0.225, -0.05, 2.1],
  [0.79, -0.49, 0.46, 0.28, -0.05, 2.5],
  [0.84, -0.56, 0.78, 0.36, -0.05, 2.8],
  [0.89, -0.66, 0.95, 0.41, -0.04, 3.0],
  [0.94, -0.86, 1.02, 0.44, -0.03, 3.0],
  [1.00, -1.45, 1.04, 0.45, -0.03, 3.0],
];
const G = (a, m, s) => Math.exp(-(((a - m) / s) ** 2));
function cr(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); }
function profileAt(v) {
  let i = 0;
  while (i < PROFILE.length - 2 && PROFILE[i + 1][0] < v) i++;
  const a = PROFILE[Math.max(0, i - 1)], b = PROFILE[i], c = PROFILE[i + 1], d = PROFILE[Math.min(PROFILE.length - 1, i + 2)];
  const t = (v - b[0]) / (c[0] - b[0] || 1);
  const out = [];
  for (let k = 1; k < 6; k++) out.push(cr(a[k], b[k], c[k], d[k], t));
  out[1] = Math.max(0, out[1]); out[2] = Math.max(0, out[2]);
  return out; // y, rx, rz, zc, n
}
/* the rest pose: nv rows by nu columns of points (x, y, z) */
export function bust(nu = 72, nv = 64) {
  const P = new Float32Array((nv + 1) * nu * 3);
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const [y, rx, rz, zc, n] = profileAt(v);
    const e = 2 / n;
    for (let i = 0; i < nu; i++) {
      const u = (i / nu) * Math.PI * 2 - Math.PI / 2; // i = 0 at the back, the face at i = nu / 2
      const cu = Math.cos(u), su = Math.sin(u);
      let x = rx * Math.sign(cu) * Math.abs(cu) ** e;
      if (y > -0.15 && y < 0.6) x *= 1 - 0.1 * Math.max(0, su) ** 2;   // the face narrower than the skull behind it
      let z = zc + rz * Math.sign(su) * Math.abs(su) ** e;
      const front = Math.max(0, su) ** 4;
      if (front > 0 && y > -0.2) {
        z += front * (
          0.17 * G(x, 0, 0.05) * G(y, 0.19, 0.085)          // the nose
          + 0.07 * G(x, 0, 0.045) * G(y, 0.32, 0.08)      // its bridge
          - 0.085 * (G(x, 0.16, 0.07) + G(x, -0.16, 0.07)) * G(y, 0.36, 0.05)   // the eye sockets
          + 0.04 * G(y, 0.44, 0.035) * G(x, 0, 0.26)      // the brow
          + 0.026 * (G(x, 0.26, 0.08) + G(x, -0.26, 0.08)) * G(y, 0.27, 0.07)   // the cheekbones
          + 0.045 * G(x, 0, 0.11) * G(y, 0.04, 0.03)      // the lips
          - 0.022 * G(x, 0, 0.12) * G(y, 0.065, 0.009)    // the line between them
          + 0.05 * G(x, 0, 0.1) * G(y, -0.08, 0.045));   // the chin
      }
      // the ears, on the sides of the head a little behind its middle
      const side = Math.max(0, Math.abs(cu) - 0.7) / 0.3;
      if (side > 0 && y > 0.1 && y < 0.55) x += Math.sign(cu) * 0.075 * side * G(y, 0.32, 0.085) * G(su, -0.08, 0.3);
      const o = (j * nu + i) * 3;
      P[o] = x; P[o + 1] = y; P[o + 2] = z;
    }
  }
  return { P, nu, nv };
}
/* the pose: the head turns about the neck (yaw, pitch), the shoulders stay */
function pose(rest, out, yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const py = -0.32, pz = -0.02;
  for (let k = 0; k < rest.length; k += 3) {
    const x = rest[k], y = rest[k + 1], z = rest[k + 2];
    const w = Math.min(1, Math.max(0, (y + 0.55) / 0.45)) ** 1.5;
    if (!w) { out[k] = x; out[k + 1] = y; out[k + 2] = z; continue; }
    const a = yaw * w, b = pitch * w;
    const ca = a === yaw ? cy : Math.cos(a), sa = a === yaw ? sy : Math.sin(a), cb = b === pitch ? cp : Math.cos(b), sb = b === pitch ? sp : Math.sin(b);
    const dy = y - py, dz = z - pz;
    const y1 = dy * cb - dz * sb, z1 = dy * sb + dz * cb;      // pitch about x
    const x2 = x * ca + z1 * sa, z2 = -x * sa + z1 * ca;        // yaw about y
    out[k] = x2; out[k + 1] = y1 + py; out[k + 2] = z2 + pz;
  }
  return out;
}
/* the segment indices, row by row from the crown, so a draw range reveals the figure top to bottom */
function lineIndex(nu, nv) {
  const idx = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i < nu; i++) idx.push(j * nu + i, j * nu + ((i + 1) % nu));
    if (j < nv) for (let i = 0; i < nu; i++) idx.push(j * nu + i, (j + 1) * nu + i);
  }
  return idx;
}
function triIndex(nu, nv) {
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * nu + i, b = j * nu + ((i + 1) % nu), c = (j + 1) * nu + i, d = (j + 1) * nu + ((i + 1) % nu);
    idx.push(a, c, b, b, c, d);
  }
  return idx;
}

/* ------------------------------------------------------------------ the camera, shared by the live view and the still */
const FOV = 26, CY = -0.12;
const REST_YAW = 0.42, REST_PITCH = 0.05;   // a three-quarter view at rest, so the profile of the face reads
function view(w, h, place) {
  const aspect = w / Math.max(1, h);
  const visH = aspect > 1.25 ? 2.9 : 2.55;                       // a wide layer shows a little more of the chest
  const dist = visH / (2 * Math.tan((FOV / 2) * Math.PI / 180));
  const right = place === 'right' || (place !== 'centre' && aspect > 1.25);
  const shiftX = right ? Math.min(0.26, (aspect - 1) * 0.16) * w : 0;   // the figure stands right of centre on a wide frame
  return { aspect, dist, shiftX };
}

/* the still: the same figure projected to an SVG path, back segments left out */
function drawStill(host, col, place, variant) {
  const r = host.getBoundingClientRect();
  const w = Math.max(320, Math.round(r.width)), h = Math.max(320, Math.round(r.height));
  const { P, nu, nv } = bust(variant === 'points' ? 96 : 72, variant === 'points' ? 80 : 64);
  const Q = pose(P, new Float32Array(P.length), REST_YAW, REST_PITCH);
  const { dist, shiftX } = view(w, h, place);
  const f = (h / 2) / Math.tan((FOV / 2) * Math.PI / 180);
  const pr = (k) => { const z = dist - Q[k + 2]; return [w / 2 + shiftX + (Q[k] * f) / z, h / 2 - ((Q[k + 1] - CY) * f) / z]; };
  const facing = (j, i) => {
    const k = (j * nu + i) * 3, kr = (j * nu + ((i + 1) % nu)) * 3, kd = (Math.min(nv, j + 1) * nu + i) * 3, ku = (Math.max(0, j - 1) * nu + i) * 3;
    const ax = Q[kr] - Q[k], ay = Q[kr + 1] - Q[k + 1], az = Q[kr + 2] - Q[k + 2];
    const bx = Q[kd] - Q[ku], by = Q[kd + 1] - Q[ku + 1], bz = Q[kd + 2] - Q[ku + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    return nx * -Q[k] + ny * (CY - Q[k + 1]) + nz * (dist - Q[k + 2]) > 0;   // the outward normal faces the camera
  };
  let d = '';
  const fx = (n) => n.toFixed(1);
  if (variant === 'points') {
    for (let j = 1; j <= nv; j++) for (let i = 0; i < nu; i++) if (facing(j, i)) { const [x, y] = pr((j * nu + i) * 3); d += `M${fx(x)} ${fx(y)}h.01`; }
  } else {
    for (let j = 1; j <= nv; j++) for (let i = 0; i < nu; i++) {
      if (!facing(Math.min(j, nv - 1), i)) continue;
      const [x0, y0] = pr((j * nu + i) * 3), [x1, y1] = pr((j * nu + ((i + 1) % nu)) * 3);
      d += `M${fx(x0)} ${fx(y0)}L${fx(x1)} ${fx(y1)}`;
      if (j < nv) { const [x2, y2] = pr(((j + 1) * nu + i) * 3); d += `M${fx(x0)} ${fx(y0)}L${fx(x2)} ${fx(y2)}`; }
    }
  }
  const sw = variant === 'points' ? 2.4 : 1;
  host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><path d="${d}" fill="none" stroke="${css(col)}" stroke-width="${sw}" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ------------------------------------------------------------------ the live figure */
async function live(el, still, opts, motion) {
  const THREE = await loadThree();
  const r = makeRenderer(THREE, el, { alpha: true });
  if (!r) return setState(el, 'still', window.__tpGl >= (window.__tpGlMax || 4) ? 'gl-budget' : 'no-webgl');
  const { renderer, canvas, dispose } = r;
  const pal = palette(el);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  const group = new THREE.Group();
  scene.add(group);
  const lineMat = new THREE.LineBasicMaterial({ color: threeColor(THREE, pal.accent), transparent: true, opacity: 0.96 });
  const hideMat = new THREE.MeshBasicMaterial({ color: threeColor(THREE, pal.bg), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  let rest = null, attr = null, figure = null, total = 0, geo = null;

  if (opts.shape === 'model' && el.dataset.rrSrc) {
    // the client's own model (or a CC0 one): its triangle edges as lines, its surface in the ground colour
    const { GLTFLoader } = await loadAddon('loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(el.dataset.rrSrc);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
    const s = 2.45 / Math.max(size.y, size.x * 0.8);
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.updateWorldMatrix(true, false);
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld).translate(-mid.x, -mid.y, -mid.z).scale(s, s, s).translate(0, CY + 0.1, 0);
      group.add(new THREE.Mesh(g, hideMat));
      const edges = opts.variant === 'points' ? new THREE.Points(g, new THREE.PointsMaterial({ color: lineMat.color, size: 2, sizeAttenuation: false })) : new THREE.LineSegments(new THREE.WireframeGeometry(g), lineMat);
      group.add(edges);
    });
  } else {
    const nu = opts.variant === 'points' ? 96 : 72, nv = opts.variant === 'points' ? 80 : 64;
    const b = bust(nu, nv);
    rest = b.P;
    geo = new THREE.BufferGeometry();
    attr = new THREE.BufferAttribute(new Float32Array(rest), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);
    const hideGeo = new THREE.BufferGeometry();
    hideGeo.setAttribute('position', attr);
    hideGeo.setIndex(triIndex(nu, nv));
    group.add(new THREE.Mesh(hideGeo, hideMat));
    if (opts.variant === 'points') {
      figure = new THREE.Points(geo, new THREE.PointsMaterial({ color: lineMat.color, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.95 }));
      total = (nv + 1) * nu;
    } else {
      const idx = lineIndex(nu, nv);
      geo.setIndex(idx);
      figure = new THREE.LineSegments(geo, lineMat);
      total = idx.length;
    }
    figure.renderOrder = 1;
    group.add(figure);
  }

  let w = 0, h = 0;
  const size = () => {
    const b = el.getBoundingClientRect();
    w = Math.max(1, Math.round(b.width)); h = Math.max(1, Math.round(b.height));
    renderer.setSize(w, h, false);
    const v = view(w, h, opts.place);
    cam.aspect = w / h;
    cam.position.set(0, CY, v.dist);
    cam.lookAt(0, CY, 0);
    cam.setViewOffset(w, h, -v.shiftX, 0, w, h);
    cam.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(() => { size(); L.wake(); });
  ro.observe(el);

  // the state: yaw and pitch follow the pointer, the reveal runs once, the scroll lowers the gaze
  let yaw = REST_YAW, pitch = REST_PITCH, tYaw = REST_YAW, tPitch = REST_PITCH, scrollPitch = 0, reveal = opts.reveal ? 0 : 1;
  const stopPtr = opts.pointer ? pointer(el, (x, y, inside) => { tYaw = inside ? REST_YAW * 0.5 + x * 0.55 : REST_YAW; tPitch = inside ? REST_PITCH + y * 0.16 : REST_PITCH; L.wake(); }) : () => {};
  const stopScroll = opts.scroll ? heroScroll(el, (p) => { scrollPitch = p * 0.35; L.wake(); }, motion) : () => {};
  let first = true;
  const L = loop(el, (dt) => {
    yaw = damp(yaw, tYaw, 4.5, dt);
    pitch = damp(pitch, tPitch + scrollPitch, 4.5, dt);
    if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.4);
    if (rest) {
      pose(rest, attr.array, yaw, pitch);
      attr.needsUpdate = true;
      if (figure) geo.setDrawRange(0, reveal >= 1 ? Infinity : Math.floor(total * (1 - (1 - reveal) ** 3) / 2) * 2);
    } else group.rotation.set(pitch, yaw, 0);
    renderer.render(scene, cam);
    if (first) { first = false; setState(el, 'live'); }
    return reveal < 1 || Math.abs(yaw - tYaw) > 0.0004 || Math.abs(pitch - tPitch - scrollPitch) > 0.0004;
  });
  return {
    pause: () => L.pause(), resume: () => L.resume(),
    destroy() { L.stop(); ro.disconnect(); stopPtr(); stopScroll(); dispose(); setState(el, 'still'); },
  };
}

mountAll('wireframe-figure', (el) => {
  const opts = {
    variant: el.dataset.rrVariant === 'points' ? 'points' : 'lines',
    shape: el.dataset.rrShape === 'model' ? 'model' : 'bust',
    place: el.dataset.rrPlace || 'auto',
    scroll: el.dataset.rrScroll !== 'off',
  };
  const still = el.querySelector('.rr-still');
  const a = allowance({ webgl: true });
  if (still && still.hasAttribute('data-rr-draw')) {
    const draw = () => drawStill(still, palette(el).accent, opts.place, opts.variant);
    draw();
    new ResizeObserver(() => { if (el.dataset.rrState !== 'live') draw(); }).observe(el);
  }
  if (!a.live) { setState(el, 'still', a.why); return null; }
  opts.pointer = a.pointer;
  opts.reveal = true;
  let ctl = null;
  whenReady((motion) => { live(el, still, opts, motion).then((c) => { if (c) { ctl = c; el.__rr = c; } }).catch((e) => { setState(el, 'still', 'error'); console.error('[hero recipe wireframe-figure]', e); }); });
  return { pause: () => ctl && ctl.pause(), resume: () => ctl && ctl.resume(), destroy: () => ctl && ctl.destroy() };
});
