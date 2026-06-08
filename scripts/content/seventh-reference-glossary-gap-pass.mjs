import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const files = {
  glossary: path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json"),
  references: path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json")
};

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

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, data) {
  await writeFile(file, `${escapeNonAscii(JSON.stringify(data, null, 2))}\n`);
}

function hasId(items, id) {
  return items.some((item) => item.id === id);
}

function upsertTargets(entries, id, targets) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return false;
  entry.targets = [...new Set([...(entry.targets ?? []), ...targets])];
  return true;
}

const referenceCards = [
  ["communal-eating-and-early-fellowship", "Communal Eating and Early Fellowship", "literary", "Breakfast and Chowder use shared meals to move Ishmael from isolation toward shipboard society.", "Food scenes are social tests. They show how strangers become companions before the voyage turns them into a crew.", ["chapter-005-breakfast", "chapter-015-chowder"]],
  ["new-bedford-street-global-port", "New Bedford Street as Global Port", "historical", "The Street turns New Bedford into a compressed global whaling world.", "Students can read the street scene as a preview of the Pequod's mixed crew and the global economy behind the voyage.", ["chapter-006-the-street"]],
  ["queequeg-before-the-pequod", "Queequeg Before the Pequod", "literary", "Biographical and Wheelbarrow give Queequeg a past, a comic social presence, and a practical path toward the ship.", "These chapters keep Queequeg from being only a first impression at the inn. He has history, skill, humor, and agency.", ["chapter-012-biographical", "chapter-013-wheelbarrow"]],
  ["departure-work-rhythm", "Departure Work Rhythm", "nautical", "All Astir and The Mat-Maker show the voyage forming through work rhythms before open chase begins.", "The plot advances through preparation, weaving, and ordinary labor, not only through Ahab's speeches.", ["chapter-020-all-astir", "chapter-047-the-mat-maker"]],
  ["bulkington-and-the-lee-shore", "Bulkington and the Lee Shore", "literary", "Bulkington's brief chapter turns seamanship into a moral image of risk and refusal.", "The chapter is short, but it gives students a powerful symbol for choosing danger over false safety.", ["chapter-023-the-lee-shore"]],
  ["postscript-and-whaling-prestige", "Postscript and Whaling Prestige", "historical", "The Postscript adds comic evidence to Ishmael's defense of whaling dignity.", "This small chapter matters because it shows Ishmael still arguing for whaling's cultural importance after The Advocate.", ["chapter-024-the-advocate", "chapter-025-postscript"]],
  ["ahab-and-stubb-first-conflict", "Ahab and Stubb's First Conflict", "literary", "Enter Ahab; To Him, Stubb stages command as a clash between ordinary sailorly speech and Ahab's absolutism.", "This is an early rehearsal for later obedience conflicts. Stubb jokes, but Ahab makes even joking dangerous.", ["chapter-029-enter-ahab-to-him-stubb", "chapter-030-the-pipe", "chapter-031-queen-mab"]],
  ["surmise-and-interpretive-pressure", "Surmise and Interpretive Pressure", "literary", "Surmises shows Ishmael trying to infer motives from partial evidence.", "The chapter helps students see that the narrator often has to build explanations from pressure, rumor, and limited access.", ["chapter-046-surmises"]],
  ["town-ho-as-nested-story", "Town-Ho as Nested Story", "literary", "The Town-Ho's Story is a long embedded tale about mutiny, revenge, prophecy, and delayed recognition.", "A dedicated card helps students track why the chapter's storytelling frame matters as much as the events it reports.", ["chapter-054-the-town-ho-s-story"]],
  ["sphynx-and-unreadable-body", "Sphynx and the Unreadable Body", "literary", "The Sphynx turns the whale's head into an ancient riddle that refuses to answer Ahab.", "This card links anatomy, myth, and Ahab's hunger for meaning in one image.", ["chapter-070-the-sphynx"]],
  ["virgin-gam-and-competition", "The Virgin and Whaling Competition", "whaling", "The Virgin gam combines embarrassment, rivalry, luck, and whale-chase labor.", "This large chapter needs a card because its comedy and action also show how ships compete and judge one another.", ["chapter-081-the-pequod-meets-the-virgin"]],
  ["cleanup-after-extraction", "Cleanup After Extraction", "whaling", "Stowing Down and Clearing Up shows the aftermath of extraction as routine, bodily, and strangely cleansing.", "The chapter completes a labor cycle: after violence and processing, the ship has to restore order enough to keep hunting.", ["chapter-098-stowing-down-and-clearing-up"]],
  ["bachelor-as-false-ending", "The Bachelor as False Ending", "literary", "The Bachelor offers cheer, success, and homeward motion just as Ahab presses deeper into refusal.", "The ship meeting works as a contrast: another ending is visible, but the Pequod cannot take it.", ["chapter-115-the-pequod-meets-the-bachelor"]]
].map(([id, title, kind, summary, student_note, targets]) => ({
  id,
  title,
  kind,
  summary,
  student_note,
  targets,
  citations: ["standard-ebooks-moby-dick"],
  status: { content_status: "draft", citation_status: "provisional" }
}));

