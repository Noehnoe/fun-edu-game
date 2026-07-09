# Prompt for Claude design — Brainy Bunch mobile interface

Copy everything below the line into Claude design.

---

Design a **mobile-first interface** for **Brainy Bunch**, an existing browser-based mini-game arcade. The desktop version works well; on phones the layout breaks badly. I need a full mobile redesign (portrait-first, 360–430px wide) that I can implement in the existing codebase.

## What the app is

A cartoony, offline-first brain-training arcade for kids/families: **23 mini-games** across five categories (Logic, Memory, Math, Language, Reflex), with coins, XP, level-ups, unlockable games, a 6-theme cosmetic shop, 14 achievement badges, and a Rebirth (prestige) system. No accounts, no network — progress saves to localStorage.

## Tech constraints (the design must fit these)

- **Vanilla HTML/CSS/JS, no framework, no build step.** One `index.html`, one `css/style.css`, and one JS file per game.
- Each game renders itself into a single `#stage` container div on the play screen. The shell (header, HUD, modals) is shared.
- Theming works via `body[data-theme]` switching **CSS custom properties** (pastel palette variables). The mobile design must stay variable-driven so all 6 themes keep working.
- Several games draw to `<canvas>` (Snake, Maze, Star Catcher) — the design should assume canvases **resize to fit their container** rather than fixed pixel sizes.
- Games already support touch input (swipe for Snake/Maze/2048-merge, tap/drag elsewhere, on-screen keypad for digit recall). The breakage is **layout and sizing**, not input.

## Current desktop layout

- **Top bar:** logo button, coin chip 🪙, level chip with badge + XP progress bar + XP text, and three round icon buttons (sound, settings, reset).
- **Home screen:** a hero panel (headline, completion ring, 4 stat counters, occasional Rebirth button) → category filter tabs (All / Logic / Memory / Math / Language / Reflex) → responsive game-card grid (emoji icon, name, one-line description, best score, lock state with coin price) → Theme Shop grid → Badge grid.
- **Play screen:** a top row (back-to-menu button, game emoji + name + description, per-game HUD chips for score/timer/lives) above the `#stage` game area.
- **Overlays:** result modal (emoji, title, coin/XP rewards, "Menu" / "Play again"), settings modal (music + SFX volume sliders), toast notifications, plus full-screen confetti/particle effects.

## What breaks on mobile today (fix all of these)

1. **Fixed-size game boards overflow the screen:** Snake canvas is 374×374px, Star Catcher 360×400px, Memory Match forces a 4-column grid of 76px cards, Simon board 300px, 2048 board 4×64px cells — inside a stage that also has 24px padding. Phones are 360–430px wide.
2. **Top bar wraps into a cramped multi-row mess** — too many chips and buttons for one row at phone width.
3. **Only one small media query exists (≤640px)**; the rest of the CSS is desktop-first.
4. **Hover-dependent affordances** (cards lift on hover, tab hover states) do nothing on touch.
5. Some **tap targets are under 44px** (filter tabs, small chips).
6. Long single-page home screen (hero + 23 games + shop + badges) is a lot of scrolling with no way to jump between sections.

## Design language to keep

Cartoony and bouncy: display font **Baloo 2**, body font **Fredoka**; soft pastel backgrounds with white "paper" cards; **chunky hard drop-shadows** (offset solid shadows, no blur) and thick rounded corners; emoji as icons everywhere; playful micro-interactions (buttons press down 3px on tap). Kid-friendly, high contrast, generous whitespace.

## What to design

Portrait phone (360–430px), with notes on how it relaxes to tablet/desktop:

1. **Mobile home screen** — rethink the structure: compact sticky header (what stays visible vs. moves into a menu?), how hero/stats condense, category filtering as horizontally scrollable chips or similar, a game grid that fits 2 columns comfortably, and how Shop and Badges are reached (tabs? bottom nav? collapsible sections?).
2. **Mobile play screen** — a compact game header (back button, game name, HUD chips) that leaves maximum room for the stage; the stage should be near-full-bleed with minimal padding so game boards get the full screen width. Show one canvas game (Snake) and one grid game (Memory Match, 4×4) fitted to a 390px-wide screen.
3. **Result + settings modals** — as bottom sheets or full-width dialogs with big thumb-friendly buttons.
4. **Touch rules baked in** — all tap targets ≥44px, pressed/active states instead of hover, respect safe-area insets (notch / home indicator).

Deliver screen mockups for each of the above plus a short spec I can hand to a developer: layout structure, spacing scale, component sizes, and breakpoint behavior (phone → tablet → desktop).
