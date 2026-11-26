# Moments

A moment is the award-site part of a page (house rule 8): the one place, or two, where a page does
something a visitor remembers, in a section of its own; besides it the page has only the hero's
entrance and the hover layer (`motion.md`, The rule). Each is a folder in `assets/moments/<id>/`
(`moment.js`, `moment.css`, `meta.json`, a full `demo.html`); `index.json` lists them,
`gallery.html` links the demos and `moments.js` runs them. Twenty-six folders: seven retired
(`headline-arrives`, `closing-lift`, `lines-rise`, `window-parallax`, `word-rotate`, and since v4.3
`giant-type-pass` and `letters-assemble`), and nineteen dealt by kind (below), eight of them v4
moments (`gsap: true` in `meta.json`; they run on the motion layer, `assets/motion/scroll.js`, section
"The v4 moments"): seven ported from rasya-taste-v2's recipes and `paragraph-reveal` (v4.3, section
"The statement: a paragraph that reveals").

**Which pages: every page.** One moment on a short page, two on a long one (eight sections or more,
in two different sections), never three, on every kind. The place's short page (under 8
photographs, `sections.md` section 4) skips the type moment: its one moment is `picture-develops`
on the section's photograph (`--fits section --photo`, dealt again with `--exclude photo-chapters`
when it gives `photo-chapters`), or, with no photograph, `word-highlight` in a one-screen statement
section of its own, so the page is four screens.

| page kind | dealt from | look |
|---|---|---|
| place (cafe, bakery, guesthouse, shop, gym; a studio with a door is passed as `--page place`, since `--page studio` reads as service) | `photo-chapters`, `picture-develops` (film), `word-highlight` | photographs and type |
| product (site-kind other) | `photo-chapters`, `pinned-chapters`, `picture-develops` (film), `word-highlight` | photographs and type |
| service (firm, clinic, agency, trade) | `photo-chapters`, `pinned-chapters`, `picture-develops` (film), `word-highlight` | photographs and type |
| software, gaming, tech | the nine that list them: every dealt moment but `photo-chapters` and `picture-develops` (`giant-type-pass` and `letters-assemble` retired in v4.3) | as before 2.5.1 |
| v4 additions (rasya-taste-v4) | software: `ui-assembles`, `scroll-stage`, `photo-expands`, `stacked-panels`, `gallery-runs`, `photo-unveil`, `phrase-marks`, `paragraph-reveal`; tech: the same less `gallery-runs`; gaming: `paragraph-reveal`; product: the same as software less `ui-assembles`; service: less `ui-assembles` and `scroll-stage` | scroll set pieces, type and photographs |
| editorial (magazine, journal, blog, long reads: `--page editorial`) | `photo-chapters`, `picture-develops` (film), `word-highlight`, `photo-expands`, `stacked-panels`, `gallery-runs`, `photo-unveil`, `phrase-marks`, `paragraph-reveal` | photographs and type, paired like place, product and service |

Why these for the other kinds: each is led by the client's own photographs or words, moves only in
its own section, costs no WebGL and reads as calm (a hotel, a law firm, a wedding photographer). Not
on them: anything with a shader, WebGL or a liquid or pointer effect (`liquid-hover`,
`liquid-type`, `cursor-spotlight`), anything that reads as a graphic trick (`iris-opens`,
`line-carries-colour`, the halftone of `picture-develops`, and the retired `letters-assemble` and
`giant-type-pass`: a photograph inside letters reads as a template trick, muddies a warm palette
and is a parallax), a loop (`marquee-row`) and a count (`counter-rolls`). On those
pages the two of a long page are the statement moment (`word-highlight`, `paragraph-reveal` or
`phrase-marks` on the statement paragraph) and one section moment
(the photographs), or the photograph that develops beside one of the chapters moments (two kinds:
one runs once as it enters, the other follows the scroll). `photo-chapters` and `pinned-chapters` never share a page and do different
jobs: photo-chapters tells a story in full-width photographs with one chapter at a time on a panel;
pinned-chapters walks through steps listed beside one frame (how a booking or an order goes).
A moment counts against a tech page's big scene (`effects-usage.md`) as one of its beats.

**Rasya's budget (v4): two or three a page.** `--count 2` on a page of up to eight sections, `--count 3` on
a longer one; one only on a place's short page. Two of the three hold their section (`pin`) at most, and
two v4 moments never share their first slot. The loader marks four or more (`data-moments-over`).

