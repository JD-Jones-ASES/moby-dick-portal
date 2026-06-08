import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "classroom-second-anchor-chapter-055-of-the-monstrous-pictures-of-whales": "Ishmael attacks bad whale pictures because false images shape false knowledge. The chapter teaches students to ask who has actually seen the thing being represented.",
  "classroom-second-anchor-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes": "Ishmael prefers whale pictures that show bodies in motion and labor in context. Accuracy here means catching an animal at sea, not freezing it into a diagram.",
  "classroom-second-anchor-chapter-068-the-blanket": "Calling blubber both skin and blanket makes whale anatomy hard to file under one category. Ishmael's joke helps students see classification becoming unstable.",
  "classroom-second-anchor-chapter-074-the-sperm-whale-s-head-contrasted-view": "The paired heads turn anatomy into comparison. Ishmael wants students to learn by contrast: shape, mouth, and use make each whale legible in a different way.",
  "classroom-second-anchor-chapter-075-the-right-whale-s-head-contrasted-view": "The right whale's mouth changes the whole lesson. Ishmael's anatomy is practical because feeding, hunting, and naming all depend on bodily form.",
  "classroom-second-anchor-chapter-083-jonah-historically-regarded": "Ishmael handles Jonah like a courtroom problem, stacking objections and answers. The result is comic because sacred story is treated as evidence to be argued over.",
  "classroom-second-anchor-chapter-085-the-fountain": "The spout chapter turns a familiar whale sign into a question. Ishmael keeps circling the limits of observation: everyone sees the fountain, but no one fully explains it.",
  "classroom-second-anchor-chapter-086-the-tail": "The tail chapter studies power through shape and motion. Ishmael's close description makes the whale's force physical before it becomes symbolic.",
  "classroom-second-anchor-chapter-102-a-bower-in-the-arsacides": "The Arsacides skeleton gives Ishmael a spectacular credential, but it also shows how little bones can tell us about a living whale.",
  "classroom-second-anchor-chapter-103-measurement-of-the-whale-s-skeleton": "Exact measurement makes the skeleton impressive and inadequate at the same time. Ishmael's numbers help students feel scale without pretending to exhaust it.",
  "classroom-second-anchor-chapter-104-the-fossil-whale": "The fossil chapter pulls whale knowledge into deep time. Ishmael's grand vocabulary is part science lesson, part comic inflation.",
  "classroom-second-anchor-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish": "Ishmael's extinction question links whaling records, fossil evidence, and speculation. The chapter matters because the whale becomes historical, not merely huge."
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
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:hand-polished"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, missing }, null, 2));
