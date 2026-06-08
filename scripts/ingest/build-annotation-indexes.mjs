import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");
const layersPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotation-layers.json");
const taxonomyPath = path.join(repoRoot, "data", "taxonomy", "moby-dick.taxonomy.json");
const sourcesPath = path.join(repoRoot, "data", "sources", "moby-dick.source-records.json");
const glossaryPath = path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json");
const referenceCardsPath = path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json");
const geographyPath = path.join(repoRoot, "data", "geography", "moby-dick.places.json");
const teacherPacketsPath = path.join(repoRoot, "data", "teacher", "moby-dick.teacher-packets.json");
const outDir = path.join(repoRoot, "data", "indexes");

const byUnitPath = path.join(outDir, "annotations-by-unit.json");
const byTagPath = path.join(outDir, "annotations-by-tag.json");
const byEntityPath = path.join(outDir, "annotations-by-entity.json");
const byTrailPath = path.join(outDir, "annotations-by-trail.json");
const bySourcePath = path.join(outDir, "annotations-by-source.json");
const sourceUsagePath = path.join(outDir, "source-usage.json");
const densityPath = path.join(outDir, "annotation-density.json");
const edgesPath = path.join(outDir, "annotation-edges.json");
const searchDocumentsPath = path.join(outDir, "search-documents.json");
const teacherReviewPath = path.join(outDir, "teacher-review.json");
const reviewQueuePath = path.join(outDir, "review-queue.json");
const difficultMaterialReviewPath = path.join(outDir, "difficult-material-review.json");

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

async function writeJson(file, data) {
  await writeFile(file, `${escapeNonAscii(JSON.stringify(data, null, 2))}\n`);
}

function textQuoteMatches(text, selector) {
  const matches = [];
  const exact = selector?.exact ?? "";
  const lowerText = text.toLowerCase();
  const lowerExact = exact.toLowerCase();
  let index = lowerText.indexOf(lowerExact);

  while (index !== -1) {
    const prefix = selector.prefix ?? "";
    const suffix = selector.suffix ?? "";
    const before = text.slice(Math.max(0, index - prefix.length), index);
    const after = text.slice(index + exact.length, index + exact.length + suffix.length);
    if (before === prefix && after === suffix) {
      matches.push(index);
    }
    index = lowerText.indexOf(lowerExact, index + Math.max(1, exact.length));
  }

  return matches;
}

