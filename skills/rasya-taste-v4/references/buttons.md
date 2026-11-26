# Buttons (rasya-taste-v4)

A page has one button look, set once on `<html data-buttons>` and dealt by `scripts/buttons.mjs`, never chosen
by taste. Five looks are upstream's, in `system.css` (`solid`, `pill`, `tonal`, `arrow`, `block`, unchanged;
`system.md`, Radius and buttons). The library adds twelve crafted looks in `assets/buttons/buttons-library.css`,
with `buttons-library.js` for the two that need a script. Index: `assets/buttons/index.json`. Gallery:
`assets/buttons/demo.html`. They were written for this fork after a survey of the 21st.dev button category
(`research/BUTTONS-21ST.md`) and rasya-taste-v2's devices B1-B8; no code was copied.

The markup never changes. A page switches look by changing `data-buttons` alone:

```html
<a class="btn btn--primary" href="#start">Start free trial<svg class="m-arrow" ...></svg></a>
<a class="btn btn--secondary" href="#tour">See the tour</a>
<a class="link" href="#docs">Read the docs</a>
```

## The library

| id | family | hover (and keyboard focus) | press | JS | radius | kinds | mood |
|---|---|---|---|---|---|---|---|
| `wipe` | fill wipe | a deeper tone wipes in from the left and leaves to the right; the outline fills with ink, its label flips to the ground | deeper tone | - | page | every kind | crisp, calm |
| `roll` | label roll | the label slides up, its copy rolls in from below; tonal secondary | deeper tone | yes | page | software, product, service | crisp, playful |
| `swap` | arrow swap | the drawn arrow leaves to the right and comes back from the left, once; outline secondary with the arrow too | deeper tone | - | page | software, product, service, editorial | crisp, editorial |
| `kbd` | key chip | the primary's key chip (return, or `data-kbd`) sinks 1px; the outline secondary's key edge darkens | deeper tone; the secondary's edge flips to the top | - | page; chip 6px | software | crisp |
| `ring` | ring | a hairline ring settles 4px around the button | deeper tone | - | page; ring +4px | software, product, service, editorial | calm, crisp |
| `press` | press depth | the 2px key edge rises to 3px | the edge flips to the top (letterpress) | - | own: page, capped at 10px | product, service, place | playful, crisp |
| `underline` | underline draw | a 1px line draws under the primary's words; the secondary is a text button whose ink line draws in | deeper tone | - | page | editorial, service, place, product | editorial, calm |
| `reveal` | icon reveal | a dot after the label grows into a disc with the arrow cut out | deeper tone | - | page | software, product | playful, crisp |
| `shine` | shine | one soft band of light crosses the primary once; tonal secondary | deeper tone | - | page | software | crisp |
| `magnetic` | magnetic | the button leans up to 4px toward the pointer | deeper tone | yes | page | software, product (opt-in) | playful |
| `split` | split | after the label a hairline rule draws taller and the meta cell (an arrow or `data-meta`) nudges 3px | deeper tone | - | page | product, software | crisp |
| `soft` | tonal soft | the secondary's action tint deepens and an inset ring shows; the primary has a 1px top light | deeper tone | - | page | software, service, editorial, product | calm |

Every look keeps the motion layer's 1px hover step and its press (`motion.css`), plus the drawn underline of
`.link`; `underline` drops the link's arrow so a link is its words alone. `swap`, `kbd`, `reveal` and `split` draw
their own glyph in place of `svg.m-arrow` (leave it in the markup: the other looks use it).

## When to use which

The dealer weighs these; read them when the deal needs a reason on plan line 2.

- **Software.** Developer tools and pro apps: `kbd`. Confident SaaS: `roll`, `reveal`, `split` (a free tier:
  "Start free | Free"), `shine` (sparingly). Calm SaaS, fintech, AI for teams: `wipe`, `ring`, `soft`. Docs-led
  tools: `swap`.
- **Product and hardware.** A tactile or direct-to-consumer product: `press`. A price on the buy button:
  `split` with `data-meta="$169"`. Otherwise `reveal`, `roll`, `wipe`, `ring`.
- **Service.** A clinic, a law firm, a studio: `soft`, `ring`, `wipe`; a studio with an editorial voice:
  `underline`; a craft trade: `press`.
- **Place.** Square 2px buttons (system.css): `underline`, `wipe`, `press`, or the upstream `block`, `solid`,
  `arrow`.
- **Editorial.** `underline` first, then `swap`, `ring`, `soft`, `wipe`.
- **With the nav and the close.** `nav-split` and `nav-centre` sit well with `underline` and `swap`; `nav-cards`
  with `press`, `split`, `reveal`. The type close's large button (`.btn--xl`, once a page) takes every look but
  `magnetic` (the lean stops on a button wider than 480px); `close-photo` suits the quiet ones.
- **Never** `magnetic` without `--allow magnetic` (motion.md bans it until the rule changes), `shine` off
  software, or a `data-kbd` chip for a shortcut the page does not wire.

## The rules

