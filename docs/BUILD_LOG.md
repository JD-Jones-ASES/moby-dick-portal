# Build Log

## 2026-06-06 - Initial Scaffold

- Inspected `C:\GitHub_Files\Melville`.
- Found Gemini's preliminary planning document and `herman-melville_moby-dick-master.zip`.
- Inspected the read-only Shakespeare Portal for structure and conventions.
- Created `Agent.md` as the project entry point.
- Added project documentation under `docs/`.
- Unpacked the local Standard Ebooks archive `herman-melville_moby-dick-master.zip` into `vendor/standard-ebooks/`; no source text was re-downloaded.
- Added starter schemas and ingestion infrastructure.

## 2026-06-06 - Phase 0 Source Contracts

- Expanded `data/chapters/moby-dick.chapter-manifest.json` from chapter-only metadata to 142 ordered reading units: six frontmatter units, 135 chapters, and the epilogue.
- Kept a `chapters` convenience array for the 135 numbered chapters while adding `units` as the full source-order contract.
- Updated ingestion and validation scripts for reading-unit counts, sequence order, section types, and source records.
- Added durable source records for Standard Ebooks, Project Gutenberg ebook 2701, and the Internet Archive edition named in the Standard Ebooks OPF metadata.
- Updated docs to mark Phase 0 complete and point the next work session toward Phase 1 classification and path refinement.

## 2026-06-06 - Phase 1 Seed Classification

- Added provisional function classifications for all 135 numbered chapters.
- Expanded the narrative core from a simple opening/finale range to a first-pass plot route that includes embarkation, Ahab's declaration, major warnings, key action beats, late Ahab/Starbuck material, the final chase, and the epilogue.
- Expanded the classroom-standard path with required and recommended middle chapters for character, cetology, gams, whaling labor, legal-political metaphor, symbolism, and formal experiments.
- Added `metadata_status` to generated reading units so classifications are clearly marked provisional until reviewed and cited.

## 2026-06-06 - Reading Paths

- Added `scripts/ingest/build-reading-paths.mjs` to generate `full_text`, `narrative_core`, and `classroom_standard` route definitions from the manifest.
- Updated `schemas/reading-path.schema.json` and validation so reading paths cover every reading unit and carry scope counts, word counts, goals, and omission rationales.
- A temporary generated static prototype was created, then removed after the project direction was clarified: Astro is required.

## 2026-06-06 - Summary Seed Overlay

- Added `data/chapters/moby-dick.summary-seeds.json` with 21 concise summaries for the opening, major classroom pivots, final chase, and epilogue.
- Updated the chapter manifest generator to merge summary seeds by `unit_id`.
- Updated validation to catch missing, duplicate, or stale summary seed IDs.
- Updated reader data so skipped-material summaries can surface in the app.

## 2026-06-06 - Astro Reader Foundation

- Installed Astro using `npm.cmd install astro --cache .\.npm-cache` so npm cache writes stay inside the workspace.
- Added `astro.config.mjs`, `src/pages/index.astro`, `src/lib/guide-data.js`, and `src/styles/global.css`.
- The Astro reader consumes generated manifest/path data, displays source text, switches reading paths, searches units, recovers skipped material, and includes seed glossary hover behavior plus a map scaffold.
- `npm.cmd run build --cache .\.npm-cache` passes and writes `dist/`.
- The dev server was started at `http://127.0.0.1:4321` and returned HTTP 200.
- The Codex in-app browser runtime still failed during setup before opening localhost, with `windows sandbox failed: spawn setup refresh`; this appears separate from the Astro app/server.

## 2026-06-06 - Reference Apparatus Seed

- Added validated collection schemas and data for glossary entries, reference cards, annotations, and voyage-map waypoints.
- Seeded 18 glossary entries, 6 reference cards, 10 annotations, and 6 broad map waypoints.
- Updated `src/lib/guide-data.js` and `src/pages/index.astro` so the Astro reader consumes the new data.
- The reader now has data-backed mouseover glossary behavior, Study-mode reference cards, Study-mode annotations, and waypoint text in the map panel.

## 2026-06-06 - Session Handoff Polish

- Fixed reader text extraction so source headings are stripped from displayed prose; Chapter 1 now begins with "Call me Ishmael" instead of duplicated chapter-title debris.
- Rendered reader prose as paragraphs rather than a raw preformatted text block.
- Added a `Manhattan Frame` waypoint for Chapter 1 so the map panel shows a meaningful opening-stage note.
- Ran `npm.cmd run prepare:data --cache .\.npm-cache` and `npm.cmd run build --cache .\.npm-cache`; both passed.
- Stopped the Astro dev server before closing the session.

## 2026-06-06 - Reader V1 Navigation And Browser Setup

- Redesigned `src/pages/index.astro` and `src/styles/global.css` into a fuller v1 reader surface with path/source/depth controls, story-map navigation, trail lenses, recoverable skipped chapters, glossary/reference/study panels, voyage-stage display, and responsive desktop/mobile behavior.
- Added Standard Ebooks cover art to the reader chrome.
- Expanded `data/chapters/moby-dick.summary-seeds.json` from 21 to 62 summaries.
- Regenerated `data/chapters/moby-dick.chapter-manifest.json`; every required Narrative Core chapter now has a student-facing summary.
- Added `scripts/serve-dist.mjs` for static `dist/` previews and `scripts/dev/cdp-smoke.mjs` for Chrome DevTools Protocol browser smoke tests.
- Added `serve:dist` and `smoke:browser` package scripts.
- Confirmed `node scripts/ingest/build-chapter-manifest.mjs`, `node scripts/validate/validate-basic.mjs`, and `npm.cmd run build` pass.
- Diagnosed local preview friction: foreground Astro works, but detached sandbox-launched servers may be cleaned up when the tool command returns. Launching Astro outside the sandbox with approval stays reachable.
- Diagnosed browser friction: the Codex in-app browser connector fails before reaching Chrome with `windows sandbox failed: spawn setup refresh`. Chrome DevTools Protocol on port 9222 is a working fallback; `npm.cmd run smoke:browser` successfully clicked Study mode and switched to Classroom Standard.

## 2026-06-06 - Student-View Audit And Classroom Summary Pass

- Audited the reader through Chrome DevTools Protocol as a student, including path switching, depth modes, search, glossary behavior, recoverable material, story-map navigation, and mobile layout.
- Fixed Classroom Standard so the path opens on Chapter 1 instead of front matter.
- Hid abridged-path front matter from the default path navigation, treated optional units as expandable rather than automatically carried, and aligned visible/recoverable counts with the student-facing lists.
- Added a clear-search control.
- Upgraded glossary behavior from side-panel-only hover feedback to a word-level popover plus side-panel update.
- Made voyage-map route dots keyboard/click navigable and labeled the map as a stage guide rather than an exact chart.
- Used cheaper subagents for bounded source-checked summary drafting, then integrated and edited the results into `data/chapters/moby-dick.summary-seeds.json`.
- Expanded summary seeds from 62 to 136. Every numbered chapter and the epilogue now have a student-facing summary seed, including all Narrative Core recovery cards and Classroom Standard optional chapters.
- Updated validation to require summary seeds for all numbered chapters and the epilogue.
- Regenerated `data/chapters/moby-dick.chapter-manifest.json`; `node scripts/validate/validate-basic.mjs`, `npm.cmd run build`, and `npm.cmd run smoke:browser` pass.
- Final Chrome audit confirmed Classroom Standard opens on `Loomings`, search finds `A Squeeze of the Hand`, route-dot navigation reaches `The Chase—First Day`, and mobile layout has no overflow.
- Added text-to-note linkage for Study Notes: annotation anchors now highlight in the reader text, select the matching Study Note, and can be selected from either side.
- Fixed nested glossary/annotation behavior so a phrase like `Fast-Fish` can be both a glossary term and a Study Note anchor without corrupting markup.
- Updated validation to require annotation anchors to appear in the displayed unit text, and updated browser smoke testing to assert the Loomings annotation link works.
- Expanded annotations from 10 to 18 with source-anchored notes for early Classroom Standard chapters including `The Advocate`, `Knights and Squires`, `Cetology`, `Sunset`, `Dusk`, `Midnight, Forecastle`, and `The Town-Ho's Story`.
- Expanded glossary entries from 18 to 30, adding early-reader vocabulary and crew/person context including `spleen`, `hypos`, `Cato`, `Nantucket`, `Bildad`, `Peleg`, `Starbuck`, `Stubb`, `Flask`, `Tashtego`, `Daggoo`, and `Fedallah`.

## 2026-06-06 - Guide/Study Layer Cleanup And Annotation Architecture

- Responded to the Chapter 3 Queequeg screenshot by separating Guide and Study surfaces more cleanly.
- Guide mode now shows glossary marks without Study annotation marks, hides the Study Notes card, and suppresses duplicate desktop glossary popovers while still updating the glossary panel.
- Study mode still reveals passage-level Study Notes, but each annotation now marks the first matched passage in a unit rather than the first match in every paragraph.
- Expanded `scripts/dev/cdp-smoke.mjs` so browser smoke testing covers the Chapter 3 Queequeg Guide-mode case.
- Added `docs/ANNOTATION_ARCHITECTURE.md` to plan for dense future annotation: text selectors, display metadata, tags, relationships, generated indexes, density validation, and Astro/Pagefind/Observable-derived views.
- Added `TextQuoteSelector`-style selectors to annotation records, generated by `scripts/ingest/build-annotation-selectors.mjs`.
- Updated `annotation.schema.json`, `validate-basic.mjs`, and `package.json` so selectors are generated during data prep and validated against displayed text.
- Updated the reader so Study annotations use selector locations rather than repeated anchor matching.
- Verified `node scripts/validate/validate-basic.mjs`, `npm.cmd run build`, `npm.cmd run smoke:browser`, and a targeted Chrome check confirming Chapter 3 Study mode shows one Queequeg annotation linked to one note card.

## 2026-06-06 - Annotation Scale-Up Refactor

- Expanded `schemas/annotation.schema.json` so annotation records require display rules, tags, relationships, evidence, provenance, and review queues.
- Added `data/annotations/moby-dick.annotation-layers.json` as the first Read/Guide/Study/Explore/Teacher layer registry.
- Added `data/taxonomy/moby-dick.taxonomy.json` as a seed registry for trail and entity relationship targets.
- Updated `scripts/ingest/build-annotation-selectors.mjs` so selector regeneration preserves rich annotation fields and fills conservative defaults for older records.
- Added `scripts/ingest/build-annotation-indexes.mjs`, generating `data/indexes/annotations-by-unit.json`, `annotations-by-tag.json`, `annotation-density.json`, and `annotation-edges.json`.
- Updated `src/lib/guide-data.js` and `src/pages/index.astro` so the reader consumes per-unit annotation packs while keeping the flat annotation list as a fallback.
- Broadened `schemas/source-record.schema.json` for future dictionaries, biblical/classical texts, historical sources, scholarship, maps, images, and licensing records.
- Hardened `scripts/validate/validate-basic.mjs` to check annotation metadata, selector positions, relationship targets, evidence records, review queues, density warnings, and generated index freshness.
- Extended validation so `trail:` and `entity:` relationship targets must exist in the taxonomy registry.
- Updated `npm.cmd run prepare:data` so the normal pipeline regenerates chapters, paths, annotation selectors, annotation indexes, and validation in order.
- Verified `npm.cmd run prepare:data`, `npm.cmd run build`, and `npm.cmd run smoke:browser` pass with 18 annotations and zero density warnings.

## 2026-06-06 - Reader Navigation And Scale-Up Planning Pass

- Centered the search clear control and suppressed the native search cancel button so the custom control aligns cleanly.
- Made the top-left brand/title link back to `/`, which currently functions as the reader launch point at Chapter 1.
- Added bottom previous/next reading-unit controls with labels so students can navigate after finishing a chapter.
- Extended `scripts/dev/cdp-smoke.mjs` to check the launch link, clear-search alignment, and bottom chapter navigation.
- Added `data/geography/moby-dick.places.json` and `schemas/geography.schema.json` as a seed geography registry with display-anchor coordinate status, taxonomy links, chapter targets, and citation status.
- Expanded taxonomy with seed place entities for Manhattan, the Atlantic, Indian Ocean, and Pacific route stages.
- Updated validation to check geography records against taxonomy entities, chapter targets, coordinate ranges, and source records.
- Added `docs/SCALE_UP_READINESS.md` to capture launch-page direction, map/geography visualization plans, task-aware color themes, and the Astro shell / React island decision.
- Verified `npm.cmd run prepare:data`, `npm.cmd run build`, `npm.cmd run smoke:browser`, and `npm.cmd run screenshot:browser`; visual screenshots confirmed the centered clear control and bottom navigation.

## 2026-06-07 - First Major Content Blowout

- Read `Agent.md`, build memory, content standards, data model, annotation architecture, scale-up readiness, schemas, and current source data before expanding content.
- Added `scripts/content/first-major-content-blowout.mjs` as a reusable append-only expansion script for the first large writing batch.
- Added seven non-Standard-Ebooks provisional source records for lexical, biblical, classical, whaling-history, and whale-science support: Webster 1913, King James Bible, Bulfinch, Beale, Scoresby, NOAA Fisheries, and Smithsonian Ocean.
- Expanded source records from 3 to 10.
- Expanded glossary entries from 30 to 107, with targets generated from the rendered text when not hand-specified; merged the new ambergris source citation into the original seed entry instead of keeping a duplicate term.
- Expanded reference cards from 6 to 16, including Ahab's biblical name, shipboard hierarchy, gams, sperm-whale anatomy, difficult religious language, whiteness, Pip, coffin/life-buoy, storm/navigation, and the final chase.
- Expanded annotations from 18 to 141. Every Classroom Standard reading unit and every rendered Full Text unit now has at least one Study annotation; the only uncovered unit is the blank half-title page.
- Added broader `trail:` / `entity:` / `reference:` / `glossary:` relationships so generated indexes can start powering trail, graph, search, and teacher-review surfaces.
- Kept new interpretive/contextual material provisional or in review queues; difficult-material notes remain in citation, source-check, difficult-material, and tone review.
- Regenerated chapter manifest, reading paths, annotation selectors, and annotation indexes with `npm.cmd run prepare:data --cache .\.npm-cache`.
- Verified `npm.cmd run prepare:data --cache .\.npm-cache`, `npm.cmd run build --cache .\.npm-cache`, and `npm.cmd run smoke:browser --cache .\.npm-cache`; validation reports 141 annotations, 107 glossary entries, 16 reference cards, 10 source records, and zero annotation density warnings.

