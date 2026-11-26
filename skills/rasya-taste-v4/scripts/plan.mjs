#!/usr/bin/env node
/*
  rasya-taste-v4 plan.mjs - deals the page's shape: one section plan of its kind (references/sections.md,
  section 3, Software plans and Editorial plans) and, since v4.3, the pool sections that bring it to its length.
  v4.1 agent I; v4.3 agent S (length, pool, heights, the statement as a paragraph).

    node <skill>/scripts/plan.mjs pick --page <kind> --history .taste-skill/history.json
                                      [--has logos,quotes,security,...] [--exclude id,id] [--plan <id>]
                                      [--length N] [--seed S] [--json] [--no-global]
    node <skill>/scripts/plan.mjs list [--page <kind>] [--md]
    node <skill>/scripts/plan.mjs show <id> [--md]
    node <skill>/scripts/plan.mjs pool [--page <kind>] [--md]
    node <skill>/scripts/plan.mjs check

  kind: software (saas, ai, app, fintech, developer tools) has five plans, editorial (magazine, journal, blog,
  newsletter, long read) three. Any other kind has one plan (sections.md section 3 or 4): pick prints where it is
  and records nothing.

  pick deals one plan at random, seeded, never one of the last plans of this kind (the last two of five, the
  last one of three; the ones before weigh half for each time they came). The plan is its core: the sections that
  make its shape, in order. Then the page's length: a software page holds 9 to 12 sections after the hero, an
  editorial page 8 to 11 (the close and the footer not counted); pick deals the length and fills it from the kind's
  pool (logo or proof row, roles, integrations, security, a worked example, quotes, the old way, steps, resources,
  changelog, questions, a mid-page call ...), each pool section dealt away from the ones the last pages of this kind
  took and placed in its zone (early, middle, late, end) where no two sections without a picture and no two bands
  meet. Every pool section and every optional core section prints its condition: what the brief must give. Without
  --has the builder keeps those whose condition the brief meets and takes the reserves, in order, for the rest; with
  --has <keys> (what the brief gives: `plan.mjs pool` lists the keys) pick keeps only those itself, and a brief too thin
  for 8 sections says so. No filler: a section whose condition the brief does not meet is never built.

  Heights: each line says 1, 1-2, 2, 2-4 (a hold) or 3 (data-screen="tall") screens, or band (a short band sized to
  its content, half a screen or less; one screen at most: data-screen="band", system.css). The statement is a band:
  a paragraph of 25 to 60 words that reveals as you scroll (moments.md, paragraph-reveal), in two of the five
  software plans and one of the three editorial ones, never a few words set huge.

  It prints the sections in order (the id to give the section, the recipe from sections-library.md, or "held" for
  the dealt hold moment's own section and "statement" for the paragraph statement; the height; the moment slot; the
  centrepiece; the condition), then the reserves, the pricing, the questions, the proof, the hero line and the
  moments line to run next (moments.mjs pick with its --count, --fits and --first). A section with choices (a|b) is
  dealt away from the choices the last plans of this kind printed. --exclude leaves plans out (the brief lacks a
  plan's "needs": say so on plan line 2); --plan prints that plan and records nothing; --length fixes the count.

  History: the local --history file's "plans", "planParts" and "planPool" lists and the global history
  (scripts/lib/history.mjs: $RASYA_TASTE_HISTORY, default ~/.rasya-taste/history.json; --no-global leaves it
  out), so two builds in two folders, or at once, are dealt different shapes, lengths and extras.

  list --md, show --md and pool --md print the plans and pools as sections.md writes them; check holds the plans
  against sections.md and sections-library.md and deals each plan 400 times to hold the rules (the length, no two
  sections without a picture and no two bands side by side, no recipe twice, one moment slot in the first two
  sections after the hero).
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openGlobal, readJson, writeJsonAtomic } from './lib/history.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KINDS = {
  software: 'software', saas: 'software', ai: 'software', app: 'software', apps: 'software', fintech: 'software',
  dev: 'software', developer: 'software', 'developer-tool': 'software', devtool: 'software',
  editorial: 'editorial', magazine: 'editorial', journal: 'editorial', blog: 'editorial', publication: 'editorial',
  newsletter: 'editorial', longform: 'editorial', 'long-read': 'editorial',
};
const ONE_PLAN = {
  gaming: 'sections.md section 3, Gaming', game: 'sections.md section 3, Gaming',
  product: 'sections.md section 3, Product', tech: 'sections.md section 3, Product (hardware)', hardware: 'sections.md section 3, Product (hardware)',
  service: 'sections.md section 3, Service', place: 'sections.md section 4, Place (its length by the photographs: full, compact or short)',
};
// v4.3: the length of a page, sections after the hero (the close and the footer not counted)
const LENGTH = { software: [9, 12], editorial: [8, 11] };
const SHORT = 8; // under this many sections after the hero a page is too short unless the brief is thin (consistency.mjs page-short)
// recipes a plan names that sections-library.md does not have yet (sections.md section 3, New recipes); the
// compositions of the v4.3 ones come with the next step's reference map, so their names stay generic
const NEW_RECIPES = ['pricing-calculator', 'faq-grid', 'subscribe-form', 'use-cases', 'security', 'worked-example', 'stats-band', 'quote-wall', 'cta-band'];
// not recipes: built from the hero dealer, or from the dealt moment's own section (moments.md)
const SPECIAL = ['hero', 'held', 'statement'];
// the screens a section takes: band (sized to its content, one screen at most), 1, 1-2, 2, 2-4 (a hold), 3 (tall)
const HEIGHTS = ['band', '1', '1-2', '2', '2-4', '1-3', '3'];

/* ------------------------------------------------------------------ the plans (the core of each shape)
   section: { id, recipe, else?, deal?: [a, b], what, screens, slot?, centre?, calm?, opt?, key?, mergeInto? }
     recipe  a sections-library.md id, or hero / held / statement
     else    the recipe when the slot's dealt moment is not the one named (held, a moment's section)
     deal    choices dealt by pick, away from the last plans' choices
     screens band, 1, 1-2, 2, 2-4 or 3 (HEIGHTS)
     slot    the moment slot it offers: section, statement or gallery (moments.mjs --fits)
     calm    a section without a picture (a price list, the questions, a statement, a band of figures, the call):
             never two side by side
     opt     the section is optional: the condition
     key     what the section carries (logos, quotes, pricing, questions ...): a pool section of the same key is not
             dealt beside it; with --has an optional section is kept only when its key is there
     mergeInto  when the optional section before it is out, it merges into that section as its last block
   plan.covers: keys the plan answers inside another section (merged questions): their pool sections are not dealt */
