#!/usr/bin/env node
/*
  rasya-taste-v4 footers.mjs - deals the page's ending, the close (footer.closing row 1) and the footer (row 2) as one
  pick, from the footer library (assets/footers/index.json "library": footer-emboss, footer-fade-word,
  footer-split-close, footer-outline-fill, footer-index) and the kit's own types ("kit": footer-columns, footer-dark,
  footer-statement, footer-visit, each with a close: close-type, close-photo, close-word). It replaces the footer and
  close fields of the one-liner (SKILL.md step 4). Rules: references/footers.md.

    node <skill>/scripts/footers.mjs pick --page <kind> [--nav <dealt nav>] [--buttons <look>] [--type <pairing id>]
                                     [--name "<Brand>"] [--photo] [--mood calm|crisp|playful|editorial] [--no-wordmark]
                                     [--library-only] [--exclude id,id] [--history .taste-skill/history.json]
                                     [--seed S] [--json]
    node <skill>/scripts/footers.mjs list [--page <kind>]
    node <skill>/scripts/footers.mjs fit --name "<Brand>" [--face serif|sans] [--inset 0]
    node <skill>/scripts/footers.mjs check <page.html>

  kind: software (saas, ai, app, developer tools, fintech), gaming, product (tech, hardware: the product lists),
  service, place, editorial (magazine, journal, blog, newsletter).
  pick prints the ending: for a library one the template to copy (assets/footers/footer-<id>.html, its <footer>
  only), the stylesheet and script lines, --ft-fit for the name and the close to pass to buttons.mjs --close; for a
  kit one the footer's classes and the starter's template parts. Run it after the one-liner (it needs the dealt nav)
  and before buttons.mjs. It reads and appends the "footers" list of the --history file (the file start.mjs,
  moments.mjs, backgrounds.mjs and buttons.mjs keep) and of the machine's global history (scripts/lib/history.mjs:
  $RASYA_TASTE_HISTORY, default ~/.rasya-taste/history.json; RASYA_TASTE_HISTORY=off or --no-global leaves it out).
  A kit pick is kept as "<footer>+<close>". The last ending is never dealt again while another fits; after a wordmark
  ending (a library wordmark or close-word) the next page gets none while another fits; every ending of the last six
  weighs less. A wordmark ending is never the default: it weighs under half a plain one (index.json "weights").
  --photo: a photograph is left for close-photo (else close-photo drops out; a place falls back to close-head).
  --type: the pairing start.mjs dealt (library/type.json); a serif or a sans display weighs the endings made for it.
  --name: the brand's name as the wordmark sets it; prints --ft-fit and lowers the wordmark endings for a long name.
  fit prints --ft-fit alone. check reads a built page (no browser): the ending's attribute, its stylesheet and
  script, the wordmark's aria-hidden and its place, the name in text, one giant name a page; it exits 1 on a FAIL.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGlobal, readJson, writeJsonAtomic } from './lib/history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'assets', 'footers', 'index.json');
const TYPES = path.join(HERE, '..', 'library', 'type.json');
const KINDS = {
  software: 'software', saas: 'software', ai: 'software', app: 'software', apps: 'software', dev: 'software', developer: 'software',
  'developer-tool': 'software', fintech: 'software',
  gaming: 'gaming', game: 'gaming', games: 'gaming',
  product: 'product', tech: 'product', hardware: 'product', device: 'product', brand: 'product', shop: 'product',
  service: 'service', studio: 'service', agency: 'service', firm: 'service', clinic: 'service',
  place: 'place', cafe: 'place', bakery: 'place', restaurant: 'place', bar: 'place', guesthouse: 'place', hotel: 'place',
  editorial: 'editorial', magazine: 'editorial', journal: 'editorial', blog: 'editorial', publication: 'editorial',
  newsletter: 'editorial', longform: 'editorial', 'long-read': 'editorial'
};
const MOODS = ['calm', 'crisp', 'playful', 'editorial'];
const NAVS = ['nav-mega', 'nav-cards', 'nav-centre', 'nav-split'];
const CSS = 'assets/footers/footers.css';
const JS = 'assets/footers/footers.js';
const LONG = 12;   // a name longer than this sets small across the page: the wordmark endings drop back

function die(m) { console.error('footers: ' + m); process.exit(1); }
function args(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { a._.push(t); continue; }
    const k = t.slice(2), v = argv[i + 1];
    if (v == null || v.startsWith('--')) a[k] = true; else { a[k] = v; i++; }
  }
  return a;
}
function rng(seed) {
  let h = 2166136261 >>> 0;
  for (const ch of String(seed)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  let s = h || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const str = (v) => (v && v !== true ? String(v) : '');
const list = (v) => str(v).split(',').map((s) => s.trim()).filter(Boolean);

export function loadIndex() {
  let idx;
  try { idx = JSON.parse(fs.readFileSync(INDEX, 'utf8')); } catch (e) { die(`cannot read ${INDEX}: ${e.message}`); }
  if (!Array.isArray(idx.library) || !idx.kit || !idx.kit.lists) die('index.json needs "library" and "kit.lists"');
  return idx;
}

/* the display face of a start.mjs pairing: serif (serif, slab) or sans */
export function faceOf(typeId) {
  if (!typeId) return null;
  if (typeId === 'serif' || typeId === 'sans') return typeId;
  try {
    const t = JSON.parse(fs.readFileSync(TYPES, 'utf8'));
    const all = Array.isArray(t) ? t : (t.types || t.pairings || Object.values(t));
    const p = all.find((x) => x && x.id === typeId);
    if (!p) return null;
    return p.class === 'serif' || p.class === 'slab' ? 'serif' : 'sans';
  } catch { return null; }
}

