# Moby-Dick Student Guide - Agent Guide

You are working on a maximally abridgeable student guide to Herman Melville's *Moby-Dick; or, The Whale*. The defining feature is reversible abridgment: students can read a short narrative path, a curated classroom path, a thematic trail, or the full novel from the same source of truth.

## Audience

- **Primary**: high-school students and early-college readers meeting *Moby-Dick* in a class.
- **Secondary**: teachers building syllabi and adult readers who want a guided first pass.
- **Assume no priors**: no whaling history, nautical vocabulary, biblical literacy, classical background, or 19th-century publishing context.
- **Do not condescend.** The voice is plain, exact, and respectful. Explain the hidden context without flattening the book.

## Project Thesis

This project should not produce one permanent abridgment. It should produce a data model that lets the reader choose how much of Melville to carry at once.

The full Standard Ebooks text remains intact. Abridgment is expressed as metadata, reading paths, summaries, and optional context layers. Cutting is a display decision, not a source-text mutation.

## Repo Map

| Path | Read this when... |
|---|---|
| **[docs/BUILDOUT_PLAN.md](docs/BUILDOUT_PLAN.md)** | You are continuing the initial buildout or deciding what to build next. |
| **[docs/ABRIDGMENT_MODEL.md](docs/ABRIDGMENT_MODEL.md)** | You are classifying chapters, designing reading paths, or changing inclusion rules. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | You need the intended project structure and data flow. |
| [docs/CONTENT_STANDARDS.md](docs/CONTENT_STANDARDS.md) | You are writing summaries, glosses, annotations, or teacher-facing notes. |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | You are creating or validating chapter metadata, glossary entries, references, or reading paths. |
| [docs/ANNOTATION_ARCHITECTURE.md](docs/ANNOTATION_ARCHITECTURE.md) | You are expanding annotations, adding selectors/tags, planning generated indexes, or deciding how dense annotation should surface in the reader. |
| [docs/ACADEMIC_RECOVERY_PLAN.md](docs/ACADEMIC_RECOVERY_PLAN.md) | You are deciding how to recover the project after the over-generated annotation phase. |
| [docs/SCALE_UP_READINESS.md](docs/SCALE_UP_READINESS.md) | You are planning the next major content expansion, launch-page direction, map/geography visualization, color modes, or React/Astro boundaries. |
| [docs/PIPELINE.md](docs/PIPELINE.md) | You are building ingestion, conversion, validation, or generation scripts. |
| [docs/UX_PRINCIPLES.md](docs/UX_PRINCIPLES.md) | You are designing the reader interface or future site. |
| [docs/LOCAL_PREVIEW_AND_BROWSER.md](docs/LOCAL_PREVIEW_AND_BROWSER.md) | You need to launch the local site, debug preview servers, or control Chrome for click-through QA. |
| [docs/LICENSING.md](docs/LICENSING.md) | You are adding sources, images, quotations, or release notes. |
| [docs/BUILD_LOG.md](docs/BUILD_LOG.md) | You want the session history and major decisions. |
| [schemas/](schemas/) | JSON Schemas for the content data contracts. |
| [data/](data/) | Future source of truth for generated and hand-authored project data. |
| [scripts/](scripts/) | Ingestion, conversion, validation, audit, and content-authoring scripts. |
| [scripts/content/_authored-notes-helper.mjs](scripts/content/_authored-notes-helper.mjs) + [run-authored-batch.mjs](scripts/content/run-authored-batch.mjs) | The Shakespeare-grade note authoring pipeline (pre-validating + idempotent). Reuse this to scale public Study notes. |
| [data/authored/](data/authored/) | Vetted authored-note batches (`batch-*.json`) and the `needs-source-backlog.json` of references awaiting a verified source. |
| [vendor/standard-ebooks/](vendor/standard-ebooks/) | Vendored Standard Ebooks source. Treat as read-only. |
| [src/](src/) | Astro reader app. This is the product surface. |
| [astro.config.mjs](astro.config.mjs) | Astro configuration. |

## Hard Rules

