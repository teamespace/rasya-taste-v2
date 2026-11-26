# Navs (rasya-taste-v4.2)

The bar is dealt by `scripts/nav.mjs`, never chosen by taste. The pool holds the nav library's twelve archetypes in
`assets/navs/` and, at about 15% of the pool together, the kit's own four (`nav-mega`, `nav-cards`, `nav-centre`,
`nav-split`). **This replaces the kit's four-nav choice:** the one-liner loses its nav field, and the kit's rule "the
same bar at every depth" (system.md, Nav) holds only for a kit pick. Index: `assets/navs/index.json`. Gallery:
`assets/navs/demo.html` (each nav at 1440 at the top and past the hero, and at 390 with its menu open).

Why: the ten newest landing pages all shipped the kit's bar, "logo, 3 to 5 links, Product with a chevron, a CTA pill",
and read as one template. The bars on navbar.gallery each carry one thing that could only belong to that brand, a
type decision, a scroll state and a designed phone menu. Research: `research/drafts/navbar-patterns.md` (30 sites,
12 archetypes, the generic checklist, 8 rules).

## The library

Each nav is the kit's `header.nav` (its `.wrap.nav__bar`, `.nav__logo`, `.nav__links > .nav__item > .nav__link`,
`.nav__actions`, `.nav__toggle` and the skip link) with `data-nav="<id>"`, `data-nav-scroll`, `data-nav-menu` and its own
`.nv-*` children. system.js keeps the phone sheet, Escape, `aria-expanded` and `lenis.stop()`; navs.css styles the
bar; navs.js runs its scroll states. `--nav` in the table is the value to pass to `footers.mjs` and `buttons.mjs`.

| id | arch | the bar at 1440 | scroll state | phone menu | brand element | `--nav` |
|---|---|---|---|---|---|---|
| `ruled` | A1 | ruled cells on the page's column lines (links from column 3, actions from column 9), the action as the full-height end cell; sans 14, name 28 | section-aware: the current cell fills and takes the accent line; never hides | takeover of ruled rows | material: the ruled cells | nav-mega |
| `split-mark` | A2 | the kit's nav--split: words left 13px, the name centred 30px with its symbol, the action right | over a photograph no ground; past the hero the word folds to its symbol and the hairline comes in | takeover | object: the symbol | nav-split |
| `over-media` | A3 | 18px bold words over a full-bleed photograph, the name 32px heavy | transparent to solid past the hero; hides going down | takeover (solid on a phone) | datum: the place's local time | nav-cards |
| `pill` | A4 | the kit's nav--centre, open across the `.wrap` | collapses to a centred capsule on the surface once the page moves | sheet out of the capsule | datum: days to a real date, in a chip | nav-centre |
| `dock` | A5 | the name top left, the action top right; the words in a dock at the foot: an accent tile, mono segments | the dock stays; past the hero the top row folds and the dock takes the action | dock: menu and action at the foot | material: the tile and segments | nav-centre |
| `mono-strip` | A6 | mono caps 12 throughout, a path `/ section` after the logo | hides going down; the path follows the section | sheet | material: the label type and the path | nav-mega |
| `corner-index` | A7 | two or three words pinned to columns 4, 6, 8; mono caps 13; no ground | past the hero hides going down, back solid going up | takeover | datum: the studio's local time | nav-centre |
| `preview-mega` | A8 | one word opens a panel on the bar's ground: a link column and four product photographs | hides going down; a scroll closes the panel | takeover, products as 140px tiles | object: the newest product's chip | nav-cards |
| `takeover` | A9 | the name, one status, the action, a Menu button with its word | hides going down; the menu is a full-screen page in the display face | the same takeover | datum: one status line | nav-cards |
| `rail` | A10 | the masthead and the action; numbered tabs in the left gutter | section-aware: the current tab fills with the accent | dock | material: the rail | nav-mega |
| `live` | A11 | words 14, one datum in tabular mono with a dot, the action split with its price | hides going down; the datum runs with its section | dock: the datum stays up top | datum: one real number | nav-mega |
| `object` | A12 | the bar in the brand colour, its edge cut as an object (`data-edge`: scallop, ticks, wave) | the edge draws in to half once the page moves; hides going down | sheet that drops like an awning | object: the edge | nav-mega |

