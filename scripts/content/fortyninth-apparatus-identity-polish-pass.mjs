import { readFile, writeFile } from "node:fs/promises";

const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencesPath = "data/references/moby-dick.reference-cards.json";
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencesPath, "utf8"));

const rewrites = new Map([
  [
    "apparatus-floor-gloss-chapter-092-ambergris-1",
    {
      term: "ambergris trade",
      definition: "The commercial handling of ambergris, a rare whale product prized in perfume. In this chapter, Ishmael connects smell, trade, science, and luxury."
    }
  ],
  [
    "crotch-whaling",
    {
      term: "crotch (whaling gear)",
      definition: "The notched support in a whaleboat that holds a harpoon or lance ready for use during a chase."
    }
  ]
]);

let polished = 0;

for (const entry of glossary.entries) {
  const rewrite = rewrites.get(entry.id);
  if (!rewrite) continue;
  entry.term = rewrite.term;
  entry.definition = rewrite.definition;
  polished += 1;
}

for (const card of references.cards) {
  if (card.id !== "final-chase-structure") continue;
  card.title = "Final Chase Escalation";
  card.summary = "The final chase tightens over three chapters, making each refusal more costly than the last.";
  card.student_note = "Track how each day gives Ahab another chance to treat disaster as warning, and how each chance is refused.";
  polished += 1;
}

await writeFile(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);
await writeFile(referencesPath, `${JSON.stringify(references, null, 2)}\n`);

console.log(JSON.stringify({ polished }, null, 2));
