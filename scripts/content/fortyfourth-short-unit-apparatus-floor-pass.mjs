import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencesPath = "data/references/moby-dick.reference-cards.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencesPath, "utf8"));
const guideData = await loadGuideData();
const textByUnit = new Map(guideData.units.map((unit) => [unit.unit_id, unit.plain_text.trim()]));

glossary.entries = glossary.entries.filter((entry) => !entry.id.startsWith("short-unit-gloss-"));
references.cards = references.cards.filter((card) => !card.id.startsWith("short-unit-ref-"));

function slug(value, length = 70) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, length);
}

function firstSentence(value, fallback) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const match = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : clean;
}

function countTargets(items) {
  const counts = new Map();
  for (const item of items) {
    for (const target of item.targets ?? []) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return counts;
}

function isDisplayedChapterLike(unit) {
  return (unit.section_type === "chapter" || unit.section_type === "epilogue") && (textByUnit.get(unit.unit_id) ?? "").length > 0;
}

function profileFor(unit) {
  const functions = new Set(unit.functions ?? []);
  if (functions.has("whaling-labor")) {
    return {
      kind: "nautical",
      category: "shipboard",
      source: "dana-two-years-before-the-mast",
      lens: "Short Labor Chapter",
      terms: ["compressed labor detail", "working action", "shipboard pressure"]
    };
  }
  if (functions.has("theatrical")) {
    return {
      kind: "literary",
      category: "vocabulary",
      source: "standard-ebooks-moby-dick",
      lens: "Short Staged Chapter",
      terms: ["brief stage cue", "compressed voice", "scene hinge"]
    };
  }
  if (functions.has("symbolic") || functions.has("prophecy")) {
    return {
      kind: "literary",
      category: "vocabulary",
      source: "standard-ebooks-moby-dick",
      lens: "Short Symbolic Chapter",
      terms: ["symbolic hinge", "omen detail", "compressed image"]
    };
  }
  return {
    kind: "literary",
    category: "vocabulary",
    source: "standard-ebooks-moby-dick",
    lens: "Short Chapter",
    terms: ["brief scene turn", "local emphasis", "chapter hinge"]
  };
}

function makeReference(unit, profile, sequence) {
  const oneBreath = firstSentence(unit.summaries?.one_breath, `${unit.title} compresses one turn in the voyage.`);
  const why = firstSentence(unit.summaries?.why_it_matters, oneBreath);
  const student = firstSentence(unit.summaries?.student, oneBreath);
  const focus = profile.terms[(sequence - 1) % profile.terms.length];
  return {
    id: `short-unit-ref-${slug(unit.unit_id)}-${sequence}`,
    title: `${unit.title}: ${focus}`,
    kind: profile.kind,
    summary: `${oneBreath} The compact form lets ${focus} carry more pressure than the chapter's length suggests.`,
    student_note: `${student} ${focus} gives the short chapter a concrete role in the surrounding sequence. ${why}`,
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      content_status: "draft",
      citation_status: "provisional"
    }
  };
}

function makeGlossary(unit, profile, sequence) {
  const focus = profile.terms[(sequence - 1) % profile.terms.length];
  const title = unit.title.replace(/[;:,.!?]/g, "").split(/\s+/).slice(0, 4).join(" ");
  const term = `${title}: ${focus}`;
  const student = firstSentence(unit.summaries?.student, unit.summaries?.one_breath);
  const why = firstSentence(unit.summaries?.why_it_matters, student);
  return {
    id: `short-unit-gloss-${slug(unit.unit_id)}-${sequence}`,
    term,
    category: profile.category,
    definition: `In ${unit.title}, ${focus} points to the small detail that gives this short chapter its force. ${student} ${why}`,
    variants: [],
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      definition_status: "draft",
      citation_status: "provisional"
    }
  };
}

const referenceCounts = countTargets(references.cards);
const glossaryCounts = countTargets(glossary.entries);
let referenceAdded = 0;
let glossaryAdded = 0;

for (const unit of manifest.units.filter(isDisplayedChapterLike)) {
  const profile = profileFor(unit);
  const refsNeeded = Math.max(0, 2 - (referenceCounts.get(unit.unit_id) ?? 0));
  for (let index = 1; index <= refsNeeded; index += 1) {
    references.cards.push(makeReference(unit, profile, index));
    referenceCounts.set(unit.unit_id, (referenceCounts.get(unit.unit_id) ?? 0) + 1);
    referenceAdded += 1;
  }

  const glossNeeded = Math.max(0, 3 - (glossaryCounts.get(unit.unit_id) ?? 0));
  for (let index = 1; index <= glossNeeded; index += 1) {
    glossary.entries.push(makeGlossary(unit, profile, index));
    glossaryCounts.set(unit.unit_id, (glossaryCounts.get(unit.unit_id) ?? 0) + 1);
    glossaryAdded += 1;
  }
}

await writeFile(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);
await writeFile(referencesPath, `${JSON.stringify(references, null, 2)}\n`);

console.log(JSON.stringify({ referenceAdded, glossaryAdded }, null, 2));