1. **Do not edit vendored source files.** Files under `vendor/standard-ebooks/` preserve upstream text and licensing.
2. **No audio in v1.** The user explicitly rejected Gemini's audio recommendation.
3. **Abridgment must be reversible.** Never delete full-text content to make a shorter path.
4. **Every interpretive claim needs a source trail.** If a claim is not sourced yet, mark it as provisional or route it to review.
5. **Student-facing prose must be useful before it is clever.** Short, vivid explanations beat decorative commentary.
6. **Schemas are contracts.** If data and schema disagree, fix the wrong side explicitly.
7. **Keep design literary but usable.** This is a study tool first, not a marketing page.
8. **This is an Astro project.** The final product must be built as a modern Astro student edition, not as a plain generated HTML prototype.
9. **Do not optimize for annotation count.** The Shakespeare Portal is the quality benchmark: useful, categorized, source-cited, adversarially checked annotation across the whole work. Moby-Dick still aims for whole-book annotation, but weak draft density is worse than sparse scholarly coverage.
10. **Draft apparatus is not public annotation.** Source-index, taxonomy-index, review, teacher, and generated floor notes may exist as internal scaffolding, but they must not appear in reader-facing Study unless promoted to `student-ready`.
11. **No safetyist default voice.** Difficult material should be handled directly, historically, and clinically. Avoid trigger-warning idiom, moralizing, or worldview framing inside ordinary annotations.

## Initial Reading Paths

- **Narrative Core**: the shortest coherent plot route, expected to include the opening shore chapters, Ahab's declared quest, key voyage escalation, and the final chase.
- **Classroom Standard**: a balanced path for teachers, preserving the plot plus essential character, symbolic, formal, and historical chapters.
- **Thematic Trails**: optional trails for whaling labor, cetology, gams, prophecy, race and empire, biblical/classical allusion, theater/genre experiments, and Ahab/Starbuck conflict.
- **Full Text**: the complete source, with optional glosses and annotations.

## Current Status

The workspace started with Gemini's preliminary planning document and the local Standard Ebooks archive at `herman-melville_moby-dick-master.zip`. The text was not re-downloaded; the archive was unpacked into `vendor/standard-ebooks/`, and generated data is built from that vendored source.

Completed:

