import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "data", "chapters", "moby-dick.chapter-manifest.json");
const pathsDir = path.join(repoRoot, "data", "paths");
const glossaryPath = path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json");
const referenceCardsPath = path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json");
const voyageMapPath = path.join(repoRoot, "data", "maps", "moby-dick.voyage-map.json");
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");
const annotationLayersPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotation-layers.json");
const annotationsByUnitPath = path.join(repoRoot, "data", "indexes", "annotations-by-unit.json");
const pathIds = ["narrative_core", "classroom_standard", "full_text"];

function decodeEntities(value) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name] ?? `&${name};`);
}

function stripTags(value) {
  return decodeEntities(
    value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|blockquote|section|header|hgroup|h1|h2|h3|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function textForUnit(unit) {
  const source = await readFile(path.join(repoRoot, unit.source_path), "utf8");
  const bodyMatch = source.match(/<section[\s\S]*?>([\s\S]*?)<\/section>/);
  const body = bodyMatch ? bodyMatch[1] : source;
  const withoutSourceHeading = body
    .replace(/<hgroup[\s\S]*?<\/hgroup>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ");
  return stripTags(withoutSourceHeading);
}

async function readOptionalJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function buildAnnotationIndex(units, annotations) {
  const unitPacks = {};
  for (const unit of units) {
    const unitAnnotations = annotations
      .filter((annotation) => annotation.unit_id === unit.unit_id)
      .sort((a, b) => (a.selector?.position?.start ?? 0) - (b.selector?.position?.start ?? 0) || a.id.localeCompare(b.id));
    unitPacks[unit.unit_id] = {
      unit_id: unit.unit_id,
      sequence: unit.sequence,
      title: unit.title,
      annotation_count: unitAnnotations.length,
      inline_annotation_count: unitAnnotations.filter((annotation) => annotation.display?.inline).length,
      annotations: unitAnnotations
    };
  }

  return {
    generated_from: "runtime-fallback",
    annotation_count: annotations.length,
    unit_count: units.length,
    units: unitPacks
  };
}

function isPublicGlossaryEntry(entry) {
  return entry.status?.definition_status === "student-ready" && entry.status?.citation_status === "verified";
}

function isPublicReferenceCard(card) {
  return card.status?.content_status === "student-ready" && card.status?.citation_status === "verified";
}

function isPublicStudyAnnotation(annotation) {
  return (
    annotation.display?.surfaces?.includes("reader") &&
    annotation.status?.content_status === "student-ready" &&
    annotation.status?.citation_status === "verified"
  );
}

function filterAnnotationIndexForPublic(annotationIndex) {
  const units = {};
  let annotationCount = 0;

  for (const [unitId, pack] of Object.entries(annotationIndex.units ?? {})) {
    const annotations = (pack.annotations ?? []).filter(isPublicStudyAnnotation);
    annotationCount += annotations.length;
    units[unitId] = {
      ...pack,
      annotation_count: annotations.length,
      inline_annotation_count: annotations.filter((annotation) => annotation.display?.inline !== false).length,
      annotations
    };
  }

  return {
    ...annotationIndex,
    annotation_count: annotationCount,
    units
  };
}

export async function loadGuideData() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
  const referenceCards = JSON.parse(await readFile(referenceCardsPath, "utf8"));
  const voyageMap = JSON.parse(await readFile(voyageMapPath, "utf8"));
  const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
  const annotationLayers = JSON.parse(await readFile(annotationLayersPath, "utf8"));
  const generatedAnnotationIndex = await readOptionalJson(annotationsByUnitPath);
  const paths = [];

  for (const pathId of pathIds) {
    paths.push(JSON.parse(await readFile(path.join(pathsDir, `${pathId}.json`), "utf8")));
  }

  const units = await Promise.all(
    manifest.units.map(async (unit) => ({
      ...unit,
      plain_text: await textForUnit(unit)
    }))
  );

  const publicAnnotations = annotations.annotations.filter(isPublicStudyAnnotation);
  const annotationIndex = filterAnnotationIndexForPublic(generatedAnnotationIndex ?? buildAnnotationIndex(units, publicAnnotations));

  return {
    units,
    paths,
    glossary: glossary.entries.filter(isPublicGlossaryEntry),
    referenceCards: referenceCards.cards.filter(isPublicReferenceCard),
    annotations: publicAnnotations,
    annotationIndex,
    annotationLayers,
    teacherPackets: [],
    voyageMap
  };
}
