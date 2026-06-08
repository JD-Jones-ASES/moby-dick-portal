import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const today = "2026-06-07";

const scaffoldIdPatterns = [
  /^source-index-/,
  /^entity-index-/,
  /^trail-index-/,
  /^entity-registry-/,
  /^floor-pass-/,
  /^ten-note-floor-/,
  /^twelve-note-floor-/,
  /^fourteen-note-floor-/,
  /^whole-book-density-/,
  /^classroom-second-anchor-/,
  /^apparatus-(?:floor|deep|wide)-/,
  /^short-unit-/
];

const weakNotePatterns = [
  /useful (?:study )?hinge/i,
  /pressure point/i,
  /foothold/i,
  /source-index/i,
  /taxonomy-index/i,
  /teacher review/i,
  /review queue/i,
  /provisional lead/i,
  /coverage/i,
  /Use this (?:passage|chapter|card|entry)/i,
  /Ask students/i,
  /keeps .* visible inside/i,
  /gives .* a .* handle/i,
  /another place to test/i,
  /chapter's larger pressure/i,
  /source-text entry point/i,
  /Explore and Teacher views/i
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

function isLowQualityScaffold(annotation) {
  if (annotation.status?.content_status === "student-ready") return false;
  if (annotation.kind === "teacher-note" || annotation.kind === "difficult-material") return false;
  return (
    scaffoldIdPatterns.some((pattern) => pattern.test(annotation.id)) ||
    weakNotePatterns.some((pattern) => pattern.test(annotation.note ?? ""))
  );
}

function unique(values) {
  return [...new Set(values)];
}

const collection = JSON.parse(await readFile(annotationsPath, "utf8"));
let retired = 0;

collection.annotations = collection.annotations.map((annotation) => {
  if (!isLowQualityScaffold(annotation)) return annotation;
  retired += 1;

  return {
    ...annotation,
    display: {
      ...annotation.display,
      depth: "explore",
      inline: false,
      surfaces: ["index", "review"],
      spoiler_level: annotation.display?.spoiler_level ?? "none"
    },
    tags: unique([
      ...(annotation.tags ?? []),
      "quality:scaffold",
      "review:internal-only",
      "review:retire-candidate"
    ]).sort(),
    provenance: {
      ...annotation.provenance,
      retired: today
    },
    status: {
      content_status: "draft",
      citation_status: annotation.status?.citation_status === "verified" ? "verified" : "provisional",
      review_queue: unique([
        ...(annotation.status?.review_queue ?? []),
        "interpretive",
        "source-check"
      ]).sort()
    }
  };
});

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(collection, null, 2))}\n`);
console.log(`Tagged and retired ${retired} low-quality scaffold annotations to internal review/index surfaces.`);
