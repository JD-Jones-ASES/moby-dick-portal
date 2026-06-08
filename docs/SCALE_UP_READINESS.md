# Scale-Up Readiness

This project has completed its first major content expansion. The next content sessions should review, cite, and deepen the new annotations, glossary entries, source records, and relationships so the data model can power maps, trails, indexes, search facets, and teacher views with more confidence.

## Launch Page

The current root page is still the reader and opens at Chapter 1. The top-left brand now links back to `/`, which functions as the launch point.

Once the data set is larger, the launch experience should become a compact reader dashboard rather than a marketing page:

- Continue reading: selected path, current chapter, and depth mode.
- Path chooser: Narrative Core, Classroom Standard, Full Text, and future trails.
- Data overview: annotation density by chapter, difficult-material review flags, and source-confidence status.
- Map entry: voyage stages and place index, clearly separating textual evidence from display anchors.
- Trail entry: character, symbol, form, whaling labor, race/empire, allusion, and law/property routes.
- Teacher entry: review queues, source gaps, discussion clusters, and difficult-material prep.

Do not build this as a hero page. Build it as a working command surface once there is enough indexed data to make it useful.

## Map And Geography

The current voyage map is deliberately basic. It is a stage guide, not a scholarly reconstructed route. `data/geography/moby-dick.places.json` now gives the project a place registry with:

- place IDs and labels;
- links to taxonomy entities;
- display coordinates;
- coordinate status;
- chapter targets;
- source notes and citation status.

Future map work should distinguish these data types:

- textual place mentions;
- route-stage display anchors;
- reviewed historical or modern coordinates;
- ocean-region approximations;
- ship-encounter/gam locations when supported;
- symbolic geography, such as shore/sea, home/exile, and center/margin.

The map can become one of the richest data-visualization surfaces, but only if evidence status is visible. A dot should never imply a verified route coordinate unless the data says so.

## Color System

Instead of a simple light/dark toggle, the reader should eventually support task-aware palettes:

- **Paper**: default long-form reading.
- **Night Watch**: low-light reading without losing annotation contrast.
- **Chart**: map and data-visualization emphasis.
- **Review**: teacher/editor mode where source status, review queues, and density warnings become more visible.

These should be variable-driven CSS themes, not separate component designs. Annotation colors need semantic roles, not decorative variation: glossary, study note, difficult material, source warning, verified source, provisional source, trail/entity highlight, and density warning.

## React Decision

Do not migrate the reader to React now. Astro is still the right shell because the core product is static, data-rich, and text-centered.

React may become useful as isolated Astro islands for:

- dense faceted search;
- interactive graph/network views;
- map filtering and brushing;
- annotation-density heatmaps;
- teacher review dashboards;
- synchronized trail + text + map exploration.

Use React only where client-side state complexity is real. Keep ingestion, validation, indexing, and static reader rendering framework-agnostic.

## Next Content Session

The next session should treat the first blowout as a draft apparatus and improve it through the existing pipeline:

1. Review and tighten the 141 Study annotations, especially difficult-material and high-interpretation notes.
2. Verify new source records and upgrade citation status only after source checks.
3. Continue adding glossary/reference/annotation records with citations, evidence, tags, relationships, provenance, and review queues.
4. Use `trail:` and `entity:` relationship targets only when registered in taxonomy.
5. Use geography records for place/map claims and mark coordinates as `display-anchor` until reviewed.
6. Run `npm.cmd run prepare:data`, `npm.cmd run build`, and browser smoke checks before handoff.
