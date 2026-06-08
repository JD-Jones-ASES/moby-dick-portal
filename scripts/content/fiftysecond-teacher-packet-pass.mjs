import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const summariesPath = "data/chapters/moby-dick.summary-seeds.json";
const annotationsPath = "data/annotations/moby-dick.annotations.json";
const referencesPath = "data/references/moby-dick.reference-cards.json";
const teacherDir = "data/teacher";
const teacherPacketsPath = `${teacherDir}/moby-dick.teacher-packets.json`;

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const summaries = JSON.parse(await readFile(summariesPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const references = JSON.parse(await readFile(referencesPath, "utf8"));
const guideData = await loadGuideData();
const displayedUnitIds = new Set(guideData.units.filter((unit) => unit.plain_text.trim()).map((unit) => unit.unit_id));

const summaryByUnit = new Map(summaries.summaries.map((summary) => [summary.unit_id, summary]));
const annotationsByUnit = new Map();
const referencesByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

for (const card of references.cards) {
  for (const target of card.targets ?? []) {
    if (!referencesByUnit.has(target)) referencesByUnit.set(target, []);
    referencesByUnit.get(target).push(card);
  }
}

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

function sentence(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().replace(/[;:,]+$/, ".");
}

function titleFor(unit) {
  return unit.section_type === "chapter" ? `Chapter ${unit.number}, "${unit.title}"` : unit.title;
}

function primaryFunction(unit) {
  const preferred = [
    "whaling-labor",
    "cetology",
    "gam",
    "sermon",
    "theatrical",
    "legal-political",
    "biblical-allusion",
    "prophecy",
    "symbolic",
    "character",
    "narrative",
    "transition"
  ];
  return preferred.find((item) => unit.functions.includes(item)) ?? unit.functions[0] ?? "narrative";
}

function compactUnique(items, limit) {
  return [...new Set(items.filter(Boolean))].slice(0, limit);
}

function trailIds(unitAnnotations) {
  return compactUnique(unitAnnotations.flatMap((annotation) => [
    ...(annotation.relationships ?? [])
      .filter((relationship) => relationship.target?.startsWith("trail:"))
      .map((relationship) => relationship.target.replace(/^trail:/, "")),
    ...(annotation.tags ?? [])
      .filter((tag) => tag.startsWith("trail:"))
      .map((tag) => tag.replace(/^trail:/, ""))
  ]), 5);
}

function annotationIds(unitAnnotations, kind, limit) {
  return unitAnnotations
    .filter((annotation) => !kind || annotation.kind === kind)
    .sort((a, b) => (a.display?.priority ?? 9) - (b.display?.priority ?? 9) || a.id.localeCompare(b.id))
    .map((annotation) => annotation.id)
    .slice(0, limit);
}

function likelyMisreadings(unit, difficultCount) {
  const title = titleFor(unit);
  const focus = primaryFunction(unit);
  const byFunction = {
    "whaling-labor": `Students may treat the labor detail in ${title} as background machinery. Redirect them toward who benefits, who risks injury, and who gets to give orders.`,
    cetology: `Students may treat ${title} as skippable whale information. Ask what the classification work reveals about Ishmael's need to organize the world.`,
    gam: `Students may read the ship meeting in ${title} as a pause in the plot. Press how information, warning, and refusal move through the encounter.`,
    sermon: `Students may flatten the sacred language in ${title} into a single moral. Keep multiple kinds of judgment in view: scriptural, social, and personal.`,
    theatrical: `Students may miss that the form of ${title} changes the evidence. Treat stage-like speech, gesture, and interruption as meaning, not ornament.`,
    "legal-political": `Students may accept the rule or ownership claim in ${title} as neutral. Ask who gets protected by the rule and who becomes exposed by it.`,
    "biblical-allusion": `Students may treat the allusion in ${title} as a reference hunt. Push them to ask how it changes blame, scale, or authority.`,
    prophecy: `Students may call everything in ${title} fate too quickly. Separate prediction from choice, pressure, and self-fulfilling behavior.`,
    symbolic: `Students may jump straight to symbolism in ${title}. Start with the literal object or action before asking what extra pressure it gathers.`,
    character: `Students may summarize character motive in ${title} too broadly. Require a concrete action, gesture, or phrase before the interpretive claim.`,
    transition: `Students may treat ${title} as connective tissue. Ask how its pacing or emphasis changes the next required scene.`,
    narrative: `Students may reduce ${title} to plot summary. Ask what the narration makes students feel before it tells them what happened.`
  };
  const notes = [byFunction[focus] ?? byFunction.narrative];
  if (difficultCount > 0) {
    notes.push(`Students may either skip the difficult language in ${title} or treat it as merely old-fashioned. Use the linked difficult-material note to keep the harm and context visible.`);
  } else {
    notes.push(`Students may ask why ${title} deserves attention if it does not obviously advance the chase. Tie the answer to the chapter's local function and one quoted detail.`);
  }
  return notes;
}

function essentialQuestion(unit, summary) {
  const title = titleFor(unit);
  const focus = primaryFunction(unit).replace("-", " ");
  const why = sentence(summary?.why_it_matters ?? summary?.student ?? "");
  if (why) return `How does ${title} use ${focus} material to change what readers know, feel, or expect?`;
  return `What does ${title} ask readers to notice before the next part of the voyage begins?`;
}

function promptsFor(unit, summary, linkedAnnotations, linkedReferences, linkedTrails) {
  const title = titleFor(unit);
  const why = sentence(summary?.why_it_matters ?? summary?.student ?? "");
  return [
    {
      id: `${unit.unit_id}-opening`,
      prompt: `Opening: What is the most important change in ${title}, and which quoted detail proves it?`,
      linked_annotations: linkedAnnotations.slice(0, 2),
      linked_reference_cards: linkedReferences.slice(0, 1),
      linked_trails: linkedTrails.slice(0, 2)
    },
    {
      id: `${unit.unit_id}-method`,
      prompt: `Method: How does the chapter's form or focus guide student judgment before any large theme is named?`,
      linked_annotations: linkedAnnotations.slice(1, 4).length ? linkedAnnotations.slice(1, 4) : linkedAnnotations.slice(0, 2),
      linked_reference_cards: linkedReferences.slice(1, 3).length ? linkedReferences.slice(1, 3) : linkedReferences.slice(0, 1),
      linked_trails: linkedTrails.slice(1, 3).length ? linkedTrails.slice(1, 3) : linkedTrails.slice(0, 2)
    },
    {
      id: `${unit.unit_id}-stakes`,
      prompt: why
        ? `Stakes: ${why} What sentence in the source text best supports that claim?`
        : `Stakes: What does this unit make easier or harder for students to understand later?`,
      linked_annotations: linkedAnnotations.slice(3, 6).length ? linkedAnnotations.slice(3, 6) : linkedAnnotations.slice(0, 2),
      linked_reference_cards: linkedReferences.slice(2, 4).length ? linkedReferences.slice(2, 4) : linkedReferences.slice(0, 1),
      linked_trails: linkedTrails.slice(0, 3)
    }
  ];
}

const packetUnits = manifest.units.filter((unit) => displayedUnitIds.has(unit.unit_id));
const packets = [];

for (const unit of packetUnits) {
  const unitAnnotations = annotationsByUnit.get(unit.unit_id) ?? [];
  const unitReferences = referencesByUnit.get(unit.unit_id) ?? [];
  const difficultHandles = annotationIds(unitAnnotations, "difficult-material", 6);
  const linkedAnnotations = compactUnique([
    ...annotationIds(unitAnnotations, "teacher-note", 3),
    ...annotationIds(unitAnnotations, "theme", 2),
    ...annotationIds(unitAnnotations, "form", 2),
    ...annotationIds(unitAnnotations, "context", 2),
    ...difficultHandles
  ], 8);
  const linkedReferences = compactUnique(unitReferences.map((card) => card.id), 5);
  const linkedTrails = trailIds(unitAnnotations);
  const reviewQueue = new Set(["teacher", "citation", "interpretive", "source-check"]);
  if (difficultHandles.length > 0) {
    reviewQueue.add("difficult-material");
    reviewQueue.add("tone");
  }
  const summary = summaryByUnit.get(unit.unit_id);

  packets.push({
    id: `teacher-packet-${unit.unit_id}`,
    unit_id: unit.unit_id,
    essential_question: essentialQuestion(unit, summary),
    discussion_prompts: promptsFor(unit, summary, linkedAnnotations, linkedReferences, linkedTrails),
    likely_misreadings: likelyMisreadings(unit, difficultHandles.length),
    difficult_material_handles: difficultHandles,
    linked_trails: linkedTrails,
    linked_reference_cards: linkedReferences,
    linked_annotations: linkedAnnotations,
    teacher_takeaway: sentence(summary?.why_it_matters ?? summary?.student ?? `Use ${titleFor(unit)} to connect the local reading work to the book's larger movement.`),
    provenance: {
      author: "codex",
      created: "2026-06-07",
      method: "generated"
    },
    status: {
      content_status: "draft",
      citation_status: "provisional",
      review_queue: [...reviewQueue].sort()
    }
  });
}

await mkdir(teacherDir, { recursive: true });
await writeFile(teacherPacketsPath, `${escapeNonAscii(JSON.stringify({ packets }, null, 2))}\n`);

console.log(JSON.stringify({ packets: packets.length }, null, 2));
