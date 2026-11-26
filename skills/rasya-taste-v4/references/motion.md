# Motion

Every page loads the micro-interaction layer: `<html data-motion>`, `assets/motion/motion.css`
after `ui/cards.css`, `assets/motion/motion.js` (module) after `system.js` (`starter.html` has all
three), and the scroll stack: `assets/motion/scroll.js`, a plain script after `motion.js` (Lenis,
GSAP, ScrollTrigger, SplitText; Scroll, below). **It is not optional:** never remove, skip or override it; if a check complains about it,
fix the markup, not the layer. A missing or invisible hover layer is a fault on every kind (round
C: a fintech, a cafe and a guesthouse page lost motion points because a hovered card or button
showed no change), and since 2.5.1 so is a page without its hero entrance or its dealt moment. Give it markup to act on: a linked card is a `.card`
holding its link (never `.m-nolift`), a photograph that leads somewhere is `<a class="m-zoom">`
round its `<img>` (or `img.frame__img` inside a linked frame), buttons are `.btn`, links in
running text `.link`. Shoot a hovered card and a hovered photograph at 1440 and see
them change: the card 2px up, the photograph at 1.03. `assets/motion/demo.html` shows every interaction. This file
holds every hover, press, loop and reduced-motion number; other files point here.

## The rule: every page moves, in four places

Every page, every kind, has the same four layers of motion (the budget), and nothing else moves:

1. **Lenis smooth scroll**, always on (`scroll.js`; Scroll, below). Never removed, never a second
   smooth-scroll library.
2. **The hero's entrance** on load, once (below): the h1 line by line, then its lead and buttons, the
   picture settling. About 1.1 s, then the hero stands.
