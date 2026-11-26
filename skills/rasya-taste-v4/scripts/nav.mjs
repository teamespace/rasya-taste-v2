#!/usr/bin/env node
/*
  rasya-taste-v4 nav.mjs - deals the page's nav from the nav library (assets/navs/index.json "library": twelve archetypes,
  A1-A12, each a header.nav[data-nav] in assets/navs/nav-<id>.html with navs.css and navs.js) and, at about 15% of the
  pool together, the kit's own four (nav-mega, nav-cards, nav-centre, nav-split: system.css and starter.html). It
  replaces the nav field of the one-liner (SKILL.md step 4). Rules: references/navs.md.

    node <skill>/scripts/nav.mjs pick --page <kind> [--hero <dealt hero id>] [--has photo,ui,datum,products]
                                 [--mood calm|crisp|playful|editorial] [--exclude id,id] [--library-only]
                                 [--history .taste-skill/history.json] [--seed S] [--json] [--no-global]
    node <skill>/scripts/nav.mjs list [--page <kind>]
    node <skill>/scripts/nav.mjs check <page.html>

  kind: software (saas, ai, app, developer tools, fintech), gaming, tech (hardware), product, service, place, editorial.
  Run pick after the hero deal (layout/deal.mjs) and before footers.mjs and buttons.mjs: it prints the template to copy,
  the stylesheet and script lines, the brand-element prompt, the CTA rule and the --nav value (the pick's kitEquivalent)
  to pass to footers.mjs and buttons.mjs, whose --nav lists know only the kit's four.
  --hero: the dealt hero id; a nav that needs a hero (over-media: photo) is dealt only over it, the heroes a nav sits
  best over weigh it up, the ones it avoids weigh it down. Without --hero, over-media needs --has photo.
  --has: what the brief really has: photo, ui, film, object, setting (as deal.mjs), datum (one real number that matters
  to the buyer: live needs it), products (four or more with photographs: preview-mega needs it).
  --mood weighs the navs of that mood up. --library-only leaves the kit out. --exclude drops ids (library or kit).
  The history: the "navs" list of the --history file (the file start.mjs, moments.mjs, footers.mjs and buttons.mjs
  keep) and of the machine's global history (scripts/lib/history.mjs: $RASYA_TASTE_HISTORY, default
  ~/.rasya-taste/history.json; RASYA_TASTE_HISTORY=off or --no-global leaves it out). The last nav is never dealt again
  while another fits; every nav of the last six weighs less. The kit's navs share index.json weights.kitShare (0.15) of
  the pool after the history is weighed, so they still come up, never often.
  check reads a built page (no browser): data-nav and its id, data-nav-menu on a library nav, one data-nav-element,
  five words at most and 45 characters, the nav's action unlike the hero's primary, navs.css and navs.js, the menu
  button's aria-expanded, no em dash or [bracket] in the bar, the needs of the dealt nav. It exits 1 on a FAIL.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGlobal, readJson, writeJsonAtomic } from './lib/history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'assets', 'navs', 'index.json');
const KINDS = {
  software: 'software', saas: 'software', ai: 'software', app: 'software', apps: 'software', dev: 'software', developer: 'software',
  'developer-tool': 'software', fintech: 'software',
  gaming: 'gaming', game: 'gaming', games: 'gaming',
  tech: 'tech', hardware: 'tech', device: 'tech',
  product: 'product', brand: 'product', shop: 'product',
  service: 'service', studio: 'service', agency: 'service', firm: 'service', clinic: 'service',
  place: 'place', cafe: 'place', bakery: 'place', restaurant: 'place', bar: 'place', guesthouse: 'place', hotel: 'place',
  editorial: 'editorial', magazine: 'editorial', journal: 'editorial', blog: 'editorial', publication: 'editorial',
  newsletter: 'editorial', longform: 'editorial', 'long-read': 'editorial'
};
const HAS = ['photo', 'ui', 'film', 'object', 'setting', 'ground', 'datum', 'products'];
const MOODS = ['calm', 'crisp', 'playful', 'editorial'];
const CSS = 'assets/navs/navs.css';
const JS = 'assets/navs/navs.js';
const ELEMENTS = ['datum', 'material', 'object'];

function die(m) { console.error('nav: ' + m); process.exit(1); }
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
  if (!Array.isArray(idx.library) || !idx.kit || !idx.kit.lists || !idx.kit.navs) die('index.json needs "library", "kit.navs" and "kit.lists"');
  return idx;
}
const isKit = (idx, id) => !!idx.kit.navs[id];

/* every nav this page may be dealt, each with its base weight; the kit's share is set later, in pool() */
export function candidates(idx, { kind, hero = null, has = [], mood = null, exclude = [], libraryOnly = false }) {
  const W = idx.weights || {};
  const out = [];
  for (const v of idx.library) {
    if (!v.kinds.includes(kind) || exclude.includes(v.id)) continue;
    const n = v.needs || {};
    if (n.hero && (hero ? !n.hero.includes(hero) : !has.includes('photo'))) continue;
    if ((n.has || []).some((h) => !has.includes(h))) continue;
    let w = (v.weight && v.weight[kind]) || 1;
    if (hero && v.heroes) {
      if ((v.heroes.best || []).includes(hero)) w *= W.heroBest ?? 1.6;
      if ((v.heroes.avoid || []).includes(hero)) w *= W.heroAvoid ?? 0.3;
    }
    if (mood && (v.mood || []).includes(mood)) w *= W.mood ?? 1.4;
    out.push({ source: 'library', id: v.id, v, base: w });
  }
  if (!libraryOnly) {
    for (const id of idx.kit.lists[kind] || []) {
      if (exclude.includes(id)) continue;
      out.push({ source: 'kit', id, k: idx.kit.navs[id], base: 1 });
    }
  }
  return out;
}