## Deal them, never choose by taste

```bash
# a place, product or service page: one on a short page, two on eight sections or more
node <skill>/scripts/moments.mjs pick --page place|product|service --count 1|2 --fits section,statement \
  --photo --history .taste-skill/history.json
# a software, gaming or tech page (less a hero moment)
node <skill>/scripts/moments.mjs pick --page <kind> --count 1|2 --fits section,statement \
  [--scene <id>] [--effects <ids>] [--contexts <n>] [--photo] --history .taste-skill/history.json
# a hero moment on tech (0 or 1): the same with --count 1 --fits hero; kept only when the dealt hero lists it
# rasya-taste-v4: software, product, service and editorial pages, two or three, galleries included
node <skill>/scripts/moments.mjs pick --page software|product|service|editorial --count 2|3 \
  --fits section,statement,gallery [--photo] --history .taste-skill/history.json
```

- **`--page`** is the page's kind (`SKILL.md` section 1: `software`, `gaming`, `tech`, `place`,
  `product` or `service`; `ai`, `saas`, `technical-product`, `cafe`, `bakery`, `guesthouse`,
  `hotel`, `shop`, `studio`, `agency`, `firm`, `clinic` and a few more are read too). A word that
  names no kind (`other` is three kinds) stops the deal with exit 1: say which.
- **`--photo`** on every place, product or service page (they all have photographs): without it
  the photo moments drop out and a long page cannot be dealt two.
- **`--fits section,statement`:** a statement is a band of its own (the paragraph that reveals), so
  `paragraph-reveal`, `word-highlight` and `phrase-marks` come only with it; `section` alone deals
  none of them. Since v4.3 nothing else fits a statement: `counter-rolls` fits a section (the figures
  as the last row of the section that states them, or a band of figures), `liquid-type` the hero
  only, and `giant-type-pass` and `letters-assemble` are retired.
- **No kind needs `--exclude`:** each pool is what lists the kind in `meta.json` (the short page's
  `photo-chapters`, above, is the one case).
  `picture-develops` is dealt only in its film look, on place, product and service; its halftone
  look stays in the kit as `data-moment-opts='{"look": "print"}'` with its print-shop demo, never
  dealt. A dealt scene's twins and avoidMoments are left out by `--scene <id>` itself.
- **The hero moment** (0 or 1, never on a big-scene hero) is kept only when the dealt hero lists it
  in `heroes.json` (`moments[].id`): that is `liquid-hover` on `split` and
  `photo`, `cursor-spotlight` on `product`, `collage`, `film` and `centred`, `liquid-type` on
  `statement` (tech, a headline of six words or fewer), and none on the others. Off touch only;
  reduced motion rests. Two moments in all at most.
- **The WebGL budget.** A page holds at most 4 live contexts (`perf.md`). The deal adds up what the
  page already spends and never deals a moment whose own `webgl` (in its `meta.json`: only
  `liquid-hover` has 1) would push the total over 4: pass the big scene as `--scene <id>` (its `webgl`
  is read from `assets/scenes/index.json`), each dealt effect in `--effects a,b` (counted as one
  each, the worst case) and anything else in `--contexts <n>` (an object, a component with a canvas).
  The deal prints the total it reached.
- **The rest of the deal.** Placed in different sections. The history's `moments` list is read as
  cycles: once every moment that fits has been dealt, the next cycle starts empty, so an id comes
  back only after all the others and never straight after itself (the three dealt last stay out
  even across a cycle's end). Never two of one kind (hover and liquid count as one: one pointer
  effect a page), never two of one slot, never two that avoid each other, a moment that needs a
  photograph only with `--photo`; on a place, product or service page one statement and one
  section, or two kinds (`picture-develops` with a chapters moment). Write each id, its section and its purpose in the plan (`motion.md`, Why it moves). A dealt moment with
  nothing to carry is dealt again with it added to `--exclude`.
- **Retired** (`meta.retired`, weight 0, never dealt): `headline-arrives` (every hero now enters
  through the motion layer, `motion.md`, The hero's entrance; a moment that also moves the headline
  would be a second entrance) and `closing-lift` (it needs a closing band of its own and its words stand on a
  gradient over the photograph); since 2.5.1 also `lines-rise` (every hero's lines already rise on
  load), `window-parallax` (a parallax on a photograph) and `word-rotate` (the `word` hero carries
  its own live word, `layout-v4.md`). `magnetic-button` (CK-94) is gone.

