---
name: rasya-taste-v4
description: >-
  rasya-taste-v4 (a fork of tasteskill 2.5.1, MIT), the anti-slop frontend skill for SaaS and editorial sites. Builds professional company websites at the level
  of figma.com and x.ai: plain copy in a voice of its own, one system, one section per screen,
  equal edges, real photographs and real product UI (licensed stand-in photographs when the client
  has none; a product render only when the brief asks for 3D), a hero entrance, Lenis smooth scroll and two
  or three scroll moments on every page, shader effects and scenes only on tech, gaming and software pages, quiet
  micro-interactions, and a checker and finish gate that enforce it in a real browser. Use this
  whenever you build, design, redesign, restyle, polish or review a landing page, company,
  product, shop, cafe, hotel, studio, SaaS, AI, developer-tool or game site, as static HTML/CSS or
  inside an existing React, Next.js, Vue, Svelte, Astro or Tailwind project, or when the user says
  a page looks generic, templated or "AI-made".
hooks:
  Stop:
    - hooks:
        - type: command
          command: 'for f in ${CLAUDE_SKILL_DIR:+"$CLAUDE_SKILL_DIR/scripts/gate.mjs"} ${CLAUDE_PLUGIN_ROOT:+"$CLAUDE_PLUGIN_ROOT/scripts/gate.mjs" "$CLAUDE_PLUGIN_ROOT/skills/taste-skill/scripts/gate.mjs"} ${CLAUDE_PROJECT_DIR:+"$CLAUDE_PROJECT_DIR/.claude/skills/rasya-taste-v4/scripts/gate.mjs" "$CLAUDE_PROJECT_DIR/.agents/skills/rasya-taste-v4/scripts/gate.mjs"} ${HOME:+"$HOME/.claude/skills/rasya-taste-v4/scripts/gate.mjs" "$HOME/.agents/skills/rasya-taste-v4/scripts/gate.mjs"}; do if [ -f "$f" ]; then exec node "$f" --hook claude; fi; done; if [ -d .taste-skill ]; then printf "%s gate.mjs not found; CLAUDE_PLUGIN_ROOT=%s CLAUDE_PROJECT_DIR=%s HOME=%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${CLAUDE_PLUGIN_ROOT-}" "${CLAUDE_PROJECT_DIR-}" "${HOME-}" > .taste-skill/gate-hook-missing.txt 2>/dev/null; fi; for d in .taste-skill */.taste-skill; do if [ -f "$d/build.json" ]; then echo "tasteskill gate: gate.mjs not found (CLAUDE_PLUGIN_ROOT=${CLAUDE_PLUGIN_ROOT-}); the build in $d is not checked" >&2; break; fi; done; exit 0'
          timeout: 900
---

# rasya-taste-v4 (fork of tasteskill 2.5.1)

Build the website a good company would ship: it says plainly what is sold, shows the real thing on
every screen, and looks made for this client, not from a template and not like an art piece.
figma.com and x.ai are the bar (in words: `layout-v4.md` section 1).

`<skill>` is this folder. It needs Node 22+ and Chrome, Edge or Chromium (ffmpeg optional). Pictures: OpenAI gpt-image when `OPENAI_API_KEY` is set (`photos.mjs generate`, panels `--source openai`; model `OPENAI_IMAGE_MODEL`, default quality low), else Pexels with `PEXELS_API_KEY`, else Wikimedia Commons (`photos.md`, Generated pictures; `RASYA_IMAGE_SOURCE` forces one). Never write a key into a file.

## House rules

These nine win over everything else in this skill.

1. **No caption or description under any image, render or visual.** Licence credits go in one
   footer line.
2. **Every visual renders, never an empty ground,** at 1440, 1024, 768 and 390.
3. **One section per screen:** the hero alone on the first screen, every section exactly one or
   two screens tall at 1440x900, no second section heading peeking in. The one exception is a
   live `photo-chapters` section, three or four screens, set by the moment. Two more heights a plan deals: a **band** (`data-screen="band"`: a logo row, a band of figures, a quote, the mid-page call, the statement paragraph) is its content and padding, one screen at most, and a **tall** section (`data-screen="tall"`) is three screens (`sections.md` section 1, Heights).
4. **Equal left and right content edges.**
5. **Motion on every page** (`motion.md`): **Lenis smooth scroll** (`assets/motion/scroll.js`,
   never removed); **the hero enters once on load** (`data-enter`); **2-3 scroll moments**, at
   least one starting in the first two screens and at least one scrubbed to the scrollbar; **pins**
   allowed, two at most, created first, each keeping an h1 or h2 on screen; **hover on every
   control:** a linked card lifts 2px, a photo zooms 1.02-1.03 inside its frame, buttons step on
   hover and press on click, underlines draw, card loops cycle in 2.5-4 s, repeat and restart on
   hover. The motion layer does the hover; never strip or override it. No tilt, carousels or
   timed tabs, no fade-in on every card or section, no parallax on body text, no scroll-jacking
   beyond Lenis. The gate holds the entrance, the moments, Lenis and the pins.
6. **More and better real photographs where they fit;** nicer backgrounds (the background library, `backgrounds.mjs`); better heroes, layouts
   and fonts.
