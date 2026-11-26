/*
  taste-skill layout-check.js - the layout v4 checks, run in the page (references/layout-v4.md, sections 1c and 2).
  A plain script with no imports, so a checker can evaluate its source in any page:
      const src = fs.readFileSync('<skill>/assets/layout/layout-check.js', 'utf8');
      await page.evaluate(src + '; window.lyCheck()')      // -> { vw, vh, L, R, nav, sections, findings }
  assets/layout/check.mjs runs it in one headless Chrome at 1440x900 and 390x844.

  Rules checked (each finding: { rule, where, detail }):
    edge-left / edge-right   a block of the page (text column, frame, card, grid, button row, the nav's
                             logo and actions, the footer) starts or ends off the page's lines: L, R
                             and the 12 column lines between them. A centred block is centred on the page
                             axis; a full-bleed one runs edge to edge.
    bleed-one-side           a block runs out to one viewport edge only (house rule: left and right edges
                             always the same): it stands on the lines or runs edge to edge.
    lines                    section-level text starts on more than two left lines (L and one split line).
    spill                    a block runs past L or R without reaching the viewport edge.
    one-sided                a section's visuals stop short of R (or of L) while the text holds the other
                             line, and the composition is not centred.
    screen-short             a section is shorter than one screen (the fixed header lies over its top).
    screen-height            a section is not exactly one or two screens tall (at 1280 and wider, and on a
                             phone; from 640 to 1279 a section may grow, but never past two screens). A live
                             photo-chapters section (.is-live) is a whole number of screens, up to four.
    sparse                   a section's content fills under 50% of it (the aim is 55%); a dealt statement
                             moment's own section (.statement holding a data-moment, or any section holding word-highlight) is type by design;
                             a live hold (photo-chapters, or a v4 hold: gallery-runs, photo-expands, stacked-panels, scroll-stage) is
                             left out: its sticky stage fills each viewport, not its whole box.
    neighbour                with a section framed as the judge frames it (its top at the top of the
                             screen, and again one screen down when it is two screens tall), ink of
                             another section shows.
    neighbour-ground         ... or another section's own ground (a colour band) shows.
    hero-fold                the hero does not fill the first screen, runs past it (taller than one
                             screen), or the next section shows on it.
  The hero's composition (rasya-taste-v4.1, layout-v4.md section 3, Hero composition):
    hero-cta-detached        FAIL: the hero's primary .btn is more than 160px from the h1 and its sub-line (the
                             gap between the button's box and theirs), sits in another column (no x of the h1
                             or the sub-line above or beside it), or stands above the h1.
    hero-parts               WARN at four visual parts, FAIL at five or more. A part is a picture the eye reads on
                             its own: a frame, photograph, panel, stage or window that draws (a ground, a border,
                             a shadow or a picture), each piece laid in a frame (.ly-piece but the frame's main
                             or only one, .ly-float), and each piece of a frame that draws nothing (a free
                             collage: its pieces float, so each counts). Words, buttons, facts, icons and logos
                             under 96x64, the background layers (.rbg) and an aria-hidden full-bleed ground
                             are not parts.
    hero-offgrid             WARN: a part's left or right edge (as it shows, cut by its frames) more than 12px off
                             every column line, the wrap's edges and the viewport's (a full bleed); a piece laid
                             in a frame may also take the frame's edge and its declared inset line (--ly-inset).
                             A part centred on the page axis is centred, not off.
  Each finding carries sev: lyCheck() returns the FAILs in findings and the WARNs in warnings (check.mjs
  fails the page on findings only).
  Elements inside a visual (cards, frames, panels, stages, UI fragments, a collage) are not page edges.
  data-edge-free on an element skips it; data-screen="free" on a section skips the screen rules.
*/
window.lyCheck = function lyCheck(opts = {}) {
  const tol = opts.tol ?? 1.5;
  const vw = document.documentElement.clientWidth, vh = innerHeight, sy = scrollY;
  const out = [], add = (rule, where, detail, sev = 'FAIL') => out.push({ rule, where, detail, sev });
  const R1 = n => Math.round(n * 10) / 10;
  const name = el => {
    if (!el) return '?';
    const sec = el.closest('main > *, header, footer');
    const sid = sec ? (sec.id ? '#' + sec.id : sec.tagName.toLowerCase() + (sec.className ? '.' + String(sec.className).trim().split(/\s+/).slice(0, 2).join('.') : '')) : '';
    const own = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32);
    return `${sid} ${own}${txt ? ` "${txt}"` : ''}`.trim();
  };
  const shown = el => {
    const c = getComputedStyle(el);
    if (c.display === 'none' || c.visibility === 'hidden') return false;
    for (let e = el; e && e !== document.body; e = e.parentElement) if (parseFloat(getComputedStyle(e).opacity) === 0 || e.hasAttribute('inert')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };

  /* the lines */
  const box = document.querySelector('main :is(.wrap, .container)') || document.querySelector('.wrap, .container');
  if (!box) return { vw, vh, findings: [{ rule: 'container', where: 'page', detail: 'no .wrap', sev: 'FAIL' }], warnings: [] };
  const bc = getComputedStyle(box), br = box.getBoundingClientRect();
  const L = br.left + parseFloat(bc.paddingLeft), R = br.right - parseFloat(bc.paddingRight);
  const gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 24;
  const cols = 12;   // system.css's .grid has 12 columns at every width (a phone spans them all, a footer column six)
  const col = (R - L - (cols - 1) * gut) / cols;
  const starts = [], ends = [];
  for (let k = 0; k < cols; k++) { starts.push(L + k * (col + gut)); ends.push(L + k * (col + gut) + col); }
  const onStart = x => starts.some(s => Math.abs(x - s) <= tol);
  const onEnd = x => ends.some(e => Math.abs(x - e) <= tol);
  const centred = r => Math.abs((r.left + r.right) / 2 - vw / 2) <= tol + 0.5;

  /* the blocks: page-level elements, never what sits inside a visual */
  const INSIDE = 'ul, ol, dl, [role="img"], [aria-hidden="true"], .card, .tile, .ui, [data-ui], [data-ui-load], .stage, .nav__menu, .menu-card, .frame, .panel, figure, .hero__media, .hero__art, .hero__stage, .hero__window, .hero__plate, .ly-collage, .ly-tri, .btn-row, svg, [data-edge-free], table, .photo-band__text .btn-row, details';
  const SEL = 'main section > :is(.wrap, .container) > *, main .hero-text > *, main .grid > *, main :is(h1, h2, h3, p, .btn-row, figure, .frame, .panel, .card, .tile, .hero__media, .hero__art, .hero__stage, .hero__window, .hero__plate, .ly-collage, .ly-tri, .hero__facts, table, ul, ol, dl), footer :is(.wrap, .container) > *, footer .grid > *';
  const TEXT = /^(H1|H2|H3|H4|P|UL|OL|DL|BLOCKQUOTE)$/;
  const VISUAL = 'img, video, canvas, picture, iframe, table, .card, .frame, .panel, .tile, .grid, .hero__media, .hero__art, .hero__stage, .hero__window, .hero__plate, .ly-collage, .ly-tri, .ly-tri__panel, .ly-piece';
  // words in a solid box (the photo hero's box, a photo band's box): the box stands on the line and its
  // words sit its padding in, so they are measured as the box, not as a page column
  const inBox = el => {
    for (let a = el.parentElement; a && !a.matches('main > *, body'); a = a.parentElement) {
      const cs = getComputedStyle(a), bg = cs.backgroundColor;
      if (parseFloat(cs.paddingLeft) > 0 && bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(bg)) return true;
    }
    return false;
  };
  const blocks = [...new Set(document.querySelectorAll(SEL))].filter(el => {
    if (el.matches('[data-edge-free], script, style, template')) return false;
    if (el.parentElement && el.parentElement.closest(INSIDE)) return false;
    if (inBox(el)) return false;
    const p = getComputedStyle(el).position;
    if (p === 'absolute' || p === 'fixed') return false;
    if (getComputedStyle(el).display.startsWith('inline') && !el.matches('.btn-row')) return false;
    return shown(el);
  });
  const bySection = new Map();
  for (const el of blocks) {
    const r = el.getBoundingClientRect();
    const full = r.left <= 0.5 && r.right >= vw - 0.5;
    const bleedR = !full && r.right >= vw - 0.5, bleedL = !full && r.left <= 0.5;
    // a text block (a heading, a paragraph, a list, a button row, or a wrapper holding only those) must start on a
    // line; only frames, cards, grids and pictures must also end on one
    const text = TEXT.test(el.tagName) || el.matches('.section-head, .hero__text, .btn-row, .hero__head > div') || ((el.textContent || '').trim().length > 0 && !el.querySelector(VISUAL));
    const cen = centred(r) && (getComputedStyle(el).textAlign === 'center' || el.parentElement && getComputedStyle(el.parentElement).textAlign === 'center' || getComputedStyle(el.parentElement || el).justifyItems === 'center' || Math.abs(r.width - (R - L)) > 2);
    const sec = el.closest('main > *');
    if (sec) { if (!bySection.has(sec)) bySection.set(sec, []); bySection.get(sec).push({ el, r, full, bleedR, bleedL, text, cen }); }
    if (full) continue;
    if (bleedR) { add('bleed-one-side', name(el), `runs from x ${R1(r.left)} out to the right viewport edge; the left side stays at ${R1(L)}`); continue; }
    if (bleedL) { add('bleed-one-side', name(el), `runs from the left viewport edge to x ${R1(r.right)}; the right side stays at ${R1(vw - R)} from the edge`); continue; }
    if (r.left < L - tol || r.right > R + tol) {
      if (!(cen && el.closest('[data-bleed], .bleed-r, .bleed-l'))) add('spill', name(el), `x ${R1(r.left)} to ${R1(r.right)}, the page runs ${R1(L)} to ${R1(R)}`);
      continue;
    }
    if (cen && !(Math.abs(r.left - L) <= tol)) continue;      // centred on the axis: fine both sides
    if (!onStart(r.left)) add('edge-left', name(el), `starts at x ${R1(r.left)}; the lines are ${R1(L)} and the column starts`);
    if (!text && !onEnd(r.right)) add('edge-right', name(el), `ends at x ${R1(r.right)}; the right line is ${R1(R)}`);
  }

  /* one-sided sections: visuals that stop short of the right line while text holds the left one */
  for (const [sec, list] of bySection) {
    const vis = list.filter(b => !b.text && !b.full && b.el.matches('figure, .frame, .panel, .card, .tile, .grid, .hero__media, .hero__art, .hero__stage, .ly-collage, .ly-tri, .hero__window, .hero__plate, .hero__facts, img, video, canvas, table'));
    if (!vis.length) continue;
    const uL = Math.min(...vis.map(b => b.r.left)), uR = Math.max(...vis.map(b => b.r.right));
    const all = list.filter(b => !b.full);
    const aL = Math.min(...all.map(b => b.r.left));
    const sym = Math.abs((uL - L) - (R - uR)) <= tol + 1;
    if (!sym && uR < R - tol && !vis.some(b => b.bleedR) && aL <= L + tol) add('one-sided', name(sec), `its visuals end at x ${R1(uR)}, short of the right line ${R1(R)}`);
  }

  /* left lines: every page heading and lead starts on L or on one split line (the same on every split) */
  const heads = [...document.querySelectorAll('main :is(h1, h2, .hero__lead, .section-head > p)')].filter(e => shown(e) && !e.closest(INSIDE.replace(', .btn-row', '')) || (e.matches('h1') && shown(e)));
  const lefts = [];
  for (const e of heads) {
    const r = e.getBoundingClientRect(), ta = getComputedStyle(e).textAlign;
    if (ta === 'center' || centred(r) && Math.abs(r.left - L) > tol) continue;
    if (e.closest('.hero__media, .hero__over') || inBox(e)) continue;   // words inside a picture (the film's frame) or a solid box are not a page line
    if (!lefts.some(x => Math.abs(x - r.left) <= 4)) lefts.push(r.left);
  }
  const extra = lefts.filter(x => Math.abs(x - L) > 4);
  if (extra.length > 1) add('lines', 'page', `headings and leads start on ${lefts.length} lines (x ${lefts.map(R1).join(', ')}); the page has ${R1(L)} and one split line`);

  /* nav and footer edges */
  const navEl = document.querySelector('header.nav, .nav');
  const logo = navEl && navEl.querySelector('.nav__logo');
  // nav-split puts the name on the page's centre line (sections-library.md); every other nav starts it on L
  const logoMid = logo && navEl.matches('.nav--split') && (r => Math.abs((r.left + r.right) / 2 - (L + R) / 2) <= tol + 0.5)(logo.getBoundingClientRect());
  if (logo && shown(logo) && !logoMid && Math.abs(logo.getBoundingClientRect().left - L) > tol) add('edge-left', 'nav logo', `at x ${R1(logo.getBoundingClientRect().left)}, the page's left line is ${R1(L)}${navEl.matches('.nav--split') ? ', or its centre on the centre line ' + R1((L + R) / 2) : ''}`);
  const acts = navEl && [...navEl.querySelectorAll('.nav__actions > *, .nav__toggle')].filter(shown);
  if (acts && acts.length) {
    const right = Math.max(...acts.map(a => a.getBoundingClientRect().right));
    if (Math.abs(right - R) > tol) add('edge-right', 'nav actions', `end at x ${R1(right)}, the page's right line is ${R1(R)}`);
  }

  /* screens */
  const navPos = navEl ? getComputedStyle(navEl).position : 'static';
  const navH = navEl && (navPos === 'sticky' || navPos === 'fixed') ? navEl.getBoundingClientRect().height : 0;
  // one screen is the whole viewport: the header is fixed over the top of every section (system.css)
  const screen = navPos === 'fixed' ? vh : Math.min(vh - navH, 1200);
  const secs = [...document.querySelectorAll('main > section, main > div.section')].filter(shown);
  // a picture's own frame (role=img, a figure) is content too, so a framed visual counts at its full size
  const INK = 'h1, h2, h3, h4, p, li, dt, dd, blockquote, img, video, canvas, svg, .btn, .card, .frame, .panel, .tile, .hero__media, .hero__art, .hero__stage, .hero__window, .hero__plate, .ly-tri__panel, .ly-piece, hr, .ly-rule, table, figure, [role="img"]';
  const doc = r => ({ top: r.top + sy, bottom: r.bottom + sy, left: r.left, right: r.right });
  // ink: every visual, and every element that holds text of its own (a <strong> or <span> in a stat counts)
  const ownText = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  // a piece cut by a frame (overflow hidden or clip) counts only where it shows
  const clipped = (e, stop) => {
    const r = e.getBoundingClientRect(); let t = r.top, b = r.bottom, l = r.left, rr = r.right;
    for (let p = e.parentElement; p && p !== stop.parentElement; p = p.parentElement) {
      const o = getComputedStyle(p); if (o.overflow === 'visible' && o.overflowX === 'visible' && o.overflowY === 'visible') continue;
      const q = p.getBoundingClientRect(); t = Math.max(t, q.top); b = Math.min(b, q.bottom); l = Math.max(l, q.left); rr = Math.min(rr, q.right);
    }
    return { top: t, bottom: b, left: l, right: rr };
  };
  const inkOf = sec => [...sec.querySelectorAll('*')].filter(e => (e.matches(INK) || ownText(e)) && shown(e) && !e.closest('[data-edge-free]')).map(e => doc(clipped(e, sec))).filter(r => r.bottom - r.top > 1 && r.right > 0 && r.left < vw && r.right - r.left > 1);
  const bgOf = el => { const c = getComputedStyle(el); return c.backgroundImage !== 'none' ? 'image' : (/rgba\(.*,\s*0\)$|transparent/.test(c.backgroundColor) ? null : c.backgroundColor); };
  const info = secs.map(s => {
    const r = doc(s.getBoundingClientRect());
    const ink = inkOf(s);
    const cTop = ink.length ? Math.min(...ink.map(i => i.top)) : r.top, cBot = ink.length ? Math.max(...ink.map(i => i.bottom)) : r.bottom;
    // a live photo-chapters section is (hold + 1) screens by design, three or four (moments.md): whole screens, up to four
    const chapters = s.matches('[data-moment="photo-chapters"].is-live') || !!s.querySelector('[data-moment="photo-chapters"].is-live');
    // a dealt statement moment's own section (one statement alone in its screen, sections.md) is type on its ground by
    // design, as the checker reads it: never sparse
    const stmt = (s.matches('.statement, [class*="section--statement"], [data-statement]') && (s.matches('[data-moment]') || !!s.querySelector('[data-moment]')))
      || s.matches('[data-moment="word-highlight"]') || !!s.querySelector('[data-moment="word-highlight"]');
    // rasya-taste-v4: a live v4 hold (gallery-runs, photo-expands, stacked-panels, scroll-stage) is whole screens, three at most
    const HOLD = '[data-moment="gallery-runs"].is-live, [data-moment="photo-expands"].is-live, [data-moment="stacked-panels"].is-live, [data-moment="scroll-stage"].is-live';
    const hold = s.matches(HOLD) || !!s.querySelector(HOLD);
    return { el: s, r, ink, cTop, cBot, bg: bgOf(s), free: s.matches('[data-screen="free"], [data-screen="band"]'), band: s.matches('[data-screen="band"]'), most: chapters ? 4 : (hold || s.matches('[data-screen="tall"]') ? 3 : 2), chapters, hold, stmt };
  });
  const pageBg = getComputedStyle(document.body).backgroundColor;
  const footer = document.querySelector('body > footer, footer.footer');
  info.forEach((s, i) => {
    const h = s.r.bottom - s.r.top;
    if (!s.free && h < screen - tol) add('screen-short', name(s.el), `${Math.round(h)}px tall; one screen under the nav is ${Math.round(screen)}px`);
    // a phone section is at least its screens and grows with what it holds (system.css): taller than a screen and
    // filled by its content (0.7 of it or more, the rest is its padding) it is not off its count; one that grows
    // past two screens still is (--hm: 2 and two groups, or less content)
    const grown = vw < 640 && h > screen + tol && h <= 2 * screen + tol && (s.cBot - s.cTop) / h >= 0.7;
    // a live photo-chapters section is sized in whole viewports by its own CSS, whatever the nav, so it is counted in
    // viewports too (under a sticky nav a screen is the viewport less the nav)
    const u = s.chapters ? vh : screen;
    const exact = (vw >= 1280 || vw < 640) && !grown, off = Math.min(...Array.from({ length: s.most }, (_, k) => Math.abs(h - (k + 1) * u)));
    if (!s.free && i > 0 && ((exact && off > tol) || h > s.most * u + tol)) add('screen-height', name(s.el), `${Math.round(h)}px, ${(h / u).toFixed(2)} screens; ${s.chapters ? 'a live photo-chapters section is a whole number of screens, four at most' : s.hold ? 'a live v4 hold is a whole number of screens, three at most' : `a section is exactly one or two (--h)${vw < 640 ? ', or on a phone at least one that its content fills' : ''}`}`);
    // a live hold (photo-chapters, a v4 hold) is whole screens of scroll round one sticky stage: its fill is the stage's
    // in each viewport, not its ink against the whole box, so sparse leaves it out (its composition at rest is checked)
    if (!s.free && !s.stmt && !s.hold && !s.chapters && i > 0 && s.ink.length && (s.cBot - s.cTop) / h < 0.5) add('sparse', name(s.el), `its content fills ${Math.round(100 * (s.cBot - s.cTop) / h)}% of its screen; merge it or give it its visual (0.55 is the aim)`);
    const ch = s.cBot - s.cTop;
    // frame the section as the judge does: its top at the top of the screen (the hero at scroll 0), and a
    // second frame one screen down when it is two screens tall; with a header that is not fixed, its top
    // under the nav
    const y0 = i === 0 ? 0 : (navPos === 'fixed' ? s.r.top : s.r.top - navH);
    s.frame = Math.max(0, Math.round(y0));
    if (s.band) return;   // v4.3: a band shares its screen with the next section by design (sections.md, Heights)
    const ys = [y0]; if (h > screen * 1.5 && i > 0) ys.push(y0 + screen);
    for (const y of ys) {
    const top = y + navH, bot = y + vh;
    info.forEach((o, j) => {
      if (j === i) return;
      const hit = o.ink.filter(k => k.bottom > top + 2 && k.top < bot - 2);
      if (hit.length) {
        const px = Math.max(...hit.map(k => Math.min(k.bottom, bot) - Math.max(k.top, top)));
        add('neighbour', name(s.el), `framed, ${Math.round(px)}px of ${name(o.el)} shows`);
      } else if (o.bg && o.bg !== s.bg && o.bg !== pageBg && o.r.bottom > top + 2 && o.r.top < bot - 2) {
        const px = Math.min(o.r.bottom, bot) - Math.max(o.r.top, top);
        add('neighbour-ground', name(s.el), `framed, ${Math.round(px)}px of ${name(o.el)}'s ground shows`);
      }
    });
    if (footer && !s.free) {
      const fr = doc(footer.getBoundingClientRect());
      if (fr.top < bot - 2 && fr.bottom > top) add('neighbour', name(s.el), `framed, ${Math.round(Math.min(fr.bottom, bot) - Math.max(fr.top, top))}px of the footer shows`);
    }
    }
  });
  if (info.length) {
    const hero = info[0];
    if (hero.r.top > navH + tol + (navPos === 'static' && navEl ? navEl.getBoundingClientRect().height : 0)) add('hero-fold', name(hero.el), `starts at y ${Math.round(hero.r.top)}, not under the nav`);
    if (hero.r.bottom < vh - tol) add('hero-fold', name(hero.el), `ends at y ${Math.round(hero.r.bottom)}, above the fold (${vh})`);
    // taller than one screen: a long h1 or lead pushed it past the fold (test heroes ran 1.2 to 1.38 screens)
    if (hero.r.bottom > vh + tol) add('hero-fold', name(hero.el), `ends at y ${Math.round(hero.r.bottom)}, past the fold (${vh}): ${((hero.r.bottom - hero.r.top) / screen).toFixed(2)} screens tall`);
    const next = info[1];
    if (next) {
      const hit = next.ink.filter(k => k.top < vh - 2);
      if (hit.length) add('hero-fold', name(next.el), `shows on the first screen from y ${Math.round(Math.min(...hit.map(k => k.top)))}`);
    }
  }
  /* the hero's numbers (heroes.json "at1440" / "at390"), measured, not read from the CSS */
  let hero = null;
  const hs = document.querySelector('main > section');
  if (hs) {
    const box = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + sy), w: Math.round(r.width), h: Math.round(r.height) }; };
    const h1 = hs.querySelector('h1'), lead = hs.querySelector('.hero__lead');
    // the lines of text: every text node's boxes, less the live word's waiting words (stacked under the slot)
    const lineCount = e => {
      if (!e) return 0;
      const fs = parseFloat(getComputedStyle(e).fontSize), tops = [];
      const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest('.ly-word > .is-next, .ly-word > .is-out')) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) { if (q.width < 2) continue; if (!tops.some(t => Math.abs(t - q.top) < fs * 0.5)) tops.push(q.top); }
      }
      return tops.length;
    };
    const btns = [...hs.querySelectorAll('.btn')].filter(shown);
    hero = {
      height: Math.round(hs.getBoundingClientRect().height),
      h1: h1 && { size: parseFloat(getComputedStyle(h1).fontSize), leading: R1(parseFloat(getComputedStyle(h1).lineHeight) / parseFloat(getComputedStyle(h1).fontSize) * 100) / 100, lines: lineCount(h1), ...box(h1) },
      lead: lead && { size: parseFloat(getComputedStyle(lead).fontSize), lineHeight: parseFloat(getComputedStyle(lead).lineHeight), lines: lineCount(lead), ...box(lead) },
      buttons: btns.length ? { n: btns.length, h: Math.round(btns[0].getBoundingClientRect().height), first: box(btns[0]) } : null,
      visual: box(hs.querySelector('.hero__media, .hero__art, .hero__stage, .ly-collage, .ly-tri, .hero__window, .hero__plate')),
    };
    heroComposition(hs);
  }
  return {
    vw, vh, L: R1(L), R: R1(R), nav: Math.round(navH), screen: Math.round(screen), hero,
    sections: info.map(s => ({ where: name(s.el), top: Math.round(s.r.top), height: Math.round(s.r.bottom - s.r.top), content: Math.round(s.cBot - s.cTop), frame: s.frame })),
    findings: out.filter(f => f.sev !== 'WARN'),
    warnings: out.filter(f => f.sev === 'WARN'),
  };

  /* the hero's composition (rasya-taste-v4.1; layout-v4.md section 3, Hero composition): the primary button in the
     h1 block, three visual parts at most, every part's edges on the lines. Measured as the screen shows it */
  function heroComposition(hs) {
    if (!shown(hs)) return;
    const rect = e => e.getBoundingClientRect();
    const label = e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);

    /* hero-cta-detached: the primary button stands in the h1 block, under the sub-line */
    const h1 = [...hs.querySelectorAll('h1')].find(shown);
    const next = h1 && h1.nextElementSibling;
    const sub = [...hs.querySelectorAll('.hero__lead, .hero-copy > .t-lead')].find(shown) || (next && next.matches('p') && shown(next) ? next : null);
    const NOT_CTA = '[aria-hidden="true"], [role="img"], .ly-piece, .ly-float, .ui, [data-ui], .loop-pause, .ly-play, .ly-spot, header, nav';
    const btns = [...hs.querySelectorAll('.btn')].filter(b => shown(b) && !b.closest(NOT_CTA));
    const cta = btns.find(b => b.matches('.btn--primary')) || btns[0];
    if (h1 && cta) {
      const blk = [h1, sub].filter(Boolean).map(rect);
      const u = { left: Math.min(...blk.map(r => r.left)), right: Math.max(...blk.map(r => r.right)), top: Math.min(...blk.map(r => r.top)), bottom: Math.max(...blk.map(r => r.bottom)) };
      const b = rect(cta);
      const gap = Math.hypot(Math.max(0, u.left - b.right, b.left - u.right), Math.max(0, u.top - b.bottom, b.top - u.bottom));
      const apart = b.right <= u.left + tol || b.left >= u.right - tol;
      const above = b.bottom <= rect(h1).top + tol;
      if (gap > 160 || apart || above) {
        const why = [gap > 160 ? `${Math.round(gap)}px from the h1 and its sub-line (160 at most)` : '', apart ? `in another column (x ${R1(b.left)} to ${R1(b.right)}; the h1 block runs ${R1(u.left)} to ${R1(u.right)})` : '', above ? 'above the h1' : ''].filter(Boolean).join(', ');
        add('hero-cta-detached', name(cta), `the primary button "${label(cta)}" is ${why}: it belongs in the h1 block, under the sub-line (h1, sub-line, button, then the picture)`);
      }
    }

    /* hero-parts and hero-offgrid */
    const PART = '.hero__bg, .hero-visual, .hero__media, .hero__art, .hero__stage, .hero__window, .hero__plate, .ly-tri__panel, .ly-collage, .ly-piece, .ly-float, figure, .frame, picture, img, video, canvas, iframe';
    const LAID = '.ly-piece, .ly-float';
    const SKIP = 'h1, h2, h3, p, .btn, .btn-row, .hero__facts, .hero__dock, .hero-strip, .hero__proof, .rbg, [data-bg], .ly-spot, .loop-pause, .mark, .pill, .ly-play';
    const clear = c => !c || c === 'transparent' || /(?:,|\/)\s*0(?:\.0+)?\s*\)$/.test(c);
    const draws = el => {
      if (el.matches('img, picture, video, canvas, iframe, svg')) return true;
      const c = getComputedStyle(el);
      return c.backgroundImage !== 'none' || !clear(c.backgroundColor) || c.boxShadow !== 'none'
        || (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && !clear(c.borderTopColor));
    };
    const hr = rect(hs);
    const ground = e => { const r = rect(e); return r.width >= hr.width - 2 && r.height >= hr.height * 0.9 && !!e.closest('[aria-hidden="true"]'); };
    const cands = [...hs.querySelectorAll(PART)].filter(e => !e.closest(SKIP) && shown(e) && (r => r.width >= 96 && r.height >= 64)(rect(e)) && !ground(e));
    const parts = [];
    const pieces = host => [...host.querySelectorAll(LAID)].filter(x => shown(x) && !(x.parentElement && x.parentElement.closest(LAID) && host.contains(x.parentElement.closest(LAID))));
    for (const e of cands) {
      const host = parts.find(p => p.el.contains(e));
      if (host) {
        // inside a part: a piece laid in it counts on its own, except the frame's main (or only) piece, which is its picture
        if (!e.matches(LAID) || host.el.matches(LAID) || e.matches('.ly-piece--main')) continue;
        if (e.matches('.ly-piece') && pieces(host.el).length < 2) continue;
        parts.push({ el: e, host: host.el });
      } else if (e.matches(LAID) || draws(e)) parts.push({ el: e, host: null });
    }
    const n = parts.length;
    const list = parts.slice(0, 6).map(p => p.el.tagName.toLowerCase() + (typeof p.el.className === 'string' && p.el.className.trim() ? '.' + p.el.className.trim().split(/\s+/)[0] : '')).join(', ');
    if (n > 4) add('hero-parts', name(hs), `${n} visual parts (${list}${n > 6 ? ', ...' : ''}): three at most, one of them the focal point`);
    else if (n > 3) add('hero-parts', name(hs), `${n} visual parts (${list}): three at most, one of them the focal point`, 'WARN');
    const LINES = [...starts, ...ends, L, R, 0, vw];
    const near = (x, ls) => Math.min(...ls.map(l => Math.abs(x - l)));
    for (const p of parts) {
      const r = clipped(p.el, hs);
      if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
      if (r.left <= 0.5 && r.right >= vw - 0.5) continue;                                      // a full bleed
      if (!p.host && Math.abs((r.left + r.right) / 2 - vw / 2) <= tol + 0.5) continue;           // centred on the page axis
      let ls = LINES;
      if (p.host) {
        const f = clipped(p.host, hs), ins = parseFloat(getComputedStyle(p.host).getPropertyValue('--ly-inset')) || 0;
        ls = LINES.concat([f.left, f.right, f.left + ins, f.right - ins]);
      }
      const dl = near(r.left, ls), dr = near(r.right, ls);
      if (dl > 12 || dr > 12) add('hero-offgrid', name(p.el), `${dl > 12 ? `its left edge x ${R1(r.left)} is ${Math.round(dl)}px` : ''}${dl > 12 && dr > 12 ? ' and ' : ''}${dr > 12 ? `its right edge x ${R1(r.right)} is ${Math.round(dr)}px` : ''} off every column line${p.host ? ' and its frame\'s inset line' : ''}: put it on the 12 columns or in its hero's slot (layout.css), never at an offset of its own`, 'WARN');
    }
  }
};