function paragraphRanges(text) {
  const ranges = [];
  let cursor = 0;

  for (const part of text.split(/\n{2,}/)) {
    const partStart = text.indexOf(part, cursor);
    cursor = partStart + part.length;
    const paragraph = part.trim();
    if (!paragraph) continue;

    const leadingWhitespace = part.search(/\S/);
    const start = partStart + Math.max(0, leadingWhitespace);
    ranges.push({ start, end: start + paragraph.length });
  }

  return ranges;
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

async function readOptionalJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function rangeForAnnotation(text, annotation) {
  const matches = textQuoteMatches(text, annotation.selector);
  if (matches.length === 0) {
    throw new Error(`Annotation ${annotation.id} selector does not resolve for ${annotation.unit_id}`);
  }

  const start = matches[0];
  return {
    start,
    end: start + annotation.selector.exact.length,
    match_count: matches.length
  };
}

function isReaderInline(annotation) {
  return annotation.display?.inline === true && (annotation.display?.surfaces ?? []).includes("reader");
}

function sortAnnotations(a, b) {
  return (a.selector.position?.start ?? 0) - (b.selector.position?.start ?? 0)
    || (a.display?.priority ?? 99) - (b.display?.priority ?? 99)
    || a.id.localeCompare(b.id);
}

const annotations = JSON.parse(await readFile(annotationsPath, "utf8")).annotations;
const layers = JSON.parse(await readFile(layersPath, "utf8"));
const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const referenceCards = JSON.parse(await readFile(referenceCardsPath, "utf8"));
const geography = JSON.parse(await readFile(geographyPath, "utf8"));
const teacherPackets = await readOptionalJson(teacherPacketsPath);
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const teacherPacketsByUnit = new Map((teacherPackets?.packets ?? []).map((packet) => [packet.unit_id, packet]));
const indexedAnnotations = annotations.map((annotation) => {
  const unit = unitsById.get(annotation.unit_id);
  if (!unit) throw new Error(`Annotation ${annotation.id} references unknown unit ${annotation.unit_id}`);
  const range = rangeForAnnotation(unit.plain_text, annotation);

  return {
    ...annotation,
    selector: {
      ...annotation.selector,
      position: {
        start: range.start,
        end: range.end,
        generated: true
      }
    },
    index: {
      unit_sequence: unit.sequence,
      unit_title: unit.title,
      selector_match_count: range.match_count,
      source_path: unit.source_path
    }
  };
});

const units = {};
for (const unit of guideData.units) {
  const unitAnnotations = indexedAnnotations
    .filter((annotation) => annotation.unit_id === unit.unit_id)
    .sort(sortAnnotations);

  units[unit.unit_id] = {
    unit_id: unit.unit_id,
    sequence: unit.sequence,
    title: unit.title,
    annotation_count: unitAnnotations.length,
    inline_annotation_count: unitAnnotations.filter(isReaderInline).length,
    annotations: unitAnnotations
  };
}

const tags = {};
for (const annotation of indexedAnnotations) {
  for (const tag of annotation.tags ?? []) {
    if (!tags[tag]) tags[tag] = { tag, annotation_count: 0, units: [], annotations: [] };
    tags[tag].annotation_count += 1;
    tags[tag].annotations.push(annotation.id);
    if (!tags[tag].units.includes(annotation.unit_id)) tags[tag].units.push(annotation.unit_id);
  }
}
for (const tag of Object.values(tags)) {
  tag.units.sort((a, b) => unitsById.get(a).sequence - unitsById.get(b).sequence);
  tag.annotations.sort();
}

const densityUnits = guideData.units.map((unit) => {
  const unitAnnotations = units[unit.unit_id].annotations;
  const inlineAnnotations = unitAnnotations.filter(isReaderInline);
  const paragraphs = paragraphRanges(unit.plain_text);
  const paragraphCounts = paragraphs.map((paragraph, index) => ({
    paragraph: index + 1,
    inline_marks: inlineAnnotations.filter((annotation) => {
      const start = annotation.selector.position.start;
      const end = annotation.selector.position.end;
      return start >= paragraph.start && end <= paragraph.end;
    }).length
  }));
  const maxInlineMarksPerParagraph = Math.max(0, ...paragraphCounts.map((paragraph) => paragraph.inline_marks));
  const warnings = [];

  if (unitAnnotations.some((annotation) => annotation.display?.depth === "guide" && annotation.display?.inline)) {
    warnings.push("guide-inline-annotation");
  }
  if (inlineAnnotations.length > layers.density_thresholds.study_inline_marks_per_unit) {
    warnings.push("study-unit-density");
  }
  if (maxInlineMarksPerParagraph > layers.density_thresholds.study_inline_marks_per_paragraph) {
    warnings.push("study-paragraph-density");
  }

  return {
    unit_id: unit.unit_id,
    sequence: unit.sequence,
    title: unit.title,
    annotation_count: unitAnnotations.length,
    inline_annotation_count: inlineAnnotations.length,
    by_kind: countBy(unitAnnotations.map((annotation) => annotation.kind)),
    by_depth: countBy(unitAnnotations.map((annotation) => annotation.display.depth)),
    max_inline_marks_per_paragraph: maxInlineMarksPerParagraph,
    warnings
  };
});

const edges = indexedAnnotations.flatMap((annotation) =>
  (annotation.relationships ?? []).map((relationship) => ({
    source: `annotation:${annotation.id}`,
    unit_id: annotation.unit_id,
    type: relationship.type,
    target: relationship.target
  }))
);

function targetsFor(annotation, namespace) {
  const prefixed = `${namespace}:`;
  return [
    ...(annotation.relationships ?? [])
      .map((relationship) => relationship.target)
      .filter((target) => target?.startsWith(prefixed))
      .map((target) => target.slice(prefixed.length)),
    ...(annotation.tags ?? [])
      .filter((tag) => tag.startsWith(prefixed))
      .map((tag) => tag.slice(prefixed.length))
  ];
}

function sourceIdsFor(annotation) {
  return [
    ...(annotation.citations ?? []),
    ...(annotation.evidence ?? []).flatMap((evidence) => evidence.citations ?? []),
    ...targetsFor(annotation, "source")
  ];
}

function trailIdsFor(annotation) {
  return targetsFor(annotation, "trail");
}

function addAnnotationToBucket(bucket, annotation) {
  bucket.annotation_count += 1;
  bucket.annotations.push(annotation.id);
  if (!bucket.units.includes(annotation.unit_id)) bucket.units.push(annotation.unit_id);
}

function addUsage(bucket, usage) {
  bucket.usage_count += 1;
  bucket.usages.push(usage);
  if (usage.unit_id && !bucket.units.includes(usage.unit_id)) bucket.units.push(usage.unit_id);
}

const entities = {};
for (const entity of taxonomy.entities) {
  entities[entity.id] = {
    entity_id: entity.id,
    label: entity.label,
    kind: entity.kind,
    annotation_count: 0,
    units: [],
    annotations: []
  };
}
for (const annotation of indexedAnnotations) {
  for (const entityId of new Set(targetsFor(annotation, "entity"))) {
    if (!entities[entityId]) continue;
    addAnnotationToBucket(entities[entityId], annotation);
  }
}
for (const entity of Object.values(entities)) {
  entity.units.sort((a, b) => unitsById.get(a).sequence - unitsById.get(b).sequence);
  entity.annotations.sort();
}

const sourceBuckets = {};
for (const source of sources.records) {
  sourceBuckets[source.id] = {
    source_id: source.id,
    title: source.title,
    citation_status: source.citation_status,
    annotation_count: 0,
    units: [],
    annotations: []
  };
}
for (const annotation of indexedAnnotations) {
  for (const sourceId of new Set(sourceIdsFor(annotation))) {
    if (!sourceBuckets[sourceId]) continue;
    addAnnotationToBucket(sourceBuckets[sourceId], annotation);
  }
}
for (const source of Object.values(sourceBuckets)) {
  source.units.sort((a, b) => unitsById.get(a).sequence - unitsById.get(b).sequence);
  source.annotations.sort();
}

const sourceUsage = {};
for (const source of sources.records) {
  sourceUsage[source.id] = {
    source_id: source.id,
    title: source.title,
    citation_status: source.citation_status,
    usage_count: 0,
    units: [],
    usages: []
  };
}

function cite(sourceId, usage) {
  const cleanId = String(sourceId ?? "").replace(/^source:/, "");
  if (!sourceUsage[cleanId]) return;
  addUsage(sourceUsage[cleanId], usage);
}

for (const annotation of indexedAnnotations) {
  for (const sourceId of new Set(sourceIdsFor(annotation))) {
    cite(sourceId, {
      type: "annotation",
      id: annotation.id,
      unit_id: annotation.unit_id,
      label: annotation.anchor
    });
  }
}
for (const entry of glossary.entries) {
  for (const sourceId of entry.citations ?? []) {
    for (const unitId of entry.targets?.length ? entry.targets : [null]) {
      cite(sourceId, {
        type: "glossary",
        id: entry.id,
        unit_id: unitId,
        label: entry.term
      });
    }
  }
}
for (const card of referenceCards.cards) {
  for (const sourceId of card.citations ?? []) {
    for (const unitId of card.targets?.length ? card.targets : [null]) {
      cite(sourceId, {
        type: "reference",
        id: card.id,
        unit_id: unitId,
        label: card.title
      });
    }
  }
}
for (const entity of taxonomy.entities) {
  for (const sourceId of entity.citations ?? []) {
    cite(sourceId, {
      type: "taxonomy-entity",
      id: entity.id,
      unit_id: null,
      label: entity.label
    });
  }
}
for (const place of geography.places) {
  for (const sourceId of place.citations ?? []) {
    for (const unitId of place.chapter_targets?.length ? place.chapter_targets : [null]) {
      cite(sourceId, {
        type: "geography",
        id: place.id,
        unit_id: unitId,
        label: place.label
      });
    }
  }
}

for (const source of Object.values(sourceUsage)) {
  source.units.sort((a, b) => (unitsById.get(a)?.sequence ?? 9999) - (unitsById.get(b)?.sequence ?? 9999));
  source.usages.sort((a, b) => a.type.localeCompare(b.type) || String(a.unit_id ?? "").localeCompare(String(b.unit_id ?? "")) || a.id.localeCompare(b.id));
}

const trails = {};
for (const trail of taxonomy.trails) {
  trails[trail.id] = {
    trail_id: trail.id,
    label: trail.label,
    annotation_count: 0,
    units: [],
    annotations: []
  };
}
for (const annotation of indexedAnnotations) {
  for (const trailId of new Set(trailIdsFor(annotation))) {
    if (!trails[trailId]) continue;
    addAnnotationToBucket(trails[trailId], annotation);
  }
}
for (const trail of Object.values(trails)) {
  trail.units.sort((a, b) => unitsById.get(a).sequence - unitsById.get(b).sequence);
  trail.annotations.sort();
}

const searchDocuments = guideData.units.map((unit) => {
  const unitAnnotations = units[unit.unit_id].annotations;
  const tagsForUnit = [...new Set(unitAnnotations.flatMap((annotation) => annotation.tags ?? []))].sort();
  const trailsForUnit = [...new Set(unitAnnotations.flatMap((annotation) => targetsFor(annotation, "trail")))].sort();
  const entitiesForUnit = [...new Set(unitAnnotations.flatMap((annotation) => targetsFor(annotation, "entity")))].sort();
  const sourcesForUnit = [...new Set(unitAnnotations.flatMap(sourceIdsFor))].sort();
  return {
    unit_id: unit.unit_id,
    sequence: unit.sequence,
    title: unit.title,
    section_type: unit.section_type,
    number: unit.number,
    functions: unit.functions,
    paths: unit.paths,
    summaries: unit.summaries,
    excerpt: unit.plain_text.slice(0, 360),
    annotation_count: unitAnnotations.length,
    inline_annotation_count: unitAnnotations.filter(isReaderInline).length,
    kinds: countBy(unitAnnotations.map((annotation) => annotation.kind)),
    depths: countBy(unitAnnotations.map((annotation) => annotation.display.depth)),
    tags: tagsForUnit,
    trails: trailsForUnit,
    entities: entitiesForUnit,
    sources: sourcesForUnit,
    review_queues: [...new Set(unitAnnotations.flatMap((annotation) => annotation.status.review_queue ?? []))].sort(),
    teacher_packet: teacherPacketsByUnit.get(unit.unit_id)?.id ?? null
  };
});

const teacherReviewUnits = guideData.units.map((unit) => {
  const unitAnnotations = units[unit.unit_id].annotations;
  const packet = teacherPacketsByUnit.get(unit.unit_id);
  const reviewQueues = [...new Set(unitAnnotations.flatMap((annotation) => annotation.status.review_queue ?? []))].sort();
  const difficultAnnotations = unitAnnotations.filter((annotation) => annotation.kind === "difficult-material");
  const linkedGlossaryIds = new Set();
  const linkedReferenceIds = new Set();
  const linkedSourceIds = new Set();
  for (const annotation of unitAnnotations) {
    for (const relationship of annotation.relationships ?? []) {
      if (relationship.target?.startsWith("glossary:")) linkedGlossaryIds.add(relationship.target.slice("glossary:".length));
      if (relationship.target?.startsWith("reference:")) linkedReferenceIds.add(relationship.target.slice("reference:".length));
      if (relationship.target?.startsWith("source:")) linkedSourceIds.add(relationship.target.slice("source:".length));
    }
    for (const citation of annotation.citations ?? []) linkedSourceIds.add(citation.replace(/^source:/, ""));
  }
  const linkedGlossary = glossary.entries.filter((entry) => linkedGlossaryIds.has(entry.id));
  const linkedReferences = referenceCards.cards.filter((card) => linkedReferenceIds.has(card.id));
  const linkedSources = sources.records.filter((source) => linkedSourceIds.has(source.id));
  const blockers = [];
  const needsReviewAnnotationCount = unitAnnotations.filter((annotation) => annotation.status.content_status === "needs-review").length;
  const citationReviewCount = unitAnnotations.filter((annotation) => annotation.status.review_queue?.includes("citation")).length;
  const difficultMaterialReviewCount = difficultAnnotations.filter((annotation) =>
    annotation.status.review_queue?.includes("tone") ||
    annotation.status.review_queue?.includes("difficult-material") ||
    annotation.status.review_queue?.includes("source-check")
  ).length;
  const linkedDraftGlossaryCount = linkedGlossary.filter((entry) => entry.status.definition_status !== "student-ready" || entry.status.citation_status !== "verified").length;
  const linkedDraftReferenceCount = linkedReferences.filter((card) => card.status.content_status !== "student-ready" || card.status.citation_status !== "verified").length;
  const linkedProvisionalSourceCount = linkedSources.filter((source) => !String(source.citation_status).startsWith("verified")).length;
  if (needsReviewAnnotationCount > 0) blockers.push({ type: "needs-review-annotations", count: needsReviewAnnotationCount });
  if (citationReviewCount > 0) blockers.push({ type: "annotation-citation-review", count: citationReviewCount });
  if (difficultMaterialReviewCount > 0) blockers.push({ type: "difficult-material-review", count: difficultMaterialReviewCount });
  if (linkedDraftGlossaryCount > 0) blockers.push({ type: "linked-glossary-review", count: linkedDraftGlossaryCount });
  if (linkedDraftReferenceCount > 0) blockers.push({ type: "linked-reference-review", count: linkedDraftReferenceCount });
  if (linkedProvisionalSourceCount > 0) blockers.push({ type: "linked-source-review", count: linkedProvisionalSourceCount });
  const readinessState = !unit.plain_text.trim()
    ? "exempt"
    : blockers.length === 0
    ? "candidate"
    : blockers.some((blocker) => ["needs-review-annotations", "difficult-material-review"].includes(blocker.type))
      ? "blocked"
      : "reviewing";
  return {
    unit_id: unit.unit_id,
    sequence: unit.sequence,
    title: unit.title,
    teacher_packet: packet?.id ?? null,
    teacher_prompt_count: packet?.discussion_prompts?.length ?? 0,
    likely_misreading_count: packet?.likely_misreadings?.length ?? 0,
    annotation_count: unitAnnotations.length,
    teacher_note_count: unitAnnotations.filter((annotation) => annotation.kind === "teacher-note").length,
    difficult_material_count: difficultAnnotations.length,
    needs_review_annotation_count: needsReviewAnnotationCount,
    citation_review_count: citationReviewCount,
    linked_glossary_review_count: linkedDraftGlossaryCount,
    linked_reference_review_count: linkedDraftReferenceCount,
    linked_source_review_count: linkedProvisionalSourceCount,
    readiness_state: readinessState,
    blockers,
    review_queues: reviewQueues,
    density_warnings: densityUnits.find((densityUnit) => densityUnit.unit_id === unit.unit_id)?.warnings ?? [],
    difficult_material_annotations: difficultAnnotations.map((annotation) => annotation.id)
  };
});

function pushReviewItem(queue, item) {
  for (const queueName of item.review_queues) {
    if (!queue.queues[queueName]) {
      queue.queues[queueName] = {
        queue: queueName,
        item_count: 0,
        items: []
      };
    }
    queue.queues[queueName].item_count += 1;
    queue.queues[queueName].items.push({
      type: item.type,
      id: item.id,
      unit_id: item.unit_id,
      label: item.label,
      content_status: item.content_status,
      citation_status: item.citation_status,
      priority: item.priority
    });
  }
}

function reviewPriority({ type, unitId, contentStatus, citationStatus, reviewQueues }) {
  let priority = 3;
  if (contentStatus === "needs-review" || citationStatus === "needs-review") priority -= 1;
  if (reviewQueues.includes("difficult-material") || reviewQueues.includes("tone")) priority -= 1;
  if (reviewQueues.includes("teacher")) priority += 1;
  if (unitId && unitsById.get(unitId)?.paths?.classroom_standard === "required") priority -= 1;
  if (type === "source") priority -= 1;
  return Math.max(1, Math.min(5, priority));
}

function packetUnitIds(packet) {
  return [packet.unit_id];
}

const reviewQueue = {
  generated_from: [
    "data/annotations/moby-dick.annotations.json",
    "data/glossary/moby-dick.glossary.json",
    "data/references/moby-dick.reference-cards.json",
    "data/teacher/moby-dick.teacher-packets.json",
    "data/sources/moby-dick.source-records.json",
    "data/taxonomy/moby-dick.taxonomy.json",
    "data/geography/moby-dick.places.json",
    "data/maps/moby-dick.voyage-map.json"
  ],
  item_count: 0,
  queues: {}
};

const reviewItems = [];

for (const annotation of indexedAnnotations) {
  reviewItems.push({
    type: "annotation",
    id: annotation.id,
    unit_id: annotation.unit_id,
    label: annotation.anchor,
    content_status: annotation.status.content_status,
    citation_status: annotation.status.citation_status,
    review_queues: annotation.status.review_queue ?? [],
    priority: reviewPriority({
      type: "annotation",
      unitId: annotation.unit_id,
      contentStatus: annotation.status.content_status,
      citationStatus: annotation.status.citation_status,
      reviewQueues: annotation.status.review_queue ?? []
    })
  });
}

for (const entry of glossary.entries) {
  const reviewQueues = ["source-check"];
  if (entry.status.citation_status !== "verified") reviewQueues.push("citation");
  if (entry.status.definition_status !== "student-ready") reviewQueues.push("interpretive");
  reviewItems.push({
    type: "glossary",
    id: entry.id,
    unit_id: entry.targets?.[0] ?? null,
    label: entry.term,
    content_status: entry.status.definition_status,
    citation_status: entry.status.citation_status,
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "glossary",
      unitId: entry.targets?.[0] ?? null,
      contentStatus: entry.status.definition_status,
      citationStatus: entry.status.citation_status,
      reviewQueues
    })
  });
}

