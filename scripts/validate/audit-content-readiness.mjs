import { readFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifest = JSON.parse(await readFile("data/chapters/moby-dick.chapter-manifest.json", "utf8"));
const summarySeeds = JSON.parse(await readFile("data/chapters/moby-dick.summary-seeds.json", "utf8"));
const glossary = JSON.parse(await readFile("data/glossary/moby-dick.glossary.json", "utf8"));
const referenceCards = JSON.parse(await readFile("data/references/moby-dick.reference-cards.json", "utf8"));
const annotations = JSON.parse(await readFile("data/annotations/moby-dick.annotations.json", "utf8"));
const sourceRecords = JSON.parse(await readFile("data/sources/moby-dick.source-records.json", "utf8"));
const geography = JSON.parse(await readFile("data/geography/moby-dick.places.json", "utf8"));
const voyageMap = JSON.parse(await readFile("data/maps/moby-dick.voyage-map.json", "utf8"));
const taxonomy = JSON.parse(await readFile("data/taxonomy/moby-dick.taxonomy.json", "utf8"));
const teacherPackets = JSON.parse(await readFile("data/teacher/moby-dick.teacher-packets.json", "utf8"));
const annotationsByEntity = JSON.parse(await readFile("data/indexes/annotations-by-entity.json", "utf8"));
const annotationsByTrail = JSON.parse(await readFile("data/indexes/annotations-by-trail.json", "utf8"));
const annotationsBySource = JSON.parse(await readFile("data/indexes/annotations-by-source.json", "utf8"));
const sourceUsage = JSON.parse(await readFile("data/indexes/source-usage.json", "utf8"));
const searchDocuments = JSON.parse(await readFile("data/indexes/search-documents.json", "utf8"));
const teacherReview = JSON.parse(await readFile("data/indexes/teacher-review.json", "utf8"));
const reviewQueue = JSON.parse(await readFile("data/indexes/review-queue.json", "utf8"));
const difficultMaterialReview = JSON.parse(await readFile("data/indexes/difficult-material-review.json", "utf8"));
const publicAnnotationCandidates = JSON.parse(await readFile("data/indexes/public-annotation-candidates.json", "utf8"));
const publicApparatusCandidates = JSON.parse(await readFile("data/indexes/public-apparatus-candidates.json", "utf8"));
const publicSourceReadiness = JSON.parse(await readFile("data/indexes/public-source-readiness.json", "utf8"));
const guideData = await loadGuideData();

const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));
const summariesById = new Map(summarySeeds.summaries.map((summary) => [summary.unit_id, summary]));
const annotationsByUnit = new Map();
const displayedTextByUnit = new Map(guideData.units.map((unit) => [unit.unit_id, unit.plain_text.trim()]));
const glossaryTargetsByUnit = new Map();
const referenceTargetsByUnit = new Map();
const geographyTargetsByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

for (const entry of glossary.entries) {
  for (const unitId of entry.targets ?? []) {
    if (!glossaryTargetsByUnit.has(unitId)) glossaryTargetsByUnit.set(unitId, []);
    glossaryTargetsByUnit.get(unitId).push(entry);
  }
}

for (const card of referenceCards.cards) {
  for (const unitId of card.targets ?? []) {
    if (!referenceTargetsByUnit.has(unitId)) referenceTargetsByUnit.set(unitId, []);
    referenceTargetsByUnit.get(unitId).push(card);
  }
}

for (const place of geography.places) {
  for (const unitId of place.chapter_targets ?? []) {
    if (!geographyTargetsByUnit.has(unitId)) geographyTargetsByUnit.set(unitId, []);
    geographyTargetsByUnit.get(unitId).push(place);
  }
}

function isClassroomUnit(unit) {
  return unit.paths.classroom_standard === "required" || unit.paths.classroom_standard === "recommended";
}

function hasUsableSummary(unit) {
  const summary = summariesById.get(unit.unit_id);
  return Boolean(summary?.one_breath && summary?.student && summary?.why_it_matters);
}

