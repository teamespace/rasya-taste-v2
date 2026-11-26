# Footers (rasya-taste-v4.1)

The page ends on one screen, `footer.closing`: row 1 the close, row 2 the links (`system.md`, Footer;
`layout-v4.md`). The ending is dealt by `scripts/footers.mjs`, never chosen by taste, as one pick: the close and the
footer together. The pool holds the kit's own types (system.css and the starter's templates) and the five endings of
the footer library in `assets/footers/`. The dealer replaces the footer and close fields of the one-liner (SKILL.md
step 4). Index: `assets/footers/index.json`. Gallery: `assets/footers/demo.html` (each ending at 1440x900 and 390x844,
light and dark).

## The library

Each ending is a whole `footer.closing` in `assets/footers/footer-<id>.html`. The dealt id is `footer-<id>`, and the
footer carries `data-footer="<id>"` (the kit writes `footer-dark` as `footer--dark` the same way). The `.wrap` keeps
the kit's two rows, `.closing__cta` and `.closing__links`, so the checker's footer and close logic still reads it.

| ending | row 1, the close | row 2, the footer | wordmark | ground | JS | kinds |
|---|---|---|---|---|---|---|
| `footer-emboss` | a hairline, the closing line on span-7, a note and the button on span-4 from column 9 | one row: the name and a line, the nav's words with Privacy and Terms, the socials | pressed into the ground (letterpress) | `ground-surface` | fit | software, product, service, editorial |
| `footer-fade-word` | centred: the closing line, one line, the button | a centred row of underlined links, the legal line | huge and pale, fading toward the foot; an optional ornament on one letter | the page ground | fit | software, gaming, product, service, editorial |
| `footer-split-close` | a hairline, the closing line set large on span-7, a note and the button on span-4 from column 9 | the kit's columns and legal row | none | the page ground (or `footer--dark ground-inverse`) | none | software, gaming, product, service, editorial |
| `footer-outline-fill` | the kit's head row: the closing line and a line left, the button right | the kit's columns and legal row | an outline that fills from the foot up as the footer comes up | `ground-inverse` | fill | software, gaming, product, service |
| `footer-index` | the kit's head row, then the page's sections as a numbered index in the display face | the legal row | none | the page ground | none | editorial, service, software, product |

The kit's endings stay in the deal: `footer-columns`, `footer-dark`, `footer-statement` (tech, the lit ground) and
`footer-visit` (a place, a service with a door), each with a close from the kind's list: `close-type`,
`close-photo` (only with a photograph left, `--photo`), `close-word` (the name across the `.wrap`). A place is dealt
the kit only (`footer-visit` or `footer-columns`, with `close-photo`, else `close-head`: close-word's head row without
the name).

## The deal

```bash
node <skill>/scripts/footers.mjs pick --page <kind> --nav <dealt nav> [--photo] [--type <pairing id>] --name "<Brand>" --history .taste-skill/history.json
```

Run it after the one-liner (it needs the nav) and before `buttons.mjs`, which takes the `--close` it prints. It
prints the ending; for a library ending the template to copy, the stylesheet line, the script line when the ending
needs it, `--ft-fit` for the name, and the plan line. `--type` is the pairing `start.mjs` dealt: a serif display weighs
`footer-emboss` up, a sans weighs `footer-fade-word` and `footer-outline-fill` up. `--no-wordmark`, `--exclude`,
`--library-only`, `--mood` and `--buttons` narrow or weigh the pool. `footers.mjs list` shows the pool,
`footers.mjs fit --name "<Brand>"` prints `--ft-fit` alone, and `footers.mjs check index.html` reads a built page.

The history: the `footers` list of the `--history` file and of the machine's global history
(`scripts/lib/history.mjs`; `RASYA_TASTE_HISTORY=off` or `--no-global` leaves it out). The last ending is never dealt
again while another fits; after a wordmark ending the next page gets none while another fits; the last six weigh
less. A kit pick is kept as `<footer>+<close>`, so a `close-word` counts as a wordmark ending.

## When to use which

The dealer weighs these; read them when the deal needs a reason on plan line 2.

- **`footer-emboss`**: calm, crafted brands; a serif display; a light grey or a dark page. Square buttons sit best
  with it (`block`, `press`, `solid`, `split`, `kbd`). Not on a page whose last section already sits on the surface:
  then it takes the page ground.
