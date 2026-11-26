#!/usr/bin/env node
/*
  rasya-taste-v4 hero.mjs - deals the hero's visual: a recipe from the hero recipe library (assets/layout/recipes/index.json,
  references/hero-recipes.md) that fits the page's kind and the hero template deal.mjs dealt. The template is only the
  frame; the recipe is the picture in it, rebuilt from named reference heroes with this page's own assets.

    node <skill>/scripts/hero.mjs pick --page <kind> --template <dealt hero id> [--has photo,ui,video,datum,object,logo]
                                  [--brief brief.md] [--subject "words"] [--product ".." --audience ".." --world ".." --palette ".."]
                                  [--page-file index.html] [--dark] [--recipe <id>] [--exclude id,id]
                                  [--history .taste-skill/history.json] [--seed S] [--json] [--no-global] [--stats 1000]
    node <skill>/scripts/hero.mjs list [--page <kind>] [--template <id>]
    node <skill>/scripts/hero.mjs check <page.html> [--history .taste-skill/history.json]
    node <skill>/scripts/hero.mjs lint

  kind: software (saas, ai, app, developer tools, fintech), gaming, tech (hardware), product, service, editorial. A place is
  never dealt a recipe: its hero is its own photograph (hero-place). Run pick after deal.mjs (the template) and before
  nav.mjs. It prints the recipe, the reference pictures to open first, the files and the mount, the interaction, the still,
  the asset specs with their prompts filled from the brief, and the asset command line for photos.mjs recipe-assets.
  --has: what the brief really has: ui (its screens or kit fragments), video or film (its film), datum (a real figure the
  visual shows), object (cut-outs or renders of its own product), logo (its mark as SVG); photographs are always there
  (the client's, else stand-ins or generated pictures of the world). Default for software: ui.
  --brief: the brief file; its text decides the subject recipes (a globe only for a brief about countries, payments or
  shipping, a massing model only for buildings ...) and fills {product}, {audience}, {world} and {palette} in the prompts
  (lines like "Product: ..", "Audience: ..", "World: ..", "Palette: .."; the palette also from --page-file's :root).
  The history: "heroRecipes" in the --history file and in the machine's global history (scripts/lib/history.mjs:
  $RASYA_TASTE_HISTORY, default ~/.rasya-taste/history.json; RASYA_TASTE_HISTORY=off or --no-global leaves it out). The
  last recipe is never dealt again while another fits; each of the last six weighs less; product-ui is dealt at most once
  in any five pages of a kind and holds at most index.json weights.uiShare (0.2) of the pool.
  check reads a built page (no browser): the recipe mounted in the hero, its files linked, its kind and template, its
  still, every required asset slot filled with a file that exists (no demo stand-in), its data, the one-effect rule, and
  hero-ui-default (a product window in the hero on 3 of the last 5 pages). It exits 1 on a FAIL.
  lint checks index.json against the files (no browser).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGlobal, readJson, writeJsonAtomic } from './lib/history.mjs';
import { ensureKitAssets } from './lib/kit-assets.mjs';
await ensureKitAssets(); // the kit's pictures, downloaded once (rasya v4.5, scripts/lib/kit-assets.mjs)

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..');
const INDEX = path.join(SKILL, 'assets', 'layout', 'recipes', 'index.json');
const HEROES = path.join(SKILL, 'assets', 'layout', 'heroes.json');
const KINDS = {
  software: 'software', saas: 'software', ai: 'software', app: 'software', apps: 'software', dev: 'software', developer: 'software',
  'developer-tool': 'software', fintech: 'software', gaming: 'gaming', game: 'gaming', games: 'gaming',
  tech: 'tech', hardware: 'tech', device: 'tech', product: 'product', brand: 'product', shop: 'product',
  service: 'service', studio: 'service', agency: 'service', firm: 'service', clinic: 'service',
  editorial: 'editorial', magazine: 'editorial', journal: 'editorial', blog: 'editorial', publication: 'editorial', newsletter: 'editorial',
  place: 'place', cafe: 'place', bakery: 'place', restaurant: 'place', bar: 'place', guesthouse: 'place', hotel: 'place',
};
const TECH = new Set(['software', 'gaming', 'tech']);
const HAS = ['photo', 'ui', 'video', 'film', 'datum', 'object', 'logo', 'setting', 'ground'];
const TECHNIQUES = ['three', 'webgl', 'canvas', 'css', 'video', 'image'];
const ASSET_KINDS = ['illustration', 'photo', 'cutout', 'texture', 'render', 'video', 'model3d'];
const RATIOS = ['16:9', '4:5', '1:1', '3:2', '2:3'];

function die(m) { console.error('hero: ' + m); process.exit(1); }
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
const rel = (p) => path.relative(process.cwd(), p) || '.';

export function loadIndex() {
  let idx;
  try { idx = JSON.parse(fs.readFileSync(INDEX, 'utf8')); } catch (e) { die(`cannot read ${INDEX}: ${e.message}`); }
  if (!Array.isArray(idx.recipes)) die('index.json needs "recipes"');
  return idx;
}

/* ------------------------------------------------------------------ the brief */
const FIELDS = {
  product: /^(?:product|what is sold|what it sells|what we sell|sold|offer|category|the product)$/i,
  audience: /^(?:audience|who buys|buyer|buyers|customers|for whom|who it is for|users|the buyer)$/i,
  world: /^(?:world|setting|scene|where|context|place|the world|use)$/i,
  palette: /^(?:palette|colours|colors|colour|color)$/i,
  name: /^(?:name|brand|client|company)$/i,
};
export function readBrief(file) {
  const out = { text: '', fields: {} };
  if (!file) return out;
  let t = '';
  try { t = fs.readFileSync(file, 'utf8'); } catch { die(`cannot read the brief ${file}`); }
  out.text = t;
  for (const line of t.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:[-*]\s*)?\**([A-Za-z][A-Za-z ]{1,24}?)\**\s*[:：]\s*\**\s*(.+?)\s*$/);
    if (!m) continue;
    for (const [k, re] of Object.entries(FIELDS)) if (!out.fields[k] && re.test(m[1].trim())) out.fields[k] = m[2].replace(/\*+/g, '').trim();
  }
  if (!out.fields.name) { const h = t.match(/^#\s+(.+)$/m); if (h) out.fields.name = h[1].replace(/[:\u2013\u2014-].*$/, '').trim(); }
  return out;
}
/* a colour in words an image model understands (it reads hex badly) */
export function colourWords(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return String(hex);
  let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d) hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  const tone = l < 0.12 ? 'near-black' : l < 0.3 ? 'deep' : l < 0.55 ? '' : l < 0.8 ? 'light' : 'pale';
  if (s < 0.12 || d < 0.07) {   // a neutral: little chroma, whatever HSL's saturation says near white or black
    const warm = r > b + 0.015 ? 'warm ' : b > r + 0.015 ? 'cool ' : '';
    return l > 0.9 ? `${warm}off-white` : l < 0.12 ? `${warm}near-black` : `${warm}${tone ? tone + ' ' : ''}grey`.replace('near-black grey', 'near-black');
  }
  const names = [[15, 'red'], [40, 'orange'], [52, 'amber'], [66, 'yellow'], [90, 'lime'], [150, 'green'], [180, 'teal'], [200, 'cyan'], [240, 'blue'], [265, 'indigo'], [290, 'violet'], [330, 'magenta'], [350, 'pink'], [360, 'red']];
  let name = names.find(([lim]) => hue < lim)[1];
  if (name === 'orange' && l < 0.45) name = 'rust';
  if (name === 'yellow' && l < 0.4) name = 'olive';
  if (name === 'red' && l > 0.75) name = 'rose';
  return `${tone && tone !== 'near-black' ? tone + ' ' : ''}${name}`;
}
function paletteFromPage(file) {
  if (!file) return '';
  let t = '';
  try { t = fs.readFileSync(file, 'utf8'); } catch { return ''; }
  const v = (k) => (t.match(new RegExp(`--p-${k}\\s*:\\s*(#[0-9a-fA-F]{3,6})`)) || [])[1];
  const bg = v('bg'), ink = v('ink'), acc = v('accent');
  if (!bg || !acc) return '';
  return `a ${colourWords(bg)} ground, ${colourWords(ink || '#111')} ink and a ${colourWords(acc)} accent`;
}
/* "#fbf6ee, #221a14, #d8452b" (ground, ink, accent) in words; other words pass as written */
function paletteWords(v) {
  if (!v) return '';
  const hx = String(v).match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || [];
  if (hx.length >= 3) return `a ${colourWords(hx[0])} ground, ${colourWords(hx[1])} ink and a ${colourWords(hx[2])} accent`;
  return String(v).replace(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, (h) => colourWords(h));
}
const fill = (s, vals) => s.replace(/\{(product|audience|world|palette)\}/g, (m, k) => vals[k] || m);
const wordsIn = (text, words) => {
  const t = ` ${String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  return words.filter((w) => t.includes(` ${String(w).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `));
};

/* ------------------------------------------------------------------ the deal */
export function candidates(idx, { kind, template, has, subjectText, exclude = [] }) {
  const out = [], left = [];
  for (const r of idx.recipes) {
    const why = [];
    if (exclude.includes(r.id)) why.push('excluded');
    if (!r.kinds.includes(kind)) why.push(`not for ${kind}`);
    if (template && !r.heroTemplates.includes(template)) why.push(`not in hero-${template}`);
    const unmet = (r.needs || []).filter((n) => !n.split('|').some((k) => has.has(k)));
    if (unmet.length) why.push(`needs ${unmet.join(', ')}`);
    const hits = r.subjects && r.subjects.words ? wordsIn(subjectText, r.subjects.words) : [];
    if (r.subjects && r.subjects.required && !hits.length) why.push(subjectText ? 'the brief is not about its subject' : 'a subject recipe: pass --brief or --subject');
    if (why.length) { left.push({ r, why }); continue; }
    const w = ((r.weight && r.weight[kind]) || 1) * (hits.length ? (idx.weights.subject || 2.2) : 1);
    out.push({ r, base: w, hits });
  }
  return { out, left };
}
export function pool(idx, cands, history) {
  const W = idx.weights || {};
  let p = cands;
  // product-ui first: at most uiHardMax in any uiHardWindow pages of this kind (it wins over the no-repeat rule below)
  const win = history.slice(-((W.uiHardWindow || 5) - 1));
  if (win.filter((id) => id === 'product-ui').length >= (W.uiHardMax || 1)) { const noUi = p.filter((e) => e.r.id !== 'product-ui'); if (noUi.length) p = noUi; }
  const last = history[history.length - 1];
  if (last) { const fresh = p.filter((e) => e.r.id !== last); if (fresh.length) p = fresh; }
  const recent = history.slice(-(W.recentWindow || 6));
  const scored = p.map((e) => ({ e, w: e.base * Math.pow(W.recent ?? 0.4, recent.filter((id) => id === e.r.id).length) }));
  const ui = scored.find((x) => x.e.r.id === 'product-ui');
  if (ui && scored.length > 1) {
    const others = scored.filter((x) => x !== ui).reduce((s, x) => s + x.w, 0);
    const share = W.uiShare ?? 0.2;
    ui.w = Math.min(ui.w, (share / (1 - share)) * others);
  }
  return scored;
}
function draw(scored, rand) {
  if (!scored.length) return null;
  let r = rand() * scored.reduce((s, x) => s + x.w, 0), i = 0;
  while (i < scored.length - 1 && (r -= scored[i].w) > 0) i++;
  return scored[i].e;
}
/* the variant: dealt among those the page can take */
function variantFor(r, { kind, template, has, dark, rand }) {
  const pickOf = (xs) => xs[Math.floor(rand() * xs.length)];
  switch (r.id) {
    case 'wireframe-figure': return has.has('object') ? 'lines (data-rr-shape="model")' : pickOf(['lines', 'lines', 'points']);
    case 'massing-model': return pickOf(['court', 'bar', 'tower']);
    case 'object-drift': return has.has('object') ? 'cutout' : pickOf(['cutout', 'tile']);
    case 'type-mask': return (has.has('film') && kind === 'software') ? 'film' : 'photo';
    case 'bleed-photo': return (has.has('film') && TECH.has(kind)) ? 'film' : pickOf(['side', 'side', 'side', 'flatlay']);
    case 'illustration-scene': return pickOf(['flat', 'clay']);
    case 'shader-light': return pickOf(dark ? ['bars', 'ring', 'beam', 'curtains', 'rays'] : ['bars', 'ring', 'beam']);
    case 'globe-orbit': return template === 'split' ? 'whole' : 'rise';
    case 'product-ui': return pickOf(['cropped', 'zoomed', 'angled']);
    case 'scan-canvas': return has.has('film') && TECH.has(kind) ? 'film' : 'photo';
    default: return '';
  }
}

function filesOf(r) {
  const f = ['assets/layout/recipes/_shared/recipes.css', 'assets/layout/recipes/_shared/recipe-kit.js', `assets/layout/recipes/${r.id}/recipe.css`, `assets/layout/recipes/${r.id}/recipe.js`];
  if (r.id === 'globe-orbit') f.push('assets/objects/print-globe/land.js (imported: the coastline)');
  if (r.id === 'shader-light') f.push('assets/effects (mounted by system.js from data-fx)');
  return f;
}

function printPick(e, ctx, json) {
  const r = e && e.r;
  const vals = ctx.vals;
  const assets = r ? (r.assets || []).map((a) => ({ ...a, prompt: fill(a.prompt, vals) })) : [];
  const unfilled = [...new Set(assets.flatMap((a) => [...a.prompt.matchAll(/\{(product|audience|world|palette)\}/g)].map((m) => m[1])))];
  const brief = ctx.briefFile || 'brief.md';
  const assetCmd = r ? `node ${path.join(SKILL, 'scripts', 'photos.mjs')} recipe-assets --recipe ${r.id} --brief ${brief} --out .` : '';
  const refs = r ? r.refs.map((x) => ({ ...x, path: path.join(SKILL, x.file), motionPath: x.motion ? path.join(SKILL, x.motion) : null })) : [];
  if (json) {
    console.log(JSON.stringify({ seed: ctx.seed, page: ctx.kind, template: ctx.template || null, has: [...ctx.has], pick: r ? { ...r, assets, variant: ctx.variant, refs, files: filesOf(r) } : null, subjectHits: e ? e.hits : [], unfilled, assetCommand: assetCmd, left: ctx.left.map((x) => ({ id: x.r.id, why: x.why })) }, null, 1));
    return;
  }
  console.log(`seed ${ctx.seed} · page ${ctx.kind}${ctx.template ? ` · template ${ctx.template}` : ''} · has ${[...ctx.has].join(',')}${ctx.briefFile ? ` · brief ${ctx.briefFile}` : ''}`);
  if (!r) {
    console.log(`\n- no recipe fits ${ctx.kind}${ctx.template ? ` in hero-${ctx.template}` : ''}: build the template's own picture as layout-v4.md section 3 says.`);
    for (const x of ctx.left.slice(0, 14)) console.log(`  ${x.r.id.padEnd(19)} ${x.why.join('; ')}`);
    return;
  }
  console.log(`\nhero recipe: ${r.id} (${r.name})${ctx.variant ? ` · variant ${ctx.variant}` : ''}`);
  console.log(`  ${r.idea}`);
  console.log(`  technique ${r.technique}${r.technique === 'three' ? ` (three ${ctx.idx.three.version}, lazy, inside rtMotion.onReady)` : ''} · cost ${r.perf.cost} · WebGL contexts ${r.perf.contexts}${r.oneEffect ? ' · the page\'s ONE effect: effects.mjs deals no other effect, scene or WebGL moment' : ''}`);
  if (e.hits && e.hits.length) console.log(`  fits the brief: ${e.hits.slice(0, 6).join(', ')}`);
  if (r.id === 'product-ui' && ctx.only) console.log(`  the only recipe that fits ${ctx.template ? 'hero-' + ctx.template : 'here'}${ctx.briefFile ? '' : ' without a brief (pass --brief: the subject recipes need it)'}; hero.mjs check WARNs hero-ui-default when it leads 3 of the last 5 pages`);
  console.log('\nlook at the references first (Read each picture), then rebuild the move, not the brand:');
  for (const x of refs) {
    console.log(`  ${x.name}: ${x.path}${x.motionPath ? `\n  ${' '.repeat(x.name.length)}  ${x.motionPath} (its motion, three frames)` : ''}`);
    console.log(`    take: ${x.take}`);
  }
  console.log('  never take: their words, logo, pictures, product, characters or brand colours; the palette is the page\'s (start.mjs)');
  console.log(`\ninteraction: ${r.interaction}`);
  console.log(`still: ${r.still}`);
  console.log('\nfiles (in the kit copy, start.mjs copy-kit):');
  for (const f of filesOf(r)) console.log(`  ${f}`);
  console.log('once, in <head> after assets/layout/layout.css:');
  console.log('  <link rel="stylesheet" href="assets/layout/recipes/_shared/recipes.css">');
  console.log(`  <link rel="stylesheet" href="assets/layout/recipes/${r.id}/recipe.css">`);
  console.log('once, before </body>, after assets/motion/scroll.js:');
  console.log(`  <script type="module" src="assets/layout/recipes/${r.id}/recipe.js"></script>`);
  const slot = ctx.template && r.mount.slots ? r.mount.slots[ctx.template] : null;
  console.log(`the mount${slot ? ` (hero-${ctx.template}: ${slot})` : ''}:`);
  const FX = { bars: 'soft-light-bars', ring: 'orb-sphere', beam: 'spotlight-cone', curtains: 'aurora-curtains', rays: 'god-rays' };
  const v0 = String(ctx.variant || '').split(' ')[0];
  let markup = r.mount.markup;
  if (v0 && /data-rr-variant="/.test(markup)) markup = markup.replace(/data-rr-variant="[^"]*"/, `data-rr-variant="${v0}"`);
  if (r.id === 'shader-light' && FX[v0]) markup = markup.replace(/data-fx="[^"]*"/, `data-fx="${FX[v0]}"`);
  console.log(`  ${markup}`);
  for (const k of ['attrs', 'ground', 'card', 'word', 'routes', 'rule', 'boxes']) if (r.mount[k]) console.log(`  ${k}: ${r.mount[k]}`);
  if (ctx.variant) console.log(`  data-rr-variant="${String(ctx.variant).split(' ')[0]}"${r.variants && r.variants[String(ctx.variant).split(' ')[0]] ? `: ${r.variants[String(ctx.variant).split(' ')[0]]}` : ''}`);
  console.log(`  the working demo: <skill>/${r.demo} (copy only its .rr mount; every word and picture becomes the client's)`);
  if (assets.length) {
    console.log('\nassets (made by photos.mjs recipe-assets, each element in the mount with data-rr-slot="<slot>"):');
    for (const a of assets) {
      console.log(`  ${a.slot.padEnd(12)} ${a.kind} ×${a.count} ${a.ratio}${a.transparent ? ' transparent' : ''}${a.optional ? ' (optional)' : ''} · ${a.style}`);
      console.log(`    ${a.prompt}`);
    }
    if (unfilled.length) console.log(`  fill yourself: ${unfilled.map((u) => `{${u}}`).join(', ')} (add "${unfilled[0][0].toUpperCase() + unfilled[0].slice(1)}: .." to the brief, or pass --${unfilled[0]})`);
    if (ctx.kind === 'product' || ctx.kind === 'service') console.log('  a product or a service shows its own photographs; a generated picture is the world around it, never its product or its people passed off as real (photos.md)');
    console.log(`asset command:\n  ${assetCmd}`);
  } else console.log('\nassets: none to make (the recipe draws its picture, or the brief supplies it: ' + ((r.needs || []).join(', ') || 'nothing') + ')');
  console.log(`then: node ${path.join(SKILL, 'scripts', 'hero.mjs')} check index.html${ctx.histFile ? ` --history ${ctx.histFile}` : ''}`);
  console.log(`plan line 2: hero recipe ${r.id}${ctx.variant ? ` (${String(ctx.variant).split(' ')[0]})` : ''}, refs ${r.refs.map((x) => x.name).join(', ')}`);
}

/* ------------------------------------------------------------------ check: a small tag tree, no browser */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
function parse(html) {
  const root = { tag: '#root', attrs: {}, kids: [], parent: null };
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!doctype[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/gi;
  let cur = root, m, last = 0;
  while ((m = re.exec(html))) {
    last = re.lastIndex;
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) { let n = cur; while (n && n.tag !== tag) n = n.parent; if (n && n.parent) cur = n.parent; continue; }
    const attrs = {};
    for (const a of (m[3] || '').matchAll(/([^\s"'>\/=]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? '';
    const node = { tag, attrs, kids: [], parent: cur };
    cur.kids.push(node);
    if (RAW.has(tag)) { const end = html.toLowerCase().indexOf(`</${tag}`, last); node.raw = html.slice(last, end < 0 ? html.length : end); re.lastIndex = last = end < 0 ? html.length : end; continue; }
    if (tag === 'template') { const end = html.toLowerCase().indexOf('</template', last); node.raw = html.slice(last, end < 0 ? html.length : end); re.lastIndex = last = end < 0 ? html.length : end; continue; }
    if (!VOID.has(tag) && !m[4]) cur = node;
  }
  return root;
}
const all = (n, f, out = []) => { for (const k of n.kids) { if (f(k)) out.push(k); all(k, f, out); } return out; };
const has = (n, c) => ` ${n.attrs.class || ''} `.includes(` ${c} `);
const inside = (n, f) => { for (let p = n.parent; p; p = p.parent) if (f(p)) return true; return false; };

function pageKind(root) {
  const metas = all(root, (n) => n.tag === 'meta');
  const meta = (k) => (metas.find((n) => (n.attrs.name || '').toLowerCase() === k) || { attrs: {} }).attrs.content;
  const htmlN = all(root, (n) => n.tag === 'html')[0];
  const type = (htmlN && htmlN.attrs['data-type']) || meta('page-type') || '';
  const site = (meta('site-kind') || '').toLowerCase().trim();
  if (type === 'place' || meta('page-kind') === 'place') return 'place';
  if (TECH.has(site)) return site;
  if (['product', 'service', 'editorial'].includes(type)) return type;
  return type === 'software' ? 'software' : (type || 'unknown');
}

function check(file, idx, a) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { die(`cannot read ${file}`); }
  const dir = path.dirname(path.resolve(file));
  const out = [], f = (sev, msg) => out.push(`${sev} ${msg}`);
  const done = () => { out.forEach((l) => console.log(l)); if (out.some((l) => l.startsWith('FAIL'))) process.exit(1); };
  const root = parse(html);
  const kind = pageKind(root);
  const main = all(root, (n) => n.tag === 'main')[0] || root;
  const hero = all(main, (n) => n.tag === 'section' && (has(n, 'hero') || has(n, 'section--hero')))[0];
  const mounts = all(root, (n) => n.attrs['data-recipe'] !== undefined && !inside(n, (p) => p.tag === 'template'));
  // hero-ui-default: the history's last five pages (this kind)
  if (a.history && a.history !== true) {
    const hist = readJson(a.history);
    const G = openGlobal({ local: a.history, by: 'hero-check', enabled: true });
    const recent = G.recent('heroRecipes', { page: kind, local: Array.isArray(hist.heroRecipes) ? hist.heroRecipes : [] }).slice(-5);
    G.close();
    const n = recent.filter((id) => id === 'product-ui').length;
    if (n >= 3) f('WARN', `hero-ui-default: the hero's visual was a product UI window on ${n} of the last ${recent.length} pages: deal another recipe (hero.mjs pick --exclude product-ui)`);
  }
  if (!hero) { f('WARN', 'no section.hero in <main>: the recipe mounts in the hero'); return done(); }
  const heroMounts = mounts.filter((m) => inside(m, (p) => p === hero) || m === hero);
  const uiInHero = all(hero, (n) => has(n, 'd-win') || n.attrs['data-ui'] !== undefined || n.attrs['data-ui-load'] !== undefined || has(n, 'app-frame'));
  if (kind === 'place') {
    if (heroMounts.length) f('FAIL', 'a place takes no hero recipe: its hero is its own photograph (hero-place, layout-v4.md The place hero)');
    else f('OK', 'a place: no recipe, the place hero');
    return done();
  }
  if (!heroMounts.length) {
    f('WARN', `no hero recipe mounted in the hero (hero.mjs pick --page ${kind} --template <the dealt hero>)${uiInHero.length ? '; its visual is a product UI window: hero-ui-default counts it' : ''}`);
    return done();
  }
  if (heroMounts.length > 1) f('FAIL', `${heroMounts.length} recipes in the hero: one a hero (${heroMounts.map((m) => m.attrs['data-recipe']).join(', ')})`);
  for (const m of mounts.filter((x) => !heroMounts.includes(x))) f('WARN', `a ${m.attrs['data-recipe']} mount outside the hero: hero recipes are for the first screen`);
  const tplClass = (hero.attrs.class || '').split(/\s+/).find((c) => /^hero--/.test(c));
  const tpl = tplClass ? tplClass.slice(6) : null;
  for (const m of heroMounts) {
    const id = m.attrs['data-recipe'];
    const r = idx.recipes.find((x) => x.id === id);
    if (!r) { f('FAIL', `data-recipe="${id}" is no recipe (hero.mjs list)`); continue; }
    f('OK', `recipe ${id} (${r.technique}) in hero${tpl ? '-' + tpl : ''}`);
    // the kind and the template
    if (!r.kinds.includes(kind)) f('FAIL', `${id} is not for a ${kind} page (${r.kinds.join(', ')})${['three', 'webgl', 'canvas'].includes(r.technique) && !TECH.has(kind) ? ': WebGL and canvas only on software, gaming and tech' : ''}`);
    if (tpl && !r.heroTemplates.includes(tpl)) f('WARN', `${id} is built for hero-${r.heroTemplates.join(', hero-')}; this hero is hero-${tpl}`);
    // the files
    // a file is linked when its src or href, resolved from the page, ends in the recipe's path (the kit copy or the skill)
    const refs = all(root, (n) => (n.tag === 'script' && n.attrs.src) || (n.tag === 'link' && n.attrs.href)).map((n) => path.resolve(dir, (n.attrs.src || n.attrs.href).split(/[?#]/)[0]).split(path.sep).join('/'));
    const linked = (tail) => refs.some((x) => x.endsWith(tail));
    if (!linked(`/recipes/${id}/recipe.js`)) f('FAIL', `recipe.js is not loaded: <script type="module" src="assets/layout/recipes/${id}/recipe.js"></script> after scroll.js`);
    else if (!refs.some((x) => x.endsWith(`/recipes/${id}/recipe.js`) && fs.existsSync(x))) f('FAIL', `recipe.js is linked but not there: copy the kit (start.mjs copy-kit) so assets/layout/recipes/ sits beside the page`);
    if (!linked('/recipes/_shared/recipes.css')) f('FAIL', 'the shared mount CSS is not linked: <link rel="stylesheet" href="assets/layout/recipes/_shared/recipes.css">');
    if (!linked(`/recipes/${id}/recipe.css`)) f('FAIL', `recipe.css is not linked: <link rel="stylesheet" href="assets/layout/recipes/${id}/recipe.css">`);
    if (!/scroll\.js/.test(html)) f('WARN', 'no assets/motion/scroll.js: the recipe starts at window load instead of rtMotion.onReady');
    // the picture is named
    if (m.tag === 'img' || m.tag === 'video') { if (!m.attrs.alt && !m.attrs['aria-label']) f('FAIL', `the ${id} picture has no alt`); }
    else if (!['img', 'group'].includes(m.attrs.role) || !m.attrs['aria-label']) f('FAIL', `the ${id} mount needs role="img" (role="group" for a control) and an aria-label that says what the picture shows`);
    // the still
    const still = all(m, (n) => has(n, 'rr-still'));
    if (['three'].includes(r.technique) && !still.length) f('FAIL', `${id} has no still: <div class="rr-still" data-rr-draw></div> (or an <img class="rr-still"> poster) inside the mount`);
    else if (r.technique === 'three') f('OK', `still: ${still[0].tag === 'img' ? 'a poster' : 'drawn by recipe.js'}`);
    if (r.technique === 'webgl' && !m.attrs['data-fx']) f('FAIL', `${id} draws the kit's effect: data-fx="<id>" on the mount (its still comes with it)`);
    // the assets
    for (const spec of r.assets || []) {
      const els = [m, ...all(m, () => true)].filter((n) => n.attrs['data-rr-slot'] === spec.slot);
      const srcOf = (n) => n.attrs.src || n.attrs['data-rr-src'] || n.attrs.poster || (n.attrs.srcset || '').split(/[\s,]+/)[0] || '';
      if (!els.length) { if (!spec.optional) f('FAIL', `asset slot "${spec.slot}" is empty: ${spec.count} ${spec.kind} (photos.mjs recipe-assets --recipe ${id}), each with data-rr-slot="${spec.slot}"`); continue; }
      if (els.length < spec.count && !spec.optional && spec.count > 1) f('WARN', `asset slot "${spec.slot}" holds ${els.length} of ${spec.count}`);
      const kitPics = [];
      for (const n of els) {
        const s = srcOf(n);
        if (!s) { f('WARN', `a "${spec.slot}" element without a src`); continue; }
        if (/^(https?:)?\/\//i.test(s)) { f('WARN', `"${spec.slot}" loads ${s} from another host: keep the picture beside the page`); continue; }
        if (/^data:/i.test(s)) continue;
        const p = path.resolve(dir, decodeURIComponent(s.split(/[?#]/)[0]));
        if (!fs.existsSync(p)) f('FAIL', `"${spec.slot}" picture missing: ${s}`);
        const pp = p.split(path.sep).join('/');
        if (/\/recipes\/[^/]+\/demo-[^/]*$/.test(pp)) f('FAIL', `"${spec.slot}" is the demo's drawn stand-in (${s}): make the page's own (photos.mjs recipe-assets)`);
        else if (/\/assets\/(layout|photos)\/img\/[^/]+$/.test(pp)) kitPics.push(s);
      }
      if (kitPics.length) f('WARN', `"${spec.slot}": ${kitPics.length} of ${els.length} are the kit's demo photographs (${kitPics.slice(0, 2).join(', ')}${kitPics.length > 2 ? ', ..' : ''}): stand-ins, each listed in the report, or the page's own`);
    }
    // the recipe's own data
    const json = (k) => { const v = m.attrs[k]; if (v == null) return undefined; try { return JSON.parse(v); } catch { return null; } };
    if (id === 'massing-model') { const fl = json('data-rr-floors'); if (fl === null) f('FAIL', 'data-rr-floors is not JSON'); else if (!fl || !fl.length) f('WARN', 'no data-rr-floors: the readout shows only the total the HTML wrote'); }
    if (id === 'scan-canvas') { const b = json('data-rr-boxes'); if (!b || !b.length) f('FAIL', 'no data-rr-boxes: write the boxes on the real picture (fractions of it)'); }
    if (id === 'globe-orbit') { const rt = json('data-rr-routes'); if (rt === null) f('FAIL', 'data-rr-routes is not JSON'); else if (!rt) f('WARN', 'no data-rr-routes: the globe draws the demo\'s routes, not the brief\'s'); }
    if (id === 'prompt-demo' && !all(m, (n) => n.tag === 'template' && n.attrs['data-rr-answer'] !== undefined).length) f('FAIL', 'no <template data-rr-answer> answers in the prompt box');
    if (id === 'prompt-demo' && !all(m, (n) => n.tag === 'label').length) f('FAIL', 'the prompt field has no visible <label>');
    if (id === 'type-mask' && !all(m, (n) => has(n, 'rr-tm__word')).length) f('FAIL', 'no .rr-tm__word: the word the picture shows through');
    if (id === 'output-stack' && all(m, (n) => has(n, 'rr-os__card')).length < 3) f('WARN', 'fewer than three outputs in the stack');
    if (id === 'product-ui' && !all(m, (n) => has(n, 'rr-pu__win')).length) f('FAIL', 'no .rr-pu__win: the client\'s window goes in the mount');
    // the one effect
    if (r.oneEffect) {
      const others = all(root, (n) => (n.attrs['data-fx'] !== undefined || n.attrs['data-big-scene'] !== undefined || n.attrs['data-scene'] !== undefined || n.attrs['data-print'] !== undefined) && n !== m && !inside(n, (p) => p === m) && !inside(n, (p) => p.tag === 'template'));
      if (others.length) f('WARN', `${id} is the page's one effect: ${others.length} more effect, scene or print element(s) on the page (effects-usage.md Tech budget)`);
    }
  }
  if (/three@(?!0\.170\.0)\d/.test(html) || /<script\b[^>]*src\s*=\s*["'][^"']*three(\.module)?(\.min)?\.js/i.test(html)) f('WARN', 'another copy of three.js on the page: the recipes load three@0.170.0 once (recipe-kit.js)');
  done();
}

/* ------------------------------------------------------------------ lint: index.json against the files */
function lint(idx) {
  const out = [], f = (sev, msg) => out.push(`${sev} ${msg}`);
  const heroIds = new Set(JSON.parse(fs.readFileSync(HEROES, 'utf8')).heroes.map((h) => h.id));
  const kinds = new Set(['software', 'gaming', 'tech', 'product', 'service', 'editorial']);
  const ids = new Set();
  for (const r of idx.recipes) {
    const p = (m) => f('FAIL', `${r.id}: ${m}`);
    if (ids.has(r.id)) p('the id twice'); ids.add(r.id);
    for (const k of ['id', 'name', 'idea', 'refs', 'kinds', 'heroTemplates', 'technique', 'interaction', 'still', 'perf', 'needs', 'assets', 'mount', 'demo']) if (r[k] === undefined) p(`no "${k}"`);
    if (!TECHNIQUES.includes(r.technique)) p(`technique ${r.technique}`);
    for (const k of r.kinds || []) if (!kinds.has(k)) p(`kind ${k}`);
    if (['three', 'webgl', 'canvas'].includes(r.technique) && (r.kinds || []).some((k) => !TECH.has(k))) p('WebGL or canvas on a kind other than software, gaming, tech');
    for (const t of r.heroTemplates || []) if (!heroIds.has(t)) p(`hero template ${t} is not in heroes.json`);
    for (const t of r.heroTemplates || []) if (!(r.mount.slots || {})[t]) f('WARN', `${r.id}: no mount.slots for hero-${t}`);
    if (!(r.refs || []).length || r.refs.length > 4) p('one to three references (four at most)');
    for (const x of r.refs || []) {
      if (!fs.existsSync(path.join(SKILL, x.file))) p(`reference ${x.file} missing`);
      if (x.motion && !fs.existsSync(path.join(SKILL, x.motion))) p(`reference ${x.motion} missing`);
      if (!x.take) p(`reference ${x.name} says nothing to take`);
    }
    for (const fl of [r.demo, `assets/layout/recipes/${r.id}/recipe.js`, `assets/layout/recipes/${r.id}/recipe.css`]) if (!fs.existsSync(path.join(SKILL, fl))) p(`${fl} missing`);
    for (const a of r.assets || []) {
      const keys = Object.keys(a).sort().join(',');
      if (keys !== 'count,kind,optional,prompt,ratio,slot,style,transparent') p(`asset ${a.slot}: keys ${keys}`);
      if (!ASSET_KINDS.includes(a.kind)) p(`asset ${a.slot}: kind ${a.kind}`);
      if (!RATIOS.includes(a.ratio)) p(`asset ${a.slot}: ratio ${a.ratio}`);
      if (typeof a.transparent !== 'boolean' || typeof a.optional !== 'boolean' || !Number.isInteger(a.count)) p(`asset ${a.slot}: count, transparent, optional`);
      if (/\b(text|words?|letters?|logo)\b/i.test(a.prompt) && !/no (text|words|letters|marks)|no text|no logo|no print/i.test(a.prompt)) f('WARN', `${r.id} asset ${a.slot}: a prompt that names text without "no text"`);
      if (!/no text/i.test(a.prompt)) f('WARN', `${r.id} asset ${a.slot}: the prompt does not say "no text"`);
      if (!/\{product\}|\{world\}/.test(a.prompt)) f('WARN', `${r.id} asset ${a.slot}: the prompt has neither {product} nor {world}`);
    }
    const src = fs.existsSync(path.join(SKILL, `assets/layout/recipes/${r.id}/recipe.js`)) ? fs.readFileSync(path.join(SKILL, `assets/layout/recipes/${r.id}/recipe.js`), 'utf8') : '';
    if (!src.includes(`mountAll('${r.id}'`)) p('recipe.js does not mount its id');
    if (r.technique === 'three' && !/loadThree\(\)/.test(src)) p('a three recipe that does not load three through recipe-kit.js');
    if (/from\s+['"]three['"]|three@(?!0\.170\.0)/.test(src)) p('a bare or other three import');
    const demo = fs.existsSync(path.join(SKILL, r.demo)) ? fs.readFileSync(path.join(SKILL, r.demo), 'utf8') : '';
    if (demo && !demo.includes(`data-recipe="${r.id}"`)) p('the demo does not mount the recipe');
  }
  const ui = idx.recipes.filter((r) => r.needs.includes('ui'));
  if (ui.length !== 1) f('WARN', `${ui.length} recipes need ui: product UI is ONE recipe`);
  f('OK', `${idx.recipes.length} recipes, ${(idx.next || []).length} listed as next`);
  out.forEach((l) => console.log(l));
  if (out.some((l) => l.startsWith('FAIL'))) process.exit(1);
}

/* ------------------------------------------------------------------ main */
function main() {
  const a = args(process.argv.slice(2));
  const cmd = a._[0] || 'pick';
  const idx = loadIndex();
  if (cmd === 'lint') return lint(idx);
  if (cmd === 'check') { if (!a._[1]) die('check needs a page: hero.mjs check index.html'); return check(a._[1], idx, a); }
  if (cmd === 'list') {
    const kind = a.page ? KINDS[str(a.page).toLowerCase()] : null;
    if (a.page && !kind) die('unknown --page ' + a.page);
    const tpl = str(a.template) || null;
    for (const r of idx.recipes) {
      if (kind && !r.kinds.includes(kind)) continue;
      if (tpl && !r.heroTemplates.includes(tpl)) continue;
      console.log(`${r.id.padEnd(19)} ${r.technique.padEnd(7)} ${r.kinds.join(',').padEnd(42)} hero-${r.heroTemplates.join('|')}  refs ${r.refs.map((x) => x.name).join(', ')}${(r.needs || []).length ? `  needs ${r.needs.join(', ')}` : ''}${r.subjects && r.subjects.required ? '  (subject)' : ''}`);
    }
    if (!kind && !tpl) for (const n of idx.next || []) console.log(`next: ${n.id.padEnd(19)} ${n.idea}`);
    return;
  }
  if (cmd !== 'pick') die('commands: pick, list, check, lint');
  const raw = str(a.page).toLowerCase();
  const kind = KINDS[raw];
  if (!kind) die('pass --page software|gaming|tech|product|service|editorial');
  if (kind === 'place') { console.log('page place: no hero recipe. A place\'s hero is printed, never dealt: its own photograph under the header (deal.mjs --type place, hero-place.html).'); return; }
  const template = str(a.template) || null;
  if (template) { const heroIds = JSON.parse(fs.readFileSync(HEROES, 'utf8')).heroes.map((h) => h.id); if (!heroIds.includes(template)) die(`--template ${template} is no hero id (${heroIds.join(', ')})`); }
  const given = list(a.has);
  for (const x of given) if (!HAS.includes(x)) die(`--has ${x}: ${HAS.join(', ')}`);
  const hasSet = new Set(['photo', ...given]);
  if (hasSet.has('video')) hasSet.add('film');
  if (kind === 'software' && !a.has) hasSet.add('ui');
  if (kind === 'gaming') hasSet.delete('ui');
  const briefFile = str(a.brief) || null;
  const brief = readBrief(briefFile);
  const subjectText = [brief.text, str(a.subject)].filter(Boolean).join('\n');
  const vals = {
    product: str(a.product) || brief.fields.product || '',
    audience: str(a.audience) || brief.fields.audience || '',
    world: str(a.world) || brief.fields.world || '',
    palette: str(a.palette) || paletteWords(brief.fields.palette) || paletteFromPage(str(a['page-file']) || (fs.existsSync('index.html') ? 'index.html' : '')) || '',
  };
  const exclude = list(a.exclude);
  const seed = str(a.seed) || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const rand = rng(seed);
  const { out: cands, left } = candidates(idx, { kind, template, has: hasSet, subjectText, exclude });

  if (a.stats) {
    const n = parseInt(a.stats, 10) || 1000, H = {}, hist = [];
    for (let i = 0; i < n; i++) { const e = draw(pool(idx, cands, hist.slice(-12)), rand); if (!e) break; hist.push(e.r.id); H[e.r.id] = (H[e.r.id] || 0) + 1; }
    let maxUi = 0;
    for (let i = 0; i + 5 <= hist.length; i++) maxUi = Math.max(maxUi, hist.slice(i, i + 5).filter((x) => x === 'product-ui').length);
    console.log(`${n} ${kind} pages${template ? ` in hero-${template}` : ''}, each away from the last: ${Object.entries(H).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${(100 * v / n).toFixed(1)}%`).join(', ')}${H['product-ui'] ? ` · product-ui at most ${maxUi} in any 5` : ''}`);
    for (const x of left) console.log(`  left out ${x.r.id}: ${x.why.join('; ')}`);
    return;
  }

  let e = null;
  const histFile = a.history && a.history !== true ? String(a.history) : null;
  const hist = histFile ? readJson(histFile) : {};
  if (a.recipe && a.recipe !== true) {
    const r = idx.recipes.find((x) => x.id === a.recipe);
    if (!r) die(`--recipe ${a.recipe}: no such recipe (hero.mjs list)`);
    const ok = cands.find((x) => x.r.id === r.id);
    if (!ok) { const why = (left.find((x) => x.r.id === r.id) || { why: [] }).why; console.error(`hero: ${r.id} does not fit here (${why.join('; ')}); printed anyway, not recorded`); }
    e = ok || { r, base: 1, hits: [] };
  } else {
    const G = openGlobal({ local: histFile, by: 'hero' });
    const history = G.recent('heroRecipes', { page: kind, local: Array.isArray(hist.heroRecipes) ? hist.heroRecipes : [] });
    e = draw(pool(idx, cands, history), rand);
    if (e) {
      const at = new Date().toISOString();
      if (histFile) {
        hist.heroRecipes = [...(Array.isArray(hist.heroRecipes) ? hist.heroRecipes : []), { id: e.r.id, page: kind, template: template || undefined, at, seed }].slice(-200);
        writeJsonAtomic(histFile, hist);
      }
      G.add('heroRecipes', [{ id: e.r.id, at, seed, template: template || undefined }], { page: kind });
    }
    G.commit();
  }
  const variant = e ? variantFor(e.r, { kind, template, has: hasSet, dark: !!a.dark, rand }) : '';
  printPick(e, { idx, seed, kind, template, has: hasSet, vals, briefFile, histFile, variant, left, only: cands.length === 1 }, a.json);
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('hero.mjs')) main();