function countBy(items, getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

function listUnitLabels(unitIds) {
  return unitIds.map((unitId) => {
    const unit = unitsById.get(unitId);
    return unit ? `${unit.unit_id} (${unit.title})` : unitId;
  });
}

function listAnnotationLabels(items) {
  return items.map((annotation) => `${annotation.id} (${annotation.unit_id})`);
}

function listGlossaryLabels(items) {
  return items.map((entry) => `${entry.id} (${entry.term})`);
}

function listReferenceLabels(items) {
  return items.map((card) => `${card.id} (${card.title})`);
}

function normalizedNote(note) {
  return note.replace(/\s+/g, " ").trim().toLowerCase();
}

function isSubstantialDisplayedUnit(unit) {
  return unit.word_count > 250 && (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0;
}

const genericNotePatterns = [
  /This passage advances the story while also showing what Ishmael chooses to emphasize\./i,
  /A useful classroom question here is what the passage makes visible/i,
  /Use this passage to watch how Ishmael turns whale knowledge into a problem of classification, not just a list of facts\./i,
  /This added anchor gives the chapter another symbolic pressure point for Study mode\./i,
  /The passage gives students a second study handle for the chapter's pressure on symbol, motive, or consequence\./i,
  /^Teacher review:/i,
  /use this chapter to connect plot movement with the unit's listed functions/i,
  /track how the chapter changes what students know about motive, intimacy, hierarchy, or moral pressure/i,
  /ask students what the chapter makes feel inevitable and what choices remain visible/i,
  /This passage is a useful labor anchor because/i,
  /This additional note gives students another place to test/i,
  /This anchor is useful for tracking/i,
  /This is a good place to track how character knowledge changes/i,
  /This anchor keeps the material work of whaling visible/i,
  /The form matters here: Melville lets voice, staging, or overheard speech carry meaning alongside plot/i,
  /The chapter's design matters here: voice, scene shape, and pacing are doing interpretive work/i,
  /This passage uses nineteenth-century racial or colonial language/i,
  /This passage uses older language of madness or insanity/i,
  /This passage involves violence, blood, butchery, sharks, or animal suffering/i,
  /This passage invokes slavery or coerced labor language/i,
  /This passage uses Christian judgmental language for non-Christian practice/i
  ,
  /The passage uses racist nineteenth-century language/i,
  /The text uses stigmatizing language for mental illness/i,
  /The passage uses racialized and colonial language/i,
  /The text frames non-Christian practice as sinful/i
];

const broadTemplatePatterns = [
  /is not just motion through the plot/i,
  /keeps .* practical\. The detail helps students follow/i,
  /turns .* into a problem of classification/i,
  /works like staged speech/i
];

const annotationsWithGenericPlaceholderNotes = annotations.annotations.filter((annotation) =>
  genericNotePatterns.some((pattern) => pattern.test(annotation.note ?? ""))
);

const sourceTextOnlyCitationGaps = annotations.annotations.filter((annotation) =>
  (annotation.evidence ?? []).length > 0 &&
  annotation.evidence.every((evidence) => evidence.claim_type === "source-text-observation") &&
  (annotation.citations ?? []).length === 1 &&
  annotation.citations[0] === "standard-ebooks-moby-dick" &&
  annotation.status.citation_status !== "verified"
);

const verifiedAnnotationsWithoutPrimarySourceCheck = annotations.annotations.filter((annotation) =>
  annotation.status.citation_status === "verified" &&
  !(annotation.evidence ?? []).some((evidence) => evidence.validation?.includes("primary-source-checked"))
);

const verifiedAnnotationsStillInCitationReview = annotations.annotations.filter((annotation) =>
  annotation.status.citation_status === "verified" &&
  annotation.status.review_queue?.includes("citation")
);

const studentReadyGlossaryWithUnverifiedCitations = glossary.entries.filter((entry) =>
  entry.status.definition_status === "student-ready" &&
  entry.status.citation_status !== "verified"
);

const studentReadyReferencesWithUnverifiedCitations = referenceCards.cards.filter((card) =>
  card.status.content_status === "student-ready" &&
  card.status.citation_status !== "verified"
);

const readerSurfaceAnnotations = annotations.annotations.filter((annotation) =>
  annotation.display?.surfaces?.includes("reader")
);

const publicStudyAnnotations = readerSurfaceAnnotations.filter((annotation) =>
  annotation.status.content_status === "student-ready"
);

const readerSurfaceAnnotationsNotStudentReady = readerSurfaceAnnotations.filter((annotation) =>
  annotation.status.content_status !== "student-ready"
);

// Shakespeare-grade rubric signals. The Shakespeare Portal's public layer is dominated by
// notes that teach external knowledge (vocabulary, allusion, history) and cite a real source
// for it; pure source-text observation is reserved for genuine close-reading cruxes. These
// metrics measure how far the public Moby-Dick layer has moved from observation-only prose
// toward externally sourced teaching notes. See docs/CONTENT_STANDARDS.md (Publication Gate).
const externalKnowledgeClaimTypes = new Set([
  "lexical",
  "historical-context",
  "biblical-context",
  "classical-context",
  "nautical-whaling",
  "cartographic",
  "publication-context"
]);
const STANDARD_EBOOKS_SOURCE = "standard-ebooks-moby-dick";
const publicClaimTypeDistribution = {};
for (const annotation of publicStudyAnnotations) {
  for (const evidence of annotation.evidence ?? []) {
    publicClaimTypeDistribution[evidence.claim_type] =
      (publicClaimTypeDistribution[evidence.claim_type] ?? 0) + 1;
  }
}
const publicSourceTextOnlyNotes = publicStudyAnnotations.filter((annotation) =>
  (annotation.evidence ?? []).length > 0 &&
  annotation.evidence.every((evidence) => evidence.claim_type === "source-text-observation")
);
const publicExternalKnowledgeNotes = publicStudyAnnotations.filter((annotation) =>
  (annotation.evidence ?? []).some((evidence) => externalKnowledgeClaimTypes.has(evidence.claim_type))
);
// Hard-rule violations: a public note that makes an external-knowledge claim must cite a
// non-Standard-Ebooks source within that evidence record. validate-basic.mjs fails on these;
// the audit lists them so the gap is visible during the upgrade work.
const publicNotesFailingExternalSourceRule = publicStudyAnnotations.filter((annotation) =>
  (annotation.evidence ?? []).some((evidence) =>
    externalKnowledgeClaimTypes.has(evidence.claim_type) &&
    !(evidence.citations ?? []).some((citation) => citation && citation !== STANDARD_EBOOKS_SOURCE)
  )
);

const publicGlossaryEntries = glossary.entries.filter((entry) =>
  entry.status.definition_status === "student-ready" && entry.status.citation_status === "verified"
);

const publicReferenceCards = referenceCards.cards.filter((card) =>
  card.status.content_status === "student-ready" && card.status.citation_status === "verified"
);

const publicPayloadDraftGlossary = guideData.glossary.filter((entry) =>
  entry.status?.definition_status !== "student-ready" || entry.status?.citation_status !== "verified"
);

const publicPayloadDraftReferences = guideData.referenceCards.filter((card) =>
  card.status?.content_status !== "student-ready" || card.status?.citation_status !== "verified"
);

const publicPayloadDraftAnnotations = guideData.annotations.filter((annotation) =>
  !annotation.display?.surfaces?.includes("reader") ||
  annotation.status?.content_status !== "student-ready" ||
  annotation.status?.citation_status !== "verified"
);

const publicPayloadAnnotationIndexDraftAnnotations = Object.values(guideData.annotationIndex?.units ?? {})
  .flatMap((unit) => unit.annotations ?? [])
  .filter((annotation) =>
    !annotation.display?.surfaces?.includes("reader") ||
    annotation.status?.content_status !== "student-ready" ||
    annotation.status?.citation_status !== "verified"
  );

const broadAnnotationsWithTemplateNotes = annotations.annotations.filter((annotation) =>
  (annotation.id.startsWith("broad-apparatus-") || annotation.tags?.includes("provenance:broad-apparatus-pass")) &&
  broadTemplatePatterns.some((pattern) => pattern.test(annotation.note ?? ""))
);

const generatedAnnotationProseTemplatePatterns = [
  /adds another thematic foothold/i,
  /adds concrete context/i,
  /adds a formal foothold/i,
  /adds a spatial foothold/i,
  /gives the chapter a concrete context point/i,
  /helps students notice the chapter's method/i,
  /opens a thematic pressure point/i,
  /gives the chapter a spatial handle/i,
  /gives students a precise character handle/i,
  /keeps the whale material attached/i,
  /anchors the chapter in shipboard work/i,
  /shows sacred language entering/i,
  /helps students see how Melville turns money/i,
  /gives the scene a navigational/i,
  /makes danger concrete/i,
  /asks students to hear/i
];

const generatedAnnotationProseTemplateNotes = annotations.annotations.filter((annotation) =>
  (
    annotation.tags?.includes("provenance:ten-note-floor-pass") ||
    annotation.tags?.includes("provenance:annotation-variety-balance-pass") ||
    annotation.tags?.includes("provenance:twelve-note-floor-pass")
  ) &&
  generatedAnnotationProseTemplatePatterns.some((pattern) => pattern.test(annotation.note ?? ""))
);

const thinFloorRepeatedTemplatePatterns = [
  /The phrase keeps the ship's work concrete/i,
  /The selected detail turns whale knowledge into something students can test/i,
  /The wording stages speech and gesture as part of the chapter's meaning/i,
  /The language of rule and possession shows how the novel turns whaling practice/i,
  /Biblical language raises the stakes of the scene/i
];

const thinFloorRepeatedTemplateNotes = annotations.annotations.filter((annotation) =>
  annotation.id.startsWith("floor-pass-") &&
  thinFloorRepeatedTemplatePatterns.some((pattern) => pattern.test(annotation.note ?? ""))
);

const duplicateThinFloorNotes = [];
const thinFloorNotesByText = new Map();
for (const annotation of annotations.annotations.filter((item) => item.id.startsWith("floor-pass-"))) {
  const key = normalizedNote(annotation.note ?? "");
  if (!thinFloorNotesByText.has(key)) thinFloorNotesByText.set(key, []);
  thinFloorNotesByText.get(key).push(annotation);
}
for (const [note, items] of thinFloorNotesByText) {
  if (items.length < 2) continue;
  duplicateThinFloorNotes.push(`${note.slice(0, 80)}: ${items.map((item) => item.id).join(", ")}`);
}

const difficultMaterialNotNeedsReview = annotations.annotations.filter((annotation) =>
  annotation.kind === "difficult-material" && annotation.status.content_status !== "needs-review"
);

const difficultMaterialWithoutToneEvidence = annotations.annotations.filter((annotation) =>
  annotation.kind === "difficult-material" &&
  !(annotation.evidence ?? []).some((evidence) => evidence.validation?.includes("tone-review"))
);

const duplicateNoteGroups = [];
const notesByUnitAndText = new Map();
for (const annotation of annotations.annotations) {
  const key = `${annotation.unit_id}\t${normalizedNote(annotation.note ?? "")}`;
  if (!notesByUnitAndText.has(key)) notesByUnitAndText.set(key, []);
  notesByUnitAndText.get(key).push(annotation);
}
for (const [key, items] of notesByUnitAndText) {
  if (items.length < 2) continue;
  const [unitId] = key.split("\t");
  duplicateNoteGroups.push(`${unitId}: ${items.map((item) => item.id).join(", ")}`);
}

const generatedGlossaryTermsByText = new Map();
for (const entry of glossary.entries.filter((item) => item.id.startsWith("apparatus-floor-gloss-"))) {
  const key = entry.term.toLowerCase();
  if (!generatedGlossaryTermsByText.has(key)) generatedGlossaryTermsByText.set(key, []);
  generatedGlossaryTermsByText.get(key).push(entry);
}

const duplicateGeneratedGlossaryTerms = [];
for (const [term, items] of generatedGlossaryTermsByText) {
  if (items.length < 2) continue;
  duplicateGeneratedGlossaryTerms.push(`${term}: ${items.map((item) => item.id).join(", ")}`);
}

const generatedReferenceNotesByText = new Map();
for (const card of referenceCards.cards.filter((item) => item.id.startsWith("apparatus-floor-ref-"))) {
  const key = normalizedNote(card.student_note ?? "");
  if (!generatedReferenceNotesByText.has(key)) generatedReferenceNotesByText.set(key, []);
  generatedReferenceNotesByText.get(key).push(card);
}

const duplicateGeneratedReferenceNotes = [];
for (const [note, items] of generatedReferenceNotesByText) {
  if (items.length < 2) continue;
  duplicateGeneratedReferenceNotes.push(`${note}: ${items.map((item) => item.id).join(", ")}`);
}

const generatedGlossaryGenericDefinitions = glossary.entries.filter((entry) =>
  entry.id.startsWith("apparatus-floor-gloss-") &&
  (
    /names a chapter-level image/i.test(entry.definition ?? "") ||
    /helps students connect local detail/i.test(entry.definition ?? "") ||
    /chapter's larger work/i.test(entry.definition ?? "")
  )
);

const generatedReferenceTemplateNotes = referenceCards.cards.filter((card) =>
  card.id.startsWith("apparatus-floor-ref-") &&
  /^In .+, use this card to /i.test(card.student_note ?? "")
);

const generatedGlossaryWeakDefinitions = glossary.entries.filter((entry) =>
  entry.id.startsWith("apparatus-floor-gloss-") &&
  (
    /quick handle/i.test(entry.definition ?? "") ||
    /keeps that idea tied/i.test(entry.definition ?? "") ||
    /specific passage rather than floating/i.test(entry.definition ?? "")
  )
);

const deepGlossaryTermsByText = new Map();
for (const entry of glossary.entries.filter((item) => item.id.startsWith("apparatus-deep-gloss-"))) {
  const key = entry.term.toLowerCase();
  if (!deepGlossaryTermsByText.has(key)) deepGlossaryTermsByText.set(key, []);
  deepGlossaryTermsByText.get(key).push(entry);
}

const duplicateDeepGlossaryTerms = [];
for (const [term, items] of deepGlossaryTermsByText) {
  if (items.length < 2) continue;
  duplicateDeepGlossaryTerms.push(`${term}: ${items.map((item) => item.id).join(", ")}`);
}

const deepGlossaryDefinitionsByText = new Map();
for (const entry of glossary.entries.filter((item) => item.id.startsWith("apparatus-deep-gloss-"))) {
  const key = normalizedNote(entry.definition ?? "");
  if (!deepGlossaryDefinitionsByText.has(key)) deepGlossaryDefinitionsByText.set(key, []);
  deepGlossaryDefinitionsByText.get(key).push(entry);
}

const duplicateDeepGlossaryDefinitions = [];
for (const [definition, items] of deepGlossaryDefinitionsByText) {
  if (items.length < 2) continue;
  duplicateDeepGlossaryDefinitions.push(`${definition}: ${items.map((item) => item.id).join(", ")}`);
}

const deepReferenceTemplateNotes = referenceCards.cards.filter((card) =>
  card.id.startsWith("apparatus-deep-ref-") &&
  (
    /gives students another angle on how scene, voice, and selected detail guide judgment/i.test(card.summary ?? "") ||
    /Use this card to ask what .+ makes newly visible/i.test(card.student_note ?? "") ||
    /Use this card when .+ feels performed/i.test(card.student_note ?? "") ||
    /Use this card to connect .+'s practical details/i.test(card.student_note ?? "")
  )
);

const deepGlossaryAwkwardTerms = glossary.entries.filter((entry) =>
  entry.id.startsWith("apparatus-deep-gloss-") &&
  (
    !/^(?:Ch\. \d+ [^:]+|[A-Za-z][^:]+): wider [a-z][a-z -]+$/i.test(entry.term ?? "") ||
    /[;!?]/.test(entry.term ?? "") ||
    /\(Battering\)$/i.test(entry.term ?? "") ||
    /\b(the|a|an|as|and|of|in|to)\)$/i.test(entry.term ?? "") ||
    /\b(The|A|An|Of|Does|Stubb|Measurement|Midnight|First|Queen|Sunset|Dusk|Hark|Postscript|Brit|Squid|Ambergris|Epilogue)\b.*\b(scene pressure|shipboard routine|whale knowledge|staged speech)\b/i.test(entry.term ?? "")
  )
);

const wideReferenceTemplateNotes = referenceCards.cards.filter((card) =>
  (card.id.startsWith("apparatus-wide-ref-") || card.id.startsWith("short-unit-ref-")) &&
  (
    /Passage Lens/i.test(card.title ?? "") ||
    /needs support for reading the chapter's local evidence/i.test(card.summary ?? "") ||
    /Use this card with .+ when students need one more route/i.test(card.student_note ?? "") ||
    /Use this card to keep .+ visible/i.test(card.student_note ?? "") ||
    /This card frames/i.test(`${card.summary ?? ""} ${card.student_note ?? ""}`) ||
    /The useful classroom move/i.test(`${card.summary ?? ""} ${card.student_note ?? ""}`) ||
    /This card's focus/i.test(`${card.summary ?? ""} ${card.student_note ?? ""}`)
  )
);

const wideGlossaryTemplateDefinitions = glossary.entries.filter((entry) =>
  (entry.id.startsWith("apparatus-wide-gloss-") || entry.id.startsWith("short-unit-gloss-")) &&
  (
    /chapter-specific reading handle/i.test(entry.definition ?? "") ||
    /A chapter-specific handle for a short unit/i.test(entry.definition ?? "") ||
    /attach a local word, image, or action/i.test(entry.definition ?? "") ||
    /keeps the guide from treating/i.test(entry.definition ?? "") ||
    /this term names a local feature/i.test(entry.definition ?? "") ||
    /names the compressed detail/i.test(entry.definition ?? "")
  )
);

const generatedGlossaryInternalLabels = glossary.entries.filter((entry) =>
  (
    entry.id.startsWith("apparatus-wide-gloss-") ||
    entry.id.startsWith("apparatus-deep-gloss-") ||
    entry.id.startsWith("short-unit-gloss-")
  ) &&
  (
    /^(scene pressure|local emphasis|whale knowledge|shipboard routine|staged speech|staged exchange|observed whale detail|shipboard task|brief scene turn|reader judgment|narrative angle|classification pressure|working gear|crew risk|dramatic timing|speaker turn) \(/i.test(entry.term ?? "") ||
    /\((?:the|a|an|and|as|in|of|or|the|to|kill)\)$/i.test(entry.term ?? "")
  )
);

const duplicateGlossaryTermsByTarget = [];
const glossaryEntriesByTermAndTarget = new Map();
for (const entry of glossary.entries) {
  for (const target of entry.targets ?? []) {
    const key = `${normalizedNote(entry.term ?? "")}\t${target}`;
    if (!glossaryEntriesByTermAndTarget.has(key)) glossaryEntriesByTermAndTarget.set(key, []);
    glossaryEntriesByTermAndTarget.get(key).push(entry);
  }
}
for (const [key, items] of glossaryEntriesByTermAndTarget) {
  if (items.length < 2) continue;
  const [term, target] = key.split("\t");
  duplicateGlossaryTermsByTarget.push(`${target} (${term}): ${items.map((item) => item.id).join(", ")}`);
}

const duplicateReferenceTitlesByTarget = [];
const referenceCardsByTitleAndTarget = new Map();
for (const card of referenceCards.cards) {
  for (const target of card.targets ?? []) {
    const key = `${normalizedNote(card.title ?? "")}\t${target}`;
    if (!referenceCardsByTitleAndTarget.has(key)) referenceCardsByTitleAndTarget.set(key, []);
    referenceCardsByTitleAndTarget.get(key).push(card);
  }
}
for (const [key, items] of referenceCardsByTitleAndTarget) {
  if (items.length < 2) continue;
  const [title, target] = key.split("\t");
  duplicateReferenceTitlesByTarget.push(`${target} (${title}): ${items.map((item) => item.id).join(", ")}`);
}

const generatedSupportReferenceDuplicateNotes = [];
const generatedSupportReferenceNotesByUnit = new Map();
for (const card of referenceCards.cards.filter((item) => item.id.startsWith("apparatus-wide-ref-") || item.id.startsWith("short-unit-ref-"))) {
  for (const target of card.targets ?? []) {
    const key = `${target}\t${normalizedNote(`${card.summary} ${card.student_note}`)}`;
    if (!generatedSupportReferenceNotesByUnit.has(key)) generatedSupportReferenceNotesByUnit.set(key, []);
    generatedSupportReferenceNotesByUnit.get(key).push(card);
  }
}
for (const [key, items] of generatedSupportReferenceNotesByUnit) {
  if (items.length < 2) continue;
  const [unitId] = key.split("\t");
  generatedSupportReferenceDuplicateNotes.push(`${unitId}: ${items.map((item) => item.id).join(", ")}`);
}

const generatedSupportGlossaryDuplicateDefinitions = [];
const generatedSupportGlossaryDefinitionsByUnit = new Map();
for (const entry of glossary.entries.filter((item) => item.id.startsWith("apparatus-wide-gloss-") || item.id.startsWith("short-unit-gloss-"))) {
  for (const target of entry.targets ?? []) {
    const key = `${target}\t${normalizedNote(entry.definition ?? "")}`;
    if (!generatedSupportGlossaryDefinitionsByUnit.has(key)) generatedSupportGlossaryDefinitionsByUnit.set(key, []);
    generatedSupportGlossaryDefinitionsByUnit.get(key).push(entry);
  }
}
for (const [key, items] of generatedSupportGlossaryDefinitionsByUnit) {
  if (items.length < 2) continue;
  const [unitId] = key.split("\t");
  generatedSupportGlossaryDuplicateDefinitions.push(`${unitId}: ${items.map((item) => item.id).join(", ")}`);
}

const frontmatterWithoutSummaries = manifest.units
  .filter((unit) => unit.section_type === "frontmatter" && !hasUsableSummary(unit))
  .map((unit) => unit.unit_id);

const classroomThinUnits = manifest.units
  .filter(isClassroomUnit)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id)?.length ?? 0) < 2)
  .map((unit) => unit.unit_id);

