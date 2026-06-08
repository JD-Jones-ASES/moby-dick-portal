import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const summariesPath = "data/chapters/moby-dick.summary-seeds.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const summaries = JSON.parse(await readFile(summariesPath, "utf8"));

const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));
const summariesByUnit = new Map(summaries.summaries.map((summary) => [summary.unit_id, summary]));

const targetProvenanceTags = new Set([
  "provenance:ten-note-floor-pass",
  "provenance:annotation-variety-balance-pass",
  "provenance:twelve-note-floor-pass"
]);

const templatePatterns = [
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

function hasTargetProvenance(annotation) {
  return (annotation.tags ?? []).some((tag) => targetProvenanceTags.has(tag));
}

function hasTemplateNote(annotation) {
  return templatePatterns.some((pattern) => pattern.test(annotation.note ?? ""));
}

function hash(value) {
  let total = 0;
  for (const character of value) total = (total * 31 + character.charCodeAt(0)) % 9973;
  return total;
}

function sentence(value, fallback) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const match = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : clean;
}

function compactQuote(value) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= 72) return clean;
  const words = clean.split(" ");
  const selected = [];
  for (const word of words) {
    const next = [...selected, word].join(" ");
    if (next.length > 69) break;
    selected.push(word);
  }
  return `${selected.join(" ")}...`;
}

function methodLine(kind, unit) {
  const functions = new Set(unit?.functions ?? []);
  if (kind === "context") {
    if (functions.has("cetology")) return "The note keeps the chapter's whale knowledge tied to a sentence students can point to.";
    if (functions.has("whaling-labor")) return "The note keeps tools, labor, and command pressure visible inside the reading path.";
    if (functions.has("biblical-allusion") || functions.has("sermon")) return "The note helps students hear inherited religious language without treating it as background decoration.";
    if (functions.has("legal-political")) return "The note gives the chapter's talk of ownership, law, or rank a concrete place to land.";
    return "The note connects local detail to the world of ships, books, belief, and work around the voyage.";
  }
  if (kind === "form") {
    if (functions.has("theatrical")) return "The note asks students to notice how staging and voice carry meaning alongside plot.";
    if (functions.has("sermon")) return "The note keeps attention on how sermon form shapes the chapter's force.";
    if (functions.has("gam")) return "The note treats conversation and scene design as part of the chapter's argument.";
    return "The note points to the way voice, comparison, and pacing shape what the chapter is doing.";
  }
  if (kind === "map") {
    return "The note keeps the idea attached to physical movement through ports, decks, weather, and open water.";
  }
  if (kind === "teacher-note") {
    return "The note gives teachers a specific passage to use when turning the chapter into discussion.";
  }
  if (kind === "difficult-material") {
    return "The note keeps the passage available for careful reading rather than smoothing over its difficulty.";
  }
  return "The note turns a compact phrase into a place where students can test motive, danger, belief, or consequence.";
}

function makeNote(annotation) {
  const unit = unitsById.get(annotation.unit_id);
  const summary = summariesByUnit.get(annotation.unit_id);
  const title = unit?.title ?? annotation.unit_id;
  const quote = compactQuote(annotation.anchor ?? annotation.selector?.exact ?? "");
  const oneBreath = sentence(summary?.one_breath, `${title} needs a local reading handle.`);
  const student = sentence(summary?.student, oneBreath);
  const why = sentence(summary?.why_it_matters, oneBreath);
  const method = methodLine(annotation.kind, unit);
  const variant = hash(annotation.id) % 5;

  if (variant === 0) {
    return `In ${title}, "${quote}" gives students a local handle on the chapter's work. ${oneBreath} ${method}`;
  }
  if (variant === 1) {
    return `"${quote}" is worth pausing over because it concentrates one of ${title}'s study problems. ${student} ${method}`;
  }
  if (variant === 2) {
    return `This note anchors ${title} in the phrase "${quote}". ${why} ${method}`;
  }
  if (variant === 3) {
    return `Use "${quote}" as a close-reading checkpoint in ${title}. ${oneBreath} ${method}`;
  }
  return `The phrase "${quote}" gives ${title} a passage-level study point. ${student} ${method}`;
}

let polished = 0;

for (const annotation of annotations.annotations) {
  if (!hasTargetProvenance(annotation) || !hasTemplateNote(annotation)) continue;
  annotation.note = makeNote(annotation);
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:generated-prose-polished"])];
  polished += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ polished }, null, 2));
