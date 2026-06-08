import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const today = "2026-06-07";

const files = {
  glossary: path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json"),
  references: path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json"),
  annotations: path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json")
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const glossaryCandidates = [
  {
    id: "tackle",
    term: "tackle",
    category: "nautical",
    definition: "A block-and-rope rig used to hoist, lower, or hold heavy objects aboard ship.",
    variants: ["tackles"],
    targets: ["chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him", "chapter-078-cistern-and-buckets"],
    citations: ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]
  },
  {
    id: "whip",
    term: "whip",
    category: "nautical",
    definition: "A light tackle used for lifting or lowering; in Cistern and Buckets it lowers buckets into the whale's head.",
    variants: ["whips"],
    targets: ["chapter-078-cistern-and-buckets"],
    citations: ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]
  },
  {
    id: "basilosaurus",
    term: "Basilosaurus",
    category: "historical",
    definition: "A fossil whale once mistaken for a reptile; the name helps Ishmael push whale history into deep time.",
    variants: [],
    targets: ["chapter-104-the-fossil-whale"],
    citations: ["standard-ebooks-moby-dick", "noaa-sperm-whale"]
  },
  {
    id: "potters-fields",
    term: "Potters' Fields",
    category: "biblical",
    definition: "Burial grounds for the poor or unknown; the allusion makes the Pacific's calm carry graveyard imagery.",
    variants: ["Potters' Field", "Potters\u2019 Fields", "Potters\u2019 Field"],
    targets: ["chapter-111-the-pacific"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"]
  }
];

