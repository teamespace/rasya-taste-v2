/*
  rasya-taste-v4 scripts/lib/history.mjs - the deal history every dealer shares (v4.1, agent I).

  Two histories:
    - the local file a dealer is given with --history (the project's .taste-skill/history.json, or
      layout-history.json for the hero): this site's own deals, read and written as before;
    - the global file, $RASYA_TASTE_HISTORY, default ~/.rasya-taste/history.json: every build on this
      machine appends its picks there, so consecutive nightly builds and builds running side by side
      steer away from each other. RASYA_TASTE_HISTORY=off (or none, 0, false) turns it off for the
      shell; --no-global turns it off for one run.

  A dealer opens the global file, reads the picks of its own key (moments, heroes, palettes, plans ...)
  for its own page kind, merges them with its local list, deals, adds its picks and commits:

    import { openGlobal, readJson, writeJsonAtomic } from './lib/history.mjs';
    const G = openGlobal({ local: histFile, by: 'moments' });       // takes the lock (a few ms)
    const recent = G.recent('moments', { page, local: hist.moments }); // ids, oldest first
    ... deal from recent ...
    G.add('moments', picks.map(p => p.id), { page });                 // queued
    G.commit();                                                        // merge, write, rename, unlock

  recent() leaves out the global entries this same local file wrote (they are in the local list
  already), keeps the other builds' entries of that page kind, and merges both by time; a local entry
  without a time (start.mjs, deal.mjs keep plain ids) counts as the newest. Each dealer applies its own
  window to that list (the last 3 heroes, the last 12 palettes, the moments' cycles ...).

  Safe when two builds deal at once: openGlobal takes an exclusive lock file (<file>.lock, created with
  O_EXCL, broken when its process is gone or it is older than 15 s) and holds it from the read to the
  commit, so the second build reads the first build's picks. commit() re-reads the file, appends the
  queued entries, writes a temp file beside it and renames it over the old one (atomic on one disk).
  Without the lock (4 s wait passed) it still merges and renames, and says so on stderr. Nothing here
  ever stops a deal: a global file that cannot be read or written is skipped with one stderr line.

  Entries in the global file: { id, page, at, by, src, ...extra } where src is the absolute path of the
  local history that wrote it (null without one). Each key keeps its last 400 entries.

  footers.mjs (agent H) and any later dealer: the same five lines, its own key ("footers").
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEEP = 400;          // entries a key keeps in the global file
const LOCK_WAIT = 4000;    // ms to wait for another build's lock
const LOCK_STALE = 15000;  // a lock older than this, or whose process is gone, is broken
const OFF = /^(off|none|no|0|false)$/i;

// the global file, or null when RASYA_TASTE_HISTORY turns it off
export function globalFile(env = process.env) {
  const v = env.RASYA_TASTE_HISTORY;
  if (typeof v === 'string' && v.trim()) {
    if (OFF.test(v.trim())) return null;
    return path.resolve(v.trim().replace(/^~(?=$|[\\/])/, os.homedir()));
  }
  return path.join(os.homedir(), '.rasya-taste', 'history.json');
}
export const noGlobal = (argv = process.argv) => argv.includes('--no-global');

// a JSON object from a file, {} when it is missing, unreadable or not an object
export function readJson(file) {
  if (!file || file === true) return {};
  try {
    const v = JSON.parse(fs.readFileSync(String(file), 'utf8').replace(/^﻿/, ''));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}

// write JSON through a temp file and a rename, so a reader never sees half a file
export function writeJsonAtomic(file, data, { space = 1, newline = true } = {}) {
  const abs = path.resolve(String(file));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.${process.pid}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, space) + (newline ? '\n' : ''));
  try { fs.renameSync(tmp, abs); } catch (e) { try { fs.rmSync(tmp, { force: true }); } catch { /* gone */ } throw e; }
}