## 2026-06-07 - Frontmatter Summaries And Content Readiness Audit

- Added summary seeds for all six frontmatter units: title page, imprint, dedication, etymology, extracts, and half-title.
- Regenerated `data/chapters/moby-dick.chapter-manifest.json`; all 142 reading units now have recovery-card summaries.
- Updated `scripts/validate/validate-basic.mjs` so every reading unit, not only numbered chapters and the epilogue, must have a summary seed.
- Added `scripts/validate/audit-content-readiness.mjs` and `npm.cmd run audit:content` to report publication-readiness gaps beyond structural schema checks.
- The readiness audit now distinguishes selector-exempt blank/display-empty units from ordinary annotation gaps; the half-title remains intentionally selector-exempt.
- Verified `npm.cmd run validate:basic` with 142 summary seeds.

## 2026-06-07 - Second Major Content Expansion And Sidebar Label Fix

- Corrected a session-scope mismatch: content buildout should increase item counts substantially, not only tighten validation.
- Added `scripts/content/second-major-content-expansion.mjs` and `npm.cmd run content:expand:second` as a reusable append-only expansion step.
- Expanded source records from 10 to 18 with provisional/needs-review support sources for maritime memoir, Melville context, dictionary, museum, classroom, and modern whale-science review.
- Expanded glossary entries from 107 to 175 with additional nautical, shipboard, whaling, symbolic, biblical, historical, and vocabulary terms.
- Expanded reference cards from 16 to 40, adding cards for shore-to-sea transition, religious difference, the Pequod as a system, lookout/perception, forecastle voices, whale knowledge, gams, Pip, navigation, late mercy tests, final chase structure, and related classroom threads.
- Expanded annotations from 141 to 256. Every Classroom Standard unit now has at least two Study annotations; the readiness audit reports zero `classroom_units_with_fewer_than_two_annotations`.
- Regenerated chapter manifest, reading paths, annotation selectors, and annotation indexes with `npm.cmd run prepare:data`.
- Fixed confusing sidebar/source labels in the reader: the source toggle now says `Path Only` / `Whole Book`, and the trail filter says `All Trails` instead of `All`.
- Clarified the sidebar behavior: `All Trails` means no function/trail filter inside the currently visible source mode; `Whole Book` is the control that shows every source unit in the left sidebar.
- Verified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, and `npm.cmd run build`.

## 2026-06-07 - Selector Boundary Repair And Whole-Book Density Pass

- Investigated the Chapter 45 visual defect where the Study note displayed `ood, and moreover to take away any`, a clipped substring of `understood, and moreover...`.
- Confirmed the cause was the second expansion script's sentence chunking, which could start generated anchors inside long words.
- Repaired 29 generated classroom anchors and one singular/plural authored anchor (`Fossil Whale` -> `Fossil Whales`).
- Updated `scripts/ingest/build-annotation-selectors.mjs` to prefer whole-word selector matches and fail when an anchor only resolves inside a word.
- Updated `scripts/validate/validate-basic.mjs` to reject generated selector positions that begin or end inside alphabetic words.
- Updated `scripts/content/second-major-content-expansion.mjs` so future generated classroom anchors are whole-word phrases and existing generated anchors can be repaired idempotently.
- Added `scripts/content/third-whole-book-annotation-pass.mjs` and `npm.cmd run content:expand:third` for a generated whole-book Study density pass.
- Expanded annotations from 256 to 419. All numbered chapters, the epilogue, and substantial frontmatter now have at least three Study annotations; only the blank half-title remains selector-exempt.
- Added `whole_book_units_with_fewer_than_three_annotations` to `scripts/validate/audit-content-readiness.mjs`; the audit now reports zero such units.
- Tightened the third-pass generator to avoid near-duplicate anchors within a unit, including shared three-word runs; repaired older overlapping anchors in Chapters 48, 61, 121, and 127.
- Added `scripts/dev/cdp-check-chapter-45.mjs`, a live browser regression check for Chapter 45 in `Whole Book` + `Study` mode. It verifies no clipped fragments are visible and confirms the three current Study anchors: `So far as what there may be`, `a narrative in this book; and`, and `natural verity`.
- Verified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, a custom boundary-selector scan with zero bad selectors, a custom overlap scan with zero near-duplicate anchors, and `node scripts/dev/cdp-check-chapter-45.mjs`.

## 2026-06-07 - Difficult-Material Review Pass

- Added `scripts/content/difficult-material-review-pass.mjs` and `npm.cmd run content:expand:difficult`.
- Added 73 new review-queued difficult-material annotations, expanding difficult-material notes from 11 to 84 and total annotations from 419 to 492.
- The difficult-material pass uses conservative signals: high-confidence racial/colonial labels, religious-prejudice terms, slavery language, older mental-health language, or clustered violence/animal-suffering terms.
- Difficult-material notes are marked `needs-review`, with `citation`, `source-check`, `difficult-material`, and `tone` review queues.
- Updated `scripts/validate/audit-content-readiness.mjs` to use the same conservative difficult-material signal; it now reports zero `possible_difficult_material_classroom_gaps`.
- Updated `scripts/dev/cdp-smoke.mjs` to navigate with a fresh cache-busted URL so smoke checks start from the launch state even after targeted browser tests leave Chrome on another chapter.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `node scripts/dev/cdp-check-chapter-45.mjs`, a custom boundary-selector scan with zero bad selectors, a custom overlap scan with zero near-duplicate anchors, and annotation-density indexes with zero warnings.

## 2026-06-07 - Teacher Review Layer

- Audited annotation distribution by unit, kind, depth, trail, glossary category, and reference-card kind after the Study and difficult-material passes.
- Added `scripts/content/teacher-review-layer-pass.mjs` and `npm.cmd run content:expand:teacher`.
- Added 139 non-inline `teacher-note` annotations, one for every substantial displayed reading unit: numbered chapters, epilogue, and substantial frontmatter.
- Expanded total annotations from 492 to 631. Current kind distribution: 203 theme, 153 context, 139 teacher-note, 84 difficult-material, and 52 form annotations.
- Added `substantial_units_without_teacher_note` to `scripts/validate/audit-content-readiness.mjs`; it reports zero gaps.
- Confirmed teacher notes do not increase student inline density: `data/indexes/annotation-density.json` reports zero density warnings.
- Hardened `scripts/dev/cdp-smoke.mjs` again to wait for `Page.loadEventFired`, preventing stale browser state from Chapter 45 targeted checks from leaking into the launch-state smoke test.
- Verified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `node scripts/dev/cdp-check-chapter-45.mjs`, and a custom selector-boundary scan with zero bad selectors.

## 2026-06-07 - Broad Multi-Type Expansion And Whole Book Sidebar Fix

- Corrected the content-build scope again: the expansion now increases multiple apparatus types, not just annotation coverage.
- Added `scripts/content/fourth-broad-content-expansion.mjs` and `npm.cmd run content:expand:broad` as an append-only broad pass.
- Expanded content totals to 899 annotations, 210 glossary entries, 74 reference cards, 31 source records, 22 geography places, 18 trails, and 44 entities. Summary seeds remain complete at 142.
- Added 13 provisional citation leads, 35 glossary entries, 34 reference cards, 15 display-anchor geography places, 20 taxonomy entities, 8 taxonomy trails, and 199 net new annotations after pruning generated overlaps.
- Kept new broad-pass annotations non-inline on `index`, `search`, and `review` surfaces so Study mode gains searchable apparatus without increasing paragraph-level reader density.
- Fixed the left sidebar behavior in `src/pages/index.astro`: `Whole Book` now uses the complete Full Text rule list for sidebar visibility, story-map jumps, stats, and previous/next navigation, regardless of the selected abridged path.
- Added `scripts/dev/cdp-check-sidebar-all.mjs` and `npm.cmd run check:sidebar-all`; it verifies `Whole Book` shows all 142 source units from Narrative Core, Classroom Standard, and Full Text selections.
- Resolved the Chapter 31 density warning by moving one duplicative Queen Mab dream note out of the inline reader layer while preserving it in trail/search/review apparatus.
- Rechecked Chapter 45 in live Study mode; the clipped `understood` fragment remains fixed, and no bad fragments were detected.
- Verified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, `node scripts/dev/cdp-check-chapter-45.mjs`, annotation-density indexes with zero warnings, selector-boundary scan with zero bad selectors, and overlap scan with zero near-duplicate anchors.

## 2026-06-07 - Thin-Unit And Subagent Refinement Pass

- Audited apparatus distribution by unit after the broad expansion and found the next weakness: several substantial technical, early shore, and late dramatic chapters had annotations but no reference-card support or little/no glossary help.
- Used two `gpt-5.4-mini` subagents for bounded editorial review: one for technical/cetology/whaling-labor chapters and one for late dramatic chapters. Integrated the distinct suggestions and pruned duplicate anchors identified by the overlap scan.
- Added `scripts/content/fifth-thin-unit-apparatus-pass.mjs`, `scripts/content/sixth-subagent-suggestions-pass.mjs`, and `scripts/content/seventh-reference-glossary-gap-pass.mjs`, with package commands `content:expand:thin-units`, `content:expand:subagent-suggestions`, and `content:expand:reference-glossary-gaps`.
- Expanded totals again to 906 annotations, 247 glossary entries, and 114 reference cards. Source records remain 31; geography places 22; taxonomy trails 18; taxonomy entities 44; summary seeds 142.
- Added reference-card support for previously thin chapters and cross-chapter threads including brit/right-whale feeding, false sightings, whale-as-food, sperm-whale head anatomy, whale social groups, The Cassock, Enderby whaling history, craftsmen around Ahab, late calm chapters, Ahab/Pip, Arsacides skeleton display, fossil whales/deep time, navigation tools, corpusants, coffin-life-buoy, and remaining early/shore/gam/labor gaps.
- Added or retargeted glossary support for terms including brit, Crozetts, Venetian blind, squid, train oil, battering-ram, spout-hole, Heidelburgh Tun, quoin, junk, case, school, bull, cassock, windlass, Queen Maachah, Samuel Enderby, Amelia, tackle, whip, Basilosaurus, Potters' Fields, Hark, hyena, dart, crotch, vultureism, fountain, and extinction.
- Added selected non-inline subagent notes for baleen/filter-feeding, dated madness language around Ahab, and the Delight's self-sealing warning logic; removed seven duplicate subagent notes after overlap review.
- Distribution check now reports zero substantial displayed units over 250 words without reference-card coverage and zero without glossary coverage.
- Verified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, `node scripts/dev/cdp-check-chapter-45.mjs`, annotation-density indexes with zero warnings, selector-boundary scan with zero bad selectors, and overlap scan with zero near-duplicate anchors.

## 2026-06-07 - Broad Annotation Quality Polish

- Audited generated broad-pass annotation prose and found 200 notes still using placeholder classroom language such as `This passage advances...` or `A useful classroom question...`.
- Added `scripts/content/eighth-broad-note-specificity-pass.mjs` and `npm.cmd run content:repair:broad-specificity`; it rewrote all 200 broad-pass notes away from the original placeholders.
- Added hand-polish passes for the early and mid/late broad notes: `ninth-hand-polish-broad-notes-pass.mjs`, `tenth-midbook-hand-polish-broad-notes-pass.mjs`, and `twelfth-final-broad-polish-pass.mjs`.
- Used a `gpt-5.4-mini` reviewer to identify non-broad classroom/teacher notes that still sounded generic; integrated all 29 suggested replacements with `eleventh-subagent-quality-repair-pass.mjs`.
- Final quality scan reports zero broad notes matching the remaining template patterns and zero annotations matching the original generic placeholder phrases.
- Content totals remain 906 annotations, 247 glossary entries, 114 reference cards, 31 source records, 22 geography places, 18 taxonomy trails, 44 taxonomy entities, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, `node scripts/dev/cdp-check-chapter-45.mjs`, annotation-density indexes with zero warnings, selector-boundary scan with zero bad selectors, and overlap scan with zero near-duplicate anchors.

## 2026-06-07 - Whole-Book Rendered Study Anchor Check

- Added `scripts/dev/cdp-check-study-anchors-all.mjs` and `npm.cmd run check:study-anchors-all` to inspect rendered Study highlights in the browser, not just JSON selector positions.
- The new check opens `Whole Book` + `Study`, visits all 142 source units, and inspects each rendered `.annotation-term` span for mid-word starts/ends plus known suspicious fragments related to the original Chapter 45 `understood` clipping.
- Verified `npm.cmd run check:study-anchors-all`: 142 units checked, 516 rendered Study highlights inspected, zero word-boundary problems, and zero suspicious clipped fragments.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, `node scripts/dev/cdp-check-chapter-45.mjs`, annotation-density indexes with zero warnings, and selector-boundary scan with zero bad selectors.

## 2026-06-07 - Readiness Audit Hardening

