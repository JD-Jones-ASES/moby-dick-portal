import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));

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

function categoriesFor(annotation) {
  const text = `${annotation.anchor ?? ""} ${annotation.note ?? ""}`.toLowerCase();
  const categories = new Set();

  if (/\b(cannibal|savage|negro|blackling|racial|colonial|empire|indies|fiji|africa|tashtego|daggoo|queequeg|fedallah|parsee|arsacides)\b/i.test(text)) {
    categories.add("race-colonial-language");
  }
  if (/\b(heathen|idolator|idolat|ramadan|religious|christian|non-christian|worship|yojo|parsee|zoroastrian)\b/i.test(text)) {
    categories.add("religious-prejudice");
  }
  if (/\b(mad|madness|insane|insanity|mental-health|diagnosis)\b/i.test(text)) {
    categories.add("mental-health-language");
  }
  if (/\b(blood|kill|death|dead|violence|body|bodies|butcher|shark|suffering|wound|corpse|carcass)\b/i.test(text)) {
    categories.add("violence-body-harm");
  }
  if (/\b(slave|slavery|coerced|submission|sultan)\b/i.test(text)) {
    categories.add("slavery-coercion-language");
  }
  if (categories.size === 0) categories.add("general-difficult-material");

  return [...categories].sort();
}

let updated = 0;
const categoryCounts = {};

for (const annotation of annotations.annotations) {
  if (annotation.kind !== "difficult-material") continue;
  const categories = categoriesFor(annotation);
  const tags = new Set(annotation.tags ?? []);
  let changed = false;

  for (const category of categories) {
    categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    const tag = `difficulty:${category}`;
    if (!tags.has(tag)) {
      tags.add(tag);
      changed = true;
    }
  }

  if (!tags.has("review:difficult-material-categorized")) {
    tags.add("review:difficult-material-categorized");
    changed = true;
  }

  if (changed) {
    annotation.tags = [...tags].sort();
    updated += 1;
  }
}

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);

console.log(JSON.stringify({ updated, categoryCounts }, null, 2));
