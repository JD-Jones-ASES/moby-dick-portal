import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";

const repeatedNotes = {
  racial: "This passage uses nineteenth-century racial or colonial language. The guide should name the term's harm and context without treating the wording as neutral.",
  mental: "This passage uses older language of madness or insanity. The note should help students distinguish the novel's vocabulary from current clinical language.",
  violence: "This passage involves violence, blood, butchery, sharks, or animal suffering. The guide should keep the material facts visible without sensationalizing them.",
  slavery: "This passage invokes slavery or coerced labor language. It should be handled as historical and moral context, not as casual metaphor.",
  religious: "This passage uses Christian judgmental language for non-Christian practice. Students need context that identifies the prejudice without flattening the character or scene."
};

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));

function shortAnchor(anchor) {
  const compact = anchor.replace(/\s+/g, " ").trim();
  return compact.length > 76 ? `${compact.slice(0, 73)}...` : compact;
}

function unitLabel(unitId) {
  const unit = unitsById.get(unitId);
  return unit?.title ?? unitId;
}

function replacement(annotation, kind) {
  const anchor = shortAnchor(annotation.anchor);
  const title = unitLabel(annotation.unit_id);
  if (kind === "racial") {
    return `The wording "${anchor}" uses racial or colonial labeling inside ${title}. Name the period language directly and keep students from treating it as neutral description.`;
  }
  if (kind === "mental") {
    return `The wording "${anchor}" uses older mental-health language inside ${title}. Students should read the phrase as part of the novel's vocabulary, not as current clinical language.`;
  }
  if (kind === "violence") {
    return `The wording "${anchor}" brings violence, bodily risk, or animal suffering into ${title}. Keep the material facts visible without turning the scene into spectacle.`;
  }
  if (kind === "slavery") {
    return `The wording "${anchor}" borrows slavery or coerced-labor language inside ${title}. Treat it as historical and moral context, not as a casual metaphor.`;
  }
  return `The wording "${anchor}" uses Christian judgment language for non-Christian practice inside ${title}. Identify the prejudice without flattening the character or scene.`;
}

let updated = 0;
const counts = Object.fromEntries(Object.keys(repeatedNotes).map((key) => [key, 0]));

for (const annotation of data.annotations) {
  if (annotation.kind !== "difficult-material") continue;
  const entry = Object.entries(repeatedNotes).find(([, note]) => annotation.note === note);
  if (!entry) continue;
  const [kind] = entry;
  annotation.note = replacement(annotation, kind);
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:difficult-material-generic-polished"])].sort();
  counts[kind] += 1;
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, counts }, null, 2));