const sleepSync = ms => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { const t = Date.now() + ms; while (Date.now() < t) { /* wait */ } } };
function stale(lk) {
  try {
    const st = fs.statSync(lk);
    if (Date.now() - st.mtimeMs > LOCK_STALE) return true;
    const { pid } = JSON.parse(fs.readFileSync(lk, 'utf8'));
    if (pid && pid !== process.pid) { try { process.kill(pid, 0); } catch (e) { return e.code === 'ESRCH'; } }
  } catch { /* half written or gone: not stale yet */ }
  return false;
}
function takeLock(file) {
  const lk = file + '.lock', t0 = Date.now();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (;;) {
    try {
      const fd = fs.openSync(lk, 'wx');
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
      fs.closeSync(fd);
      return lk;
    } catch (e) {
      if (e.code !== 'EEXIST') return null;
      if (stale(lk)) { try { fs.rmSync(lk, { force: true }); } catch { /* another build broke it */ } continue; }
      if (Date.now() - t0 > LOCK_WAIT) return null;
      sleepSync(15 + Math.floor(Math.random() * 30));
    }
  }
}

const norm = x => (typeof x === 'string' ? { id: x } : x && typeof x === 'object' && typeof x.id === 'string' ? x : null);

/*
  openGlobal({ local, by, enabled, argv }) -> { file, recent(key, { page, local }), add(key, items, extra), commit(), close() }
    local    the local --history path (its global entries are not counted twice)
    by       the dealer's name, kept on each entry
    enabled  false for a run that records nothing (a --stats run, a forced --hero)
*/
export function openGlobal({ local = null, by = '', enabled = true, argv = process.argv } = {}) {
  const src = local && local !== true ? path.resolve(String(local)) : null;
  const file = enabled && !noGlobal(argv) ? globalFile() : null;
  const pending = {};
  const off = {
    file: null, locked: false,
    recent: (key, { local: mine = [] } = {}) => (Array.isArray(mine) ? mine : []).map(norm).filter(Boolean).map(e => e.id),
    add() {}, commit() {}, close() {},
  };
  if (!file) return off;
  let lk = null, data = {};
  try {
    lk = takeLock(file);
    if (!lk) console.error(`history: ${file} is locked by another build; reading it without the lock`);
    data = readJson(file);
  } catch (e) {
    console.error(`history: the global history ${file} is skipped (${e.message})`);
    if (lk) { try { fs.rmSync(lk, { force: true }); } catch { /* gone */ } }
    return off;
  }
  let held = !!lk;
  const release = () => { if (held) { held = false; try { fs.rmSync(lk, { force: true }); } catch { /* gone */ } } };
  process.once('exit', release);
  return {
    file, locked: held,
    // ids of this key, oldest first: the other builds' picks of this page kind merged by time with this build's own
    recent(key, { page = null, local: mine = [] } = {}) {
      const own = (Array.isArray(mine) ? mine : []).map(norm).filter(Boolean);
      const others = (Array.isArray(data[key]) ? data[key] : []).map(norm).filter(Boolean)
        .filter(e => !(src && e.src === src))
        .filter(e => !page || !e.page || e.page === page);
      const timed = [...others, ...own.filter(e => e.at)].sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
      return [...timed, ...own.filter(e => !e.at)].map(e => e.id);
    },
    // queue picks for the global file: ids or { id, ...fields }; extra fields go on every entry
    add(key, items, extra = {}) {
      const at = new Date().toISOString();
      for (const it of items || []) {
        const e = norm(it);
        if (e) (pending[key] = pending[key] || []).push({ ...e, ...extra, id: e.id, at: e.at || at, by: by || undefined, src });
      }
    },
    // merge the queued picks into the file as it is now, write a temp file, rename it, unlock
    commit() {
      try {
        if (Object.keys(pending).length) {
          const cur = readJson(file);
          for (const [k, list] of Object.entries(pending)) cur[k] = [...(Array.isArray(cur[k]) ? cur[k] : []), ...list].slice(-KEEP);
          cur.version = 1;
          writeJsonAtomic(file, cur);
          for (const k of Object.keys(pending)) delete pending[k];
        }
      } catch (e) {
        console.error(`history: the global history ${file} was not written (${e.message})`);
      } finally { release(); }
    },
    close: release,
  };
}
