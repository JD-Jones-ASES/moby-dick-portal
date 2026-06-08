import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const today = "2026-06-07";
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");

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

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function words(value) {
  return value.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function anchorsOverlap(a, b) {
  const aWords = words(a);
  const bWords = words(b);
  if (!aWords.length || !bWords.length) return false;
  const aText = aWords.join(" ");
  const bText = bWords.join(" ");
  if (aText.startsWith(bText) || bText.startsWith(aText)) return true;
  const grams = new Set();
  for (let index = 0; index <= aWords.length - 3; index += 1) grams.add(aWords.slice(index, index + 3).join(" "));
  for (let index = 0; index <= bWords.length - 3; index += 1) {
    if (grams.has(bWords.slice(index, index + 3).join(" "))) return true;
  }
  return false;
}

function overlapsAny(anchor, anchors) {
  return [...anchors].some((existing) => anchorsOverlap(anchor, existing));
}

function trailFor(unitId, kind) {
  if (/chapter-05[2-4]|chapter-081|chapter-090/.test(unitId)) return "trail:gams-foreshadowing";
  if (/chapter-05[5-8]|chapter-06[8-9]|chapter-07[04579]|chapter-08[0235]/.test(unitId)) return "trail:cetology-classification";
  if (/chapter-06[023467]|chapter-072|chapter-084/.test(unitId)) return "trail:whaling-labor";
  if (/chapter-089/.test(unitId)) return "trail:law-property-politics";
  if (/chapter-083/.test(unitId)) return "trail:biblical-classical-allusion";
  if (kind === "theme") return "trail:symbols-prophecy";
  return null;
}

const candidates = [
  ["chapter-050-ahab-s-boat-and-crew-fedallah", "Among whale-wise people it has often been argued whether", "context", "This passage frames a practical whaling debate: whether a captain should risk himself in the boat. That background makes Ahab's overcommitment feel professionally dangerous, not only emotionally intense."],
  ["chapter-051-the-spirit-spout", "some plumed and glittering god uprising from the sea", "context", "The crew reads the sight as an omen before it can be treated as ordinary whale sign. The chapter turns perception itself into part of the voyage's danger."],
  ["chapter-053-the-gam", "the peculiar usages of whaling-vessels when meeting each other in foreign seas", "context", "A gam is a customary ship-to-ship visit among whalers, not a random pause. It is how news, warnings, and social obligation travel at sea."],
  ["chapter-054-the-town-ho-s-story", "the secret part of the tragedy", "form", "The Town-Ho episode is a story-within-a-story built around delayed disclosure. Melville makes withheld knowledge part of the chapter's suspense."],
  ["chapter-055-of-the-monstrous-pictures-of-whales", "pictures of the whale all wrong", "form", "Ishmael is arguing against inherited images, not simply describing whales. The chapter works like a corrective essay about bad evidence."],
  ["chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes", "certain books, both ancient and modern, especially in Pliny, Purchas, Hackluyt, Harris, Cuvier, etc.", "context", "The chapter becomes a source-checking tour through older whale authorities. Students can read it as scholarship under pressure, not only as a list of names."],
  ["chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars", "the tragic scene in which he lost his leg", "context", "This image turns a whaleman's injury into public display. The moment links labor injury, spectacle, and whaling lore."],
  ["chapter-060-the-line", "the magical, sometimes horrible whale-line", "context", "The whale-line is essential gear and a deadly hazard. Melville makes an ordinary rope carry the whole risk of the chase."],
  ["chapter-062-the-dart", "the harpooneer is expected to pull his oar meanwhile to the uttermost", "context", "The first strike overloads the harpooneer with rowing, timing, and throwing. The chapter turns heroic action back into bodily labor."],
  ["chapter-063-the-crotch", "a notched stick of a peculiar form", "context", "The crotch is boat hardware that keeps the harpoon ready. Naming it helps students see how much whaling depends on prepared tools."],
  ["chapter-067-cutting-in", "Ex officio professors of Sabbath breaking are all whalemen", "form", "The sentence jokes that whaling work can turn Sunday into another labor day. The chapter uses satire to pressure ordinary religious categories."],
  ["chapter-068-the-blanket", "I use for marks in my whale-books", "context", "Ishmael studies whales with specimens and notes, not only with books. The detail makes his research practical and hands-on."],
  ["chapter-069-the-funeral", "vultureism of earth", "theme", "The whale's body becomes a feast for scavengers rather than a dignified burial. The chapter keeps profit, waste, and death in the same frame."],
  ["chapter-070-the-sphynx", "scientific anatomical feat", "context", "The beheading is described as an anatomical operation. The note helps students follow the surgical precision inside the whaling labor."],
  ["chapter-072-the-monkey-rope", "the monkey-rope", "theme", "The rope makes Ishmael and Queequeg physically dependent on each other. It is one of the book's strongest images of shared risk."],
  ["chapter-074-the-sperm-whale-s-head-contrasted-view", "where, I should like to know, will you obtain a better chance to study practical cetology than here?", "form", "The suspended whale heads become a live classroom. Ishmael turns the deck into a comparative cetology demonstration."],
  ["chapter-075-the-right-whale-s-head-contrasted-view", "this green, barnacled thing", "context", "The chapter's local names and visual details belong to whalemen's practical vocabulary. The right whale head is being translated for non-specialists."],
  ["chapter-077-the-great-heidelburgh-tun", "the great Heidelburgh Tun of the Sperm Whale", "context", "Melville compares the whale's oil chamber to a famous enormous wine cask. The joke makes anatomy memorable through cultural analogy."],
  ["chapter-079-the-prairie", "Lavater not only treats of the various faces of men", "teacher-note", "Teacher review: this chapter invokes physiognomy and related body-reading habits, now discredited ways of linking bodies to character. Flag the historical context before students treat the method as neutral."],
  ["chapter-080-the-nut", "The whale, like all things that are mighty, wears a false brow to the common world.", "theme", "Melville keeps contrasting outward form with hidden intelligence and interior power. The whale's surface becomes a problem of interpretation."],
  ["chapter-082-the-honor-and-glory-of-whaling", "the first whale attacked by our brotherhood was not killed with any sordid intent", "context", "The chapter uses myth to recast whaling as heroic rather than merely commercial. That classical frame is part of Ishmael's defense of the trade."],
  ["chapter-083-jonah-historically-regarded", "two spouts in his head", "context", "Ishmael tests the Jonah story against whalemen's anatomical knowledge. The chapter stages a debate between scripture, observation, and comic literalism."],
  ["chapter-084-pitchpoling", "It became imperative to lance the flying whale, or be content to lose him", "context", "Pitchpoling answers a practical problem: how to strike a whale moving too fast for ordinary approach. The technique makes chase speed visible."],
  ["chapter-085-the-fountain", "the whale can only live by inhaling the disengaged air in the open atmosphere", "context", "The chapter tries to solve the physiology behind the whale's breath and spout. It turns a visible spray into a scientific question."],
  ["chapter-089-fast-fish-and-loose-fish", "A Fast-Fish belongs to the party fast to it. A Loose-Fish is fair game for anybody who can soonest catch it.", "theme", "This rule turns whaling into a blunt theory of ownership and power. Ishmael uses technical custom as political argument."],
  ["chapter-090-heads-or-tails", "the Queen be respectfully presented with the tail", "context", "The joke depends on royal privilege rather than whale nature. The chapter turns legal custom into comic anatomy."]
];

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const annotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const anchorsByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!anchorsByUnit.has(annotation.unit_id)) anchorsByUnit.set(annotation.unit_id, new Set());
  anchorsByUnit.get(annotation.unit_id).add(annotation.anchor);
}