for (const card of referenceCards.cards) {
  const reviewQueues = ["source-check"];
  if (card.status.citation_status !== "verified") reviewQueues.push("citation");
  if (card.status.content_status !== "student-ready") reviewQueues.push("interpretive");
  reviewItems.push({
    type: "reference",
    id: card.id,
    unit_id: card.targets?.[0] ?? null,
    label: card.title,
    content_status: card.status.content_status,
    citation_status: card.status.citation_status,
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "reference",
      unitId: card.targets?.[0] ?? null,
      contentStatus: card.status.content_status,
      citationStatus: card.status.citation_status,
      reviewQueues
    })
  });
}

for (const packet of teacherPackets?.packets ?? []) {
  reviewItems.push({
    type: "teacher-packet",
    id: packet.id,
    unit_id: packetUnitIds(packet)[0] ?? null,
    label: packet.essential_question,
    content_status: packet.status.content_status,
    citation_status: packet.status.citation_status,
    review_queues: packet.status.review_queue ?? [],
    priority: reviewPriority({
      type: "teacher-packet",
      unitId: packet.unit_id,
      contentStatus: packet.status.content_status,
      citationStatus: packet.status.citation_status,
      reviewQueues: packet.status.review_queue ?? []
    })
  });
}

for (const source of sources.records) {
  const reviewQueues = ["source-check"];
  if (!String(source.citation_status).startsWith("verified")) reviewQueues.push("citation");
  reviewItems.push({
    type: "source",
    id: source.id,
    unit_id: null,
    label: source.title,
    content_status: "draft",
    citation_status: source.citation_status,
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "source",
      unitId: null,
      contentStatus: "draft",
      citationStatus: source.citation_status,
      reviewQueues
    })
  });
}