## Where each fits

| id | kind · fits | phone and reduced motion |
|---|---|---|
| word-rotate | retired · hero, three rounds then rests | the written word stands |
| lines-rise | retired · one section or statement, once | the heading and its lines stand |
| counter-rolls | text · section: the proof figures, once, as the last row of their section or a band of figures; never in a card | the figures stand |
| word-highlight | scroll · one statement paragraph of 25-60 words, a band | runs on a phone; reduced motion: the whole statement in ink |
| giant-type-pass | retired (v4.3) · was one statement of 2-4 words at 12vw with a photograph in the letters | the photograph stands in the letters, smaller type |
| letters-assemble | retired (v4.3) · was one statement of 2-5 words, set very large: its letters fly into the line | the statement as written |
| pinned-chapters | scroll · one feature section of 2-4 steps, two screens live | static rows (or each step with its visual under it) |
| window-parallax | retired · one wide photograph | the photograph stands in its frame |
| marquee-row | scroll · a row of real words (trades, cities, formats; never logos: a logo never moves), with a pause button | the words in a wrapped row |
| line-carries-colour | transition · a section on a new ground keeps it edge to edge; inside, an inset panel in the old ground (even gutter, card corners) is cleared by a line climbing from its foot; each block shows whole once the line has passed it | the section on its own ground, no panel, no line |
| iris-opens | transition · a section on a new ground keeps it edge to edge; inside, an inset panel in the old ground (even gutter, card corners) opens a disc with a hairline accent ring; each block shows whole once the disc holds it | the section on its own ground, no panel, no ring |
| picture-develops | transition · one large photograph with a clear subject, once, 1.6 s (look `film`): it comes up out of a faint grey print, darks first, then colour; the halftone look `print` is not dealt | the film look runs on a phone; reduced motion: the photograph stands |
| photo-chapters | scroll · one section of 3-5 chapters (a title and two lines each, one photograph each) under its h2 and lead: one photograph the width of the page, each next one uncovered from its foot over the last, the chapter on a panel at its lower left; about two thirds of a screen of scroll a chapter, so the section is three screens live (four with four or five chapters); place, product, service | runs on a phone held upright; reduced motion: the chapters side by side, each photograph over its words (a phone stacks them), the section as tall as they are |
| closing-lift | transition · the close, with a photograph | a plain closing section |
| cursor-spotlight | hover · the hero frame | the light rests |
| liquid-type | liquid · hero only (since v4.3): a hero headline ripples like water under the pointer, an SVG filter, no WebGL | the headline as written |
| liquid-hover | liquid · one photograph with edges and detail, one WebGL context | the plain photograph, no canvas |
| stacked-panels | v4 · scroll · intensity 3, holds · one section of 2-5 panels (a title, two lines, a picture each) under its h2; the section holds 1 screen (2 with 4-5 panels), each next panel slides over the last, the ones under step back 4% and fade to the ground | under 900px, reduced motion: the panels one under another |
| gallery-runs | v4 · scroll · intensity 3, holds · gallery · 5-8 photographs at 4:5 in one row under the h2, run sideways by the scroll, each panning 12% in its frame; holds 1 screen (2 when the row overflows by over 1.2 screens); no captions | under 900px, reduced motion: a swipe row with snap points |
| photo-expands | v4 · scroll · intensity 3, holds · one wide photograph under an h2 in two spans; holds 1 screen: the photograph opens from a 40% window to the screen's full width, 1.3 to 1, the h2's halves move from the centre to the page's edges, always on the ground | under 900px, reduced motion: the h2 over the photograph at the page's width |
| scroll-stage | v4 · scroll · intensity 3, holds · one product photograph (4:5) beside an h2 and 3 notes; holds 2 screens: three framings (shift, turn to 6°, scale 0.82-1.12), the notes take turns under the h2, the next in before the last leaves; never the hero (rule 3) | under 900px, reduced motion: h2, notes as a list, the photograph |
| ui-assembles | v4 · transition · intensity 2, once · the product's UI as HTML in one window (`data-ua` side, card, bar, row, toast, six groups at most): it rises 60px, then its parts arrive, about 2.3 s; a section, never the hero | phone, reduced motion: the window as written |
| photo-unveil | v4 · transition · intensity 2, once · one large photograph (or a row of 2-6): a 1.3 s wipe from its foot while it settles 1.4 to 1, then a single one drifts 6% (the page's one photo parallax) | runs on a phone; reduced motion: the photographs stand |
| phrase-marks | v4 · text · intensity 1 · one statement paragraph of 25-60 words, a band, with 1-3 phrases in `<mark>`: a flat accent tint (24% on the ground) draws behind each, scrubbed from 85% to 55% of the screen | runs on a phone; reduced motion: the marks drawn |
| paragraph-reveal | v4.3 · text · intensity 1 · one statement paragraph of 25-60 words in a band: each word (or line) from `--muted` at 30% to ink as the paragraph's top climbs from 80% to 35% of the screen, scrubbed, never pinned | runs on a phone; reduced motion: the paragraph in ink |

## The still rule (every moment, no exception)

Every moment has a static variant for a **phone** and for **reduced motion**, and a finished state
without script or when its module fails. The loader decides: it hands each moment a `lib` whose
`reduced()` answers `lib.still()`, which is true under `prefers-reduced-motion` and on a phone (under
640px wide, or a touch screen turned sideways under 500px tall). A moment written against `reduced()`
therefore shows its finished state there, and the host carries `data-moment-still="reduced"`,
`"phone"` or `"card"`. **Phones still get a moment:** the ones light enough for a phone (one
picture or one paragraph at a time; transform, clip, filter or colour) say `export const phone =
true` in their `moment.js` and `"phoneRuns": true` in `meta.json`, and run there; only reduced
motion and a card keep them still. Those are `word-highlight`, `picture-develops` (film) and
`photo-chapters` (from 600px of height), which covers every place, product and service deal. The answer is taken when the moment mounts (a window resized across 640px
applies it on the next load; `pinned-chapters` and `photo-chapters` ask again on resize). Each `meta.json` says what the
still shows (`reduced`, `phone`). Hover moments do nothing on touch screens either.

**Nothing on a card moves on scroll** (house rule). A moment sits on a hero, a statement, one
section, a transition or the close, never in a card, a plan, a result or a bento cell: the loader
leaves one that does still (`data-moment-still="card"`, `data-moments-card` on `<html>`) and
`moments.mjs check` calls it a fault.

## Put one on the page

The host is a section of the page (or, for the text moments, the headline or the row inside it);
mark it as the moment's header comment shows (`data-moment="<id>"`, options in `data-moment-opts`).
Every section stays one or two screens tall (`layout-v4.md`, `--h`), live and at rest, but the two
chapters moments: `photo-chapters` is (hold + 1) screens live (three for three chapters, four for
four or five; write no `--h` and no `data-screen` on it: the checker and the layout check both read a
live photo-chapters section as whole screens, four at most) and both are as tall as their content at rest. A transition's
host is the whole section that sits on the new ground, a statement moment is one section with its h2
first, a marquee or counter row merges into the section above as its last row. In `<head>`, the one line plus a `modulepreload` for
the loader, its lib and the dealt moment:

```html
<script>document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)</script>
<link rel="modulepreload" href="assets/moments/moments.js"><link rel="modulepreload" href="assets/moments/lib.js"><link rel="modulepreload" href="assets/moments/<id>/moment.js">
```

Then the loader once. On a page with `system.js`, `system.js` imports it and waits for it. On a page
without, the demo pages' tag at the end of `<body>`:

```html
<script type="module" src="assets/moments/moments.js"></script>
```

The loader links each moment's CSS and starts it; `<html data-moments-ready>` says when. A failed
module gets `data-moment-failed` and the class `mo-safe` on its own element, which the moment's CSS
reads as "show the finished state now". A demo's copy and photographs are placeholders. Every moment
takes the page's tokens (`--bg`, `--ink`, `--muted`, `--accent`, `--line`, the display face).

A moment's section in a page is copied from one of the two page models, which mount moments inside
a starter page and pass the checker: `assets/moments/_demo/in-page.html` (a place:
`photo-chapters`, `word-highlight`) and `in-page-service.html` (a service: `pinned-chapters`,
`picture-develops` in its film look). A moment's own `demo.html` shows it alone and is not a page
model.

### The v4 moments (rasya-taste-v4)

Seven moments ported from rasya-taste-v2's recipes (`references/interactions.md` there, R02-R13), mounted
like every other (`data-moment`, the loader, the head line), plus one thing: **they run on the motion layer.**
`assets/motion/scroll.js` loads GSAP 3.13, ScrollTrigger, SplitText and Lenis once and exposes
`window.rtMotion` (`gsap`, `ScrollTrigger`, `SplitText`, `lenis`, `reduced`, `onReady(cb)`, the event
`rt:ready`); a v4 moment asks `lib.rt(cb)` and never loads GSAP or Lenis itself. The page loads the layer
before the loader:

```html
<script src="assets/motion/scroll.js" defer></script>
<script type="module" src="assets/moments/moments.js"></script>   <!-- or system.js, which imports both -->
```

- **No layer, no motion:** without `rtMotion` after 8 s the moment stays in its finished state and warns
  once; `moments.mjs check` calls a page with a v4 moment and no `motion/scroll.js` (or `system.js`) a fault.
- **A hold is a sticky stage, never `pin: true`.** A GSAP pin wraps the section in a pin-spacer and
  `main > section` stops matching (it loses its `--h` height and padding). Live (`.is-live`), the section is
  (hold + 1) whole screens, its `.container` sticks at the top for the hold, and one scrubbed timeline
  (`start: 'top top', end: 'bottom bottom'`, `refreshPriority: 1`) drives it. Going live or back calls
  `lib.refresh()`: one `ScrollTrigger.sort(); refresh()` on the next frame, so the triggers below are measured
  after the height change.
- **The h2 stays on screen through every hold,** on the ground, never on the photograph, never moved out.
- **Under 900px or on a screen under 600px tall nothing is held** (`lib.wide`, a `gsap.matchMedia()` that puts
  the section back to rest on a resize). `photo-unveil`, `phrase-marks` and `paragraph-reveal` run on a phone (`phoneRuns`); the
  others rest there.
- **Still rule as everywhere:** the rest state is the HTML as written (the marks drawn, the panels one under
  another, the row a swipe row, the photograph at full width); `is-live` comes only from the script, so a
  failed module or a missing layer shows the rest state.
- **Holds:** `gallery-runs`, `photo-expands`, `stacked-panels` (2-3 panels) live two screens;
  `scroll-stage` and `stacked-panels` with 4-5 panels three; `gallery-runs` three when its row is long.
  Write the section's resting `--h` (1 or 2) as usual; the moment sets the live height.
- **Mapped, not ported** (an upstream moment does the job): R01 split-line headline is `lines-rise`
  (retired: the motion layer's hero entrance already does it); R06 pinned product sequence is
  `pinned-chapters`; R10 counters is `counter-rolls`; R11 word fill is `word-highlight`; R15 marquee is
  `marquee-row`. R04 live readout, R14 parallax grid and R16-R21 (button roll, magnetic, underline, hover card,
  hover image follow, cursor label) are not moments: a page-wide hover or micro layer, the motion layer's job.

### The statement: a paragraph that reveals (v4.3)

The statement slot deals only three moments, each on one paragraph of 25 to 60 words in a band
(`data-screen="band"`; `sections.md` section 1, The statement; `sections-library.md`, statement):
`paragraph-reveal`, `word-highlight` and `phrase-marks`. Never a few words set huge: that layout
("Keep by default" at 220px alone in a screen) is what Rasya retired, and `consistency.mjs
statement-short` FAILs it.

**`paragraph-reveal`** (`assets/moments/paragraph-reveal/`, v4.3) is the default look: the paragraph in
the display face at `--t-statement` (48px at 1440), about 42 characters a line; its words rest in
`--muted` at 30% (`dim`, 0.25 to 0.35) and turn to full ink one after another while the paragraph's top
climbs from 80% to 35% of the screen, scrubbed with GSAP ScrollTrigger through `window.rtMotion` (it
runs back on the way up). It is finished before the section's top reaches the top of the screen, so the
judge's tile shows the paragraph whole; it is never pinned and runs on a phone as on a desktop.

```html
<section class="section statement" id="stance" data-screen="band" data-moment="paragraph-reveal">
  <div class="wrap">
    <p class="t-label">Why Keep starts at keep</p>
    <p class="mo-pr__text">A salary is the easiest number to read in a layoff, and the worst one to decide on. Keep starts every person at keep: it prices the work each one carries, and only a case a named manager signs can move them.</p>
    <p class="mo-pr__more"><a class="link" href="#limit">Read what Keep will not do</a></p>
  </div>
</section>
```

Options in `data-moment-opts`: `"by": "line"` turns a line at a time; `from` and `to` (0.8 and 0.35)
move the start and end; `dim` the resting opacity. Still and reduced motion: the HTML as written,
every word in ink (the words are split only once the motion layer is ready; a failed module or no
layer leaves the paragraph whole). Like every v4 moment it needs `scroll.js` on the page before the
loader. `word-highlight` (half ink to ink, word by word, a `<strong>` word to the accent) and
`phrase-marks` (a tint drawn behind one to three phrases) take the same paragraph and the same band;
their CSS reads `--t-statement` and `--statement-measure` too.

## Rules

- **The kind's count, an id once.** `data-moments-over` (four or more, v4) and `data-moments-repeat` on `<html>` are faults.
- **No random effects as you scroll.** A scroll moment is scrubbed to the scrollbar inside its own
  section, which stays one or two screens tall (`photo-chapters` three or four), and does one purposeful thing; at the section's top
  and bottom it shows a finished state (every transition finishes before the section's top is a
  fifth of the screen down, and a statement's reveal before its top reaches the top of the screen), so each judge tile shows one whole section. No card,
  row or tile ever enters on scroll. `consistency.mjs` reports a scroll finding inside the dealt
  `[data-moment]` section; that one is expected, any other is a fault.
- **Content is readable without the motion:** the words are in the HTML, in their finished place; a
  moment never hides a headline on load (the hero's own entrance is the motion layer's, `motion.md`).
- **Photo-led on the other kinds:** a place, product or service page's moment carries the client's
  own photographs (or library ones that pass `photos.md`), each used once on the page, and its
  words are the page's real copy; never a stand-in picture to give the moment something to move.
- **One count a page:** `counter-rolls` or `data-m-count` (`motion.md`), never both.
- **Nothing blinks, bounces or overshoots.** Ease-outs (cubic-bezier(.22,1,.36,1) for a settle),
  600-1,000 ms for a reveal, 1.6-1.8 s for a photograph developing; a scrubbed wipe or change takes
  about half of its chapter's share of the scroll and holds for the rest; a loop runs its rounds and
  rests, or carries a pause button.
- **The page's edges.** A moment's text sits in a `.container` or `.wrap` like every other section: its
  words end on the page's left and right edges. A transition's cover is an inset panel inside the host
  section with an even gutter on every side (card corners, never touching the section's edges), its
  line or ring inside the panel; every heading, paragraph, button and picture appears whole, never cut
  by the line or the disc (each moment's `meta.json`, `look`, says how).
- **Cost:** no WebGL but `liquid-hover` (tech only) (one context, only near the screen; a plain photograph without
  WebGL or when the shader fails). `liquid-type` is one SVG filter on one headline, on only while a
  ripple is alive. Every other moment costs CSS variables, a transform or a clip and a passive
  listener.
- **One pointer effect a page:** a hover or liquid moment rules out `fx-button`, `fx-spotlight` and an
  object that turns to the pointer, and the reverse; `pick` never deals two of them.
- **Photographs:** `liquid-hover` (tech) wants mid to dark tones with edges and detail; a
  pale dusk sky reads lavender in a letter and a flat sea shows no ripple. Never violet or lavender.
- **No captions;** the photograph's credit goes in the footer line.

## Check it

- `node <skill>/scripts/moments.mjs check <page.html> --page <kind> [--scene <id>] [--effects a,b] [--contexts n]`
  reads the built page: how many moments, any twice, retired, off its page kind (a WebGL or effect
  moment on a place is off its kind), in a card, holding a figcaption, two that avoid each other, two
  of one slot on a place, product or service page, the WebGL total against 4, a missing loader. Exit 1
  on a fault.
- `node <skill>/scripts/moments.mjs shoot --out shots/moments --profile <own chrome dir> --port 5720 --only <id> [--reduced]`
  shoots the demo's start, middle and end states at 1440 and 390 in the skill's headless Chrome (WebGL
  on the CPU); the end must be the finished section. Under `--reduced`, and at 390 for a moment
  without `phoneRuns`, it also checks the still rule: the host must say `data-moment-still` and no
  animation may run inside it (a line `STILL?` otherwise). `--probe "<js expression>"` prints a value after each state.
- The headless Chrome draws WebGL on the CPU, so `liquid-hover` shows a fainter ripple there than on a
  GPU and its end state waits 6 s to be the plain picture; a text or scroll moment looks the same on both.
