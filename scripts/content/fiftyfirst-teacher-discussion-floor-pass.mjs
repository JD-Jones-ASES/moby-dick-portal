import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const summariesPath = "data/chapters/moby-dick.summary-seeds.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const summaries = JSON.parse(await readFile(summariesPath, "utf8"));
const guideData = await loadGuideData();

const summaryByUnit = new Map(summaries.summaries.map((summary) => [summary.unit_id, summary]));

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

function isLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function firstWholePhrase(text, maxLength = 74) {
  const start = text.search(/[A-Za-z0-9]/);
  if (start < 0) return "";
  let end = Math.min(text.length, start + maxLength);
  while (end > start + 24 && isLetter(text[end])) end -= 1;
  let phrase = text.slice(start, end).trim();
  while (phrase.length > 24 && !isLetter(phrase.at(-1))) phrase = phrase.slice(0, -1).trim();
  return phrase;
}

function primaryFunction(unit) {
  const preferred = [
    "difficult-material",
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
    "transition",
    "prefatory"
  ];
  return preferred.find((item) => unit.functions.includes(item)) ?? unit.functions[0] ?? "narrative";
}

function promptFor(unit, summary) {
  const title = unit.section_type === "chapter" ? `Chapter ${unit.number}, "${unit.title}"` : unit.title;
  const focus = primaryFunction(unit);
  const why = (summary?.why_it_matters ?? summary?.student ?? "").replace(/\s+/g, " ").trim();
  const shortWhy = why ? ` The local reason to press the question is: ${why}` : "";

  const prompts = {
    "whaling-labor": `Discussion prompt: Ask students who works, who commands, and who is endangered in ${title}. Have them use one practical detail to connect shipboard labor with power aboard the Pequod.${shortWhy}`,
    cetology: `Discussion prompt: Ask students why Melville stops for whale knowledge in ${title}. Have them separate useful information from moments where classification itself starts to look comic, anxious, or unstable.${shortWhy}`,
    gam: `Discussion prompt: Ask students what information moves between ships in ${title}, and what still does not move. The exchange should become a question about warning, refusal, and delayed consequence.${shortWhy}`,
    sermon: `Discussion prompt: Ask students how sacred language shapes judgment in ${title}. Keep the conversation close to the passage: who gets warned, who gets blamed, and who gets to interpret the warning?${shortWhy}`,
    theatrical: `Discussion prompt: Ask students what changes when ${title} behaves like staged speech rather than ordinary narration. Have them track entrances, exits, commands, or overheard lines as evidence.${shortWhy}`,
    "legal-political": `Discussion prompt: Ask students what rule, right, contract, or ownership claim is being tested in ${title}. Then ask whose body or labor pays the cost of that claim.${shortWhy}`,
    "biblical-allusion": `Discussion prompt: Ask students what biblical language adds to ${title} besides decoration. The useful move is to ask whether the allusion clarifies judgment or makes judgment harder.${shortWhy}`,
    prophecy: `Discussion prompt: Ask students how ${title} turns prediction into pressure. Have them name what feels fated and what still looks like a human choice.${shortWhy}`,
    symbolic: `Discussion prompt: Ask students which object, color, animal, or repeated image does the most work in ${title}. Then ask what changes if it is read literally first and symbolically second.${shortWhy}`,
    character: `Discussion prompt: Ask students what ${title} reveals through action, gesture, silence, or misreading rather than direct explanation. Require one quoted detail before any large claim about character.${shortWhy}`,
    transition: `Discussion prompt: Ask students what ${title} moves the reader away from and toward. The chapter may look like connective tissue, but its pacing changes what the next scene can mean.${shortWhy}`,
    prefatory: `Discussion prompt: Ask students how this front matter frames the book before the plot begins. Have them decide whether it steadies the reader or makes whale knowledge feel stranger.${shortWhy}`,
    narrative: `Discussion prompt: Ask students what has changed by the end of ${title}. Then have them find the small sentence-level detail that makes the change feel earned rather than merely announced.${shortWhy}`
  };

  return prompts[focus] ?? prompts.narrative;
}

const beforeCount = annotations.annotations.length;
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.id.startsWith("teacher-discussion-"));
const removed = beforeCount - annotations.annotations.length;
const existingIds = new Set(annotations.annotations.map((annotation) => annotation.id));
let added = 0;

for (const unit of guideData.units) {
  if (!unit.plain_text.trim()) continue;
  const id = `teacher-discussion-${unit.unit_id}`;
  if (existingIds.has(id)) continue;

  const anchor = firstWholePhrase(unit.plain_text);
  if (!anchor) continue;
  const summary = summaryByUnit.get(unit.unit_id);

  annotations.annotations.push({
    id,
    unit_id: unit.unit_id,
    kind: "teacher-note",
    selector: {
      type: "TextQuoteSelector",
      exact: anchor
    },
    display: {
      depth: "teacher",
      priority: 2,
      inline: false,
      surfaces: ["teacher", "review", "index"],
      spoiler_level: "teacher-only"
    },
    anchor,
    note: promptFor(unit, summary),
    tags: [
      "kind:teacher-note",
      "teacher:discussion-prompt",
      `function:${primaryFunction(unit)}`,
      "provenance:teacher-discussion-floor"
    ],
    relationships: [
      {
        type: "uses-source",
        target: "source:standard-ebooks-moby-dick"
      }
    ],
    evidence: [
      {
        claim_type: "interpretive",
        citations: ["standard-ebooks-moby-dick"],
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: "2026-06-07",
      method: "source-checked-draft"
    },
    status: {
      content_status: "draft",
      citation_status: "provisional",
      review_queue: ["citation", "interpretive", "source-check", "teacher"]
    }
  });
  existingIds.add(id);
  added += 1;
}

annotations.annotations.sort((a, b) => a.unit_id.localeCompare(b.unit_id) || a.id.localeCompare(b.id));

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({ removed, added, total: annotations.annotations.length }, null, 2));