const PLANS = {
  software: [
    {
      id: 'one-transaction', name: 'One transaction',
      suits: 'a workflow product whose job is one unit of work from start to finish: an incident, an invoice, an approval, a claim, a booking',
      needs: 'one unit of work the brief describes, in 3 to 5 states (the brief\'s own story, times or numbers)',
      hero: 'deal.mjs --type software --has ui; its picture is the item at its first state',
      moments: { fits: 'section,statement', photo: 'when the page has photographs' },
      covers: [],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the item at its first state: the alert firing, the file uploaded, the draft', screens: '1' },
        { id: 'walk', recipe: 'held', else: 'steps', what: 'the same item through its 3 to 5 states, the app\'s screen at each, a time or status on each (stacked-panels: a panel a state; pinned-chapters: a step a state)', screens: '2', slot: 'section', centre: true, key: 'steps' },
        { id: 'done', recipe: 'app-frame', what: 'the item finished, in the whole app: the list beside the open item', screens: '1', slot: 'section' },
        { id: 'change', recipe: 'statement', what: 'what changed for the person, the before and the after, as one paragraph of 25 to 60 words from the brief that reveals as you scroll; a kicker over it, one line or link under it', screens: 'band', slot: 'statement', calm: true },
        { id: 'more', recipe: 'bento', deal: ['bento', 'split-text-left', 'features-2x2'], what: 'what else it does around that item: the jobs before and after it; a quote-stat or customer-proof-row the brief gives merges in as its last block', screens: '1-2' },
        { id: 'faq', recipe: 'faq', what: 'its own section, answers open, the price answered first in full (every plan in one answer)', screens: '1', calm: true, key: 'questions' },
      ],
      pricing: 'inline: no pricing section; the price in one line under the close\'s h2 ("Free for 3 engineers. Team $24 per engineer a month.") and in the first answer of the questions',
      questions: 'the faq recipe, its own section, the last before the close',
      proof: 'merged into more (quote-stat or customer-proof-row, only from the brief), or a pool section (proof-row, voices, quote) when the brief gives it',
    },
    {
      id: 'docs-led', name: 'Docs first',
      suits: 'developer tools, APIs, SDKs, CLIs and infrastructure: a buyer who judges by the first command',
      needs: 'real commands or calls the brief gives (an install line, a config, an API call) and what they return',
      hero: 'deal.mjs --type software --has ui; its picture is the install line and what it returns, in a terminal or code window',
      moments: { fits: 'section', photo: 'when the page has photographs' },
      covers: [],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the install line and what it returns', screens: '1' },
        { id: 'quickstart', recipe: 'held', else: 'tabs-tour', what: 'three steps, install, connect, first run, each a terminal-run or code fragment with the real command and its output (stacked-panels: a panel a step; tabs-tour: a tab a step, click only)', screens: '1-2', slot: 'section', key: 'steps' },
        { id: 'result', recipe: 'app-frame', what: 'what the first run gives, in the whole app: runs, deploys or events, the list beside the open item', screens: '1', slot: 'section', centre: true },
        { id: 'reference', recipe: 'split-text-left', what: 'one real call and its response as a code fragment, the SDK languages as real icons', screens: '1', opt: 'when the brief gives an API or SDK call', key: 'api' },
        { id: 'integrations', recipe: 'integrations-grid', what: 'the tools it reads and writes, real icons: the big grid for 9 or more tools the brief lists, else four cards or a hub-tools diagram card', screens: '1', key: 'integrations' },
        { id: 'plans', recipe: 'comparison-table', what: 'the plans as columns, the limits as rows (requests, seats, retention, support), each plan\'s button in the head row', screens: '1-2', calm: true, key: 'pricing' },
        { id: 'changelog', recipe: 'timeline-rail', what: 'the last four releases the brief dates, each with a fragment of what changed', screens: '1', opt: 'when the brief dates its releases', key: 'releases' },
        { id: 'faq', recipe: 'faq', what: 'docs questions (install, data, limits, self-hosting), answers open with the command where one helps; its own section only after the changelog, else merged under the plans table as its last block', screens: '1', calm: true, mergeInto: 'plans', key: 'questions' },
      ],
      pricing: 'a table: comparison-table, plans as columns, limits as rows',
      questions: 'docs questions: their own section after the changelog, else merged under the table',
      proof: 'the changelog\'s dates; a quote-stat the brief gives merges into result, or a pool section when the brief gives more',
    },
    {
      id: 'comparison-led', name: 'Against the old way',
      suits: 'a product that replaces a way the buyer already knows: a spreadsheet, an email chain, a legacy tool, twenty tabs',
      needs: 'the way it is done today, named in the brief (its tools, its files, what it costs in time)',
      hero: 'deal.mjs --type software --has ui; the h1 names the job, the lead names what it replaces',
      moments: { fits: 'section', photo: 'when the page has photographs' },
      covers: ['questions'],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the job, and the old way it replaces named in the lead', screens: '1' },
        { id: 'today', recipe: 'held', else: 'split-text-left', what: 'the old way as it is: the email thread, the file called final_v7, the tabs, in the old tools\' real icons (stacked-panels: the old way piling up, a panel a tool or file)', screens: '1-2', slot: 'section' },
        { id: 'with', recipe: 'app-frame', what: 'the same job in the product, on a new ground (the dark band or the surface band)', screens: '1', slot: 'section', centre: true },
        { id: 'compare', recipe: 'comparison-table', what: 'today against the product, row by row (time, steps, where the file lives, who signs), the old tools\' real icons in the today column\'s head, the last group "Moving over" (import, contract, cancel); its h2 a plain section heading, no statement over it', screens: '1-2', calm: true, key: 'old-way' },
        { id: 'switch', recipe: 'steps', what: 'moving over in three steps: import from the old tool, invite the team, the first result, each with its fragment (pinned-chapters, when dealt, walks them)', screens: '1', slot: 'section', key: 'steps' },
        { id: 'proof', recipe: 'quote-stat', what: 'a before and an after the brief gives, with the person\'s face; a dealt counter-rolls rolls its figure', screens: 'band', opt: 'when the brief gives the quote', key: 'quote' },
        { id: 'pricing', recipe: 'pricing-three', deal: ['pricing-three', 'pricing-two'], what: 'the plans as cards (three plans: pricing-three; two: pricing-two, whatever was dealt), up to three billing questions merged under them', screens: '1', calm: true, key: 'pricing' },
      ],
      pricing: 'cards: pricing-three or pricing-two, by the brief\'s plans',
      questions: 'no questions section: the comparison table\'s last group answers the switching questions, up to three billing questions merge under the prices',
      proof: 'after the switch, a before-and-after quote as a band',
    },
    {
      id: 'product-tour', name: 'The product, chapter by chapter',
      suits: 'a platform with three or more areas the brief names (plan, build, ship; book, pay, report), each worth a screen',
      needs: 'two or three areas, each with its own screen and four features',
      hero: 'deal.mjs --type software --has ui (centred, collage or split); the hero\'s stage holds the app window whole, the app-frame\'s two panes as its picture',
      moments: { fits: 'section', photo: 'when the page has photographs' },
      covers: ['questions'],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the product whole: the app window on the hero\'s stage', screens: '1', centre: true },
        { id: 'area-1', recipe: 'chapter', what: 'the first area: a paragraph, its main screen wide, four feature names', screens: '2', slot: 'section' },
        { id: 'area-2', recipe: 'chapter', what: 'the second area (with a dealt hold moment: that moment\'s section, the area\'s features as its panels)', screens: '2', slot: 'section' },
        { id: 'area-3', recipe: 'chapter', what: 'the third area', screens: '2', opt: 'when the brief names a third area', key: 'area-3' },
        { id: 'integrations', recipe: 'integrations-grid', what: 'the tools it works with, real icons; a quote-stat the brief gives merges in as its last block', screens: '1', key: 'integrations' },
        { id: 'pricing', recipe: 'pricing-calculator', what: 'a seat or usage slider and the plan it lands on, the monthly total, one button; three billing questions merged under it', screens: '1', calm: true, key: 'pricing' },
      ],
      pricing: 'a calculator (pricing-calculator, new): the reader sets seats or usage and reads the total',
      questions: 'merged under the calculator: three billing questions',
      proof: 'merged into integrations, or a pool section when the brief gives more',
    },
    {
      id: 'manifesto', name: 'A point of view',
      suits: 'a product with a stance: the brief gives a belief, a limit it keeps or an enemy it names',
      needs: 'a belief or a limit in the brief\'s own words (the fact sheet\'s limit or enemy, copy-voice.md), enough for a paragraph',
      hero: 'deal.mjs --type software --has ui, a hero with a picture (never the statement or word hero: the stance follows it)',
      moments: { fits: 'section,statement', photo: 'when the page has photographs' },
      covers: [],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the category in the h1, the stance in the lead', screens: '1' },
        { id: 'stance', recipe: 'statement', what: 'the stance as one paragraph of 25 to 60 words from the brief that reveals as you scroll (why it works this way, what it refuses), a kicker over it, one link under it', screens: 'band', slot: 'statement', calm: true },
        { id: 'product', recipe: 'app-frame', what: 'the product keeping that stance', screens: '1', slot: 'section', centre: true },
        { id: 'principles', recipe: 'held', else: 'features-2x2', what: 'three or four principles, each with the screen that keeps it (stacked-panels: a panel a principle; features-2x2: a card a principle)', screens: '1-2', slot: 'section' },
        { id: 'pricing', recipe: 'pricing-two', what: 'free and paid, the stance applied to the price (who never pays)', screens: '1', calm: true, key: 'pricing' },
        { id: 'limit', recipe: 'split-text-left', what: 'what it will not do, shown: the button a person must press, the data it never keeps; a quote-stat the brief gives merges in under it', screens: '1' },
        { id: 'faq', recipe: 'faq-grid', what: 'six questions in three columns, answers open, the hard ones first', screens: '1', calm: true, key: 'questions' },
      ],
      pricing: 'two plans, mid-page: pricing-two before the limit',
      questions: 'a grid (faq-grid, new): six open answers in three columns, the last section',
      proof: 'under the limit, or a pool section when the brief gives more',
    },
  ],
  editorial: [
    {
      id: 'cover-story', name: 'The issue',
      suits: 'a magazine or journal published in issues: one lead story and a contents',
      needs: 'a lead story and four to six more pieces the brief names, with photographs',
      hero: 'deal.mjs --type editorial --has photo (the masthead: the headline across the wrap beside the lead story\'s photograph)',
      moments: { fits: 'section,gallery', photo: true },
      covers: ['questions'],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the lead story\'s photograph and headline; the issue\'s number and date as the fact', screens: '1', centre: true },
        { id: 'lead', recipe: 'split-text-left', what: 'the lead story opens: its standfirst and first lines beside its photograph, one link to read it', screens: '1', slot: 'section' },
        { id: 'contents', recipe: 'peek-list', what: 'the issue\'s pieces as rows (title, writer, reading time), each row its own photograph', screens: '1', key: 'picks' },
        { id: 'gallery', recipe: 'held', else: 'photo-pair', what: 'photographs from the issue (gallery-runs: 5 to 8 at 4:5; photo-pair: two)', screens: '1-2', slot: 'gallery', key: 'photos' },
        { id: 'writers', recipe: 'people-row', what: 'the contributors the brief names', screens: '1', opt: 'when the brief names the writers', key: 'contributors' },
        { id: 'subscribe', recipe: 'pricing-two', what: 'print and digital (or free and paid), what each issue brings; three questions merged (delivery, cancel, gift)', screens: '1', calm: true, key: 'pricing' },
      ],
      pricing: 'two subscriptions as cards (pricing-two)',
      questions: 'merged under the subscriptions',
      proof: 'press lines the brief gives as a press row, or the readers\' quotes when the brief gives them',
    },
    {
      id: 'long-read', name: 'One long read',
      suits: 'one essay, report or feature that is the page: one subject, one author',
      needs: 'one piece with 3 to 5 parts, a photograph for each, and its author',
      hero: 'deal.mjs --type editorial --has photo, with a photograph of the subject (never the word or statement hero: the standfirst follows it)',
      moments: { fits: 'section,statement', photo: true },
      covers: ['pricing'],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the title, the author and the reading time over the subject\'s photograph', screens: '1' },
        { id: 'standfirst', recipe: 'statement', what: 'the standfirst: the piece\'s opening paragraph, 25 to 60 words, revealed as you scroll; the author\'s name and the date as its kicker', screens: 'band', slot: 'statement', calm: true },
        { id: 'parts', recipe: 'held', else: 'peek-list', what: 'the piece in its 3 to 5 parts, a photograph each (photo-chapters or stacked-panels as dealt; peek-list: a row a part)', screens: '2-4', slot: 'section', centre: true, key: 'picks' },
        { id: 'figure', recipe: 'photo-band', what: 'the widest photograph of the piece across the screen, one line on its calm side (photo-expands, when dealt, builds it)', screens: '1', slot: 'section', key: 'photos' },
        { id: 'voice', recipe: 'quote-stat', what: 'a named voice from the piece with the face; the stat only when the piece reports a figure', screens: 'band', key: 'quote' },
        { id: 'author', recipe: 'split-text-left', what: 'the author\'s portrait from the brief and two lines; their other pieces as links', screens: '1', key: 'about' },
      ],
      pricing: 'none: the close is the subscribe form (subscribe-form, new), the email field in place of the big button',
      questions: 'none, or the subscription\'s questions as a pool section when the brief prices one',
      proof: 'the named voice after the figure',
    },
    {
      id: 'front-page', name: 'The front page',
      suits: 'a newsletter, blog or journal that publishes often: the reader comes for the latest and the rhythm',
      needs: 'a cadence (weekly, every Friday), the latest piece, four dated earlier ones and two to four topics',
      hero: 'deal.mjs --hero statement (or word): type-led, the subscribe-form in place of the buttons',
      moments: { fits: 'section,gallery', photo: true },
      covers: [],
      sections: [
        { id: 'hero', recipe: 'hero', what: 'the name, what it covers and how often; the subscribe field (subscribe-form)', screens: '1', calm: true },
        { id: 'latest', recipe: 'split-text-left', what: 'the newest piece: its photograph, the standfirst, one link', screens: '1', slot: 'section', centre: true },
        { id: 'issues', recipe: 'timeline-rail', what: 'the four before it, dated, each with its photograph in the panel', screens: '1', key: 'archive' },
        { id: 'topics', recipe: 'features-2x2', what: 'two to four topics, each a photograph and its latest title (a dealt photo-unveil or gallery-runs builds the row)', screens: '1-2', slot: 'gallery', key: 'topics' },
        { id: 'editor', recipe: 'people-row', what: 'who writes it: the people the brief names, a portrait each', screens: '1', opt: 'when the brief names them', key: 'contributors' },
        { id: 'subscribe', recipe: 'pricing-two', what: 'free and paid, three questions merged', screens: '1', calm: true, opt: 'when the brief gives a paid tier', key: 'pricing' },
      ],
      pricing: 'the field in the hero and the close; free and paid as pricing-two only with a paid tier',
      questions: 'merged under the paid tier, when there is one, or the questions as a pool section',
      proof: 'the dated issues',
    },
  ],
};

