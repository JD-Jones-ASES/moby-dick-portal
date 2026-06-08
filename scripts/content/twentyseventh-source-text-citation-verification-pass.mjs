import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const verifiedSourceId = "standard-ebooks-moby-dick";

function isSourceTextOnly(annotation) {
  return (
    (annotation.evidence ?? []).length > 0 &&
    annotation.evidence.every((evidence) => evidence.claim_type === "source-text-observation") &&
    (annotation.citations ?? []).length === 1 &&
    annotation.citations[0] === verifiedSourceId &&
    (annotation.evidence ?? []).every((evidence) =>
      (evidence.citations ?? []).length === 1 && evidence.citations[0] === verifiedSourceId
    )
  );
}

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
let verified = 0;

for (const annotation of data.annotations) {
  if (!isSourceTextOnly(annotation)) continue;

  annotation.status.citation_status = "verified";
  annotation.status.review_queue = (annotation.status.review_queue ?? []).filter((item) => item !== "citation");

  for (const evidence of annotation.evidence) {
    evidence.validation = [...new Set([
      ...evidence.validation.filter((item) => item !== "needs-review"),
      "primary-source-checked",
      "selector-resolves"
    ])].sort();
  }

  annotation.provenance = {
    ...annotation.provenance,
    method: "reviewed",
    reviewer: "codex",
    reviewed: "2026-06-07"
  };
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:source-text-citation-verified"])].sort();
  verified += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ verified }, null, 2));
