# Upgrade Roadmap — The Immersive Moby-Dick Reader

> **Status:** active plan. Phase 0 (the hover page-jump fix), **Phase 1 (the Immersive Reading Room)**,
> **Phase 2 (the Deep Search ⌘K palette)**, and **Phase 3 (nautical immersion + optional audio)** are
> **shipped**. Phases 4–5 are the rest of the reading-first immersive upgrade and are intended to be
> executed in fresh sessions, one phase per session where practical. This is **not a content pass** —
> the scholarly content pipeline is separate (see the older `Agent.md` handoff + `docs/CONTENT_STANDARDS.md`).

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

### Phase 1 — The Immersive Reading Room  (vanilla)  ✅ SHIPPED
All five features below shipped, plus the refactor. The former inline reader `<script>` is now a
processed `<script>import { initReader } from "../../lib/reader-ui.js"</script>` — Astro bundles it
**once** into a hashed, base-path-correct chunk (~7.5KB / 2.6KB gzipped) shared across all 142 reader
pages (no more per-page duplication). `--reader-*` vars + `data-focus` are applied pre-paint by the
no-flash head script in `Layout.astro` (set on `<html>`; focus CSS scoped to `body.reader-page`, so
non-reader pages are unaffected). Progress is computed from the prose rect each rAF (O(1), smooth on
Cetology) and is `aria-hidden` (decorative). Resume sets `history.scrollRestoration = "manual"` and
restores instantly past `scroll-behavior: smooth`, guarded by `!location.hash`. Verified in-browser
(Paper + Night, clean console) and hardened against an 8-finding adversarial review.
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
  localStorage: `mdp-focus`, `mdp-typo`, `mdp-resume-*` (+ `mdp-resume-index` LRU cap).

### Phase 2 — Deep Search command palette  (vanilla)  ✅ SHIPPED
Vanilla (no Preact needed — 708 records, simple in-memory string matching is instant). The palette
opens on ⌘/Ctrl-K, a header **Search** button, or `/`; lazy-loads the index on first open (**~216 ms**
to first results); scores exact > prefix > substring with a title boost and AND across query tokens;
groups results by type with highlighted snippets; ARIA combobox + listbox with `aria-activedescendant`,
arrow/Enter/Escape, a Tab focus-trap, `inert` background, and a polite live region. Deep-links: chapters
→ `#find=<q>` handed to `src/lib/in-page-find.js` (scrolls + highlights the first occurrence, with a
first-token fallback when a multi-word AND match isn't contiguous; re-runs on `hashchange`); glossary →
`/glossary/#g-<id>` (`:target` flash — anchors added to the glossary page); notes → reader `#note-<id>`.
Hardened against a 9-finding adversarial review. See the 2026-06-08 BUILD_LOG "Phase 2" entry.
- **Build-time inverted index** — implemented as a shared `src/lib/search-index.js` (`buildSearchIndex(data)`)
  consumed by the Astro static endpoint `src/pages/search-index.json.js`. Per record: `id`, `type` ∈
  {chapter, glossary, note}, `title`, `snippet`, `path` (pre-baked absolute via `withBase`/`unitHref`),
  `terms` (space-padded unique-token blob), `tt` (title tokens). Indexes 142 prose docs (full text) +
  114 public glossary + 452 public notes = **708 records, 960 KB raw / 339 KB gzipped**.
- **⚠ CRITICAL build wiring — RESOLVED via option (a):** the index is generated **during** `astro build`
  by the `search-index.json.js` endpoint (GET → `loadGuideData()` → `buildSearchIndex()` → JSON), emitting
  `dist/search-index.json` served at `${BASE_URL}search-index.json`. It derives from the same data the
  pages render, so it **can never go stale**; there is **no committed artifact and no `prepare:data`
  dependency** — plain `npx astro build` (the CI command) produces it. The client lazy-loads it with
  `fetch(import.meta.env.BASE_URL + "search-index.json")` (the only place client JS touches the base).
- **Trails/entities are NOT indexed yet** (scope decision): their pages don't exist until Phase 4, so
  indexing them now would emit dead links. Phase 4 adds `trail`/`entity` records to `buildSearchIndex`
  once `/trails/[id]/` + `/entity/[id]/` exist. The `client must not import site.js` rule holds —
  `search-ui.js` imports only `search-tokenize.js` (no build-only JSON in the browser bundle).
- **Palette overlay** (⌘/Ctrl-K + a header search affordance in `Layout.astro`): debounced live query,
  arrow/Enter/Escape, `role="dialog"` + focus trap, mobile slide-down input. **Lazy-load** the index JSON
  on first open (target < 1MB gzipped); search in-memory; Web Worker only if measured jank.
- **Results** grouped by type with snippet highlight; ranking exact > prefix > substring (title/term boosts).
  **Deep-link to match**: notes → `…/#note-id` / marks → `…/#mark-id`; prose → navigate to chapter then hand
  off to **in-page find** (`src/lib/in-page-find.js`) to scroll+highlight first occurrence.
- Files: `scripts/ingest/build-search-index.mjs`, `src/components/SearchOverlay.astro` (or vanilla module),
  `src/lib/in-page-find.js`, `Layout.astro`. Record gzipped index size + first-open latency in BUILD_LOG.

### Phase 3 — Nautical immersion + optional audio  (vanilla)  ✅ SHIPPED
All four sub-features shipped, hardened against a 7-finding adversarial review. Readability stayed the
priority — the atmosphere is two fixed, very-low-opacity layers (a themed vignette + a faint inline
SVG-noise grain) that don't touch text contrast. The chapter flourish is a decorative compass-star
dingbat (chapters + epilogue only), fading in under reduced-motion guard. The **ambient soundscape**
(`src/lib/ambient-sound.js` + `src/components/AmbientSound.astro`, a dock toggle) is **off by default**,
**removed entirely under `prefers-reduced-motion`** or without Web Audio, **created only on a user
gesture**, and **suspends the AudioContext when off** (≈0 CPU). It synthesizes everything — brown-noise
waves + a low hull sine through a master gain — **zero audio files**. `mdp-sound` persists; the toggle
never claims "on" before audio actually resumes. The **Big Read** link is **external, link-out only**
(`target=_blank rel="noopener noreferrer"`, announces the new tab) using the Big Read's own verified
slugs in `data/references/big-read-links.json` (their titling differs from ours, e.g. `the-carpet-bag`).
See the 2026-06-08 BUILD_LOG "Phase 3" entry.
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
  `mdp-resume-index` (LRU list capping `mdp-resume-<unit_id>` entries at 50), `mdp-sound` (on/off/never).
  All must degrade gracefully when storage is unavailable (private mode).

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
