#!/usr/bin/env node
/*
  rasya-taste-v4 buttons.mjs - deals the page's one button look from the library (assets/buttons/index.json,
  buttons-library.css) and the five upstream looks in system.css. Rules: references/buttons.md.

    node <skill>/scripts/buttons.mjs pick --page <kind> [--nav nav-mega] [--close close-type] [--mood calm|crisp|playful|editorial]
                                     [--history .taste-skill/history.json] [--allow magnetic] [--library-only] [--seed S] [--json]
    node <skill>/scripts/buttons.mjs list [--page <kind>]
    node <skill>/scripts/buttons.mjs check <page.html>

  kind: software (saas, ai, app, developer tools, fintech), gaming, product, tech (hardware: product), service,
  place, editorial (magazine, journal, blog, newsletter).
  pick prints the data-buttons value for <html> and the <link> and <script> lines the look needs. It reads and
  appends the history file's "buttons" list (the file start.mjs, moments.mjs and backgrounds.mjs keep): the last two
  looks are never dealt again while another fits, and every look dealt in the last eight weighs less.
  v4.1: the list read is this site's merged with the global history's looks of this kind (scripts/lib/history.mjs:
  $RASYA_TASTE_HISTORY, default ~/.rasya-taste/history.json), so the last builds' looks count too; --no-global leaves it out.
  --nav and --close name the nav and close types already dealt (sections.md): looks that do not sit well with them
  drop out while two or more others fit. --mood keeps the looks of that mood. The library looks weigh twice the
  upstream ones; --library-only leaves the upstream ones out. magnetic is never dealt without --allow magnetic
  (motion.md bans a magnetic button until the rule changes; HANDOFF-E.md).
  check reads a built page (no browser): the look on <html>, the stylesheet and script it needs, and the data-kbd
  and data-meta extras on the looks that use them. It exits 1 on a FAIL.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGlobal, writeJsonAtomic } from './lib/history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'assets', 'buttons', 'index.json');
const KINDS = {
  software: 'software', saas: 'software', ai: 'software', app: 'software', apps: 'software', dev: 'software', developer: 'software',
  'developer-tool': 'software', fintech: 'software', gaming: 'software', game: 'software', games: 'software',
  product: 'product', tech: 'product', hardware: 'product', device: 'product', brand: 'product', shop: 'product',
  service: 'service', studio: 'service', agency: 'service', firm: 'service', clinic: 'service',
  place: 'place', cafe: 'place', bakery: 'place', restaurant: 'place', bar: 'place', guesthouse: 'place', hotel: 'place',
  editorial: 'editorial', magazine: 'editorial', journal: 'editorial', blog: 'editorial', publication: 'editorial',
  newsletter: 'editorial', longform: 'editorial', 'long-read': 'editorial'
};
/* how much each kind leans to each mood; a look scores its best mood */
const MOOD = {
  software: { crisp: 1.3, calm: 1, playful: 0.8, editorial: 0.7 },
  product: { crisp: 1.1, playful: 1.2, calm: 1, editorial: 0.8 },
  service: { calm: 1.3, crisp: 1, editorial: 1, playful: 0.7 },
  place: { calm: 1.2, editorial: 1.2, crisp: 1, playful: 0.9 },
  editorial: { editorial: 1.6, calm: 1.2, crisp: 0.9, playful: 0.5 }
};
const CSS = 'assets/buttons/buttons-library.css';
const JS = 'assets/buttons/buttons-library.js';

function die(m) { console.error('buttons: ' + m); process.exit(1); }
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
const readHistory = (f) => { try { const h = JSON.parse(fs.readFileSync(f, 'utf8')); return h && typeof h === 'object' && !Array.isArray(h) ? h : {}; } catch { return {}; } };
const list = (v) => String(v && v !== true ? v : '').split(',').map((s) => s.trim()).filter(Boolean);

export function loadIndex() {
  const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  if (!Array.isArray(idx.library)) die('index.json has no "library" list');
  const all = [...idx.library.map((b) => ({ ...b, source: 'library' })), ...(idx.upstream || []).map((b) => ({ ...b, source: 'upstream' }))];
  return { idx, all };
}