const wholeBookThinUnits = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue" || unit.word_count >= 100)
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id)?.length ?? 0) < 3)
  .map((unit) => unit.unit_id);

const chapterUnitsWithFewerThanTenAnnotations = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id)?.length ?? 0) < 10)
  .map((unit) => unit.unit_id);

const chapterUnitsWithFewerThanTwelveAnnotations = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id)?.length ?? 0) < 12)
  .map((unit) => unit.unit_id);

const chapterUnitsWithFewerThanFourteenAnnotations = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id)?.length ?? 0) < 14)
  .map((unit) => unit.unit_id);

function hasAnnotationKind(unit, kind) {
  return (annotationsByUnit.get(unit.unit_id) ?? []).some((annotation) => annotation.kind === kind);
}

const contextFunctionKindGaps = manifest.units
  .filter((unit) => unit.section_type === "chapter")
  .filter((unit) => unit.functions.some((fn) => ["cetology", "whaling-labor", "legal-political", "biblical-allusion", "sermon"].includes(fn)))
  .filter((unit) => !hasAnnotationKind(unit, "context"))
  .map((unit) => unit.unit_id);

const formFunctionKindGaps = manifest.units
  .filter((unit) => unit.section_type === "chapter")
  .filter((unit) => unit.functions.some((fn) => ["theatrical", "sermon", "gam"].includes(fn)))
  .filter((unit) => !hasAnnotationKind(unit, "form"))
  .map((unit) => unit.unit_id);

