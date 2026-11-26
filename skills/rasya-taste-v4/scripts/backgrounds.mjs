#!/usr/bin/env node
/*
  rasya-taste-v4 backgrounds.mjs - deals a background layer from the library (assets/backgrounds/index.json,
  "library"; bg-library.css). Rules: references/backgrounds.md, The background library.

    node <skill>/scripts/backgrounds.mjs pick --page <kind> --slot hero|section|card|footer|close --dark|--light
                                         [--used id,id] [--history .taste-skill/history.json] [--seed S] [--json]
    node <skill>/scripts/backgrounds.mjs page --page <kind> --slots hero,section,close --dark|--light [--history ..]
                                         [--effect hero,section [--effect-quiet]]
    node <skill>/scripts/backgrounds.mjs list

  kind: software (tech, gaming, saas count), product, service, place, editorial.
  pick deals one layer for one slot and prints the lines to paste; --used names the layers this page already holds,
  so the page caps hold across calls. page deals a whole page at once. Both append to the history file's
  "backgrounds" list (the same file start.mjs and moments.mjs keep) and weigh down what was dealt lately.
  v4.1: and to the global history (scripts/lib/history.mjs: $RASYA_TASTE_HISTORY, default ~/.rasya-taste/history.json),
  read with this site's own, so other builds' layers of this kind weigh down too; --no-global leaves it out.

  Caps a page (index.json "libraryCaps"): one animated layer, two pattern or gradient layers, one texture, three
  layers in all. Editorial is quieter (quiet intensity, patterns and paper, no animation); software is richer
  (beams, grid-pulse, mesh, glow weighted up). Product, service and place get the quiet ones only.

  --effect <slots> (v4.1, from the Quarry test: blueprint dealt round a gradient-mesh hero frame) names the slots that
  hold the page's effect (effects.mjs: a shader ground, the hero's art frame, the one [data-visual] section, a scene):
  each is skipped and the print says so. With --effect-quiet such a slot is dealt a still, quiet pattern or texture
  instead (no gradient, no animation: nothing that competes with the shader). Upstream pick.mjs's --effect, per slot.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGlobal, writeJsonAtomic } from './lib/history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'assets', 'backgrounds', 'index.json');
const SLOTS = ['hero', 'section', 'card', 'footer', 'close'];
const KINDS = { software: 'software', tech: 'software', gaming: 'software', saas: 'software', product: 'product', service: 'service', place: 'place', editorial: 'editorial' };
const RICH = { software: { beams: 2.2, 'grid-pulse': 2, mesh: 1.8, glow: 1.6, 'blur-grid': 1.5, blueprint: 1.3 }, editorial: { paper: 2.4, topo: 1.8, dots: 1.4, grid: 1.3 } };

function die(m) { console.error('backgrounds: ' + m); process.exit(1); }
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
const readHistory = f => { try { const h = JSON.parse(fs.readFileSync(f, 'utf8')); return h && typeof h === 'object' && !Array.isArray(h) ? h : {}; } catch { return {}; } };

/* may this layer join a page that already holds `used`? */
export function allowed(bg, used, kind) {
  const fam = used.map(u => u.family);
  if (used.some(u => u.id === bg.id)) return false;
  if (used.length >= 3) return false;
  if (bg.animated && fam.includes('animated')) return false;
  if ((bg.family === 'pattern' || bg.family === 'gradient') && fam.filter(f => f === 'pattern' || f === 'gradient').length >= 2) return false;
  if (bg.family === 'texture' && fam.includes('texture')) return false;
  if (kind === 'editorial' && (bg.animated && bg.id !== 'flowing-lines')) return false;
  if (kind === 'editorial' && bg.family === 'gradient' && fam.includes('gradient')) return false;
  return true;
}

export function dealOne(lib, { kind, slot, dark, used = [], history = [], rand, still = false }) {
  const pool = lib.filter(b => b.pages.includes(kind) && b.slots.includes(slot) && (dark ? b.dark : b.light) && allowed(b, used, kind)
    && (!still || (!b.animated && (b.family === 'pattern' || b.family === 'texture'))));
  if (!pool.length) return null;
  const recent = history.slice(-12);
  const w = pool.map(b => {
    let x = (RICH[kind] && RICH[kind][b.id]) || 1;
    x *= Math.pow(0.3, recent.filter(id => id === b.id).length);
    if (recent.slice(-3).includes(b.id)) x *= 0.3;
    if (kind === 'editorial' && b.animated) x *= 0.25;               // flowing-lines on editorial: rare
    if (slot === 'card' && b.family === 'gradient') x *= 0.5;        // a card ground stays a pattern or texture
    return x;
  });
  let r = rand() * w.reduce((s, x) => s + x, 0), i = 0;
  while (i < pool.length - 1 && (r -= w[i]) > 0) i++;
  const bg = pool[i];
  const intensity = still || kind === 'editorial' || ['product', 'service', 'place'].includes(kind) || slot === 'card' ? 'quiet'
    : bg.animated ? 'quiet' : bg.intensity.includes('medium') ? 'medium' : bg.intensity[0];
  const fade = slot === 'card' ? 'edge' : slot === 'footer' && bg.fade === 'center' ? 'edge' : bg.fade;
  return { ...bg, slot, use: { intensity, fade }, beside: still ? 'effect' : undefined };
}

