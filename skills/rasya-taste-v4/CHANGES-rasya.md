# Changes from upstream tasteskill 2.5.1

## v4.0-step1 (24 Nov 2026)
- Renamed the install name to `rasya-taste-v4` (frontmatter, Stop hook paths, references/gate.md).

## v4.0-step1 · backgrounds (agent C)
- Added a background library: `assets/backgrounds/bg-library.css` (12 layers: grid, dots, blueprint, topo,
  paper, glow, mesh, aurora, blur-grid, beams, grid-pulse, flowing-lines), `bg-library.js` (runs the three
  animated ones on screen only, one at a time, still under reduced motion), `lib/make-topo.mjs` and
  `lib/topo.svg` (contour lines, inlined in the CSS), gallery `demo-library.html`.
- `assets/backgrounds/index.json`: added `library`, `libraryCaps`, `libraryAbout`, `libraryFade`; `grounds`
  unchanged, so upstream `pick.mjs` and `check.mjs` work as before.
- New dealer `scripts/backgrounds.mjs` (pick, page, list) with history in the shared history file
  (`backgrounds` list) and the page caps.
- `references/backgrounds.md`: new section "The background library"; upstream sections unchanged.
- `research/BACKGROUNDS-21ST.md` (survey), `HANDOFF-C.md` (what agent A needs), NOTICE "Background ideas".
- Colour rule relaxed for the library only: gradients allowed when every stop is a token mix; violet guard.
- Tested: `node --check` on every JS file, dealer runs with history. Two headless gallery shots at 1440 were
  taken early (glow, mesh, paper, topo, aurora, flowing-lines fixed after the first); the aurora tweak after the
  second shot and nothing since was rendered, at Rasya's "no testing for now".

## v4.0-step1 · moments (agent B)
- Seven new moments ported from rasya-taste-v2's recipes, each a folder in `assets/moments/<id>/` (`moment.js`,
  `moment.css`, `meta.json`, `demo.html`): `stacked-panels` (R09), `gallery-runs` (R07), `photo-expands` (R08),
  `scroll-stage` (R05, as a section), `ui-assembles` (R03), `photo-unveil` (R02 + R13), `phrase-marks` (R12).
  Written to `system.css` tokens; they run on the motion layer (`window.rtMotion`, `assets/motion/scroll.js`) and
  never load GSAP or Lenis. A hold is a sticky stage in a section of whole screens (never `pin: true`), its trigger
  `refreshPriority: 1`, the h2 on screen throughout; nothing held under 900px or under 600px tall; the HTML as
  written is the still and reduced-motion state.
- Mapped, not ported: R01 to `lines-rise` (retired) and the motion layer, R06 to `pinned-chapters`, R10 to
  `counter-rolls`, R11 to `word-highlight`, R15 to `marquee-row`; R04, R14 and R16-R21 left to the hover and
  motion layers (not section set pieces).
- `assets/moments/lib.js`: `rt(cb)` (waits for `rtMotion`, 8 s, then leaves the moment still), `refresh()` (one
  debounced sort and refresh), `wide` (the hold's media query). Upstream helpers unchanged.
- `assets/moments/moments.js`: a page may hold three moments (`data-moments-over` from four).
- `scripts/moments.mjs`: page kind `editorial` (and magazine, journal, blog, publication, newsletter, longform),
  dealt like place, product and service; slot `gallery`; `--count 1|2|3`; new meta fields `intensity` (1-3),
  `pin`, `drive` (scroll or pointer), `gsap`, `source`, validated; two v4 moments never share their first slot;
  two holds a page at most; WebGL counted over all picks; `check` allows three and faults a v4 moment on a page
  without `motion/scroll.js` or `system.js`. Upstream deals unchanged for upstream kinds at `--count 1|2`.
- `editorial` added to the pages of `word-highlight`, `picture-develops` and `photo-chapters`.
- `index.json` and `gallery.html` rebuilt (25 moments, 20 dealt). `references/moments.md`: the kinds table, the
  budget, the pick line, seven rows in "Where each fits" and "The v4 moments" under "Put one on the page".
- `HANDOFF-B.md`: lines for SKILL.md, starter.html, system.js and consistency.mjs (agent A's files).
- Tested: `node --check` on every moment JS, `lib.js`, `moments.js` and `moments.mjs`; `moments.mjs index`,
  `pick` (software, saas, editorial, magazine, place, service at counts 2 and 3, with a history file) and `list`
  run clean. **Nothing was run in a browser** (Rasya: "no testing for now"): no demo was opened or shot.

## v4.0-step1 · motion core (agent A)
- **New `assets/motion/scroll.js`** (a plain script after `system.js` and `motion.js`): loads GSAP 3.13.0,
  ScrollTrigger, SplitText (same version) and Lenis 1.3.17 from jsDelivr with SRI hashes (the GSAP bytes match the
  v3 bootstrap's verified cdnjs copies; cdnjs has no Lenis), in order (`async = false`), and injects Lenis's own
  stylesheet rules. Lenis runs on GSAP's ticker (lerp .09, wheel x .9, touch native), `lenis.on('scroll',
  ScrollTrigger.update)`, `lagSmoothing(0)`; `html.lenis` is on. Contract: `window.rtMotion = { gsap,
  ScrollTrigger, SplitText, lenis, reduced, onReady(cb) }` (defined at once, the libraries filled in on load;
  `cb(rtMotion)`, never called when the libraries failed), document event `rt:ready` (detail: rtMotion),
  `window.lenis` = the same instance. Pins-first safety net: `ScrollTrigger.sort(); refresh()` (debounced) after
  window load, after every onReady callback, on fonts ready and when `html[data-ready]` / `[data-moments-ready]`
  change. Reduced motion: Lenis without smoothing, callbacks still run, then every ScrollTrigger left is killed with
  its tween reverted (the HTML as written; no pin). In-page `#id` links glide through Lenis on a click (a keyboard
  activation keeps the native jump; `data-lenis-native` opts out). Loud failure on a 404, a blocked or SRI-failed
  script or a boot past 8 s: `html[data-rt-scroll="off"]`, `data-rt-scroll-error`, `window.__rtMotionFailed`,
  `console.error` (a separate attribute: `data-motion="off"` is the hover layer's switch). `window.motionSelfTest()`
  as in v3: state, libraries and versions, Lenis running and smoothing, failed loads, trigger, pin and scrub counts,
  animated elements, callbacks run and thrown.
- `assets/system.js`: the phone sheet stops Lenis while open and starts it on close; `.nav__links` gets
  `data-lenis-prevent`. Nothing else listens to the scroll there. `assets/motion/motion.js`, the hover layer and the
  upstream moments (`moments/lib.js` reads native `scroll` events and `position: sticky`) are untouched: Lenis
  scrolls the real page, so they run as before.
- `assets/starter.html`: a `preconnect` to cdn.jsdelivr.net in the head; `<script src="assets/motion/scroll.js">`
  after `motion.js`; a commented example of the page's own moments in `rtMotion.onReady`. `assets/motion/meta.json`
  lists scroll.js.
- `SKILL.md`: description, house rule 5 (Lenis, the hero entrance, 2-3 scroll moments with one in the first two
  screens and one scrubbed, pins under pins-first and headline-visible, hover on every control; the kept bans),
  section 1 and 2 motion lines, section 3 rows (scroll.js; moments 2-3 on every kind), step 3 plan line, step 4
  `--count 2|3`, step 5 (keep the scroll.js line; the page's own moments in `rtMotion.onReady`), checklist Motion
  line with the new ids, Never (parallax on body text, scroll-jacking beyond Lenis, a page without Lenis).
- `references/motion.md`: the rule is now four layers (Lenis, the entrance, 2-3 scroll moments, hover); the
  smooth-scroll ban and "scrolling moves nothing but the dealt moment" replaced; Scroll rewritten (the stack and
  contract, one clock, links, menus, loud failure, a page's own moment, the budget, content in the HTML, pins
  first, a pin keeps its headline, what may and may never move, phones, kinds, the self-test); the count rule
  takes a scrubbed count; reduced motion and Never updated. `references/gate.md`: the scroll-motion checks.
- `scripts/consistency.mjs`:
  - new block `scroll-motion` (phase pass, `--quick` included, so the gate runs it at 1440 and 390;
    `--no-scroll-motion` skips it): `lenis`, `motion-libs`, `scroll-moments` (first width), `pin-heading`,
    `trigger-sort` (every width), ported from v2's shot_check.py and motionSelfTest (details in the block's header);
  - `scroll-linked` is a WARN (a scroll moment) unless body text moves off the scroll outside a pinned stage (FAIL),
    stepping walk and CSS scroll timelines alike; inside a moment a parallax FAIL stays a FAIL;
  - `pinned` FAILs only a third wide pinned section or one held over 3 screens; a dead hold (full run) and a narrow
    sticky column WARN; in `--quick` an allowed pin is no longer told;
  - `effect-kind`: Lenis, ScrollTrigger, scroll timelines, `data-scroll-moment` and drifting sections no longer FAIL
    a place, product or service page; new `scroll-jack` FAIL on every kind for ScrollSmoother, Locomotive Scroll or
    fullPage.js; its moments WARN from a fourth; GSAP and Lenis left out of the effect libraries;
  - `moment-count` FAILs a fourth `[data-moment]` (was a third); `moment-none` is met by the page's own
    ScrollTriggers; the moment allowance for scroll-linked and scroll-reveal covers three moments, and
    `[data-scroll-moment]` sections like `[data-moment]` ones; `scroll-reveal` (a card or section fading in) stays a
    FAIL; FIX lines for scroll-linked, pinned and scroll-reveal rewritten.
  - `scripts/gate.mjs` unchanged: it runs the checker with `--quick`, which now includes the new block.
- Not taken from HANDOFF-B/C (the operator merges them): the `editorial` kind row, B's deal line fits and mount
  step, B's system.js injection of scroll.js and consistency.mjs requests (live v4 hold heights, flat
  `linear-gradient` for phrase-marks, editorial page kind), C's asset rows, deal line and checker requests. A's
  edits already cover B's "two or three moments" lines (rule 5, description, section 2, section 3, checklist,
  `--count 2|3`). Note for the merge: B's moments use sticky holds, so a page mixing them with GSAP pins counts
  both toward the two-pin ceiling (`pinned`).
