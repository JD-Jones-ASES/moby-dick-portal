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

function normalizedWords(value) {
  return value.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function anchorsOverlap(a, b) {
  const aWords = normalizedWords(a);
  const bWords = normalizedWords(b);
  if (!aWords.length || !bWords.length) return false;
  const aText = aWords.join(" ");
  const bText = bWords.join(" ");
  if (aText.startsWith(bText) || bText.startsWith(aText)) return true;
  const minShared = Math.min(4, aWords.length, bWords.length);
  if (minShared >= 3 && aWords.slice(0, minShared).join(" ") === bWords.slice(0, minShared).join(" ")) return true;
  const aTrigrams = new Set();
  for (let index = 0; index <= aWords.length - 3; index += 1) {
    aTrigrams.add(aWords.slice(index, index + 3).join(" "));
  }
  for (let index = 0; index <= bWords.length - 3; index += 1) {
    if (aTrigrams.has(bWords.slice(index, index + 3).join(" "))) return true;
  }
  return false;
}

function overlapsAny(anchor, anchors) {
  return [...anchors].some((existing) => anchorsOverlap(anchor, existing));
}

function splitSentences(paragraph) {
  return paragraph
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/^[^A-Za-z0-9]+/, "").trim())
    .filter((sentence) => sentence.length > 35);
}

function candidatePhrases(unit) {
  const phrases = [];
  const paragraphs = unit.plain_text.split(/\n{2,}/).map((part) => part.trim()).filter((part) => part.length > 80);
  for (const paragraph of paragraphs) {
    for (const sentence of splitSentences(paragraph)) {
      const words = sentence.replace(/\s+/g, " ").split(" ").filter(Boolean);
      for (const offset of [0, 4, 8, 12]) {
        for (const count of [6, 7, 8, 5]) {
          if (words.length < offset + count) continue;
          const phrase = words.slice(offset, offset + count).join(" ").replace(/^[;:,]+|[;:,]+$/g, "");
          if (phrase.length < 24 || phrase.length > 96) continue;
          if (!isWholeWordPhrase(unit.plain_text, phrase)) continue;
          phrases.push(phrase);
        }
      }
    }
  }
  return phrases;
}

function profileFor(unit, ordinal) {
  const functions = new Set(unit.functions);
  if (ordinal % 3 === 0 && functions.has("character")) return ["theme", "interpretive", "ishmael-queequeg", "trail:ishmael-queequeg"];
  if (functions.has("cetology")) return ["context", "nautical-whaling", "cetology-classification", "trail:cetology-classification"];
  if (functions.has("whaling-labor")) return ["context", "nautical-whaling", "whaling-labor", "trail:whaling-labor"];
  if (functions.has("gam")) return ["form", "interpretive", "gams-foreshadowing", "trail:gams-foreshadowing"];
  if (functions.has("theatrical")) return ["form", "interpretive", "theater-form-experiments", "trail:theater-form-experiments"];
  if (functions.has("legal-political")) return ["theme", "interpretive", "law-property-politics", "trail:law-property-politics"];
  if (functions.has("biblical-allusion") || functions.has("sermon")) return ["context", "biblical-context", "biblical-classical-allusion", "trail:biblical-classical-allusion"];
  if (functions.has("prophecy") || functions.has("symbolic")) return ["theme", "interpretive", "symbols-prophecy", "trail:symbols-prophecy"];
  return ordinal % 2 === 0
    ? ["form", "interpretive", "theater-form-experiments", "form:chapter-design"]
    : ["theme", "interpretive", "symbols-prophecy", "theme:chapter-pressure"];
}