- Added `scripts/content/thirteenth-cetology-template-polish-pass.mjs` and `npm.cmd run content:repair:cetology-template-polish`.
- Rewrote 12 older cetology/classification notes that still reused the second expansion's template sentence, while preserving the existing 906-annotation total.
- Expanded `scripts/validate/audit-content-readiness.mjs` so the regular content audit now reports reference-card coverage gaps, glossary coverage gaps, generic placeholder annotation notes, and broad-pass template notes.
- Current audit totals: 142 reading units, 142 summary seeds, 247 glossary entries, 114 reference cards, 906 annotations, and 31 source records.
- Current readiness gaps are zero for units without annotations, classroom units under two annotations, whole-book units under three annotations, substantial units without reference cards, substantial units without glossary entries, substantial units without teacher notes, possible classroom difficult-material gaps, generic placeholder notes, and broad template notes.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`.

## 2026-06-07 - Generated Scaffold And Subagent Quality Polish

- Added `scripts/content/fourteenth-generated-scaffold-polish-pass.mjs` and `npm.cmd run content:repair:generated-scaffold-polish`.
- Removed remaining internal generator language from student-facing notes: 71 `added anchor` / `second study handle` scaffolds, 133 `Teacher review:` prefixes, and 115 repeated teacher prompts were normalized or rewritten.
- Expanded `scripts/validate/audit-content-readiness.mjs` so those scaffold phrases are now counted under `annotations_with_generic_placeholder_notes`.
- Used two `gpt-5.4-mini` subagent auditors for bounded editorial review: one for Chapters 1-35 and one for Chapters 36-90.
- Added `scripts/content/fifteenth-middle-auditor-polish-pass.mjs`, `scripts/content/sixteenth-early-auditor-polish-pass.mjs`, and package commands `content:repair:middle-auditor-polish` and `content:repair:early-auditor-polish`.
- Integrated 60 subagent-suggested student-facing replacements across Chapters 10-24 and 36-80, especially notes that were too abstract for their anchors.
- Content totals remain 906 annotations, 247 glossary entries, 114 reference cards, 31 source records, 22 geography places, 18 taxonomy trails, 44 taxonomy entities, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, `npm.cmd run check:study-anchors-all`, and `node scripts/dev/cdp-check-chapter-45.mjs`.

## 2026-06-07 - Formula Residue, Late-Book, And Duplicate-Note Polish

- Added `scripts/content/seventeenth-formula-residue-polish-pass.mjs` and `npm.cmd run content:repair:formula-residue-polish`.
- Removed 132 remaining formula sentences such as `useful labor anchor`, `another place to test`, `anchor is useful`, and related form/labor scaffolds; fixed 7 teacher-note capitalization artifacts left by earlier prefix removal.
- Added stricter readiness-audit patterns for those formula families.
- Used two more `gpt-5.4-mini` subagent auditors for Chapters 91-115 and Chapters 116-135 plus the epilogue. The second auditor incorrectly reported no Chapter 116-135 annotations, so only its concrete epilogue findings were integrated.
- Added `scripts/content/eighteenth-late-labor-auditor-polish-pass.mjs`, `scripts/content/nineteenth-epilogue-auditor-polish-pass.mjs`, and corresponding package commands.
- Integrated 30 late labor/technical note replacements across Chapters 91-113 and 3 epilogue replacements.
- Added `scripts/content/twentieth-duplicate-note-polish-pass.mjs` and `npm.cmd run content:repair:duplicate-note-polish`; it rewrote 76 exact duplicate notes within units so repeated annotations now point to their selected wording.
- Expanded `scripts/validate/audit-content-readiness.mjs` with `duplicate_annotation_notes_within_unit`, currently reporting zero duplicate-note groups.
- Hardened `scripts/dev/cdp-smoke.mjs` to wait for the `Loomings` launch state before asserting previous/next navigation, fixing the observed Chrome timing flake.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser` twice after the timing fix, `npm.cmd run check:sidebar-all`, `npm.cmd run check:study-anchors-all`, and `node scripts/dev/cdp-check-chapter-45.mjs`.

## 2026-06-07 - Difficult-Material Status And Tone Polish

- Added `scripts/content/twentyfirst-difficult-material-status-pass.mjs` and `npm.cmd run content:repair:difficult-material-status`.
- Normalized all 89 difficult-material annotations so each is explicitly `needs-review`, stays in citation/source-check/difficult-material/tone review queues, and carries `tone-review` evidence validation.
- Added readiness-audit gaps for `difficult_material_not_needs_review` and `difficult_material_without_tone_review_evidence`; both report zero.
- Added `scripts/content/twentysecond-difficult-material-generic-polish-pass.mjs`, `twentythird-difficult-material-midbook-auditor-pass.mjs`, `twentyfourth-difficult-material-early-auditor-pass.mjs`, `twentyfifth-difficult-material-auditor-degeneric-pass.mjs`, and `twentysixth-difficult-material-late-auditor-pass.mjs`.
- Used three `gpt-5.4-mini` subagent auditors for difficult-material tone: frontmatter/Chapters 1-45, Chapters 46-90, and Chapters 91-135/epilogue.
- Replaced 71 generic difficult-material notes with anchor-specific wording, then integrated 47 early/mid subagent replacements, de-genericized 21 repeated reviewer notes, and integrated 12 late-book replacements.
- Final difficult-material scan reports zero exact duplicate difficult-material notes and zero remaining generic difficult-material placeholder phrases.
- Current totals remain 906 annotations, 247 glossary entries, 114 reference cards, 31 source records, 22 geography places, 18 taxonomy trails, 44 taxonomy entities, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, `npm.cmd run check:study-anchors-all`, and `node scripts/dev/cdp-check-chapter-45.mjs`.

## 2026-06-07 - Source-Text Citation Verification

- Added `scripts/content/twentyseventh-source-text-citation-verification-pass.mjs` and `npm.cmd run content:repair:source-text-citations`.
- Conservatively verified citation status for 138 annotations whose evidence consists only of `source-text-observation` claims against the vendored `standard-ebooks-moby-dick` source.
- Kept content statuses unchanged: citation readiness improved without inflating `student-ready` counts.
- Updated verified annotations to remove `citation` from review queues, add `primary-source-checked` evidence validation, and record reviewed provenance.
- Expanded `scripts/validate/audit-content-readiness.mjs` with `source_text_only_annotations_with_unverified_citations`, `verified_annotations_without_primary_source_check`, and `verified_annotations_still_in_citation_review`; all report zero.
- Citation status distribution is now 138 verified and 768 provisional annotations.
- Hardened `scripts/dev/cdp-smoke.mjs` again so the Spouter-Inn glossary check waits for the chapter state before asserting Guide-mode glossary behavior.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser` twice after the smoke timing fix, `npm.cmd run check:sidebar-all`, `npm.cmd run check:study-anchors-all`, and `node scripts/dev/cdp-check-chapter-45.mjs`.

## 2026-06-07 - Apparatus Status Honesty

- Added `scripts/content/twentyeighth-apparatus-status-honesty-pass.mjs` and `npm.cmd run content:repair:apparatus-status-honesty`.
- Demoted 17 glossary entries and 2 reference cards from `student-ready` to `draft` because their citation status remains provisional; this keeps readiness labels conservative while preserving the expanded whole-book content totals.
- Expanded `scripts/validate/audit-content-readiness.mjs` with reference-card status counts plus gates for `student_ready_glossary_with_unverified_citations` and `student_ready_references_with_unverified_citations`.
- Current totals remain 906 annotations, 247 glossary entries, 114 reference cards, 31 source records, 22 geography places, 18 taxonomy trails, 44 taxonomy entities, and 142 summary seeds.
- Current status counts: annotations 811 draft, 90 needs-review, 5 student-ready; glossary 236 draft and 11 needs-review; reference cards 111 draft and 3 needs-review.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`.

## 2026-06-07 - All-Types Registry Expansion

- Added `scripts/content/twentyninth-all-types-registry-expansion-pass.mjs` and `npm.cmd run content:expand:all-types-registry`.
- Expanded the smaller registry families: +12 source leads, +12 taxonomy trails, +25 taxonomy entities, +12 geography places, and +9 voyage-map waypoints.
- New source leads include additional Melville works, Milton, Shakespeare, Jonah, Maury, Darwin, Hawthorne, and map-reference leads, all marked provisional pending bibliographic review.
- New taxonomy/geography coverage adds trails for books and knowledge, whiteness, profit, friendship, bodies, ecology, comedy, scripture, colonial contact, fate, craft, and endings; added place/entity support for Sag Harbor, Cape Verde, Azores, Cape of Good Hope, Crozet Islands, Kerguelen, Java Sea, Japan Sea stage, Arsacides, and related route stages.
- Current totals are 906 annotations, 247 glossary entries, 114 reference cards, 43 source records, 34 geography places, 30 taxonomy trails, 69 taxonomy entities, 16 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`.

## 2026-06-07 - Whole-Book Annotation Floor Expansion

- Added `scripts/content/thirtieth-thin-unit-annotation-floor-pass.mjs`, `thirtyfirst-midbook-subagent-integration-pass.mjs`, `thirtysecond-earlybook-subagent-integration-pass.mjs`, and `thirtythird-thin-unit-completion-pass.mjs`.
- Added package commands `content:expand:thin-unit-annotation-floor`, `content:expand:midbook-subagent`, `content:expand:earlybook-subagent`, and `content:expand:thin-unit-completion`.
- Raised the whole-book annotation total from 906 to 1,038 while keeping all new claims draft/provisional or needs-review where appropriate.
- Used two `gpt-5.4-mini` subagent reviewers for Chapters 1-45 and 46-90, integrating 45 source-checked non-overlapping suggestions after anchor checks; late-book and remaining thin-unit coverage was completed locally from the displayed source text.
- Established a current annotation floor of at least 7 notes for every chapter and the epilogue: distribution is 89 units with 7 notes, 35 with 8, 8 with 9, and 4 with 11.
- Source-text-only citation verification now covers 160 annotations; current annotation statuses are 941 draft, 92 needs-review, and 5 student-ready.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; the rendered Study-anchor check inspected 601 visible terms across 142 units with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Reference And Glossary Floor Expansion

- Added `scripts/content/thirtyfourth-reference-glossary-floor-pass.mjs` and `npm.cmd run content:expand:reference-glossary-floor`.
- Raised apparatus floors for substantial displayed units: every substantial unit now has at least 2 reference cards and at least 3 glossary targets.
- Expanded totals to 303 glossary entries and 178 reference cards while keeping generated additions draft/provisional.
- Added readiness-audit gates for `substantial_units_with_fewer_than_two_reference_cards`, `substantial_units_with_fewer_than_three_glossary_entries`, and `duplicate_generated_glossary_terms`; all report zero.
- Revised the generated glossary floor so terms are chapter-specific and non-duplicative; the generated floor currently has zero duplicate terms.
- Hardened `scripts/dev/cdp-smoke.mjs` to clear browser storage on launch and fail immediately if the Loomings or Spouter-Inn waits do not complete, fixing the observed stale-page smoke failure.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`.

## 2026-06-07 - Generated Apparatus Prose Polish

- Tightened `scripts/content/thirtyfourth-reference-glossary-floor-pass.mjs` so generated reference-card notes are chapter-specific instead of repeated by profile.
- Used two `gpt-5.4-mini` subagent reviewers for generated apparatus prose, then integrated 20 reference-card rewrites and 20 glossary rewrites as durable overrides in the generator.
- Expanded `scripts/validate/audit-content-readiness.mjs` with `duplicate_generated_reference_notes` and `generated_glossary_generic_definitions`; both report zero.
- Reverified current totals: 1,038 annotations, 303 glossary entries, 178 reference cards, 43 source records, 34 geography places, 30 taxonomy trails, 69 taxonomy entities, 16 map waypoints, and 142 summary seeds.
- Hardened the Spouter-Inn portion of `scripts/dev/cdp-smoke.mjs` again so it resets to a fresh Loomings page and navigates deterministically by the bottom next controls.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; the Study-anchor check still reports zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Remaining Generated Reference Card Polish

- Used two more `gpt-5.4-mini` subagent reviewers for generated reference cards in Chapters 44-90 and Chapters 91-135.
- Integrated 37 reviewer rewrites plus 7 local rewrites into `scripts/content/thirtyfourth-reference-glossary-floor-pass.mjs`, so all 64 `apparatus-floor-ref-*` cards now have durable chapter-specific overrides.
- Added `generated_reference_template_notes` to `scripts/validate/audit-content-readiness.mjs`; it initially reported 44 template-shaped generated reference notes and now reports zero.
- Current totals remain 1,038 annotations, 303 glossary entries, 178 reference cards, 43 source records, 34 geography places, 30 taxonomy trails, 69 taxonomy entities, 16 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; the whole-book Study scan checked 142 units and 601 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Generated Glossary Floor Polish

- Used two `gpt-5.4-mini` subagent reviewers for generated glossary entries in Chapters 25-85 and Chapters 86-135/epilogue.
- Integrated reviewer suggestions plus local repairs for all 36 weak generated glossary definitions, making the glossary floor more chapter-specific while preserving the expanded whole-book totals.
- Added `generated_glossary_weak_definitions` to `scripts/validate/audit-content-readiness.mjs`; it initially reported 36 weak generated definitions and now reports zero.
- Current totals remain 1,038 annotations, 303 glossary entries, 178 reference cards, 43 source records, 34 geography places, 30 taxonomy trails, 69 taxonomy entities, 16 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; the sidebar check reports all 142 units in all three paths, and the whole-book Study scan checked 601 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Registry Deepening Expansion

- Added `scripts/content/thirtyfifth-registry-deepening-pass.mjs` and `npm.cmd run content:expand:registry-deepening`.
- Expanded the thinner support registries by adding 15 thematic trails, 28 taxonomy entities, 18 geography places, and 12 story-map waypoints.
- Current totals are 1,038 annotations, 303 glossary entries, 178 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Kept the added registry records draft/provisional and described map/geography coordinates as display anchors rather than reconstructed route claims.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; the rendered story map now reports 28 waypoints, all three sidebar paths still report 142 units, and the Study-anchor scan still reports zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Ten-Note Whole-Book Annotation Floor

- Added `scripts/content/thirtysixth-ten-note-floor-pass.mjs`, `scripts/content/thirtyseventh-subagent-curated-overlay-pass.mjs`, and `scripts/content/thirtyeighth-inline-density-balance-pass.mjs`.
- Added package commands `content:expand:ten-note-floor`, `content:expand:subagent-curated-overlay`, and `content:repair:inline-density-balance`.
- Used two `gpt-5.4-mini` subagent reviewers for Chapters 1-45 and 46-90, integrating 56 valid non-duplicate curated annotations after exact-anchor checks.
- Raised whole-book annotation coverage from 1,038 to 1,387 annotations; every numbered chapter and the epilogue now has at least 10 linked annotations.
- Added `chapter_units_with_fewer_than_ten_annotations` to `scripts/validate/audit-content-readiness.mjs`; it reports zero.
- Balanced visible Study highlights after the expansion by demoting 34 newly generated inline marks in over-dense paragraphs while keeping their notes linked, searchable, and indexed.
- Final annotation distribution for chapters/epilogue is 132 units with 10 annotations and 4 units with 12; annotation-density warnings report zero.
- Current totals are 1,387 annotations, 303 glossary entries, 178 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; the sidebar check still reports all 142 units in all three paths, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Annotation Variety Balance

- Added `scripts/content/thirtyninth-annotation-variety-balance-pass.mjs` and `npm.cmd run content:repair:annotation-variety-balance`.
- Added 72 non-inline Study annotations to reduce one-kind-heavy chapter coverage while keeping the visible reading surface below density thresholds.
- Expanded `scripts/validate/audit-content-readiness.mjs` with variety gates for context-function chapters, form-function chapters, chapters/epilogue without theme notes, and lopsided annotation-kind coverage.
- New variety gates all report zero: every relevant chapter has function-appropriate context/form coverage, every chapter and epilogue has at least one theme note, and no chapter is dominated by a single annotation kind above the configured threshold.
- Current annotation-kind totals are 495 context, 91 difficult-material, 161 form, 19 map, 144 teacher-note, and 549 theme.
- Current totals are 1,459 annotations, 303 glossary entries, 178 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; annotation-density warnings remain zero, all three sidebar paths still report 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Twelve-Note Whole-Book Annotation Floor

