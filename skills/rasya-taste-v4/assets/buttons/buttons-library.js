/*
  rasya-taste-v4 buttons-library.js - the two button looks that need a script (buttons-library.css,
  references/buttons.md). Load it once, deferred, only when the deal printed it:

    <script src="assets/buttons/buttons-library.js" defer></script>

  roll      wraps the words of every .btn label in <span class="bl-l"> (the accessible name is unchanged), so the
            label can roll; without the script the look is the colour change alone.
  magnetic  leans a .btn up to 4px across and 3px down toward a fine pointer (the CSS translate property, so the
            motion layer's 1px step and press still apply) and eases it back when the pointer leaves. Never on
            touch, under prefers-reduced-motion, with data-motion="off" or on a button wider than 480px (the wide
            close). It runs only while a pointer moves over a button: no frame loop at rest.

  The look is read from <html data-buttons>; any other look makes this file do nothing. A page that adds buttons
  later calls window.rtButtons.init(rootElement).
*/
(() => {
  'use strict';
  const root = document.documentElement;
  const look = () => root.getAttribute('data-buttons') || '';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* roll: the label's own text nodes go into one span each; svg.m-arrow and other elements stay as they are */
  function wrapLabel(btn) {
    if (btn.querySelector(':scope > .bl-l')) return;
    for (const node of Array.from(btn.childNodes)) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      const span = document.createElement('span');
      span.className = 'bl-l';
      node.replaceWith(span);
      span.append(node);
    }
  }

  /* magnetic */
  const PULL_X = 0.14, PULL_Y = 0.22, MAX_X = 4, MAX_Y = 3, EASE = 0.2, WIDEST = 480;
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  const allowed = () => look() === 'magnetic' && finePointer.matches && !reduced.matches && root.getAttribute('data-motion') !== 'off';

  function magnet(btn) {
    if (btn.__rtMagnet) return;
    btn.__rtMagnet = true;
    let x = 0, y = 0, tx = 0, ty = 0, frame = 0;
    const paint = () => { btn.style.translate = x || y ? `${x.toFixed(2)}px ${y.toFixed(2)}px` : ''; };
    const step = () => {
      x += (tx - x) * EASE; y += (ty - y) * EASE;
      if (Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05) { x = tx; y = ty; frame = 0; }
      else frame = requestAnimationFrame(step);
      paint();
    };
    const run = () => { if (!frame) frame = requestAnimationFrame(step); };
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !allowed()) return;
      const r = btn.getBoundingClientRect();
      if (r.width > WIDEST) return;
      // the centre at rest: the rect already carries the lean
      const cx = r.left + r.width / 2 - x, cy = r.top + r.height / 2 - y;
      tx = clamp((e.clientX - cx) * PULL_X, MAX_X);
      ty = clamp((e.clientY - cy) * PULL_Y, MAX_Y);
      run();
    });
    const release = () => { tx = 0; ty = 0; run(); };
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('blur', release);
  }
  // a setting changed while the page is open: no lean left behind
  const settle = () => { if (!allowed()) document.querySelectorAll('.btn').forEach((b) => { b.style.translate = ''; }); };
  reduced.addEventListener?.('change', settle);
  finePointer.addEventListener?.('change', settle);

  function init(scope = document) {
    const l = look();
    if (l === 'roll') scope.querySelectorAll('.btn').forEach(wrapLabel);
    else if (l === 'magnetic') scope.querySelectorAll('.btn').forEach(magnet);
  }

  window.rtButtons = { init, wrapLabel };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
})();
