# Notice

rasya-taste-v4 is a fork of Taste Skill 2.5.1 (github.com/Leonxlnx/taste-skill, `skills/taste-skill`, commit 6c0b5c7), copyright (c) 2026 Leonxlnx, MIT licence (see LICENSE, kept unchanged).

Changes in this fork are listed in CHANGES-rasya.md. The unmodified upstream copy lives in `skills/vendor/taste-skill-2.5.1/` for comparison.

## Background ideas

The background library (`assets/backgrounds/bg-library.*`) was written for this fork after looking at these
21st.dev components; no code was copied, and none of the pages read showed a licence:
dot pattern (designali-in, after Magic UI), vignette grid background (molecule-lab-rushil), background
snippets (ibelick), gradient blur bg (meghtrix), aurora background (manuarora700), beams background
(kokonutd), grid pulse (carolinaraulino), blueprint gradient mesh (larsen66), luminous topography (rmahammad),
paper texture (meghtrix).

## Button ideas

The button library (`assets/buttons/buttons-library.*`) was written for this fork after looking at these 21st.dev
components (and rasya-taste-v2's devices B1-B8); no code was copied, and none of the pages read showed a licence:
interactive hover button and shiny button (dillionverma, Magic UI), flow hover button (vaib215), shine hover
(shadcnspace), texture button (cult-ui), morphing arrow button (arunachalam), hover button (mrhyddenn), button retro
(serafimcloud), tactile 3D button (bidyut10), entry ring button (ham7a311), kbd button (uiable), hotkey button
(azabroflovski), button with count badge (sean0205), split button (shadcn), button (wensity).

## Hero recipes (v4.3)

- **three.js** 0.170.0 (MIT, copyright 2010-2024 three.js authors) is loaded at runtime from jsDelivr
  (`three@0.170.0/+esm` and its `examples/jsm` addons) by `assets/layout/recipes/_shared/recipe-kit.js`; it is not
  vendored here.
- **No 3D model ships with the kit.** The wireframe figure is a procedural bust built from rings in code. A page that
  mounts a model (`data-rr-src`) uses the client's own, or a CC0 or MIT model credited here with its source and licence.
- **The reference pictures** in `references/visual/hero/` are screenshots of public websites as collected by hero.gallery,
  Saaspo and Land-book, downscaled to 960px for study. The sites, their words, logos, pictures and products belong to
  their owners; the pictures are never shipped on a page, and a recipe takes only a composition, a technique and an
  interaction from them (`references/hero-recipes.md` section 2).
- The demos' stand-ins are the kit's own licensed demo photographs (`assets/layout/img/credits.json`,
  `assets/photos/img`) and shapes drawn in code for this fork (`assets/layout/recipes/*/demo-*.svg`). The globe reuses
  the kit's hand-traced coastline (`assets/objects/print-globe/land.js`).
