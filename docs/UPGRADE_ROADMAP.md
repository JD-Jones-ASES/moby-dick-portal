# Upgrade Roadmap — The Immersive Moby-Dick Reader

> **Status:** active plan. Phase 0 (the hover page-jump fix) is **shipped**. Phases 1–5 are the
> reading-first immersive upgrade and are intended to be executed in fresh sessions, one phase per
> session where practical. This is **not a content pass** — the scholarly content pipeline is
> separate (see the older `Agent.md` handoff + `docs/CONTENT_STANDARDS.md`).

## North star

Turn "Moby-Dick: A Student Edition" into the most immersive in-browser way to actually **read**
Moby-Dick — a nautical reading room, not a document. The reader is the hero: a calm, customizable,
antique-sea-chart prose surface where context is revealed **in place** and never yanks the page;
where any word, passage, note, or theme across all 142 chapters is one keystroke away via a fast
**offline** command palette; and where an optional, off-by-default synthesized ocean ambience and a
respectful Big Read narration **link** deepen the mood without ever harming readability.

## Hard constraints (do not violate)

- Pure **static GitHub Pages**. No backend, no server, no runtime third-party APIs, no paid services.
- Base path `/moby-dick-portal/`, `trailingSlash: "always"`; in-app links via `import.meta.env.BASE_URL`
  (`withBase`/`unitHref` in `src/lib/site.js`). Never build the base path in client JS.
- CI is `.github/workflows/deploy.yml` → `npm ci` + `npx astro build` on **Node 22**. (It does **not**
  run `npm run prepare:data`.)
- Works fully **offline** once loaded. **No external CDN** fonts/scripts/assets, no trackers.
- **No hosted/embedded audio.** Audio = (a) in-browser **synthesized** ambience (Web Audio, zero files),
  and/or (b) **external link** to the Moby-Dick Big Read (verified live; per-chapter URLs like
  `https://www.mobydickbigread.com/chapter-1-loomings/`; not-for-profit → link out only, never embed).
- **Accessibility** (keyboard, screen reader, `prefers-reduced-motion`) and **mobile/touch** required.
- **Vanilla-first.** Only deps today: `astro`, `world-atlas`, `topojson-client`. A single small
  **Preact** island (via `@astrojs/preact`) is allowed **only** if search state genuinely demands it —
  loaded once, < 30KB gzipped. No other new deps unless one feature truly requires it.
- Do **not** refactor the load-bearing `src/lib/render.js` (mark placement) or `src/lib/guide-data.js`
  (data loading) core without strong cause — they run across all 142 pages.

## Signature features (the "show-off")

1. **Immersive Reading Room** — focus/distraction-free mode, live typography controls, per-chapter
   progress bar + resume-last-position, keyboard chapter nav. Readability-first; all vanilla + localStorage.
2. **Deep Search command palette (⌘/Ctrl-K)** — instant, offline full-text search over all 142 chapters'
   prose + 114 glossary + 452 public study notes + 55 trails, grouped results, deep-link to match.
3. **Nautical immersion + optional audio** — refined sea-chart design system, chapter-opening flourish,
   off-by-default in-browser ambient soundscape, and the Big Read external narration link.

## Phase plan

### Phase 0 — Kill the hover page-jump  ✅ SHIPPED
Hovering a glossary term or map dot revealed context but also scrolled the matching sidebar item into
view (jarring). Fix: `showGloss(id, fromCard, scroll=false)` in `src/pages/read/[unit].astro` guards the
`scrollIntoView` behind `scroll`; hover/focus highlight + show popover **in place** with no scroll; only
a sidebar-card **click** scrolls the word into the prose. `src/pages/map/index.astro` `highlight()` hover/
focus callers pass `scrollList:false`. ~6 lines, no new deps.

### Phase 1 — The Immersive Reading Room  (vanilla)
- **Focus / distraction-free mode**: hide sidebar/tools/badges, slim the nav; Escape exits; persist `mdp-focus`.
- **Typography controls** (sticky bottom-right `<details>`/popover): font-size, line-height, measure,
  serif/sans, presets → bind to **scoped `--reader-*` CSS vars on `.prose`** (currently hardcoded around
  `portal.css` lines ~216–221); persist JSON `mdp-typo`.
