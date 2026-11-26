#!/usr/bin/env node
/*
  rasya-taste-v4 make-topo.mjs - draws the topographic contour lines used by bg-library.css (data-bg="topo").
  A smooth seeded height field, marching squares at 11 levels, segments chained into polylines, printed as
  one SVG (black strokes on nothing: bg-library.css uses it as a mask, so the colour comes from the tokens).

    node assets/backgrounds/lib/make-topo.mjs > assets/backgrounds/lib/topo.svg
*/
const W = 1600, H = 1000, N = 160, M = 100, LEVELS = 24;
let s = 7;
const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const hills = Array.from({ length: 11 }, () => ({ x: rnd() * W, y: rnd() * H, r: 150 + rnd() * 260, a: (rnd() < 0.3 ? -1 : 1) * (0.6 + rnd()) }));
const f = (x, y) => {
  let v = 0;
  for (const h of hills) v += h.a * Math.exp(-((x - h.x) ** 2 + (y - h.y) ** 2) / (2 * h.r * h.r));
  return v + 0.18 * Math.sin(x / 210 + Math.cos(y / 260) * 1.7) + 0.12 * Math.cos(y / 170 - x / 400);
};
const gx = i => (i / N) * W, gy = j => (j / M) * H;
const val = []; let lo = Infinity, hi = -Infinity;
for (let j = 0; j <= M; j++) { val[j] = []; for (let i = 0; i <= N; i++) { const v = f(gx(i), gy(j)); val[j][i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); } }
const paths = [];
for (let L = 1; L <= LEVELS; L++) {
  const t = lo + (hi - lo) * (L / (LEVELS + 1));
  const segs = [];
  const lerp = (a, b, va, vb) => a + (b - a) * ((t - va) / (vb - va));
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const a = val[j][i], b = val[j][i + 1], c = val[j + 1][i + 1], d = val[j + 1][i];
    const pts = [];
    if ((a < t) !== (b < t)) pts.push([lerp(gx(i), gx(i + 1), a, b), gy(j)]);
    if ((b < t) !== (c < t)) pts.push([gx(i + 1), lerp(gy(j), gy(j + 1), b, c)]);
    if ((d < t) !== (c < t)) pts.push([lerp(gx(i), gx(i + 1), d, c), gy(j + 1)]);
    if ((a < t) !== (d < t)) pts.push([gx(i), lerp(gy(j), gy(j + 1), a, d)]);
    if (pts.length === 2) segs.push(pts);
    else if (pts.length === 4) { segs.push([pts[0], pts[1]]); segs.push([pts[2], pts[3]]); }
  }
  const key = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const ends = new Map();
  segs.forEach((sg, k) => { for (const p of sg) { const kk = key(p); (ends.get(kk) || ends.set(kk, []).get(kk)).push(k); } });
  const used = new Set();
  for (let k = 0; k < segs.length; k++) {
    if (used.has(k)) continue;
    used.add(k);
    const line = [segs[k][0], segs[k][1]];
    for (const dir of [1, 0]) {
      for (;;) {
        const tip = dir ? line[line.length - 1] : line[0];
        const nx = (ends.get(key(tip)) || []).find(q => !used.has(q));
        if (nx == null) break;
        used.add(nx);
        const [p, q] = segs[nx];
        const next = key(p) === key(tip) ? q : p;
        if (dir) line.push(next); else line.unshift(next);
      }
    }
    if (line.length < 6) continue;
    const pts = line.filter((_, i) => i % 2 === 0 || i === line.length - 1);
    paths.push('M' + pts.map(p => Math.round(p[0]) + ' ' + Math.round(p[1])).join('L'));
  }
}
process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><path fill="none" stroke="#000" stroke-width="1.3" stroke-linejoin="round" d="${paths.join('')}"/></svg>\n`);
