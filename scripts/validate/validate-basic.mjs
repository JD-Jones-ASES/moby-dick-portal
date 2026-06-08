import { readFile, readdir } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const sourceRecordsPath = "data/sources/moby-dick.source-records.json";
const sourceRecords = JSON.parse(await readFile(sourceRecordsPath, "utf8"));
const summarySeedsPath = "data/chapters/moby-dick.summary-seeds.json";
const summarySeeds = JSON.parse(await readFile(summarySeedsPath, "utf8"));
const glossaryPath = "data/glossary/moby-dick.glossary.json";
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const referenceCardsPath = "data/references/moby-dick.reference-cards.json";
const referenceCards = JSON.parse(await readFile(referenceCardsPath, "utf8"));
const voyageMapPath = "data/maps/moby-dick.voyage-map.json";
const voyageMap = JSON.parse(await readFile(voyageMapPath, "utf8"));
const teacherPacketsPath = "data/teacher/moby-dick.teacher-packets.json";
const teacherPackets = JSON.parse(await readFile(teacherPacketsPath, "utf8"));
const annotationsPath = "data/annotations/moby-dick.annotations.json";
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const annotationLayersPath = "data/annotations/moby-dick.annotation-layers.json";
const annotationLayers = JSON.parse(await readFile(annotationLayersPath, "utf8"));
const annotationsByUnitPath = "data/indexes/annotations-by-unit.json";
const annotationsByUnit = JSON.parse(await readFile(annotationsByUnitPath, "utf8"));
const annotationsByTagPath = "data/indexes/annotations-by-tag.json";
const annotationsByTag = JSON.parse(await readFile(annotationsByTagPath, "utf8"));
const annotationsByEntityPath = "data/indexes/annotations-by-entity.json";
const annotationsByEntity = JSON.parse(await readFile(annotationsByEntityPath, "utf8"));
const annotationsByTrailPath = "data/indexes/annotations-by-trail.json";
const annotationsByTrail = JSON.parse(await readFile(annotationsByTrailPath, "utf8"));
const annotationsBySourcePath = "data/indexes/annotations-by-source.json";
const annotationsBySource = JSON.parse(await readFile(annotationsBySourcePath, "utf8"));
const sourceUsagePath = "data/indexes/source-usage.json";
const sourceUsage = JSON.parse(await readFile(sourceUsagePath, "utf8"));
const annotationDensityPath = "data/indexes/annotation-density.json";
const annotationDensity = JSON.parse(await readFile(annotationDensityPath, "utf8"));
const annotationEdgesPath = "data/indexes/annotation-edges.json";
const annotationEdges = JSON.parse(await readFile(annotationEdgesPath, "utf8"));
const searchDocumentsPath = "data/indexes/search-documents.json";
const searchDocuments = JSON.parse(await readFile(searchDocumentsPath, "utf8"));
const teacherReviewPath = "data/indexes/teacher-review.json";
const teacherReview = JSON.parse(await readFile(teacherReviewPath, "utf8"));
const reviewQueuePath = "data/indexes/review-queue.json";
const reviewQueue = JSON.parse(await readFile(reviewQueuePath, "utf8"));
const difficultMaterialReviewPath = "data/indexes/difficult-material-review.json";
const difficultMaterialReview = JSON.parse(await readFile(difficultMaterialReviewPath, "utf8"));
const publicAnnotationCandidatesPath = "data/indexes/public-annotation-candidates.json";
const publicAnnotationCandidates = JSON.parse(await readFile(publicAnnotationCandidatesPath, "utf8"));
const publicApparatusCandidatesPath = "data/indexes/public-apparatus-candidates.json";
const publicApparatusCandidates = JSON.parse(await readFile(publicApparatusCandidatesPath, "utf8"));
const publicSourceReadinessPath = "data/indexes/public-source-readiness.json";
const publicSourceReadiness = JSON.parse(await readFile(publicSourceReadinessPath, "utf8"));
const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";
const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const geographyPath = "data/geography/moby-dick.places.json";
const geography = JSON.parse(await readFile(geographyPath, "utf8"));
const pathDir = "data/paths";
const requiredPathIds = ["full_text", "narrative_core", "classroom_standard"];
const allowedFunctions = new Set([
  "narrative",
  "character",
  "cetology",
  "whaling-labor",
  "gam",
  "sermon",
  "theatrical",
  "symbolic",
  "prophecy",
  "legal-political",
  "biblical-allusion",
  "transition",
  "prefatory",
  "unknown"
]);