- Added `scripts/content/fortieth-twelve-note-floor-pass.mjs` and `npm.cmd run content:expand:twelve-note-floor`.
- Raised the chapter/epilogue annotation floor again, from at least 10 linked annotations to at least 12 linked annotations.
- Added `chapter_units_with_fewer_than_twelve_annotations` to `scripts/validate/audit-content-readiness.mjs`; it reports zero.
- Added 192 non-inline Study annotations, preserving the balanced visible highlight layer while deepening the linked Study-card apparatus.
- Final chapter/epilogue annotation distribution is now exactly 136 units with 12 annotations each.
- Current totals are 1,651 annotations, 303 glossary entries, 178 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; annotation-density warnings remain zero, all three sidebar paths still report 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Deep Apparatus Floor

- Added `scripts/content/fortyfirst-deep-apparatus-floor-pass.mjs` and `npm.cmd run content:expand:deep-apparatus-floor`.
- Raised the supporting apparatus floor for substantial displayed units to at least 3 reference cards and at least 4 glossary entries.
- Added `substantial_units_with_fewer_than_three_reference_cards` and `substantial_units_with_fewer_than_four_glossary_entries` to `scripts/validate/audit-content-readiness.mjs`; both report zero.
- Added 101 reference cards and 50 glossary entries, keeping the new records draft/provisional pending source review.
- Final substantial-unit distributions now bottom out at 3 reference cards and 4 glossary entries: 115 substantial units have exactly 3 reference cards, and 60 have exactly 4 glossary entries.
- Current totals are 1,651 annotations, 353 glossary entries, 279 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths still report 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Deep Apparatus Quality Hardening

- Tightened `scripts/content/fortyfirst-deep-apparatus-floor-pass.mjs` so deep reference cards draw from chapter-specific summary and why-it-matters text instead of reusable profile prose.
- Changed deep glossary terms and definitions to be target-specific, eliminating repeated generated terms such as repeated generic scene/work/whale handles.
- Added readiness-audit gates for `duplicate_deep_glossary_terms`, `duplicate_deep_glossary_definitions`, and `deep_reference_template_notes`; all report zero.
- Current totals remain 1,651 annotations, 353 glossary entries, 279 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths still report 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Deep Glossary Term Shape Polish

- Polished `scripts/content/fortyfirst-deep-apparatus-floor-pass.mjs` so deep glossary terms render as concept handles with chapter context, such as `scene pressure (Pipe)` and `whale knowledge (Battering-Ram)`, instead of awkward chapter-title/concept mashups.
- Tightened the generated title shortener to preserve meaningful hyphenated titles and strip stray punctuation from long chapter titles.
- Added `deep_glossary_awkward_terms` to `scripts/validate/audit-content-readiness.mjs`; it reports zero.
- Current totals remain 1,651 annotations, 353 glossary entries, 279 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths still report 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Wide Whole-Book Apparatus Floor

- Added `scripts/content/fortysecond-generated-annotation-prose-polish-pass.mjs` and `npm.cmd run content:repair:generated-annotation-prose`.
- Rewrote 459 generated floor-pass annotation notes that still carried recognizable stock phrasing from the 10-note, variety, and 12-note passes.
- Added `generated_annotation_prose_template_notes` to `scripts/validate/audit-content-readiness.mjs`; it reports zero after the polish.
- Added `scripts/content/fortythird-wide-apparatus-floor-pass.mjs` and `npm.cmd run content:expand:wide-apparatus-floor`.
- Raised the whole-book floor again to exactly 14 annotations for every numbered chapter and the epilogue, adding 272 non-inline Study annotations while preserving the visible reading density.
- Raised substantial displayed units to at least 4 reference cards and 5 glossary entries, adding 116 reference cards and 60 glossary entries.
- Added readiness gates for `chapter_units_with_fewer_than_fourteen_annotations`, `substantial_units_with_fewer_than_four_reference_cards`, and `substantial_units_with_fewer_than_five_glossary_entries`; all report zero.
- Current totals are 1,923 annotations, 413 glossary entries, 395 reference cards, 43 source records, 52 geography places, 45 taxonomy trails, 99 taxonomy entities, 28 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Short-Unit And Route Registry Expansion

- Added `scripts/content/fortyfourth-short-unit-apparatus-floor-pass.mjs` and `npm.cmd run content:expand:short-unit-apparatus-floor`.
- Closed the short-chapter apparatus loophole by requiring every displayed chapter and epilogue, not just substantial units, to carry at least 2 reference cards and 3 glossary entries.
- Added 5 short-unit reference cards and 4 short-unit glossary entries for previously under-supported compact chapters.
- Added `displayed_chapter_units_with_fewer_than_two_reference_cards` and `displayed_chapter_units_with_fewer_than_three_glossary_entries` to `scripts/validate/audit-content-readiness.mjs`; both report zero.
- Added `scripts/content/fortyfifth-registry-route-expansion-pass.mjs` and `npm.cmd run content:expand:registry-route-expansion`.
- Expanded navigational and thematic registries with 10 trails, 16 entities, 12 geography places, and 12 route waypoints, all kept draft/provisional with display-anchor coordinate language.
- Current totals are 1,923 annotations, 417 glossary entries, 400 reference cards, 43 source records, 64 geography places, 55 taxonomy trails, 115 taxonomy entities, 40 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, the story map renders 40 waypoints, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Subagent Quality Audit Repairs

- Used two `gpt-5.4-mini` subagent auditors: one reviewed generated prose in annotations/glossary/references, and one reviewed non-annotation coverage across geography, source records, taxonomy, and route data.
- Repaired the short-unit apparatus generator so paired short-unit reference cards and glossary entries vary by focus term instead of duplicating prose.
- Added `wide_reference_template_notes`, `wide_glossary_template_definitions`, `generated_support_reference_duplicate_notes`, and `generated_support_glossary_duplicate_definitions` gates; all report zero.
- Patched `scripts/content/thirtieth-thin-unit-annotation-floor-pass.mjs` so future thin-unit floor annotations use unit-specific notes.
- Added `scripts/content/fortysixth-thin-floor-prose-polish-pass.mjs` and `npm.cmd run content:repair:thin-floor-prose`; it rewrote 67 old `floor-pass-*` annotations that repeated generic prose families.
- Added `thin_floor_repeated_template_notes` and `duplicate_thin_floor_notes` gates; both report zero.
- Canonicalized the duplicate NOAA right-whale source by replacing `noaa-right-whale` citations with `noaa-north-atlantic-right-whale` and removing the redundant source record.
- Added `scripts/content/fortyseventh-geography-coverage-floor-pass.mjs` and `npm.cmd run content:expand:geography-coverage-floor`.
- Added 10 grouped geography coverage places and 10 supporting taxonomy entities, covering 73 chapter/epilogue units that previously had no geography place target.
- Expanded the readiness audit to include geography/map counts, `displayed_chapter_units_without_geography_place`, and `duplicate_source_record_urls`; both new gap gates report zero.
- Current totals are 1,923 annotations, 417 glossary entries, 400 reference cards, 42 source records, 74 geography places, 55 taxonomy trails, 125 taxonomy entities, 40 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, the story map renders 40 waypoints, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Map And Source Integrity Gates

- Added `scripts/content/fortyeighth-map-integrity-pass.mjs` and `npm.cmd run content:repair:map-integrity`.
- Added a `Nightgown Room` waypoint so Chapter 11 is covered by the route map, raising the story-map total from 40 to 41 waypoints.
- Offset five duplicate display coordinates so distinct waypoints no longer stack on identical coordinates while still remaining classroom display anchors rather than reconstructed route claims.
- Added readiness-audit gates for `voyage_waypoint_uncovered_chapters` and `duplicate_voyage_waypoint_coordinates`; both report zero.
- Added `duplicate_support_source_record_titles` to the readiness audit.
- Removed the unused duplicate `matthew-maury-physical-geography-sea` source record, preserving the cited `matthew-fontaine-maury` record.
- Current totals are 1,923 annotations, 417 glossary entries, 400 reference cards, 41 source records, 74 geography places, 55 taxonomy trails, 125 taxonomy entities, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, the story map renders 41 waypoints, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Apparatus Label Quality Gates

- Used two `gpt-5.4-mini` subagent auditors for glossary/reference identity and source/status integrity.
- Fixed an idempotence flaw in `scripts/content/fortyfirst-deep-apparatus-floor-pass.mjs`: the deep layer now maintains its own explicit one-per-substantial-unit floor instead of disappearing after later support floors satisfy total counts.
- Expanded the deep support layer to 134 deep reference cards and 134 deep glossary entries, one for every substantial displayed unit.
- Reworked generated glossary labels away from internal parenthetical handles such as `scene pressure (...)`, `local emphasis (...)`, and `whale knowledge (...)`; deep labels now use chapter-numbered `Ch. N Title: wider focus` terms, while wide and short labels use cleaner chapter/focus terms.
- Reworked wide reference titles to remove `Passage Lens` and give each generated card a student-facing `Title: What to Notice` label.
- Added `scripts/content/fortyninth-apparatus-identity-polish-pass.mjs` and `npm.cmd run content:repair:apparatus-identity`.
- Polished duplicate display identities for `ambergris`, `crotch`, and the final chase structure cards.
- Added readiness-audit gates for `generated_glossary_internal_labels`, `duplicate_glossary_terms_by_target`, and `duplicate_reference_titles_by_target`; all report zero.
- Current totals are 1,923 annotations, 491 glossary entries, 418 reference cards, 41 source records, 74 geography places, 55 taxonomy trails, 125 taxonomy entities, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, the story map renders 41 waypoints, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Source And Taxonomy Canonicalization Gates

- Added `scripts/content/fiftieth-source-taxonomy-canonicalization-pass.mjs` and `npm.cmd run content:repair:source-taxonomy-canonicalization`.
- Collapsed duplicate taxonomy identities such as `captain-peleg` into `peleg`, ship-name variants into their canonical ship records, and `the-cook` into `fleece`, preserving alternate names as aliases.
- Promoted actively cited support sources out of `needs-review` into `provisional` while retaining bibliographic-review notes.
- Patched earlier registry expansion scripts so rerunning them will not recreate the duplicate taxonomy entities.
- Added readiness-audit gates for `actively_cited_sources_still_needs_review` and `duplicate_taxonomy_alias_entities`; both report zero.
- Current totals are 1,923 annotations, 491 glossary entries, 418 reference cards, 41 source records, 74 geography places, 55 taxonomy trails, 117 taxonomy entities, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, the story map renders 41 waypoints, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Teacher Packet And Explore Index Expansion

- Used two `gpt-5.4-mini` subagent auditors to choose the next whole-book expansion: one recommended teacher-only chapter packets, and one identified missing entity/source/search/teacher indexes.
- Added `scripts/content/fiftyfirst-teacher-discussion-floor-pass.mjs` and `npm.cmd run content:expand:teacher-discussion-floor`, adding 141 non-inline teacher discussion prompts so every displayed reading unit has at least two teacher notes.
- Added `schemas/teacher-packet.schema.json`, `scripts/content/fiftysecond-teacher-packet-pass.mjs`, `npm.cmd run content:expand:teacher-packets`, and `data/teacher/moby-dick.teacher-packets.json`.
- Generated 136 chapter/epilogue teacher packets with essential questions, three linked discussion prompts, likely misreadings, difficult-material handles, reference/trail/annotation links, takeaways, provenance, and teacher review queues.
- Expanded `scripts/ingest/build-annotation-indexes.mjs` to generate `annotations-by-entity`, `annotations-by-source`, `search-documents`, and `teacher-review` indexes, and extended validation to check their parity against source data.
- Added `scripts/content/fiftythird-entity-index-floor-pass.mjs` and `npm.cmd run content:expand:entity-index-floor`, adding 82 non-inline Explore annotations for source-text-findable taxonomy entities.
- Raised indexed entity coverage from 14 to 96 of 117 entities; the remaining uncovered entities are not directly findable by current label/alias search.
- Added readiness-audit gates for two-teacher-note coverage, teacher packet coverage/prompt links/review status, search/teacher packet facets, and source-text-findable unindexed entities; all report zero.
- Hardened `scripts/dev/cdp-smoke.mjs` so browser smoke tests clear persisted local state and match Study note cards by annotation id instead of first-card position.
- Current totals are 2,146 annotations, 491 glossary entries, 418 reference cards, 41 source records, 136 teacher packets, 142 search documents, 142 teacher-review units, 74 geography places, 55 taxonomy trails, 117 taxonomy entities, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Trail And Source Index Floors

- Added `scripts/content/fiftyfourth-trail-index-floor-pass.mjs` and `npm.cmd run content:expand:trail-index-floor`, adding 35 non-inline Explore notes for taxonomy trails that had no inbound annotation edge.
- Expanded `scripts/ingest/build-annotation-indexes.mjs` with `annotations-by-trail.json` and validation parity checks; all 55 taxonomy trails now have indexed annotations.
- Added `source-usage.json`, a cross-content source index that counts source usage across annotations, glossary entries, reference cards, taxonomy entities, and geography places.
- Added `scripts/content/fiftyfifth-source-index-floor-pass.mjs` and `npm.cmd run content:expand:source-index-floor`, adding 32 non-inline source-index notes so every source record participates in the annotation-source graph.
- Promoted 5 newly active source records from `needs-review` to `provisional` with explicit bibliographic-review notes; no active cited source remains in `needs-review`.
- Added readiness-audit gates for `taxonomy_trails_without_indexed_annotations` and `source_records_without_indexed_annotations`; both report zero.
- Current totals are 2,213 annotations, 491 glossary entries, 418 reference cards, 41 source records, 136 teacher packets, 142 search documents, 142 teacher-review units, 74 geography places, 55 indexed taxonomy trails, 117 taxonomy entities, 41 indexed source records, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Full Entity And Displayed-Unit Teacher Packet Coverage