const themeKindGaps = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => !hasAnnotationKind(unit, "theme"))
  .map((unit) => unit.unit_id);

const annotationKindLopsidedUnits = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => {
    const unitAnnotations = annotationsByUnit.get(unit.unit_id) ?? [];
    if (unitAnnotations.length < 10) return false;
    const kindCounts = new Map();
    for (const annotation of unitAnnotations) {
      kindCounts.set(annotation.kind, (kindCounts.get(annotation.kind) ?? 0) + 1);
    }
    return Math.max(...kindCounts.values()) / unitAnnotations.length > 0.75;
  })
  .map((unit) => unit.unit_id);

const substantialUnitsWithoutReferenceCards = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (referenceTargetsByUnit.get(unit.unit_id)?.length ?? 0) === 0)
  .map((unit) => unit.unit_id);

const substantialUnitsWithFewerThanTwoReferenceCards = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (referenceTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 2)
  .map((unit) => unit.unit_id);

const substantialUnitsWithFewerThanThreeReferenceCards = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (referenceTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 3)
  .map((unit) => unit.unit_id);

const substantialUnitsWithFewerThanFourReferenceCards = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (referenceTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 4)
  .map((unit) => unit.unit_id);

const displayedChapterUnitsWithFewerThanTwoReferenceCards = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (referenceTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 2)
  .map((unit) => unit.unit_id);

const substantialUnitsWithoutGlossaryEntries = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (glossaryTargetsByUnit.get(unit.unit_id)?.length ?? 0) === 0)
  .map((unit) => unit.unit_id);

const substantialUnitsWithFewerThanThreeGlossaryEntries = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (glossaryTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 3)
  .map((unit) => unit.unit_id);

const substantialUnitsWithFewerThanFourGlossaryEntries = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (glossaryTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 4)
  .map((unit) => unit.unit_id);

const substantialUnitsWithFewerThanFiveGlossaryEntries = manifest.units
  .filter(isSubstantialDisplayedUnit)
  .filter((unit) => (glossaryTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 5)
  .map((unit) => unit.unit_id);

const displayedChapterUnitsWithFewerThanThreeGlossaryEntries = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (glossaryTargetsByUnit.get(unit.unit_id)?.length ?? 0) < 3)
  .map((unit) => unit.unit_id);

const displayedChapterUnitsWithoutGeographyPlace = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (geographyTargetsByUnit.get(unit.unit_id)?.length ?? 0) === 0)
  .map((unit) => unit.unit_id);

const teacherNoteGaps = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue" || unit.word_count >= 100)
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => !(annotationsByUnit.get(unit.unit_id) ?? []).some((annotation) => annotation.kind === "teacher-note"))
  .map((unit) => unit.unit_id);

const displayedUnitsWithFewerThanTwoTeacherNotes = manifest.units
  .filter((unit) => unit.section_type === "chapter" || unit.section_type === "epilogue" || unit.word_count >= 100)
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id) ?? []).filter((annotation) => annotation.kind === "teacher-note").length < 2)
  .map((unit) => unit.unit_id);

const unitsWithoutAnnotations = manifest.units
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0)
  .filter((unit) => (annotationsByUnit.get(unit.unit_id)?.length ?? 0) === 0)
  .map((unit) => unit.unit_id);

const selectorExemptUnits = manifest.units
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length === 0)
  .map((unit) => unit.unit_id);

const annotationKindCounts = Object.fromEntries(countBy(annotations.annotations, (annotation) => annotation.kind));
const annotationStatusCounts = Object.fromEntries(countBy(annotations.annotations, (annotation) => annotation.status.content_status));
const glossaryStatusCounts = Object.fromEntries(countBy(glossary.entries, (entry) => entry.status.definition_status));
const referenceStatusCounts = Object.fromEntries(countBy(referenceCards.cards, (card) => card.status.content_status));
const sourceStatusCounts = Object.fromEntries(countBy(sourceRecords.records, (record) => record.citation_status));
const teacherPacketStatusCounts = Object.fromEntries(countBy(teacherPackets.packets, (packet) => packet.status.content_status));

function collectCitedSourceIds(value, ids = new Set(), key = "") {
  if (Array.isArray(value)) {
    for (const item of value) collectCitedSourceIds(item, ids, key);
    return ids;
  }
  if (!value || typeof value !== "object") return ids;

  for (const [childKey, childValue] of Object.entries(value)) {
    if (childKey === "citations" && Array.isArray(childValue)) {
      for (const citation of childValue) {
        if (typeof citation === "string") ids.add(citation.replace(/^source:/, ""));
      }
      continue;
    }

    if (
      ["source", "source_id", "sourceId", "source_record_id", "sourceRecordId"].includes(childKey) &&
      typeof childValue === "string"
    ) {
      ids.add(childValue.replace(/^source:/, ""));
      continue;
    }

    if (childKey === "target" && typeof childValue === "string" && childValue.startsWith("source:")) {
      ids.add(childValue.slice("source:".length));
      continue;
    }

    collectCitedSourceIds(childValue, ids, childKey);
  }

  return ids;
}

const activelyCitedSourceIds = collectCitedSourceIds([
  annotations,
  glossary,
  referenceCards,
  geography,
  taxonomy,
  voyageMap,
  summarySeeds
]);

const activelyCitedSourcesStillNeedsReview = sourceRecords.records
  .filter((record) => record.citation_status === "needs-review")
  .filter((record) => activelyCitedSourceIds.has(record.id))
  .map((record) => `${record.id} (${record.title})`);

const publicSourcesNeedingBibliographicReview = Object.values(publicSourceReadiness.sources ?? {})
  .filter((source) => source.readiness_state === "bibliographic-review-needed")
  .sort((a, b) => b.usage_count - a.usage_count || a.source_id.localeCompare(b.source_id))
  .map((source) => `${source.source_id} (${source.title}, ${source.usage_count} public uses, ${source.citation_status})`);

const publicSourcesBlocked = Object.values(publicSourceReadiness.sources ?? {})
  .filter((source) => source.readiness_state === "blocked-source")
  .sort((a, b) => b.usage_count - a.usage_count || a.source_id.localeCompare(b.source_id))
  .map((source) => `${source.source_id} (${source.title}, ${source.usage_count} public uses, ${source.citation_status})`);

const canonicalTaxonomyEntityPairs = [
  ["peleg", "captain-peleg"],
  ["bildad", "captain-bildad"],
  ["boomer", "captain-boomer"],
  ["rachel", "rachel-ship"],
  ["jeroboam", "jeroboam-ship"],
  ["samuel-enderby", "samuel-enderby-ship"],
  ["delight", "delight-ship"],
  ["fleece", "the-cook"]
];

