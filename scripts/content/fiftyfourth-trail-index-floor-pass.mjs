import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

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
      return text.slice(index, index + phrase.length);
    }
    index = lowerText.indexOf(lowerPhrase, index + Math.max(1, phrase.length));
  }
  return null;
}

function trailIdFromValue(value) {
  return value?.startsWith("trail:") ? value.slice("trail:".length) : null;
}

function currentCoveredTrailIds(items) {
  const covered = new Set();
  for (const annotation of items) {
    for (const relationship of annotation.relationships ?? []) {
      const trailId = trailIdFromValue(relationship.target);
      if (trailId) covered.add(trailId);
    }
    for (const tag of annotation.tags ?? []) {
      const trailId = trailIdFromValue(tag);
      if (trailId) covered.add(trailId);
    }
  }
  return covered;
}

function trailTopicTags(trail) {
  return new Set((trail.tags ?? []).map((tag) => tag.toLowerCase()));
}

function annotationScore(annotation, trailTags) {
  const unit = unitsById.get(annotation.unit_id);
  const annotationTags = new Set((annotation.tags ?? []).map((tag) => tag.toLowerCase()));
  let score = 0;

  for (const tag of annotationTags) {
    if (trailTags.has(tag)) score += 8;
    const [, tagValue] = tag.split(":");
    if (tagValue && [...trailTags].some((trailTag) => trailTag.endsWith(`:${tagValue}`))) score += 3;
  }

  for (const fn of unit?.functions ?? []) {
    if (trailTags.has(`topic:${fn}`) || trailTags.has(`form:${fn}`) || trailTags.has(`theme:${fn}`)) score += 5;
    if (fn === "whaling-labor" && trailTags.has("topic:labor")) score += 4;
    if (fn === "symbolic" && trailTags.has("theme:symbolism")) score += 4;
    if (fn === "theatrical" && trailTags.has("form:voice")) score += 3;
    if (fn === "prophecy" && trailTags.has("theme:warning")) score += 3;
  }

  if (annotation.kind === "teacher-note") score -= 2;
  if (annotation.id.startsWith("entity-index-")) score -= 1;
  if (annotation.display?.inline === false) score -= 1;
  return score;
}

function bestAnnotationForTrail(trail, sourceAnnotations) {
  const trailTags = trailTopicTags(trail);
  const candidates = sourceAnnotations
    .filter((annotation) => !annotation.id.startsWith("trail-index-"))
    .filter((annotation) => unitsById.get(annotation.unit_id)?.plain_text)
    .map((annotation) => ({ annotation, score: annotationScore(annotation, trailTags) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.annotation.selector?.position?.start ?? 0) - (b.annotation.selector?.position?.start ?? 0));

  if (candidates.length) return candidates[0].annotation;

  const keywords = [
    ...trail.label.split(/[^A-Za-z]+/),
    ...(trail.tags ?? []).flatMap((tag) => tag.split(/[^A-Za-z]+/))
  ].filter((word) => word.length > 4);

  for (const keyword of keywords) {
    for (const unit of guideData.units) {
      if (!unit.plain_text) continue;
      const exact = findWholePhrase(unit.plain_text, keyword);
      if (!exact) continue;
      return {
        unit_id: unit.unit_id,
        anchor: exact,
        selector: { exact },
        kind: "context",
        display: { inline: false }
      };
    }
  }

  const fallback = guideData.units.find((unit) => unit.section_type === "chapter" && unit.plain_text);
  return {
    unit_id: fallback.unit_id,
    anchor: fallback.plain_text.slice(0, 32).trim(),
    selector: { exact: fallback.plain_text.slice(0, 32).trim() },
    kind: "context",
    display: { inline: false }
  };
}

function noteFor(trail, annotation) {
  const unit = unitsById.get(annotation.unit_id);
  const location = unit?.section_type === "chapter" ? `Chapter ${unit.number}` : unit?.title ?? annotation.unit_id;
  return `${trail.label} is indexed here for Explore and Teacher views. This ${location} passage gives the trail a source-text entry point; use it to connect the local moment with the wider route: ${trail.description}`;
}

const before = annotations.annotations.length;
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.id.startsWith("trail-index-"));
const removed = before - annotations.annotations.length;
const coveredTrailIds = currentCoveredTrailIds(annotations.annotations);
let added = 0;

for (const trail of taxonomy.trails) {
  if (coveredTrailIds.has(trail.id)) continue;
  const sourceAnnotation = bestAnnotationForTrail(trail, annotations.annotations);
  const unit = unitsById.get(sourceAnnotation.unit_id);
  if (!unit?.plain_text) continue;
  const anchor = sourceAnnotation.anchor ?? sourceAnnotation.selector?.exact;
  if (!anchor || !unit.plain_text.toLowerCase().includes(anchor.toLowerCase())) continue;

  annotations.annotations.push({
    id: `trail-index-${trail.id}`,
    unit_id: sourceAnnotation.unit_id,
    kind: "theme",
    selector: {
      type: "TextQuoteSelector",
      exact: anchor
    },
    display: {
      depth: "explore",
      priority: 4,
      inline: false,
      surfaces: ["trail", "index", "search"],
      spoiler_level: "none"
    },
    anchor,
    note: noteFor(trail, sourceAnnotation),
    tags: [
      "kind:theme",
      "layer:explore",
      `trail:${trail.id}`,
      "provenance:trail-index-floor"
    ],
    relationships: [
      {
        type: "belongs-to-trail",
        target: `trail:${trail.id}`
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
  coveredTrailIds.add(trail.id);
  added += 1;
}

annotations.annotations.sort((a, b) => a.unit_id.localeCompare(b.unit_id) || a.id.localeCompare(b.id));

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({ removed, added, total: annotations.annotations.length }, null, 2));
