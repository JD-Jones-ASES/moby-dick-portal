import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");
const contextLength = 64;

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

function claimTypeFor(annotation) {
  if (annotation.kind === "difficult-material") return "difficult-material";
  if (annotation.kind === "gloss") return "lexical";
  if (annotation.kind === "map") return "cartographic";
  if (annotation.kind === "context") return "historical-context";
  if (annotation.kind === "teacher-note") return "interpretive";
  return "interpretive";
}

function defaultTags(annotation) {
  const tags = new Set(annotation.tags ?? []);
  tags.add(`kind:${annotation.kind}`);

  if (annotation.kind === "difficult-material") tags.add("review:difficult-material");
  if (annotation.kind === "theme") tags.add("layer:theme");
  if (annotation.kind === "form") tags.add("layer:form");
  if (annotation.kind === "context") tags.add("layer:context");

  return [...tags].sort();
}

function defaultRelationships(annotation) {
  const relationships = annotation.relationships ?? [];
  const citationRelationships = (annotation.citations ?? []).map((citation) => ({
    type: "uses-source",
    target: `source:${citation}`
  }));
  const seen = new Set();

  return [...relationships, ...citationRelationships].filter((relationship) => {
    const key = `${relationship.type}:${relationship.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function defaultEvidence(annotation) {
  if (annotation.evidence?.length) return annotation.evidence;

  const validation = new Set(["selector-resolves"]);
  if (annotation.status?.citation_status !== "verified") validation.add("needs-review");

  return [
    {
      claim_type: claimTypeFor(annotation),
      citations: annotation.citations ?? [],
      validation: [...validation]
    }
  ];
}

function defaultReviewQueue(annotation) {
  const reviewQueue = new Set(annotation.status?.review_queue ?? []);
  if (annotation.status?.citation_status !== "verified") reviewQueue.add("citation");
  if (annotation.status?.content_status !== "student-ready") reviewQueue.add("source-check");
  if (annotation.kind === "difficult-material") {
    reviewQueue.add("difficult-material");
    reviewQueue.add("tone");
  }
  if (claimTypeFor(annotation) === "interpretive" && annotation.status?.citation_status !== "verified") {
    reviewQueue.add("interpretive");
  }
  return [...reviewQueue].sort();
}

function isWordLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function isWholeWordMatch(text, index, length) {
  const before = text[index - 1] ?? "";
  const after = text[index + length] ?? "";
  return !(isWordLetter(before) && isWordLetter(text[index])) && !(isWordLetter(after) && isWordLetter(text[index + length - 1]));
}

function selectorFor(text, anchor, annotationId) {
  const lowerText = text.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  let index = lowerText.indexOf(lowerAnchor);
  let selectedIndex = -1;

  while (index !== -1) {
    if (isWholeWordMatch(text, index, anchor.length)) {
      selectedIndex = index;
      break;
    }
    if (selectedIndex === -1) selectedIndex = index;
    index = lowerText.indexOf(lowerAnchor, index + Math.max(1, anchor.length));
  }

  if (selectedIndex === -1) {
    throw new Error(`Could not find anchor for ${annotationId}: ${anchor}`);
  }

  if (!isWholeWordMatch(text, selectedIndex, anchor.length)) {
    throw new Error(`Anchor for ${annotationId} resolves inside a word: ${anchor}`);
  }

  const exact = text.slice(selectedIndex, selectedIndex + anchor.length);
  const prefix = text.slice(Math.max(0, selectedIndex - contextLength), selectedIndex);
  const suffix = text.slice(selectedIndex + exact.length, selectedIndex + exact.length + contextLength);

  return {
    type: "TextQuoteSelector",
    exact,
    prefix,
    suffix,
    position: {
      start: selectedIndex,
      end: selectedIndex + exact.length,
      generated: true
    }
  };
}

function escapeNonAscii(value) {
  return value.replace(/[^\x00-\x7F]/gu, (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xFFFF) {
      return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    }

    const offset = codePoint - 0x10000;
    const high = 0xD800 + (offset >> 10);
    const low = 0xDC00 + (offset & 0x3FF);
    return `\\u${high.toString(16).padStart(4, "0")}\\u${low.toString(16).padStart(4, "0")}`;
  });
}

const nextAnnotations = annotations.annotations.map((annotation) => {
  const unit = unitsById.get(annotation.unit_id);
  if (!unit?.plain_text) {
    throw new Error(`Could not load text for annotation ${annotation.id} target ${annotation.unit_id}`);
  }

  return {
    id: annotation.id,
    unit_id: annotation.unit_id,
    kind: annotation.kind,
    selector: selectorFor(unit.plain_text, annotation.anchor, annotation.id),
    display: annotation.display ?? {
      depth: "study",
      priority: annotation.status?.content_status === "student-ready" ? 2 : 3,
      inline: annotation.kind !== "teacher-note",
      surfaces: annotation.kind === "teacher-note" ? ["teacher", "index"] : ["reader", "index"],
      spoiler_level: "none"
    },
    anchor: annotation.anchor,
    note: annotation.note,
    tags: defaultTags(annotation),
    relationships: defaultRelationships(annotation),
    evidence: defaultEvidence(annotation),
    citations: annotation.citations,
    provenance: annotation.provenance ?? {
      author: "codex",
      created: "2026-06-06",
      method: "migration"
    },
    status: {
      content_status: annotation.status.content_status,
      citation_status: annotation.status.citation_status,
      review_queue: defaultReviewQueue(annotation)
    }
  };
});

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify({ annotations: nextAnnotations }, null, 2))}\n`);
console.log(`Updated selectors for ${nextAnnotations.length} annotations.`);