export function pool(idx, cands, { history = [] }) {
  const W = idx.weights || {};
  let p = cands;
  const last = history[history.length - 1];
  if (last) { const fresh = p.filter((e) => e.id !== last); if (fresh.length) p = fresh; }   // never the same nav twice in a row
  const recent = history.slice(-6);
  const hist = (e) => Math.pow(W.recent ?? 0.45, recent.filter((id) => id === e.id).length);
  const lib = p.filter((e) => e.source === 'library').map((e) => ({ e, w: e.base * hist(e) }));
  const kit = p.filter((e) => e.source === 'kit').map((e) => ({ e, w: e.base * hist(e) }));
  if (!lib.length) return kit;
  if (!kit.length) return lib;
  // the kit's navs together hold kitShare of the pool, whatever the history did to either side
  const share = Math.min(0.9, Math.max(0, W.kitShare ?? 0.15));
  const sumL = lib.reduce((s, x) => s + x.w, 0), sumK = kit.reduce((s, x) => s + x.w, 0);
  const k = sumK > 0 ? (share / (1 - share)) * sumL / sumK : 0;
  return [...lib, ...kit.map((x) => ({ e: x.e, w: x.w * k }))];
}

export function deal(idx, opts, rand) {
  const p = pool(idx, candidates(idx, opts), opts);
  if (!p.length) return null;
  let r = rand() * p.reduce((s, x) => s + x.w, 0), i = 0;
  while (i < p.length - 1 && (r -= p[i].w) > 0) i++;
  return p[i].e;
}

const kitEq = (e) => (e.source === 'kit' ? e.id : e.v.kitEquivalent);
const attrs = (v) => {
  const t = fs.existsSync(path.join(HERE, '..', v.template)) ? fs.readFileSync(path.join(HERE, '..', v.template), 'utf8') : '';
  const m = t.match(/<header\b[^>]*\bdata-nav=[^>]*>/i);
  return m ? m[0] : `<header class="${v.class}" data-nav="${v.id}">`;
};

