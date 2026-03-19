# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Feitjeskeizer is a single-page Dutch-language "Tinder for knowledge" app — users swipe through interesting facts by clicking SKIP/LIKE or using keyboard/drag. No build step, no dependencies, no package manager. The entire app is one self-contained `index.html` (~2600 lines) plus `manifest.json` and `sw.js` for PWA support.

## Development

Open `index.html` directly in a browser or serve locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

No build, lint, or test commands exist.

## Architecture

All code lives in `index.html`, structured in this order:

1. **`<head>`** — meta tags, PWA manifest link, Google Fonts imports
2. **`<style>`** — all CSS (~1000 lines); uses CSS custom properties (`--fact-size`, `--cat-glow`, etc.)
3. **`<body>` HTML** — the full DOM:
   - `.dagelijks-banner` — "Feit van de dag" shown above the card
   - `.card-wrap` / `#card` — the swipeable fact card with `.fact-header` (category badge, fact number), `.fact-text`, `.fact-meta` (year badge, rel-counter, source label), quiz container, Q&A area
   - `.hint` row — undo, hint text, A−/A+, bookmark, export buttons
   - `#done-screen` — shown when all facts are swiped
   - `.api-section` — Anthropic API key input (stored in localStorage)
   - `.log-section` — reaction history
   - `.bookmarks-section` — saved facts with search
4. **`<script>`** (inline, ~1400 lines):
   - `const feiten = [...]` — hardcoded array of ~120 Dutch facts
   - `CATEGORIES` object — maps category name → `{ kleur, bg, border }`
   - `categoriseer(tekst)` — regex-based function mapping a fact string to a category name
   - **State**: `volgorde` (shuffled index array), `huidigIndex`, `log`, `bookmarks`
   - **localStorage keys**: `feitjeskeizer_v1` (session state), `feitjeskeizer_bookmarks`, `feitjeskeizer_fontsize`
   - `init()` / `start()` / `loadFeit()` — core flow
   - `react(reactie)` — handles like/dislike with card fly animation
   - `undo()` — steps back one card
   - `toggleBookmark()` / `updateBookmarks()` / `filterBookmarks()` / `clearBookmarks()`
   - `setFontSize(delta)` — cycles `--fact-size` through `FONT_STEPS = [1.1, 1.3, 1.6, 2.0]rem`
   - `dagelijksFeit()` — picks `feiten[epochDay % feiten.length]` for the daily banner
   - Claude API integration: `vraagAanClaude()` (free-form Q&A), `triggerQuiz()` (generates multiple-choice quiz) — both call `https://api.anthropic.com/v1/messages` directly from the browser using the user's stored API key
   - `exportKaart()` — uses `html2canvas` (loaded from CDN on demand) to screenshot the card
   - `linkify()` — wraps Wikipedia-searchable words in tooltip-enabled `<span>` tags
   - Drag-to-swipe via pointer events; keyboard shortcuts: `←/H` skip, `→/L` like, `Z` undo, `B` bookmark

## Key conventions

- All user-visible text is Dutch.
- Adding new facts: append plain Dutch strings to the `feiten` array. `categoriseer()` auto-assigns a category via regex — update its regexes if needed for new topics.
- Adding a new category: add an entry to `CATEGORIES` and add a matching branch in `categoriseer()`.
- The `categoriseer()` function is called repeatedly (once per fact per card load for the rel-counter) — keep its regexes efficient.
- PWA cache version is hardcoded as `'feitjeskeizer-v1'` in `sw.js` — bump it when deploying breaking changes to force cache refresh.