/* --ft-fit: the word's size in vw so its letters span (100 - 2 x inset)% of the width. An estimate from average
   advances (footers.js measures the real letters); tracking as footers.css sets it, -0.035em */
const NARROW = new Set([...'fijlrtI1!.,:;\'|()[]']);
const WIDE = new Set([...'mwMW@']);
export function fitFor(name, face = 'sans', inset = 0, track = -0.035) {
  const A = face === 'serif'
    ? { narrow: 0.29, lower: 0.5, wide: 0.78, cap: 0.68, digit: 0.52, space: 0.25, other: 0.5 }
    : { narrow: 0.27, lower: 0.55, wide: 0.84, cap: 0.67, digit: 0.57, space: 0.26, other: 0.55 };
  let em = 0, n = 0;
  for (const ch of String(name)) {
    n++;
    if (ch === ' ') em += A.space;
    else if (NARROW.has(ch)) em += A.narrow;
    else if (WIDE.has(ch)) em += A.wide * (ch === ch.toUpperCase() ? 1.15 : 1);
    else if (/\d/.test(ch)) em += A.digit;
    else if (/\p{Lu}/u.test(ch)) em += A.cap;
    else if (/\p{Ll}/u.test(ch)) em += A.lower;
    else em += A.other;
  }
  em += track * Math.max(0, n - 1);
  if (em <= 0) return null;
  return Math.round(((100 - 2 * inset) / em) * 10) / 10;
}

/* every ending this page may be dealt: the library's, then the kit's footer x close pairs (a kit footer weighs as
   one ending, shared among its closes) */
export function candidates(idx, { kind, photo = false, noWordmark = false, libraryOnly = false, exclude = [] }) {
  const W = idx.weights || {};
  const out = [];
  for (const v of idx.library) {
    if (!v.kinds.includes(kind) || exclude.includes(v.id) || exclude.includes(v.attr)) continue;
    if (noWordmark && v.wordmark) continue;
    out.push({ source: 'library', id: v.id, close: null, v, wordmark: !!v.wordmark, base: (W.library ?? 1.4) * (v.weight ?? 1) });
  }
  if (libraryOnly) return out;
  const L = idx.kit.lists[kind];
  if (!L) return out;
  let closes = L.closes.filter((c) => photo || !(idx.kit.closes[c] || {}).photo);
  if (!closes.length && L.noPhoto) closes = [L.noPhoto];
  closes = closes.filter((c) => !exclude.includes(c) && !(noWordmark && (idx.kit.closes[c] || {}).wordmark));
  for (const f of L.footers) {
    if (exclude.includes(f) || !closes.length) continue;
    for (const c of closes) {
      out.push({ source: 'kit', id: f, close: c, f: idx.kit.footers[f] || {}, c: idx.kit.closes[c] || {}, wordmark: !!(idx.kit.closes[c] || {}).wordmark, base: (W.kit ?? 1) / closes.length });
    }
  }
  return out;
}

