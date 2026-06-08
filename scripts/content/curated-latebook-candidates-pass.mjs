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
  if (/chapter-09[2-489]|chapter-102|chapter-103|chapter-104|chapter-105|chapter-117|chapter-126|chapter-135|epilogue/.test(unitId)) return "trail:biblical-classical-allusion";
  if (/chapter-096|chapter-097|chapter-098|chapter-113|chapter-123/.test(unitId)) return "trail:whaling-labor";
  if (/chapter-111/.test(unitId)) return "trail:symbols-prophecy";
  if (/chapter-121/.test(unitId)) return "trail:theater-form-experiments";
  if (/chapter-129/.test(unitId)) return "trail:ahab-starbuck";
  if (kind === "difficult-material") return "trail:race-empire-global-crew";
  return null;
}

const candidates = [
  ["chapter-092-ambergris", "Brandreth’s pills", "context", "This patent-medicine joke makes whale dyspepsia feel period-specific. Melville is mixing bodily disgust, commerce, and popular medicine satire."],
  ["chapter-092-ambergris", "that saying of St. Paul in Corinthians", "context", "The chapter ties corruption and incorruption to a biblical resurrection pattern. That allusion gives the ambergris joke a theological edge."],
  ["chapter-092-ambergris", "Schmerenburgh or Smeerenberg", "context", "This Dutch whaling settlement helps explain why whale smell became a historical stereotype. The joke depends on older whale-processing geography."],
  ["chapter-093-the-castaway", "ship-keepers", "context", "Ship-keepers are the crew left aboard while boats chase whales. The labor role matters because Pip's trauma begins inside an ordinary work assignment."],
  ["chapter-093-the-castaway", "For blacks, the year’s calendar", "difficult-material", "This is a racist nineteenth-century generalization, not neutral description. Students should separate Pip's character from the narrator's biased framing."],
  ["chapter-094-a-squeeze-of-the-hand", "whitehorse", "context", "Whitehorse is whaling vocabulary for a strip of blubber from the flukes. The term keeps the chapter's ecstatic mood attached to bodily processing work."],
  ["chapter-094-a-squeeze-of-the-hand", "Constantine’s bath", "context", "The tub name shows how whaling work develops its own jargon and jokes. The scene is technical as well as sensual."],
  ["chapter-096-the-try-works", "Greek fire", "context", "Greek fire was an ancient incendiary weapon. The comparison makes the try-works blaze feel historical, military, and frightening."],
  ["chapter-096-the-try-works", "the only true lamp", "theme", "Melville contrasts natural light with the deceptive glare of human-made fire. The claim helps turn the chapter from shipboard episode into moral vision."],
  ["chapter-097-the-lamp", "Aladdin’s lamp", "context", "The fairy-tale image turns whale oil into magical domestic comfort. It helps students see the strange intimacy of living by the product of the hunt."],
  ["chapter-098-stowing-down-and-clearing-up", "Shadrach, Meshach, and Abednego", "context", "The biblical trio survives a furnace, which fits a chapter about oil passing through fire. The allusion makes cleanup feel comic and sacred at once."],
  ["chapter-098-stowing-down-and-clearing-up", "metempsychosis", "theme", "Metempsychosis means transmigration of souls. The term keeps the chapter's joking philosophy about matter, fire, and change in view."],
  ["chapter-099-the-doubloon", "Belshazzar’s awful writing", "context", "Ahab reads the coin like a biblical warning written on a wall. The allusion sharpens the chapter's sense of interpretation under judgment."],
  ["chapter-102-a-bower-in-the-arsacides", "the hair-hung sword that so affrighted Damocles", "context", "The whale jaw hangs like Damocles' sword, a symbol of danger suspended over power. The image makes the temple scene feel precarious."],
  ["chapter-103-measurement-of-the-whale-s-skeleton", "Pompey’s Pillar", "context", "A monumental Roman column gives the whale spine a familiar scale comparison. Melville measures the skeleton through human architecture."],
  ["chapter-104-the-fossil-whale", "Basilosaurus", "context", "The fossil name was first attached to a creature mistaken for a reptile. The example shows how whale bones can mislead scientific observers."],
  ["chapter-104-the-fossil-whale", "Denderah", "context", "The Egyptian temple reference expands the chapter from geology into ancient visual culture. Ishmael is building whale antiquity across many kinds of evidence."],
  ["chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish", "Pliny", "context", "Melville invokes a classical authority to test old whale exaggerations. The extinction argument depends partly on inherited claims about size."],
  ["chapter-111-the-pacific", "Potters’ Fields", "context", "The Pacific becomes a burial ground, not only a peaceful ocean. The allusion qualifies the chapter's calm with graveyard imagery."],
  ["chapter-113-the-forge", "Mother Carey’s chickens", "context", "Sailors treated these sea-birds as weather omens. The forge scene's sparks and birds carry a storm-warning atmosphere."],
  ["chapter-116-the-dying-whale", "the dark Hindu half of nature", "difficult-material", "The cosmic image is vivid, but it leans on racialized and religious personification. Students should notice the loaded language inside the sunset scene."],
  ["chapter-117-the-whale-watch", "Asphaltites", "context", "Asphaltites is the Dead Sea, so the simile pulls the prophecy toward biblical ruin. The place-name makes Fedallah's hearse language darker."],
  ["chapter-121-midnight-the-forecastle-bulwarks", "Marine Insurance companies", "context", "Stubb's joke points to the real business of pricing risk at sea. The banter is comic, but it rests on maritime commerce."],
  ["chapter-123-the-musket", "preventer tackles", "context", "Preventer tackles are extra rigging used to secure the tiller in dangerous conditions. The technical detail helps students follow the storm crisis."],
  ["chapter-126-the-life-buoy", "Herod’s murdered Innocents", "context", "The eerie cry is likened to a biblical massacre of children. The allusion deepens the chapter's atmosphere of warning and loss."],
  ["chapter-129-the-cabin", "Like cures like", "context", "Ahab borrows older medical logic to explain why Pip calms him. The phrase helps students understand the strange emotional medicine of the scene."],
  ["chapter-135-the-chase-third-day", "summerhouse to the angels", "context", "Ahab briefly imagines creation as bright and welcoming. The final chase is harsher because this Eden-like image appears and vanishes."],
  ["epilogue-epilogue", "the devious-cruising Rachel", "context", "The rescue ship's name and search mission turn the ending toward family grief and lost children. Ishmael survives inside another ship's failed rescue story."]
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
  const id = `curated-latebook-${slug(unitId)}-${slug(anchor).slice(0, 32)}`;
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
      depth: "study",
      priority: kind === "difficult-material" ? 2 : 3,
      inline: true,
      surfaces: kind === "difficult-material" ? ["reader", "index", "review", "teacher"] : ["reader", "trail", "index", "search"],
      spoiler_level: unit.number && unit.number >= 128 ? "major" : "none"
    },
    anchor,
    note,
    tags: [
      `kind:${kind}`,
      kind === "difficult-material" ? "review:difficult-material" : kind === "context" ? "layer:context" : "layer:theme",
      ...(trailTag ? [trailTag] : [])
    ],
    relationships: [
      ...(trailTag?.startsWith("trail:") ? [{ type: "belongs-to-trail", target: trailTag }] : []),
      { type: "uses-source", target: "source:standard-ebooks-moby-dick" }
    ],
    evidence: [
      {
        claim_type: kind === "difficult-material" ? "difficult-material" : kind === "context" ? "source-text-observation" : "interpretive",
        citations: ["standard-ebooks-moby-dick"],
        validation: kind === "difficult-material" ? ["selector-resolves", "needs-review", "tone-review"] : ["selector-resolves", "needs-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: today,
      method: "source-checked-draft"
    },
    status: {
      content_status: kind === "difficult-material" ? "needs-review" : "draft",
      citation_status: "provisional",
      review_queue: kind === "difficult-material" ? ["citation", "difficult-material", "source-check", "tone"] : ["citation", "source-check", ...(kind === "theme" ? ["interpretive"] : [])]
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

console.log(`Added ${added} curated latebook annotations; annotations now has ${annotations.annotations.length}.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} curated latebook candidates:`);
  for (const item of skipped) console.warn(`- ${item}`);
}