- **Per-chapter reading progress bar** (top of reader) via `IntersectionObserver` on prose paragraphs
  (sample/throttle on long chapters like Cetology).
- **Resume last position**: debounced save of scroll-Y to `mdp-resume-<unit_id>`; restore on load (cap to
  `scrollHeight`); cap entry count / prune oldest to respect quota; degrade in private mode.
- **Keyboard chapter nav**: `j`/`k` or arrows → prev/next (skip when an input/overlay is focused); reuse
  the `prev`/`next` props already passed by `getStaticPaths`.
- **Refactor** the growing inline reader `<script>` into a shared **`src/lib/reader-ui.js`** so it isn't
  duplicated across 142 pages. a11y: aria-labels, focus-visible, `prefers-reduced-motion` on all motion.
- Files: `src/pages/read/[unit].astro`, new `src/lib/reader-ui.js`, `src/styles/portal.css`.
  localStorage: `mdp-focus`, `mdp-typo`, `mdp-resume-*`.

### Phase 2 — Deep Search command palette  (vanilla; Preact only if state demands)
- **Build-time inverted index**: `scripts/ingest/build-search-index.mjs` reusing `loadGuideData()` →
  `data/search/search-index.json` (per record: `id`, `type` ∈ {chapter, glossary, note, trail}, `title`,
  `snippet`, `path`, `terms`). Index 142 prose docs + 114 glossary + 452 public notes + 55 trails.
- **⚠ CRITICAL build wiring:** `deploy.yml` runs only `npx astro build` (NOT `prepare:data`). Pick ONE and
  document it here when chosen: **(a, recommended)** generate the index *during* the Astro build via a
  build-time module/integration so it can never go stale; (b) commit `search-index.json` + an npm script;
  (c) add an explicit prebuild step to `deploy.yml`. If you pick (b)/(c), a fresh session MUST know.
- **Palette overlay** (⌘/Ctrl-K + a header search affordance in `Layout.astro`): debounced live query,
  arrow/Enter/Escape, `role="dialog"` + focus trap, mobile slide-down input. **Lazy-load** the index JSON
  on first open (target < 1MB gzipped); search in-memory; Web Worker only if measured jank.
- **Results** grouped by type with snippet highlight; ranking exact > prefix > substring (title/term boosts).
  **Deep-link to match**: notes → `…/#note-id` / marks → `…/#mark-id`; prose → navigate to chapter then hand
  off to **in-page find** (`src/lib/in-page-find.js`) to scroll+highlight first occurrence.
- Files: `scripts/ingest/build-search-index.mjs`, `src/components/SearchOverlay.astro` (or vanilla module),
  `src/lib/in-page-find.js`, `Layout.astro`. Record gzipped index size + first-open latency in BUILD_LOG.

### Phase 3 — Nautical immersion + optional audio  (vanilla)
- **Design system pass** in `portal.css`: refined `--sea-deep`/`--sea-mid`/`--brass`/`--ivory`/`--parchment`
  tokens, subtle CSS/SVG aged-chart texture (2–3 layers max), depth shadows, heading letter-spacing — for
  **both** Paper and Night themes. Readability + perf first; test on low-end.
- **Chapter-opening flourish**: small inline SVG (compass rose / whale-tail dingbat) above `.reader-title`;
  fade-in honoring `prefers-reduced-motion`. (`src/components/ChapterFlourish.astro`.)
- **Ambient soundscape** (`src/components/AmbientSound.astro`, vanilla): `AudioContext` created on first
  user gesture; ≤ 3 oscillators + filtered noise (waves/wind/hull) through a `GainNode`; **OFF by default**;
  **disabled entirely under `prefers-reduced-motion`**; persist `mdp-sound` (on/off/never); feature-detect
  + degrade. Provide a clear mute/volume control. Mobile CPU/battery sanity check.
- **Big Read link**: verify the per-chapter URL pattern (confirmed `/chapter-<n>-<title-slug>/`), store
  `data/references/big-read-links.json` (chapter number → URL), render a subtle "Listen (external) ↗" link
  in the reader sidebar for chapters with a recording. **Link out only — never embed/host.**