/* the history's id of a pick: a library ending's id, or a kit footer and its close ("footer-dark+close-word"), so a
   list of plain ids (the global file's recent()) still says which ending was a wordmark */
export const historyId = (e) => (e.source === 'kit' ? `${e.id}+${e.close}` : e.id);
export function readPast(idx, ids) {
  return ids.map((key) => {
    const [id, close] = String(key).split('+');
    const v = idx.library.find((x) => x.id === id);
    return { id, key, wordmark: v ? !!v.wordmark : !!(close && (idx.kit.closes[close] || {}).wordmark) };
  });
}
// a local entry written before kit ids carried their close ({ id: 'footer-dark', close: 'close-word' })
const localIds = (list) => (Array.isArray(list) ? list : []).map((h) => (h && typeof h === 'object' && h.close && !String(h.id).includes('+') ? { ...h, id: `${h.id}+${h.close}` } : h));

const navOf = (e) => (e.v ? e.v.nav || [] : NAVS);
const moodOf = (e) => (e.v ? e.v.mood || [] : e.f.mood || []);

export function pool(idx, cands, { nav, buttons, mood, face, history = [], longName = false }) {
  const W = idx.weights || {};
  let p = cands;
  if (nav) { const fit = p.filter((e) => navOf(e).includes(nav)); if (fit.length >= 2) p = fit; }
  if (mood) { const m = p.filter((e) => moodOf(e).includes(mood)); if (m.length) p = m; }
  const last = history[history.length - 1];
  if (last) {
    const fresh = p.filter((e) => e.id !== last.id);
    if (fresh.length) p = fresh;                                   // never the same ending twice in a row
    if (last.wordmark) { const plain = p.filter((e) => !e.wordmark); if (plain.length) p = plain; }   // never two giant names in a row
  }
  const recent = history.slice(-6).map((h) => h.id);
  return p.map((e) => {
    let w = e.base;
    if (e.wordmark) w *= W.wordmark ?? 0.45;
    w *= Math.pow(W.recent ?? 0.45, recent.filter((id) => id === e.id).length);
    if (nav && !navOf(e).includes(nav)) w *= W.offNav ?? 0.3;
    if (buttons && e.v && !(e.v.buttons || []).includes(buttons)) w *= W.offButtons ?? 0.5;
    if (face && e.v && e.v.display && !e.v.display.includes(face)) w *= W.offFace ?? 0.6;
    if (longName && e.wordmark) w *= W.longName ?? 0.2;
    return { e, w };
  });
}

export function deal(idx, opts, rand) {
  const p = pool(idx, candidates(idx, opts), opts);
  if (!p.length) return null;
  let r = rand() * p.reduce((s, x) => s + x.w, 0), i = 0;
  while (i < p.length - 1 && (r -= p[i].w) > 0) i++;
  return p[i].e;
}

const closeAs = (e) => (e.v ? e.v.closeAs : e.close === 'close-head' ? 'close-word' : e.close);

function linesFor(e, fit) {
  const out = [];
  if (e.source === 'library') {
    const v = e.v;
    out.push(`copy the <footer> of ${v.template} (nothing else from it) in place of the starter's footer.closing;`);
    out.push('  delete the starter\'s close and links templates (close-photo, close-word, links-visit)');
    out.push('once a page, in <head> after assets/layout/layout.css:', `  <link rel="stylesheet" href="${CSS}">`);
    if (v.js) out.push('once, before </body>, after assets/motion/scroll.js:', `  <script src="${JS}" defer></script>`);
    if (v.wordmark) out.push(`on the footer: style="--ft-fit: ${fit ?? '<footers.mjs fit --name ..>'}"   (the wordmark's size in vw; footers.js fits it exactly)`);
  } else {
    out.push(`<footer class="${e.f.class}" id="contact" aria-labelledby="close-h">: the starter's footer.closing`);
    out.push(`  row 1: ${e.c.row1}`);
    out.push(`  row 2: ${e.f.row2}`);
    out.push(`no extra file (${CSS} may stay linked: it styles only footer.closing[data-footer])`);
  }
  return out;
}

