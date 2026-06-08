# Data Model

This document describes the intended content contracts. The schemas in `schemas/` are the authority once implemented.

## Chapter Manifest

The manifest is a reading-unit manifest generated from the Standard Ebooks spine. It includes six frontmatter units, 135 numbered chapters, and the epilogue.

Each reading-unit record should include:

- `unit_id`: stable unique reading-unit ID.
- `sequence`: source reading order.
- `section_type`: `frontmatter`, `chapter`, or `epilogue`.
- `number`: integer chapter number for chapters, otherwise `null`.
- `slug`: stable chapter slug, such as `chapter-001-loomings`.
- `title`: source chapter title.
- `source_path`: path to vendored XHTML.
- `word_count`: approximate source word count.
- `functions`: literary/content functions.
- `paths`: reading-path inclusion levels.
- `summaries`: short student-facing summaries.
- `metadata_status`: confidence and citation status for provisional classification metadata.
- `citations`: sources supporting non-obvious metadata claims.

The manifest also keeps a `chapters` array as a convenience view over the numbered chapters.

Authored summaries are stored in `data/chapters/moby-dick.summary-seeds.json` and merged into the generated manifest by the ingestion script. Do not hand-edit generated manifest summaries.

## Source Record

Source records define stable citation IDs for source texts and reference material. Each record should include title, author, publisher/site, URL or local path, source note, license note, and citation status.

## Reading Path

A reading path defines a named student route through the book. It should include path goals, audience, estimated scope, chapter rules, and a rationale for omissions.

## Glossary Entry

A glossary entry defines a term, student-facing explanation, category, variants, source support, and chapter targets.

## Reference Card

A reference card is a reusable source-cited explanation for background knowledge: biblical passages, whaling practices, classical myths, historical people, shipboard hierarchy, publishing history, and interpretive concepts.

## Annotation

Annotations are chapter-linked notes for context, form, themes, difficult material, and teacher-facing guidance. They should stay concise and carry status metadata until reviewed.

Annotation records now carry a `TextQuoteSelector`-style `selector` with exact text plus prefix/suffix context. Keep the short `anchor` as the student-facing label, but use `selector` for locating the passage in source text. This matters for repeated terms such as `Queequeg`, `Ahab`, `whale`, or `coffin`.

At scale, annotation records also carry:

- `display`: depth, priority, inline visibility, surfaces, and spoiler level.
- `tags`: controlled or reviewed freeform labels for facets, trails, entities, form, themes, and review needs.
- `relationships`: namespaced edges such as `source:...`, `glossary:...`, `reference:...`, `waypoint:...`, `unit:...`, or `annotation:...`.
- `evidence`: claim type, citations, and validation layers. Every annotation needs at least one validation layer by default.
- `provenance`: author/method/date fields so generated drafts and reviewed notes do not blur together.
- `status.review_queue`: explicit work queues for citation, source-check, tone, difficult-material, interpretive, teacher, density, and selector review.

Generated annotation indexes live under `data/indexes/`:

- `annotations-by-unit.json`: per-reading-unit packs consumed by the reader.
- `annotations-by-tag.json`: tag-to-annotation and tag-to-unit lookup.
- `annotation-density.json`: density counts and warning flags.
- `annotation-edges.json`: relationship graph edges.

The authored layer policy lives in `data/annotations/moby-dick.annotation-layers.json`.

## Taxonomy

`data/taxonomy/moby-dick.taxonomy.json` defines controlled IDs for semantic trails and recurring entities. Use these IDs for annotation relationship targets such as `trail:race-empire-global-crew` or `entity:queequeg`.

The taxonomy is a seed registry, not a final interpretive index. Entries carry provisional status until their descriptions, aliases, and source trails are reviewed.

## Geography

`data/geography/moby-dick.places.json` defines place and route-stage records for future map and geography visualizations. Geography records include:

- `entity_id`: link to a registered place entity in taxonomy.
- `coordinates`: longitude/latitude pair for display.
- `coordinate_status`: `verified`, `provisional`, `display-anchor`, or `unknown`.
- `chapter_targets`: reading units connected to the place or route stage.
- `source_note`, `citations`, and status metadata.

Most current coordinates are `display-anchor` records. They support the reader map without making a verified route claim. Before publication, route points and historical place claims need cartographic or scholarly source records beyond Standard Ebooks.

## Voyage Map

The map seed defines broad route waypoints with chapter ranges and approximate display coordinates. Coordinates are UI anchors until reviewed as cartographic claims.