for (const trail of taxonomy.trails) {
  const reviewQueues = ["interpretive"];
  if (trail.status.citation_status !== "verified") reviewQueues.push("citation");
  reviewItems.push({
    type: "taxonomy-trail",
    id: trail.id,
    unit_id: null,
    label: trail.label,
    content_status: trail.status.content_status,
    citation_status: trail.status.citation_status,
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "taxonomy-trail",
      unitId: null,
      contentStatus: trail.status.content_status,
      citationStatus: trail.status.citation_status,
      reviewQueues
    })
  });
}

for (const entity of taxonomy.entities) {
  const reviewQueues = ["source-check"];
  if (entity.status.citation_status !== "verified") reviewQueues.push("citation");
  reviewItems.push({
    type: "taxonomy-entity",
    id: entity.id,
    unit_id: null,
    label: entity.label,
    content_status: entity.status.content_status,
    citation_status: entity.status.citation_status,
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "taxonomy-entity",
      unitId: null,
      contentStatus: entity.status.content_status,
      citationStatus: entity.status.citation_status,
      reviewQueues
    })
  });
}

for (const place of geography.places) {
  const reviewQueues = ["source-check"];
  if (place.status.citation_status !== "verified") reviewQueues.push("citation");
  if (place.coordinate_status === "display-anchor") reviewQueues.push("interpretive");
  reviewItems.push({
    type: "geography",
    id: place.id,
    unit_id: place.chapter_targets?.[0] ?? null,
    label: place.label,
    content_status: place.status.content_status,
    citation_status: place.status.citation_status,
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "geography",
      unitId: place.chapter_targets?.[0] ?? null,
      contentStatus: place.status.content_status,
      citationStatus: place.status.citation_status,
      reviewQueues
    })
  });
}