const referenceCandidates = [
  {
    id: "ambergris-trade",
    title: "Ambergris Trade",
    kind: "whaling",
    summary: "Ambergris turns the whale body into perfume, medicine, commerce, comedy, and natural-history uncertainty.",
    student_note: "This card gives students the commodity frame for a chapter that can otherwise feel like a strange digression.",
    targets: ["chapter-092-ambergris"],
    citations: ["standard-ebooks-moby-dick", "smithsonian-ambergris"]
  },
  {
    id: "arsacides-skeleton-display",
    title: "Arsacides Skeleton Display",
    kind: "historical",
    summary: "The whale skeleton in the palm grove turns anatomy into travel writing, collection, spectacle, and power.",
    student_note: "Students can read the skeleton as a display object: the chapter is about knowledge, but also about who gets to collect and interpret bodies.",
    targets: ["chapter-102-a-bower-in-the-arsacides"],
    citations: ["standard-ebooks-moby-dick", "melville-typee-gutenberg", "melville-omoo-gutenberg"]
  },
  {
    id: "fossil-whales-and-deep-time",
    title: "Fossil Whales and Deep Time",
    kind: "whaling",
    summary: "The Fossil Whale expands the book's scale from shipboard labor to geology, extinction, and ancient life.",
    student_note: "This chapter matters because it makes the whale older than the voyage and larger than any single hunt.",
    targets: ["chapter-104-the-fossil-whale", "chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish"],
    citations: ["standard-ebooks-moby-dick", "noaa-sperm-whale"]
  },
  {
    id: "ahab-leg-object",
    title: "Ahab's Leg",
    kind: "literary",
    summary: "Ahab's ivory leg is a recurring object that links injury, repair, authority, and dependence.",
    student_note: "Track the leg materially, not only symbolically. It keeps Ahab tied to the ship's repair economy and to the damage he wants to master.",
    targets: ["chapter-106-ahab-s-leg", "chapter-108-ahab-and-the-carpenter", "chapter-113-the-forge"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "carpenters-bench",
    title: "The Carpenter's Bench",
    kind: "nautical",
    summary: "The carpenter's work space gathers repair, measurement, tools, comedy, and bodily improvisation.",
    student_note: "The scene reads better when students can connect the jokes to real shipboard labor and to Ahab's dependence on practical craft.",
    targets: ["chapter-107-the-carpenter", "chapter-108-ahab-and-the-carpenter"],
    citations: ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]
  },
  {
    id: "potters-fields",
    title: "Potters' Fields",
    kind: "biblical",
    summary: "The Pacific's calm includes burial-ground imagery, so the quiet sea is also a field of death.",
    student_note: "This card helps students see why The Pacific is ominous instead of simply peaceful.",
    targets: ["chapter-111-the-pacific"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"]
  },
  {
    id: "perth-the-blacksmith",
    title: "Perth the Blacksmith",
    kind: "nautical",
    summary: "Perth's craft skill, ruined body, and grief make him part of the book's labor system, not just a background worker.",
    student_note: "Ahab needs Perth's work, but the chapter also gives Perth a history of loss. The forge scene turns private pain into shipboard labor.",
    targets: ["chapter-112-the-blacksmith", "chapter-113-the-forge"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "the-gilder",
    title: "The Gilder",
    kind: "literary",
    summary: "The title names the sea's gilded surface, where beauty, softness, and danger coexist.",
    student_note: "This quiet chapter belongs in the chase sequence because its beauty is unstable; it offers calm without safety.",
    targets: ["chapter-114-the-gilder", "chapter-116-the-dying-whale"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "quadrant-tool",
    title: "The Quadrant",
    kind: "nautical",
    summary: "The quadrant is a navigation instrument Ahab destroys when it no longer answers the question he cares about.",
    student_note: "Students need the tool explained so the act reads as both practical sabotage and symbolic rage.",
    targets: ["chapter-118-the-quadrant"],
    citations: ["standard-ebooks-moby-dick", "matthew-fontaine-maury"]
  },
  {
    id: "corpusants",
    title: "Corpusants",
    kind: "nautical",
    summary: "The storm-fire phenomenon becomes weather, omen, spectacle, and command test at once.",
    student_note: "Knowing the concrete phenomenon helps students understand why the crew reads the scene as supernatural pressure.",
    targets: ["chapter-119-the-candles"],
    citations: ["standard-ebooks-moby-dick", "matthew-fontaine-maury"]
  },
  {
    id: "compass-needle",
    title: "The Compass Needle",
    kind: "nautical",
    summary: "The compass needle is a guidance tool that Ahab forces back into service after the storm disrupts it.",
    student_note: "The chapter has a technical surface and a symbolic center: Ahab refuses even broken guidance unless he can dominate it.",
    targets: ["chapter-124-the-needle"],
    citations: ["standard-ebooks-moby-dick", "matthew-fontaine-maury"]
  },
  {
    id: "coffin-life-buoy",
    title: "Coffin-Life-Buoy",
    kind: "literary",
    summary: "Queequeg's coffin becomes a life-buoy, turning a death object into a rescue object before the ending.",
    student_note: "This is one of the late book's most important material symbols: its meaning changes because the object keeps being reused.",
    targets: ["chapter-110-queequeg-in-his-coffin", "chapter-126-the-life-buoy", "chapter-127-the-deck", "epilogue-epilogue"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "like-cures-like",
    title: "Like Cures Like",
    kind: "literary",
    summary: "Ahab frames Pip as a strange medicine for his own disorder, even as the hunt pulls him away.",
    student_note: "The phrase helps students read the scene as emotional logic, not just odd wording. Pip's care threatens Ahab's purpose because it reaches him.",
    targets: ["chapter-129-the-cabin"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "the-delight-warning",
    title: "The Delight",
    kind: "literary",
    summary: "The ship's name is grimly ironic: the Delight brings another warning and another image of wreckage.",
    student_note: "The gam lands harder when students see the name's irony. Ahab treats warning as confirmation rather than interruption.",
    targets: ["chapter-131-the-pequod-meets-the-delight"],
    citations: ["standard-ebooks-moby-dick"]
  }
];

const annotationCandidates = [
  ["subagent-planck-baleen-filter-feeding", "chapter-058-brit", "context", "the fringing fibres of that wondrous Venetian blind in their mouths", "The image describes baleen-like filtering: the right whale strains tiny food from seawater. The metaphor makes anatomy visible before modern vocabulary enters the guide."],
  ["subagent-planck-edible-whale-irony", "chapter-065-the-whale-as-a-dish", "context", "That mortal man should feed upon the creature that feeds his lamp", "The irony is economic and bodily: the whale becomes food, fuel, commodity, and joke. This chapter keeps use and appetite tangled together."],
  ["subagent-gauss-dated-madness-language", "chapter-106-ahab-s-leg", "difficult-material", "mad recklessness", "This is period language of madness and moral pressure, not a modern clinical diagnosis. Keep the discussion tied to rhetoric, danger, and Ahab's choices."],
  ["subagent-gauss-body-as-object", "chapter-108-ahab-and-the-carpenter", "theme", "ivory joist", "The fitting scene turns repair into philosophy: Ahab wants meaning, while the carpenter sees material, tools, and a job."],
  ["subagent-gauss-beauty-hides-danger", "chapter-114-the-gilder", "theme", "smooth, slow heaving swells", "The chapter lingers on softness and shine, but the calm is still part of the hunt. Beauty does not mean safety here."],
  ["subagent-gauss-sun-and-whale", "chapter-116-the-dying-whale", "theme", "sun and whale both stilly died together", "Ahab reads the whale's death inside a vast symbolic sunset. The scene makes finality feel beautiful and disturbing at once."],
  ["subagent-gauss-ahab-and-pip", "chapter-129-the-cabin", "theme", "Pip catches him by the hand to follow", "Ahab's tenderness to Pip does not cancel his violence; it complicates it and makes the tragedy sharper."],
  ["subagent-gauss-delight-self-sealing-warning", "chapter-131-the-pequod-meets-the-delight", "theme", "most miserably misnamed the Delight", "The ship's warning does not open Ahab to reconsideration. It becomes another sign he folds into the chase."],
  ["subagent-gauss-last-opening", "chapter-132-the-symphony", "theme", "Starbuck saw the old man", "This is the final moment when Ahab seems reachable before the chase closes around him again."]
];

function annotationRecord([id, unit_id, kind, anchor, note]) {
  const citations = ["standard-ebooks-moby-dick"];
  return {
    id,
    unit_id,
    kind,
    selector: { type: "TextQuoteSelector", exact: anchor },
    display: {
      depth: "explore",
      priority: 4,
      inline: false,
      surfaces: ["index", "search", "review"],
      spoiler_level: "mild"
    },
    anchor,
    note,
    tags: unique([`kind:${kind}`, "layer:explore", "review:subagent-suggestion"]),
    relationships: citations.map((source) => ({ type: "uses-source", target: `source:${source}` })),
    evidence: [
      {
        claim_type: kind === "difficult-material" ? "difficult-material" : "interpretive",
        citations,
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations,
    provenance: { author: "codex", created: today, method: "subagent-draft" },
    status: {
      content_status: kind === "difficult-material" ? "needs-review" : "draft",
      citation_status: "provisional",
      review_queue: kind === "difficult-material"
        ? ["source-check", "citation", "difficult-material", "tone"]
        : ["source-check", "citation", "interpretive"]
    }
  };
}

const glossary = await readJson(files.glossary);
const references = await readJson(files.references);
const annotations = await readJson(files.annotations);

let addedGlossary = 0;
for (const entry of glossaryCandidates) {
  if (!hasId(glossary.entries, entry.id)) {
    glossary.entries.push({
      ...entry,
      status: { definition_status: "draft", citation_status: "provisional" }
    });
    addedGlossary += 1;
  }
}

let addedReferences = 0;
for (const card of referenceCandidates) {
  if (!hasId(references.cards, card.id)) {
    references.cards.push({
      ...card,
      status: { content_status: "draft", citation_status: "provisional" }
    });
    addedReferences += 1;
  }
}

let addedAnnotations = 0;
for (const annotation of annotationCandidates.map(annotationRecord)) {
  if (!hasId(annotations.annotations, annotation.id)) {
    annotations.annotations.push(annotation);
    addedAnnotations += 1;
  }
}

await writeJson(files.glossary, glossary);
await writeJson(files.references, references);
await writeJson(files.annotations, annotations);

console.log(JSON.stringify({
  addedGlossary,
  addedReferences,
  addedAnnotations,
  totals: {
    glossary: glossary.entries.length,
    references: references.cards.length,
    annotations: annotations.annotations.length
  }
}, null, 2));
