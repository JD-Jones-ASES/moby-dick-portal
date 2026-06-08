// Generic runner for a vetted batch of authored public Study notes.
//
//   node scripts/content/run-authored-batch.mjs data/authored/batch-02.json
//
// The JSON file is an object { sources?: [...verified source records], notes: [...specs] }
// or a bare array of note specs. Note spec: { unit_id, anchor, claim_type, citations, note, kind?, tone? }.
// Ids are generated if omitted. Anchors that do not resolve as whole words, or that overlap an
// earlier accepted note in the same unit, are skipped and reported (never break the pipeline).

import { readFile } from "node:fs/promises";
import { applyAuthoredNotes } from "./_authored-notes-helper.mjs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/content/run-authored-batch.mjs <batch.json>");
  process.exit(1);
}

const parsed = JSON.parse(await readFile(path, "utf8"));
const payload = Array.isArray(parsed) ? { notes: parsed } : parsed;
await applyAuthoredNotes({ sources: payload.sources ?? [], notes: payload.notes ?? [] });