7. **Real full-colour icons** (a known product's real icon, never a drawn one); small diagram
   visuals in cards (a hub with branches; one input, a main processor, three parallel lanes;
   pulses running along the lines).
8. **The big award-site scenes and creative moments are part of the skill:** every page deals its
   moments (photo- and type-led off tech), but shader effects and scenes only where the trade has a
   technical subject (tech, AI, developer tools, gaming, fintech, hardware), never on a local cafe,
   bakery, guesthouse or shop: those get photographs.
9. **Addresses:** street and district only (no street given: the district), no house number, postcode or coordinates; no register
   or VAT numbers; no phone in a real format; contacts on `.example`.

## 1. The kind of business decides everything

Write the kind on the plan's first line and declare it on the page: the page type on
`<html data-type>` and `<meta name="page-type">` (the same value), and `<meta name="site-kind">`;
a place adds `<meta name="page-kind" content="place">`. The dealers take the last column
(`start.mjs --page`, `moments.mjs --page`), the hero dealer the page type; `consistency.mjs` reads
the metas.

| Brief | page type | site-kind | kind |
|---|---|---|---|
| App, SaaS, AI, developer tool, fintech or banking app, a studio selling its own software | software | software | software |
| A game, a studio launching its game | software | gaming | gaming |
| Hardware or a tech device (a drone, a robot arm, a keyboard) | product | tech | tech |
| Any other physical product or brand (a chair, a bike, coffee beans sold online) | product | other | product |
| People are hired: clinic, law firm, agency, creative studio, trade | service | other | service |
| People come to it: cafe, bar, bakery, restaurant, guesthouse, small hotel, shop, florist, bike shop, gym, local studio | place | other | place |
| A magazine, journal, blog, newsletter or long-read publication, or a brand's editorial site | editorial | other | editorial |

A maker that also opens its door or teaches (a ceramics studio, a bakery with a web shop) is a
**place**; its web shop becomes the goods section. It is a product only when nothing happens at the door.

"Tech" below means site-kind software, gaming or tech; "other" is everything else. Effects,
scenes, loops, counts, the lit CSS grounds, dark pages and dark heroes are tech only. An other page is
photographs, colour, type, real icons, the hero's entrance, Lenis, its 2-3 scroll moments
(photo- or type-led, no WebGL: `moments.md`, `motion.md`), the hover layer and 0-2 quiet
**background layers** from the library (dots, topo, paper, a fine grid: `backgrounds.md`, The background
library). Background layers are dealt on every kind by `backgrounds.mjs`: software rich, editorial and
other quiet. Gradients are fine when every stop is a palette token mix; never violet or a purple-to-blue
glow. Caps: one animated layer, two pattern or gradient layers, one texture, three in all.

## 2. The page plan by kind

The full plans, deal lists and section order: `references/sections.md`. Software and editorial pages deal
one of their plans with `plan.mjs` (five software shapes, three editorial): its core and the pool sections whose condition the brief meets,
**9 to 12 sections after the hero on software, 8 to 11 on editorial**; under 8 is too short unless the brief is thin (say so on plan line 2).

- **Place** (a cafe, bakery, guesthouse, shop). Photographs lead: 12 to 20 on the full page, 8 to
  12 compact, under 8 frames the 3-screen short page, whatever the trade; no client photographs:
  the draft path and a live search (`photos.md`), then count; the palette dealt by trade. The hero
  a photograph whenever a frame fits (a remote place: its region's landscape), the visit block on
  screen two, the offer, the place, orders or booking.
  **Variety without effects** (`sections.md` section 4): the offer and the place deal different
  compositions, never two sections round one picture; one type moment (the address or name set large); one main action a screen; list text 16px. Flat grounds (or one quiet library layer: dots, topo, paper), square
  photographs, one button style, the phone bar, the 2-3 scroll moments; no effect, ground, loop,
  fragment, diagram or tab.
- **Product and service** (site-kind other). Photographs lead: the product, the people, the rooms,
  the work, two or more a screen on a product page. Real icons for the tools a studio uses; one
  still diagram at most; flat grounds and one brand band, at most two quiet library layers (patterns, paper). No shader effect, print, gradient outside a library layer,
  scene or loop (the scroll moments only); WebGL only for a product render the brief asks for. **A
  physical product with no photographs is shown in photographs:** stand-ins of the same kind of
  thing from `photos.mjs search`, each listed in the report, on the full product page; a render
  (`assets/objects/product-render`, stills) only when the brief asks for 3D or a render; never a
  drawing, mood stock or a set of props (`sections.md`, Product).
- **Every product page** (photographed, in stand-ins or rendered on a 3D ask, hardware too; the bar is Figure and 1X;
  `sections.md`, Product): the product **big** where it stands
  whole (most of its frame, or on the ground at anchor scale), never mid-size in a grey rounded
  panel on a grey ground; **a different picture each section**, never one view twice; **every headline promise pictured** (a family bike shows the child bench); dealt
  compositions, no structure twice, one contrasting ground; the **swatch changes the picture**,
  every colour shown once; **no fact twice**; buttons step and press (rule 5).
- **Tech** (software, gaming, hardware). The client's own subject leads at true size. Software: its
  own UI as live HTML showing what it works on (a code-review tool: a red and green diff with its
  Accept action) in one `app-frame`, never a generic dashboard or only fragments on panels; cards:
  fragments on lit panels or panel photos (one set, three at most), pulsing diagrams, real icons. Hardware: its photographs, else stand-in
  photographs of its kind (a render only when the brief asks for 3D), never a split hero of only
  an order form or a drawn SVG. A game: its name in the h1, a launch line, its world as full-bleed
  key art (else its name set large over stand-in photographs of its setting), an effect never in
  its place (`sections.md`, Gaming). **60 to 80 words a screen** outside UI mocks (`copy.md`). By
  deal: **one effect** (a shader ground in the hero or the one `[data-visual]` frame, a WebGL
  part, an object or one big scene) and **two or three scroll moments** in their own sections
  (`motion.md`, Scroll); four live WebGL contexts at most; no card fades in on scroll.
- **One object never carries the page.** The product or hero object whole leads the hero and **two more sections at
  most**; another kind of visual the brief supports carries the rest (`sections.md` section 1,
  its table): a game's world and crew; hardware's use at the bench, its parts close up; a still
  diagram card, a type moment, a context photograph where the trade allows.
- **The client's own assets get slots.** A trailer, key art, screenshots, CAD renders or a motion
  video the brief names each get a frame that reads finished now (a real `<video>` with a stand-in
  poster, a play control only when there is a page or file to play, three to five stand-in
  photographs of the world, a CAD frame), named in a comment for the client's file, never empty
  (`sections-library.md`, client-slots).

## 3. What serves which page

Open the reference of every asset family the page uses first. A dash means never.

| Need | Asset | Software, gaming | Hardware | Product, service | Place | Reference |
|---|---|---|---|---|---|---|
| Heights, edges, heroes, type | `system.css`, `assets/layout` | dealt hero | dealt hero | dealt hero | place hero | `layout-v4.md` |
| The hero's visual: a recipe rebuilt from named reference heroes (wireframe figure, massing model, object drift, type mask, bleed photo, illustration scene, shader light, globe, output stack, prompt demo, product UI, scan) | `scripts/hero.mjs`, `assets/layout/recipes` | dealt | dealt | dealt (photo, illustration, CSS) | - (the place hero) | `hero-recipes.md` |
| Sections and recipes | `starter.html` | its plan | product plan | its plan | place plan | `sections.md`, `sections-library.md` |
| Tokens, grid, buttons, footer, colour | `system.css`, `system.js` | yes | yes | yes | place tokens | `system.md`, `buttons.md` |
| The nav: one of twelve archetypes (ruled cells, split with a centred wordmark, over a photograph, collapse to pill, bottom dock, mono strip, corner index, product-preview mega, full-screen takeover, side rail, live datum, brand object) or the kit's four, dealt; one brand element, a scroll state, a designed phone menu | `scripts/nav.mjs`, `assets/navs` (`navs.css`, `navs.js`, `nav-<id>.html`) | dealt | dealt | dealt | dealt (split-mark, object, over-media, preview-mega or the kit's) | `navs.md`, `system.md` |
| Button look (one a page: fill wipe, label roll, arrow swap, key chip, ring, press depth, underline, icon reveal, shine, split, tonal soft) | `assets/buttons/buttons-library.css` (`.js` for roll and magnetic), `scripts/buttons.mjs` | dealt | dealt | dealt | dealt | `buttons.md` |
| The ending: the close and the footer as one pick (the kit's types, or the library's emboss, fade-word, split-close, outline-fill, index; three set the name huge, dealt only) | `scripts/footers.mjs`, `assets/footers` (`footers.css`; `footers.js` for a wordmark), the starter's footer.closing | dealt | dealt | dealt | the kit's: footer-visit, footer-columns | `footers.md`, `system.md` |
| Forms, keyboard, head and share tags | `starter.html`, `system.css`, `system.js` | yes | yes | yes | yes | `system.md` |
| Copy, contacts, credits | `scripts/copy-lint.mjs` | yes | yes | yes | yes | `copy.md`, `copy-voice.md` |
| Hero entrance, hover, press, focus, nav, tabs | `assets/motion` | yes | yes | yes | yes | `motion.md` |
| Lenis, GSAP 3.13, ScrollTrigger, SplitText (`window.rtMotion`) | `assets/motion/scroll.js` | yes | yes | yes | yes | `motion.md` |
| Card loops, a count | `assets/motion`, `assets/ui` | yes | yes | - | - | `motion.md`, `cards.md` |
| Photographs | `scripts/photos.mjs` | people, customers; a game's art, else stand-ins of its setting | lead | lead | lead, 12-20 | `photos.md` |
| Real tool, app and file icons | `scripts/icons.mjs` | yes | yes | tools really used | - | `icons.md` |
| Feature cards, UI fragments | `assets/ui` | lead (gaming: none) | its app | an app the client runs | - | `cards.md` |
| Panel photos behind UI (a card's panel, the hero's plate, the app frame's plate) | `scripts/photos.mjs panel`, `assets/ui/cards.css` `[data-panel-photo]`, `assets/ui/panel-photos.json` | 0-3, one set (gaming: none) | 0-3, one set | its app's cards | - | `cards.md`, `photos.md` |
| Diagram cards (hub, lanes, pulses) | `assets/diagrams` | 0-2, pulsing | 0-2, pulsing | 0-1, still | - | `diagrams.md` |
| CSS grounds | `assets/backgrounds` | 0-2 dealt | 0-2 dealt | flat tokens | flat tokens | `backgrounds.md` |
| Shader grounds | `assets/effects` | the one effect | the one effect | - | - | `effects-usage.md` |
| Creative parts (`fx-*`) | `assets/components` | yes | yes | `fx-photo` plain, `fx-map` still | `fx-map` still | `effects-creative.md` |
| Objects and prints | `assets/objects` | one, as the effect; a render when the brief asks for 3D | its render when the brief asks for 3D | its render when the brief asks for 3D | - | `effects-objects.md` |
| Scroll moments (dealt, or the page's own in `rtMotion.onReady`) | `assets/moments`, `scroll.js` | 2-3 | 2-3 | 2-3 (photo, type) | 2-3 (photo, type) | `moments.md`, `motion.md` |
| Big scenes | `assets/scenes` | 0-1 | 0-1 | - | - | `scenes.md` |
| Speed and weight | `scripts/perf.mjs` | yes | yes | yes | yes | `perf.md` |

Read `copy.md`, `copy-voice.md`, `system.md`, `layout-v4.md` and `sections.md` in full before the first page.

## 4. The run

0. **The stack.** The kit's pictures (photographs, demo pictures, hero references, object renders) are not in
   git: the first dealer run (`start.mjs`, `deal.mjs`, `hero.mjs`, `photos.mjs`) downloads them once into the skill
   folder, 29.5 MB; `node <skill>/scripts/assets.mjs --check` says whether they are in place. An empty folder builds a static page: copy the kit with
   `node <skill>/scripts/start.mjs copy-kit` (it writes `<skill>/assets` into `assets` with Node's
   `fs.cpSync`, so no `cp -R`, `rsync` or `ditto` is needed) and start from `assets/starter.html`.
   An existing project builds in its own stack, its components taking the starter's markup and
   classes, with the kit copied into its public folder (`start.mjs copy-kit --to public/assets`)
   and loaded from there as plain files. A brief that asks for Next.js builds a
   static export (`output: 'export'`), checked on its built page (`--root out`).

1. **Read the brief.** Write down the kind (section 1), what is sold, who buys it, the one main
   action (the transaction: Book a room, Order a cake, Start a free trial; a place with neither:
   Get directions) and the real material: logo, screens, photographs, prices, address, hours.
   Then arm the finish gate, before any page exists:

   ```bash
   node <skill>/scripts/gate.mjs --start index.html --kind <kind> --category "<what is sold>" --primary "<main action>"
   ```

   A framework build names its dev server's URL (`--start http://localhost:5173/`) or its built page
   (`--start dist/index.html --root dist`; a Next.js export: `out`) in place of `index.html`, and
   rebuilds before every gate run.

2. **Write all the copy first,** with the copy layer (`copy-voice.md`: the fact sheet, the voice
   card on the plan, the page's shape, the device budget; a register from `copy-registers.md`, the
   moves of `copy-moves.md`) within the rules of `copy.md`: the h1 names the category and the buyer or the place (a game: its name and genre),
   one hard fact on the first screen, a noun in every heading, buttons as a verb and an object.
   Nothing is invented but a coined brand name (searched first, the result kept in `names.json`
   beside the page) and, on a place, plausible hours and prices, each marked `data-assumed`
   (`copy.md`, What may be assumed). A draft kept in a `.md` file lints the same way as the page
   (the voice card and part labels are skipped).

3. **Plan the page as screens, from the dealt plan.** A software or editorial page deals its shape
   first (`plan.mjs pick`, the first line of step 4) and starts from what it prints: its sections
   in its order, its ids and recipes, its moment slots, every optional or pool section kept only when the
   brief meets its condition (printed on its line as `when:`), the next reserve taken for each one it does not; a plan whose needs the brief does not meet is dealt again with
   `--exclude <id>`. Other kinds take their one plan (`sections.md` sections 3 and 4). Line 1: the
   kind. Line 2: the deal (step 4), the plan's id first, with one sentence on why the palette fits
   the trade. Then one line per section of the plan: its id, its one idea, its picture and its kind (object, use, parts, world, slot, diagram, type; three object lines at most), its
   screens (1 or 2, from its content height, `layout-v4.md` section 2), which sections hold the
   2-3 scroll moments (one in the first two screens, one scrubbed, any pin) and why each moves
   (on tech also the effect or the scene). Pick the photographs now (`photos.md`), and on tech the panels that take a panel photo instead of the lit ground (three at most); their count,
   stand-ins included, sets a place's length (section 2). Then read `cards.md` and the recipe of
   every id you use in `sections-library.md`.

4. **Deal, never choose by taste.** Each command keeps a history, so pages differ:

   ```bash
   node <skill>/scripts/plan.mjs pick --page <kind> --history .taste-skill/history.json [--has <keys>]   # software and editorial: the page's shape, its length (9-12, editorial 8-11) and the moments line to run; --has: what the brief gives (plan.mjs pool lists the keys)
   node <skill>/assets/layout/deal.mjs --type <page type> --has <photo,ui,film,object,setting> --history .taste-skill/layout-history.json   # the hero; a game adds --kind gaming, hardware --kind tech
   node <skill>/scripts/hero.mjs pick --page <kind> --template <dealt hero id> [--has ui,video,datum,object,logo] --brief brief.md --history .taste-skill/history.json   # the hero's visual: a recipe from the reference heroes, its references to open, its mount, its assets; never on a place
   node <skill>/scripts/photos.mjs recipe-assets --recipe <the dealt recipe> --brief brief.md --out .   # the hero's assets first (the page's one image style is the hero's); then photos.mjs fetch as it prints
   node <skill>/scripts/nav.mjs pick --page <kind> --hero <dealt hero id> --has <photo,ui,datum,products> --history .taste-skill/history.json   # the nav: the template to copy, its CSS and JS lines, the brand element, and the --nav value for footers.mjs and buttons.mjs
   node <skill>/scripts/start.mjs deal --page <kind> --trade <trade> --history .taste-skill/history.json    # three palettes made for the trade, three pairings: take the first; add --axis after a word or editorial hero
   node <skill>/scripts/start.mjs css --page <kind> --palette <id> --type <id> --radius soft --history .taste-skill/history.json
   node <skill>/scripts/start.mjs brand --page place --bg "#.." --ink "#.." --accent "#.." [--surface "#.."] [--muted "#.."] --type <id> --radius soft   # the client's own colours (a logo, a painted shopfront), in place of css
   node <skill>/scripts/moments.mjs pick --page <kind> --count 2|3 --fits section,statement,gallery --first <slot> --photo --history .taste-skill/history.json   # every kind; software and editorial: the line plan.mjs printed; --count 1 on a place's short page; --extra deals a pointer moment beside them
   node <skill>/scripts/backgrounds.mjs page --page <kind> --slots hero,section,close --light|--dark [--effect <slots>] --history .taste-skill/history.json   # background layers; --effect names the slots that hold the effect (effects.mjs): no layer there
   node <skill>/scripts/photos.mjs panel --page <kind> --mood "<a word of the brief>" --count 2|3 --ground <dealt ground> --history .taste-skill/history.json --out .   # tech and app cards: panel photos, one set (one tone family), one theme a panel; generated with OpenAI when OPENAI_API_KEY is set
   node <skill>/scripts/photos.mjs generate --prompt "<a photograph of the trade's world>" --subject detail --out .   # optional: a generated scene, texture or band picture (one tone family; never the client's product or people passed off as real)
   node <skill>/scripts/footers.mjs pick --page <kind> --nav <the --nav nav.mjs printed> --type <pairing id> --name "<Brand>" [--photo] --history .taste-skill/history.json   # the ending: the close and the footer as one pick; --photo while a photograph is left for close-photo
   node <skill>/scripts/buttons.mjs pick --page <kind> --nav <the --nav nav.mjs printed> --close <dealt close> --history .taste-skill/history.json   # the button look for <html data-buttons>; --close as footers.mjs printed
   node -e "for(const l of process.argv.slice(1)){const o=l.split('|');console.log(o[Math.floor(Math.random()*o.length)])}" <the kind's lists, below>
   ```

   Open every reference picture `hero.mjs` prints before building the hero, and write the move (composition, technique,
   interaction) on plan line 2 with the recipe's id.

   Every dealer also reads and appends the global history (`$RASYA_TASTE_HISTORY`, default
   `~/.rasya-taste/history.json`), so builds in other folders, nightly or side by side, steer apart;
   `--no-global` (or `RASYA_TASTE_HISTORY=off`) leaves it out for one run.

   Run every command from the project folder (the deal arms the gate in the folder it runs in, or
   joins the build already open one or two folders up). The
   lists, in order rhythm, mark (`sections.md` sections 2 and 3); the nav comes from `nav.mjs`; the ending (the close and the footer)
   comes from `footers.mjs`, run after the one-liner with the `--nav` nav.mjs printed, and the button look from `buttons.mjs`, run last
   with that nav and the `--close` footers.mjs printed (the mark field's `wordmark` is the nav logo, not the footer's giant name):
   - software: `"dark-band|surface-pairs|space" "wordmark|initial|arc|ring|stack|dots"`
   - gaming: `"dark-band|media-band|space" "wordmark|initial|arc|ring|stack|dots"`
   - product and hardware: `"dark-band|brand-band" "wordmark|initial|arc|ring|stack|dots"`
   - service: `"surface-pairs|dark-band|space" "wordmark|initial|arc|ring|stack|dots"`
   - place: the whole line in `sections.md` section 4, Place (The deal), read in its order, without its nav, footer and buttons fields (`nav.mjs --page place`, `footers.mjs --page place --photo`, `buttons.mjs --page place`).
   - editorial: `"space|surface-pairs|dark-band" "wordmark|initial|stack"`; its hero deals with `deal.mjs --type editorial --has photo` (front-page: `--hero statement` or `word`, as its plan says).

   A product or hardware with no photographs deals with `--has photo` for its stand-ins;
   `--has object` only for a cut-out or a render the brief asks for (always the `product` hero, its
   widest view across the wrap, no box); a game without art files passes `--has setting` (the
   `photo` hero, its name over a stand-in of its setting; a game always passes `--has`). A product
   page is dealt only the product, photo and film heroes. A place's hero is printed, never dealt (`--type
   place`). A dealt part that needs a photograph the page lacks is dealt again (`sections.md` section 2). The nav is `nav.mjs`'s pick: over a photo hero only when it printed so (over-media, or `data-nav-over` on split-mark, pill, dock, corner-index); its brand element is a real fact of the brief, one only. Take the
   first palette and the first pairing printed (the next only when the first clashes with the
   client's own logo or photographs, or the pairing fails `hero-lines`, said on plan line 2); the client's own colours go through
   `start.mjs brand` instead (`sections.md` section 4, Look); never violet: deal again. Keep the `:root` block as printed. Radius: `sharp` for fintech and developer tools, `soft` by default,
   `round` for consumer apps, square on a place. On tech only: the lit ground (or, on up to three panels or plates, panel photos in its place: `photos.mjs panel`, `cards.md` Panel photos) (`<html data-ground>`:
   `sand|sky|sage` through the one-liner), the lit CSS grounds (`backgrounds.md`) and the one effect
   (`effects-usage.md`). On every kind: the background layers `backgrounds.mjs` printed. Write every result on plan line 2 and in
   the comment at the top of `<body>`, and build exactly that (a short page drops what it has no section for: `sections.md` section 4).

5. **Build.** In `starter.html`: set `<html lang data-type data-radius data-buttons data-motion>`
   (`data-buttons` is the look `buttons.mjs` printed; `buttons-library.css` is linked in the starter, and
   `buttons-library.js` (defer, once) goes in only when the deal printed it: `roll`, `magnetic`; the button markup
   never changes, the extras are `data-kbd` on a `kbd` primary and `data-meta` on a `split` button, `buttons.md`)
   (lang: the brief's language), the three metas, the head block (title, description, og, icon,
   theme-color: `system.md`, Head) the nav `nav.mjs` printed (a library nav replaces the starter's header.nav with the `<header>` of
   `assets/navs/nav-<id>.html`, nothing else from that file, keeping its classes, `data-nav*` attributes, the skip link and the toggle;
   its words become the page's sections; its brand element is filled from the brief; a kit nav keeps the starter's header with
   `data-nav="<its id>"` and one `data-nav-element`; `navs.css` and `navs.js` are in the starter, `navs.md`); keep the skip link, the `m-enter` head
   line and the `scroll.js` line (Lenis); copy only the `<section class="hero …" data-enter>` (fill the template's picture slot with the dealt recipe's mount: copy only the `.rr` block of
   `assets/layout/recipes/<id>/recipe.html`, link `_shared/recipes.css` and the recipe's `recipe.css` after layout.css and its
   `recipe.js` (module) after scroll.js, put each generated picture on its `data-rr-slot`, write the recipe's data from the brief;
   a WebGL recipe is the page's one effect; fill the hero's slots and never place a hero part by your own left,
   top or width: the slots are `!important`; the primary button stays in the h1 block at the page's button height; three
   visual parts at most: `layout-v4.md`, Hero composition) of
   `assets/layout/hero-<id>.html` (never its nav, other sections, footer or credit line; every word
   and picture becomes the client's); build the ending `footers.mjs` printed: a kit ending moves the dealt close and footer out of their `<template>`s; a
   library ending replaces the starter's footer.closing with the `<footer>` of `assets/footers/footer-<id>.html`
   (nothing else from that file), with `--ft-fit` on it as printed, and adds `assets/footers/footers.js` (defer, after
   `scroll.js`) when the deal printed it (`footers.md`, Building one); then delete the starter's other templates. Every section is `main > section` with
   one `.wrap`, its h2 first, `--h: 1` or `2` (a band: `data-screen="band"` and no `--h`; a tall section: `data-screen="tall"`).
   The statement is a paragraph of 25 to 60 words that reveals as you scroll, in a band with no h2 and no picture
   (`sections-library.md`, statement; moment `paragraph-reveal`); never a few words set huge. Build each to its recipe with the system's classes
   and tokens; write page CSS only where a reference says page CSS (inside a visual, `--p-h`,
   `.wall`, `.rail`, `.device`). Paste UI from `assets/ui/<name>/fragment.html` and rewrite every
   name, number and logo to the client's (kit icons become `data-icon`, `cards.md`); a diagram card is `data-diagram="<preset>"`
   with the client's labels; run `icons.mjs scan index.html --out assets/icons --colour` last, so every icon
   the page names is a local file. Mount an effect, object, moment or scene exactly as its
   reference says, never from your own script; the page's own scroll moments are one script after
   `scroll.js`, each inside `rtMotion.onReady`, pins first (`motion.md`, Scroll). A moment's section is copied from
   `assets/moments/_demo/in-page.html` (place: photo-chapters, word-highlight) or
   `in-page-service.html` (pinned-chapters, picture-develops film); a v4 moment (paragraph-reveal, stacked-panels, gallery-runs,
   photo-expands, scroll-stage, ui-assembles, photo-unveil, phrase-marks) needs `scroll.js` on the page before the loader
   (`moments.md`, The v4 moments). Paste each printed background `<div class="rbg" …>` as the first child of its
   section, link `assets/backgrounds/bg-library.css` (in the starter) and add `bg-library.js` (defer) when the deal
   printed it. A panel photo: `photos.mjs fetch --panel <ids> [--plate <id>] --out . --history .taste-skill/history.json` prints each
   `<picture class="pp">`; paste it as the first child of its `.panel`, `.hero__art` or `.photo-plate`, put the look the deal
   printed on the host (or once on `<html>`) and take `data-fx` off that host. A moment's own `demo.html` shows
   it alone and is not a page model. A form is the starter's `booking-form` (`system.md`,
   Forms). Credits: the one footer line from `photos.mjs credits`, once the markup uses the
   photographs (it reads the page). Copy the hero's tile from `shoot.mjs` beside the page as `share.jpg`.

6. **Check and look.** Only the skill's scripts, each running one headless Chrome with WebGL on the
   CPU, closed by its own PID, one at a time in the foreground with a 10-minute timeout (20 minutes for the full `consistency.mjs` run, which prints one line as each width completes); never in
   the background, a windowed browser or a browser tool.
   Each serves the page file itself over http on 127.0.0.1 (never `file://`), so no server is needed;
   for a built page whose links start at the site root (`/_astro/page.css`), pass `--root` with the build folder (`dist`).
   `--profile <dir>` is the Chrome profile: a folder of its own in the OS temp folder or in the
   project's `.taste-skill` folder (`.taste-skill/chrome-check`), never outside the project (no
   `../`); a relative one that leads out of it is replaced by `.taste-skill/chrome-<script>`. Then:

   ```bash
   node <skill>/scripts/copy-lint.mjs index.html --kind <kind>
   node <skill>/scripts/footers.mjs check index.html   # no browser: a second giant name, a wordmark without aria-hidden, the name missing from the footer's text
   node <skill>/scripts/nav.mjs check index.html   # no browser: data-nav, one data-nav-element, five words and 45 characters, the nav's action unlike the hero's, navs.css and navs.js
   node <skill>/scripts/hero.mjs check index.html --history .taste-skill/history.json   # no browser: the recipe mounted, its files, kind, still, assets (no demo stand-in), hero-ui-default
   node <skill>/scripts/consistency.mjs index.html --widths 1440,1024,820,768,390 --rhythm-widths 1440,820,768,390 --profile <dir> --page <kind> --category "<what is sold>" --primary "<main action>"
   node <skill>/assets/layout/check.mjs --url index.html --profile <dir> --sizes 1440x900,1024x768,820x1180,768x1024,390x844 --shots shots/layout
   node <skill>/scripts/shoot.mjs --url index.html --w 1440 --out shots/1440.png --profile <dir>
   node <skill>/scripts/perf.mjs index.html --profile <dir>
   ```

   Shoot 1024, 820x1180, 768x1024 and 390 as well. Every `check.mjs` finding fails the page (no `--no-stress`); its WARNs (`hero-parts` at four parts, `hero-offgrid`) are listed and fail nothing: read them.
   copy-lint opens no browser and takes under a second. Fix every FAIL (a copy-lint WARN too, or say
   why it stays) and read the copy aloud (`copy-voice.md` section 6); shoot again and read every
   screenshot against the checklist. In the fix rounds run `consistency.mjs --quick --widths
   1440,820,390`. Then the gate, which runs the checker at 1440, 820 and 390 every time, walks the page at 320
   for overflow, collide and tap-size, and runs copy-lint, whose FAILs block like the checker's:

   ```bash
   node <skill>/scripts/gate.mjs index.html
   ```

   An edit after `GATE: PASS` reopens the build (the next stop checks the changed page again, one fix round at least); to
   check a page without touching the build's crops, pass `--out <dir>` to `consistency.mjs`. Fix what it lists and run it again until its last line is `GATE: PASS` or `GATE: OPEN`, three
   rounds at most (in Claude Code it also runs when you finish; a stop before your first gate run is
   no round, and to ask the user something after a block, just stop again). When the user tells you
   to stop, or to ship the page as it is, run `gate.mjs --done "<what they said>"` (`GATE: DONE`)
   and report the open FAILs.
   `GATE: SETUP` (no page yet, a framework's source shell, a page that is not local): arm what a
   browser can open (step 1) and run it again. `GATE: ERROR` (the checks could not run) or
   `GATE: OFF`: put the line in the report and finish; do not rerun. Never edit
   the kit's files or hide anything from the checker. A FAIL you judge false is waived in
   `.taste-skill/waivers.json` with its reason, never fixed by gaming the check (`references/gate.md`);
   a word from the client's own copy that copy-lint FAILs is waived hit by hit, the brief as the reason
   (a word inside the client's name, as the logo or the title writes it, is not counted: one WARN).

7. **Report:** the `GATE:` line first, then every waiver with its reason and every open FAIL; the
   kind, the plan's length and the pool sections left out for a condition the brief does not meet, the deal (palette and why it fits, pairing, hero, the hero recipe (its references, variant and assets, each stand-in listed), the nav (its archetype and its brand element), grounds, effect, moments, scene, the ending); the
   voice card in one line and every copy-lint WARN kept, with why; the checker, layout and perf
   results; what you could not check; every assumed fact (the checker's `assumed` list) and the
   coined name's search; the form's `.example` stand-in and the canonical domain still to come; the panel set, its themes and photographs (each credited); the photographs and art the client must supply, every
   stand-in frame among them (library and live search); every client slot, its file and its stand-in.

## 5. Checklist

Each line names its checks: `consistency.mjs` ids in brackets, `check.mjs` findings in braces,
`perf.mjs` rows. The last line is for your eyes.

- **First screen:** says what is sold, for whom or where, with one hard fact [copy-headline,
  copy-fact]; the hero fills it alone at every width, its main button inside it [hero-screen,
  hero-fill, fold-action, fold-cut] {hero-fold, hero-cta-detached, hero-parts, hero-offgrid}; one focal point; the main button in the h1 block, under the sub-line; three visual parts at most, each on the columns or in its slot.
- **The hero's visual:** a dealt recipe (`hero.mjs check`), rebuilt from its references with this page's own assets
  and colours, never their words, logo or pictures; a still under reduced motion, on a phone and without WebGL; WebGL
  only on tech; a product window leads at most one page in five [hero-ui-default].
- **One section per screen:** every section 1 or 2 screens, its h2 first and top-aligned, no
  neighbour's heading or picture in its tile, nothing sparse, no section half empty [section-height, one-section,
  one-heading, section-air, one-screen, section-gaps, empty-area] {screen-short, screen-height, sparse,
  neighbour, neighbour-ground}.
- **Length and the statement:** a software page 9-12 sections after the hero, an editorial page 8-11, each on one
  fact, proof or job from the brief [page-short]; the statement a paragraph of 25-60 words that reveals, in a band,
  never a short line over 72px alone in a screen [statement-short]; a band is its content (one screen at most), a tall section three screens.
- **Equal edges:** every block on the `.wrap` lines or the grid's columns, nothing out to one side,
  no sideways scroll [container-edges, row-lines, split-pair, off-grid, right-edge, col-edge,
  spill, off-viewport, stagger, top-stagger] {edge-left, edge-right, spill, bleed-one-side,
  one-sided, lines}.
- **Every visual draws** at 1440, 1024, 768 and 390; a refused effect shows its still fallback
  [visual-empty, empty-visual, gl-fallback, shader-lint, no-visual, photo-weight].
- **No caption** explains, apologises for or labels a picture; credits in one footer line
  [visual-caption, caption, credit-wall, photo-credit]; no placeholder, sample note or printed
  `.example` address [placeholder, sample-label].
- **The right things for the kind:** panel photos on tech and app cards only, one set, three at most, no words on the photograph; outside tech no effect ground, print or scene, only the
  dealt photo- or type-led moments (WebGL only for a product render the brief asked for)
  [effect-kind, effects-fit, photo-print]; the subject itself
  shows: the product big, whole in three sections at most, a new picture each [product-shown,
  same-object, photo-repeat]; each asset the brief names in its slot; a game's name and its world as key art,
  the diff of a code-review tool, software's `app-frame`;
  real photographs where they fit, none twice [photo-set, photo-repeat, photo-upscale]; real icons in their own
  colours; flat grounds or quiet library layers on other, within the caps [grounds, bg-layers, bg-violet]; a place deals two different compositions and one type
  moment.
- **Motion:** Lenis runs, its libraries load at their exact versions [lenis, motion-libs]; every
  button, link, linked card and linked photograph visibly answers the pointer, nothing tilts
  [motion-layer, hover, hover-move, tilt]; the hero enters once on load [hero-enter]; 2-3 scroll
  moments, one in the first two screens, one scrubbed [scroll-moments, moment-none]; two pins at
  most, each held 1-3 screens with an h1 or h2 on screen, created pins first [pinned, pin-heading,
  trigger-sort]; no card, row or section fades in on scroll, no body text moves off the scroll, no
  scroll-jacking beyond Lenis [scroll-reveal, scroll-linked, effect-kind]; card loops cycle in 2.5-4 s
  [loop-cycle]; anything moving past 5 s has a pause button [loop-pause], shown only on keyboard focus (no visible player icon); under reduced motion
  Lenis does not smooth, everything rests and nothing stays hidden [reduced-motion, hidden-content];
  at most four live contexts [webgl].
- **Contacts** as rule 9 [street-number, postcode, coordinates, company-number, phone-number];
  Get directions only with a street, "See the area" with a district, no map link with a town only [map-link].
- **Keyboard and head:** every control named, alt on pictures, labels you can see, headings one
  level at a time, no tabindex above 0; Tab reaches the skip link first, its ring shows at once and
  never under the header; the menu button says its state; lang, title, description and share tags
  [a11y-name, img-alt, field-label, heading-order, tabindex, skip-link, focus-ring, focus-visible,
  focus-hidden, menu-toggle, lang, page-meta, share-meta].
- **The nav:** the dealt bar (`nav.mjs check`), one brand-world element from the brief, its words on the `.wrap`
  (or the columns), five words and 45 characters at most, its action not the hero's primary, a scroll state that
  shows at y=1200 (is-scrolled, is-solid, is-pill or is-hidden), a designed phone menu with the display face, Lenis
  stopped while open [nav-generic, nav-family, menu-toggle] {edge-left, edge-right}.
- **One system:** one button pair in the dealt look on `<html data-buttons>` with its files (`buttons.mjs check`), one card style, one radius scale, one link look [button-styles,
  button-shape, card-family, card-layout, link-styles]; two boxes deep at most [nesting]; one
  heading scale, its faces loaded [heading-scale, font-load]; text contrast [text-contrast,
  contrast].
- **The ending:** the dealt ending, one screen (`.g2` when it needs two); at most one giant name, aria-hidden, the
  name in text in the footer, nothing past the screen's sides [section-height, off-viewport; `footers.md`,
  `footers.mjs check`].
- **Copy and links:** headings name things, buttons a verb and an object, at most two hero actions
  [copy-headings, copy-buttons, copy-actions, action-count]; one action twice a screen at most
  [action-repeat]; a heading's grey half is its own sentence [run-on]; one fact, one wording
  [fact-agree]; assumed facts marked, never an open-now line from them [assumed, open-now]; every
  link lands, forms send, a confirmation only after a real send, each error under its own field
  [links, forms, form-send, form-fields]; no slop word, stock line, leftover or device used as a
  tic, a voice of its own (copy-lint's ids: copy-residue, copy-slop-word, copy-stock-phrase,
  copy-two-fragment, copy-virtue, ...; `copy-voice.md`).
- **Fast:** no FAIL row in `perf.mjs` (image weight, contexts, layout shift).
- **820, 768, 390 and 320:** sections on their screens [section-height]; on a phone a section is at
  least its screens and grows with what it holds, so nothing lies on anything else or under a fixed
  bar [collide]; every link and control outside running text 44px tall [tap-size] (a FAIL when
  another target is under 8px away); nothing past the screen at 320 [off-viewport], and nothing
  lies on anything else there either [collide]; the first screen ending whole or on a clear bleed [fold-card]
  (`layout-v4.md`); splits stack text first, no row half empty; one column at 390, buttons full
  width, a full-screen menu; the place action bar.
- **Your eyes:** beside the figma.com and x.ai frames it reads as a professional company site;
  nothing tilted, staggered, cut or overlapping; the hero is the work, not a mood.

## 6. Never

- A few words set huge alone in a screen as the page's statement.
- A card, row or tile that fades in on scroll; a fade-in on every section; parallax on body text;
  scroll-jacking beyond Lenis (ScrollSmoother, Locomotive Scroll, fullPage.js); random blinking;
  a page without Lenis.
- Stock photographs passed off as the client's product, people or place (a stand-in is listed in
  the report as one, never shown with another maker's name or logo); a product page that never
  shows the product.
- A drawn look-alike of a real logo; invented reviews, quotes, customers or figures.
- Violet or lavender in the page's own design: accent, ground, gradient, effect colour or tint (a
  real third-party logo keeps its own colours, `icons.md`).
- Copying a reference site's code, copy, pictures, logo or colours. Its composition, technique and interaction may be
  rebuilt with the client's own assets (`hero-recipes.md`, Recreate the move).
- Deleting or editing the kit's own files (`assets/`, `scripts/`) to clear a check: a check that
  flags a kit file is reported, and the page is checked again after any change.

## References

All in `references/`; section 3 names the one each asset needs.
