import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const formulaPatterns = [
  /\s*This passage is a useful labor anchor because the book's plot depends on repeated skills, tools, and bodily risk\./g,
  /\s*This additional note gives students another place to test how Ishmael's facts become arguments about what can and cannot be known\./g,
  /\s*This anchor is useful for tracking how relationships and self-knowledge shift across the voyage\./g,
  /\s*This is a good place to track how character knowledge changes through contact rather than through explanation alone\./g,
  /\s*This anchor keeps the material work of whaling visible, so the voyage reads as labor as well as adventure\./g,
  /\s*The form matters here: Melville lets voice, staging, or overheard speech carry meaning alongside plot\./g,
  /\s*The chapter's design matters here: voice, scene shape, and pacing are doing interpretive work\./g
];

const teacherOpeners = new Map([
  ["begin ", "Begin "],
  ["give ", "Give "],
  ["make ", "Make "],
  ["compare ", "Compare "],
  ["do not ", "Do not "]
]);

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
let updated = 0;
let formulaRemoved = 0;
let teacherCapitalized = 0;

for (const annotation of data.annotations) {
  let next = annotation.note;
  for (const pattern of formulaPatterns) {
    if (pattern.test(next)) {
      formulaRemoved += 1;
      next = next.replace(pattern, "");
    }
    pattern.lastIndex = 0;
  }

  if (annotation.kind === "teacher-note") {
    for (const [lower, upper] of teacherOpeners) {
      if (next.startsWith(lower)) {
        next = upper + next.slice(lower.length);
        teacherCapitalized += 1;
        break;
      }
    }
  }

  next = next.replace(/\s+/g, " ").trim();
  if (next !== annotation.note) {
    annotation.note = next;
    annotation.tags = [...new Set([...(annotation.tags ?? []), "review:formula-residue-polished"])].sort();
    updated += 1;
  }
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, formulaRemoved, teacherCapitalized }, null, 2));
