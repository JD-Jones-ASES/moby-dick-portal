import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const today = "2026-06-07";
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");

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

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function words(value) {
  return value.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function anchorsOverlap(a, b) {
  const aWords = words(a);
  const bWords = words(b);
  if (!aWords.length || !bWords.length) return false;
  const aText = aWords.join(" ");
  const bText = bWords.join(" ");
  if (aText.startsWith(bText) || bText.startsWith(aText)) return true;
  const grams = new Set();
  for (let index = 0; index <= aWords.length - 3; index += 1) grams.add(aWords.slice(index, index + 3).join(" "));
  for (let index = 0; index <= bWords.length - 3; index += 1) {
    if (grams.has(bWords.slice(index, index + 3).join(" "))) return true;
  }
  return false;
}

function overlapsAny(anchor, anchors) {
  return [...anchors].some((existing) => anchorsOverlap(anchor, existing));
}

function isWordLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function isWholeWordPhrase(text, phrase) {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = lowerText.indexOf(lowerPhrase);
  while (index !== -1) {
    const before = text[index - 1] ?? "";
    const after = text[index + phrase.length] ?? "";
    if (!(isWordLetter(before) && isWordLetter(phrase[0])) && !(isWordLetter(after) && isWordLetter(phrase[phrase.length - 1]))) {
      return true;
    }
    index = lowerText.indexOf(lowerPhrase, index + Math.max(1, phrase.length));
  }
  return false;
}

function splitSentences(text) {
  return text
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.replace(/^[^A-Za-z0-9]+/, "").trim())
    .filter((sentence) => sentence.length > 40);
}

function anchorFor(unit, anchors) {
  for (const sentence of splitSentences(unit.plain_text)) {
    const sentenceWords = sentence.replace(/\s+/g, " ").split(" ").filter(Boolean);
    for (const offset of [Math.floor(sentenceWords.length / 2), 0, 5, 10]) {
      for (const count of [7, 8, 6, 9]) {
        if (offset < 0 || sentenceWords.length < offset + count) continue;
        const phrase = sentenceWords.slice(offset, offset + count).join(" ").replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
        if (phrase.length < 28 || phrase.length > 110) continue;
        if (!isWholeWordPhrase(unit.plain_text, phrase)) continue;
        if (overlapsAny(phrase, anchors)) continue;
        return phrase;
      }
    }
  }
  return null;
}

function sentenceCase(value) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function teachingFocus(unit) {
  const functions = unit.functions.map(sentenceCase).join(", ");
  if (unit.section_type === "frontmatter") {
    return `Teacher review: use this prefatory unit to decide how much edition framing students need before the narrative begins. Functions: ${functions}.`;
  }
  if (unit.section_type === "epilogue") {
    return "Teacher review: make sure students connect Ishmael's survival to the coffin/life-buoy thread and to the novel's retrospective narration.";
  }
  if (unit.functions.includes("cetology")) {
    return "Teacher review: help students separate the chapter's historical whale knowledge from its formal experiment in classification.";
  }
  if (unit.functions.includes("whaling-labor")) {
    return "Teacher review: foreground labor, tools, bodily risk, and the economic system behind the adventure plot.";
  }
  if (unit.functions.includes("gam")) {
    return "Teacher review: connect this ship encounter to the larger pattern of warnings, news, and Ahab's selective attention.";
  }
  if (unit.functions.includes("theatrical")) {
    return "Teacher review: treat staging, voice, and dramatic form as content rather than decoration.";
  }
  if (unit.functions.includes("biblical-allusion") || unit.functions.includes("sermon")) {
    return "Teacher review: give students enough allusion context to read the scene without assuming prior biblical or classical literacy.";
  }
  if (unit.functions.includes("prophecy") || unit.functions.includes("symbolic")) {
    return "Teacher review: ask students what the chapter makes feel inevitable and what choices remain visible.";
  }
  if (unit.functions.includes("character")) {
    return "Teacher review: track how the chapter changes what students know about motive, intimacy, hierarchy, or moral pressure.";
  }
  return `Teacher review: use this chapter to connect plot movement with the unit's listed functions: ${functions}.`;
}

function trailFor(unit) {
  if (unit.functions.includes("cetology")) return "trail:cetology-classification";
  if (unit.functions.includes("whaling-labor")) return "trail:whaling-labor";
  if (unit.functions.includes("gam")) return "trail:gams-foreshadowing";
  if (unit.functions.includes("theatrical")) return "trail:theater-form-experiments";
  if (unit.functions.includes("biblical-allusion") || unit.functions.includes("sermon")) return "trail:biblical-classical-allusion";
  if (unit.functions.includes("prophecy") || unit.functions.includes("symbolic")) return "trail:symbols-prophecy";
  if (unit.functions.includes("character")) return "trail:ishmael-queequeg";
  return "theme:teacher-review";
}

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const annotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const anchorsByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!anchorsByUnit.has(annotation.unit_id)) anchorsByUnit.set(annotation.unit_id, new Set());
  anchorsByUnit.get(annotation.unit_id).add(annotation.anchor);
}

let added = 0;
const skipped = [];

for (const unit of guideData.units) {
  if (!unit.plain_text.trim()) continue;
  if (!(unit.section_type === "chapter" || unit.section_type === "epilogue" || unit.word_count >= 100)) continue;
  const id = `teacher-review-${slug(unit.unit_id)}`;
  if (annotationIds.has(id)) continue;
  const anchors = anchorsByUnit.get(unit.unit_id) ?? new Set();
  const anchor = anchorFor(unit, anchors);
  if (!anchor) {
    skipped.push(unit.unit_id);
    continue;
  }

  const trailTag = trailFor(unit);
  annotations.annotations.push({
    id,
    unit_id: unit.unit_id,
    kind: "teacher-note",
    selector: { type: "TextQuoteSelector", exact: anchor },
    display: {
      depth: "teacher",
      priority: 3,
      inline: false,
      surfaces: ["teacher", "review"],
      spoiler_level: unit.number && unit.number >= 128 ? "teacher-only" : "none"
    },
    anchor,
    note: teachingFocus(unit),
    tags: ["kind:teacher-note", "teacher:review-hook", trailTag],
    relationships: [
      ...(trailTag.startsWith("trail:") ? [{ type: "belongs-to-trail", target: trailTag }] : []),
      { type: "uses-source", target: "source:standard-ebooks-moby-dick" }
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
      created: today,
      method: "source-checked-draft"
    },
    status: {
      content_status: "draft",
      citation_status: "provisional",
      review_queue: ["citation", "interpretive", "source-check", "teacher"]
    }
  });
  annotationIds.add(id);
  anchors.add(anchor);
  anchorsByUnit.set(unit.unit_id, anchors);
  added += 1;
}

annotations.annotations.sort((a, b) => {
  const aUnit = unitsById.get(a.unit_id);
  const bUnit = unitsById.get(b.unit_id);
  return (aUnit?.sequence ?? 9999) - (bUnit?.sequence ?? 9999) || a.id.localeCompare(b.id);
});

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify({ annotations: annotations.annotations }, null, 2))}\n`);

console.log(`Added ${added} teacher review annotations; annotations now has ${annotations.annotations.length}.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} units without a clean teacher anchor:`);
  for (const unitId of skipped) console.warn(`- ${unitId}`);
}
