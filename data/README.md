# Data Directory

This directory is the future source of truth for project content.

Expected subdirectories:

- `chapters/`: chapter manifest, summaries, tags, and path metadata.
- `sources/`: durable source records for source texts and reference material.
- `paths/`: reading path definitions.
- `glossary/`: glossary entries.
- `references/`: reusable context cards.
- `annotations/`: chapter-linked notes for Study mode and the authored annotation layer registry.
- `geography/`: place and route-stage records for map/data visualization, with coordinate status and source notes.
- `indexes/`: generated annotation indexes for per-unit lookup, tags, density, and edges.
- `maps/`: voyage route and map-display seeds.
- `taxonomy/`: controlled seed IDs for trails and entities used by annotation relationships and future indexes.

Generated data should be reproducible from scripts whenever practical. Hand-authored interpretive data should be schema-validated and source-cited before publication.