- Expanded `scripts/content/fiftysecond-teacher-packet-pass.mjs` so teacher packets cover every displayed reading unit, not only chapters and the epilogue; the blank half-title remains intentionally exempt.
- Raised teacher packet coverage from 136 to 141 packets, adding frontmatter packets for title page, imprint, dedication, etymology, and extracts.
- Added `scripts/content/fiftysixth-entity-registry-floor-pass.mjs` and `npm.cmd run content:expand:entity-registry-floor`, adding 21 non-inline registry anchors for abstract or nonliteral taxonomy entities that are not directly findable by label/alias.
- Added the readiness-audit gate `taxonomy_entities_without_indexed_annotations`; it reports zero.
- Current totals are 2,234 annotations, 491 glossary entries, 418 reference cards, 41 source records, 141 teacher packets, 142 search documents, 142 teacher-review units, 74 geography places, 55 indexed taxonomy trails, 117 indexed taxonomy entities, 41 indexed source records, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Apparatus Graph Crosslinks

- Added `scripts/content/fiftyseventh-apparatus-crosslink-pass.mjs` and `npm.cmd run content:repair:apparatus-crosslinks`.
- Connected existing reference cards and glossary entries into the annotation graph by adding missing `supports-reference` and `defines-term` relationships to same-unit annotations.
- Added 572 reference-card links and 1,346 glossary-entry links without adding new reader-visible notes.
- Raised relationship coverage to 604 `supports-reference` links and 1,393 `defines-term` links.
- Added readiness-audit gates for `reference_cards_without_annotation_links` and `glossary_entries_without_annotation_links`; both report zero.
- Current totals remain 2,234 annotations, 491 glossary entries, 418 reference cards, 41 source records, 141 teacher packets, 142 search documents, 142 teacher-review units, 74 geography places, 55 indexed taxonomy trails, 117 indexed taxonomy entities, 41 indexed source records, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Review Queue And Unit Readiness Ledger

- Expanded `scripts/ingest/build-annotation-indexes.mjs` to generate `data/indexes/review-queue.json`, a cross-content review queue spanning annotations, glossary entries, reference cards, teacher packets, sources, taxonomy, geography, and map waypoints.
- Extended `data/indexes/teacher-review.json` with per-unit `readiness_state` and `blockers` fields so editorial work is grouped by reading unit.
- Added validation for review queue item targets, priorities, readiness states, and blocker counts in `scripts/validate/validate-basic.mjs`.
- Added readiness/audit reporting for review queue item count, queue count, and unit readiness distribution in `scripts/validate/audit-content-readiness.mjs`.
- Current review ledger totals are 3,612 review items across 6 queues, with unit readiness at 85 blocked, 56 reviewing, and 1 exempt blank unit.
- Current content totals remain 2,234 annotations, 491 glossary entries, 418 reference cards, 41 source records, 141 teacher packets, 142 search documents, 142 teacher-review units, 74 geography places, 55 indexed taxonomy trails, 117 indexed taxonomy entities, 41 indexed source records, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Difficult-Material Review Categories

- Added `scripts/content/fiftyeighth-difficult-material-category-pass.mjs` and `npm.cmd run content:repair:difficult-material-categories`.
- Tagged all 91 difficult-material annotations with reviewed category tags for race/colonial language, religious prejudice, mental-health language, violence/body harm, slavery/coercion language, or general difficult material.
- Expanded `scripts/ingest/build-annotation-indexes.mjs` to generate `data/indexes/difficult-material-review.json`, grouping difficult-material notes by category and unit.
- Added validation and readiness-audit gates requiring every difficult-material annotation to carry a difficulty category; `difficult_material_annotations_without_category` reports zero.
- Current difficult-material review index covers 91 annotations across 6 categories: race/colonial language, mental-health language, violence/body harm, religious prejudice, slavery/coercion language, and general difficult material.
- Current content totals remain 2,234 annotations, 491 glossary entries, 418 reference cards, 41 source records, 141 teacher packets, 142 search documents, 142 teacher-review units, 74 geography places, 55 indexed taxonomy trails, 117 indexed taxonomy entities, 41 indexed source records, 41 map waypoints, and 142 summary seeds.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, `npm.cmd run smoke:browser`, `npm.cmd run check:sidebar-all`, and `npm.cmd run check:study-anchors-all`; all three sidebar paths report all 142 units, and the whole-book Study scan checked 880 rendered terms with zero boundary problems and zero suspicious clipped fragments.

## 2026-06-07 - Academic Recovery Gate

- Reoriented the project against the published Shakespeare Portal standard: annotation quality, source support, adversarial review, and reader usefulness now take priority over raw apparatus count.
- Added `docs/ACADEMIC_RECOVERY_PLAN.md` to make the recovery strategy explicit: freeze expansion, treat current notes as draft material, pilot strict editorial review on representative chapters, and promote only genuinely useful notes.
- Tightened `docs/CONTENT_STANDARDS.md` with a publication gate: public Study annotations must solve a real reader problem, avoid generated/scaffold language, avoid safetyist framing, and carry `status.content_status: "student-ready"`.
- Patched the reader so Study cards use only reader-surface annotations that are `student-ready`; review/index/source scaffolds no longer appear merely because they share a reading unit.
- Added readiness-audit counts for `public_study_annotations` and `reader_surface_draft_annotations`, plus a gap list for reader-surface annotations that are not student-ready.

## 2026-06-07 - Annotation Recovery Quality Gates

- Added `scripts/content/recover-annotation-quality-gates.mjs` and `npm.cmd run content:recover:annotation-quality`.
- Purged draft and review annotations from the public reader surface while preserving them for index/search/trail/teacher/review use.
- Demoted over-promoted public notes that still carried `needs-review` evidence, then promoted a three-note pilot for Chapter 1, Chapter 14, and Chapter 36 with verified source-text evidence, reviewed provenance, empty review queues, and adversarial-review metadata.
- Hardened `scripts/validate/validate-basic.mjs` so any reader-facing annotation must be `student-ready`, citation-verified, Study-depth, and out of all review queues; any `student-ready` annotation must also have `selector-resolves`, `primary-source-checked`, and `adversarial-review` evidence.
- Added a public-note prose gate that rejects old scaffold residue such as "useful study hinge," "pressure point," review instructions, and source-index/taxonomy-index language in `student-ready` annotations.
- Rebuilt annotation selectors and indexes. Current audit truth: 2,234 total annotations, 3 public Study annotations, and 0 reader-surface draft annotations.

## 2026-06-07 - Public Annotation Candidate Queue And Second Pilot

- Added `scripts/ingest/build-public-annotation-candidates.mjs` and `npm.cmd run ingest:public-candidates`.
- Added `data/indexes/public-annotation-candidates.json`, a generated editorial queue classifying every annotation as public-ready, review-for-promotion, possible-rewrite, likely-retire-or-internal-only, tone-and-source-review, or low-value-draft.
- Added public-candidate parity checks to `scripts/validate/validate-basic.mjs` and surfaced queue counts/lists in `scripts/validate/audit-content-readiness.mjs`.
- Added the public-candidate step to `npm.cmd run prepare:data` and documented it in `docs/PIPELINE.md`.
- Fixed `scripts/content/recover-annotation-quality-gates.mjs` so future valid student-ready notes are not demoted merely because they were not in the original three-note pilot.
- Added `scripts/content/promote-public-study-pilot-expansion.mjs` and `npm.cmd run content:promote:public-study-pilot`, promoting 12 more reviewed Study notes across early, middle, and late chapters.
- Current recovery audit: 2,234 total annotations, 15 public Study annotations, 0 reader-surface draft annotations, 475 review-for-promotion candidates, 84 rewrite candidates, 1,569 likely internal/retire records, and 98 Classroom Standard chapter/epilogue units still without public Study notes.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, and `npm.cmd run build`.

## 2026-06-07 - Scaffold Retirement And Third Public Pilot

- Added `scripts/content/retire-low-quality-annotation-scaffolds.mjs` and `npm.cmd run content:retire:scaffolds`.
- Tagged 1,284 low-quality generated scaffold annotations with `quality:scaffold`, `review:internal-only`, and `review:retire-candidate`, moved them to Explore depth, disabled inline display, and restricted them to internal index/review surfaces.
- Extended annotation provenance with a `retired` date and added validation requiring internal/retire annotations to stay non-inline, non-reader, non-Study, review-visible, and retirement-dated.
- Split the public-candidate queue so teacher notes are tracked as `teacher-only-internal` rather than confused with failed public candidates.
- Expanded `scripts/content/promote-public-study-pilot-expansion.mjs` to 27 curated public Study promotions.
- Current recovery audit: 2,234 total annotations, 30 public Study annotations, 0 reader-surface draft annotations, 460 review-for-promotion candidates, 84 rewrite candidates, 1,284 retired/internal scaffold records, 285 teacher-only internal records, 0 ambiguous likely internal/retire records, and 88 Classroom Standard chapter/epilogue units still without public Study notes.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, and `npm.cmd run build`.

## 2026-06-07 - Public Glossary And Reference Gates

- Found and closed a reader leak: the Astro payload previously included all 491 glossary entries and 418 reference cards even though they were draft or needs-review.
- Updated `src/lib/guide-data.js` so the public app receives only glossary entries with `definition_status: "student-ready"` and `citation_status: "verified"`, and only reference cards with `content_status: "student-ready"` and `citation_status: "verified"`.
- Added `scripts/content/promote-public-glossary-reference-pilot.mjs` and `npm.cmd run content:promote:public-glossary-reference`.
- Promoted 15 essential glossary entries and 5 source-text-supported reference cards for public reader use.
- Added validation gates requiring public glossary/reference items to have verified citations, useful length, and no scaffold/review prose residue.
- Expanded the readiness audit with public glossary/reference counts and public payload draft checks.
- Current public payload: 30 public Study annotations, 15 public glossary entries, 5 public reference cards, 0 reader-surface draft annotations, 0 draft glossary entries in payload, and 0 draft reference cards in payload.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct `loadGuideData()` payload counts, and `npm.cmd run build`.

## 2026-06-07 - Public Payload Isolation

