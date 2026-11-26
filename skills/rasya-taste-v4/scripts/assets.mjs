#!/usr/bin/env node
/*
  rasya-taste assets.mjs - puts the kit's pictures in the skill folder (scripts/lib/kit-assets.mjs says why they are not
  in git). The dealers do this on their own the first time; run it by hand after a fresh clone, or to check.

    node <skill>/scripts/assets.mjs            download (29.5 MB, once) and unpack; exit 1 when it fails
    node <skill>/scripts/assets.mjs --check    exit 0 when every file is in place, 1 when some are missing
*/
import { ensureKitAssets, missingKitAssets, kitAssetList, KIT_ASSETS } from './lib/kit-assets.mjs';

if (process.argv.includes('--check')) {
  const left = missingKitAssets(), all = kitAssetList().length;
  console.log(left.length ? `missing ${left.length} of ${all} files (first: ${left[0]})` : `all ${all} files in place (${KIT_ASSETS.version})`);
  process.exit(left.length ? 1 : 0);
}
try {
  await ensureKitAssets({ strict: true });
  console.log(`all ${kitAssetList().length} files in place (${KIT_ASSETS.version})`);
} catch (e) {
  console.error(`rasya-taste assets: ${e.message}`);
  process.exit(1);
}
