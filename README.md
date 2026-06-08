# Moby-Dick — A Student Edition

**Live site → https://jd-jones-ases.github.io/moby-dick-portal/**

A data-first student edition of Herman Melville's *Moby-Dick; or, The Whale* that lets a reader choose how much of the book to take on at once.

The project goal is not to make one shortened edition. It is to preserve the full public-domain source while building metadata, reading paths, summaries, glossary help, and contextual annotations that let a student choose a manageable route through the book.

## What Makes It Different

- **Choose your length**: short paths are generated from metadata, not by deleting the full text — nothing is cut.
- **Student-first context**: whaling labor, nautical language, biblical/classical allusions, race, empire, and 19th-century publishing context are explained at the point of need.
- **Multiple reading modes**: narrative core, classroom standard, thematic trails, and full text can all coexist.
- **Source discipline**: the Standard Ebooks text is vendored as a read-only source, and interpretive claims should carry citations.

## Current Status

**Live as a multi-page Astro portal**, deployed to GitHub Pages on every push to `main`
(`.github/workflows/deploy.yml`). The site has a landing dashboard, a per-chapter reader at
`/read/[unit]/` (server-rendered text with inline, source-cited Study-note marks and a notes
sidebar), a filterable chapters index, a reading-paths page, a glossary browser, a verified-sources
bibliography, a voyage-stage map, and an about page. A Paper/Night theme toggle and base-aware links
keep it correct under the Pages subpath.

The **whole book** is annotated to the sibling Shakespeare Portal's standard: each public Study note
teaches the outside knowledge a student lacks (a biblical name, a classical myth, a whaling term, a
historical reference) and cites a verified source beyond Melville's own text — a rule enforced in
`scripts/validate/validate-basic.mjs`. Current public apparatus: **452 Study notes** (193 teaching
outside knowledge), **114 glossary entries**, and **41 verified sources**, with 0 rule failures and
0 unreviewed-draft leaks into the reader.

See [Agent.md](Agent.md) for the working map and handoff.

## Repository Layout

See [Agent.md](Agent.md#repo-map) for the working map.

## First Useful Commands

```powershell
npm.cmd ci                 # install (Node >= 22.12 required by Astro 6)
npm.cmd run prepare:data   # regenerate manifest, paths, selectors, indexes; validate
npm.cmd run build          # build the static portal into dist/
npm.cmd run dev            # local dev server
```

After any content change, run `prepare:data` (so the committed generated data is current), then
`build`. Pushing to `main` rebuilds and redeploys the live site via GitHub Actions. On this Windows
workspace, use `npm.cmd` if PowerShell blocks the `npm.ps1` shim.

For persistent preview and browser-control notes, see [docs/LOCAL_PREVIEW_AND_BROWSER.md](docs/LOCAL_PREVIEW_AND_BROWSER.md).

## License Posture

The vendored Standard Ebooks source states that its source text and artwork are believed to be public domain in the United States and that contributor work is dedicated via CC0. Original code and guide content still need project-level license files before publication.