Kinds (index.json `kinds`): ruled software, tech, editorial, service; split-mark product, service, place, editorial,
software; over-media product, tech, place, service, gaming; pill software, service, product; dock service, software,
gaming, product; mono-strip software, tech, product, editorial, gaming; corner-index service, editorial, product,
gaming; preview-mega product, tech, software, place, service; takeover service, product, tech, gaming, software; rail
editorial, service, software; live software, tech, product, gaming; object product, software, service, place. A
place is dealt split-mark, object, over-media (over a photo hero), preview-mega (with products) and the kit's
nav-split and nav-cards; never a dock (its action bar holds the foot).

## The deal

```bash
node <skill>/scripts/nav.mjs pick --page <kind> --hero <dealt hero id> --has <photo,ui,datum,products> --history .taste-skill/history.json
```

Run it after the hero (`layout/deal.mjs`) and before `footers.mjs` and `buttons.mjs`, which take the `--nav` it prints.
It prints the template to copy, the stylesheet and script lines, the brand-element prompt, the CTA rule and the plan
line. `--hero` keeps over-media to the photo hero and weighs each nav by the heroes it sits best over or avoids;
without `--hero`, over-media needs `--has photo`. `--has datum` (one real number that matters to the buyer) lets
`live` in; `--has products` (four or more with photographs) lets `preview-mega` in. `--mood`, `--exclude` and
`--library-only` narrow the pool; `nav.mjs list` shows it; `nav.mjs check index.html` reads a built page.

The history: the `navs` list of the `--history` file and of the machine's global history (`scripts/lib/history.mjs`;
`RASYA_TASTE_HISTORY=off` or `--no-global` leaves it out). The last nav is never dealt again while another fits; the
last six weigh less. After the history is weighed the kit's navs are set to `weights.kitShare` (0.15) of the pool
together, so a kit bar still comes up about one page in seven. A kit pick carries `data-nav="nav-centre"` (its id) on
the starter's header and one brand element like the library's.

## When to use which

The dealer weighs these; read them when plan line 2 needs a reason.

- **ruled**: AI, infra, developer tools, research, technical B2B, editorial tech; a page built on visible lines. Fails
  on soft, rounded, playful brands. Draw the same column lines down the hero or the first section.
- **split-mark**: places, DTC, health, premium services, legal and finance with an editorial voice. The name must
  set well at 30px (a real logotype or the display face); tracked capitals (`.nv-caps`) only for a short name.
- **over-media**: hardware, cabins, hotels, outdoor, hospitality, a game's key art: only over the photo hero whose
  top 120px is calm. Dark top: the default light words; light top: `data-nav-tone="dark"`. No scrim, ever.
- **pill**: consumer apps, friendly SaaS, agencies and studios. The capsule is the surface colour; its alternative
  element is the capsule in the brand colour.
- **dock**: portfolios, studios, campaign and app-like pages with three to five sections. Short words (eight
  letters or fewer). Never with `nav.actionbar`.
- **mono-strip**: developer tools, data products, technical hardware, a DTC label voice; only when mono already
  speaks on the page (eyebrows, specs, code).
- **corner-index**: studios, agencies, magazines, fashion, sports. Two or three words; the hero's top 72px quiet.
- **preview-mega**: four or more products, rooms or lines, each with a real photograph. Never for one product (use
  live).
- **takeover**: brand-led sites, consumer fintech, hardware, games, agencies: anywhere the menu can be a second hero.
  One strong photograph for the open menu.
- **rail**: long-read and editorial pages, portfolios with chapters, docs-like software pages with four or five
  sections. The kit's 80px gutter at 1024 and up holds it.
- **live**: single-product DTC, hardware, fintech, dev tools, events, sports: one number that matters to the buyer.
- **object**: a brand with a physical or interface object (an awning, a pocket seam, a dial, a ruler, a wave); the
  accent is that object's colour.

