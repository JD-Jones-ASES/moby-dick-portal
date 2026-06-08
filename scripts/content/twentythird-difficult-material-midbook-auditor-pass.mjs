import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "difficult-review-chapter-046-surmises": "Melville uses `savage` as a racializing insult here. Flag it as colonial-era prejudice, not a neutral description.",
  "difficult-review-chapter-047-the-mat-maker": "The word `savage` is doing racial work in this sentence, turning a person into a stereotype. Students should read it as hostile period language.",
  "first-lowering-fedallah-reveal": "Fedallah and his crew are introduced through racialized spectacle and mystery. Note that the scene leans on exoticizing stereotypes.",
  "difficult-review-chapter-051-the-spirit-spout": "The word `savage` again carries colonial contempt. Name it as demeaning period language, not a factual label.",
  "difficult-review-chapter-052-the-albatross": "Melville uses `insane` in a stigmatizing nineteenth-century sense. Make clear that this is period language, not a clinical diagnosis.",
  "difficult-review-chapter-053-the-gam": "The comparison to slave ships brings slavery into the chapter's moral frame. Flag the reference as historical violence and coercion, not casual metaphor.",
  "difficult-review-chapter-054-the-town-ho-s-story": "The word `savage` here reflects colonial ideas about who counts as civilized. Note the prejudice in the contrast.",
  "difficult-review-chapter-055-of-the-monstrous-pictures-of-whales": "The description borrows `savage` language for animals, which still carries racist colonial baggage. Point out that the term is loaded even when applied metaphorically.",
  "difficult-review-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars": "The phrase `King of the Cannibals` turns non-European people into a spectacle. Note the colonial caricature behind the joke.",
  "difficult-review-chapter-058-brit": "The simile uses `savage` to intensify motion, but the word still carries racial and colonial baggage. Students should see the insult-language in the comparison.",
  "difficult-review-chapter-059-squid": "The word `negro` is used as a racial label in a way that reflects nineteenth-century hierarchy. Mark it as outdated and demeaning language.",
  "stubbs-supper-fleece": "Fleece is made part of Stubb's joke, and the humor depends on Black dialect caricature and unequal power. The note should say that plainly.",
  "difficult-review-chapter-065-the-whale-as-a-dish": "The word `cannibal` is used as a stereotype, not a neutral description. Flag the colonial baggage and keep the insult visible.",
  "difficult-review-chapter-067-cutting-in": "This is a direct description of cutting up a whale carcass, with blood, knives, and heavy labor. Keep it plain and avoid turning it into spectacle.",
  "difficult-review-chapter-068-the-blanket": "The word `negro` is used casually, but the term carries racial hierarchy and demeaning force. Flag that language directly.",
  "difficult-review-chapter-071-the-jeroboam-s-story": "Melville uses `insanity` as a stigmatizing period term for the captain's behavior. Note the nineteenth-century language without importing a modern diagnosis.",
  "difficult-review-chapter-072-the-monkey-rope": "Stubb's `cannibal` joke reduces Queequeg to a stereotype. The guide should say that the insult is racist shorthand, not a neutral comment.",
  "difficult-review-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him": "Here `mad` means reckless or unbalanced in nineteenth-century usage. Explain the period word without treating it as a clinical judgment.",
  "difficult-review-chapter-078-cistern-and-buckets": "The word `negro` is used in a way that carries racial hierarchy and demeaning force. Flag that language directly.",
  "difficult-review-chapter-081-the-pequod-meets-the-virgin": "Melville uses `mad` as a period insult for panic and instability. The note should separate that older usage from modern mental-health language.",
  "difficult-review-chapter-087-the-grand-armada": "The word `mad` here describes confusion and alarm in period language, not a diagnosis. Keep the stigma visible and avoid modernizing it away.",
  "difficult-review-chapter-089-fast-fish-and-loose-fish": "The `Fast-Fish and Loose-Fish` analogy reaches into property and slavery logic. Note that the comparison is about ownership, coercion, and who gets to claim people or things."
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