### Phase 4 — Guided exploration: trails, entities, path compare  (static pages)
- **⚠ Scope guardrail (measured):** only **14/55** trails have public student-ready annotations. Build
  trail/entity pages on **chapter-level membership** (`data/indexes/annotations-by-trail.json` /
  `annotations-by-entity.json` `.units[]`, always populated) plus any public notes that exist — show
  "chapters where this appears" even when no public note is ready, so **no page ships empty**. Never gate
  these pages on public-note presence.
- Routes: `/trails/` + `/trails/[id]/` (label, description, tags, chapters in narrative order with excerpt +
  any public note, prev/next "next stop", intersecting trails/entities from `annotation-edges.json`);
  `/explorer/characters/` + `/explorer/places/` (registries filtered by entity `kind`); `/entity/[id]/`
  (reuse trail rendering for per-character/place chronological mentions); `/paths/compare/` (142×3 table of
  `unit.paths`, vanilla column toggles); a reader breadcrumb "this chapter appears in" above study notes.
- Index trails/entities into the Phase-2 search index. No graph/network/force-directed viz.
- ~175 new static HTML files (no GitHub Pages limit). All links via `withBase`/`unitHref`.

### Phase 5 — QA, accessibility, cold-start documentation
- Full keyboard + screen-reader (axe/NVDA) pass across reader, search overlay, map, trails; ARIA live
  regions for dynamic state. `prefers-reduced-motion`, light+dark, offline on every new surface; Lighthouse.
- Grep guard: every link uses `withBase`/`import.meta.env.BASE_URL` (no absolute hrefs).
- **Confirm the GitHub Actions build is green with the search-index wiring** (the Phase-2 caveat).
- Finalize docs: this file, the `Agent.md` handoff, `docs/ARCHITECTURE.md`, `BUILD_LOG.md`.

## localStorage key registry

- Existing: `mdp-theme` (Paper/Night), `mdp-gloss` (glossary-marks density toggle).
- New: `mdp-focus` (focus mode), `mdp-typo` (typography JSON), `mdp-resume-<unit_id>` (scroll position),
  `mdp-sound` (on/off/never). All must degrade gracefully when storage is unavailable (private mode).

## File map (where each phase lives)

- Reader: `src/pages/read/[unit].astro` (P0 ✅, P1, P3 flourish/breadcrumb, P4 breadcrumb), new
  `src/lib/reader-ui.js` (P1), `src/lib/in-page-find.js` (P2).
- Shell/search: `src/components/Layout.astro` (P2 header search, P4 nav), `src/components/SearchOverlay.astro`
  (P2), `scripts/ingest/build-search-index.mjs` (P2), `data/search/search-index.json` (P2 artifact).
- Atmosphere/audio: `src/styles/portal.css` (P1 `--reader-*`, P3 nautical tokens/texture),
  `src/components/ChapterFlourish.astro` + `src/components/AmbientSound.astro` (P3),
  `data/references/big-read-links.json` (P3).
- Exploration: `src/pages/trails/*`, `src/pages/entity/[id].astro`, `src/pages/explorer/*`,
  `src/pages/paths/compare/index.astro` (P4). Reuse `src/lib/site.js`, `src/lib/guide-data.js`.
- Map: `src/pages/map/index.astro` (P0 ✅), `src/lib/voyage-map.js` (unchanged).

## Non-goals

No backend/API/paid services; no hosted or embedded audio (Big Read external link only); no graph/network
visualizations; no heavy JS framework for core/reader/search (one optional Preact island for search only);
no new npm deps beyond the sanctioned Preact island; no external CDN assets/fonts/trackers; no IndexedDB
(localStorage suffices); no user accounts/cloud annotations/auth/DB; no semantic/embedding search (keyword
index only); never gate trail/entity pages on public-note presence.

## Verification per phase

`npm.cmd run build` green (149+ pages); browser-check the new surface in **both** themes with no console
errors; keyboard + `prefers-reduced-motion` paths; base-path correctness; commit/push and confirm the
GitHub Actions deploy succeeds and serves live. Append a dated `BUILD_LOG.md` entry per shipped phase
(include measured search-index size/latency for P2; audio CPU + verified Big Read URL for P3).
