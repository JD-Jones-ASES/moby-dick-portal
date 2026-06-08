# Annotation Architecture

The project should become heavily annotated without making the reader feel heavily marked up. Treat annotation as data infrastructure first and visible UI second.

## Product Rule

Over-annotate the source, but never over-display the page.

- **Read**: source text with little or no apparatus.
- **Guide**: quick orientation, summaries, essential glossary, and map/path context.
- **Study**: passage-level notes, reference cards, source trails, difficult-material notes, and interpretive layers.
- **Explore**: future faceted views, trail pages, maps, charts, concordances, and networks generated from the annotation graph.
- **Teacher**: future lesson hooks, discussion prompts, review status, source confidence, and difficult-material planning notes.

The current Queequeg case is the model: in Guide, Queequeg is a glossary term. In Study, a single selected passage can connect to a difficult-material note. The fact that the same word participates in both layers is good data; showing both layers at once is the problem.

## Storage Model

The full Standard Ebooks text remains the base layer. Annotation records should point to source text; source text should not be mutated to carry annotation meaning.

Long-term annotation records should have these parts:

```json
{
  "id": "spouter-inn-first-fear",
  "unit_id": "chapter-003-the-spouter-inn",
  "kind": "difficult-material",
  "selector": {
    "type": "TextQuoteSelector",
    "exact": "Queequeg",
    "prefix": "Don\u2019t be afraid now, said he, grinning again, ",
    "suffix": " here wouldn\u2019t harm a hair of your head.",
    "position": { "start": 30577, "end": 30585, "generated": true }
  },
  "display": {
    "depth": "study",
    "priority": 2,
    "inline": true,
    "surfaces": ["reader", "index", "review"],
    "spoiler_level": "none"
  },
  "tags": ["character:queequeg", "race-and-empire", "first-impression"],
  "relationships": [
    { "type": "defines-character", "target": "glossary:queequeg" },
    { "type": "belongs-to-trail", "target": "trail:race-and-empire" }
  ],
  "note": "Student-facing note goes here.",
  "evidence": [
    {
      "claim_type": "difficult-material",
      "citations": ["standard-ebooks-moby-dick"],
      "validation": ["selector-resolves", "needs-review"]
    }
  ],
  "citations": ["standard-ebooks-moby-dick"],
  "provenance": {
    "author": "codex",
    "created": "2026-06-06",
    "method": "source-checked-draft"
  },
  "status": {
    "content_status": "draft",
    "citation_status": "provisional",
    "review_queue": ["citation", "difficult-material", "source-check", "tone"]
  }
}
```

Current `anchor` strings are useful as a seed format, but they are not enough at scale. A repeated word like `Queequeg`, `whale`, `Ahab`, or `coffin` needs disambiguating context. The W3C Web Annotation model's `TextQuoteSelector` pattern is a good fit: store the exact selected text plus prefix/suffix context, and later add position data as a generated convenience index.

## Metadata Layers

Use controlled metadata where it supports filtering, and allow carefully reviewed freeform tags where literature needs nuance.

Core fields to add over time:

- `selector`: exact quote plus prefix/suffix, with optional generated start/end offsets.
- `display`: depth, priority, surfaces, spoiler level, and whether a mark should appear inline by default.
- `tags`: themes, characters, places, whaling topics, form, symbols, rhetoric, difficulty, and classroom use.
- `relationships`: edges to glossary entries, reference cards, map waypoints, trails, chapters, sources, and other annotations.
- `provenance`: author, reviewer, model/subagent run, source edition, citation status, and review status.
- `student_level`: first-pass, classroom, advanced, teacher-only.

Do not encode all of this into CSS classes or inline markup. Keep the data rich and let Astro generate focused views from it.

## Derived Indexes

The client should not load a giant all-annotations file for every chapter. Build generated indexes:

- `annotations-by-unit`: small per-unit packs for the reader.
- `annotations-by-tag`: tag pages, trail filters, and charts.
- `annotations-by-entity`: character/place/symbol recurrence pages.
- `annotations-by-source`: citation review and publication audit.
- `annotation-density`: heatmaps by chapter, path, trail, and kind.
- `annotation-edges`: graph data for relationships among characters, symbols, themes, places, and chapters.
- `search-documents`: search records with path, chapter, function, tag, character, and depth filters.

