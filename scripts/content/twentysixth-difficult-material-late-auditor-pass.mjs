import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "castaway-pip-trauma": "Pip is abandoned at sea, and the chapter shows how that loss isolates and unsettles him. Treat his speech and behavior as signs of serious distress, not comic oddity.",
  "difficult-review-chapter-098-stowing-down-and-clearing-up": "The chapter shows the whale being cut up and the deck running with blood and oil. Keep the focus on the labor and the killing, not on a vague warning about violence.",
  "difficult-review-chapter-100-leg-and-arm": "This passage keeps Ahab's missing leg and pain in view. Name the bodily damage directly instead of folding it into a general violence note.",
  "difficult-review-chapter-101-the-decanter": "Here `savage` is a metaphor for the sea spray and weather, not a label for people. Explain the figurative language and the hostile mood it creates.",
  "arsacides-ethnographic-frame": "Ishmael explains the whale skeleton while describing local people through colonial assumptions. Keep both parts visible: the natural history lesson and the bias in the framing.",
  "difficult-review-chapter-117-the-whale-watch": "The scene lingers on sharks feeding around the whale. Name the dead animal and the feeding directly instead of just calling it violence.",
  "log-and-line-pip-truth": "Pip's speech here reflects abandonment and serious psychological strain. Keep the note plain and avoid making his distress sound comic or mysterious.",
  "difficult-review-chapter-130-the-hat": "This is figurative language about seabirds, not a racial label for people. Point students to the aggressive image rather than a human category.",
  "difficult-review-chapter-131-the-pequod-meets-the-delight": "The chapter shows the damage left by the whale hunt, with blood and injury in the water. Keep the note concrete and avoid vague risk language.",
  "difficult-review-chapter-133-the-chase-first-day": "The first chase day shows the physical cost of the hunt in blood and injury. State that plainly instead of using abstract language.",
  "difficult-review-chapter-134-the-chase-second-day": "The second chase day continues the pursuit with heavy bodily danger and damage. Keep the note on the chase and its consequences, not on a broad label.",
  "difficult-review-chapter-135-the-chase-third-day": "The final chase ends in wreckage and death. Say that directly and avoid replacing it with a blanket savage note."
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
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:difficult-material-subagent-polished"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, missing }, null, 2));
