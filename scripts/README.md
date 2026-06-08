# Scripts

Project automation lives here.

Current core scripts:

```powershell
node scripts/ingest/build-chapter-manifest.mjs
node scripts/ingest/build-reading-paths.mjs
node scripts/ingest/build-annotation-selectors.mjs
node scripts/ingest/build-annotation-indexes.mjs
node scripts/validate/validate-basic.mjs
```

Content expansion batches:

```powershell
node scripts/content/first-major-content-blowout.mjs
```

That script appends the first large batch of provisional source records, glossary entries, reference cards, and Study annotations. It is idempotent by record ID and should be followed by the normal data-prep sequence.

Use the package script for the normal sequence:

```powershell
npm.cmd run prepare:data
```

Browser smoke testing expects a running local preview and Chrome debugging endpoint, as described in `docs/LOCAL_PREVIEW_AND_BROWSER.md`:

```powershell
npm.cmd run smoke:browser
```

The smoke test currently checks reader boot, Study annotation linkage, Guide glossary behavior, story-map rendering, the launch-page brand link, clear-search alignment, and bottom chapter navigation.

Future scripts should prefer small deterministic steps: ingest, normalize, classify, validate, audit, and render.
