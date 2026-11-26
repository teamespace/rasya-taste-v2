#!/usr/bin/env node
/*
  taste-skill layout deal - deals the hero (heroes.json) for a page at random, weighted by the business
  type, away from the last pages' deals (references/layout-v4.md). It deals the hero only: the type
  pairing comes from start.mjs (VI-02), and its :root lines stay as start.mjs prints them. A place's
  hero is never dealt: --type place always prints hero-place (local-business Recipe 3; ST-53, ST-55).

    node <skill>/assets/layout/deal.mjs --type software|product|place|service|editorial
         [--kind tech]                         hardware or a tech device (page type product, kind tech): the grounds, moments
                                               and effects print as for software; without it a product, service or
                                               place prints none (kind other is flat)
         [--kind gaming]                       a game: page type software, kind gaming (SKILL.md section 1).
                                               It deals from heroes.json's gaming weights (photo, film, and
                                               statement or word when no art is supplied), never ui, and
                                               --type gaming means the same. Also read as a game:
                                               --type software with film, photo or setting in --has and no ui
         [--has photo,ui,film,object,setting,ground]   the material the brief really has (default by type:
                                               software ui; product photo (the client's photographs, else
                                               stand-ins from photos.mjs search); service photo; a game
                                               ground, so a game with art passes --has film,photo).
                                               word and statement are dealt only without photo or film (heroes.json avoid)
                                               object (a cut-out, the client's render, or a product render when
                                               the brief asks for 3D) with no photo or film always prints product
                                               (the full-width stage)
                                               setting (a game without art files: stand-in photographs of its
                                               setting, photos.mjs search) always prints photo: the game's name
                                               set large on the photograph's calm side
         [--hero <id>]                         print that one instead of dealing it
         [--history .taste-skill/layout-history.json] [--json] [--stats 1000]

  Prints the hero: its demo page, its numbers and the moment ids that fit the type (tech-only ids for
  software only). The hero's layer is backgrounds.mjs's and its effect effects.mjs's (tech only): this
  dealer prints no ground or effect of its own (rasya-taste-v4.1). word and editorial need a face with a wght or wdth
  axis: when start.mjs's pairing has none, deal the type again with start.mjs (VI-02).
  Node 18+, no packages.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureKitAssets } from '../../scripts/lib/kit-assets.mjs';
await ensureKitAssets(); // the kit's pictures, downloaded once (rasya v4.5, scripts/lib/kit-assets.mjs)

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const { heroes } = JSON.parse(fs.readFileSync(path.join(here, 'heroes.json'), 'utf8'));
const TYPES = ['software', 'product', 'place', 'service', 'editorial'];   // editorial: v4.1, its weights in heroes.json (masthead)
let type = opt('type');
if (type === 'gaming') type = 'software';   // a game is page type software, kind gaming
if (!TYPES.includes(type) && !opt('hero')) { console.error('deal: --type software|product|place|service|editorial (a game: --kind gaming)'); process.exit(2); }
// a product's default is photographs (its own, else stand-ins): a render only when the brief asks for 3D (--has object)
const HAS = { software: ['ui', 'ground'], product: ['photo', 'ground'], place: ['photo', 'ground'], service: ['photo', 'ground'], editorial: ['photo', 'ground'] };
const given = opt('has') && opt('has') !== true ? String(opt('has')).split(',').map(s => s.trim()).filter(Boolean) : null;
const gaming = type === 'software' && (opt('kind') === 'gaming' || opt('type') === 'gaming'
  || (given && !given.includes('ui') && (given.includes('film') || given.includes('photo') || given.includes('setting'))));
const has = new Set(given ? given.concat('ground') : (gaming ? ['ground'] : (HAS[type] || [])));
if (gaming) has.delete('ui');                  // never a UI hero on a game
if (!gaming && has.delete('setting')) has.add('photo');   // only a game has a setting: on any other page it is a photograph
const weightKey = gaming ? 'gaming' : type;    // the types weights to read
const histFile = opt('history');
let hist = { heroes: [] };
if (histFile) try { hist = { heroes: [], ...JSON.parse(fs.readFileSync(histFile, 'utf8')) }; } catch { /* a new history */ }
// v4.1: the global history (scripts/lib/history.mjs, $RASYA_TASTE_HISTORY; --no-global leaves it out): the heroes every
// build of this type dealt lately. Run from a copied assets folder the helper is not there: the local history only.
const HL = await import(new URL('../../scripts/lib/history.mjs', import.meta.url)).catch(() => null);
const G = HL ? HL.openGlobal({ local: histFile, by: 'deal', enabled: !opt('stats') && !opt('hero') && type !== 'place' })
  : { recent: (k, o) => o.local, add() {}, commit() {}, close() {} };