- Found and closed a deeper payload leak: the reader UI rendered only public Study notes, but the page JSON still shipped all 2,234 annotations, the full per-unit annotation index, and all teacher packets.
- Updated `src/lib/guide-data.js` so public `annotations` and `annotationIndex` include only reader-surface, verified, `student-ready` Study annotations.
- Removed teacher packets from the public payload entirely; teacher packets remain available in authored data and generated review indexes.
- Added hard validation requiring the public payload annotation list, per-unit annotation index, glossary, reference cards, and teacher-packet field to match public exposure rules.
- Expanded the readiness audit with public payload annotation counts, annotation-index counts, draft-annotation leak checks, and teacher-packet leak checks.
- Verified the built `dist/index.html` payload directly: 30 annotations, 30 indexed annotations, 15 glossary entries, 5 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold id hits such as `classroom-second-anchor`, `ten-note-floor`, `source-index-`, `teacher-review-chapter`, `floor-pass-`, `review:internal-only`, or `review:retire-candidate`.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs --json`, direct built-payload parsing, and `npm.cmd run build`.

## 2026-06-07 - Classroom Study Recovery Ledger

- Expanded `scripts/ingest/build-public-annotation-candidates.mjs` with a unit-level `classroom_recovery_queue` for the 88 Classroom Standard chapter/epilogue units that still lack public Study notes.
- The recovery queue ranks missing public Study units by classroom level and available candidate strength, embeds the top candidate records, and assigns recovery actions: `review-existing-candidate`, `review-difficult-material`, `rewrite-existing-anchor`, or `write-fresh-note`.
- Added generated counts for recovery units with review candidates, rewrite candidates, and fresh-note needs. Current state: 88 missing classroom units, 88 with reviewable candidates, 0 rewrite-only units, and 0 fresh-note units.
- Hardened `scripts/validate/validate-basic.mjs` so the recovery queue must cover exactly the missing classroom units, avoid duplicate units, preserve valid candidate anchors/notes, and keep embedded candidates tied to their true source units.
- Expanded `scripts/validate/audit-content-readiness.mjs` and `docs/PIPELINE.md` so the queue is visible as the next whole-book public Study ledger.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, and `npm.cmd run build`.

## 2026-06-07 - Fourth Public Study Promotion Batch

- Used the new classroom recovery queue to review the next missing Classroom Standard units and promoted only concrete, source-text-anchored notes with useful public prose.
- Expanded `scripts/content/promote-public-study-pilot-expansion.mjs` with 13 additional reviewed promotions covering chapters 11, 12, 18, 26, 28, 40, 41, 44, 46, 53, 71, 78, and 81.
- Rejected several high-ranked candidates from immediate promotion because they still carried template-style prose or needed a full rewrite, including current top candidates in chapters 42, 54, and 89.
- Public Study annotations rose from 30 to 43; Classroom Standard chapter/epilogue units without public Study fell from 88 to 75.
- Public payload remains clean: 43 annotations, 43 indexed annotations, 15 glossary entries, 5 reference cards, 0 teacher packets, and 0 draft public payload leaks.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, and `npm.cmd run build`.

## 2026-06-07 - Fifth Public Study Promotion Batch

- Continued from the classroom recovery queue and promoted 22 more source-text-anchored Study notes after rewriting the public prose.
- New public coverage includes chapters 3, 8, 13, 17, 21, 27, 30, 54, 87, 89, 93, 100, 113, 119, 122, 123, 129, 130, 131, 132, 135, and the epilogue.
- Kept several high-ranked but still template-shaped or externally allusive candidates out of public Study for now, including current recovery leads in chapters 42, 99, 109, 115, 124, 126, and 133.
- Public Study annotations rose from 43 to 65; Classroom Standard chapter/epilogue units without public Study fell from 75 to 53.
- Public payload remains clean: 65 annotations, 65 indexed annotations, 15 glossary entries, 5 reference cards, 0 teacher packets, and 0 draft public payload leaks.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, and `npm.cmd run build`.

## 2026-06-07 - Classroom Public Study Coverage Closed

- Tightened the public prose gate and public-candidate scorer against generated annotation machinery phrases: `passage-level study point`, `close-reading checkpoint`, `The note points`, `is worth pausing over`, `The phrase "..."`, `Use "..."`, and `In [chapter], "..."`.
- The stricter scorer demoted 95 generated-fragment or machinery-note candidates to likely internal/retire, keeping them out of promotion priority.
- Promoted 53 more reviewed Study annotations across two batches, always rewriting the public prose and avoiding allusion-heavy leads where the promotion script could not preserve a fuller external source trail.
- Public Study annotations rose from 65 to 118.
- Classroom Standard chapter/epilogue units without public Study fell from 53 to 0; the generated `classroom_recovery_queue` is now empty.
- Current public payload is clean: 118 annotations, 118 indexed annotations, 15 glossary entries, 5 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct built `dist/index.html` payload parsing, and `npm.cmd run build`.

## 2026-06-07 - Whole-Book Public Study Coverage Closed

- Extended `scripts/ingest/build-public-annotation-candidates.mjs` with `whole_book_units_without_public_ready` and `whole_book_recovery_queue`, tracking every non-frontmatter Full Text unit that still lacks public Study.
- Hardened `scripts/validate/validate-basic.mjs` so the whole-book recovery queue must cover exactly the missing non-frontmatter units, avoid duplicates, preserve candidate anchors/notes, and keep embedded candidates tied to their source units.
- Expanded `scripts/validate/audit-content-readiness.mjs` and `docs/PIPELINE.md` to report whole-book public Study gaps and recovery actions alongside Classroom Standard gaps.
- Promoted 23 optional-chapter Study annotations from the whole-book recovery queue, rewriting public prose and choosing source-text-supported notes over difficult-material or generated-template candidates.
- Demoted the previously unsafe `shark-massacre-delayed-labor` public candidate back to internal review and promoted `broad-apparatus-chapter-066-the-shark-massacre-1` instead; the demoted difficult-material note now has `tone-review` evidence and remains in citation/source/tone review.
- Public Study annotations rose from 118 to 141, giving every non-frontmatter chapter and epilogue at least one public Study annotation.
- Whole-book units without public Study fell from 23 to 0; both `classroom_recovery_queue` and `whole_book_recovery_queue` are now empty.
- Current public payload is clean: 141 annotations, 141 indexed annotations, 15 glossary entries, 5 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct built `dist/index.html` payload parsing, and `npm.cmd run build`.

## 2026-06-07 - Public Apparatus Recovery Queue

- Added `scripts/ingest/build-public-apparatus-candidates.mjs` and `npm.cmd run ingest:public-apparatus-candidates`.
- Added `data/indexes/public-apparatus-candidates.json`, classifying every glossary entry and reference card as public-ready, review-for-promotion, possible-rewrite, review-needed, likely internal/retire, or low-value draft.
- Added generated `glossary_recovery_queue` and `reference_recovery_queue` ledgers showing non-frontmatter units that still lack public glossary/reference support and the best candidate item for each gap.
- Added public apparatus queue parity checks to `scripts/validate/validate-basic.mjs` and surfaced apparatus counts/gaps in `scripts/validate/audit-content-readiness.mjs`.
- Added the public apparatus candidate build step to `npm.cmd run prepare:data` and documented it in `docs/PIPELINE.md`.
- Promoted 30 additional public glossary entries and 12 additional public reference cards while preserving existing citation trails.
- Public glossary entries rose from 15 to 45, and public reference cards rose from 5 to 17.
- Public glossary unit gaps fell from 99 to 53; public reference unit gaps fell from 123 to 95.
- Current public payload is clean: 141 annotations, 141 indexed annotations, 45 glossary entries, 17 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct built `dist/index.html` payload parsing, and `npm.cmd run build`.

## 2026-06-07 - Second Public Apparatus Promotion Batch

- Expanded `scripts/content/promote-public-glossary-reference-pilot.mjs` with another reviewed apparatus batch, including core sea terms, shipboard ranks, right-whale vocabulary, Ahab/Starbuck context, storm/navigation cards, late mercy tests, and final chase structure.
- Rewrote promoted reference summaries and reader notes to remove classroom-instruction residue such as "use this card" and "students should".
- Public glossary entries rose from 45 to 89, and public reference cards rose from 17 to 58.
- Public glossary unit gaps fell from 53 to 14; public reference unit gaps fell from 95 to 23.
- Current public payload is clean: 141 annotations, 141 indexed annotations, 89 glossary entries, 58 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct built `dist/index.html` payload parsing, and `npm.cmd run build`.

## 2026-06-07 - Public Apparatus Coverage Closed

- Completed the remaining public apparatus recovery queue by promoting or rewriting the last glossary and reference candidates needed for non-frontmatter coverage.
- Extended `scripts/content/promote-public-glossary-reference-pilot.mjs` so promoted public labels can be rewritten alongside definitions, summaries, and reader notes; this removed generated label residue such as "compressed labor detail" from the public payload.
- Public glossary entries rose from 89 to 114, and public reference cards rose from 58 to 80.
- Public glossary unit gaps fell from 14 to 0; public reference unit gaps fell from 23 to 0. Both `public_glossary_recovery_queue` and `public_reference_recovery_queue` are now empty.
- Current public payload is clean: 141 annotations, 141 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct built `dist/index.html` payload parsing with the stricter residue list, and `npm.cmd run build`.

## 2026-06-07 - Public Study Depth Batch

- Reviewed the high-ranked public annotation promotion queue after apparatus recovery closed.
- Promoted 18 additional Study notes focused on whaling labor, shipboard technique, whale representation, classification, extraction, and commodity chains.
- Skipped current high-ranked biblical allusion and difficult-material candidates where a stronger citation or tone-review trail should be added before public promotion.
- Public Study annotations rose from 141 to 159 while public apparatus coverage stayed closed: 0 public glossary gaps and 0 public reference gaps.
- Current public payload is clean: 159 annotations, 159 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct built `dist/index.html` payload parsing with the stricter residue list, and `npm.cmd run build`.

## 2026-06-07 - Public Allusion Support Gate

- Added a support-source validation gate for student-ready Study notes that make explicit biblical, classical/literary, or Peter the Great allusion claims.
- Added `britannica-peter-the-great` as a provisional source record for the Czar Peter/Peter the Great allusion in Queequeg's biography.
- Updated `scripts/content/promote-public-study-pilot-expansion.mjs` so selected Study promotions can preserve support citations and contextual evidence types instead of flattening every promoted note to source-text-only evidence.
- Repaired existing public allusion Study notes with support citations such as `king-james-bible`, `jonah-kjv-crossref`, and `britannica-peter-the-great`.
- Promoted two additional supported biblical-allusion Study notes for Belshazzar's writing and Herod's murdered Innocents.
- Public Study annotations rose from 159 to 161. Public apparatus coverage remains closed: 0 public glossary gaps and 0 public reference gaps.
- Current public payload is clean: 161 annotations, 161 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, a direct allusion-support check with 0 failures, direct built `dist/index.html` payload parsing with the stricter residue list, and `npm.cmd run build`.

## 2026-06-07 - Public Difficult-Material Tone Signal Gate

- Added a validation gate for student-ready Study notes whose public prose names race, colonial language, religious prejudice, slavery/coerced labor, harmful analogy, imperial context, or stigmatizing mental-health language.
- Public notes with those signals must now include `tone-review` evidence, even when their annotation kind remains `context` or `theme` rather than `difficult-material`.
- Updated `scripts/content/promote-public-study-pilot-expansion.mjs` so the existing public signal notes replay with tone-review evidence instead of being one-off data edits.
- Verified directly that 0 public Study notes with difficult-material signal language lack tone-review evidence.
- Public Study annotations remain 161. Public apparatus coverage remains closed: 0 public glossary gaps and 0 public reference gaps.
- Current public payload is clean: 161 annotations, 161 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `node scripts/validate/audit-content-readiness.mjs`, direct tone-signal check with 0 failures, direct built `dist/index.html` payload parsing with the stricter residue list, and `npm.cmd run build`.

## 2026-06-07 - Public Source Readiness Ledger

- Added `scripts/ingest/build-public-source-readiness.mjs` and `npm.cmd run ingest:public-source-readiness`.
- Added `data/indexes/public-source-readiness.json`, a public-only source ledger covering citations used by public Study annotations, public glossary entries, and public reference cards.
- Wired the source-readiness step into `npm.cmd run prepare:data`.
- Hardened `scripts/validate/validate-basic.mjs` so the new ledger must exactly match public citations, public usages must point only to public items, source states must match source records, and public `needs-review` sources fail validation as `blocked-source`.
- Surfaced public source counts and the bibliographic review queue in `scripts/validate/audit-content-readiness.mjs`.
- Current source-readiness truth after the ledger install: 16 public source records, 1 ready source, 15 provisional sources queued for bibliographic review, and 0 blocked public sources.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Source Verification Batch

- Verified high-use public source records against primary source pages and promoted the matching source records to `citation_status: "verified"`.
- Promoted: `dana-two-years-before-the-mast`, `webster-1913`, `scoresby-arctic-regions-gutenberg`, `beale-sperm-whale-bhl`, `noaa-sperm-whale`, `king-james-bible`, `bulfinch-age-of-fable`, `noaa-north-atlantic-right-whale`, `melville-typee-gutenberg`, and `melville-omoo-gutenberg`.
- Updated verified records with source notes that name the verified page facts and license notes that reflect the page-level public-domain or official-source evidence.
- Public source-readiness improved to 16 public source records, 11 ready sources, 5 provisional sources queued for bibliographic review, and 0 blocked public sources.
- Remaining public source queue: `starbuck-history-of-american-whale-fishery`, `perseus-shakespeare`, `jonah-kjv-crossref`, `smithsonian-ambergris`, and `britannica-peter-the-great`.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Source Verification Closed

- Verified the remaining public source records: `starbuck-history-of-american-whale-fishery`, `jonah-kjv-crossref`, `smithsonian-ambergris`, and `britannica-peter-the-great`.
- Canonicalized public Shakespeare citations away from the provisional `perseus-shakespeare` lead and onto the verified `shakespeare-complete-works-gutenberg` source record.
- Tightened `scripts/validate/validate-basic.mjs` so public source-readiness now requires every public source to be `public-ready-source`; provisional public sources fail validation.
- Public source-readiness is now closed: 16 public source records, 16 ready sources, 0 public sources needing bibliographic review, and 0 blocked public sources.
- The content audit now reports 0 duplicate source record URLs and 0 duplicate support source titles after the Shakespeare canonicalization.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Study Depth Batch 2

- Promoted 12 additional reviewed Study annotations from the public candidate queue, focused on whaling labor choreography, classification, industry history, ordinary comfort, Ahab's emotional logic, and early-reader orientation.
- Rewrote promoted notes where needed so public prose names the real reader obstacle without adding unsupported allusion, imperial-context, or difficult-material claims.
- Preserved required support citations for the right-whale contrast note and the Jonah literalism note.
- Added an `overlaps-public-anchor` demotion rule to `scripts/ingest/build-public-annotation-candidates.mjs`; non-public promotion/rewrite candidates whose anchors overlap an existing public Study anchor in the same unit now fall out of the top promotion queue.
- Public Study annotations rose from 161 to 173. Public glossary/reference coverage and public source readiness remain closed.
- Directly checked public Study anchors for overlap: 173 public annotations, 0 overlapping public Study anchors.
- Current public payload is clean: 173 annotations, 173 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct public-overlap scan, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Study Thin-Unit Balance Batch

- Audited public Study distribution by unit: 104 non-frontmatter units still had exactly one public Study annotation before this batch.
- Promoted 13 additional reviewed Study annotations in thin public units, prioritizing source-text observations with clear reader payoff and no unsupported allusion or difficult-material burden.
- Added a hard public-overlap validation gate to `scripts/validate/validate-basic.mjs`; public Study annotations in the same unit may not have overlapping anchors.
- Public Study annotations rose from 173 to 186. Public glossary/reference coverage and public source readiness remain closed.
- Current public payload is clean: 186 annotations, 186 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Study Thin-Unit Balance Batch 2

- Audited public Study distribution again: 91 non-frontmatter units had exactly one public Study annotation before this batch.
- Promoted 14 additional reviewed Study annotations in thin public units, focused on source-text-supported orientation, pulpit/sermon form, comic prophecy, whaling technique, whale anatomy, classification, fossil scale, and the Ahab/Pip conflict.
- Left source-hungry or too-broad-anchor candidates such as phrenology, Asphaltites, Shadrach/Meshach/Abednego, Mother Carey's chickens, Pompey's Pillar, and a bare `Nantucket` anchor out of public Study for a later support-citation or rewrite pass.
- The public prose residue gate caught and blocked one classroom-instruction phrase during validation; the note was rewritten before the batch passed.
- Public Study annotations rose from 186 to 200. One-note non-frontmatter units fell from 91 to 77.
- Public glossary/reference coverage and public source readiness remain closed: 0 public glossary gaps, 0 public reference gaps, 16 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 200 annotations, 200 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Named Allusion Support Gate Tightening

- Expanded the public allusion support gate in `scripts/validate/validate-basic.mjs` so named biblical, literary, and historical-method signals are caught directly, including Shadrach/Meshach/Abednego, Potters' Field, Gomorrah, Damocles, Aladdin, and phrenology/physiognomy names such as Gall, Spurzheim, and Lavater.
- Repaired existing public phrenology notes so they cite `webster-1913` and carry `historical-context` evidence instead of relying only on the novel text.
- Promoted two additional supported biblical-context Study notes: Shadrach/Meshach/Abednego in "Stowing Down and Clearing Up" and Potters' Fields in "The Pacific"; both now cite `king-james-bible`.
- Left Asphaltites out of public Study because the Dead Sea place-name claim still needs direct place-name support before promotion.
- Public Study annotations rose from 200 to 202. One-note non-frontmatter units fell from 77 to 76.
- Public source readiness remains closed: 16 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 202 annotations, 202 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, support-citation inspection for the repaired/promoted notes, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Candidate Queue Triage Lanes

- Split `data/indexes/public-annotation-candidates.json` into clearer editorial lanes: ordinary `review-for-promotion`, `source-support-review`, `tone-and-source-review`, `possible-rewrite`, and internal/retire buckets.
- Added source-support signal detection in `scripts/ingest/build-public-annotation-candidates.mjs` for named biblical, literary, mythic, historical-method, and external-context claims such as Asphaltites/Dead Sea, Mother Carey, Greek fire, Aladdin, Pliny, Basilosaurus, and phrenology names.
- Added tone-review signal detection to the candidate builder so notes naming racialized language, empire/imperial context, slavery/coerced labor, religious prejudice, harmful analogy, or stigmatizing mental-health language move out of the ordinary promotion queue.
- Wired the new `next_source_support_queue` and `next_tone_and_source_queue` through validation and `npm.cmd run audit:content`.
- Current candidate queue truth: 202 public-ready, 24 ordinary review-for-promotion, 268 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,284 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public payload remains clean: 202 annotations, 202 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct queue inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Public Study Ordinary Queue Promotion Batch

- Reviewed the ordinary `review-for-promotion` queue after source-support and tone/source triage separated the riskier notes.
- Promoted 14 additional source-text-only Study annotations, focused on whale pictures, extraction work, shipboard hierarchy, masthead labor, the chart, whale-line danger, tools, food customs, right-whale anatomy, the Heidelburgh Tun, whale breathing, and ambergris uncertainty.
- Avoided frontmatter, source-support, tone/source, and narrow proper-name candidates in this batch; those remain in their dedicated queues.
- Public Study annotations rose from 202 to 216. Public glossary/reference coverage and public source readiness remain closed.
- Ordinary review candidates fell from 24 to 10; source-support candidates remain 268, tone/source candidates remain 73, and possible-rewrite candidates remain 2.
- Current public payload is clean: 216 annotations, 216 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct candidate queue inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Heidelberg Tun Source Support Repair

- Added the verified official Heidelberg Castle source record `heidelberg-castle-tun` for the Great Heidelberg Tun/Barrel Building.
- Tightened source-support detection so Heidelburgh/Heidelberg Tun, Denderah, Brandreth's pills, patent-medicine, and whitehorse context claims move into `source-support-review` unless support citations are present.
- Added a public validation rule requiring `heidelberg-castle-tun` support when public Study prose explains the Heidelberg Tun or Heidelberg Castle context.
- Repaired public Study notes `heidelburgh-tun-case` and `curated-midbook-chapter-077-the-great-heidelburgh-tun-the-great-heidelburgh-tun-of-the`, plus public glossary entry `heidelburgh-tun`, so they cite both `standard-ebooks-moby-dick` and `heidelberg-castle-tun`.
- Public source readiness remains closed with 17 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Candidate queue truth after reclassification: 216 public-ready, 7 ordinary review-for-promotion, 271 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,284 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Current public payload is clean: 216 annotations, 216 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, focused Heidelberg Tun citation inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Ordinary Public Promotion Queue Cleared

- Reviewed the 7 remaining ordinary `review-for-promotion` Study candidates.
- Promoted 6 distinct, source-text-supported public Study notes: `thin-unit-apparatus-chapter-101-industry-history`, `broad-apparatus-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him-2`, `curated-midbook-chapter-075-the-right-whale-s-head-contrasted-view-this-green-barnacled-thing`, `subagent-midbook-the-fountain-one-seventh-or-sunday-of-his-time`, `cabin-table-hierarchy`, and `subagent-midbook-the-sperm-whale-s-head-contrasted-view-grey-headed-whale`.
- Routed `titlepage-edition-frame` out of public contention as internal draft material; its note is too thin for Study and should not be promoted merely to annotate the title page.
- Added a candidate-scorer weak-prose guard for "frames the text as a standard edition" so similar frontmatter filler is classified as likely internal/retire instead of resurfacing as a promotion candidate.
- Candidate queue truth after replay: 222 public-ready, 0 ordinary review-for-promotion, 271 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,284 retired internal, 285 teacher-only internal, and 97 likely internal/retire.
- Public source readiness remains closed with 17 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 222 annotations, 222 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted-note inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Source-Support Queue Cleanup Batch 1

- Reviewed the top source-support candidates and separated stale citation-review items from notes that truly need external support.
- Promoted 8 distinct, source-text-supported public Study notes whose claims can be verified from the selected passage: `dedication-hawthorne`, `cetology-architect-not-builder`, `midnight-chorus-stage-play`, `broad-apparatus-chapter-053-the-gam-2`, `town-ho-secret-tragedy`, `broad-apparatus-chapter-071-the-jeroboam-s-story-2`, `broad-apparatus-chapter-081-the-pequod-meets-the-virgin-1`, and `broad-apparatus-chapter-006-the-street-1`.
- Marked 7 duplicate or overlapping candidates `review:internal-only` with retired dates instead of promoting them: `specksnyder-whaling-hierarchy`, `line-danger-labor`, `sperm-whale-head-classification`, `completion-pass-nantucket-mere-hillock-and-elbow-of-sand`, `nantucket-sand-sea-power`, `broad-apparatus-chapter-040-midnight-forecastle-2`, and `subagent-earlybook-midnight-forecastle-we-sing-they-sleep`.
- Validation enforced retirement metadata for the new internal-only demotions; the promotion script now stamps `provenance.retired` and a retirement reason for this path.
- Candidate queue truth after replay: 230 public-ready, 0 ordinary review-for-promotion, 256 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,292 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 17 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 230 annotations, 230 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - True Allusion Support Batch 1

- Verified and added two public-ready support source records: `brewer-mother-careys-chickens` for the sailor-lore phrase and `britannica-supplement-asphaltites-wikisource` for Asphaltites as an old Dead Sea name.
- Tightened public allusion validation so student-ready notes naming Mother Carey's chickens require `brewer-mother-careys-chickens`, and notes naming Asphaltites or the Dead Sea require `britannica-supplement-asphaltites-wikisource`.
- Promoted 3 source-supported public Study notes: the classical/mythic frame in "The Honor and Glory of Whaling" with `bulfinch-age-of-fable`, Mother Carey's chickens in "The Forge" with `brewer-mother-careys-chickens`, and Asphaltites in "The Whale-Watch" with `king-james-bible` plus `britannica-supplement-asphaltites-wikisource`.
- Candidate queue truth after replay: 233 public-ready, 0 ordinary review-for-promotion, 253 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,292 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 19 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 233 annotations, 233 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct allusion citation inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Source-Support Queue Cleanup Batch 2

- Continued the mixed source-support lane after the true allusion batch, separating stale citation-review notes from duplicates and thin notes.
- Promoted 8 distinct source-text-supported Study notes: `broad-apparatus-chapter-081-the-pequod-meets-the-virgin-2`, `whale-magnitude-extinction`, `broad-apparatus-chapter-017-the-ramadan-1`, `broad-apparatus-chapter-017-the-ramadan-2`, `broad-apparatus-chapter-022-merry-christmas-1`, `broad-apparatus-chapter-023-the-lee-shore-1`, `broad-apparatus-chapter-026-knights-and-squires-2`, and `curated-earlybook-chapter-030-the-pipe-my-pipe-hard-must-it-go-with-me-`.
- Marked 8 duplicate or thin candidates `review:internal-only` with retired dates: `completion-pass-the-battering-ram-dead-blind-wall`, `subagent-curated-chapter-014-nantucket-all-beach-without-a-background`, `broad-apparatus-chapter-015-chowder-1`, `subagent-curated-chapter-015-chowder-two-enormous-wooden-pots-painted-black`, `pitchpoling-specialized-skill`, `moby-dick-rumor-network`, `chart-rational-obsession`, and `subagent-curated-chapter-044-the-chart-migratory-charts-of-the-sperm-whale`.
- Candidate queue truth after replay: 241 public-ready, 0 ordinary review-for-promotion, 237 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,300 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 19 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 241 annotations, 241 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Source-Support Queue Cleanup Batch 3

- Continued the mixed source-support lane and left unsupported allusion/history claims in queue rather than promoting them without source records.
- Promoted 6 distinct source-text-supported Study notes: `subagent-earlybook-biographical-wicked-world-in-all-meridians`, `subagent-curated-chapter-048-the-first-lowering-casting-loose-the-tackles-and-bands`, `fedallah-private-crew`, `subagent-curated-chapter-052-the-albatross-skeleton-of-a-stranded-walrus`, `curated-latebook-chapter-096-the-try-works-the-only-true-lamp`, and `completion-pass-midnight-aloft-thunder-and-lightning-what-s-the-use-of-thunder`.
- Marked 5 duplicate, overlapping, or tone-risky candidates `review:internal-only` with retired dates: `curated-earlybook-chapter-039-first-night-watch-it-s-all-predestinated`, `subagent-curated-chapter-050-ahab-s-boat-and-crew-fedallah-hair-turbaned-fedallah-remained-a-muffled-mystery`, `subagent-curated-chapter-058-brit-ripe-and-golden-wheat`, `subagent-curated-chapter-062-the-dart-the-first-iron-into-the-fish`, and `subagent-curated-chapter-022-merry-christmas-no-need-of-profane-words`.
- Candidate queue truth after replay: 247 public-ready, 0 ordinary review-for-promotion, 226 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,305 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 19 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 247 annotations, 247 indexed annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public payload items, and no forbidden scaffold/template marker hits.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing with the stricter residue list.

## 2026-06-07 - Source-Support Queue Cleanup Batch 4

- Continued the mixed source-support lane and again left unsupported allusion/history claims in queue until they have support sources.
- Promoted 8 distinct source-text-supported Study notes: `completion-pass-the-log-and-line-all-the-elements-had-combined-to-rot`, `broad-apparatus-chapter-135-the-chase-third-day-1`, `chase-third-day-towards-thee`, `broad-apparatus-epilogue-epilogue-1`, `extracts-whale-scrapbook`, `broad-apparatus-chapter-009-the-sermon-2`, `knights-isolatoes`, and `subagent-curated-chapter-054-the-town-ho-s-story-as-told-at-the-golden-inn`.
- Candidate queue truth after replay: 255 public-ready, 0 ordinary review-for-promotion, 218 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,305 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 19 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 255 annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public annotations, 0 bad public glossary entries, and 0 bad public reference cards.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted-record inspection, and direct built `dist/index.html` payload parsing.

## 2026-06-07 - Source-Support Queue Cleanup Batch 5

- Continued the mixed source-support lane, promoting only source-text/form notes that were distinct from existing public Study notes and demoting duplicate or low-value records.
- Promoted 5 Study notes: `enter-ahab-stubb-command`, `first-night-watch-stubb-response`, `subagent-earlybook-the-affidavit-natural-verity-of-the-main-points`, `completion-pass-the-shark-massacre-whole-round-sea-was-one-huge-cheese`, and `curated-midbook-chapter-074-the-sperm-whale-s-head-contrasted-view-where-i-should-like-to-know-will`.
- Marked 6 duplicate, internal, or frontmatter-only candidates `review:internal-only`: `imprint-source-chain`, `pulpit-ship-church`, `broad-apparatus-chapter-053-the-gam-1`, `subagent-curated-chapter-053-the-gam-contribute-some-of-that-information`, `true-pictures-whaling-scenes`, and `broad-apparatus-chapter-071-the-jeroboam-s-story-1`.
- Candidate queue truth after replay: 260 public-ready, 0 ordinary review-for-promotion, 207 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,311 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 19 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 260 annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public annotations, 0 bad public glossary entries, and 0 bad public reference cards.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing.

## 2026-06-07 - True Allusion Support Batch 2

- Verified and added 5 support source records: `britannica-greek-fire`, `britannica-basilosaurus`, `britannica-phrenology`, `project-gutenberg-aladdin`, and `livius-cicero-damocles`.
- Tightened public validation so Greek fire and Basilosaurus claims require their specific support sources; expanded the classical/literary and phrenology support-source sets to include the new verified records.
- Promoted 6 source-supported Study notes: phrenology in "The Prairie", Jonah/anatomy in "Jonah Historically Regarded", Greek fire in "The Try-Works", Aladdin in "The Lamp", Damocles in "A Bower in the Arsacides", and Basilosaurus in "The Fossil Whale".
- Candidate queue truth after replay: 266 public-ready, 0 ordinary review-for-promotion, 201 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,311 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 24 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 266 annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public annotations, 0 bad public glossary entries, and 0 bad public reference cards.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted-record citation inspection, and direct built `dist/index.html` payload parsing.

## 2026-06-07 - Source-Support Queue Cleanup Batch 6

- Continued the mixed source-support lane by handling stale citation-review/source-text candidates after the true allusion batch.
- Promoted 6 distinct Study notes: `subagent-midbook-pitchpoling-all-fountains-must-run-wine-today`, `subagent-midbook-fast-fish-and-loose-fish-these-laws-might-be-engraven`, `broad-apparatus-chapter-099-the-doubloon-2`, `deck-command-watch`, `forecastle-bulwarks-crew-fear`, and `delight-ironic-name`.
- Marked 7 duplicate or lower-value candidates `review:internal-only`: `virgin-gam-competition`, `subagent-curated-chapter-082-the-honor-and-glory-of-whaling-careful-disorderliness-is-the-true-method`, `subagent-curated-chapter-090-heads-or-tails-there-is-no-intermediate-remainder`, `broad-apparatus-chapter-091-the-pequod-meets-the-rose-bud-1`, `broad-apparatus-chapter-121-midnight-the-forecastle-bulwarks-1`, `completion-pass-midnight-aloft-thunder-and-lightning-plenty-too-much-thunder-up-here`, and `completion-pass-midnight-aloft-thunder-and-lightning-stop-that-thunder`.
- Candidate queue truth after replay: 272 public-ready, 0 ordinary review-for-promotion, 188 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,318 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 24 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 272 annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public annotations, 0 bad public glossary entries, and 0 bad public reference cards.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing.

## 2026-06-07 - Source-Support Queue Cleanup Batch 7

- Continued the source-text cleanup lane with early-book candidates, while leaving tone-sensitive Queequeg notes out of public promotion.
- Promoted 3 distinct Study notes: `broad-apparatus-chapter-002-the-carpetbag-1`, `broad-apparatus-chapter-005-breakfast-1`, and `nightgown-shared-warmth`.
- Marked 3 duplicate or lower-value candidates `review:internal-only`: `broad-apparatus-chapter-003-the-spouter-inn-2`, `chapel-tablets-memory`, and `subagent-curated-chapter-011-nightgown-one-warm-spark-in-the-heart`.
- Candidate queue truth after replay: 275 public-ready, 0 ordinary review-for-promotion, 182 source-support-review, 73 tone-and-source-review, 2 possible-rewrite, 1,321 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 24 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 275 annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public annotations, 0 bad public glossary entries, and 0 bad public reference cards.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing.

## 2026-06-07 - Tone Gate Tightening and Source-Support Cleanup Batch 8

- Tightened tone/source triage so `prejudiced`, `exoticizing`, `savage`, `cannibal`, `civilized`, and `Pagan` language is caught, and so both public notes and public anchors are checked for tone-review support.
- Promoted 10 distinct Study notes: `broad-apparatus-chapter-012-biographical-1`, `broad-apparatus-chapter-018-his-mark-2`, `his-mark-contract-faith`, `going-aboard-shadowed-departure`, `broad-apparatus-chapter-022-merry-christmas-2`, `subagent-earlybook-the-advocate-yale-college-and-my-harvard`, `broad-apparatus-chapter-027-knights-and-squires-1`, `broad-apparatus-chapter-028-ahab-1`, `broad-apparatus-chapter-029-enter-ahab-to-him-stubb-1`, and `broad-apparatus-chapter-031-queen-mab-1`.
- Marked 11 duplicate or lower-value candidates `review:internal-only`: `broad-apparatus-chapter-013-wheelbarrow-1`, `subagent-curated-chapter-018-his-mark-he-must-show-his-papers`, `broad-apparatus-chapter-020-all-astir-1`, `merry-christmas-ahab-absence`, `completion-pass-postscript-dignity-of-whaling`, `broad-apparatus-chapter-026-knights-and-squires-1`, `subagent-curated-chapter-026-knights-and-squires-only-some-thirty-arid-summers`, `subagent-curated-chapter-028-ahab-sacred-retreat-of-the-cabin`, `pipe-renounces-comfort`, `subagent-curated-chapter-031-queen-mab-ahab-seemed-a-pyramid`, and `subagent-curated-chapter-033-the-specksnyder-literally-this-word-means-fat-cutter`.
- Candidate queue truth after replay: 285 public-ready, 0 ordinary review-for-promotion, 153 source-support-review, 81 tone-and-source-review, 2 possible-rewrite, 1,332 retired internal, 285 teacher-only internal, and 96 likely internal/retire.
- Public source readiness remains closed with 24 public-ready sources, 0 provisional public sources, and 0 blocked public sources.
- Current public payload is clean: 285 annotations, 114 glossary entries, 80 reference cards, 0 teacher packets, 0 bad public annotations, 0 bad public glossary entries, and 0 bad public reference cards.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build`, direct promoted/demoted record inspection, and direct built `dist/index.html` payload parsing.