/* the looks that may be dealt for this page, each with its weight */
export function pool(all, { kind, raw, nav, close, mood, allow = [], libraryOnly = false, history = [] }) {
  let p = all.filter((b) => (b.pages.includes(kind) || (raw && b.pages.includes(raw)))
    && (b.dealt !== false || allow.includes(b.id))
    && !(libraryOnly && b.source === 'upstream'));
  if (mood) { const m = p.filter((b) => b.mood.includes(mood)); if (m.length) p = m; }
  // the dealt nav and close: keep the looks that sit well with them while two or more do
  for (const [key, val] of [['nav', nav], ['close', close]]) {
    if (!val) continue;
    const fit = p.filter((b) => (b[key] || []).includes(val));
    if (fit.length >= 2) p = fit;
  }
  // never the last two looks again while another fits
  const last2 = history.slice(-2);
  const fresh = p.filter((b) => !last2.includes(b.id));
  if (fresh.length) p = fresh;
  const recent = history.slice(-8);
  return p.map((b) => {
    let w = (b.weight ?? 1) * (b.source === 'library' ? 2 : 1);
    w *= Math.max(...b.mood.map((m) => (MOOD[kind] || {})[m] || 1));
    w *= Math.pow(0.35, recent.filter((id) => id === b.id).length);
    if (nav && !(b.nav || []).includes(nav)) w *= 0.25;
    if (close && !(b.close || []).includes(close)) w *= 0.25;
    return { b, w };
  });
}

export function deal(all, opts, rand) {
  const p = pool(all, opts);
  if (!p.length) return null;
  let r = rand() * p.reduce((s, x) => s + x.w, 0), i = 0;
  while (i < p.length - 1 && (r -= p[i].w) > 0) i++;
  return p[i].b;
}

function lines(b) {
  const out = [`on <html>:  data-buttons="${b.id}"`];
  if (b.source === 'library') {
    out.push('once a page, in <head> after assets/motion/motion.css (the starter has it):', `  <link rel="stylesheet" href="${CSS}">`);
    if (b.needsJs) out.push('once, before </body>:', `  <script src="${JS}" defer></script>`);
  } else out.push('in system.css: no extra file (the library stylesheet may stay linked; it styles only its own looks)');
  return out;
}

function printPick(b, ctx, json) {
  if (json) {
    console.log(JSON.stringify({ seed: ctx.seed, page: ctx.kind, nav: ctx.nav || null, close: ctx.close || null,
      pick: b && { id: b.id, name: b.name, family: b.family, source: b.source, needsJs: b.needsJs, radius: b.radius, mood: b.mood,
        css: b.source === 'library' ? CSS : null, js: b.needsJs ? JS : null, extras: b.extras || null, needsRuleChange: b.needsRuleChange || null },
      lines: b ? lines(b) : [] }, null, 1));
    return;
  }
  console.log(`seed ${ctx.seed} · page ${ctx.kind}${ctx.raw && ctx.raw !== ctx.kind ? ` (${ctx.raw})` : ''}${ctx.nav ? ` · nav ${ctx.nav}` : ''}${ctx.close ? ` · close ${ctx.close}` : ''}${ctx.mood ? ` · mood ${ctx.mood}` : ''}`);
  if (!b) { console.log('- no look fits: deal again without --mood, or with --allow'); return; }
  console.log(`\nbuttons: ${b.id} (${b.name} · ${b.mood.join(', ')}${b.source === 'upstream' ? ' · system.css' : ''}${b.needsJs ? ' · needs buttons-library.js' : ''})`);
  console.log(`  primary    ${b.primary}`);
  console.log(`  secondary  ${b.secondary}`);
  console.log(`  link       ${b.link === 'kit' ? 'the kit .link (drawn underline, arrow)' : b.link}`);
  if (b.radius && b.radius !== 'page') console.log(`  radius     ${b.radius}`);
  if (b.extras) console.log(`  extras     ${b.extras}`);
  if (b.needsRuleChange) console.log(`  note       ${b.needsRuleChange}`);
  console.log('');
  lines(b).forEach((l) => console.log(l));
  console.log('markup unchanged: a.btn.btn--primary, a.btn.btn--secondary, a.link (references/buttons.md); write the look on plan line 2');
}

