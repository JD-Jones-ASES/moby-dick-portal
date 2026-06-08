import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
let statusUpdated = 0;
let evidenceUpdated = 0;

for (const annotation of data.annotations) {
  if (annotation.kind !== "difficult-material") continue;

  if (annotation.status.content_status !== "needs-review") {
    annotation.status.content_status = "needs-review";
    statusUpdated += 1;
  }

  annotation.status.review_queue = [...new Set([
    ...(annotation.status.review_queue ?? []),
    "citation",
    "difficult-material",
    "source-check",
    "tone"
  ])].sort();

  for (const evidence of annotation.evidence ?? []) {
    if (!evidence.validation.includes("tone-review")) {
      evidence.validation = [...new Set([...evidence.validation, "tone-review"])].sort();
      evidenceUpdated += 1;
    }
  }

  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:difficult-material-status-normalized"])].sort();
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ statusUpdated, evidenceUpdated }, null, 2));