## 2026-06-08 - Shakespeare-Grade Rubric And Pilot (New Agent Handoff)

- New agent took over. Reviewed the whole project against the sibling `Shakespeare_Portal`
  (Astro+React, per-scene routes, 11k source-cited annotations) as the explicit quality model.
- Confirmed the recovery is ~90% done: public payload is gated and clean (0 draft leaks), every
  chapter has a public note, but **258 of 285 public notes were pure `source-text-observation`** --
  thematic close-reading that teaches none of the outside knowledge a student lacks. That is the
  measurable form of the "vibe-coded" problem.
- Direction set with the user: **scholarly content first**, **strict quality-gated** (no coverage
  floors), eventual **multi-page Astro portal**. Pilot voice approved on Chapter 1.
- Built the "Shakespeare-grade" rubric on the existing `evidence[].claim_type` field rather than a
  new field. Each external-knowledge claim type now requires a non-Standard-Ebooks source:
  documented the claim-type-to-source table in `docs/CONTENT_STANDARDS.md`.
- Added a hard gate `assertPublicExternalSourceSupport` in `scripts/validate/validate-basic.mjs`
  (generalizes the named-allusion gate to every external claim type) and rubric metrics to
  `scripts/validate/audit-content-readiness.mjs` (public claim-type mix, source-text-only count,
  external-knowledge count, rule-failure count).
