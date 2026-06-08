import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencesPath = "data/references/moby-dick.reference-cards.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencesPath, "utf8"));

function escapeNonAscii(value) {
  return value.replace(/[^\x00-\x7F]/gu, (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xFFFF) return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    const offset = codePoint - 0x10000;
    const high = 0xD800 + (offset >> 10);
    const low = 0xDC00 + (offset & 0x3FF);
    return `\\u${high.toString(16).padStart(4, "0")}\\u${low.toString(16).padStart(4, "0")}`;
  });
}

const annotationsByUnit = new Map();
for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

function relationshipKey(relationship) {
  return `${relationship.type}\t${relationship.target}`;
}

function addRelationship(annotation, relationship) {
  const existing = new Set((annotation.relationships ?? []).map(relationshipKey));
  const key = relationshipKey(relationship);
  if (existing.has(key)) return false;
  annotation.relationships.push(relationship);
  annotation.relationships.sort((a, b) => relationshipKey(a).localeCompare(relationshipKey(b)));
  return true;
}

function bestAnnotation(unitId, preferredKinds) {
  const unitAnnotations = annotationsByUnit.get(unitId) ?? [];
  const candidates = unitAnnotations
    .filter((annotation) => !annotation.id.startsWith("source-index-"))
    .filter((annotation) => !annotation.id.startsWith("trail-index-"))
    .filter((annotation) => !annotation.id.startsWith("entity-index-"))
    .filter((annotation) => !annotation.id.startsWith("entity-registry-"));

  for (const kind of preferredKinds) {
    const found = candidates.find((annotation) => annotation.kind === kind);
    if (found) return found;
  }

  return candidates.find((annotation) => annotation.kind !== "teacher-note") ?? unitAnnotations[0] ?? null;
}

let referenceLinksAdded = 0;
let glossaryLinksAdded = 0;

for (const card of references.cards) {
  for (const unitId of card.targets ?? []) {
    const annotation = bestAnnotation(unitId, ["context", "theme", "form", "teacher-note"]);
    if (!annotation) continue;
    if (addRelationship(annotation, { type: "supports-reference", target: `reference:${card.id}` })) {
      referenceLinksAdded += 1;
    }
  }
}

for (const entry of glossary.entries) {
  for (const unitId of entry.targets ?? []) {
    const annotation = bestAnnotation(unitId, ["context", "theme", "form", "teacher-note"]);
    if (!annotation) continue;
    if (addRelationship(annotation, { type: "defines-term", target: `glossary:${entry.id}` })) {
      glossaryLinksAdded += 1;
    }
  }
}

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({ referenceLinksAdded, glossaryLinksAdded }, null, 2));
