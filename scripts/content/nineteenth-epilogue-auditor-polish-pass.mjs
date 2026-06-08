import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "whole-book-density-epilogue-epilogue-3": "Melville shifts from the wreck itself to Ishmael's survival, showing that the story continues only because the coffin keeps him afloat.",
  "classroom-second-anchor-epilogue-epilogue": "The question is answered at once: Ishmael is the one survivor who can step forward and tell the story, carried through the wreck on Queequeg's coffin.",
  "curated-latebook-epilogue-epilogue-the-devious-cruising-rachel": "The Rachel is still searching for its missing children, so Ishmael's rescue comes inside another family's loss."
}));

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
const missing = [];
let updated = 0;

for (const [id, note] of replacements) {
  const annotation = data.annotations.find((item) => item.id === id);
  if (!annotation) {
    missing.push(id);
    continue;
  }
  annotation.note = note;
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:subagent-quality-repair"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, missing }, null, 2));