- Added `scripts/content/pilot-shakespeare-grade-pass.mjs`: authors clean, purpose-built public
  Study notes (not promoted scaffolds) and ensures their verified sources. Idempotent.
- Brought 3 pilot chapters to the bar across five lanes: **Ch 1 Loomings** (Ishmael/Genesis,
  Narcissus/Bulfinch, Jove/Neptune, the Fall, camel-and-needle, plus the "Who ain't a slave?"
  difficult-material/tone note), **Ch 14 Nantucket** (Partitions of Poland, 1840s Manifest
  Destiny, Psalm 107), **Ch 36 The Quarter-Deck** (the doubloon, the Pope's foot-washing/John 13,
  the harpoon-socket "murderous chalices"/Last Supper, the Leyden jar). 13 authored notes.
- Added 3 verified support sources (`britannica-partitions-of-poland`, `britannica-manifest-destiny`,
  `us-census-1860-population`), each checked against the live page via WebFetch before promotion.
- Result: public Study annotations 285 -> 298; notes teaching external knowledge 26 -> 39; public
  claim-type mix now biblical 19 / historical 12 / classical 5 / lexical 2 / nautical 1; public
  sources 24 -> 27 (all verified); 0 external-source-rule failures; 0 density warnings.
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build` (all green),
  and confirmed the 13 notes ship in `dist/index.html` with correct claim types and citations.
- Remaining: finish the pilot's cetology/nautical lane (Ch 32 via Beale/Scoresby) and a second tone
  chapter, then scale across the book through the `source-support-review` (153) and
  `tone-and-source-review` (81) queues, and upgrade the 258 inherited observation-only public notes.
- Ports: dev runs on **4330** (avoid 4321/4322, in use by another project); smoke scripts honor `APP_URL`.

## 2026-06-08 - Subagent-Assisted Scaling (Chapters 2-65)

- Built the scaled authoring pipeline: `scripts/content/_authored-notes-helper.mjs` (a safety gate
  that pre-validates every note before writing -- anchor must be a whole-word match in the displayed
  text, no overlap with existing or earlier public anchors, note length 80-420, no tone-signal without
  `tone:true`, no banned publication-gate prose) and `scripts/content/run-authored-batch.mjs` (runs a
  vetted JSON batch). Skips are reported, never silently dropped; idempotent by id.
- Division of labor (per the user's "use cheaper subagents for the heavy writing"): Sonnet subagents
  read chapters and DRAFT notes constrained to the verified-source menu, flagging any reference they
  cannot source into a `needs_source` list instead of fabricating a citation; the lead verifies
  scholarship + integrates. This keeps the original vibe-coded failure mode out.
- Ran three drafting subagents (Ch 2-9, Ch 15-23, Ch 10-13 + 24-26). Vetted output: dropped 2 notes
  that mis-cited Shakespeare for an Isaac Watts hymn, trimmed over-length notes, made race-adjacent
  notes (phrenology, Tophet) clinical with `tone:true`, fixed apostrophe/em-dash anchors. The helper
  auto-skipped notes overlapping existing public anchors (Elijah, lee-shore, phrenology already had
  public notes) -- correct, no duplication.
- Integrated 40 new authored notes across Ch 2-35 (batches in data/authored/batch-a|b|c|d.json), on top
  of the 13 pilot notes. Result: public Study annotations 285 -> 341; notes teaching external knowledge
  26 -> 82; public claim-type mix now biblical 48 / historical 12 / classical 8 / lexical 8 / nautical 6;
  0 external-source-rule failures; 0 density warnings; build green.
- A fourth subagent (Ch 27-35) closed the Ch 32 Cetology nautical lane (Scoresby, Beale, Ahaz-dial) but
  also over-reached on citations (Cloots->Manifest Destiny, Cellini->Bulfinch, Frankfurt banquet->Peter
  the Great, and three Ch 35 notes with no external source); the lead rejected all 7 in vetting -- a
  reminder that subagent scholarship MUST be human-verified before integration.
- Continued the same loop through Ch 65. WebFetch-verified 11 new Britannica sources (Carthage, Thirty
  Years' War, Becket, Thirty-Nine Articles, Quakers, Socrates, Bunyan, Cervantes, Andrew Jackson,
  Linnaeus, Holy Roman Empire) to unlock backlog refs, then ran subagents over Ch 37-50 and Ch 51-65.
  Vetting again caught and corrected real errors: a baleen note miscited to Beale (sperm whale, no
  baleen) -> retargeted to the NOAA right-whale source; Demogorgon/Achilles/scrimshander dropped for
  doubtful source coverage; "savage"/"cannibalistic"/"Imperial" prose auto-flagged by the tone gate and
  fixed; several apostrophe/em-dash anchors and one unit_id typo skipped safely by the helper.
- Cumulative session result: public Study annotations 285 -> 377; notes teaching external knowledge
  26 -> 118 (4.5x); public claim-type mix biblical 58 / historical 21 / classical 15 / lexical 12 /
  nautical 12; public sources 24 -> 34 (all verified); 0 external-source-rule failures; 0 density
  warnings; build green. The book is now annotated to the Shakespeare bar through ~Ch 65.
- Batches recorded in data/authored/batch-a..g.json; remaining refs in data/authored/needs-source-backlog.json.
- Captured `data/authored/needs-source-backlog.json`: ~25 references the subagents correctly declined
  to cite (Pequot, Quakers, Becket, Thirty-Nine Articles, Thirty Years' War, Ehrenbreitstein, Goodwin
  Sands, HMS Victory, Tyre/Carthage, Alfred/Ohthere, Burke, Krusenstern, Pliny, de Witt, Franklin/Folger,
  Bunyan, Cervantes, Jackson, Socrates, etc.). Adding + WebFetch-verifying these is the next high-yield
  step (note: britannica-peter-the-great already exists for the Czar Peter note in Ch 12).
- Reverified `npm.cmd run prepare:data`, `npm.cmd run audit:content`, `npm.cmd run build` (all green).

## 2026-06-08 - Shakespeare-Grade Scaling (Chapters 66-135 + Epilogue)

- Continued the authored-notes loop over the cetology/whaling middle and the final chase. Exported the
  exact displayed text for all 71 units (Ch 66-135 + epilogue) to scratch files with their existing
  public anchors, then ran four Sonnet drafting subagents (66-83, 84-100, 101-118, 119-135+epi)
  constrained to the verified-source menu, flagging unsourceable refs into needs_source lists.
- Vetting again caught the documented failure mode hard: subagents systematically mis-cited
  `starbuck-history-of-american-whale-fishery` (a whaling history) for Roman/Greek/European history
  (Actium, Porus, Saratoga, Justinian, Praetorian auction, Pompey's Pillar, Vidocq, Daboll, hussars,
  Quebec) and Bulfinch's mythology handbook for non-myth history (Semiramis, Hannibal, Horatii,
  Tarquin). All such notes were dropped. One note (Ch 68 "shark voracity") was fabricated -- neither
  "shark" nor "voracity" appears in the chapter -- and dropped. Of ~116 drafted, 73 were vetted in.
- Integrated 71 new public Study notes via the helper/runner (batches data/authored/batch-h*.json):
  61 in the first run, 10 after fixing Standard-Ebooks space-before-punctuation anchors ("Rachel ,",
  "multum in parvo ,", "Samuel Enderby , of London"), an accent ("vertu" -> "vertu" with grave accent),
  and two prose-gate trips. The validator's allusion gate then caught 3 lexical/classical/nautical notes
  whose prose names a biblical figure (Gabriel, Jonah) without KJV support; added king-james-bible /
  jonah-kjv-crossref to those (gate working as designed).
- Then WebFetch-verified 4 new support sources and authored 4 notes previously dropped for lack of a
  source: `milton-paradise-lost-gutenberg` (Ch 86 Satan's claw, flipped provisional -> verified),
  `britannica-pandects` (Ch 89 Justinian's Pandects), `britannica-hannibal` (Ch 105 elephants over
  millennia), `britannica-samuel-johnson` (Ch 104 the quarto Johnson). The Praetorian-auction note was
  left dropped because the Britannica Praetorian-Guard page does not cover the Didius Julianus auction.
- Cumulative session result: public Study annotations 377 -> 452 (+75); notes teaching external
  knowledge 118 -> 193; public claim-type mix biblical 80 / classical 30 / historical 31 / nautical 27 /
  lexical 25; inherited source-text-observation-only notes unchanged at 258; public sources 37 -> 41
  (all verified); 0 external-source-rule failures; 0 reader-surface draft leaks; 0 density warnings;
  prepare:data + audit:content + build all green; spot-checked the new notes ship in dist/index.html.
- Recorded the ~20 dropped-but-real Ch 66-135 references needing sources under `candidates_66_135` in
  data/authored/needs-source-backlog.json (Actium, Porus, Vidocq, Paracelsus, Kanaris, Pompey's Pillar,
  Didius Julianus, Zoroaster, Tarquin, the tone-lane slavery refs, etc.) for the next source pass.
  Note: the Britannica Battle-of-Actium /event/ and /topic/ slugs both 404'd on 2026-06-08.

## 2026-06-08 - GitHub Pages Deployment + Multi-Page Portal Redesign

- New mandate: with GitHub access available (account `JD-Jones-ASES`, scopes repo+workflow), stand up
  the public site and redesign the reader, making sure the prior single-page prototype does not
  interfere.
- **Phase A - deploy pipeline (live first to de-risk).** Set `site`/`base`/`trailingSlash` in
  astro.config.mjs (base `/moby-dick-portal`); fixed the one absolute link (`href="/"` ->
  `import.meta.env.BASE_URL`); added `.github/workflows/deploy.yml` (npm ci + `npx astro build` +
  upload-pages-artifact + deploy-pages) and `public/.nojekyll`; hardened `.gitignore` to keep
  node_modules/dist/`.claude`/screenshots, the source `.zip`, and third-party `*.pdf` out of the
  public repo. `git init`, committed, `gh repo create moby-dick-portal --public --source=. --push`,
  enabled Pages with `gh api ... -f build_type=workflow`. First run failed (Node 20 < Astro 6's
  >=22.12) -> bumped CI to Node 22; second run green. Verified https://jd-jones-ases.github.io/moby-dick-portal/
  serves 200 with base-correct assets.
- **Phase B - multi-page portal.** Replaced the single-page client reader (embedded-payload + heavy
  client JS) with static, server-rendered routes:
  - `src/lib/site.js` (base-aware hrefs, claim-type display meta, source-record lookups, path/function
    labels) and `src/lib/render.js` (server-side unit renderer: wraps validated annotation selector
    positions as inline marks, splits into paragraphs).
  - `src/components/Layout.astro` (base-aware nav, Paper/Night no-flash theme toggle, footer) and
    `src/styles/portal.css` (variable-driven themes, literary serif reader, semantic claim-type colors).
  - Routes: `/` landing dashboard (thesis, live stats, path chooser, explore tiles); `/read/[unit]/`
    for all 142 units (text + inline source-cited Study marks + notes sidebar with claim badges and
    citation links + summary card + path badges + prev/next); `/chapters/` filterable TOC;
    `/paths/`; `/glossary/`; `/sources/` (verified bibliography); `/map/` (voyage stages, display-anchor
    SVG plot); `/about/`.
  - 149 pages build green; pushed; deploy succeeded; browser-verified the landing and the Loomings
    reader render correctly (drop-cap prose, gold inline marks, BIBLICAL/CLOSE READING note cards with
    a live King James Bible source link). Removed the now-dead `src/styles/global.css`.
- Result: a live, public, multi-page student portal that rebuilds on every push. Content unchanged
  this phase (452 public Study notes / 41 verified sources). Next: source-verification backlog and
  the tone queue continue to deepen the apparatus; the portal redeploys automatically as data grows.
