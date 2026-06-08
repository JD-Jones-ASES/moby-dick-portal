import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "whole-book-density-chapter-091-the-pequod-meets-the-rose-bud-2": "The Rose-Bud's foul carcasses let Stubb spot ambergris, showing how whaling profit can come from a damaged, stinking catch.",
  "whole-book-density-chapter-091-the-pequod-meets-the-rose-bud-3": "The Rose-Bud's foul carcasses let Stubb spot ambergris, showing how whaling profit can come from a damaged, stinking catch.",
  "whole-book-density-chapter-092-ambergris-2": "Ambergris is a rare whale product, and Ishmael uses it to connect smell, science, and commerce.",
  "whole-book-density-chapter-092-ambergris-3": "Ambergris is a rare whale product, and Ishmael uses it to connect smell, science, and commerce.",
  "classroom-second-anchor-chapter-093-the-castaway": "Pip's abandonment marks a trauma that changes how the crew must read him.",
  "whole-book-density-chapter-093-the-castaway-3": "Pip's abandonment marks a trauma that changes how the crew must read him.",
  "whole-book-density-chapter-094-a-squeeze-of-the-hand-3": "The squeezing scene turns whale processing into an almost absurdly intimate group labor.",
  "whole-book-density-chapter-095-the-cassock-2": "The cassock image turns stripped blubber into a black robe, mixing religion with butchery.",
  "whole-book-density-chapter-096-the-try-works-3": "The try-works turn the Pequod into a floating furnace and make Ishmael's mood darker.",
  "whole-book-density-chapter-097-the-lamp-2": "Whale oil lights the sailors' sleeping space, so comfort comes directly from the hunt.",
  "whole-book-density-chapter-097-the-lamp-3": "Whale oil lights the sailors' sleeping space, so comfort comes directly from the hunt.",
  "whole-book-density-chapter-098-stowing-down-and-clearing-up-2": "Once the oil is stored, the chapter shows how quickly the ship resets for the next whale.",
  "whole-book-density-chapter-098-stowing-down-and-clearing-up-3": "Once the oil is stored, the chapter shows how quickly the ship resets for the next whale.",
  "whole-book-density-chapter-100-leg-and-arm-3": "Ahab's meeting with the Samuel Enderby captain shows that Moby Dick has already maimed other whalemen, not just him.",
  "whole-book-density-chapter-101-the-decanter-2": "Ishmael traces the Enderby firm's whaling history to show whaling as a global business with long memory.",
  "whole-book-density-chapter-101-the-decanter-3": "Ishmael traces the Enderby firm's whaling history to show whaling as a global business with long memory.",
  "whole-book-density-chapter-102-a-bower-in-the-arsacides-3": "The skeleton in the grove lets Ishmael ask what a dead whale can and cannot tell us.",
  "whole-book-density-chapter-103-measurement-of-the-whale-s-skeleton-3": "Exact measurements make the whale seem knowable, but the chapter keeps stressing the limits of size alone.",
  "whole-book-density-chapter-104-the-fossil-whale-3": "By shifting from living whales to fossils, Ishmael pushes the book into deep time.",
  "whole-book-density-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish-3": "Ishmael uses fossil and measurement evidence to ask whether whales are shrinking or being hunted out.",
  "classroom-second-anchor-chapter-106-ahab-s-leg": "Ahab's missing leg keeps his injury and obsession physically present in the scene.",
  "whole-book-density-chapter-106-ahab-s-leg-3": "Ahab's missing leg keeps his injury and obsession physically present in the scene.",
  "whole-book-density-chapter-107-the-carpenter-3": "The carpenter is a practical fixer who treats ship and body as things to repair.",
  "whole-book-density-chapter-108-ahab-and-the-carpenter-3": "Fitting Ahab's leg turns repair into a scene about how fragile and mechanical his power is.",
  "classroom-second-anchor-chapter-109-ahab-and-starbuck-in-the-cabin": "Starbuck's oil complaint gives him a moral opening against Ahab, and the cabin scene pits duty against revenge.",
  "whole-book-density-chapter-109-ahab-and-starbuck-in-the-cabin-3": "Starbuck's oil complaint gives him a moral opening against Ahab, and the cabin scene pits duty against revenge.",
  "classroom-second-anchor-chapter-110-queequeg-in-his-coffin": "Queequeg's coffin changes from burial object to something the ship can use, which makes the chapter uncanny.",
  "whole-book-density-chapter-110-queequeg-in-his-coffin-3": "Queequeg's coffin changes from burial object to something the ship can use, which makes the chapter uncanny.",
  "whole-book-density-chapter-112-the-blacksmith-3": "Perth's skill matters because the chapter shows a broken man still shaping useful work.",
  "whole-book-density-chapter-113-the-forge-3": "Ahab's custom harpoon turns revenge into a forged object, weaponizing shipboard labor."
}));

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
const missing = [];
let updated = 0;

for (const [id, note] of replacements) {
  const annotation = data.annotations.find((item) => item.id === id);
  if (!annotation) {
    missing.push(id);
    continue;
  }
  annotation.note = note;
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:subagent-quality-repair"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, missing }, null, 2));
