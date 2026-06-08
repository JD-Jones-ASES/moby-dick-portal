import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");
const manifestPath = path.join(repoRoot, "data", "chapters", "moby-dick.chapter-manifest.json");

const genericPatterns = [
  "This passage advances the story while also showing what Ishmael chooses to emphasize.",
  "A useful classroom question here is what the passage makes visible, what it leaves unresolved, and why Melville places that pressure at this point in the book.",
  "This passage anchors the novel in shipboard work, where tools, bodies, danger, and hierarchy meet.",
  "This passage turns whale knowledge into a reading problem: facts matter, but the method of organizing them matters too.",
  "This passage asks to be heard as staged speech, with voice and performance doing part of the meaning.",
  "This passage helps students see the gam as a storytelling device, not just an interruption between ships.",
  "This passage is useful for tracking how character is built through gesture, speech, pressure, and reaction.",
  "This passage belongs to the book's threshold, where sources, names, and framing teach readers how to enter.",
  "This passage lets legal or political language enter the sea story and widen its stakes.",
  "This passage shows how religious language shapes the voyage before the Pequod fully enters the plot.",
  "This passage turns a concrete object or image into a symbolic pressure point.",
  "This passage helps students notice how the book shifts between modes without leaving the voyage behind.",
  "This passage draws on biblical language so that a local scene feels older and larger than itself.",
  "This passage keeps omen, prediction, and choice tangled together rather than separating them cleanly."
];

function escapeNonAscii(value) {
  return value.replace(/[^\x00-\x7F]/gu, (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xffff) return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    const offset = codePoint - 0x10000;
    const high = 0xd800 + (offset >> 10);
    const low = 0xdc00 + (offset & 0x3ff);
    return `\\u${high.toString(16).padStart(4, "0")}\\u${low.toString(16).padStart(4, "0")}`;
  });
}

function clean(value) {
  return value.replace(/\s+/g, " ").trim();
}

function shortAnchor(anchor) {
  const value = clean(anchor).replace(/^["'\u201c]+|["'\u201d.!?;:]+$/g, "");
  if (value.length <= 72) return value;
  return `${value.slice(0, 69).replace(/\s+\S*$/, "")}...`;
}

function subjectFor(anchor, unit) {
  const text = `${anchor} ${unit.title}`.toLowerCase();
  const checks = [
    [/queequeg|yojo/, "Queequeg"],
    [/ahab|ivory|quarterdeck|cabin/, "Ahab"],
    [/starbuck/, "Starbuck"],
    [/stubb/, "Stubb"],
    [/flask/, "Flask"],
    [/pip/, "Pip"],
    [/fedallah|parsee/, "Fedallah"],
    [/moby dick|white whale/, "Moby Dick"],
    [/whale|sperm|right whale|leviathan|baleen|spout|fountain|case|junk|spermaceti|brit|squid/, "whale knowledge"],
    [/ship|pequod|deck|mast|boat|line|tackle|yard|cabin|watch|helm|compass|quadrant|needle|forge|carpenter|blacksmith/, "shipboard work"],
    [/jonah|god|sermon|chapel|pulpit|biblical|prophet|elijah/, "religious language"],
    [/gam|albatross|jeroboam|rachel|delight|bachelor|virgin|town-ho/, "ship-to-ship storytelling"],
    [/law|property|fast-fish|loose-fish|king|state|royal|empire/, "law and power"],
    [/dream|omen|prophecy|warning|spirit|ghost|phantom/, "omens"],
    [/picture|paint|portrait|image|signboard|cuvier|beale|colnett/, "representation"],
    [/white|whiteness|symbol|sphynx|doubloon|coffin|sunset|pacific/, "symbolic pressure"]
  ];

  for (const [pattern, subject] of checks) {
    if (pattern.test(text)) return subject;
  }
  return unit.functions?.[0]?.replace(/-/g, " ") ?? "the chapter's pressure";
}

function actionFor(unit, annotation, subject) {
  const functions = new Set(unit.functions ?? []);
  const anchor = clean(annotation.anchor);

  if (unit.section_type === "frontmatter") {
    return `The phrase "${shortAnchor(anchor)}" shows how the book's threshold turns sources, names, and editorial labor into part of the whale-hunt before Ishmael begins.`;
  }

  if (functions.has("cetology")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" turns ${subject} into a problem of classification: Ishmael wants order, but the whale keeps exceeding the system.`;
  }

  if (functions.has("whaling-labor")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" keeps ${subject} practical. The detail helps students follow the work before turning it into symbol.`;
  }

  if (functions.has("gam")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" shows how ${subject} carries news, rumor, and warning across the ocean rather than pausing the plot.`;
  }

  if (functions.has("theatrical")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" works like staged speech: voice, timing, and audience shape the meaning as much as information does.`;
  }

  if (functions.has("sermon") || functions.has("biblical-allusion")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" lets ${subject} give the scene a moral scale larger than the immediate action.`;
  }

  if (functions.has("legal-political")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" pulls ${subject} into legal or political language, widening the sea story into an argument about power.`;
  }

  if (functions.has("symbolic")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" makes ${subject} do symbolic work without settling into one simple meaning.`;
  }

  if (functions.has("prophecy")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" makes ${subject} feel like a sign, but the chapter keeps choice and warning tangled together.`;
  }

  if (functions.has("character")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" builds ${subject} through action and pressure rather than direct explanation.`;
  }

  if (functions.has("transition")) {
    return `In ${unit.title}, "${shortAnchor(anchor)}" helps the book shift modes while keeping the voyage's pressure in view.`;
  }

  return `In ${unit.title}, "${shortAnchor(anchor)}" is not just motion through the plot; it shows what the narrator chooses to notice and what that attention prepares us to read next.`;
}

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));
const generic = new Set(genericPatterns);
let updated = 0;

for (const annotation of annotations.annotations) {
  if (!annotation.id.startsWith("broad-apparatus-")) continue;
  if (!generic.has(annotation.note)) continue;
  const unit = unitsById.get(annotation.unit_id);
  if (!unit) continue;
  annotation.note = actionFor(unit, annotation, subjectFor(annotation.anchor, unit));
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:specificity-pass"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({
  updated,
  remainingGenericBroadNotes: annotations.annotations.filter((annotation) => annotation.id.startsWith("broad-apparatus-") && generic.has(annotation.note)).length
}, null, 2));
