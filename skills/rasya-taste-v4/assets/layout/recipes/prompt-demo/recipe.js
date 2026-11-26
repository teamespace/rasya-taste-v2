/*
  hero recipe: prompt-demo (refs: Lovable, Perplexity, Fruitful, an Auctor-style prompt box; references/hero-recipes.md).
  The product's own input in the hero, working: a visible label, a field the visitor can type in, three example
  chips, and an answer area. The answers are the client's real examples, written in <template>s in the markup; a
  question is matched to the template whose keywords it shares most, else the first. Nothing is sent anywhere.
  On software and tech, while the visitor has not touched it, the field types the examples in turn and the answer
  streams in under it (a loop with the kit's pause button, holding on hover and focus); everywhere else the first
  example and its answer stand as written.

  <div class="rr rr--prompt-demo" data-recipe="prompt-demo" role="group" aria-label="Try ..">
    <div class="rr-pd__box">
      <label class="rr-pd__label" for="pd-q">Ask Ledgerly</label>
      <textarea id="pd-q" class="rr-pd__q" rows="2">Which invoices are more than 30 days late?</textarea>
      <div class="rr-pd__bar"><span class="rr-pd__chip">..context chip..</span><button class="rr-pd__send" type="button" aria-label="Ask">..</button></div>
    </div>
    <div class="rr-pd__ex"><button type="button" class="rr-pd__eg" data-q="the whole question">a short label</button> x3</div>
    <div class="rr-pd__out" aria-live="polite">..the first answer, as written..</div>
    <template data-rr-answer="late overdue 30 days invoices">..answer markup..</template>   one per example
  </div>
  The still is the markup at rest: the first example asked and answered.
*/
import { allowance, mountAll, setState, pauseButton } from '../_shared/recipe-kit.js';

const words = (s) => String(s || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
function pick(tpls, q) {
  const w = new Set(words(q));
  let best = tpls[0], score = 0;
  for (const t of tpls) { const s = words(t.dataset.rrAnswer).filter((k) => w.has(k)).length; if (s > score) { score = s; best = t; } }
  return best;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mountAll('prompt-demo', (el) => {
  const q = el.querySelector('.rr-pd__q');
  const out = el.querySelector('.rr-pd__out');
  const send = el.querySelector('.rr-pd__send');
  const tpls = [...el.querySelectorAll('template[data-rr-answer]')];
  const egs = [...el.querySelectorAll('.rr-pd__eg')];
  if (!q || !out || !tpls.length) return null;
  const a = allowance();
  out.classList.add('is-on');   // the first answer, as written, shows until the loop or the visitor replaces it
  let touched = false, held = false, run = 0;
  // the answer streams in word by word (once); under reduced motion it appears whole
  async function answer(text, id) {
    const t = pick(tpls, text);
    out.innerHTML = '';
    const frag = t.content.cloneNode(true);
    out.appendChild(frag);
    out.classList.add('is-on');
    if (a.reduced) return;
    const walk = document.createTreeWalker(out, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
    const full = nodes.map((n) => n.nodeValue);
    nodes.forEach((n) => { n.nodeValue = ''; });
    for (let i = 0; i < nodes.length; i++) {
      const parts = full[i].split(/(\s+)/);
      for (const p of parts) { if (id !== run) return; nodes[i].nodeValue += p; if (p.trim()) await sleep(28); }
    }
  }
  const ask = (text) => { touched = true; run++; el.classList.add('is-asked'); answer(text, run); };
  send?.addEventListener('click', () => ask(q.value));
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(q.value); } });
  q.addEventListener('focus', () => { touched = true; run++; });
  egs.forEach((b) => b.addEventListener('click', () => { q.value = b.dataset.q || b.textContent.trim(); ask(q.value); }));
  if (!a.selfMove) { setState(el, 'still', a.why || 'other'); return null; }
  // the self-typing loop: the examples in turn while untouched
  let hover = false;
  el.addEventListener('pointerenter', () => { hover = true; });
  el.addEventListener('pointerleave', () => { hover = false; });
  const examples = egs.length ? egs.map((b) => b.dataset.q || b.textContent.trim()) : [q.value];
  const cycle = async () => {
    let i = 0;
    await sleep(2600);
    while (!touched) {
      while ((held || hover || document.hidden) && !touched) await sleep(300);
      if (touched) break;
      const id = ++run, text = examples[i % examples.length];
      q.value = '';
      out.classList.remove('is-on');
      for (const ch of text) { if (id !== run || touched) return; q.value += ch; await sleep(34); }
      await sleep(380);
      if (id !== run || touched) return;
      await answer(text, id);
      await sleep(3600);
      i++;
    }
  };
  setState(el, 'live');
  const ctl = { pause() { held = true; }, resume() { held = false; }, destroy() { touched = true; run++; } };
  pauseButton(el, ctl, 'the examples');
  cycle();
  return ctl;
});
