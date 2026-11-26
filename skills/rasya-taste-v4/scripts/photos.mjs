#!/usr/bin/env node
/*
  taste-skill photos.mjs - vetted photographs for place pages (assets/photos/photos.json).

    node <skill>/scripts/photos.mjs list                          the trades, with how many photographs each holds
    node <skill>/scripts/photos.mjs list --trade hotel            every photograph a trade may be dealt
    node <skill>/scripts/photos.mjs list --places                 the place names the library knows, for --place
    node <skill>/scripts/photos.mjs pick --trade cafe --sections hero,bar,roastery,coffee,visit --seed s1 --history .taste-skill/history.json
                                    [--count 6] [--tone light|dark] [--place "Lofoten, Norway"] [--setting coast,mountain]
                                    [--pictures 12] [--brief BRIEF.md] [--draft-lead | --no-client-photos] [--own-land] [--shop] [--mono] [--commons-only] [--json]
    node <skill>/scripts/photos.mjs pick --product-without-photos   a physical product with no photographs: no library frame; prints the search for stand-ins
    node <skill>/scripts/photos.mjs search "yoga studio interior" [--trade wellness] [--count 12] [--min 1600] [--orientation landscape|portrait] [--out .]
    node <skill>/scripts/photos.mjs search --trade hotel          a live search of Wikimedia Commons (CC0, CC BY, CC BY-SA, public domain JPEGs), by
                                                                  the trade's own search words when no words are given; writes .taste-skill/found.json
    node <skill>/scripts/photos.mjs search "concrete wall texture" --source pexels [--orientation landscape|portrait|square] [--color "#b9bbbd"|gray] [--set grey-concrete]
                                                                  Pexels (PEXELS_API_KEY in the environment; without it one line says how to set it and
                                                                  Wikimedia Commons answers instead); results kept in .taste-skill/found.json as p<id>
    node <skill>/scripts/photos.mjs fetch 326,m61713103,f12345 --out <site folder> [--hero 326] [--big id] [--lqip] [--dir assets/img]
    node <skill>/scripts/photos.mjs fetch p2387793 --panel p2387793 --out .     a Pexels result as a panel photo (assets/ui/cards.css [data-panel-photo]);
                                                                  --plate <id> for the hero's or the app frame's plate; --source pexels takes bare Pexels ids
    node <skill>/scripts/photos.mjs panel --page software --mood "calm" --count 3 [--ground sand|sky|sage|painting] [--dark] [--set warm-paper]
                                    [--history .taste-skill/history.json] [--out .] [--no-search] [--json]     (panel --sets lists the sets)
                                                                  pictures behind product UI panels: one tone family (a set in assets/ui/panel-photos.json),
                                                                  one query theme per panel (3 at most), then a Pexels search of each theme
    node <skill>/scripts/photos.mjs generate --set warm-paper --count 2 --out .  [--prompt "<words>"] [--orientation landscape|portrait|square]
                                    [--panel | --subject detail] [--model <id>] [--quality low|medium|high] [--json]
                                                                  OpenAI gpt-image (OPENAI_API_KEY in the environment only; model from --model or
                                                                  OPENAI_IMAGE_MODEL, quality from --quality or OPENAI_IMAGE_QUALITY, default low):
                                                                  writes .taste-skill/generated/g<hash>.jpg and a found.json entry; fetch takes the g-id
    node <skill>/scripts/photos.mjs generate --prompt "<subject, material, light>" --style flat-illustration --ratio 4:5 --out . [--kind illustration|render|cutout|texture|photo]
                                    [--transparent] [--palette "#hex,#hex,#hex"] [--brief brief.md] [--force-style | --no-style] [--dry-run]
                                                                  a styled picture (assets/ui/image-styles.json; photos.mjs styles lists them). --transparent
                                                                  (always for --kind cutout) asks for a transparent background and checks the alpha; a model that
                                                                  refuses it gets a flat mid-grey ground and a cut-out step. One style a page: the first styled
                                                                  generate records it in .taste-skill/image-style.json; another style WARNs and stops without
                                                                  --force-style. --ratio 1:1|4:5|3:2|2:3|16:9 (a size the API refuses is made at the nearest one)
    node <skill>/scripts/photos.mjs recipe-assets --recipe <id> --brief brief.md --out . [--palette "#hex,#hex,#hex"] [--dry-run] [--with-optional] [--only slot,slot]
                                    [--force-style] [--product|--audience|--world "<words>"] [--index assets/layout/recipes/index.json] [--json]
                                                                  the pictures a hero recipe declares: its prompts filled from the brief and the palette, each slot
                                                                  generated in its style, ratio and transparency (video and model3d are not: the recipe's fallback
                                                                  is printed); writes .taste-skill/recipe-assets.json and prints the fetch line. No OPENAI_API_KEY:
                                                                  the filled prompts and "not generated", exit 0
    node <skill>/scripts/photos.mjs styles [--kind illustration] [--out .]    the image style presets, the defaults by kind and the page's recorded style
    node <skill>/scripts/photos.mjs panel ... --source openai   the panel deal generates one picture per theme from its set's prompt instead of searching
    node <skill>/scripts/photos.mjs credits --out <site folder> [--adapted c141] [--write] [--text]    the ONE footer line and the credits list for the photographs the pages use

  pick deals library frames as DETAIL slots: hands, tools, materials, process (the oven, the roasting drum, a hammer,
  stems, a bag of beans), never a hero, a room, a shopfront, a product or a person (PH-02), and at most 1 in 3 of the
  page's pictures: --pictures N says how many pictures the page carries in all (12 if not said), so N/3 frames at most
  are dealt and the rest of the sections come back empty for the client's own photographs. --sections names the page's
  sections in order (bar, roastery, coffee, rooms, breakfast, oven...); each gets a detail of its subject or nothing:
  never a mood picture in its place. Hero, menu, visit, contact, booking and closing sections are dealt nothing, and
  so are land, sky and street. Only photographs rated 7 or more, with no whole figure, animal, vehicle, landmark or
  mood frame (curtain, sky, fog, aurora, waterfall), are dealt. With a history file it never repeats a frame dealt
  before. Two explicit exceptions, both for a draft, both listed in the report as stand-ins:
    --draft-lead  a hero frame may be dealt (the client has no hero photograph yet); Recipe 3, nothing on it. This is the DRAFT
                  path for a brief that supplies no photograph files (a cafe, a guesthouse): the 1-in-3 cap and the one frame per
                  section lift, so it deals the lead plus N frames (pick --draft-lead --pictures 8 --sections hero,bar,coffee,...:
                  each picture section gets one, then a second and third in turn, never the same motif twice) for a whole page
                  that leads with photographs (under 8 frames, every word repeated, it is the short page); it prints every frame as a STAND-IN for the build report;
                  nothing on the page says so (no captions). A place whose lead is land (a guesthouse) is dealt a landscape lead
                  when the --brief or --place names its region (a lead needs no --own-land); with no region, its frames still come and the hero is the statement. --no-client-photos is the same flag.
    --own-land    the brief says the client IS that landscape (a tour, a lodge on its own land): with --place, frames
                  of that place (landscape, road) are dealt. --place names the place as the library names it
                  ("Lofoten, Norway", "Iceland; Faroe Islands"; list --places): a frame is dealt when its source
                  names the client's place exactly or a place inside it; a broader tag (Iceland for Reykjavik) is not.
                  --setting (coast, mountain, lake...) only narrows frames with no named place.
  A physical product (a maker or brand of bikes, chairs, scooters, devices...) without photographs of its own is dealt
  no library frame: the client's own photographs lead; until they exist, stand-ins found with search (photographs of the
  same kind of thing, in use, its parts, where it lives; no maker's name, logo or face readable), each listed in the
  report as a stand-in to replace. A render (assets/objects/product-render) only when the brief asks for 3D or a render;
  never a drawing, never another kind's object (PH-04, PH-07). --shop (or "bike shop") is for a shop or workshop that
  sells or fixes every make: it gets parts and loads only.
  search asks Wikimedia Commons for JPEGs under CC0, CC BY, CC BY-SA or in the public domain, at least --min pixels wide
  (1600), and keeps them in .taste-skill/found.json under --out, so fetch and credits treat them as library frames. With
  no words it runs the trade's own search words (TERMS below: yoga and studio interiors, bike workshop benches and whole
  bikes, hotel buildings and rooms, weddings, a game's setting...). Every result is a candidate: look at it full size.
  Recent photographs: with TASTE_SKILL_RECENT=<file> set, pick and fetch keep the frames of every build in that one
  small file, and pick and search put a frame another build used lately behind the fresh ones, so two cafes built in
  two folders do not show the same frames. Unset (the default), nothing is written outside the project; --no-recent
  leaves the file out for one run.
  A bakery gets ovens, dough and loaves; a florist the stems and buds; a workshop only the frames of its own craft
  (--trade blacksmith, weaving, letterpress: a smithy is never a weaver's bench; a goldsmith, silversmith or locksmith
  has no trade here). A photograph marked moodOnly (its file names a business, or it is another's named room) is
  never the lead and never dealt to a trade that has the client's own room, counter or product.
  --commons-only: Wikimedia Commons files only (--detail-only is accepted and does nothing: it is the default).
  fetch copies a library file (assets/photos/img: WebP, always a 1200, some also 1600, 1800, 2144 or 2400) or downloads
  the older ones (500, 960 and 1280 wide, the --hero one 1920; WebP when ffmpeg is on the path, else JPEG), keeps every
  file inside the weight caps (a hero 400 KB, any other 250 KB: a larger one is left out of the srcset; the page's
  images together stay under 2,400 KiB at 1440, the figure perf.mjs FAILs above: fetch prints the estimate), writes
  credits.json and prints the <img> to paste, with data-source="library-057" (a search result: data-source="stand-in")
  and data-subject. A --hero also gets a
  780x975 (4:5) crop for the phone (a <picture>, needs ffmpeg) and sizes="100vw"; without ffmpeg its phone sizes term
  covers a 4:5 box instead. Either way it carries data-phone-fill, so a place hero's photograph may grow on a phone into
  what its words leave (assets/layout/layout.css). The hero's 2x at 1440 (2880 wide) is not
  in the library. Node 22+, no packages (ffmpeg only for the crops and WebP).
  credits prints TWO things: the ONE footer line ("Photographs via Unsplash and Wikimedia Commons", a link to credits.html) and the
  credits list block (photographers, licences (the Public Domain Mark's own page for a public-domain file) and source pages),
  which belongs on its own page: --write makes credits.html in the site's legal-page shell. Never one link per photograph in the
  footer (a credit wall; consistency.mjs FAILs more than one line of credits there, also inside a closed <details>).
  A place page leads with a photograph whenever any frame fits (no --draft-lead needed). --brief BRIEF.md (text or a file; the
  --trade words count too) names the client's region: a guesthouse "in the Westfjords of Iceland" is dealt a landscape lead, and
  land frames, whose source names that region (Westfjords, not Iceland alone), without --own-land. --place does the same; a region
  the library holds nothing of (the Lake District) deals no land, never another place's.
  Pexels (references/photos.md, Pexels): the key is read from PEXELS_API_KEY only, never written to a file, a log or the output.
  Its photographs are downloaded into the site (never hotlinked) at the size the slot needs (Pexels' own medium, large and
  large2x files: a panel or a plate takes large and large2x, a stand-in medium to large2x), each credited "Photo by <name> on
  Pexels" with its Pexels page in credits.json, so credits lists them. panel (references/cards.md, Panel photos) deals one set
  of assets/ui/panel-photos.json (one tone family), one theme per panel, with its own history (panelPhotos in the --history
  file), and searches Pexels for each theme. A generated picture (OpenAI gpt-image at quality 2.5 low, or Google Flow) is the
  generated source: generate --source openai (or panel --source openai) asks OpenAI gpt-image from a set's "prompt" or --prompt;
  Google Flow (--source flow) is not built yet. A generated picture needs no credit line; it is listed in the build report.
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { ensureKitAssets } from './lib/kit-assets.mjs';
await ensureKitAssets(); // the kit's pictures, downloaded once (rasya v4.5, scripts/lib/kit-assets.mjs)

const HERE = path.dirname(fileURLToPath(import.meta.url));
// a path printed in a command: absolute, forward slashes, quoted when it holds a space (the same in Git Bash, PowerShell and cmd)
const slash = (p) => path.resolve(p).replace(/\\/g, '/');
const cmdPath = (p) => (/\s/.test(slash(p)) ? '"' + slash(p) + '"' : slash(p));
const LIB_FILE = path.join(HERE, '..', 'assets', 'photos', 'photos.json');
const UA = 'taste-skill-photos/1.0 (+https://github.com/Leonxlnx/taste-skill)';
const lib = JSON.parse(fs.readFileSync(LIB_FILE, 'utf8'));
const byId = new Map(lib.photos.map((p) => [p.id, p]));

const argv = process.argv.slice(2);
const cmd = argv[0];
const FLAGS = ['shop', 'mono', 'json', 'product-without-photos', 'detail-only', 'draft-lead', 'no-client-photos', 'own-land', 'commons-only', 'lqip', 'text', 'places', 'write', 'no-recent', 'dark', 'no-search', 'sets', 'transparent', 'dry-run', 'force-style', 'no-style', 'with-optional'];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (!FLAGS.includes(k) && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const positional = () => { const out = []; for (let i = 1; i < argv.length; i++) { if (argv[i].startsWith('--')) { if (argv[i + 1] && !argv[i + 1].startsWith('--') && !FLAGS.includes(argv[i].slice(2))) i++; continue; } out.push(argv[i]); } return out; };
const die = (m) => { console.error('photos: ' + m); process.exit(1); };

// ------------------------------------------------------------------ sources
// Where a picture can come from. commons is the default live search; pexels needs PEXELS_API_KEY (read here only, never
// written or printed). The generated sources are the next step and are not built: each will write its file under
// <site>/.taste-skill/generated/, add an entry to found.json ({ id: 'g<hash>', source: 'generated', file, prompt, model,
// by: '<model>', licence: 'generated', panel }) from a panel set's "prompt" (assets/ui/panel-photos.json) or the page's own
// words, and fetch will copy that file like a library frame (no download), data-source="generated".
const SOURCES = { commons: 'Wikimedia Commons', pexels: 'Pexels' };
const SOURCE_LABEL = { ...SOURCES, openai: 'OpenAI gpt-image (generated)' };
const LATER = { flow: 'Google Flow', generated: 'a generated picture from Google Flow' };
function sourceOf(fallback) {
  const s = opt('source');
  if (!s || s === true) return fallback;
  const k = String(s).toLowerCase();
  if (SOURCES[k]) return k;
  if (LATER[k]) die(`--source ${k}: ${LATER[k]} is not built yet; use --source pexels or commons (references/photos.md, Generated pictures later)`);
  die(`--source takes ${Object.keys(SOURCES).join(' or ')}`);
}
const PEXELS_API = 'https://api.pexels.com/v1/';
const PEXELS_HOST = /^https:\/\/images\.pexels\.com\//;
// the key is read from the environment only: never from a flag or a file, never written, logged or printed
const pexelsKey = () => (typeof process.env.PEXELS_API_KEY === 'string' ? process.env.PEXELS_API_KEY.trim() : '');
const PEXELS_HINT = 'photos: no PEXELS_API_KEY in the environment: get a free key at https://www.pexels.com/api/ and run  export PEXELS_API_KEY=<your key>  (Windows: setx PEXELS_API_KEY <your key>), then open a new terminal; using Wikimedia Commons for now';

// ------------------------------------------------------------------ generated: OpenAI gpt-image (rasya-taste-v4.1)
// The key is read from OPENAI_API_KEY only: sent in the Authorization header, never written, logged or printed. The model
// comes from --model or OPENAI_IMAGE_MODEL (default gpt-image-1), the quality from --quality or OPENAI_IMAGE_QUALITY
// (default low). A picture is written to <out>/.taste-skill/generated/g<hash>.<ext> and kept in found.json as
// { id: 'g<hash>', source: 'generated', file, prompt, model, ... }; fetch copies it like a library frame.
// OPENAI_BASE_URL (optional) points at a compatible endpoint or proxy; default https://api.openai.com/v1
const OPENAI_IMAGES = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/$/, '') + '/images/generations';
const openaiKey = () => (typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY.trim() : '');
const OPENAI_HINT = 'photos: no OPENAI_API_KEY in the environment: set it in the shell or the bot process that runs the build (never in a file)';
const genModel = () => (typeof opt('model') === 'string' ? opt('model') : (process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1').trim());
const genQuality = () => (typeof opt('quality') === 'string' ? opt('quality') : (process.env.OPENAI_IMAGE_QUALITY || 'low').trim());
const GEN_SIZE = { landscape: '1536x1024', portrait: '1024x1536', square: '1024x1024' };
// a ratio (--ratio, a recipe's "ratio") -> the size asked for, then the one asked when that size is refused. gpt-image-1
// takes only GEN_SUPPORTED: 4:5 and 16:9 are made at the nearest of those, and the page crops them to the ratio in CSS
const GEN_RATIO = { '1:1': ['1024x1024'], '4:5': ['1024x1280', '1024x1536'], '3:2': ['1536x1024'], '2:3': ['1024x1536'], '16:9': ['1536x864', '1536x1024'] };
const GEN_SUPPORTED = ['1024x1024', '1536x1024', '1024x1536'];
const sizeRefused = new Set();   // sizes the API refused in this run: asked straight at the nearest supported one after that
const GEN_TAIL = ' A real photograph, natural light, true colour, fine texture. No text, no letters, no logos, no watermark, no people unless asked.';
const genDir = (out) => path.join(out, '.taste-skill', 'generated');
// the supported size nearest in shape (log of the ratio) to a size
function nearestSize(size) {
  const [w, h] = String(size).split('x').map(Number), r = Math.log(w / h);
  const d = (s) => { const [a, b] = s.split('x').map(Number); return Math.abs(Math.log(a / b) - r); };
  return [...GEN_SUPPORTED].sort((a, b) => d(a) - d(b))[0];
}
// the size to ask for a ratio: its own list, else (any W:H) the nearest supported size; null for a ratio that is not one
function sizeForRatio(ratio) {
  const k = String(ratio || '').replace(/\s+/g, '');
  if (GEN_RATIO[k]) return GEN_RATIO[k][0];
  const m = /^(\d+(?:\.\d+)?)[:x/](\d+(?:\.\d+)?)$/.exec(k);
  return m && +m[1] > 0 && +m[2] > 0 ? nearestSize(Math.round(1024 * +m[1]) + 'x' + Math.round(1024 * +m[2])) : null;
}
// the output format: opaque JPEG as before; transparent PNG (lossless; fetch makes the WebP with alpha) when ffmpeg is on
// the path, else WebP with alpha straight from the API (nothing here could convert a PNG); 'png' for the grey fallback
function genFormat({ transparent = false, format = '' } = {}) {
  if (format === 'png') return { output_format: 'png' };
  if (transparent) return FFMPEG ? { background: 'transparent', output_format: 'png' } : { background: 'transparent', output_format: 'webp', output_compression: 90 };
  return { output_format: 'jpeg', output_compression: 82 };
}
// the alpha of a picture, from its own bytes: a PNG's colour type (6 RGBA, 4 grey and alpha) or its tRNS chunk, a WebP's
// VP8X alpha flag or VP8L alpha bit. An 8-bit RGBA or grey-alpha PNG is also decoded to measure how much of it is clear
// (a model can send an alpha channel that is opaque everywhere): clear is the share of pixels under alpha 16, corners
// whether the four corners are clear. clear and corners are null when only the header was read.
function alphaOf(b) {
  if (b.length > 33 && b.readUInt32BE(0) === 0x89504e47) {
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20), depth = b[24], ct = b[25], lace = b[28];
    let trns = false;
    const idat = [];
    for (let i = 8; i + 8 <= b.length;) {
      const len = b.readUInt32BE(i), type = b.toString('ascii', i + 4, i + 8);
      if (type === 'tRNS') trns = true;
      else if (type === 'IDAT') idat.push(b.subarray(i + 8, i + 8 + len));
      else if (type === 'IEND') break;
      i += 12 + len;
    }
    const res = { format: 'png', channel: ct === 6 || ct === 4 || trns, colourType: ct, trns, clear: null, corners: null };
    if ((ct === 6 || ct === 4) && depth === 8 && !lace && idat.length) {
      try {
        const raw = zlib.inflateSync(Buffer.concat(idat));
        const bpp = ct === 6 ? 4 : 2, stride = w * bpp, cur = Buffer.alloc(stride), prev = Buffer.alloc(stride), corner = [];
        let clear = 0, seen = 0;
        for (let y = 0; y < h; y++) {
          const at = y * (stride + 1), f = raw[at];
          for (let x = 0; x < stride; x++) {
            const a = x >= bpp ? cur[x - bpp] : 0, up = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
            let v = raw[at + 1 + x];
            if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
            else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
            cur[x] = v & 255;
          }
          for (let x = bpp - 1; x < stride; x += bpp * 3) { seen++; if (cur[x] < 16) clear++; }
          if (y === 0 || y === h - 1) corner.push(cur[bpp - 1], cur[stride - 1]);
          cur.copy(prev);
        }
        res.clear = seen ? Math.round((clear / seen) * 100) / 100 : 0;
        res.corners = corner.every((v) => v < 16);
      } catch { /* the header still says what the file holds */ }
    }
    return res;
  }
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    return { format: 'webp', channel: t === 'VP8X' ? !!(b[20] & 0x10) : t === 'VP8L' ? !!((b.readUInt32LE(21) >>> 28) & 1) : false, clear: null, corners: null };
  }
  return { format: b[0] === 0xff && b[1] === 0xd8 ? 'jpeg' : 'unknown', channel: false, clear: null, corners: null };
}
// a cut-out: an alpha channel with clear pixels (its corners clear, or 3% of it or more; a WebP or tRNS file by its header)
const isCutout = (a) => !!a && a.channel && (a.clear === null || a.corners || a.clear >= 0.03);
const alphaText = (a) => (!a ? '' : !a.channel ? `no alpha (${a.format})` : a.clear === null ? `alpha (${a.format})` : `alpha, ${Math.round(a.clear * 100)}% clear${a.corners ? ', corners clear' : ''}`);
function imageSize(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), ext: '.png' };
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), ext: '.webp' };
    if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, ext: '.webp' };
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff), ext: '.webp' }; }
  }
  const j = jpegSize(b);
  return j ? { w: j.w, h: j.h, ext: '.jpg' } : null;
}
// the request body without the prompt (a dry run prints it; the key is never in it)
const genBody = (size, o) => ({ model: genModel(), n: 1, size: sizeRefused.has(size) ? nearestSize(size) : size, quality: genQuality(), ...genFormat(o) });
// one picture: { buf, size, format, notes }, or { refused: true, err } when a transparent background is refused.
// A 400 about the size asks again at the nearest supported size; about WebP, as PNG; about output_format, output_compression
// or quality, the plain request
async function openaiImage(prompt, size, { transparent = false, format = '' } = {}) {
  const key = openaiKey();
  if (!key) throw new Error('no OPENAI_API_KEY in the environment');
  const call = async (body) => {
    const r = await fetch(OPENAI_IMAGES, { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const t = await r.text();
    let j = null; try { j = JSON.parse(t); } catch { /* not json */ }
    const e = (j && j.error) || {};
    return { ok: r.ok, status: r.status, j, err: String(e.message || t.slice(0, 200)).replace(key, '[key]'), param: String(e.param || '') };
  };
  const body = { prompt, ...genBody(size, { transparent, format }) };
  const notes = [];
  let r = await call(body);
  for (let tries = 0; !r.ok && r.status === 400 && tries < 4; tries++) {
    const about = (x) => r.param === x || new RegExp('\\b' + x + '\\b', 'i').test(r.err);
    if ((about('size') || r.err.includes(body.size)) && !GEN_SUPPORTED.includes(body.size)) {
      sizeRefused.add(body.size);
      notes.push(`${body.size} refused by ${body.model}: made at ${nearestSize(body.size)}, crop it to the ratio in CSS`);
      body.size = nearestSize(body.size);
    } else if (transparent && about('background')) return { refused: true, err: r.err, notes };
    else if (body.output_format === 'webp' && (about('output_format') || /webp/i.test(r.err))) { body.output_format = 'png'; delete body.output_compression; }
    else if (transparent && about('output_format')) return { refused: true, err: r.err, notes };
    else if (about('output_format') || about('output_compression') || about('quality')) { delete body.output_format; delete body.output_compression; delete body.quality; }
    else break;
    r = await call(body);
  }
  if (!r.ok) throw new Error(`OpenAI answered ${r.status}${r.status === 401 ? ' (the key was refused)' : r.status === 429 ? ' (rate limit or quota)' : ''}: ${r.err}`);
  const d = r.j && r.j.data && r.j.data[0];
  let buf = null;
  if (d && d.b64_json) buf = Buffer.from(d.b64_json, 'base64');
  else if (d && d.url && /^https:\/\//.test(d.url)) {
    const g = await fetch(d.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
    if (!g.ok) throw new Error('the picture URL answered HTTP ' + g.status);
    buf = Buffer.from(await g.arrayBuffer());
  }
  if (!buf || !imageSize(buf)) throw new Error('OpenAI returned no image');
  return { buf, size: body.size, format: body.output_format || '', notes };
}
// generate N pictures from one prompt (or one per theme), keep them in found.json; returns the entries
// prompts: [{ prompt, theme?, grey?, alt? }] (grey: the same picture on flat mid-grey, for a model that refuses transparency);
// tail: GEN_TAIL for a photograph as before, '' when a style preset already ends the prompt; size: asked as is (a refused
// size is asked again at the nearest supported one); style, kind, aspect, slot and recipe are kept on each found.json entry
async function generatePictures({ out, prompts, orientation, size: wanted = '', set = null, panel = false, subject = 'detail', tail = GEN_TAIL, transparent = false, style = null, kind = '', aspect = '', slot = '', recipe = '' }) {
  const dir = genDir(out);
  fs.mkdirSync(dir, { recursive: true });
  const size = wanted || ((typeof opt('size') === 'string' && /^\d+x\d+$/.test(opt('size'))) ? opt('size') : GEN_SIZE[orientation] || GEN_SIZE.landscape);
  const made = [], failed = [];
  for (const { prompt, theme, grey, alt } of prompts) {
    try {
      let res = await openaiImage(prompt + tail, size, { transparent });
      let cutout = '', matte = '';
      if (res.refused) {
        // the model refuses a transparent background: the same picture on a flat mid-grey ground, and a cut-out step after
        console.log(`  ${genModel()} refuses a transparent background (${res.err.slice(0, 100)}): made on flat mid-grey instead, a cut-out step is needed`);
        res = await openaiImage((grey || prompt + '. ' + imageStyles().rules.greyGround) + tail, size, { format: 'png' });
        cutout = 'needed'; matte = '#808080';
      }
      const buf = res.buf;
      const alpha = transparent ? alphaOf(buf) : null;
      if (transparent && !cutout) cutout = isCutout(alpha) ? 'ok' : 'needed';
      const dim = imageSize(buf) || { w: +res.size.split('x')[0], h: +res.size.split('x')[1], ext: '.png' };
      const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
      const file = 'g' + hash + dim.ext;
      fs.writeFileSync(path.join(dir, file), buf);
      const ratio = +(dim.w / dim.h).toFixed(3);
      made.push({ id: 'g' + hash, source: 'generated', file, width: dim.w, height: dim.h, ratio, orientation: ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square',
        alt: panel ? '' : (alt || theme || prompt).slice(0, 120), prompt, ...(theme ? { theme } : {}), model: genModel(), quality: genQuality(), by: genModel(), licence: 'generated',
        page: '', subject: panel ? 'panel' : subject, ...(panel ? { panel: true } : {}), ...(set ? { set: set.id, focus: set.focus || 'center', avg: set.color } : { focus: 'center' }),
        size: res.size, ...(res.size !== size ? { asked: size } : {}), ...(aspect ? { aspect } : {}), ...(kind ? { kind } : {}), ...(style ? { style: style.id } : {}),
        ...(transparent ? { transparent: true, alpha: { channel: alpha.channel, clear: alpha.clear, corners: alpha.corners }, cutout, ...(matte ? { matte } : {}) } : {}),
        ...(slot ? { slot } : {}), ...(recipe ? { recipe } : {}), at: new Date().toISOString() });
      console.log(`generated g${hash}  ${dim.w}x${dim.h}  ${Math.round(buf.length / 1024)} KB${transparent ? '  ' + alphaText(alpha) + (cutout === 'needed' ? ': CUT-OUT NEEDED' : ': cut-out') : ''}  ${slot ? slot + ': ' : theme ? theme + ': ' : ''}${(alt || prompt).slice(0, 80)}${(alt || prompt).length > 80 ? '...' : ''}`);
      for (const n of res.notes) console.log('  ' + n);
    } catch (e) {
      failed.push((slot || theme || prompt.slice(0, 40)) + ': ' + e.message);
      if (/refused|quota|rate limit/.test(e.message)) break;
    }
  }
  storeFound(out, made);
  return { made, failed };
}
async function generateCmd() {
  const s = opt('source');
  if (s && s !== true && String(s).toLowerCase() !== 'openai') die(`generate --source ${s}: only openai is built (Google Flow later)`);
  const out = typeof opt('out') === 'string' ? opt('out') : '';
  const set = opt('set') && opt('set') !== true ? findSet(opt('set')) : null;
  if (opt('set') && opt('set') !== true && !set) die(`no panel set "${opt('set')}": ${panelSets().sets.map((x) => x.id).join(', ')}`);
  const words = typeof opt('prompt') === 'string' ? opt('prompt') : '';
  if (!out || (!words && !set)) die('usage: photos.mjs generate (--set <panel set> | --prompt "<a photograph of ...>") --out <site folder> [--count 1-3] [--orientation landscape|portrait|square | --ratio 1:1|4:5|3:2|2:3|16:9] [--style <id or words> [--force-style] | --no-style] [--kind illustration|render|cutout|texture|photo] [--transparent] [--palette "#hex,#hex,#hex"] [--brief brief.md] [--panel | --subject detail] [--model <id>] [--quality low] [--dry-run]   (photos.mjs styles lists the styles)');
  const dry = !!opt('dry-run');
  if (!openaiKey() && !dry) die(OPENAI_HINT.replace(/^photos: /, ''));
  const count = Math.max(1, Math.min(3, parseInt(opt('count', 1), 10) || 1));
  const panel = !!set || argv.includes('--panel');
  const kind = typeof opt('kind') === 'string' ? opt('kind').toLowerCase() : '';
  if (kind && !GEN_KINDS.includes(kind)) die(`--kind takes ${GEN_KINDS.join(', ')}${/video|model/.test(kind) ? ` (${kind} is not made here: references/photos.md, What cannot be generated)` : ''}`);
  const transparent = !!opt('transparent') || kind === 'cutout';
  const ratio = typeof opt('ratio') === 'string' ? opt('ratio') : '';
  const ratioSize = ratio ? sizeForRatio(ratio) : '';
  if (ratio && !ratioSize) die(`--ratio takes ${Object.keys(GEN_RATIO).join(', ')} (or any W:H)`);
  const orientation = typeof opt('orientation') === 'string' ? opt('orientation') : (set ? set.orientation : 'landscape');
  // the page's one image style; a panel set keeps its own photo look and is not locked
  let style = null, lock = null, styleFrom = '';
  if (set) { if (typeof opt('style') === 'string') console.log(`--style is not used with --set: the panel set ${set.id} keeps its own photo look\n`); }
  else {
    lock = readLock(out);
    let word = typeof opt('style') === 'string' ? opt('style') : '';
    if (word) styleFrom = '--style';
    else if (lock && !opt('no-style')) { word = lockWord(lock); styleFrom = 'the page\'s style, ' + slash(lockFile(out)); }
    if (word) style = resolveStyle(word, kind || 'photo', { strict: styleFrom === '--style' });
  }
  const clash = style && lock && !lockAllows(lock, style.id);
  if (clash) {
    const msg = styleClashText(lock, [style.id], out);
    if (!opt('force-style')) { console.error(msg + '\n  pass --force-style to make ' + style.id + ' the page\'s style'); if (!dry) process.exit(1); }
    else console.log(msg + '\n  --force-style: ' + style.id + ' becomes the page\'s style; remake or drop the pictures made in ' + lock.style + '\n');
  }
  const pal = style || /\{palette\}/.test(words) ? resolvePalette(out, lock) : null;
  const B = briefFacts(opt('brief'));
  const missing = new Set();
  const base = words ? fillPrompt(words, { ...B.ctx, palette: pal ? pal.phrase : '' }, missing) : '';
  if (missing.size) console.log(`no value for ${[...missing].map((k) => '{' + k + '}').join(', ')} in the prompt (left out): pass --brief brief.md or --${[...missing][0]} "<words>"\n`);
  const D = style || transparent ? imageStyles() : null;
  const themes = set ? set.themes.slice(0, count) : [];
  const variant = (i) => (count > 1 ? D.rules.variant.replace('{i}', i + 1).replace('{n}', count) : '');
  const prompts = Array.from({ length: count }, (_, i) => {
    if (set) return { theme: themes[i] || '', prompt: (words || set.prompt) + (themes[i] ? `; the subject: ${themes[i]}` : '') };
    if (style) return { prompt: styledPrompt(base, style, { palette: pal.phrase, kind: kind || 'photo', transparent, variant: variant(i) }), grey: transparent ? styledPrompt(base, style, { palette: pal.phrase, kind: kind || 'photo', grey: true, variant: variant(i) }) : '', alt: altOf(base) };
    const one = base + (count > 1 ? `; take ${i + 1} of ${count}, another framing` : '');
    return transparent ? { prompt: one + '. ' + D.rules.cutoutGround, grey: one + '. ' + D.rules.greyGround, alt: altOf(base) } : { prompt: one };
  });
  const tail = style ? '' : GEN_TAIL;
  const size = ratioSize || ((typeof opt('size') === 'string' && /^\d+x\d+$/.test(opt('size'))) ? opt('size') : GEN_SIZE[orientation] || GEN_SIZE.landscape);
  console.log(`OpenAI ${genModel()} at quality ${genQuality()}, ${ratio ? ratio + ' (' + size + ')' : orientation + ' (' + (GEN_SIZE[orientation] || 'custom') + ')'}, ${count} picture${count === 1 ? '' : 's'}${set ? ' for panel set ' + set.id : ''}${transparent ? ', transparent' : ''}${style ? `\nstyle ${style.id} (${styleFrom})${pal ? `, palette ${pal.phrase} (${pal.from})` : ''}` : ''}\n`);
  if (dry) {
    prompts.forEach((p, i) => console.log(`${i + 1}. ${p.prompt + tail}\n   call: POST ${endpointText()} ${JSON.stringify(genBody(size, { transparent }))}${GEN_RATIO[ratio] && GEN_RATIO[ratio][1] ? ` (at ${GEN_RATIO[ratio][1]} if ${size} is refused)` : ''}\n`));
    console.log('dry run: nothing generated, nothing written');
    return;
  }
  const { made, failed } = await generatePictures({ out, prompts, orientation, size, set, panel, subject: typeof opt('subject') === 'string' ? opt('subject') : kind || 'detail', tail, transparent, style, kind, aspect: ratio && ratioSize ? ratio : '' });
  if (style && made.length) writeLock(out, nextLock(lock, style, { palette: pal, ids: made.map((m) => m.id), by: 'generate', force: !!clash }));
  if (failed.length) console.log('\nnot generated: ' + failed.join('; '));
  if (!made.length) process.exit(1);
  const ids = made.map((m) => m.id).join(',');
  if (opt('json')) { console.log(JSON.stringify({ made, failed }, null, 1)); return; }
  const need = made.filter((m) => m.cutout === 'needed');
  if (need.length) console.log('\n' + cutoutAdvice(need, out));
  if (style && !lock) console.log(`\none style a page: ${style.id} is now this page's style (${slash(lockFile(out))}); a picture in another style needs --force-style`);
  console.log(`\nlook at each picture full size (${slash(genDir(out))}/), then fetch the ones you keep:\n  node ${cmdPath(path.join(HERE, 'photos.mjs'))} fetch ${panel ? '--panel ' : ''}${ids} --out ${out === '.' ? '.' : cmdPath(out)}${typeof opt('history') === 'string' ? ' --history ' + opt('history') : ''}\n(a generated picture needs no credit line; name it in the build report as generated, with its model)`);
}
// ------------------------------------------------------------------ image styles, one a page (rasya-taste-v4.3, agent A2)
// assets/ui/image-styles.json: presets of art direction (suffix with {palette} and {ground}, negative list, the kinds each
// suits). The first styled generate (or recipe-assets) records the page's style in <site>/.taste-skill/image-style.json;
// a picture in another style WARNs and stops unless --force-style. Panel sets keep their own photo look and are not locked.
const STYLE_FILE = path.join(HERE, '..', 'assets', 'ui', 'image-styles.json');
const GEN_KINDS = ['illustration', 'render', 'cutout', 'texture', 'photo'];
let styleData = null;
function imageStyles() {
  if (!styleData) { try { styleData = JSON.parse(fs.readFileSync(STYLE_FILE, 'utf8')); } catch (e) { die('cannot read ' + slash(STYLE_FILE) + ': ' + e.message); } }
  return styleData;
}
// a preset by id or name; else free words (their words are the art direction). strict (a typed --style): a word shaped
// like an id (one-word-or-hyphens) that is no preset stops, so a typo never becomes a style
function resolveStyle(word, kind, { strict = false } = {}) {
  const D = imageStyles();
  const w = String(word || '').trim();
  if (!w) { const id = D.rules.defaults[kind] || D.rules.defaults.illustration; return { ...D.styles.find((s) => s.id === id), preset: true }; }
  const k = setKey(w);
  const hit = D.styles.find((s) => s.id === k || setKey(s.name) === k);
  if (hit) return { ...hit, preset: true };
  if (/^free:/.test(w)) return resolveStyle(w.slice(5), kind);
  if (strict && /^[a-z0-9]+(-[a-z0-9]+)*$/i.test(w)) die(`no image style "${w}": ${D.styles.map((s) => s.id).join(', ')} (or free words in quotes, e.g. --style "soft charcoal sketch")`);
  const words = w.replace(/-/g, ' ').replace(/\s+/g, ' ');
  return { id: 'free:' + words.toLowerCase().slice(0, 80), name: words, preset: false, kinds: GEN_KINDS, photo: /\bphoto/i.test(words),
    suffix: `${words}, colours from the palette {palette}, {ground}`, ground: D.rules.freeGround, negative: [] };
}
// the picture's own words, the kind's clause, the style (palette and ground filled), a variant, the negative list and the tail
function styledPrompt(base, style, { palette, kind = '', transparent = false, grey = false, variant = '' }) {
  const R = imageStyles().rules;
  const ground = grey ? R.greyGround : transparent ? R.cutoutGround : style.ground || R.freeGround;
  let suffix = style.suffix.replace(/\{palette\}/g, palette || R.defaultPalette);
  suffix = /\{ground\}/.test(suffix) ? suffix.replace(/\{ground\}/g, ground) : suffix + ', ' + ground;
  const neg = [...new Set([...(style.negative || []), ...R.negative])];
  const parts = [String(base || '').replace(/[\s.;,]+$/, ''), R.kindClause[kind] || '', suffix, variant, 'Avoid: ' + neg.join(', ')];
  return parts.filter(Boolean).join('. ') + '. ' + (style.photo ? R.tailPhoto : R.tail);
}
// a short alt from the picture's own words: their first clause
const altOf = (base) => String(base || '').split(/[.;:]|,\s(?=[a-z]+ing\b)/)[0].trim().slice(0, 110);
const lockFile = (out) => path.join(out, '.taste-skill', 'image-style.json');
function readLock(out) { try { const j = JSON.parse(fs.readFileSync(lockFile(out), 'utf8')); return j && typeof j.style === 'string' ? j : null; } catch { return null; } }
function writeLock(out, lock) { fs.mkdirSync(path.dirname(lockFile(out)), { recursive: true }); fs.writeFileSync(lockFile(out), JSON.stringify(lock, null, 1) + '\n'); }
const lockWord = (lock) => (lock.preset === false && lock.words ? lock.words : lock.style);
const lockAllows = (lock, id) => !lock || lock.style === id || (Array.isArray(lock.allowed) && lock.allowed.includes(id));
function styleClashText(lock, ids, out) {
  const made = (lock.ids || []).length;
  return `WARN one style a page: this page's pictures are ${lock.style}${(lock.allowed || []).length > 1 ? ' (its recipe also allows ' + lock.allowed.filter((x) => x !== lock.style).join(', ') + ')' : ''}, recorded in ${slash(lockFile(out))}${made ? ' with ' + made + ' picture' + (made === 1 ? '' : 's') : ''}; this asks for ${ids.join(', ')}. Keep the page's style (drop --style, or --style ${lock.style}).`;
}
// the page's style after a run: the same lock with the new ids, or (new, or forced) a fresh one that keeps the old as previous
function nextLock(lock, style, { palette = null, ids = [], by = 'generate', recipe = '', allowed = [], force = false }) {
  const now = new Date().toISOString();
  if (lock && !force && (lockAllows(lock, style.id) || allowed.includes(lock.style))) {
    return { ...lock, allowed: [...new Set([lock.style, ...(lock.allowed || []), ...allowed])], ids: [...new Set([...(lock.ids || []), ...ids])], ...(recipe ? { recipe } : {}), at: now };
  }
  const previous = lock ? [...(lock.previous || []), { style: lock.style, ids: lock.ids || [], until: now }] : [];
  return { about: 'The one image style of this page (photos.mjs generate --style, recipe-assets). A picture in another style needs --force-style. Panel sets keep their own photo look.',
    style: style.id, name: style.name, preset: style.preset !== false, ...(style.preset === false ? { words: style.name } : {}), allowed: [...new Set([style.id, ...allowed])],
    palette: palette ? { phrase: palette.phrase, hexes: palette.hexes, from: palette.from } : null, ...(recipe ? { recipe } : {}), ids, by, at: now, ...(previous.length ? { previous } : {}) };
}

// ------------------------------------------------------------------ the palette words for {palette}
// --palette "#hex,#hex,#hex" (or words), else the page's :root tokens (index.html, then assets/system.css in --out), else
// the palette the page's style was recorded with, else "a calm neutral palette with one accent". Each hex gets a plain
// colour name: an image model follows "#e4572e (vermilion)" better than the hex alone.
function hexName(hex) {
  let h = String(hex).replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  h = h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d) hue = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  if (hue < 0) hue += 360;
  const warm = hue < 75 || hue >= 330, cool = hue >= 170 && hue < 270;
  if (l > 0.95 && s < 0.6) return s < 0.2 || d < 0.03 ? 'white' : warm ? 'warm white' : 'cool white';
  if (l > 0.88 && s < 0.7) return warm ? 'warm off-white' : cool ? 'cool off-white' : 'off-white';
  if (l < 0.1) return 'near-black';
  if (s < 0.12 || d < 0.06) { const t = l > 0.75 ? 'pale grey' : l > 0.5 ? 'light grey' : l > 0.28 ? 'mid grey' : 'charcoal'; return d < 0.03 ? t : (warm ? 'warm ' : cool ? 'cool ' : '') + t; }
  const HUES = [[10, 'red'], [22, 'vermilion'], [38, 'orange'], [50, 'amber'], [64, 'yellow'], [85, 'lime'], [150, 'green'], [178, 'teal'], [198, 'cyan'], [218, 'sky blue'], [245, 'blue'], [265, 'indigo'], [290, 'violet'], [322, 'magenta'], [345, 'rose'], [361, 'red']];
  let name = HUES.find(([m]) => hue < m)[1];
  if (hue >= 15 && hue < 50 && l < 0.45 && s < 0.75) name = 'brown';
  else if (hue >= 38 && hue < 64 && s < 0.5) name = 'ochre';
  else if (hue >= 64 && hue < 150 && s < 0.35) name = l < 0.4 ? 'olive' : 'sage';
  const tone = l > 0.8 ? 'pale ' : l > 0.65 ? 'light ' : l < 0.25 ? 'deep ' : l < 0.4 ? 'dark ' : s < 0.35 ? 'muted ' : '';
  return tone + name;
}
const hexList = (list) => { const x = list.map((h) => h + ' (' + hexName(h) + ')'); return x.length > 1 ? x.slice(0, -1).join(', ') + ' and ' + x.at(-1) : x[0]; };
// the page's palette tokens (--p-bg or --bg, --p-accent, --p-ink, --p-surface): the first :root block of index.html that
// holds them, else assets/system.css; hex only
function pageTokens(out) {
  const pick = (css) => {
    const t = {};
    for (const m of css.matchAll(/:root\s*\{([^}]*)\}/g)) for (const x of m[1].matchAll(/--(?:p-)?(bg|surface|ink|muted|accent)\s*:\s*(#[0-9a-f]{3,8})\b/gi)) { const k = x[1].toLowerCase(); if (!t[k]) t[k] = x[2].toLowerCase().slice(0, 7); }
    return t;
  };
  for (const f of ['index.html', path.join('assets', 'system.css')]) {
    try { const t = pick(fs.readFileSync(path.join(out, f), 'utf8')); if (t.bg || t.accent) return { t, from: slash(path.join(out, f)) + ' :root' }; } catch { /* next */ }
  }
  return null;
}
function resolvePalette(out, lock) {
  const asked = opt('palette');
  if (typeof asked === 'string' && asked.trim()) {
    const hexes = asked.split(/[\s,;]+/).filter(Boolean).map((h) => (h.startsWith('#') ? h : '#' + h).toLowerCase()).filter((h) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)).map((h) => h.slice(0, 7));
    return hexes.length ? { phrase: hexList(hexes), hexes, from: '--palette' } : { phrase: asked.trim(), hexes: [], from: '--palette' };
  }
  const pt = pageTokens(out);
  if (pt) {
    const roles = [['bg', 'the ground'], ['accent', 'the accent'], ['ink', 'the ink'], ['surface', 'the surface']];
    const seen = new Set(), list = [];
    for (const [k, role] of roles) { const h = pt.t[k]; if (h && !seen.has(h) && list.length < 3) { seen.add(h); list.push([h, role]); } }
    const x = list.map(([h, role]) => `${h} (${hexName(h)}, ${role})`);
    return { phrase: x.length > 1 ? x.slice(0, -1).join(', ') + ' and ' + x.at(-1) : x[0], hexes: list.map(([h]) => h), from: pt.from };
  }
  if (lock && lock.palette && lock.palette.phrase) return { ...lock.palette, from: 'the page\'s recorded style (' + slash(lockFile(out)) + ')' };
  return { phrase: imageStyles().rules.defaultPalette, hexes: [], from: 'the default (no --palette, no :root tokens in ' + slash(out) + ')' };
}

// ------------------------------------------------------------------ the brief's words for {product}, {audience}, {world}
// A simple extraction, printed with where each came from; --product, --audience and --world override it.
//   {name}      the first heading (or line), "Brief:" and a trailing "(new)" taken off
//   {product}   the name with what it is: a "Category:" line, else the first sentence of a Product section
//   {audience}  the first sentence of an "Audience" section (or an "Audience:" line), else "the people who use it"
//   {world}     a World, Setting, Context or Industry section, else the Product section's first sentence, else a short phrase
function briefFacts(file) {
  const facts = { name: '', product: '', audience: '', world: '', how: {} };
  let t = '';
  if (typeof file === 'string') { try { t = fs.readFileSync(file, 'utf8'); } catch { die('cannot read the brief ' + file); } }
  const clean = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`>#]+/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/\s*·\s*/g, ', ').replace(/"/g, '\'').replace(/\s+/g, ' ').trim();
  const sentence = (s, n) => { let x = clean(s); const m = /^(.+?[.!?])(\s|$)/.exec(x); x = m ? m[1] : x; const w = x.split(' '); if (w.length > n) x = w.slice(0, n).join(' '); return x.replace(/[.!?,;:]+$/, ''); };
  const lines = t.split(/\r?\n/);
  const section = (re) => {
    for (let i = 0; i < lines.length; i++) {
      const h = /^#{1,6}\s+(.*)$/.exec(lines[i]);
      if (h && re.test(clean(h[1]))) {
        const body = [];
        for (let j = i + 1; j < lines.length && !/^#{1,6}\s/.test(lines[j]); j++) body.push(lines[j].replace(/^\s*[-*+]\s+/, ''));
        const text = body.join(' ').trim();
        if (text) return { text, how: '## ' + clean(h[1]) };
      }
      const k = /^\s*(?:[-*]\s+)?\**([A-Za-z][\w '/-]{1,30}?)\**\s*:\s*(.+)$/.exec(lines[i]);
      if (k && !/^#/.test(lines[i]) && re.test(k[1].trim()) && clean(k[2])) return { text: k[2], how: k[1].trim() + ':' };
    }
    return null;
  };
  if (t) {
    const head = lines.find((l) => /^#\s+/.test(l)) || lines.find((l) => l.trim());
    facts.name = clean(head || '').replace(/^(brief|project|client|landing page)\s*[:,-]\s*/i, '').replace(/\s*\([^)]*\)\s*$/, '').split(' ').slice(0, 8).join(' ');
    const cat = section(/^(category|what it is|type)$/i), prod = section(/^(product|the product|what|about)\b/i);
    const what = cat ? sentence(cat.text, 10) : prod ? sentence(prod.text, 14) : '';
    facts.product = facts.name && what ? `${facts.name} (${what})` : facts.name || what;
    facts.how.product = (head ? 'the first ' + (/^#\s/.test(head) ? 'heading' : 'line') : '') + (what ? (head ? ' and ' : '') + (cat ? 'the ' + cat.how + ' line' : prod.how) : '');
    const aud = section(/^(audience|who it'?s for|who is it for|for whom|users|customers|target)\b/i);
    if (aud) { facts.audience = sentence(aud.text, 16); facts.how.audience = aud.how; }
    const world = section(/^(world|setting|context|scene|industry|market|domain|where)\b/i);
    if (world) { facts.world = sentence(world.text, 18); facts.how.world = world.how; } else if (prod) { facts.world = sentence(prod.text, 18); facts.how.world = prod.how + ', its first sentence'; } else if (what) { facts.world = what; facts.how.world = facts.how.product; }
  }
  for (const k of ['product', 'audience', 'world']) if (typeof opt(k) === 'string' && opt(k).trim()) { facts[k] = clean(opt(k)); facts.how[k] = '--' + k; }
  const DEF = { product: 'the product', audience: 'the people who use it', world: 'the everyday world the product works in' };
  for (const k of Object.keys(DEF)) if (!facts[k]) { facts[k] = DEF[k]; facts.how[k] = 'a default phrase' + (file ? ' (the brief has no ' + (k === 'product' ? 'heading' : k === 'audience' ? 'Audience section' : 'World or Product section') + ')' : ' (no --brief)'); }
  facts.ctx = { name: facts.name || facts.product, product: facts.product, audience: facts.audience, world: facts.world };
  return facts;
}
// {product} {audience} {world} {palette} {name} in a template; an unknown one is left out and named
function fillPrompt(t, ctx, missing) {
  return String(t).replace(/\{(\w+)\}/g, (m, k) => { if (ctx[k]) return ctx[k]; missing.add(k); return ''; }).replace(/\s+([,.;:])/g, '$1').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}
const endpointText = () => { try { const u = new URL(OPENAI_IMAGES); return u.origin + u.pathname; } catch { return 'the images endpoint'; } };
const onPath = (c) => String(process.env.PATH || '').split(path.delimiter).some((d) => d && [c, c + '.exe', c + '.cmd'].some((f) => { try { return fs.statSync(path.join(d, f)).isFile(); } catch { return false; } }));
// a picture that should be a cut-out and is not: a local tool to cut it (in place, so fetch keeps its alpha), else a ground that matches it
function cutoutAdvice(list, out) {
  const g = (m) => cmdPath(path.join(genDir(out), m.file)), cut = (m) => cmdPath(path.join(genDir(out), m.id + '-cut.png'));
  const lines = ['CUT-OUT NEEDED for ' + list.map((m) => m.id + (m.matte ? ' (flat mid-grey ground: the model refused transparency)' : ' (no clear pixels came back)')).join(', ') + ':'];
  if (onPath('rembg')) lines.push(...list.map((m) => `  rembg i ${g(m)} ${cut(m)} && mv ${cut(m)} ${g(m)}`));
  else if (FFMPEG && list.some((m) => m.matte)) lines.push('  no rembg on this machine; a rough key of the flat grey with ffmpeg (look at the edges: a grey inside the subject goes too):', ...list.filter((m) => m.matte).map((m) => `  ffmpeg -loglevel error -y -i ${g(m)} -vf "colorkey=0x808080:0.10:0.06,format=rgba" ${cut(m)} && mv ${cut(m)} ${g(m)}`));
  else lines.push('  no cut-out tool on this machine (rembg' + (FFMPEG ? '' : ', ffmpeg') + ')');
  lines.push('  until it is cut: use it on a ground that matches its own (' + (list.some((m) => m.matte) ? 'the slot\'s ground set to #808080, or a frame of that grey' : 'its backdrop') + '), never floating over another ground; fetch keeps any alpha the file has');
  return lines.join('\n');
}
// photos.mjs styles [--kind illustration] [--out .] [--json]: the presets, the defaults by kind and the page's style
function stylesCmd() {
  const D = imageStyles();
  if (opt('json')) { console.log(JSON.stringify(D, null, 1)); return; }
  const kind = typeof opt('kind') === 'string' ? opt('kind').toLowerCase() : '';
  console.log(`image styles (${slash(STYLE_FILE)}): one a page, appended to the picture's own words with generate --style <id> (or recipe-assets)\n`);
  for (const s of D.styles.filter((x) => !kind || x.kinds.includes(kind))) console.log(`  ${s.id.padEnd(23)} ${s.kinds.join(', ').padEnd(30)} ${s.use}`);
  console.log(`\ndefaults by kind: ${Object.entries(D.rules.defaults).map(([k, v]) => k + ' ' + v).join(', ')}; free words in quotes are a style too (--style "soft charcoal sketch")`);
  const out = typeof opt('out') === 'string' ? opt('out') : '.';
  const lock = readLock(out);
  console.log(lock ? `this page's style: ${lock.style}${(lock.allowed || []).length > 1 ? ' (with ' + lock.allowed.filter((x) => x !== lock.style).join(', ') + ')' : ''}, ${(lock.ids || []).length} picture(s), ${slash(lockFile(out))}` : `no style recorded yet in ${slash(lockFile(out))}: the first styled generate records it`);
}

// ------------------------------------------------------------------ recipe-assets: the pictures a hero recipe declares
// assets/layout/recipes/index.json (agent R's library; --index reads another file). A recipe lists its assets as
//   { slot, kind: illustration|photo|cutout|texture|render|video|model3d, style, prompt (with {product} {audience} {world}
//     {palette}), count, ratio: 16:9|4:5|1:1|3:2|2:3, transparent, optional }
// Each still is generated in the slot's style (a preset id or free words; else the recipe's, the page's or the kind's
// default), at the ratio's size, transparent for a cutout; video and model3d are not made here and get the recipe's
// fallback. Writes <out>/.taste-skill/recipe-assets.json (slot -> g-ids and files) and prints the fetch line.
const RECIPE_INDEX = path.join(HERE, '..', 'assets', 'layout', 'recipes', 'index.json');
function loadRecipe(file, id) {
  let idx;
  try { idx = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { die(`cannot read the recipe index ${slash(file)}: ${e.code === 'ENOENT' ? 'no such file (--index <file> reads another)' : e.message}`); }
  const asList = (o) => Object.entries(o).filter(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) && !['about', 'rules', 'meta', 'notes'].includes(k)).map(([k, v]) => ({ id: k, ...v }));
  const list = Array.isArray(idx) ? idx : Array.isArray(idx.recipes) ? idx.recipes : idx.recipes && typeof idx.recipes === 'object' ? asList(idx.recipes) : asList(idx);
  const r = list.find((x) => x && x.id === id) || list.find((x) => x && setKey(x.id) === setKey(id));
  if (!r) die(`no recipe "${id}" in ${slash(file)}: ${list.map((x) => x && x.id).filter(Boolean).join(', ') || 'it lists none'}`);
  const recipe = { ...r };
  if (!Array.isArray(recipe.assets)) {
    // the recipe's own folder: <recipes>/<id>/recipe.json (or assets.json, index.json, meta.json)
    for (const f of ['recipe.json', 'assets.json', 'index.json', 'meta.json']) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(path.dirname(file), String(r.id), f), 'utf8'));
        const a = Array.isArray(j) ? j : j && j.assets;
        if (Array.isArray(a)) { Object.assign(recipe, Array.isArray(j) ? {} : j, r, { assets: a }); break; }
      } catch { /* next */ }
    }
  }
  return { recipe, specs: Array.isArray(recipe.assets) ? recipe.assets.filter((s) => s && typeof s === 'object') : [] };
}
async function recipeAssetsCmd() {
  const id = typeof opt('recipe') === 'string' ? opt('recipe') : '';
  const out = typeof opt('out') === 'string' ? opt('out') : '.';
  const indexFile = typeof opt('index') === 'string' ? path.resolve(opt('index')) : RECIPE_INDEX;
  if (!id) die('usage: photos.mjs recipe-assets --recipe <id> --brief brief.md --out . [--palette "#hex,#hex,#hex"] [--dry-run] [--with-optional] [--only slot,slot] [--force-style] [--product|--audience|--world "<words>"] [--index <file>] [--json]');
  const { recipe, specs } = loadRecipe(indexFile, id);
  if (!specs.length) die(`recipe ${recipe.id} declares no assets (an "assets" list in ${slash(indexFile)} or in its folder)`);
  const D = imageStyles();
  const dry = !!opt('dry-run'), force = !!opt('force-style'), key = !!openaiKey();
  const only = typeof opt('only') === 'string' ? new Set(opt('only').split(',').map((x) => x.trim()).filter(Boolean)) : null;
  const B = briefFacts(opt('brief'));
  const lock = readLock(out);
  const pal = resolvePalette(out, lock);
  const ctx = { ...B.ctx, palette: pal.phrase };
  const missing = new Set(), plans = [], later = [], cannot = [], slots = new Map();
  for (const [i, s] of specs.entries()) {
    const kind = String(s.kind || '').toLowerCase().trim();
    let slot = String(s.slot || 'asset-' + (i + 1)).trim();
    const n = slots.get(slot) || 0;
    slots.set(slot, n + 1);
    if (n) slot += '-' + (n + 1);
    if (only && !only.has(slot)) continue;
    const base = fillPrompt(s.prompt || recipe.prompt || '{product}', ctx, missing);
    const fallback = String(s.fallback || (recipe.fallbacks && recipe.fallbacks[slot]) || recipe.fallback || '');
    const ratio = String(s.ratio || (kind === 'texture' ? '3:2' : kind === 'video' ? '16:9' : '1:1'));
    if (kind === 'video' || kind === 'model3d' || !GEN_KINDS.includes(kind)) { cannot.push({ slot, kind: kind || '(none)', base, ratio, fallback, style: s.style || recipe.style || '' }); continue; }
    const styleWord = s.style || recipe.style || (lock ? lockWord(lock) : '');
    const style = resolveStyle(styleWord, kind);
    const transparent = kind === 'cutout' || s.transparent === true;
    const size = sizeForRatio(ratio) || '1024x1024';
    const asked = parseInt(s.count, 10) || 1, count = Math.max(1, Math.min(8, asked));
    const variant = (k) => (count > 1 ? D.rules.variant.replace('{i}', k + 1).replace('{n}', count) : '');
    const prompts = Array.from({ length: count }, (_, k) => ({ prompt: styledPrompt(base, style, { palette: pal.phrase, kind, transparent, variant: variant(k) }),
      grey: transparent ? styledPrompt(base, style, { palette: pal.phrase, kind, grey: true, variant: variant(k) }) : '', alt: s.alt || altOf(base) }));
    const plan = { slot, kind, style, styleWord, transparent, ratio, size, count, asked, optional: !!s.optional, base, prompts, fallback };
    (plan.optional && !opt('with-optional') && !only ? later : plans).push(plan);
  }
  // one style a page: the recipe's styles go together when the page has none yet or its style is one of them
  const styles = [...new Set(plans.map((p) => p.style.id))];
  const clash = lock && styles.length && !styles.includes(lock.style) && styles.some((x) => !lockAllows(lock, x)) ? styles.filter((x) => !lockAllows(lock, x)) : null;
  const rel = (f) => slash(f).replace(slash(out) + '/', '');
  const manFile = path.join(out, '.taste-skill', 'recipe-assets.json');
  const fetchCmdLine = (ids, heroId) => `node ${cmdPath(path.join(HERE, 'photos.mjs'))} fetch ${ids.join(',')}${heroId ? ' --hero ' + heroId : ''} --out ${out === '.' ? '.' : cmdPath(out)}`;
  const isHeroSlot = (p) => p.kind === 'photo' && /^(hero|bg|background|backdrop|full-?bleed|scene)$/i.test(p.slot);

  if (opt('json') && (dry || !key)) { console.log(JSON.stringify({ recipe: recipe.id, filled: ctx, how: B.how, palette: pal, clash, plans: plans.map(({ style, ...p }) => ({ ...p, style: style.id })), optional: later.map((p) => p.slot), cannot }, null, 1)); return; }
  console.log(`recipe ${recipe.id}${recipe.name ? ' (' + recipe.name + ')' : ''}: ${plans.length} slot${plans.length === 1 ? '' : 's'} to generate${later.length ? ', ' + later.length + ' optional left out (--with-optional)' : ''}${cannot.length ? ', ' + cannot.length + ' not made here' : ''}`);
  console.log(`  product   ${ctx.product}   [${B.how.product}]`);
  console.log(`  audience  ${ctx.audience}   [${B.how.audience}]`);
  console.log(`  world     ${ctx.world}   [${B.how.world}]`);
  console.log(`  palette   ${pal.phrase}   [${pal.from}]`);
  if (/\(/.test(ctx.product) && B.how.product !== '--product') console.log(`  (an image model may draw a brand name as a word or as the thing it means: --product "<what it is>" when the prompts read wrong)`);
  if (missing.size) console.log(`  no value for ${[...missing].map((k) => '{' + k + '}').join(', ')}: left out of the prompts`);
  console.log(`  style     ${styles.join(' + ') || '(none)'}${lock ? `   [the page's style: ${lock.style}, ${slash(lockFile(out))}]` : '   [one style a page: recorded on the first picture]'}`);
  for (const p of plans) {
    if (p.style.preset && !p.style.kinds.includes(p.kind)) console.log(`  note: ${p.style.id} is not made for a ${p.kind} (its kinds: ${p.style.kinds.join(', ')})`);
    if (p.styleWord && !p.style.preset) console.log(`  note: "${p.styleWord}" is no preset: used as free words (photos.mjs styles lists the presets)`);
    if (p.asked > p.count) console.log(`  note: ${p.slot} asks for ${p.asked}: ${p.count} at most a slot`);
  }
  if (clash) console.log('\n' + styleClashText(lock, clash, out) + (force ? '\n  --force-style: ' + styles[0] + ' becomes the page\'s style' : '\n  pass --force-style to make ' + styles[0] + ' the page\'s style; nothing is generated without it'));
  const show = (p, calls) => {
    console.log(`\n${p.slot}  ${p.kind} · ${p.style.id} · ${p.ratio} -> ${p.size}${GEN_RATIO[p.ratio] && GEN_RATIO[p.ratio][1] ? ' (else ' + GEN_RATIO[p.ratio][1] + ', cropped in CSS)' : ''}${p.transparent ? ' · transparent' : ''} · ${p.count} picture${p.count === 1 ? '' : 's'}${p.optional ? ' · optional' : ''}`);
    p.prompts.forEach((q, k) => {
      console.log(`  ${p.count > 1 ? (k + 1) + '. ' : ''}${q.prompt}`);
      if (calls) console.log(`  call: POST ${endpointText()} ${JSON.stringify(genBody(p.size, { transparent: p.transparent }))}${p.transparent ? ' (refused: once more on flat mid-grey as PNG, and a cut-out step)' : ''}`);
    });
  };
  plans.forEach((p) => show(p, dry));
  if (later.length) { console.log('\noptional, left out (--with-optional, or --only <slot>):'); later.forEach((p) => console.log(`  ${p.slot}  ${p.kind} · ${p.style.id} · ${p.ratio}: ${p.base}`)); }
  if (cannot.length) {
    console.log('\nnot made here:');
    for (const c of cannot) {
      const still = `node ${cmdPath(path.join(HERE, 'photos.mjs'))} generate --kind render${c.style ? ' --style "' + String(c.style).replace(/"/g, '') + '"' : ''} --ratio ${sizeForRatio(c.ratio) ? c.ratio : '16:9'} --prompt "${c.base.replace(/"/g, '\'')}" --out ${out === '.' ? '.' : cmdPath(out)}`;
      if (c.kind === 'video') console.log(`  ${c.slot} (video): gpt-image makes stills, not video; the client's own footage or a video model outside this skill makes it. The recipe's fallback: ${c.fallback || 'a still render of the same subject'}. The still:\n    ${still}`);
      else if (c.kind === 'model3d') console.log(`  ${c.slot} (model3d): a 3D model is not generated here. The recipe's fallback: ${c.fallback || 'the procedural geometry the recipe builds in code (three.js or CSS 3D)'}; or a still render:\n    ${still}`);
      else console.log(`  ${c.slot}: kind "${c.kind}" is none of ${[...GEN_KINDS, 'video', 'model3d'].join(', ')}; nothing made`);
    }
  }
  const manifest = (slotsOut, extra = {}) => {
    let man = {};
    try { man = JSON.parse(fs.readFileSync(manFile, 'utf8')); } catch { /* new */ }
    const keep = man && man.recipe === recipe.id && man.slots ? man.slots : {};
    const all = { ...keep, ...slotsOut };
    const ids = Object.values(all).flatMap((x) => x.ids || []);
    const hero = Object.entries(all).find(([k, v]) => v.kind === 'photo' && /^(hero|bg|background|backdrop|full-?bleed|scene)$/i.test(k) && (v.ids || []).length);
    const m = { about: 'The pictures of a hero recipe (photos.mjs recipe-assets): slot -> generated ids and files under .taste-skill/generated; fetch copies them into assets/img.',
      recipe: recipe.id, index: slash(indexFile), brief: typeof opt('brief') === 'string' ? opt('brief') : '', filled: { product: ctx.product, audience: ctx.audience, world: ctx.world }, how: B.how,
      palette: pal, style: styles[0] || (lock ? lock.style : ''), model: genModel(), quality: genQuality(), at: new Date().toISOString(), ...extra, slots: all,
      fetch: ids.length ? fetchCmdLine(ids, hero ? hero[1].ids[0] : '') : '' };
    fs.mkdirSync(path.dirname(manFile), { recursive: true });
    fs.writeFileSync(manFile, JSON.stringify(m, null, 1) + '\n');
    return m;
  };
  const slotRow = (p, x) => ({ kind: p.kind, style: p.style.id, ratio: p.ratio, size: p.size, transparent: p.transparent, count: p.count, optional: p.optional, prompts: p.prompts.map((q) => q.prompt), ...x });
  const cannotRows = Object.fromEntries(cannot.map((c) => [c.slot, { kind: c.kind, status: 'not made here', prompt: c.base, fallback: c.fallback || (c.kind === 'video' ? 'a still render of the same subject' : c.kind === 'model3d' ? 'the procedural geometry the recipe builds in code' : '') }]));

  if (dry) { console.log('\ndry run: nothing generated, nothing written' + (key ? '' : ' (and no OPENAI_API_KEY in the environment yet)')); return; }
  if (clash && !force) process.exit(1);
  if (!plans.length) { console.log('\nnothing to generate' + (cannot.length ? ': every slot left is one this script cannot make' : '')); return; }
  if (!key) {
    console.log('\n' + OPENAI_HINT);
    const rows = Object.fromEntries(plans.map((p) => [p.slot, slotRow(p, { status: 'not generated', ids: [], files: [], want: Array.from({ length: p.count }, (_, k) => `assets/img/${recipe.id}-${p.slot}-${k + 1}.${p.transparent ? 'png' : 'webp'}`) })]));
    manifest({ ...rows, ...cannotRows });
    console.log(`not generated: no OPENAI_API_KEY. The prompts above are in ${slash(manFile)}: make them by hand or with another tool and save each as its "want" file (a cut-out with its alpha), or set the key and run this again`);
    return;
  }
  console.log(`\nOpenAI ${genModel()} at quality ${genQuality()}:`);
  const rows = {}, made = [], failed = [];
  for (const p of plans) {
    const r = await generatePictures({ out, prompts: p.prompts, size: p.size, subject: p.kind, tail: '', transparent: p.transparent, style: p.style, kind: p.kind, aspect: p.ratio, slot: p.slot, recipe: recipe.id });
    made.push(...r.made); failed.push(...r.failed);
    rows[p.slot] = slotRow(p, { status: r.made.length === p.count ? 'generated' : r.made.length ? 'partly generated' : 'failed', ids: r.made.map((m) => m.id), files: r.made.map((m) => rel(path.join(genDir(out), m.file))),
      ...(p.transparent ? { cutout: Object.fromEntries(r.made.map((m) => [m.id, m.cutout])) } : {}), ...(r.failed.length ? { failed: r.failed } : {}) });
    if (r.failed.some((f) => /refused|quota|rate limit/.test(f))) break;
  }
  if (made.length) writeLock(out, nextLock(lock, plans[0].style, { palette: pal, ids: made.map((m) => m.id), by: 'recipe-assets', recipe: recipe.id, allowed: styles, force: !!clash }));
  const m = manifest({ ...rows, ...cannotRows });
  if (opt('json')) { console.log(JSON.stringify(m, null, 1)); if (!made.length) process.exitCode = 1; return; }
  console.log('\nslots:');
  for (const [slot, x] of Object.entries(rows)) console.log(`  ${slot.padEnd(14)} ${x.status.padEnd(16)} ${(x.ids || []).join(', ')}${x.cutout && Object.values(x.cutout).includes('needed') ? '  (cut-out needed)' : ''}`);
  const need = made.filter((x) => x.cutout === 'needed');
  if (need.length) console.log('\n' + cutoutAdvice(need, out));
  if (failed.length) console.log('\nnot generated: ' + failed.join('; '));
  console.log(`\n${slash(manFile)}`);
  if (made.length) {
    const heroP = plans.find((p) => isHeroSlot(p) && rows[p.slot] && rows[p.slot].ids.length);
    console.log(`look at each picture full size (${slash(genDir(out))}/), then copy them into assets/img (WebP; a cut-out keeps its alpha):\n  ${fetchCmdLine(made.map((x) => x.id), heroP ? rows[heroP.slot].ids[0] : '')}\n(a generated picture needs no credit line; name each in the build report as generated, with its model)`);
  }
  if (!made.length || failed.length) process.exitCode = 1;
}

// a Pexels API call: the key goes in the Authorization header and nowhere else; an error names the status, never the request
async function pexelsGet(route, params) {
  const key = pexelsKey();
  if (!key) throw new Error('no PEXELS_API_KEY');
  const u = PEXELS_API + route + (params ? '?' + new URLSearchParams(params) : '');
  let err = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    let r;
    try { r = await fetch(u, { headers: { Authorization: key, 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) }); } catch (e) { err = String(e && e.name === 'TimeoutError' ? 'timed out' : 'no answer'); await sleep(1500 * (attempt + 1)); continue; }
    if (r.ok) { try { return await r.json(); } catch { err = 'an answer that is not JSON'; await sleep(1500); continue; } }
    if (r.status === 401 || r.status === 403) throw new Error(`Pexels refused the key (HTTP ${r.status}): check PEXELS_API_KEY (the key itself is never printed)`);
    if (r.status === 404) throw new Error('not on Pexels (HTTP 404)');
    if (r.status === 429) { const reset = +(r.headers.get('x-ratelimit-reset') || 0); throw new Error('Pexels rate limit reached (200 requests an hour, 20,000 a month by default)' + (reset ? ', it resets ' + new Date(reset * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '')); }
    err = 'HTTP ' + r.status;
    if (r.status >= 500) { await sleep(2000 * 2 ** attempt); continue; }
    break;
  }
  throw new Error('Pexels: ' + (err || 'no answer'));
}
// a Pexels photograph as a found.json entry: its own sizes (medium, large, large2x), credit and page; no hotlinking, fetch downloads it
function pexelsEntry(ph, { query = '', panel = false, set = '' } = {}) {
  const src = {};
  for (const k of ['medium', 'large', 'large2x']) if (ph.src && PEXELS_HOST.test(String(ph.src[k] || ''))) src[k] = String(ph.src[k]);
  const width = +ph.width || 0, height = +ph.height || 0;
  const ratio = width && height ? Math.round((width / height) * 100) / 100 : 1.5;
  const orientation = ratio >= 1.05 ? 'landscape' : ratio <= 0.95 ? 'portrait' : 'square';
  const page = /^https:\/\/www\.pexels\.com\//.test(String(ph.url || '')) ? String(ph.url) : `https://www.pexels.com/photo/${ph.id}/`;
  const byUrl = /^https:\/\/www\.pexels\.com\//.test(String(ph.photographer_url || '')) ? String(ph.photographer_url) : '';
  return { id: 'p' + ph.id, source: 'pexels', src, width, height, ratio, orientation, by: String(ph.photographer || 'Unknown photographer'), byUrl,
    licence: 'Pexels License', licenceUrl: 'https://www.pexels.com/license/', page, alt: String(ph.alt || query || 'Photograph').slice(0, 160),
    ...(/^#[0-9a-f]{6}$/i.test(String(ph.avg_color || '')) ? { avg: String(ph.avg_color) } : {}),
    subject: panel ? 'panel' : (typeof opt('subject') === 'string' ? opt('subject') : 'stand-in'), tone: 'mid', calm: 'none',
    ...(panel ? { panel: true, ...(set ? { set } : {}) } : { standIn: true }), query, at: new Date().toISOString() };
}
async function pexelsSearch(queries, { per, min, orient, color, size, panel, set, recent }) {
  const results = [], failed = [], seen = new Set();
  for (const [qi, q] of queries.entries()) {
    const params = { query: q, per_page: String(Math.min(40, Math.max(per * 2, 8))), page: '1' };
    if (orient && orient !== true) params.orientation = String(orient);
    if (color && color !== true) params.color = String(color);
    if (size && size !== true) params.size = String(size);
    let data;
    try { data = await pexelsGet('search', params); } catch (e) { failed.push(`"${q}": ${e.message}`); if (/refused the key|rate limit/.test(e.message)) break; continue; }
    const mine = [];
    for (const ph of data.photos || []) {
      const p = pexelsEntry(ph, { query: q, panel, set });
      if (seen.has(p.id) || !p.src.large2x || p.width < min) continue;
      seen.add(p.id);
      mine.push(p);
    }
    // fresh first: a file another build fetched lately goes behind the others of its query
    mine.sort((a, b) => (recent.has(a.id) ? 1 : 0) - (recent.has(b.id) ? 1 : 0));
    results.push(...mine.slice(0, per));
    if (qi < queries.length - 1) await sleep(250);
  }
  return { results, failed };
}

// ------------------------------------------------------------------ panel photo sets (assets/ui/panel-photos.json)
const PANEL_FILE = path.join(HERE, '..', 'assets', 'ui', 'panel-photos.json');
let panelData = null;
function panelSets() {
  if (!panelData) { try { panelData = JSON.parse(fs.readFileSync(PANEL_FILE, 'utf8')); } catch (e) { die('cannot read ' + slash(PANEL_FILE) + ': ' + e.message); } }
  return panelData;
}
// the host attributes of a set's look (cards.css reads them): the same on every panel of the page, or once on <html>
function panelLook(set) {
  const s = set || { tone: 'ground', k: { light: 30, dark: 18 }, focus: 'center', grain: false };
  const tone = typeof s.tone === 'string' ? s.tone : 'ground', focus = s.focus || 'center';
  const k = (s.k && s.k.light) ?? 30, kd = (s.k && s.k.dark) ?? 18;
  return `data-panel-photo data-panel-tone="${tone}" data-panel-focus="${focus}"${s.grain ? ' data-panel-grain' : ''} style="--pp-k: ${k}%; --pp-k-dark: ${kd}%"`;
}
const setKey = (s) => String(s || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
function findSet(word) {
  const D = panelSets(), k = setKey(word);
  return D.sets.find((s) => s.id === k || setKey(s.name) === k) || D.sets.find((s) => s.id.startsWith(k) || setKey(s.name).includes(k)) || null;
}

// ------------------------------------------------------------------ a physical product without photographs
const PRODUCT = 'A physical product without photographs of its own is dealt no library frame: the library holds other places\' details, never a product. '
  + 'The product is still shown, never hidden, and by photographs (references/photos.md, A product without photographs; references/sections.md, Product), in this order: '
  + '(1) the client\'s own photographs, or a picture the brief supplies (a cut-out, a CAD view, its own render); '
  + '(2) until they exist, stand-ins found with photos.mjs search: the same kind of thing whole (a cargo bike for a cargo bike, never a wheel for a bicycle), '
  + 'in use where it lives, close-ups of the parts the page names, one light and grade across the set, no maker\'s name, logo or face readable; '
  + 'every one listed in the build report as a stand-in with the client\'s photograph to shoot in its place, nothing on the page saying so; '
  + '(3) a render from assets/objects/product-render (effects-objects.md, Product renders) only when the brief asks for 3D or a render (deal.mjs --has object). '
  + 'The page is the full product page (the product, what it carries, how it is used, specs as rows, a live order card), never the short page. '
  + 'Never a drawn SVG or a drawing of the product (PH-07), never mood stock (a forest for "the ride", groceries for "what it carries"), never an object of another kind. '
  + 'The report also lists the photographs to shoot (the product on one plain backdrop, three angles, a detail of each part, the product in use). '
  + 'A shop, workshop or rental that sells or fixes every make is a place: pick --trade bike --shop.';
// what to search for a product: its own word, whole and close (add the place it lives in plain words: "cargo bicycle street")
const productSearches = (word) => { const w = String(word || '<the product>').replace(/\b(brand|maker|company|startup|label|manufacturer)s?\b/gi, '').replace(/\s+/g, ' ').trim() || '<the product>'; return [w, `${w} detail`]; };
function refuse(trade, why) {
  const qs = productSearches(trade);
  const next = qs.map((q) => `node ${cmdPath(path.join(HERE, 'photos.mjs'))} search "${q}" --out .`);
  if (opt('json')) console.log(JSON.stringify({ trade: trade || null, refused: true, why, ids: [], photos: [], next: PRODUCT, search: next }, null, 1));
  else console.log(`NO LIBRARY FRAMES (${why}).\n\n${PRODUCT}\n\nthe search for stand-ins (look at each result full size; list every one you use in the report):\n${next.map((x) => '  ' + x).join('\n')}`);
  process.exit(0);
}

// ------------------------------------------------------------------ recent photographs, across builds
// the frames every build that shares one file was dealt or fetched (shared with start.mjs, which keeps its palettes
// there): a page in a new folder starts with an empty --history, so without it two builds of one trade show the same
// frames. Opt-in: only a path set in TASTE_SKILL_RECENT is read or written; by default nothing leaves the project.
const RECENT_FILE = process.env.TASTE_SKILL_RECENT || null;
function readRecent() {
  if (!RECENT_FILE || opt('no-recent')) return null;
  try { const r = JSON.parse(fs.readFileSync(RECENT_FILE, 'utf8')); return r && typeof r === 'object' && !Array.isArray(r) ? r : {}; } catch { return {}; }
}
function writeRecent(r) {
  if (!r) return;
  try { fs.mkdirSync(path.dirname(RECENT_FILE), { recursive: true }); fs.writeFileSync(RECENT_FILE, JSON.stringify(r, null, 1) + '\n'); } catch { /* optional: never stop a deal over it */ }
}
// how lately and how often another build used each frame: the last 6 deals of this trade (the last one counts 6, the
// oldest 1) and the last 60 frames fetched anywhere (1 each); a frame with no score is fresh
function recentIds(r, trade) {
  const m = new Map();
  if (!r) return m;
  const deals = Array.isArray(r.photos) ? r.photos.filter((d) => d && (!trade || d.trade === trade)).slice(-6) : [];
  deals.forEach((d, i) => { for (const id of d.ids || []) m.set(id, (m.get(id) || 0) + i + 1); });
  for (const id of Array.isArray(r.fetched) ? r.fetched.slice(-60) : []) m.set(id, (m.get(id) || 0) + 1);
  return m;
}

// ------------------------------------------------------------------ live search words, for what the library lacks
// (references/photos.md, Live search). A trade word in --trade, or the first rule its word matches
const TERMS = [
  [/yoga|pilates|wellness|\bspa\b|sauna|massage|retreat/i, ['yoga studio', 'yoga class', 'pilates studio', 'sauna interior']],
  [/potter|ceramic|clay/i, ['pottery wheel', 'pottery studio', 'ceramics workshop']],
  [/studio|atelier/i, ['artist studio', 'design studio', 'photography studio']],
  [/bike|bicycle|cycl/i, ['bicycle workshop', 'bicycle repair stand', 'bicycle mechanic', 'city bicycle', 'cargo bicycle']],
  [/hotel|guest ?house|\binn\b|lodge|b&b|bed and breakfast|hostel|cabin/i, ['hotel facade', 'guesthouse', 'hotel room', 'hotel bedroom', 'inn exterior']],
  [/wedding|bridal|elope/i, ['wedding ceremony', 'wedding table', 'wedding bouquet', 'wedding reception', 'wedding rings']],
  [/restaurant|bistro|brasserie|trattoria|kitchen|chef/i, ['restaurant kitchen', 'restaurant interior', 'chef plating']],
  [/workshop|smith|forge|joiner|carpent|wood ?work|letterpress|weav/i, ['woodworking workshop', 'blacksmith forge', 'workshop tools']],
  [/salon|barber|hair/i, ['barber shop', 'hair salon']],
  [/bak(?:e|er|ery)|bread|patisserie/i, ['bakery bread', 'bakery counter', 'baker dough', 'bread oven']],
  [/caf[eé]|coffee|espresso|roast/i, ['coffee shop interior', 'espresso machine', 'coffee roaster', 'cafe interior']],
  [/florist|flower|bouquet/i, ['florist shop', 'flower bouquet', 'flower market']],
];
const termsFor = (word) => { const hit = TERMS.find(([re]) => re.test(String(word || ''))); return hit ? hit[1] : []; };

// a brief's word for its trade
// no trade: a business whose subject the library cannot show without passing another's work as its own
const NONE = /ceramic|potter|restaurant|bistro|brasserie|trattoria|pizzeria|sushi|patisserie|jewel|(?:gold|silver|lock|word|copper|tin|white|gun)smith|tattoo|salon|barber|hairdress|nail|tailor|gallery|museum|gym\b|fitness|dentist|\bvet\b/i;
// a thing that is made and sold: its own photographs or its object, never stock (a shop, rental or repair of every make is a place)
const OBJECT = /maker|manufactur|device|hardware|gadget|furniture|appliance|scooter|e-?bike|skateboard|sneaker|shoe|boots?\b|backpack|\bbags?\b|luggage|chair|sofa|\btables?\b|lamp|lighting|headphone|speaker|watch|eyewear|glasses|bottle|apparel|clothing|garment|cosmetic|skincare|candle|\btoys?\b|instrument|guitar|camera|drone|kettle|knife|knives|cookware|tableware|\bmugs?\b|helmet|snowboard|surfboard|\bkit\b/i;
const PLACE_WORD = /shop|store|rental|hire|repair|boutique/i;
const ALIAS = [
  [/bakery|bakehouse|boulangerie|\bbaker\b|sourdough|\bbread\b/i, 'bakery'], [/florist|flower ?(?:shop|stall)|bouquet/i, 'florist'],
  [/caf[eé]|coffee|espresso|roast/i, 'cafe'], [/guest ?house|hotel|inn\b|lodge|hostel|cabin|b&b|bed and breakfast|holiday (?:home|rooms?)|stay/i, 'hotel'],
  [/bike|bicycle|cycl/i, 'bike'], [/\bblacksmith|\bsmith(?:y|ing|s)?\b|forge|farrier|joiner|carpent|wood ?work|cabinet ?maker|weav|\bloom\b|letterpress|printing press|luthier|workshop/i, 'workshop'], [/\bspa\b|sauna|yoga|pilates|wellness|clinic|massage|retreat/i, 'wellness'], [/\bdeli\b|farm ?shop|food|grocer|market/i, 'food'], [/studio|agency|architect|design/i, 'studio'],
  [/office|cowork|firm|practice|consult/i, 'office'], [/book|publish|\bstationer|\bwrit(?:er|ing)\b|bindery|binderies/i, 'books'], [/shop|store|boutique|gift|homeware/i, 'shop'],
  [/tour|guide|outdoor|hike|camp|travel/i, 'outdoors'],
  [/farm|garden|nursery|grow/i, 'farm'], [/wine|vineyard|winery/i, 'wine'], [/bar\b|taproom|brew|pub|cocktail/i, 'bar'],
];
const NO_TRADE = (word) => `no trade for "${word}": the library holds ${Object.keys(lib.trades).join(', ')}, and none shows this business without passing another's work, room or goods as its own. Use the client's own photographs; until they exist, stand-ins from a live search (photos.mjs search${termsFor(word).length ? ` --trade "${word}"` : ' "<its subject>"'}), each listed in the report, else type and its real UI. A physical product: pick --product-without-photos (stand-ins of the same kind of thing; never a drawing).`;
function tradeOf(word) {
  if (!word || word === true) die('name a trade: --trade ' + Object.keys(lib.trades).join('|') + ' (a physical product without photographs: --product-without-photos)');
  if (lib.trades[word]) return word;
  if (NONE.test(word)) die(NO_TRADE(word));
  if (OBJECT.test(word) && !PLACE_WORD.test(word)) return '__product';
  const hit = ALIAS.find(([re]) => re.test(word));
  if (hit) return hit[1];
  // a brand, a company or a label with no place word sells a thing
  if (/brand|company|label|startup|\bco\b|goods|product/i.test(word)) return '__product';
  die(NO_TRADE(word));
}

const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const NORTH = /iceland|norw|fjord|faroe|lofoten|svalbard|greenland|lapland|arctic|nordic|scandinav|finland|sweden|shetland|orkney|hebrides|alaska|yukon/;
// trades whose pages have slots for the client's own rooms, products or dishes: a mood-only picture never goes there
const SLOTTED = new Set(['cafe', 'hotel', 'bike', 'food', 'shop', 'farm', 'wine', 'bar', 'bakery', 'florist', 'workshop']);
// the craft a workshop brief names: a smith's page is only ever dealt a smithy, a weaver's a loom
const CRAFTS = [['smith', /\bblacksmith|\bsmith(?:y|ing|s)?\b|forge|farrier|metal ?work|iron ?work/i], ['weaving', /weav|\bloom\b|textile|tapestry|yarn/i], ['printing', /letterpress|printing press|printer|type ?setting|typograph/i],
  ['wood', /wood|joiner|carpent|cabinet|timber/i], ['instrument', /luthier|violin|guitar maker|lutherie/i], ['bookbinding', /bookbind|bindery|binderies/i]];
const craftOf = (word) => CRAFTS.filter(([, re]) => re.test(String(word))).map(([c]) => c);
// a frame tagged with a craft is another business's work unless the brief names that craft: a bookbinder's hands go to a bindery only, a smith's to a smithy only
const craftFits = (p, trade, names) => trade === 'workshop' ? names.includes(p.craft) : (!p.craft || names.includes(p.craft));
// a library frame shows a detail or a process, never a lead, a place, a street, a room or a whole product (references/photos.md, --detail-only)
// (desk: a pencil on a notebook, a binding, card and paper close up; breakfast: bread and butter, a jug and a bowl, a hotel's only)
const DETAIL_SUBJECTS = new Set(['hands', 'detail', 'part', 'load', 'oven', 'dough', 'roast', 'bar', 'plant', 'texture', 'food', 'desk', 'breakfast']);
// loaves on a shelf are a bakery's product, not a detail of its making: the oven and the dough are; a plate of breakfast is a guesthouse's, never a deli's menu
const isDetailIn = (p, trade) => DETAIL_SUBJECTS.has(p.subject) && !(trade === 'bakery' && p.subject === 'food') && !(p.subject === 'breakfast' && trade !== 'hotel');
const PD = (p) => /public domain/i.test(p.licence || '');

function credit(p) {
  return p.source === 'commons' ? `Photo by ${p.by}, ${p.licence}, via Wikimedia Commons (${p.page})` : `Photo by ${p.by} on Unsplash (${p.page})`;
}
const PLACE = {
  lead: 'hero: full-bleed, or the large first picture beside the headline, plain (no print, grade or reveal over it); text only on its calm side',
  bar: 'the bar or the making: beside what is made there and when; a tall one beside the menu',
  roast: 'the roastery or the beans: beside the roast days, origins or bag prices',
  drink: 'the menu or the visit: beside the list or the address it shows, never one per menu line',
  breakfast: 'breakfast: beside its hours and what is served; never captioned as a named dish',
  food: 'beside the produce or supplier it stands for; a dish on the menu stays type or the client\'s own photograph',
  hands: 'the making: beside how it is made, or a half-width picture in a split',
  detail: 'the rooms: one detail beside each room\'s facts (the linen, the chair, the lamp), never called the room itself',
  desk: 'beside the line about the work it shows',
  street: 'a band or the visit section: the town and the weather, never captioned as the client\'s street',
  road: 'a full-width band, or the getting-there section',
  landscape: 'a full-width band, or the place section beside its facts (distance, season)',
  sky: 'a quiet band or the closing call to action; text may sit on its calm side',
  building: 'a split beside the text, or a full-width band',
  texture: 'a quiet ground for a card or band; no other effect on top',
  plant: 'a split or a detail in a row',
  bike: 'the shop\'s range or service: a bicycle of another make, never the client\'s own model',
  part: 'the workshop or service row: beside the repair it shows',
  load: 'beside what the bike carries',
  oven: 'the process of baking: beside the bake times or the bread it makes; another oven, never called the client\'s own',
  dough: 'the making: beside how the dough is made and rested; never called the client\'s own bake room',
};
// a place page (every SLOTTED trade) has no photo band, no tab and no text on a photograph: the hero is Recipe 3 (a full-bleed
// top photograph with nothing on it, the words under it on the ground), a closing is the 1:1 shopfront without words, a menu is plain text
const PLACE_PAGE = {
  lead: 'stand-in for the hero only (a place page, or --draft-lead): Recipe 3, the full-bleed top photograph with nothing on it, replaced by the client\'s own before the page ships',
  road: 'stand-in for the client\'s own land photograph (the brief\'s region, or --own-land): in its place section beside the facts (distance, season), never a band',
  landscape: 'stand-in for the client\'s own land photograph (the brief\'s region, or --own-land): in its place section beside the facts (distance, season), never a band',
  sky: 'never dealt to a place page',
  building: 'beside the text in the place section, one picture; never a band',
  street: 'never dealt to a place page: the street is the client\'s own photograph',
  drink: 'beside the menu, which is plain text on the page: one 4:5 picture of the kind, never one per line, never a tab',
  hands: 'the making: beside how it is made, text left and the picture right',
  desk: 'beside the line about the work it shows',
  texture: 'a quiet detail in a row or beside a card; never a band or a ground for words',
};
const WORDS_PLACE = 'under it on the ground (Recipe 3: the words sit below or beside the photograph, never over it)';
// where the words go, from the photograph's calm side (product, service and software pages only): photo-band sets them lower
// left (or centre left with --left), so a photograph calm only at the top or right takes its words beside it or above it, never over it
const WORDS = {
  bottom: 'over it, lower left: photo-band (or hero-photo)',
  left: 'over it, centre left: photo-band photo-band--left',
  all: 'over it: photo-band, --light for a bright photograph',
  top: 'above it on the page ground (hero-editorial, a heading over a wide frame) or beside it in a split; never over it in a photo-band',
  right: 'beside it in a split, the photograph on the right; never over it',
  'top right': 'above it on the page ground or beside it in a split; never over it',
  centre: 'beside it in a split; never over it',
  none: 'beside it in a split or a frame of its own; never over it',
};
// a section's words -> the subjects that show it, best first (the first rule whose subjects the trade holds wins);
// the third item prefers photographs whose description matches it; a string instead of subjects: the section is
// dealt nothing, and why
const SECTIONS = [
  [/^(hero|lead|top|intro|header|first)$/, 'lead'],
  [/menu|prices?|pastr|cake|dish|lunch|dinner/, 'a menu is the list in type (or the client\'s own photograph of its dishes)'],
  [/\bclos(?:e|ing)\b|\bcta\b|\bbook(?:ing|ings)?\b|reserv|contact|newsletter|signup|footer|\bend\b/, 'a closing, contact or booking section is the client\'s own: its shopfront or room from the door, never a library frame, sky or land'],
  [/visit|terrace|\bfind\b|hours|location|address|street|town|\bmap\b|direction/, 'the visit is the client\'s own shopfront and street: the library holds other towns\' streets, so it is dealt nothing'],
  [/dough|prov(?:e|ing)|\brise|rising|flour/, ['dough', 'oven']],
  [/oven|bak(?:e|ing|ery)|fire/, ['oven', 'food', 'dough']],
  [/bread|loaf|loaves|shelf|shelves/, ['food', 'oven', 'dough']],
  [/workshop|forge|smith|bench|craft|tools?|materials?|loom|weav|letterpress|joiner|carpent/, ['hands', 'detail']],
  [/bouquet|arrang|stems?|wrap|bucket|buds?|bloom/, ['hands', 'plant']],
  [/roast|bean|green|origin|sourc|bags?$|retail|subscri|wholesale|^shop$/, ['roast']],
  [/^bar$|\bbar\b|counter|espresso|barista|machine|team|staff|people|service/, ['bar', 'hands']],
  [/\bhands?\b|writing|notebook|paper|pencil|binding|stationery|journal/, ['hands', 'desk', 'detail']],
  [/brew|pour|filter|making|craft|how|process/, ['hands', 'bar']],
  [/coffee|drink|cup|order/, ['drink', 'bar', 'roast']],
  [/breakfast|morning|kitchen|dining|eat|food|meal/, ['breakfast', 'food']],
  [/room|bed|stay|sleep|suite|cabin|house|apartment/, ['detail'], /linen|pillow|bed|blanket|cushion|lamp|chair|teapot/],
  [/area|around|landscape|place|walk|hike|nature|view|surround|getting|journey|arriv|season|weather|coast|fjord|mountain|lake|land/, ['landscape', 'road']],
  [/workshop|repair|parts?|servic/, ['part']],
  [/load|carry|cargo|basket|deliver/, ['load']],
  [/range|bikes?|fleet|rental|models?/, ['bike']],
  [/studio|work|desk|office|projects?/, ['desk', 'building', 'detail', 'texture']],
  [/detail|texture|surface|linen|fabric|material/, ['detail', 'texture', 'desk']],
  [/produce|garden|field|harvest|grow|flowers?/, ['food', 'plant', 'landscape']],
];
// a mood-only photograph (its file names a business, or it is another's identifiable room) goes only into a section asking for mood
const MOOD_SECTION = /mood|atmos|ambien|interior|inside/;
SECTIONS.push([MOOD_SECTION, ['detail', 'texture', 'building'], undefined, true]);

// ------------------------------------------------------------------ seeded random
function rngFrom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ------------------------------------------------------------------ history
function readHistory(file) {
  if (!file || file === true) return { data: {}, deals: [] };
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* new file */ }
  if (Array.isArray(data) || typeof data !== 'object' || !data) die(`${file} is not a history object`);
  return { data, deals: Array.isArray(data.photos) ? data.photos : [] };
}
function writeHistory(file, hist, deal) {
  if (!file || file === true) return;
  hist.data.photos = [...hist.deals, deal].slice(-40);
  // the file is shared with start.mjs, which reads palettes and types without a default
  for (const k of ['palettes', 'types']) if (!Array.isArray(hist.data[k])) hist.data[k] = [];
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(hist.data, null, 1) + '\n');
}

// ------------------------------------------------------------------ pick
function pick() {
  if (opt('product-without-photos')) refuse(opt('trade') === true ? '' : opt('trade'), 'a physical product without photographs');
  const word = opt('trade');
  const trade = tradeOf(word);
  // a word that names a shop, rental or repair of every make (bike shop, e-bike rental) is --shop
  const shop = !!opt('shop') || (typeof word === 'string' && trade !== '__product' && PLACE_WORD.test(word)), mono = !!opt('mono');
  if (trade === '__product' && !shop) refuse(word, `"${word}" is a product`);
  if (trade === '__product') die('--shop needs the shop\'s trade, e.g. --trade bike --shop');
  const T = lib.trades[trade];
  if (T.shopOnly && !shop) refuse(typeof word === 'string' ? word : trade, `the ${trade} trade holds photographs only for a shop, workshop or rental of every make (--shop); a maker of its own ${trade} is a product without photographs`);
  const sectionsArg = opt('sections');
  const sections = sectionsArg && sectionsArg !== true ? String(sectionsArg).split(/[\s,]+/).filter(Boolean) : [];
  // PH-02: library frames are at most 1 in 3 of the page's pictures (--pictures is the page's whole count, 12 when not said)
  const pictures = Math.max(3, Math.min(60, parseInt(opt('pictures', 12), 10) || 12));
  // a draft (--draft-lead, or --no-client-photos: the brief supplies no photograph files) lifts the cap: every non-text section may get a frame
  const draftPath = !!opt('draft-lead') || !!opt('no-client-photos');
  const libCap = draftPath ? pictures : Math.max(1, Math.floor(pictures / 3));
  const countAsked = Math.min(libCap, sections.length || Math.max(1, Math.min(16, parseInt(opt('count', 6), 10) || 6)));
  const count = countAsked;
  const seed = opt('seed') && opt('seed') !== true ? String(opt('seed')) : Math.random().toString(36).slice(2, 8);
  const tone = opt('tone'); if (tone && !['light', 'dark'].includes(tone)) die('--tone light or dark');
  const place = opt('place') && opt('place') !== true ? norm(opt('place')) : '';
  // the client's own places, each by its most exact name: "Lofoten, Norway" is Lofoten; "Iceland; Norway; Faroe Islands" is three
  const explicitHeads = place.split(/[;|]/).map((x) => x.split(',')[0].trim()).filter((w) => w.length > 2);
  // the brief itself (--brief "text" or a file path, and the --trade words) names the client's region: a guesthouse "in the Westfjords of
  // Iceland" has --place "Westfjords" without anyone passing it. Only places the library knows are found, and where the brief names a place
  // and one inside it, the inner one counts (Westfjords, not Iceland); a region the library holds no frame of deals nothing (never another place's)
  const briefArg = opt('brief');
  let briefText = '';
  if (briefArg && briefArg !== true) { try { if (fs.existsSync(briefArg)) briefText = fs.readFileSync(briefArg, 'utf8'); } catch { /* it is text */ } if (!briefText) briefText = String(briefArg); }
  const regionWords = norm([briefText, typeof opt('trade') === 'string' ? opt('trade') : ''].join(' \n '));
  const briefHeads = (() => {
    if (!regionWords.trim()) return [];
    const found = new Set(), within = new Map();
    for (const q of lib.photos) if (q.where) {
      const w = q.where.map(norm);
      w.forEach((x, i) => {
        if (x.length > 3 && new RegExp('(?<![\\p{L}\\p{N}])' + escRe(x) + '(?![\\p{L}\\p{N}])', 'u').test(regionWords)) found.add(x);
        if (i) { if (!within.has(x)) within.set(x, new Set()); for (const y of w.slice(0, i)) within.get(x).add(y); }
      });
    }
    return [...found].filter((x) => ![...(within.get(x) || [])].some((y) => found.has(y)));
  })();
  const placeHeads = [...new Set([...explicitHeads, ...briefHeads])];
  const craftNames = craftOf(opt('trade'));
  // a place page (a cafe, a guesthouse, a shop: every SLOTTED trade) gets a lead photograph whenever any frame fits; a draft is not required
  const commonsOnly = !!opt('commons-only');
  // a trade that leads with land (a guesthouse, a lodge, a tour) whose brief or --place names its region deals that region's landscapes as its
  // own land without --own-land: only frames whose source names the region (a broader tag, or another place, is never dealt)
  const leadsWithLand = T.lead.some((x) => ['landscape', 'road', 'street', 'sky'].includes(x));
  const ownLandFlag = !!opt('own-land') || (leadsWithLand && placeHeads.length > 0);
  // a trade that leads with land (a lodge, a tour) and names its region leads with that landscape too, as a place page does
  const draftLead = draftPath || SLOTTED.has(trade) || (leadsWithLand && placeHeads.length > 0);
  const TERRAINS = ['coast', 'mountain', 'lake', 'river', 'forest', 'field', 'snow', 'desert'];
  const setting = opt('setting') && opt('setting') !== true ? String(opt('setting')).split(/[\s,]+/).filter(Boolean) : [];
  for (const s of setting) if (!TERRAINS.includes(s)) die(`--setting takes ${TERRAINS.join(', ')}`);
  const histFile = opt('history');
  const hist = readHistory(histFile);
  const mine = hist.deals.filter((d) => d.trade === trade);
  const rnd = rngFrom(`${seed}|${trade}|${mine.length}`);

  const north = NORTH.test(place);
  // whether --place names the place a photograph's source names: its most exact name is the client's place (2), or the client's
  // place is a broader one it lies in (1: --place Iceland, a Westfjords frame). A source that names only a broader place than the
  // client's (a country for a town) is 0, and so is a different place that merely starts with the same letters. Whole names only.
  const named = (p) => {
    if (!p.where || !placeHeads.length) return 0;
    const w = p.where.map(norm);
    if (placeHeads.includes(w[0])) return 2;
    return w.slice(1).some((x) => placeHeads.includes(x)) ? 1 : 0;
  };
  // --setting only narrows frames whose source names no place; a place the source names overrides it
  const fits = (p) => !setting.length || named(p) >= 1 || !p.terrain || p.terrain.every((t) => setting.includes(t));
  const settingNames = (p) => !!(setting.length && p.terrain && p.terrain.length && p.terrain.every((t) => setting.includes(t)));
  // the land around the client (a landscape, road, street or sky) is only ever its own (PH-03, PH-50): never dealt by default;
  // with --own-land (the brief says the client is that landscape) only frames whose source names the --place; never by --setting alone
  const LAND = new Set(['landscape', 'road', 'street', 'sky']);
  const landOK = (p) => LAND.has(p.subject) && ownLandFlag && named(p) >= 1;
  const isDetail = (p) => isDetailIn(p, trade);
  // a frame fills a slot as a detail or, with --own-land, as the client's own land; it leads only with --draft-lead
  const slotOK = (p) => isDetail(p) || landOK(p);
  // a frame the library did not mark as a lead still leads when its source names the client's region (a wide landscape rated 7 or more)
  const leadOK = (p) => draftLead && !p.moodOnly && !p.soft && (p.lead || (LAND.has(p.subject) && named(p) >= 1)) && p.quality >= 7 && T.lead.includes(p.subject) && p.orientation === 'landscape' && (!LAND.has(p.subject) || landOK(p));
  const notes = [];
  // eligible: rated 7 or more, no whole figure, not the trade's stock shot, of a subject the trade deals, whatever the place
  const eligible = (p) => p.trades.includes(trade) && !p.cliche && !p.weak && p.quality >= 7 && p.people !== 'figure'
    && (!T.only || T.only.includes(p.subject) || (p.craft && craftNames.includes(p.craft))) && (mono || !p.mono) && !(T.day && p.night)
    && !(p.warm && north) && (shop || !p.shows) && !(p.moodOnly && SLOTTED.has(trade))
    && !(p.house && trade === 'hotel') && (p.files || p.url) && (!commonsOnly || p.source === 'commons')
    && craftFits(p, trade, craftNames);
  const eligibleAll = lib.photos.filter(eligible);
  const base = eligibleAll.filter((p) => (!p.where || named(p) >= 1) && fits(p) && (slotOK(p) || leadOK(p)));
  // a photograph that reads as one kind of place (needsSetting) is dealt only when --setting names all its terrain (land: its named place decides)
  let pool = base.filter((p) => (LAND.has(p.subject) ? landOK(p) : !p.needsSetting || settingNames(p)));
  const landHeld = eligibleAll.some((p) => LAND.has(p.subject));
  const ownHeld = pool.some((p) => LAND.has(p.subject));
  if (landHeld && !ownHeld) {
    if (!ownLandFlag) notes.push(`no land is dealt: scenery is only the client's own landscape (PH-03, PH-50), so the ${trade} trade's land, road, street and sky stay the client's own photographs, unless the brief names the client's region: pass --brief BRIEF.md (or --place "Lofoten, Norway") and the frames whose source names that region are dealt (list --places shows the names the library knows)`);
    else if (!placeHeads.length) notes.push('--own-land needs --place or a --brief that names the region: the land is only ever the client\'s own place (list --places shows the names the library knows)');
    else notes.push(`the library holds no photograph of ${opt('place')} for ${trade} with these options: the land sections stay empty (never another place's coast, fog or sky); give them the client's own photographs, or open on type or the rooms; search the open collections for the place itself (CC0, CC BY, CC BY-SA, looked at full size)`);
  }
  const untoned = pool;
  if (tone) {
    const toned = pool.filter((p) => p.tone === tone || p.tone === 'mid');
    if (toned.length >= Math.min(count, 4)) pool = toned; else notes.push(`--tone ${tone} left ${toned.length}: the tone is ignored for this deal`);
  }

  const recent = mine.slice(-8);
  const uses = (p) => recent.filter((d) => d.ids.includes(p.id)).length;
  const last = new Set(mine.at(-1)?.ids || []);
  const leadsBack = (n) => new Set(mine.slice(-n).map((d) => d.lead));
  // frames another build on this machine was dealt or fetched lately (the shared recent file): behind the fresh ones,
  // ahead of a better hint, so two builds of one trade in two folders do not show the same frames
  const recentLog = readRecent();
  const shared = recentIds(recentLog, trade);
  const elsewhere = (p) => shared.get(p.id) || 0;
  const jitter = new Map(pool.map((p) => [p.id, rnd()]));
  // the seed ranks: a frame rated 8 or more gets a head start of 0.3 in a 0-1 draw, not a place at the top, so one seed's deal differs from the next
  // (a small or soft frame goes behind the others of its subject; a frame dealt in an earlier build behind the fresh ones)
  const score = (p) => jitter.get(p.id) - (p.quality >= 8 ? 0.3 : 0);
  const order = (a, b) => (named(b) - named(a)) || (((a.small || a.soft) ? 1 : 0) - ((b.small || b.soft) ? 1 : 0)) || (elsewhere(a) - elsewhere(b)) || ((last.has(a.id) ? 1 : 0) - (last.has(b.id) ? 1 : 0)) || (uses(a) - uses(b)) || (score(a) - score(b));

  // the lead: strong, wide, of a subject that may open this trade's page, not one of its last leads
  // none when these options leave no photograph made to lead: the hero is then the client's own, type or UI, never a row picture blown up
  const canLead = leadOK; // only with --draft-lead (a draft or the short page: the client has no hero photograph yet)
  const chooseLead = () => {
    let leads = left.filter(canLead);
    if (!leads.length && tone) { leads = untoned.filter((p) => canLead(p) && !chosen.some((c) => c.p === p)); if (leads.length) notes.push(`no lead in a ${tone} tone: the lead keeps its own`); }
    for (const n of [3, 2, 1]) { const back = leadsBack(n); const fresh = leads.filter((p) => !back.has(p.id)); if (fresh.length) { leads = fresh; break; } }
    if (leads.length) { const lo = Math.min(...leads.map(elsewhere)); leads = leads.filter((p) => elsewhere(p) === lo); }   // the one other builds used least lately
    // a sharp, well-made photograph opens the page whenever these options leave one (older soft, hazy files stay in rows)
    const strong = leads.filter((p) => p.quality >= 7); if (strong.length) leads = strong;
    if (leads.length === 1 && leadsBack(1).has(leads[0].id) && mine.length) notes.push('only one photograph can lead this trade with these options: it led last time too');
    if (!leads.length) {
      if (!draftLead) notes.push('no hero is dealt: a library frame never leads a page (PH-02), the hero is the client\'s own photograph (Recipe 3 on a place), else type, its UI or its object. Only a draft (the brief supplies no photograph files) may stand one in: --draft-lead (or --no-client-photos)');
      else notes.push(T.lead.length ? `no photograph can lead ${trade} with these options: the hero is the client's own photograph, else type, its UI or its object; never a row picture blown up` : `the ${trade} trade deals no hero: the hero is the client's own photograph`);
      return null;
    }
    leads.sort((a, b) => (named(b) - named(a)) || ((b.lead ? 1 : 0) - (a.lead ? 1 : 0)) || (uses(a) - uses(b)));
    const top = leads.filter((p) => named(p) === named(leads[0]) && !!p.lead === !!leads[0].lead && uses(p) === uses(leads[0]));
    const weight = (p) => Math.max(1, p.quality - 3);
    let r = rnd() * top.reduce((s, p) => s + weight(p), 0), lead = top[0];
    for (const p of top) { r -= weight(p); if (r <= 0) { lead = p; break; } }
    return lead;
  };

  // one look: once a dark or light photograph is dealt, the opposite tone goes behind the others (mid fits both)
  const clash = (p) => { const t = chosen.find((c) => c.p && c.p.tone !== 'mid')?.p.tone; return t && p.tone !== 'mid' && p.tone !== t ? 1 : 0; };
  const chosen = []; // { p, slot, section }
  const motifs = new Set();
  const left = pool.slice().sort(order);
  const take = (p, slot, section) => { left.splice(left.indexOf(p), 1); chosen.push({ p, slot, section }); motifs.add(p.motif); };
  const empty = [], capped = [];
  // a section the library cannot show, or one whose frames these options keep out (a land frame without --own-land, another craft, --shop, a tone, a motif already dealt)
  const heldBack = (w) => {
    const subs = new Set(SECTIONS.filter(([re, x]) => re.test(w) && Array.isArray(x)).flatMap(([, x]) => x));
    return lib.photos.filter((p) => p.trades.includes(trade) && subs.has(p.subject) && !p.weak && !p.cliche && p.quality >= 7 && p.people !== 'figure' && (!T.only || T.only.includes(p.subject) || (p.craft && craftNames.includes(p.craft))) && craftFits(p, trade, craftNames)).length;
  };

  if (sections.length) {
    // one photograph per section, of the section's subject; nothing when the library holds none
    const why = [];
    for (const s of sections) {
      const w = norm(s);
      const avail = left.filter(slotOK);
      const rule = SECTIONS.find(([re, subj]) => re.test(w) && (typeof subj === 'string' || subj.some((x) => avail.some((p) => p.subject === x))));
      if (!rule) { empty.push(s); chosen.push({ p: null, slot: '', section: s }); continue; }
      if (typeof rule[1] === 'string' && rule[1] !== 'lead') { why.push([s, rule[1]]); chosen.push({ p: null, slot: '', section: s }); continue; }
      // PH-02: at most 1 in 3 of the page's pictures is a library frame; the later sections go to the client's own photographs
      // (a draft: N frames besides the lead)
      if (chosen.filter((c) => c.p && c.slot !== 'lead').length >= libCap) { capped.push(s); chosen.push({ p: null, slot: '', section: s }); continue; }
      if (rule[1] === 'lead') { const lead = chooseLead(); if (lead && left.includes(lead)) take(lead, 'lead', s); else chosen.push({ p: null, slot: '', section: s }); continue; }
      const [, subj, hint, mood] = rule;
      // a row (the same word again: rooms,rooms,rooms) keeps the orientation of its first picture, so no tile outgrows the others
      const row = chosen.find((c) => c.p && norm(c.section) === w)?.p.orientation;
      const repeated = sections.filter((x) => norm(x) === w).length > 1;
      // a repeated word opens the row in the orientation most of its frames have (landscape on a tie), so a row is as long as the library allows
      const nOf = (o) => avail.filter((p) => subj.includes(p.subject) && p.orientation === o && (!p.moodOnly || mood)).length;
      const rowPref = nOf('landscape') >= nOf('portrait') ? 'landscape' : 'portrait';
      const rank = (p) => [subj.indexOf(p.subject), repeated && p.orientation !== rowPref ? 1 : 0, elsewhere(p) * 2 + (hint && hint.test(p.alt) ? 0 : 1), motifs.has(p.motif) ? 1 : 0, clash(p), last.has(p.id) ? 1 : 0, uses(p), p.soft ? 1 : 0, score(p)];
      const cands = avail.filter((p) => subj.includes(p.subject) && (!row || p.orientation === row) && (!p.moodOnly || mood)).map((p) => [rank(p), p])
        .sort((a, b) => { for (let i = 0; i < 9; i++) if (a[0][i] !== b[0][i]) return a[0][i] - b[0][i]; return 0; });
      const best = cands.find(([r]) => r[3] === 0) || null; // never the same motif twice: a section goes empty rather than repeat
      if (best) take(best[1], best[1].subject, s); else { empty.push(s); chosen.push({ p: null, slot: '', section: s }); }
    }
    // a draft deals N frames besides the lead: the one-frame-per-section limit lifts, and the picture sections take a
    // second and third frame in turn (a row, a pair) until N are dealt or the library has no new motif left for them
    if (draftPath) {
      const frames = () => chosen.filter((c) => c.p && c.slot !== 'lead').length;
      const ruleOf = (w) => SECTIONS.find(([re]) => re.test(w));
      const picSecs = [...new Set(sections.map(norm))].filter((w) => { const r = ruleOf(w); return r && Array.isArray(r[1]); });
      for (const strictRow of [true, false]) {
        let added = true;
        while (frames() < pictures && added) {
          added = false;
          for (const w of picSecs) {
            if (frames() >= pictures) break;
            const avail = left.filter(slotOK);
            const rule = SECTIONS.find(([re, subj]) => re.test(w) && Array.isArray(subj) && subj.some((x) => avail.some((p) => p.subject === x)));
            if (!rule) continue;
            const [, subj, hint, mood] = rule;
            const row = chosen.find((c) => c.p && norm(c.section) === w)?.p.orientation;
            const rank = (p) => [subj.indexOf(p.subject), clash(p), elsewhere(p) * 2 + (hint && hint.test(p.alt) ? 0 : 1), last.has(p.id) ? 1 : 0, uses(p), p.soft ? 1 : 0, score(p)];
            const cands = avail.filter((p) => subj.includes(p.subject) && !motifs.has(p.motif) && (!p.moodOnly || mood) && (!strictRow || !row || p.orientation === row))
              .map((p) => [rank(p), p]).sort((a, b) => { for (let i = 0; i < 7; i++) if (a[0][i] !== b[0][i]) return a[0][i] - b[0][i]; return 0; });
            if (!cands.length) continue;
            const p = cands[0][1];
            const at = chosen.map((c) => norm(c.section)).lastIndexOf(w);
            left.splice(left.indexOf(p), 1); motifs.add(p.motif);
            const entry = { p, slot: p.subject, section: chosen[at]?.section || w };
            // the section's empty placeholder (no frame in the first pass) takes it; else it follows the section's last frame
            if (at >= 0 && !chosen[at].p) chosen[at] = entry; else chosen.splice(at + 1, 0, entry);
            const ei = empty.indexOf(entry.section); if (ei >= 0) empty.splice(ei, 1);
            added = true;
          }
        }
      }
      if (frames() < pictures) notes.push(`DRAFT: dealt ${frames()} of ${pictures} frames besides the lead: the library has no new motif left for ${picSecs.length ? picSecs.map((w) => `"${w}"`).join(', ') : 'these sections'} (never the same motif twice); name more picture sections (the trade's own words: list --trade ${trade}) or leave the rest to type`);
    }
    if (why.length) { const by = new Map(); for (const [sec, r] of why) by.set(r, [...(by.get(r) || []), `"${sec}"`]); notes.push(`dealt nothing on purpose: ${[...by].map(([r, secs]) => `${secs.join(', ')}: ${r}`).join('; ')}`); }
    if (capped.length && draftPath) notes.push(`DRAFT: ${pictures} frames besides the lead are dealt (--pictures ${pictures}): ${capped.map((s) => `"${s}"`).join(', ')} take${capped.length === 1 ? 's' : ''} none; pass a larger --pictures to fill ${capped.length === 1 ? 'it' : 'them'}`);
    else if (capped.length) notes.push(`over the 1-in-3 cap (${libCap} library frame${libCap === 1 ? '' : 's'} of ${pictures} pictures): ${capped.map((s) => `"${s}"`).join(', ')} go to the client's own photographs; pass --pictures with the page's real count if it is not ${pictures}`);
    const none = empty.filter((s) => !heldBack(norm(s))), held = empty.filter((s) => heldBack(norm(s)));
    if (none.length) notes.push(`nothing in the library shows ${none.map((s) => `"${s}"`).join(', ')}: give ${none.length > 1 ? 'those sections' : 'that section'} the client's own photograph, its UI or object, or type; never a mood picture in its place (or search: ${T.search.map((q) => `"${q}"`).join(', ')})`);
    if (held.length) notes.push(`the library holds frames of ${held.map((s) => `"${s}"`).join(', ')} that these options keep out (land without --own-land and a --place, another craft, a tone, a motif or an orientation already dealt, no frame left after the others): give ${held.length > 1 ? 'those sections' : 'that section'} the client's own photograph, its UI or object, or type; never a mood picture in its place`);
  } else {
    const lead = chooseLead(); if (lead) take(lead, 'lead', '');
    const wanted = Math.max(1, Math.min(16, parseInt(opt('count', 6), 10) || 6));
    // a draft deals the lead plus --pictures N frames (--count is not asked)
    const count = draftPath ? pictures + (lead ? 1 : 0) : countAsked;
    if (!draftPath && wanted > libCap) notes.push(`--count ${wanted} is over the 1-in-3 cap (${libCap} library frame${libCap === 1 ? '' : 's'} of ${pictures} pictures): ${libCap} dealt, the rest of the page is the client's own photographs`);
    const mix = T.mix;
    const avail = left.filter(slotOK);
    const subjects = [...new Set([...mix, ...avail.map((p) => p.subject)])].filter((s) => avail.some((p) => p.subject === s));
    // first the photographs the last deal did not list, then all; no subject more than half the set, two skies or textures at most
    const cap = (s) => (['sky', 'texture'].includes(s) ? 2 : Math.max(2, Math.ceil(count / 2)));
    const per = (s) => chosen.filter((c) => c.p.subject === s).length;
    for (const [fresh, newMotif] of [[true, true], [true, false], [false, true], [false, false]]) {
      let took = true;
      while (chosen.length < count && took) {
        took = false;
        for (const s of subjects) {
          if (chosen.length >= count) break;
          if (per(s) >= cap(s)) continue;
          const fit = (q) => q.subject === s && slotOK(q) && !q.moodOnly && !(newMotif && motifs.has(q.motif)) && !(fresh && last.has(q.id));
          const p = left.find((q) => fit(q) && !clash(q)) || left.find(fit);
          if (!p) continue;
          take(p, p.subject, ''); took = true;
        }
      }
    }
    if (chosen.length < count) notes.push(`dealt ${chosen.length} of ${count}: the library has no more variety for these options; leave the other slots to type, or search (${T.search.map((q) => `"${q}"`).join(', ')})`);
    // one upright picture when the set has none, for a pair or a phone
    if (chosen.length >= 4 && !chosen.some((c) => c.p.orientation !== 'landscape')) {
      const tall = left.find((p) => slotOK(p) && p.orientation !== 'landscape' && !motifs.has(p.motif));
      if (tall) chosen[chosen.length - 1] = { p: tall, slot: tall.subject, section: '' };
    }
    if (pool.length < count) notes.push(`the library holds ${pool.length} for ${trade} with these options: search the open collections first (${T.search.map((q) => `"${q}"`).join(', ')}) or use the client's own; never fill a slot with a near fit`);
  }
  const got = chosen.filter((c) => c.p);
  if (!got.length) notes.unshift(`no photograph of ${trade} fits these options: every section is the client's own photograph, its UI or object, or type`);
  const ps = got.map((c) => c.p);
  if (ps.some((p) => p.where)) notes.push('a photograph marked where shows the place --place names: say the place in its alt text, never in a caption under it');
  if (ps.some((p) => p.wide)) notes.push('a photograph marked wide keeps its own ratio at every width (style="--ratio: 66.7%" on its frame): a square phone crop cuts its subject');
  if (ps.some((p) => p.small)) notes.push('a photograph marked small is under 1600 pixels wide: a row or half-width picture, never full-bleed');
  if (ps.some((p) => p.shows)) notes.push('bicycles and parts here are other makes: a shop\'s range or service, never the client\'s own model');
  if (ps.some((p) => p.people)) notes.push('a photograph marked people shows hands or backs, never a face: never name them as the client\'s staff or guests');
  if (ps.some((p) => p.moodOnly)) notes.push('a photograph marked mood only shows another business\'s named room or work: an atmosphere band at most, never the client\'s room, counter or product, never the lead, never captioned as theirs');
  if (trade === 'workshop' && !craftNames.length) notes.push('no craft named: a workshop is dealt only the frames of its own craft (a smithy is never a weaver\'s bench), so nothing is dealt; name it in --trade (blacksmith, weaving, letterpress)');
  else if (trade === 'workshop' && !pool.length) notes.push(`the library holds no ${craftNames.join(' or ')} frames: the work shown is the client's own photograph`);
  if (ps.some((p) => p.files)) notes.push('these are library frames with files on disk: photos.mjs fetch copies them (no download) and prints data-source="library-057" on each <img>');
  if (draftPath) notes.unshift(`DRAFT (no client photograph files): the 1-in-3 cap is lifted (${got.length} of ${pictures} pictures are library frames). Every frame below is a stand-in of another place: list each one in the build report as a stand-in with the client's photograph to shoot in its place (the lead: the room or shopfront from the door; a detail: the same subject at the client's own). Nothing on the page says so: no caption, no note; credits in the footer (photos.mjs credits). Never the client's room, shopfront, product or people as if theirs (PH-02)`);
  else notes.unshift(`library frames are stock of another place: details and processes only (hands, tools, materials), at most 1 in 3 of the page's pictures (cap ${libCap} of ${pictures}; dealt ${got.length}), and the client's own photographs are the other ${pictures - got.length}; never the client's room, shopfront, product or people (PH-02)`);
  if (!got.some((c) => c.slot === 'lead') && T.lead.some((x) => LAND.has(x)) && !ownLandFlag) notes.push(`a ${trade} page leads with land, and land is only the client's own place: if the brief names where it stands, pass --brief BRIEF.md (or --place "<the place as written>", list --places) to deal that region's landscape as the lead; else, or when the library holds none of that region, the hero is type on the brand ground`);
  if (got.some((c) => c.slot === 'lead')) notes.push((draftPath ? '--draft-lead: ' : 'a place page leads with a photograph: ') + 'the lead is a stand-in for the client\'s hero photograph: say so in the report, list the hero photograph to shoot, replace it before the page ships');
  if (got.some((c) => LAND.has(c.p.subject))) notes.push("--own-land: the land frames are another photographer's picture of the client's place, a draft stand-in: list the client's own land photographs to shoot and replace them");
  if (ps.some((p) => p.subject === 'street') && T.town) notes.push('a street here is another town\'s: never caption it as the client\'s');
  notes.push('every photograph stays plain and in colour: no halftone, dither, engraving or reveal over the lead, no caption under any; credits go in the footer (photos.mjs credits)');

  const leadId = got.find((c) => c.slot === 'lead')?.p.id || null;
  const deal = { trade, ...(draftPath ? { draft: true } : {}), lead: leadId, ids: ps.map((p) => p.id), ...(sections.length ? { sections } : {}), seed, at: new Date().toISOString() };
  writeHistory(histFile, hist, deal);
  if (recentLog && deal.ids.length) {
    recentLog.photos = [...(Array.isArray(recentLog.photos) ? recentLog.photos : []), { trade, ids: deal.ids, at: deal.at }].slice(-40);
    writeRecent(recentLog);
  }
  if (shared.size && ps.some((p) => shared.has(p.id))) notes.push(`${ps.filter((p) => shared.has(p.id)).length} of these frames another build on this machine used lately: the library has no fresher frame of their subjects with these options; a live search (photos.mjs search${termsFor(word).length ? ` --trade "${word}"` : ''}) finds others`);
  // a place page (every SLOTTED trade) has no band, tab or text on a photograph: its hints and words come from PLACE_PAGE
  const slotted = SLOTTED.has(trade);
  const where = (c) => (slotted && (PLACE_PAGE[c.slot] || PLACE_PAGE[c.p.subject])) || PLACE[c.slot] || PLACE[c.p.subject] || PLACE.landscape;
  const wordsFor = (p) => (slotted ? WORDS_PLACE : WORDS[p.calm] || WORDS.none);
  // a place page never prints its photographs (references/photos.md): the hint stays out of the deal
  const strip = ({ prints, weak, set, needsSetting, lqip, files, why, ...p }) => (files ? { ...p, local: true } : p);
  // a draft frame, as the build report lists it: what it stands in for and what the client shoots in its place
  const standIn = (c) => (c.slot === 'lead'
    ? `stand-in for the client's hero photograph (${c.p.subject}, another place's): shoot the client's own ${LAND.has(c.p.subject) ? 'land from the house' : 'room or shopfront from the door'}, then replace it`
    : `stand-in for the client's own ${c.p.subject} (another place's): shoot the same subject at the client's${c.section ? ` for "${c.section}"` : ''}, then replace it`);
  if (opt('json')) { console.log(JSON.stringify({ ...deal, pool: pool.length, notes, empty, photos: chosen.map((c) => (c.p ? { ...strip(c.p), section: c.section || undefined, slot: c.slot, place: where(c), words: wordsFor(c.p), credit: credit(c.p), ...(draftPath ? { standIn: standIn(c) } : {}) } : { section: c.section, empty: true })) }, null, 1)); return; }

  console.log(`${trade}: ${got.length} photograph${got.length === 1 ? '' : 's'} (seed ${seed}; ${pool.length} fit these options)`);
  console.log(`show: ${T.show}\nnever: ${T.never}\n`);
  chosen.forEach((c, i) => {
    const head = `${String(i + 1).padStart(2)}  ${c.section ? c.section.padEnd(10) : (c.slot === 'lead' ? 'LEAD' : '    ').padEnd(10)}`;
    if (!c.p) { console.log(`${head} (none: the client's photograph, its UI or object, or type)`); return; }
    const p = c.p;
    console.log(`${head} ${p.id.padEnd(10)} ${p.subject.padEnd(9)} ${p.orientation} ${p.ratio}  ${p.tone}  calm: ${p.calm}${p.where ? '  where: ' + p.where.join(', ') : ''}${p.small ? '  small' : ''}${p.people ? '  people: ' + p.people : ''}${p.focus ? '  focus: ' + p.focus : ''}`);
    if (p.wide) console.log('              crop: its subject runs across the width: --ratio: 66.7% on its frame at every width, never a square or taller crop');
    console.log(`              ${p.alt}`);
    console.log(`              place: ${where(c)}`);
    console.log(`              words: ${wordsFor(p)}`);
    console.log(`              ${credit(p)}`);
    if (draftPath) console.log(`              STAND-IN: ${standIn(c)}`);
  });
  if (notes.length) console.log('\n' + notes.map((n) => '- ' + n).join('\n'));
  if (draftPath && got.length) {
    console.log(`\nfor the build report, stand-ins to replace (${got.length}; never on the page, no caption):`);
    for (const c of got) console.log(`- ${c.p.id} (${c.slot === 'lead' ? 'hero' : c.section || c.p.subject}): ${standIn(c)}`);
  }
  if (ps.length) console.log(`\nthen: node ${cmdPath(path.join(HERE, 'photos.mjs'))} fetch ${ps.map((p) => p.id).join(',')}${leadId ? ' --hero ' + leadId : ''} --out .\n  (as printed from the site folder; from elsewhere give --out the site's path. fetch writes the files to <site folder>/assets/img/, or to --dir <a folder under the site>, and prints the markup that loads them as assets/img/<file>, or <--dir>/<file>)`);
  if (!histFile) console.log('(no --history: the next deal may lead with the same photograph)');
}

// ------------------------------------------------------------------ search
// a live search of Wikimedia Commons for what the library lacks (a yoga studio, a bike workshop's bench, a hotel's
// building and rooms, a wedding, a product of the client's kind). Results are candidates, kept in
// <out>/.taste-skill/found.json so fetch and credits treat them as library frames; every one is looked at full size and
// listed in the report as a stand-in for the client's own photograph.
const foundFile = (out) => path.join(out, '.taste-skill', 'found.json');
function readFound(...outs) {
  const m = new Map();
  for (const o of outs) { try { for (const p of JSON.parse(fs.readFileSync(foundFile(o), 'utf8')).photos || []) m.set(p.id, p); } catch { /* none */ } }
  return m;
}
const LICENCE_OK = /^(cc0|cc[ -]by(-sa)?[ -]\d|public domain|pd\b|pdm)/i;
// a file of something other than a photograph of the subject, or one a builder cannot pass as a neutral stand-in
const NOT_A_PHOTO = /\b(logo|sign(?:age|board)?|map|diagram|drawing|poster|screenshot|chart|plan|coat of arms|flag|painting|illustration|engraving|lithograph|stamp|postcard|advert|brochure|label|render(?:ing)?|3d|cgi|collage)\b/i;
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
// Wikimedia Commons (the default source): JPEGs under CC0, CC BY, CC BY-SA or in the public domain
async function commonsSearch(queries, { per, min, orient, recent, tradeWord, panel = false, set = '' }) {
  const seen = new Set(), results = [], failed = [];
  for (const [qi, q] of queries.entries()) {
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', generator: 'search', gsrnamespace: '6', gsrlimit: '50',
      // photographs only: paintings, prints and drawings of the subject are left out by their categories' words
      gsrsearch: q + ' filetype:bitmap -painting -paintings -drawing -engraving -illustration -lithograph -poster -map',
      prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ObjectName|Restrictions',
    });
    let data = null, err = '';
    for (let attempt = 0; attempt < 4 && !data; attempt++) {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
        if (r.status === 429 || r.status >= 500) { err = 'HTTP ' + r.status; await sleep(2000 * 2 ** attempt); continue; }
        if (!r.ok) { err = 'HTTP ' + r.status; break; }
        const text = await r.text();
        try { data = JSON.parse(text); } catch { err = 'busy (' + text.slice(0, 40).trim() + ')'; await sleep(2000 * 2 ** attempt); }
      } catch (e) { err = e.message; await sleep(1500); }
    }
    if (!data) { failed.push(`"${q}": ${err}`); continue; }
    const pages = ((data.query || {}).pages || []).sort((a, b) => (a.index || 0) - (b.index || 0));
    const mine = [];
    for (const pg of pages) {
      const ii = (pg.imageinfo || [])[0]; if (!ii) continue;
      const md = ii.extmetadata || {}, val = (k) => stripHtml((md[k] || {}).value);
      const id = 'f' + pg.pageid, title = String(pg.title || '').replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
      const licence = val('LicenseShortName');
      if (seen.has(id) || ii.mime !== 'image/jpeg' || ii.width < min || !LICENCE_OK.test(licence) || /\b(nc|nd)\b/i.test(licence)) continue;
      if (/personality|trademark|insignia/i.test(val('Restrictions')) || NOT_A_PHOTO.test(title)) continue;
      const ratio = Math.round((ii.width / ii.height) * 100) / 100;
      const orientation = ratio >= 1.05 ? 'landscape' : ratio <= 0.95 ? 'portrait' : 'square';
      if (orient && orient !== true && orientation !== orient) continue;
      // one file of a series (the same place shot five times: "Hotel X, room (1)", "(2)"...), so the candidates differ
      const series = title.toLowerCase().replace(/[\d()[\]_.,-]+/g, ' ').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
      if (mine.some((m) => m.series === series)) continue;
      seen.add(id);
      // the plain file URL (Commons adds tracking words after "?"): fetch makes its 500, 960 and 1280 thumbnails from it
      mine.push({ id, source: 'commons', url: String(ii.url).split('?')[0], width: ii.width, height: ii.height, ratio, orientation, by: val('Artist') || 'Unknown author', licence,
        licenceUrl: val('LicenseUrl') || (/public domain|pd/i.test(licence) ? 'https://creativecommons.org/publicdomain/mark/1.0/' : ''), page: String(ii.descriptionurl).split('?')[0],
        alt: val('ObjectName') || title, subject: panel ? 'panel' : (typeof opt('subject') === 'string' ? opt('subject') : 'stand-in'), tone: 'mid', calm: 'none',
        ...(panel ? { panel: true, ...(set ? { set } : {}) } : { standIn: true }), query: q, series, ...(tradeWord ? { trade: tradeWord } : {}), at: new Date().toISOString() });
    }
    // fresh first: a file another build fetched lately goes behind the others of its query
    mine.sort((a, b) => (recent.has(a.id) ? 1 : 0) - (recent.has(b.id) ? 1 : 0));
    results.push(...mine.slice(0, per));
    if (qi < queries.length - 1) await sleep(1200);   // Commons answers 429 to quick runs
  }
  return { results, failed };
}
// a live search's results go to <out>/.taste-skill/found.json, where fetch and credits find them by id
function storeFound(out, keep) {
  if (!keep.length) return;
  const file = foundFile(out);
  let store = { note: 'Live search results (photos.mjs search): candidates, each looked at full size before use and listed in the build report as a stand-in.', photos: [] };
  try { store = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* new */ }
  const ids = new Set(keep.map((p) => p.id));
  store.photos = [...(store.photos || []).filter((p) => !ids.has(p.id)), ...keep];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(store, null, 1) + '\n');
}
// one live search over the source asked for; pexels without a key says how to set it (one line) and asks Commons instead
async function liveSearch(queries, o) {
  let source = o.source;
  if (source === 'pexels' && !pexelsKey()) { console.error(PEXELS_HINT); source = 'commons'; }
  const r = source === 'pexels' ? await pexelsSearch(queries, o) : await commonsSearch(queries, o);
  return { ...r, source };
}
function searchFilters(source, { min, orient, color }) {
  return source === 'pexels'
    ? `${min}px wide or more${orient && orient !== true ? ', ' + orient : ''}${color && color !== true ? ', colour ' + color : ''}; the Pexels License: free to use, no hotlinking (fetch downloads it), the photographer credited`
    : `JPEG, ${min}px wide or more, CC0, CC BY, CC BY-SA or public domain${orient && orient !== true ? ', ' + orient : ''}`;
}
async function searchCmd() {
  const words = positional().join(' ').trim();
  const tradeWord = typeof opt('trade') === 'string' ? opt('trade') : '';
  const setArg = opt('set');
  const set = setArg && setArg !== true ? findSet(setArg) : null;
  if (setArg && !set) die(`no panel set "${setArg === true ? '' : setArg}": ${panelSets().sets.map((s) => s.id).join(', ')} (photos.mjs panel --sets)`);
  const queries = words ? [words] : set ? set.themes.slice(0, 3) : termsFor(tradeWord);
  if (!queries.length) die(tradeWord ? `no search words for "${tradeWord}": name the subject, e.g. photos.mjs search "${tradeWord} interior" (a game: its setting in plain words, "flooded coastal town at dusk")` : 'usage: photos.mjs search "<what the photograph shows>" [--trade <trade>] [--set <panel set>] [--source commons|pexels] [--count 12] [--min 1600] [--orientation landscape|portrait|square] [--color <name|#hex>] [--out .]');
  const out = typeof opt('out') === 'string' ? opt('out') : '.';
  const count = Math.max(1, Math.min(60, parseInt(opt('count', 12), 10) || 12));
  const per = Math.max(3, Math.ceil(count / queries.length));
  const min = Math.max(800, parseInt(opt('min', 1600), 10) || 1600);
  const orient = opt('orientation') && opt('orientation') !== true ? opt('orientation') : (set ? set.orientation : undefined);
  const color = opt('color') && opt('color') !== true ? opt('color') : (set ? set.color : undefined);
  const recent = recentIds(readRecent(), '');
  const { results, failed, source } = await liveSearch(queries, { source: sourceOf('commons'), per, min, orient, color, size: opt('size'), recent, tradeWord, panel: !!set, set: set ? set.id : '' });
  const keep = results.slice(0, Math.max(count, queries.length * 3));
  storeFound(out, keep);
  if (opt('json')) { console.log(JSON.stringify({ source, queries, photos: keep, failed }, null, 1)); return; }
  console.log(`search: ${keep.length} candidate${keep.length === 1 ? '' : 's'} from ${SOURCES[source]} (${searchFilters(source, { min, orient, color })}) for ${queries.map((q) => `"${q}"`).join(', ')}${set ? ` (panel set ${set.id})` : ''}\n`);
  if (source === 'commons' && color && color !== true) console.log(`(--color ${color} is a Pexels filter: Wikimedia Commons ignores it)\n`);
  for (const p of keep) {
    console.log(`${p.id.padEnd(11)} ${String(p.width + 'x' + p.height).padEnd(10)} ${p.orientation.padEnd(9)} ${p.licence.padEnd(13)} ${p.by.slice(0, 40)}${recent.has(p.id) ? '  [another build used it lately]' : ''}`);
    console.log(`            ${p.alt.slice(0, 110)}  (${p.query})`);
    console.log(`            ${p.page}`);
  }
  if (failed.length) console.log('\nnot searched: ' + failed.join('; '));
  if (!keep.length) { console.log(`nothing fits: other words (the subject plainly, "bicycle workshop", "hotel room"), --min 1200, or leave the slot to the client's own photograph or type`); return; }
  const fetchLine = `node ${cmdPath(path.join(HERE, 'photos.mjs'))} fetch ${set ? '--panel ' : ''}${keep.slice(0, 3).map((p) => p.id).join(',')} --out ${out === '.' ? '.' : cmdPath(out)}`;
  if (set) {
    console.log(`\n- panel candidates (references/cards.md, Panel photos): open each page and ${panelSets().rules.look}
- one set on the page (${set.id}), one photograph per panel, three a page at most; the credit goes in the one footer line like any other
- kept in ${slash(foundFile(out))}; fetch takes the ids and prints the <picture class="pp"> for each panel:
  ${fetchLine}   (the ids you kept; --plate <id> for the hero's or the app frame's plate)`);
    return;
  }
  console.log(`\n- candidates only: open each page and look at the file full size. Keep a frame only when it shows the subject sharp, in plain colour, with no readable name, logo or sign of another business, no face shown as the client's staff or guests, no landmark passed off as the client's place; one light and grade across the set (references/photos.md, Live search)
- every frame used is a STAND-IN: list it in the build report with the client's photograph to shoot in its place; nothing on the page says so (no caption); write its alt text new, the file's title names someone else's place
- kept in ${slash(foundFile(out))}; fetch takes the ids like library ids:
  ${fetchLine}   (the ids you kept; --hero <id> for the lead)`);
}