// weighted draw, away from the recent ones while others are left
function draw(list, weight, recent) {
  const fresh = list.filter(x => !recent.includes(x.id));
  const pool = (fresh.length ? fresh : list).filter(x => weight(x) > 0);
  const total = pool.reduce((a, x) => a + weight(x), 0);
  let r = Math.random() * total;
  for (const x of pool) { r -= weight(x); if (r <= 0) return x; }
  return pool[pool.length - 1];
}
const needsMet = h => h.needs.every(n => n.split('|').some(k => has.has(k))) && !(h.avoid || []).some(k => has.has(k));
// heroes.json moments / grounds / effects are { id, only?, dark?, as? }: only "tech" is for software briefs
// Tech is software, a game, or hardware passed as --kind tech. Every other page (product, service, place)
// is flat: heroes.json's grounds, moments and effects are all tech-only except the photograph ground,
// so a page of kind other is printed none (backgrounds.md "Other kinds stay flat").
const tech = type === 'software' || opt('kind') === 'tech';   // a game counts as tech
const fits = x => (tech ? (!x.only || x.only === 'tech') : (!x.only && x.id === 'photo'));
const ids = list => (list || []).filter(fits).filter(x => !x.dark).map(x => x.id);
const darkIds = list => (list || []).filter(fits).filter(x => x.dark).map(x => x.id);

function dealOnce(recentHeroes) {
  let hero = opt('hero') && opt('hero') !== true ? heroes.find(h => h.id === opt('hero')) : null;
  if (!hero && type === 'place') hero = heroes.find(h => h.id === 'place');   // never dealt: Recipe 3
  // the product shown by its render or a cut-out (object, no photograph or film): always the full-width
  // product stage, never the split's six columns (in testing: a render at 44% of the stage read as small)
  if (!hero && has.has('object') && !has.has('photo') && !has.has('film')) hero = heroes.find(h => h.id === 'product');
  // a game without art files: its name set large over a stand-in photograph of its setting (the photo hero's calm side)
  if (!hero && gaming && has.has('setting') && !has.has('photo') && !has.has('film') && !has.has('object')) hero = heroes.find(h => h.id === 'photo');
  if (!hero) {
    const ok = heroes.filter(h => h.id !== 'place' && (h.types[weightKey] || 0) > 0 && needsMet(h));
    if (!ok.length) { console.error(`deal: no hero for ${gaming ? 'a game' : type} with ${[...has].join(', ')}`); process.exit(1); }
    hero = draw(ok, h => h.types[weightKey], recentHeroes);
  }
  return hero;
}
if (opt('stats')) {
  const n = parseInt(opt('stats'), 10) || 1000, H = {};
  const rh = [];
  for (let i = 0; i < n; i++) { const h = dealOnce(rh.slice(-3)); rh.push(h.id); H[h.id] = (H[h.id] || 0) + 1; }
  const show = o => Object.entries(o).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${Math.round(100 * v / n)}%`).join(', ');
  console.log(`${n} pages of ${gaming ? 'a game' : 'type ' + type} with ${[...has].join(', ')}, each away from the last pages' deals:
heroes: ${show(H)}`);
  process.exit(0);
}
const hero = dealOnce(G.recent('heroes', { page: weightKey, local: hist.heroes }).slice(-3));
if (!hero) { console.error('deal: unknown --hero id'); process.exit(2); }

if (histFile && !opt('hero') && type !== 'place') {
  hist.heroes.push(hero.id);
  hist.heroes = hist.heroes.slice(-20);
  if (HL) HL.writeJsonAtomic(histFile, hist, { space: 1, newline: false });
  else { fs.mkdirSync(path.dirname(path.resolve(histFile)), { recursive: true }); fs.writeFileSync(histFile, JSON.stringify(hist, null, 1)); }
}
G.add('heroes', [hero.id], { page: weightKey });
G.commit();

if (opt('json')) {
  console.log(JSON.stringify({ type, kind: gaming ? 'gaming' : undefined, has: [...has], hero }, null, 1));
} else {
  const s = h => (typeof h === 'object' ? Object.entries(h).map(([k, v]) => `    ${k}: ${v}`).join('\n') : h);
  const axis = hero.id === 'word' || hero.id === 'editorial' ? ' This hero needs a face with a wght or wdth axis.' : '';
  console.log(`hero: ${hero.id} (${hero.name})  demo: <skill>/assets/layout/${hero.demo}
  ${hero.job}
  h1: ${hero.h1.token} ${hero.h1.size.join(' / ')}px, leading ${hero.h1.leading}, at most ${hero.h1.lines.join(' / ')} lines, ${hero.h1.maxChars} characters
  grid:\n${s(hero.grid)}
  at 1440:\n${s(hero.at1440)}
  at 390:\n${s(hero.at390)}
  moment: ${hero.moment}${ids(hero.moments).length ? `\n  moments: ${ids(hero.moments).join(', ')}` : ''}
  hero layer: from backgrounds.mjs (${tech ? 'effects: from effects.mjs on tech only' : 'quiet layers on kind other; effects: none (--kind tech for hardware); moments: two or three photo- and type-led ones from moments.mjs pick --page <kind>'})
  mistakes: ${hero.mistakes.join('; ')}

type: the pairing start.mjs dealt (VI-02); keep its :root lines as printed (headlines 400; 400 to 500 on tech).${axis}`);
}
