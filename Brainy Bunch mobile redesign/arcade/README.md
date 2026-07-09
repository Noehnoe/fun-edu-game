# 🧠 Brainy Bunch — Mini-Game Arcade

A cartoony, offline-first brain-training arcade built from `Idea.md`. **23 hand-made
mini-games**, coin & XP progression, level-ups, unlockable games, a theme shop, a
rebirth (prestige) system, achievement badges, particle VFX and synthesized sound —
all in vanilla HTML/CSS/JS, no build step.

## ▶️ Play

Just open **`index.html`** in any modern browser (Chrome, Edge, Firefox).
Progress saves automatically to your browser (localStorage).

## 🎮 The 23 games

| Game | Category | Skill |
|------|----------|-------|
| 🧪 Color Vials | Logic | Water-sort sorting |
| ➗ Math Sprint | Math | Timed arithmetic |
| 🃏 Memory Match | Memory | Pair matching |
| 🎵 Echo Pads | Memory | Simon-style sequences |
| 🔤 Word Scramble | Language | Vocabulary / unscrambling |
| 🔢 Number Merge | Logic | 2048-style merging |
| 🔨 Mole Mash | Reflex | Whack-a-mole |
| 💡 Lights Out | Logic | Toggle-grid puzzle |
| 🐍 Snake Snack | Reflex | Classic snake |
| 🧩 Slide Puzzle | Logic | 15-puzzle |
| ⚡ Reaction Dash | Reflex | Reaction timing |
| 🌍 Word Traveler | Language | Spanish/French/German quiz |
| ✨ Flash Memory | Memory | Pattern recall |
| 🕵️ Odd One Out | Logic | Visual discrimination |
| 🔍 Number Hunt | Math | Ordered visual search (1→20) |
| 🔵 Dot Count | Math | Fast counting / estimation |
| 🎨 Color Clash | Reflex | Stroop test (word vs. ink) |
| 🎴 Higher or Lower | Math | Probability & streaks |
| ✏️ Missing Letter | Language | Spelling with emoji clues |
| 🤔 Emoji Riddle | Language | Compound-word riddles |
| 🧮 Number Recall | Memory | Digit span |
| 🐭 Maze Dash | Logic | Procedural maze solving |
| 🧺 Star Catcher | Reflex | Catch & dodge arcade |

## 🛍️ Theme Shop & 🌀 Rebirth

- **Theme Shop** — spend coins on six cartoony color themes (Sky Pop, Ocean, Sunset,
  Forest, Candy, Space). Purely cosmetic; spending never re-locks games (unlocks are
  based on lifetime earnings).
- **Rebirth** — after trying every game, you can Rebirth: coins, XP and unlocks reset,
  but you keep badges/themes/settings and all future rewards get a permanent +25% boost
  per rebirth.

## ✨ Features (from the concept)

- **Progression** — earn coins, gain XP, level up; new games unlock as you earn coins,
  with a toast + fanfare the moment each one opens up.
- **Badges** — 14 achievements (Explorer, Mastermind, Lightning, Polyglot, Style Icon, Reborn…).
- **Learning** — math practice plus three real languages, taught through play.
- **Procedural variation** — every round is freshly generated.
- **Speed/pressure modes** — timers and reaction challenges where they fit.
- **Cartoony graphics + VFX** — animated background, confetti, fireworks, star showers,
  particle bursts, tap ripples, screen flashes, screen shake, floating score pops, bouncy UI.
- **Audio** — synthesized WebAudio sound effects, looping menu music, and a ⚙️ settings
  menu with separate music/SFX volume sliders (saved with your progress).
- **Offline-first** — runs entirely from the local file; no network needed.
- **Respectful design** — no nags, no timers pushing you to return, no pay-to-win.

## 🗂️ Structure

```
index.html
css/style.css          cartoony theme + per-game styles
js/fx.js               particle engine, confetti, WebAudio sound, animated background
js/engine.js           state, save, progression, levels, badges, navigation, game API
js/main.js             boot
js/games/*.js          one file per mini-game (self-registers with the engine)
```

Adding a new game is just a new file in `js/games/` that calls `Game.register({...})`
and a `<script>` tag in `index.html`.
