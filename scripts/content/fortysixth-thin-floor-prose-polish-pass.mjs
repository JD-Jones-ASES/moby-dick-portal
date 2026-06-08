import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));

const repeatedThinFloorPatterns = [
  /The phrase keeps the ship's work concrete/i,
  /The selected detail turns whale knowledge into something students can test/i,
  /The wording stages speech and gesture as part of the chapter's meaning/i,
  /The language of rule and possession shows how the novel turns whaling practice/i,
  /Biblical language raises the stakes of the scene/i
];

function firstSentence(value, fallback) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const match = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : clean;
}

function compactQuote(value) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= 72) return clean;
  return `${clean.slice(0, 69).replace(/\s+\S*$/, "")}...`;
}

function trailId(annotation) {
  return (annotation.relationships ?? [])
    .find((relationship) => relationship.type === "belongs-to-trail")
    ?.target
    ?.replace(/^trail:/, "");
}

function replacementNote(annotation) {
  const unit = unitsById.get(annotation.unit_id);
  const title = unit?.title ?? annotation.unit_id;
  const quote = compactQuote(annotation.anchor ?? annotation.selector?.exact ?? "");
  const oneBreath = firstSentence(unit?.summaries?.one_breath, `${title} needs a local reading handle.`);
  const why = firstSentence(unit?.summaries?.why_it_matters, oneBreath);
  const trail = trailId(annotation);

  if (trail === "whaling-labor") {
    return `In ${title}, "${quote}" keeps practical work visible inside the chapter's larger pressure. ${oneBreath} ${why}`;
  }
  if (trail === "cetology-classification") {
    return `In ${title}, "${quote}" gives students a concrete detail to test against Ishmael's habits of observing and classifying. ${oneBreath} ${why}`;
  }
  if (trail === "voice-and-performance") {
    return `In ${title}, "${quote}" shows how speech, gesture, or scene timing carries meaning alongside plot. ${oneBreath} ${why}`;
  }
  if (trail === "scripture-and-sermons") {
    return `In ${title}, "${quote}" makes inherited religious language part of the chapter's local pressure. ${oneBreath} ${why}`;
  }
  if (trail === "law-property-politics") {
    return `In ${title}, "${quote}" turns rule, possession, or rank into something students can inspect in the wording. ${oneBreath} ${why}`;
  }
  return `In ${title}, "${quote}" gives students a precise passage to test against the chapter's movement. ${oneBreath} ${why}`;
}

let polished = 0;

for (const annotation of annotations.annotations) {
  if (!annotation.id.startsWith("floor-pass-")) continue;
  if (!repeatedThinFloorPatterns.some((pattern) => pattern.test(annotation.note ?? ""))) continue;
  annotation.note = replacementNote(annotation);
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:thin-floor-prose-polished"])];
  polished += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ polished }, null, 2));