- **`footer-fade-word`**: consumer apps, reading and wellbeing products, calm services; a grotesk display; a pill
  or a soft button. Its centred close is the one centred heading of the page (the checker's `heading-align` leaves
  footer headings out). The ornament: one, in the accent, on the letter it suits (the flower in the template, or the
  page's dealt `.mark`); none for a client whose own mark is not a flower.
- **`footer-split-close`**: any kind but a place; the plain, strong default of the library. A long closing line
  (six to eight words) reads best here.
- **`footer-outline-fill`**: software, games, hardware; a sans display at 500 or more. Its fill is scrubbed to the
  scroll, so it is one of the page's 2-3 scroll moments: deal `moments.mjs` with `--count 2` beside it.
- **`footer-index`**: editorial and long service pages with five to eight sections worth a row. A short page deals
  again with `--exclude footer-index`.

## The rules

- **The giant wordmark is a dealt option, never the default.** It comes only from the deal (`footer-emboss`,
  `footer-fade-word`, `footer-outline-fill`, or the kit's `close-word`), weighs under half a plain ending, and never
  falls on two pages in a row. This reverses v3: rasya-taste-v2 banned "the giant ghost wordmark" as the template
  ending (`critique.md` item 15, `anatomy.md`, `research/drafts/footer-patterns.md` section 4). v4.1 keeps the reason
  (a faded name dropped at the foot of every page adds height and no meaning) and changes the rule: dealt, crafted,
  at most once a page.
- **Crafted means:** the name fills the footer edge to edge (`--ft-fit`, fitted by `footers.js`), the page's foot
  crops it (about half of it shows, `--ft-show` .52 to .56), and it carries one idea: pressed into the paper, fading
  out under a flower, or filling with the scroll. Never a flat grey name at low opacity behind the links.
- **One giant name a page.** A library wordmark never shares the page with `close-word`'s name, a place's `name`
  type moment, the name set wide in `footer-visit`, or a brand band holding the name (`footers.mjs check` FAILs two).
- **Decoration only.** The wordmark is `aria-hidden="true"`, holds no link or control, and the real name is in text
  in the same footer (the logo, the copyright line). It is the only low-contrast type on the page: every word a
  visitor reads (the close, the links, the legal row, the credits) meets AA on its ground: 4.5:1, or 3:1 for text of
  24px and more, ink for running text and the muted tone only for labels (`system.md`, the type floor).
- **No sideways scroll, at any width.** The wordmark is a layer beside the `.wrap`, a child of `footer.closing`,
  `left: 0; right: 0` (never `100vw`, which counts the scrollbar); the footer clips it (`overflow: clip`). Its size is
  `clamp(--ft-min, --ft-fit * 1vw, --ft-cap)`: `--ft-cap` (72svh) stops a short name on a short screen, which then
  sits centred.
- **One screen still.** The footer pads its foot for the word (`--ft-gap` plus the slice that shows), so the close
  and the links keep to the screen above it: write the close in eight words, the note in two lines, and one row of
  links (`footer-emboss`) or the kit's columns. Content that does not fit takes `.g2` (two screens), never a smaller
  word.
- **Reduced motion leaves everything still.** Nothing in the library loops. `footer-outline-fill` shows the word
  filled under reduced motion, without the scroll stack and before `footers.js` runs; `footer-index`'s arrow rests
  in place.
- **One ornament at most.** The ornament is one small SVG (or the page's `.mark`) in the accent, `aria-hidden` with
  the word, never words, never a second one.
- **Copy the footer only.** A template is a demo page: take its `<footer>` and nothing else (its head, palette and
  type are the demo's), replace every word with the client's, and delete the starter's close and links templates.

## Building one

1. Copy the `<footer ...>..</footer>` of `assets/footers/footer-<id>.html` in place of the starter's footer.closing.
2. Link `<link rel="stylesheet" href="assets/footers/footers.css">` in `<head>` after `assets/layout/layout.css`
   (the starter has it); add `<script src="assets/footers/footers.js" defer></script>` after `scroll.js` when the
   deal prints it (the three wordmark endings).
3. Set `style="--ft-fit: <n>"` on the footer as printed, and the name in `.ft-mark__word` as the logo writes it (the
   client's short name when the full one is over 12 characters).
4. Write the close (the h2, eight words at most, the main action word for word), the note, the links (sections on the
   page, Privacy and Terms to pages you write), the socials only when the brief gives the accounts, and the one
   credits line.
5. Run `node <skill>/scripts/footers.mjs check index.html` with the other checks.

The knobs, on the footer unless noted:

| variable | default | what it does |
|---|---|---|
| `--ft-fit` | 18 | the word's size in vw (the dealer's estimate; `footers.js` measures the letters and writes it) |
| `--ft-show` | .52 to .56 | the share of the size that shows above the page's foot |
| `--ft-cap` | 72svh | the largest the word gets |
| `--ft-min` | 40px | the smallest |
| `--ft-gap` | 48px (32 on a phone) | the air between the last row and the word |
| `--ft-inset` | 0 | % of the width left free at each side (a word that should not touch the edges) |
| `--ft-track` | -0.035em | the word's tracking (on `.ft-mark__word`) |
| `--ft-line-size` | clamp | the closing line's size (`footer-emboss`, `footer-split-close`, `footer-fade-word`) |
| `data-press="raised"` | pressed in | `footer-emboss`: the letters raised instead of pressed in |
| `data-fill="accent"` | ink tint | `footer-outline-fill`: fill in a tint of the accent |
| `--orn-y`, `--orn-dx`, `--orn-size` | 0.45em, 0, 0.24em | the ornament's foot, sideways shift and size (on the svg or its letter) |

## The checker

The wordmark is low-contrast type cropped by the page's foot and the screen's sides on purpose, so the checks that
read it as content (off-viewport, cut-text, text-contrast and contrast, the section's fit and containment, the layer
rules) leave `[data-footer-wordmark]` out once the exemptions in `HANDOFF-H.md` section 4 are merged. Until then a
page with a library wordmark shows those FAILs on the footer: report them as the pending exemption, never hide the
word. `empty-area` keeps counting the word (it fills the foot), and `scroll-moments` keeps counting
`footer-outline-fill`'s fill (it is a scrubbed moment).