for (const schemaPath of [
  "schemas/chapter.schema.json",
  "schemas/annotation.schema.json",
  "schemas/annotation-layer.schema.json",
  "schemas/geography.schema.json",
  "schemas/glossary-entry.schema.json",
  "schemas/reading-path.schema.json",
  "schemas/reference-card.schema.json",
  "schemas/source-record.schema.json",
  "schemas/taxonomy.schema.json",
  "schemas/teacher-packet.schema.json"
]) {
  JSON.parse(await readFile(schemaPath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const bannedPublicProsePatterns = [
  /useful (?:study )?hinge/i,
  /pressure point/i,
  /foothold/i,
  /\bsets up\b/i,
  /\bunderscores\b/i,
  /source-index/i,
  /taxonomy-index/i,
  /teacher review/i,
  /review queue/i,
  /needs review/i,
  /provisional lead/i,
  /coverage/i,
  /passage-level study point/i,
  /close-reading checkpoint/i,
  /The note points/i,
  /is worth pausing over/i,
  /The phrase ["“]/i,
  /In [^,]+, ["“]/i,
  /Use ["“]/i,
  /the guide should/i,
  /use this (?:passage|chapter|card|entry)/i,
  /students should/i,
  /ask students/i
];

function assertNoPublicProseResidue(id, text) {
  for (const pattern of bannedPublicProsePatterns) {
    assert(!pattern.test(text ?? ""), `Public item ${id} contains publication-gate residue: ${text}`);
  }
}

const allusionSupportRules = [
  {
    pattern:
      /\b(?:biblical|Bible|Jonah|Herod|Innocents|Belshazzar|Leviathan|Gabriel|Elijah|Shadrach|Meshach|Abednego|Gomorrah|Potters[’'] Fields?)\b/i,
    sources: new Set(["king-james-bible", "jonah-kjv-crossref"]),
    label: "biblical"
  },
  {
    pattern: /\b(?:Asphaltites|Dead Sea)\b/i,
    sources: new Set(["britannica-supplement-asphaltites-wikisource"]),
    label: "Asphaltites or Dead Sea"
  },
  {
    pattern:
      /\b(?:Prometheus|Hercules|Perseus|St\. George|Vishnu|Queen Mab|Shakespeare|Damocles|Aladdin|classical|mythic|mythological|fairy-tale)\b/i,
    sources: new Set([
      "bulfinch-age-of-fable",
      "perseus-homer",
      "shakespeare-complete-works-gutenberg",
      "project-gutenberg-aladdin",
      "livius-cicero-damocles"
    ]),
    label: "classical or literary"
  },
  {
    pattern: /\bGreek fire\b/i,
    sources: new Set(["britannica-greek-fire"]),
    label: "Greek fire"
  },
  {
    pattern: /\b(?:Mother Carey[â€™']s chickens|Mother Carey)\b/i,
    sources: new Set(["brewer-mother-careys-chickens"]),
    label: "Mother Carey's chickens"
  },
  {
    pattern: /\b(?:Peter the Great|Czar Peter|Peter I)\b/i,
    sources: new Set(["britannica-peter-the-great"]),
    label: "Peter the Great"
  },
  {
    pattern: /\b(?:phrenology|phrenological|physiognomy|physiognomic|Gall|Spurzheim|Lavater)\b/i,
    sources: new Set(["webster-1913", "britannica-phrenology"]),
    label: "phrenology or physiognomy"
  },
  {
    pattern: /\bBasilosaurus\b/i,
    sources: new Set(["britannica-basilosaurus"]),
    label: "Basilosaurus"
  },
  {
    pattern: /\b(?:Heidelburgh Tun|Heidelberg Tun|Heidelberg Castle)\b/i,
    sources: new Set(["heidelberg-castle-tun"]),
    label: "Heidelberg Tun"
  }
];

function assertPublicAllusionSupport(annotation) {
  for (const rule of allusionSupportRules) {
    if (!rule.pattern.test(annotation.note ?? "")) continue;
    const citations = new Set(annotation.citations ?? []);
    const hasSupport = [...rule.sources].some((sourceId) => citations.has(sourceId));
    assert(hasSupport, `Student-ready annotation ${annotation.id} makes a ${rule.label} allusion claim without a support-source citation.`);
  }
}

const publicToneReviewSignalPattern =
  /\b(?:racialized|racist|racial|colonial language|colonial-era|colonial expansion|slavery|coerced-labor|prejudice|prejudiced|exoticizing|savage|cannibal|civilized|Pagan|non-Christian|harmful|mental-health|stigmatizing|clinical diagnosis|period racial|period simile|imperial)\b/i;

function assertPublicToneReviewSupport(annotation) {
  const toneReviewText = `${annotation.anchor ?? ""} ${annotation.note ?? ""}`;
  if (!publicToneReviewSignalPattern.test(toneReviewText)) return;
  const validations = evidenceValidations(annotation);
  assert(
    validations.includes("tone-review"),
    `Student-ready annotation ${annotation.id} names difficult material but lacks tone-review evidence.`
  );
}

// Shakespeare-grade rubric gate: a public note that teaches external knowledge (vocabulary,
// allusion, history, cultural/nautical/cartographic/publication context) must ground that
// claim in a real non-Standard-Ebooks source. Pure source-text-observation and interpretive
// close-reading cruxes are exempt -- they lean on the Melville text itself. This generalizes
// the named-allusion support gate to every external claim type. See docs/CONTENT_STANDARDS.md.
const externalKnowledgeClaimTypes = new Set([
  "lexical",
  "historical-context",
  "biblical-context",
  "classical-context",
  "nautical-whaling",
  "cartographic",
  "publication-context"
]);

function assertPublicExternalSourceSupport(annotation) {
  for (const evidence of annotation.evidence ?? []) {
    if (!externalKnowledgeClaimTypes.has(evidence.claim_type)) continue;
    const hasExternalCitation = (evidence.citations ?? []).some(
      (citation) => citation && citation !== "standard-ebooks-moby-dick"
    );
    assert(
      hasExternalCitation,
      `Student-ready annotation ${annotation.id} makes a ${evidence.claim_type} claim without a non-Standard-Ebooks support source.`
    );
  }
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

function isWordLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function assertSelectorDoesNotCutWord(unitText, annotation) {
  const start = annotation.selector?.position?.start;
  const end = annotation.selector?.position?.end;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return;
  const exact = annotation.selector.exact;
  const before = unitText[start - 1] ?? "";
  const after = unitText[end] ?? "";
  assert(
    !(isWordLetter(before) && isWordLetter(exact[0])),
    `Annotation ${annotation.id} selector starts inside a word: ${annotation.selector.exact}`
  );
  assert(
    !(isWordLetter(after) && isWordLetter(exact[exact.length - 1])),
    `Annotation ${annotation.id} selector ends inside a word: ${annotation.selector.exact}`
  );
}

assert(manifest.chapter_count === 135, "Manifest should contain 135 chapters.");
assert(manifest.unit_count === 142, "Manifest should contain 142 reading units: 6 frontmatter units, 135 chapters, and the epilogue.");
assert(manifest.frontmatter_count === 6, "Manifest should contain 6 frontmatter units.");
assert(manifest.epilogue_count === 1, "Manifest should contain 1 epilogue unit.");
assert(Array.isArray(manifest.units), "Manifest units must be an array.");
assert(Array.isArray(manifest.chapters), "Manifest chapters must be an array.");
assert(manifest.chapters.length === manifest.chapter_count, "chapter_count must match chapters.length.");
assert(manifest.units.length === manifest.unit_count, "unit_count must match units.length.");

const seen = new Set();
const unitIds = new Set();
for (const [index, unit] of manifest.units.entries()) {
  assert(typeof unit.unit_id === "string" && unit.unit_id.length > 0, `Missing unit_id at sequence ${index + 1}`);
  assert(!unitIds.has(unit.unit_id), `Duplicate unit_id: ${unit.unit_id}`);
  unitIds.add(unit.unit_id);
  assert(unit.sequence === index + 1, `Bad sequence for ${unit.unit_id}: expected ${index + 1}, got ${unit.sequence}`);
  assert(["frontmatter", "chapter", "epilogue"].includes(unit.section_type), `Bad section_type for ${unit.unit_id}`);
  assert(typeof unit.slug === "string" && /^[a-z0-9-]+$/.test(unit.slug), `Bad slug for ${unit.unit_id}`);
  assert(typeof unit.title === "string" && unit.title.length > 0, `Missing title for ${unit.unit_id}`);
  assert(typeof unit.source_path === "string" && unit.source_path.endsWith(".xhtml"), `Bad source path for ${unit.unit_id}`);
  assert(Number.isInteger(unit.word_count) && unit.word_count > 0, `Bad word count for ${unit.unit_id}`);
  assert(Array.isArray(unit.functions) && unit.functions.length > 0, `Missing functions for ${unit.unit_id}`);
  for (const chapterFunction of unit.functions) {
    assert(allowedFunctions.has(chapterFunction), `Unknown function "${chapterFunction}" for ${unit.unit_id}`);
  }
  assert(unit.paths?.full_text === "required", `${unit.unit_id} must be required in full_text.`);
  assert(unit.summaries && typeof unit.summaries === "object", `Missing summaries for ${unit.unit_id}`);
  assert(["high", "medium", "low"].includes(unit.metadata_status?.classification_confidence), `Bad classification confidence for ${unit.unit_id}`);
  assert(["verified", "provisional", "needs-review"].includes(unit.metadata_status?.citation_status), `Bad citation status for ${unit.unit_id}`);
}

for (const chapter of manifest.chapters) {
  assert(chapter.section_type === "chapter", `Non-chapter in chapters array: ${chapter.unit_id}`);
  assert(Number.isInteger(chapter.number), `Chapter number missing: ${JSON.stringify(chapter)}`);
  assert(chapter.number >= 1 && chapter.number <= 135, `Chapter number out of range: ${chapter.number}`);
  assert(!seen.has(chapter.number), `Duplicate chapter number: ${chapter.number}`);
  seen.add(chapter.number);
  assert(chapter.slug === `chapter-${String(chapter.number).padStart(3, "0")}-${chapter.slug.replace(/^chapter-\d{3}-/, "")}`, `Bad chapter slug prefix for chapter ${chapter.number}`);
  assert(chapter.source_path.endsWith(`chapter-${chapter.number}.xhtml`), `Bad source path for chapter ${chapter.number}`);
}

for (let number = 1; number <= 135; number += 1) {
  assert(seen.has(number), `Missing chapter ${number}`);
}

assert(manifest.units.some((unit) => unit.section_type === "epilogue" && unit.title === "Epilogue"), "Missing epilogue unit.");
assert(manifest.chapters.filter((chapter) => chapter.functions.includes("unknown")).length < 40, "Too many chapters remain unclassified for the Phase 1 seed.");
assert(manifest.chapters.filter((chapter) => chapter.paths.narrative_core === "required").length >= 50, "Narrative core seed is unexpectedly thin.");
assert(manifest.chapters.filter((chapter) => chapter.paths.classroom_standard === "required" || chapter.paths.classroom_standard === "recommended").length >= 80, "Classroom standard seed is unexpectedly thin.");

assert(Array.isArray(sourceRecords.records), "Source records must have a records array.");
const sourceIds = new Set();
for (const record of sourceRecords.records) {
  assert(typeof record.id === "string" && /^[a-z0-9-]+$/.test(record.id), `Bad source record id: ${record.id}`);
  assert(!sourceIds.has(record.id), `Duplicate source record id: ${record.id}`);
  sourceIds.add(record.id);
  assert(
    [
      "source-text",
      "dictionary",
      "encyclopedia",
      "biblical-text",
      "classical-text",
      "historical-primary",
      "historical-secondary",
      "scholarly",
      "map",
      "image",
      "license",
      "other"
    ].includes(record.kind),
    `Unexpected source record kind for ${record.id}`
  );
  assert(typeof record.title === "string" && record.title.length > 0, `Missing source title for ${record.id}`);
  assert(typeof record.url === "string" && record.url.startsWith("https://"), `Bad source URL for ${record.id}`);
  assert(typeof record.license_note === "string" && record.license_note.length > 0, `Missing license note for ${record.id}`);
}

for (const requiredSource of [
  "standard-ebooks-moby-dick",
  "project-gutenberg-2701",
  "internet-archive-mobydickorwhale01melv"
]) {
  assert(sourceIds.has(requiredSource), `Missing required source record: ${requiredSource}`);
  assert(
    sourceRecords.records.find((record) => record.id === requiredSource)?.kind === "source-text",
    `Required source record must be a source-text: ${requiredSource}`
  );
}

const manifestUnitIds = new Set(manifest.units.map((unit) => unit.unit_id));
assert(Array.isArray(glossary.entries), "Glossary must have an entries array.");
const glossaryIds = new Set();
for (const entry of glossary.entries) {
  assert(typeof entry.id === "string" && /^[a-z0-9-]+$/.test(entry.id), `Bad glossary id: ${entry.id}`);
  assert(!glossaryIds.has(entry.id), `Duplicate glossary id: ${entry.id}`);
  glossaryIds.add(entry.id);
  assert(typeof entry.term === "string" && entry.term.length > 0, `Missing glossary term for ${entry.id}`);
  assert(typeof entry.definition === "string" && entry.definition.length > 0, `Missing glossary definition for ${entry.id}`);
  assert(Array.isArray(entry.targets), `Glossary entry ${entry.id} must have targets.`);
  for (const target of entry.targets) {
    assert(manifestUnitIds.has(target), `Glossary entry ${entry.id} references unknown target ${target}`);
  }
  for (const citation of entry.citations ?? []) {
    assert(sourceIds.has(citation), `Glossary entry ${entry.id} references unknown citation ${citation}`);
  }
  assert(["student-ready", "draft", "needs-review"].includes(entry.status?.definition_status), `Bad glossary definition status for ${entry.id}`);
  assert(["verified", "provisional", "needs-review"].includes(entry.status?.citation_status), `Bad glossary citation status for ${entry.id}`);
  if (entry.status.definition_status === "student-ready") {
    assert(entry.status.citation_status === "verified", `Student-ready glossary entry ${entry.id} must have verified citations.`);
    assert(entry.definition.length >= 20, `Student-ready glossary entry ${entry.id} definition is too short.`);
    assert(entry.definition.length <= 260, `Student-ready glossary entry ${entry.id} definition is too long.`);
    assert(entry.citations.length > 0, `Student-ready glossary entry ${entry.id} must cite at least one source.`);
    assertNoPublicProseResidue(entry.id, entry.definition);
  }
}

assert(Array.isArray(referenceCards.cards), "Reference cards must have a cards array.");
const referenceIds = new Set();
for (const card of referenceCards.cards) {
  assert(typeof card.id === "string" && /^[a-z0-9-]+$/.test(card.id), `Bad reference card id: ${card.id}`);
  assert(!referenceIds.has(card.id), `Duplicate reference card id: ${card.id}`);
  referenceIds.add(card.id);
  assert(typeof card.summary === "string" && card.summary.length > 0, `Missing reference summary for ${card.id}`);
  assert(typeof card.student_note === "string" && card.student_note.length > 0, `Missing reference student note for ${card.id}`);
  for (const target of card.targets) {
    assert(manifestUnitIds.has(target), `Reference card ${card.id} references unknown target ${target}`);
  }
  for (const citation of card.citations) {
    assert(sourceIds.has(citation), `Reference card ${card.id} references unknown citation ${citation}`);
  }
  assert(["student-ready", "draft", "needs-review"].includes(card.status?.content_status), `Bad reference content status for ${card.id}`);
  assert(["verified", "provisional", "needs-review"].includes(card.status?.citation_status), `Bad reference citation status for ${card.id}`);
  if (card.status.content_status === "student-ready") {
    assert(card.status.citation_status === "verified", `Student-ready reference card ${card.id} must have verified citations.`);
    assert(card.summary.length >= 50, `Student-ready reference card ${card.id} summary is too short.`);
    assert(card.summary.length <= 320, `Student-ready reference card ${card.id} summary is too long.`);
    assert(card.student_note.length >= 60, `Student-ready reference card ${card.id} student note is too short.`);
    assert(card.student_note.length <= 420, `Student-ready reference card ${card.id} student note is too long.`);
    assert(card.citations.length > 0, `Student-ready reference card ${card.id} must cite at least one source.`);
    assertNoPublicProseResidue(card.id, card.summary);
    assertNoPublicProseResidue(card.id, card.student_note);
  }
}

assert(Array.isArray(voyageMap.waypoints) && voyageMap.waypoints.length > 0, "Voyage map must have waypoints.");
const waypointIds = new Set();
for (const waypoint of voyageMap.waypoints) {
  assert(typeof waypoint.id === "string" && /^[a-z0-9-]+$/.test(waypoint.id), `Bad waypoint id: ${waypoint.id}`);
  assert(!waypointIds.has(waypoint.id), `Duplicate waypoint id: ${waypoint.id}`);
  waypointIds.add(waypoint.id);
  assert(Number.isInteger(waypoint.chapter_start) && waypoint.chapter_start >= 1 && waypoint.chapter_start <= 135, `Bad waypoint start for ${waypoint.id}`);
  assert(Number.isInteger(waypoint.chapter_end) && waypoint.chapter_end >= waypoint.chapter_start && waypoint.chapter_end <= 135, `Bad waypoint end for ${waypoint.id}`);
  assert(Array.isArray(waypoint.coordinates) && waypoint.coordinates.length === 2, `Bad waypoint coordinates for ${waypoint.id}`);
  assert(typeof waypoint.student_note === "string" && waypoint.student_note.length > 0, `Missing waypoint note for ${waypoint.id}`);
}

assert(Array.isArray(taxonomy.trails), "Taxonomy must have a trails array.");
assert(Array.isArray(taxonomy.entities), "Taxonomy must have an entities array.");
const trailIds = new Set();
const entityIds = new Set();
const allowedEntityKinds = new Set(["character", "place", "ship", "animal", "symbol", "theme", "form", "concept", "allusion", "topic"]);
for (const trail of taxonomy.trails) {
  assert(typeof trail.id === "string" && /^[a-z0-9-]+$/.test(trail.id), `Bad trail id: ${trail.id}`);
  assert(!trailIds.has(trail.id), `Duplicate trail id: ${trail.id}`);
  trailIds.add(trail.id);
  assert(typeof trail.label === "string" && trail.label.length > 0, `Missing trail label for ${trail.id}`);
  assert(typeof trail.description === "string" && trail.description.length > 0, `Missing trail description for ${trail.id}`);
  assert(Array.isArray(trail.tags), `Trail ${trail.id} must have tags.`);
  for (const tag of trail.tags) {
    assert(/^[a-z0-9][a-z0-9:-]*$/.test(tag), `Bad trail tag for ${trail.id}: ${tag}`);
  }
  assert(["student-ready", "draft", "needs-review"].includes(trail.status?.content_status), `Bad trail content status for ${trail.id}`);
  assert(["verified", "provisional", "needs-review"].includes(trail.status?.citation_status), `Bad trail citation status for ${trail.id}`);
}
for (const entity of taxonomy.entities) {
  assert(typeof entity.id === "string" && /^[a-z0-9-]+$/.test(entity.id), `Bad entity id: ${entity.id}`);
  assert(!entityIds.has(entity.id), `Duplicate entity id: ${entity.id}`);
  entityIds.add(entity.id);
  assert(typeof entity.label === "string" && entity.label.length > 0, `Missing entity label for ${entity.id}`);
  assert(allowedEntityKinds.has(entity.kind), `Bad entity kind for ${entity.id}: ${entity.kind}`);
  assert(Array.isArray(entity.aliases), `Entity ${entity.id} must have aliases.`);
  assert(Array.isArray(entity.citations), `Entity ${entity.id} must have citations.`);
  for (const citation of entity.citations) {
    assert(sourceIds.has(citation), `Entity ${entity.id} references unknown citation ${citation}`);
  }
  assert(["student-ready", "draft", "needs-review"].includes(entity.status?.content_status), `Bad entity content status for ${entity.id}`);
  assert(["verified", "provisional", "needs-review"].includes(entity.status?.citation_status), `Bad entity citation status for ${entity.id}`);
}

assert(Array.isArray(geography.places), "Geography registry must have a places array.");
const placeIds = new Set();
for (const place of geography.places) {
  assert(typeof place.id === "string" && /^[a-z0-9-]+$/.test(place.id), `Bad place id: ${place.id}`);
  assert(!placeIds.has(place.id), `Duplicate place id: ${place.id}`);
  placeIds.add(place.id);
  assert(typeof place.label === "string" && place.label.length > 0, `Missing place label for ${place.id}`);
  assert(["city-or-island", "port", "island", "ocean-region", "ship-route-stage", "landmark", "other"].includes(place.kind), `Bad place kind for ${place.id}`);
  assert(entityIds.has(place.entity_id), `Place ${place.id} references unknown entity ${place.entity_id}`);
  assert(Array.isArray(place.coordinates) && place.coordinates.length === 2, `Place ${place.id} must have lon/lat coordinates.`);
  assert(place.coordinates[0] >= -180 && place.coordinates[0] <= 180, `Bad longitude for place ${place.id}`);
  assert(place.coordinates[1] >= -90 && place.coordinates[1] <= 90, `Bad latitude for place ${place.id}`);
  assert(["verified", "provisional", "display-anchor", "unknown"].includes(place.coordinate_status), `Bad coordinate status for ${place.id}`);
  assert(Array.isArray(place.chapter_targets), `Place ${place.id} must list chapter targets.`);
  for (const target of place.chapter_targets) {
    assert(manifestUnitIds.has(target), `Place ${place.id} references unknown target ${target}`);
  }
  assert(typeof place.source_note === "string" && place.source_note.length > 0, `Missing source note for place ${place.id}`);
  for (const citation of place.citations) {
    assert(sourceIds.has(citation), `Place ${place.id} references unknown citation ${citation}`);
  }
  if (place.coordinate_status === "display-anchor") {
    assert(place.status.citation_status !== "verified", `Display-anchor place ${place.id} should not have verified citation status.`);
  }
  assert(["student-ready", "draft", "needs-review"].includes(place.status?.content_status), `Bad place content status for ${place.id}`);
  assert(["verified", "provisional", "needs-review"].includes(place.status?.citation_status), `Bad place citation status for ${place.id}`);
}

const allowedAnnotationKinds = new Set(["gloss", "context", "form", "theme", "difficult-material", "map", "teacher-note"]);
const allowedDepths = new Set(["read", "guide", "study", "explore", "teacher"]);
const allowedSurfaces = new Set(["reader", "margin-card", "trail", "index", "search", "map", "review", "teacher"]);
const allowedSpoilerLevels = new Set(["none", "mild", "major", "teacher-only"]);
const allowedReviewQueues = new Set(["source-check", "citation", "tone", "difficult-material", "interpretive", "teacher", "density", "selector"]);
const allowedEvidenceValidation = new Set([
  "selector-resolves",
  "primary-source-checked",
  "reference-source-checked",
  "adversarial-review",
  "tone-review",
  "needs-review"
]);
const allowedClaimTypes = new Set([
  "source-text-observation",
  "lexical",
  "historical-context",
  "biblical-context",
  "classical-context",
  "nautical-whaling",
  "interpretive",
  "difficult-material",
  "cartographic",
  "publication-context"
]);
const layerDepthIds = new Set();

assert(Array.isArray(annotationLayers.depths), "Annotation layer registry must have depths.");
for (const depth of annotationLayers.depths) {
  assert(allowedDepths.has(depth.id), `Unknown annotation depth: ${depth.id}`);
  assert(!layerDepthIds.has(depth.id), `Duplicate annotation depth: ${depth.id}`);
  layerDepthIds.add(depth.id);
  assert(typeof depth.title === "string" && depth.title.length > 0, `Missing annotation depth title for ${depth.id}`);
  assert(typeof depth.inline_annotations === "boolean", `Bad inline_annotations flag for ${depth.id}`);
  assert(Array.isArray(depth.apparatus), `Depth ${depth.id} must list apparatus.`);
  assert(typeof depth.student_visible === "boolean", `Bad student_visible flag for ${depth.id}`);
}

for (const depthId of allowedDepths) {
  assert(layerDepthIds.has(depthId), `Annotation layer registry missing depth: ${depthId}`);
}

for (const kind of allowedAnnotationKinds) {
  const defaults = annotationLayers.kind_defaults?.[kind];
  assert(defaults, `Annotation layer registry missing kind default: ${kind}`);
  assert(layerDepthIds.has(defaults.depth), `Kind default ${kind} references unknown depth ${defaults.depth}`);
  assert(Number.isInteger(defaults.priority) && defaults.priority >= 1 && defaults.priority <= 5, `Bad priority for kind default ${kind}`);
  assert(typeof defaults.inline === "boolean", `Bad inline flag for kind default ${kind}`);
  assert(Array.isArray(defaults.surfaces) && defaults.surfaces.length > 0, `Kind default ${kind} must list surfaces.`);
  for (const surface of defaults.surfaces) {
    assert(allowedSurfaces.has(surface), `Kind default ${kind} references unknown surface ${surface}`);
  }
  assert(allowedSpoilerLevels.has(defaults.spoiler_level), `Kind default ${kind} has bad spoiler level ${defaults.spoiler_level}`);
}

assert(Array.isArray(annotations.annotations), "Annotations must have an annotations array.");
const annotationIds = new Set();
const pendingAnnotationRelationships = [];
function evidenceValidations(annotation) {
  return (annotation.evidence ?? []).flatMap((evidence) => evidence.validation ?? []);
}

for (const annotation of annotations.annotations) {
  assert(typeof annotation.id === "string" && /^[a-z0-9-]+$/.test(annotation.id), `Bad annotation id: ${annotation.id}`);
  assert(!annotationIds.has(annotation.id), `Duplicate annotation id: ${annotation.id}`);
  annotationIds.add(annotation.id);
  assert(allowedAnnotationKinds.has(annotation.kind), `Annotation ${annotation.id} has unknown kind ${annotation.kind}`);
  assert(manifestUnitIds.has(annotation.unit_id), `Annotation ${annotation.id} references unknown unit ${annotation.unit_id}`);
  assert(annotation.selector?.type === "TextQuoteSelector", `Annotation ${annotation.id} must use a TextQuoteSelector.`);
  assert(typeof annotation.selector?.exact === "string" && annotation.selector.exact.length > 0, `Missing selector exact text for ${annotation.id}`);
  assert(annotation.selector.prefix === undefined || typeof annotation.selector.prefix === "string", `Bad selector prefix for ${annotation.id}`);
  assert(annotation.selector.suffix === undefined || typeof annotation.selector.suffix === "string", `Bad selector suffix for ${annotation.id}`);
  if (annotation.selector.position) {
    assert(Number.isInteger(annotation.selector.position.start) && annotation.selector.position.start >= 0, `Bad selector start for ${annotation.id}`);
    assert(Number.isInteger(annotation.selector.position.end) && annotation.selector.position.end > annotation.selector.position.start, `Bad selector end for ${annotation.id}`);
    assert(annotation.selector.position.generated === true, `Selector position should be marked generated for ${annotation.id}`);
  }
  assert(layerDepthIds.has(annotation.display?.depth), `Annotation ${annotation.id} references unknown display depth ${annotation.display?.depth}`);
  assert(Number.isInteger(annotation.display?.priority) && annotation.display.priority >= 1 && annotation.display.priority <= 5, `Bad display priority for ${annotation.id}`);
  assert(typeof annotation.display?.inline === "boolean", `Bad display inline flag for ${annotation.id}`);
  assert(Array.isArray(annotation.display?.surfaces) && annotation.display.surfaces.length > 0, `Annotation ${annotation.id} must list display surfaces.`);
  for (const surface of annotation.display.surfaces) {
    assert(allowedSurfaces.has(surface), `Annotation ${annotation.id} references unknown surface ${surface}`);
  }
  assert(allowedSpoilerLevels.has(annotation.display?.spoiler_level), `Annotation ${annotation.id} has bad spoiler level ${annotation.display?.spoiler_level}`);
  assert(typeof annotation.anchor === "string" && annotation.anchor.length > 0, `Missing annotation anchor for ${annotation.id}`);
  assert(typeof annotation.note === "string" && annotation.note.length > 0, `Missing annotation note for ${annotation.id}`);
  assert(Array.isArray(annotation.tags), `Annotation ${annotation.id} must have tags.`);
  for (const tag of annotation.tags) {
    assert(/^[a-z0-9][a-z0-9:-]*$/.test(tag), `Bad annotation tag for ${annotation.id}: ${tag}`);
  }
  assert(Array.isArray(annotation.relationships), `Annotation ${annotation.id} must have relationships.`);
  for (const relationship of annotation.relationships) {
    pendingAnnotationRelationships.push({ annotationId: annotation.id, relationship });
  }
  assert(Array.isArray(annotation.evidence) && annotation.evidence.length > 0, `Annotation ${annotation.id} must have at least one evidence record.`);
  for (const evidence of annotation.evidence) {
    assert(allowedClaimTypes.has(evidence.claim_type), `Annotation ${annotation.id} has bad claim type ${evidence.claim_type}`);
    assert(Array.isArray(evidence.citations), `Annotation ${annotation.id} evidence must list citations.`);
    for (const citation of evidence.citations) {
      assert(sourceIds.has(citation), `Annotation ${annotation.id} evidence references unknown citation ${citation}`);
    }
    assert(Array.isArray(evidence.validation) && evidence.validation.length > 0, `Annotation ${annotation.id} evidence must list validation layers.`);
    for (const validation of evidence.validation) {
      assert(allowedEvidenceValidation.has(validation), `Annotation ${annotation.id} has bad evidence validation ${validation}`);
    }
  }
  for (const citation of annotation.citations ?? []) {
    assert(sourceIds.has(citation), `Annotation ${annotation.id} references unknown citation ${citation}`);
  }
  assert(typeof annotation.provenance?.author === "string" && annotation.provenance.author.length > 0, `Annotation ${annotation.id} needs provenance author.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(annotation.provenance?.created ?? ""), `Annotation ${annotation.id} needs provenance created date.`);
  assert(["hand-authored", "source-checked-draft", "subagent-draft", "migration", "reviewed"].includes(annotation.provenance?.method), `Annotation ${annotation.id} has bad provenance method.`);
  assert(["student-ready", "draft", "needs-review"].includes(annotation.status?.content_status), `Bad annotation content status for ${annotation.id}`);
  assert(["verified", "provisional", "needs-review"].includes(annotation.status?.citation_status), `Bad annotation citation status for ${annotation.id}`);
  assert(Array.isArray(annotation.status?.review_queue), `Annotation ${annotation.id} must have a review queue.`);
  for (const reviewItem of annotation.status.review_queue) {
    assert(allowedReviewQueues.has(reviewItem), `Annotation ${annotation.id} has bad review queue item ${reviewItem}`);
  }
  if (annotation.status.citation_status !== "verified") {
    assert(annotation.status.review_queue.includes("citation"), `Annotation ${annotation.id} has provisional citations but is missing citation review.`);
  }
  if (annotation.display.surfaces.includes("reader")) {
    assert(annotation.status.content_status === "student-ready", `Reader-facing annotation ${annotation.id} must be student-ready.`);
    assert(annotation.status.citation_status === "verified", `Reader-facing annotation ${annotation.id} must have verified citations.`);
    assert(annotation.status.review_queue.length === 0, `Reader-facing annotation ${annotation.id} must have an empty review queue.`);
    assert(annotation.display.depth === "study", `Reader-facing annotation ${annotation.id} must display at Study depth.`);
  }
  if (annotation.tags.includes("review:internal-only") || annotation.tags.includes("review:retire-candidate")) {
    assert(!annotation.display.surfaces.includes("reader"), `Internal/retire annotation ${annotation.id} must not be reader-facing.`);
    assert(annotation.display.inline === false, `Internal/retire annotation ${annotation.id} must not be inline.`);
    assert(annotation.display.depth !== "study", `Internal/retire annotation ${annotation.id} must not remain at Study depth.`);
    assert(annotation.display.surfaces.includes("review"), `Internal/retire annotation ${annotation.id} must remain available to review.`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(annotation.provenance?.retired ?? ""), `Internal/retire annotation ${annotation.id} must have a retired date.`);
  }
  if (annotation.status.content_status === "student-ready") {
    const validations = evidenceValidations(annotation);
    assert(annotation.status.citation_status === "verified", `Student-ready annotation ${annotation.id} must have verified citations.`);
    assert(annotation.status.review_queue.length === 0, `Student-ready annotation ${annotation.id} must not remain in review queues.`);
    assert(!validations.includes("needs-review"), `Student-ready annotation ${annotation.id} still has needs-review evidence.`);
    assert(validations.includes("selector-resolves"), `Student-ready annotation ${annotation.id} must have selector-resolves evidence.`);
    assert(validations.includes("primary-source-checked"), `Student-ready annotation ${annotation.id} must have primary-source-checked evidence.`);
    assert(validations.includes("adversarial-review"), `Student-ready annotation ${annotation.id} must have adversarial-review evidence.`);
    assert(annotation.provenance.method === "reviewed", `Student-ready annotation ${annotation.id} must have reviewed provenance.`);
    assert(typeof annotation.provenance.reviewer === "string" && annotation.provenance.reviewer.length > 0, `Student-ready annotation ${annotation.id} must name a reviewer.`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(annotation.provenance.reviewed ?? ""), `Student-ready annotation ${annotation.id} must have a reviewed date.`);
    assert(annotation.note.length >= 80, `Student-ready annotation ${annotation.id} is too short to be useful.`);
    assert(annotation.note.length <= 420, `Student-ready annotation ${annotation.id} is too long for a Study card.`);
    assertNoPublicProseResidue(annotation.id, annotation.note);
    assertPublicAllusionSupport(annotation);
    assertPublicToneReviewSupport(annotation);
    assertPublicExternalSourceSupport(annotation);
  }
  if (annotation.kind === "difficult-material") {
    assert(annotation.status.review_queue.includes("difficult-material"), `Difficult-material annotation ${annotation.id} must stay in difficult-material review.`);
    assert(annotation.status.review_queue.includes("tone"), `Difficult-material annotation ${annotation.id} must stay in tone review.`);
  }
}

function relationshipTargetExists(target) {
  const [namespace, ...rest] = target.split(":");
  const id = rest.join(":");
  if (!namespace || !id) return false;
  if (namespace === "source") return sourceIds.has(id);
  if (namespace === "glossary") return glossaryIds.has(id);
  if (namespace === "reference") return referenceIds.has(id);
  if (namespace === "waypoint") return waypointIds.has(id);
  if (namespace === "annotation") return annotationIds.has(id);
  if (namespace === "unit") return manifestUnitIds.has(id);
  if (namespace === "trail") return trailIds.has(id);
  if (namespace === "entity") return entityIds.has(id);
  return false;
}

for (const { annotationId, relationship } of pendingAnnotationRelationships) {
  assert(typeof relationship.type === "string" && relationship.type.length > 0, `Annotation ${annotationId} has a relationship without a type.`);
  assert(typeof relationship.target === "string" && relationship.target.length > 0, `Annotation ${annotationId} has a relationship without a target.`);
  assert(relationshipTargetExists(relationship.target), `Annotation ${annotationId} relationship target does not exist: ${relationship.target}`);
}

assert(Array.isArray(teacherPackets.packets), "Teacher packets must have a packets array.");
const teacherPacketIds = new Set();
const teacherPacketUnitIds = new Set();
const annotationById = new Map(annotations.annotations.map((annotation) => [annotation.id, annotation]));
const requiredTeacherPacketUnitIds = new Set(
  manifest.units
    .filter((unit) => unit.unit_id !== "frontmatter-halftitlepage")
    .map((unit) => unit.unit_id)
);
const allowedTeacherPacketReviewQueues = new Set(["teacher", "source-check", "citation", "tone", "difficult-material", "interpretive"]);

for (const packet of teacherPackets.packets) {
  assert(typeof packet.id === "string" && /^[a-z0-9-]+$/.test(packet.id), `Bad teacher packet id: ${packet.id}`);
  assert(!teacherPacketIds.has(packet.id), `Duplicate teacher packet id: ${packet.id}`);
  teacherPacketIds.add(packet.id);
  assert(requiredTeacherPacketUnitIds.has(packet.unit_id), `Teacher packet ${packet.id} references unsupported unit ${packet.unit_id}`);
  assert(!teacherPacketUnitIds.has(packet.unit_id), `Duplicate teacher packet for unit ${packet.unit_id}`);
  teacherPacketUnitIds.add(packet.unit_id);
  assert(typeof packet.essential_question === "string" && packet.essential_question.length > 0, `Teacher packet ${packet.id} needs an essential question.`);
  assert(Array.isArray(packet.discussion_prompts) && packet.discussion_prompts.length >= 2, `Teacher packet ${packet.id} needs at least two discussion prompts.`);
  const promptIds = new Set();
  const promptTexts = new Set();
  for (const prompt of packet.discussion_prompts) {
    assert(typeof prompt.id === "string" && /^[a-z0-9-]+$/.test(prompt.id), `Bad teacher prompt id in ${packet.id}: ${prompt.id}`);
    assert(!promptIds.has(prompt.id), `Duplicate prompt id in ${packet.id}: ${prompt.id}`);
    promptIds.add(prompt.id);
    const normalizedPrompt = prompt.prompt.replace(/\s+/g, " ").trim().toLowerCase();
    assert(!promptTexts.has(normalizedPrompt), `Duplicate prompt text in ${packet.id}: ${prompt.prompt}`);
    promptTexts.add(normalizedPrompt);
    assert(typeof prompt.prompt === "string" && prompt.prompt.length > 0, `Teacher prompt ${prompt.id} needs text.`);
    assert(
      (prompt.linked_annotations?.length ?? 0) + (prompt.linked_reference_cards?.length ?? 0) + (prompt.linked_trails?.length ?? 0) > 0,
      `Teacher prompt ${prompt.id} must link to an annotation, reference card, or trail.`
    );
    for (const id of prompt.linked_annotations ?? []) {
      assert(annotationIds.has(id), `Teacher prompt ${prompt.id} references unknown annotation ${id}`);
    }
    for (const id of prompt.linked_reference_cards ?? []) {
      assert(referenceIds.has(id), `Teacher prompt ${prompt.id} references unknown reference card ${id}`);
    }
    for (const id of prompt.linked_trails ?? []) {
      assert(trailIds.has(id), `Teacher prompt ${prompt.id} references unknown trail ${id}`);
    }
  }
  assert(Array.isArray(packet.likely_misreadings) && packet.likely_misreadings.length > 0, `Teacher packet ${packet.id} needs likely misreadings.`);
  for (const id of packet.difficult_material_handles ?? []) {
    assert(annotationById.get(id)?.kind === "difficult-material", `Teacher packet ${packet.id} has a non-difficult-material handle ${id}`);
  }
  for (const id of packet.linked_annotations ?? []) {
    assert(annotationIds.has(id), `Teacher packet ${packet.id} references unknown annotation ${id}`);
  }
  for (const id of packet.linked_reference_cards ?? []) {
    assert(referenceIds.has(id), `Teacher packet ${packet.id} references unknown reference card ${id}`);
  }
  for (const id of packet.linked_trails ?? []) {
    assert(trailIds.has(id), `Teacher packet ${packet.id} references unknown trail ${id}`);
  }
  assert(typeof packet.teacher_takeaway === "string" && packet.teacher_takeaway.length > 0, `Teacher packet ${packet.id} needs a takeaway.`);
  assert(["student-ready", "draft", "needs-review"].includes(packet.status?.content_status), `Bad teacher packet content status for ${packet.id}`);
  assert(["verified", "provisional", "needs-review"].includes(packet.status?.citation_status), `Bad teacher packet citation status for ${packet.id}`);
  assert(Array.isArray(packet.status?.review_queue), `Teacher packet ${packet.id} must have a review queue.`);
  assert(packet.status.review_queue.includes("teacher"), `Teacher packet ${packet.id} must stay in teacher review.`);
  if (packet.status.citation_status !== "verified") {
    assert(packet.status.review_queue.includes("citation"), `Teacher packet ${packet.id} has provisional citations but is missing citation review.`);
  }
  if ((packet.difficult_material_handles ?? []).length > 0) {
    assert(packet.status.review_queue.includes("difficult-material"), `Teacher packet ${packet.id} with difficult material needs difficult-material review.`);
    assert(packet.status.review_queue.includes("tone"), `Teacher packet ${packet.id} with difficult material needs tone review.`);
  }
  for (const reviewItem of packet.status.review_queue) {
    assert(allowedTeacherPacketReviewQueues.has(reviewItem), `Teacher packet ${packet.id} has bad review queue item ${reviewItem}`);
  }
}

for (const unitId of requiredTeacherPacketUnitIds) {
  assert(teacherPacketUnitIds.has(unitId), `Missing teacher packet for ${unitId}`);
}

const guideData = await loadGuideData();
const guideUnitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
for (const annotation of annotations.annotations) {
  const unit = guideUnitsById.get(annotation.unit_id);
  assert(
    unit?.plain_text?.toLowerCase().includes(annotation.anchor.toLowerCase()),
    `Annotation ${annotation.id} anchor does not appear in displayed text for ${annotation.unit_id}: ${annotation.anchor}`
  );
  const selectorMatches = textQuoteMatches(unit.plain_text, annotation.selector);
  assert(
    selectorMatches.length > 0,
    `Annotation ${annotation.id} selector does not resolve in displayed text for ${annotation.unit_id}: ${annotation.selector.exact}`
  );
  if ((annotation.selector.prefix || annotation.selector.suffix) && selectorMatches.length !== 1) {
    throw new Error(`Annotation ${annotation.id} selector should resolve to one passage; found ${selectorMatches.length}.`);
  }
  if (annotation.selector.position) {
    const start = annotation.selector.position.start;
    const end = annotation.selector.position.end;
    assert(unit.plain_text.slice(start, end) === annotation.selector.exact, `Annotation ${annotation.id} generated selector position does not match exact text.`);
    assertSelectorDoesNotCutWord(unit.plain_text, annotation);
  }
}

assert(annotationsByUnit.annotation_count === annotationIds.size, "annotations-by-unit count must match annotation records.");
assert(annotationsByUnit.unit_count === manifest.unit_count, "annotations-by-unit unit count must match manifest.");
assert(annotationsByUnit.units && typeof annotationsByUnit.units === "object", "annotations-by-unit must have a units object.");
const indexedAnnotationIds = new Set();
for (const unit of manifest.units) {
  const pack = annotationsByUnit.units[unit.unit_id];
  assert(pack, `annotations-by-unit missing pack for ${unit.unit_id}`);
  assert(pack.sequence === unit.sequence, `Bad annotation index sequence for ${unit.unit_id}`);
  assert(Array.isArray(pack.annotations), `Annotation pack for ${unit.unit_id} must have annotations.`);
  const expected = annotations.annotations.filter((annotation) => annotation.unit_id === unit.unit_id);
  assert(pack.annotation_count === expected.length, `Bad annotation count for ${unit.unit_id}`);
  assert(pack.inline_annotation_count === expected.filter((annotation) => annotation.display.inline && annotation.display.surfaces.includes("reader")).length, `Bad inline annotation count for ${unit.unit_id}`);
  for (const annotation of pack.annotations) {
    assert(annotationIds.has(annotation.id), `Annotation index references unknown annotation ${annotation.id}`);
    assert(annotation.unit_id === unit.unit_id, `Annotation ${annotation.id} appears in the wrong unit pack.`);
    assert(!indexedAnnotationIds.has(annotation.id), `Annotation ${annotation.id} appears in more than one unit pack.`);
    indexedAnnotationIds.add(annotation.id);
  }
}
assert(indexedAnnotationIds.size === annotationIds.size, "annotations-by-unit must include every annotation exactly once.");

assert(annotationsByTag.tags && typeof annotationsByTag.tags === "object", "annotations-by-tag must have a tags object.");
const expectedTags = new Map();
for (const annotation of annotations.annotations) {
  for (const tag of annotation.tags) {
    if (!expectedTags.has(tag)) expectedTags.set(tag, []);
    expectedTags.get(tag).push(annotation.id);
  }
}
assert(annotationsByTag.tag_count === expectedTags.size, "annotations-by-tag tag count must match annotation tags.");
for (const [tag, ids] of expectedTags.entries()) {
  const tagPack = annotationsByTag.tags[tag];
  assert(tagPack, `annotations-by-tag missing tag ${tag}`);
  assert(tagPack.annotation_count === ids.length, `Bad annotation count for tag ${tag}`);
  for (const id of ids) {
    assert(tagPack.annotations.includes(id), `Tag ${tag} is missing annotation ${id}`);
  }
}

assert(annotationsByEntity.entities && typeof annotationsByEntity.entities === "object", "annotations-by-entity must have an entities object.");
assert(annotationsByEntity.entity_count === entityIds.size, "annotations-by-entity entity count must match taxonomy entities.");
const coveredEntityCount = Object.values(annotationsByEntity.entities).filter((entity) => entity.annotation_count > 0).length;
assert(annotationsByEntity.covered_entity_count === coveredEntityCount, "annotations-by-entity covered count must match entity buckets.");
for (const [entityId, entityPack] of Object.entries(annotationsByEntity.entities)) {
  assert(entityIds.has(entityId), `annotations-by-entity references unknown entity ${entityId}`);
  assert(entityPack.annotation_count === entityPack.annotations.length, `Bad annotation count for entity ${entityId}`);
  for (const annotationId of entityPack.annotations) {
    assert(annotationIds.has(annotationId), `Entity ${entityId} references unknown annotation ${annotationId}`);
  }
  for (const unitId of entityPack.units) {
    assert(manifestUnitIds.has(unitId), `Entity ${entityId} references unknown unit ${unitId}`);
  }
}

assert(annotationsByTrail.trails && typeof annotationsByTrail.trails === "object", "annotations-by-trail must have a trails object.");
assert(annotationsByTrail.trail_count === trailIds.size, "annotations-by-trail trail count must match taxonomy trails.");
const coveredTrailCount = Object.values(annotationsByTrail.trails).filter((trail) => trail.annotation_count > 0).length;
assert(annotationsByTrail.covered_trail_count === coveredTrailCount, "annotations-by-trail covered count must match trail buckets.");
for (const [trailId, trailPack] of Object.entries(annotationsByTrail.trails)) {
  assert(trailIds.has(trailId), `annotations-by-trail references unknown trail ${trailId}`);
  assert(trailPack.annotation_count === trailPack.annotations.length, `Bad annotation count for trail ${trailId}`);
  for (const annotationId of trailPack.annotations) {
    assert(annotationIds.has(annotationId), `Trail ${trailId} references unknown annotation ${annotationId}`);
  }
  for (const unitId of trailPack.units) {
    assert(manifestUnitIds.has(unitId), `Trail ${trailId} references unknown unit ${unitId}`);
  }
}

for (const trail of taxonomy.trails) {
  assert(
    annotationsByTrail.trails[trail.id]?.annotation_count > 0,
    `Taxonomy trail has no indexed annotations: ${trail.id}`
  );
}

assert(annotationsBySource.sources && typeof annotationsBySource.sources === "object", "annotations-by-source must have a sources object.");
assert(annotationsBySource.source_count === sourceIds.size, "annotations-by-source source count must match source records.");
const coveredSourceCount = Object.values(annotationsBySource.sources).filter((source) => source.annotation_count > 0).length;
assert(annotationsBySource.covered_source_count === coveredSourceCount, "annotations-by-source covered count must match source buckets.");
for (const [sourceId, sourcePack] of Object.entries(annotationsBySource.sources)) {
  assert(sourceIds.has(sourceId), `annotations-by-source references unknown source ${sourceId}`);
  assert(sourcePack.annotation_count === sourcePack.annotations.length, `Bad annotation count for source ${sourceId}`);
  for (const annotationId of sourcePack.annotations) {
    assert(annotationIds.has(annotationId), `Source ${sourceId} references unknown annotation ${annotationId}`);
  }
  for (const unitId of sourcePack.units) {
    assert(manifestUnitIds.has(unitId), `Source ${sourceId} references unknown unit ${unitId}`);
  }
}

assert(sourceUsage.sources && typeof sourceUsage.sources === "object", "source-usage must have a sources object.");
assert(sourceUsage.source_count === sourceIds.size, "source-usage source count must match source records.");
const usedSourceCount = Object.values(sourceUsage.sources).filter((source) => source.usage_count > 0).length;
assert(sourceUsage.used_source_count === usedSourceCount, "source-usage used count must match source buckets.");
for (const [sourceId, sourcePack] of Object.entries(sourceUsage.sources)) {
  assert(sourceIds.has(sourceId), `source-usage references unknown source ${sourceId}`);
  assert(sourcePack.usage_count === sourcePack.usages.length, `Bad usage count for source ${sourceId}`);
  for (const unitId of sourcePack.units) {
    assert(manifestUnitIds.has(unitId), `source-usage source ${sourceId} references unknown unit ${unitId}`);
  }
  for (const usage of sourcePack.usages) {
    assert(["annotation", "glossary", "reference", "taxonomy-entity", "geography"].includes(usage.type), `Bad source usage type for ${sourceId}: ${usage.type}`);
    if (usage.unit_id) assert(manifestUnitIds.has(usage.unit_id), `Source usage ${sourceId}/${usage.id} references unknown unit ${usage.unit_id}`);
    if (usage.type === "annotation") assert(annotationIds.has(usage.id), `Source usage ${sourceId} references unknown annotation ${usage.id}`);
    if (usage.type === "glossary") assert(glossaryIds.has(usage.id), `Source usage ${sourceId} references unknown glossary entry ${usage.id}`);
    if (usage.type === "reference") assert(referenceIds.has(usage.id), `Source usage ${sourceId} references unknown reference card ${usage.id}`);
    if (usage.type === "taxonomy-entity") assert(entityIds.has(usage.id), `Source usage ${sourceId} references unknown taxonomy entity ${usage.id}`);
    if (usage.type === "geography") assert(placeIds.has(usage.id), `Source usage ${sourceId} references unknown geography place ${usage.id}`);
  }
}

function cleanSourceId(sourceId) {
  return String(sourceId ?? "").replace(/^source:/, "");
}

function sourceTargetsFor(annotation) {
  return [
    ...(annotation.relationships ?? [])
      .map((relationship) => relationship.target)
      .filter((target) => target?.startsWith("source:"))
      .map((target) => target.slice("source:".length)),
    ...(annotation.tags ?? [])
      .filter((tag) => tag.startsWith("source:"))
      .map((tag) => tag.slice("source:".length))
  ];
}

function publicAnnotationSourceIds(annotation) {
  return [
    ...(annotation.citations ?? []),
    ...(annotation.evidence ?? []).flatMap((evidence) => evidence.citations ?? []),
    ...sourceTargetsFor(annotation)
  ].map(cleanSourceId);
}

function sourceReadinessState(source) {
  if (String(source.citation_status).startsWith("verified")) return "public-ready-source";
  if (source.citation_status === "needs-review") return "blocked-source";
  return "bibliographic-review-needed";
}

function addExpectedPublicSourceUsage(expected, sourceId, usage) {
  if (!expected.has(sourceId)) expected.set(sourceId, []);
  expected.get(sourceId).push(usage);
}

const publicAnnotationIds = new Set();
const publicGlossaryIds = new Set();
const publicReferenceIds = new Set();
const expectedPublicSourceUsages = new Map();

for (const annotation of annotations.annotations.filter((item) =>
  item.display?.surfaces?.includes("reader") &&
  item.status?.content_status === "student-ready" &&
  item.status?.citation_status === "verified"
)) {
  publicAnnotationIds.add(annotation.id);
  for (const sourceId of new Set(publicAnnotationSourceIds(annotation))) {
    addExpectedPublicSourceUsage(expectedPublicSourceUsages, sourceId, {
      type: "annotation",
      id: annotation.id,
      unit_id: annotation.unit_id
    });
  }
}

for (const entry of glossary.entries.filter((item) =>
  item.status?.definition_status === "student-ready" &&
  item.status?.citation_status === "verified"
)) {
  publicGlossaryIds.add(entry.id);
  for (const sourceId of new Set((entry.citations ?? []).map(cleanSourceId))) {
    for (const unitId of entry.targets?.length ? entry.targets : [null]) {
      addExpectedPublicSourceUsage(expectedPublicSourceUsages, sourceId, {
        type: "glossary",
        id: entry.id,
        unit_id: unitId
      });
    }
  }
}

for (const card of referenceCards.cards.filter((item) =>
  item.status?.content_status === "student-ready" &&
  item.status?.citation_status === "verified"
)) {
  publicReferenceIds.add(card.id);
  for (const sourceId of new Set((card.citations ?? []).map(cleanSourceId))) {
    for (const unitId of card.targets?.length ? card.targets : [null]) {
      addExpectedPublicSourceUsage(expectedPublicSourceUsages, sourceId, {
        type: "reference",
        id: card.id,
        unit_id: unitId
      });
    }
  }
}

const expectedPublicSourceUsageCount = [...expectedPublicSourceUsages.values()]
  .reduce((total, usages) => total + usages.length, 0);

assert(publicSourceReadiness && typeof publicSourceReadiness === "object", "public-source-readiness must be an object.");
assert(publicSourceReadiness.sources && typeof publicSourceReadiness.sources === "object", "public-source-readiness must have a sources object.");
assert(
  publicSourceReadiness.public_source_count === expectedPublicSourceUsages.size,
  "public-source-readiness public source count must match public citations."
);
assert(
  publicSourceReadiness.public_usage_count === expectedPublicSourceUsageCount,
  "public-source-readiness public usage count must match public citations."
);
assert(
  Object.keys(publicSourceReadiness.sources).length === expectedPublicSourceUsages.size,
  "public-source-readiness source object must match public source count."
);

const publicReadinessCounts = {};
const publicCitationStatusCounts = {};
for (const [sourceId, sourcePack] of Object.entries(publicSourceReadiness.sources)) {
  assert(sourceIds.has(sourceId), `public-source-readiness references unknown source ${sourceId}`);
  const sourceRecord = sourceRecords.records.find((record) => record.id === sourceId);
  assert(sourcePack.title === sourceRecord.title, `public-source-readiness title mismatch for ${sourceId}`);
  assert(sourcePack.kind === sourceRecord.kind, `public-source-readiness kind mismatch for ${sourceId}`);
  assert(sourcePack.citation_status === sourceRecord.citation_status, `public-source-readiness citation status mismatch for ${sourceId}`);
  assert(sourcePack.readiness_state === sourceReadinessState(sourceRecord), `public-source-readiness state mismatch for ${sourceId}`);
  assert(sourcePack.readiness_state === "public-ready-source", `Public source ${sourceId} is not ready for publication: ${sourcePack.readiness_state}.`);
  assert(Array.isArray(sourcePack.usages), `public-source-readiness source ${sourceId} must list usages.`);
  assert(sourcePack.usage_count === sourcePack.usages.length, `Bad public source usage count for ${sourceId}`);
  assert(sourcePack.usage_count === expectedPublicSourceUsages.get(sourceId)?.length, `Public source usage mismatch for ${sourceId}`);
  for (const unitId of sourcePack.units) {
    assert(manifestUnitIds.has(unitId), `public-source-readiness source ${sourceId} references unknown unit ${unitId}`);
  }
  for (const usage of sourcePack.usages) {
    assert(["annotation", "glossary", "reference"].includes(usage.type), `Bad public source usage type for ${sourceId}: ${usage.type}`);
    if (usage.unit_id) assert(manifestUnitIds.has(usage.unit_id), `Public source usage ${sourceId}/${usage.id} references unknown unit ${usage.unit_id}`);
    if (usage.type === "annotation") assert(publicAnnotationIds.has(usage.id), `Public source usage ${sourceId} references non-public annotation ${usage.id}`);
    if (usage.type === "glossary") assert(publicGlossaryIds.has(usage.id), `Public source usage ${sourceId} references non-public glossary entry ${usage.id}`);
    if (usage.type === "reference") assert(publicReferenceIds.has(usage.id), `Public source usage ${sourceId} references non-public reference card ${usage.id}`);
  }
  publicReadinessCounts[sourcePack.readiness_state] = (publicReadinessCounts[sourcePack.readiness_state] ?? 0) + 1;
  publicCitationStatusCounts[sourcePack.citation_status] = (publicCitationStatusCounts[sourcePack.citation_status] ?? 0) + 1;
}
assert(
  JSON.stringify(publicSourceReadiness.readiness_counts ?? {}) === JSON.stringify(Object.fromEntries(Object.entries(publicReadinessCounts).sort(([a], [b]) => a.localeCompare(b)))),
  "public-source-readiness readiness counts must match source states."
);
assert(
  JSON.stringify(publicSourceReadiness.citation_status_counts ?? {}) === JSON.stringify(Object.fromEntries(Object.entries(publicCitationStatusCounts).sort(([a], [b]) => a.localeCompare(b)))),
  "public-source-readiness citation status counts must match source states."
);

assert(Array.isArray(annotationEdges.edges), "annotation-edges must have an edges array.");
assert(annotationEdges.edge_count === annotationEdges.edges.length, "annotation-edges count must match edge array length.");
for (const edge of annotationEdges.edges) {
  assert(typeof edge.source === "string" && edge.source.startsWith("annotation:"), `Bad annotation edge source: ${edge.source}`);
  assert(annotationIds.has(edge.source.replace(/^annotation:/, "")), `Annotation edge references unknown source ${edge.source}`);
  assert(manifestUnitIds.has(edge.unit_id), `Annotation edge references unknown unit ${edge.unit_id}`);
  assert(relationshipTargetExists(edge.target), `Annotation edge target does not exist: ${edge.target}`);
}

assert(annotationDensity.annotation_count === annotationIds.size, "annotation-density count must match annotation records.");
assert(Array.isArray(annotationDensity.units) && annotationDensity.units.length === manifest.unit_count, "annotation-density must define every unit.");
const densityWarningCount = annotationDensity.units.reduce((total, unit) => total + unit.warnings.length, 0);
assert(annotationDensity.warning_count === densityWarningCount, "annotation-density warning count must match unit warnings.");
for (const densityUnit of annotationDensity.units) {
  assert(manifestUnitIds.has(densityUnit.unit_id), `annotation-density references unknown unit ${densityUnit.unit_id}`);
  assert(Array.isArray(densityUnit.warnings), `annotation-density unit ${densityUnit.unit_id} must list warnings.`);
}
if (annotationDensity.warning_count > 0) {
  console.warn(`Annotation density warnings: ${annotationDensity.warning_count}. Review data/indexes/annotation-density.json.`);
}

assert(searchDocuments.unit_count === manifest.unit_count, "search-documents unit count must match manifest.");
assert(Array.isArray(searchDocuments.documents), "search-documents must have a documents array.");
assert(searchDocuments.documents.length === manifest.unit_count, "search-documents must define every unit.");
const searchDocumentUnitIds = new Set();
for (const document of searchDocuments.documents) {
  assert(manifestUnitIds.has(document.unit_id), `search-documents references unknown unit ${document.unit_id}`);
  assert(!searchDocumentUnitIds.has(document.unit_id), `Duplicate search document for ${document.unit_id}`);
  searchDocumentUnitIds.add(document.unit_id);
  const expected = annotations.annotations.filter((annotation) => annotation.unit_id === document.unit_id);
  assert(document.annotation_count === expected.length, `Bad search document annotation count for ${document.unit_id}`);
  assert(Array.isArray(document.functions) && document.functions.length > 0, `Search document ${document.unit_id} must include functions.`);
  assert(document.paths && typeof document.paths === "object", `Search document ${document.unit_id} must include path facets.`);
  assert(Array.isArray(document.tags), `Search document ${document.unit_id} must include tag facets.`);
  assert(Array.isArray(document.sources), `Search document ${document.unit_id} must include source facets.`);
}

assert(teacherReview.unit_count === manifest.unit_count, "teacher-review unit count must match manifest.");
assert(Array.isArray(teacherReview.units), "teacher-review must have a units array.");
assert(teacherReview.units.length === manifest.unit_count, "teacher-review must define every unit.");
const teacherReviewUnitIds = new Set();
for (const reviewUnit of teacherReview.units) {
  assert(manifestUnitIds.has(reviewUnit.unit_id), `teacher-review references unknown unit ${reviewUnit.unit_id}`);
  assert(!teacherReviewUnitIds.has(reviewUnit.unit_id), `Duplicate teacher-review unit ${reviewUnit.unit_id}`);
  teacherReviewUnitIds.add(reviewUnit.unit_id);
  const expected = annotations.annotations.filter((annotation) => annotation.unit_id === reviewUnit.unit_id);
  assert(reviewUnit.annotation_count === expected.length, `Bad teacher-review annotation count for ${reviewUnit.unit_id}`);
  assert(reviewUnit.teacher_note_count === expected.filter((annotation) => annotation.kind === "teacher-note").length, `Bad teacher-review teacher note count for ${reviewUnit.unit_id}`);
  assert(reviewUnit.difficult_material_count === expected.filter((annotation) => annotation.kind === "difficult-material").length, `Bad teacher-review difficult material count for ${reviewUnit.unit_id}`);
  assert(["candidate", "reviewing", "blocked", "exempt"].includes(reviewUnit.readiness_state), `Bad teacher-review readiness state for ${reviewUnit.unit_id}`);
  assert(Array.isArray(reviewUnit.blockers), `teacher-review ${reviewUnit.unit_id} must list blockers.`);
  if (reviewUnit.readiness_state === "candidate" || reviewUnit.readiness_state === "exempt") {
    assert(reviewUnit.blockers.length === 0, `Candidate unit ${reviewUnit.unit_id} should not list blockers.`);
  } else {
    assert(reviewUnit.blockers.length > 0, `Non-candidate unit ${reviewUnit.unit_id} should list blockers.`);
  }
  for (const blocker of reviewUnit.blockers) {
    assert(typeof blocker.type === "string" && blocker.type.length > 0, `teacher-review ${reviewUnit.unit_id} has blocker without type.`);
    assert(Number.isInteger(blocker.count) && blocker.count > 0, `teacher-review ${reviewUnit.unit_id} has blocker with bad count.`);
  }
  if (requiredTeacherPacketUnitIds.has(reviewUnit.unit_id)) {
    assert(teacherPacketIds.has(reviewUnit.teacher_packet?.replace(/^teacher-packet-/, "teacher-packet-") ?? ""), `teacher-review missing packet for ${reviewUnit.unit_id}`);
  }
  for (const annotationId of reviewUnit.difficult_material_annotations ?? []) {
    assert(annotationById.get(annotationId)?.kind === "difficult-material", `teacher-review difficult material annotation is invalid: ${annotationId}`);
  }
}

assert(reviewQueue.queues && typeof reviewQueue.queues === "object", "review-queue must have a queues object.");
const allowedReviewItemTypes = new Set([
  "annotation",
  "glossary",
  "reference",
  "teacher-packet",
  "source",
  "taxonomy-trail",
  "taxonomy-entity",
  "geography",
  "map-waypoint"
]);
let countedReviewItems = 0;
for (const [queueName, queuePack] of Object.entries(reviewQueue.queues)) {
  assert(typeof queueName === "string" && queueName.length > 0, "review-queue has an empty queue name.");
  assert(queuePack.queue === queueName, `review-queue pack ${queueName} has wrong queue id.`);
  assert(Array.isArray(queuePack.items), `review-queue ${queueName} must have items.`);
  assert(queuePack.item_count === queuePack.items.length, `review-queue ${queueName} item count mismatch.`);
  countedReviewItems += queuePack.items.length;
  for (const item of queuePack.items) {
    assert(allowedReviewItemTypes.has(item.type), `review-queue ${queueName} has bad item type ${item.type}`);
    assert(typeof item.id === "string" && item.id.length > 0, `review-queue ${queueName} has item without id.`);
    assert(Number.isInteger(item.priority) && item.priority >= 1 && item.priority <= 5, `review-queue ${queueName} item ${item.id} has bad priority.`);
    if (item.unit_id) assert(manifestUnitIds.has(item.unit_id), `review-queue ${queueName} item ${item.id} references unknown unit ${item.unit_id}`);
    if (item.type === "annotation") assert(annotationIds.has(item.id), `review-queue ${queueName} references unknown annotation ${item.id}`);
    if (item.type === "glossary") assert(glossaryIds.has(item.id), `review-queue ${queueName} references unknown glossary entry ${item.id}`);
    if (item.type === "reference") assert(referenceIds.has(item.id), `review-queue ${queueName} references unknown reference card ${item.id}`);
    if (item.type === "teacher-packet") assert(teacherPacketIds.has(item.id), `review-queue ${queueName} references unknown teacher packet ${item.id}`);
    if (item.type === "source") assert(sourceIds.has(item.id), `review-queue ${queueName} references unknown source ${item.id}`);
    if (item.type === "taxonomy-trail") assert(trailIds.has(item.id), `review-queue ${queueName} references unknown taxonomy trail ${item.id}`);
    if (item.type === "taxonomy-entity") assert(entityIds.has(item.id), `review-queue ${queueName} references unknown taxonomy entity ${item.id}`);
    if (item.type === "geography") assert(placeIds.has(item.id), `review-queue ${queueName} references unknown geography place ${item.id}`);
    if (item.type === "map-waypoint") assert(waypointIds.has(item.id), `review-queue ${queueName} references unknown map waypoint ${item.id}`);
  }
}
assert(countedReviewItems >= reviewQueue.item_count, "review-queue total queue memberships should be at least item count.");

const difficultMaterialAnnotationIds = new Set(annotations.annotations.filter((annotation) => annotation.kind === "difficult-material").map((annotation) => annotation.id));
assert(difficultMaterialReview.annotation_count === difficultMaterialAnnotationIds.size, "difficult-material-review count must match difficult-material annotations.");
assert(difficultMaterialReview.categorized_annotation_count === difficultMaterialAnnotationIds.size, "Every difficult-material annotation must have a difficulty category.");
assert(difficultMaterialReview.categories && typeof difficultMaterialReview.categories === "object", "difficult-material-review must have categories.");
assert(difficultMaterialReview.category_count === Object.keys(difficultMaterialReview.categories).length, "difficult-material-review category count mismatch.");
for (const [categoryName, category] of Object.entries(difficultMaterialReview.categories)) {
  assert(category.category === categoryName, `Difficult-material category has wrong id: ${categoryName}`);
  assert(category.annotation_count === category.annotations.length, `Difficult-material category ${categoryName} count mismatch.`);
  for (const annotationId of category.annotations) {
    assert(difficultMaterialAnnotationIds.has(annotationId), `Difficult-material category ${categoryName} references unknown annotation ${annotationId}`);
  }
  for (const unitId of category.units) {
    assert(manifestUnitIds.has(unitId), `Difficult-material category ${categoryName} references unknown unit ${unitId}`);
  }
}
assert(difficultMaterialReview.units && typeof difficultMaterialReview.units === "object", "difficult-material-review must have units.");
for (const [unitId, unitPack] of Object.entries(difficultMaterialReview.units)) {
  assert(manifestUnitIds.has(unitId), `difficult-material-review references unknown unit ${unitId}`);
  assert(unitPack.annotation_count === unitPack.annotations.length, `difficult-material-review unit ${unitId} count mismatch.`);
  for (const annotationId of unitPack.annotations) {
    assert(difficultMaterialAnnotationIds.has(annotationId), `difficult-material-review unit ${unitId} references unknown annotation ${annotationId}`);
  }
}

assert(publicAnnotationCandidates && typeof publicAnnotationCandidates === "object", "public-annotation-candidates must be an object.");
assert(Array.isArray(publicAnnotationCandidates.candidates), "public-annotation-candidates must list candidates.");
assert(publicAnnotationCandidates.candidates.length === annotationIds.size, "public-annotation-candidates must classify every annotation.");
assert(publicAnnotationCandidates.counts?.annotations === annotationIds.size, "public-annotation-candidates annotation count mismatch.");
assert(Array.isArray(publicAnnotationCandidates.next_review_queue), "public-annotation-candidates must include next_review_queue.");
assert(Array.isArray(publicAnnotationCandidates.next_source_support_queue), "public-annotation-candidates must include next_source_support_queue.");
assert(Array.isArray(publicAnnotationCandidates.next_tone_and_source_queue), "public-annotation-candidates must include next_tone_and_source_queue.");
assert(Array.isArray(publicAnnotationCandidates.next_rewrite_queue), "public-annotation-candidates must include next_rewrite_queue.");
assert(Array.isArray(publicAnnotationCandidates.retired_internal_sample), "public-annotation-candidates must include retired_internal_sample.");
assert(Array.isArray(publicAnnotationCandidates.teacher_only_internal_sample), "public-annotation-candidates must include teacher_only_internal_sample.");
assert(Array.isArray(publicAnnotationCandidates.likely_retire_or_internal_only_sample), "public-annotation-candidates must include likely_retire_or_internal_only_sample.");
assert(Array.isArray(publicAnnotationCandidates.classroom_recovery_queue), "public-annotation-candidates must include classroom_recovery_queue.");
assert(Array.isArray(publicAnnotationCandidates.whole_book_recovery_queue), "public-annotation-candidates must include whole_book_recovery_queue.");
assert(Array.isArray(publicAnnotationCandidates.units), "public-annotation-candidates must include unit rollups.");
assert(publicAnnotationCandidates.units.length === manifest.unit_count, "public-annotation-candidates must roll up every unit.");

const allowedPublicCandidateStates = new Set([
  "public-ready",
  "review-for-promotion",
  "source-support-review",
  "possible-rewrite",
  "retired-internal",
  "teacher-only-internal",
  "likely-retire-or-internal-only",
  "tone-and-source-review",
  "low-value-draft"
]);
const publicCandidateIds = new Set();
let countedPublicReadyCandidates = 0;
for (const candidate of publicAnnotationCandidates.candidates) {
  assert(annotationIds.has(candidate.id), `public-annotation-candidates references unknown annotation ${candidate.id}`);
  assert(!publicCandidateIds.has(candidate.id), `Duplicate public candidate ${candidate.id}`);
  publicCandidateIds.add(candidate.id);
  assert(manifestUnitIds.has(candidate.unit_id), `public candidate ${candidate.id} references unknown unit ${candidate.unit_id}`);
  assert(Number.isInteger(candidate.score), `public candidate ${candidate.id} must have an integer score.`);
  assert(allowedPublicCandidateStates.has(candidate.state), `public candidate ${candidate.id} has bad state ${candidate.state}`);
  assert(typeof candidate.note === "string" && candidate.note.length > 0, `public candidate ${candidate.id} must preserve note text.`);
  assert(typeof candidate.anchor === "string" && candidate.anchor.length > 0, `public candidate ${candidate.id} must preserve anchor text.`);
  if (candidate.state === "public-ready") countedPublicReadyCandidates += 1;
}
assert(publicCandidateIds.size === annotationIds.size, "public-annotation-candidates must contain each annotation exactly once.");
const readerReadyCount = annotations.annotations.filter((annotation) =>
  annotation.display.surfaces.includes("reader") && annotation.status.content_status === "student-ready"
).length;
assert(publicAnnotationCandidates.counts.public_ready === readerReadyCount, "public-annotation-candidates public-ready count must match reader-ready annotations.");
assert(countedPublicReadyCandidates === readerReadyCount, "public-ready candidates must match reader-ready annotations.");

const publicCandidateUnitsById = new Map(publicAnnotationCandidates.units.map((unit) => [unit.unit_id, unit]));
const expectedClassroomUnitsWithoutPublicReady = publicAnnotationCandidates.units
  .filter((unit) => unit.section_type !== "frontmatter")
  .filter((unit) => unit.classroom_level === "required" || unit.classroom_level === "recommended")
  .filter((unit) => unit.public_ready_count === 0)
  .map((unit) => unit.unit_id)
  .sort();
const listedClassroomUnitsWithoutPublicReady = [...(publicAnnotationCandidates.classroom_units_without_public_ready ?? [])].sort();
assert(
  JSON.stringify(listedClassroomUnitsWithoutPublicReady) === JSON.stringify(expectedClassroomUnitsWithoutPublicReady),
  "classroom_units_without_public_ready must match unit rollups."
);
assert(
  publicAnnotationCandidates.counts.classroom_units_without_public_ready === expectedClassroomUnitsWithoutPublicReady.length,
  "classroom_units_without_public_ready count mismatch."
);
assert(
  publicAnnotationCandidates.counts.classroom_recovery_units === expectedClassroomUnitsWithoutPublicReady.length,
  "classroom_recovery_units count must match missing public Study units."
);
const expectedWholeBookUnitsWithoutPublicReady = publicAnnotationCandidates.units
  .filter((unit) => unit.section_type !== "frontmatter")
  .filter((unit) => unit.public_ready_count === 0)
  .map((unit) => unit.unit_id)
  .sort();
const listedWholeBookUnitsWithoutPublicReady = [...(publicAnnotationCandidates.whole_book_units_without_public_ready ?? [])].sort();
assert(
  JSON.stringify(listedWholeBookUnitsWithoutPublicReady) === JSON.stringify(expectedWholeBookUnitsWithoutPublicReady),
  "whole_book_units_without_public_ready must match unit rollups."
);
assert(
  publicAnnotationCandidates.counts.whole_book_units_without_public_ready === expectedWholeBookUnitsWithoutPublicReady.length,
  "whole_book_units_without_public_ready count mismatch."
);
assert(
  publicAnnotationCandidates.counts.whole_book_recovery_units === expectedWholeBookUnitsWithoutPublicReady.length,
  "whole_book_recovery_units count must match missing non-frontmatter public Study units."
);

const allowedRecoveryActions = new Set([
  "review-existing-candidate",
  "review-source-support",
  "review-difficult-material",
  "rewrite-existing-anchor",
  "write-fresh-note"
]);
const recoveryUnitIds = new Set();
let recoveryWithReviewCandidates = 0;
let recoveryWithRewriteCandidates = 0;
let recoveryNeedingFreshAnnotation = 0;
for (const recoveryUnit of publicAnnotationCandidates.classroom_recovery_queue) {
  assert(manifestUnitIds.has(recoveryUnit.unit_id), `classroom recovery queue references unknown unit ${recoveryUnit.unit_id}`);
  assert(!recoveryUnitIds.has(recoveryUnit.unit_id), `Duplicate classroom recovery unit ${recoveryUnit.unit_id}`);
  recoveryUnitIds.add(recoveryUnit.unit_id);
  assert(expectedClassroomUnitsWithoutPublicReady.includes(recoveryUnit.unit_id), `classroom recovery unit already has public Study: ${recoveryUnit.unit_id}`);
  assert(allowedRecoveryActions.has(recoveryUnit.recovery_action), `Bad classroom recovery action for ${recoveryUnit.unit_id}: ${recoveryUnit.recovery_action}`);
  assert(Number.isInteger(recoveryUnit.priority_score), `classroom recovery unit ${recoveryUnit.unit_id} needs an integer priority_score.`);
  assert(Array.isArray(recoveryUnit.candidates), `classroom recovery unit ${recoveryUnit.unit_id} must list candidates.`);
  assert(recoveryUnit.candidates.length <= 5, `classroom recovery unit ${recoveryUnit.unit_id} should include at most five candidates.`);
  const unitRollup = publicCandidateUnitsById.get(recoveryUnit.unit_id);
  assert(unitRollup, `classroom recovery unit missing rollup ${recoveryUnit.unit_id}`);
  assert(recoveryUnit.public_ready_count === 0, `classroom recovery unit ${recoveryUnit.unit_id} should not have public-ready annotations.`);
  assert(recoveryUnit.review_for_promotion_count === unitRollup.review_for_promotion_count, `Recovery review count mismatch for ${recoveryUnit.unit_id}`);
  assert(recoveryUnit.possible_rewrite_count === unitRollup.possible_rewrite_count, `Recovery rewrite count mismatch for ${recoveryUnit.unit_id}`);
  assert(recoveryUnit.candidate_count === recoveryUnit.candidates.length || recoveryUnit.candidate_count >= recoveryUnit.candidates.length, `Recovery candidate count mismatch for ${recoveryUnit.unit_id}`);

  if (["review-existing-candidate", "review-source-support", "review-difficult-material"].includes(recoveryUnit.recovery_action)) recoveryWithReviewCandidates += 1;
  if (recoveryUnit.recovery_action === "rewrite-existing-anchor") recoveryWithRewriteCandidates += 1;
  if (recoveryUnit.recovery_action === "write-fresh-note") recoveryNeedingFreshAnnotation += 1;

  for (const candidate of recoveryUnit.candidates) {
    assert(annotationIds.has(candidate.id), `classroom recovery candidate references unknown annotation ${candidate.id}`);
    assert(annotationById.get(candidate.id)?.unit_id === recoveryUnit.unit_id, `classroom recovery candidate ${candidate.id} is not in ${recoveryUnit.unit_id}`);
    assert(allowedPublicCandidateStates.has(candidate.state), `classroom recovery candidate ${candidate.id} has bad state ${candidate.state}`);
    assert(candidate.state !== "public-ready", `classroom recovery candidate ${candidate.id} should not already be public-ready.`);
    assert(typeof candidate.anchor === "string" && candidate.anchor.length > 0, `classroom recovery candidate ${candidate.id} must preserve anchor text.`);
    assert(typeof candidate.note === "string" && candidate.note.length > 0, `classroom recovery candidate ${candidate.id} must preserve note text.`);
  }
}
assert(recoveryUnitIds.size === expectedClassroomUnitsWithoutPublicReady.length, "classroom recovery queue must cover every missing public Study unit exactly once.");
assert(
  publicAnnotationCandidates.counts.classroom_recovery_units_with_review_candidates === recoveryWithReviewCandidates,
  "classroom recovery review-candidate count mismatch."
);
assert(
  publicAnnotationCandidates.counts.classroom_recovery_units_with_rewrite_candidates === recoveryWithRewriteCandidates,
  "classroom recovery rewrite-candidate count mismatch."
);
assert(
  publicAnnotationCandidates.counts.classroom_recovery_units_needing_fresh_annotation === recoveryNeedingFreshAnnotation,
  "classroom recovery fresh-note count mismatch."
);

const wholeBookRecoveryUnitIds = new Set();
let wholeBookRecoveryWithReviewCandidates = 0;
let wholeBookRecoveryWithRewriteCandidates = 0;
let wholeBookRecoveryNeedingFreshAnnotation = 0;
for (const recoveryUnit of publicAnnotationCandidates.whole_book_recovery_queue) {
  assert(manifestUnitIds.has(recoveryUnit.unit_id), `whole-book recovery queue references unknown unit ${recoveryUnit.unit_id}`);
  assert(!wholeBookRecoveryUnitIds.has(recoveryUnit.unit_id), `Duplicate whole-book recovery unit ${recoveryUnit.unit_id}`);
  wholeBookRecoveryUnitIds.add(recoveryUnit.unit_id);
  assert(expectedWholeBookUnitsWithoutPublicReady.includes(recoveryUnit.unit_id), `whole-book recovery unit already has public Study: ${recoveryUnit.unit_id}`);
  assert(allowedRecoveryActions.has(recoveryUnit.recovery_action), `Bad whole-book recovery action for ${recoveryUnit.unit_id}: ${recoveryUnit.recovery_action}`);
  assert(Number.isInteger(recoveryUnit.priority_score), `whole-book recovery unit ${recoveryUnit.unit_id} needs an integer priority_score.`);
  assert(Array.isArray(recoveryUnit.candidates), `whole-book recovery unit ${recoveryUnit.unit_id} must list candidates.`);
  assert(recoveryUnit.candidates.length <= 5, `whole-book recovery unit ${recoveryUnit.unit_id} should include at most five candidates.`);
  const unitRollup = publicCandidateUnitsById.get(recoveryUnit.unit_id);
  assert(unitRollup, `whole-book recovery unit missing rollup ${recoveryUnit.unit_id}`);
  assert(recoveryUnit.public_ready_count === 0, `whole-book recovery unit ${recoveryUnit.unit_id} should not have public-ready annotations.`);
  assert(recoveryUnit.review_for_promotion_count === unitRollup.review_for_promotion_count, `Whole-book recovery review count mismatch for ${recoveryUnit.unit_id}`);
  assert(recoveryUnit.possible_rewrite_count === unitRollup.possible_rewrite_count, `Whole-book recovery rewrite count mismatch for ${recoveryUnit.unit_id}`);
  assert(recoveryUnit.candidate_count >= recoveryUnit.candidates.length, `Whole-book recovery candidate count mismatch for ${recoveryUnit.unit_id}`);

  if (["review-existing-candidate", "review-source-support", "review-difficult-material"].includes(recoveryUnit.recovery_action)) wholeBookRecoveryWithReviewCandidates += 1;
  if (recoveryUnit.recovery_action === "rewrite-existing-anchor") wholeBookRecoveryWithRewriteCandidates += 1;
  if (recoveryUnit.recovery_action === "write-fresh-note") wholeBookRecoveryNeedingFreshAnnotation += 1;

  for (const candidate of recoveryUnit.candidates) {
    assert(annotationIds.has(candidate.id), `whole-book recovery candidate references unknown annotation ${candidate.id}`);
    assert(annotationById.get(candidate.id)?.unit_id === recoveryUnit.unit_id, `whole-book recovery candidate ${candidate.id} is not in ${recoveryUnit.unit_id}`);
    assert(allowedPublicCandidateStates.has(candidate.state), `whole-book recovery candidate ${candidate.id} has bad state ${candidate.state}`);
    assert(candidate.state !== "public-ready", `whole-book recovery candidate ${candidate.id} should not already be public-ready.`);
    assert(typeof candidate.anchor === "string" && candidate.anchor.length > 0, `whole-book recovery candidate ${candidate.id} must preserve anchor text.`);
    assert(typeof candidate.note === "string" && candidate.note.length > 0, `whole-book recovery candidate ${candidate.id} must preserve note text.`);
  }
}
assert(wholeBookRecoveryUnitIds.size === expectedWholeBookUnitsWithoutPublicReady.length, "whole-book recovery queue must cover every missing non-frontmatter public Study unit exactly once.");
assert(
  publicAnnotationCandidates.counts.whole_book_recovery_units_with_review_candidates === wholeBookRecoveryWithReviewCandidates,
  "whole-book recovery review-candidate count mismatch."
);
assert(
  publicAnnotationCandidates.counts.whole_book_recovery_units_with_rewrite_candidates === wholeBookRecoveryWithRewriteCandidates,
  "whole-book recovery rewrite-candidate count mismatch."
);
assert(
  publicAnnotationCandidates.counts.whole_book_recovery_units_needing_fresh_annotation === wholeBookRecoveryNeedingFreshAnnotation,
  "whole-book recovery fresh-note count mismatch."
);

assert(publicApparatusCandidates && typeof publicApparatusCandidates === "object", "public-apparatus-candidates must be an object.");
assert(Array.isArray(publicApparatusCandidates.glossary_candidates), "public-apparatus-candidates must list glossary candidates.");
assert(Array.isArray(publicApparatusCandidates.reference_candidates), "public-apparatus-candidates must list reference candidates.");
assert(Array.isArray(publicApparatusCandidates.glossary_recovery_queue), "public-apparatus-candidates must include glossary_recovery_queue.");
assert(Array.isArray(publicApparatusCandidates.reference_recovery_queue), "public-apparatus-candidates must include reference_recovery_queue.");
assert(publicApparatusCandidates.counts?.glossary_entries === glossaryIds.size, "public apparatus glossary count mismatch.");
assert(publicApparatusCandidates.counts?.reference_cards === referenceIds.size, "public apparatus reference count mismatch.");

const allowedPublicApparatusStates = new Set([
  "public-ready",
  "review-for-promotion",
  "possible-rewrite",
  "review-needed",
  "likely-retire-or-internal-only",
  "low-value-draft"
]);

function validateApparatusCandidate(candidate, ids, type) {
  assert(ids.has(candidate.id), `public apparatus ${type} candidate references unknown item ${candidate.id}`);
  assert(allowedPublicApparatusStates.has(candidate.state), `public apparatus ${type} candidate ${candidate.id} has bad state ${candidate.state}`);
  assert(Number.isInteger(candidate.score), `public apparatus ${type} candidate ${candidate.id} must have an integer score.`);
  assert(typeof candidate.label === "string" && candidate.label.length > 0, `public apparatus ${type} candidate ${candidate.id} needs a label.`);
  assert(typeof candidate.text === "string" && candidate.text.length > 0, `public apparatus ${type} candidate ${candidate.id} needs text.`);
  assert(Array.isArray(candidate.targets), `public apparatus ${type} candidate ${candidate.id} must list targets.`);
  for (const target of candidate.targets) {
    assert(manifestUnitIds.has(target), `public apparatus ${type} candidate ${candidate.id} references unknown target ${target}`);
  }
}

let countedPublicGlossaryCandidates = 0;
const apparatusGlossaryIds = new Set();
for (const candidate of publicApparatusCandidates.glossary_candidates) {
  assert(!apparatusGlossaryIds.has(candidate.id), `Duplicate public apparatus glossary candidate ${candidate.id}`);
  apparatusGlossaryIds.add(candidate.id);
  validateApparatusCandidate(candidate, glossaryIds, "glossary");
  if (candidate.state === "public-ready") countedPublicGlossaryCandidates += 1;
}
assert(apparatusGlossaryIds.size === glossaryIds.size, "public apparatus candidates must classify every glossary entry.");

let countedPublicReferenceCandidates = 0;
const apparatusReferenceIds = new Set();
for (const candidate of publicApparatusCandidates.reference_candidates) {
  assert(!apparatusReferenceIds.has(candidate.id), `Duplicate public apparatus reference candidate ${candidate.id}`);
  apparatusReferenceIds.add(candidate.id);
  validateApparatusCandidate(candidate, referenceIds, "reference");
  if (candidate.state === "public-ready") countedPublicReferenceCandidates += 1;
}
assert(apparatusReferenceIds.size === referenceIds.size, "public apparatus candidates must classify every reference card.");

const expectedPublicGlossaryCount = glossary.entries.filter((entry) =>
  entry.status.definition_status === "student-ready" && entry.status.citation_status === "verified"
).length;
const expectedPublicReferenceCount = referenceCards.cards.filter((card) =>
  card.status.content_status === "student-ready" && card.status.citation_status === "verified"
).length;
assert(publicApparatusCandidates.counts.public_glossary_entries === expectedPublicGlossaryCount, "public apparatus public glossary count mismatch.");
assert(publicApparatusCandidates.counts.public_reference_cards === expectedPublicReferenceCount, "public apparatus public reference count mismatch.");
assert(countedPublicGlossaryCandidates === expectedPublicGlossaryCount, "public apparatus public glossary candidates mismatch.");
assert(countedPublicReferenceCandidates === expectedPublicReferenceCount, "public apparatus public reference candidates mismatch.");

const nonFrontmatterUnitIds = manifest.units
  .filter((unit) => unit.section_type !== "frontmatter")
  .map((unit) => unit.unit_id);
const publicGlossaryTargetUnits = new Set(
  glossary.entries
    .filter((entry) => entry.status.definition_status === "student-ready" && entry.status.citation_status === "verified")
    .flatMap((entry) => entry.targets ?? [])
    .filter((target) => nonFrontmatterUnitIds.includes(target))
);
const publicReferenceTargetUnits = new Set(
  referenceCards.cards
    .filter((card) => card.status.content_status === "student-ready" && card.status.citation_status === "verified")
    .flatMap((card) => card.targets ?? [])
    .filter((target) => nonFrontmatterUnitIds.includes(target))
);
const expectedGlossaryRecoveryUnits = nonFrontmatterUnitIds.filter((unitId) => !publicGlossaryTargetUnits.has(unitId)).sort();
const expectedReferenceRecoveryUnits = nonFrontmatterUnitIds.filter((unitId) => !publicReferenceTargetUnits.has(unitId)).sort();
assert(publicApparatusCandidates.counts.glossary_units_without_public_entry === expectedGlossaryRecoveryUnits.length, "public apparatus glossary recovery count mismatch.");
assert(publicApparatusCandidates.counts.reference_units_without_public_card === expectedReferenceRecoveryUnits.length, "public apparatus reference recovery count mismatch.");

function validateApparatusRecoveryQueue(queue, expectedUnitIds, itemIds, type) {
  const seenUnits = new Set();
  for (const unit of queue) {
    assert(manifestUnitIds.has(unit.unit_id), `${type} recovery queue references unknown unit ${unit.unit_id}`);
    assert(!seenUnits.has(unit.unit_id), `Duplicate ${type} recovery unit ${unit.unit_id}`);
    seenUnits.add(unit.unit_id);
    assert(expectedUnitIds.includes(unit.unit_id), `${type} recovery unit already has public apparatus: ${unit.unit_id}`);
    assert(["review-existing-candidate", "rewrite-existing-candidate", "write-fresh-item"].includes(unit.recovery_action), `Bad ${type} recovery action for ${unit.unit_id}`);
    assert(Number.isInteger(unit.priority_score), `${type} recovery unit ${unit.unit_id} needs priority_score.`);
    assert(Array.isArray(unit.candidates), `${type} recovery unit ${unit.unit_id} must list candidates.`);
    assert(unit.candidate_count >= unit.candidates.length, `${type} recovery unit ${unit.unit_id} candidate count mismatch.`);
    for (const candidate of unit.candidates) {
      assert(itemIds.has(candidate.id), `${type} recovery candidate references unknown item ${candidate.id}`);
      assert(allowedPublicApparatusStates.has(candidate.state), `${type} recovery candidate ${candidate.id} has bad state ${candidate.state}`);
      assert(candidate.state !== "public-ready", `${type} recovery candidate ${candidate.id} should not already be public-ready.`);
    }
  }
  assert(seenUnits.size === expectedUnitIds.length, `${type} recovery queue must cover every missing unit exactly once.`);
}

validateApparatusRecoveryQueue(publicApparatusCandidates.glossary_recovery_queue, expectedGlossaryRecoveryUnits, glossaryIds, "glossary");
validateApparatusRecoveryQueue(publicApparatusCandidates.reference_recovery_queue, expectedReferenceRecoveryUnits, referenceIds, "reference");

const publicPayloadAnnotationCount = guideData.annotations.length;
const publicPayloadAnnotationIndexCount = Object.values(guideData.annotationIndex?.units ?? {})
  .reduce((total, unit) => total + (unit.annotations?.length ?? 0), 0);
const publicGlossaryCount = glossary.entries.filter((entry) =>
  entry.status.definition_status === "student-ready" && entry.status.citation_status === "verified"
).length;
const publicReferenceCount = referenceCards.cards.filter((card) =>
  card.status.content_status === "student-ready" && card.status.citation_status === "verified"
).length;
assert(publicPayloadAnnotationCount === readerReadyCount, "Public guide payload annotation count must match reader-ready annotations.");
assert(publicPayloadAnnotationIndexCount === readerReadyCount, "Public guide payload annotation index count must match reader-ready annotations.");
assert(guideData.glossary.length === publicGlossaryCount, "Public guide payload glossary count must match verified student-ready glossary entries.");
assert(guideData.referenceCards.length === publicReferenceCount, "Public guide payload reference-card count must match verified student-ready reference cards.");
assert(guideData.teacherPackets.length === 0, "Public guide payload must not include teacher packets.");
for (const annotation of guideData.annotations) {
  assert(annotation.display?.surfaces?.includes("reader"), `Public guide payload contains non-reader annotation ${annotation.id}`);
  assert(annotation.status?.content_status === "student-ready", `Public guide payload contains draft annotation ${annotation.id}`);
  assert(annotation.status?.citation_status === "verified", `Public guide payload contains unverified annotation ${annotation.id}`);
}
for (const unitPack of Object.values(guideData.annotationIndex?.units ?? {})) {
  for (const annotation of unitPack.annotations ?? []) {
    assert(annotation.display?.surfaces?.includes("reader"), `Public guide annotation index contains non-reader annotation ${annotation.id}`);
    assert(annotation.status?.content_status === "student-ready", `Public guide annotation index contains draft annotation ${annotation.id}`);
    assert(annotation.status?.citation_status === "verified", `Public guide annotation index contains unverified annotation ${annotation.id}`);
  }
}
function normalizedAnchorForPublicOverlap(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}
function publicAnchorsOverlap(a, b) {
  const left = normalizedAnchorForPublicOverlap(a);
  const right = normalizedAnchorForPublicOverlap(b);
  if (left.length < 16 || right.length < 16) return false;
  return left.includes(right) || right.includes(left);
}
for (const [unitId, unitPack] of Object.entries(guideData.annotationIndex?.units ?? {})) {
  const unitAnnotations = unitPack.annotations ?? [];
  for (let i = 0; i < unitAnnotations.length; i += 1) {
    for (let j = i + 1; j < unitAnnotations.length; j += 1) {
      assert(
        !publicAnchorsOverlap(unitAnnotations[i].anchor, unitAnnotations[j].anchor),
        `Public guide annotations overlap in ${unitId}: ${unitAnnotations[i].id} / ${unitAnnotations[j].id}`
      );
    }
  }
}
for (const entry of guideData.glossary) {
  assert(entry.status?.definition_status === "student-ready", `Public guide payload contains draft glossary entry ${entry.id}`);
  assert(entry.status?.citation_status === "verified", `Public guide payload contains unverified glossary entry ${entry.id}`);
}
for (const card of guideData.referenceCards) {
  assert(card.status?.content_status === "student-ready", `Public guide payload contains draft reference card ${card.id}`);
  assert(card.status?.citation_status === "verified", `Public guide payload contains unverified reference card ${card.id}`);
}

for (const item of [
  ...publicAnnotationCandidates.next_review_queue,
  ...publicAnnotationCandidates.next_source_support_queue,
  ...publicAnnotationCandidates.next_tone_and_source_queue,
  ...publicAnnotationCandidates.next_rewrite_queue,
  ...publicAnnotationCandidates.retired_internal_sample,
  ...publicAnnotationCandidates.teacher_only_internal_sample,
  ...publicAnnotationCandidates.likely_retire_or_internal_only_sample
]) {
  assert(annotationIds.has(item.id), `public annotation queue references unknown annotation ${item.id}`);
  assert(manifestUnitIds.has(item.unit_id), `public annotation queue item ${item.id} references unknown unit ${item.unit_id}`);
}
for (const unit of publicAnnotationCandidates.units) {
  assert(manifestUnitIds.has(unit.unit_id), `public-annotation-candidates unit rollup references unknown unit ${unit.unit_id}`);
  assert(Array.isArray(unit.top_candidates), `public-annotation-candidates unit ${unit.unit_id} must list top candidates.`);
  for (const candidateId of unit.top_candidates) {
    assert(annotationIds.has(candidateId), `public-annotation-candidates unit ${unit.unit_id} references unknown top candidate ${candidateId}`);
  }
}

assert(Array.isArray(summarySeeds.summaries), "Summary seeds must have a summaries array.");
const summarySeedIds = new Set();
for (const summary of summarySeeds.summaries) {
  assert(manifestUnitIds.has(summary.unit_id), `Summary seed references unknown unit: ${summary.unit_id}`);
  assert(!summarySeedIds.has(summary.unit_id), `Duplicate summary seed for unit: ${summary.unit_id}`);
  summarySeedIds.add(summary.unit_id);
  assert(typeof summary.one_breath === "string" && summary.one_breath.length > 0, `Missing one_breath summary for ${summary.unit_id}`);
  assert(typeof summary.student === "string" && summary.student.length > 0, `Missing student summary for ${summary.unit_id}`);
  assert(typeof summary.why_it_matters === "string" && summary.why_it_matters.length > 0, `Missing why_it_matters summary for ${summary.unit_id}`);
}

for (const chapter of manifest.chapters) {
  assert(summarySeedIds.has(chapter.unit_id), `Missing summary seed for numbered chapter: ${chapter.unit_id}`);
}

for (const unit of manifest.units) {
  assert(summarySeedIds.has(unit.unit_id), `Missing summary seed for reading unit: ${unit.unit_id}`);
}

assert(
  summarySeedIds.has(manifest.units.find((unit) => unit.section_type === "epilogue")?.unit_id),
  "Missing summary seed for epilogue."
);

const pathFiles = (await readdir(pathDir)).filter((file) => file.endsWith(".json"));
const pathIds = new Set();

for (const file of pathFiles) {
  const readingPath = JSON.parse(await readFile(`${pathDir}/${file}`, "utf8"));
  assert(typeof readingPath.id === "string" && /^[a-z0-9_-]+$/.test(readingPath.id), `Bad reading path id in ${file}`);
  assert(!pathIds.has(readingPath.id), `Duplicate reading path id: ${readingPath.id}`);
  pathIds.add(readingPath.id);
  assert(Array.isArray(readingPath.goals) && readingPath.goals.length > 0, `Missing goals for path ${readingPath.id}`);
  assert(Array.isArray(readingPath.unit_rules) && readingPath.unit_rules.length === manifest.unit_count, `Path ${readingPath.id} must define every reading unit.`);

  const levelCounts = {
    required: 0,
    recommended: 0,
    optional: 0,
    "summary-only": 0,
    defer: 0
  };
  let requiredWordCount = 0;

  for (const rule of readingPath.unit_rules) {
    assert(manifestUnitIds.has(rule.unit_id), `Path ${readingPath.id} references unknown unit ${rule.unit_id}`);
    assert(["required", "recommended", "optional", "summary-only", "defer", "excluded"].includes(rule.level), `Bad level for ${rule.unit_id} in ${readingPath.id}`);
    assert(typeof rule.rationale === "string" && rule.rationale.length > 0, `Missing rationale for ${rule.unit_id} in ${readingPath.id}`);
    if (levelCounts[rule.level] !== undefined) levelCounts[rule.level] += 1;
    if (rule.level === "required") {
      requiredWordCount += manifest.units.find((unit) => unit.unit_id === rule.unit_id).word_count;
    }
  }

  assert(readingPath.scope.required_units === levelCounts.required, `Bad required scope count for ${readingPath.id}`);
  assert(readingPath.scope.recommended_units === levelCounts.recommended, `Bad recommended scope count for ${readingPath.id}`);
  assert(readingPath.scope.optional_units === levelCounts.optional, `Bad optional scope count for ${readingPath.id}`);
  assert(readingPath.scope.summary_only_units === levelCounts["summary-only"], `Bad summary-only scope count for ${readingPath.id}`);
  assert(readingPath.scope.deferred_units === levelCounts.defer, `Bad deferred scope count for ${readingPath.id}`);
  assert(readingPath.scope.word_count_required === requiredWordCount, `Bad required word count for ${readingPath.id}`);
}

for (const requiredPathId of requiredPathIds) {
  assert(pathIds.has(requiredPathId), `Missing required reading path: ${requiredPathId}`);
}

console.log(`Basic validation passed for ${manifest.unit_count} reading units (${manifest.chapter_count} chapters), ${summarySeedIds.size} summary seeds, ${glossaryIds.size} glossary entries, ${referenceIds.size} reference cards, ${annotationIds.size} annotations, ${teacherPacketIds.size} teacher packets, ${voyageMap.waypoints.length} map waypoints, ${placeIds.size} geography places, ${trailIds.size} trails, ${entityIds.size} entities, ${sourceRecords.records.length} source records, and ${pathIds.size} reading paths.`);