for (const waypoint of ((await readOptionalJson(path.join(repoRoot, "data", "maps", "moby-dick.voyage-map.json")))?.waypoints ?? [])) {
  const reviewQueues = ["source-check", "citation", "interpretive"];
  reviewItems.push({
    type: "map-waypoint",
    id: waypoint.id,
    unit_id: null,
    label: waypoint.label,
    content_status: "draft",
    citation_status: "provisional",
    review_queues: reviewQueues,
    priority: reviewPriority({
      type: "map-waypoint",
      unitId: null,
      contentStatus: "draft",
      citationStatus: "provisional",
      reviewQueues
    })
  });
}

reviewQueue.item_count = reviewItems.length;
for (const item of reviewItems) pushReviewItem(reviewQueue, item);

for (const queue of Object.values(reviewQueue.queues)) {
  queue.items.sort((a, b) => a.priority - b.priority || String(a.unit_id ?? "").localeCompare(String(b.unit_id ?? "")) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
}
reviewQueue.queues = Object.fromEntries(Object.entries(reviewQueue.queues).sort(([a], [b]) => a.localeCompare(b)));

const difficultMaterialAnnotations = indexedAnnotations.filter((annotation) => annotation.kind === "difficult-material");
const difficultCategories = {};
for (const annotation of difficultMaterialAnnotations) {
  const categories = (annotation.tags ?? [])
    .filter((tag) => tag.startsWith("difficulty:"))
    .map((tag) => tag.slice("difficulty:".length));
  for (const category of categories) {
    if (!difficultCategories[category]) {
      difficultCategories[category] = {
        category,
        annotation_count: 0,
        units: [],
        annotations: []
      };
    }
    difficultCategories[category].annotation_count += 1;
    difficultCategories[category].annotations.push(annotation.id);
    if (!difficultCategories[category].units.includes(annotation.unit_id)) difficultCategories[category].units.push(annotation.unit_id);
  }
}
for (const category of Object.values(difficultCategories)) {
  category.units.sort((a, b) => unitsById.get(a).sequence - unitsById.get(b).sequence);
  category.annotations.sort();
}
const difficultMaterialReview = {
  generated_from: "data/annotations/moby-dick.annotations.json",
  annotation_count: difficultMaterialAnnotations.length,
  categorized_annotation_count: difficultMaterialAnnotations.filter((annotation) =>
    (annotation.tags ?? []).some((tag) => tag.startsWith("difficulty:"))
  ).length,
  category_count: Object.keys(difficultCategories).length,
  categories: Object.fromEntries(Object.entries(difficultCategories).sort(([a], [b]) => a.localeCompare(b))),
  units: Object.fromEntries(
    guideData.units.map((unit) => {
      const unitDifficult = difficultMaterialAnnotations.filter((annotation) => annotation.unit_id === unit.unit_id);
      return [unit.unit_id, {
        unit_id: unit.unit_id,
        sequence: unit.sequence,
        title: unit.title,
        annotation_count: unitDifficult.length,
        categories: [...new Set(unitDifficult.flatMap((annotation) =>
          (annotation.tags ?? [])
            .filter((tag) => tag.startsWith("difficulty:"))
            .map((tag) => tag.slice("difficulty:".length))
        ))].sort(),
        annotations: unitDifficult.map((annotation) => annotation.id).sort()
      }];
    })
  )
};

await mkdir(outDir, { recursive: true });
await writeJson(byUnitPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  annotation_count: indexedAnnotations.length,
  unit_count: guideData.units.length,
  units
});
await writeJson(byTagPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  tag_count: Object.keys(tags).length,
  tags: Object.fromEntries(Object.entries(tags).sort(([a], [b]) => a.localeCompare(b)))
});
await writeJson(byEntityPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  entity_count: taxonomy.entities.length,
  covered_entity_count: Object.values(entities).filter((entity) => entity.annotation_count > 0).length,
  entities: Object.fromEntries(Object.entries(entities).sort(([a], [b]) => a.localeCompare(b)))
});
await writeJson(byTrailPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  trail_count: taxonomy.trails.length,
  covered_trail_count: Object.values(trails).filter((trail) => trail.annotation_count > 0).length,
  trails: Object.fromEntries(Object.entries(trails).sort(([a], [b]) => a.localeCompare(b)))
});
await writeJson(bySourcePath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  source_count: sources.records.length,
  covered_source_count: Object.values(sourceBuckets).filter((source) => source.annotation_count > 0).length,
  sources: Object.fromEntries(Object.entries(sourceBuckets).sort(([a], [b]) => a.localeCompare(b)))
});
await writeJson(sourceUsagePath, {
  generated_from: [
    "data/annotations/moby-dick.annotations.json",
    "data/glossary/moby-dick.glossary.json",
    "data/references/moby-dick.reference-cards.json",
    "data/taxonomy/moby-dick.taxonomy.json",
    "data/geography/moby-dick.places.json"
  ],
  source_count: sources.records.length,
  used_source_count: Object.values(sourceUsage).filter((source) => source.usage_count > 0).length,
  sources: Object.fromEntries(Object.entries(sourceUsage).sort(([a], [b]) => a.localeCompare(b)))
});
await writeJson(densityPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  thresholds: layers.density_thresholds,
  annotation_count: indexedAnnotations.length,
  warning_count: densityUnits.reduce((total, unit) => total + unit.warnings.length, 0),
  units: densityUnits
});
await writeJson(edgesPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  edge_count: edges.length,
  edges: edges.sort((a, b) => a.source.localeCompare(b.source) || a.type.localeCompare(b.type) || a.target.localeCompare(b.target))
});
await writeJson(searchDocumentsPath, {
  generated_from: "data/annotations/moby-dick.annotations.json",
  unit_count: searchDocuments.length,
  documents: searchDocuments
});
await writeJson(teacherReviewPath, {
  generated_from: [
    "data/annotations/moby-dick.annotations.json",
    "data/teacher/moby-dick.teacher-packets.json"
  ],
  unit_count: teacherReviewUnits.length,
  units: teacherReviewUnits
});
await writeJson(reviewQueuePath, reviewQueue);
await writeJson(difficultMaterialReviewPath, difficultMaterialReview);

console.log(`Built annotation indexes for ${indexedAnnotations.length} annotations across ${guideData.units.length} reading units.`);