Astro content collections can eventually give these authored data files schema-backed loading and type safety. Pagefind can index the static output with filters supplied by generated HTML attributes. Observable Plot can use the indexes for faceted charts, heatmaps, and small multiples.

## Validation Rules

Validation should become more opinionated as annotation volume grows:

- Every selector must resolve against normalized unit text.
- Prefix/suffix should disambiguate repeated exact strings when possible.
- A single annotation should not create many visible marks unless it explicitly opts in.
- Guide mode should not expose Study-only annotation marks.
- Dense passages should trigger review warnings rather than silently covering a paragraph with highlights.
- Difficult-material notes must stay in a review queue until citation and tone are checked.
- Every relationship target must exist.
- Every public-facing claim must carry a source trail or be marked provisional.

## Astro Possibilities

At scale, the annotation graph can power much more than marginal notes:

- A "what changes if I skip this?" view comparing Narrative Core, Classroom Standard, and Full Text by theme density.
- Character trail pages that show where Ishmael, Queequeg, Ahab, Starbuck, Stubb, Flask, Fedallah, and Pip become visible or recede.
- Symbol recurrence maps for coffin, whiteness, gold, fire, weather, eyes, ropes, law, and prophecy.
- Form maps showing sermons, stage directions, legal parody, cetology, gams, set pieces, and chase chapters.
- Difficult-material review routes for race, religion, empire, disability, violence, and mental strain.
- Teacher prep pages that gather discussion prompts, content warnings, source cards, and likely student confusion points.
- Search facets for chapter, reading path, trail, function, character, place, and annotation kind.
- Map/timeline views where textual evidence, not decorative geography, drives each waypoint.
- Launch/dashboard views that summarize annotation density, source confidence, trail coverage, geography coverage, and review queues.

Map and geography work should use the geography registry rather than attaching coordinates directly to notes. Annotation relationships can point to `entity:` or `trail:` targets now; future map-specific notes should also relate to geography/place records once that relationship namespace is formalized.

## Near-Term Implementation Plan

1. Done: keep the current simple files working while adding a `selector` object to `annotation.schema.json`.
2. Done: write a migration script that turns existing `anchor` values into `TextQuoteSelector`-style records with generated prefix/suffix.
3. Done: make the reader use selectors for passage-level Study marks.
4. Done: generate `data/indexes/annotations-by-unit.json` and make the reader consume the per-unit pack.
5. Done: add density validation indexes that warn when a unit or paragraph exceeds a reasonable visible-mark threshold for a mode.
6. Done: add a layer registry that maps annotation kind, tags, and display priority to Read/Guide/Study/Teacher surfaces.
7. Use subagents for long drafting passes, but keep validation, citation audit, tone review, and difficult-material review in the main project pipeline.

## Implemented Scale-Up Contracts

- Authored annotation records now require `display`, `tags`, `relationships`, `evidence`, `provenance`, and `status.review_queue`.
- `scripts/ingest/build-annotation-selectors.mjs` preserves rich fields while regenerating exact selector context and generated positions.
- `scripts/ingest/build-annotation-indexes.mjs` writes `annotations-by-unit`, `annotations-by-tag`, `annotation-density`, and `annotation-edges`.
- `data/annotations/moby-dick.annotation-layers.json` is the first layer registry for Read, Guide, Study, Explore, and Teacher.
- `scripts/validate/validate-basic.mjs` validates selector resolution, generated indexes, relationship targets, review queues, evidence records, and density warnings.

## Research References

- W3C Web Annotation Data Model: https://www.w3.org/TR/annotation-model/
- Astro content collections: https://docs.astro.build/en/guides/content-collections/
- Pagefind filtering: https://pagefind.app/docs/filtering/
- Pagefind indexing controls: https://pagefind.app/docs/indexing/
- Observable Plot facets: https://observablehq.com/plot/features/facets
