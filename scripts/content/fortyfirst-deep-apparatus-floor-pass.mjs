import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencePath = "data/references/moby-dick.reference-cards.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencePath, "utf8"));
const guideData = await loadGuideData();
const textByUnit = new Map(guideData.units.map((unit) => [unit.unit_id, unit.plain_text.trim()]));

glossary.entries = glossary.entries.filter((entry) => !entry.id.startsWith("apparatus-deep-gloss-"));
references.cards = references.cards.filter((card) => !card.id.startsWith("apparatus-deep-ref-"));

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

function isSubstantialDisplayedUnit(unit) {
  return unit.word_count > 250 && (textByUnit.get(unit.unit_id) ?? "").length > 0;
}

function countTargets(items, getTargets) {
  const counts = new Map();
  for (const item of items) {
    for (const target of getTargets(item) ?? []) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return counts;
}

function profileFor(unit) {
  const functions = new Set(unit.functions ?? []);
  const title = unit.title;
  const lower = title.toLowerCase();

  if (functions.has("cetology") || /whale|sperm|right|tail|head|fountain|skeleton|fossil|ambergris|brit|squid/.test(lower)) {
    return {
      kind: "whaling",
      category: "whaling",
      source: "beale-sperm-whale-bhl",
      lens: "Whale knowledge",
      summary: `${title} gives students another way to track how Melville turns whale bodies, behavior, or classification into a problem of knowledge.`,
      student_note: `Use this card to ask what kind of whale knowledge ${title} is building, and where observation begins to turn into argument.`,
      terms: [
        ["whale knowledge", `In ${title}, practical whale facts become a way to ask how people know what they claim to know.`],
        ["classification pressure", `The chapter sorts whale material, but the sorting also reveals how unstable categories can be.`],
        ["observed detail", `A visible whale feature or behavior becomes evidence for a larger claim.`]
      ]
    };
  }

  if (functions.has("whaling-labor") || /line|lowering|cutting|crotch|dart|try|stowing|carpenter|blacksmith|forge|needle|quadrant|deck|ship/.test(lower)) {
    return {
      kind: "nautical",
      category: "shipboard",
      source: "dana-two-years-before-the-mast",
      lens: "Work under pressure",
      summary: `${title} makes the voyage legible through work: tools, command, fatigue, danger, or repair shape what the crew can do.`,
      student_note: `Use this card to connect ${title}'s practical details to the larger question of how shipboard labor supports and strains Ahab's hunt.`,
      terms: [
        ["shipboard routine", `Repeated work aboard ship; in ${title}, routine can carry danger, discipline, or moral pressure.`],
        ["working gear", `The equipment that turns whaling into coordinated labor rather than abstract adventure.`],
        ["crew risk", `The bodily danger shared by sailors when ordinary work meets the whale hunt.`]
      ]
    };
  }

  if (functions.has("theatrical") || /sunset|dusk|watch|forecastle|doubloon|quarterdeck|cabin/.test(lower)) {
    return {
      kind: "literary",
      category: "vocabulary",
      source: "perseus-shakespeare",
      lens: "Staged voice",
      summary: `${title} is useful for seeing how Melville borrows dramatic timing, speech, silence, or stage-like arrangement.`,
      student_note: `Use this card when ${title} feels performed. The way voices enter, answer, or withdraw is part of the chapter's meaning.`,
      terms: [
        ["staged speech", `Speech arranged so readers hear it as performance, not just information.`],
        ["dramatic timing", `The order and pacing of voices or gestures that gives a scene pressure.`],
        ["speaker turn", `A shift from one voice to another; in staged chapters, these turns often carry meaning.`]
      ]
    };
  }

  if (functions.has("biblical-allusion") || functions.has("sermon") || /jonah|sermon|pulpit|prophet|affidavit/.test(lower)) {
    return {
      kind: "biblical",
      category: "biblical",
      source: "king-james-bible",
      lens: "Authority and belief",
      summary: `${title} asks students to notice how religious, testimonial, or evidentiary language changes the force of the scene.`,
      student_note: `Use this card to ask why ${title} sounds like sermon, witness, proof, warning, or sacred story, and what that tone asks readers to believe.`,
      terms: [
        ["witness", `A speaker or text offering evidence; ${title} asks how much trust that evidence deserves.`],
        ["warning language", `Language that makes an event feel like a sign students should interpret before it is too late.`],
        ["scriptural pressure", `The force biblical language adds when ordinary choices begin to sound like judgment or calling.`]
      ]
    };
  }

  if (functions.has("legal-political")) {
    return {
      kind: "historical",
      category: "historical",
      source: "starbuck-history-of-american-whale-fishery",
      lens: "Rules and power",
      summary: `${title} turns practical custom, rank, evidence, or ownership into a question about power.`,
      student_note: `Use this card to ask how ${title} makes rules look useful, comic, violent, or unfair all at once.`,
      terms: [
        ["customary rule", `A practice treated as normal because people have repeated it over time.`],
        ["claim of ownership", `An assertion that someone has the right to control a body, object, profit, or story.`],
        ["rank pressure", `The way hierarchy shapes who can speak, decide, command, or object.`]
      ]
    };
  }

  return {
    kind: "literary",
    category: "vocabulary",
    source: "standard-ebooks-moby-dick",
    lens: "Scene and judgment",
    summary: `${title} gives students another angle on how scene, voice, and selected detail guide judgment.`,
    student_note: `Use this card to ask what ${title} makes newly visible: a motive, fear, social rule, friendship, or way of telling the story.`,
    terms: [
      ["scene pressure", `The force a chapter creates through setting, pacing, and selected detail.`],
      ["reader judgment", `The conclusion a chapter nudges students toward without always stating it directly.`],
      ["narrative angle", `The perspective or emphasis that shapes how students understand a scene.`]
    ]
  };
}

function shortTitle(unit) {
  const trailingSmallWords = new Set(["a", "an", "and", "as", "in", "of", "or", "the", "to"]);
  const words = unit.title
    .replace(/[⁠—–].*$/, "")
    .replace(/^(the|a|an|of)\s+/i, "")
    .replace(/[;:,.!?]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let selected = words.slice(0, 5);
  while (selected.length > 1 && trailingSmallWords.has(selected.at(-1).toLowerCase())) {
    selected = selected.slice(0, -1);
  }
  return selected.join(" ");
}

function summaryText(unit) {
  return unit.summaries?.student || unit.summaries?.one_breath || unit.summaries?.why_it_matters || "";
}

function whyText(unit) {
  return unit.summaries?.why_it_matters || unit.summaries?.student || "";
}

function studentFocus(value) {
  return {
    "whale knowledge": "whale evidence",
    "classification pressure": "unstable categories",
    "observed detail": "visible evidence",
    "shipboard routine": "shipboard work",
    "working gear": "tools at work",
    "crew risk": "shared danger",
    "staged speech": "performed speech",
    "dramatic timing": "scene timing",
    "speaker turn": "changing voices",
    witness: "evidence and trust",
    "warning language": "warning signs",
    "scriptural pressure": "biblical pressure",
    "customary rule": "custom and rule",
    "claim of ownership": "ownership claim",
    "rank pressure": "rank and power",
    "scene pressure": "scene detail",
    "reader judgment": "reader judgment",
    "narrative angle": "narrative angle"
  }[value] ?? value;
}

function unitLabel(unit) {
  if (unit.section_type === "chapter") return `Ch. ${unit.number} ${shortTitle(unit)}`;
  return shortTitle(unit);
}

function makeReference(unit, profile, sequence) {
  const summary = summaryText(unit);
  const why = whyText(unit);
  return {
    id: `apparatus-deep-ref-${slug(unit.unit_id)}-${sequence}`,
    title: `${profile.lens}: ${unit.title}`,
    kind: profile.kind,
    summary: summary || profile.summary,
    student_note: why || profile.student_note,
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      content_status: "draft",
      citation_status: "provisional"
    }
  };
}

function makeGlossary(unit, profile, sequence) {
  const [baseTerm, baseDefinition] = profile.terms[(sequence - 1) % profile.terms.length];
  const term = `${unitLabel(unit)}: wider ${studentFocus(baseTerm)}`;
  const chapterSummary = summaryText(unit);
  const definition = chapterSummary
    ? `${baseDefinition} In this chapter: ${chapterSummary}`
    : baseDefinition;
  return {
    id: `apparatus-deep-gloss-${slug(unit.unit_id)}-${sequence}`,
    term,
    category: profile.category,
    definition,
    variants: [],
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      definition_status: "draft",
      citation_status: "provisional"
    }
  };
}

