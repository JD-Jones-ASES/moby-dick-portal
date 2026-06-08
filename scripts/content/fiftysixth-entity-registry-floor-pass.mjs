import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const entitiesById = new Map(taxonomy.entities.map((entity) => [entity.id, entity]));

const registryHints = new Map([
  ["epic-catalog", ["chapter-032-cetology", "Cetology"]],
  ["ecology", ["chapter-058-brit", "vast meadows"]],
  ["cape-verde", ["chapter-054-the-town-ho-s-story", "Cape de Verdes"]],
  ["kerguelen", ["chapter-052-the-albatross", "Desolation Island"]],
  ["java-sea", ["chapter-087-the-grand-armada", "Straits of Sunda"]],
  ["ishmael-witness", ["epilogue-epilogue", "I only am escaped alone"]],
  ["shipboard-command", ["chapter-036-the-quarterdeck", "I do not order ye"]],
  ["whaleman-chapel", ["chapter-007-the-chapel", "Whaleman's Chapel"]],
  ["giant-cask", ["chapter-077-the-great-heidelburgh-tun", "Heidelburgh Tun"]],
  ["the-candles", ["chapter-119-the-candles", "The Candles"]],
  ["the-lee-shore", ["chapter-023-the-lee-shore", "Lee Shore"]],
  ["coverage-entity-shore-social", ["chapter-003-the-spouter-inn", "Spouter-Inn"]],
  ["coverage-entity-early-pequod-shipboard", ["chapter-022-merry-christmas", "Pequod"]],
  ["coverage-entity-quarterdeck-aftervoices", ["chapter-037-sunset", "Sunset"]],
  ["coverage-entity-white-whale-theory", ["chapter-041-moby-dick", "Moby Dick"]],
  ["coverage-entity-whale-images-and-signs", ["chapter-055-of-the-monstrous-pictures-of-whales", "pictures of whales"]],
  ["coverage-entity-cutting-and-carcass-work", ["chapter-067-cutting-in", "Cutting In"]],
  ["coverage-entity-head-body-law-scale", ["chapter-089-fast-fish-and-loose-fish", "Fast-Fish and Loose-Fish"]],
  ["coverage-entity-pip-and-tryworks-approach", ["chapter-096-the-try-works", "try-works"]],
  ["coverage-entity-craft-and-instrument-pressure", ["chapter-113-the-forge", "The Forge"]],
  ["coverage-entity-final-cabin-watch", ["chapter-129-the-cabin", "The Cabin"]]
]);

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
    if (!isLetter(text[index - 1]) && !isLetter(text[index + phrase.length])) return text.slice(index, index + phrase.length);
    index = lowerText.indexOf(lowerPhrase, index + Math.max(1, phrase.length));
  }
  return null;
}

function firstAnchor(unit) {
  const text = unit.plain_text ?? "";
  const start = text.search(/[A-Za-z0-9]/);
  if (start < 0) return "";
  let end = Math.min(text.length, start + 70);
  while (end > start + 24 && isLetter(text[end])) end -= 1;
  return text.slice(start, end).trim().replace(/[^A-Za-z0-9]+$/g, "").trim();
}

function coveredEntityIds(items) {
  const covered = new Set();
  for (const annotation of items) {
    for (const relationship of annotation.relationships ?? []) {
      if (relationship.target?.startsWith("entity:")) covered.add(relationship.target.slice("entity:".length));
    }
    for (const tag of annotation.tags ?? []) {
      if (tag.startsWith("entity:")) covered.add(tag.slice("entity:".length));
    }
  }
  return covered;
}

function noteFor(entity, unit) {
  const where = unit.section_type === "chapter" ? `Chapter ${unit.number}` : unit.title;
  return `${entity.label} is a registry entity for Explore and Teacher views rather than a single repeated phrase. This ${where} anchor gives the guide a stable place to connect the broader ${entity.kind} thread to source text.`;
}

const before = annotations.annotations.length;
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.id.startsWith("entity-registry-"));
const removed = before - annotations.annotations.length;
const covered = coveredEntityIds(annotations.annotations);
let added = 0;

for (const [entityId, [unitId, phrase]] of registryHints) {
  if (covered.has(entityId)) continue;
  const entity = entitiesById.get(entityId);
  const unit = unitsById.get(unitId);
  if (!entity || !unit?.plain_text) continue;
  const anchor = findWholePhrase(unit.plain_text, phrase) ?? firstAnchor(unit);
  if (!anchor) continue;

  annotations.annotations.push({
    id: `entity-registry-${entity.id}`,
    unit_id: unit.unit_id,
    kind: "context",
    selector: {
      type: "TextQuoteSelector",
      exact: anchor
    },
    display: {
      depth: "explore",
      priority: 5,
      inline: false,
      surfaces: ["index", "search", "trail"],
      spoiler_level: "none"
    },
    anchor,
    note: noteFor(entity, unit),
    tags: [
      "kind:context",
      "layer:explore",
      `entity:${entity.id}`,
      "provenance:entity-registry-floor"
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
        claim_type: "interpretive",
        citations: ["standard-ebooks-moby-dick"],
        validation: ["selector-resolves", "needs-review"]
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
      citation_status: "provisional",
      review_queue: ["citation", "interpretive", "source-check"]
    }
  });
  covered.add(entity.id);
  added += 1;
}

annotations.annotations.sort((a, b) => a.unit_id.localeCompare(b.unit_id) || a.id.localeCompare(b.id));

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({ removed, added, total: annotations.annotations.length }, null, 2));
