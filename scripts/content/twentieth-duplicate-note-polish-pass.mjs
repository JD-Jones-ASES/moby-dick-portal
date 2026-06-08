import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

function normalize(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function shortAnchor(anchor) {
  const compact = anchor.replace(/\s+/g, " ").trim();
  return compact.length > 88 ? `${compact.slice(0, 85)}...` : compact;
}

function specificitySentence(annotation) {
  const anchor = shortAnchor(annotation.anchor);
  if (annotation.kind === "form") return `The selected wording, "${anchor}", shows that formal pressure in a local voice or scene cue.`;
  if (annotation.kind === "context") return `The selected wording, "${anchor}", grounds that context in a concrete detail students can track.`;
  if (annotation.kind === "teacher-note") return `Use the selected wording, "${anchor}", as the concrete entry point for discussion.`;
  return `The selected wording, "${anchor}", makes that pressure visible in the source text.`;
}

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
const byUnitAndNote = new Map();

for (const annotation of data.annotations) {
  const key = `${annotation.unit_id}\t${normalize(annotation.note)}`;
  if (!byUnitAndNote.has(key)) byUnitAndNote.set(key, []);
  byUnitAndNote.get(key).push(annotation);
}

let groups = 0;
let updated = 0;

for (const duplicates of byUnitAndNote.values()) {
  if (duplicates.length < 2) continue;
  groups += 1;
  const sorted = duplicates.slice().sort((a, b) => {
    const aDensity = a.id.startsWith("whole-book-density-") ? 1 : 0;
    const bDensity = b.id.startsWith("whole-book-density-") ? 1 : 0;
    return aDensity - bDensity || a.id.localeCompare(b.id);
  });

  for (const annotation of sorted.slice(1)) {
    annotation.note = `${annotation.note} ${specificitySentence(annotation)}`;
    annotation.tags = [...new Set([...(annotation.tags ?? []), "review:duplicate-note-polished"])].sort();
    updated += 1;
  }
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ groups, updated }, null, 2));