function printPick(e, ctx, json) {
  const fit = e && e.wordmark && e.source === 'library' && ctx.name ? fitFor(ctx.name, ctx.face || (e.v.display || ['sans'])[0], 0) : null;
  if (json) {
    console.log(JSON.stringify({
      seed: ctx.seed, page: ctx.kind, nav: ctx.nav || null, buttons: ctx.buttons || null, name: ctx.name || null,
      pick: e && {
        id: e.id, source: e.source, close: e.source === 'kit' ? e.close : 'its own', closeAs: closeAs(e), wordmark: e.wordmark,
        attr: e.v ? e.v.attr : null, template: e.v ? e.v.template : null, class: e.source === 'kit' ? e.f.class : null,
        ground: e.v ? e.v.ground : null, css: e.source === 'library' ? CSS : null, js: e.v && e.v.js ? JS : null, fit,
        scrollMoment: !!(e.v && e.v.scrollMoment)
      },
      lines: e ? linesFor(e, fit) : []
    }, null, 1));
    return;
  }
  console.log(`seed ${ctx.seed} · page ${ctx.kind}${ctx.raw && ctx.raw !== ctx.kind ? ` (${ctx.raw})` : ''}${ctx.nav ? ` · nav ${ctx.nav}` : ''}${ctx.buttons ? ` · buttons ${ctx.buttons}` : ''}${ctx.face ? ` · ${ctx.face} display` : ''}${ctx.photo ? ' · a photograph left' : ''}`);
  if (!e) { console.log('- no ending fits: deal again without --exclude, --mood or --library-only'); return; }
  if (e.source === 'library') {
    const v = e.v;
    console.log(`\nending: ${v.id} (the footer library: ${v.name}${v.wordmark ? ' · wordmark' : ''})`);
    console.log(`  close     ${v.close}`);
    console.log(`  footer    ${v.footer}`);
    console.log(`  ground    ${v.ground ? `class ${v.ground}: ` : ''}${v.groundNote}`);
    console.log(`  attribute data-footer="${v.attr}" on the footer (the template has it)`);
    if (v.wordmark) {
      console.log('  wordmark  the name huge, aria-hidden, the real name in text in the footer; one giant name a page (no close-word,');
      console.log('            no place name moment, no brand band with the name); footers.js fits it to the width');
      if (ctx.name) console.log(`  fit       --ft-fit: ${fit} for "${ctx.name}" (${ctx.face || (v.display || ['sans'])[0]} estimate)${ctx.name.length > LONG ? ` · a name of ${ctx.name.length} characters sets small: set its short form, or deal again with --no-wordmark` : ''}${fit && fit > 45 ? ' · a short name: on a screen under 1440x900 the word stops at 72svh, centred' : ''}`);
      else console.log('  fit       pass --name "<Brand>" for --ft-fit (or: footers.mjs fit --name ..); the CSS default is 18');
    }
    if (v.scrollMoment) console.log('  motion    the fill is scrubbed to the scroll: it is one of the page\'s 2-3 scroll moments (moments.mjs --count 2 beside it)');
    if (v.needs) console.log(`  needs     ${v.needs}`);
    console.log(`  suits     nav ${v.nav.join(', ')}; buttons ${v.buttons.slice(0, 9).join(', ')}${v.buttons.length > 9 ? ', ..' : ''}`);
  } else {
    console.log(`\nending: ${e.id} + ${e.close} (the kit: system.css, starter.html${e.wordmark ? ' · wordmark' : ''})`);
    if (e.close === 'close-head') console.log('  close     close-photo has no photograph left: the head row of close-word without the name (sections.md section 2)');
    if (e.wordmark) console.log('  wordmark  close-word sets the name across the .wrap: one giant name a page');
  }
  console.log('');
  linesFor(e, fit).forEach((l) => console.log(l));
  console.log(`then: buttons.mjs pick --page ${ctx.raw || ctx.kind}${ctx.nav ? ` --nav ${ctx.nav}` : ''} --close ${closeAs(e)}`);
  console.log(`plan line 2: ${e.source === 'library' ? `footer ${e.id} (library, its own close)` : `footer ${e.id}, close ${e.close}`}`);
}