function linesFor(e) {
  const out = [];
  if (e.source === 'library') {
    const v = e.v;
    out.push(`copy the <header>..</header> of ${v.template} (nothing else from it) in place of the starter's header.nav:`);
    out.push(`  ${attrs(v)}`);
    out.push('  keep its classes and data-nav attributes, the skip link, .nav__toggle and the kit\'s .nav__* parts; every word becomes the client\'s');
    out.push('once a page, in <head> after assets/layout/layout.css:', `  <link rel="stylesheet" href="${CSS}">`);
    out.push('once, before </body>, after assets/motion/scroll.js:', `  <script src="${JS}" defer></script>`);
  } else {
    out.push(`the starter's header.nav as it is (the kit: system.css, starter.html), class="${e.k.class}", with data-nav="${e.id}" on it;`);
    out.push(`  its recipe: ${e.k.recipe}`);
    out.push('  add one brand element in the bar: <span class="nv-datum" data-nav-element="datum">..</span> (a real number, the local time with data-nav-clock)');
    out.push('  in .nav__actions before the button, or data-nav-element="object" on the client\'s own mark in .nav__logo');
    out.push('advised, so the bar marks the section on screen (aria-current="location"): the stylesheet and the script');
    out.push(`  <link rel="stylesheet" href="${CSS}">   and   <script src="${JS}" defer></script> after assets/motion/scroll.js`);
  }
  return out;
}

