# Hero recipes

The hero template (`assets/layout/hero-<id>.html`, dealt by `deal.mjs`) is only the frame: where the h1, the line,
the button and the picture stand. A **recipe** is the picture: a visual idea rebuilt from one to three named reference
heroes, with this page's own assets and an interaction. Rasya's ten newest pages all put a product UI window in the
hero whatever template they were dealt; the library exists so the hero is the work, made for this client, and not the
same window every time.

The library: `assets/layout/recipes/` (index.json, one folder a recipe, `_shared/`). The dealer: `scripts/hero.mjs`.
The reference pictures: `references/visual/hero/` (26 hero.gallery folds with their motion strips, 37 Saaspo heroes).

## 1. The run

1. `deal.mjs` deals the template (layout-v4.md section 3). A place stops here: its hero is its own photograph.
2. Deal the recipe, from the project folder:

   ```bash
   node <skill>/scripts/hero.mjs pick --page <kind> --template <dealt hero id> [--has ui,video,datum,object,logo] --brief brief.md --history .taste-skill/history.json
   ```

   It prints the recipe and its variant, the reference pictures, the files and the mount for the dealt template, the
   interaction, the still, the asset specs with their prompts filled from the brief, and the asset command. A subject
   recipe (a globe, a massing model, a scan, a prompt box ...) is dealt only when the brief is about its subject, so
   always pass `--brief`. `--recipe <id>` prints one without dealing it (nothing recorded).
3. **Open every reference picture it lists** (Read the `-fold.jpg`, and the `-motion.jpg` strip when there is one) and
   write on plan line 2 what the move is: the composition, the technique, the interaction. Then forget the brand.
4. Make the assets (section 4), then build: paste the mount into the template's slot, link the files, fill the data.
5. Check: `node <skill>/scripts/hero.mjs check index.html --history .taste-skill/history.json`, then the usual layout
   check and screenshots. Read the hero at 1440, 820 and 390 against its references.

## 2. Recreate the move, not the brand

Upstream says never copy a reference site's signature effect (SKILL.md section 6; effects-usage.md, Never). **This
library relaxes that rule into: rebuild the technique with our own assets.** What may be taken from a reference:

- the composition: where the words stand, where the picture stands, how big, what is cut by the fold;
- the technique: a wireframe drawn in three.js, letters as a window onto a photograph, a field of objects in depth, a
  light behind the words;
- the interaction: what the pointer, a drag, the scroll or a hover does, and how fast.

