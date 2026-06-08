# Moby-Dick Student Guide

A data-first student guide to Herman Melville's *Moby-Dick; or, The Whale*, designed around reversible abridgment.

The project goal is not to make one shortened edition. It is to preserve the full public-domain source while building metadata, reading paths, summaries, glossary help, and contextual annotations that let a student choose a manageable route through the book.

## What Makes It Different

- **Reversible abridgment**: short paths are generated from metadata, not by deleting the full text.
- **Student-first context**: whaling labor, nautical language, biblical/classical allusions, race, empire, and 19th-century publishing context are explained at the point of need.
- **Multiple reading modes**: narrative core, classroom standard, thematic trails, and full text can all coexist.
- **Source discipline**: the Standard Ebooks text is vendored as a read-only source, and interpretive claims should carry citations.

## Current Status

Reader v1 prototype complete. The repository has an agent entry guide, documentation, schemas, a vendored Standard Ebooks source, generated reading-unit/path data, source records, validation scripts, and an Astro reader under `src/`.

The current reader includes reversible path controls, full-source recovery, story-map navigation, trail lenses, guide/study depth modes, glossary/reference panels, Study annotations, and a voyage-stage display. Every numbered chapter and the epilogue has a student-facing summary seed.

The project is now in a **scholarly content scale-up** phase: public Study notes are being authored to the standard of the sibling Shakespeare Portal — each teaching the outside knowledge a student lacks (a biblical name, a classical myth, a whaling term) with a verified source — enforced by a rubric in `docs/CONTENT_STANDARDS.md` and `scripts/validate/validate-basic.mjs`. The opening chapters through roughly Chapter 65 now carry this apparatus. See [Agent.md](Agent.md#session-handoff--2026-06-08-read-this-first) for the current handoff and next steps.

## Repository Layout

See [Agent.md](Agent.md#repo-map) for the working map.

## First Useful Commands

```powershell
node scripts/ingest/build-chapter-manifest.mjs
node scripts/ingest/build-reading-paths.mjs
node scripts/validate/validate-basic.mjs
npm.cmd run dev
```

These commands regenerate the manifest, regenerate reading paths, validate the data, and run the Astro reader locally. On this Windows workspace, use `npm.cmd` if PowerShell blocks the `npm.ps1` shim.

For persistent preview and browser-control notes, see [docs/LOCAL_PREVIEW_AND_BROWSER.md](docs/LOCAL_PREVIEW_AND_BROWSER.md).

## License Posture

The vendored Standard Ebooks source states that its source text and artwork are believed to be public domain in the United States and that contributor work is dedicated via CC0. Original code and guide content still need project-level license files before publication.