1. **One look a page, one pair.** `.btn--primary` is the one filled button in any view; every secondary takes
   the look's secondary (an outline, a tint, or `underline`'s text button); text links are `.link`. No third
   style, no page CSS on a `.btn`'s look, `transform` or `transition`.
2. **Sizes.** The kit's: 44px (`--btn-h`), 36px `.btn--sm`, 48px in the phone bar and on a place's hero,
   `.btn--xl` once for the type close. Label 16px (15 in the nav), 24px side padding. Nothing on hover changes a
   button's width or height: every part that moves is a transform on a pseudo-element or the label span, and
   the ring sits 4px outside without taking room. Two buttons side by side share their height.
3. **States.** Hover, `:focus-visible` and `:active` each show. Keyboard focus shows the hover's end state (the
   wipe, the roll, the disc, the chip) with the kit's 2px focus ring; `ring` shows the kit's ring only, so two
   rings never stack; `shine` and `magnetic` show their colour change only on focus. A press is the motion
   layer's 1px sink and .985 scale plus a deeper tone (or the key edge flipping, in `kbd` and `press`).
4. **Motion.** Transform and opacity only (the underline lines grow by background-size, as the kit's links do);
   colours 150ms in and 120ms out; a travelling part (a wipe, a roll, the arrow swap, the ring) 240ms (the kit's
   `--m-slide`); the shine's one pass 700ms; the press 90ms; the kit's one ease-out (`--ease`), no overshoot.
   Hover moves for a fine pointer only (`(hover: hover) and (pointer: fine)`), so a phone never keeps a stuck
   one; focus moves on any device. Nothing loops and nothing moves at rest.
5. **Reduced motion.** Under `prefers-reduced-motion: reduce`, with `data-motion="off"` and on touch, nothing
   travels: every look shows its end state as a colour, at once (the wipe's fill, the ring in place, `reveal`'s
   disc at rest); the press shows as a deeper tone; `magnetic` does not lean.
6. **Contrast.** The label keeps 4.5:1 at rest and in every state. The deeper hover tone (`--bl-deep`,
   `--bl-deeper`) moves the action's lightness away from its label (a dark action darkens, a light one lightens,
   a near-white one on a brand band darkens), so contrast only grows. A wiped secondary flips its label to the
   ground colour on the ink. Chips, rules and meta text take the label's colour. Tints stay at 7 to 22%, with the
   label in ink.
7. **Colour.** The ground's tokens only (`--action`, `--action-ink`, `--ink`, `--bg`, `--line`, `--line-strong`),
   so a `.ground-inverse` or brand band section gets its own set; no hex in a look, no violet. No gradient fill,
   glow or drop shadow: the shine's narrow band and the underline's 1px lines are not fills, and `press` and
   `kbd` use inset edges inside the button.
8. **Radius.** `--r-btn` from `data-radius` (a place: 2px). Own radii, said in the table: `press` caps it at 10px
   (a key, never a pill), the `kbd` chip at 6px, the `ring` follows the button's radius plus 4px.
9. **Markup extras.** Only two, both optional and both decoration (hidden from screen readers):
   `data-kbd="⌘K"` on a `kbd` primary, only for a shortcut the page itself wires (the default chip is return,
   which a focused button does take), and `data-meta="Free"` on a `split` button (a price or count shown there is in
   the page's text too). Labels stay a verb and an object (`copy.md`); the extras are not part of them.
10. **Phone.** Under 640px every look's secondary in a `.btn-row` is the kit's underlined text link under the
   full-width primary, as `system.css` draws it for the upstream looks.
11. **Scripts.** `roll` and `magnetic` need `buttons-library.js` (defer, once). Without it `roll` is a colour
   change and `magnetic` the kit pair: nothing breaks. A page that adds buttons after load calls
   `window.rtButtons.init(element)`.

## The deal

After the nav and the close are dealt (`sections.md`), from the project folder:

```bash
node <skill>/scripts/buttons.mjs pick --page <kind> --nav <dealt nav> --close <dealt close> --history .taste-skill/history.json
```

It prints the `data-buttons` value, the stylesheet line (after `assets/motion/motion.css`; the starter has it)
and, for `roll` and `magnetic`, the script line. The history file is the one the other dealers keep (its
`buttons` list): the last two looks are never dealt again while another fits, and the last eight weigh less.
Library looks weigh twice the upstream ones; `--library-only` leaves the upstream ones out; `--mood calm|crisp|
playful|editorial` keeps one mood; `--allow magnetic` lets the opt-in look in. `list [--page <kind>]` shows
every look. Write the look on plan line 2 and build exactly that.

Before the checker, `node <skill>/scripts/buttons.mjs check index.html` reads the page without a browser: the look
on `<html>`, its stylesheet and script, and stray `data-kbd` or `data-meta` on a look that does not show them.

## Pending (`HANDOFF-E.md`)

`motion.md` bans a shine sweep and a magnetic button, and holds a button's hover to 150ms. The library asks for
three exceptions: the `shine` look's one pass on the primary (software), the opt-in `magnetic` look, and the
240ms travel of a library look's moving part. Until the rule changes, the dealer never deals `magnetic`, and
`shine` stays at a low weight on software only.