const glossaryCandidates = [
  ["hark", "vocabulary", "Listen; the chapter title is a command to hear something half-hidden.", ["chapter-043-hark"], ["Hark!"]],
  ["hyena", "symbolic", "A scavenging animal; Ishmael uses the image to frame grim laughter after danger.", ["chapter-049-the-hyena"], ["Hyena"]],
  ["signboard", "vocabulary", "A public painted sign; the whale-image chapters use signboards as everyday examples of representation.", ["chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars"], ["sign-board", "signboards"]],
  ["dart", "whaling", "A harpoon-like throwing weapon or strike; The Dart turns the act into advice about preparation and balance.", ["chapter-062-the-dart"], ["darts"]],
  ["crotch-whaling", "whaling", "A support in a whaleboat that holds a harpoon or lance ready for use.", ["chapter-063-the-crotch"], ["crotch", "crotches"]],
  ["shark-massacre", "whaling", "The killing of sharks around the whale carcass; the scene shows violence continuing after the hunt.", ["chapter-066-the-shark-massacre"], ["shark massacre"]],
  ["vultureism", "vocabulary", "A harsh word for scavenging or feeding on the dead; Melville uses it to make whale processing feel morally unsettling.", ["chapter-069-the-funeral"], ["vultureism"]],
  ["demigods", "classical", "Beings partly divine and partly mortal; Ishmael uses heroic language to inflate whaling history.", ["chapter-082-the-honor-and-glory-of-whaling"], ["demigod", "demigods"]],
  ["fountain", "whaling", "A whale's spout; Ishmael examines what the visible breath or vapor might be.", ["chapter-085-the-fountain"], ["fountains"]],
  ["extinction", "vocabulary", "The disappearance of a species; Ishmael raises the question while speculating about whales' future.", ["chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish"], ["perish", "diminish"]]
].map(([id, category, definition, targets, variants]) => ({
  id,
  term: variants[0],
  category,
  definition,
  variants: variants.slice(1),
  targets,
  citations: ["standard-ebooks-moby-dick"],
  status: { definition_status: "draft", citation_status: "provisional" }
}));

const glossary = await readJson(files.glossary);
const references = await readJson(files.references);

let addedReferences = 0;
for (const card of referenceCards) {
  if (!hasId(references.cards, card.id)) {
    references.cards.push(card);
    addedReferences += 1;
  }
}

let addedGlossary = 0;
let updatedGlossary = 0;
for (const entry of glossaryCandidates) {
  if (!hasId(glossary.entries, entry.id)) {
    glossary.entries.push(entry);
    addedGlossary += 1;
  } else if (upsertTargets(glossary.entries, entry.id, entry.targets)) {
    updatedGlossary += 1;
  }
}

for (const [id, targets] of [
  ["crotch", ["chapter-063-the-crotch"]],
  ["line-tub", ["chapter-127-the-deck"]],
  ["spermaceti", ["chapter-085-the-fountain", "chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish"]],
  ["harpooneer", ["chapter-062-the-dart"]]
]) {
  if (upsertTargets(glossary.entries, id, targets)) updatedGlossary += 1;
}

await writeJson(files.glossary, glossary);
await writeJson(files.references, references);

console.log(JSON.stringify({
  addedReferences,
  addedGlossary,
  updatedGlossary,
  totals: {
    references: references.cards.length,
    glossary: glossary.entries.length
  }
}, null, 2));
