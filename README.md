# rasya-taste

Rasya's design skill for Claude Code. It builds SaaS and editorial landing pages that look designed, not generated.

The skill is `skills/rasya-taste-v4/`, a fork of [Taste Skill](https://github.com/Leonxlnx/taste-skill) 2.5.1 (MIT). It keeps Taste Skill's foundations:
- a tested page kit (`starter.html`, `system.css`, hero templates);
- choices dealt by script with a history, so pages don't repeat;
- a browser checker with 100+ checks;
- a finish gate.

On top of that, it adds Rasya's taste:
- Lenis smooth scroll and GSAP on every page, with 2-3 scroll moments;
- a scroll-moment library;
- background layers (patterns, paper, glows, slow animations; colours from the page palette only);
- a button library;
- an `editorial` page kind.

What changed from upstream is listed in `skills/rasya-taste-v4/CHANGES-rasya.md`.

## Install (Claude Code)

```bash
git clone https://github.com/teamespace/rasya-taste-v2.git ~/skills-src/rasya-taste
ln -s ~/skills-src/rasya-taste/skills/rasya-taste-v4 ~/.claude/skills/rasya-taste-v4
```

- The link must be named `rasya-taste-v4`, because the skill's Stop hook looks for that path.
- The kit's pictures (29.5 MB) are not in git. The first build downloads them once from this repo's
  GitHub Release into the skill folder. To do it now: `node ~/skills-src/rasya-taste/skills/rasya-taste-v4/scripts/assets.mjs`.
- To update: `git pull` in `~/skills-src/rasya-taste`. The history was rewritten on 26 Nov 2026 to make the repo
  small: a clone from before that date updates with `git fetch origin && git reset --hard origin/main`.

## Use

In Claude Code, in an empty project folder, run `/rasya-taste-v4` or ask for a landing page. The skill writes its working files to `.taste-skill/` in that folder.

## Needs

- Node 22 or newer, and `tar` (macOS, Linux and Windows 10+ have it).
- Chrome, Edge or Chromium, for the checker.
- Optional: `PEXELS_API_KEY` in your environment, for Pexels photographs. Never put the key in a file.
- Optional: `RASYA_TASTE_HISTORY`, the path of the history file shared across builds. Default: `~/.rasya-taste/history.json`.

## Licence

MIT. See `skills/rasya-taste-v4/LICENSE` (upstream copyright kept) and `NOTICE.md` for credits.