function noteFor(unit, trail, ordinal) {
  const summary = unit.summaries.one_breath || unit.summaries.student || `${unit.title} develops the voyage.`;
  if (trail === "cetology-classification") return `${summary} This additional note gives students another place to test how Ishmael's facts become arguments about what can and cannot be known.`;
  if (trail === "whaling-labor") return `${summary} This passage is a useful labor anchor because the book's plot depends on repeated skills, tools, and bodily risk.`;
  if (trail === "gams-foreshadowing") return `${summary} As part of the gam pattern, this moment shows how outside ships bring news that Ahab either uses or refuses.`;
  if (trail === "theater-form-experiments") return `${summary} The chapter's design matters here: voice, scene shape, and pacing are doing interpretive work.`;
  if (trail === "law-property-politics") return `${summary} This note keeps the chapter connected to Melville's habit of turning whaling practice into social argument.`;
  if (trail === "biblical-classical-allusion") return `${summary} The passage helps students see how inherited religious or literary language frames the sea without fully explaining it.`;
  if (trail === "ishmael-queequeg") return `${summary} This anchor is useful for tracking how relationships and self-knowledge shift across the voyage.`;
  if (trail === "symbols-prophecy") return `${summary} This added anchor gives the chapter another symbolic pressure point for Study mode.`;
  return `${summary} This is annotation ${ordinal} for the unit, added to make the whole-book Study layer more evenly inspectable.`;
}

function makeAnnotation(unit, anchor, ordinal) {
  const [kind, claim, trail, tag] = profileFor(unit, ordinal);
  const relationships = [
    ...(trail ? [{ type: "belongs-to-trail", target: `trail:${trail}` }] : []),
    { type: "uses-source", target: "source:standard-ebooks-moby-dick" }
  ];
  return {
    id: `whole-book-density-${slug(unit.unit_id)}-${ordinal}`,
    unit_id: unit.unit_id,
    kind,
    selector: { type: "TextQuoteSelector", exact: anchor },
    display: {
      depth: "study",
      priority: 4,
      inline: true,
      surfaces: ["reader", "trail", "index", "search"],
      spoiler_level: unit.number && unit.number >= 128 ? "major" : "none"
    },
    anchor,
    note: noteFor(unit, trail, ordinal),
    tags: [tag, `kind:${kind}`, kind === "form" ? "layer:form" : kind === "context" ? "layer:context" : "layer:theme"],
    relationships,
    evidence: [
      {
        claim_type: claim,
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
      review_queue: claim === "interpretive" ? ["citation", "interpretive", "source-check"] : ["citation", "source-check"]
    }
  };
}

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const retainedAnnotations = annotations.annotations.filter((annotation) => !annotation.id.startsWith("whole-book-density-"));
const removed = annotations.annotations.length - retainedAnnotations.length;
annotations.annotations = retainedAnnotations;
const annotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const annotationsByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

let added = 0;
const skipped = [];

for (const unit of guideData.units) {
  const targetCount = unit.section_type === "chapter" || unit.section_type === "epilogue" || unit.word_count >= 100 ? 3 : 1;
  if (!unit.plain_text.trim()) continue;
  const unitAnnotations = annotationsByUnit.get(unit.unit_id) ?? [];
  const existingAnchors = new Set(unitAnnotations.map((annotation) => annotation.anchor.toLowerCase()));
  const phrases = candidatePhrases(unit).filter((phrase) => !overlapsAny(phrase, existingAnchors));

  while (unitAnnotations.length < targetCount && phrases.length) {
    const ordinal = unitAnnotations.length + 1;
    const id = `whole-book-density-${slug(unit.unit_id)}-${ordinal}`;
    const anchor = phrases.shift();
    if (annotationIds.has(id) || !anchor) continue;
    const annotation = makeAnnotation(unit, anchor, ordinal);
    annotations.annotations.push(annotation);
    unitAnnotations.push(annotation);
    annotationIds.add(id);
    existingAnchors.add(anchor.toLowerCase());
    for (let index = phrases.length - 1; index >= 0; index -= 1) {
      if (overlapsAny(phrases[index], existingAnchors)) phrases.splice(index, 1);
    }
    added += 1;
  }

  if (unitAnnotations.length < targetCount) {
    skipped.push(`${unit.unit_id}: ${unitAnnotations.length}/${targetCount}`);
  }
}

annotations.annotations.sort((a, b) => {
  const aUnit = unitsById.get(a.unit_id);
  const bUnit = unitsById.get(b.unit_id);
  return (aUnit?.sequence ?? 9999) - (bUnit?.sequence ?? 9999) || a.id.localeCompare(b.id);
});

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify({ annotations: annotations.annotations }, null, 2))}\n`);

console.log(`Removed ${removed} previous whole-book density annotations.`);
console.log(`Added ${added} whole-book density annotations; annotations now has ${annotations.annotations.length}.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} units that could not reach target density:`);
  for (const item of skipped) console.warn(`- ${item}`);
}