What is never taken: the reference's words, its name or logo, its pictures, its product, its characters or mascot, its
brand colours (the palette is the page's, `start.mjs`), and its code or files. A Yellow3D-like hero on a page is a
wireframe of *this client's* subject in *this page's* accent, with *this client's* sentence beside it.

## 3. The library

Twelve recipes. Software is dealt from most of them; every other kind from the photo-, illustration- and CSS-led ones.

| id | refs | technique | kinds | templates | interaction |
|---|---|---|---|---|---|
| `wireframe-figure` | Yellow3D | three | software, gaming, tech | split, photo, product, statement | the head turns to the pointer, draws itself once, lowers its gaze on scroll |
| `massing-model` | Arcol, Intrepid | three | software, tech | plate, product, split, masthead | floors rise once, drag turns it, hover reads a floor in the card |
| `object-drift` | Cosmos, Flora | css | software, product, editorial | centred, statement, product | drifts toward the visitor, the pointer steers (kind other: the pointer only) |
| `type-mask` | Donprod, Infinite Machine, Remote | css (canvas for a film) | software, service, editorial | statement, plate | the picture moves inside the letters with the pointer and the scroll |
| `bleed-photo` | Cometeer, Jot, Sauz, Shopify | image (video) | every kind | photo, film | tech: 6px pointer drift, 6% scroll ease; other: still |
| `illustration-scene` | Family, Clay, Twin | image | software, service, editorial | centred, statement, plate | pops in once, parallax by depth, a piece hops under the pointer |
| `shader-light` | Raycast, Reflect, Lovable | webgl (the kit's effects) | software | centred, statement, word | leans toward the pointer; the effect's own slow motion |
| `globe-orbit` | Wise | three | software, tech | plate, centred, statement, split, product | drag spins it, routes light up, objects swing in front |
| `output-stack` | Recraft, Krea, Audienceful | css | software, service, editorial | split, masthead, plate, triptych, collage | buttons, drag, arrow keys; deals itself every 3.2 s on software |
| `prompt-demo` | Lovable, Perplexity, Fruitful | css | software | centred, plate, split, collage | the visitor asks and gets the client's answer; types its examples while untouched |
| `product-ui` | Linear, Stacks, Attio | css | software, tech | collage, centred, plate, split, masthead, triptych, product | cropped (steps), zoomed (scroll out), angled (stands up once, flat at rest) |
| `scan-canvas` | Scale | canvas | software, tech | plate, film, split, product | boxes found one by one, a crosshair with coordinates |

`product-ui` is ONE recipe among twelve: the dealer gives it at most one page in five of a kind and a fifth of the
pool, and `hero.mjs check` WARNs `hero-ui-default` when a product window led three of the last five pages.

`hero.mjs list [--page <kind>] [--template <id>]` prints what fits; `hero.mjs lint` checks index.json against the files.

**Next** (written up in index.json `next`, not built): `sculpture` (Krea, Perplexity: a chrome or clay object, or the
client's logo extruded, turning to the pointer), `photo-orbit` (Flora, ElevenLabs: six framed photographs in depth round
the words), `object-before-word` (Airform, Oura, Infinite Machine: the product cut-out in front of its giant name),
`machine-lineup` (Intrepid: the client's machines in a row with an index), `reel-viewfinder` (Donprod: the scroll runs
a reel of clips through a viewfinder), `ascii-field` (Griffin: a field of digits shaped as a horizon), `screen-in-photo`
(Wand: the live screen mapped onto a device in a photograph; needs a tilt exemption).

## 4. The assets

A recipe lists the pictures it needs in `index.json` (`assets`), each `{ slot, kind, style, prompt, count, ratio,
transparent, optional }`. The prompts are written as an art director briefs a shoot: the subject, the material, the
light, the lens or style, and one tone word; `{product}`, `{audience}`, `{world}` and `{palette}` come from the brief
(lines "Product: ..", "Audience: ..", "World: ..", "Palette: .."). No picture carries words.

```bash
node <skill>/scripts/photos.mjs recipe-assets --recipe <id> --brief brief.md --out .     # agent A2's tool: generates each slot in its style
```

Then fetch them as `photos.md` says and put each file on its element with `data-rr-slot="<slot>"` (an `img src`, a
`video src` and `poster`, or `data-rr-src` for a model). The order on a page: the hero deal (`deal.mjs`, then
`hero.mjs pick`), the copy, then the recipe's assets, then the other photographs, so the page's one image style
(`assets/ui/image-styles.json`, recorded by the first picture) is the hero's.

- A generated picture shows the client's **world**, never its product, its people or its premises passed off as real.
  A product or a service shows its own photographs (or stand-ins of the same kind, listed in the report): on those
  pages the prompt is the shot list for the client's photographer, or the brief for a stand-in search.
- A 3D model (`model3d`) is the client's own, or a CC0 or MIT one credited in NOTICE.md. No unlicensed model. Without
  one, the procedural figure stands (`wireframe-figure` builds its bust from rings in code).
- The demos' pictures are stand-ins: the kit's own licensed demo photographs (`assets/layout/img/credits.json`,
  `assets/photos/img`) and shapes drawn in code (`demo-*.svg`). `hero.mjs check` FAILs a `demo-*` file on a page and WARNs
  a kit demo photograph.

## 5. Interaction and the still state

- **Every recipe has a still,** shown first and kept under reduced motion, on a phone (under 640px) for WebGL and
  canvas, without WebGL, and when the page's four live contexts are taken. The three.js recipes draw theirs as an SVG
  from the same geometry and camera (no WebGL, no file, in the page's colours); the CSS and image recipes are their own
  markup at rest; `shader-light` takes the kit effect's still; `scan-canvas` draws its boxes once.
- **WebGL never blocks the h1.** three.js (exactly `three@0.170.0` from jsDelivr, its `+esm` build, so the core and
  the addons are one copy) loads lazily, once a page, inside `rtMotion.onReady`, after the hero has painted; the live
  canvas fades in over the still once it has drawn. A failed load leaves the still (`data-rr-why`).
- **The context cap:** a recipe takes one of the page's live WebGL contexts through `window.__tpGl` /
  `window.__tpGlMax` (default 4), the count fx.js, the scenes and the objects keep, or stays still. A WebGL or
  canvas recipe is the page's one effect: no other effect, scene or WebGL moment beside it.
- **The interaction is the reference's:** the pointer (turn, lean, steer, parallax by depth), a drag (spin, turn), the
  scroll (a gaze, a zoom-out, the picture sliding in the letters), a hover (a floor lit, a piece hopping), a real input
  (the prompt box). The pointer never moves body text; nothing tilts at rest (`product-ui`'s angled variant stands up
  once on load and rests flat); idle 3D renders on demand, so a still hero costs nothing.
- **Self motion** (a drift, a turning globe, a stack dealing itself, a prompt typing its examples) runs only on
  software, gaming and tech, only on screen, holds on hover and focus where it carries content, and has the kit's
  pause button (`.loop-pause`) because it moves for more than 5 s.
- A recipe's scroll part is a scrub of the hero leaving (`start: 'top top', end: 'bottom top'`), made inside
  `rtMotion.onReady`; it is not one of the page's dealt moments.

## 6. The kind rules

- **WebGL and canvas** (`three`, `webgl`, `canvas`) only on software, gaming and tech. On product, service and
  editorial (site-kind other) the recipe is photo-, illustration- or CSS-led and nothing moves by itself: the pointer
  and the hero's entrance only (`object-drift` rests in its slots there, `output-stack` waits for the visitor,
  `type-mask` shows a still photograph, `bleed-photo` is still, a film is its poster until clicked).
- **A place** is never dealt a recipe (its hero is printed: hero-place, its own photograph).
- **The subject before the effect:** `shader-light` is software only and never where a product, a device or a game's
  world can be shown; a game's hero is its world or its character (`wireframe-figure`, `bleed-photo`), never a mood.
- `recipe-kit.js` holds the kind rule in the browser too (`allowance()`): a WebGL recipe on a page whose
  `meta[name="site-kind"]` is other stays on its still, whatever the markup says.

## 7. Mounting one

```html
<div class="rr rr--<id>" data-recipe="<id>" [data-rr-variant=".."] role="img" aria-label="what the picture shows">
  <div class="rr-still" data-rr-draw></div>            (three.js recipes: the still recipe.js draws)
  <img data-rr-slot="<slot>" src="assets/img/.." alt="">   (each asset, as index.json names its slot)
</div>
<link rel="stylesheet" href="assets/layout/recipes/_shared/recipes.css">   (once, after layout.css)
<link rel="stylesheet" href="assets/layout/recipes/<id>/recipe.css">
<script type="module" src="assets/layout/recipes/<id>/recipe.js"></script>   (after scroll.js)
```

- The mount fills the template's picture slot (`.hero__media`, `.hero__art`, `.hero__stage`, `.hero__window`,
  `.hero__plate`, a triptych panel), or is the hero's layer (`rr--layer`, first child of the section; in the photo
  hero it carries `hero__bg`). `index.json` `mount.slots` names the slot for each template, and `hero.mjs pick` prints it.