/* ------------------------------------------------------------------ the pools (v4.3)
   pool section: { id, key, recipe | deal, what, screens, zone: [early|middle|late|end], calm?, slot?, needs, always? }
     key     what the brief must give (pick --has); always: true when every brief gives it (the main action, the price)
     needs   the condition in words, printed on its line
     zone    where it may go: early (right after the hero or after the first section), middle, late (round the price
             and the questions), end (after the last section of the plan) */
const POOL = {
  software: [
    { id: 'proof-row', key: 'logos', recipe: 'logo-row', screens: 'band', zone: ['early'], what: 'the customers\' real logos in one row under one line of who uses it', needs: 'the brief names four to eight customers or users whose logos may be shown' },
    { id: 'figures', key: 'stats', recipe: 'stats-band', screens: 'band', zone: ['early', 'middle'], calm: true, what: 'three or four figures in one row, each with its unit and what it counts (a dealt counter-rolls rolls them once)', needs: 'the brief states three or four figures (customers, volume, uptime, time saved)' },
    { id: 'how', key: 'steps', recipe: 'steps', screens: '1', zone: ['early', 'middle'], slot: 'section', what: 'how it works in three or four steps, each with the fragment of its screen', needs: 'the brief describes the setup or the flow in three or four steps' },
    { id: 'roles', key: 'roles', recipe: 'use-cases', screens: '1', zone: ['middle'], what: 'one card a role or team: who, the job in one line, the screen they work in', needs: 'the brief names two to four roles or teams and the job it does for each' },
    { id: 'example', key: 'numbers', recipe: 'worked-example', screens: '1', zone: ['middle'], slot: 'section', what: 'one real case worked through: the inputs, the steps, the result, as a table or a calculation in the app\'s UI', needs: 'the brief gives the figures of one real case (a month of invoices, an incident\'s minutes, the hours saved)' },
    { id: 'before', key: 'old-way', recipe: 'comparison-table', screens: '1', zone: ['middle'], calm: true, what: 'the old way against the product, row by row, the old tools\' real icons in its head', needs: 'the brief names the way it is done today (its tools, its files, the time it takes)' },
    { id: 'quote', key: 'quote', recipe: 'quote-stat', screens: 'band', zone: ['middle'], what: 'one quote with the person\'s face, name and role, and its figure when the brief gives one', needs: 'the brief gives one quote with a name, a role and a face' },
    { id: 'integrations', key: 'integrations', recipe: 'integrations-grid', screens: '1', zone: ['middle', 'late'], what: 'the tools it reads and writes, real icons (the big grid for 9 or more, else four cards or a hub-tools diagram card)', needs: 'the brief lists three or more tools it works with' },
    { id: 'trust', key: 'security', recipe: 'security', screens: '1', zone: ['late'], what: 'where the data lives, who can see it, the certifications as their real marks, the audit log or the permission screen as UI', needs: 'the brief says how data is kept: where it lives, who sees it, a certification (SOC 2, ISO 27001, GDPR) or an audit log' },
    { id: 'voices', key: 'quotes', recipe: 'quote-wall', screens: '1-3', zone: ['late'], what: 'the customers\' quotes as a wall, each with a name, a role and a face; nine or more make it tall (data-screen="tall")', needs: 'the brief gives three or more quotes, each with a name and a role' },
    { id: 'resources', key: 'resources', recipe: 'peek-list', screens: '1', zone: ['late'], what: 'guides, posts or docs as rows, each with its title, date and picture', needs: 'the brief names guides, posts or docs with their titles' },
    { id: 'changelog', key: 'releases', recipe: 'timeline-rail', screens: '1', zone: ['late'], what: 'the last three or four releases, dated, each with a fragment of what changed', needs: 'the brief dates three or four releases' },
    { id: 'call', key: 'cta', recipe: 'cta-band', screens: 'band', zone: ['middle'], calm: true, always: true, what: 'the main action mid-page: one line on what happens after the click and the primary button (never on the screen beside the close)', needs: 'always: the main action' },
    { id: 'faq', key: 'questions', deal: ['faq', 'faq-grid'], screens: '1', zone: ['end'], calm: true, always: true, what: 'the questions the brief answers (price, data, setup, cancel), answers open: a list or a grid as dealt, never an accordion by default', needs: 'always, unless the plan merges its questions' },
  ],
  editorial: [
    { id: 'press', key: 'logos', recipe: 'logo-row', screens: 'band', zone: ['early'], what: 'the outlets, prizes or institutions that cite it, their real marks in one row', needs: 'the brief names outlets, prizes or institutions' },
    { id: 'figures', key: 'stats', recipe: 'stats-band', screens: 'band', zone: ['early', 'middle'], calm: true, what: 'three figures in one row: readers, issues, years, countries', needs: 'the brief states three figures about the publication' },
    { id: 'picks', key: 'picks', recipe: 'peek-list', screens: '1', zone: ['middle'], what: 'the editor\'s picks from the archive as rows: title, writer, reading time, a photograph each', needs: 'the brief names four or more earlier pieces with their photographs' },
    { id: 'essay', key: 'photos', recipe: 'photo-pair', screens: '1', zone: ['middle'], slot: 'gallery', what: 'a photo essay from the issue or the piece (photo-unveil or gallery-runs, when dealt, builds it)', needs: 'the brief gives two to eight photographs from the issue or the piece' },
    { id: 'topics', key: 'topics', recipe: 'features-2x2', screens: '1', zone: ['middle'], what: 'two to four topics, each a photograph and its latest title', needs: 'the brief names two to four topics' },
    { id: 'quote', key: 'quote', recipe: 'quote-stat', screens: 'band', zone: ['middle'], what: 'one named voice from the writing with the face', needs: 'the brief gives a quote with the person\'s name and face' },
    { id: 'archive', key: 'archive', recipe: 'timeline-rail', screens: '1', zone: ['middle', 'late'], what: 'four earlier issues or pieces, dated, each with its photograph', needs: 'the brief dates four earlier issues or pieces' },
    { id: 'readers', key: 'quotes', recipe: 'quote-wall', screens: '1-3', zone: ['late'], what: 'readers\' or writers\' quotes as a wall, each with a name', needs: 'the brief gives three or more quotes with names' },
    { id: 'contributors', key: 'contributors', recipe: 'people-row', screens: '1', zone: ['late'], what: 'the writers and editors, a portrait and a line each', needs: 'the brief names the writers or editors, with portraits' },
    { id: 'about', key: 'about', recipe: 'split-text-left', screens: '1', zone: ['late'], what: 'who makes it and why, in the brief\'s words, beside a photograph of the team or the place', needs: 'the brief says who makes it, with a photograph' },
    { id: 'events', key: 'events', recipe: 'calendar-frame', screens: '1', zone: ['late'], what: 'talks, launches or the next issues, dated', needs: 'the brief dates talks, launches or the next issues' },
    { id: 'signup', key: 'cta', recipe: 'cta-band', screens: 'band', zone: ['middle'], calm: true, always: true, what: 'the subscribe field mid-page and one line on what arrives and how often', needs: 'always: the subscription is the main action' },
    { id: 'faq', key: 'questions', recipe: 'faq', screens: '1', zone: ['end'], calm: true, what: 'the subscription\'s questions: delivery, cancel, gift, answers open', needs: 'the brief prices a subscription or a membership' },
  ],
};