let referenceAdded = 0;
let glossaryAdded = 0;
const deepGlossaryCounts = countTargets(glossary.entries.filter((entry) => entry.id.startsWith("apparatus-deep-gloss-")), (entry) => entry.targets);
const deepReferenceCounts = countTargets(references.cards.filter((card) => card.id.startsWith("apparatus-deep-ref-")), (card) => card.targets);

for (const unit of manifest.units.filter(isSubstantialDisplayedUnit)) {
  const profile = profileFor(unit);
  const refsNeeded = Math.max(0, 1 - (deepReferenceCounts.get(unit.unit_id) ?? 0));
  for (let index = 1; index <= refsNeeded; index += 1) {
    references.cards.push(makeReference(unit, profile, index));
    deepReferenceCounts.set(unit.unit_id, (deepReferenceCounts.get(unit.unit_id) ?? 0) + 1);
    referenceAdded += 1;
  }

  const glossNeeded = Math.max(0, 1 - (deepGlossaryCounts.get(unit.unit_id) ?? 0));
  for (let index = 1; index <= glossNeeded; index += 1) {
    glossary.entries.push(makeGlossary(unit, profile, index));
    deepGlossaryCounts.set(unit.unit_id, (deepGlossaryCounts.get(unit.unit_id) ?? 0) + 1);
    glossaryAdded += 1;
  }
}

await writeFile(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);
await writeFile(referencePath, `${JSON.stringify(references, null, 2)}\n`);

console.log(JSON.stringify({ referenceAdded, glossaryAdded }, null, 2));
