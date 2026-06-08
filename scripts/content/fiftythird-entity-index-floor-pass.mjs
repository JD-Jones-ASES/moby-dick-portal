import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const guideData = await loadGuideData();

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

function isLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function findWholePhrase(text, phrase) {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = lowerText.indexOf(lowerPhrase);

  while (index !== -1) {
    if (!isLetter(text[index - 1]) && !isLetter(text[index + phrase.length])) {
      return {
        index,
        exact: text.slice(index, index + phrase.length)
      };
    }
    index = lowerText.indexOf(lowerPhrase, index + Math.max(1, phrase.length));
  }

  return null;
}

function namesFor(entity) {
  return [entity.label, ...(entity.aliases ?? [])]
    .map((name) => String(name ?? "").trim())
    .filter((name) => name.length > 2)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function noteFor(entity, unit) {
  const location = unit.section_type === "chapter" ? `Chapter ${unit.number}` : unit.title;
  const kind = entity.kind === "allusion" ? "allusive" : entity.kind;
  return `${entity.label} is indexed here as a ${kind} thread for Explore and Teacher views. Use this occurrence in ${location} as a source-text handle for following the entity elsewhere in the guide.`;
}

const before = annotations.annotations.length;
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.id.startsWith("entity-index-"));
const removed = before - annotations.annotations.length;
const coveredEntityIds = new Set();
for (const annotation of annotations.annotations) {
  for (const relationship of annotation.relationships ?? []) {
    if (relationship.target?.startsWith("entity:")) coveredEntityIds.add(relationship.target.slice("entity:".length));
  }
  for (const tag of annotation.tags ?? []) {
    if (tag.startsWith("entity:")) coveredEntityIds.add(tag.slice("entity:".length));
  }
}

let added = 0;

for (const entity of taxonomy.entities) {
  if (coveredEntityIds.has(entity.id)) continue;

  let match = null;
  for (const name of namesFor(entity)) {
    for (const unit of guideData.units) {
      if (!unit.plain_text) continue;
      const found = findWholePhrase(unit.plain_text, name);
      if (!found) continue;
      match = { unit, exact: found.exact };
      break;
    }
    if (match) break;
  }

  if (!match) continue;

  annotations.annotations.push({
    id: `entity-index-${entity.id}`,
    unit_id: match.unit.unit_id,
    kind: "context",
    selector: {
      type: "TextQuoteSelector",
      exact: match.exact
    },
    display: {
      depth: "explore",
      priority: 4,
      inline: false,
      surfaces: ["index", "search", "trail"],
      spoiler_level: "none"
    },
    anchor: match.exact,
    note: noteFor(entity, match.unit),
    tags: [
      "kind:context",
      "layer:explore",
      `entity:${entity.id}`,
      "provenance:entity-index-floor"
    ],
    relationships: [
      {
        type: "mentions-entity",
        target: `entity:${entity.id}`
      },
      {
        type: "uses-source",
        target: "source:standard-ebooks-moby-dick"
      }
    ],
    evidence: [
      {
        claim_type: "source-text-observation",
        citations: ["standard-ebooks-moby-dick"],
        validation: ["selector-resolves", "primary-source-checked"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: "2026-06-07",
      method: "source-checked-draft"
    },
    status: {
      content_status: "draft",
      citation_status: "verified",
      review_queue: ["source-check"]
    }
  });
  added += 1;
}

annotations.annotations.sort((a, b) => a.unit_id.localeCompare(b.unit_id) || a.id.localeCompare(b.id));

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({ removed, added, total: annotations.annotations.length }, null, 2));
