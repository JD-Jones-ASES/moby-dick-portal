import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const today = "2026-06-07";

const sourceRecordsPath = path.join(repoRoot, "data", "sources", "moby-dick.source-records.json");
const glossaryPath = path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json");
const referenceCardsPath = path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json");
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");

function escapeNonAscii(value) {
  return value.replace(/[^\x00-\x7F]/gu, (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xffff) {
      return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    }

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function byId(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function termMatches(text, term) {
  if (!term) return false;
  return text.toLowerCase().includes(term.toLowerCase());
}

function findGlossaryTargets(candidate, guideData) {
  if (candidate.targets?.length) return candidate.targets;
  const terms = unique([candidate.term, ...(candidate.variants ?? [])]);
  const matchingUnits = guideData.units.filter((unit) => terms.some((term) => termMatches(unit.plain_text, term)));
  const classroom = matchingUnits.filter((unit) => unit.paths.classroom_standard === "required" || unit.paths.classroom_standard === "recommended");
  const ordered = classroom.length ? classroom : matchingUnits;
  return ordered.slice(0, candidate.targetLimit ?? 8).map((unit) => unit.unit_id);
}

function candidateResolves(candidate, unitsById) {
  const unit = unitsById.get(candidate.unit_id);
  if (!unit) return false;
  return unit.plain_text.toLowerCase().includes(candidate.anchor.toLowerCase());
}

function defaultTags(candidate) {
  const tags = new Set(candidate.tags ?? []);
  tags.add(`kind:${candidate.kind}`);
  if (candidate.kind === "theme") tags.add("layer:theme");
  if (candidate.kind === "form") tags.add("layer:form");
  if (candidate.kind === "context") tags.add("layer:context");
  if (candidate.kind === "difficult-material") tags.add("review:difficult-material");
  return [...tags].sort();
}

function defaultReviewQueue(candidate) {
  const reviewQueue = new Set(candidate.review_queue ?? ["citation"]);
  if ((candidate.content_status ?? "draft") !== "student-ready") reviewQueue.add("source-check");
  if ((candidate.claim_type ?? "interpretive") === "interpretive") reviewQueue.add("interpretive");
  if (candidate.kind === "difficult-material") {
    reviewQueue.add("difficult-material");
    reviewQueue.add("tone");
  }
  return [...reviewQueue].sort();
}

function defaultRelationships(candidate) {
  const relationships = [...(candidate.relationships ?? [])];
  for (const citation of candidate.citations ?? ["standard-ebooks-moby-dick"]) {
    relationships.push({ type: "uses-source", target: `source:${citation}` });
  }
  const seen = new Set();
  return relationships.filter((relationship) => {
    const key = `${relationship.type}:${relationship.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const newSourceRecords = [
  {
    id: "webster-1913",
    kind: "dictionary",
    title: "Webster's Revised Unabridged Dictionary",
    author: "Noah Porter, ed.",
    publisher: "Project Gutenberg",
    url: "https://www.gutenberg.org/ebooks/29765",
    bibliographic_note: "Public-domain dictionary useful for nineteenth-century vocabulary checks.",
    accessed: today,
    local_path: null,
    source_note: "Added as a provisional lexical support source for student-facing glossary definitions.",
    license_note: "Project Gutenberg public-domain ebook; verify current terms before publication.",
    citation_status: "provisional"
  },
  {
    id: "king-james-bible",
    kind: "biblical-text",
    title: "The King James Version of the Bible",
    author: "Various",
    publisher: "Project Gutenberg",
    url: "https://www.gutenberg.org/ebooks/10",
    bibliographic_note: "Reference text for biblical allusions such as Jonah, Job, Ahab, Rachel, and Leviathan.",
    accessed: today,
    local_path: null,
    source_note: "Added as a provisional biblical reference source for allusion notes.",
    license_note: "Project Gutenberg public-domain ebook; verify current terms before publication.",
    citation_status: "provisional"
  },
  {
    id: "bulfinch-age-of-fable",
    kind: "classical-text",
    title: "The Age of Fable",
    author: "Thomas Bulfinch",
    publisher: "Project Gutenberg",
    url: "https://www.gutenberg.org/ebooks/4925",
    bibliographic_note: "Public-domain mythology handbook useful for classical allusion review.",
    accessed: today,
    local_path: null,
    source_note: "Added as a provisional support source for classical and mythological reference cards.",
    license_note: "Project Gutenberg public-domain ebook; verify current terms before publication.",
    citation_status: "provisional"
  },
  {
    id: "beale-sperm-whale-bhl",
    kind: "historical-primary",
    title: "The Natural History of the Sperm Whale",
    author: "Thomas Beale",
    publisher: "Biodiversity Heritage Library",
    url: "https://www.biodiversitylibrary.org/item/192636",
    bibliographic_note: "1839 whaling and natural-history source repeatedly associated with Melville's whale material.",
    accessed: today,
    local_path: null,
    source_note: "Added as a provisional historical whaling source for cetology and sperm-whale context.",
    license_note: "BHL item appears to be a public-domain historical work; verify item rights before publication.",
    citation_status: "provisional"
  },
  {
    id: "scoresby-arctic-regions-gutenberg",
    kind: "historical-primary",
    title: "The Arctic Regions and the Northern Whale-Fishery",
    author: "William Scoresby",
    publisher: "Project Gutenberg",
    url: "https://www.gutenberg.org/ebooks/69389",
    bibliographic_note: "Public-domain edition drawn from Scoresby's 1820 account of Arctic regions and whale-fishery.",
    accessed: today,
    local_path: null,
    source_note: "Added as provisional support for whaling labor, shipboard practice, and northern whale-fishery context.",
    license_note: "Project Gutenberg public-domain ebook; verify current terms before publication.",
    citation_status: "provisional"
  },
  {
    id: "noaa-sperm-whale",
    kind: "encyclopedia",
    title: "Sperm Whale",
    author: "NOAA Fisheries",
    publisher: "National Oceanic and Atmospheric Administration",
    url: "https://www.fisheries.noaa.gov/species/sperm-whale",
    bibliographic_note: "Modern biological reference for sperm whales and spermaceti context.",
    accessed: today,
    local_path: null,
    source_note: "Added as provisional modern science support for anatomy and conservation-sensitive notes.",
    license_note: "U.S. government source; verify page-specific reuse guidance before publication.",
    citation_status: "provisional"
  },
  {
    id: "smithsonian-ambergris",
    kind: "encyclopedia",
    title: "The Mystery of Ambergris",
    author: "Smithsonian Ocean",
    publisher: "Smithsonian Institution",
    url: "https://ocean.si.edu/ocean-life/marine-mammals/mystery-ambergris",
    bibliographic_note: "Modern explanatory source for ambergris and sperm-whale digestive context.",
    accessed: today,
    local_path: null,
    source_note: "Added as provisional support for the ambergris glossary and reference material.",
    license_note: "Verify Smithsonian page reuse terms before publication.",
    citation_status: "provisional"
  }
];

const glossaryCandidates = [
  {
    id: "ahab",
    term: "Ahab",
    category: "biblical",
    definition: "The Pequod's captain. His name recalls a biblical king associated with idolatry and destructive rule, which helps frame the novel's concern with command and obsession.",
    variants: ["Ahab's", "Captain Ahab"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "elijah",
    term: "Elijah",
    category: "biblical",
    definition: "A biblical prophet's name used for the strange Nantucket figure who warns Ishmael and Queequeg before they sail.",
    variants: ["Elijah's"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "gabriel",
    term: "Gabriel",
    category: "biblical",
    definition: "A biblical angel's name given to the fevered prophet aboard the Jeroboam. The name turns a shipboard warning into apocalyptic theater.",
    variants: ["Gabriel's"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "jeroboam",
    term: "Jeroboam",
    category: "biblical",
    definition: "A biblical royal name used for one of the ships the Pequod meets. Its allusive weight reinforces the chapter's false-prophet atmosphere.",
    variants: ["Jeroboam's"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "rachel",
    term: "Rachel",
    category: "biblical",
    definition: "A biblical name associated with grief for lost children. Late in the novel, the ship Rachel searches for a missing boat.",
    variants: ["Rachel's"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "job",
    term: "Job",
    category: "biblical",
    definition: "A biblical sufferer whose book includes Leviathan. Melville's sea language often draws on Job's scale of suffering, awe, and unanswerable power.",
    variants: ["Job's"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "lazarus",
    term: "Lazarus",
    category: "biblical",
    definition: "A biblical figure associated with poverty, death, and restoration to life. Ishmael uses the name in his comic but serious talk about cold, hunger, and survival.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "queen-mab",
    term: "Queen Mab",
    category: "classical",
    definition: "A fairy figure best known from Shakespeare's Romeo and Juliet. Stubb's dream chapter uses the name to mix comic dream logic with ominous prophecy.",
    variants: ["Mab"],
    citations: ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "narcissus",
    term: "Narcissus",
    category: "classical",
    definition: "A mythic youth who falls in love with his own reflection. Ishmael invokes him while explaining why humans are drawn to water and self-reflection.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "ramadan",
    term: "Ramadan",
    category: "historical",
    definition: "The Muslim month of fasting. Ishmael uses the word loosely and comically for Queequeg's private religious observance, so the scene needs careful context.",
    variants: ["Ramadaning"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "yojo",
    term: "Yojo",
    category: "historical",
    definition: "Queequeg's small religious idol or household god. The narration often treats Yojo comically, which should be read as part of the novel's religious and racial difficulty.",
    variants: ["Yojo's"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "idolator",
    term: "idolator",
    category: "historical",
    definition: "A person accused of worshiping idols. In the novel, the term reflects Christian judgments about other religions more than neutral description.",
    variants: ["idolatrous", "idolatry"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "heathen",
    term: "heathen",
    category: "historical",
    definition: "An older Christian term for someone outside Christianity. In Moby-Dick it often carries religious prejudice and should be handled directly.",
    variants: ["heathens", "heathenish"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "savage",
    term: "savage",
    category: "historical",
    definition: "A harmful nineteenth-century racial and colonial label for people imagined as uncivilized. The guide should name the prejudice rather than normalize the term.",
    variants: ["savages", "savageness"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "cannibal",
    term: "cannibal",
    category: "historical",
    definition: "A person who eats human flesh. Ishmael repeatedly applies the label to Queequeg; the word carries sensational racial assumptions as well as plot-level comedy.",
    variants: ["cannibals"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "new-bedford",
    term: "New Bedford",
    category: "historical",
    definition: "The Massachusetts whaling port where Ishmael first arrives before continuing to Nantucket.",
    variants: [],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "cape-horn",
    term: "Cape Horn",
    category: "nautical",
    definition: "The stormy southern tip of South America, often associated with difficult long-distance sailing routes.",
    variants: [],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "pacific",
    term: "Pacific",
    category: "historical",
    definition: "The ocean region where the final phase of the voyage unfolds. The name means peaceful, which Melville uses ironically as the chase tightens.",
    variants: ["Pacific Ocean"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "arsacides",
    term: "Arsacides",
    category: "historical",
    definition: "Melville's name for a South Pacific island setting in Ishmael's whale-skeleton episode. The passage mixes knowledge-gathering with colonial and ethnographic assumptions.",
    variants: ["Arsacidean"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "baleen",
    term: "baleen",
    category: "whaling",
    definition: "Comb-like plates in some whales' mouths used to filter food. Sperm whales are toothed whales, so baleen helps students understand Melville's whale categories.",
    variants: ["whalebone"],
    citations: ["standard-ebooks-moby-dick", "noaa-sperm-whale"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "sperm-whale",
    term: "sperm whale",
    category: "whaling",
    definition: "The toothed whale hunted for spermaceti and oil. Moby Dick is a sperm whale, so the technical chapters often return to this species.",
    variants: ["Sperm Whale", "Sperm Whales"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl", "noaa-sperm-whale"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "right-whale",
    term: "Right Whale",
    category: "whaling",
    definition: "A baleen whale type often contrasted with the sperm whale. Melville uses the contrast to turn anatomy into a lesson in classification.",
    variants: ["right whale", "Right Whales"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "blubber",
    term: "blubber",
    category: "whaling",
    definition: "The whale's thick fat layer, cut from the body and boiled into oil. Many labor chapters are about turning blubber into profit.",
    variants: ["blubber-hook", "blubber-hooks"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "spermaceti",
    term: "spermaceti",
    category: "whaling",
    definition: "A waxy oil-like substance from the sperm whale's head, prized by whalers and often misunderstood by older writers.",
    variants: ["sperm oil"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl", "noaa-sperm-whale"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "case",
    term: "case",
    category: "whaling",
    definition: "In whaling context, the large oil-containing chamber in a sperm whale's head. Melville's head chapters often distinguish this from ordinary anatomy.",
    variants: ["case-bottle"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "junk",
    term: "junk",
    category: "whaling",
    definition: "In sperm-whale anatomy, oily tissue in the head, not trash. Students should watch for the whaling-specific meaning.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "spout",
    term: "spout",
    category: "whaling",
    definition: "The visible breath or spray from a whale at the surface. Lookouts search for spouts as signs of whales.",
    variants: ["spouts", "spouting", "spouted"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "fluke",
    term: "fluke",
    category: "whaling",
    definition: "One side of a whale's tail. The tail and flukes matter because they are powerful, dangerous, and symbolically charged.",
    variants: ["flukes"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "sound",
    term: "sound",
    category: "whaling",
    definition: "For a whale, to dive downward. In chase scenes, sounding changes the danger and timing for the boats.",
    variants: ["sounds", "sounded", "sounding"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "breach",
    term: "breach",
    category: "whaling",
    definition: "For a whale, to leap partly or wholly out of the water. The word turns whale movement into visible force.",
    variants: ["breached", "breaching"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "whale-line",
    term: "whale-line",
    category: "whaling",
    definition: "The long rope attached to a struck whale. It can pull with lethal speed, so Melville treats it as both tool and danger.",
    variants: ["whale line", "line"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-060-the-line", "chapter-072-the-monkey-rope", "chapter-125-the-log-and-line"]
  },
  {
    id: "harpoon",
    term: "harpoon",
    category: "whaling",
    definition: "A barbed iron weapon thrown to fasten a whale to the boat. It begins the dangerous physical connection between crew and whale.",
    variants: ["harpoons", "harpooned", "harpooning"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "lance",
    term: "lance",
    category: "whaling",
    definition: "A long killing weapon used after the harpoon has fastened the whale. Harpoon and lance mark different stages of the hunt.",
    variants: ["lances", "lanced", "lancing"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "pitchpoling",
    term: "pitchpoling",
    category: "whaling",
    definition: "A whaling technique in which a lance or pole is thrown or darted from a distance. Melville presents it as specialized shipboard skill.",
    variants: ["pitchpole", "pitchpoled"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "cutting-in",
    term: "cutting in",
    category: "whaling",
    definition: "The process of stripping blubber from a whale alongside the ship. It turns the hunt into heavy industrial labor.",
    variants: ["cutting-in", "cut in"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "mincer",
    term: "mincer",
    category: "whaling",
    definition: "A sailor who cuts blubber into smaller pieces for trying out. The job shows how specialized and bodily whaling labor is.",
    variants: ["mincers", "mincing"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "try-pot",
    term: "try-pot",
    category: "whaling",
    definition: "A large iron pot used in the try-works to boil blubber into oil.",
    variants: ["try-pots", "trypot", "trypots"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "ambergris",
    term: "ambergris",
    category: "whaling",
    definition: "A rare waxy substance associated with sperm whales and used in perfume. Its value lets Melville contrast luxury with unsettling bodily origins.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "smithsonian-ambergris"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-092-ambergris"]
  },
  {
    id: "waif",
    term: "waif",
    category: "whaling",
    definition: "A flag or marker used to claim a whale or signal possession. The word matters in property and whaling-law chapters.",
    variants: ["waifs"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "loggerhead",
    term: "loggerhead",
    category: "whaling",
    definition: "A post or fitting in a whaleboat used to control the whale-line as it runs out.",
    variants: ["loggerheads"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "monkey-rope",
    term: "monkey-rope",
    category: "whaling",
    definition: "A rope tying one sailor's safety to another's work. Melville uses it to make interdependence literal.",
    variants: ["monkey rope"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "student-ready", citation_status: "provisional" },
    targets: ["chapter-072-the-monkey-rope"]
  },
  {
    id: "doubloon",
    term: "doubloon",
    category: "historical",
    definition: "A Spanish gold coin. Ahab nails one to the mast as the reward for spotting Moby Dick, turning money into a symbol everyone reads differently.",
    variants: ["doubloons"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "student-ready", citation_status: "provisional" },
    targets: ["chapter-036-the-quarterdeck", "chapter-099-the-doubloon"]
  },
  {
    id: "quadrant",
    term: "quadrant",
    category: "nautical",
    definition: "A navigational instrument used to measure the altitude of celestial bodies. Ahab's treatment of it shows his rage against limits and guidance.",
    variants: ["quadrants"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-118-the-quadrant"]
  },
  {
    id: "compass",
    term: "compass",
    category: "nautical",
    definition: "A navigation instrument showing direction. Late in the novel, damaged and remade compasses turn navigation into a symbolic contest.",
    variants: ["compasses"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-124-the-needle"]
  },
  {
    id: "log-and-line",
    term: "log and line",
    category: "nautical",
    definition: "A simple tool for estimating a ship's speed through the water. The phrase matters when ordinary seamanship starts failing near the end.",
    variants: ["log-line", "log and the line"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-125-the-log-and-line"]
  },
  {
    id: "life-buoy",
    term: "life-buoy",
    category: "nautical",
    definition: "A floating rescue device. In Moby-Dick the life-buoy becomes inseparable from Queequeg's coffin.",
    variants: ["lifebuoy", "life buoy"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "student-ready", citation_status: "provisional" },
    targets: ["chapter-126-the-life-buoy", "epilogue-epilogue"]
  },
  {
    id: "bulwarks",
    term: "bulwarks",
    category: "nautical",
    definition: "The raised sides of a ship above the deck. Characters often lean, watch, or brace themselves at the bulwarks.",
    variants: ["bulwark"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "bowsprit",
    term: "bowsprit",
    category: "nautical",
    definition: "A spar projecting from a ship's bow. It helps students picture the ship as a working structure, not a flat stage.",
    variants: ["bowsprits"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "mainmast",
    term: "mainmast",
    category: "nautical",
    definition: "The principal mast of a sailing ship. The mast is both a workplace and a symbolic center for Ahab's reward coin.",
    variants: ["main-mast"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "topgallant",
    term: "topgallant",
    category: "nautical",
    definition: "A sail or mast section high above the deck. The word signals the vertical complexity of a sailing ship.",
    variants: ["top-gallant", "topgallants"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "lee",
    term: "lee",
    category: "nautical",
    definition: "The sheltered side away from the wind. In symbolic chapters, a lee shore can mean safety that is also deadly.",
    variants: ["lee shore", "lee-shore"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-023-the-lee-shore"]
  },
  {
    id: "windward",
    term: "windward",
    category: "nautical",
    definition: "Toward the wind. Directional terms like windward and leeward help students follow ship movement and risk.",
    variants: ["to windward"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "leeward",
    term: "leeward",
    category: "nautical",
    definition: "Away from the wind, or on the lee side. The term often appears in practical sailing descriptions.",
    variants: ["lee-ward"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "squall",
    term: "squall",
    category: "nautical",
    definition: "A sudden violent gust of wind, often with rain. In the novel, weather can be both physical danger and symbolic pressure.",
    variants: ["squalls"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "corpusants",
    term: "corpusants",
    category: "nautical",
    definition: "Sailors' name for St. Elmo's fire, a glowing electrical effect during storms. In The Candles it becomes an omen-like spectacle.",
    variants: ["corpusant"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-119-the-candles"]
  },
  {
    id: "specksnyder",
    term: "Specksnyder",
    category: "shipboard",
    definition: "A whaling officer or chief harpooneer in older Dutch-influenced usage. Ishmael uses the term to explain whaling hierarchy.",
    variants: ["specksioneer"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-033-the-specksnyder"]
  },
  {
    id: "chief-mate",
    term: "chief mate",
    category: "shipboard",
    definition: "The senior mate under the captain. Starbuck's role gives him authority, but not enough to overrule Ahab.",
    variants: ["first mate"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "second-mate",
    term: "second mate",
    category: "shipboard",
    definition: "The officer below the chief mate. Stubb holds this rank aboard the Pequod.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "third-mate",
    term: "third mate",
    category: "shipboard",
    definition: "The officer below the second mate. Flask holds this rank aboard the Pequod.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "carpenter",
    term: "carpenter",
    category: "shipboard",
    definition: "The ship's craft worker responsible for woodwork and repairs. Near the end, he turns Ahab's damaged body into another repair job.",
    variants: ["carpenter's"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-107-the-carpenter", "chapter-108-ahab-and-the-carpenter"]
  },
  {
    id: "blacksmith",
    term: "blacksmith",
    category: "shipboard",
    definition: "The metalworker aboard ship. Perth's forge gives Ahab a way to make the chase feel ritualized and fated.",
    variants: ["blacksmith's"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-112-the-blacksmith", "chapter-113-the-forge"]
  },
  {
    id: "cooper",
    term: "cooper",
    category: "shipboard",
    definition: "A worker who makes or repairs barrels. On a whaling ship, barrels matter because oil must be stored.",
    variants: ["coopers"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "steward",
    term: "steward",
    category: "shipboard",
    definition: "A shipboard servant or attendant, especially around meals and cabin service.",
    variants: ["steward's"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "greenhorn",
    term: "greenhorn",
    category: "vocabulary",
    definition: "An inexperienced person. At sea, the word marks the difference between book knowledge and dangerous practical skill.",
    variants: ["green-horn", "greenhorns"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "inscrutable",
    term: "inscrutable",
    category: "vocabulary",
    definition: "Impossible or very difficult to understand. The word suits Ahab's sense that ordinary surfaces hide a deeper, hostile meaning.",
    variants: ["inscrutableness"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "monomania",
    term: "monomania",
    category: "vocabulary",
    definition: "An obsessive fixation on one idea. It is a useful but historically loaded term for Ahab's narrowing mind.",
    variants: ["monomaniac", "monomaniacal"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "apparition",
    term: "apparition",
    category: "vocabulary",
    definition: "A ghostly or startling appearance. The novel often makes ships, whales, and people appear as if they are omens.",
    variants: ["apparitions"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "phantom",
    term: "phantom",
    category: "vocabulary",
    definition: "A ghostlike image or illusion. Ishmael's sea often blurs real danger with imagined or symbolic presence.",
    variants: ["phantoms"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "firmament",
    term: "firmament",
    category: "biblical",
    definition: "An old word for the heavens or sky, especially in biblical style. Melville uses such words to make sea events feel cosmic.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "king-james-bible", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "counterpane",
    term: "counterpane",
    category: "vocabulary",
    definition: "A bedspread. The word matters early because Ishmael turns an ordinary bed covering into a memory trigger.",
    variants: [],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "student-ready", citation_status: "provisional" },
    targets: ["chapter-004-the-counterpane"]
  },
  {
    id: "carpetbag",
    term: "carpetbag",
    category: "vocabulary",
    definition: "A travel bag made from carpet-like fabric. Ishmael's carpetbag marks him as a poor, mobile wanderer.",
    variants: ["carpet-bag"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-002-the-carpetbag"]
  },
  {
    id: "pulpit",
    term: "pulpit",
    category: "shipboard",
    definition: "A raised platform for preaching. Father Mapple's pulpit looks like a ship part, blending church and voyage.",
    variants: ["pulpits"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-008-the-pulpit"]
  },
  {
    id: "chowder",
    term: "chowder",
    category: "historical",
    definition: "A thick seafood stew. The chowder chapters ground the voyage in appetite, ports, and ordinary bodily comfort before the sea plot darkens.",
    variants: ["chowders"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-015-chowder"]
  },
  {
    id: "coffin-symbol",
    term: "coffin",
    category: "symbolic",
    definition: "A box for burial. Queequeg's coffin becomes one of the novel's strangest symbols because it shifts from death sign to survival tool.",
    variants: ["coffins", "coffin life-buoy"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "student-ready", citation_status: "provisional" },
    targets: ["chapter-110-queequeg-in-his-coffin", "chapter-126-the-life-buoy", "epilogue-epilogue"]
  },
  {
    id: "whiteness",
    term: "whiteness",
    category: "symbolic",
    definition: "A symbolic quality Melville refuses to reduce to one meaning. It can suggest purity, terror, blankness, racial ideology, and spiritual dread.",
    variants: ["white", "white whale"],
    citations: ["standard-ebooks-moby-dick"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-042-the-whiteness-of-the-whale"]
  },
  {
    id: "forge",
    term: "forge",
    category: "symbolic",
    definition: "A furnace and workspace for shaping metal. Ahab turns the forge into a ritual space for weapon-making.",
    variants: ["forged", "forging"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-113-the-forge"]
  },
  {
    id: "prophecy",
    term: "prophecy",
    category: "symbolic",
    definition: "A prediction or warning, often religious in tone. The novel uses prophecy to blur chance, fate, fear, and interpretation.",
    variants: ["prophet", "prophetic", "prophesy"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" }
  },
  {
    id: "oath",
    term: "oath",
    category: "symbolic",
    definition: "A solemn promise. On the quarterdeck, Ahab uses an oath to bind the crew emotionally to his private revenge.",
    variants: ["oaths"],
    citations: ["standard-ebooks-moby-dick", "webster-1913"],
    status: { definition_status: "draft", citation_status: "provisional" },
    targets: ["chapter-036-the-quarterdeck"]
  }
];

const referenceCardCandidates = [
  {
    id: "ahab-biblical-name",
    title: "Ahab's Biblical Name",
    kind: "biblical",
    summary: "Ahab's name carries biblical associations with corrupt kingship, idolatry, and destructive authority.",
    student_note: "Students do not need a full Bible background to notice the effect: Melville gives his captain a name that already sounds like a warning about rule and obsession.",
    targets: ["chapter-028-ahab", "chapter-036-the-quarterdeck", "chapter-119-the-candles"],
    citations: ["standard-ebooks-moby-dick", "king-james-bible"],
    status: { content_status: "draft", citation_status: "provisional" }
  },
  {
    id: "shipboard-hierarchy",
    title: "Shipboard Hierarchy",
    kind: "nautical",
    summary: "The Pequod runs through ranks: captain, mates, harpooneers, specialists, and ordinary sailors.",
    student_note: "That hierarchy matters because Ahab's private obsession can move the whole ship only because his command structure already exists.",
    targets: ["chapter-026-knights-and-squires", "chapter-027-knights-and-squires", "chapter-034-the-cabin-table"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { content_status: "draft", citation_status: "provisional" }
  },
  {
    id: "gams-and-news",
    title: "Gams and News at Sea",
    kind: "whaling",
    summary: "A gam is a meeting between whaling ships, often for news, mail, supplies, stories, and warnings.",
    student_note: "The gams keep reminding students that the Pequod is part of a wider whaling world, even as Ahab tries to narrow every encounter to Moby Dick.",
    targets: ["chapter-052-the-albatross", "chapter-053-the-gam", "chapter-071-the-jeroboam-s-story", "chapter-128-the-pequod-meets-the-rachel"],
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"],
    status: { content_status: "draft", citation_status: "provisional" }
  },
  {
    id: "sperm-whale-anatomy",
    title: "Sperm Whale Anatomy",
    kind: "whaling",
    summary: "Melville's sperm-whale chapters focus on head, spout, skin, tail, skeleton, and the oil-bearing parts whalers valued.",
    student_note: "The anatomy chapters are not only trivia. They show how work, profit, awe, and incomplete science all meet in the body of the whale.",
    targets: ["chapter-074-the-sperm-whale-s-head-contrasted-view", "chapter-085-the-fountain", "chapter-086-the-tail", "chapter-103-measurement-of-the-whale-s-skeleton"],
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl", "noaa-sperm-whale"],
    status: { content_status: "draft", citation_status: "provisional" }
  },
  {
    id: "difficult-religious-language",
    title: "Religious Difference and Harmful Labels",
    kind: "historical",
    summary: "The novel often describes non-Christian religion through comic, Christian, and racialized assumptions.",
    student_note: "The guide should help students see both the warmth of Ishmael's friendship with Queequeg and the harm in labels such as heathen, idolator, and savage.",
    targets: ["chapter-010-a-bosom-friend", "chapter-017-the-ramadan", "chapter-018-his-mark"],
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "whiteness-symbol",
    title: "Whiteness as a Symbol",
    kind: "literary",
    summary: "The whiteness chapter gathers many meanings without resolving them into one stable symbol.",
    student_note: "Students should resist asking for a single answer. Melville makes whiteness frightening partly because it can mean too much and too little at once.",
    targets: ["chapter-041-moby-dick", "chapter-042-the-whiteness-of-the-whale"],
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "draft", citation_status: "provisional" }
  },
  {
    id: "pip-and-castaway-trauma",
    title: "Pip, Castaway, and Mental Strain",
    kind: "literary",
    summary: "Pip's abandonment at sea changes how the novel speaks about fear, survival, and sanity.",
    student_note: "This material needs careful classroom handling. The novel's language can be startling, but Pip is not just comic relief; he becomes one of the book's sharpest truth-tellers.",
    targets: ["chapter-093-the-castaway", "chapter-125-the-log-and-line"],
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "needs-review", citation_status: "provisional" }
  },
  {
    id: "coffin-life-buoy-symbol",
    title: "Coffin and Life-Buoy",
    kind: "literary",
    summary: "Queequeg's coffin changes meanings: death object, crafted possession, ship equipment, and survival device.",
    student_note: "The symbol works because it does not stop being a coffin when it becomes useful. Survival in the epilogue depends on an object marked by death.",
    targets: ["chapter-110-queequeg-in-his-coffin", "chapter-126-the-life-buoy", "epilogue-epilogue"],
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "student-ready", citation_status: "provisional" }
  },
  {
    id: "storm-fire-and-navigation",
    title: "Storm, Fire, and Navigation",
    kind: "nautical",
    summary: "The late storm chapters turn ordinary navigation tools into symbols of authority, rebellion, and broken guidance.",
    student_note: "Compass, quadrant, lightning, and log-line are practical tools first. Their symbolic force comes from watching them fail or get remade under Ahab's pressure.",
    targets: ["chapter-118-the-quadrant", "chapter-119-the-candles", "chapter-124-the-needle", "chapter-125-the-log-and-line"],
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "draft", citation_status: "provisional" }
  },
  {
    id: "final-chase-structure",
    title: "The Three-Day Chase",
    kind: "literary",
    summary: "The final chase unfolds over three chapters, tightening pursuit, damage, refusal, and consequence.",
    student_note: "The structure matters: each day gives Ahab another chance to read disaster as warning, and each day he presses forward.",
    targets: ["chapter-133-the-chase-first-day", "chapter-134-the-chase-second-day", "chapter-135-the-chase-third-day"],
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "student-ready", citation_status: "provisional" }
  }
];

const annotationCandidates = [
  {
    id: "etymology-dictionary-satire",
    unit_id: "frontmatter-etymology",
    kind: "form",
    anchor: "pale Usher",
    note: "The book begins by making scholarship look odd and fragile. Even before Chapter 1, Melville frames whale knowledge as a pile of languages, guesses, and human bodies.",
    tags: ["trail:cetology-classification", "form:preface"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "interpretive"
  },
  {
    id: "extracts-whale-scrapbook",
    unit_id: "frontmatter-extracts",
    kind: "form",
    anchor: "long Vaticans and street-stalls of the earth",
    note: "The Extracts build a whale scrapbook from sacred texts, travel writing, science, jokes, and literature. That mixed archive prepares students for a novel that keeps changing genres.",
    tags: ["trail:biblical-classical-allusion", "form:archive"],
    relationships: [{ type: "belongs-to-trail", target: "trail:biblical-classical-allusion" }],
    claim_type: "interpretive"
  },
  {
    id: "carpetbag-poverty-choice",
    unit_id: "chapter-002-the-carpetbag",
    kind: "context",
    anchor: "my old carpetbag",
    note: "Ishmael travels light, poor, and alone. The small bag keeps the opening grounded in ordinary vulnerability before the book expands into mythic scale.",
    tags: ["entity:ishmael", "theme:mobility"],
    relationships: [{ type: "mentions-entity", target: "entity:ishmael" }],
    claim_type: "source-text-observation"
  },
  {
    id: "counterpane-memory-touch",
    unit_id: "chapter-004-the-counterpane",
    kind: "theme",
    anchor: "Counterpane",
    note: "The bedspread triggers one of Ishmael's childhood memories of fear and touch. The chapter uses comedy with Queequeg to open a deeper question about intimacy and safety.",
    tags: ["trail:ishmael-queequeg", "entity:ishmael", "entity:queequeg"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "mentions-entity", target: "entity:ishmael" },
      { type: "mentions-entity", target: "entity:queequeg" },
      { type: "defines-term", target: "glossary:counterpane" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "breakfast-social-comedy",
    unit_id: "chapter-005-breakfast",
    kind: "form",
    anchor: "good laugh is a mighty good thing",
    note: "The breakfast scene turns dangerous-looking whalers into awkward hotel guests. Melville often deflates heroic sea romance by showing ordinary social embarrassment.",
    tags: ["form:comic", "trail:whaling-labor"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "interpretive"
  },
  {
    id: "street-global-port",
    unit_id: "chapter-006-the-street",
    kind: "difficult-material",
    anchor: "cannibals",
    note: "New Bedford appears as a global port, but Ishmael describes nonwhite sailors through sensational labels. The guide should explain the port's diversity while naming the racialized language.",
    tags: ["trail:race-empire-global-crew", "review:difficult-material"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "defines-term", target: "glossary:cannibal" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "chapel-tablets-memory",
    unit_id: "chapter-007-the-chapel",
    kind: "theme",
    anchor: "marble tablets",
    note: "The chapel tablets show whaling as grief before they show it as adventure. Students meet the cost of the industry before the Pequod leaves shore.",
    tags: ["trail:whaling-labor", "theme:mourning"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "interpretive"
  },
  {
    id: "pulpit-ship-church",
    unit_id: "chapter-008-the-pulpit",
    kind: "form",
    anchor: "Father Mapple",
    note: "Father Mapple's pulpit fuses church architecture with ship imagery. The sermon will not be separate from the voyage; it launches the moral weather of the book.",
    tags: ["trail:biblical-classical-allusion", "form:sermon"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "defines-term", target: "glossary:pulpit" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "bosom-friend-sober-cannibal",
    unit_id: "chapter-010-a-bosom-friend",
    kind: "difficult-material",
    anchor: "heathenish way",
    note: "The sentence is affectionate and harmful at once. Ishmael moves toward friendship with Queequeg while still using a racialized label that needs context.",
    tags: ["trail:ishmael-queequeg", "trail:race-empire-global-crew", "review:difficult-material"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "mentions-entity", target: "entity:queequeg" },
      { type: "defines-term", target: "glossary:cannibal" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "nightgown-shared-warmth",
    unit_id: "chapter-011-nightgown",
    kind: "theme",
    anchor: "we felt very nice and snug",
    note: "The chapter pauses the plot for bodily comfort and trust. That warmth makes the later shipboard isolation feel less like the book's only possible world.",
    tags: ["trail:ishmael-queequeg", "theme:fellowship"],
    relationships: [{ type: "belongs-to-trail", target: "trail:ishmael-queequeg" }],
    claim_type: "interpretive"
  },
  {
    id: "biographical-queequeg-king",
    unit_id: "chapter-012-biographical",
    kind: "context",
    anchor: "son of a King",
    note: "Queequeg's backstory gives him dignity, desire, and history beyond Ishmael's first fear. The narration still filters that story through exoticizing assumptions.",
    tags: ["trail:ishmael-queequeg", "trail:race-empire-global-crew", "entity:queequeg"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "mentions-entity", target: "entity:queequeg" }
    ],
    claim_type: "interpretive",
    content_status: "draft"
  },
  {
    id: "wheelbarrow-cultural-misreading",
    unit_id: "chapter-013-wheelbarrow",
    kind: "theme",
    anchor: "wheelbarrow",
    note: "The wheelbarrow joke cuts both ways: Queequeg misunderstands a New England object, but he also tells a story that makes white customs look just as strange.",
    tags: ["trail:ishmael-queequeg", "theme:perspective"],
    relationships: [{ type: "belongs-to-trail", target: "trail:ishmael-queequeg" }],
    claim_type: "interpretive"
  },
  {
    id: "nantucket-sand-sea-power",
    unit_id: "chapter-014-nantucket",
    kind: "context",
    anchor: "Nantucket",
    note: "Nantucket is tiny on land but huge in the novel's whaling imagination. Ishmael turns a sandy island into a world center of ocean labor.",
    tags: ["trail:whaling-labor", "entity:nantucket"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:nantucket" },
      { type: "defines-term", target: "glossary:nantucket" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "chowder-bodily-comfort",
    unit_id: "chapter-015-chowder",
    kind: "context",
    anchor: "clam or cod",
    note: "The chowder chapter is comic, but it also slows the book down around food, appetite, and local port life before the Pequod's danger takes over.",
    tags: ["theme:food", "entity:nantucket"],
    relationships: [
      { type: "mentions-entity", target: "entity:nantucket" },
      { type: "defines-term", target: "glossary:chowder" }
    ],
    claim_type: "source-text-observation"
  },
  {
    id: "ramadan-religious-comedy",
    unit_id: "chapter-017-the-ramadan",
    kind: "difficult-material",
    anchor: "Ramadan",
    note: "Ishmael treats Queequeg's religious practice as comic inconvenience. A student note should separate the scene's humor from the narrator's limited understanding of another religion.",
    tags: ["trail:ishmael-queequeg", "trail:race-empire-global-crew", "review:difficult-material"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "defines-term", target: "glossary:ramadan" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "his-mark-contract-faith",
    unit_id: "chapter-018-his-mark",
    kind: "theme",
    anchor: "his mark",
    note: "Queequeg's signature turns friendship, religion, literacy, and labor contract into one scene. The chapter asks who gets recognized as trustworthy in a commercial world.",
    tags: ["trail:ishmael-queequeg", "trail:law-property-politics", "entity:queequeg"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "belongs-to-trail", target: "trail:law-property-politics" },
      { type: "mentions-entity", target: "entity:queequeg" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "prophet-elijah-warning",
    unit_id: "chapter-019-the-prophet",
    kind: "context",
    anchor: "Elijah",
    note: "The stranger's biblical name makes his warning feel larger than ordinary dockside gossip. Melville keeps prophecy half-comic and half-credible.",
    tags: ["trail:symbols-prophecy", "trail:biblical-classical-allusion"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "defines-term", target: "glossary:elijah" }
    ],
    claim_type: "biblical-context",
    citations: ["standard-ebooks-moby-dick", "king-james-bible"]
  },
  {
    id: "all-astir-ship-as-workplace",
    unit_id: "chapter-020-all-astir",
    kind: "context",
    anchor: "great activity aboard the Pequod",
    note: "The ship is a workplace before it is a symbol. Loading, preparing, and managing the Pequod make Ahab's later quest depend on ordinary labor.",
    tags: ["trail:whaling-labor", "entity:pequod"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:pequod" }
    ],
    claim_type: "source-text-observation"
  },
  {
    id: "going-aboard-shadowed-departure",
    unit_id: "chapter-021-going-aboard",
    kind: "theme",
    anchor: "Going Aboard",
    note: "The departure is full of darkness, confusion, and half-seen figures. Melville makes boarding the ship feel like crossing into a different moral climate.",
    tags: ["trail:symbols-prophecy", "entity:pequod"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:pequod" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "merry-christmas-ahab-absence",
    unit_id: "chapter-022-merry-christmas",
    kind: "theme",
    anchor: "Captain Ahab is all ready",
    note: "Ahab's absence is active suspense. The captain controls the voyage before students fully meet him because everyone else is already oriented around him.",
    tags: ["entity:ahab", "entity:pequod", "theme:suspense"],
    relationships: [
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:pequod" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "lee-shore-bulkington-symbol",
    unit_id: "chapter-023-the-lee-shore",
    kind: "theme",
    anchor: "Bulkington",
    note: "Bulkington's tiny chapter reads like a symbolic epitaph for people who cannot live safely on shore. It teaches students that some short chapters carry heavy thematic weight.",
    tags: ["trail:symbols-prophecy", "theme:shore-sea"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "defines-term", target: "glossary:lee" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "postscript-coronation-oil",
    unit_id: "chapter-025-postscript",
    kind: "theme",
    anchor: "coronation",
    note: "Ishmael links whale oil to royal ceremony, turning a commodity into political symbolism. The joke also asks what kinds of labor support public glory.",
    tags: ["trail:law-property-politics", "trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:law-property-politics" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "ahab-ivory-leg",
    unit_id: "chapter-028-ahab",
    kind: "context",
    anchor: "nothing above hatches was seen of Captain Ahab",
    note: "Ahab's body carries the whale encounter before his story explains it. The ivory leg makes injury, whaling violence, and command visible at once.",
    tags: ["trail:ahab-starbuck", "entity:ahab", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:moby-dick" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "enter-ahab-stubb-command",
    unit_id: "chapter-029-enter-ahab-to-him-stubb",
    kind: "form",
    anchor: "Some days elapsed",
    note: "The chapter title sounds like stage direction, and the scene plays like a tense exchange between authority and comic resistance.",
    tags: ["trail:theater-form-experiments", "entity:ahab", "entity:stubb"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:stubb" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "pipe-renounces-comfort",
    unit_id: "chapter-030-the-pipe",
    kind: "theme",
    anchor: "smoke no more",
    note: "Ahab gives up the pipe because ordinary comfort no longer fits his purpose. The small object shows how completely revenge has reorganized him.",
    tags: ["trail:ahab-starbuck", "entity:ahab", "theme:obsession"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "queen-mab-dream-warning",
    unit_id: "chapter-031-queen-mab",
    kind: "context",
    anchor: "queer dream",
    note: "Stubb's dream keeps the book's warnings in a comic register. Even jokes and dreams become part of the prophecy system around Ahab.",
    tags: ["trail:symbols-prophecy", "trail:biblical-classical-allusion", "entity:stubb"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "mentions-entity", target: "entity:stubb" },
      { type: "defines-term", target: "glossary:queen-mab" }
    ],
    claim_type: "classical-context",
    citations: ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]
  },
  {
    id: "specksnyder-whaling-hierarchy",
    unit_id: "chapter-033-the-specksnyder",
    kind: "context",
    anchor: "Specksnyder",
    note: "Ishmael pauses over a technical rank because whaling command is not the same as ordinary naval command. The business has its own labor hierarchy.",
    tags: ["trail:whaling-labor", "theme:hierarchy"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:specksnyder" },
      { type: "supports-reference", target: "reference:shipboard-hierarchy" }
    ],
    claim_type: "nautical-whaling",
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]
  },
  {
    id: "cabin-table-hierarchy",
    unit_id: "chapter-034-the-cabin-table",
    kind: "theme",
    anchor: "Dough-Boy",
    note: "Meals aboard the Pequod reveal rank. Who sits, who serves, and who waits all show that shipboard order is built into daily habits.",
    tags: ["trail:whaling-labor", "theme:hierarchy"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "supports-reference", target: "reference:shipboard-hierarchy" }
    ],
    claim_type: "source-text-observation"
  },
  {
    id: "masthead-daydream-danger",
    unit_id: "chapter-035-the-masthead",
    kind: "theme",
    anchor: "my first masthead",
    note: "The masthead turns lookout duty into philosophy and danger. Ishmael warns that dreamy abstraction can be beautiful and deadly when labor requires attention.",
    tags: ["trail:cetology-classification", "trail:whaling-labor", "entity:ishmael"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:ishmael" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "first-night-watch-stubb-response",
    unit_id: "chapter-039-first-night-watch",
    kind: "form",
    anchor: "Stubb solus",
    note: "The Latin stage direction marks the chapter as theater. Stubb's private voice gives students another way to hear how Ahab's command affects the crew.",
    tags: ["trail:theater-form-experiments", "entity:stubb"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "mentions-entity", target: "entity:stubb" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "moby-dick-rumor-network",
    unit_id: "chapter-041-moby-dick",
    kind: "context",
    anchor: "Moby Dick",
    note: "This chapter turns the whale into a rumor network before he is a visible animal. Ahab's obsession feeds on stories circulating through the whaling world.",
    tags: ["trail:gams-foreshadowing", "entity:moby-dick", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:moby-dick" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "chart-rational-obsession",
    unit_id: "chapter-044-the-chart",
    kind: "theme",
    anchor: "solitude of his cabin",
    note: "Ahab's madness is not careless; it is organized, mathematical, and patient. The chart shows obsession borrowing the tools of reason.",
    tags: ["trail:ahab-starbuck", "entity:ahab", "theme:navigation"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "affidavit-evidence-performance",
    unit_id: "chapter-045-the-affidavit",
    kind: "form",
    anchor: "natural verity",
    note: "Ishmael borrows the language of legal proof to defend whale stories that sound unbelievable. The form matters because the novel keeps testing evidence and belief.",
    tags: ["trail:law-property-politics", "form:legal"],
    relationships: [{ type: "belongs-to-trail", target: "trail:law-property-politics" }],
    claim_type: "interpretive"
  },
  {
    id: "surmises-ahab-management",
    unit_id: "chapter-046-surmises",
    kind: "theme",
    anchor: "monomania",
    note: "Ahab is powerful, but he also has to manage the crew's motives. The chapter shows strategy inside obsession.",
    tags: ["trail:ahab-starbuck", "entity:ahab", "theme:command"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "mat-maker-fate-weaving",
    unit_id: "chapter-047-the-mat-maker",
    kind: "theme",
    anchor: "sword-mat",
    note: "The mat-making scene turns manual work into a model of fate, chance, and choice. Melville makes philosophy appear inside ordinary craft.",
    tags: ["trail:symbols-prophecy", "trail:whaling-labor", "entity:ishmael", "entity:queequeg"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:ishmael" },
      { type: "mentions-entity", target: "entity:queequeg" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "first-lowering-fedallah-reveal",
    unit_id: "chapter-048-the-first-lowering",
    kind: "difficult-material",
    anchor: "The phantoms",
    note: "Fedallah's crew appears through exoticizing and racialized spectacle. The reveal is important for plot, but the description should be handled with care.",
    tags: ["trail:race-empire-global-crew", "entity:fedallah", "review:difficult-material"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "mentions-entity", target: "entity:fedallah" },
      { type: "defines-term", target: "glossary:phantom" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "fedallah-private-crew",
    unit_id: "chapter-050-ahab-s-boat-and-crew-fedallah",
    kind: "context",
    anchor: "Fedallah",
    note: "Ahab's hidden boat crew shows that he has prepared a private mission inside the public voyage. Fedallah becomes part of the book's secrecy and omen system.",
    tags: ["trail:symbols-prophecy", "trail:race-empire-global-crew", "entity:fedallah", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "mentions-entity", target: "entity:fedallah" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:fedallah" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "spirit-spout-omen",
    unit_id: "chapter-051-the-spirit-spout",
    kind: "theme",
    anchor: "silvery jet",
    note: "The spout works like an omen because it may be natural, imagined, or both. Melville lets uncertainty create pressure.",
    tags: ["trail:symbols-prophecy", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "defines-term", target: "glossary:spout" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "albatross-gam-failure",
    unit_id: "chapter-052-the-albatross",
    kind: "form",
    anchor: "Goney (Albatross)",
    note: "The failed meeting with the Albatross makes communication at sea feel fragile. A gam can bring news, but this one turns into silence and missed warning.",
    tags: ["trail:gams-foreshadowing", "form:gam"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "supports-reference", target: "reference:gams-and-news" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "gam-definition-social-meeting",
    unit_id: "chapter-053-the-gam",
    kind: "context",
    anchor: "peculiar usages of whaling-vessels",
    note: "Melville pauses to define a gam because ship encounters will carry plot, rumor, and moral tests. The term is technical and structural at once.",
    tags: ["trail:gams-foreshadowing", "form:gam"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "defines-term", target: "glossary:gam" },
      { type: "supports-reference", target: "reference:gams-and-news" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "pictures-visual-trust",
    unit_id: "chapter-055-of-the-monstrous-pictures-of-whales",
    kind: "form",
    anchor: "pictorial delusions",
    note: "Ishmael is teaching visual literacy: not every famous image of a whale can be trusted. The chapter connects art, error, and scientific uncertainty.",
    tags: ["trail:cetology-classification", "form:visual-culture"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "interpretive"
  },
  {
    id: "true-pictures-whaling-scenes",
    unit_id: "chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes",
    kind: "form",
    anchor: "Beale\u2019s is the best",
    note: "After mocking bad whale pictures, Ishmael asks what accurate representation would require. The issue is not only art; it is how hard whaling knowledge is to witness.",
    tags: ["trail:cetology-classification", "trail:whaling-labor", "form:visual-culture"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "line-danger-labor",
    unit_id: "chapter-060-the-line",
    kind: "context",
    anchor: "The whale-line",
    note: "The whale-line is a tool that can instantly become lethal. This chapter is one of the clearest places where whaling labor appears as bodily risk.",
    tags: ["trail:whaling-labor", "theme:risk"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:whale-line" },
      { type: "supports-reference", target: "reference:whaling-as-labor" }
    ],
    claim_type: "nautical-whaling",
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]
  },
  {
    id: "stubb-kills-whale-violence",
    unit_id: "chapter-061-stubb-kills-a-whale",
    kind: "difficult-material",
    anchor: "apparition of the Squid",
    note: "The chapter makes animal suffering part of the work, not a side detail. A student edition should neither hide the violence nor treat it as simple adventure.",
    tags: ["trail:whaling-labor", "review:difficult-material", "entity:stubb"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:stubb" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "stubbs-supper-fleece",
    unit_id: "chapter-064-stubb-s-supper",
    kind: "difficult-material",
    anchor: "Fleece",
    note: "Fleece's scene is comic in form but shaped by racial hierarchy and coercion. The guide should help students see how humor can carry harm.",
    tags: ["trail:race-empire-global-crew", "review:difficult-material", "entity:stubb"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "mentions-entity", target: "entity:stubb" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "cutting-in-industrial-process",
    unit_id: "chapter-067-cutting-in",
    kind: "context",
    anchor: "every sailor a butcher",
    note: "The hunt is only the start of the work. Cutting-in shows the whale becoming a processed commodity through coordinated shipboard labor.",
    tags: ["trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:cutting-in" },
      { type: "supports-reference", target: "reference:whaling-as-labor" }
    ],
    claim_type: "nautical-whaling",
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]
  },
  {
    id: "blanket-whale-skin",
    unit_id: "chapter-068-the-blanket",
    kind: "context",
    anchor: "blanket",
    note: "Melville turns whale skin into an object of close description. The chapter asks students to think about an animal body as texture, commodity, and mystery at once.",
    tags: ["trail:cetology-classification", "trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "sphynx-speaking-head",
    unit_id: "chapter-070-the-sphynx",
    kind: "theme",
    anchor: "Speak, thou vast and venerable head",
    note: "Ahab addresses the whale's head as if it could reveal hidden truth. The scene shows his need to force meaning out of matter.",
    tags: ["trail:symbols-prophecy", "entity:ahab", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:moby-dick" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "jeroboam-gabriel-contagion",
    unit_id: "chapter-071-the-jeroboam-s-story",
    kind: "context",
    anchor: "Gabriel",
    note: "Gabriel turns shipboard illness and fear into prophecy. The gam becomes a warning Ahab can hear but refuses to receive.",
    tags: ["trail:gams-foreshadowing", "trail:symbols-prophecy", "trail:biblical-classical-allusion"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "defines-term", target: "glossary:gabriel" }
    ],
    claim_type: "biblical-context",
    citations: ["standard-ebooks-moby-dick", "king-james-bible"]
  },
  {
    id: "monkey-rope-interdependence",
    unit_id: "chapter-072-the-monkey-rope",
    kind: "theme",
    anchor: "monkey-rope",
    note: "The rope makes Ishmael and Queequeg literally responsible for each other's lives. Melville turns friendship into a physical system of shared risk.",
    tags: ["trail:ishmael-queequeg", "trail:whaling-labor", "entity:ishmael", "entity:queequeg"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:ishmael" },
      { type: "mentions-entity", target: "entity:queequeg" },
      { type: "defines-term", target: "glossary:monkey-rope" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "sperm-whale-head-classification",
    unit_id: "chapter-074-the-sperm-whale-s-head-contrasted-view",
    kind: "context",
    anchor: "Sperm Whale and the Right Whale",
    note: "The contrasted head chapters are classification by close looking. Ishmael wants anatomical order, but his descriptions keep sliding into awe.",
    tags: ["trail:cetology-classification", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "supports-reference", target: "reference:sperm-whale-anatomy" },
      { type: "defines-term", target: "glossary:sperm-whale" }
    ],
    claim_type: "nautical-whaling",
    citations: ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"]
  },
  {
    id: "right-whale-head-contrast",
    unit_id: "chapter-075-the-right-whale-s-head-contrasted-view",
    kind: "context",
    anchor: "Right Whale\u2019s head",
    note: "The right whale becomes useful because it is different. Melville teaches by contrast, making anatomy into a sorting problem.",
    tags: ["trail:cetology-classification"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "supports-reference", target: "reference:sperm-whale-anatomy" },
      { type: "defines-term", target: "glossary:right-whale" }
    ],
    claim_type: "nautical-whaling",
    citations: ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]
  },
  {
    id: "cistern-tashtego-rescue",
    unit_id: "chapter-078-cistern-and-buckets",
    kind: "theme",
    anchor: "Tashtego",
    note: "The suspense around Tashtego's fall turns technical labor into crisis. The chapter reminds students that whale processing is dangerous after the whale is already dead.",
    tags: ["trail:whaling-labor", "trail:race-empire-global-crew", "entity:tashtego"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "mentions-entity", target: "entity:tashtego" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "virgin-gam-competition",
    unit_id: "chapter-081-the-pequod-meets-the-virgin",
    kind: "form",
    anchor: "Jungfrau",
    note: "The gam with the Virgin turns whaling into public competition. Humor, national identity, and labor all collide around a whale chase.",
    tags: ["trail:gams-foreshadowing", "trail:whaling-labor", "form:gam"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "supports-reference", target: "reference:gams-and-news" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "jonah-historical-literalism",
    unit_id: "chapter-083-jonah-historically-regarded",
    kind: "form",
    anchor: "historical story of Jonah",
    note: "Ishmael treats a biblical story with mock scholarship. The chapter is funny because it takes an impossible question very seriously.",
    tags: ["trail:biblical-classical-allusion", "trail:cetology-classification", "form:mock-scholarship"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "defines-term", target: "glossary:jonah" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "pitchpoling-specialized-skill",
    unit_id: "chapter-084-pitchpoling",
    kind: "context",
    anchor: "Pitchpoling",
    note: "This short technical chapter adds to the guide's labor map. It shows that whaling skill is specialized, practiced, and hard to see from outside.",
    tags: ["trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:pitchpoling" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "fountain-science-uncertainty",
    unit_id: "chapter-085-the-fountain",
    kind: "form",
    anchor: "spout",
    note: "Ishmael asks what the whale's spout really is and keeps the answer unstable. The chapter models curiosity without final mastery.",
    tags: ["trail:cetology-classification", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "supports-reference", target: "reference:sperm-whale-anatomy" },
      { type: "defines-term", target: "glossary:spout" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "tail-power-symbol",
    unit_id: "chapter-086-the-tail",
    kind: "theme",
    anchor: "tail",
    note: "The tail is anatomy, weapon, and symbol of unreadable power. Ishmael can describe its motions, but not finally control what it means.",
    tags: ["trail:cetology-classification", "trail:symbols-prophecy", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "defines-term", target: "glossary:fluke" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "grand-armada-enchanted-calm",
    unit_id: "chapter-087-the-grand-armada",
    kind: "theme",
    anchor: "enchanted calm",
    note: "Inside the violence of pursuit, Ishmael finds a still center among the whales. The scene complicates whaling by making the hunted animals socially and emotionally vivid.",
    tags: ["trail:whaling-labor", "theme:animal-life"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "interpretive"
  },
  {
    id: "heads-or-tails-queen-property",
    unit_id: "chapter-090-heads-or-tails",
    kind: "theme",
    anchor: "Queen",
    note: "The chapter extends whaling law into state power. Melville keeps asking who gets to claim value from bodies, labor, and territory.",
    tags: ["trail:law-property-politics", "theme:property"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:law-property-politics" },
      { type: "supports-reference", target: "reference:fast-fish-property" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "castaway-pip-trauma",
    unit_id: "chapter-093-the-castaway",
    kind: "difficult-material",
    anchor: "Pip",
    note: "Pip's abandonment is a trauma scene, not just a plot device. The novel's language about his mind needs careful, non-mocking classroom framing.",
    tags: ["entity:pip", "review:difficult-material", "theme:mental-strain"],
    relationships: [
      { type: "mentions-entity", target: "entity:pip" },
      { type: "supports-reference", target: "reference:pip-and-castaway-trauma" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "squeeze-fellowship-labor",
    unit_id: "chapter-094-a-squeeze-of-the-hand",
    kind: "theme",
    anchor: "this same sperm was carefully manipulated",
    note: "The messy work of processing sperm becomes a fantasy of human fellowship. The chapter is strange because labor, touch, comedy, and longing all occupy the same scene.",
    tags: ["trail:whaling-labor", "theme:fellowship"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "supports-reference", target: "reference:whaling-as-labor" },
      { type: "defines-term", target: "glossary:spermaceti" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "try-works-industrial-nightmare",
    unit_id: "chapter-096-the-try-works",
    kind: "theme",
    anchor: "try-works",
    note: "The try-works turn the Pequod into a floating factory and a nightmare image. Fire, oil, profit, and disorientation all come together here.",
    tags: ["trail:whaling-labor", "trail:symbols-prophecy"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "defines-term", target: "glossary:try-works" },
      { type: "supports-reference", target: "reference:whaling-as-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "leg-and-arm-gam-mirror",
    unit_id: "chapter-100-leg-and-arm",
    kind: "form",
    anchor: "Samuel Enderby",
    note: "The Samuel Enderby gives Ahab a mirror: another captain has met Moby Dick and survived without turning survival into total revenge.",
    tags: ["trail:gams-foreshadowing", "trail:ahab-starbuck", "entity:ahab", "form:gam"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "arsacides-ethnographic-frame",
    unit_id: "chapter-102-a-bower-in-the-arsacides",
    kind: "difficult-material",
    anchor: "Arsacides",
    note: "Ishmael's whale-skeleton story uses ethnographic and colonial habits of description. The guide should keep the whale knowledge while reviewing the human framing carefully.",
    tags: ["trail:race-empire-global-crew", "trail:cetology-classification", "review:difficult-material"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "defines-term", target: "glossary:arsacides" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "skeleton-measurement-scale",
    unit_id: "chapter-103-measurement-of-the-whale-s-skeleton",
    kind: "context",
    anchor: "skeleton",
    note: "Measurement gives the whale scale, but it does not exhaust the whale's meaning. Melville keeps moving between numbers and awe.",
    tags: ["trail:cetology-classification", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "supports-reference", target: "reference:sperm-whale-anatomy" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "fossil-whale-deep-time",
    unit_id: "chapter-104-the-fossil-whale",
    kind: "theme",
    anchor: "Fossil Whale",
    note: "The fossil chapter expands the whale into deep time. The effect is to make Ahab's personal revenge look tiny against natural history.",
    tags: ["trail:cetology-classification", "entity:moby-dick", "theme:deep-time"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "mentions-entity", target: "entity:moby-dick" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "whale-magnitude-extinction",
    unit_id: "chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish",
    kind: "theme",
    anchor: "whether, in the long course of his generations",
    note: "Ishmael asks whether whales can be diminished or disappear. For modern readers, the question opens a bridge between nineteenth-century whaling and conservation concerns.",
    tags: ["trail:cetology-classification", "trail:whaling-labor", "theme:conservation"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "uses-source", target: "source:noaa-sperm-whale" }
    ],
    claim_type: "interpretive",
    citations: ["standard-ebooks-moby-dick", "noaa-sperm-whale"]
  },
  {
    id: "ahabs-leg-body-repair",
    unit_id: "chapter-106-ahab-s-leg",
    kind: "theme",
    anchor: "ivory leg had received a half-splintering shock",
    note: "Ahab's injury keeps returning through objects, repairs, and command. His body is part of the ship's material system, not separate from it.",
    tags: ["trail:ahab-starbuck", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "carpenter-practical-comedy",
    unit_id: "chapter-107-the-carpenter",
    kind: "form",
    anchor: "The Carpenter",
    note: "The carpenter sees bodies, ships, and objects as repair problems. His practical comedy throws Ahab's grand metaphysics into relief.",
    tags: ["trail:theater-form-experiments", "trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:carpenter" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "ahab-carpenter-body-object",
    unit_id: "chapter-108-ahab-and-the-carpenter",
    kind: "theme",
    anchor: "ivory joist for the leg",
    note: "The scene turns Ahab's leg into an argument about whether a person can be reduced to parts. Ahab wants cosmic meaning; the carpenter sees a job.",
    tags: ["trail:theater-form-experiments", "trail:ahab-starbuck", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "cabin-musket-choice",
    unit_id: "chapter-109-ahab-and-starbuck-in-the-cabin",
    kind: "theme",
    anchor: "loaded musket",
    note: "Starbuck's crisis is moral and practical: stopping Ahab might save the ship, but it would also mean violence against his captain. Melville refuses to make conscience easy.",
    tags: ["trail:ahab-starbuck", "entity:ahab", "entity:starbuck"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:starbuck" },
      { type: "supports-reference", target: "reference:ahab-and-starbuck" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "queequeg-coffin-symbol-seed",
    unit_id: "chapter-110-queequeg-in-his-coffin",
    kind: "theme",
    anchor: "coffin",
    note: "Queequeg's coffin begins as preparation for death, but it will not keep a single meaning. The object gathers friendship, craft, mortality, and future survival.",
    tags: ["trail:ishmael-queequeg", "trail:symbols-prophecy", "entity:queequeg", "entity:coffin"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ishmael-queequeg" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:queequeg" },
      { type: "mentions-entity", target: "entity:coffin" },
      { type: "defines-term", target: "glossary:coffin-symbol" },
      { type: "supports-reference", target: "reference:coffin-life-buoy-symbol" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "pacific-false-peace",
    unit_id: "chapter-111-the-pacific",
    kind: "theme",
    anchor: "Pacific",
    note: "The Pacific seems calm and beautiful, but the calm is not safety. Melville uses the ocean's name ironically as the final pursuit nears.",
    tags: ["trail:symbols-prophecy", "entity:pacific-ocean"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:pacific-ocean" },
      { type: "defines-term", target: "glossary:pacific" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "blacksmith-perth-backstory",
    unit_id: "chapter-112-the-blacksmith",
    kind: "context",
    anchor: "Perth",
    note: "Perth's backstory brings ordinary human ruin into the late symbolic machinery. The forge is not only mythic; it belongs to a damaged worker.",
    tags: ["trail:whaling-labor", "theme:backstory"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:blacksmith" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "forge-baptism-weapon",
    unit_id: "chapter-113-the-forge",
    kind: "theme",
    anchor: "baptizo",
    note: "Ahab twists religious language into a weapon-making ritual. The scene makes the harpoon feel sacramental in the darkest possible way.",
    tags: ["trail:symbols-prophecy", "trail:biblical-classical-allusion", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:forge" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "gilder-beauty-danger",
    unit_id: "chapter-114-the-gilder",
    kind: "theme",
    anchor: "smooth, slow heaving swells",
    note: "The sea's beauty gilds danger without removing it. This quiet chapter matters because it shows why the voyage can still seduce the senses.",
    tags: ["trail:symbols-prophecy", "theme:beauty-danger"],
    relationships: [{ type: "belongs-to-trail", target: "trail:symbols-prophecy" }],
    claim_type: "interpretive"
  },
  {
    id: "bachelor-contrast-joy",
    unit_id: "chapter-115-the-pequod-meets-the-bachelor",
    kind: "form",
    anchor: "Bachelor",
    note: "The Bachelor is cheerful, successful, and homeward-bound, which makes the Pequod's course look chosen rather than inevitable.",
    tags: ["trail:gams-foreshadowing", "form:gam", "entity:pequod"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "mentions-entity", target: "entity:pequod" },
      { type: "supports-reference", target: "reference:gams-and-news" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "dying-whale-sunset",
    unit_id: "chapter-116-the-dying-whale",
    kind: "theme",
    anchor: "sun and whale both stilly died together",
    note: "The dying whale turns toward the sun, and Ahab reads the scene through his own hunger for meaning. Animal death becomes another symbolic mirror.",
    tags: ["trail:symbols-prophecy", "entity:ahab", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:moby-dick" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "whale-watch-hearse-prophecy",
    unit_id: "chapter-117-the-whale-watch",
    kind: "theme",
    anchor: "hearse",
    note: "Fedallah's prophecy sounds impossible because its images do not fit ordinary sea life. That strangeness lets Ahab misread danger as safety.",
    tags: ["trail:symbols-prophecy", "entity:fedallah", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:fedallah" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:prophecy" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "quadrant-smashed-navigation",
    unit_id: "chapter-118-the-quadrant",
    kind: "theme",
    anchor: "quadrant",
    note: "Ahab destroys a tool of navigation because it cannot answer the question he cares about. The act turns practical science into a target of rage.",
    tags: ["trail:ahab-starbuck", "theme:navigation", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:quadrant" },
      { type: "supports-reference", target: "reference:storm-fire-and-navigation" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "candles-corpusants",
    unit_id: "chapter-119-the-candles",
    kind: "context",
    anchor: "corpusants",
    note: "The glowing storm-fire is a real sailors' phenomenon, but the crew reads it as an omen. The scene lets natural event and symbolic terror occupy the same space.",
    tags: ["trail:symbols-prophecy", "theme:storm"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "defines-term", target: "glossary:corpusants" },
      { type: "supports-reference", target: "reference:storm-fire-and-navigation" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "deck-command-watch",
    unit_id: "chapter-120-the-deck-towards-the-end-of-the-first-night-watch",
    kind: "form",
    anchor: "Ahab standing by the helm",
    note: "The late short chapters use stage-like compression. A few commands can show the whole ship tightening under Ahab's will.",
    tags: ["trail:theater-form-experiments", "trail:ahab-starbuck", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "forecastle-bulwarks-crew-fear",
    unit_id: "chapter-121-midnight-the-forecastle-bulwarks",
    kind: "form",
    anchor: "Stubb and Flask mounted on them",
    note: "The crew's talk at the bulwarks gives students a lower-deck angle on the storm. Melville keeps returning to collective voices, not only Ahab's.",
    tags: ["trail:theater-form-experiments", "trail:race-empire-global-crew", "theme:crew"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "belongs-to-trail", target: "trail:race-empire-global-crew" },
      { type: "defines-term", target: "glossary:bulwarks" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "midnight-aloft-storm-compression",
    unit_id: "chapter-122-midnight-aloft-thunder-and-lightning",
    kind: "form",
    anchor: "main-top-sail yard",
    note: "This tiny chapter is almost pure stage effect. Its brevity makes the storm feel like a flash instead of a report.",
    tags: ["trail:theater-form-experiments", "theme:storm"],
    relationships: [{ type: "belongs-to-trail", target: "trail:theater-form-experiments" }],
    claim_type: "interpretive"
  },
  {
    id: "musket-starbuck-choice",
    unit_id: "chapter-123-the-musket",
    kind: "theme",
    anchor: "Starbuck",
    note: "Starbuck again sees the moral shape of the disaster, but seeing is not the same as acting. His restraint keeps the tragedy humanly painful.",
    tags: ["trail:ahab-starbuck", "entity:starbuck", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:starbuck" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "supports-reference", target: "reference:ahab-and-starbuck" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "needle-remade-compass",
    unit_id: "chapter-124-the-needle",
    kind: "theme",
    anchor: "compass",
    note: "Ahab remakes the compass by force, turning guidance itself into an assertion of will. The act looks practical and symbolic at the same time.",
    tags: ["trail:ahab-starbuck", "theme:navigation", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:compass" },
      { type: "supports-reference", target: "reference:storm-fire-and-navigation" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "log-and-line-pip-truth",
    unit_id: "chapter-125-the-log-and-line",
    kind: "difficult-material",
    anchor: "Pip",
    note: "Pip's speech is strange, but the novel treats him as a truth-teller near the end. Classroom notes should avoid making mental distress into a joke.",
    tags: ["entity:pip", "review:difficult-material", "theme:mental-strain"],
    relationships: [
      { type: "mentions-entity", target: "entity:pip" },
      { type: "supports-reference", target: "reference:pip-and-castaway-trauma" },
      { type: "defines-term", target: "glossary:log-and-line" }
    ],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "life-buoy-coffin-return",
    unit_id: "chapter-126-the-life-buoy",
    kind: "theme",
    anchor: "life-buoy",
    note: "The failed life-buoy makes Queequeg's coffin return as equipment. The novel begins converting a death object into the thing that may preserve life.",
    tags: ["trail:symbols-prophecy", "entity:coffin"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:coffin" },
      { type: "defines-term", target: "glossary:life-buoy" },
      { type: "supports-reference", target: "reference:coffin-life-buoy-symbol" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "deck-coffin-line-tubs",
    unit_id: "chapter-127-the-deck",
    kind: "theme",
    anchor: "coffin laid upon two line-tubs",
    note: "The coffin now sits among whaling gear. Melville keeps folding symbol back into practical shipboard use.",
    tags: ["trail:symbols-prophecy", "trail:whaling-labor", "entity:coffin"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:coffin" },
      { type: "supports-reference", target: "reference:coffin-life-buoy-symbol" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "rachel-search-refused",
    unit_id: "chapter-128-the-pequod-meets-the-rachel",
    kind: "context",
    anchor: "Rachel",
    note: "The Rachel asks Ahab to interrupt his hunt for a human search. His refusal is one of the clearest moral tests in the final movement.",
    tags: ["trail:ahab-starbuck", "trail:biblical-classical-allusion", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "defines-term", target: "glossary:rachel" }
    ],
    claim_type: "biblical-context",
    citations: ["standard-ebooks-moby-dick", "king-james-bible"]
  },
  {
    id: "cabin-ahab-pip-tenderness",
    unit_id: "chapter-129-the-cabin",
    kind: "theme",
    anchor: "Pip",
    note: "Ahab's tenderness toward Pip does not cancel his violence, but it complicates him. The tragedy is sharper because he still has human feeling.",
    tags: ["trail:ahab-starbuck", "entity:ahab", "entity:pip", "theme:tenderness"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:pip" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "hat-hawk-omen",
    unit_id: "chapter-130-the-hat",
    kind: "theme",
    anchor: "hawk",
    note: "The hawk is another sign that can be read as omen, accident, or both. Near the end, almost every event pressures interpretation.",
    tags: ["trail:symbols-prophecy", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:ahab" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "delight-ironic-name",
    unit_id: "chapter-131-the-pequod-meets-the-delight",
    kind: "form",
    anchor: "Delight",
    note: "The ship's name is bitterly ironic because its news is grim. The last gam functions like a final warning before the chase.",
    tags: ["trail:gams-foreshadowing", "trail:symbols-prophecy", "form:gam"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "supports-reference", target: "reference:gams-and-news" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "chase-first-day-there-she-blows",
    unit_id: "chapter-133-the-chase-first-day",
    kind: "theme",
    anchor: "There she blows!",
    note: "The familiar lookout cry now begins the final catastrophe. A working whaling phrase becomes the trigger for Ahab's endgame.",
    tags: ["trail:whaling-labor", "entity:moby-dick", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "supports-reference", target: "reference:final-chase-structure" }
    ],
    claim_type: "interpretive",
    display: { spoiler_level: "major" }
  },
  {
    id: "chase-second-day-repeated-warning",
    unit_id: "chapter-134-the-chase-second-day",
    kind: "theme",
    anchor: "The Chase",
    note: "The second day repeats pursuit after visible damage. Repetition matters here: warning does not change Ahab's direction.",
    tags: ["trail:symbols-prophecy", "entity:moby-dick", "entity:ahab"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "supports-reference", target: "reference:final-chase-structure" }
    ],
    claim_type: "interpretive",
    display: { spoiler_level: "major" }
  },
  {
    id: "chase-third-day-towards-thee",
    unit_id: "chapter-135-the-chase-third-day",
    kind: "theme",
    anchor: "Towards thee I roll",
    note: "Ahab's final speech turns pursuit into total self-definition. He can recognize destruction and still choose to aim himself at it.",
    tags: ["trail:ahab-starbuck", "trail:symbols-prophecy", "entity:ahab", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:ahab-starbuck" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:ahab" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "supports-reference", target: "reference:final-chase-structure" }
    ],
    claim_type: "interpretive",
    display: { spoiler_level: "major" }
  },
  {
    id: "titlepage-edition-frame",
    unit_id: "frontmatter-titlepage",
    kind: "context",
    anchor: "Herman Melville",
    note: "The title page is small, but it keeps the edition grounded: this guide is built around Melville's full text rather than a rewritten substitute.",
    tags: ["form:frontmatter", "source:edition"],
    relationships: [{ type: "uses-source", target: "source:standard-ebooks-moby-dick" }],
    claim_type: "source-text-observation"
  },
  {
    id: "imprint-source-chain",
    unit_id: "frontmatter-imprint",
    kind: "context",
    anchor: "Project Gutenberg",
    note: "The imprint records the source chain behind the ebook. For a student edition, that matters because textual trust depends on knowing where the text came from.",
    tags: ["form:frontmatter", "source:edition"],
    relationships: [
      { type: "uses-source", target: "source:standard-ebooks-moby-dick" },
      { type: "uses-source", target: "source:project-gutenberg-2701" },
      { type: "uses-source", target: "source:internet-archive-mobydickorwhale01melv" }
    ],
    claim_type: "publication-context"
  },
  {
    id: "dedication-hawthorne",
    unit_id: "frontmatter-dedication",
    kind: "context",
    anchor: "Nathaniel Hawthorne",
    note: "The dedication names Hawthorne as an admired contemporary writer. It gives students a small doorway into Melville's literary friendships and ambitions.",
    tags: ["form:frontmatter", "entity:author"],
    relationships: [{ type: "uses-source", target: "source:standard-ebooks-moby-dick" }],
    claim_type: "publication-context"
  },
  {
    id: "hark-hidden-crew",
    unit_id: "chapter-043-hark",
    kind: "form",
    anchor: "Hist! Did you hear that noise, Cabaco?",
    note: "This short chapter works like an overheard stage whisper. It keeps Fedallah's hidden presence alive after the big symbolic chapters.",
    tags: ["trail:theater-form-experiments", "trail:symbols-prophecy", "entity:fedallah"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:theater-form-experiments" },
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:fedallah" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "hyena-practical-joke",
    unit_id: "chapter-049-the-hyena",
    kind: "theme",
    anchor: "vast practical joke",
    note: "After danger, Ishmael turns toward cosmic comedy. The chapter shows laughter as a survival response, not just a break in seriousness.",
    tags: ["entity:ishmael", "theme:comedy"],
    relationships: [{ type: "mentions-entity", target: "entity:ishmael" }],
    claim_type: "interpretive"
  },
  {
    id: "whales-in-paint-public-images",
    unit_id: "chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars",
    kind: "form",
    anchor: "painted board",
    note: "This chapter extends the whale-picture argument into popular culture and public display. Whale knowledge circulates through signs, souvenirs, carvings, and stars, not only books.",
    tags: ["trail:cetology-classification", "form:visual-culture"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "interpretive"
  },
  {
    id: "brit-right-whale-food",
    unit_id: "chapter-058-brit",
    kind: "context",
    anchor: "vast meadows of brit",
    note: "Brit is tiny whale food, and Melville makes it look like a field. The image helps students see the ocean as an ecosystem, not just empty space for pursuit.",
    tags: ["trail:cetology-classification", "theme:ecology"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "nautical-whaling"
  },
  {
    id: "squid-false-sign",
    unit_id: "chapter-059-squid",
    kind: "theme",
    anchor: "lonely, alluring jet",
    note: "The squid scene turns a sign of the whale into something ambiguous and unsettling. The crew has to interpret the sea before it can act in it.",
    tags: ["trail:symbols-prophecy", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "mentions-entity", target: "entity:moby-dick" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "dart-harpooneer-labor",
    unit_id: "chapter-062-the-dart",
    kind: "context",
    anchor: "headsman or whale-killer",
    note: "The chapter explains why the harpooneer must be both worker and athlete. Melville keeps translating heroic action back into trained labor.",
    tags: ["trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:harpooneer" },
      { type: "defines-term", target: "glossary:harpoon" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "crotch-tool-focus",
    unit_id: "chapter-063-the-crotch",
    kind: "context",
    anchor: "notched stick",
    note: "A tiny tool receives its own chapter because whaling depends on prepared objects as much as bravery. The apparatus of the hunt matters.",
    tags: ["trail:whaling-labor"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "nautical-whaling"
  },
  {
    id: "whale-as-dish-consumption",
    unit_id: "chapter-065-the-whale-as-a-dish",
    kind: "theme",
    anchor: "feed upon the creature that feeds his lamp",
    note: "Ishmael turns whale products into a full economy of eating, lighting, and luxury. The chapter asks what it means to consume the animal in more than one way.",
    tags: ["trail:whaling-labor", "theme:consumption"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "interpretive"
  },
  {
    id: "shark-massacre-delayed-labor",
    unit_id: "chapter-066-the-shark-massacre",
    kind: "difficult-material",
    anchor: "business of cutting him in",
    note: "The sharks make the aftermath of the hunt violent before the crew can even process the whale. The chapter keeps animal bodies and labor conditions in view.",
    tags: ["trail:whaling-labor", "review:difficult-material"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "difficult-material",
    content_status: "needs-review"
  },
  {
    id: "funeral-whale-body",
    unit_id: "chapter-069-the-funeral",
    kind: "theme",
    anchor: "marble sepulchre",
    note: "The discarded whale body becomes funeral imagery. Melville makes the remains feel monumental even after the profit has been stripped away.",
    tags: ["trail:symbols-prophecy", "trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:symbols-prophecy" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "stubb-flask-right-whale-balance",
    unit_id: "chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him",
    kind: "context",
    anchor: "prodigious head",
    note: "The right whale head is taken partly for practical and superstitious reasons. The chapter mixes whaling technique with crew belief and comic talk.",
    tags: ["trail:whaling-labor", "trail:cetology-classification", "entity:stubb", "entity:flask"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "mentions-entity", target: "entity:stubb" },
      { type: "mentions-entity", target: "entity:flask" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "battering-ram-head-power",
    unit_id: "chapter-076-the-battering-ram",
    kind: "context",
    anchor: "battering-ram power",
    note: "The sperm whale's head is described as force, not just anatomy. This technical claim also prepares readers for the physical logic of the ending.",
    tags: ["trail:cetology-classification", "entity:moby-dick"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "mentions-entity", target: "entity:moby-dick" },
      { type: "supports-reference", target: "reference:sperm-whale-anatomy" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "heidelburgh-tun-case",
    unit_id: "chapter-077-the-great-heidelburgh-tun",
    kind: "context",
    anchor: "Baling of the Case",
    note: "The case is a whaling-specific anatomical and labor term. The chapter turns the whale's head into a site of extraction.",
    tags: ["trail:cetology-classification", "trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:cetology-classification" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:case" },
      { type: "supports-reference", target: "reference:sperm-whale-anatomy" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "prairie-phrenology-scale",
    unit_id: "chapter-079-the-prairie",
    kind: "context",
    anchor: "Physiognomist or Phrenologist",
    note: "Ishmael borrows now-discredited body-reading sciences to show the temptation to read character from surfaces. The whale resists that kind of certainty.",
    tags: ["trail:cetology-classification", "theme:classification"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "historical-context"
  },
  {
    id: "nut-brain-unknowability",
    unit_id: "chapter-080-the-nut",
    kind: "theme",
    anchor: "geometrical circle",
    note: "The whale's brain becomes another limit case for human knowledge. Ishmael can measure the skull, but the mind inside remains unreachable.",
    tags: ["trail:cetology-classification", "theme:unknowability"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "interpretive"
  },
  {
    id: "honor-glory-careful-disorder",
    unit_id: "chapter-082-the-honor-and-glory-of-whaling",
    kind: "form",
    anchor: "careful disorderliness",
    note: "This phrase is almost a motto for the novel's method. Ishmael's argument wanders, but the wandering is part of how he builds whaling into world history.",
    tags: ["trail:biblical-classical-allusion", "trail:whaling-labor", "form:essay"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "schools-social-whales",
    unit_id: "chapter-088-schools-and-schoolmasters",
    kind: "context",
    anchor: "known as schools",
    note: "The chapter treats whales as social groups with patterns and roles. That matters because the hunted animals are not just isolated targets.",
    tags: ["trail:cetology-classification", "theme:animal-life"],
    relationships: [{ type: "belongs-to-trail", target: "trail:cetology-classification" }],
    claim_type: "nautical-whaling"
  },
  {
    id: "rose-bud-smell-profit",
    unit_id: "chapter-091-the-pequod-meets-the-rose-bud",
    kind: "form",
    anchor: "peculiar and not very pleasant smell",
    note: "The Rose-Bud gam turns smell into evidence and profit. Stubb reads the situation commercially while others miss the value.",
    tags: ["trail:gams-foreshadowing", "trail:whaling-labor", "form:gam"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:gams-foreshadowing" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "ambergris-commerce-mystery",
    unit_id: "chapter-092-ambergris",
    kind: "context",
    anchor: "ambergris is a very curious substance",
    note: "Ambergris links whale bodies to luxury markets. The chapter is useful because it makes value, smell, science, and class feel oddly connected.",
    tags: ["trail:whaling-labor", "theme:commerce"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:ambergris" },
      { type: "uses-source", target: "source:smithsonian-ambergris" }
    ],
    claim_type: "nautical-whaling",
    citations: ["standard-ebooks-moby-dick", "smithsonian-ambergris"]
  },
  {
    id: "cassock-body-vestment",
    unit_id: "chapter-095-the-cassock",
    kind: "theme",
    anchor: "strange, enigmatical object",
    note: "The cassock chapter turns whale anatomy into a religious garment image. It is a sharp example of Melville blending bodily material with sacred language.",
    tags: ["trail:biblical-classical-allusion", "trail:whaling-labor", "theme:body"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:biblical-classical-allusion" },
      { type: "belongs-to-trail", target: "trail:whaling-labor" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "lamp-oil-comfort",
    unit_id: "chapter-097-the-lamp",
    kind: "theme",
    anchor: "illuminated shrine",
    note: "Whale oil becomes light, comfort, and atmosphere below deck. The chapter shows the crew living inside the material result of their own labor.",
    tags: ["trail:whaling-labor", "theme:commodity"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "defines-term", target: "glossary:spermaceti" }
    ],
    claim_type: "interpretive"
  },
  {
    id: "stowing-down-cycle",
    unit_id: "chapter-098-stowing-down-and-clearing-up",
    kind: "context",
    anchor: "great leviathan is afar off descried",
    note: "This chapter compresses the whole labor cycle from sighting to storage. It is one of the clearest summaries of whaling as repeated process.",
    tags: ["trail:whaling-labor"],
    relationships: [
      { type: "belongs-to-trail", target: "trail:whaling-labor" },
      { type: "supports-reference", target: "reference:whaling-as-labor" }
    ],
    claim_type: "nautical-whaling"
  },
  {
    id: "decanter-enderby-history",
    unit_id: "chapter-101-the-decanter",
    kind: "context",
    anchor: "Samuel Enderby",
    note: "The English ship opens into whaling business history. Ishmael treats commercial houses almost like royal dynasties because whaling has its own power structures.",
    tags: ["trail:whaling-labor", "theme:commerce"],
    relationships: [{ type: "belongs-to-trail", target: "trail:whaling-labor" }],
    claim_type: "historical-context"
  }
];

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

const sourceRecords = await readJson(sourceRecordsPath);
const sourceRecordsById = byId(sourceRecords.records);
for (const record of newSourceRecords) {
  if (!sourceRecordsById.has(record.id)) {
    sourceRecords.records.push(record);
    sourceRecordsById.set(record.id, record);
  }
}

const glossary = await readJson(glossaryPath);
const glossaryById = byId(glossary.entries);
for (const candidate of glossaryCandidates) {
  if (glossaryById.has(candidate.id)) continue;
  const entry = {
    id: candidate.id,
    term: candidate.term,
    category: candidate.category,
    definition: candidate.definition,
    variants: candidate.variants ?? [],
    targets: findGlossaryTargets(candidate, guideData),
    citations: candidate.citations ?? ["standard-ebooks-moby-dick"],
    status: candidate.status ?? { definition_status: "draft", citation_status: "provisional" }
  };
  glossary.entries.push(entry);
  glossaryById.set(entry.id, entry);
}
const ambergrisEntry = glossaryById.get("ambergris");
if (ambergrisEntry) {
  ambergrisEntry.citations = unique([...(ambergrisEntry.citations ?? []), "smithsonian-ambergris"]);
  ambergrisEntry.status = {
    definition_status: ambergrisEntry.status?.definition_status ?? "draft",
    citation_status: "provisional"
  };
}
glossary.entries = glossary.entries.filter((entry) => entry.id !== "ambergris-source");

const referenceCards = await readJson(referenceCardsPath);
const referenceCardsById = byId(referenceCards.cards);
for (const card of referenceCardCandidates) {
  if (!referenceCardsById.has(card.id)) {
    referenceCards.cards.push(card);
    referenceCardsById.set(card.id, card);
  }
}

const annotations = await readJson(annotationsPath);
const annotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const skippedAnnotations = [];
for (const candidate of annotationCandidates) {
  if (annotationIds.has(candidate.id)) continue;
  if (!candidateResolves(candidate, unitsById)) {
    skippedAnnotations.push(`${candidate.id} (${candidate.unit_id}: ${candidate.anchor})`);
    continue;
  }

  const citations = candidate.citations ?? ["standard-ebooks-moby-dick"];
  const display = {
    depth: "study",
    priority: candidate.kind === "difficult-material" ? 2 : 3,
    inline: true,
    surfaces: ["reader", "trail", "index", "search"],
    spoiler_level: "none",
    ...(candidate.display ?? {})
  };

  annotations.annotations.push({
    id: candidate.id,
    unit_id: candidate.unit_id,
    kind: candidate.kind,
    selector: {
      type: "TextQuoteSelector",
      exact: candidate.anchor
    },
    display,
    anchor: candidate.anchor,
    note: candidate.note,
    tags: defaultTags(candidate),
    relationships: defaultRelationships({ ...candidate, citations }),
    evidence: [
      {
        claim_type: candidate.claim_type ?? "interpretive",
        citations,
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations,
    provenance: {
      author: "codex",
      created: today,
      method: "source-checked-draft"
    },
    status: {
      content_status: candidate.content_status ?? "draft",
      citation_status: candidate.citation_status ?? "provisional",
      review_queue: defaultReviewQueue(candidate)
    }
  });
  annotationIds.add(candidate.id);
}

sourceRecords.records.sort((a, b) => a.id.localeCompare(b.id));
glossary.entries.sort((a, b) => a.term.localeCompare(b.term) || a.id.localeCompare(b.id));
referenceCards.cards.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
annotations.annotations.sort((a, b) => {
  const aUnit = unitsById.get(a.unit_id);
  const bUnit = unitsById.get(b.unit_id);
  return (aUnit?.sequence ?? 9999) - (bUnit?.sequence ?? 9999) || a.id.localeCompare(b.id);
});

await writeJson(sourceRecordsPath, sourceRecords);
await writeJson(glossaryPath, glossary);
await writeJson(referenceCardsPath, referenceCards);
await writeJson(annotationsPath, annotations);

console.log(`Added source records up to ${sourceRecords.records.length}.`);
console.log(`Glossary now has ${glossary.entries.length} entries.`);
console.log(`Reference cards now has ${referenceCards.cards.length} cards.`);
console.log(`Annotations now has ${annotations.annotations.length} records.`);
if (skippedAnnotations.length) {
  console.warn(`Skipped ${skippedAnnotations.length} annotation candidates that did not resolve:`);
  for (const skipped of skippedAnnotations) console.warn(`- ${skipped}`);
}
