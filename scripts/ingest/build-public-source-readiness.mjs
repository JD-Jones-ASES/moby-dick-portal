import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const sourcesPath = path.join(repoRoot, "data", "sources", "moby-dick.source-records.json");
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");
const glossaryPath = path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json");
const referenceCardsPath = path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json");
const outDir = path.join(repoRoot, "data", "indexes");
const outPath = path.join(outDir, "public-source-readiness.json");

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

async function writeJson(file, data) {
  await writeFile(file, `${escapeNonAscii(JSON.stringify(data, null, 2))}\n`);
}

function cleanSourceId(sourceId) {
  return String(sourceId ?? "").replace(/^source:/, "");
}

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

function sourceIdsForAnnotation(annotation) {
  return [
    ...(annotation.citations ?? []),
    ...(annotation.evidence ?? []).flatMap((evidence) => evidence.citations ?? []),
    ...targetsFor(annotation, "source")
  ].map(cleanSourceId);
}

function sourceIdsForItem(item) {
  return (item.citations ?? []).map(cleanSourceId);
}

function isPublicStudyAnnotation(annotation) {
  return annotation.display?.surfaces?.includes("reader") &&
    annotation.status?.content_status === "student-ready" &&
    annotation.status?.citation_status === "verified";
}

function isPublicGlossaryEntry(entry) {
  return entry.status?.definition_status === "student-ready" &&
    entry.status?.citation_status === "verified";
}

function isPublicReferenceCard(card) {
  return card.status?.content_status === "student-ready" &&
    card.status?.citation_status === "verified";
}

function readinessState(source) {
  const status = source?.citation_status ?? "missing";
  if (String(status).startsWith("verified")) return "public-ready-source";
  if (status === "needs-review" || status === "missing") return "blocked-source";
  return "bibliographic-review-needed";
}

function addUsage(bucket, usage) {
  bucket.usage_count += 1;
  bucket.usages.push(usage);
  if (usage.unit_id && !bucket.units.includes(usage.unit_id)) bucket.units.push(usage.unit_id);
}

const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const referenceCards = JSON.parse(await readFile(referenceCardsPath, "utf8"));

const sourcesById = new Map(sources.records.map((source) => [source.id, source]));
const buckets = new Map();

function ensureBucket(sourceId) {
  const source = sourcesById.get(sourceId);
  if (!buckets.has(sourceId)) {
    buckets.set(sourceId, {
      source_id: sourceId,
      title: source?.title ?? null,
      kind: source?.kind ?? null,
      citation_status: source?.citation_status ?? "missing",
      readiness_state: readinessState(source),
      usage_count: 0,
      units: [],
      usages: []
    });
  }
  return buckets.get(sourceId);
}

for (const annotation of annotations.annotations.filter(isPublicStudyAnnotation)) {
  for (const sourceId of new Set(sourceIdsForAnnotation(annotation))) {
    addUsage(ensureBucket(sourceId), {
      type: "annotation",
      id: annotation.id,
      unit_id: annotation.unit_id,
      label: annotation.anchor
    });
  }
}

for (const entry of glossary.entries.filter(isPublicGlossaryEntry)) {
  for (const sourceId of new Set(sourceIdsForItem(entry))) {
    for (const unitId of entry.targets?.length ? entry.targets : [null]) {
      addUsage(ensureBucket(sourceId), {
        type: "glossary",
        id: entry.id,
        unit_id: unitId,
        label: entry.term
      });
    }
  }
}

for (const card of referenceCards.cards.filter(isPublicReferenceCard)) {
  for (const sourceId of new Set(sourceIdsForItem(card))) {
    for (const unitId of card.targets?.length ? card.targets : [null]) {
      addUsage(ensureBucket(sourceId), {
        type: "reference",
        id: card.id,
        unit_id: unitId,
        label: card.title
      });
    }
  }
}

const sourceEntries = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
for (const [, source] of sourceEntries) {
  source.units.sort();
  source.usages.sort((a, b) =>
    a.type.localeCompare(b.type) ||
    String(a.unit_id ?? "").localeCompare(String(b.unit_id ?? "")) ||
    a.id.localeCompare(b.id)
  );
}

const sourcesObject = Object.fromEntries(sourceEntries);
const readinessCounts = {};
const statusCounts = {};
for (const source of Object.values(sourcesObject)) {
  readinessCounts[source.readiness_state] = (readinessCounts[source.readiness_state] ?? 0) + 1;
  statusCounts[source.citation_status] = (statusCounts[source.citation_status] ?? 0) + 1;
}

await mkdir(outDir, { recursive: true });
await writeJson(outPath, {
  generated_from: [
    "data/sources/moby-dick.source-records.json",
    "data/annotations/moby-dick.annotations.json",
    "data/glossary/moby-dick.glossary.json",
    "data/references/moby-dick.reference-cards.json"
  ],
  public_source_count: Object.keys(sourcesObject).length,
  public_usage_count: Object.values(sourcesObject).reduce((total, source) => total + source.usage_count, 0),
  readiness_counts: Object.fromEntries(Object.entries(readinessCounts).sort(([a], [b]) => a.localeCompare(b))),
  citation_status_counts: Object.fromEntries(Object.entries(statusCounts).sort(([a], [b]) => a.localeCompare(b))),
  sources: sourcesObject
});

console.log(`Built public source-readiness index for ${Object.keys(sourcesObject).length} public sources.`);
