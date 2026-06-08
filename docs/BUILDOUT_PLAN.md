# Buildout Plan

This is the kickoff runbook for turning the current scaffold into a working student guide.

## Phase 0 - Source And Contracts

1. Keep the Standard Ebooks source under `vendor/standard-ebooks/` and treat it as read-only.
2. Generate `data/chapters/moby-dick.chapter-manifest.json` from the vendored XHTML.
3. Validate the chapter manifest against `schemas/chapter.schema.json`.
4. Add durable source records for Standard Ebooks, Project Gutenberg, and the Internet Archive edition named in the OPF metadata.

Status: complete as of 2026-06-06. The next highest-value phase is Phase 1 classification and starter path refinement.

## Phase 1 - Abridgment Metadata

1. Classify each chapter by function: narrative, character, cetology, whaling-labor, gam, sermon, theatrical, symbolic, prophecy, legal-political, or transition.
2. Assign each chapter to one or more reading paths.
3. Write short chapter summaries in two lengths:
   - **One-breath**: 1 sentence for navigation.
   - **Teacher note**: 3-5 sentences with why the chapter matters.
4. Mark confidence and citation status for every classification.

Status: seeded as of 2026-06-06. Chapter functions and path assignments exist, with provisional confidence/citation status. Student summaries and reviewed citations remain open.

## Phase 2 - Reference Apparatus

1. Build the glossary with whaling terms, nautical terms, obsolete diction, and recurring symbolic vocabulary.
2. Build reusable reference cards: Jonah, Job, Leviathan, Narcissus, Ahab/Jezebel, Nantucket whaling, sperm whale anatomy, 19th-century racial categories, empire, property law, and prophecy.
3. Connect glossary and reference cards to chapter-level annotation targets.

Status: seeded as of 2026-06-06. `data/glossary/`, `data/references/`, `data/annotations/`, and `data/maps/` now contain validated starter data. Next milestone is expanding coverage and improving source citations beyond provisional Standard Ebooks references.

## Phase 3 - Prototype Reader

1. Build a minimal reader that consumes data from `data/`.
2. Add reading-path controls before any decorative landing page.
3. Show what was skipped in abridged modes, with chapter summaries and a route back to the full text.
4. Add glossary and reference layers as optional study aids.

Status: Astro reader foundation created as of 2026-06-06. `src/pages/index.astro` consumes generated data, switches reading paths, shows skipped units, displays recoverable source text, includes a data-backed mouseover glossary, Study-mode reference cards and annotations, and a voyage-map scaffold. It is not yet a polished v1 reader.

Near-term direction: continue in Astro. Add structured glossary/reference data, annotations, chapter summaries, real map data, and browser-tested responsive polish.

## Phase 4 - Audit And Classroom Readiness

1. Validate schemas.
2. Audit reading paths for plot continuity and representation of Melville's formal variety.
3. Review difficult material with clinical, contextual care.
4. Browser-test desktop and mobile.

## Non-Goals For V1

- Audio narration.
- Accounts, grade tracking, or classroom management.
- Permanent prose rewriting as the default experience.
- A marketing-style landing page before the reader exists.
