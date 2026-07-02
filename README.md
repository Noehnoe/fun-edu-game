# 🧠 Brainy Bunch — Mini-Game Arcade

A cartoony, offline-first brain-training arcade built from `Idea.md`. **13 hand-made
mini-games**, coin & XP progression, level-ups, unlockable games, achievement badges,
particle VFX and synthesized sound — all in vanilla HTML/CSS/JS, no build step, no assets.

## ▶️ Play

Just open **`index.html`** in any modern browser (Chrome, Edge, Firefox).
Progress saves automatically to your browser (localStorage).

## 🎮 The 13 games

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

## ✨ Features (from the concept)

- **Progression** — earn coins, gain XP, level up; new games unlock as you earn coins.
- **Badges** — 12 achievements (Explorer, Mastermind, Lightning, Polyglot, Completionist…).
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
