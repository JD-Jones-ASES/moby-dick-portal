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

const patterns = [
  { key: "racial-colonial", label: "cannibal", re: /\bcannibals?\b/i, priority: 1 },
  { key: "racial-colonial", label: "savage", re: /\bsavages?\b|\bsavageness\b/i, priority: 2 },
  { key: "religious-prejudice", label: "heathen", re: /\bheathen(?:ish|s)?\b/i, priority: 3 },
  { key: "racial-language", label: "negro", re: /\bnegro(?:es)?\b/i, priority: 4 },
  { key: "slavery", label: "slave", re: /\bslaves?\b|\bslavery\b/i, priority: 5 },
  { key: "mental-health-language", label: "insane", re: /\binsane\b|\binsanity\b/i, priority: 6 },
  { key: "mental-health-language", label: "madness", re: /\bmad\b|\bmadness\b|\bmadman\b|\bmadmen\b/i, priority: 7 },
  { key: "animal-violence", label: "butcher", re: /\bbutcher(?:s|ed|ing|y)?\b/i, priority: 8 },
  { key: "animal-violence", label: "blood", re: /\bblood(?:y)?\b/i, priority: 9 },
  { key: "animal-violence", label: "shark", re: /\bsharks?\b/i, priority: 10 },
  { key: "violence", label: "kill", re: /\bkill(?:ed|ing|s)?\b/i, priority: 11 }
];

function matchPatterns(text) {
  return patterns
    .map((pattern) => {
      const match = pattern.re.exec(text);
      return match ? { ...pattern, match: match[0], index: match.index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority);
}

function shouldAnnotate(matches) {
  if (matches.some((match) => ["racial-colonial", "religious-prejudice", "racial-language", "slavery", "mental-health-language"].includes(match.key))) {
    return true;
  }
  return matches.filter((match) => ["animal-violence", "violence"].includes(match.key)).length >= 2;
}

function phraseAround(text, index, matchText, anchors) {
  const start = Math.max(0, index - 72);
  const end = Math.min(text.length, index + matchText.length + 72);
  const window = text.slice(start, end);
  const clean = window.replace(/\s+/g, " ").trim();
  const parts = clean.split(" ");
  const matchWordIndex = parts.findIndex((part) => part.toLowerCase().includes(matchText.toLowerCase()));
  const center = matchWordIndex === -1 ? Math.floor(parts.length / 2) : matchWordIndex;

  for (const radius of [3, 4, 5]) {
    const phrase = parts.slice(Math.max(0, center - radius), Math.min(parts.length, center + radius + 1)).join(" ").replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
    if (phrase.length >= 18 && phrase.length <= 100 && text.includes(phrase) && !overlapsAny(phrase, anchors)) return phrase;
  }

  const fallback = matchText.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
  return overlapsAny(fallback, anchors) ? null : fallback;
}

function noteFor(match) {
  if (match.key === "racial-colonial" || match.key === "racial-language") {
    return "This passage uses nineteenth-century racial or colonial language. The guide should name the term's harm and context without treating the wording as neutral.";
  }
  if (match.key === "religious-prejudice") {
    return "This passage uses Christian judgmental language for non-Christian practice. Students need context that identifies the prejudice without flattening the character or scene.";
  }
  if (match.key === "slavery") {
    return "This passage invokes slavery or coerced labor language. It should be handled as historical and moral context, not as casual metaphor.";
  }
  if (match.key === "mental-health-language") {
    return "This passage uses older language of madness or insanity. The note should help students distinguish the novel's vocabulary from current clinical language.";
  }
  return "This passage involves violence, blood, butchery, sharks, or animal suffering. The guide should keep the material facts visible without sensationalizing them.";
}

function tagsFor(match) {
  const tags = ["kind:difficult-material", "review:difficult-material", "layer:context"];
  if (match.key === "racial-colonial" || match.key === "racial-language" || match.key === "slavery") tags.push("trail:race-empire-global-crew");
  if (match.key === "religious-prejudice") tags.push("trail:biblical-classical-allusion");
  if (match.key === "animal-violence" || match.key === "violence") tags.push("trail:whaling-labor");
  return tags;
}

function relationshipsFor(match) {
  const relationships = [{ type: "uses-source", target: "source:standard-ebooks-moby-dick" }];
  if (match.key === "racial-colonial" || match.key === "racial-language" || match.key === "slavery") {
    relationships.push({ type: "belongs-to-trail", target: "trail:race-empire-global-crew" });
  }
  if (match.key === "religious-prejudice") relationships.push({ type: "belongs-to-trail", target: "trail:biblical-classical-allusion" });
  if (match.key === "animal-violence" || match.key === "violence") relationships.push({ type: "belongs-to-trail", target: "trail:whaling-labor" });
  return relationships;
}

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const annotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const difficultUnits = new Set(annotations.annotations.filter((annotation) => annotation.kind === "difficult-material").map((annotation) => annotation.unit_id));
const anchorsByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!anchorsByUnit.has(annotation.unit_id)) anchorsByUnit.set(annotation.unit_id, new Set());
  anchorsByUnit.get(annotation.unit_id).add(annotation.anchor);
}

let added = 0;
const skipped = [];

for (const unit of guideData.units) {
  if (!unit.plain_text.trim() || difficultUnits.has(unit.unit_id)) continue;
  const matches = matchPatterns(unit.plain_text);
  if (!matches.length || !shouldAnnotate(matches)) continue;
  const match = matches[0];
  const anchors = anchorsByUnit.get(unit.unit_id) ?? new Set();
  const anchor = phraseAround(unit.plain_text, match.index, match.match, anchors);
  if (!anchor) {
    skipped.push(unit.unit_id);
    continue;
  }
  const id = `difficult-review-${slug(unit.unit_id)}`;
  if (annotationIds.has(id)) continue;
  annotations.annotations.push({
    id,
    unit_id: unit.unit_id,
    kind: "difficult-material",
    selector: { type: "TextQuoteSelector", exact: anchor },
    display: {
      depth: "study",
      priority: 2,
      inline: true,
      surfaces: ["reader", "index", "review", "teacher"],
      spoiler_level: unit.number && unit.number >= 128 ? "major" : "none"
    },
    anchor,
    note: noteFor(match),
    tags: tagsFor(match),
    relationships: relationshipsFor(match),
    evidence: [
      {
        claim_type: "difficult-material",
        citations: ["standard-ebooks-moby-dick"],
        validation: ["selector-resolves", "needs-review", "tone-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: today,
      method: "source-checked-draft"
    },
    status: {
      content_status: "needs-review",
      citation_status: "provisional",
      review_queue: ["citation", "difficult-material", "source-check", "tone"]
    }
  });
  annotationIds.add(id);
  difficultUnits.add(unit.unit_id);
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

console.log(`Added ${added} difficult-material review annotations; annotations now has ${annotations.annotations.length}.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} difficult-material candidates without a clean anchor:`);
  for (const unitId of skipped) console.warn(`- ${unitId}`);
}