- The mount draws its own ground and is one picture with a role and a label: **one part** of the hero (layout-v4.md
  section 3). What it holds (a readout card, a field of objects, a stack) stands in the recipe's own declared slots in
  its `recipe.css`, never at an offset a page picks: rule 5 and rule 7 extended to the recipe's slots.
- `role="group"` for a control (the stack, the prompt box), with a visible label on any field. The hero's primary
  button stays in the h1 block.
- Copy only the `.rr` mount from a demo (`assets/layout/recipes/<id>/recipe.html`); every word, number and picture
  becomes the client's. The demos run in a browser over http (`effects.mjs serve`, or `shoot.mjs`).

## 8. The check

`node <skill>/scripts/hero.mjs check index.html [--history .taste-skill/history.json]` reads the page without a browser:

- the recipe is mounted in the hero, one only, known, for this kind (FAIL: a WebGL recipe on kind other, any recipe on
  a place) and built for this template (WARN);
- its `recipe.js`, `recipe.css` and the shared CSS are linked and there;
- its mount has a role and a label (an image recipe: its alt);
- its still: a `.rr-still` on a three.js recipe, `data-fx` on `shader-light`;
- every required asset slot filled with a file that exists, no demo stand-in (FAIL), a kit demo photograph flagged
  (WARN);
- its data: the floors, the boxes, the routes, the answers, the word, the window;
- the one-effect rule, and one copy of three.js;
- `hero-ui-default` (WARN): a product UI window in the hero on three of the last five pages of this kind (history
  `heroRecipes`).

## 9. Adding a recipe

A folder `assets/layout/recipes/<id>/` with `recipe.js` (imports `../_shared/recipe-kit.js`, `mountAll('<id>', ..)`,
the still first, `allowance()` for the kind and motion, `whenReady()` before anything heavy, `loadThree()` for
three.js, `makeRenderer()` for the context cap, `loop()` for frames on screen only, `pauseButton()` for self motion),
`recipe.css` (palette tokens only; no gradient, filter, mask or blend on a recipe that serves kind other), a
`recipe.html` demo on a hero template, and its entry in `index.json` (every field in `fields`). Then `hero.mjs lint`,
`node --check`, and a headless shot with `shoot.mjs`.
