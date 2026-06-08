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
  if (/chapter-001|chapter-009|chapter-010|chapter-012|chapter-037|chapter-039/.test(unitId)) return "trail:biblical-classical-allusion";
  if (/chapter-006|chapter-041|chapter-044/.test(unitId)) return "trail:race-empire-global-crew";
  if (/chapter-015|chapter-016|chapter-023|chapter-033|chapter-034/.test(unitId)) return "trail:whaling-labor";
  if (/chapter-017/.test(unitId)) return "trail:ishmael-queequeg";
  if (/chapter-029|chapter-030|chapter-031/.test(unitId)) return "trail:ahab-starbuck";
  if (/chapter-040|chapter-043/.test(unitId)) return "trail:theater-form-experiments";
  if (kind === "difficult-material") return "trail:race-empire-global-crew";
  return null;
}

const candidates = [
  ["chapter-001-loomings", "It is a way I have of driving off the spleen", "context", "`Spleen` means melancholy here, so Ishmael is naming a low, agitated state rather than simple boredom."],
  ["chapter-001-loomings", "Cato throws himself upon his sword", "context", "The classical suicide image shows how Ishmael frames going to sea as an alternative to self-destruction."],
  ["chapter-002-the-carpetbag", "the Tyre of this Carthage", "context", "Melville compares whaling ports to ancient trading powers, lifting New Bedford and Nantucket into imperial scale."],
  ["chapter-006-the-street", "Regent Street is not unknown to Lascars and Malays", "context", "New Bedford is being compared to global port cities. The whaling town is provincial and international at the same time."],
  ["chapter-009-the-sermon", "five hundred gold coins", "context", "Jonah is treated like a wanted criminal, which turns the sermon into comic legal theater as well as moral warning."],
  ["chapter-010-a-bosom-friend", "phrenologically an excellent one", "context", "Ishmael's praise still uses phrenology, a now-discredited way of reading character from body shape."],
  ["chapter-012-biographical", "Czar Peter", "context", "Queequeg is compared to Peter the Great, who learned by working among shipbuilders. The allusion links royal identity with practical labor."],
  ["chapter-013-wheelbarrow", "a slave before the Sultan", "difficult-material", "Read this as a period simile, not neutral description. The phrase borrows imperial and slavery imagery to intensify a comic scene."],
  ["chapter-015-chowder", "Try Pots", "context", "The inn name is a pun on whale-processing try-pots, so food and whaling labor are linked before the meal begins."],
  ["chapter-016-the-ship", "Yojo earnestly enjoined", "context", "Queequeg's god is treated as an authority in a real decision, not just comic decoration."],
  ["chapter-017-the-ramadan", "Presbyterians and Pagans alike", "context", "Ishmael's blessing pushes the book toward religious inclusiveness instead of tribal certainty."],
  ["chapter-023-the-lee-shore", "one touch of land", "context", "In seamanship, a lee shore can be deadly. Land becomes a hazard rather than comfort."],
  ["chapter-029-enter-ahab-to-him-stubb", "his eyes like powder-pans", "context", "Stubb reads Ahab's eyes like explosive gear, making the captain's mood feel dangerous and unstable."],
  ["chapter-030-the-pipe", "my pipe! hard must it go with me if thy charm be gone!", "theme", "Ahab giving up the pipe shows ordinary comfort and routine being stripped away by obsession."],
  ["chapter-031-queen-mab", "a living thump and a dead thump", "context", "Stubb's joke turns violence into a theory of force: pain from a living will feels different from a blow by an object."],
  ["chapter-033-the-specksnyder", "the first lives aft, the last forward", "context", "Whaling has its own labor geography: officers and ordinary crew literally live in different parts of the ship."],
  ["chapter-034-the-cabin-table", "the smooth, medallion-shaped tablet", "context", "Ahab uses the ivory leg as a writing surface, making his injured body part of the ship's command system."],
  ["chapter-037-sunset", "Iron Crown of Lombardy", "context", "Ahab figures pain as a medieval crown, mixing suffering, rule, and grandeur."],
  ["chapter-039-first-night-watch", "it’s all predestinated", "theme", "Stubb's fatalism is comic, but it also shows how sailors explain fear by leaning on destiny."],
  ["chapter-040-midnight-forecastle", "thou blackling!", "difficult-material", "This is a racial insult, and the scene's energy should not blur that harm."],
  ["chapter-041-moby-dick", "the unaccompanied, secluded White Whale", "context", "The whale is built into a legend of isolation before readers ever see him."],
  ["chapter-041-moby-dick", "those uncivilized seas mostly frequented by the Sperm Whale fishermen", "context", "The phrase maps the whale through a global whaling network while using colonial language for ocean regions."],
  ["chapter-043-hark", "there is somebody down in the after-hold", "context", "The rumor of an unseen person turns the ship into a place of whispered secrets."],
  ["chapter-044-the-chart", "large wrinkled roll of yellowish sea charts", "context", "Ahab's hunt becomes a paper-and-data project, not only a burst of rage."]
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
  const id = `curated-earlybook-${slug(unitId)}-${slug(anchor).slice(0, 32)}`;
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
      spoiler_level: "none"
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

console.log(`Added ${added} curated earlybook annotations; annotations now has ${annotations.annotations.length}.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} curated earlybook candidates:`);
  for (const item of skipped) console.warn(`- ${item}`);
}