// ------------------------------------------------------------------ list
// what pick may deal at all (the options narrow it further)
const dealable = (p, T) => !p.cliche && !p.weak && p.quality >= 7 && p.people !== 'figure' && (!T.only || T.only.includes(p.subject));
// what --draft-lead may open a page with (a landscape frame of the trade's lead subjects, not another business's room)
const leadable = (p, T) => dealable(p, T) && p.lead && T.lead.includes(p.subject) && p.orientation === 'landscape' && !p.moodOnly;
const LAND_SUBJECTS = new Set(['landscape', 'road', 'street', 'sky']);
function listPlaces() {
  const n = new Map();
  for (const p of lib.photos) if (p.where && !p.weak && p.quality >= 7) for (const w of p.where) n.set(w, (n.get(w) || 0) + 1);
  console.log('place names the library knows (--place takes one as written, most exact first: "Lofoten, Norway"; a frame is dealt when its source names your place or one inside it):');
  for (const [w, c] of [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) console.log('  ' + w.padEnd(24) + c);
}
function list() {
  if (opt('places')) return listPlaces();
  const t = opt('trade');
  if (!t) {
    if (opt('json')) { console.log(JSON.stringify(lib.trades, null, 1)); return; }
    console.log(`${lib.photos.length} photographs. Trades (--trade):`);
    for (const [id, T] of Object.entries(lib.trades)) {
      const ps = lib.photos.filter((p) => p.trades.includes(id) && dealable(p, T));
      const details = ps.filter((p) => isDetailIn(p, id)).length, land = ps.filter((p) => LAND_SUBJECTS.has(p.subject)).length;
      const subj = {}; for (const p of ps) subj[p.subject] = (subj[p.subject] || 0) + 1;
      console.log(`  ${id.padEnd(9)} ${String(ps.length).padStart(3)} (${details} detail frames dealt by default, ${land} land with --own-land, ${ps.filter((p) => leadable(p, T)).length} can lead with --draft-lead)  ${T.for}${T.shopOnly ? ' [--shop only]' : ''}${id === 'workshop' ? ' [one craft: name it in --trade, e.g. blacksmith, weaving, letterpress]' : ''}\n            ${Object.entries(subj).map(([k, v]) => `${k} ${v}`).join(', ')}${id === 'workshop' ? '; by craft: ' + CRAFTS.map(([c]) => `${c} ${ps.filter((p) => p.craft === c && isDetailIn(p, id)).length}`).join(', ') : ''}${details <= 3 ? '  [thin: a page gets at most ' + details + ', the rest is for photographs of the client]' : ''}`);
    }
    console.log('  a physical product without its own photographs: none (pick --product-without-photos says what to show instead)');
    return;
  }
  const trade = tradeOf(t);
  if (trade === '__product') { console.log(PRODUCT); return; }
  const ps = lib.photos.filter((p) => p.trades.includes(trade));
  if (opt('json')) { console.log(JSON.stringify(ps, null, 1)); return; }
  const T = lib.trades[trade];
  console.log(`${trade}: ${ps.length} photographs. ${T.for}.\nshow: ${T.show}\nnever: ${T.never}\n`);
  for (const p of ps.sort((a, b) => a.subject.localeCompare(b.subject) || (b.lead - a.lead))) {
    const flags = [leadable(p, T) ? 'lead (a place page, or --draft-lead)' : '', dealable(p, T) && LAND_SUBJECTS.has(p.subject) ? 'land: only when the --brief or --place names its region' : '', dealable(p, T) && !isDetailIn(p, trade) && !LAND_SUBJECTS.has(p.subject) ? 'not a detail: only as a --draft-lead lead' : '', p.cliche ? 'stock shot, never dealt' : '', p.weak ? 'weak, never dealt' : '',
      p.quality < 7 ? `rated ${p.quality}, never dealt` : '', p.people === 'figure' ? 'a figure in it, never dealt' : '', T.only && !T.only.includes(p.subject) ? 'not dealt to this trade' : '', p.needsSetting ? 'only with a --setting that names its terrain' : '', p.mono ? 'b/w' : '', p.night ? 'night' : '', p.warm ? 'warm coast' : '', p.shows ? `shows a ${p.shows} (--shop)` : '', p.where ? 'where: ' + p.where.join(', ') : '', p.moodOnly ? 'mood only: never the client\'s premises or product' : '', p.craft ? 'craft: ' + p.craft : '', PD(p) ? 'Public Domain Mark' : '', p.files ? 'files on disk' : '', p.why ? p.why : '', p.people && p.people !== 'figure' ? 'people: ' + p.people : ''].filter(Boolean).join(', ');
    console.log(`${p.id.padEnd(10)} ${p.subject.padEnd(9)} ${p.orientation.padEnd(9)} ${p.tone.padEnd(5)} ${p.alt}${flags ? `  [${flags}]` : ''}`);
  }
}

// ------------------------------------------------------------------ fetch
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Commons serves thumbnails only at its standard widths (330, 500, 960, 1280, 1920, 3840); Picsum at any width
const STEPS = [500, 960, 1280, 1920];
// found.json sits in the project and anyone can edit it: a file is fetched only from Commons' own file host, and a
// library frame only by its number
function fileUrl(p, w) {
  if (p.source !== 'commons') {
    if (!/^\d+$/.test(String(p.id))) throw new Error('not a library frame id');
    const x = Math.min(w, p.width || w); return `https://picsum.photos/id/${p.id}/${x}/${Math.round(x / p.ratio)}`;
  }
  if (!/^https:\/\/upload\.wikimedia\.org\//.test(String(p.url || ''))) throw new Error('not a Commons file');
  if (!p.width || w >= p.width) return p.url;
  const m = /\/commons\/(\w\/\w\w)\/([^/?]+)$/.exec(p.url);
  return m ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${w}px-${m[2]}` : p.url;
}
async function download(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let r;
    try { r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*' }, signal: AbortSignal.timeout(60000) }); } catch { await sleep(1500 * (attempt + 1)); continue; }
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf[0] === 0xff && buf[1] === 0xd8) return buf;
      throw new Error('not a JPEG');
    }
    if (r.status === 429 || r.status >= 500) { const ra = +(r.headers.get('retry-after') || 0); await sleep(Math.min(30000, ra ? ra * 1000 : 2000 * 2 ** attempt)); continue; }
    throw new Error('HTTP ' + r.status);
  }
  throw new Error('gave up after 5 tries');
}
// the width the browser should fetch for: the shown width, or for a wide photograph cropped into a taller box
// (a hero that fills the screen, a 4:5 frame on a phone) the box's height times the photograph's ratio
const FFMPEG = (() => { try { return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0; } catch { return false; } })();
// the hero is Recipe 3's top photograph: the full width of the screen and 480 px tall, so the browser is told 100vw, never a vh term
// (a vh term sends a tablet and a 3x phone to the largest file). On a phone a place hero's photograph grows from 4:3 to at most 4:5
// into what its words leave, so its crop is 4:5 (a 4:3 one shown that tall is blown up 1.7x)
const HERO_CROP = { w: 780, h: 975, media: '(max-width: 639px)' }; // PH-28: the phone's crop at twice its width
const kb = (f) => Math.round(fs.statSync(f).size / 1024);
// a JPEG as WebP (smaller at the same look) when ffmpeg is on the path
function toWebp(buf) {
  if (!FFMPEG) return null;
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', 'pipe:0', '-c:v', 'libwebp', '-quality', '78', '-compression_level', '6', '-f', 'webp', 'pipe:1'], { input: buf, maxBuffer: 1 << 28 });
  return r.status === 0 && r.stdout.length > 1000 && r.stdout.length < buf.length ? r.stdout : null;
}
// a PNG with alpha as a WebP with alpha (yuva420p), returned only when the WebP still says it holds the alpha
function toWebpAlpha(buf) {
  if (!FFMPEG) return null;
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-f', 'png_pipe', '-i', 'pipe:0', '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '82', '-compression_level', '6', '-f', 'webp', 'pipe:1'], { input: buf, maxBuffer: 1 << 28 });
  return r.status === 0 && r.stdout.length > 200 && r.stdout.length < buf.length && alphaOf(r.stdout).channel ? r.stdout : null;
}
// the phone crop of a hero: cover-cropped to 780x975 around the photograph's focus, from the first file at least that tall
function cropFile(from, to, focus) {
  if (!FFMPEG) return false;
  const [fx, fy] = (focus || '50% 50%').split(/\s+/).map((v) => Math.min(1, Math.max(0, parseFloat(v) / 100)));
  const { w, h } = HERO_CROP;
  const vf = `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}:'(iw-${w})*${fx}':'(ih-${h})*${fy}'`;
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', from, '-vf', vf, '-c:v', 'libwebp', '-quality', '74', '-compression_level', '6', to]);
  return r.status === 0 && fs.existsSync(to);
}
function sizesFor(p, hero) {
  const r = Math.max(1, Math.round(p.ratio * 100) / 100);
  // a hero without its phone crop: on a phone the file must cover a 4:5 box (the place hero grows to it), so its width there is the box's height times the ratio
  if (hero) return hero === 'crop' ? '100vw' : `(max-width: 639px) ${Math.ceil(r * 125)}vw, 100vw`;
  if (p.orientation === 'landscape' && !p.wide) return `(max-width: 639px) ${Math.round(r * 125)}vw, (max-width: 1023px) 100vw, 50vw`;
  return '(max-width: 1023px) 100vw, 50vw';
}
const LIB_DIR = path.join(HERE, '..', 'assets', 'photos');
// the page's images together (perf.mjs: WARN above 1,200 KiB, FAIL above 2,400 KiB at 1440; references/perf.md). Counted: the file each
// photograph of the folder loads on a 1440 screen (a hero at 2x the full width: its largest; any other at 2x half the width: 1440 wide, else its largest); the phone crop is not
const PAGE_KIB = { warn: 1200, fail: 2400 };
function pageWeight(dir, photos) {
  const rows = [], crop = /\d+x\d+\.\w+$/;
  for (const c of photos) {
    const fl = (c.files || []).filter((n) => !crop.test(n)).map((n) => ({ n, w: +(/-(\d+)\.\w+$/.exec(n) || [0, 1e9])[1] || 1e9, p: path.join(dir, n) })).filter((f) => fs.existsSync(f.p)).sort((a, b) => a.w - b.w);
    if (!fl.length) continue;
    const hero = (c.files || []).some((n) => crop.test(n));
    const f = hero ? fl.at(-1) : (fl.find((x) => x.w >= 1440) || fl.at(-1));
    rows.push({ id: c.id, n: f.n, kb: kb(f.p), hero });
  }
  return rows;
}
const escRe = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// a JPEG's own pixel size, read from its frame header (a Pexels file's width is set by Pexels, not asked for)
function jpegSize(b) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
// the width Pexels serves for each of its sizes (large: inside 940x650, large2x: the same at 2x, medium: 350 tall), when the header cannot be read
const pexelsW = (k, p) => {
  const r = p.ratio || 1.5, W = p.width || 6000, H = p.height || Math.round(W / r);
  if (k === 'medium') return Math.min(W, Math.round(350 * r));
  const fit = Math.min(1, 940 / W, 650 / H);
  return Math.round(W * fit) * (k === 'large2x' ? 2 : 1);
};
// which of Pexels' own files a slot takes (no hotlinking: each is downloaded into the site)
const PEXELS_SLOT = { panel: ['large', 'large2x'], plate: ['large', 'large2x'], hero: ['large', 'large2x'], photo: ['medium', 'large', 'large2x'] };
// the panel-photo history (its own key in the --history file; the other dealers' keys are kept as they are)
function readPanelHistory(file) {
  if (!file || file === true) return { data: null, deals: [] };
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* new file */ }
  if (Array.isArray(data) || typeof data !== 'object' || !data) die(`${file} is not a history object`);
  return { data, deals: Array.isArray(data.panelPhotos) ? data.panelPhotos.filter((d) => d && typeof d === 'object') : [] };
}
function writePanelHistory(file, hist) {
  if (!file || file === true || !hist.data) return;
  hist.data.panelPhotos = hist.deals.slice(-30);
  // the file is shared with start.mjs, which reads palettes and types without a default
  for (const k of ['palettes', 'types']) if (!Array.isArray(hist.data[k])) hist.data[k] = [];
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(hist.data, null, 1) + '\n');
}
async function fetchCmd() {
  const fsource = sourceOf('');
  // --source pexels: a bare number is a Pexels id (p<number>); without it a number is a library frame, as before
  const asId = (x) => (fsource === 'pexels' && /^\d+$/.test(x) ? 'p' + x : x);
  const idList = (v) => (v && v !== true ? String(v).split(',').map((x) => asId(x.trim())).filter(Boolean) : []);
  // a panel photo (a card's panel, assets/ui/cards.css [data-panel-photo]) and a plate (the hero's .hero__art, the app frame's .photo-plate)
  const panelIds = new Set(idList(opt('panel', ''))), plateIds = new Set(idList(opt('plate', '')));
  const ids = [...new Set([...positional().flatMap((x) => x.split(',')).map((x) => asId(x.trim())).filter(Boolean), ...panelIds, ...plateIds])];
  const out = opt('out');
  if (!ids.length || !out || out === true) die('usage: photos.mjs fetch <id,id,...> --out <site folder> [--hero <id>] [--big <id>] [--panel <id,id>] [--plate <id>] [--source pexels] [--lqip] [--dir assets/img] [--sizes "<sizes>"] [--history .taste-skill/history.json]');
  const hero = new Set(idList(opt('hero', '')));
  const bigger = new Set(idList(opt('big', ''))); // a full-bleed band: the largest file too
  const lqip = !!opt('lqip');
  const rel = String(opt('dir', 'assets/img')).replace(/\\/g, '/').replace(/\/$/, '');
  const dir = path.join(out, rel);
  fs.mkdirSync(dir, { recursive: true });
  const credFile = path.join(dir, 'credits.json');
  let cred = { note: 'Credits for the photographs in this folder: photos.mjs credits prints the footer block for the ones the pages use.', photos: [] };
  try { cred = JSON.parse(fs.readFileSync(credFile, 'utf8')); } catch { /* new */ }
  const failed = [], tags = [], saved = [], panelTags = [], panelSetsUsed = new Set(), alphaKept = new Map();
  // a live search's results (photos.mjs search, .taste-skill/found.json in the site folder or here) fetch like library frames
  const found = readFound(out, '.');
  // a Pexels id no search kept (seen on pexels.com): looked up with the key, then kept in found.json like a search result;
  // without the key, one line says how to set it and the other ids still fetch
  const lookup = ids.filter((id) => /^p\d+$/.test(id) && !found.has(id));
  if (lookup.length && !pexelsKey()) { console.error(PEXELS_HINT.replace(/; using Wikimedia Commons for now$/, '; the other ids still fetch')); }
  else if (lookup.length) {
    const got = [];
    for (const id of lookup) {
      try { const e = pexelsEntry(await pexelsGet('photos/' + id.slice(1)), { panel: panelIds.has(id) || plateIds.has(id) }); found.set(id, e); got.push(e); } catch (e) { failed.push(id + ': ' + e.message); }
    }
    storeFound(out, got);
  }
  for (const id of ids) {
    const p = byId.get(id) || found.get(id);
    if (!p) { if (!failed.some((f) => f.startsWith(id + ':'))) failed.push(id + (/^f\d+$/.test(id) ? ': not in .taste-skill/found.json (run photos.mjs search with the same --out first)' : /^p\d+$/.test(id) ? ': not in .taste-skill/found.json, and no PEXELS_API_KEY to look it up (photos.mjs search --source pexels with the same --out, or set the key)' : ': not in the library')); continue; }
    if (p.weak) { failed.push(id + ': never dealt' + (p.why ? ' (' + p.why + ')' : '')); continue; }
    const isHero = hero.has(id), isPanel = panelIds.has(id), isPlate = plateIds.has(id) && !isPanel;
    let files = [], names = [], srcName, srcW;
    try {
      if (p.source === 'generated') {
        // a generated picture: copied from <out>/.taste-skill/generated (only from there: found.json is editable), WebP when ffmpeg is on the path
        const from = path.resolve(genDir(out), path.basename(String(p.file || '')));
        if (!from.startsWith(path.resolve(genDir(out)) + path.sep) || !fs.existsSync(from)) throw new Error('its file is missing from .taste-skill/generated (run photos.mjs generate with the same --out)');
        let buf = fs.readFileSync(from), ext = path.extname(from).toLowerCase();
        // a cut-out keeps its alpha: a PNG with alpha becomes a WebP with alpha when ffmpeg can (checked after), else stays a PNG;
        // a WebP is copied as it is; never flattened onto a colour. The file is read again here: a cut made after generate counts
        const a = ext === '.png' || ext === '.webp' ? alphaOf(buf) : null;
        if (a && a.channel) {
          const w = ext === '.png' ? toWebpAlpha(buf) : null;
          if (w) { buf = w; ext = '.webp'; }
          else if (ext === '.png') console.log(`  ${id}: kept as PNG with its alpha (${FFMPEG ? 'the WebP lost the alpha' : 'ffmpeg is not on the path, so no WebP'})`);
          alphaKept.set(id, isCutout(a) ? 'cut-out' : 'opaque-alpha');
        } else if (ext !== '.webp') { const webp = toWebp(buf); if (webp) { buf = webp; ext = '.webp'; } }
        if (p.cutout === 'needed' && !(a && isCutout(a))) alphaKept.set(id, 'needed');
        const file = 'photo-' + id + '-' + (p.width || 1536) + ext;
        fs.writeFileSync(path.join(dir, file), buf);
        files.push({ file, w: p.width || 1536, kb: Math.round(buf.length / 1024) });
      } else if (p.source === 'pexels') {
        // Pexels' own sizes, downloaded (never hotlinked) and kept as WebP when ffmpeg is on the path; each file named by its width
        const keys = PEXELS_SLOT[isPanel ? 'panel' : isPlate ? 'plate' : isHero ? 'hero' : 'photo'];
        const widths = new Set();
        for (const k of keys) {
          const u = p.src && p.src[k];
          if (!u || !PEXELS_HOST.test(u)) continue;   // found.json is editable: a file is fetched only from Pexels' own image host
          let buf = await download(u);
          const w = (jpegSize(buf) || {}).w || pexelsW(k, p);
          if (widths.has(w)) continue;
          widths.add(w);
          const webp = toWebp(buf);
          if (webp) buf = webp;
          const file = 'photo-' + id + '-' + w + (webp ? '.webp' : '.jpg');
          fs.writeFileSync(path.join(dir, file), buf);
          files.push({ file, w, kb: Math.round(buf.length / 1024) });
          await sleep(200);
        }
        if (!files.length) throw new Error('no Pexels file to download (its found.json entry holds no images.pexels.com size)');
        files.sort((x, y) => x.w - y.w);
      } else if (p.files) {
        // a file of the library: copied, no download. The hero gets every size, any other photograph its 1200 (and the largest with --big)
        const have = p.files.filter((f) => fs.existsSync(path.join(LIB_DIR, f.file)));
        if (!have.length) throw new Error('its files are missing from assets/photos/img');
        let use = isHero ? have : have.filter((f) => f.w <= 1280);
        if (!use.length) use = [have[0]];
        if (bigger.has(id) && !isHero) use = [...use, have.at(-1)];
        use = [...new Map(use.map((f) => [f.w, f])).values()].sort((x, y) => x.w - y.w);
        for (const f of use) {
          const name = 'photo-' + id + '-' + f.w + path.extname(f.file);
          fs.copyFileSync(path.join(LIB_DIR, f.file), path.join(dir, name));
          files.push({ file: name, w: f.w, kb: Math.round(fs.statSync(path.join(dir, name)).size / 1024) });
        }
      } else {
        const big = Math.min(isHero || isPlate ? 1920 : 1280, p.width || 1920);
        const sizes = [...STEPS.filter((w) => w < big), big];
        for (const w of sizes) {
          let buf = await download(fileUrl(p, w));
          const webp = toWebp(buf); // WebP when ffmpeg is on the path (PH-27), else the JPEG as served
          if (webp) buf = webp;
          const ext = webp ? '.webp' : '.jpg';
          const file = w === big ? 'photo-' + id + ext : 'photo-' + id + '-' + w + ext;
          fs.writeFileSync(path.join(dir, file), buf);
          files.push({ file, w, kb: Math.round(buf.length / 1024) });
          if (p.source === 'commons') await sleep(700); // Commons answers 429 to quick runs
        }
      }
    } catch (e) { failed.push(id + ': ' + e.message); continue; }
    // weight caps (PH-27): a file over the cap (hero 400 KB, any other 250 KB) is left out of the srcset and deleted, unless every file is over
    const capKb = isHero || isPlate ? 400 : 250, dropped = [];
    if (files.some((f) => f.kb <= capKb)) {
      for (const f of files.filter((x) => x.kb > capKb)) { fs.rmSync(path.join(dir, f.file), { force: true }); dropped.push(f); }
      files = files.filter((f) => f.kb <= capKb);
    }
    const src = isHero ? (files.find((f) => f.w >= 1440) || files.at(-1)) : files.at(-1);
    srcName = src.file; srcW = src.w;
    // the hero's phone crop (PH-28): 780x975 around the subject, for a <picture> source at 639px and under
    let crop = null;
    if (isHero) {
      const from = files.find((f) => f.w / p.ratio >= HERO_CROP.h) || files.at(-1), name = 'photo-' + id + '-' + HERO_CROP.w + 'x' + HERO_CROP.h + '.webp';
      if (cropFile(path.join(dir, from.file), path.join(dir, name), p.focus)) crop = { file: name, kb: kb(path.join(dir, name)) };
    }
    names = [...files.map((f) => f.file), ...(crop ? [crop.file] : [])];
    cred.photos = cred.photos.filter((x) => x.id !== id);
    cred.photos.push({ file: srcName, files: names, id, alt: p.alt, ...(p.where ? { where: p.where.join(', ') } : {}), by: p.by, ...(p.byUrl ? { byUrl: p.byUrl } : {}), licence: p.licence, licenceUrl: p.licenceUrl, page: p.page, source: p.source === 'commons' ? 'Wikimedia Commons' : p.source === 'pexels' ? 'Pexels' : p.source === 'generated' ? 'Generated' : 'Unsplash', ...(p.source === 'generated' ? { model: p.model, prompt: p.prompt } : {}), ...(isPanel || isPlate ? { panel: true } : {}) });
    const h = Math.round(srcW / p.ratio);
    const srcset = files.map((f) => rel + '/' + f.file + ' ' + f.w + 'w').join(', ');
    if (isPanel || isPlate) {
      // a panel photo is the ground behind UI, not a subject: alt="" and aria-hidden, the host's lit ground under it as the still
      // fallback, lazy (a plate in the hero drops loading="lazy"), its average colour while it loads (Pexels' avg_color)
      const sizes = opt('sizes') && opt('sizes') !== true ? String(opt('sizes')) : isPlate ? '(max-width: 1023px) 100vw, 90vw' : '(max-width: 1023px) 100vw, 50vw';
      const from = p.source === 'pexels' ? 'pexels' : p.source === 'commons' ? 'commons' : p.source === 'generated' ? 'generated' : 'library-057';
      panelTags.push('<picture class="pp" aria-hidden="true"' + (p.avg ? ' style="--pp-avg: ' + p.avg + '"' : '') + '><img src="' + rel + '/' + srcName + '" srcset="' + srcset + '" sizes="' + sizes + '" width="' + srcW + '" height="' + h + '" alt="" loading="lazy" decoding="async" data-source="' + from + '" data-subject="panel"' + (p.focus ? ' style="object-position: ' + p.focus + '"' : '') + '></picture>'
        + (isPlate ? '  <!-- the first child of the plate: .hero__art (no data-fx; in the hero drop loading="lazy") or .photo-plate round the app frame -->' : '  <!-- the first child of the .panel (or .panel__screen), before its .stage; the panel holds no data-fx -->'));
      console.log('saved ' + files.map((f) => f.file + ' (' + f.kb + ' KB)').join(', ') + '  ' + p.orientation + ' ' + p.ratio + '  ' + (isPlate ? 'plate' : 'panel') + ' photo, ' + p.alt);
      if (dropped.length) console.log('  left out (over the ' + capKb + ' KB ' + (isPlate ? 'plate' : 'panel') + ' cap): ' + dropped.map((f) => f.w + 'w ' + f.kb + ' KB').join(', '));
      const overP = files.filter((f) => f.kb > capKb);
      if (overP.length) console.log('  over the weight cap (' + capKb + ' KB): ' + overP.map((f) => f.file + ' ' + f.kb + ' KB').join(', ') + ' (a calmer photograph, or re-encode it)');
      if (srcW < 1200) console.log('  ' + srcW + ' px wide: soft on a 2x screen in a panel wider than ' + Math.round(srcW / 2) + ' px; a larger photograph fits a wide panel or plate better');
      if (!p.files && !FFMPEG) console.log('  JPEG: ffmpeg is not on the path, so no WebP (PH-27 asks for WebP or AVIF)');
      panelSetsUsed.add(p.set || '');
      saved.push(id);
      continue;
    }
    const style = [p.focus ? 'object-position: ' + p.focus : '', lqip && p.lqip ? 'background: center / cover url(' + p.lqip + ')' : ''].filter(Boolean).join('; ');
    tags.push('<img src="' + rel + '/' + srcName + '" srcset="' + srcset + '" sizes="' + sizesFor(p, isHero && (crop ? 'crop' : 'whole')) + '" width="' + srcW + '" height="' + h + '" alt="' + p.alt.replace(/"/g, '&quot;') + '"' + (isHero ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (isHero && !crop ? ' data-phone-fill' : '') + ' data-source="' + (p.source === 'generated' ? 'generated' : p.standIn ? 'stand-in' : 'library-057') + '" data-subject="' + p.subject + '"' + (style ? ' style="' + style + '"' : '') + '>' + (p.wide ? '  <!-- wide: style="--ratio: 66.7%" on its frame -->' : ''));
    if (crop) { const i = tags.length - 1; tags[i] = '<picture data-phone-fill><source media="' + HERO_CROP.media + '" srcset="' + rel + '/' + crop.file + ' ' + HERO_CROP.w + 'w" sizes="100vw">' + tags[i] + '</picture>'; }
    // a generated picture: its alpha, and a slot ratio the API could not make at that size (crop it in CSS)
    const ak = alphaKept.get(id);
    if (ak === 'cut-out') tags[tags.length - 1] += '  <!-- a transparent cut-out: on the page ground as it is, no frame, box, border, radius or shadow behind it -->';
    if (ak === 'needed') tags[tags.length - 1] += '  <!-- NOT cut out yet (' + (p.matte ? 'flat ' + p.matte + ' ground' : 'no clear pixels') + '): only on a ground that matches it until it is cut -->';
    if (p.aspect && p.width && p.height && Math.abs(Math.log((p.width / p.height) / p.aspect.split(':').reduce((x, y) => x / y))) > 0.02) tags[tags.length - 1] += '  <!-- made at ' + p.width + 'x' + p.height + ' for a ' + p.aspect + ' slot: aspect-ratio: ' + p.aspect.replace(':', ' / ') + '; object-fit: cover on the img -->';
    // where the hero's tag goes: a full-bleed photograph (hero--place, hero--photo) is the section's one layer
    if (isHero) tags[tags.length - 1] += crop ? '  <!-- full-bleed (hero--place, hero--photo): <picture class="hero__bg">, a direct child of the section beside its .wrap; in a frame (.hero__media): as printed -->'
      : '  <!-- full-bleed (hero--place, hero--photo): <img class="hero__bg">, a direct child of the section beside its .wrap; in a frame (.hero__media): as printed -->';
    console.log('saved ' + files.map((f) => f.file + ' (' + f.kb + ' KB)').join(', ') + '  ' + p.orientation + ' ' + p.ratio + '  ' + p.alt + (ak === 'cut-out' ? '  [alpha kept]' : ak === 'needed' ? '  [NOT cut out yet]' : ''));
    if (dropped.length) console.log('  left out (over the ' + capKb + ' KB ' + (isHero ? 'hero' : 'image') + ' cap): ' + dropped.map((f) => f.w + 'w ' + f.kb + ' KB').join(', '));
    const over = files.filter((f) => f.kb > capKb);
    if (over.length) console.log('  over the weight cap (' + capKb + ' KB): ' + over.map((f) => f.file + ' ' + f.kb + ' KB').join(', ') + ' (every file of this photograph is over it: pick another, or re-encode it)');
    if (isHero && srcW < 1440) console.log('  the hero is ' + srcW + ' wide: a 1440 screen at 2x would want 2880, which the library does not hold (PH-27); the page keeps the largest file within the cap');
    if (isHero && !crop) console.log('  no phone crop: ffmpeg is not on the path (the phone sizes term on the img fetches a file that covers a 4:5 box at 390 until a 780x975 crop exists)');
    if (!isHero && !p.files && (p.source === 'commons' || p.source === 'pexels') && !FFMPEG) console.log('  JPEG: ffmpeg is not on the path, so no WebP (PH-27 asks for WebP or AVIF)');
    if (p.standIn) console.log('  a live search result: a STAND-IN for the client\'s own photograph; list it in the build report, write its alt text new');
    saved.push(id);
  }
  fs.writeFileSync(credFile, JSON.stringify(cred, null, 1) + '\n');
  // the shared recent file: the next build on this machine puts these frames behind the fresh ones
  const recentLog = readRecent();
  if (recentLog && saved.length) { recentLog.fetched = [...(Array.isArray(recentLog.fetched) ? recentLog.fetched.filter((x) => !saved.includes(x)) : []), ...saved].slice(-120); writeRecent(recentLog); }
  console.log('\nwrote to ' + slash(dir) + '/ (' + rel + '/ in the site folder ' + slash(out) + '; a page in that folder loads them as ' + rel + '/<file>)');
  const wt = pageWeight(dir, cred.photos), total = wt.reduce((a, r) => a + r.kb, 0), n = (v) => v.toLocaleString('en');
  if (wt.length) {
    const verdict = total > PAGE_KIB.fail ? 'FAIL: perf.mjs fails a page whose images pass ' + n(PAGE_KIB.fail) + ' KiB; drop a photograph or its largest file'
      : total > PAGE_KIB.warn ? 'WARN: perf.mjs warns above ' + n(PAGE_KIB.warn) + ' KiB (it fails above ' + n(PAGE_KIB.fail) + ')' : 'PASS';
    console.log('\npage images at 1440 (the file each of the ' + wt.length + ' photograph' + (wt.length === 1 ? '' : 's') + ' in this folder loads, the hero at 2x): about ' + n(total) + ' KiB of ' + n(PAGE_KIB.fail) + ' - ' + verdict);
    if (total > PAGE_KIB.warn) console.log('  heaviest: ' + [...wt].sort((a, b) => b.kb - a.kb).slice(0, 3).map((r) => r.n + ' ' + r.kb + ' KiB').join(', '));
  }
  if (panelTags.length) {
    const sets = [...panelSetsUsed].map((k) => (k ? findSet(k) : null));
    const named = sets.filter(Boolean);
    console.log('\nthe panel photos (references/cards.md, Panel photos): paste each <picture class="pp"> as the first child of its host and set on the host (or once on <html>) the look of its set, the same on every panel:');
    for (const s of named.length ? named : [null]) console.log('  ' + (s ? s.id + ': ' : '') + panelLook(s));
    if (named.length > 1) console.log('  WARNING: these panel photos come from ' + named.length + ' sets (' + named.map((s) => s.id).join(', ') + '): a page takes one set, one tone family');
    if (panelTags.length > 3) console.log('  WARNING: ' + panelTags.length + ' panel photos: three a page at most');
    console.log(panelTags.join('\n'));
    // the panel history: the ids the page uses, so the next deal puts them behind the fresh ones
    const hf = opt('history');
    if (hf && hf !== true) {
      const H = readPanelHistory(hf);
      const used = saved.filter((id) => panelIds.has(id) || plateIds.has(id));
      if (H.deals.length && !H.deals.at(-1).used) H.deals.at(-1).used = used; else H.deals.push({ set: named[0] ? named[0].id : '', themes: [], ids: [], used, at: new Date().toISOString() });
      writePanelHistory(hf, H);
    }
  }
  if (tags.length) console.log('\nthe <img> for each (the hero is sized 100vw, as Recipe 3 shows it full width, with a 780x975 phone crop in a <picture>; keep data-phone-fill on the hero picture or img; any other picture is sized for a half-width or full-width frame: set sizes to the shown width; the hero eager, the rest lazy, none hidden or faded in; a photograph in a nav menu, a tab, a carousel or a sideways-scrolling row drops loading="lazy", which may never fire there; data-source and data-subject stay on every picture):\n' + tags.join('\n'));
  console.log('\n' + slash(credFile) + '\nonce the page\'s markup uses these files (credits reads the page for them, so not before): node ' + cmdPath(path.join(HERE, 'photos.mjs')) + ' credits --out ' + cmdPath(out) + (rel !== 'assets/img' ? ' --dir ' + rel : '') + ' prints the footer credits for the photographs it uses');
  if (failed.length) { console.log('\nnot saved:\n' + failed.join('\n')); process.exitCode = 1; }
}
// the footer holds ONE line that links the credits page; the list of photographers, licences and source pages is a block of its own
// (credits.html), never one link per photograph in the footer (a credit wall: the judges marked 18 and 20 links)
const escH = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// "Unsplash and Wikimedia Commons"; three sources read "Pexels, Unsplash and Wikimedia Commons"
const creditSources = (list) => { const s = [...new Set(list.map((c) => c.source))].sort(); return s.length > 2 ? s.slice(0, -1).join(', ') + ' and ' + s.at(-1) : s.join(' and '); };
function creditLine(list, href) {
  return '<a class="credits" href="' + escH(href) + '">Photographs via ' + creditSources(list) + '</a>';
}
function creditList(list) {
  const set = [...new Set(list.map((c) => c.source))];
  const via = (c) => (set.length > 1 ? (c.source === 'Unsplash' ? ' on Unsplash' : ', via Wikimedia Commons') : '');
  // Pexels asks for the photographer and a link to Pexels: "Photo by <name> on Pexels", the name linking the photograph's page
  const items = list.map((c) => c.source === 'Pexels'
    ? '<li>Photo by <a href="' + escH(c.page) + '">' + escH(c.by) + '</a>' + (c.adapted ? ', adapted,' : '') + ' on <a href="https://www.pexels.com">Pexels</a></li>'
    : c.source === 'Wikimedia Commons'
    ? '<li><a href="' + escH(c.page) + '">' + escH(c.by) + '</a>, <a href="' + escH(c.licenceUrl) + '">' + escH(c.licence) + '</a>' + (c.adapted ? ', adapted' : '') + via(c) + '</li>'
    : '<li><a href="' + escH(c.page) + '">' + escH(c.by) + '</a>' + (c.adapted ? ', adapted' : '') + via(c) + '</li>');
  return '<section class="credits-list" id="credits" aria-labelledby="credits-h">\n  <h1 id="credits-h">Photograph credits</h1>\n  <ul>\n    ' + items.join('\n    ') + '\n  </ul>\n</section>';
}
// the same list as plain text (a report, a README): the one footer line, then every photograph
function creditText(list) {
  const line = 'Photographs via ' + creditSources(list);
  return [line, ...list.map((c) => '- ' + (c.source === 'Pexels' ? 'Photo by ' : '') + c.by + (c.source === 'Pexels' ? ' on Pexels' : '') + (c.source === 'Wikimedia Commons' ? ', ' + c.licence + (c.licenceUrl ? ' (' + c.licenceUrl + ')' : '') : '') + (c.adapted ? ', adapted' : '') + ', ' + c.page + (c.where ? ' [' + c.where + ']' : '') + (c.panel ? ' [panel]' : ''))].join('\n');
}
// the credits page: the site's own legal-page shell (privacy.html, terms.html, else the first other page) with its main replaced by the list
function creditsPage(out, name, list, brand) {
  const shells = ['privacy.html', 'terms.html', 'imprint.html'].concat(fs.readdirSync(out).filter((f) => f.endsWith('.html')));
  const shellFile = shells.find((f) => f !== name && fs.existsSync(path.join(out, f)));
  const body = creditList(list).replace(/^/gm, '  ');
  if (shellFile) {
    let h = fs.readFileSync(path.join(out, shellFile), 'utf8');
    const main = /<main\b([^>]*)>[\s\S]*?<\/main>/i;
    if (main.test(h)) {
      h = h.replace(main, (m, attrs) => '<main' + attrs + '>\n  <p><a class="link" href="index.html">' + escH(brand) + '</a></p>\n' + body + '\n</main>');
      h = h.replace(/<title>[^<]*<\/title>/i, () => '<title>' + escH(brand) + ': photograph credits</title>').replace(/(<meta name="description" content=")[^"]*"/i, (m, a) => a + 'The photographers, licences and source pages of the photographs on the ' + escH(brand) + ' website."');
      return h;
    }
  }
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>' + escH(brand) + ': photograph credits</title>\n<link rel="stylesheet" href="assets/system.css">\n</head>\n<body>\n<main class="wrap">\n  <p><a class="link" href="index.html">' + escH(brand) + '</a></p>\n' + body + '\n</main>\n</body>\n</html>\n';
}
// credits: the footer line and the list block for the photographs the pages really use (a fetched file left out of the page is not credited)
function creditsCmd() {
  const out = opt('out');
  if (!out || out === true) die('usage: photos.mjs credits --out <site folder> [--dir assets/img] [--page index.html] [--adapted id,id] [--href credits.html] [--write] [--text]');
  const dir = path.join(out, opt('dir', path.join('assets', 'img')));
  let cred;
  try { cred = JSON.parse(fs.readFileSync(path.join(dir, 'credits.json'), 'utf8')); } catch { die('no credits.json in ' + dir + ': fetch first'); }
  const href = opt('href') && opt('href') !== true ? String(opt('href')) : 'credits.html';
  const pages = opt('page') && opt('page') !== true ? [path.join(out, opt('page'))] : fs.readdirSync(out).filter((f) => f.endsWith('.html') && f !== href).map((f) => path.join(out, f));
  const html = pages.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const adapted = new Set(String(opt('adapted', '')).split(',').filter(Boolean));
  const on = (c) => new RegExp('photo-' + escRe(c.id) + '(?![0-9A-Za-z])').test(html);
  const gen = cred.photos.filter((c) => on(c) && c.source === 'Generated');
  if (gen.length) console.log('generated (no credit line; name them in the build report): ' + gen.map((c) => c.id + ' (' + (c.model || 'gpt-image') + ')').join(', '));
  const used = cred.photos.filter((c) => on(c) && c.source !== 'Generated').map((c) => ({ ...c, adapted: adapted.has(c.id) }));
  const unused = cred.photos.filter((c) => !on(c)).map((c) => c.id);
  if (!used.length) { if (gen.length) { console.log('every picture on the page is generated: no credit line is needed'); return; } die('none of the fetched photographs is on the page'); }
  const line = creditLine(used, href);
  const text = /<a [^>]*>(.*?)<\/a>/.exec(line)[1];
  if (opt('text')) console.log(creditText(used));
  else if (opt('write')) {
    const brand = ((/<title>([^<:]*)/i.exec(html) || [])[1] || 'Home').trim() || 'Home';
    fs.writeFileSync(path.join(out, href), creditsPage(out, href, used, brand));
    console.log('wrote ' + path.join(out, href) + ' (' + used.length + ' credits, in the site\'s legal-page shell)\n\nthe footer line, in the legal row (the only credit in the footer):\n' + line);
  } else {
    console.log('1. the footer line, in the legal row (replacing starter.html\'s credits block): ONE line, no credit per photograph\n\n' + line + '\n\n2. the list: its own page (' + href + ', or: node ' + cmdPath(path.join(HERE, 'photos.mjs')) + ' credits --out ' + cmdPath(out) + (opt('dir') && opt('dir') !== true ? ' --dir ' + opt('dir') : '') + ' --write) or a block outside the footer\n\n' + creditList(used));
    console.log('\n(never a credit under a picture, never a link per photograph in the footer: consistency.mjs FAILs both)');
  }
  if (text.length > 110) console.log('WARNING: the footer line is ' + text.length + ' characters (110 at most): name the sources only');
  if (unused.length) console.log('not on the page, so not credited (delete their files): ' + unused.join(', '));
}

// ------------------------------------------------------------------ panel: pictures behind product UI panels
// (references/cards.md, Panel photos). One set of assets/ui/panel-photos.json is one tone family for the whole page;
// each panel gets one theme of it (three panels at most); then each theme is searched (Pexels, else Wikimedia Commons).
// History: panelPhotos in the --history file (its own key; the last set goes behind, a theme dealt lately goes behind,
// the ids this site's panels used go last).
const PAGE_KINDS = [[/^(software|saas|app|ai|developer|dev-?tools?|fintech|bank)/, 'software'], [/^(tech|hardware|device)/, 'tech'],
  [/^(product|brand|goods)/, 'product'], [/^service/, 'service'], [/^(editorial|magazine|journal|blog|publication|newsletter|long-?form|long-?read)/, 'editorial'],
  [/^(gaming|game)/, 'gaming'], [/^place/, 'place']];
const pageKind = (w) => { const k = String(w || '').toLowerCase().trim(); const hit = PAGE_KINDS.find(([re]) => re.test(k)); return hit ? hit[1] : ''; };
const GROUNDS = ['sand', 'sky', 'sage', 'painting'];
function listPanelSets(D) {
  if (opt('json')) { console.log(JSON.stringify(D, null, 1)); return; }
  console.log(`panel photo sets (${slash(PANEL_FILE)}): one set a page, one theme per panel, ${D.rules.perPage} panels at most\n`);
  for (const s of D.sets) {
    console.log(`  ${s.id.padEnd(19)} ${s.family.padEnd(8)} grounds ${s.grounds.join(', ').padEnd(17)} colour ${s.color}  pages ${s.pages.join(', ')}`);
    console.log(`  ${''.padEnd(19)} moods: ${s.moods.slice(0, 12).join(', ')}${s.moods.length > 12 ? ', ...' : ''}`);
    console.log(`  ${''.padEnd(19)} themes: ${s.themes.join(', ')}`);
  }
  console.log(`\nnever on ${D.rules.never.join(' or ')}: ${Object.values(D.rules.why).join('; ')}`);
}
async function panelCmd() {
  const D = panelSets();
  if (opt('sets')) return listPanelSets(D);
  const page = pageKind(opt('page'));
  if (!page) die('usage: photos.mjs panel --page software|tech|product|service|editorial --mood "<word>" [--count 1|2|3] [--set <id>] [--ground sand|sky|sage|painting] [--dark] [--history .taste-skill/history.json] [--out .] [--per 4] [--no-search] [--json]   (panel --sets lists the sets)');
  if (D.rules.never.includes(page)) {
    const why = D.rules.why[page] || 'no UI panels on this kind';
    if (opt('json')) console.log(JSON.stringify({ page, refused: true, why, themes: [] }, null, 1));
    else console.log(`NO PANEL PHOTOS on a ${page} page: ${why}.`);
    return;
  }
  const asked = parseInt(opt('count', D.rules.perPage), 10) || D.rules.perPage;
  const count = Math.max(1, Math.min(D.rules.perPage, asked));
  const notes = [];
  if (asked > D.rules.perPage) notes.push(`--count ${asked}: ${D.rules.perPage} panel photos a page at most; the other panels keep the lit ground, a diagram or a flat panel`);
  const moodWords = (typeof opt('mood') === 'string' ? opt('mood') : '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  const out = typeof opt('out') === 'string' ? opt('out') : '.';
  // the page's lit ground (sand, sky, sage, painting): --ground, else <html data-ground> of the page in --out
  let ground = typeof opt('ground') === 'string' ? opt('ground').toLowerCase() : '';
  if (ground && !GROUNDS.includes(ground)) die('--ground takes ' + GROUNDS.join(', '));
  if (!ground) { try { const m = /<html\b[^>]*\sdata-ground="(\w+)"/i.exec(fs.readFileSync(path.join(out, 'index.html'), 'utf8')); if (m && GROUNDS.includes(m[1])) { ground = m[1]; notes.push(`the ground is ${ground}, read from ${slash(path.join(out, 'index.html'))}`); } } catch { /* no page yet */ } }
  const dark = !!opt('dark');
  const seed = opt('seed') && opt('seed') !== true ? String(opt('seed')) : Math.random().toString(36).slice(2, 8);
  const histFile = opt('history');
  const H = readPanelHistory(histFile);
  const rnd = rngFrom(`${seed}|${page}|${H.deals.length}`);
  const lastSets = H.deals.slice(-3).map((d) => d.set).filter(Boolean);
  let set, why = [];
  if (opt('set') && opt('set') !== true) {
    set = findSet(opt('set'));
    if (!set) die(`no panel set "${opt('set')}": ${D.sets.map((s) => s.id).join(', ')}`);
    why.push('asked for with --set');
    if (!set.pages.includes(page)) notes.push(`${set.id} is not made for a ${page} page (its pages: ${set.pages.join(', ')})`);
  } else {
    const fit = D.sets.filter((s) => s.pages.includes(page));
    const scored = fit.map((s) => {
      const words = new Set([...s.moods, ...setKey(s.name).split('-'), s.family]);
      const hits = moodWords.filter((w) => words.has(w));
      const groundFit = !!ground && s.grounds.includes(ground);
      let score = hits.length * 2 + (groundFit ? 1.5 : 0) + rnd() * 0.6;
      if (lastSets.at(-1) === s.id) score -= 4; else if (lastSets.includes(s.id)) score -= 1.5;
      return { s, score, hits, groundFit };
    }).sort((a, b) => b.score - a.score);
    const top = scored[0];
    set = top.s;
    if (top.hits.length) why.push(`mood ${top.hits.map((w) => `"${w}"`).join(', ')}`);
    else if (moodWords.length) why.push(`no set names the mood "${moodWords.join(' ')}"`);
    if (top.groundFit) why.push(`fits the ${ground} ground`);
    else if (ground) why.push(`no set of this mood fits the ${ground} ground: the tone veil (the ground's own colour) brings it to the page`);
    if (lastSets.length) why.push(`the last set dealt here (${lastSets.at(-1)}) goes behind`);
  }
  // one theme per panel: the ones the last four deals of this set did not use first, in the seed's order
  const usedThemes = new Set(H.deals.filter((d) => d.set === set.id).slice(-4).flatMap((d) => d.themes || []));
  const themes = set.themes.map((t) => [t, (usedThemes.has(t) ? 1 : 0) + rnd()]).sort((a, b) => a[1] - b[1]).map(([t]) => t).slice(0, count);
  const usedIds = new Set(H.deals.flatMap((d) => d.used || []));
  const look = panelLook(set);
  const deal = { set: set.id, page, ...(moodWords.length ? { mood: moodWords.join(' ') } : {}), ...(ground ? { ground } : {}), themes, ids: [], seed, at: new Date().toISOString() };

  let source = '', groups = [], failed = [];
  const recent = recentIds(readRecent(), '');
  // the source: --source, else RASYA_IMAGE_SOURCE (openai|pexels|commons), else OpenAI when OPENAI_API_KEY is set, else Pexels
  const envSrc = String(process.env.RASYA_IMAGE_SOURCE || '').toLowerCase().trim();
  const askedSrc = typeof opt('source') === 'string' ? opt('source').toLowerCase() : envSrc;
  const wantGen = askedSrc === 'openai' || (!askedSrc && !!openaiKey());
  if (wantGen && !openaiKey()) console.error(OPENAI_HINT + '; searching Pexels or Wikimedia Commons instead');
  if (wantGen && openaiKey() && !opt('no-search')) {
    // generate one picture per theme from the set's prompt (OpenAI gpt-image), in place of the search
    const orient = opt('orientation') && opt('orientation') !== true ? opt('orientation') : set.orientation;
    const { made, failed: f } = await generatePictures({ out, prompts: themes.map((t) => ({ theme: t, prompt: `${set.prompt}; the subject: ${t}` })), orientation: orient, set, panel: true });
    source = 'openai';
    groups = themes.map((t) => ({ theme: t, photos: made.filter((m) => m.theme === t) }));
    failed.push(...f);
    deal.source = 'openai';
    deal.ids = made.map((m) => m.id);
  } else if (!opt('no-search')) {
    source = typeof opt('source') === 'string' ? sourceOf('pexels') : (SOURCES[envSrc] ? envSrc : 'pexels');
    if (source === 'pexels' && !pexelsKey()) { console.error(PEXELS_HINT); source = 'commons'; }
    const per = Math.max(1, Math.min(12, parseInt(opt('per', 4), 10) || 4));
    const min = Math.max(800, parseInt(opt('min', 1600), 10) || 1600);
    const orient = opt('orientation') && opt('orientation') !== true ? opt('orientation') : set.orientation;
    const color = opt('color') && opt('color') !== true ? opt('color') : set.color;
    for (const [i, t] of themes.entries()) {
      const o = { per: per + 4, min, orient, color, size: opt('size'), recent, tradeWord: '', panel: true, set: set.id };
      const r = source === 'pexels' ? await pexelsSearch([t], o) : await commonsSearch([t], o);
      // the ids this site's panels used before go last; never one photograph under two themes
      r.results.sort((a, b) => (usedIds.has(a.id) ? 1 : 0) - (usedIds.has(b.id) ? 1 : 0));
      groups.push({ theme: t, photos: r.results.filter((p) => !groups.some((g) => g.photos.some((q) => q.id === p.id))).slice(0, per) });
      failed.push(...r.failed);
      if (r.failed.some((f) => /refused the key|rate limit/.test(f))) break;
      if (source === 'commons' && i < themes.length - 1) await sleep(1200);   // Commons answers 429 to quick runs
    }
    storeFound(out, groups.flatMap((g) => g.photos));
    deal.source = source;
    deal.ids = groups.map((g) => (g.photos[0] || {}).id).filter(Boolean);
    deal.filters = { orientation: orient, ...(source === 'pexels' ? { color } : {}), min };
  }
  H.deals.push(deal);
  writePanelHistory(histFile, H);
  const firsts = groups.map((g) => (g.photos[0] || {}).id).filter(Boolean);
  const fetchLine = `node ${cmdPath(path.join(HERE, 'photos.mjs'))} fetch --panel ${firsts.length ? firsts.join(',') : '<id,id,id>'} --out ${out === '.' ? '.' : cmdPath(out)}${histFile && histFile !== true ? ' --history ' + histFile : ''}`;
  if (opt('json')) { console.log(JSON.stringify({ ...deal, name: set.name, family: set.family, why, look, notes, prompt: set.prompt, groups, failed, next: fetchLine }, null, 1)); return; }

  console.log(`panel photos for a ${page} page: ${set.id} ("${set.name}", ${set.family} family; seed ${seed})`);
  if (why.length) console.log(`  why: ${why.join('; ')}`);
  console.log(`  the look, the same on every panel (or once on <html>; cards.css reads it):\n    ${look}${dark ? '\n    a dark page: the veil stays light (--pp-k-dark), so the panel is clearly lighter than the card (3:1), never a dark photo behind dark UI' : ''}`);
  console.log(`  ${themes.length} theme${themes.length === 1 ? '' : 's'}, one per panel (one set, one tone family):`);
  themes.forEach((t, i) => console.log(`    ${i + 1}  ${t}`));
  if (!opt('no-search')) {
    console.log(source === 'openai' ? `\n${SOURCE_LABEL.openai} (${genModel()}, quality ${genQuality()}):` : `\n${SOURCES[source]} (${searchFilters(source, { min: deal.filters.min, orient: deal.filters.orientation, color: deal.filters.color })}):`);
    groups.forEach((g, i) => {
      console.log(`  ${i + 1}  ${g.theme}${g.photos.length ? '' : '  (nothing fits: another theme with --set ' + set.id + ' --no-search, or search other words)'}`);
      for (const p of g.photos) {
        console.log(`     ${p.id.padEnd(11)} ${String(p.width + 'x' + p.height).padEnd(10)} ${p.orientation.padEnd(9)} ${(source === 'pexels' ? 'Photo by ' : '') + p.by.slice(0, 40)}${usedIds.has(p.id) ? '  [this site used it before]' : recent.has(p.id) ? '  [another build used it lately]' : ''}`);
        console.log(`     ${''.padEnd(11)} ${p.page}`);
      }
    });
    if (failed.length) console.log('\nnot searched: ' + failed.join('; '));
  }
  if (notes.length) console.log('\n' + notes.map((n) => '- ' + n).join('\n'));
  console.log(`\n- ${D.rules.look}
- one photograph per panel, ${D.rules.perPage} a page at most, every one from ${set.id}; the panel (or plate) holds no data-fx; nothing is written on the photograph: the UI window carries the words
- then (the first of each theme; swap in the ids you kept): ${fetchLine}
  (the hero's .hero__art or the app frame's .photo-plate: --plate <id>; credits lists them like any other photograph)`);
  if (!histFile || histFile === true) console.log('(no --history: the next deal may repeat this set and these themes)');
}

if (cmd === 'pick') pick();
else if (cmd === 'panel') await panelCmd();
else if (cmd === 'list') list();
else if (cmd === 'fetch') await fetchCmd();
else if (cmd === 'search') await searchCmd();
else if (cmd === 'credits') creditsCmd();
else if (cmd === 'generate') await generateCmd();
else if (cmd === 'recipe-assets') await recipeAssetsCmd();
else if (cmd === 'styles') stylesCmd();
else { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\n?/, '')); process.exitCode = cmd ? 1 : 0; }
