import { readFile, writeFile } from "node:fs/promises";

const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";
const sourcesPath = "data/sources/moby-dick.source-records.json";

const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const sources = JSON.parse(await readFile(sourcesPath, "utf8"));

const canonicalEntityPairs = [
  ["peleg", "captain-peleg", ["Captain Peleg"]],
  ["bildad", "captain-bildad", ["Captain Bildad"]],
  ["boomer", "captain-boomer", ["Boomer", "Captain Boomer"]],
  ["rachel", "rachel-ship", ["Rachel's"]],
  ["jeroboam", "jeroboam-ship", ["Jeroboam's"]],
  ["samuel-enderby", "samuel-enderby-ship", ["Enderby"]],
  ["delight", "delight-ship", ["Delight's"]],
  ["fleece", "the-cook", ["the cook", "cook"]]
];

const drops = new Set(canonicalEntityPairs.map(([, drop]) => drop));
const aliasByKeep = new Map(canonicalEntityPairs.map(([keep, , aliases]) => [keep, aliases]));

let entitiesRemoved = 0;
let aliasesAdded = 0;

taxonomy.entities = taxonomy.entities.filter((entity) => {
  if (!drops.has(entity.id)) return true;
  entitiesRemoved += 1;
  return false;
});

for (const entity of taxonomy.entities) {
  const aliases = aliasByKeep.get(entity.id);
  if (!aliases) continue;
  const before = entity.aliases.length;
  entity.aliases = [...new Set([...entity.aliases, ...aliases])];
  aliasesAdded += entity.aliases.length - before;
}

const sourceStatusPromotions = new Map([
  ["dana-two-years-before-the-mast", "provisional"],
  ["noaa-north-atlantic-right-whale", "provisional"],
  ["melville-typee-gutenberg", "provisional"]
]);

let sourcesPromoted = 0;

for (const record of sources.records) {
  const targetStatus = sourceStatusPromotions.get(record.id);
  if (!targetStatus || record.citation_status !== "needs-review") continue;
  record.citation_status = targetStatus;
  const note = "Promoted from needs-review to provisional because this record is actively cited; bibliographic verification is still required before student-ready claims.";
  record.source_note = record.source_note.includes(note) ? record.source_note : `${record.source_note} ${note}`;
  sourcesPromoted += 1;
}

await writeFile(taxonomyPath, `${JSON.stringify(taxonomy, null, 2)}\n`);
await writeFile(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`);

console.log(JSON.stringify({ entitiesRemoved, aliasesAdded, sourcesPromoted }, null, 2));
