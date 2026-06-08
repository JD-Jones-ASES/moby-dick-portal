# Academic Recovery Plan

This project is worth saving if it changes direction now. The Shakespeare Portal is the benchmark: annotations should explain what readers do not already know, carry source support, survive adversarial review, and appear only at the depth where they belong. The Moby-Dick portal currently has useful infrastructure and too much draft apparatus prose.

## Diagnosis

- The platform works: reversible paths, selectors, glossary marks, reference cards, indexes, teacher packets, review queues, and browser validation are all useful.
- The public Study layer is not publication-ready. Draft notes, source-index scaffolds, and generated floor prose have been allowed to stand beside Melville's text.
- Existing status fields already contain the right truth: most material is draft or provisional. The UI must respect that truth.
- The next phase should reduce public claims, not increase item counts.

## Recovery Standard

Use the Shakespeare content rule as the controlling rubric:

Annotate only when a smart but unprepared student would stumble, and only when the note gives concrete help with vocabulary, nautical practice, historical context, source tradition, form, allusion, or a defensible interpretive crux.

Do not publish notes whose real purpose is coverage, indexing, source bookkeeping, taxonomy attachment, teacher review, or generic literary commentary.

## Immediate Gates

- Reader-facing Study notes require `display.surfaces` to include `reader`.
- Reader-facing Study notes require `status.content_status: "student-ready"`.
- Review, teacher, index, search, taxonomy, source-index, and Explore scaffolds stay out of public Study cards.
- Difficult-material notes remain review material until tone and source claims have been checked.

## Editorial Workflow

1. Freeze new content expansion.
2. Create a review queue sorted by chapter and public value, not by coverage gap.
3. For each unit, select only the few anchors that genuinely need notes.
4. Rewrite from scratch when a note sounds generated.
5. Source-check the claim, not merely the presence of a source.
6. Promote to `student-ready` only after anchor, source, interpretation, and tone all pass.
7. Keep apparatus-rich material available for editors and teachers, but do not confuse it with student annotation.

## Pilot

Start with three representative sections:

- Chapter 1, "Loomings": voice, despair, biblical name, going to sea, money/labor.
- Chapter 14, "Nantucket": geography, island myth, whaling economy, biblical/comic scale.
- Chapter 36, "The Quarter-Deck": dramatic staging, oath ritual, Ahab's rhetoric, crew labor.

The pilot succeeds when those chapters feel closer to the Shakespeare Portal: fewer notes, sharper anchors, stronger source trails, no visible scaffolding.

## Decision Point

After the pilot, compare the result against the current Shakespeare standard. If the revised chapters feel academically usable, scale the same process across the book. If they still feel synthetic after strict review, keep the UI/data infrastructure but rebuild the annotation corpus from a smaller hand-curated seed.
