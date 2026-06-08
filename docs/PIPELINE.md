# Pipeline

## Current Starter Pipeline

```powershell
node scripts/ingest/build-chapter-manifest.mjs
node scripts/ingest/build-reading-paths.mjs
node scripts/ingest/build-annotation-selectors.mjs
node scripts/ingest/build-annotation-indexes.mjs
node scripts/ingest/build-public-annotation-candidates.mjs
node scripts/ingest/build-public-apparatus-candidates.mjs
node scripts/ingest/build-public-source-readiness.mjs
node scripts/validate/validate-basic.mjs
npm.cmd run build
npm.cmd run dev
```

This reads the vendored Standard Ebooks XHTML and writes `data/chapters/moby-dick.chapter-manifest.json`.
The manifest includes six frontmatter units, all 135 numbered chapters, and the epilogue. The path generator writes route definitions under `data/paths/`. The annotation selector step refreshes exact text selectors and generated positions. The annotation index step writes per-unit, tag, density, review, search, source, teacher, and relationship indexes under `data/indexes/`. The public-candidate step writes `data/indexes/public-annotation-candidates.json`, the editorial queue for deciding what can become reader-facing Study annotation, what needs source support, what needs tone review, what needs rewrite, and what should remain internal or be retired. It also writes unit-level `classroom_recovery_queue` and `whole_book_recovery_queue` ledgers so missing public Study coverage is rebuilt by priority, using existing candidates only when they pass the recovery rubric. The public-apparatus step writes `data/indexes/public-apparatus-candidates.json`, doing the same for public glossary entries and reference cards. The public source-readiness step writes `data/indexes/public-source-readiness.json`, a public-only bibliography ledger that tracks every source used by public Study, glossary, and reference items. The validator checks reading-unit counts, chapter numbering, slugs, source paths, word counts, full-text inclusion, JSON schema parseability, source records, reading paths, annotation metadata, selector resolution, taxonomy targets, geography records, relationship targets, review queues, density warnings, public-candidate parity, classroom and whole-book recovery queue parity, public apparatus queue parity, public source-readiness parity, and generated index freshness. Astro builds the reader from `src/` into `dist/`.

## Target Pipeline

1. **Ingest**: parse Standard Ebooks XHTML into structured chapter records.
2. **Normalize**: preserve source markup while creating reader-friendly plain text and searchable text.
3. **Classify**: assign chapter functions, reading-path levels, and provisional tags.
4. **Annotate**: generate or author summaries, glossary links, and reference-card links.
5. **Index**: generate per-unit annotation packs, tag indexes, density reports, and relationship edges.
6. **Validate**: run JSON Schema checks and custom audits.
7. **Render**: build the reader site from `data/`.

## Audit Expectations

Before content ships:

- Every chapter belongs to the full-text path.
- Abridged paths have continuity notes for skipped chapters.
- Student summaries do not reveal unsupported interpretation as fact.
- Glossary definitions and reference cards are source-cited.
- The reader can surface skipped chapters on demand.
- Reader-facing Study annotations are promoted only through the publication gate: exact anchor, useful note, verified source-text support, adversarial review, no review queues, and no scaffold prose.
- The public-candidate index is the working editorial queue. Treat `review-for-promotion` as possible raw material that can be checked against the source text, `source-support-review` as blocked until support citations are added and verified, `tone-and-source-review` as blocked until tone review and any needed source support are present, `possible-rewrite` as rewrite-only, and `likely-retire-or-internal-only` as non-public unless a human rewrite starts from the source text rather than the generated note.
- The recovery queues are the annotation expansion ledgers. Use `classroom_recovery_queue` for classroom path gaps and `whole_book_recovery_queue` for the remaining full-text chapter/epilogue gaps. Work them from highest priority down: review existing candidates first, rewrite anchors second, and write fresh source-text notes where the old corpus offers nothing worth saving.
- The public apparatus queue is the glossary/reference expansion ledger. Public glossary entries and reference cards must remain verified, concise, non-scaffolded, and useful at the unit where they appear.
- The public source-readiness ledger is the bibliography publication gate. Public Study, glossary, and reference items may cite only `public-ready-source` records; `bibliographic-review-needed` and `blocked-source` must both stay at zero.