3. **2-3 scroll moments**, each in a section of its own: at least one starting in the first two
   screens (its section's top under 2 x the screen height), at least one scrubbed to the
   scrollbar, pins allowed (two at most). A moment is dealt (`moments.mjs pick --page <kind>
   --count 2|3`, `moments.md`) or the page's own, built in `rtMotion.onReady` (Scroll, below). On a
   place, product or service page each is photo- or type-led (photographs that change in place, a
   photograph that develops, a statement that lights up, a frame that grows); shader and WebGL
   effects stay on tech, gaming and software (house rule 8: a cafe, bakery, guesthouse or shop gets
   photographs, never a shader).
4. **The hover and press layer** below, on every link, button, linked card and linked photograph,
   and the swaps a click or a tap makes (a tab on software, a peek-list's photograph).

On tech, gaming and software pages also: loops inside a card's visual (diagram pulses included),
one timed loop in the hero or the `[data-visual]` frame, one count, and the effect and scene
`effects-usage.md` deals. Other pages have none of those: no ticker, marquee, slideshow, looping
picture, pulsing dot or count. An open-now line may be filled once at load; the panel reads right
without it. A product render is a still by default; live only when asked
(`data-product-mode="live"`), at most one live context, with its pause button in the corner, a still
on a phone and under reduced motion (`effects-objects.md`).

**Scrolling moves the 2-3 moments and nothing else.** No card, row or tile ever fades, rises or
staggers in as the page scrolls (stock reveals), no body text moves at another speed than the page
(parallax on text), and nothing but Lenis steers the scroll (no ScrollSmoother, Locomotive Scroll,
fullPage.js, snap or wheel capture). A moment may hold its stage on screen with a ScrollTrigger pin
or `position: sticky` (Scroll, below).

**Why it moves.** The plan names each motion and its purpose in a few words, one line each: "hero
entrance: the name arrives first, then what to do"; "photo-chapters in Rooms: three rooms shown in
the space of one"; "hover: every link answers". A motion with no purpose is cut. Content is
readable at rest, without script and under reduced motion: motion only ever adds to a page that is
already whole.

## Tokens

`--m-in` 150ms (hover in), `--m-out` 120ms (hover out), `--m-press` 90ms, `--m-panel` 200ms (a menu opening), `--m-close` 120ms, `--m-slide`
240ms (an indicator travelling), `--m-image` 600ms in and `--m-image-out` 400ms, `--m-cycle` 3.2s;
tech loop tokens: `--m-roll` 700ms, `--m-count` 1000ms, `--m-level` .6s, `--m-bob` 3.2s.
Curves: one UI ease-out, `--ease` in `system.css` = cubic-bezier(.2,.8,.2,1) (`--m-ease` and the
fragments' `--u-ease` read it) for every UI step; `--m-ease-enter` cubic-bezier(.22,1,.36,1) for
an entrance settling (the hero, a moment, a digit roll; `--u-spring` in `ui/base.css` is the same
curve); `--m-ease-io` cubic-bezier(.65,0,.35,1) only for travel; linear for loops and drifts. No
curve passes its mark: no bounce, no overshoot. The motion layer moves transform, scale and opacity
only (a hover also changes colours) and never animates width, height, top, left, margin or padding.
Inside a scroll moment a few more cheap properties move (a dealt one names them in its `meta.json`): a clip-path
(a wipe), a filter (a photograph developing), the colour of words (a statement lighting up) and,
on tech only, a background position (a photograph passing through type). Distances: card lift 2px, photo zoom 1.02 to 1.03, arrow 3px, menu drop 6px, button step 1px
up (2px on `.btn--xl`; none on the text-link secondary of the `arrow` and `block` looks), press 1px
down and scale .985 (that secondary: scale only); no others (`assets/motion/motion.css`, buttons).

## The hover layer

Hover moves only for a fine pointer (`(hover: hover) and (pointer: fine)`; keyboard focus shows the
same state anywhere); every hover control also works by tap and keyboard and has a focus state; nothing resizes or pushes a neighbour; no rotate, skew, glow, looping or repeated shine, or chip glide (the `shine` button look's one pass across the primary, once per hover, is allowed; `buttons.md`).

| Part | Motion | Time |
|---|---|---|
| Button | on hover the fill steps 14% toward the ink (an outline gains a faint fill and a stronger border) and the box steps up 1px (2px on `.btn--xl`); press sinks it to 1px below rest and scales .985, so a hover shot and a press shot each show a move; the text-link secondary of the `arrow` and `block` button looks keeps its underline and does not step (its press scales .985 only); fine pointer only; page CSS never sets a `.btn`'s `transform` or `transition` (the library looks are kit CSS: they move pseudo-elements and the label span, and `magnetic` uses `translate`) | 150ms in, 120ms out, 90ms press; a library look's moving part (wipe, label roll, arrow swap, ring, reveal disc) travels in `--m-slide` (240ms) |
| Arrow | `svg.m-arrow` moves 3px right and settles back; one arrow style a page | 150 / 120ms |
| Link | one underline style at regular weight: running text and `.link` rest on a faint 1px hairline and an ink line draws left to right, leaving to the right; nav and footer words rest bare, darken and draw a 1px line 4px under the word | 150 / 120ms |
| Nav | the words take the drawn underline (no gliding pill on any kind); the panel opens after 150ms of intent, fades in with a 6px drop with its columns together (one surface, never column after column), closes in 120ms; with one open the next word swaps it at once; the chevron turns 180 degrees on tech, flips at once on other | 200ms, 120ms |
| Current page | a 2px bar under its nav word (`aria-current="page"`) | still |
| Tabs (software, click only) | one indicator slides to the clicked tab by transform alone (it takes the new tab's size at once, starts scaled to the old one and settles to scale 1): the ink pill `system.css` draws, its label in the ground colour; the panel swaps (200ms at most); every panel one fixed height; on other no tabs | 240ms |
| Card with a link | lifts 2px, its border darkens a step, an optional soft shadow (blur 24px, 10% ink at most, only on hover) | 180ms in, 120ms out |
| Card without a link | nothing (`.m-nolift`) | |
| Photograph in a linked card or link | scales 1.02 to 1.03 inside its frame (`overflow: hidden`); the frame, card and boxes never grow; never dims, fades or takes an overlay; a product card's name underlines with it (`.m-zoom` for any other wrapper) | 600ms in, 400ms out |
| Focus | a 2px ring in the action colour, 2px off the control, drawn in full in the frame the focus lands; no transition | none |
| Field | the action border and a 3px soft ring | 140ms |
| `.m-switch`, `.m-check` (tech) | the knob slides 16px and stretches 4px while pressed, both by transform; the tick fades in as it grows from 70% to full size; on other they jump | 180, 90, 160ms |
| Copy button (tech) | the glyph swaps to a check in place, holds 1.5 to 2 s, returns | 150ms |

FAQs show every answer open (`system.css`): no accordion, and nothing ever animates height,
max-height or padding. Hooks: `[data-m-loop]` (your own CSS loop, tech), `data-ui-loop` (a card
group's one fragment loop, tech), `data-m-count` (tech hero only), `.m-link`, `.m-zoom`, `.m-nolift`.

## The hero's entrance (every kind)

Once on load the hero arrives, then stands: the h1 rises line by line out of word masks (700ms each,
the lines 80ms apart, at most 240ms between the first and the last; each word starts wholly under
its mask), then whatever follows it in its column (the lead, each button, the facts) fades up 12px,
520ms each, 60ms apart, starting as the last line is half way up; a line above the h1 (a notice, a
pill) comes with its first line. The hero's picture is never hidden and never fades: a photograph
settles from 1.05 to 1 over 1.1 s inside its frame (a full-bleed one inside the hero), a window,
object or collage from .98 over 900ms, each as one block (the words on a menu card or a note in it
never step on their own); a panel the words sit on stands from the first paint. All of it about
1.1 s, ease-out (`--m-ease-enter`), transform, scale and opacity only, once a visit, never again on
scroll.
An h1 that `layout.js` reworks (a live word, letters that answer the pointer, a picture in the
line) rises whole instead of line by line.

The builder writes two things, and nothing else (`starter.html` has both):

```html
<!-- in <head>, after the stylesheets (where starter.html has it): the words wait for motion.js instead of flashing -->
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<!-- on the dealt hero's section -->
<section class="hero hero--split" data-enter aria-labelledby="hero-h">
```

Optional: `data-enter-media` on the hero's picture when it is none of the layouts' own
(`.hero__bg`, `.hero__media`, `.hero__stage`, `.hero__art`, `.hero__window`, `.hero-visual`,
`.ly-collage`); `data-enter-whole` on an h1 that must rise as one; `data-enter="off"` on a hero
that holds a big scene with its own load motion (the checker takes the scene as the entrance, and only
inside such a hero). `motion.js` does the rest (`enter()`): it lends
the h1 its word masks for the length of the entrance and gives the h1 its own nodes back afterwards
(`.is-entering` while it runs, `.is-entered` after). Only the words are hidden, and only while
`html.m-enter` is on and before `motion.js` takes over or the 700ms mark passes: without script,
under reduced motion, in print and with `data-motion="off"` the hero stands as written; when the
script is later than the mark, the words fade in over 400ms and the picture settles by CSS alone. A headless screenshot sees the hero at rest (as it sees a count's final number)
unless `<html data-motion="live">`. Never a loader, a gate, a delay before reading, or a second
entrance (`headline-arrives` is retired for it).

## Loops inside a card's visual (tech)

House rule: a bit faster, and repeating.

- One cycle is 2.5 to 4 s (`--m-cycle`, 3.2 s default), then it starts again. It is seeded on its
  finished picture and never shows an empty window: a ui.js fragment rests 600ms on it before the
  first cycle; a `[data-m-loop]` starts at once; the last 10 to 15% of each cycle holds the finished
  picture, and a reset dims and rewrites, never blanks.
- The pointer or keyboard focus entering its card restarts it from the top (not in its first
  800ms). A paused loop stays paused. The card, its panel and the window never move: no zoom, tilt
  or camera pan inside the window.
- One subject per cycle (a pointer clicks, a status turns, a bar fills, a line is written): one
  change every 1 to 2 s, each change 300ms or less. Several subjects: the next one each cycle. A
  changing label never shows two words at once.
- One fragment loop per card group (`data-ui-loop`); the other fragments hold their finished
  picture and play while the pointer rests on their card. A small diagram card's pulse is that
  card's own loop, on the same cycle, restart and pause rules (house rule: pulses running along the
  lines); system.js never holds it (`data-ui-still` does not reach a diagram). Below the hero, two
  loops are never on one screen: in a group with a pulsing diagram, give the fragments
  `data-ui-still` too, or hold the diagram with `data-dg-still` (it then plays under the pointer).
- A page's own CSS loop sits in `[data-m-loop]`, every keyframe on `var(--m-cycle)`, `--m-still`
  (0 to 1) the finished frame, a 48px band (`--m-safe`) kept clear for the pause button.
- Life signs inside the looping visual only: spinner 1s (12 to 16px, then a check), live dot 2.4s
  (the dot still, a ring grows and fades), caret 1s with a hard step inside a field, level bars .6s.
  No typing dots, no lone pulsing dot elsewhere, no block cursor after a headline.
- Kinds of card story (each in a box of fixed height): a prompt types at 12 to 20 characters a
  second and holds; an answer streams about a bubble a second; a notification enters at the top and
  the oldest leaves through the fade; a checklist ticks about once a second; a calendar's events
  fade in one by one; a pointer glides about 200px in 1 s, presses (scale .96 at least, a 28px ring)
  and holds. A speaker or avatar front item changes no more than every 3 s. A chart stays still.
- Not yet placed, so not used: a stepping slot strip, a before/after divider, path-following items,
  a dock tab that grows, a pointer-linked mascot, a comet along a hero strand.

## Tech budget

- **One timed loop** a page, in the hero or the `[data-visual]` frame, in whatever form (a story, a
  reel, a lit border, a live ground, a turning object, a marquee); its life signs are part of it.
  One timed loop plus the one effect at most; with a live effect in the hero, no other timed loop
  runs. Never two self-moving things in one 900px window, never two loops in one panel. Card loops
  (one per card group), diagram pulses (one per diagram card) and the dealt moments are outside
  this count.
- **A count** once a page (`data-m-count`, the `counter-rolls` moment or a count scrubbed in a pinned
  scroll moment, one of them): on load in the hero (1000ms, 1.2 s at most), or as a scroll moment in
  its own section. On the open
  ground, never in a card, panel or `[data-visual]`; its width reserved; the final figure in the
  HTML, shown under reduced motion, without script and on phones; never a year, price or phone
  number. A live counter changes only its last one to three digits.
- **Load:** the hero's entrance above, on every kind. On tech also at most one load-once motion
  inside the `[data-visual]` frame (a visual assembling, 600 to 1200ms), settled by 1.5 s; a click
  swap 400 to 600ms. No gate, loader or intro.
- **Pause:** anything still moving 5 s after it is seen has one round pause button per panel: a
  solid 32px disc, 12px in from the bottom-right (in a card beside its title), the same size and
  place on every card, never over copy, never on a still. rasya v4.4: the disc is never shown to a
  pointer (no player icon on the page); system.css hides it until it holds keyboard focus, so a
  Tab still reaches it. Never draw a visible play or pause icon of your own. A click freezes the frame and swaps to a play glyph (`ui.pausable(panel, ctrl)` for your
  own movers). Scroll-driven moments need none.
- **Timed loops start on load** and never start, stop or resume on scroll; an IntersectionObserver
  only mounts lazily. A canvas may skip drawing off screen only on a clock from load, so no visible
  start shows on return. A hidden tab may pause everything.

## Scroll

**The stack (every page, every kind).** `assets/motion/scroll.js`, a plain script after `system.js`
and `motion.js` (never a module, never deferred), loads from jsDelivr at exact versions, each with its
SRI hash: GSAP 3.13.0, ScrollTrigger 3.13.0, SplitText 3.13.0 and Lenis 1.3.17 (cdnjs has no Lenis).
Never retype a URL, change a version, add a second copy or wrap a call in `if (window.Lenis)`. It
gives the page one object and one event:

```js
window.rtMotion = { gsap, ScrollTrigger, SplitText, lenis, reduced /* bool */, onReady(cb) /* cb(rtMotion) once the libraries are in, or at once */ }
document.addEventListener('rt:ready', e => { /* e.detail is rtMotion */ });
```

- **One clock:** GSAP's ticker drives Lenis, Lenis drives ScrollTrigger; `html.lenis` is on. Lenis
  glides the wheel (lerp .09, wheel x .9) and leaves touch native. Scrubbed tweens use
  `scrub: true` and `ease: 'none'`: no `scrub: 1` lag on top of Lenis, no second
  `requestAnimationFrame` loop, no own scroll listener for a moment (a passive one is fine for a
  kit moment: Lenis scrolls the real page, so `scroll` events, `position: sticky` and
  IntersectionObservers work as without it).
- **In-page links** glide through Lenis on a click or tap; a keyboard activation keeps the
  browser's jump; `data-lenis-native` on a link opts it out.
- **Menus and loaders:** `rtMotion.lenis.stop()` while open, `.start()` after (system.js does it for
  the phone sheet). A box that scrolls inside the page carries `data-lenis-prevent`.
- **Loud failure:** a script that fails (404, blocked, bad SRI) or a boot later than 8 s sets
  `<html data-rt-scroll="off" data-rt-scroll-error="...">` and calls `console.error`; the
  callbacks never run and the page stands as written. Never `data-motion` for this: it is the
  hover layer's switch.

**A moment of the page's own.** One script after `scroll.js`, every moment inside
`rtMotion.onReady`, the section marked `data-scroll-moment`:

```js
rtMotion.onReady(({ gsap, ScrollTrigger, reduced }) => {
  if (reduced) return;                                        // the HTML as written is the still
  gsap.matchMedia().add('(min-width: 900px)', () => {        // a pin on a desktop; a phone reads the section as written
    gsap.timeline({ scrollTrigger: { trigger: '#proof .stage', pin: true, start: 'top top', end: '+=100%', scrub: true } })
      .from('#proof [data-count]', { textContent: 0, snap: { textContent: 1 }, ease: 'none' });
  });
  gsap.from('#work .frame', { clipPath: 'inset(12% 12% 12% 12%)', scale: 0.92, ease: 'none',
    scrollTrigger: { trigger: '#work', start: 'top 80%', end: 'top 20%', scrub: true } });
});
```

- **The budget:** 2-3 moments a page (a dealt `data-moment` counts, a hover or liquid one does
  not), at least one whose section starts in the first two screens, at least one scrubbed; never
  two in one section, never in a card, plan or bento cell.
- **Content lives in the HTML, script only animates it:** build with `gsap.from()` (or `fromTo`) so
  the written state is the finished one; nothing is hidden by CSS before the script runs. A moment's
  text is live, visible at every step (opacity 1 at its ends, 4.5:1 throughout).
- **Pins first:** create every pinned trigger before the triggers below it, top to bottom (or give
  a pin `refreshPriority: 1`). A scrubbed trigger made before a pin above it is measured without
  the pin's spacer, fires one pin-length early and looks like it runs backwards. `scroll.js` calls
  `ScrollTrigger.sort(); ScrollTrigger.refresh()` after window load, after every `onReady`
  callback, when the fonts are in and when system.js or the moments mark the page ready; a
  trigger made outside `onReady` after that is yours to order, and after a late layout change
  call `ScrollTrigger.refresh()`.
- **A pin keeps a headline on screen:** pin a stage inside the section that holds its h2 (or the
  hero's h1), never only a picture beside it; when a pin swaps headlines, cross-fade them (the next
  is on screen before the last leaves); never move the only headline out of its box. Two pins a
  page at most, each held for whole screens, one to three (`end: '+=100%'` to `'+=300%'`), and
  something inside changes while it is held.
- **What may move:** a picture or frame (scale .9-1, a clip from 12% inset, a mask), a heading, a
  count, a statement's colour, a pinned stage's steps, a product turning. A scrubbed move is at
  least 30px or a .08 change of scale between a third and two thirds of its range, so it reads.
- **What never moves on scroll:** body text at another speed than the page (parallax on text);
  a card, row, tile or section fading or rising in as it is reached (a moment is scrubbed or pinned,
  or one enter moment that runs once, 0.8-1.8 s); pricing, an FAQ, a form, the footer's links; the
  header and the phone bar look the same at every scroll position (the bar only comes up once the
  hero's button has scrolled away and steps down while the screen shows one of its actions:
  system.js, 240ms, at once under reduced motion). No scroll-snap, scroll-tinted ground or progress
  line.
- **Phones (under 900px):** pins become the section as written or a light scrub; the fact a
  moment shows is still drawn (a stepped list, the final figure). The kit's light moments run there
  (`moments.md`, The still rule); `perf.mjs` passes.
- **Kinds:** every kind takes the stack and the budget; on a place, product or service page the
  moments are photo- or type-led and never WebGL (house rule 8).

**The self-test.** `window.motionSelfTest()` (it exists even when every CDN failed) returns
`{ pass, fails, state, error, reduced, lenis, htmlLenis, smooth, libs, versions, failedScripts,
scrollTriggers, pinned, scrubbed, animated, callbacks }`; it passes when the libraries are in at their
versions, nothing failed to load, no callback threw, Lenis runs and smooths (under reduced motion:
no smoothing, no ScrollTrigger alive, the h1 visible). `consistency.mjs` checks the same in a browser,
`--quick` and the gate included: `lenis`, `motion-libs`, `scroll-moments`, `pin-heading` (25, 50 and
75% of every pin) and `trigger-sort` (a start moving more than 120px after a sort and refresh).

## Reduced motion, no script, phones

Lenis runs without smoothing (the wheel scrolls natively; `rtMotion.reduced` is true); every
`onReady` callback still runs and builds nothing that moves, and `scroll.js` then kills every
ScrollTrigger left and reverts its tween, so each scroll moment stands as written and no pin holds.
Colours still change; menus fade; a press shows as a deeper tone instead of a move; the tab
indicator and the switch knob jump to their place; the tick appears at full size; the underline
appears without travelling (`motion.css`, reduced motion: `transition-property` limited to
opacity and colours on links, `.m-tab-ind`, `.m-switch::before`, `.m-check::before`). The hero
stands as written. Every loop, effect, moment and scene shows its finished frame, marquees stand as a still row, numbers show their final text, pause buttons are hidden. On a
phone card loops and effects hold their finished picture or poster, heavy canvases become stills,
there are no hover states and no pointer simulations; the hero still enters, and the moments light
enough for a phone run there (`moments.md`, The still rule), so a phone page moves in two places too.

## Never

- A card, row or tile that reveals, staggers, slides or fades in as the page scrolls; parallax on
  body text; a fourth scroll moment; a scroll-jacking library beyond Lenis (ScrollSmoother,
  Locomotive Scroll, fullPage.js), scroll-snap or wheel capture; a page without Lenis; a pin that
  loses its headline, a third pin or one held over three screens; a trigger made before a pin above
  it; a shader or WebGL moment on a place, product or service page.
- A section heading that rises on every section, a second hero entrance, an entrance longer than
  about 1.1 s, or an entrance that hides text a visitor could already be reading.
- A card that tilts, flips, scales, follows the pointer or glows at the cursor; a magnetic button beyond the `magnetic` look's 4px lean (fine pointer, no reduced motion, never on the wide close; dealt only with `--allow magnetic`).
- A carousel, a slider that advances by itself, timed tabs, a rotating notice, a logo marquee.
- Blinking at random: twinkling dots, glitter, flicker, hue cycling, scrambled text; every change
  shows a state, a step or real data.
- A loop that plays once (outside a card story's replay), a card loop's cycle over 4 s, two loops in
  one panel.
- A hover slower than its token, an overshooting ease, a delay before a button reacts, a focus ring
  that animates, a second underline or indicator style, an animated width, height or margin.


## Self-test (v4.1)

`motionSelfTest()` reports `scrollMoments`, counted one per section from ScrollTriggers, scrubs, holds and the kit's scroll-kind moments. Without reduced motion it fails under 2, and fails with 0 ScrollTriggers and 0 `onReady` callbacks. A page whose only moments are non-GSAP kit ones plus an enter moment needs one GSAP-driven moment; `moments.mjs` deals at least one v4 moment on software and editorial.