- Phase 0 source contracts: 142 reading units, 135 numbered chapters, prefatory matter, epilogue, and source records.
- Phase 1 seed metadata: provisional chapter functions and path assignments.
- Astro foundation: `src/pages/index.astro` renders a working reader from project data.
- Reference apparatus seed: validated glossary, reference cards, annotations, and map waypoints feed the Astro reader.
- Reader v1 prototype: path/source/depth controls, story-map navigation, trail lenses, recoverable skipped chapters, glossary/reference/study panels, voyage-stage display, and responsive desktop/mobile styling.
- Narrative Core coverage: every required Narrative Core chapter now has a student-facing summary seed.
- Chapter summary coverage: every numbered chapter and the epilogue now have student-facing summary seeds. Total summary seeds: 136.
- Reader UX polish: Classroom Standard starts on Chapter 1, optional/frontmatter handling is less noisy, search can be cleared, glossary terms show a word-level popover, and the voyage-stage map dots navigate between stages.
- Study Notes now link bidirectionally with highlighted main-text anchors. Validation requires annotation anchors to appear in displayed text.
- Guide and Study layers are now separated more cleanly: Guide uses glossary marks without Study note clutter, while Study reveals single passage-level annotation links.
- `docs/ANNOTATION_ARCHITECTURE.md` captures the next-step model for over-annotation: selectors, display layers, tags, relationships, generated indexes, and density validation.
- Annotation records now carry `TextQuoteSelector`-style selectors, generated by `scripts/ingest/build-annotation-selectors.mjs` and validated against displayed text. The reader uses selectors to mark the intended Study passage.
- Annotation records now carry scale-up metadata: display rules, tags, relationships, evidence, provenance, and review queues.
- `data/annotations/moby-dick.annotation-layers.json` defines Read/Guide/Study/Explore/Teacher layer policy.
- `data/taxonomy/moby-dick.taxonomy.json` defines seed trail/entity IDs for future semantic relationship targets.
- `data/geography/moby-dick.places.json` defines seed place records with display-anchor coordinate status, taxonomy links, chapter targets, and citation status.
- `scripts/ingest/build-annotation-indexes.mjs` generates per-unit, tag, density, and edge indexes under `data/indexes/`; the reader consumes the per-unit annotation packs.
- Validation now checks annotation metadata, selector positions, relationship targets, taxonomy targets, geography records, generated index freshness, review queues, evidence records, and density warnings.
- Reader UX polish: the search clear control is centered, the brand title links to `/`, and chapter navigation is duplicated at the bottom of the reading pane.
- First major writing blowout complete: all 115 Classroom Standard units and every rendered Full Text unit now have at least one source-anchored Study annotation. Annotation records: 141 across 141 covered units; the only uncovered unit is the blank half-title page. Glossary entries: 107, reference cards: 16, source records: 10. Annotation density indexes report zero warnings.
- `scripts/content/first-major-content-blowout.mjs` is a reusable append-only expansion script for the first batch of source records, glossary entries, reference cards, and Study notes.
- Later scale-up passes expanded the apparatus dramatically: 142 reading units, 142 summary seeds, 2,234 annotation records, 491 glossary entries, 418 reference cards, 50 source records, 141 teacher packets, 142 search documents, 74 geography places, 55 taxonomy trails, 117 taxonomy entities, and 41 map waypoints.
- The original clipped Study-anchor bug was fixed at the selector level. Whole-book browser validation has checked all 142 units with zero clipped-boundary or suspicious-fragment Study anchors.
- The "Whole Book"/"All" sidebar bug was fixed. Browser validation shows all three paths render all 142 units when Whole Book is selected.
- The project hit a quality crisis after expansion. Many annotations are draft scaffolds, source-index notes, generic floor prose, or review hooks rather than publishable scholarship. Treat the current annotation mass as raw material, not product copy.
- `docs/ACADEMIC_RECOVERY_PLAN.md` records the strategic reset: freeze content expansion, purge or hide weak annotations, pilot scholarly review on representative chapters, and scale only after the notes meet the Shakespeare Portal standard.
- The reader now shows public Study cards only for annotations with `display.surfaces` including `reader`, `status.content_status: "student-ready"`, and verified citations. Public glossary and reference cards are gated the same way. Current audit truth: 2,234 total annotations, 285 public Study annotations, 114 public glossary entries, 80 public reference cards, 24 public source records, 24 public sources ready, 0 public sources needing bibliographic review, 0 blocked public sources, 0 teacher packets in the public payload, 0 public draft leaks, 0 public glossary unit gaps, 0 public reference unit gaps, 0 ordinary public annotation promotion candidates, and 0 overlapping public Study anchors.

## Session Handoff — 2026-06-08 (Phase 2 shipped: the portal is LIVE)