function printPick(e, ctx, json) {
  const eq = e ? kitEq(e) : null;
  const next = e ? [
    `footers.mjs pick --page ${ctx.raw || ctx.kind} --nav ${eq} ...`,
    `buttons.mjs pick --page ${ctx.raw || ctx.kind} --nav ${eq} --close <the close footers.mjs prints>`
  ] : [];
  if (json) {
    console.log(JSON.stringify({
      seed: ctx.seed, page: ctx.kind, hero: ctx.hero || null, has: ctx.has, mood: ctx.mood || null,
      pick: e && {
        id: e.id, source: e.source, archetype: e.v ? e.v.archetype : null, name: e.v ? e.v.name : e.k.text,
        template: e.v ? e.v.template : null, class: e.v ? e.v.class : e.k.class,
        css: CSS, js: e.v ? JS : null, scroll: e.v ? e.v.scroll : null, mobile: e.v ? e.v.mobile : null,
        element: e.v ? e.v.element : null, cta: e.v ? e.v.cta : null, needs: e.v ? e.v.needs : null, kitEquivalent: eq
      },
      nav: eq, next, lines: e ? linesFor(e) : []
    }, null, 1));
    return;
  }
  console.log(`seed ${ctx.seed} · page ${ctx.kind}${ctx.raw && ctx.raw !== ctx.kind ? ` (${ctx.raw})` : ''}${ctx.hero ? ` · hero ${ctx.hero}` : ''}${ctx.has.length ? ` · has ${ctx.has.join(',')}` : ''}${ctx.mood ? ` · mood ${ctx.mood}` : ''}`);
  if (!e) { console.log('- no nav fits: deal again without --exclude, --library-only or --mood'); return; }
  if (e.source === 'library') {
    const v = e.v;
    console.log(`\nnav: ${v.id} (${v.archetype} ${v.name} · the nav library)`);
    console.log(`  type      ${v.type}`);
    console.log(`  scroll    ${v.scroll.text} (data-nav-scroll="${v.scroll.behaviours.join(' ')}": ${v.scroll.states.join(', ')})`);
    console.log(`  mobile    ${v.mobile}: ${v.mobileText}`);
    console.log(`  element   ${v.element.type}: ${v.element.what}`);
    console.log(`  cta       ${v.cta}`);
    if (v.needs && v.needs.page) console.log(`  needs     ${v.needs.page}`);
    if (v.id === 'over-media' && !ctx.hero) console.log('  hero      only over the photo hero (deal.mjs --has photo): deal the hero first and pass --hero');
    if ((v.id === 'split-mark' || v.id === 'pill' || v.id === 'corner-index' || v.id === 'dock') && ctx.hero === 'photo') console.log('  over a photograph: add data-nav-over to the header, and data-nav-tone="dark" when the photograph\'s top is light');
    if (v.id === 'split-mark' && ctx.hero && ctx.hero !== 'photo') console.log('  no photograph under the bar: drop data-nav-over and data-nav-tone from the header');
    console.log(`  suits     ${v.kinds.join(', ')}; heroes ${(v.heroes.best || []).join(', ')}${(v.heroes.avoid || []).length ? ` (avoids ${v.heroes.avoid.join(', ')})` : ''}`);
  } else {
    console.log(`\nnav: ${e.id} (the kit's own: ${e.k.text})`);
  }
  console.log('');
  linesFor(e).forEach((l) => console.log(l));
  console.log('');
  if (e.source === 'library') {
    const el = e.v.element;
    console.log(`brand element (data-nav-element="${el.type}"): ${el.prompt}`);
    if (el.alt) console.log(`  without it: ${el.alt.type}, ${el.alt.what}`);
  } else {
    console.log('brand element: pick one real datum from the brief (a price, a count, the local time, a rating) or the client\'s own mark as an object; one only');
  }
  console.log('cta: the nav\'s button is never the hero\'s primary word for word: another job (an app, a call, a price) or the same job with a price, a count, an icon or a live dot');
  console.log('words: five at most, 45 characters in all, each a section of the page; no em dash, no [brackets]');
  console.log(`then: ${next[0]}`);
  console.log(`      ${next[1]}`);
  console.log(`plan line 2: nav ${e.id}${e.source === 'library' ? ` (${e.v.archetype}, library; --nav ${eq})` : ' (kit)'}`);
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
const inside = (n, f) => { for (let p = n.parent; p; p = p.parent) if (f(p)) return true; return false; };
const inTemplate = (n) => inside(n, (p) => p.tag === 'template');
const decode = (s) => String(s || '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, '\'').replace(/&[a-z]+;|&#\d+;/gi, '');
const words = (n) => decode(n.text).replace(/\s+/g, ' ').trim();
const norm = (s) => decode(s).toLowerCase().replace(/[←-⇿➔-➿]/g, '').replace(/[^\p{L}\p{N}€$£¥%]+/gu, ' ').trim();

function check(file, idx) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { die(`cannot read ${file}`); }
  const out = [], f = (sev, msg) => out.push(`${sev} ${msg}`);
  const done = () => { out.forEach((l) => console.log(l)); if (out.some((l) => l.startsWith('FAIL'))) process.exit(1); };
  const root = parse(html);
  const heads = all(root, (n) => n.tag === 'header' && has(n, 'nav') && !inTemplate(n));
  if (!heads.length) { f('FAIL', 'no header.nav on the page: the bar is the starter\'s header.nav, the kit\'s or a library one (nav.mjs pick)'); return done(); }
  if (heads.length > 1) f('WARN', `${heads.length} header.nav on the page: system.js and navs.js run the first`);
  const h = heads[0];
  const id = h.attrs['data-nav'];
  const v = id ? idx.library.find((x) => x.id === id) : null;
  const kit = id && isKit(idx, id);
  if (id === undefined) { f('FAIL', 'no data-nav on header.nav: write the dealt id (data-nav="ruled", or data-nav="nav-centre" for a kit nav)'); }
  else if (!v && !kit) f('FAIL', `data-nav="${id}" is no nav of the library or the kit (nav.mjs list)`);
  else f('OK', `nav ${id} (${v ? `${v.archetype} ${v.name}, library` : 'the kit'})`);

  // the classes and attributes the CSS keys on
  if (v) {
    for (const c of String(v.class).split(/\s+/)) if (!has(h, c)) f('FAIL', `${v.id} keeps class="${v.class}" on the header (its template has it): "${c}" is missing`);
    const menu = h.attrs['data-nav-menu'];
    if (!menu) f('FAIL', `no data-nav-menu on the header: navs.css styles a library nav by it (data-nav-menu="${v.mobile}")`);
    else if (menu !== v.mobile) f('WARN', `data-nav-menu="${menu}": ${v.id} is designed with "${v.mobile}"`);
    const sc = h.attrs['data-nav-scroll'];
    if (sc === undefined) f('WARN', `no data-nav-scroll: navs.js runs ${v.id}'s default (${v.scroll.behaviours.join(' ')})`);
    else {
      const bad = sc.split(/[\s,]+/).filter((x) => x && !['section', 'solid', 'hide', 'pill'].includes(x));
      if (bad.length) f('WARN', `data-nav-scroll has ${bad.join(', ')}: navs.js knows section, solid, hide, pill`);
      if (!sc.trim()) f('FAIL', 'data-nav-scroll is empty: the bar needs a designed scroll state (navs.md, the rules)');
    }
  } else if (kit) {
    const k = idx.kit.navs[id];
    for (const c of String(k.class).split(/\s+/)) if (!has(h, c)) f('WARN', `${id} is the kit's class="${k.class}": "${c}" is missing`);
  }

  // the one brand element
  const els = [h, ...all(h, () => true)].filter((n) => n.attrs['data-nav-element'] !== undefined);
  if (!els.length) f('FAIL', 'no data-nav-element in the bar: one brand-world element (a real datum, a material or an object) carries it');
  else if (els.length > 1) f('FAIL', `${els.length} data-nav-element in the bar: one only (navs.md rule 2)`);
  for (const el of els) {
    const t = el.attrs['data-nav-element'];
    if (!ELEMENTS.includes(t)) f('WARN', `data-nav-element="${t}": datum, material or object`);
    else if (v && t !== v.element.type && !(v.element.alt && v.element.alt.type === t)) f('WARN', `data-nav-element="${t}": ${v.id}'s element is a ${v.element.type}${v.element.alt ? ` (or a ${v.element.alt.type})` : ''}`);
    if (t === 'datum' && !/\d/.test(words(el)) && el.attrs['data-nav-clock'] === undefined && el.attrs['data-nav-countdown'] === undefined && !all(el, (n) => n.attrs['data-nav-clock'] !== undefined || n.attrs['data-nav-countdown'] !== undefined || n.attrs['data-nav-datum'] !== undefined).length) f('WARN', `the datum ("${words(el).slice(0, 40)}") holds no number: a datum is a real figure, a time or a date from the brief`);
  }
  for (const c of [h, ...all(h, () => true)].filter((n) => n.attrs['data-nav-clock'] !== undefined)) {
    try { new Intl.DateTimeFormat('en', { timeZone: c.attrs['data-nav-clock'] }); } catch { f('FAIL', `data-nav-clock="${c.attrs['data-nav-clock']}" is no IANA time zone (Europe/Berlin)`); }
  }
  for (const d of all(h, (n) => n.attrs['data-nav-datum'] !== undefined)) {
    if (!Number.isFinite(parseFloat(d.attrs['data-from'])) || !Number.isFinite(parseFloat(d.attrs['data-to']))) f('FAIL', 'a data-nav-datum without numeric data-from and data-to');
    const sel = d.attrs['data-for'];
    if (sel && /^#[\w-]+$/.test(sel) && !all(root, (n) => n.attrs.id === sel.slice(1)).length) f('WARN', `data-for="${sel}": no element with that id on the page (the datum then reads data-to)`);
    if (Number.isFinite(parseFloat(d.attrs['data-to'])) && words(d) && Math.abs(parseFloat(words(d).replace(/[^\d.-]/g, '')) - parseFloat(d.attrs['data-to'])) > 1e-9) f('WARN', `the datum's text ("${words(d)}") is not its data-to (${d.attrs['data-to']}): write the true value in the HTML`);
  }

  // the words: five at most, 45 characters
  const links = all(h, (n) => n.tag === 'a' && has(n, 'nav__link') && inside(n, (p) => has(p, 'nav__links')) && !inside(n, (p) => has(p, 'nav__menu')));
  const chars = links.reduce((s, n) => s + words(n).length, 0);
  if (links.length > 5) f('FAIL', `${links.length} words in the bar: five at most (navs.md rule 4)`);
  if (chars > 45) f('FAIL', `the bar's words run to ${chars} characters: 45 at most (${links.map(words).join(', ')})`);
  if (links.length && links.length <= 5 && chars <= 45) f('OK', `${links.length} words, ${chars} characters`);

  // the nav's action and the hero's primary
  const acts = all(h, (n) => has(n, 'nav__actions'));
  const cta = acts.length ? (all(acts[0], (n) => has(n, 'btn--primary'))[0] || all(acts[0], (n) => has(n, 'btn'))[0]) : null;
  const main = all(root, (n) => n.tag === 'main' && !inTemplate(n))[0];
  let heroBtn = null;
  if (main) {
    const hero = all(main, (n) => n.tag === 'section' && (has(n, 'hero') || has(n, 'section--hero')))[0] || main.kids.find((k) => k.tag === 'section');
    if (hero) heroBtn = all(hero, (n) => has(n, 'btn--primary'))[0] || null;
  }
  if (!cta) f('WARN', 'no button in .nav__actions: the bar\'s main action is a.btn.btn--primary there');
  else {
    const label = words(cta);
    const extra = /\d/.test(label) || all(cta, (n) => n.tag === 'svg' || has(n, 'nv-dot') || n.tag === 'sup' || has(n, 'nv-price')).length > 0;
    if (heroBtn && norm(label) && norm(label) === norm(words(heroBtn))) f('FAIL', `the nav's button and the hero's primary both say "${label}": give the nav another job, or a price, a count, an icon or a live dot (navs.md rule 3)`);
    else if (heroBtn) f('OK', `nav action "${label}" vs hero "${words(heroBtn)}"`);
    if (!extra) f('WARN', `the nav's button ("${label}") carries no price, count, icon or dot: a plain button reads as the template`);
  }

  // the files
  const linked = /<link\b[^>]*href\s*=\s*["'](?:[^"']*\/)?navs\.css["'?#]/i.test(html);
  const scripted = /<script\b[^>]*src\s*=\s*["'](?:[^"']*\/)?navs\.js["'?#]/i.test(html);
  if (v) {
    f(linked ? 'OK' : 'FAIL', linked ? 'navs.css linked' : `navs.css is not linked: <link rel="stylesheet" href="${CSS}"> after assets/layout/layout.css`);
    f(scripted ? 'OK' : 'FAIL', scripted ? 'navs.js loaded' : `the scroll states run in navs.js: <script src="${JS}" defer></script> after assets/motion/scroll.js`);
  } else if (kit && !scripted) f('WARN', `navs.js is not loaded: the kit bar never marks the section on screen (<script src="${JS}" defer></script>)`);
  if (scripted && !/<script\b[^>]*src\s*=\s*["'][^"']*motion\/scroll\.js/i.test(html)) f('WARN', 'no assets/motion/scroll.js: navs.js falls back to the window\'s scroll (SKILL.md rule 5 wants Lenis on every page)');

  // access and the house rules in the bar
  const tg = all(h, (n) => has(n, 'nav__toggle'))[0];
  if (!tg) f('WARN', 'no .nav__toggle: the phone menu has no button (system.js opens the sheet from it)');
  else if (tg.attrs['aria-expanded'] === undefined) f('FAIL', 'the menu button has no aria-expanded="false" (system.js flips it)');
  const firstLink = all(h, (n) => n.tag === 'a' || n.tag === 'button')[0];
  if (firstLink && !has(firstLink, 'skip-link')) f('WARN', 'the skip link is not the bar\'s first control: <a class="skip-link" href="#top">Skip to content</a> first in .nav__bar');
  const text = decode(h.text);
  if (/\u2014/.test(text)) f('FAIL', 'an em dash in the bar\'s words');
  if (/\[[^\]\n]{1,60}\]/.test(text)) f('FAIL', 'a [bracket] in the bar: system.js outlines it as a placeholder (write a count in a <sup>)');
  for (const n of [h, ...all(h, () => true)]) {
    const st = String(n.attrs.style || '');
    if (/gradient\(/i.test(st)) f('FAIL', `a gradient in the bar (style on <${n.tag}>): colours come only from the palette tokens, flat`);
    if (/backdrop-filter/i.test(st)) f('FAIL', `a backdrop-filter in the bar (style on <${n.tag}>): no glass`);
  }

  // the needs of the dealt nav
  if (v) {
    const heroSec = main ? all(main, (n) => n.tag === 'section')[0] : null;
    if (v.id === 'over-media' && !(heroSec && has(heroSec, 'hero--photo'))) f('WARN', 'over-media sits over a full-bleed photo hero (hero-photo): the first section is not one');
    if (h.attrs['data-nav-over'] !== undefined && !(heroSec && has(heroSec, 'hero--photo'))) f('WARN', 'data-nav-over without a photo hero: the words sit on no ground over the hero; drop it');
    if (h.attrs['data-nav-menu'] === 'dock' && all(root, (n) => n.tag === 'nav' && has(n, 'actionbar')).length) f('FAIL', 'a dock menu and nav.actionbar both hold the foot of the phone screen: one (a place keeps its action bar and is dealt no dock)');
    if (h.attrs['data-nav-menu'] === 'dock' && !all(h, (n) => has(n, 'nv-dockbar')).length) f('FAIL', 'a dock menu without .nv-dockbar round .nav__actions and .nav__toggle (the template has it)');
    if (v.id === 'preview-mega') {
      const pics = all(h, (n) => n.tag === 'img' && inside(n, (p) => has(p, 'nav__menu')));
      if (pics.length < 4) f('WARN', `preview-mega's panel holds ${pics.length} photographs: four products or more, each with its real photograph`);
    }
    if (v.id === 'rail' && links.length < 4) f('WARN', `the rail holds ${links.length} tabs: four or five, one a section`);
    if (v.id === 'object' && !all(h, (n) => has(n, 'nv-edge')).length) f('FAIL', 'object draws its edge with <span class="nv-edge" data-nav-element="object" aria-hidden="true"> after the .wrap');
    if (v.id === 'split-mark' && !all(h, (n) => has(n, 'nv-symbol')).length) f('WARN', 'split-mark folds to its symbol: .nv-symbol in .nav__logo, then .nv-word');
    if (v.id === 'mono-strip' && !all(h, (n) => n.attrs['data-nav-path'] !== undefined).length) f('WARN', 'mono-strip\'s path: <span data-nav-path>..</span> after the logo');
  }
  done();
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
      console.log(`${v.id.padEnd(13)} ${v.archetype.padEnd(4)} ${v.scroll.behaviours.join('+').padEnd(18)} ${v.mobile.padEnd(9)} ${v.element.type.padEnd(9)} --nav ${v.kitEquivalent.padEnd(11)} ${v.kinds.join(', ')}${(v.needs.has || []).length || v.needs.hero ? `  (needs ${[...(v.needs.hero ? [`hero ${v.needs.hero.join('|')}`] : []), ...(v.needs.has || [])].join(', ')})` : ''}`);
    }
    for (const [k, L] of Object.entries(idx.kit.lists)) {
      if (kind && k !== kind) continue;
      console.log(`${('kit: ' + k).padEnd(18)} ${L.join('|')}  (${Math.round((idx.weights.kitShare ?? 0.15) * 100)}% of the pool together)`);
    }
    return;
  }
  if (cmd === 'check') { if (!a._[1]) die('check needs a page: nav.mjs check index.html'); check(a._[1], idx); return; }
  if (cmd !== 'pick') die('commands: pick, list, check');
  const raw = str(a.page).toLowerCase();
  const kind = KINDS[raw];
  if (!kind) die('pass --page software|gaming|tech|product|service|place|editorial');
  const hero = str(a.hero) || null;
  if (hero && !(idx.heroIds || []).includes(hero)) die(`--hero ${hero} is no hero id (${(idx.heroIds || []).join(', ')})`);
  const hasList = list(a.has);
  for (const x of hasList) if (!HAS.includes(x)) die(`--has ${x}: ${HAS.join(', ')}`);
  const mood = str(a.mood) || null;
  if (mood && !MOODS.includes(mood)) die('--mood is calm, crisp, playful or editorial');
  const exclude = list(a.exclude);
  for (const x of exclude) if (!idx.library.some((v) => v.id === x) && !isKit(idx, x)) die(`--exclude: no nav "${x}" (nav.mjs list)`);
  const seed = str(a.seed) || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  // the history: this site's file and the machine's global one (key "navs"), opened after the argument checks
  const hist = a.history && a.history !== true ? readJson(a.history) : {};
  const G = openGlobal({ local: a.history, by: 'nav' });
  const history = G.recent('navs', { page: kind, local: Array.isArray(hist.navs) ? hist.navs : [] });
  const e = deal(idx, { kind, hero, has: hasList, mood, exclude, libraryOnly: !!a['library-only'], history }, rng(seed));
  printPick(e, { seed, kind, raw, hero, has: hasList, mood }, a.json);
  if (e) {
    const at = new Date().toISOString();
    if (a.history && a.history !== true) {
      hist.navs = [...(Array.isArray(hist.navs) ? hist.navs : []), { id: e.id, page: kind, at, seed, hero: hero || undefined }].slice(-200);
      writeJsonAtomic(a.history, hist);
    }
    G.add('navs', [{ id: e.id, at, seed }], { page: kind });
  }
  G.commit();
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('nav.mjs')) main();
