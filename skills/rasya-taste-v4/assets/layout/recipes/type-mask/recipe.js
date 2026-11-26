/*
  hero recipe: type-mask (refs: Donprod, Infinite Machine, Remote; references/hero-recipes.md). One word, the client's
  name or the one noun the page is about, set across the whole wrap at the hero's foot, with the client's photograph
  (or, on tech, its film) showing through the letters. The h1, the line and the button stay above it in plain type;
  the word is a picture (aria-hidden, inside a role="img" mount), never the headline.
  The word is fitted to the wrap's width and the space left under the buttons. The pointer moves the picture inside
  the letters a little; as the hero scrolls away the picture slides up through them. A film (tech only) plays
  muted inside the letters on one canvas, with a pause button; everywhere else it is the photograph, still.

  <div class="rr rr--type-mask" data-recipe="type-mask" role="img" aria-label="..">
    <span class="rr-tm__word" aria-hidden="true">Halden</span>
    <img class="rr-tm__src" data-rr-slot="fill" src="assets/img/recipes/fill.jpg" alt="">        the picture in the letters
    <video class="rr-tm__film" data-rr-slot="film" src=".." poster=".." muted playsinline loop></video>   optional, tech
  </div>
  The still is the word with the photograph through it, drawn by CSS (background-clip: text) before any script.
*/
import { allowance, mountAll, setState, loop, pointer, damp, heroScroll, pauseButton, whenReady } from '../_shared/recipe-kit.js';

function fit(el, word) {
  // the largest size at which the word spans the mount's width and fits its height
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  word.style.fontSize = '100px';
  const range = document.createRange();
  range.selectNodeContents(word);
  const w = range.getBoundingClientRect().width || 1, cap = 0.74;   // the text's own width; the cap height of a grotesk
  const byW = (r.width / w) * 100 * 0.995;
  const byH = r.height / cap;
  word.style.fontSize = Math.max(48, Math.min(byW, byH)).toFixed(1) + 'px';
}

mountAll('type-mask', (el) => {
  const word = el.querySelector('.rr-tm__word');
  const src = el.querySelector('.rr-tm__src');
  const film = el.querySelector('video.rr-tm__film');
  if (!word) return null;
  if (src) word.style.setProperty('--rr-fill', `url("${src.currentSrc || src.src}")`);
  const refit = () => fit(el, word);
  refit();
  document.fonts && document.fonts.ready.then(refit);
  const ro = new ResizeObserver(refit);
  ro.observe(el);
  const a = allowance({ canvas: !!film });
  let px = 0, py = 0, tx = 0, ty = 0, sc = 0;
  const apply = () => word.style.setProperty('--rr-pos', `${(50 + px * 6).toFixed(2)}% ${(50 + py * 5 + sc * 30).toFixed(2)}%`);
  const stopPtr = a.pointer ? pointer(el, (x, y, inside) => { tx = inside ? x : 0; ty = inside ? y : 0; L.wake(); }) : () => {};
  let stopScroll = () => {};
  const L = loop(el, (dt) => { px = damp(px, tx, 4, dt); py = damp(py, ty, 4, dt); apply(); return Math.abs(px - tx) + Math.abs(py - ty) > 0.002; });
  if (!a.reduced) whenReady((m) => { stopScroll = heroScroll(el, (p) => { sc = p; apply(); }, m); });

  // the film inside the letters (tech only): one 2D canvas, the frame drawn, then the word cut out of it
  let filmLoop = null;
  if (film && a.live && a.selfMove) {
    const cv = document.createElement('canvas');
    cv.className = 'rr-live';
    cv.setAttribute('aria-hidden', 'true');
    el.appendChild(cv);
    const ctx = cv.getContext('2d');
    film.muted = true; film.playsInline = true; film.loop = true;
    const draw = () => {
      const r = el.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
      if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const W = cv.width, H = cv.height, vw = film.videoWidth || 16, vh = film.videoHeight || 9;
      const s = Math.max(W / vw, H / vh) * 1.12;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(film, (W - vw * s) / 2 + px * W * 0.03, (H - vh * s) / 2 + (py * 0.03 - sc * 0.15) * H, vw * s, vh * s);
      ctx.globalCompositeOperation = 'destination-in';
      const cs = getComputedStyle(word), wr = word.getBoundingClientRect();
      ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * dpr}px ${cs.fontFamily}`;
      ctx.letterSpacing = (parseFloat(cs.letterSpacing) || 0) * dpr + 'px';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#000';
      const base = (wr.top - r.top) * dpr + parseFloat(cs.fontSize) * dpr * 0.8;
      ctx.fillText(word.textContent.trim(), (wr.left - r.left) * dpr, base);
    };
    const start = () => film.play().then(() => {
      filmLoop = loop(el, () => { draw(); return true; }, { fps: 30 });
      setState(el, 'live');
      pauseButton(el, { pause() { film.pause(); filmLoop.pause(); }, resume() { film.play(); filmLoop.resume(); } }, 'the film');
    }).catch(() => setState(el, 'still', 'autoplay'));
    whenReady(start);
  } else setState(el, 'still', film ? a.why || 'other' : '');
  return {
    pause: () => filmLoop && filmLoop.pause(), resume: () => filmLoop && filmLoop.resume(),
    destroy() { L.stop(); ro.disconnect(); stopPtr(); stopScroll(); filmLoop && filmLoop.stop(); },
  };
});