function check(file, all) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { die(`cannot read ${file}`); }
  const out = [], f = (sev, msg) => out.push(`${sev} ${msg}`);
  const tag = (html.match(/<html\b[^>]*>/i) || [''])[0];
  const id = (tag.match(/\bdata-buttons\s*=\s*["']?([\w-]+)/i) || [])[1];
  const b = id && all.find((x) => x.id === id);
  if (!id) f('FAIL', 'no data-buttons on <html>: deal one look (buttons.mjs pick)');
  else if (!b) f('FAIL', `data-buttons="${id}" is no look (buttons.mjs list)`);
  else {
    f('OK', `data-buttons="${id}" (${b.source === 'library' ? 'library' : 'system.css'})`);
    const css = /<link\b[^>]*href\s*=\s*["'][^"']*buttons\/buttons-library\.css/i.test(html);
    const js = /<script\b[^>]*src\s*=\s*["'][^"']*buttons\/buttons-library\.js/i.test(html);
    if (b.source === 'library') f(css ? 'OK' : 'FAIL', css ? 'buttons-library.css linked' : `buttons-library.css is not linked: <link rel="stylesheet" href="${CSS}"> after motion/motion.css`);
    if (css && b.source === 'library') {
      const iMotion = html.search(/motion\/motion\.css/i), iLib = html.search(/buttons\/buttons-library\.css/i);
      if (iMotion >= 0 && iLib < iMotion) f('WARN', 'buttons-library.css comes before motion/motion.css: link it after (its selectors win either way; the order keeps it readable)');
    }
    if (b.needsJs) f(js ? 'OK' : 'FAIL', js ? 'buttons-library.js loaded' : `the ${id} look needs <script src="${JS}" defer></script>`);
    else if (js) f('WARN', `buttons-library.js is loaded but ${id} does not use it: drop the script`);
    if (/<[^>]*\bclass\s*=\s*["'][^"']*\bbtn\b[^>]*\bdata-kbd\b/i.test(html) && id !== 'kbd') f('WARN', 'a button carries data-kbd, which only the kbd look shows');
    if (/<[^>]*\bclass\s*=\s*["'][^"']*\bbtn\b[^>]*\bdata-meta\b/i.test(html) && id !== 'split') f('WARN', 'a button carries data-meta, which only the split look shows');
    if (b.dealt === false) f('WARN', `${id} is opt-in only (${b.needsRuleChange || 'not dealt by default'})`);
  }
  out.forEach((l) => console.log(l));
  if (out.some((l) => l.startsWith('FAIL'))) process.exit(1);
}

function main() {
  const a = args(process.argv.slice(2));
  const cmd = a._[0] || 'pick';
  const { all } = loadIndex();
  if (cmd === 'list') {
    const raw = String(a.page && a.page !== true ? a.page : '').toLowerCase(), kind = KINDS[raw];
    if (raw && !kind) die('unknown --page ' + raw);
    for (const b of all) {
      if (kind && !(b.pages.includes(kind) || b.pages.includes(raw))) continue;
      console.log(`${b.id.padEnd(10)} ${(b.source === 'library' ? b.family : 'system.css').padEnd(12)} ${b.needsJs ? 'js' : '  '}  ${b.dealt === false ? 'opt-in ' : 'dealt  '}${b.mood.join('/').padEnd(17)} ${b.pages.join(', ')}`);
    }
    return;
  }
  if (cmd === 'check') { if (!a._[1]) die('check needs a page: buttons.mjs check index.html'); check(a._[1], all); return; }
  if (cmd !== 'pick') die('commands: pick, list, check');
  const raw = String(a.page && a.page !== true ? a.page : '').toLowerCase();
  const kind = KINDS[raw];
  if (!kind) die('pass --page software|gaming|product|tech|service|place|editorial');
  const mood = a.mood && a.mood !== true ? String(a.mood) : null;
  if (mood && !Object.keys(MOOD.software).includes(mood)) die('--mood is calm, crisp, playful or editorial');
  const nav = a.nav && a.nav !== true ? String(a.nav) : null;
  const close = a.close && a.close !== true ? String(a.close) : null;
  const seed = a.seed && a.seed !== true ? String(a.seed) : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const hist = a.history && a.history !== true ? readHistory(a.history) : {};
  // v4.1: this kind's looks of every build (the global history) merged with this site's own
  const G = openGlobal({ local: a.history, by: 'buttons' });
  const history = G.recent('buttons', { page: kind, local: Array.isArray(hist.buttons) ? hist.buttons : [] });
  const allow = list(a.allow);
  for (const id of allow) if (!all.some((b) => b.id === id)) die(`--allow: no look "${id}"`);
  const b = deal(all, { kind, raw, nav, close, mood, allow, libraryOnly: !!a['library-only'], history }, rng(seed));
  printPick(b, { seed, kind, raw, nav, close, mood }, a.json);
  const at = new Date().toISOString();
  if (b && a.history && a.history !== true) {
    hist.buttons = [...(Array.isArray(hist.buttons) ? hist.buttons : []), { id: b.id, page: kind, at, seed }].slice(-200);
    writeJsonAtomic(a.history, hist);
  }
  if (b) G.add('buttons', [{ id: b.id, at, seed }], { page: kind });
  G.commit();
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('buttons.mjs')) main();