- Tested: `node --check` on `scroll.js`, `system.js` and `consistency.mjs`; `consistency.mjs` with no arguments
  (loads every block, prints its usage, no browser). **Nothing was run in a browser** (Rasya: "no testing for
  now"): no test page, no broken copies, no `consistency.mjs` or `gate.mjs` run on a page.

## v4.0-step1 · checker merge (agent D)
`scripts/consistency.mjs` only (`gate.mjs` unchanged). Each HANDOFF-B section 4 and HANDOFF-C section 4 item, checked
against agent A's edits first.
- HANDOFF-B, moment count: **already covered** by A (`moment-count` FAILs a fourth, the moment allowance covers three).
  Merged the text A left at "one or two": the `moment-none` and `effect-kind` descriptions, the summary, the note the
  allowance adds ("three moments at most") and the comments.
- HANDOFF-B, section height: **merged**. SR-2 T-height takes 1, 2 or 3 screens for a section holding a live v4 hold
  (`gallery-runs`, `photo-expands`, `stacked-panels`, `scroll-stage` as `[data-moment-mounted].is-live`), like a live
  `photo-chapters`. Not done here: `assets/layout/layout-check.js` (`screen-height`, the gate's second checker) still
  allows 1-2 screens (4 for photo-chapters), so a three-screen live hold FAILs there.
- HANDOFF-B, scroll finding inside the dealt section: **already covered** by A (scroll-linked, pinned and enter
  reveals inside the first three moments' sections WARN). Only the wording changed.
- HANDOFF-B, one-colour gradient: **merged**. A background-image made only of linear-gradients whose stops are all one
  colour is read as a flat fill of that colour (`quickKind`), and as the solid ground under its words (`under()`,
  inline `<mark>` included), so phrase-marks' tint is a fill and its words are measured against the tint. The checker
  had no gradient FAIL to relax.
- HANDOFF-B, page kind: **merged**. `editorial` (and magazine, journal, blog, publication, newsletter, longform,
  long-read) is read from `--page`/`--type`, `<html data-type>` and `<meta name="page-type">` by both kind readers
  (effect-kind's `kindFrom`, the main `pageKind`). It is judged like product and service for effects (`effect-kind`,
  `effects-fit` and `photo-print` FAIL WebGL, shaders, data-fx, scenes and prints) and keeps its moments. `gate.mjs` is
  left alone: its `kindOf` passes no `--page` for editorial, so the checker reads the page's own marks, and passing it
  would stop `copy-lint.mjs`, whose `--kind` takes only the six upstream kinds.
- HANDOFF-C, grounds and the other ground checks: **merged**. `grounds` leaves out anything inside `.rbg[data-bg]`.
  The rhythm block leaves the layer and its parts out of its boxes (T2-containment, bands, dividers, parts outside a
  section) and out of T1-structure, where it was failing as "no valid background layer" and asking the `.wrap` for a
  z-index. The main walk also leaves it out of its screens (spill, stagger, collide, tap-size and the rest), its child
  walks (stagger rows, striped rows, proximity, stacked gaps, splits) and the pass-through layers. There was no
  gradient, mask-image, SVG pattern or grain FAIL by kind in `consistency.mjs` or `gate.mjs` (VI-41/VI-42 live in
  `assets/backgrounds/pick.mjs`, a dealer).
- HANDOFF-C, layer counts: **merged** as `bg-layers` (first width). It reads the families and caps from
  `assets/backgrounds/index.json` (`library`, `libraryCaps`). FAIL: over 3 layers, over 1 animated, over 2 pattern or
  gradient, over 1 texture, or an animated layer on a place, service or product page (a technical product passes, as
  `effects-fit` judges it). WARN: a layer that is not quiet (or is animated) on an editorial page, or a `data-bg` the
  library does not have.
- HANDOFF-C, gradient and violet inside layers: **merged** as `bg-violet` (first width). It reads every colour a layer
  paints (itself, its parts, their `::before`/`::after`: background-image, background-color, box-shadow, border) in
  OKLCH. FAIL: a hue of 262-338 with chroma over 0.06 at alpha 0.03 or more. WARN: a colour with chroma 0.03 or more
  that falls outside the hull of its section's tokens (accent, accent-ink, ink, bg, surface, muted, card, the neutral
  axis and the guarded accent) by more than 0.03. There was no earlier gradient or violet check to keep.
- HANDOFF-C, purple-to-blue outside `.rbg`: **not done**. No such check exists in `consistency.mjs` or `gate.mjs` to
  keep running, and adding one is a new rule.
- HANDOFF-C, contrast over a layer: **merged**. `under()` returns a `background layer` ground for text whose host
  holds a layer under it. `contrast` then reads its pixels (the plate shot with the text hidden), and `text-contrast`
  still judges the token ground.
- HANDOFF-C, reduced motion: **merged** in the reduced-motion pass. Under emulated `prefers-reduced-motion: reduce`,
  any part of a layer with an animation other than none FAILs `reduced-motion`. That covers `.rbg-beam::after`,
  `.rbg-cell` and the flowing-lines pseudo-elements. Like the rest of that pass, it does not run with `--quick` (the
  gate).
- New ids in ORDER, FIX and the page-wide not-checked list; the header lists them (added in rasya-taste-v4, the
  background library and the v4 moments). `--page` usage names `editorial`.
- Open: `loop-pause` (full run) still counts an endless layer animation (flowing-lines runs on the `.rbg` itself) as a
  loop that wants a pause control. A's moment allowance also turns a `pinned` FAIL (a third wide pin, a hold over 3
  screens) into a WARN inside the first three moments' sections, so dealt holds never reach the pin ceiling.
- Tested: `node --check scripts/consistency.mjs` (and `gate.mjs`, unchanged), and `consistency.mjs` with no arguments
  (prints its usage). **Nothing was run in a browser** (Rasya: "no testing for now"). Not checked: how Chrome writes
  the computed colours the colour reader parses, the 0.03 hull tolerance, and the pseudo-element animation reads.

## v4.0-step1 · operator merge
- SKILL.md:
  - the `editorial` kind row;
  - background layers allowed on every kind (quiet off tech; gradients from palette tokens only; caps);
  - the moments pick line takes `gallery` and `--count 1` on a place's short page;
  - the `backgrounds.mjs` deal line;
  - the editorial deal list (nav, footer, close, rhythm, buttons, mark);
  - the build step for `.rbg` layers and v4 moments;
  - rule 6 points to the library;
  - the checklist names `bg-layers` / `bg-violet`.
- starter.html: links `assets/backgrounds/bg-library.css`.
- effects-usage.md, backgrounds.md: the "other stays flat" rules now except library layers.
- start.mjs: `editorial` (and magazine, journal, blog, publication, newsletter, longform, long-read) deals palettes and type as `product` until editorial has its own lists.
- copy-lint.mjs: `--kind editorial` (and its aliases) reads as `product` instead of exiting.
- layout-check.js: a live v4 hold (gallery-runs, photo-expands, stacked-panels, scroll-stage) may be 1-3 whole screens (`screen-height`).
- Not decided yet: whether animated background layers (beams, grid-pulse, flowing-lines) are exempt from `loop-pause` (anything moving past 5 s needs a pause control).
- Nothing here was run in a browser.

## v4.0-step1 · buttons (agent E)
- Added a button library: `assets/buttons/buttons-library.css`, twelve looks for `<html data-buttons>`: `wipe`
  (fill wipe), `roll` (label roll), `swap` (arrow swap), `kbd` (key chip), `ring`, `press` (press depth,
  letterpress), `underline` (underline draw, text-button secondary), `reveal` (icon reveal), `shine` (one pass),
  `magnetic` (opt-in), `split` (label and meta cell), `soft` (tonal soft). Each is one pair plus the `.link` look,
  takes colour from the ground's tokens only, keeps the kit's heights, the motion layer's 1px step and press, and
  its widths; hover, `:focus-visible` and `:active` each show; moves are transform and opacity under
  `prefers-reduced-motion: no-preference` (hover moves for a fine pointer only); reduced motion, `data-motion="off"`
  and touch get the end state as a colour. A contrast-safe hover tone (`--bl-deep`, relative colour moving the
  action's lightness away from its label). The phone row keeps system.css's text-link secondary. The markup is
  unchanged; optional extras `data-kbd` (kbd) and `data-meta` (split), both hidden from screen readers.
- `assets/buttons/buttons-library.js`: wraps label words for `roll`; the 4px lean for `magnetic` (fine pointer,
  no reduced motion, under 480px wide, no loop at rest); `window.rtButtons.init()`.
- `assets/buttons/index.json` (the twelve under `library`, upstream's five under `upstream`: family, needsJs,
  radius, pages, mood, nav, close, primary, secondary, link, dealt, weight, sources) and `assets/buttons/demo.html`
  (every look in its own srcdoc frame on a light and a dark ground, a radius switch; the upstream five for
  comparison).
- New dealer `scripts/buttons.mjs` (`pick`, `list`, `check`): history in the shared history file (`buttons` list;
  the last two never again while another fits, the last eight weigh less), `--nav` and `--close` fit, `--mood`,
  `--library-only`, `--allow magnetic`; `check` reads a built page without a browser.
- `references/buttons.md` (the library, when to use which, the rules, the deal, pending rule changes);
  `research/BUTTONS-21ST.md` at the repo root (18 pages surveyed); `HANDOFF-E.md` (SKILL.md, starter, system.md,
  motion.md, sections.md and checker changes); NOTICE "Button ideas".
- Upstream's `solid|pill|tonal|arrow|block` untouched. Pending Rasya's call (HANDOFF-E.md section 6): motion.md bans
  a shine sweep and a magnetic button and holds a button hover to 150ms; the library's travel is 240ms (`--m-slide`).
- Tested: `node --check` on `buttons.mjs` and `buttons-library.js`; dealer runs from a scratch folder (`list`,
  `pick` for every kind with and without history, `--nav/--close`, `--mood`, `--allow magnetic`, `--library-only`,
  a shared history file keeping the other dealers' keys, `check` on a stub page). **Nothing was run in a browser**
  (Rasya: "no testing for now"): the CSS and the demo are unrendered.

## v4.0-step1 · operator merge of buttons (HANDOFF-E)
- SKILL.md: the button-look asset row; the `buttons.mjs pick` deal line; the one-liner lists drop their buttons field; the build step and checklist name the dealt look.
- starter.html: links `buttons-library.css` (always, like `bg-library.css`); the `data-buttons` comment lists all 17 looks; a commented `buttons-library.js` line.
- system.md, sections.md: buttons are dealt by `buttons.mjs`.
- motion.md, decided by the operator for Rasya (21st.dev-style buttons were asked for):
  - a library look's moving part may travel 240ms;
  - `shine` makes one pass per hover;
  - `magnetic` is allowed up to a 4px lean, and dealt only with `--allow magnetic`.
- Not done yet: the checker's `button-look` check (a port of `buttons.mjs check`). Until then, `buttons.mjs check page.html` covers it.

## v4.1 · operator fixes from tests 18/19
- buttons-library.css `soft`: the secondary is tinted over its local ground (`transparent`, not `--bg`) and has a 1px ring at rest. In test 18 it measured 1.04:1 on cards and read as disabled.
- bg-library.css: glow strength raised from 30% to 42% of the lifted tint. In test 19 the medium glow was barely visible on a white ground.

## v4.1 · panel photos (agent G)
Rasya on test 18 (quarry): the hero's app window sat on a blurry brown/beige grain (the lit ground). Cards and plates may
now hold a real photograph instead, from Pexels.
- `scripts/photos.mjs`:
  - **Pexels as a source.** `search --source pexels` (`--orientation landscape|portrait|square`, `--color <name|#hex>`,
    `--size`, `--set <panel set>`), results kept in `.taste-skill/found.json` as `p<id>` with Pexels' own medium, large
    and large2x files, the photographer and the page. The key is read from `PEXELS_API_KEY` only and sent only in the
    `Authorization` header; it is never written, logged or printed (errors name the HTTP status). Without it, one line
    says how to set it and the search runs on Wikimedia Commons. 401/403, 404 and the rate limit (with its reset time)
    get their own messages.
  - `fetch` downloads Pexels files into the site (no hotlinking), the sizes the slot needs (panel and plate: large and
    large2x; a stand-in: medium, large and large2x), each named by its real width read from the JPEG header, WebP when
    ffmpeg is there, inside the existing weight caps. `--panel <ids>` and `--plate <id>` print a `<picture class="pp">`
    (alt="", aria-hidden, lazy, `data-source="pexels"`, `data-subject="panel"`, the photo's average colour as
    `--pp-avg`) and the set's host attributes; `--source pexels` takes bare Pexels ids and looks up the ones no search
    kept (with the key). `--history` records the panel ids a page used.
  - **`panel`**, the panel-photo dealer: `panel --page <kind> --mood <words> --count 1-3 [--ground] [--set] [--dark]
    [--history] [--out] [--per] [--no-search] [--json]`, `panel --sets`. It picks one set of
    `assets/ui/panel-photos.json` (one tone family) from the kind, the mood words and the lit ground (read from the
    page's `data-ground` when not given), deals one theme per panel, searches each (Pexels, else Commons) with the
    set's colour and orientation, and prints the look and the fetch line. History: its own key, `panelPhotos`, in the
    shared history file (the last set and the themes dealt lately go behind, the ids used last); the other keys are
    kept, and `palettes`/`types` are made arrays as `writeHistory` does. Never on gaming or place.
  - Credits: Pexels in `credits.json` (`source: "Pexels"`), the footer line ("Photographs via Pexels and Wikimedia
    Commons"; three sources read "A, B and C"), the list ("Photo by <name> on Pexels", the name linking the photo page,
    Pexels linking pexels.com) and `--text`.
  - Hooks for generated pictures (not built): `SOURCES`/`LATER`, `--source openai|flow|generated` stops with "not built
    yet"; the found.json entry and `data-source="generated"` are described in the header.
  - Unchanged: `list`, `pick`, Commons `search` (its loop moved into `commonsSearch`, its output the same), `fetch` of
    library and Commons frames (a Commons plate now goes to 1920 like a hero), `credits` with one or two sources.
- New `assets/ui/panel-photos.json`: nine sets (warm paper, grey concrete, cool landscape, warm landscape, sage nature,
  stone architecture, quiet still life, soft textile, still water), each with family, grounds, pages, moods, Pexels
  colour and orientation, tone, veil strength light and dark, grain, focus, six themes and a generation prompt; and the
  rules (three a page, one a panel, never gaming or place, what to look for).
- `assets/ui/cards.css`, **panel photo mode** (opt-in, `[data-panel-photo]` on `.panel`, `.panel__screen`, `.frame`,
  `.hero__art`, `.hero__window` or the new `.photo-plate`): the `<picture class="pp">` under everything, `object-fit:
  cover` around `data-panel-focus` (or `--pp-focus`); a flat veil of one token (`data-panel-tone` ground (default), bg,
  surface, ink, accent, none; `--pp-k` 30%, `--pp-k-dark` 18% on a dark page), set on the host or once on an ancestor;
  `data-panel-grain` (a still SVG grain); `data-panel-calm` scrim (default: a token veil hugging each window, its own
  shadow kept), blur (a backdrop blur only behind each window, faded at its edge; a masked stage keeps the scrim) or
  none; the panel's own vignette off over a photo; the host's lit ground as the still fallback (the tech mesh on a
  non-panel host), `--pp-avg` while it loads, `data-panel-photo="missing"` hides the picture. `.photo-plate`: the app
  frame's window on a photograph, 24-56px in, cut by the plate's bottom edge.
- `assets/ui/ui.js`: `panelPhotos(root)` (exported, in the default object, run once on import, one capture-phase error
  listener): a panel photo that fails marks its host missing; dev warnings for more than three panel photos and for a
  host that also has `data-fx`. Nothing else changed.
- `references/photos.md`: data-source values, the Pexels section (the key, limits, commands, filters, no hotlinking,
  licence and credit), Panel photos, Generated pictures (later), the credits line, the print rule's one exception,
  Never. `references/cards.md`: Panel photos (what, where, how many, the deal, markup, tone, crop, grain, the readable
  zone, loading and fallback, the app frame on a plate, credits), the two-levels rule, Grounds, Never.
- `HANDOFF-G.md`: SKILL.md lines (needs, section 2, the asset row, steps 3, 4, 5 and 7, checklist), starter.html
  comments, the hero files (agent F), the checker (`visual-empty` accepts a panel photo, contrast sampled over the
  photo, a new `panel-photo` id, photo-set and the others), the generated-picture hooks, what Rasya does.
- Tested: `node --check` on `photos.mjs` and `ui.js`; `ui.js` imported in Node (no DOM). From a scratch folder, no key
  set: `panel` (sets, refusals for gaming and place, deals with and without history, `--set`, `--ground` and the page's
  `data-ground`, `--count 5` capped at 3, `--json`), `search --source pexels` falling back to Commons with the one-line
  hint, `fetch 123 --source pexels` without a key, `--source openai`, a Commons panel and plate fetch with `--history`,
  and the old `list`, `pick` (the history keeps `panelPhotos`), `pick --product-without-photos` and `fetch 326`. The
  Pexels path ran against an offline mock of the API and image host (a dummy key in that process only): `panel`,
  `search` (with `--set`), `fetch --panel/--plate` with a bare-id lookup, a stand-in fetch, the rate-limit message,
  `credits` (line, list, `--text`, `--write`); the dummy key appears in no file or output. **The real Pexels API was
  not called** (no key in the environment), and **nothing was run in a browser**: cards.css's panel photo mode is
  unrendered.

## v4.1 · hero (agent F)
Rasya on test 19 (proofline, hero `triptych`): "messy and unclear": an h1 on the left, a dark poster, a comment card top
right, a route card bottom centre and the trial button alone at mid-right; nothing lined up, no focal point.
- **Why it happened** (the template, not the page): the v4.0 triptych placed its pieces by inline `left/top/width` in %
  of a collage box that drew no ground, so each card floated on the page ground; % offsets of a 628px box never land on
  a column (Proofline's pieces started at x 431, 745 and 594); pieces with no height sat at random gaps; the h1 was
  centred in the height while the button stood in its own span-3 at the right line (the spec asked for it, at 64px with
  a 20px label, which also failed `button-styles`); the sets moved every 2.8 s. `layout-check.js` skipped everything in
  the collage and checked only the button's left edge, so the page passed every check. The collage hero read tidy
  because its frame draws a ground and its window sits in CSS, but its note card was placed by the demo's own page CSS
  (Quarry copied it), so any page could move it.
- `assets/layout/layout.css`:
  - **triptych rebuilt**: a head row (h1 56 on columns 1-6; the lead and the one primary button from column 8) over
    three panels on columns 1-3, 4-9 and 10-12, one height, one picture each (a photograph, or one piece whole and
    centred, `data-fit="cut"` for a window); only the centre panel changes, in place. A fourth panel, a second piece and
    a piece over a panel's photograph are not shown. Below 1024 the centre panel alone.
  - **slots**: the collage's window (`--ly-win`) and one note card (32 in, its right edge on column 9's end), the split's
    one float card (24 in, the same far edge), the centred window and the triptych panels are `!important`, so an inline
    style cannot float a part; a second card is not shown. `--ly-inset` declares the inset line the check accepts.
  - two new heroes: **`masthead`** (h1 96 across the wrap, a hairline, the lead and button on columns 1-4 beside one
    picture on columns 5-12) and **`plate`** (a centred statement, then one plate edge to edge from under the buttons to
    the fold: a wide photograph, or the lit ground with one window on columns 3-10). Tokens `--ly-h1-tri`, `--ly-h1-mast`.
  - the place hero's 48px button is gone: every hero button is the page's `--btn-h` (`.btn--xl` stays in the close).
  - `.ly-collage` (the free collage) kept, marked retired, so pages built before still draw.
- `layout.js`: the triptych's centre panel cycles its `.ly-tri__state`s through the same `ui.loop` (pause disc in the
  panel); the wings never change.
- `layout-check.js`: findings carry `sev`; `lyCheck()` returns FAILs in `findings` and WARNs in `warnings`. New:
  `hero-cta-detached` (FAIL: the primary button over 160px from the h1 and sub-line, in another column, or above the
  h1), `hero-parts` (WARN at four visual parts, FAIL at five), `hero-offgrid` (WARN: a part's left or right edge over
  12px off every column line, the wrap and viewport edges and, for a card in a frame, its inset line). `sparse` leaves
  out a live hold (photo-chapters and the v4 holds), which failed every time at 1440 (test 18 bug 1). The new classes
  (`.ly-tri`, `.hero__plate`) join the visual lists.
- `check.mjs`: prints WARNs after the findings and gives them as `warnings` in the JSON; the exit code counts findings.
- `deal.mjs`: the hero no longer prints grounds or effects; it prints "hero layer: from backgrounds.mjs (effects: from
  effects.mjs on tech only)" (test 19 bug 9). The history lines are untouched.
- `heroes.json`: triptych rewritten (types software 2, service 1; h1 56/40, 40 characters); masthead (service 2,
  software 1, and an `editorial` weight deal.mjs does not read yet) and plate (software 2, service 2) added; split,
  collage and place say their slots and the page's button height; every hero has `parts` and `cta`.
- Demos: `hero-triptych.html` rebuilt (Carte: a cafe photograph, the outputs in turn, the QR menu on a phone);
  `hero-collage.html` loses its own note positioning and gains a commented photo-plate variant (agent G), as does
  `hero-centred.html`; new `hero-masthead.html` (Hollin Joinery) and `hero-plate.html` (Northgate Coffee).
- `references/layout-v4.md`: section 3 "Hero composition" (eight numbered rules), the triptych, masthead and plate
  rows, the centred exception covers plate, the place button, section 6's new findings and WARNs.
- `HANDOFF-F.md`: lines for SKILL.md, gate.mjs, motion.js/css and motion.md, cards.css, sections.md.
- Tested: `node --check` on `deal.mjs`, `check.mjs`, `layout.js`; `layout-check.js` parsed with `new Function`;
  heroes.json parsed; layout.css braces and parentheses balanced; `deal.mjs --stats` for software, service, software
  with photo, product and a game, and `--hero triptych|masthead|plate`, from a scratch folder. **Nothing was run in a
  browser**: the new demos are unrendered and their numbers in heroes.json are planned, not measured.

## v4.1 · operator merge of panel photos (HANDOFF-G)
- SKILL.md:
  - the Pexels key in the needs line;
  - the Tech cards line;
  - the panel-photo asset row;
  - step 3 picks the panels;
  - step 4 adds the `photos.mjs panel` deal line;
  - step 4 adds the lit-ground alternative;
  - step 5 adds the fetch/paste step;
  - step 7 reports the panel set;
  - the checklist adds `[panel-photo]`.
- starter.html: commented panel-photo and photo-plate markup in `#features`.
- The checker part was handed to agent J. The hero plate variant was handed to agent F.

## v4.1 · plans + global history (agent I)
- **Plans.** `references/sections.md` section 3: software has five shapes (`one-transaction`, `docs-led`, `comparison-led`,
  `product-tour`, `manifesto`) and editorial three (`cover-story`, `long-read`, `front-page`), each with its own order,
  optional sections, centrepiece, moment slots, pricing (inline, a table, cards, a calculator, two plans) and questions (their
  own section, docs questions, none, merged, a grid). No plan sets two sections without a picture side by side. The software
  paragraph keeps what every plan shares (the app-frame in the hero or as section 2 or 3, proof only from the brief); an
  editorial paragraph added. Three new recipes written in brief there (`pricing-calculator`, `faq-grid`, `subscribe-form`),
  for `sections-library.md` later. `sections-library.md`: `timeline-rail` takes editorial's dated issues; a line over the
  Fernbill deal.
- **`scripts/plan.mjs`** (`pick`, `list [--md]`, `show`, `check`): deals one plan, never one of the last of its kind (two of
  five, one of three), deals the plan's choices (`bento|split-text-left|features-2x2`) away from the last plans' choices, and
  prints the sections, the hero line and the moments line (`--count`, `--fits`, `--first`). `check` holds the plans against
  both references (recipes, write-ups, calm neighbours, the screen-2 slot, the app-frame's place).
- **Global history, `scripts/lib/history.mjs`.** Every dealer (`start.mjs`, `deal.mjs`, `moments.mjs`, `backgrounds.mjs`,
  `buttons.mjs`, `plan.mjs`) reads and appends `$RASYA_TASTE_HISTORY` (default `~/.rasya-taste/history.json`) beside its
  local `--history`, filtered by page kind and merged by time, so nightly and parallel builds steer apart. A lock file held
  from read to commit, then a merge, a temp file and a rename; `--no-global` or `RASYA_TASTE_HISTORY=off` opt out. Local
  files are now written the same atomic way, content unchanged. `deal.mjs` loads the helper by a dynamic import and falls
  back to the local history when run from a copied `assets` folder.
- **The moments budget** (`moments.mjs`, from the Quarry and Proofline reports): with `--count 2|3` only scroll-driven
  moments count, two at least, one scrubbed or holding; a pointer moment only as `--extra`; `--first <slot>` marks the pick
  for the section after the hero; software and tech may hold two section moments of two kinds, and a statement and a section
  of one kind; software, tech and editorial weigh the v4 moments equal to the upstream ones and always deal one. Before, a
  three-moment software page without photographs always got liquid-type and a v4 moment only 55% of the time. `check` WARNs
  the budget.
- **`backgrounds.mjs page --effect <slots>`**: the slots holding the effect get no layer and the print says so;
  `--effect-quiet` deals a still, quiet pattern or texture there instead.
- **`start.mjs copy-kit [--to assets] [--no-overwrite]`**: step 0's kit copy with `fs.cpSync`.
- **`deal.mjs --type editorial`** (from agent F): `TYPES` and `HAS.editorial`; it deals the masthead, the one hero with an
  editorial weight, until `heroes.json` gives more.
- `HANDOFF-I.md`: SKILL.md steps 0, 3 and 4, the env var, footers.mjs's five lines, the checker and moments.md changes.
- Tested from a scratch folder with `RASYA_TASTE_HISTORY` on a scratch file: `node --check` on every file touched;
  `plan.mjs check`; six deals in one folder then three in another (no plan repeated within two, the second folder steering
  off the first); three builds in parallel, 21 plans and 63 moments, nothing lost, no lock or temp file left; 3,000-deal
  simulations per kind; `--extra`, `--first`, `--effect`, `--effect-quiet`, `--no-global`, `off`, `copy-kit`. Nothing was
  run in a browser.

## v4.1 · operator merge of the hero (HANDOFF-F)
- SKILL.md: the editorial line can deal `--hero masthead`; step 5 hero-slot rule; step 6 layout WARNs listed, not failing; first-screen checklist names hero-cta-detached, hero-parts, hero-offgrid.
- cards.css: `.ly-tri__panel` and `.hero__plate` can host a panel photo.
- Handed on: gate.mjs LAYOUT_FIX + layout WARNs (agent J); sections.md place button and deal.mjs `--type editorial` (agent I).

## v4.1 · operator merge of plans + global history (HANDOFF-I)
- SKILL.md:
  - step 0 uses `start.mjs copy-kit`;
  - step 3 plans from the dealt plan;
  - step 4 deals `plan.mjs` first, with the new moments line (`--first`, `--extra`) and the backgrounds line (`--effect`), and gains the global-history note;
  - the editorial hero deals with `--type editorial`;
  - section 2 points to the plan dealer.
- heroes.json: editorial weights for photo 2, plate 2, film 1, statement 1 and word 1, besides masthead 3. Before this, every editorial page got masthead. Now 1,000 dealt pages spread over 4 heroes at 25% each.
- A stray `~/.rasya-taste/history.json` written by a hero test was deleted before any real build.

## v4.1 · footers (agent H)
Rasya on the first v4 tests: "the footer still isn't good", with Trove and Cronicle (footer.design) as the bar.
- **The footer library, `assets/footers/`.** Five endings, each a whole `footer.closing` (row 1 the close, row 2 the
  links, the kit's `.closing__cta` and `.closing__links`), `data-footer="<id>"` on the footer:
  - `footer-emboss`: a hairline, the closing line in the display face on span-7, a note and the button on span-4 from
    column 9; one row of links; the name pressed into the surface grey (letterpress: a background clipped to the
    letters in a shade of the ground, a light offset shadow for the floor and the lower lip; every tone is the
    ground's lightness moved by relative colour, so it holds light and dark; `data-press="raised"`; a flat tone
    without relative colour);
  - `footer-fade-word`: a centred close and button, a row of underlined links, the name huge and pale fading out
    toward the foot (a mask on the word), an optional ornament slot on one letter (a flower in the template);
  - `footer-split-close`: the split close with the kit's columns, no wordmark;
  - `footer-outline-fill`: the kit's head row and columns on the inverse ground; the name as an outline that fills
    from the foot up as the footer comes up, scrubbed on `window.rtMotion` (filled under reduced motion and without
    the scroll stack; counts as one of the 2-3 scroll moments);
  - `footer-index`: the head row, then the page's sections as a numbered index in the display face, read down then
    across, the arrow coming in on hover.
- The wordmark is a layer beside the `.wrap` (`<div class="ft-mark" aria-hidden="true" data-footer-wordmark>`), sized
  `clamp(--ft-min, --ft-fit * 1vw, 72svh)`, spanning the footer with `left: 0; right: 0` (never 100vw); the footer
  pads its foot for the slice that shows and clips the rest (`overflow: clip`), so there is no sideways scroll and the
  page's foot crops the word. `footers.js` (defer, once): fits `--ft-fit` to the drawn letters (load, fonts, width),
  and runs outline-fill's scrubbed fill. Nothing loops; reduced motion leaves everything still.
- `footers.css`, `footers.js`, `footer-<id>.html` (demo pages: the builder copies the `<footer>` only), `index.json`
  (the library with kinds, mood, nav and button fits, the close to pass to buttons.mjs, the display face; and the kit's
  own footer and close lists by kind, so the dealer covers both), `demo.html` (each ending at 1440x900 and 390x844,
  light and dark).
- **`scripts/footers.mjs`** (`pick`, `list`, `fit`, `check`): deals the ending as one pick, the kit's footer x close
  pairs and the library's endings, and replaces the one-liner's footer and close fields. A wordmark ending (a library
  wordmark or `close-word`) weighs under half a plain one, never follows another, and the last ending never repeats;
  `--nav`, `--buttons`, `--type` (serif or sans display), `--mood`, `--photo`, `--no-wordmark`, `--exclude`,
  `--library-only`; `--name` prints `--ft-fit` and drops the wordmarks for a name over 12 characters. History: the
  local `--history` file and the global one through `scripts/lib/history.mjs` (key `footers`; a kit pick kept as
  `<footer>+<close>`). `check` reads a built page without a browser (the attribute, the stylesheet and script, the
  `.wrap`'s two rows, one giant name a page, aria-hidden, the name in the footer's text, no 100vw).
- **The v3 rule reversed.** rasya-taste-v2 banned the giant ghost wordmark as the template ending. v4.1 deals it as an
  option, crafted (edge to edge, cropped, one idea: pressed, fading, filling) and at most once a page, never on two
  pages in a row, never with another giant name. `references/footers.md`: the library, when to use which, the rules
  (AA for every real word, the wordmark the only low-contrast type, no sideways scroll), building one, the knobs.
- `HANDOFF-H.md`: SKILL.md (the asset row, the deal line and the lists without footer and close, the build, check,
  report and checklist lines), starter.html (the CSS link, the comments, the script line), sections.md and system.md,
  the consistency.mjs exemptions for `[data-footer-wordmark]` (rhythm block, T1-structure, both view builders,
  optionally `under()`) and what to leave alone, layout-check.js (nothing now), the history, three questions for Rasya.
- Tested from a scratch folder with `RASYA_TASTE_HISTORY` on a scratch file and `off`: `node --check` on
  `footers.mjs` and `footers.js`; `index.json` parsed; `list`, `fit`, `pick` for every kind with and without history,
  `--json`, the flags and their errors, a history file shared with other dealers' keys; `check` on the five templates
  (pass) and on broken pages (missing stylesheet, two wordmarks, a wordmark and close-word, no aria-hidden, the name
  missing, 100vw: each caught); 1,500-2,000-deal simulations per kind (wordmark endings 24-35%, never two in a row,
  never the same ending twice in a row; a place gets the kit only). **Nothing was run in a browser**: the CSS, the
  letterpress, the fade, the ornament and the fill are unseen.

## v4.1 · operator merge of footers (HANDOFF-H)
- SKILL.md: the ending asset row; the `footers.mjs pick` deal line (after the one-liner, before `buttons.mjs`); the one-liner lists lose their footer and close fields; the build step for library endings; `footers.mjs check` in step 6; the report and checklist name the ending.
- starter.html: links `footers.css`; a commented `footers.js` line.
- sections.md, system.md: the ending is dealt by `footers.mjs`.
- Pending: the checker's `[data-footer-wordmark]` exemptions (HANDOFF-H section 4), merged after agent J.

## v4.1 · checker fixes from tests 18/19 (agent J)
`scripts/consistency.mjs`, `scripts/gate.mjs`, `assets/motion/scroll.js` (`motionSelfTest` only). Cut short at the operator's
call (a bot test): what is done passes `node --check`; what was not started is marked **not done**.
- Quarry 2, `lenis` wheel WARN flickers: **fixed**. The probe reads `lenis.targetScroll - lenis.animatedScroll` in a wheel
  listener added after Lenis's (before any frame): 30% or more of where it lands still to go is a glide. Else it counts 5
  frames after the first scroll event (was 80 ms), and with a median frame over 50 ms the wheel is not judged.
- Quarry 3, a live v4 hold's moving parts: **fixed**. `momentPart()` in the page lib: `.mo-sp__panel`, `.mo-gr__track`,
  `.mo-pe__media`, `.mo-pe__title > span`, `.mo-ss__obj`, `.mo-ss__notes > li` inside a live hold
  (`[data-moment-mounted].is-live`) are left out of spill, cut-text, off-grid and the pixel contrast, as `.rbg` is. The
  rhythm's band read (SR-4 T-dom) skips those parts live or still (the 390 FAIL was a still panel holding the intro).
- Quarry 7, full run 13-16 min: **fixed** for the block named. `scroll-motion` runs every width with `--quick`; in a full
  run the first width, and the pins alone at 820 and 390, never 1024 or 768; past the first width it is skipped when the
  first had no ScrollTrigger. The other per-width blocks were not profiled (**not done**).
- Proofline 2, self-test and `scroll-moments` pass on 0 triggers: **fixed**. `motionSelfTest()` gets `scrollMoments`
  (sections with a ScrollTrigger that pins, scrubs or runs something, or a mounted kit moment of kind scroll or transition,
  picture-develops aside) and, without reduced motion, fails under 2 and on 0 ScrollTriggers with 0 onReady callbacks.
  `scroll-moments` no longer counts a kit enter moment (text kind, picture-develops: named, not counted) and FAILs, without
  reduced motion, a page whose GSAP drives nothing. `motion-libs` unchanged (it judges the libraries). Test 19 would now FAIL
  (pinned-chapters runs on `lib.scrub`, counter-rolls enters once).
- Proofline 3, contrast on clipped odometer digits: **fixed**. `contrastCands` reads only the part of each line its clipping
  ancestors leave (a line clipped away is skipped), and aria-hidden text inside a mounted moment is left out
  (`momentPart`). A quiet, still layer (`data-bg-intensity="quiet"`, not beams, grid-pulse or flowing-lines, no
  `data-bg-run`) is the token ground (`solid`), not pixels.
- Proofline 4, `cut-text` FAIL full / WARN quick on counter-rolls: **fixed**. aria-hidden text a mounted moment set inside
  itself is left out of cut-text in both modes (the moment root's own aria-hidden is not: liquid-type's cut wordmark at the
  close still FAILs, which may be a real clip).
- Proofline 5, `hidden-content` and `empty-visual` on pinned-chapters' other frames: **fixed**. Inside a live hold
  (the four v4 holds, pinned-chapters, photo-chapters) a hidden part is a frame that is not current: `hiddenProbe` (the
  dead-IntersectionObserver walk; the nojs and reduced walks see no live hold), `ghostPics` and the faded-frame read of
  `visualCands` pass it.
- Proofline 6, `scroll-reveal` on a diagram's colour transition: **fixed** both ways. IO_HOOK records each animation's
  properties; an IO-started animation of none of opacity, transform, translate, scale, rotate, clip, clip-path, filter, mask
  or visibility is no reveal, and `.dg`/`[data-diagram]` parts are passed. The reveal walk skips a change `revealHow` can
  only call "changes" (no fade, move, mask or blur).
- Proofline 7, `hover-move` on plan cards: **fixed**. A card is linked when it is an `a[href]` or holds a link whose box,
  or absolute `::before`/`::after`, covers 90% of it.
- Proofline 10a, gate widths: **fixed**. The gate's checker runs `--quick --widths 1440,820,390` (header, quick-look line
  and comment updated). The layout check keeps 1440x900,390x844. Run time: see HANDOFF-J.
- Proofline 10b, edits after a PASS never gated: **fixed**. A PASS stores `pageFp` (sha1 of the page file and the local
  HTML/CSS/JS it loads). A hook stop or a manual run (not `--quick`) with no open build looks for one passed build here or
  one or two below whose page changed, PASS under a day old, same session (or none): `build.done.json` goes back to
  `build.json`, gate.json gets status active and a `reopen` history entry, rounds are kept with at least one fix round left
  (`rounds = max(rounds, round + 2)`, 10 at most). Two changed passed builds below: none reopened.
- Proofline 11, a silent full run: **fixed**. One line as each width completes (time, FAIL and WARN so far), and after the
  sweep and the 320 pass: stdout with the text report, stderr with `--json`.
- Crops overwritten by a second run: **not changed**. `--out <dir>` already exists (the gate passes
  `.taste-skill/gate/consistency`); the default folder is still cleared each run. Use `--out` for a verify run.
- HANDOFF-F section 2 (coordinator): **merged**. LAYOUT_FIX lines for `hero-cta-detached`, `hero-parts`, `hero-offgrid`;
  `check.mjs --json` size `warnings` go to the gate's WARNs (`from: 'layout'`), never blocking. HANDOFF-F.md was not on disk;
  the fix texts are written from `layout-check.js`'s rule notes.
- HANDOFF-G section 4 (coordinator):
  - `visual-empty`/`empty-visual` accept a loaded panel photo: **partly merged**. `visualCands` (empty-visual) passes a
    loaded `[data-panel-photo] > .pp img`. visualMod's `visual-empty` and the missing-photo WARN (`data-panel-photo="missing"`)
    **not done**.
  - contrast over the photograph: **merged**. `under()` returns a `panel photo` ground for words on a host (not missing)
    whose `.pp` covers the point; a `.ui` window's own fill is met first. busy-ground reads it like a picture.
  - new id `panel-photo`: **not done**.
  - `photo-set`, `photo-print`, `photo-repeat`, `card-visual`: **not done**.
- Tested: `node --check` on all three files; `consistency.mjs` and `gate.mjs` with no arguments (usage; GATE: OFF in an empty
  folder). **Nothing was run in a browser.**

## v4.1 · operator merge of checker fixes (HANDOFF-J) and footer exemptions (HANDOFF-H §4)
- consistency.mjs: `[data-footer-wordmark]` is left out of the rhythm block, T1-structure, both view builders and `under()`, in 7 places. A dealt wordmark ending no longer trips containment, fit, off-viewport, cut-text or contrast.
- Timeouts for the gate's 3-width runs:
  - the Stop hook `timeout` goes from 600 to 900 s;
  - the gate's `BUDGET` from 570 to 870 s;
  - the checker's limit inside the gate from 420 to 660 s.
- SKILL.md step 6:
  - the full checker run gets 20 minutes;
  - the gate widths are 1440, 820 and 390;
  - an edit after PASS reopens the build;
  - `--out` is available for verify runs.
- gate.md, motion.md: v4.1 notes on the gate widths, the reopen, `scroll-moments` and the self-test.
- The `[panel-photo]` checklist tag is held back until the checker has that id.
- Not done yet, left from HANDOFF-G §4:
  - the `panel-photo` id;
  - visual-empty's missing-photo WARN;
  - the `photo-set`, `photo-print`, `photo-repeat` and `card-visual` adjustments.

## v4.1 · generated pictures (OpenAI gpt-image)
- photos.mjs `generate`:
  - reads `OPENAI_API_KEY` from the environment only;
  - model from `OPENAI_IMAGE_MODEL` (default gpt-image-1), quality from `OPENAI_IMAGE_QUALITY` (default low);
  - writes `.taste-skill/generated/g<hash>.jpg` and a `found.json` entry.
- `fetch` takes g-ids, from that folder only.
- `credits` leaves generated pictures out of the footer line and names them for the report.
- `panel` generates from the set's prompt with `--source openai`. It also does so by default when `OPENAI_API_KEY` is set, unless `RASYA_IMAGE_SOURCE` says otherwise.
- `OPENAI_BASE_URL` sets the endpoint for a proxy or a test mock.
- photos.md: "Generated pictures" replaces "Generated pictures (later)".
- SKILL.md: the picture source order and the generate line.
- Tested against a local mock of the API: generate, panel, fetch and credits. The key appears in no file or output.

## v4.2 · nav-generic check (agent K)
- consistency.mjs: new block `navGenericMod`, id `nav-generic`, placed after the basics block (menu-toggle) and run on the walked tab.
  - It runs at the first width when that width is 1000px or wider (the gate's 1440), `--quick` too, never at 820 or 390. `--no-nav-generic` skips it.
  - It costs one Lenis glide to y=1200 and a read there, then a jump back to 0: about 2.5 s.
- The bar it reads: `header.nav[data-nav]` (agent N's library), else `[data-nav]`, `header.nav`, the page's header or banner, or a top nav. The bar sits at the top of the first screen, is half the screen wide or more and holds two links.
  - Its pieces are what shows in it: links and buttons whole, pictures, lines of text, painted blocks.
  - Not counted: the skip link, closed menus and the phone toggle.
- The ten items of `research/drafts/navbar-patterns.md` section 3, scored as agent K's brief gives them:
  1. template layout;
  2. default link type;
  3. weak wordmark;
  4. hairline-only bar;
  5. CTA equal to the hero's primary `.btn`;
  6. off-grid against the hero h1's left edge and `.wrap`;
  7. no brand element (`[data-nav-element]`, a figure outside the links, a mark beside the logo, a colour block);
  8. unchanged at y=1200;
  9. generic button;
  10. stock labels.
- Choices the brief left open:
  - Item 1 allows the starter's one plain second action in the button's group (`.nav__actions`).
  - Item 3 counts a drawn or painted `.mark` (the kit's dealt marks) as a mark.
  - Item 4 also takes `main`'s fill and the part under the bar as the ground. A shadow, a border on another side, a bottom border over 1px, a painted pseudo-layer or a bar narrower than 90% of the screen is separation.
  - Item 5 compares the nav's button, filled or outlined.
  - Item 6 reads a centred h1 against its container's left edge. Its .wrap half passes when either the nav's inner box or its pieces' span sits on the `.wrap`.
  - Item 8: a header class change with no visual change counts as unchanged. A static bar that scrolls away with no fixed bar in its place is a hit. A page that scrolls under 300px is not judged.
  - Item 9 counts an icon, a kbd, an arrow, a figure, or a visible `::before`/`::after` with words or a masked icon as extras. A layer scaled under 4px is not counted.
- Verdict: 4 or more hits FAIL, exactly 3 WARN. 0-2 hits PASS only when item 7, 6 or 8 is measured and missed; else WARN.
- The finding names every hit with its measured value, then the items missed. Its fix points to `references/navs.md` and `scripts/nav.mjs`. The full scorecard prints with `CC_TIMING=1`.
- Registered in the module list, `ORDER` (after `nav-covers`), the fix map (through the block's `fixes`), the header comment and the usage lines.
- gate.mjs: no change. The gate takes each finding's fix from the checker's report and has no fix map for consistency ids. A nav-generic FAIL blocks like any other; its WARN does not.
- gate.md: one line listing the id.
- Tested: `node --check`; `--quick --widths 1440` on two gallery pages, a mirrored copy and two edited copies, one Chrome at a time:
  - es-saas-invoice-kerani: FAIL, 5 hits (1, 4, 5, 7, 8);
  - es-ai-devops-forge: FAIL, 6 hits (1, 4, 5, 7, 8, 9);
  - the Kerani copy with a `[data-nav-element]` datum, mono caps links, its own CTA label and a scroll class that changes the bar: PASS, 1 hit (4);
  - the same copy with the class but no style for it: PASS, 2 hits (4, and 8 with "its class changes and nothing it shows changes").
- Not tested: a page without Lenis, a static header that scrolls away, and a library nav from `assets/navs/` (none existed yet).
- operator: nav-generic item 2 counts link weights up to 500 as default (the kit's links are 500).

## v4.2 · nav library (agent N)
Rasya's ten newest SaaS and AI pages all shipped the kit's bar (7 plain `header.nav`, 3 `nav--centre`): "logo, 3-5 links, Product with a chevron, a CTA pill", nothing like the navbar.gallery bars she set as the standard. Research: `research/drafts/navbar-patterns.md` (local).
- **The nav library, `assets/navs/`.** Twelve archetypes as kit navs. Each keeps the kit's `header.nav` parts and adds:
  - `data-nav="<id>"`, `data-nav-scroll` (its scroll behaviours) and `data-nav-menu` (its phone menu);
  - its own `.nv-*` children.

  The kit's parts it keeps are `.wrap.nav__bar`, `.nav__logo`, `.nav__links > .nav__item > .nav__link`, `.nav__actions`, `.nav__toggle` with `aria-expanded`, and the skip link first. system.js's sheet, Escape and `lenis.stop()` keep working.
  - `ruled` (A1): ruled cells on the page's column lines, the action as the full-height end cell; the cell of the section on screen takes the accent line.
  - `split-mark` (A2): the kit's nav--split as a masthead, the name 30px with its symbol; past the hero the word folds to the symbol.
  - `over-media` (A3): 18px bold words over the photo hero, transparent to solid, hides going down; a live local clock.
  - `pill` (A4): open across the `.wrap`, collapses to a centred capsule by transform; a countdown chip.
  - `dock` (A5): the words in a bottom dock (accent tile, mono segments); past the hero the top row folds and the dock takes the action.
  - `mono-strip` (A6): mono caps throughout, a `/ section` path that follows the section on screen, hides going down.
  - `corner-index` (A7): words pinned to columns 4, 6 and 8 on no ground, back solid on the way up; the studio's clock.
  - `preview-mega` (A8): one word opens a panel on the bar's own ground with four product photographs, the page dimmed; the newest product's chip.
  - `takeover` (A9): a quiet bar with a Menu word; the menu is a full-screen page in the display face (desktop too), Tab kept inside.
  - `rail` (A10): numbered tabs in the left gutter, the current one filled.
  - `live` (A11): one real number in tabular mono with a still dot, scrubbed by its section; the action split with its price.
  - `object` (A12): the bar in the brand colour with its edge cut as an object (`data-edge`: scallop, ticks or wave).
- **The rules applied:**
  - one `data-nav-element` (datum, material or object) a bar;
  - type as rule 3 (mono caps 12-13, or sans 13-14 with the name 2x, or 18px bold over a photograph);
  - a CTA unlike the hero's (an arrow, a price or a count);
  - five words and 45 characters at most;
  - the logo and the action on the `.wrap` lines;
  - palette tokens only: no gradient, glass, white border, em dash or loop.
- **The phone menus**:
  - takeover (on the inverse ground);
  - sheet (a rounded panel, the page dimmed);
  - dock (the menu button and the action at the foot; `--bar` pads the sections).

  Each sets the words in the display face at 32-48px, numbered, and shows the action and the element.
- `navs.css` styles the bars by `data-nav-menu`. A kit pick carries `data-nav="nav-*"` and only gets the section mark.
- `navs.js` (defer, after scroll.js) does the following:
  - sets `is-scrolled`, `is-solid` (past the hero), `is-pill` and `is-hidden` (down and up; never while it holds the focus, the pointer or the open menu);
  - sets `aria-current="location"` on the section on screen, plus `data-nav-path` and `data-nav-on`;
  - reads the scroll from `rtMotion.lenis` when it runs, else the window, and makes no ScrollTrigger;
  - runs the datums: the scrubbed number (data-to under reduced motion), the clock and the countdown;
  - measures the pill's capsule and the fold;
  - lands anchor jumps under the bar (a padded section on its top, anything else the bar's height lower);
  - keeps Tab inside the takeover, closes a sheet when the dimmed page is tapped, and closes the mega panel on scroll.

  Under reduced motion every state is still set with no transition.
- `index.json`, per nav:
  - archetype, kinds and per-kind weights, mood, type, scroll (behaviours, classes and text), mobile, element (type, what, the prompt, the alternative), CTA, js;
  - needs: over-media only over the photo hero, live with `--has datum`, preview-mega with `--has products`;
  - the heroes it sits best over or avoids;
  - its `kitEquivalent`.

  The file also holds the shared contract and the kit's four with their lists by kind.
- `demo.html` frames each template three ways: 1440 at the top, 1440 past the hero (or the open panel or menu) and 390 with its menu open. `_frame.css` and `_frame.js` are the template pages' scaffolding only.
- **`scripts/nav.mjs`** (`pick`, `list`, `check`):
  - deals one nav for the kind, the hero and `--has`, away from the last picks (key `navs`, local and global through `scripts/lib/history.mjs`);
  - never repeats the last nav, and the last six weigh less;
  - keeps the kit's four at `weights.kitShare` (0.15) of the pool together after the history.

  It prints:
  - the template, the CSS and JS lines;
  - the brand-element prompt;
  - the CTA and word rules;
  - the `--nav <kitEquivalent>` for `footers.mjs` and `buttons.mjs`, which run unchanged;
  - the plan line.

  `check` reads a built page without a browser:
  - data-nav and its classes, data-nav-menu, one element, five words and 45 characters;
  - the CTA against the hero's primary, navs.css and navs.js, aria-expanded, the skip link;
  - no em dash, `[bracket]`, inline gradient or backdrop-filter;
  - a valid clock zone and the datum's data-to;
  - the nav's needs.
- `references/navs.md`:
  - the library and the deal;
  - when to use which;
  - the eight rules tightened from the research's section 4;
  - scroll, phone, building one, the check, mistakes and knobs.

  It notes that this replaces the kit's four-nav choice.
- `HANDOFF-N.md`:
  - SKILL.md: the asset row, the deal line after the hero and before footers/buttons, the one-liners without their nav field, the build, check, report and checklist lines;
  - starter.html: the CSS link, the JS line, the header and body comments;
  - the pointers for sections.md, sections-library.md, system.md, buttons.md, footers.md and motion.md;
  - the checks agent K's `nav-generic` and `nav-family` may trip by design;
  - three questions for Rasya.
- **Tested** from a scratch folder, with `RASYA_TASTE_HISTORY` on a scratch file:
  - `node --check` on `nav.mjs`, `navs.js` and `_frame.js`; `index.json` parsed; the CSS's braces balanced, no gradient, no hex;
  - `list`, `pick` for several kinds and heroes, with and without `--json`, and the errors;
  - local and global history written to the scratch files only;
  - 2,000-deal simulations for eight kind and hero cases: the kit at 13.9-15.3%, never the same nav twice in a row;
  - `footers.mjs` and `buttons.mjs` taking the printed `--nav`;
  - `check` on the 12 templates (all pass, no WARN) and on two broken pages (each fault caught).
- One headless 1440 shot of `demo.html` with `shoot.mjs`, read in slices; every state showed as designed. Changed after the shot and not shot again:
  - the open phone menus' text action is no longer in the display face;
  - ruled's actions stand on the column-9 line;
  - the scallop is 24x12;
  - live's unit is "°C" alone;
  - preview-mega's bar and panel sit on the surface.
- Not run: `consistency.mjs`, `nav-generic` or layout `check.mjs` on the templates; reduced motion; keyboard; 1024, 820 and 768.

## v4.2 · operator merge of the nav library (HANDOFF-N)
- SKILL.md:
  - the nav asset row;
  - the `nav.mjs pick` deal line after the hero;
  - `footers.mjs` and `buttons.mjs` take the `--nav` that nav.mjs printed;
  - the one-liner lists lose their nav field;
  - the build step for library navs;
  - `nav.mjs check` in step 6;
  - the report and checklist name the nav.
- starter.html: links `navs.css` and `navs.js`, and the header carries `data-nav`.
- sections.md, system.md: the nav is dealt by `nav.mjs`.
- Verified: `consistency.mjs --quick --widths 1440` PASSes `nav-generic` on the pill and mono-strip templates. Kerani and Forge from the gallery FAIL it.

## v4.3 · asset pipeline (agent A2)
**Paused (24-25 Nov 2026) at a safe point, at Rasya's request: two agents at once.** `photos.mjs` passes `node --check`.

Done:
- `assets/ui/image-styles.json` (new): 12 style presets, each with an art-direction suffix (`{palette}`, `{ground}`), a negative list (sent as "Avoid: ..."), the kinds it suits and when to use it. Also defaults by kind, the cut-out ground, the grey fallback ground and the tails.
- `photos.mjs generate`:
  - `--transparent` (always with `--kind cutout`): `background: "transparent"`. The format is PNG when ffmpeg is on the path, else WebP with alpha from the API (WebP refused: PNG).
  - The alpha is read from the file: the PNG colour type (6 or 4) or tRNS, and an 8-bit RGBA PNG is decoded for its clear share and corners; WebP by its VP8X or VP8L bit.
  - A model that refuses transparency gets the same picture on flat mid-grey (PNG) and is marked `cutout: "needed"`. The advice: rembg, else a rough ffmpeg colorkey, else a matching ground.
  - `--style <preset | "free words">`, `--kind`, `--ratio 1:1|4:5|3:2|2:3|16:9`, `--palette`, `--brief`, `--force-style`, `--no-style`, `--dry-run`.
  - Size map: 4:5 asks 1024x1280, 16:9 asks 1536x864. A refused size is asked again at the nearest supported one, remembered for the run.
  - One style a page: `.taste-skill/image-style.json`. Another style WARNs and exits 1 without `--force-style`, which makes it the page's style and keeps the old one under `previous`. With no `--style`, the page's style is used. `--set` (panel sets) is never locked.
- `fetch`: a generated PNG with alpha becomes a WebP with alpha (checked after; else it stays PNG). A WebP is copied as is, never flattened. The tag gets a cut-out comment, a "not cut out yet" comment or a CSS crop comment for a ratio made at another size.
- `photos.mjs styles` lists the presets, the defaults and the page's style.
- `photos.mjs recipe-assets --recipe <id> --brief --out [--palette] [--dry-run] [--with-optional] [--only] [--force-style] [--product|--audience|--world] [--index] [--json]`:
  - fills `{product}` `{audience}` `{world}` `{palette}` `{name}` and says where each came from;
  - generates each slot in its style, ratio and transparency;
  - prints video and model3d with the recipe's fallback and a still-render command;
  - writes `.taste-skill/recipe-assets.json` and prints the fetch line. Without a key it prints the prompts, writes the manifest with "want" file names, says "not generated" and exits 0.
- Tested against a local mock (`OPENAI_BASE_URL`), in the scratchpad:
  - generate dry-run; generate transparent + style + 4:5 (1024x1280 refused, made at 1024x1536);
  - the lock: WARN and exit 1, typo stop, the page style reused, a panel set not locked, `--force-style`;
  - fetch keeping the alpha (VP8X alpha flag set) and an opaque picture as WebP;
  - credits ("every picture on the page is generated: no credit line");
  - `panel --no-search`;
  - recipe-assets: dry-run, no key, one real-mock run (wire-figure: render + video + model3d).
  - The key appears in no file or output.

Not done yet:
- Tests: the refusal fallbacks (mock models `no-alpha`, `opaque`, `no-webp`), WebP from the API without ffmpeg (PATH without ffmpeg), recipe-assets with count 3 cut-outs, an optional slot, 16:9 illustration, `--hero` on a photo slot, the free-words and typo style in a recipe, and a recipe clash with the page's style.
- image-styles.json: move the "soft shadow" words of studio-product-photo, 3d-clay and 3d-render-glossy into their `ground`, so a transparent cut-out is not asked for a shadow.
- `references/photos.md` "Generated pictures": cut-outs, presets, one style a page, recipe-assets, what cannot be generated, prompt-writing rules. Also the "Never: AI images" and "Illustration only when the client owns it" lines, which now need a pointer to recipe pictures.
- `HANDOFF-A2.md`: SKILL.md lines (the asset step order after the hero recipe deal, the needs line on image styles).
- The photos.mjs header comment about generated sources being "not built" is stale (left as it was).

## v4.3 · interactive backgrounds (agent B2)
Paused on request (two agents at once). Nothing new is dealt yet: `index.json`, `bg-library.css` and `backgrounds.mjs` are unchanged.

Done:
- `assets/backgrounds/bg-library.js` rewritten. The three animated layers work as before (checked headless on `demo-library.html`: beams, grid-pulse cells and flowing-lines render; `node --check` passes).
- Added to the same file (inert until the CSS and index entries land): the runtime for nine interactive layers (`dot-field`, `grid-trail`, `spotlight`, `ripple`, `magnetic-lines`, `particles`, `topo-warp`, `tilt-grid`, `crosshair`) and for `data-bg-react` on dots, grid, grid-pulse and glow. Covered so far:
  - listeners on the section only;
  - fine pointer only, with touch idle and reduced-motion still states;
  - one shared loop (GSAP ticker or one rAF), stopped at rest, off screen and in a hidden tab;
  - DPR capped at 2, eased cursor, reach scaled to the section;
  - a text gate that keeps every response off the words;
  - `html[data-bg-still]` as a checker switch;
  - `rbg.stats()` for frame cost.

Not done:
- `bg-library.css`: the styles of the nine layers (the still states, `.rbg-canvas`, `.rbg-lit`, spotlight and tilt masks, crosshair, the dots and glow react rules).
- `index.json`: the nine entries, `reacts` on dots, grid, grid-pulse and glow, and the `libraryCaps` interactive cap.
- `scripts/backgrounds.mjs`: `--interactive`, `--no-interactive`, printing `data-bg-react` and `data-bg-pattern`, the history entries.
- `demo-library.html` (the new layers), `demo-interactive.html` (a scripted fake pointer), and the headless shots and frame-cost check.
- `references/backgrounds.md`, `HANDOFF-B2.md`.

## v4.3 · statement as a revealing paragraph (agent S)
Rasya on the ten newest gallery pages: most hold a "statement", a few words set huge and alone in a full screen ("Keep by default", "30 first emails a day", "One button at 3 a.m.", "Retire the recap sheet"); she wants a paragraph that reveals as you scroll. And, from the coordinator: the pages are too short (a hero and 5-7 sections, 6-9 screens, against 10-14 sections on the reference SaaS sites).
- **Where the big short statement came from.**
  - `sections.md` and `plan.mjs`: every one of the five software plans and the three editorial plans dealt a statement slot (`statement`, `promise`, `belief`, `pull`, `standfirst`, `statement`; comparison-led ran one on its table's lead line: Forge's "One button at 3 a.m."), each "12 to 40 words, set large", one full screen.
  - The statement slot dealt `giant-type-pass` (2-4 words at 12vw, a photograph in the letters: Keep, Kerani, Forge) and `letters-assemble` (2-5 words very large: Scout, Steward), besides `word-highlight`, `phrase-marks`, `counter-rolls` and `liquid-type`.
  - The kit has no `.statement` CSS: the section was a plain `--h: 1` screen, so a short line stood alone in 900px.
  - `copy.md` and `copy-moves.md` had no statement advice; "1 to 6 words" for headings made the line a slogan.
- **The statement is a paragraph that reveals** (`sections.md` section 1, The statement; `sections-library.md`, new recipe `statement`; `copy.md`, `copy-moves.md`): one paragraph of 25-60 words (never under 12) in the display face at `--t-statement` (48px at 1440, 28 at 390), about 42 characters a line (`--statement-measure`, 22em), an optional kicker and one line or link under it, no h2, no picture, in a band sized to it. Two of five software plans (`change` in one-transaction, `stance` in manifesto) and one editorial plan (`standfirst` in long-read) hold one; never the ids `statement` or `belief`.
- **New moment `paragraph-reveal`** (`assets/moments/paragraph-reveal/`: `moment.js`, `moment.css`, `meta.json`, `demo.html`; v4, `drive: scroll`, `gsap: true`, slot `statement`, `phoneRuns`): each word (or line, `"by": "line"`) from `--muted` at 30% to ink as the paragraph's top climbs from 80% to 35% of the screen, one ScrollTrigger timeline scrubbed through `window.rtMotion` (a `--p` variable a word, colour by `color-mix`), finished before the section's top reaches the top of the screen; never pinned, runs on a phone; reduced motion, no script or no layer: every word in ink (the words are split only once the layer is ready).
- **Dealing:** the statement slot deals only `paragraph-reveal`, `word-highlight` and `phrase-marks` (their `needs` now a 25-60 word paragraph in a band; their CSS reads the statement tokens). `giant-type-pass` and `letters-assemble` retired (`meta.retired`, weight 0); `counter-rolls` fits a section (the figures' last row or a band of figures); `liquid-type` the hero only. `index.json` and `gallery.html` rebuilt (26 moments, 19 dealt). `moments.mjs`: a pick never starts on a moment nothing left can join (a small search, first for a deal that meets the budget): 4,800 simulated deals over 12 configurations now come out whole and within the budget (before, editorial pages came out a moment short 25% of the time).
- **Heights** (`system.css`, `sections.md` section 1): `data-screen="band"` on a section sizes it to its content and padding, one screen at most (a logo row, a band of figures, a quote, the mid-page call, the statement), at every width; `data-screen="tall"` is three screens. The statement tokens `--t-statement` and `--statement-measure` (a place's statement smaller).
- **The length** (`plan.mjs`, `sections.md` section 3): a software page deals 9-12 sections after the hero, an editorial page 8-11 (close and footer not counted), under 8 too short unless the brief is thin. Each plan is its core plus sections from its kind's pool (software 14: proof row, figures, how, roles, worked example, the old way, a quote, integrations, security, voices, resources, changelog, the mid-page call, questions; editorial 13), each with its condition, key, height and zone, dealt away from the last pages' picks (`planPool` history, local and global) and placed where no two sections without a picture and no two bands meet; reserves in order for a condition the brief does not meet; `--has <keys>` lets the dealer keep only what the brief gives (THIN BRIEF under 8); `--length N`; `pool [--md]`. Every line prints its height (band, 1, 1-2, 2, 2-4, 3) and its condition. The moments line takes its count (2, or 3 on nine sections with three slots one of them not a plain section), fits and `--first` from the dealt page. Six new generic recipes named for the next step's reference map: `use-cases`, `security`, `worked-example`, `stats-band`, `quote-wall`, `cta-band`. `check` deals each plan 400 times (3,200 deals: no fault, lengths 9-12 and 8-11 with the brief's keys).
- **`consistency.mjs`**, new block `page-shape` (first width, `--quick` too, `--no-page-shape`), registered in `MODULES`, `ORDER` (after `one-screen`), the fixes, the header and the usage:
  - `statement-short` FAIL: a section after the hero whose main text block (its largest heading, paragraph or quote) holds under 12 words at 56px or more, nothing of weight beside it on that screen (no picture or background picture of 120x80 or more, no UI, frame, card, table, form or diagram, no list over 2 items), the section 70% of a screen tall or more. WARN: a display paragraph (40px+, 12+ words) with no ScrollTrigger on, round or in it and no `[data-moment]` on its section. The fix points to `moments.md` (paragraph-reveal) and `sections.md`.
  - `page-short` WARN: a software (not gaming) or editorial page with under 8 sections after the hero.
  - Bands in the rhythm block: section-height passes a band up to one screen (12px of glyph overhang in its fit) and a tall section at three; the screen grid starts again at a band's foot; one-section's strides start again at each band's foot and no view starts inside a band; one-heading leaves a band's headings out; section-air does not ask a band to fill 55%; section-tile, one-screen, section-gaps and the no-visual/text-only reads leave a band out.
- **Tested** (Chrome headless, one page at a time, nothing left running; pages fetched with curl and mirrored into the scratchpad):
  - `statement-short` FAIL on Keep `#belief` ("Keep by default", 3 words at 223px), Forge `#compare` ("One button at 3 a.m.", 5 words at 173px), Kerani `#belief` and Scout `#limit`; `page-short` WARN on all four (5-6 sections).
  - A Keep copy with `#belief` replaced by a 42-word `paragraph-reveal` band (`#stance`, 585px at 1440, five lines): `statement-short` PASS; section-height, one-section, one-heading, section-tile, one-screen, no-visual, text-only PASS at 1440; at 390 nothing told on the band (the original's statement-short, effect-kind and scroll-moments FAILs gone). The same copy without the moment and the paragraph at 48px: the WARN.
  - `moments.mjs shoot --only paragraph-reveal` at 1440 and 390 (the words half revealed at start, whole at middle and end) and `--reduced` (still, nothing split); `moments.mjs check` passes the copy and FAULTs the retired moment on the original; `_demo/in-page.html` with its statement as a band passes the rhythm block.
  - `node --check` on `plan.mjs`, `moments.mjs`, `consistency.mjs`, `paragraph-reveal/moment.js`; every `meta.json` parsed; `plan.mjs check` ok; deals run with `RASYA_TASTE_HISTORY` on a scratch file.
- `HANDOFF-S.md`: the SKILL.md lines, `layout-check.js` (agent R's) for bands, `gate.md`, `layout-v4.md`, the scenes that set short type huge.

## v4.3 · operator merge of the statement and page length (HANDOFF-S)
- SKILL.md:
  - house rule 3 adds the band and tall heights;
  - section 2 sets the length at 9-12 for software and 8-11 for editorial;
  - step 3 adds the conditions and reserves;
  - step 4 adds `--has`;
  - step 5 adds the band markup and the statement paragraph;
  - the checklist names `page-short` and `statement-short`, plus a Never line and a report line.
- layout-check.js: a band is free and is not framed, and a tall section may be three screens.
- scenes: `letter-bar-floods-the-ground` and `letter-physics` are retired (weight 0). They set a few words huge alone in a screen.
- gate.md and layout-v4.md list the new ids and heights.
- Default kept for now: a thin brief may stay at 6-7 sections, with a WARN only.

## v4.3 · hero recipes (agent R)
Rasya: her ten newest pages all put a product UI window in the hero, whatever template was dealt. "The references are
already good. The skill should instruct the agent to recreate the reference examples combined with image assets or
components, and interaction too." The template is only the frame; nothing taught how to build the visual of a
reference hero or how to make the asset it needs. Scope cut mid-way: twelve recipes, seven more written up as next.
- **The library, `assets/layout/recipes/`.** One folder a recipe: `recipe.html` (a working demo on the kit's tokens in a
  hero template, stand-in art), `recipe.js` and `recipe.css` (the mountable module), `demo-*.svg` (drawn stand-ins).
  - `wireframe-figure` (Yellow3D): a procedural wireframe or point-cloud bust in three.js (no model file: rings from a
    profile, then the face), the head turning to the pointer about the neck, drawn crown to chest once, the gaze lowered
    by the scroll; or the client's own .glb.
  - `massing-model` (Arcol, Intrepid): a seeded city of grey boxes and the client's block as accent floor plates,
    orthographic three.js; floors rise once, a drag turns it, a hovered floor fills the readout card.
  - `object-drift` (Cosmos, Flora): cut-outs or photo tiles in CSS 3D round the centred words, drifting toward the
    visitor and steered by the pointer; at rest in declared slots on kind other.
  - `type-mask` (Donprod, Infinite Machine, Remote): the client's name across the wrap at the hero's foot with its
    photograph through the letters (background-clip), or its film on a 2D canvas (software).
  - `bleed-photo` (Cometeer, Jot, Sauz, Shopify): the photo hero with the picture made for it (the calm side in the
    prompt), a small pointer drift and scroll ease on tech, still elsewhere; a film variant.
  - `illustration-scene` (Family, Clay, Twin): two illustrated clusters and four pieces round centred words, popping in
    once, parallax by depth, a piece hops under the pointer.
  - `shader-light` (Raycast, Reflect, Lovable): the kit's own focal effects as the hero's layer (system.js mounts them),
    drawn 24px past the hero and leaning to the pointer.
  - `globe-orbit` (Wise): a three.js globe rising from the foot, the land as dots from the kit's print-globe coastline,
    routes with a travelling light, cut-out objects swinging in front; drag to spin.
  - `output-stack` (Recraft, Krea, Audienceful): a deck of outputs, buttons, drag and arrow keys, a card loop on software.
  - `prompt-demo` (Lovable, Perplexity, Fruitful): a working prompt box with a visible label, example chips and the
    client's answers in `<template>`s, streamed in; it types its examples while untouched (software).
  - `product-ui` (Linear, Stacks, Attio): ONE recipe, cropped, zoomed (scroll out from a region) or angled (stands up once
    on load, flat at rest).
  - `scan-canvas` (Scale): the client's scene with boxes, labels, a tick ruler, a readout and a crosshair on one 2D canvas.
- **`_shared/recipe-kit.js`**: three.js 0.170.0 from jsDelivr's `+esm` build (core and addons one copy), lazily inside
  `rtMotion.onReady`; the kind rule (`allowance()`); the page's WebGL count (`window.__tpGl`, cap `__tpGlMax`, 4);
  a renderer that counts its context; an on-screen, on-demand loop; the pointer; the hero-scroll scrub; the kit's pause
  button; palette tokens read through a canvas pixel. **`_shared/recipes.css`**: the mount in every template slot or as
  the hero's layer, the still under the live layer.
- **Still states**: the three.js recipes draw an SVG of the same geometry from the same camera before WebGL (and keep it
  under reduced motion, on a phone, without WebGL, over the context cap); the CSS and image recipes are their markup.
- **`index.json`**: per recipe `refs` (name, fold, motion strip, what to take), `kinds` and `weight`, `heroTemplates`
  and the slot in each, `technique`, `oneEffect`, `interaction`, `still`, `perf`, `needs`, `subjects` (brief words; a
  subject recipe needs one), `variants`, `mount` and `assets` in agent A2's exact shape with A2's style preset ids;
  `weights` (product-ui at most 1 in 5 and 20% of the pool); `next`.
- **`scripts/hero.mjs`** (`pick`, `list`, `check`, `lint`): deals a recipe for the kind and the dealt template, away
  from recent picks (history key `heroRecipes`, local and global through `scripts/lib/history.mjs`), the variant, the
  reference paths to open, the files, the mount for the template, the interaction, the still, the asset specs with
  `{product}` `{audience}` `{world}` `{palette}` filled from the brief (hex palettes put into words), and the exact
  `photos.mjs recipe-assets` line. `check` reads a built page: mount, files, kind, template, role and label, still,
  every required asset slot (demo stand-in FAIL, kit demo photograph WARN), the recipe's data, one effect, one three.js,
  `hero-ui-default`. `lint` holds index.json against the files and the asset shape.
- **`references/visual/hero/`**: the 26 hero.gallery folds and their motion strips and the 37 Saaspo heroes, 960px wide,
  JPEG q72 (89 files, 3.3 MB).
- **`references/hero-recipes.md`**: the run, "recreate the move, not the brand" (relaxes upstream's "never copy a
  reference's signature effect" into "rebuild the technique with our own assets"), the library, the asset step, the
  interaction and still rules, the kind rules, mounting, the check, adding a recipe, next.
- `NOTICE.md`: three.js, no model shipped, the reference screenshots' owners, the demos' stand-ins.
- `HANDOFF-R.md`: SKILL.md lines (asset row, the deal line after deal.mjs, the asset order, build, check, report,
  checklist, Never), the layout-v4, effects-usage, motion, sections and starter pointers, gate suggestions
  (`hero-ui-default`, `hero-recipe`, `recipe-still`, `recipe-kind`), checks that may trip by design, notes for A2.
- **Tested**, from `scratchpad/hero-recipes-test` with `RASYA_TASTE_HISTORY` on a scratch file: `node --check` on every
  JS file; `hero.mjs lint` (12 recipes, all reference files present); `pick` with a brief, `--json`, `--recipe`,
  errors, a place; eight deals in a row (no recipe twice in a row; local and global history written); `--stats` per
  template (product-ui at 20.0% and at most 1 in any 5 where two recipes fit, 10.6-11.2% where four do); `check` on
  the twelve demos and on four broken pages (each fault caught); `photos.mjs recipe-assets --dry-run` reading the index.
  Headless Chrome (one at a time, closed): all twelve demos reach their state (`live`, or the still expected on kind
  other); `shoot.mjs` at 1440 of wireframe-figure, massing-model, globe-orbit, object-drift, type-mask and prompt-demo,
  read and fixed (the face turned three-quarter and deepened, the type-mask word measured by its text, the globe's
  land denser and its objects in front, the prompt box tightened, the readout card on the wrap line).
- **Not done**: shots at 820 and 390, `consistency.mjs` and `check.mjs` on the demos, the other six demos looked at, the
  last globe object positions (raised after the last shot), any generated asset.

## v4.3 · operator merge of hero recipes (HANDOFF-R)
- SKILL.md:
  - the hero-visual asset row;
  - the `hero.mjs pick` and `photos.mjs recipe-assets` deal lines, placed after `deal.mjs`;
  - "open every reference picture";
  - the build step for mounting the recipe;
  - `hero.mjs check` in step 6;
  - the report line;
  - the checklist line;
  - the Never line now allows rebuilding a reference's composition, technique and interaction with our own assets.
- Gate ids suggested by agent R (`hero-recipe`, `recipe-still`, `recipe-kind`, and a gate-side `hero-ui-default`) are not built yet. `hero.mjs check` covers them without a browser.

## v4.4 (26 Nov 2026) · hero split alignment, no player icon
- Rasya's feedback on the Molar build: in a hero with the words left and the picture or product UI right, the words
  sat at the picture's top, and a round pause/play disc showed on the UI.
- `assets/layout/layout.css`: `.hero--split` and `.hero--collage` centre their words on the picture beside them
  (`align-self: center`). Below 1024 they stack as before. `heroes.json` and `references/layout-v4.md` say so.
- `scripts/consistency.mjs`: SR-8 T-mode (split-pair) and `split-align` leave the hero out; every other split on
  the page is still top-aligned.
- `assets/system.css`, `assets/ui/base.css`: the pause disc (`.loop-pause`, `.ui-pause`) stays in the page for
  keyboard and screen-reader users (WCAG 2.2.2) but shows only while it holds keyboard focus; a pointer never sees
  it. `loop-pause` counts that button as the control. `references/motion.md` and SKILL.md say no visible player icon.
- Tested on a copy of the Quarry test page with the new CSS (`tests/20-v44-quarry`, local only): at 1440 the words'
  middle and the picture's middle are both y 478; the disc has opacity 0 and turns to 1 on a Tab.

## v4.5 (26 Nov 2026) · a small repo
- Every JPEG, PNG and WebP of the skill (1169 files with the icon demo's copies, 29.5 MB) moved out of git into one
  archive on the repository's GitHub Release (`assets-v1`, `rasya-taste-v4-assets-v1.tar.gz`, SHA-256 pinned).
- New `scripts/lib/kit-assets.mjs` and `scripts/assets.mjs`: the first run of `start.mjs`, `assets/layout/deal.mjs`,
  `hero.mjs` or `photos.mjs` downloads the archive once, checks its SHA-256 and unpacks it into the skill folder, so
  every file is back at its old path, byte for byte; pages, scripts and demos are unchanged. A folder that already holds
  every file in `scripts/lib/kit-assets.txt` downloads nothing. Offline: `RASYA_TASTE_ASSETS_FILE=<archive>`.
- `.gitignore` keeps those files out of git; SKILL.md (step 0), README and `references/icons.md` say so.
- The repository's history was squashed again, so a clone is about 3 MB instead of 32 MB.
- Not tested yet (Rasya: test later): a fresh clone's first build, the download on a machine without the files.
