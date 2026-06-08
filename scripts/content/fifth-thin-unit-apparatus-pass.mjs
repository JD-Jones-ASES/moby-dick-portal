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

const referenceCards = [
  {
    id: "right-whale-feeding-and-brit",
    title: "Right Whales, Brit, and Feeding",
    kind: "whaling",
    summary: "The brit chapters show a different whale ecology from the sperm-whale hunt that drives Ahab.",
    student_note: "These chapters help students see that Melville's whales are not interchangeable. Feeding habits, body parts, and commercial value shape how the Pequod's crew looks at each species.",
    targets: ["chapter-058-brit", "chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him"],
    citations: ["standard-ebooks-moby-dick", "noaa-right-whale", "scoresby-arctic-regions-gutenberg"]
  },
  {
    id: "false-sightings-and-desire",
    title: "False Sightings and Desire",
    kind: "literary",
    summary: "The Squid turns perception into suspense: the crew sees what it longs and fears to see.",
    student_note: "This card is useful when students ask why the book pauses for a squid. The scene shows Ahab's hunt changing how ordinary sights are interpreted.",
    targets: ["chapter-059-squid", "chapter-051-the-spirit-spout", "chapter-130-the-hat"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "eating-the-whale",
    title: "Eating the Whale",
    kind: "historical",
    summary: "The whale-as-food chapter turns industrial whaling into questions of appetite, custom, disgust, and use.",
    student_note: "Students can connect this chapter to Stubb's supper: the novel keeps asking what it means to turn an enormous living body into products, meals, and jokes.",
    targets: ["chapter-064-stubb-s-supper", "chapter-065-the-whale-as-a-dish", "chapter-092-ambergris"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "right-whale-head-superstition",
    title: "Right-Whale Head Superstition",
    kind: "whaling",
    summary: "The crew kills a right whale partly because Stubb and Flask believe its head will balance or protect the ship.",
    student_note: "The chapter mixes practical seamanship, superstition, and casual violence. It is a strong place to ask how work habits become beliefs.",
    targets: ["chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him", "chapter-075-the-right-whale-s-head-contrasted-view"],
    citations: ["standard-ebooks-moby-dick", "noaa-right-whale"]
  },
  {
    id: "sperm-whale-head-as-weapon",
    title: "Sperm-Whale Head as Weapon",
    kind: "whaling",
    summary: "The Battering-Ram chapter explains why the sperm whale's head can be imagined as a force of impact.",
    student_note: "This card connects anatomy to plot. Ishmael's technical description prepares readers to believe that the whale's body can damage ships.",
    targets: ["chapter-076-the-battering-ram", "chapter-135-the-chase-third-day"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl", "noaa-sperm-whale"]
  },
  {
    id: "case-junk-and-spermaceti",
    title: "Case, Junk, and Spermaceti",
    kind: "whaling",
    summary: "Several head chapters distinguish the sperm whale's oil-bearing parts and the labor of extracting them.",
    student_note: "When vocabulary gets dense, keep the core idea in view: the whale's head is being translated into valuable substances through dangerous work.",
    targets: ["chapter-077-the-great-heidelburgh-tun", "chapter-078-cistern-and-buckets", "chapter-094-a-squeeze-of-the-hand"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl", "noaa-sperm-whale"]
  },
  {
    id: "whale-social-groups",
    title: "Whale Social Groups",
    kind: "whaling",
    summary: "Schools, bulls, cows, and calves give Ishmael a way to describe whale society, even when his language carries nineteenth-century assumptions.",
    student_note: "Students should notice both the observation and the metaphor. Ishmael describes whale groups through human social language, which can reveal and distort at the same time.",
    targets: ["chapter-087-the-grand-armada", "chapter-088-schools-and-schoolmasters"],
    citations: ["standard-ebooks-moby-dick", "noaa-sperm-whale"]
  },
  {
    id: "body-parts-and-sacred-language",
    title: "Body Parts and Sacred Language",
    kind: "biblical",
    summary: "The Cassock gives a whale body part a religiously charged frame, making technical labor feel taboo and ritualized.",
    student_note: "This is a difficult but important example of Melville's method: anatomical detail, religious allusion, and bodily comedy collide in one short chapter.",
    targets: ["chapter-095-the-cassock"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"]
  },
  {
    id: "whaling-houses-and-global-industry",
    title: "Whaling Houses and Global Industry",
    kind: "historical",
    summary: "The Decanter links the Samuel Enderby to the history and geography of British and American sperm whaling.",
    student_note: "The chapter widens the voyage into an industry. Names, dates, ports, and firms show that Ahab's hunt moves through global commercial history.",
    targets: ["chapter-100-leg-and-arm", "chapter-101-the-decanter"],
    citations: ["standard-ebooks-moby-dick", "starbuck-history-of-american-whale-fishery"]
  },
  {
    id: "craftsmen-around-ahab",
    title: "Craftsmen Around Ahab",
    kind: "nautical",
    summary: "The carpenter and blacksmith chapters show practical workers drawn into Ahab's symbolic mission.",
    student_note: "These chapters are not only comic side scenes. They show how skilled labor gets bent toward Ahab's obsession.",
    targets: ["chapter-107-the-carpenter", "chapter-108-ahab-and-the-carpenter", "chapter-112-the-blacksmith", "chapter-113-the-forge"],
    citations: ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]
  },
  {
    id: "calm-before-destruction",
    title: "Calm Before Destruction",
    kind: "literary",
    summary: "Late quiet chapters like The Pacific, The Gilder, and The Dying Whale make beauty feel temporary and unstable.",
    student_note: "These pauses matter because they give readers emotional alternatives to Ahab's chase, even as the plot keeps closing them down.",
    targets: ["chapter-111-the-pacific", "chapter-114-the-gilder", "chapter-116-the-dying-whale", "chapter-132-the-symphony"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "pip-and-ahab-below-deck",
    title: "Pip and Ahab Below Deck",
    kind: "literary",
    summary: "The Cabin brings Pip's loyalty and Ahab's damaged tenderness into direct conflict with the hunt.",
    student_note: "This scene lets students see Ahab almost turn aside. Pip matters because his care briefly exposes another possible Ahab.",
    targets: ["chapter-129-the-cabin", "chapter-093-the-castaway", "chapter-125-the-log-and-line"],
    citations: ["standard-ebooks-moby-dick"]
  },
  {
    id: "final-gams-as-ethical-tests",
    title: "Final Gams as Ethical Tests",
    kind: "literary",
    summary: "The late ship meetings become clearer tests of whether Ahab can respond to another crew's suffering.",
    student_note: "By the Rachel and Delight, the question is no longer whether Ahab has been warned. It is whether warning or grief can still matter to him.",
    targets: ["chapter-128-the-pequod-meets-the-rachel", "chapter-131-the-pequod-meets-the-delight"],
    citations: ["standard-ebooks-moby-dick"]
  }
];

const glossaryEntries = [
  ["brit", "whaling", "Tiny sea life that serves as food for right whales; Melville makes it look like yellow fields on the sea.", ["standard-ebooks-moby-dick", "noaa-right-whale"], ["chapter-058-brit", "chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him"]],
  ["crozetts", "historical", "A group of islands in the southern Indian Ocean, used here as a broad route marker.", ["standard-ebooks-moby-dick"], ["chapter-058-brit"], ["Crozetts"]],
  ["venetian-blind", "vocabulary", "A slatted blind; Ishmael uses the image to describe the filtering plates in a right whale's mouth.", ["standard-ebooks-moby-dick"], ["chapter-058-brit"], ["Venetian blind"]],
  ["squid", "whaling", "A large sea creature mistaken at first for the White Whale, turning natural observation into omen.", ["standard-ebooks-moby-dick"], ["chapter-059-squid"], ["squids"]],
  ["stiletto", "vocabulary", "A narrow dagger; the word makes Daggoo's cry sound sharp and sudden.", ["standard-ebooks-moby-dick", "webster-1913"], ["chapter-059-squid"]],
  ["porpoise", "whaling", "A small toothed whale relative; Melville treats it through food history in this chapter.", ["standard-ebooks-moby-dick"], ["chapter-065-the-whale-as-a-dish"], ["porpoises"]],
  ["train-oil", "whaling", "Oil from whale blubber, commercially central to the whaling world.", ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"], ["chapter-065-the-whale-as-a-dish"], ["train oil"]],
  ["battering-ram", "vocabulary", "A heavy object used to break through a barrier; Ishmael uses it for the sperm whale's head.", ["standard-ebooks-moby-dick", "webster-1913"], ["chapter-076-the-battering-ram"], ["Battering-Ram"]],
  ["physiologist", "historical", "A student or writer of bodily structure and function; Ishmael borrows the pose of scientific authority.", ["standard-ebooks-moby-dick", "webster-1913"], ["chapter-076-the-battering-ram"], ["physiologist"]],
  ["spout-hole", "whaling", "The whale's blowhole, placed on top of the head rather than at the front like a human nose.", ["standard-ebooks-moby-dick", "noaa-sperm-whale"], ["chapter-076-the-battering-ram"], ["spout hole"]],
  ["heidelburgh-tun", "historical", "A huge wine cask at Heidelberg; Melville uses it as a comic analogy for the sperm whale's case.", ["standard-ebooks-moby-dick"], ["chapter-077-the-great-heidelburgh-tun"], ["Heidelburgh Tun"]],
  ["quoin", "vocabulary", "A wedge-shaped piece or angle; Ishmael uses the term while dividing the whale's head into parts.", ["standard-ebooks-moby-dick", "webster-1913"], ["chapter-077-the-great-heidelburgh-tun"], ["quoins"]],
  ["junk", "whaling", "The lower oil-bearing part of the sperm whale's head, distinct from the upper case.", ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"], ["chapter-077-the-great-heidelburgh-tun", "chapter-078-cistern-and-buckets"], ["Junk"]],
  ["case", "whaling", "The upper oil-bearing chamber in the sperm whale's head, prized for spermaceti.", ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"], ["chapter-077-the-great-heidelburgh-tun", "chapter-078-cistern-and-buckets"], ["Case"]],
  ["school", "whaling", "A group of whales, especially the small bands Ishmael describes after the Grand Armada.", ["standard-ebooks-moby-dick", "noaa-sperm-whale"], ["chapter-088-schools-and-schoolmasters"], ["schools"]],
  ["bull", "whaling", "A male whale; Ishmael uses the term while describing whale social groups.", ["standard-ebooks-moby-dick", "noaa-sperm-whale"], ["chapter-088-schools-and-schoolmasters"], ["bulls"]],
  ["cassock", "biblical", "A long clerical garment; Melville uses the word as a startling religious analogy for whale processing.", ["standard-ebooks-moby-dick", "king-james-bible"], ["chapter-095-the-cassock"], ["Cassock"]],
  ["windlass", "nautical", "A shipboard hauling machine used for heavy work with ropes, cables, or anchors.", ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"], ["chapter-095-the-cassock", "chapter-113-the-forge"], ["windlasses"]],
  ["queen-maachah", "biblical", "A biblical queen associated in 1 Kings with an idol destroyed by Asa; Melville invokes her in The Cassock.", ["standard-ebooks-moby-dick", "king-james-bible"], ["chapter-095-the-cassock"], ["Queen Maachah"]],
  ["kedron", "biblical", "A brook or valley named in biblical passages; Melville uses it in the allusion to Asa and Maachah.", ["standard-ebooks-moby-dick", "king-james-bible"], ["chapter-095-the-cassock"], ["Kedron"]],
  ["samuel-enderby", "historical", "A London whaling-house name attached to the ship Ahab meets and to a wider history of British sperm whaling.", ["standard-ebooks-moby-dick", "starbuck-history-of-american-whale-fishery"], ["chapter-100-leg-and-arm", "chapter-101-the-decanter"], ["Samuel Enderby", "Enderby & Sons"]],
  ["amelia", "historical", "A ship named in Ishmael's whaling-history account as part of early British sperm-whaling in the South Sea.", ["standard-ebooks-moby-dick", "starbuck-history-of-american-whale-fishery"], ["chapter-101-the-decanter"], ["Amelia"]],
  ["cape-horn", "historical", "The difficult southern passage around South America, important to global whaling routes.", ["standard-ebooks-moby-dick", "matthew-fontaine-maury"], ["chapter-049-the-hyena", "chapter-101-the-decanter"], ["Cape Horn"]],
  ["vice-bench", "shipboard", "A workbench with a vise; Ahab's body and tools meet around this practical object.", ["standard-ebooks-moby-dick"], ["chapter-108-ahab-and-the-carpenter"], ["vice-bench"]],
  ["anvil", "shipboard", "A heavy iron block used in forging metal; the blacksmith chapters make practical labor feel symbolic.", ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"], ["chapter-112-the-blacksmith", "chapter-113-the-forge"], ["anvils"]],
  ["bellows", "shipboard", "A device that blows air into a fire, strengthening the heat of the forge.", ["standard-ebooks-moby-dick", "webster-1913"], ["chapter-113-the-forge"]],
  ["malady", "vocabulary", "An illness or deep disorder; Ahab uses the word for the condition that Pip seems to soothe and intensify.", ["standard-ebooks-moby-dick", "webster-1913"], ["chapter-129-the-cabin"], ["maladies"]],
  ["like-cures-like", "vocabulary", "A phrase suggesting that one form of illness or likeness can answer another; Ahab applies it uneasily to Pip.", ["standard-ebooks-moby-dick"], ["chapter-129-the-cabin"], ["Like cures like", "like-cures-like"]]
];

const annotationNotes = [
  {
    id: "thin-unit-apparatus-chapter-076-battering-ram-belief",
    unit_id: "chapter-076-the-battering-ram",
    kind: "context",
    anchor: "forever remain an infidel as to one of the most appalling",
    note: "Ishmael turns anatomy into a test of belief. The chapter is technical, but its rhetoric is about persuading readers that whale violence can be historically credible."
  },
  {
    id: "thin-unit-apparatus-chapter-088-social-metaphor",
    unit_id: "chapter-088-schools-and-schoolmasters",
    kind: "context",
    anchor: "Such bands are known as schools",
    note: "This is a key term for whale grouping, but Ishmael quickly translates animal behavior into human social metaphors. Students can separate observation from metaphor."
  },
  {
    id: "thin-unit-apparatus-chapter-095-sacred-body",
    unit_id: "chapter-095-the-cassock",
    kind: "difficult-material",
    anchor: "darkly set forth in the 15th chapter of the first book of Kings",
    note: "The chapter uses biblical and bodily language in a deliberately unsettling way. This note should be reviewed for classroom framing around sexuality, religion, and whale processing."
  },
  {
    id: "thin-unit-apparatus-chapter-101-industry-history",
    unit_id: "chapter-101-the-decanter",
    kind: "context",
    anchor: "first English ships that ever regularly hunted the Sperm Whale",
    note: "Ishmael pauses the plot to place whaling inside commercial history. The dates and firms make the Pequod's voyage part of a global industry."
  },
  {
    id: "thin-unit-apparatus-chapter-129-care-versus-hunt",
    unit_id: "chapter-129-the-cabin",
    kind: "theme",
    anchor: "If thou speakest thus to me much more, Ahab’s purpose keels up in him",
    note: "Pip's care threatens Ahab's purpose because it awakens a competing loyalty. The scene briefly makes refusal of the hunt imaginable."
  }
];

function glossaryEntry([id, category, definition, citations, targets, variants = []]) {
  return {
    id,
    term: variants[0] ?? id.replace(/-/g, " "),
    category,
    definition,
    variants: unique(variants.slice(1)),
    targets,
    citations,
    status: { definition_status: "draft", citation_status: "provisional" }
  };
}

function annotationRecord(candidate) {
  const citation = candidate.kind === "difficult-material" ? ["standard-ebooks-moby-dick", "king-james-bible"] : ["standard-ebooks-moby-dick"];
  return {
    id: candidate.id,
    unit_id: candidate.unit_id,
    kind: candidate.kind,
    selector: { type: "TextQuoteSelector", exact: candidate.anchor },
    display: {
      depth: "explore",
      priority: 4,
      inline: false,
      surfaces: ["index", "search", "review"],
      spoiler_level: "none"
    },
    anchor: candidate.anchor,
    note: candidate.note,
    tags: unique([`kind:${candidate.kind}`, "layer:explore", "review:thin-unit-pass"]),
    relationships: citation.map((source) => ({ type: "uses-source", target: `source:${source}` })),
    evidence: [
      {
        claim_type: candidate.kind === "difficult-material" ? "difficult-material" : "source-text-observation",
        citations: citation,
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations: citation,
    provenance: { author: "codex", created: today, method: "source-checked-draft" },
    status: {
      content_status: candidate.kind === "difficult-material" ? "needs-review" : "draft",
      citation_status: "provisional",
      review_queue: candidate.kind === "difficult-material"
        ? ["source-check", "citation", "difficult-material", "tone"]
        : ["source-check", "citation", "interpretive"]
    }
  };
}

const glossary = await readJson(files.glossary);
const references = await readJson(files.references);
const annotations = await readJson(files.annotations);

let addedGlossary = 0;
for (const entry of glossaryEntries.map(glossaryEntry)) {
  if (!hasId(glossary.entries, entry.id)) {
    glossary.entries.push(entry);
    addedGlossary += 1;
  }
}

let addedReferences = 0;
for (const card of referenceCards) {
  if (!hasId(references.cards, card.id)) {
    references.cards.push({
      ...card,
      status: { content_status: "draft", citation_status: "provisional" }
    });
    addedReferences += 1;
  }
}

let addedAnnotations = 0;
for (const annotation of annotationNotes.map(annotationRecord)) {
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
