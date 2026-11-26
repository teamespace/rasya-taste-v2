/*
  rasya-taste kit-assets.mjs - the kit's pictures, kept out of git (rasya v4.5).

  Every JPEG, PNG and WebP of the skill (the photograph library, the demo pictures, the hero references, the object
  renders) and the icon demo's copies (assets/icons/demo/) live in one archive on the repository's GitHub Release, not in
  git, so a clone stays small. ensureKitAssets() puts them back where they always were, inside the skill folder, the first
  time a dealer runs (start.mjs, deal.mjs, hero.mjs, photos.mjs): the same files, byte for byte, so every page, script and
  demo works as before. A folder that already holds every file (scripts/lib/kit-assets.txt) downloads nothing.

    node <skill>/scripts/assets.mjs            put the pictures in place (downloads 29.5 MB once)
    node <skill>/scripts/assets.mjs --check    say whether they are in place

  Env: RASYA_TASTE_ASSETS_FILE=<path to the archive> unpacks a local copy (offline); RASYA_TASTE_ASSETS_URL=<url> a mirror.
  The archive is checked against its SHA-256 before it is unpacked. Needs tar (macOS, Linux and Windows 10+ have it).
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KIT_ASSETS = {
  version: 'assets-v1',
  file: 'rasya-taste-v4-assets-v1.tar.gz',
  sha256: '85f1cd8818545e5c2f782a0fa2918707de5aa7ac9edf512d2974e4ae27bd72d0',
  mb: 29.5,
  url: 'https://github.com/teamespace/rasya-taste-v2/releases/download/assets-v1/rasya-taste-v4-assets-v1.tar.gz',
};
const LIST = path.join(SKILL, 'scripts', 'lib', 'kit-assets.txt');
const LOCK = path.join(SKILL, '.kit-assets.lock');
const say = (m) => process.stderr.write(`rasya-taste assets: ${m}\n`);

export function kitAssetList() {
  return fs.readFileSync(LIST, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
}

export function missingKitAssets() {
  return kitAssetList().filter((rel) => !fs.existsSync(path.join(SKILL, rel)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function archiveBytes() {
  const local = process.env.RASYA_TASTE_ASSETS_FILE;
  if (local) return fs.readFileSync(path.resolve(local));
  const url = process.env.RASYA_TASTE_ASSETS_URL || KIT_ASSETS.url;
  say(`downloading the kit's pictures, ${KIT_ASSETS.mb} MB, once (${url})`);
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { last = e; await sleep(1500 * (i + 1)); }
  }
  throw new Error(`could not download ${url}: ${last && last.message}`);
}

async function unpack() {
  const buf = await archiveBytes();
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  if (sha !== KIT_ASSETS.sha256) throw new Error(`the archive's SHA-256 is ${sha}, expected ${KIT_ASSETS.sha256}`);
  const tmp = path.join(os.tmpdir(), `rasya-taste-assets-${process.pid}.tar.gz`);
  fs.writeFileSync(tmp, buf);
  try {
    const r = spawnSync('tar', ['-xzf', tmp, '-C', SKILL], { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.error) throw new Error(`tar did not run: ${r.error.message}`);
    if (r.status !== 0) throw new Error(`tar failed: ${String(r.stderr || '').trim().slice(0, 300)}`);
  } finally { fs.rmSync(tmp, { force: true }); }
}

// Puts every listed file in place. Resolves to true when all are there; on failure it says why on stderr and resolves
// to false (throws only with { strict: true }), so a dealer that needs no picture still prints its deal.
export async function ensureKitAssets({ strict = false } = {}) {
  try {
    if (!missingKitAssets().length) return true;
    // one unpacker at a time: another build that holds the lock is waited for (a lock older than 10 min is stale)
    for (;;) {
      try { fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); break; } catch (e) {
        if (e.code !== 'EEXIST') throw e;
        let age = 0; try { age = Date.now() - fs.statSync(LOCK).mtimeMs; } catch { continue; }
        if (age > 600000) { fs.rmSync(LOCK, { force: true }); continue; }
        await sleep(1000);
        if (!missingKitAssets().length) return true;
      }
    }
    try {
      if (missingKitAssets().length) await unpack();
    } finally { fs.rmSync(LOCK, { force: true }); }
    const left = missingKitAssets();
    if (left.length) throw new Error(`${left.length} files still missing after unpacking (first: ${left[0]})`);
    say(`the kit's pictures are in place (${kitAssetList().length} files)`);
    return true;
  } catch (e) {
    if (strict) throw e;
    say(`${e.message}. Pages will lack the kit's pictures until \`node ${path.join(SKILL, 'scripts', 'assets.mjs')}\` succeeds ` +
      '(offline: RASYA_TASTE_ASSETS_FILE=<archive>).');
    return false;
  }
}