**The site is deployed and public:** https://jd-jones-ases.github.io/moby-dick-portal/
(repo https://github.com/JD-Jones-ASES/moby-dick-portal, account `JD-Jones-ASES`). It is a
multi-page Astro portal — landing dashboard, per-chapter reader at `/read/[unit]/` with inline
source-cited Study marks + a notes sidebar, filterable chapters index, paths page, glossary,
sources bibliography, voyage map, about — that **rebuilds and redeploys on every push to `main`**
via `.github/workflows/deploy.yml` (Node 22 required; Pages source = GitHub Actions). Base path is
`/moby-dick-portal`; in-app links use `import.meta.env.BASE_URL`. The old single-page reader and its
`global.css`/`scripts/dev/cdp-*` smoke selectors are retired — the CDP smoke scripts target the
removed reader and are not in CI. New page components live in `src/pages/**`, `src/components/`,
`src/lib/{site,render}.js`, `src/styles/portal.css`. See the 2026-06-08 BUILD_LOG entries.

The whole book is annotated to the **Shakespeare-Portal bar** (452 public Study notes, 193 teaching
outside knowledge, 41 verified sources, 0 rule failures). Before content work, read
`docs/CONTENT_STANDARDS.md` (the "Shakespeare-Grade External-Source Rule"). Next content lever: the
source-verification backlog in `data/authored/needs-source-backlog.json` and the tone-and-source
queue. Direction remains **content first, strict quality-gated**.

What is now true:

- **The rubric is encoded and enforced, not aspirational.** A public note's `evidence[].claim_type`
  declares what help it gives and which source it must cite; any external-knowledge claim (`lexical`,
  `biblical-context`, `classical-context`, `historical-context`, `nautical-whaling`, `cartographic`,
  `publication-context`) MUST cite a non-`standard-ebooks-moby-dick` verified source. Hard gate:
  `assertPublicExternalSourceSupport` in `scripts/validate/validate-basic.mjs`. Progress is measured
  by `npm.cmd run audit:content` (public claim-type mix, source-text-only count, external-knowledge count).
- **A reusable authoring pipeline exists.** `scripts/content/_authored-notes-helper.mjs` pre-validates
  every note (anchor whole-word match, no overlap with existing public anchors, length 80-420,
  tone-signals need `tone:true`, no banned prose) and is idempotent; `scripts/content/run-authored-batch.mjs`
  runs a vetted JSON batch from `data/authored/`. The method: cheap Sonnet subagents draft notes
  constrained to the verified-source menu and flag unsourceable refs into a backlog; the lead
  **verifies the scholarship** (WebFetch new sources) and integrates. Subagent scholarship MUST be
  human-verified — they reliably over-reach on citations (e.g. Beale cited for baleen, Bulfinch for Cellini).
- **Current truth:** public Study annotations **377** (118 teaching external knowledge, up from 26),
  **34** verified public sources, 0 external-source-rule failures, 0 density warnings, build green.
  The book is annotated to the bar through **~Chapter 65**. Inherited public notes that are pure
  thematic observation (258) remain and may be upgraded later.

Next highest-value work:

1. **Continue the authoring loop over Chapters 66-135** (the cetology/whaling middle and the final
   chase) via Sonnet subagents + the helper/runner. Reuse the prompt pattern from the 2026-06-08
   BUILD_LOG batches; expand the verified-source menu as you add sources.
2. **Add + WebFetch-verify the sources in `data/authored/needs-source-backlog.json`** (Plato's Phaedo,
   Cranmer, Descartes, the Essex disaster, Coleridge, Xerxes, Pizarro, Iron Crown of Lombardy, etc.)
   to unlock the deferred allusion notes. Never mark a source `verified` without checking the page.
3. **Work the `tone-and-source-review` lane clinically** — race/empire/religion/slavery passages need
   a historical source plus `tone-review` evidence; no safetyist idiom.
4. Optionally **upgrade the 258 inherited `source-text-observation`-only public notes** (a new note on
   the same anchor is auto-skipped as an overlap; to replace one, demote the inherited note first).
   The rubric allows a deliberate minority of genuine close-reading cruxes.
5. Keep every batch green: `npm.cmd run prepare:data`, then `audit:content`, then `build`. Dev server
   on port **4330** (avoid 4321/4322 — another project uses them); smoke scripts honor `APP_URL`.
6. **Only after content is solid: Phase 2 — the multi-page Astro portal** (per-chapter routes +
   trail/entity/map/source/dashboard pages + client search + React islands), modeled on and exceeding
   `C:\GitHub_Files\Shakespeare_Portal`. See `docs/SCALE_UP_READINESS.md`.

Keep validation focused on scholarly usefulness and public-payload hygiene, never raw annotation count.

Browser note: `npm.cmd run dev -- --host 127.0.0.1 --port 4321` works in the foreground. In Codex's managed shell, detached sandbox-launched child servers may be cleaned up when the command returns. If Codex needs to leave preview running, launch the server outside the sandbox with approval. The in-app browser connector currently fails with `windows sandbox failed: spawn setup refresh`; use the Chrome DevTools Protocol fallback in `docs/LOCAL_PREVIEW_AND_BROWSER.md`. The fallback has been verified by launching Chrome on port 9222 and running `npm.cmd run smoke:browser`, which clicked Study mode and switched to Classroom Standard.
