/*
  hero recipe: scan-canvas (refs: Scale; references/hero-recipes.md). The client's scene (a photograph, or on tech its
  film) in the hero's frame with the product's reading of it drawn over it on one 2D canvas: a box round each object
  it finds, a label chip with its class and confidence, a ruler of ticks on the frame's edges, a readout of the frame
  in mono, and a crosshair with its coordinates under the pointer. On tech the boxes are found one after another and
  then held (a 6 s cycle with the kit's pause button); the still is every box drawn once.

  <div class="rr rr--scan-canvas" data-recipe="scan-canvas" role="img" aria-label=".."
       data-rr-boxes='[{"x":0.08,"y":0.42,"w":0.2,"h":0.36,"label":"bicycle","p":0.97}, ..]'   fractions of the picture
       data-rr-readout="Camera 04 · 24 fps">
    <img class="rr-sc__media" data-rr-slot="scene" src=".." alt="">   (tech, a film: video.rr-sc__media data-rr-slot="film")
  </div>
  The boxes are the agent's to place on the real picture after it is made: look at it, then write them.
*/
import { allowance, mountAll, setState, loop, palette, css, data, pauseButton } from '../_shared/recipe-kit.js';

mountAll('scan-canvas', (el) => {
  const media = el.querySelector('.rr-sc__media');
  const boxes = data(el, 'rrBoxes', []);
  const readout = el.dataset.rrReadout || '';
  const a = allowance({ canvas: true });
  if (a.other) { setState(el, 'still', 'other'); return null; }   // a canvas is tech only: on other the picture alone
  const cv = document.createElement('canvas');
  cv.className = 'rr-sc__over';
  cv.setAttribute('aria-hidden', 'true');
  el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const pal = palette(el);
  const mono = getComputedStyle(el).getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';
  let W = 0, H = 0, dpr = 1, mx = -1, my = -1;
  const size = () => { const r = el.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
  // the picture's box inside the frame (object-fit: cover), so the boxes land on the picture
  const fitted = () => {
    const nw = media && (media.naturalWidth || media.videoWidth) || W, nh = media && (media.naturalHeight || media.videoHeight) || H;
    const s = Math.max(W / nw, H / nh); const pw = nw * s, ph = nh * s;
    const [ox, oy] = (getComputedStyle(media || el).objectPosition || '50% 50%').split(' ').map((v) => parseFloat(v) / 100);
    return { x: (W - pw) * (isNaN(ox) ? 0.5 : ox), y: (H - ph) * (isNaN(oy) ? 0.5 : oy), w: pw, h: ph };
  };
  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const P = fitted();
    const ink = [255, 255, 255], acc = pal.accent;
    // the ruler: a tick every 8px down the left edge, a long one every 40px
    ctx.strokeStyle = css(ink, 0.55); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 24; y < H - 24; y += 8) { const L = (y - 24) % 40 === 0 ? 10 : 5; ctx.moveTo(14, y + 0.5); ctx.lineTo(14 + L, y + 0.5); }
    ctx.stroke();
    // the boxes: found one after another over the cycle's first 3 s, then held
    const cyc = 6, k = t == null ? 1 : Math.min(1, (t % cyc) / 3);
    const shown = t == null ? boxes.length : Math.floor(k * boxes.length + 0.0001);
    ctx.font = `500 11px ${mono}`;
    boxes.forEach((b, i) => {
      if (i >= shown && t != null) return;
      const age = t == null ? 1 : Math.min(1, ((t % cyc) - (i / boxes.length) * 3) / 0.35);
      const jit = t == null ? 0 : Math.sin(t * 3 + i) * 0.8;
      const x = P.x + b.x * P.w + jit, y = P.y + b.y * P.h, w = b.w * P.w, h = b.h * P.h;
      ctx.strokeStyle = css(acc, Math.max(0, age)); ctx.lineWidth = 1.5;
      ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w * Math.max(0.2, age)), Math.round(h * Math.max(0.2, age)));
      const label = `${b.label || 'object'} ${b.p != null ? Number(b.p).toFixed(2) : ''}`.trim();
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = css(acc, Math.max(0, age)); ctx.fillRect(Math.round(x), Math.round(y) - 18, tw, 18);
      ctx.fillStyle = css(pal.accentInk, Math.max(0, age)); ctx.fillText(label, Math.round(x) + 6, Math.round(y) - 5);
    });
    // the readout, top right
    if (readout) {
      const line = `${readout} · ${String(shown).padStart(2, '0')} objects`;
      const tw = ctx.measureText(line).width;
      ctx.fillStyle = css(ink, 0.85); ctx.fillText(line, W - tw - 20, 28);
    }
    // the crosshair under the pointer
    if (mx >= 0) {
      ctx.strokeStyle = css(ink, 0.5); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(0, my + 0.5); ctx.lineTo(W, my + 0.5); ctx.moveTo(mx + 0.5, 0); ctx.lineTo(mx + 0.5, H); ctx.stroke();
      ctx.setLineDash([]);
      const u = ((mx - P.x) / P.w).toFixed(3), v = ((my - P.y) / P.h).toFixed(3);
      ctx.fillStyle = css(ink, 0.9); ctx.fillText(`${u}, ${v}`, mx + 10, my - 10);
    }
  }
  size();
  const ro = new ResizeObserver(() => { size(); draw(a.selfMove ? null : null); if (L) L.wake(); });
  ro.observe(el);
  if (media && !media.complete && media.tagName === 'IMG') media.addEventListener('load', () => { draw(null); L && L.wake(); }, { once: true });
  draw(null);
  if (!a.live && !a.pointer) { setState(el, 'still', a.why); return null; }
  if (a.pointer) {
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; L.wake(); });
    el.addEventListener('pointerleave', () => { mx = -1; L.wake(); });
  }
  let T = 0;
  var L = loop(el, (dt) => { if (a.selfMove) T += dt; draw(a.selfMove ? T : null); return a.selfMove; }, { fps: 30 });
  if (a.selfMove) {
    if (media && media.tagName === 'VIDEO') { media.muted = true; media.playsInline = true; media.loop = true; media.play().catch(() => {}); }
    pauseButton(el, { pause() { L.pause(); media && media.pause && media.pause(); }, resume() { L.resume(); media && media.play && media.play().catch(() => {}); } }, 'the scan');
    setState(el, 'live');
  } else setState(el, 'still', a.why);
  return { pause: () => L.pause(), resume: () => L.resume(), destroy() { L.stop(); ro.disconnect(); cv.remove(); } };
});
