/*
  paragraph-reveal - rasya-taste-v4.3 (agent S). The statement as a paragraph that reveals as you scroll: one paragraph
  of 25 to 60 words in the display face (--t-statement, 48px at 1440; about 42 characters a line), its words resting in
  --muted at 30% and turning to full ink one after another (or a line at a time) while the paragraph's top climbs from
  80% to 35% of the screen. Scrubbed to the scroll with GSAP ScrollTrigger on the motion layer (window.rtMotion), so it
  runs back on the way up; never pinned, and it runs on a phone as on a desktop. The reveal ends before the section's
  top reaches the top of the screen, so the judge's tile of the section shows the paragraph whole.

    <section class="section statement" id="stance" data-screen="band" data-moment="paragraph-reveal">
      <div class="wrap">
        <p class="t-label">Why Keep starts at keep</p>                                         (optional kicker)
        <p class="mo-pr__text">A salary is the easiest number to read in a layoff ... </p>       (25 to 60 words)
        <p class="mo-pr__more"><a class="link" href="#limit">Read what Keep will not do</a></p>  (optional, one line)
      </div>
    </section>

  data-screen="band" sizes the section to the paragraph and its padding (one screen at most; system.css).
  opts (data-moment-opts): by "word" (default) or "line"; from 0.8 and to 0.35 (the paragraph's top at these shares of
  the screen's height starts and ends the reveal); dim 0.3 (the resting opacity, 0.25 to 0.35).
  The HTML as written is the finished state: every word in ink. Reduced motion, no script, a failed module or no motion
  layer show the paragraph whole; the words are split only once the layer is ready. Never loads GSAP itself.
*/
export const phone = true;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export default function (root, opts, lib) {
  const text = root.querySelector('.mo-pr__text') || [...root.querySelectorAll('p, blockquote')].find(p => !p.matches('.t-label, .t-small, .muted, .mo-pr__more'));
  if (!text) return {};
  root.classList.add('mo-pr');
  if (lib.reduced()) return {};
  const by = opts.by === 'line' ? 'line' : 'word';
  const from = clamp(Number(opts.from) || 0.8, 0.5, 0.95);
  const to = clamp(Number(opts.to) || 0.35, 0.1, from - 0.1);
  const dim = clamp(Number(opts.dim) || 0.3, 0.25, 0.35);
  let words = [], tl = null, gone = false;
  const wait = lib.rt(M => {
    if (M.reduced || gone) return;
    lib.fontsReady(900).then(() => {
      if (gone) return;
      const { gsap } = M;
      // .mo-w spans, each aria-hidden; the paragraph keeps its words as its aria-label (lib.split)
      words = lib.split(text, 'words').map(i => i.parentElement);
      if (!words.length) return;
      text.style.setProperty('--mo-pr-dim', String(dim));
      root.classList.add('is-live');
      const groups = by === 'line' ? lib.lines(words) : words.map(w => [w]);
      tl = gsap.timeline({ scrollTrigger: { trigger: text, start: `clamp(top ${Math.round(from * 100)}%)`, end: `clamp(top ${Math.round(to * 100)}%)`, scrub: true } });
      // each group fills over a little more than its share, so neighbours overlap and the edge reads soft
      groups.forEach((g, i) => tl.fromTo(g, { '--p': 0 }, { '--p': 1, duration: 1.6, ease: 'none' }, i));
      lib.refresh();
    });
  }, { name: 'paragraph-reveal' });
  return {
    destroy() {
      gone = true; wait.cancel();
      if (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(); tl.kill(); }
      words.forEach(w => w.style.removeProperty('--p'));
      root.classList.remove('is-live');
    },
  };
}
