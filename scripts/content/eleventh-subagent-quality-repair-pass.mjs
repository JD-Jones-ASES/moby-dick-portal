import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "titlepage-edition-frame": "The title page names Melville and frames the text as a standard edition.",
  "teacher-review-frontmatter-imprint": "The imprint shows where the text came from and how the edition was assembled.",
  "classroom-second-anchor-frontmatter-etymology": "The etymology turns whale language into a comic setup before the story starts.",
  "teacher-review-frontmatter-etymology": "The etymology makes whale scholarship look unstable and half-serious.",
  "classroom-second-anchor-frontmatter-extracts": "The extracts open the novel as a collage of whale-writing from many sources.",
  "classroom-second-anchor-chapter-001-loomings": "Ishmael explains why he leaves land and goes to sea.",
  "classroom-second-anchor-chapter-002-the-carpetbag": "A bare carpetbag keeps Ishmael's departure small, poor, and lonely.",
  "teacher-review-chapter-004-the-counterpane": "The bedspread triggers a childhood memory of fear, touch, and comfort.",
  "classroom-second-anchor-chapter-005-breakfast": "Breakfast makes the whalemen seem ordinary, awkward, and human.",
  "teacher-review-chapter-005-breakfast": "The breakfast room turns rough sailors into quiet hotel guests.",
  "classroom-second-anchor-chapter-006-the-street": "New Bedford feels like a whaling town shaped by trade, money, and strangeness.",
  "teacher-review-chapter-006-the-street": "The street chapter makes the town itself feel unfamiliar and economically charged.",
  "teacher-review-chapter-015-chowder": "The chowder chapter uses food to introduce Nantucket's whaling culture.",
  "classroom-second-anchor-chapter-017-the-ramadan": "Ishmael mistakes Queequeg's fast because he does not understand it yet.",
  "classroom-second-anchor-chapter-018-his-mark": "Queequeg's mark turns friendship, trust, and labor into one act.",
  "classroom-second-anchor-chapter-019-the-prophet": "Elijah's warning makes the voyage feel haunted before Ahab appears.",
  "classroom-second-anchor-chapter-020-all-astir": "The Pequod is being readied for departure while Ahab stays offstage.",
  "classroom-second-anchor-chapter-021-going-aboard": "Ishmael and Queequeg board in darkness, with Elijah's warning still hanging over them.",
  "teacher-review-chapter-021-going-aboard": "The boarding scene keeps the ship half-seen and morally unsettled.",
  "classroom-second-anchor-chapter-022-merry-christmas": "The Pequod leaves Nantucket on Christmas Day under hard weather and harder command.",
  "classroom-second-anchor-chapter-023-the-lee-shore": "Bulkington's brief appearance reads like a warning against false safety on shore.",
  "classroom-second-anchor-chapter-026-knights-and-squires": "Starbuck and the mates are introduced as a working hierarchy, not heroic types.",
  "classroom-second-anchor-chapter-027-knights-and-squires": "Stubb, Flask, and the harpooneers widen the crew map and deepen the shipboard order.",
  "classroom-second-anchor-chapter-028-ahab": "Ahab is introduced through his injury, silence, and authority.",
  "classroom-second-anchor-chapter-030-the-pipe": "Ahab gives up smoking because ordinary comfort no longer fits his obsession.",
  "classroom-second-anchor-chapter-032-cetology": "Cetology is Ishmael's comic attempt to classify whales without pretending to master them.",
  "classroom-second-anchor-chapter-033-the-specksnyder": "Ishmael pauses over a technical rank to show that whaling has its own labor order.",
  "classroom-second-anchor-chapter-034-the-cabin-table": "The cabin table scene makes rank visible through who sits, serves, and waits.",
  "classroom-second-anchor-chapter-035-the-masthead": "The masthead turns lookout duty into a study of attention, drift, and danger."
}));

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
let updated = 0;
const missing = [];

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