/* ------------------------------------------------------------------ helpers */
function args(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { a._.push(t); continue; }
    const k = t.slice(2), v = argv[i + 1];
    if (v == null || v.startsWith('--')) a[k] = true; else { a[k] = v; i++; }
  }
  return a;
}
const die = (m, code = 1) => { console.error('plan: ' + m); process.exit(code); };
const list = v => (v && v !== true ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
function rng(seed) {
  let h = 2166136261 >>> 0;
  for (const ch of String(seed)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  let s = h || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const wpick = (items, w, rand) => {
  const tot = items.reduce((s, x) => s + w(x), 0);
  let r = rand() * tot;
  for (const x of items) { r -= w(x); if (r <= 0) return x; }
  return items[items.length - 1];
};
const shuffle = (xs, rand) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const allPlans = () => Object.entries(PLANS).flatMap(([page, ps]) => ps.map(p => ({ ...p, page })));
const findPlan = id => allPlans().find(p => p.id === id);
const skill = () => { const r = ROOT.split(path.sep).join('/'); return /\s/.test(r) ? `"${r}"` : r; };
const isBand = s => s.screens === 'band';
const heightLabel = h => (h === 'band' ? 'band (sized to its content, half a screen or less; data-screen="band")'
  : h === '3' ? '3 screens (data-screen="tall")' : h === '1-3' ? '1-3 screens (3: data-screen="tall")' : `${h} screen${h === '1' ? '' : 's'}`);

/* ------------------------------------------------------------------ the deal */
// a plan of this kind, never one of the last K (K: half the plans, at least one), the ones before weigh half a time
export function dealPlan(page, { history = [], exclude = [], rand }) {
  const plans = PLANS[page].filter(p => !exclude.includes(p.id));
  if (!plans.length) throw new Error(`every ${page} plan is excluded`);
  const K = Math.max(1, Math.floor(PLANS[page].length / 2));
  const last = [], seen = history.filter(id => PLANS[page].some(p => p.id === id));
  for (let i = seen.length - 1; i >= 0 && last.length < K; i--) if (!last.includes(seen[i])) last.push(seen[i]);
  const fresh = plans.filter(p => !last.includes(p.id));
  const from = fresh.length ? fresh : plans;
  const recent = seen.slice(-2 * PLANS[page].length);
  return wpick(from, p => Math.pow(0.5, recent.filter(id => id === p.id).length), rand);
}
// the choices inside the plan (a|b), each away from the last plans' choices of this kind, never one recipe twice
export function dealParts(sections, { history = [], rand }) {
  const parts = {}, taken = new Set(sections.filter(s => !s.deal).map(s => s.recipe));
  const recent = history.slice(-8);
  for (const s of sections) {
    if (!s.deal) continue;
    const open = s.deal.filter(r => !taken.has(r));
    const from = open.length ? open : s.deal;
    const pick = wpick(from, r => Math.pow(0.35, recent.filter(id => id === r).length), rand);
    parts[s.id] = pick; taken.add(pick);
  }
  return parts;
}
const recipeOf = (s, parts = {}) => parts[s.id] || s.recipe || (s.deal ? s.deal[0] : null);
// the plan's core for a brief: with --has, an optional section the brief does not give is out, and a section that
// merges into the one before it when its optional neighbour is out (docs-led's questions under the plans table) merges
function coreFor(plan, has) {
  if (!has) return plan.sections;
  const kept = plan.sections.filter(s => !s.opt || has.includes(s.key));
  return kept.filter((s, i) => !(s.mergeInto && kept[i - 1] && kept[i - 1].id === s.mergeInto));
}

// the gaps a pool section may take in the core list (gap g sits before core section g; gap N after the last)
function gapsOf(core, zone) {
  const N = core.length;
  const anchor = core.findIndex((s, i) => i > 1 && ['pricing', 'questions'].includes(s.key));
  const late = anchor > 0 ? anchor : Math.max(2, N - 2);
  const lastIsQ = core[N - 1].key === 'questions';
  const out = new Set();
  for (const z of zone) {
    if (z === 'early') { out.add(1); out.add(2); }
    if (z === 'middle') for (let g = 3; g <= late; g++) out.add(g);
    if (z === 'late') for (let g = late; g <= (lastIsQ ? N - 1 : N); g++) out.add(g);
    if (z === 'end') out.add(N);
  }
  return [...out].filter(g => g >= 1 && g <= N).sort((a, b) => a - b);
}
// the page's rules held over a dealt list: no two sections without a picture side by side, no two bands, no recipe
// twice (the chapter series aside), a moment slot in the first two sections after the hero
function faults(seq, parts = {}) {
  const out = [];
  for (let i = 0; i + 1 < seq.length; i++) {
    const a = seq[i], b = seq[i + 1];
    if (a.calm && b.calm && b.mergeInto !== a.id) out.push(`${a.id} and ${b.id} are both without a picture and side by side`);
    if (isBand(a) && isBand(b)) out.push(`${a.id} and ${b.id} are both bands and side by side`);
  }
  const rs = seq.map(s => recipeOf(s, parts)).filter(r => r && !['hero', 'held', 'statement', 'chapter'].includes(r));
  rs.filter((r, i) => rs.indexOf(r) !== i).forEach(r => out.push(`the recipe ${r} twice`));
  if (!seq.slice(1, 3).some(s => s.slot)) out.push('no moment slot in the first two sections after the hero');
  return out;
}

// v4.3: the page's length from the kind's pool. core: the plan's sections (the optional ones the brief lacks already out
// when --has is given); has: the brief's keys or null (unknown: every condition printed for the builder)
export function dealPool(plan, page, { has = null, history = [], rand, length = null }) {
  const [lo, hi] = LENGTH[page];
  const core = plan.sections;
  const target = length != null ? Math.max(1, Math.min(20, length)) : lo + Math.floor(rand() * (hi - lo + 1));
  const coreKeys = new Set(core.map(s => s.key).filter(Boolean));
  const usedRecipes = new Set(core.map(s => s.recipe).filter(r => r && !SPECIAL.includes(r)));
  const eligible = POOL[page].filter(p => !coreKeys.has(p.key) && !(plan.covers || []).includes(p.key)
    && !(p.recipe && usedRecipes.has(p.recipe)) && (has == null || p.always || has.includes(p.key)));
  // dealt order: weighted without replacement, away from the pool sections the last pages of this kind took
  const recent = history.slice(-24);
  const order = [];
  let left = [...eligible];
  while (left.length) {
    const p = wpick(left, x => Math.pow(0.45, recent.filter(id => id === x.id).length) * (x.always ? 0.8 : 1), rand);
    order.push(p); left = left.filter(x => x !== p);
  }
  // the questions go in whenever the plan has none of its own (they are always on point): first in the order
  const qi = order.findIndex(p => p.key === 'questions');
  if (qi > 0) order.unshift(order.splice(qi, 1)[0]);
  // place each in turn in its zone where the rules hold, until the page reaches its length
  let seq = core.map(s => ({ ...s, core: true }));
  const placed = [], skipped = [];
  for (const p of order) {
    if (seq.length - 1 >= target) break;
    const gaps = shuffle(gapsOf(core, p.zone), rand);
    let done = false;
    for (const g of gaps) {
      // before core section g: after any pool sections already set in that gap, or before them (dealt)
      const at = g >= core.length ? seq.length : seq.findIndex(s => s.core && s.id === core[g].id);
      const lo2 = (() => { let k = at; while (k > 0 && !seq[k - 1].core) k--; return k; })();
      for (const pos of shuffle(Array.from({ length: at - lo2 + 1 }, (_, i) => lo2 + i), rand)) {
        const trial = [...seq.slice(0, pos), { ...p, pool: true }, ...seq.slice(pos)];
        if (faults(trial).length <= faults(seq).length) { seq = trial; done = true; break; }
      }
      if (done) break;
    }
    if (done) placed.push(p.id); else skipped.push(p.id);
  }
  const reserve = order.filter(p => !placed.includes(p.id)).slice(0, 4);
  return { seq, target, placed, reserve, skipped, eligible: eligible.map(p => p.id) };
}

function momentsOf(plan, seq) {
  const slots = seq.filter(s => s.slot);
  const fits = [...new Set([...plan.moments.fits.split(','), ...slots.map(s => s.slot)])].filter(f => slots.some(s => s.slot === f));
  const after = seq.slice(1).length;
  // two or three (Rasya's budget): three on a page of nine sections or more with three slots, one of them not a plain
  // section (a statement or a gallery), since three section moments must be three kinds
  const count = after >= 9 && slots.length >= 3 && slots.some(s => s.slot !== 'section') ? 3 : 2;
  const firstSec = seq.slice(1, 3).find(s => s.slot);
  return { count, fits: fits.join(','), first: firstSec ? firstSec.slot : null, firstId: firstSec ? firstSec.id : null };
}
function momentsLine(plan, seq, hist) {
  const m = momentsOf(plan, seq);
  const photo = plan.moments.photo === true ? ' --photo' : ' [--photo ' + plan.moments.photo + ']';
  return `node ${skill()}/scripts/moments.mjs pick --page ${plan.page} --count ${m.count} --fits ${m.fits}${m.first ? ` --first ${m.first}` : ''}${photo} --history ${hist || '.taste-skill/history.json'}`;
}
function recipeLabel(s, parts) {
  const r = recipeOf(s, parts);
  if (r === 'held') return `held (the dealt hold moment's section; else ${s.else})`;
  if (r === 'statement') return 'statement (the paragraph that reveals: sections-library.md, statement)';
  if (r === 'hero') return 'hero (deal.mjs)';
  return r + (NEW_RECIPES.includes(r) ? ' (new)' : '') + (s.deal && !parts[s.id] ? ` (dealt from ${s.deal.join('|')})` : '');
}
const condOf = s => (s.pool ? s.needs : s.opt ? s.opt : null);

function printPlan(plan, D, parts, { seed, hist, json, recorded, has }) {
  const seq = D.seq, after = seq.length - 1, m = momentsOf(plan, seq);
  if (json) {
    console.log(JSON.stringify({
      seed, page: plan.page, plan: plan.id, name: plan.name, suits: plan.suits, needs: plan.needs, hero: plan.hero,
      length: { target: D.target, dealt: after, range: LENGTH[plan.page] },
      sections: seq.map(s => ({ id: s.id, recipe: recipeOf(s, parts), else: s.else || null, what: s.what, screens: s.screens, slot: s.slot || null, centre: !!s.centre, calm: !!s.calm, band: isBand(s), optional: s.opt || null, pool: !!s.pool, condition: condOf(s), key: s.key || null })),
      reserve: D.reserve.map(p => ({ id: p.id, recipe: recipeOf(p, parts), screens: p.screens, condition: p.needs, key: p.key })),
      pricing: plan.pricing, questions: plan.questions, proof: plan.proof, moments: { ...m, line: momentsLine(plan, seq, hist) }, has, recorded,
    }, null, 1));
    return;
  }
  console.log(`plan ${plan.id} (${plan.name}) · page ${plan.page}${seed ? ` · seed ${seed}` : ''}${recorded ? '' : ' · not recorded'}`);
  console.log(`  suits:  ${plan.suits}`);
  console.log(`  needs:  ${plan.needs} (the brief lacks it: deal again with --exclude ${plan.id}, the reason on plan line 2)`);
  console.log(`  hero:   ${plan.hero}`);
  console.log(`  length: ${after} sections after the hero (dealt ${D.target}; ${plan.page === "editorial" ? "an" : "a"} ${plan.page} page holds ${LENGTH[plan.page][0]}-${LENGTH[plan.page][1]}, under ${SHORT} is too short unless the brief is thin)`);
  console.log(`  sections, in order (CENTRE holds the centrepiece; slot: the moment it may hold; when: build it only when the brief gives that, else take the next reserve):`);
  seq.forEach((s, i) => {
    const tags = [s.centre ? 'CENTRE' : '', s.slot ? `slot ${s.slot}${s.id === m.firstId ? ' (FIRST TWO SCREENS)' : ''}` : '', s.calm ? 'no picture' : '', s.pool ? 'pool' : ''].filter(Boolean).join(' · ');
    const c = condOf(s), name = s.opt ? `[${s.id}]` : s.id;
    console.log(`  ${String(i).padStart(2)}. ${name.padEnd(15)} ${recipeLabel(s, parts)} · ${heightLabel(s.screens)}${tags ? ' · ' + tags : ''}`);
    console.log(`      ${s.what}`);
    if (c) console.log(`      when: ${c}${has && s.pool ? ' (met: --has)' : ''}`);
  });
  console.log('      footer.closing: the dealt close and footer (not counted)');
  if (D.reserve.length) {
    console.log('  reserve, in order (a dealt section whose condition the brief does not meet is left out and the next of these taken, in its zone, never beside another section without a picture or another band):');
    D.reserve.forEach(p => console.log(`      ${p.id.padEnd(14)} ${recipeLabel(p, parts)} · ${heightLabel(p.screens)} · ${p.zone.join('/')} · when: ${p.needs}`));
  }
  if (has && after < SHORT) console.log(`  THIN BRIEF: ${after} sections after the hero; the brief gives nothing for more. Say so on plan line 2 (consistency.mjs page-short WARNs it).`);
  console.log(`  pricing:   ${plan.pricing}`);
  console.log(`  questions: ${plan.questions}`);
  console.log(`  proof:     ${plan.proof}`);
  console.log(`  moments:   ${momentsLine(plan, seq, hist)}`);
  console.log('             each dealt moment goes to a section whose slot it fits; the one it marks FIRST TWO SCREENS to the section marked so above;');
  console.log('             a "held" section without a hold moment is built from its else recipe; a statement slot the deal left empty:');
  console.log('             deal one more (--count 1 --fits statement --exclude <the dealt ids>) and leave out the dealt moment no slot takes.');
  console.log('  heights:   band = data-screen="band" on the section (its content and padding, one screen at most); 3 = data-screen="tall"; else --h 1 or 2 (.g2)');
  const line = seq.map(s => (s.opt ? `[${s.id}]` : s.id) + (parts[s.id] ? ` (${parts[s.id]})` : '') + (isBand(s) ? ' [band]' : s.screens === '3' ? ' [tall]' : '')).join(', ');
  console.log(`  plan line 2: "plan ${plan.id}, ${after} sections: ${line}, footer.closing"`);
}

function cmdPick(a) {
  const raw = String(a.page && a.page !== true ? a.page : '').toLowerCase().trim();
  if (!raw) die('pass --page <kind> (SKILL.md section 1): software and editorial deal a plan; the other kinds have one');
  const page = KINDS[raw];
  if (!page) {
    if (ONE_PLAN[raw]) { console.log(`plan: a ${raw} page has one plan, ${ONE_PLAN[raw]}; nothing to deal`); return; }
    die(`"${raw}" is no kind: software, editorial, gaming, product, tech, service or place`, 2);
  }
  const seed = a.seed && a.seed !== true ? String(a.seed) : crypto.randomBytes(4).toString('hex');
  const rand = rng(seed);
  const hist = a.history && a.history !== true ? readJson(a.history) : {};
  const forced = a.plan && a.plan !== true ? String(a.plan) : null;
  if (forced && !PLANS[page].some(p => p.id === forced)) die(`--plan ${forced} is no ${page} plan: ${PLANS[page].map(p => p.id).join(', ')}`, 2);
  const exclude = list(a.exclude);
  for (const id of exclude) if (!findPlan(id)) die(`--exclude: no plan "${id}"`, 2);
  const has = a.has != null && a.has !== true ? list(a.has) : (a.has === true ? die('--has names what the brief gives: ' + keysOf(page).join(', '), 2) : null);
  if (has) { const bad = has.filter(k => !keysOf(page).includes(k)); if (bad.length) die(`--has: no key ${bad.join(', ')}; the ${page} keys: ${keysOf(page).join(', ')}`, 2); }
  const length = a.length != null && a.length !== true ? Number(a.length) : null;
  if (length != null && !(length >= 1)) die('--length takes a count of sections after the hero', 2);
  const G = openGlobal({ local: a.history, by: 'plan', enabled: !forced });
  const history = G.recent('plans', { page, local: Array.isArray(hist.plans) ? hist.plans : [] });
  const partsHistory = G.recent('planParts', { page, local: Array.isArray(hist.planParts) ? hist.planParts : [] });
  const poolHistory = G.recent('planPool', { page, local: Array.isArray(hist.planPool) ? hist.planPool : [] });
  let plan;
  try { plan = forced ? PLANS[page].find(p => p.id === forced) : dealPlan(page, { history, exclude, rand }); } catch (e) { G.close(); die(e.message); }
  plan = { ...plan, page };
  // with --has, the optional core sections the brief does not give are out before the pool fills the length
  const core = coreFor(plan, has);
  const D = dealPool({ ...plan, sections: core }, page, { has, history: poolHistory, rand, length });
  const parts = dealParts(D.seq, { history: partsHistory, rand });
  printPlan(plan, D, parts, { seed, hist: a.history && a.history !== true ? a.history : null, json: !!a.json, recorded: !forced, has });
  if (forced) return;
  const at = new Date().toISOString();
  const partList = Object.entries(parts).map(([slot, id]) => ({ id, slot, at, seed }));
  const poolList = D.placed.map(id => ({ id, at, seed }));
  if (a.history && a.history !== true) {
    hist.plans = [...(Array.isArray(hist.plans) ? hist.plans : []), { id: plan.id, page, at, seed, parts, length: D.seq.length - 1, pool: D.placed }].slice(-100);
    hist.planParts = [...(Array.isArray(hist.planParts) ? hist.planParts : []), ...partList].slice(-200);
    hist.planPool = [...(Array.isArray(hist.planPool) ? hist.planPool : []), ...poolList].slice(-200);
    writeJsonAtomic(a.history, hist);
  }
  G.add('plans', [{ id: plan.id, at, seed, parts, length: D.seq.length - 1 }], { page });
  if (partList.length) G.add('planParts', partList, { page });
  if (poolList.length) G.add('planPool', poolList, { page });
  G.commit();
}
const keysOf = page => [...new Set([...POOL[page].map(p => p.key), ...PLANS[page].flatMap(p => p.sections.filter(s => s.opt).map(s => s.key))])].filter(Boolean);

/* ------------------------------------------------------------------ list, show, pool, md */
function recipeMd(s) {
  return s.recipe === 'held' ? `held, else \`${s.else}\`` : s.recipe === 'statement' ? 'statement' : s.recipe === 'hero' ? 'hero'
    : s.deal ? s.deal.map(x => `\`${x}\``).join(' or ') + ' (dealt)' : `\`${s.recipe}\`${NEW_RECIPES.includes(s.recipe) ? ' (new)' : ''}`;
}
function md(plan) {
  const out = [`**${plan.id}** · ${plan.name}. For ${plan.suits}. Needs ${plan.needs}. Hero: ${plan.hero}.`, ''];
  out.push('| # | id | recipe | the idea and its picture | height | slot |', '|---|---|---|---|---|---|');
  plan.sections.forEach((s, i) => {
    const id = (s.opt ? `[${s.id}]` : s.id) + (s.centre ? ' (centre)' : '');
    const what = s.what + '.' + (s.opt ? ` Only ${s.opt}.` : '') + (s.calm ? ' No picture.' : '');
    out.push(`| ${i} | ${id} | ${recipeMd(s)} | ${what.replace(/\|/g, '/')} | ${s.screens} | ${s.slot || ''} |`);
  });
  const covers = (plan.covers || []).length ? ` Not dealt from the pool: ${plan.covers.join(', ')} (answered inside the plan).` : '';
  out.push('', `Pricing: ${plan.pricing}. Questions: ${plan.questions}. Proof: ${plan.proof}. Moments: \`--fits ${plan.moments.fits}\`${plan.moments.photo === true ? ' `--photo`' : ''}, the count and \`--first\` as the dealt page prints them.${covers}`, '');
  return out.join('\n');
}
function poolMd(page) {
  const out = [`| id | key (--has) | recipe | what it shows | height | zone | when |`, '|---|---|---|---|---|---|---|'];
  for (const p of POOL[page]) out.push(`| ${p.id} | ${p.key} | ${recipeMd(p)} | ${p.what.replace(/\|/g, '/')}${p.calm ? '. No picture' : ''}${p.slot ? `. Slot ${p.slot}` : ''} | ${p.screens} | ${p.zone.join(', ')} | ${p.needs} |`);
  return out.join('\n');
}
function cmdList(a) {
  const raw = String(a.page && a.page !== true ? a.page : '').toLowerCase();
  const page = raw ? KINDS[raw] : null;
  if (raw && !page) die(`no plans for "${raw}": software and editorial deal plans`, 2);
  for (const [k, ps] of Object.entries(PLANS)) {
    if (page && k !== page) continue;
    for (const p of ps) {
      if (a.md) { console.log(md({ ...p, page: k })); continue; }
      console.log(`${k.padEnd(10)} ${p.id.padEnd(16)} ${p.name}: ${p.sections.map(s => (s.opt ? `[${s.id}]` : s.id) + (isBand(s) ? '(band)' : '')).join(' > ')} + pool to ${LENGTH[k].join('-')}`);
    }
  }
}
function cmdShow(a) {
  const p = findPlan(a._[1] || '');
  if (!p) die(`show <id>: ${allPlans().map(x => x.id).join(', ')}`, 2);
  if (a.md) { console.log(md(p)); return; }
  printPlan(p, { seq: p.sections, target: p.sections.length - 1, reserve: [] }, {}, { seed: null, hist: null, json: !!a.json, recorded: false, has: null });
}
function cmdPool(a) {
  const raw = String(a.page && a.page !== true ? a.page : '').toLowerCase();
  const page = raw ? KINDS[raw] : null;
  if (raw && !page) die(`no pool for "${raw}": software and editorial deal plans`, 2);
  for (const k of Object.keys(POOL)) {
    if (page && k !== page) continue;
    if (a.md) { console.log(poolMd(k) + '\n'); continue; }
    console.log(`${k}: ${LENGTH[k][0]}-${LENGTH[k][1]} sections after the hero; --has keys: ${keysOf(k).join(', ')}`);
    for (const p of POOL[k]) console.log(`  ${p.id.padEnd(14)} ${String(p.key).padEnd(13)} ${recipeOf(p).padEnd(18)} ${p.screens.padEnd(5)} ${p.zone.join('/').padEnd(13)} ${p.needs}`);
  }
}

/* ------------------------------------------------------------------ check: the plans against the references */
function cmdCheck() {
  const lib = fs.readFileSync(path.join(ROOT, 'references', 'sections-library.md'), 'utf8');
  const sec = fs.readFileSync(path.join(ROOT, 'references', 'sections.md'), 'utf8');
  const recipes = new Set([...lib.matchAll(/^## ([a-z0-9-]+)\s*$/gm)].map(m => m[1]));
  const problems = [], fresh = new Set();
  const recipeOk = (where, r) => {
    if (SPECIAL.includes(r)) return;
    if (NEW_RECIPES.includes(r)) { fresh.add(r); return; }
    if (!recipes.has(r)) problems.push(`${where}: recipe ${r} is not in sections-library.md`);
  };
  for (const p of allPlans()) {
    if (!sec.includes(`**${p.id}**`)) problems.push(`${p.page}/${p.id}: not written up in references/sections.md`);
    const ids = p.sections.map(s => s.id);
    ids.filter((x, i) => ids.indexOf(x) !== i).forEach(x => problems.push(`${p.id}: section id ${x} twice`));
    for (const s of p.sections) {
      for (const r of [s.recipe, s.else, ...(s.deal || [])].filter(Boolean)) recipeOk(`${p.id}/${s.id}`, r);
      if (!HEIGHTS.includes(s.screens)) problems.push(`${p.id}/${s.id}: height ${s.screens} is none of ${HEIGHTS.join(', ')}`);
      if (s.recipe === 'statement' && !isBand(s)) problems.push(`${p.id}/${s.id}: a statement is a band (the paragraph sized to its section)`);
      if (['statement', 'belief', 'promise', 'pull'].includes(s.id)) problems.push(`${p.id}/${s.id}: a statement section takes an id of its own job (v4.3), never statement, belief, promise or pull`);
    }
    // two sections without a picture never side by side (sections.md section 1); an optional one may drop out
    const must = p.sections.filter(s => !s.opt);
    must.forEach((s, i) => { if (s.calm && must[i + 1] && must[i + 1].calm && must[i + 1].mergeInto !== s.id) problems.push(`${p.id}: ${s.id} and ${must[i + 1].id} are both without a picture and side by side (with the optional sections out)`); });
    p.sections.forEach((s, i) => { if (s.calm && p.sections[i + 1] && p.sections[i + 1].calm) problems.push(`${p.id}: ${s.id} and ${p.sections[i + 1].id} are both without a picture and side by side`); });
    if (!p.sections[1] || !p.sections[1].slot) problems.push(`${p.id}: the section after the hero offers no moment slot (one moment starts in the first two screens)`);
    if (p.sections.filter(s => s.slot).length < 2) problems.push(`${p.id}: under two moment slots (house rule 5: two or three moments)`);
    if (p.page === 'software') {
      const af = p.sections.findIndex(s => s.recipe === 'app-frame');
      if (af > 2 && !p.sections[0].centre) problems.push(`${p.id}: the app-frame is section ${af + 1}; sections.md wants it in the hero or as section 2 or 3`);
    }
  }
  for (const [page, pool] of Object.entries(POOL)) {
    const ids = pool.map(p => p.id);
    ids.filter((x, i) => ids.indexOf(x) !== i).forEach(x => problems.push(`pool ${page}: id ${x} twice`));
    for (const p of pool) {
      for (const r of [p.recipe, ...(p.deal || [])].filter(Boolean)) recipeOk(`pool ${page}/${p.id}`, r);
      if (!HEIGHTS.includes(p.screens)) problems.push(`pool ${page}/${p.id}: height ${p.screens} is none of ${HEIGHTS.join(', ')}`);
      if (!p.needs) problems.push(`pool ${page}/${p.id}: no condition`);
    }
  }
  // the statement in at most two software plans and one editorial plan (v4.3)
  for (const [page, most] of [['software', 2], ['editorial', 1]]) {
    const n = PLANS[page].filter(p => p.sections.some(s => s.recipe === 'statement' || s.slot === 'statement')).length;
    if (n > most) problems.push(`${page}: ${n} plans hold a statement; ${most} at most`);
  }
  // 400 deals a plan, with every key, with none and with half: the length, the rules, the moments line
  const sims = { deals: 0, lengths: {}, faults: 0, short: 0 };
  for (const p of allPlans()) {
    const keys = keysOf(p.page);
    for (let n = 0; n < 400; n++) {
      const rand = rng(`check-${p.id}-${n}`);
      const mode = n % 3, has = mode === 0 ? null : mode === 1 ? keys : keys.filter(() => rand() < 0.5);
      const core = coreFor(p, has);
      const D = dealPool({ ...p, sections: core }, p.page, { has, history: [], rand });
      const parts = dealParts(D.seq, { history: [], rand });
      const after = D.seq.length - 1, [lo, hi] = LENGTH[p.page];
      sims.deals++; sims.lengths[after] = (sims.lengths[after] || 0) + 1;
      const f = faults(D.seq, parts);
      if (f.length) { sims.faults++; if (sims.faults <= 5) problems.push(`${p.id} (deal ${n}): ${f.join('; ')}`); }
      if (mode !== 2 && (after < lo || after > hi)) { sims.short++; if (sims.short <= 5) problems.push(`${p.id} (deal ${n}, ${mode ? 'every key' : 'no --has'}): ${after} sections after the hero, outside ${lo}-${hi}`); }
      const m = momentsOf({ ...p }, D.seq);
      if (D.seq.filter(s => s.slot).length < m.count) problems.push(`${p.id} (deal ${n}): ${m.count} moments asked, ${D.seq.filter(s => s.slot).length} slots`);
    }
  }
  console.log(`plans: ${allPlans().length} (${Object.entries(PLANS).map(([k, v]) => `${k} ${v.length}`).join(', ')}); pools: ${Object.entries(POOL).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
  console.log(`new recipes the plans name (not in sections-library.md yet): ${[...fresh].join(', ') || 'none'}`);
  console.log(`deals: ${sims.deals}; sections after the hero: ${Object.entries(sims.lengths).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}: ${v}`).join(', ')}; with a fault ${sims.faults}; off the length with the brief's keys ${sims.short}`);
  problems.forEach(p => console.log('  FAULT ' + p));
  if (!problems.length) console.log('  ok');
  process.exitCode = problems.length ? 1 : 0;
}

/* ------------------------------------------------------------------ main */
const realOf = p => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
if (process.argv[1] && realOf(process.argv[1]) === realOf(fileURLToPath(import.meta.url))) {
  const a = args(process.argv.slice(2));
  const cmd = a._[0];
  if (cmd === 'pick') cmdPick(a);
  else if (cmd === 'list') cmdList(a);
  else if (cmd === 'show') cmdShow(a);
  else if (cmd === 'pool') cmdPool(a);
  else if (cmd === 'check') cmdCheck();
  else if (cmd) die(`unknown command "${cmd}": pick, list, show, pool, check`, 2);
  else console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('\n').slice(1).join('\n'));
}
export { PLANS, POOL, LENGTH };