export function markup(d) {
  const fadeAttr = d.use.fade && !['center', 'auto'].includes(d.use.fade) ? ` data-bg-fade="${d.use.fade}"` : '';
  const lines = [`<div class="rbg" data-bg="${d.id}" data-bg-intensity="${d.use.intensity}"${fadeAttr} aria-hidden="true"></div>`];
  return lines;
}
const HEAD = ['<link rel="stylesheet" href="assets/backgrounds/bg-library.css">   <!-- in <head>, after system.css -->'];
const JS = '<script src="assets/backgrounds/bg-library.js" defer></script>   <!-- once, before </body>: the animated layer needs it -->';

function print(deals, kind, dark, seed, json) {
  if (json) { console.log(JSON.stringify({ seed, page: kind, mode: dark ? 'dark' : 'light', picks: deals.map(d => d && (d.skipped ? { slot: d.slot, skipped: d.skipped } : { id: d.id, family: d.family, slot: d.slot, animated: d.animated, ...d.use, beside: d.beside || null })) }, null, 1)); return; }
  console.log(`seed ${seed} · page ${kind} · ${dark ? 'dark' : 'light'}`);
  deals.forEach(d => {
    if (!d) { console.log('- no layer: this slot stays flat (cap reached, or nothing fits this kind and slot)'); return; }
    if (d.skipped) { console.log(`\n${d.slot}: skipped: it holds the page's effect (--effect ${d.slot}); no layer there (--effect-quiet deals a still, quiet one)`); return; }
    console.log(`\n${d.slot}: ${d.id} (${d.family}, ${d.use.intensity}${d.beside ? ', still and quiet beside the effect' : ''}) · ${d.look}`);
    console.log('  first child of the ' + (d.slot === 'card' ? 'card' : d.slot === 'footer' ? 'footer' : 'section') + ':');
    markup(d).forEach(l => console.log('  ' + l));
  });
  if (deals.some(d => d && !d.skipped)) {
    console.log('\nonce a page:\n  ' + HEAD[0]);
    if (deals.some(d => d && d.animated)) console.log('  ' + JS);
  }
}

function main() {
  const a = args(process.argv.slice(2));
  const cmd = a._[0] || 'pick';
  const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  const lib = idx.library || die('index.json has no "library" list');
  if (cmd === 'list') { lib.forEach(b => console.log(`${b.id.padEnd(14)} ${b.family.padEnd(9)} ${b.animated ? 'animated' : 'still   '} ${b.slots.join('/').padEnd(32)} ${b.pages.join(', ')}`)); return; }
  const kind = KINDS[String(a.page || '').toLowerCase()];
  if (!kind) die('pass --page software|product|service|place|editorial (tech and gaming count as software)');
  if (!a.dark && !a.light) die('pass --dark or --light (the section\'s ground, not the page\'s)');
  const dark = !!a.dark;
  const seed = a.seed && a.seed !== true ? String(a.seed) : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const rand = rng(seed);
  const hist = a.history && a.history !== true ? readHistory(a.history) : {};
  // v4.1: this kind's layers of every build (the global history) merged with this site's own
  const G = openGlobal({ local: a.history, by: 'backgrounds' });
  const history = G.recent('backgrounds', { page: kind, local: hist.backgrounds || [] });
  const used = String(a.used && a.used !== true ? a.used : '').split(',').filter(Boolean).map(id => lib.find(b => b.id === id) || die(`--used: no layer "${id}"`));
  const effect = String(a.effect && a.effect !== true ? a.effect : '').split(',').map(x => x.trim()).filter(Boolean);
  if (a.effect === true) die('--effect names the slots that hold the effect: ' + SLOTS.join(','));
  if (effect.some(x => !SLOTS.includes(x))) die('--effect takes slots: ' + SLOTS.join('|'));
  let slots;
  if (cmd === 'pick') {
    if (!SLOTS.includes(a.slot)) die('pass --slot ' + SLOTS.join('|'));
    slots = [a.slot];
  } else if (cmd === 'page') {
    slots = String(a.slots || '').split(',').filter(Boolean);
    if (!slots.length || slots.some(s => !SLOTS.includes(s))) die('pass --slots, a list of ' + SLOTS.join('|'));
  } else die('commands: pick, page, list');
  const deals = [];
  for (const slot of slots) {
    const fx = effect.includes(slot);
    if (fx && !a['effect-quiet']) { deals.push({ slot, skipped: 'effect' }); continue; }
    const d = dealOne(lib, { kind, slot, dark, used, history, rand, still: fx });
    deals.push(d);
    if (d) { used.push(d); history.push(d.id); }
  }
  print(deals, kind, dark, seed, a.json);
  const at = new Date().toISOString();
  if (a.history && a.history !== true) {
    hist.backgrounds = [...(hist.backgrounds || []), ...deals.filter(d => d && !d.skipped).map(d => ({ id: d.id, slot: d.slot, page: kind, at, seed }))].slice(-200);
    writeJsonAtomic(a.history, hist);
  }
  G.add('backgrounds', deals.filter(d => d && !d.skipped).map(d => ({ id: d.id, slot: d.slot, at, seed })), { page: kind });
  G.commit();
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('backgrounds.mjs')) main();