## The rules (from the research, section 4, tightened)

1. **One archetype, dealt.** Plan line 2 names the nav and its archetype and one sentence on why it fits the brand
   world. A kit pick is allowed only with a brand element (rule 2) and its words on the `.wrap` (rule 5).
2. **One brand-world element in the bar, only one,** marked `data-nav-element="datum|material|object"`: a live
   datum (a price, a temperature, a count, a countdown, the local time, a rating), a material (ruled cells, mono
   label type, swatches, a dock) or an object (an edge, a symbol, a product). Real facts only, from the brief; never
   an announcement strip, never two. A datum is in tabular figures with a still dot; nothing in the bar loops.
3. **Type is a decision.** One of: mono caps 11 to 13px with set tracking (the action in mono too); sans 13 to 14px
   with the name at 2x or more (28px and up); 18 to 20px bold over a photograph. Every word 4.5:1 on what is behind it;
   the name never the body face at body weight.
4. **The nav's action is not the hero's.** A different job (an app, a call, a site visit, a subscription) or the same
   job with a price, a count, an icon or a live dot; never the hero primary word for word (`nav.mjs check` FAILs it).
   One filled element in the bar; on a brand-colour bar it is the page ground.
5. **Density.** Five words at most, 45 characters in all, each a section of the page; at most one plain second action
   (Sign in, Docs); a mega panel only with four or more products and their real photographs. Never square brackets in
   the bar (system.js outlines them as placeholders): a count goes in a `<sup>`.
6. **Locked to the grid.** The logo on the `.wrap`'s left line (split-mark: its centre on the centre line), the
   action ending on the right line (layout `check.mjs` edge-left and edge-right); ruled and corner-index put their
   words on column lines; the rail sits in the gutter, 12px clear of the left line.
7. **A designed scroll state, visible at y=1200** (below). Only transform, opacity and colour move, 200 to 450ms;
   reduced motion sets every state with no motion; anchor jumps land under the bar.
8. **A designed phone menu** (below), never the plain list: the display face at 32 to 48px (32 to 56 allowed), the
   action and the brand element in the open state, Lenis stopped while open. No glass, no white border, no gradient
   in the bar, no em dash in its words.

## Scroll

navs.js reads `data-nav-scroll` (each template has it) and sets the shared classes on the header, so a checker can
compare y=0 with y=1200:

| behaviour | class | when |
|---|---|---|
| (always) | `is-scrolled` | past 8px |
| `solid` | `is-solid` | past the hero (main's first child, or `[data-nav-solid-at]`): the nav's second state, a solid ground, a folded word, the dock's action |
| `hide` | `is-hidden` | scrolling down past two bar heights; gone on the first move up; never while the header holds the focus, the pointer or the open menu |
| `pill` | `is-pill` | past 24px |
| `section` | `aria-current="location"` on the link | the section under the line 30% down the screen; also `data-nav-path` text, `data-nav-at`, and `data-nav-on` from a section's `data-nav-theme` |

The scroll position comes from `window.rtMotion.lenis` (scroll.js) when it runs, else from the window. navs.js makes
no ScrollTrigger, so the bar never counts as one of the page's scroll moments and never moves a pin. A bar that
hides is `transform: translateY(-100%)` (plus its edge); a fixed child (the dock, the rail, a phone dock) never sits
in a header that moves. Anchor links in the bar land under it: a section that pads its own top (`main > section`,
`footer.closing`) lands on its top as scroll.js lands it; any other target lands the bar's height lower; through
`lenis.scrollTo` with an offset, else `window.scrollTo`; a keyboard jump moves the focus.

## Phone

`data-nav-menu` names the designed menu; navs.css styles each under 1024 (the dock nav's own dock under 640):

- **takeover** (ruled, split-mark, over-media, corner-index, preview-mega, takeover): the whole screen on the inverse
  ground, the bar over it in the same colours, the words numbered in mono beside the display face, the action and
  the element at the foot. The takeover nav does it at 1440 too, with one photograph on columns 10 to 12, and keeps
  Tab inside while open.
- **sheet** (pill, mono-strip, object): a rounded panel under the bar on the surface, the page dimmed behind (a tap
  on it closes), the actions floating at the foot. object's drops full width on the brand colour with its edge.
- **dock** (dock, rail, live): the menu button and the action in a bar at the foot on the inverse ground, 12px clear
  of the screen's edges, the sheet rising out of it; `--bar` pads every section for it. `.nv-dockbar` wraps
  `.nav__actions` and `.nav__toggle` (`display: contents` where the dock is off).

system.js opens and closes every one of them through `.nav__toggle` and stops Lenis while open; write no second
handler. A menu button with a word: `data-nv-label="Menu" data-nv-label-open="Close"` (the icon system.js swaps stays).

## Building one

1. Copy the `<header>..</header>` of `assets/navs/nav-<id>.html` (nothing else from it) in place of the starter's
   header.nav. Keep its classes (split-mark is `nav nav--split`, pill `nav nav--centre`), `data-nav`,
   `data-nav-scroll`, `data-nav-menu`, the skip link first, `.nav__toggle` with `aria-expanded="false"`, and
   `.nv-dockbar` on a dock menu. Every word becomes the client's; the words are the page's sections.
2. Link `assets/navs/navs.css` once in `<head>` after `assets/layout/layout.css`, and load
   `<script src="assets/navs/navs.js" defer></script>` once, after `assets/motion/scroll.js`.
3. The brand element, from the brief:
   - the local time: `<span class="nv-datum" data-nav-element="datum" data-nav-clock="Europe/Berlin">Leipzig <time>14:32</time></span>`
     (an IANA zone; never coordinates or a street number);
   - a countdown: `data-nav-countdown="2026-12-01"` or `"monthly:1"`, with `[data-when]` holding `<b data-n>`,
     `<span data-unit data-one="day" data-many="days">` and `[data-zero]` for the day itself;
   - a scrubbed number: `<span data-nav-datum data-from="40" data-to="96" data-for="#dial">96</span>`: write the true
     value (data-to) in the HTML; under reduced motion and without script it stays;
   - a material or an object: the template's own (`data-nav-element` on the cells, the path, the tile, the symbol,
     the product chip, the edge). Pick the edge with `data-edge="scallop|ticks|wave"` on the object nav.
4. Over a photo hero: `data-nav-over` on the header (split-mark, over-media; pill, dock and corner-index too when the
   deal put them over a photograph), `data-nav-tone="dark"` for a light top. A section may set `data-nav-theme`.
5. Set the CTA (rule 4) and run `nav.mjs check index.html`; fix every FAIL.

## The check

`node <skill>/scripts/nav.mjs check index.html` (no browser) reads: `data-nav` and its id; a library nav's classes and
`data-nav-menu`; one `data-nav-element`; five words at most and 45 characters; the nav's action unlike the hero's
primary (and a price, count, icon or dot on it, WARN); navs.css and navs.js; the menu button's `aria-expanded`; the
skip link first; no em dash, `[bracket]`, inline gradient or backdrop-filter in the bar; a valid `data-nav-clock`; the
needs of the nav (over-media over hero-photo, a dock menu without `nav.actionbar`, preview-mega's four photographs, the
object's `.nv-edge`). It exits 1 on a FAIL. consistency.mjs `nav-generic` (agent K) reads the same contract in the
browser.

## Mistakes

A second brand element (a datum and a swatch); a datum the brief does not give; a pulse on the dot; the hero's
primary repeated in the bar; six words; the logo off the left line; over-media over a split hero; a scrim to make the
words read; a dock with the phone action bar; a mega panel of icons; a bar that changes on scroll in more than its
designed way; a sheet that is the plain list at 20px; tracked capitals for a long name; `[12]` in the bar.

## Knobs

`--nv-dur` (320ms) and `--nv-fast` (220ms) on the header; `--nv-rail` (56px); `--nv-edge` and `--nv-edge-size`
with `data-edge`; `data-nav-tone`; `data-nav-solid-at` on the element whose end turns the bar solid; `data-nav-label`
on a link (the path's word); `data-nav-theme` on a section.
