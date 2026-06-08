import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));

function normalizeSentence(text) {
  return text
    .replace(/\s*This added anchor gives the chapter another symbolic pressure point for Study mode\./g, "")
    .replace(/\s*The passage gives students a second study handle for the chapter's pressure on symbol, motive, or consequence\./g, "")
    .replace(/^Teacher review:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lowerFirst(text) {
  return text ? text[0].toLowerCase() + text.slice(1) : text;
}

function summaryFor(unit) {
  return unit?.summaries?.one_breath || unit?.summaries?.student || `${unit?.title ?? "This unit"} matters to the book's movement.`;
}

function functionLabel(unit) {
  const labels = (unit?.functions ?? []).slice(0, 2).map((item) => item.replace(/-/g, " "));
  return labels.length ? labels.join(" and ") : "source";
}

function teacherReplacement(annotation, unit) {
  const note = annotation.note;
  const summary = summaryFor(unit).replace(/\.$/, "");
  if (/use this chapter to connect plot movement/i.test(note)) {
    return `Use this unit as a plot hinge: ${lowerFirst(summary)}. Keep students focused on how the ${functionLabel(unit)} work changes what the reader expects next.`;
  }
  if (/track how the chapter changes what students know/i.test(note)) {
    return `${summary}. Ask students what new pressure the chapter adds to motive, intimacy, hierarchy, or moral choice.`;
  }
  if (/ask students what the chapter makes feel inevitable/i.test(note)) {
    return `${summary}. Ask which details make the outcome feel inevitable and which choices still remain open.`;
  }
  if (/foreground labor, tools, bodily risk/i.test(note)) {
    return `${summary}. Keep the practical work visible first: tools, bodies, risk, and shipboard economics are the ground under the adventure plot.`;
  }
  if (/help students separate the chapter's historical whale knowledge/i.test(note)) {
    return `${summary}. Help students separate whale facts from the chapter's experiment in ordering knowledge.`;
  }
  if (/treat staging, voice, and dramatic form/i.test(note)) {
    return `${summary}. Treat staging, voice, and dramatic form as evidence, because the scene's meaning depends on who speaks and who must listen.`;
  }
  if (/connect this ship encounter to the larger pattern/i.test(note)) {
    return `${summary}. Connect this meeting to the book's pattern of ships bringing warnings, news, and chances Ahab refuses to use.`;
  }
  if (/foreground labor, tools/i.test(note)) {
    return `${summary}. Start with the practical labor, then ask how the work changes the chapter's symbolic pressure.`;
  }
  return normalizeSentence(note);
}

let scaffoldTrimmed = 0;
let teacherPrefixTrimmed = 0;
let teacherGenericRewritten = 0;

for (const annotation of annotations.annotations) {
  const before = annotation.note;
  const unit = unitsById.get(annotation.unit_id);
  let next = normalizeSentence(before);

  if (annotation.kind === "teacher-note") {
    next = teacherReplacement({ ...annotation, note: next }, unit);
    if (next !== normalizeSentence(before)) teacherGenericRewritten += 1;
  }

  if (before.includes("This added anchor gives") || before.includes("second study handle")) scaffoldTrimmed += 1;
  if (/^Teacher review:/i.test(before)) teacherPrefixTrimmed += 1;

  if (next !== before) {
    annotation.note = next;
    annotation.tags = [...new Set([...(annotation.tags ?? []), "review:generated-scaffold-polished"])].sort();
  }
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);
console.log(JSON.stringify({ scaffoldTrimmed, teacherPrefixTrimmed, teacherGenericRewritten }, null, 2));