/* ------------------------------------------------------------------ check: a small tag tree, no browser */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
function parse(html) {
  const root = { tag: '#root', attrs: {}, kids: [], parent: null, text: '' };
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!doctype[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/gi;
  let cur = root, m, last = 0;
  const addText = (t) => { for (let n = cur; n; n = n.parent) n.text += t; };
  while ((m = re.exec(html))) {
    if (m.index > last) addText(html.slice(last, m.index));
    last = re.lastIndex;
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) {
      let n = cur; while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) cur = n.parent;
      continue;
    }
    const attrs = {};
    for (const a of (m[3] || '').matchAll(/([^\s"'>\/=]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? '';
    const node = { tag, attrs, kids: [], parent: cur, text: '' };
    cur.kids.push(node);
    if (RAW.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, last);
      const stop = end < 0 ? html.length : end;
      node.raw = html.slice(last, stop);
      re.lastIndex = last = stop;
      continue;
    }
    if (!VOID.has(tag) && !m[4]) cur = node;
  }
  if (last < html.length) addText(html.slice(last));
  return root;
}
const all = (n, f, out = []) => { for (const k of n.kids) { if (f(k)) out.push(k); all(k, f, out); } return out; };
const cls = (n) => ` ${n.attrs.class || ''} `;
const has = (n, c) => cls(n).includes(` ${c} `);
const inTemplate = (n) => { for (let p = n.parent; p; p = p.parent) if (p.tag === 'template') return true; return false; };
const norm = (s) => String(s || '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;|&#\d+;/gi, '').replace(/\s+/g, '').toLowerCase();

function check(file, idx) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { die(`cannot read ${file}`); }
  const out = [], f = (sev, msg) => out.push(`${sev} ${msg}`);
  const root = parse(html);
  const htmlEl = all(root, (n) => n.tag === 'html')[0];
  const metaKind = (all(root, (n) => n.tag === 'meta' && /^(site-kind|page-type)$/i.test(n.attrs.name || '')).map((n) => n.attrs.content)[0]) || '';
  const kind = KINDS[String((htmlEl && htmlEl.attrs['data-type']) || '').toLowerCase()] || KINDS[metaKind.toLowerCase()] || null;
  const site = (all(root, (n) => n.tag === 'meta' && /^site-kind$/i.test(n.attrs.name || ''))[0] || { attrs: {} }).attrs.content || '';
  const pageKind = site === 'gaming' ? 'gaming' : kind;
  const feet = all(root, (n) => n.tag === 'footer' && has(n, 'closing') && !inTemplate(n));
  if (feet.length !== 1) { f('FAIL', `${feet.length} footer.closing on the page: one, the page's last section (system.md, Footer)`); out.forEach((l) => console.log(l)); process.exit(1); }
  const foot = feet[0];
  const attr = foot.attrs['data-footer'];
  const v = attr ? idx.library.find((x) => x.attr === attr || x.id === attr) : null;
  const linked = /<link\b[^>]*href\s*=\s*["'](?:[^"']*\/)?footers\.css["'?#]/i.test(html);
  const scripted = /<script\b[^>]*src\s*=\s*["'](?:[^"']*\/)?footers\.js["'?#]/i.test(html);
  const marks = all(root, (n) => n.attrs['data-footer-wordmark'] !== undefined && !inTemplate(n));
  const closeWords = all(root, (n) => has(n, 'close__word') && !inTemplate(n));

  if (attr && !v) f('FAIL', `data-footer="${attr}" is no ending of the library (footers.mjs list)`);
  else if (v) {
    f('OK', `ending ${v.id} (data-footer="${attr}")`);
    if (attr !== v.attr) f('WARN', `write data-footer="${v.attr}" (the id without footer-), as the template does`);
    f(linked ? 'OK' : 'FAIL', linked ? 'footers.css linked' : `footers.css is not linked: <link rel="stylesheet" href="${CSS}"> after assets/layout/layout.css`);
    if (v.js === 'fill') f(scripted ? 'OK' : 'FAIL', scripted ? 'footers.js loaded' : `${v.id} fills on the scroll through footers.js: <script src="${JS}" defer></script> after scroll.js`);
    else if (v.js === 'fit') f(scripted ? 'OK' : 'WARN', scripted ? 'footers.js loaded' : `without footers.js the wordmark keeps the printed --ft-fit (an estimate): <script src="${JS}" defer></script>`);
    else if (scripted && !marks.length) f('WARN', `footers.js is loaded but ${v.id} has no wordmark: drop the script`);
    if (v.js === 'fill' && !/<script\b[^>]*src\s*=\s*["'][^"']*motion\/scroll\.js/i.test(html)) f('WARN', 'the fill runs on window.rtMotion: keep assets/motion/scroll.js on the page (SKILL.md rule 5)');
    if (pageKind && !v.kinds.includes(pageKind) && !(pageKind === 'product' && v.kinds.includes('product'))) f('WARN', `${v.id} is not dealt for a ${pageKind} page (${v.kinds.join(', ')})`);
    if (v.wordmark && !marks.some((mk) => mk.parent === foot)) f('FAIL', `${v.id} sets the name at its foot: keep its <div class="ft-mark" aria-hidden="true" data-footer-wordmark> as a child of the footer`);
    if (!v.wordmark && marks.length) f('WARN', `${v.id} has no wordmark of its own: a [data-footer-wordmark] on it is not in its design`);
  } else {
    const kitType = ['footer--dark', 'footer--statement', 'footer--visit'].find((c) => has(foot, c));
    f('OK', `a kit ending (${kitType ? kitType.replace('--', '-') : 'footer-columns'}${closeWords.length ? ', close-word' : ''})`);
  }
  // the .wrap's two rows
  const wraps = foot.kids.filter((k) => has(k, 'wrap'));
  if (wraps.length !== 1) f('FAIL', `footer.closing holds ${wraps.length} .wrap: exactly one, its rows inside it`);
  else {
    const rows = wraps[0].kids.filter((k) => k.tag !== 'script' && k.tag !== 'template');
    if (rows.length !== 2) f('FAIL', `footer.closing > .wrap holds ${rows.length} children: exactly two (.closing__cta, then .closing__links)`);
    else if (!has(rows[0], 'closing__cta') || !has(rows[1], 'closing__links')) f('WARN', 'the .wrap\'s two rows are .closing__cta then .closing__links (the checker reads them by place)');
  }
  // the giant name: one a page, decoration only
  if (marks.length > 1) f('FAIL', `${marks.length} footer wordmarks on the page: one at most`);
  if (marks.length && closeWords.length) f('FAIL', 'a footer wordmark and close-word\'s name across the .wrap: one giant name a page');
  for (const mk of marks) {
    if (mk.attrs['aria-hidden'] !== 'true') f('FAIL', 'the wordmark needs aria-hidden="true": it is decoration, the name is in text elsewhere in the footer');
    if (mk.parent !== foot) f('FAIL', 'the wordmark is a child of footer.closing beside its .wrap (a layer), never inside the .wrap');
    if (!all(mk, (n) => has(n, 'ft-mark__word')).length) f('FAIL', 'the wordmark has no .ft-mark__word: <span class="ft-mark__word">Name</span>');
    if (all(mk, (n) => n.tag === 'a' || n.tag === 'button' || n.attrs.tabindex !== undefined).length) f('FAIL', 'a link or control inside the wordmark: it is aria-hidden and takes no focus');
    const name = norm(mk.text);
    const rest = norm(foot.text.replace(mk.text, ''));
    if (name && !rest.includes(name)) f('FAIL', `the wordmark's name ("${mk.text.trim().replace(/\s+/g, ' ').slice(0, 30)}") is not in the footer's own text: set it in the row (the logo, the copyright line)`);
    if (all(mk, (n) => has(n, 'ft-orn')).length > 1) f('WARN', 'more than one ornament on the wordmark: one at most');
    const style = foot.attrs.style || '';
    if (!/--ft-fit\s*:/.test(style)) f(scripted ? 'OK' : 'WARN', scripted ? 'no --ft-fit on the footer: footers.js fits the word (the first paint uses 18vw)' : 'no --ft-fit on the footer and no footers.js: the word is 18vw whatever the name (footers.mjs fit --name ..)');
    if (/100vw/.test(style) || /100vw/.test(mk.attrs.style || '')) f('WARN', '100vw on the footer or the wordmark: it counts the scrollbar and can scroll the page sideways; the layer spans the footer (left 0, right 0)');
  }
  if (!v && closeWords.length > 1) f('FAIL', `${closeWords.length} close__word names: one at most`);
  out.forEach((l) => console.log(l));
  if (out.some((l) => l.startsWith('FAIL'))) process.exit(1);
}

function main() {
  const a = args(process.argv.slice(2));
  const cmd = a._[0] || 'pick';
  const idx = loadIndex();
  if (cmd === 'list') {
    const raw = str(a.page).toLowerCase(), kind = KINDS[raw];
    if (raw && !kind) die('unknown --page ' + raw);
    for (const v of idx.library) {
      if (kind && !v.kinds.includes(kind)) continue;
      console.log(`${v.id.padEnd(20)} library  ${v.wordmark ? 'wordmark' : '        '}  ${(v.js || '-').padEnd(4)}  ${v.mood.join('/').padEnd(16)} ${v.kinds.join(', ')}`);
    }
    for (const [k, L] of Object.entries(idx.kit.lists)) {
      if (kind && k !== kind) continue;
      console.log(`${('kit: ' + k).padEnd(20)} ${L.footers.join('|')}  x  ${L.closes.join('|')}${L.noPhoto ? ` (no photograph: ${L.noPhoto})` : ''}`);
    }
    return;
  }
  if (cmd === 'fit') {
    const name = str(a.name); if (!name) die('fit needs --name "<Brand>"');
    const face = str(a.face) || 'sans'; if (!['serif', 'sans'].includes(face)) die('--face is serif or sans');
    const inset = Math.max(0, Math.min(20, parseFloat(str(a.inset)) || 0));
    console.log(`--ft-fit: ${fitFor(name, face, inset)}   ("${name}", ${face}${inset ? `, ${inset}% free each side` : ''}; footers.js measures the real letters)`);
    return;
  }
  if (cmd === 'check') { if (!a._[1]) die('check needs a page: footers.mjs check index.html'); check(a._[1], idx); return; }
  if (cmd !== 'pick') die('commands: pick, list, fit, check');
  const raw = str(a.page).toLowerCase();
  const kind = KINDS[raw];
  if (!kind) die('pass --page software|gaming|product|tech|service|place|editorial');
  const mood = str(a.mood) || null;
  if (mood && !MOODS.includes(mood)) die('--mood is calm, crisp, playful or editorial');
  const nav = str(a.nav) || null;
  if (nav && !NAVS.includes(nav)) die('--nav is ' + NAVS.join(', '));
  const buttons = str(a.buttons) || null;
  const typeId = str(a.type) || null;
  const face = faceOf(typeId);
  if (typeId && !face) console.error(`footers: --type ${typeId} is not in library/type.json; the display face is not weighed`);
  const name = str(a.name) || null;
  const seed = str(a.seed) || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const exclude = list(a.exclude);
  for (const id of exclude) {
    const known = idx.library.some((v) => v.id === id || v.attr === id) || idx.kit.footers[id] || idx.kit.closes[id];
    if (!known) die(`--exclude: no ending, footer or close "${id}" (footers.mjs list)`);
  }
  // the history: this site's file (--history) and the machine's global one (scripts/lib/history.mjs, key "footers";
  // RASYA_TASTE_HISTORY=off or --no-global leaves the global one out), opened after the argument checks, committed once
  const hist = a.history && a.history !== true ? readJson(a.history) : {};
  const G = openGlobal({ local: a.history, by: 'footers' });
  const history = readPast(idx, G.recent('footers', { page: kind, local: localIds(hist.footers) }));
  const opts = { kind, photo: !!a.photo, noWordmark: !!a['no-wordmark'], libraryOnly: !!a['library-only'], exclude, nav, buttons, mood, face, history, longName: !!(name && name.length > LONG) };
  const e = deal(idx, opts, rng(seed));
  printPick(e, { seed, kind, raw, nav, buttons, face, name, photo: !!a.photo }, a.json);
  if (e) {
    const id = historyId(e), at = new Date().toISOString();
    if (a.history && a.history !== true) {
      hist.footers = [...localIds(hist.footers), { id, page: kind, at, seed, wordmark: e.wordmark }].slice(-200);
      writeJsonAtomic(a.history, hist);
    }
    G.add('footers', [{ id, at, seed }], { page: kind });
  }
  G.commit();
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('footers.mjs')) main();
