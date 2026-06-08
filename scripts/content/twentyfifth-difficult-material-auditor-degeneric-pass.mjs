import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";

const repeatedNotes = {
  racist: "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  mental: "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  colonial: "The passage uses racialized and colonial language. Name the prejudice directly and keep students from treating the wording as neutral.",
  religious: "The text frames non-Christian practice as sinful. Note the prejudice plainly and do not present it as neutral observation."
};

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));

function shortAnchor(anchor) {
  const compact = anchor.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 69)}...` : compact;
}

function titleFor(unitId) {
  return unitsById.get(unitId)?.title ?? unitId;
}

function replacement(annotation, kind) {
  const anchor = shortAnchor(annotation.anchor);
  const title = titleFor(annotation.unit_id);
  if (kind === "racist") {
    return `The wording "${anchor}" in ${title} uses racist nineteenth-century language. Name it plainly and do not soften it as neutral period detail.`;
  }
  if (kind === "mental") {
    return `The wording "${anchor}" in ${title} uses stigmatizing mental-health language. Treat it as historical vocabulary, not a clinical diagnosis.`;
  }
  if (kind === "colonial") {
    return `The wording "${anchor}" in ${title} uses racialized or colonial language. Name the prejudice directly and keep students from treating it as neutral.`;
  }
  return `The wording "${anchor}" in ${title} frames non-Christian practice as sinful. Name the prejudice plainly rather than presenting it as neutral observation.`;
}

let updated = 0;
const counts = Object.fromEntries(Object.keys(repeatedNotes).map((key) => [key, 0]));

for (const annotation of data.annotations) {
  if (annotation.kind !== "difficult-material") continue;
  const entry = Object.entries(repeatedNotes).find(([, note]) => annotation.note === note);
  if (!entry) continue;
  const [kind] = entry;
  annotation.note = replacement(annotation, kind);
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:difficult-material-degeneric-polished"])].sort();
  counts[kind] += 1;
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, counts }, null, 2));
