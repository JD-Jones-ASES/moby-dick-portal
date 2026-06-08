import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "classroom-second-anchor-chapter-036-the-quarterdeck": "Ahab turns the quarterdeck into an oath scene, shifting the voyage from routine labor to revenge.",
  "classroom-second-anchor-chapter-041-moby-dick": "Ishmael shows that Ahab's obsession spreads through stories about the whale before the whale is even seen.",
  "whole-book-density-chapter-041-moby-dick-3": "This later reference keeps the whale offstage and lets rumor do the work of menace.",
  "classroom-second-anchor-chapter-042-the-whiteness-of-the-whale": "Ishmael is testing why whiteness can feel terrifying instead of pure or simple.",
  "whole-book-density-chapter-042-the-whiteness-of-the-whale-3": "The chapter keeps widening what whiteness can suggest, from blankness to dread.",
  "classroom-second-anchor-chapter-045-the-affidavit": "Ishmael is making a case for whale power by piling up evidence like a legal argument.",
  "classroom-second-anchor-chapter-047-the-mat-maker": "The mat-weaving scene folds quiet shipboard labor into Ishmael's larger fate thinking.",
  "whole-book-density-chapter-047-the-mat-maker-3": "The calm deck-work matters because it lets Ishmael turn ordinary weaving into a sign of drift and fate.",
  "classroom-second-anchor-chapter-051-the-spirit-spout": "The spout stays uncertain: natural sign, omen, or illusion, and that uncertainty keeps the crew tense.",
  "whole-book-density-chapter-051-the-spirit-spout-3": "This later glimpse repeats the uncertainty without confirming what the crew saw.",
  "whole-book-density-chapter-053-the-gam-3": "A gam is a meeting between whaling ships, and it is how news and warnings move at sea.",
  "whole-book-density-chapter-055-of-the-monstrous-pictures-of-whales-3": "Ishmael is arguing that pictures matter because a bad image can teach a bad idea.",
  "whole-book-density-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes-3": "Ishmael prefers images that show motion and scale, not stiff diagrams that flatten the whale.",
  "whole-book-density-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars-2": "Ishmael is tracing how whale imagery spreads into art, landscape, and everyday objects.",
  "whole-book-density-chapter-058-brit-2": "Brit is whale food, and the image turns the open sea into a living feeding ground.",
  "whole-book-density-chapter-059-squid-2": "The squid is a false alarm that briefly makes the crew think they have found the whale.",
  "whole-book-density-chapter-060-the-line-3": "The whale-line matters because once it runs, it can drag the whole boat and crew with it.",
  "whole-book-density-chapter-061-stubb-kills-a-whale-3": "Stubb's calm confidence stands beside the whale's vulnerability and the brutal work of the kill.",
  "whole-book-density-chapter-062-the-dart-2": "The dart sequence shows how a harpooneer has to row, aim, and strike at once.",
  "whole-book-density-chapter-063-the-crotch-2": "The crotch is the bow rest for the harpoon, and Melville uses it to show how the gear can turn dangerous.",
  "whole-book-density-chapter-065-the-whale-as-a-dish-2": "Ishmael pushes past squeamishness and asks why whale meat feels stranger than other meat.",
  "whole-book-density-chapter-066-the-shark-massacre-2": "The sharks turn the kill into a battle over who gets the whale's body.",
  "whole-book-density-chapter-067-cutting-in-3": "Cutting-in is butchery at sea: technical, dirty, and dangerous work.",
  "whole-book-density-chapter-069-the-funeral-2": "The stripped carcass drifts away like a grim afterimage of the hunt.",
  "whole-book-density-chapter-070-the-sphynx-3": "Ahab tries to read the whale head as if it could answer him, but the scene stays unreadable.",
  "whole-book-density-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him-2": "The joke works because the whale's body keeps sliding between work, superstition, and talk.",
  "whole-book-density-chapter-074-the-sperm-whale-s-head-contrasted-view-3": "By comparing the two heads, Ishmael shows how shape changes use.",
  "whole-book-density-chapter-076-the-battering-ram-2": "The battering-ram image makes the whale's head feel built for force rather than delicacy.",
  "whole-book-density-chapter-077-the-great-heidelburgh-tun-2": "The tun comparison turns anatomy into storage and makes the whale's head feel industrial.",
  "whole-book-density-chapter-079-the-prairie-2": "Ishmael is trying to read the whale's face, but the chapter keeps rejecting easy physiognomy.",
  "whole-book-density-chapter-080-the-nut-2": "The tiny brain and huge spinal cord make the whale's body resist human ideas of proportion."
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