const taxonomyEntityIds = new Set(taxonomy.entities.map((entity) => entity.id));
const duplicateTaxonomyAliasEntities = canonicalTaxonomyEntityPairs
  .filter(([keepId, dropId]) => taxonomyEntityIds.has(keepId) && taxonomyEntityIds.has(dropId))
  .map(([keepId, dropId]) => `${dropId} duplicates ${keepId}`);

const teacherPacketsByUnit = new Map(teacherPackets.packets.map((packet) => [packet.unit_id, packet]));
const teacherPacketUnitIds = new Set(teacherPackets.packets.map((packet) => packet.unit_id));
const requiredTeacherPacketUnits = manifest.units
  .filter((unit) => unit.unit_id !== "frontmatter-halftitlepage")
  .filter((unit) => (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0);
const chapterUnitsWithoutTeacherPacket = requiredTeacherPacketUnits
  .filter((unit) => !teacherPacketUnitIds.has(unit.unit_id))
  .map((unit) => unit.unit_id);

const teacherPacketsWithFewerThanTwoPrompts = teacherPackets.packets
  .filter((packet) => (packet.discussion_prompts ?? []).length < 2)
  .map((packet) => packet.id);

const teacherPacketPromptsWithoutLinks = [];
for (const packet of teacherPackets.packets) {
  for (const prompt of packet.discussion_prompts ?? []) {
    const linkCount = (prompt.linked_annotations?.length ?? 0) + (prompt.linked_reference_cards?.length ?? 0) + (prompt.linked_trails?.length ?? 0);
    if (linkCount === 0) teacherPacketPromptsWithoutLinks.push(`${packet.id}: ${prompt.id}`);
  }
}

const duplicateTeacherPacketPrompts = [];
for (const packet of teacherPackets.packets) {
  const promptsByText = new Map();
  for (const prompt of packet.discussion_prompts ?? []) {
    const key = normalizedNote(prompt.prompt ?? "");
    if (!promptsByText.has(key)) promptsByText.set(key, []);
    promptsByText.get(key).push(prompt.id);
  }
  for (const [prompt, ids] of promptsByText) {
    if (ids.length > 1) duplicateTeacherPacketPrompts.push(`${packet.id}: ${prompt.slice(0, 80)} (${ids.join(", ")})`);
  }
}

const teacherPacketsMissingTeacherReview = teacherPackets.packets
  .filter((packet) => !packet.status.review_queue?.includes("teacher"))
  .map((packet) => packet.id);

const teacherPacketsWithDifficultMaterialMissingToneReview = teacherPackets.packets
  .filter((packet) => (packet.difficult_material_handles ?? []).length > 0)
  .filter((packet) => !packet.status.review_queue?.includes("difficult-material") || !packet.status.review_queue?.includes("tone"))
  .map((packet) => packet.id);

const searchDocumentsMissingTeacherPacketFacet = searchDocuments.documents
  .filter((document) => requiredTeacherPacketUnits.some((unit) => unit.unit_id === document.unit_id))
  .filter((document) => !document.teacher_packet)
  .map((document) => document.unit_id);

const teacherReviewMissingChapterPacket = teacherReview.units
  .filter((unit) => requiredTeacherPacketUnits.some((requiredUnit) => requiredUnit.unit_id === unit.unit_id))
  .filter((unit) => !unit.teacher_packet)
  .map((unit) => unit.unit_id);

const teacherReviewUnitsWithoutReadinessState = teacherReview.units
  .filter((unit) => !["candidate", "reviewing", "blocked", "exempt"].includes(unit.readiness_state))
  .map((unit) => unit.unit_id);

const teacherReviewReadinessCounts = Object.fromEntries(countBy(teacherReview.units, (unit) => unit.readiness_state ?? "missing"));

const difficultMaterialAnnotationsWithoutCategory = annotations.annotations
  .filter((annotation) => annotation.kind === "difficult-material")
  .filter((annotation) => !(annotation.tags ?? []).some((tag) => tag.startsWith("difficulty:")))
  .map((annotation) => `${annotation.id} (${annotation.unit_id})`);

function isAsciiLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function sourceTextHasWholePhrase(text, phrase) {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = lowerText.indexOf(lowerPhrase);
  while (index !== -1) {
    if (!isAsciiLetter(text[index - 1]) && !isAsciiLetter(text[index + phrase.length])) return true;
    index = lowerText.indexOf(lowerPhrase, index + Math.max(1, phrase.length));
  }
  return false;
}

const sourceTextFindableUnindexedEntities = taxonomy.entities
  .filter((entity) => (annotationsByEntity.entities[entity.id]?.annotation_count ?? 0) === 0)
  .filter((entity) => {
    const names = [entity.label, ...(entity.aliases ?? [])].filter((name) => name && name.length > 2);
    return names.some((name) => guideData.units.some((unit) => sourceTextHasWholePhrase(unit.plain_text ?? "", name)));
  })
  .map((entity) => `${entity.id} (${entity.label})`);

const taxonomyEntitiesWithoutIndexedAnnotations = taxonomy.entities
  .filter((entity) => (annotationsByEntity.entities[entity.id]?.annotation_count ?? 0) === 0)
  .map((entity) => `${entity.id} (${entity.label})`);

const taxonomyTrailsWithoutIndexedAnnotations = taxonomy.trails
  .filter((trail) => (annotationsByTrail.trails[trail.id]?.annotation_count ?? 0) === 0)
  .map((trail) => `${trail.id} (${trail.label})`);

const sourceRecordsWithoutIndexedAnnotations = sourceRecords.records
  .filter((record) => (annotationsBySource.sources[record.id]?.annotation_count ?? 0) === 0)
  .map((record) => `${record.id} (${record.title})`);

const linkedReferenceIds = new Set();
const linkedGlossaryIds = new Set();
for (const annotation of annotations.annotations) {
  for (const relationship of annotation.relationships ?? []) {
    if (relationship.target?.startsWith("reference:")) linkedReferenceIds.add(relationship.target.slice("reference:".length));
    if (relationship.target?.startsWith("glossary:")) linkedGlossaryIds.add(relationship.target.slice("glossary:".length));
  }
}

const referenceCardsWithoutAnnotationLinks = referenceCards.cards
  .filter((card) => !linkedReferenceIds.has(card.id))
  .map((card) => `${card.id} (${card.title})`);

const glossaryEntriesWithoutAnnotationLinks = glossary.entries
  .filter((entry) => !linkedGlossaryIds.has(entry.id))
  .map((entry) => `${entry.id} (${entry.term})`);

const duplicateSourceRecordUrls = [];
const sourceRecordsByUrl = new Map();
for (const record of sourceRecords.records) {
  const key = String(record.url ?? "").trim().toLowerCase().replace(/\/$/, "");
  if (!key) continue;
  if (!sourceRecordsByUrl.has(key)) sourceRecordsByUrl.set(key, []);
  sourceRecordsByUrl.get(key).push(record);
}
for (const [url, records] of sourceRecordsByUrl) {
  if (records.length < 2) continue;
  duplicateSourceRecordUrls.push(`${url}: ${records.map((record) => record.id).join(", ")}`);
}

const duplicateSupportSourceRecordTitles = [];
const sourceRecordsByTitle = new Map();
for (const record of sourceRecords.records) {
  if (record.kind === "source-text") continue;
  const key = String(record.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!key) continue;
  if (!sourceRecordsByTitle.has(key)) sourceRecordsByTitle.set(key, []);
  sourceRecordsByTitle.get(key).push(record);
}
for (const [title, records] of sourceRecordsByTitle) {
  if (records.length < 2) continue;
  duplicateSupportSourceRecordTitles.push(`${title}: ${records.map((record) => record.id).join(", ")}`);
}

const voyageWaypointUncoveredChapters = [];
for (const chapter of manifest.chapters) {
  const covered = voyageMap.waypoints.some((waypoint) =>
    chapter.number >= waypoint.chapter_start && chapter.number <= waypoint.chapter_end
  );
  if (!covered) voyageWaypointUncoveredChapters.push(chapter.unit_id);
}

const duplicateVoyageWaypointCoordinates = [];
const waypointsByCoordinate = new Map();
for (const waypoint of voyageMap.waypoints) {
  const key = waypoint.coordinates.join(",");
  if (!waypointsByCoordinate.has(key)) waypointsByCoordinate.set(key, []);
  waypointsByCoordinate.get(key).push(waypoint);
}
for (const [coordinate, waypoints] of waypointsByCoordinate) {
  if (waypoints.length < 2) continue;
  duplicateVoyageWaypointCoordinates.push(`${coordinate}: ${waypoints.map((waypoint) => waypoint.id).join(", ")}`);
}

const difficultMaterialUnits = annotations.annotations
  .filter((annotation) => annotation.kind === "difficult-material")
  .map((annotation) => annotation.unit_id);

const difficultMaterialPatterns = [
  { key: "high", re: /\bcannibals?\b/i },
  { key: "high", re: /\bsavages?\b|\bsavageness\b/i },
  { key: "high", re: /\bheathen(?:ish|s)?\b/i },
  { key: "high", re: /\bnegro(?:es)?\b/i },
  { key: "high", re: /\bslaves?\b|\bslavery\b/i },
  { key: "high", re: /\binsane\b|\binsanity\b/i },
  { key: "high", re: /\bmad\b|\bmadness\b|\bmadman\b|\bmadmen\b/i },
  { key: "violence", re: /\bkill(?:ed|ing|s)?\b/i },
  { key: "violence", re: /\bblood(?:y)?\b/i },
  { key: "violence", re: /\bsharks?\b/i },
  { key: "violence", re: /\bbutcher(?:s|ed|ing|y)?\b/i }
];

function hasDifficultMaterialSignal(text) {
  const hits = difficultMaterialPatterns.filter((pattern) => pattern.re.test(text));
  return hits.some((hit) => hit.key === "high") || hits.filter((hit) => hit.key === "violence").length >= 2;
}

const difficultMaterialClassroomGaps = manifest.units
  .filter(isClassroomUnit)
  .filter((unit) => {
    const text = guideData.units.find((guideUnit) => guideUnit.unit_id === unit.unit_id)?.plain_text.toLowerCase() ?? "";
    return hasDifficultMaterialSignal(text) && !difficultMaterialUnits.includes(unit.unit_id);
  })
  .slice(0, 20)
  .map((unit) => unit.unit_id);

const report = {
  generated: new Date().toISOString().slice(0, 10),
  counts: {
    reading_units: manifest.unit_count,
    summary_seeds: summarySeeds.summaries.length,
    glossary_entries: glossary.entries.length,
    reference_cards: referenceCards.cards.length,
    annotations: annotations.annotations.length,
    public_study_annotations: publicStudyAnnotations.length,
    public_study_external_knowledge_notes: publicExternalKnowledgeNotes.length,
    public_study_source_text_only_notes: publicSourceTextOnlyNotes.length,
    public_study_notes_failing_external_source_rule: publicNotesFailingExternalSourceRule.length,
    public_study_claim_type_distribution: publicClaimTypeDistribution,
    reader_surface_draft_annotations: readerSurfaceAnnotationsNotStudentReady.length,
    public_glossary_entries: publicGlossaryEntries.length,
    public_reference_cards: publicReferenceCards.length,
    public_glossary_review_candidates: publicApparatusCandidates.counts.glossary_review_for_promotion,
    public_glossary_rewrite_candidates: publicApparatusCandidates.counts.glossary_possible_rewrite,
    public_glossary_units_without_public_entry: publicApparatusCandidates.counts.glossary_units_without_public_entry,
    public_reference_review_candidates: publicApparatusCandidates.counts.reference_review_for_promotion,
    public_reference_rewrite_candidates: publicApparatusCandidates.counts.reference_possible_rewrite,
    public_reference_units_without_public_card: publicApparatusCandidates.counts.reference_units_without_public_card,
    public_payload_annotations: guideData.annotations.length,
    public_payload_annotation_index_annotations: Object.values(guideData.annotationIndex?.units ?? {}).reduce((total, unit) => total + (unit.annotations?.length ?? 0), 0),
    public_payload_glossary_entries: guideData.glossary.length,
    public_payload_reference_cards: guideData.referenceCards.length,
    public_payload_teacher_packets: guideData.teacherPackets.length,
    source_records: sourceRecords.records.length,
    public_source_records: publicSourceReadiness.public_source_count,
    public_source_usages: publicSourceReadiness.public_usage_count,
    public_source_records_ready: publicSourceReadiness.readiness_counts?.["public-ready-source"] ?? 0,
    public_source_records_provisional: publicSourceReadiness.readiness_counts?.["bibliographic-review-needed"] ?? 0,
    public_source_records_blocked: publicSourceReadiness.readiness_counts?.["blocked-source"] ?? 0,
    teacher_packets: teacherPackets.packets.length,
    search_documents: searchDocuments.documents.length,
    teacher_review_units: teacherReview.units.length,
    review_queue_items: reviewQueue.item_count,
    review_queue_count: Object.keys(reviewQueue.queues).length,
    public_annotation_review_candidates: publicAnnotationCandidates.counts.review_for_promotion,
    public_annotation_source_support_candidates: publicAnnotationCandidates.counts.source_support_review,
    public_annotation_tone_source_candidates: publicAnnotationCandidates.counts.tone_and_source_review,
    public_annotation_rewrite_candidates: publicAnnotationCandidates.counts.possible_rewrite,
    public_annotation_retired_internal: publicAnnotationCandidates.counts.retired_internal,
    public_annotation_teacher_only_internal: publicAnnotationCandidates.counts.teacher_only_internal,
    public_annotation_likely_internal_or_retire: publicAnnotationCandidates.counts.likely_retire_or_internal_only,
    classroom_units_without_public_study: publicAnnotationCandidates.counts.classroom_units_without_public_ready,
    classroom_recovery_units_with_review_candidates: publicAnnotationCandidates.counts.classroom_recovery_units_with_review_candidates,
    classroom_recovery_units_with_rewrite_candidates: publicAnnotationCandidates.counts.classroom_recovery_units_with_rewrite_candidates,
    classroom_recovery_units_needing_fresh_annotation: publicAnnotationCandidates.counts.classroom_recovery_units_needing_fresh_annotation,
    whole_book_units_without_public_study: publicAnnotationCandidates.counts.whole_book_units_without_public_ready,
    whole_book_recovery_units_with_review_candidates: publicAnnotationCandidates.counts.whole_book_recovery_units_with_review_candidates,
    whole_book_recovery_units_with_rewrite_candidates: publicAnnotationCandidates.counts.whole_book_recovery_units_with_rewrite_candidates,
    whole_book_recovery_units_needing_fresh_annotation: publicAnnotationCandidates.counts.whole_book_recovery_units_needing_fresh_annotation,
    difficult_material_categories: difficultMaterialReview.category_count,
    indexed_entities_covered: annotationsByEntity.covered_entity_count,
    indexed_trails_covered: annotationsByTrail.covered_trail_count,
    indexed_sources_covered: annotationsBySource.covered_source_count,
    source_usage_sources_covered: sourceUsage.used_source_count,
    taxonomy_trails: taxonomy.trails.length,
    taxonomy_entities: taxonomy.entities.length,
    geography_places: geography.places.length,
    map_waypoints: voyageMap.waypoints.length
  },
  status_counts: {
    annotations: annotationStatusCounts,
    glossary: glossaryStatusCounts,
    references: referenceStatusCounts,
    sources: sourceStatusCounts,
    teacher_packets: teacherPacketStatusCounts,
    unit_readiness: teacherReviewReadinessCounts
  },
  annotation_kinds: annotationKindCounts,
  gaps: {
    frontmatter_without_summaries: listUnitLabels(frontmatterWithoutSummaries),
    units_without_annotations: listUnitLabels(unitsWithoutAnnotations),
    selector_exempt_units_without_displayed_text: listUnitLabels(selectorExemptUnits),
    classroom_units_with_fewer_than_two_annotations: listUnitLabels(classroomThinUnits),
    whole_book_units_with_fewer_than_three_annotations: listUnitLabels(wholeBookThinUnits),
    chapter_units_with_fewer_than_ten_annotations: listUnitLabels(chapterUnitsWithFewerThanTenAnnotations),
    chapter_units_with_fewer_than_twelve_annotations: listUnitLabels(chapterUnitsWithFewerThanTwelveAnnotations),
    chapter_units_with_fewer_than_fourteen_annotations: listUnitLabels(chapterUnitsWithFewerThanFourteenAnnotations),
    context_function_units_without_context_annotation: listUnitLabels(contextFunctionKindGaps),
    form_function_units_without_form_annotation: listUnitLabels(formFunctionKindGaps),
    chapter_units_without_theme_annotation: listUnitLabels(themeKindGaps),
    annotation_kind_lopsided_units: listUnitLabels(annotationKindLopsidedUnits),
    substantial_units_without_reference_cards: listUnitLabels(substantialUnitsWithoutReferenceCards),
    substantial_units_with_fewer_than_two_reference_cards: listUnitLabels(substantialUnitsWithFewerThanTwoReferenceCards),
    substantial_units_with_fewer_than_three_reference_cards: listUnitLabels(substantialUnitsWithFewerThanThreeReferenceCards),
    substantial_units_with_fewer_than_four_reference_cards: listUnitLabels(substantialUnitsWithFewerThanFourReferenceCards),
    displayed_chapter_units_with_fewer_than_two_reference_cards: listUnitLabels(displayedChapterUnitsWithFewerThanTwoReferenceCards),
    substantial_units_without_glossary_entries: listUnitLabels(substantialUnitsWithoutGlossaryEntries),
    substantial_units_with_fewer_than_three_glossary_entries: listUnitLabels(substantialUnitsWithFewerThanThreeGlossaryEntries),
    substantial_units_with_fewer_than_four_glossary_entries: listUnitLabels(substantialUnitsWithFewerThanFourGlossaryEntries),
    substantial_units_with_fewer_than_five_glossary_entries: listUnitLabels(substantialUnitsWithFewerThanFiveGlossaryEntries),
    displayed_chapter_units_with_fewer_than_three_glossary_entries: listUnitLabels(displayedChapterUnitsWithFewerThanThreeGlossaryEntries),
    displayed_chapter_units_without_geography_place: listUnitLabels(displayedChapterUnitsWithoutGeographyPlace),
    substantial_units_without_teacher_note: listUnitLabels(teacherNoteGaps),
    displayed_units_with_fewer_than_two_teacher_notes: listUnitLabels(displayedUnitsWithFewerThanTwoTeacherNotes),
    possible_difficult_material_classroom_gaps: listUnitLabels(difficultMaterialClassroomGaps),
    difficult_material_not_needs_review: listAnnotationLabels(difficultMaterialNotNeedsReview),
    difficult_material_without_tone_review_evidence: listAnnotationLabels(difficultMaterialWithoutToneEvidence),
    source_text_only_annotations_with_unverified_citations: listAnnotationLabels(sourceTextOnlyCitationGaps),
    verified_annotations_without_primary_source_check: listAnnotationLabels(verifiedAnnotationsWithoutPrimarySourceCheck),
    verified_annotations_still_in_citation_review: listAnnotationLabels(verifiedAnnotationsStillInCitationReview),
    actively_cited_sources_still_needs_review: activelyCitedSourcesStillNeedsReview,
    public_sources_needing_bibliographic_review: publicSourcesNeedingBibliographicReview,
    public_sources_blocked: publicSourcesBlocked,
    duplicate_taxonomy_alias_entities: duplicateTaxonomyAliasEntities,
    displayed_units_without_teacher_packet: listUnitLabels(chapterUnitsWithoutTeacherPacket),
    teacher_packets_with_fewer_than_two_prompts: teacherPacketsWithFewerThanTwoPrompts,
    teacher_packet_prompts_without_links: teacherPacketPromptsWithoutLinks,
    duplicate_teacher_packet_prompts: duplicateTeacherPacketPrompts,
    teacher_packets_missing_teacher_review: teacherPacketsMissingTeacherReview,
    teacher_packets_with_difficult_material_missing_tone_review: teacherPacketsWithDifficultMaterialMissingToneReview,
    search_documents_missing_teacher_packet_facet: listUnitLabels(searchDocumentsMissingTeacherPacketFacet),
    teacher_review_missing_chapter_packet: listUnitLabels(teacherReviewMissingChapterPacket),
    teacher_review_units_without_readiness_state: listUnitLabels(teacherReviewUnitsWithoutReadinessState),
    difficult_material_annotations_without_category: difficultMaterialAnnotationsWithoutCategory,
    source_text_findable_unindexed_entities: sourceTextFindableUnindexedEntities,
    taxonomy_entities_without_indexed_annotations: taxonomyEntitiesWithoutIndexedAnnotations,
    taxonomy_trails_without_indexed_annotations: taxonomyTrailsWithoutIndexedAnnotations,
    source_records_without_indexed_annotations: sourceRecordsWithoutIndexedAnnotations,
    reference_cards_without_annotation_links: referenceCardsWithoutAnnotationLinks,
    glossary_entries_without_annotation_links: glossaryEntriesWithoutAnnotationLinks,
    duplicate_source_record_urls: duplicateSourceRecordUrls,
    duplicate_support_source_record_titles: duplicateSupportSourceRecordTitles,
    voyage_waypoint_uncovered_chapters: listUnitLabels(voyageWaypointUncoveredChapters),
    duplicate_voyage_waypoint_coordinates: duplicateVoyageWaypointCoordinates,
    student_ready_glossary_with_unverified_citations: listGlossaryLabels(studentReadyGlossaryWithUnverifiedCitations),
    student_ready_references_with_unverified_citations: listReferenceLabels(studentReadyReferencesWithUnverifiedCitations),
    public_glossary_units_without_public_entry: listUnitLabels((publicApparatusCandidates.glossary_recovery_queue ?? []).map((unit) => unit.unit_id)),
    public_reference_units_without_public_card: listUnitLabels((publicApparatusCandidates.reference_recovery_queue ?? []).map((unit) => unit.unit_id)),
    public_glossary_recovery_queue: (publicApparatusCandidates.glossary_recovery_queue ?? [])
      .slice(0, 30)
      .map((unit) => {
        const candidate = unit.candidates?.[0];
        const label = candidate ? `${candidate.id}, score ${candidate.score}` : "fresh item needed";
        return `${unit.unit_id} (${unit.title}, ${unit.recovery_action}, ${label})`;
      }),
    public_reference_recovery_queue: (publicApparatusCandidates.reference_recovery_queue ?? [])
      .slice(0, 30)
      .map((unit) => {
        const candidate = unit.candidates?.[0];
        const label = candidate ? `${candidate.id}, score ${candidate.score}` : "fresh item needed";
        return `${unit.unit_id} (${unit.title}, ${unit.recovery_action}, ${label})`;
      }),
    reader_surface_annotations_not_student_ready: listAnnotationLabels(readerSurfaceAnnotationsNotStudentReady),
    public_payload_draft_glossary: listGlossaryLabels(publicPayloadDraftGlossary),
    public_payload_draft_references: listReferenceLabels(publicPayloadDraftReferences),
    public_payload_draft_annotations: listAnnotationLabels(publicPayloadDraftAnnotations),
    public_payload_annotation_index_draft_annotations: listAnnotationLabels(publicPayloadAnnotationIndexDraftAnnotations),
    public_payload_teacher_packets: guideData.teacherPackets.map((packet) => packet.id),
    classroom_units_without_public_study: listUnitLabels(publicAnnotationCandidates.classroom_units_without_public_ready ?? []),
    classroom_public_study_recovery_queue: (publicAnnotationCandidates.classroom_recovery_queue ?? [])
      .slice(0, 30)
      .map((unit) => {
        const candidate = unit.candidates?.[0];
        const candidateLabel = candidate ? `${candidate.id}, score ${candidate.score}` : "fresh note needed";
        return `${unit.unit_id} (${unit.title}, ${unit.classroom_level}, ${unit.recovery_action}, ${candidateLabel})`;
      }),
    whole_book_units_without_public_study: listUnitLabels(publicAnnotationCandidates.whole_book_units_without_public_ready ?? []),
    whole_book_public_study_recovery_queue: (publicAnnotationCandidates.whole_book_recovery_queue ?? [])
      .slice(0, 30)
      .map((unit) => {
        const candidate = unit.candidates?.[0];
        const candidateLabel = candidate ? `${candidate.id}, score ${candidate.score}` : "fresh note needed";
        return `${unit.unit_id} (${unit.title}, ${unit.classroom_level}, ${unit.recovery_action}, ${candidateLabel})`;
      }),
    next_public_annotation_review_queue: (publicAnnotationCandidates.next_review_queue ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    next_public_annotation_source_support_queue: (publicAnnotationCandidates.next_source_support_queue ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    next_public_annotation_tone_source_queue: (publicAnnotationCandidates.next_tone_and_source_queue ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    next_public_annotation_rewrite_queue: (publicAnnotationCandidates.next_rewrite_queue ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    retired_internal_annotations: (publicAnnotationCandidates.retired_internal_sample ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    teacher_only_internal_annotations: (publicAnnotationCandidates.teacher_only_internal_sample ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    likely_retire_or_internal_only_annotations: (publicAnnotationCandidates.likely_retire_or_internal_only_sample ?? [])
      .slice(0, 20)
      .map((candidate) => `${candidate.id} (${candidate.unit_id}, score ${candidate.score})`),
    annotations_with_generic_placeholder_notes: listAnnotationLabels(annotationsWithGenericPlaceholderNotes),
    broad_annotations_with_template_notes: listAnnotationLabels(broadAnnotationsWithTemplateNotes),
    generated_annotation_prose_template_notes: listAnnotationLabels(generatedAnnotationProseTemplateNotes),
    thin_floor_repeated_template_notes: listAnnotationLabels(thinFloorRepeatedTemplateNotes),
    duplicate_thin_floor_notes: duplicateThinFloorNotes,
    duplicate_annotation_notes_within_unit: duplicateNoteGroups,
    duplicate_generated_glossary_terms: duplicateGeneratedGlossaryTerms,
    duplicate_generated_reference_notes: duplicateGeneratedReferenceNotes,
    generated_glossary_generic_definitions: listGlossaryLabels(generatedGlossaryGenericDefinitions),
    generated_reference_template_notes: listReferenceLabels(generatedReferenceTemplateNotes),
    generated_glossary_weak_definitions: listGlossaryLabels(generatedGlossaryWeakDefinitions),
    duplicate_deep_glossary_terms: duplicateDeepGlossaryTerms,
    duplicate_deep_glossary_definitions: duplicateDeepGlossaryDefinitions,
    deep_reference_template_notes: listReferenceLabels(deepReferenceTemplateNotes),
    deep_glossary_awkward_terms: listGlossaryLabels(deepGlossaryAwkwardTerms),
    wide_reference_template_notes: listReferenceLabels(wideReferenceTemplateNotes),
    wide_glossary_template_definitions: listGlossaryLabels(wideGlossaryTemplateDefinitions),
    generated_glossary_internal_labels: listGlossaryLabels(generatedGlossaryInternalLabels),
    duplicate_glossary_terms_by_target: duplicateGlossaryTermsByTarget,
    duplicate_reference_titles_by_target: duplicateReferenceTitlesByTarget,
    generated_support_reference_duplicate_notes: generatedSupportReferenceDuplicateNotes,
    generated_support_glossary_duplicate_definitions: generatedSupportGlossaryDuplicateDefinitions
  }
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Content readiness audit");
  console.log(`- Reading units: ${report.counts.reading_units}`);
  console.log(`- Summary seeds: ${report.counts.summary_seeds}`);
  console.log(`- Glossary entries: ${report.counts.glossary_entries}`);
  console.log(`- Reference cards: ${report.counts.reference_cards}`);
  console.log(`- Annotations: ${report.counts.annotations}`);
  console.log(`- Public Study annotations: ${report.counts.public_study_annotations}`);
  console.log(`  - teaching external knowledge: ${report.counts.public_study_external_knowledge_notes}`);
  console.log(`  - source-text-observation only: ${report.counts.public_study_source_text_only_notes}`);
  console.log(`  - failing external-source rule: ${report.counts.public_study_notes_failing_external_source_rule}`);
  console.log(`  - claim-type mix: ${JSON.stringify(report.counts.public_study_claim_type_distribution)}`);
  console.log(`- Reader-surface draft annotations: ${report.counts.reader_surface_draft_annotations}`);
  console.log(`- Public glossary entries: ${report.counts.public_glossary_entries}`);
  console.log(`- Public reference cards: ${report.counts.public_reference_cards}`);
  console.log(`- Public glossary review candidates: ${report.counts.public_glossary_review_candidates}`);
  console.log(`- Public glossary rewrite candidates: ${report.counts.public_glossary_rewrite_candidates}`);
  console.log(`- Public glossary units without public entry: ${report.counts.public_glossary_units_without_public_entry}`);
  console.log(`- Public reference review candidates: ${report.counts.public_reference_review_candidates}`);
  console.log(`- Public reference rewrite candidates: ${report.counts.public_reference_rewrite_candidates}`);
  console.log(`- Public reference units without public card: ${report.counts.public_reference_units_without_public_card}`);
  console.log(`- Public payload annotations: ${report.counts.public_payload_annotations}`);
  console.log(`- Public payload annotation index annotations: ${report.counts.public_payload_annotation_index_annotations}`);
  console.log(`- Public payload glossary entries: ${report.counts.public_payload_glossary_entries}`);
  console.log(`- Public payload reference cards: ${report.counts.public_payload_reference_cards}`);
  console.log(`- Public payload teacher packets: ${report.counts.public_payload_teacher_packets}`);
  console.log(`- Source records: ${report.counts.source_records}`);
  console.log(`- Public source records: ${report.counts.public_source_records}`);
  console.log(`- Public source usages: ${report.counts.public_source_usages}`);
  console.log(`- Public source records ready: ${report.counts.public_source_records_ready}`);
  console.log(`- Public source records provisional: ${report.counts.public_source_records_provisional}`);
  console.log(`- Public source records blocked: ${report.counts.public_source_records_blocked}`);
  console.log(`- Teacher packets: ${report.counts.teacher_packets}`);
  console.log(`- Search documents: ${report.counts.search_documents}`);
  console.log(`- Teacher review units: ${report.counts.teacher_review_units}`);
  console.log(`- Review queue items: ${report.counts.review_queue_items}`);
  console.log(`- Review queues: ${report.counts.review_queue_count}`);
  console.log(`- Public annotation review candidates: ${report.counts.public_annotation_review_candidates}`);
  console.log(`- Public annotation source-support candidates: ${report.counts.public_annotation_source_support_candidates}`);
  console.log(`- Public annotation tone/source candidates: ${report.counts.public_annotation_tone_source_candidates}`);
  console.log(`- Public annotation rewrite candidates: ${report.counts.public_annotation_rewrite_candidates}`);
  console.log(`- Public annotation retired internal: ${report.counts.public_annotation_retired_internal}`);
  console.log(`- Public annotation teacher-only internal: ${report.counts.public_annotation_teacher_only_internal}`);
  console.log(`- Public annotation likely internal/retire: ${report.counts.public_annotation_likely_internal_or_retire}`);
  console.log(`- Classroom units without public Study: ${report.counts.classroom_units_without_public_study}`);
  console.log(`- Classroom recovery units with review candidates: ${report.counts.classroom_recovery_units_with_review_candidates}`);
  console.log(`- Classroom recovery units with rewrite candidates: ${report.counts.classroom_recovery_units_with_rewrite_candidates}`);
  console.log(`- Classroom recovery units needing fresh annotation: ${report.counts.classroom_recovery_units_needing_fresh_annotation}`);
  console.log(`- Whole-book units without public Study: ${report.counts.whole_book_units_without_public_study}`);
  console.log(`- Whole-book recovery units with review candidates: ${report.counts.whole_book_recovery_units_with_review_candidates}`);
  console.log(`- Whole-book recovery units with rewrite candidates: ${report.counts.whole_book_recovery_units_with_rewrite_candidates}`);
  console.log(`- Whole-book recovery units needing fresh annotation: ${report.counts.whole_book_recovery_units_needing_fresh_annotation}`);
  console.log(`- Difficult-material categories: ${report.counts.difficult_material_categories}`);
  console.log(`- Indexed entities covered: ${report.counts.indexed_entities_covered}`);
  console.log(`- Indexed trails covered: ${report.counts.indexed_trails_covered}`);
  console.log(`- Indexed sources covered: ${report.counts.indexed_sources_covered}`);
  console.log(`- Source usage sources covered: ${report.counts.source_usage_sources_covered}`);
  console.log(`- Taxonomy trails: ${report.counts.taxonomy_trails}`);
  console.log(`- Taxonomy entities: ${report.counts.taxonomy_entities}`);
  console.log(`- Geography places: ${report.counts.geography_places}`);
  console.log(`- Map waypoints: ${report.counts.map_waypoints}`);
  console.log(`- Annotation statuses: ${JSON.stringify(report.status_counts.annotations)}`);
  console.log(`- Glossary statuses: ${JSON.stringify(report.status_counts.glossary)}`);
  console.log(`- Reference statuses: ${JSON.stringify(report.status_counts.references)}`);
  console.log(`- Source statuses: ${JSON.stringify(report.status_counts.sources)}`);
  console.log(`- Teacher packet statuses: ${JSON.stringify(report.status_counts.teacher_packets)}`);
  console.log(`- Unit readiness: ${JSON.stringify(report.status_counts.unit_readiness)}`);

  for (const [gapName, gapItems] of Object.entries(report.gaps)) {
    const sample = gapItems.slice(0, 10);
    console.log(`- ${gapName}: ${gapItems.length}`);
    for (const item of sample) console.log(`  - ${item}`);
    if (gapItems.length > sample.length) console.log(`  - ...${gapItems.length - sample.length} more`);
  }

  console.log("Use `node scripts/validate/audit-content-readiness.mjs --json` for the full report.");
}