let added = 0;
const skipped = [];

for (const [unitId, anchor, kind, note] of candidates) {
  const unit = unitsById.get(unitId);
  const id = `curated-midbook-${slug(unitId)}-${slug(anchor).slice(0, 32)}`;
  if (!unit?.plain_text.includes(anchor)) {
    skipped.push(`${id}: anchor not found`);
    continue;
  }
  const anchors = anchorsByUnit.get(unitId) ?? new Set();
  if (overlapsAny(anchor, anchors)) {
    skipped.push(`${id}: overlaps existing anchor`);
    continue;
  }
  if (annotationIds.has(id)) continue;
  const trailTag = trailFor(unitId, kind);
  annotations.annotations.push({
    id,
    unit_id: unitId,
    kind,
    selector: { type: "TextQuoteSelector", exact: anchor },
    display: {
      depth: kind === "teacher-note" ? "teacher" : "study",
      priority: kind === "teacher-note" ? 3 : 3,
      inline: kind !== "teacher-note",
      surfaces: kind === "teacher-note" ? ["teacher", "review"] : ["reader", "trail", "index", "search"],
      spoiler_level: "none"
    },
    anchor,
    note,
    tags: [
      `kind:${kind}`,
      kind === "teacher-note" ? "teacher:review-hook" : kind === "form" ? "layer:form" : kind === "context" ? "layer:context" : "layer:theme",
      ...(trailTag ? [trailTag] : [])
    ],
    relationships: [
      ...(trailTag?.startsWith("trail:") ? [{ type: "belongs-to-trail", target: trailTag }] : []),
      { type: "uses-source", target: "source:standard-ebooks-moby-dick" }
    ],
    evidence: [
      {
        claim_type: kind === "context" ? "source-text-observation" : "interpretive",
        citations: ["standard-ebooks-moby-dick"],
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: today,
      method: "source-checked-draft"
    },
    status: {
      content_status: "draft",
      citation_status: "provisional",
      review_queue: kind === "teacher-note" ? ["citation", "interpretive", "source-check", "teacher"] : ["citation", "source-check", ...(kind === "form" || kind === "theme" ? ["interpretive"] : [])]
    }
  });
  annotationIds.add(id);
  anchors.add(anchor);
  anchorsByUnit.set(unitId, anchors);
  added += 1;
}

annotations.annotations.sort((a, b) => {
  const aUnit = unitsById.get(a.unit_id);
  const bUnit = unitsById.get(b.unit_id);
  return (aUnit?.sequence ?? 9999) - (bUnit?.sequence ?? 9999) || a.id.localeCompare(b.id);
});

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify({ annotations: annotations.annotations }, null, 2))}\n`);

console.log(`Added ${added} curated midbook annotations; annotations now has ${annotations.annotations.length}.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} curated midbook candidates:`);
  for (const item of skipped) console.warn(`- ${item}`);
}
