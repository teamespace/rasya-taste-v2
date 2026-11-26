/*
  rasya-taste-v4 nav templates: the demo frame helper of the nav-<id>.html pages only (demo.html frames them). Never
  copied into a page. ?scroll=1200 scrolls the page there (from a little below, so a bar that hides going down comes
  back as it would on the way up); ?open=1 opens the phone menu through the kit's toggle; ?mega=1 holds the first
  mega panel open.
*/
(() => {
  const q = new URLSearchParams(location.search);
  const y = parseInt(q.get('scroll') || '0', 10) || 0;
  const to = (v) => {
    const L = window.rtMotion && window.rtMotion.lenis;
    if (L && typeof L.scrollTo === 'function') L.scrollTo(v, { immediate: true, force: true }); else window.scrollTo(0, v);
  };
  const go = () => {
    if (y) { to(y + 160); setTimeout(() => to(y), 260); }
    if (q.get('mega') === '1') { const it = document.querySelector('header.nav .nav__item:has(> .nav__menu)'); if (it) it.classList.add('nv-force'); }
    if (q.get('open') === '1') setTimeout(() => { const t = document.querySelector('header.nav .nav__toggle'); if (t) t.click(); }, y ? 700 : 200);
  };
  if (document.readyState === 'complete') setTimeout(go, 600); else addEventListener('load', () => setTimeout(go, 600), { once: true });
})();
