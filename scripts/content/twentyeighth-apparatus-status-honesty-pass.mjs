import { readFile, writeFile } from "node:fs/promises";

const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencePath = "data/references/moby-dick.reference-cards.json";

const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const referenceCards = JSON.parse(await readFile(referencePath, "utf8"));

let glossaryDemoted = 0;
let referenceDemoted = 0;

for (const entry of glossary.entries) {
  if (entry.status.definition_status === "student-ready" && entry.status.citation_status !== "verified") {
    entry.status.definition_status = "draft";
    glossaryDemoted += 1;
  }
}

for (const card of referenceCards.cards) {
  if (card.status.content_status === "student-ready" && card.status.citation_status !== "verified") {
    card.status.content_status = "draft";
    referenceDemoted += 1;
  }
}

await writeFile(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);
await writeFile(referencePath, `${JSON.stringify(referenceCards, null, 2)}\n`);

console.log(JSON.stringify({ glossaryDemoted, referenceDemoted }, null, 2));
