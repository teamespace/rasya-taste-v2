/*
  rasya-taste-v4 bg-library.js - the small runtime of bg-library.css. Load it with defer, only on a page whose deal
  printed it (an animated layer, an interactive layer, or a layer with data-bg-react). No library.

  The animated three (beams, grid-pulse, flowing-lines), as in v4.0:
  - builds the beams (light running down grid lines) and the pulse cells (grid cells lighting up somewhere new)
  - runs an animated layer only while it is on screen (IntersectionObserver) and the tab is visible; only the
    most visible animated layer runs at a time, so one screen never has two moving grounds
  - holds a still frame under prefers-reduced-motion (or window.rtMotion.reduced, agent A's motion contract)

  The interactive layers (v4.3, agent B2): dot-field, grid-trail, spotlight, ripple, magnetic-lines, particles,
  topo-warp, tilt-grid, crosshair, and data-bg-react="hover|click|both" on dots, grid, grid-pulse and glow.
  - It listens on the layer's section (its parent), never on the layer: the layer keeps pointer-events: none, so
    the words, links and buttons over it stay clickable. A click on a link, button or field sends no ripple.
  - Fine pointer only ((hover: hover) and (pointer: fine)); a touch pointer event is ignored. On touch a layer shows
    its still state, and the two that drift on their own (magnetic-lines, particles) drift gently for 12 s after
    they come on screen, then rest. Under reduced motion: the still state, no pointer response, nothing drifts.
  - One frame loop for every layer (GSAP's ticker when rtMotion has it, else one requestAnimationFrame chain),
    running only while a layer still has something to ease; it stops when the cursor rests. Off screen
    (IntersectionObserver) or in a hidden tab a layer does nothing. Canvas only where needed (dot-field, ripple,
    magnetic-lines, particles, topo-warp), its device pixel ratio capped at 2; spotlight, tilt-grid, crosshair, glow
    and dots move by CSS custom properties (--mx, --my ...), grid-trail by transform and WAAPI opacity.
  - The cursor is eased (a frame-rate-independent lerp), its reach scales with the section (0.15 x its diagonal,
    110-270px), and it fades in and out as it enters and leaves the section.
  - The words: on the first move into a section it reads the text boxes there (text, links, buttons, fields) and
    builds a gate, 0 behind the words and 1 a short way off (canvas layers read it per dot, line or cell; CSS
    layers get it as --rbg-gate, a mask). A response never lifts the layer's contrast behind text above the still
    layer: it happens round the words, not under them. The layer's own fade (data-bg-fade) is unchanged.
  - html[data-bg-still] (or data-motion="off", the hover layer's switch) stops every pointer response: a checker or
    a screenshot tool sets it to read the page at rest.

  window.rbg.refresh() rebuilds after markup changes; rbg.stats() gives each live layer's frame cost (ms);
  rbg.still(true|false) sets html[data-bg-still]. html[data-bg-demo-pointer] makes any pointer count as fine
  (demo-interactive.html only: headless Chrome is not always a mouse).
*/
(() => {
  'use strict';
  if (window.rbg && window.rbg.v) return;   // loaded twice: the first copy runs the page
  const ANIMATED = new Set(['beams', 'grid-pulse', 'flowing-lines']);
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mq.matches || !!(window.rtMotion && window.rtMotion.reduced);
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const cellOf = el => parseFloat(getComputedStyle(el).getPropertyValue('--rbg-cell')) || 44;

  function buildBeams(el) {
    const cell = cellOf(el), w = el.clientWidth || 1200, cols = Math.max(4, Math.floor(w / cell));
    const n = w < 600 ? 3 : 5, used = new Set();
    for (let k = 0; k < n; k++) {
      let c; do { c = 1 + Math.floor(rnd() * (cols - 1)); } while (used.has(c) && used.size < cols - 1);
      used.add(c);
      const b = document.createElement('i');
      b.className = 'rbg-beam';
      b.style.left = (c * cell) + 'px';
      b.style.setProperty('--rbg-dur', (7 + rnd() * 6).toFixed(1) + 's');
      b.style.setProperty('--rbg-delay', (-rnd() * 10).toFixed(1) + 's');
      b.style.setProperty('--rbg-still', (40 + rnd() * 200).toFixed(0) + '%');   // where the light sits when still
      el.appendChild(b);
    }
  }

  function placeCell(el, c) {
    const cell = cellOf(el), cols = Math.max(2, Math.floor(el.clientWidth / cell)), rows = Math.max(2, Math.floor(el.clientHeight / cell));
    c.style.left = (Math.floor(rnd() * cols) * cell) + 'px';
    c.style.top = (Math.floor(rnd() * rows) * cell) + 'px';
  }
  function buildPulse(el) {
    const n = el.clientWidth < 600 ? 4 : 8;
    for (let k = 0; k < n; k++) {
      const c = document.createElement('i');
      c.className = 'rbg-cell';
      c.style.setProperty('--rbg-dur', (4 + rnd() * 2.4).toFixed(1) + 's');
      c.style.setProperty('--rbg-delay', (-rnd() * 6).toFixed(1) + 's');
      c.style.setProperty('--rbg-still-o', (0.35 + rnd() * 0.65).toFixed(2));
      placeCell(el, c);
      c.addEventListener('animationiteration', () => placeCell(el, c));
      el.appendChild(c);
    }
  }

  /* ================================================================ v4.3: the interactive layers (agent B2) */
  // id -> its reaction without data-bg-react; still layers that react only with data-bg-react; the two that drift
  const INTERACTIVE = { 'dot-field': 'hover', 'grid-trail': 'hover', spotlight: 'hover', ripple: 'both', 'magnetic-lines': 'hover',
    particles: 'both', 'topo-warp': 'hover', 'tilt-grid': 'hover', crosshair: 'both' };
  const REACTABLE = new Set(['dots', 'grid', 'grid-pulse', 'glow']);
  const IDLE = new Set(['magnetic-lines', 'particles']);
  const IDLE_MS = 12000;   // a drifting layer comes to rest this long after the last move over it, or after it came on screen
  const NO_RIPPLE = 'a[href], button, input, select, textarea, label, summary, [role="button"], [contenteditable], [data-rbg-skip]';
  const html = document.documentElement;
  const fineMq = matchMedia('(hover: hover) and (pointer: fine)');
  const fine = () => fineMq.matches || html.hasAttribute('data-bg-demo-pointer');
  const frozen = () => html.hasAttribute('data-bg-still') || html.getAttribute('data-motion') === 'off';
  const modeOf = () => (reduced() ? 'still' : fine() ? 'live' : 'idle');
  const TAU = Math.PI * 2;
  const now = () => performance.now();
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const kOf = (base, dt) => 1 - Math.pow(1 - base, dt / 16.667);   // a lerp factor that holds at any frame rate

  /* ---------------------------------------------------------------- colours: the layer's tokens as sRGB bytes */
  let px1 = null;
  function rgbOf(css) {
    if (!px1) { const c = document.createElement('canvas'); c.width = c.height = 1; px1 = c.getContext('2d', { willReadFrequently: true }); }
    px1.clearRect(0, 0, 1, 1); px1.fillStyle = '#000';
    try { px1.fillStyle = css; } catch (e) { /* an unknown colour: black */ }
    px1.fillRect(0, 0, 1, 1);
    const d = px1.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  function colours(L) {
    const el = L.el, keep = el.style.color, out = {};
    for (const [k, v] of [['ink', 'var(--ink)'], ['a', 'var(--rbg-a)']]) { el.style.color = v; out[k] = rgbOf(getComputedStyle(el).color); }
    el.style.color = keep;
    out.i = parseFloat(getComputedStyle(el).getPropertyValue('--rbg-i')) || 1;
    return out;
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(3)})`;
  const mix = (p, q, t) => [0, 1, 2].map(k => Math.round(p[k] + (q[k] - p[k]) * t));
  const seedOf = (el, id) => 1 + [...(el.closest('[id]')?.id || id)].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) % 99991;
  const rand = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  /* ---------------------------------------------------------------- the gate: where the words are (0) and are not (1) */
  function textRects(L) {
    const host = L.host, r0 = L.el.getBoundingClientRect(), out = [];
    const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for (let n = tw.nextNode(); n && out.length < 260; n = tw.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const pe = n.parentElement;
      if (!pe || pe.closest('.rbg, script, style, noscript, template')) continue;
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) out.push([q.left - r0.left, q.top - r0.top, q.right - r0.left, q.bottom - r0.top]);
    }
    for (const e of host.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')) {
      if (e.closest('.rbg')) continue;
      const q = e.getBoundingClientRect();
      if (q.width > 1 && q.height > 1) out.push([q.left - r0.left, q.top - r0.top, q.right - r0.left, q.bottom - r0.top]);
    }
    return out.filter(q => q[2] > 0 && q[3] > 0 && q[0] < L.w && q[1] < L.h);
  }
  function buildGate(L, force) {
    L.gAt = now();
    const w = L.w, h = L.h;
    if (!w || !h) return;
    const qs = textRects(L), sig = w + 'x' + h + ':' + qs.map(q => q.map(v => Math.round(v / 4)).join(',')).join(';');
    if (!force && sig === L.gsig) return;
    L.gsig = sig;
    const cs = 8, gw = Math.ceil(w / cs) + 1, gh = Math.ceil(h / cs) + 1, a = new Float32Array(gw * gh).fill(1);
    const pad = 6, fe = clamp(Math.min(w, h) * 0.07, 26, 70);
    for (const [l, t, r, b] of qs) {
      const x0 = l - pad, y0 = t - pad, x1 = r + pad, y1 = b + pad;
      const i0 = Math.max(0, Math.floor((x0 - fe) / cs)), i1 = Math.min(gw - 1, Math.ceil((x1 + fe) / cs));
      const j0 = Math.max(0, Math.floor((y0 - fe) / cs)), j1 = Math.min(gh - 1, Math.ceil((y1 + fe) / cs));
      for (let j = j0; j <= j1; j++) {
        const py = j * cs, dy = py < y0 ? y0 - py : py > y1 ? py - y1 : 0;
        for (let i = i0; i <= i1; i++) {
          const px = i * cs, dx = px < x0 ? x0 - px : px > x1 ? px - x1 : 0, d = Math.sqrt(dx * dx + dy * dy);
          const v = d >= fe ? 1 : smooth(d / fe), k = j * gw + i;
          if (v < a[k]) a[k] = v;
        }
      }
    }
    L.gate = { cs, gw, gh, a };
    if (L.E.cssGate) {
      const c = document.createElement('canvas'); c.width = gw; c.height = gh;
      const x = c.getContext('2d'), im = x.createImageData(gw, gh);
      for (let k = 0; k < a.length; k++) im.data[k * 4 + 3] = Math.round(a[k] * 255);
      x.putImageData(im, 0, 0);
      setp(L, '--rbg-gate', `url("${c.toDataURL()}")`);
    }
  }
  function gateAt(L, x, y) {
    const G = L.gate;
    if (!G) return 1;
    const fx = clamp(x / G.cs, 0, G.gw - 1.001), fy = clamp(y / G.cs, 0, G.gh - 1.001);
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * G.gw + i, a = G.a;
    return (a[k] * (1 - u) + a[k + 1] * u) * (1 - v) + (a[k + G.gw] * (1 - u) + a[k + G.gw + 1] * u) * v;
  }

  /* ---------------------------------------------------------------- canvas helpers */
  function setp(L, k, v) { L.el.style.setProperty(k, v); L.props.add(k); }
  function canvasOf(L) {
    if (!L.cv) {
      L.cv = document.createElement('canvas'); L.cv.className = 'rbg-canvas';
      L.el.appendChild(L.cv); L.ctx = L.cv.getContext('2d');
    }
    L.dpr = Math.min(2, window.devicePixelRatio || 1);
    L.cv.width = Math.max(1, Math.round(L.w * L.dpr)); L.cv.height = Math.max(1, Math.round(L.h * L.dpr));
    L.ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  }
  function offscreen(L) {
    const c = document.createElement('canvas'); c.width = L.cv.width; c.height = L.cv.height;
    const x = c.getContext('2d'); x.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    return [c, x];
  }
  function blit(L) {   // the still frame, back on the layer's canvas
    const x = L.ctx;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, L.cv.width, L.cv.height); x.drawImage(L.still, 0, 0);
    x.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  }
  const ring = (L, x, y, life) => {
    const far = Math.max(Math.hypot(x, y), Math.hypot(L.w - x, y), Math.hypot(x, L.h - y), Math.hypot(L.w - x, L.h - y));
    return { x, y, t: now(), v: 0.8, life: life || Math.min(2200, far / 0.8 + 200), band: clamp(L.R * 0.2, 30, 52), g: gateAt(L, x, y), r: 0, amp: 1 };
  };

  /* ---------------------------------------------------------------- dot-field, ripple: a dot matrix on a canvas */
  const Dots = {
    canvas: true,
    mount(L) { canvasOf(L); this.still(L); },
    resize(L) { canvasOf(L); this.still(L); },
    still(L) {
      const rip = L.id === 'ripple', s = rip ? 18 : 22, r0 = rip ? 0.95 : 1.1, a0 = (rip ? 0.18 : 0.2) * L.col.i;
      Object.assign(L, { sp: s, r0, a0, cols: Math.floor(L.w / s) + 1, rows: Math.floor(L.h / s) + 1 });
      const [c, x] = offscreen(L);
      x.fillStyle = rgba(L.col.ink, a0); x.beginPath();
      for (let j = 0; j < L.rows; j++) for (let i = 0; i < L.cols; i++) { const px = 1 + i * s, py = 1 + j * s; x.moveTo(px + r0, py); x.arc(px, py, r0, 0, TAU); }
      x.fill();
      L.still = c; blit(L); L.drawn = false;
      const top = Math.min(0.72, a0 * 3.4);   // six steps from the ink dot to the accent
      L.sty = []; for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6; L.sty.push(rgba(mix(L.col.ink, L.col.a, Math.min(1, t * 1.15)), a0 + (top - a0) * t)); }
      L.buf = new Float32Array(Math.min(L.cols * L.rows, 9000) * 5);
    },
    frame(L, dt, t) {
      const rings = L.clicks, hv = L.react.hover ? smooth(L.p) : 0;
      if (hv < 0.004 && !rings.length) { if (L.drawn) { blit(L); L.drawn = false; } return false; }
      const rip = L.id === 'ripple', s = L.sp, R = L.R * (rip ? 0.55 : 1), R2 = R * R, push = s * (rip ? 0.2 : 0.36), grow = rip ? 1.3 : 1.6;
      for (const c of rings) { const tt = t - c.t; c.r = tt * c.v; c.amp = Math.pow(Math.max(0, 1 - tt / c.life), 1.4); }
      let i0 = 0, i1 = L.cols - 1, j0 = 0, j1 = L.rows - 1;
      if (!rings.length) {
        i0 = Math.max(0, Math.floor((L.x - R) / s)); i1 = Math.min(L.cols - 1, Math.ceil((L.x + R) / s));
        j0 = Math.max(0, Math.floor((L.y - R) / s)); j1 = Math.min(L.rows - 1, Math.ceil((L.y + R) / s));
      }
      const B = L.buf, cap = B.length / 5;
      let n = 0;
      scan: for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = 1 + i * s, py = 1 + j * s;
        let e = 0, vx = 0, vy = 0;
        if (hv > 0) {
          const dx = px - L.x, dy = py - L.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) { const d = Math.sqrt(d2) || 1, f = 1 - d / R, w = f * f * hv; e = w; vx += dx / d * w * push; vy += dy / d * w * push; }
        }
        for (const c of rings) {
          const dx = px - c.x, dy = py - c.y, d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.abs(d - c.r) / c.band;
          if (k < 1) { const w = (1 - k) * (1 - k) * c.amp; if (w > e) e = w; vx += dx / d * w * s * 0.28; vy += dy / d * w * s * 0.28; }
        }
        if (e < 0.03) continue;
        const g = gateAt(L, px, py);
        if (g * e < 0.03) continue;
        if (n >= cap) break scan;
        const o = n * 5; B[o] = px; B[o + 1] = py; B[o + 2] = px + vx * g; B[o + 3] = py + vy * g; B[o + 4] = e * g; n++;
      }
      blit(L);
      const x = L.ctx;
      if (n) {
        x.globalCompositeOperation = 'destination-out'; x.beginPath();   // take the still dots out where they move
        for (let k = 0; k < n; k++) x.rect(B[k * 5] - 2, B[k * 5 + 1] - 2, 4, 4);
        x.fill(); x.globalCompositeOperation = 'source-over';
        for (let b = 0; b < 6; b++) {
          x.beginPath(); let any = false;
          for (let k = 0; k < n; k++) {
            const o = k * 5, e = B[o + 4];
            if (Math.min(5, (e * 6) | 0) !== b) continue;
            const r = L.r0 + grow * e;
            x.moveTo(B[o + 2] + r, B[o + 3]); x.arc(B[o + 2], B[o + 3], r, 0, TAU); any = true;
          }
          if (any) { x.fillStyle = L.sty[b]; x.fill(); }
        }
      }
      L.drawn = true;
      return rings.length > 0;
    },
  };

  /* ---------------------------------------------------------------- grid-trail (and grid, grid-pulse with data-bg-react) */
  const Trail = {
    mount(L) {
      L.cell = cellOf(L.el); L.pool = []; L.pi = 0; L.hc = null;
      for (let k = 0; k < 44; k++) { const c = document.createElement('i'); c.className = 'rbg-lit'; L.el.appendChild(c); L.pool.push(c); L.added.push(c); }
      L.head = document.createElement('i'); L.head.className = 'rbg-lit'; L.el.appendChild(L.head); L.added.push(L.head);
    },
    resize(L) { L.cell = cellOf(L.el); },
    flash(L, i, j, a, dur, delay) {
      const c = L.cell;
      if (a < 0.04 || i < 0 || j < 0 || i * c > L.w || j * c > L.h) return;
      const el = L.pool[L.pi++ % L.pool.length];
      if (el._a) el._a.cancel();
      el.style.transform = `translate3d(${i * c}px,${j * c}px,0)`;
      el._a = el.animate(delay ? [{ opacity: 0 }, { opacity: a, offset: 0.16 }, { opacity: 0 }] : [{ opacity: a }, { opacity: 0 }],
        { duration: dur, delay: delay || 0, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'both' });
    },
    frame(L) {
      const c = L.cell, ci = Math.floor(L.x / c), cj = Math.floor(L.y / c);
      const on = L.react.hover && L.p > 0.02;
      if (on && (!L.hc || L.hc[0] !== ci || L.hc[1] !== cj)) {
        if (L.hc) {   // the cell left behind fades; so do the cells a quick move skipped
          this.flash(L, L.hc[0], L.hc[1], L.ha, 900);
          const di = ci - L.hc[0], dj = cj - L.hc[1], m = Math.min(10, Math.max(Math.abs(di), Math.abs(dj)));
          for (let q = 1; q < m; q++) { const i = Math.round(L.hc[0] + di * q / m), j = Math.round(L.hc[1] + dj * q / m); this.flash(L, i, j, 0.6 * L.ha * gateAt(L, (i + 0.5) * c, (j + 0.5) * c), 700); }
        }
        L.hc = [ci, cj];
        L.head.style.transform = `translate3d(${ci * c}px,${cj * c}px,0)`;
      }
      if (L.hc) {
        L.ha = 0.9 * smooth(L.p) * gateAt(L, (L.hc[0] + 0.5) * c, (L.hc[1] + 0.5) * c);
        L.head.style.opacity = L.ha.toFixed(3);
        if (!on && L.p < 0.02) { L.head.style.opacity = '0'; L.hc = null; }
      }
      return false;
    },
    click(L, x, y) {   // a diamond of cells spreading from the click
      const c = L.cell, ci = Math.floor(x / c), cj = Math.floor(y / c);
      for (let k = 0; k <= 3; k++) for (let di = -k; di <= k; di++) {
        const dj = k - Math.abs(di);
        for (const sj of dj ? [dj, -dj] : [0]) {
          const i = ci + di, j = cj + sj;
          this.flash(L, i, j, 0.8 * (1 - k / 4.2) * gateAt(L, (i + 0.5) * c, (j + 0.5) * c), 640, 1 + k * 85);
        }
      }
    },
  };

  /* ---------------------------------------------------------------- spotlight: --mx, --my and a CSS mask */
  const Spot = {
    cssGate: true,
    mount(L) { this.resize(L); },
    resize(L) { L.rx = 0.76 * L.w; L.ry = 0.26 * L.h; setp(L, '--rbg-sr', Math.round(clamp(L.R * 1.05, 140, 300)) + 'px'); this.frame(L); },
    frame(L) {
      const p = smooth(L.p), x = L.rx + (L.x - L.rx) * p, y = L.ry + (L.y - L.ry) * p;   // from its rest pool to the cursor and back
      setp(L, '--mx', x.toFixed(1) + 'px'); setp(L, '--my', y.toFixed(1) + 'px'); setp(L, '--rbg-sp', (0.55 + 0.45 * p).toFixed(3));
      return false;
    },
  };

  /* ---------------------------------------------------------------- tilt-grid: a 3D tilt of the pattern plane (transform) */
  const Tilt = {
    ease: 0.07,
    frame(L) {
      const p = smooth(L.p), nx = clamp(L.x / L.w * 2 - 1, -1, 1) * p, ny = clamp(L.y / L.h * 2 - 1, -1, 1) * p;
      setp(L, '--rbg-ry', (nx * 5).toFixed(3) + 'deg'); setp(L, '--rbg-rx', (-ny * 4).toFixed(3) + 'deg');
      setp(L, '--rbg-tx', (-nx * 10).toFixed(2) + 'px'); setp(L, '--rbg-ty', (-ny * 8).toFixed(2) + 'px');
      return false;
    },
  };

  /* ---------------------------------------------------------------- crosshair: guide lines snap from grid line to grid line */
  const Cross = {
    cssGate: true,
    mount(L) {
      const xh = document.createElement('i'), mk = document.createElement('i');
      xh.className = 'rbg-xh'; mk.className = 'rbg-mark'; xh.appendChild(mk); L.el.appendChild(xh);
      L.xh = xh; L.added.push(xh); L.sx = null; this.resize(L);
    },
    resize(L) { L.cell = cellOf(L.el); setp(L, '--rbg-sr', Math.round(L.R * 1.5) + 'px'); },
    frame(L, dt) {
      const c = L.cell, gx = Math.round(L.x / c) * c, gy = Math.round(L.y / c) * c;
      if (L.sx == null || L.p < 0.02) { L.sx = gx; L.sy = gy; }
      const k = kOf(0.2, dt);
      L.sx += (gx - L.sx) * k; L.sy += (gy - L.sy) * k;
      setp(L, '--mx', L.sx.toFixed(1) + 'px'); setp(L, '--my', L.sy.toFixed(1) + 'px'); setp(L, '--rbg-xp', smooth(L.p).toFixed(3));
      return Math.abs(gx - L.sx) > 0.2 || Math.abs(gy - L.sy) > 0.2;
    },
    click(L, x, y) {
      const c = L.cell, gx = Math.round(x / c) * c, gy = Math.round(y / c) * c, s = document.createElement('i');
      s.className = 'rbg-stamp'; L.xh.appendChild(s);
      const a = s.animate([{ transform: `translate3d(${gx}px,${gy}px,0) scale(1)`, opacity: 0.9 }, { transform: `translate3d(${gx}px,${gy}px,0) scale(3.2)`, opacity: 0 }],
        { duration: 760, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      a.onfinish = a.oncancel = () => s.remove();
    },
  };

  /* ---------------------------------------------------------------- magnetic-lines: long lines that drift and bend to the cursor */
  const Lines = {
    canvas: true, idle: true,
    mount(L) { canvasOf(L); this.build(L); this.frame(L, 16, now()); },
    resize(L) { canvasOf(L); this.build(L); this.frame(L, 16, now()); },
    build(L) {
      const r = rand(seedOf(L.el, L.id)), n = clamp(Math.round(L.h / 62), 6, 14), w = L.w;
      L.ln = [];
      for (let k = 0; k < n; k++) L.ln.push({ y: (k + 0.5 + (r() - 0.5) * 0.5) * L.h / n, a1: 10 + r() * 18, k1: TAU / (w * (0.55 + r() * 0.5)), p1: r() * TAU,
        s1: (0.00012 + r() * 0.0001) * (r() < 0.5 ? -1 : 1), a2: 4 + r() * 7, k2: TAU / (w * (0.18 + r() * 0.14)), p2: r() * TAU, s2: 0.0002 + r() * 0.00015, acc: k % 4 === 1 });
      L.step = 10; L.np = Math.ceil(w / L.step) + 3;
      L.a0 = 0.15 * L.col.i; L.inkS = rgba(L.col.ink, L.a0); L.accS = rgba(L.col.a, 0.3 * L.col.i);
    },
    frame(L, dt, t) {
      const x = L.ctx, T = L.time, R = L.R * 1.25, R2 = R * R, s = L.react.hover ? smooth(L.p) * L.g : 0, pull = 0.34 * s;
      x.clearRect(0, 0, L.w, L.h); x.lineWidth = 1.2; x.lineJoin = 'round';
      let gI = L.inkS, gA = L.accS;
      if (s > 0.01) {   // near the cursor the lines take the accent
        gI = x.createRadialGradient(L.x, L.y, 0, L.x, L.y, R);
        gI.addColorStop(0, rgba(mix(L.col.ink, L.col.a, 0.85 * s), L.a0 + (Math.min(0.55, L.a0 * 3) - L.a0) * s)); gI.addColorStop(1, L.inkS);
        gA = x.createRadialGradient(L.x, L.y, 0, L.x, L.y, R);
        gA.addColorStop(0, rgba(L.col.a, (0.3 + 0.25 * s) * L.col.i)); gA.addColorStop(1, L.accS);
      }
      const pl = L.clicks;
      for (const ln of L.ln) {
        x.beginPath();
        for (let q = 0; q < L.np; q++) {
          const px = (q - 1) * L.step;
          let py = ln.y + ln.a1 * Math.sin(px * ln.k1 + ln.p1 + T * ln.s1) + ln.a2 * Math.sin(px * ln.k2 + ln.p2 + T * ln.s2);
          if (pull > 0.003) {
            const dx = px - L.x, dy = py - L.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) { const f = 1 - Math.sqrt(d2) / R; py += (L.y - py) * pull * f * f * (3 - 2 * f); }
          }
          for (const c of pl) {   // a click plucks the lines: a damped wave out from the click
            const tt = t - c.t, d = Math.hypot(px - c.x, py - c.y);
            py += 16 * c.g * Math.exp(-tt / 420) * Math.exp(-d / (R * 0.9)) * Math.sin(d * 0.045 - tt * 0.018);
          }
          if (q) x.lineTo(px, py); else x.moveTo(px, py);
        }
        x.strokeStyle = ln.acc ? gA : gI; x.stroke();
      }
      return false;
    },
    click(L, x, y) { L.clicks.push(ring(L, x, y, 1500)); if (L.clicks.length > 3) L.clicks.shift(); },
  };

  /* ---------------------------------------------------------------- particles: drift, and part round the cursor */
  const Parts = {
    canvas: true, idle: true,
    mount(L) { canvasOf(L); this.build(L); this.draw(L); },
    resize(L) { canvasOf(L); this.build(L); this.draw(L); },
    build(L) {
      const r = rand(seedOf(L.el, L.id)), n = clamp(Math.round(L.w * L.h / 10500), 36, 150), F = () => new Float32Array(n);
      const P = { n, hx: F(), hy: F(), ox: F(), oy: F(), vx: F(), vy: F(), bx: F(), by: F(), r: F(), s: new Uint8Array(n) };
      for (let k = 0; k < n; k++) {
        P.hx[k] = r() * L.w; P.hy[k] = r() * L.h;
        const ang = -0.4 + (r() - 0.5) * 1.3, sp = 5 + r() * 9;
        P.bx[k] = Math.cos(ang) * sp; P.by[k] = Math.sin(ang) * sp;
        P.r[k] = 0.8 + r() * 1.1; P.s[k] = r() < 0.16 ? 3 : (r() * 3) | 0;
      }
      L.P = P;
      const i = L.col.i;
      L.sty = [rgba(L.col.ink, 0.16 * i), rgba(L.col.ink, 0.24 * i), rgba(L.col.ink, 0.34 * i), rgba(L.col.a, 0.44 * i)];
    },
    draw(L) {
      const P = L.P, x = L.ctx;
      x.clearRect(0, 0, L.w, L.h);
      for (let b = 0; b < 4; b++) {
        x.beginPath();
        for (let k = 0; k < P.n; k++) { if (P.s[k] !== b) continue; const px = P.hx[k] + P.ox[k], py = P.hy[k] + P.oy[k]; x.moveTo(px + P.r[k], py); x.arc(px, py, P.r[k], 0, TAU); }
        x.fillStyle = L.sty[b]; x.fill();
      }
    },
    frame(L, dt) {
      const P = L.P, sdt = Math.min(dt, 40) / 1000, R = L.R * 0.95, R2 = R * R, s = L.react.hover ? smooth(L.p) * L.g : 0, drift = L.d;
      const damp = Math.exp(-5.2 * sdt), K = 7, W = L.w + 12, H = L.h + 12;
      for (const c of L.clicks) if (!c.done) {   // a click: one push outward
        c.done = true;
        for (let k = 0; k < P.n; k++) {
          const dx = P.hx[k] + P.ox[k] - c.x, dy = P.hy[k] + P.oy[k] - c.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = 1 - d / (R * 1.7);
          if (f > 0) { P.vx[k] += dx / d * 260 * f * f * c.g; P.vy[k] += dy / d * 260 * f * f * c.g; }
        }
      }
      let busy = false;
      for (let k = 0; k < P.n; k++) {
        // the home drifts (and wraps); the particle is held to it by a soft spring, and the cursor pushes it off
        P.hx[k] += P.bx[k] * drift * sdt; P.hy[k] += P.by[k] * drift * sdt;
        if (P.hx[k] < -6) P.hx[k] += W; else if (P.hx[k] > L.w + 6) P.hx[k] -= W;
        if (P.hy[k] < -6) P.hy[k] += H; else if (P.hy[k] > L.h + 6) P.hy[k] -= H;
        let ax = -K * P.ox[k], ay = -K * P.oy[k];
        if (s > 0.003) {
          const dx = P.hx[k] + P.ox[k] - L.x, dy = P.hy[k] + P.oy[k] - L.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) { const d = Math.sqrt(d2) || 1, f = 1 - d / R, F = 2600 * f * f * s; ax += dx / d * F; ay += dy / d * F; }
        }
        P.vx[k] = (P.vx[k] + ax * sdt) * damp; P.vy[k] = (P.vy[k] + ay * sdt) * damp;
        P.ox[k] += P.vx[k] * sdt; P.oy[k] += P.vy[k] * sdt;
        if (!busy && (Math.abs(P.vx[k]) > 0.3 || Math.abs(P.vy[k]) > 0.3 || Math.abs(P.ox[k]) > 0.3 || Math.abs(P.oy[k]) > 0.3)) busy = true;
      }
      this.draw(L);
      return busy;
    },
  };

  /* ---------------------------------------------------------------- topo-warp: the topo field, a hill of rings under the cursor */
  let TOPO = null;
  function topoField() {   // the height field of lib/make-topo.mjs (same seed), so the canvas and the CSS still match
    if (TOPO) return TOPO;
    const W = 1600, H = 1000, N = 160, M = 100;
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const hills = Array.from({ length: 11 }, () => ({ x: r() * W, y: r() * H, r: 150 + r() * 260, a: (r() < 0.3 ? -1 : 1) * (0.6 + r()) }));
    const v = new Float32Array((N + 1) * (M + 1));
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j <= M; j++) for (let i = 0; i <= N; i++) {
      const x = i / N * W, y = j / M * H;
      let f = 0;
      for (const h of hills) f += h.a * Math.exp(-((x - h.x) ** 2 + (y - h.y) ** 2) / (2 * h.r * h.r));
      f += 0.18 * Math.sin(x / 210 + Math.cos(y / 260) * 1.7) + 0.12 * Math.cos(y / 170 - x / 400);
      v[j * (N + 1) + i] = f; if (f < lo) lo = f; if (f > hi) hi = f;
    }
    return (TOPO = { W, H, N, M, v, lo, hi, levels: 24 });
  }
  const Q = new Float32Array(8);
  function march(T, f, i0, i1, j0, j1, m, pI, pA, b, thr) {   // marching squares over cells [i0,i1) x [j0,j1)
    const N1 = T.N + 1, lo = T.lo, st = (T.hi - T.lo) / (T.levels + 1), cw = m.cw;
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const k = j * N1 + i, a = f[k], bb = f[k + 1], c = f[k + N1 + 1], d = f[k + N1];
      const mn = Math.min(a, bb, c, d), mx = Math.max(a, bb, c, d);
      const l0 = Math.max(1, Math.ceil((mn - lo) / st)), l1 = Math.min(T.levels, Math.floor((mx - lo) / st));
      if (l0 > l1) continue;
      const x0 = m.ox + i * cw, y0 = m.oy + j * cw;
      const P = b && b[k] + b[k + 1] + b[k + N1] + b[k + N1 + 1] > thr * 4 ? pA : pI;
      for (let l = l0; l <= l1; l++) {
        const t = lo + st * l;
        let n = 0;
        if ((a < t) !== (bb < t)) { Q[n++] = x0 + cw * (t - a) / (bb - a); Q[n++] = y0; }
        if ((bb < t) !== (c < t)) { Q[n++] = x0 + cw; Q[n++] = y0 + cw * (t - bb) / (c - bb); }
        if ((d < t) !== (c < t)) { Q[n++] = x0 + cw * (t - d) / (c - d); Q[n++] = y0 + cw; }
        if ((a < t) !== (d < t)) { Q[n++] = x0; Q[n++] = y0 + cw * (t - a) / (d - a); }
        if (n >= 4) { P.moveTo(Q[0], Q[1]); P.lineTo(Q[2], Q[3]); }
        if (n === 8) { P.moveTo(Q[4], Q[5]); P.lineTo(Q[6], Q[7]); }
      }
    }
  }
  const Topo = {
    canvas: true,
    mount(L) { canvasOf(L); this.build(L); },
    resize(L) { canvasOf(L); this.build(L); },
    build(L) {
      const T = topoField(), sc = Math.max(L.w / T.W, L.h / T.H);   // background-size: cover, centred, as the CSS topo
      L.map = { ox: (L.w - T.W * sc) / 2, oy: (L.h - T.H * sc) / 2, cw: T.W / T.N * sc };
      L.f = new Float32Array(T.v); L.b = new Float32Array(T.v.length); L.lw = 1.3 * sc;
      L.inkS = rgba(L.col.ink, 0.16 * L.col.i); L.accS = rgba(mix(L.col.ink, L.col.a, 0.8), Math.min(0.62, 0.4 * L.col.i));
      const [c, x] = offscreen(L), p = new Path2D();
      march(T, T.v, 0, T.N, 0, T.M, L.map, p, p, null, 0);
      x.lineWidth = L.lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = L.inkS; x.stroke(p);
      L.still = c; blit(L); L.box = null;
    },
    frame(L) {
      const T = topoField(), m = L.map, x = L.ctx, d = L.dpr, span = T.hi - T.lo;
      const A = (L.react.hover ? smooth(L.p) * L.g : 0) * 0.2 * span;
      if (L.box) {   // put back what the last frame changed
        const [bx, by, bw, bh] = L.box;
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(bx, by, bw, bh); x.drawImage(L.still, bx, by, bw, bh, bx, by, bw, bh);
        x.setTransform(d, 0, 0, d, 0, 0); L.box = null;
      }
      if (A < span * 0.003) return false;
      const Rc = L.R * 1.3, sg = Rc / 2.7, N1 = T.N + 1;
      const i0 = clamp(Math.floor((L.x - Rc - m.ox) / m.cw) - 2, 0, T.N), i1 = clamp(Math.ceil((L.x + Rc - m.ox) / m.cw) + 2, 0, T.N);
      const j0 = clamp(Math.floor((L.y - Rc - m.oy) / m.cw) - 2, 0, T.M), j1 = clamp(Math.ceil((L.y + Rc - m.oy) / m.cw) + 2, 0, T.M);
      if (i1 - i0 < 3 || j1 - j0 < 3) return false;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * N1 + i, px = m.ox + i * m.cw - L.x, py = m.oy + j * m.cw - L.y, r = Math.sqrt(px * px + py * py);
        const bv = r < Rc ? A * Math.exp(-r * r / (2 * sg * sg)) * smooth((Rc - r) / (Rc * 0.3)) : 0;
        L.b[k] = bv; L.f[k] = T.v[k] + bv;
      }
      // the box: the ring of cells outside it has no bump (drawn for the stroke's edge, then clipped)
      const bx = clamp(Math.floor((m.ox + (i0 + 1) * m.cw) * d), 0, L.cv.width), by = clamp(Math.floor((m.oy + (j0 + 1) * m.cw) * d), 0, L.cv.height);
      const bw = clamp(Math.ceil((m.ox + (i1 - 1) * m.cw) * d), 0, L.cv.width) - bx, bh = clamp(Math.ceil((m.oy + (j1 - 1) * m.cw) * d), 0, L.cv.height) - by;
      if (bw > 0 && bh > 0) {
        x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(bx, by, bw, bh);
        x.save(); x.beginPath(); x.rect(bx, by, bw, bh); x.clip(); x.setTransform(d, 0, 0, d, 0, 0);
        const pI = new Path2D(), pA = new Path2D();
        march(T, L.f, i0, i1, j0, j1, m, pI, pA, L.b, A * 0.3);
        x.lineWidth = L.lw; x.lineCap = 'round'; x.lineJoin = 'round';
        x.strokeStyle = L.inkS; x.stroke(pI); x.strokeStyle = L.accS; x.stroke(pA);
        x.restore(); x.setTransform(d, 0, 0, d, 0, 0);
        L.box = [bx, by, bw, bh];
      }
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * N1 + i; L.f[k] = T.v[k]; L.b[k] = 0; }
      return false;
    },
  };

  /* ---------------------------------------------------------------- data-bg-react on the still layers: dots and glow (CSS) */
  const DotsReact = {
    cssGate: true,
    mount(L) { setp(L, '--rbg-r', Math.round(L.R) + 'px'); },
    resize(L) { setp(L, '--rbg-r', Math.round(L.R) + 'px'); },
    frame(L, dt, t) {
      setp(L, '--mx', L.x.toFixed(1) + 'px'); setp(L, '--my', L.y.toFixed(1) + 'px'); setp(L, '--rbg-p', (L.react.hover ? smooth(L.p) : 0).toFixed(3));
      const c = L.clicks[L.clicks.length - 1];
      if (c) {
        const tt = t - c.t;
        setp(L, '--rbg-rx', c.x.toFixed(1) + 'px'); setp(L, '--rbg-ry', c.y.toFixed(1) + 'px');
        setp(L, '--rbg-rr', (tt * c.v).toFixed(1) + 'px'); setp(L, '--rbg-ra', Math.pow(Math.max(0, 1 - tt / c.life), 1.3).toFixed(3));
      } else setp(L, '--rbg-ra', '0');
      return !!c;
    },
  };
  const GlowReact = {
    ease: 0.045,   // the light follows slowly, along the top edge
    frame(L) {
      const p = smooth(L.p);
      setp(L, '--rbg-gx', (50 + clamp(L.x / L.w * 2 - 1, -1, 1) * 18 * p).toFixed(2) + '%');
      setp(L, '--rbg-gy', (-12 + clamp(L.y / L.h, 0, 1) * 8 * p).toFixed(2) + '%');
      return false;
    },
  };
  const ENGINES = { 'dot-field': Dots, ripple: Dots, 'grid-trail': Trail, grid: Trail, 'grid-pulse': Trail, spotlight: Spot, 'tilt-grid': Tilt,
    crosshair: Cross, 'magnetic-lines': Lines, particles: Parts, 'topo-warp': Topo, dots: DotsReact, glow: GlowReact };

  /* ---------------------------------------------------------------- the one frame loop */
  const I = new Map();          // el -> interactive layer
  const active = new Set();     // layers that still have something to ease
  let running = false, onTicker = null, lastT = 0, rafId = 0;
  const ticker = () => { const g = window.rtMotion && window.rtMotion.gsap; return g && g.ticker && typeof g.ticker.add === 'function' ? g.ticker : null; };
  function start() {
    if (running || document.hidden || !active.size) return;
    running = true; lastT = now();
    const tk = ticker();
    if (tk) { onTicker = tk; tk.add(tick); } else rafId = requestAnimationFrame(rafTick);
  }
  function stop() {
    running = false;
    if (onTicker) { onTicker.remove(tick); onTicker = null; }
    cancelAnimationFrame(rafId);
  }
  function rafTick() { if (!running || onTicker) return; tick(); if (running && !onTicker) rafId = requestAnimationFrame(rafTick); }
  function tick() {
    const t = now(), dt = clamp(t - lastT, 1, 48);
    lastT = t;
    for (const L of active) {
      if (!L.visible || !L.on || document.hidden) { active.delete(L); continue; }
      const t0 = now();
      let more = false;
      try { more = step(L, dt, t); } catch (e) { console.error('[rbg] ' + L.id + ':', e); more = false; }
      const ms = now() - t0;
      L.st.n++; L.st.sum += ms; if (ms > L.st.max) L.st.max = ms;
      if (!more) active.delete(L);
    }
    if (!active.size) stop();
  }
  function wake(L) { if (!L.on || !L.visible || document.hidden || L.mode === 'still') return; active.add(L); start(); }

  function step(L, dt, t) {
    if (L.pin) {
      const r = L.el.getBoundingClientRect();
      L.tx = L.cx - r.left; L.ty = L.cy - r.top;
      if (L.tx < -2 || L.ty < -2 || L.tx > L.w + 2 || L.ty > L.h + 2) L.pin = false;   // scrolled out from under the cursor
    }
    const kp = kOf(L.ease, dt), kq = kOf(0.085, dt);
    if (L.pin && L.p < 0.02) { L.x = L.tx; L.y = L.ty; L.g = gateAt(L, L.x, L.y); }   // entering: no sweep from where it left
    L.x += (L.tx - L.x) * kp; L.y += (L.ty - L.y) * kp;
    L.p += ((L.pin ? 1 : 0) - L.p) * kq;
    if (!L.pin && L.p < 0.003) L.p = 0;
    const g = gateAt(L, L.x, L.y);
    L.g += (g - L.g) * kq;
    if (L.clicks.length) L.clicks = L.clicks.filter(c => t - c.t < c.life);
    let drift = false;
    if (L.idle) {
      const want = L.runner && (L.pin || t - L.woke < IDLE_MS) ? 1 : 0;
      L.d += (want - L.d) * kOf(0.035, dt);
      if (!want && L.d < 0.003) L.d = 0;
      L.time += dt * L.d;
      drift = L.d > 0;
    }
    const busy = L.E.frame(L, dt, t) || false;
    const easing = Math.abs(L.tx - L.x) > 0.2 || Math.abs(L.ty - L.y) > 0.2 || (L.pin ? L.p < 0.996 : L.p > 0) || Math.abs(g - L.g) > 0.01;
    return easing || busy || drift || L.clicks.length > 0;
  }

  /* ---------------------------------------------------------------- mount, listen, unmount */
  function reactOf(el, id) {
    const v = (el.getAttribute('data-bg-react') || '').trim().toLowerCase(), r = v || INTERACTIVE[id] || 'hover';
    return { hover: r === 'hover' || r === 'both', click: r === 'click' || r === 'both', none: r === 'none' };
  }
  function measure(L) {
    L.w = L.el.clientWidth; L.h = L.el.clientHeight;
    L.R = clamp(0.15 * Math.hypot(L.w, L.h), 110, 270);
  }
  function registerI(el, id) {
    const L = { el, id, host: el.parentElement, react: reactOf(el, id), E: ENGINES[id], idle: IDLE.has(id), mounted: false, on: false, visible: !io,
      mode: 'still', w: 0, h: 0, R: 120, cx: 0, cy: 0, tx: 0, ty: 0, x: 0, y: 0, p: 0, g: 1, pin: false, clicks: [], runner: false, woke: now(),
      d: 0, time: 0, ease: 0.16, st: { n: 0, sum: 0, max: 0 }, gate: null, gsig: '', gAt: -1e9, props: new Set(), added: [], off: null };
    if (!L.E || !L.host) return;
    I.set(el, L);
    if (io) io.observe(el); else mountI(L);
  }
  function mountI(L) {
    L.mounted = true; L.mode = modeOf();
    const E = L.E;
    // live: every layer; touch (idle) and reduced motion (still): only the canvas layers that drift; the rest keep the CSS still
    if (L.mode !== 'live' && !E.idle) return;
    if (L.react.none && !E.idle) return;
    L.on = true;
    measure(L);
    if (E.ease) L.ease = E.ease;
    if (E.canvas) L.col = colours(L);
    if (E.mount) E.mount(L);
    if (E.canvas) L.el.setAttribute('data-bg-live', '');   // the canvas draws the still now
    if (L.mode === 'live' && !L.react.none) attach(L);
    if (ro) ro.observe(L.el);
    L.woke = now();
    if (L.idle) wake(L);
  }
  function attach(L) {
    const h = L.host;
    const move = e => {
      if (e.pointerType === 'touch' || frozen()) return;
      L.cx = e.clientX; L.cy = e.clientY;
      if (!L.pin && now() - L.gAt > 600) buildGate(L);   // the words may have moved since (an entrance, a resize)
      L.pin = true; L.woke = now(); wake(L);
    };
    const leave = e => { if (e.pointerType === 'touch') return; L.pin = false; wake(L); };
    const down = e => {
      if (e.pointerType === 'touch' || e.button !== 0 || !L.react.click || frozen()) return;
      if (e.target && e.target.closest && e.target.closest(NO_RIPPLE)) return;   // a click on a link or a button is for it
      const r = L.el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > L.w || y > L.h) return;
      if (!L.gate) buildGate(L);
      L.woke = now();
      if (L.E.click) L.E.click(L, x, y);
      else { L.clicks.push(ring(L, x, y)); if (L.clicks.length > 4) L.clicks.shift(); }
      wake(L);
    };
    h.addEventListener('pointermove', move, { passive: true });
    h.addEventListener('pointerleave', leave, { passive: true });
    h.addEventListener('pointerdown', down, { passive: true });
    L.off = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerleave', leave); h.removeEventListener('pointerdown', down); };
  }
  function unmountI(L) {
    if (L.off) L.off();
    if (L.cv) L.cv.remove();
    for (const e of L.added) e.remove();
    for (const k of L.props) L.el.style.removeProperty(k);
    if (L.E && L.E.canvas) L.el.removeAttribute('data-bg-live');
    if (ro) ro.unobserve(L.el);
    if (io) io.unobserve(L.el);
    active.delete(L);
    clearTimeout(L.rt);
  }
  function relayout(L) {
    const w = L.el.clientWidth, h = L.el.clientHeight;
    if (!L.on || (w === L.w && h === L.h)) return;
    measure(L);
    if (L.E.canvas) L.col = colours(L);
    if (L.E.resize) L.E.resize(L);
    if (L.gate) buildGate(L, true);
    wake(L);
  }
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => {
    for (const e of es) { const L = I.get(e.target); if (!L || !L.on) continue; clearTimeout(L.rt); L.rt = setTimeout(() => relayout(L), 140); }
  }) : null;

  /* ================================================================ the runner: one moving ground per screen */
  const layers = new Map();   // el -> visible ratio (the animated three, and the two interactive layers that drift)
  const pickRunner = () => {
    let best = null, ratio = 0;
    if (!document.hidden && !reduced()) for (const [el, r] of layers) if (r > ratio) { best = el; ratio = r; }
    for (const el of layers.keys()) el.toggleAttribute('data-bg-run', el === best);
    for (const L of I.values()) if (L.idle) {
      const was = L.runner;
      L.runner = L.el === best;
      if (L.runner && !was) { L.woke = now(); wake(L); }
    }
  };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const e of entries) {
      if (layers.has(e.target)) layers.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
      const L = I.get(e.target);
      if (!L) continue;
      L.visible = e.isIntersecting;
      if (!L.visible) { active.delete(L); continue; }
      if (!L.mounted) mountI(L);
      else if (L.pin || L.idle || L.clicks.length) wake(L);
    }
    pickRunner();
  }, { threshold: [0, 0.15, 0.35, 0.6, 0.85] }) : null;

  function init(root = document) {
    for (const el of root.querySelectorAll('.rbg[data-bg]')) {
      const id = el.dataset.bg;
      if (ANIMATED.has(id) && el.dataset.bgLive == null) {
        seed = 1 + [...(el.closest('[id]')?.id || id)].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) % 99991;
        if (id === 'beams') buildBeams(el);
        if (id === 'grid-pulse') buildPulse(el);
        el.dataset.bgLive = '';
        layers.set(el, 0);
        if (io) io.observe(el);
      }
      if (!I.has(el) && (id in INTERACTIVE || (REACTABLE.has(id) && el.hasAttribute('data-bg-react')))) {
        if (IDLE.has(id)) layers.set(el, 0);
        registerI(el, id);
      }
    }
    pickRunner();
  }
  function refresh() {
    for (const L of I.values()) unmountI(L);
    I.clear(); active.clear(); stop();
    for (const el of document.querySelectorAll('.rbg[data-bg-live], .rbg[data-bg-run]')) {
      el.querySelectorAll('.rbg-beam, .rbg-cell').forEach(n => n.remove());
      delete el.dataset.bgLive; el.removeAttribute('data-bg-run');
      if (io) io.unobserve(el);
    }
    layers.clear();
    init();
  }

  document.addEventListener('visibilitychange', () => {
    pickRunner();
    if (document.hidden) stop();
    else for (const L of I.values()) if (L.visible && (L.pin || L.idle)) wake(L);
  });
  addEventListener('scroll', () => { for (const L of I.values()) if (L.pin) wake(L); }, { passive: true });
  mq.addEventListener?.('change', refresh);
  fineMq.addEventListener?.('change', refresh);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    for (const L of I.values()) if (L.on && L.E.canvas) { L.col = colours(L); L.E.resize(L); }
  });
  const stats = () => [...I.values()].filter(L => L.on).map(L => ({ id: L.id, mode: L.mode, frames: L.st.n,
    avg: +(L.st.sum / (L.st.n || 1)).toFixed(3), max: +L.st.max.toFixed(3), w: L.w, h: L.h }));
  const still = on => { html.toggleAttribute('data-bg-still', on !== false); };
  window.rbg = { v: '4.3', refresh, init, stats, still };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
