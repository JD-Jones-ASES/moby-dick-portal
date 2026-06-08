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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function byId(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function matchesTerm(text, term) {
  return text.toLowerCase().includes(term.toLowerCase());
}

function findTargets(candidate, guideData) {
  const terms = unique([candidate.term, ...(candidate.variants ?? [])]);
  const matchingUnits = guideData.units.filter((unit) => terms.some((term) => matchesTerm(unit.plain_text, term)));
  const classroom = matchingUnits.filter((unit) => unit.paths.classroom_standard === "required" || unit.paths.classroom_standard === "recommended");
  return (classroom.length ? classroom : matchingUnits).slice(0, candidate.targetLimit ?? 10).map((unit) => unit.unit_id);
}

function isWordLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function isWholeWordPhrase(text, phrase) {
  const index = text.indexOf(phrase);
  if (index === -1) return false;
  const before = text[index - 1] ?? "";
  const after = text[index + phrase.length] ?? "";
  return !(isWordLetter(before) && isWordLetter(phrase[0])) && !(isWordLetter(after) && isWordLetter(phrase[phrase.length - 1]));
}

function splitSentences(paragraph) {
  return paragraph
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function pickAnchor(unit, existingAnchors) {
  const paragraphs = unit.plain_text.split(/\n{2,}/).map((part) => part.trim()).filter((part) => part.length > 80);
  for (const paragraph of paragraphs) {
    const sentences = splitSentences(paragraph);
    for (const sentence of sentences) {
      const cleanedSentence = sentence.replace(/^[^A-Za-z0-9]+/, "").trim();
      const words = cleanedSentence.replace(/\s+/g, " ").split(" ").filter(Boolean);
      for (const count of [7, 6, 5, 8, 9]) {
        if (words.length < count) continue;
        const phrase = words.slice(0, count).join(" ").replace(/[;:,]$/g, "");
        if (phrase.length < 24 || phrase.length > 90) continue;
        if (existingAnchors.has(phrase.toLowerCase())) continue;
        if (!isWholeWordPhrase(unit.plain_text, phrase)) continue;
        return phrase;
      }
    }
  }
  return null;
}

function annotationProfile(unit) {
  const functions = new Set(unit.functions);
  if (functions.has("cetology")) return { kind: "context", claim: "nautical-whaling", trail: "cetology-classification", tag: "trail:cetology-classification" };
  if (functions.has("whaling-labor")) return { kind: "context", claim: "nautical-whaling", trail: "whaling-labor", tag: "trail:whaling-labor" };
  if (functions.has("gam")) return { kind: "form", claim: "interpretive", trail: "gams-foreshadowing", tag: "trail:gams-foreshadowing" };
  if (functions.has("theatrical")) return { kind: "form", claim: "interpretive", trail: "theater-form-experiments", tag: "trail:theater-form-experiments" };
  if (functions.has("legal-political")) return { kind: "theme", claim: "interpretive", trail: "law-property-politics", tag: "trail:law-property-politics" };
  if (functions.has("biblical-allusion") || functions.has("sermon")) return { kind: "context", claim: "biblical-context", trail: "biblical-classical-allusion", tag: "trail:biblical-classical-allusion" };
  if (functions.has("prophecy") || functions.has("symbolic")) return { kind: "theme", claim: "interpretive", trail: "symbols-prophecy", tag: "trail:symbols-prophecy" };
  if (functions.has("character")) return { kind: "theme", claim: "interpretive", trail: "ishmael-queequeg", tag: "trail:ishmael-queequeg" };
  return { kind: "theme", claim: "interpretive", trail: "symbols-prophecy", tag: "theme:plot-pressure" };
}

function noteFor(unit, profile) {
  const base = unit.summaries.one_breath || unit.summaries.student || `This unit advances ${unit.title}.`;
  if (profile.trail === "cetology-classification") return `${base} Use this passage to watch how Ishmael turns whale knowledge into a problem of classification, not just a list of facts.`;
  if (profile.trail === "whaling-labor") return `${base} This anchor keeps the material work of whaling visible, so the voyage reads as labor as well as adventure.`;
  if (profile.trail === "gams-foreshadowing") return `${base} The scene also belongs to the novel's chain of ship encounters, where news and warning test Ahab's focus.`;
  if (profile.trail === "theater-form-experiments") return `${base} The form matters here: Melville lets voice, staging, or overheard speech carry meaning alongside plot.`;
  if (profile.trail === "biblical-classical-allusion") return `${base} This passage is a useful allusion anchor because the book keeps translating sea experience through inherited sacred and literary language.`;
  if (profile.trail === "law-property-politics") return `${base} The chapter turns a whaling detail into a larger question about claim, power, and social rules.`;
  if (profile.trail === "ishmael-queequeg") return `${base} This is a good place to track how character knowledge changes through contact rather than through explanation alone.`;
  return `${base} The passage gives students a second study handle for the chapter's pressure on symbol, motive, or consequence.`;
}

function defaultReviewQueue(kind, claim) {
  const queue = new Set(["citation", "source-check"]);
  if (claim === "interpretive") queue.add("interpretive");
  if (kind === "difficult-material") {
    queue.add("difficult-material");
    queue.add("tone");
  }
  return [...queue].sort();
}

function makeAnnotation(candidate) {
  const citations = candidate.citations ?? ["standard-ebooks-moby-dick"];
  const relationships = [
    ...(candidate.trail ? [{ type: "belongs-to-trail", target: `trail:${candidate.trail}` }] : []),
    ...(candidate.relationships ?? []),
    ...citations.map((citation) => ({ type: "uses-source", target: `source:${citation}` }))
  ];
  const seen = new Set();
  return {
    id: candidate.id,
    unit_id: candidate.unit_id,
    kind: candidate.kind,
    selector: { type: "TextQuoteSelector", exact: candidate.anchor },
    display: {
      depth: "study",
      priority: candidate.kind === "difficult-material" ? 2 : 3,
      inline: true,
      surfaces: ["reader", "trail", "index", "search"],
      spoiler_level: candidate.spoiler_level ?? "none"
    },
    anchor: candidate.anchor,
    note: candidate.note,
    tags: unique([candidate.tag, `kind:${candidate.kind}`, candidate.kind === "form" ? "layer:form" : candidate.kind === "context" ? "layer:context" : "layer:theme"]),
    relationships: relationships.filter((relationship) => {
      const key = `${relationship.type}:${relationship.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    evidence: [
      {
        claim_type: candidate.claim,
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
      citation_status: "provisional",
      review_queue: defaultReviewQueue(candidate.kind, candidate.claim)
    }
  };
}

const sourceCandidates = [
  ["dana-two-years-before-the-mast", "historical-primary", "Two Years Before the Mast", "Richard Henry Dana Jr.", "Project Gutenberg", "https://www.gutenberg.org/ebooks/2055", "Public-domain maritime memoir useful for shipboard labor, discipline, and forecastle context."],
  ["melville-typee-gutenberg", "source-text", "Typee", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/1900", "Melville's earlier Pacific narrative, useful for reviewing travel-writing and colonial-contact contexts."],
  ["melville-white-jacket-gutenberg", "source-text", "White-Jacket; or, The World in a Man-of-War", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/10712", "Melville's shipboard novel, useful for naval hierarchy and maritime reform context."],
  ["melville-piazza-tales-gutenberg", "source-text", "The Piazza Tales", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/15859", "Collection including later Melville prose, useful for author-context review."],
  ["webster-1828", "dictionary", "American Dictionary of the English Language", "Noah Webster", "Internet Archive", "https://archive.org/details/americandictiona01websrich", "Nineteenth-century American dictionary support for period vocabulary review."],
  ["noaa-north-atlantic-right-whale", "encyclopedia", "North Atlantic Right Whale", "NOAA Fisheries", "NOAA Fisheries", "https://www.fisheries.noaa.gov/species/north-atlantic-right-whale", "Modern biological reference for right-whale contrast notes."],
  ["new-bedford-whaling-museum", "historical-secondary", "New Bedford Whaling Museum", "New Bedford Whaling Museum", "New Bedford Whaling Museum", "https://www.whalingmuseum.org", "Public-facing historical museum source for whaling industry and port-city review."],
  ["library-congress-moby-dick", "encyclopedia", "Moby-Dick Primary Source Set", "Library of Congress", "Library of Congress", "https://www.loc.gov/classroom-materials/moby-dick/", "Classroom-oriented source set for publication and historical context review."]
];

const glossaryCandidates = [
  ["aboard", "aboard", "nautical", "On or into a ship. The word often marks the move from shore life into shipboard rules.", ["on board"]],
  ["aft", "aft", "nautical", "Toward the rear of a ship.", []],
  ["astern", "astern", "nautical", "Behind a ship or toward its stern.", []],
  ["ballast", "ballast", "nautical", "Heavy material used to steady a vessel; figuratively, anything that gives weight or balance.", []],
  ["boatsteerer", "boatsteerer", "shipboard", "A harpooneer who helps steer a whale boat after striking a whale.", ["boat-steerer", "boatsteerers"]],
  ["bows", "bows", "nautical", "The forward part of a vessel.", ["bow"]],
  ["captain", "captain", "shipboard", "The commanding officer of a ship; on the Pequod this authority concentrates around Ahab.", ["captain's"]],
  ["deck", "deck", "nautical", "A ship's working floor, often the stage for command, labor, and confrontation.", ["decks"]],
  ["forecastle-deck", "forecastle", "shipboard", "The forward part of a ship where ordinary sailors live or gather.", ["forecastle-deck"]],
  ["gale", "gale", "nautical", "A strong wind at sea, below hurricane force but dangerous to ships.", ["gales"]],
  ["helm", "helm", "nautical", "The steering apparatus of a ship; also the place or act of steering.", []],
  ["hull", "hull", "nautical", "The main body of a ship, excluding masts, sails, and rigging.", []],
  ["keel", "keel", "nautical", "The central structural beam along the bottom of a ship.", []],
  ["larboard", "larboard", "nautical", "An older term for the left side of a ship, later replaced by port.", []],
  ["main-top", "main-top", "nautical", "A platform or working area high on the mainmast.", ["maintop"]],
  ["mast", "mast", "nautical", "A tall upright spar that supports sails, rigging, and lookout work.", ["masts"]],
  ["oars", "oars", "nautical", "Long poles used to row boats, especially the whale boats lowered from the ship.", ["oar"]],
  ["port", "port", "nautical", "The left side of a ship when facing forward; also a harbor town.", []],
  ["rigging", "rigging", "nautical", "The ropes, chains, and tackle that support and control a ship's masts and sails.", []],
  ["sail", "sail", "nautical", "Canvas or similar material used to catch wind and move a vessel.", ["sails"]],
  ["spar", "spar", "nautical", "A pole such as a mast, yard, or boom used in a ship's rigging.", ["spars"]],
  ["stern", "stern", "nautical", "The rear part of a ship.", []],
  ["steerage", "steerage", "shipboard", "A lower passenger or working area on a ship; the word can mark class and placement aboard.", []],
  ["tiller", "tiller", "nautical", "A handle or lever used to steer a boat.", []],
  ["wake", "wake", "nautical", "The track of disturbed water left behind a ship or whale.", []],
  ["yard", "yard", "nautical", "A horizontal spar from which a sail is set.", ["yards"]],
  ["amidships", "amidships", "nautical", "Near the middle of a ship.", []],
  ["belay", "belay", "nautical", "To secure a rope; in speech, to stop or hold off.", []],
  ["brace", "brace", "nautical", "A rope used to swing a yard; also a verb for making ready or tightening.", ["braces"]],
  ["cabin", "cabin", "shipboard", "A room aboard ship, often associated with officers or command.", ["cabins"]],
  ["capstan", "capstan", "nautical", "A rotating machine used for hauling heavy ropes or anchors.", []],
  ["companionway", "companionway", "nautical", "A stairway or ladder between decks.", []],
  ["davits", "davits", "nautical", "Small cranes used for lowering and raising boats.", ["davit"]],
  ["flank", "flank", "vocabulary", "The side of a body or formation; Melville often uses body terms for ships and whales.", ["flanks"]],
  ["gunwale", "gunwale", "nautical", "The upper edge of a boat's side.", ["gunwales"]],
  ["hammock", "hammock", "shipboard", "A hanging bed used by sailors.", ["hammocks"]],
  ["hatchway", "hatchway", "nautical", "An opening in a ship's deck leading below.", ["hatchways"]],
  ["hawser", "hawser", "nautical", "A thick rope or cable used for towing or mooring.", ["hawsers"]],
  ["jib", "jib", "nautical", "A triangular sail set forward of the foremast.", []],
  ["lee-side", "lee side", "nautical", "The side sheltered from the wind.", ["lee-side"]],
  ["log", "log", "nautical", "A device or record used to measure or track a ship's movement.", ["log-line"]],
  ["mariner", "mariner", "nautical", "A sailor or seafarer.", ["mariners"]],
  ["mizzen", "mizzen", "nautical", "The mast behind the mainmast on many sailing vessels.", ["mizen"]],
  ["sextant", "sextant", "nautical", "A navigation instrument used to measure angles between celestial objects and the horizon.", []],
  ["shipmate", "shipmate", "shipboard", "A fellow sailor on the same ship.", ["shipmates"]],
  ["sloop", "sloop", "nautical", "A small sailing vessel with one mast.", []],
  ["starboard", "starboard", "nautical", "The right side of a ship when facing forward.", []],
  ["tar", "tar", "shipboard", "A sailor; also a sticky substance used in ship maintenance.", ["tars"]],
  ["tempest", "tempest", "vocabulary", "A violent storm, often carrying symbolic weight in the novel.", ["tempests"]],
  ["topmast", "topmast", "nautical", "An upper mast section above the lower mast.", ["topmasts"]],
  ["vessel", "vessel", "nautical", "A ship or boat.", ["vessels"]],
  ["watch", "watch", "shipboard", "A period of duty aboard ship; also the sailors assigned to it.", ["watches"]],
  ["whaleboat", "whaleboat", "whaling", "A small boat lowered from the ship for chasing and striking whales.", ["whale-boat", "whale boats", "whale-boats"]],
  ["windlass", "windlass", "nautical", "A winch-like machine for hauling anchors or heavy lines.", []],
  ["yawl", "yawl", "nautical", "A small ship's boat or sailing craft.", []],
  ["affidavit", "affidavit", "vocabulary", "A sworn statement. Ishmael borrows legal language to make whale stories sound evidentiary.", ["affidavits"]],
  ["anathema", "anathema", "vocabulary", "Something cursed or intensely rejected.", []],
  ["apoplexy", "apoplexy", "vocabulary", "A sudden fit or stroke; older medical language often used broadly.", []],
  ["blasphemy", "blasphemy", "biblical", "Speech or action treated as insulting to God or sacred things.", []],
  ["cabalistical", "cabalistical", "vocabulary", "Mysterious or occult-seeming; related to cabalistic or secret interpretation.", ["cabalistic"]],
  ["cosmopolite", "cosmopolite", "vocabulary", "A citizen of the world; someone not confined to one nation or place.", []],
  ["credulity", "credulity", "vocabulary", "Readiness to believe, sometimes too easily.", []],
  ["despot", "despot", "historical", "An absolute ruler; useful for Ahab's command style.", ["despotism"]],
  ["insular", "insular", "vocabulary", "Island-like or narrow in outlook.", []],
  ["malice", "malice", "vocabulary", "The desire to harm; often part of Ahab's language about the whale.", []],
  ["omen", "omen", "symbolic", "A sign interpreted as predicting future events.", ["omens"]],
  ["phantoms", "phantoms", "symbolic", "Ghostly appearances; Melville uses the word for fear, prophecy, and uncertain perception.", ["phantom"]],
  ["portent", "portent", "symbolic", "A threatening or meaningful sign of what may come.", ["portents"]],
  ["sagacious", "sagacious", "vocabulary", "Wise, shrewd, or perceptive.", []],
  ["sovereign", "sovereign", "historical", "A ruler or supreme authority; the word often carries political force.", ["sovereignty"]],
  ["subterranean", "subterranean", "vocabulary", "Underground or hidden beneath the surface.", []],
  ["vocation", "vocation", "vocabulary", "A calling, profession, or work one feels drawn to do.", ["vocations"]]
].map(([id, term, category, definition, variants]) => ({
  id,
  term,
  category,
  definition,
  variants,
  citations: category === "nautical" || category === "shipboard" || category === "whaling" ? ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"] : ["standard-ebooks-moby-dick", "webster-1913"],
  status: { definition_status: "draft", citation_status: "provisional" }
}));

const referenceCandidates = [
  ["shore-to-sea-transition", "Shore To Sea", "literary", "The early chapters move Ishmael from city mood to shipboard commitment.", "Use this card to track how the novel slowly converts private restlessness into a public voyage.", ["chapter-001-loomings", "chapter-002-the-carpetbag", "chapter-021-going-aboard"]],
  ["inns-chapels-thresholds", "Inns, Chapels, Thresholds", "literary", "Before the Pequod sails, public rooms train readers to notice strangers, rituals, and warnings.", "The shore chapters are not delay for its own sake. They build the social and religious pressures the voyage carries with it.", ["chapter-003-the-spouter-inn", "chapter-007-the-chapel", "chapter-008-the-pulpit"]],
  ["queequeg-religious-difference", "Queequeg And Religious Difference", "historical", "Queequeg's scenes mix friendship with Christian judgments about non-Christian practice.", "The guide should help students see both Ishmael's growing affection and the prejudiced vocabulary that frames it.", ["chapter-010-a-bosom-friend", "chapter-017-the-ramadan", "chapter-018-his-mark"]],
  ["pequod-as-system", "The Pequod As A System", "literary", "The ship gathers owners, officers, harpooneers, sailors, profit, discipline, and obsession into one moving world.", "This card is useful whenever a chapter seems to be about a job title or ship routine; those details explain how Ahab's will travels through an institution.", ["chapter-016-the-ship", "chapter-026-knights-and-squires", "chapter-033-the-specksnyder"]],
  ["lookout-and-perception", "Lookout And Perception", "nautical", "Masthead and lookout scenes turn seeing into work, temptation, and risk.", "Students can track how watching the sea becomes both practical labor and a metaphor for interpretation.", ["chapter-035-the-masthead", "chapter-051-the-spirit-spout", "chapter-130-the-hat"]],
  ["ahabs-command-performance", "Ahab's Command Performance", "literary", "Ahab often commands by staging scenes that make others participate in his obsession.", "The Quarterdeck is the clearest example, but later chapters keep showing command as theater.", ["chapter-036-the-quarterdeck", "chapter-119-the-candles", "chapter-132-the-symphony"]],
  ["forecastle-polyphony", "Forecastle Polyphony", "literary", "The forecastle chapters let many sailors' voices interrupt the captain-centered plot.", "These scenes matter because the Pequod is a global crew, not only Ahab's private instrument.", ["chapter-040-midnight-forecastle", "chapter-121-midnight-the-forecastle-bulwarks", "chapter-122-midnight-aloft-thunder-and-lightning"]],
  ["whale-knowledge-problem", "The Whale Knowledge Problem", "whaling", "Ishmael keeps asking what kind of knowledge can describe a whale: science, story, picture, labor, or myth.", "When chapters feel encyclopedic, students can ask what each method reveals and what it fails to hold.", ["chapter-032-cetology", "chapter-055-of-the-monstrous-pictures-of-whales", "chapter-085-the-fountain"]],
  ["violence-after-the-hunt", "Violence After The Hunt", "whaling", "The killing of a whale is followed by more bodily labor, danger, and extraction.", "This card keeps the aftermath visible: whaling violence does not end when the whale dies.", ["chapter-061-stubb-kills-a-whale", "chapter-066-the-shark-massacre", "chapter-067-cutting-in"]],
  ["whale-body-as-text", "The Whale Body As Text", "literary", "Ishmael repeatedly treats the whale's body as something to read, classify, and misread.", "This helps connect anatomy chapters to the novel's larger worry about interpretation.", ["chapter-068-the-blanket", "chapter-079-the-prairie", "chapter-080-the-nut"]],
  ["labor-tools-and-small-chapters", "Tools And Small Chapters", "whaling", "Several short chapters isolate a tool, action, or technique so students can see whaling as skilled work.", "The scale is deliberate: tiny objects can hold the whole industry together.", ["chapter-062-the-dart", "chapter-063-the-crotch", "chapter-084-pitchpoling"]],
  ["ship-meetings-warning-system", "Ship Meetings As Warning System", "literary", "The gams form a network of news, rumor, loss, and refusal.", "Each meeting asks whether Ahab can still hear anything except news of Moby Dick.", ["chapter-052-the-albatross", "chapter-071-the-jeroboam-s-story", "chapter-128-the-pequod-meets-the-rachel"]],
  ["pip-trauma-and-witness", "Pip, Trauma, Witness", "literary", "Pip's abandonment changes him and makes him a painful witness to the voyage's moral cost.", "Handle these chapters carefully: the text uses older language for madness, but the scene is also about terror, isolation, and survival.", ["chapter-093-the-castaway", "chapter-099-the-doubloon", "chapter-125-the-log-and-line"]],
  ["navigation-versus-obsession", "Navigation Versus Obsession", "nautical", "Ahab's navigation scenes show technical command being bent toward a single destructive aim.", "Compass, quadrant, log, and lightning are not just instruments; they become tests of authority.", ["chapter-118-the-quadrant", "chapter-124-the-needle", "chapter-125-the-log-and-line"]],
  ["coffin-survival-arc", "Coffin Survival Arc", "literary", "Queequeg's coffin links illness, craft, ship safety, and Ishmael's survival.", "The object matters because its meaning changes without losing its association with death.", ["chapter-110-queequeg-in-his-coffin", "chapter-126-the-life-buoy", "epilogue-epilogue"]],
  ["late-mercy-tests", "Late Mercy Tests", "literary", "Late encounters repeatedly give Ahab a chance to choose human claims over the chase.", "The path to the ending is built from refusals, not from fate alone.", ["chapter-123-the-musket", "chapter-128-the-pequod-meets-the-rachel", "chapter-132-the-symphony"]],
  ["final-chase-day-structure", "The Three-Day Chase", "literary", "The ending unfolds over three chase days, turning pursuit into ritual escalation.", "Read the final chapters as a sequence: each day increases damage, narrows choices, and confirms Ahab's isolation.", ["chapter-133-the-chase-first-day", "chapter-134-the-chase-second-day", "chapter-135-the-chase-third-day"]],
  ["extracts-as-archive", "Extracts As Archive", "literary", "The extracts make the whale a problem collected across cultures, genres, and centuries.", "This card helps students who skip the long prefatory collage recover why it exists.", ["frontmatter-extracts", "chapter-032-cetology", "chapter-082-the-honor-and-glory-of-whaling"]],
  ["hawthorne-dedication-context", "Hawthorne Dedication Context", "biographical", "The dedication places Melville's novel near Hawthorne's dark symbolic fiction.", "Students do not need a full biography, but the dedication signals ambition beyond adventure narrative.", ["frontmatter-dedication", "chapter-042-the-whiteness-of-the-whale"]],
  ["property-and-empire-thread", "Property And Empire Thread", "historical", "Whaling property rules expand into questions about political power and imperial claim.", "Fast-Fish and Loose-Fish is the center, but the thread reaches earlier labor and later legal satire.", ["chapter-089-fast-fish-and-loose-fish", "chapter-090-heads-or-tails", "chapter-024-the-advocate"]],
  ["whiteness-and-reading-risk", "Whiteness And Reading Risk", "literary", "The whiteness chapter collects meanings until the symbol becomes unstable and disturbing.", "This card helps students avoid reducing whiteness to one fixed meaning.", ["chapter-042-the-whiteness-of-the-whale", "chapter-119-the-candles", "chapter-135-the-chase-third-day"]],
  ["fedallah-and-prophecy", "Fedallah And Prophecy", "literary", "Fedallah's presence makes prophecy feel both theatrical and structurally important.", "The guide should separate the novel's ominous design from its racialized description of Fedallah.", ["chapter-043-hark", "chapter-050-ahab-s-boat-and-crew-fedallah", "chapter-117-the-whale-watch"]],
  ["cetology-modern-science-gap", "Cetology And Modern Science", "whaling", "Melville's whale science is historically important but not the same as modern marine biology.", "Students can respect the chapter's ambition while noticing where nineteenth-century classification differs from current science.", ["chapter-032-cetology", "chapter-074-the-sperm-whale-s-head-contrasted-view", "chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish"]],
  ["comedy-under-pressure", "Comedy Under Pressure", "literary", "Comic scenes often arrive near danger, not outside it.", "The jokes matter because they show how Ishmael and the crew live with fear, monotony, and violence.", ["chapter-049-the-hyena", "chapter-064-stubb-s-supper", "chapter-091-the-pequod-meets-the-rose-bud"]]
].map(([id, title, kind, summary, student_note, targets]) => ({
  id,
  title,
  kind,
  summary,
  student_note,
  targets,
  citations: ["standard-ebooks-moby-dick"],
  status: { content_status: "draft", citation_status: "provisional" }
}));

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

const sourceRecords = await readJson(sourceRecordsPath);
const sourceById = byId(sourceRecords.records);
for (const [id, kind, title, author, publisher, url, note] of sourceCandidates) {
  if (sourceById.has(id)) continue;
  sourceRecords.records.push({
    id,
    kind,
    title,
    author,
    publisher,
    url,
    bibliographic_note: note,
    accessed: today,
    local_path: null,
    source_note: "Added as a provisional support source during the second major content expansion.",
    license_note: "Reuse and bibliographic details need review before publication.",
    citation_status: "needs-review"
  });
}

const glossary = await readJson(glossaryPath);
const glossaryById = byId(glossary.entries);
let addedGlossary = 0;
for (const candidate of glossaryCandidates) {
  if (glossaryById.has(candidate.id)) continue;
  const targets = findTargets(candidate, guideData);
  if (!targets.length) continue;
  glossary.entries.push({ ...candidate, targets });
  glossaryById.set(candidate.id, candidate);
  addedGlossary += 1;
}

const referenceCards = await readJson(referenceCardsPath);
const referenceById = byId(referenceCards.cards);
let addedReferences = 0;
for (const candidate of referenceCandidates) {
  if (referenceById.has(candidate.id)) continue;
  referenceCards.cards.push(candidate);
  referenceById.set(candidate.id, candidate);
  addedReferences += 1;
}

const annotations = await readJson(annotationsPath);
const annotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const anchorsByUnit = new Map();
for (const annotation of annotations.annotations) {
  if (!anchorsByUnit.has(annotation.unit_id)) anchorsByUnit.set(annotation.unit_id, new Set());
  anchorsByUnit.get(annotation.unit_id).add(annotation.anchor.toLowerCase());
}

let repairedAnnotations = 0;
for (const annotation of annotations.annotations) {
  if (!annotation.id.startsWith("classroom-second-anchor-")) continue;
  const unit = unitsById.get(annotation.unit_id);
  if (!unit?.plain_text) continue;
  if (isWholeWordPhrase(unit.plain_text, annotation.anchor)) continue;
  const existingAnchors = anchorsByUnit.get(annotation.unit_id) ?? new Set();
  existingAnchors.delete(annotation.anchor.toLowerCase());
  const anchor = pickAnchor(unit, existingAnchors);
  if (!anchor) continue;
  annotation.anchor = anchor;
  annotation.selector = { type: "TextQuoteSelector", exact: anchor };
  existingAnchors.add(anchor.toLowerCase());
  anchorsByUnit.set(annotation.unit_id, existingAnchors);
  repairedAnnotations += 1;
}

let addedAnnotations = 0;
for (const unit of guideData.units) {
  if (!(unit.paths.classroom_standard === "required" || unit.paths.classroom_standard === "recommended")) continue;
  if (!unit.plain_text.trim()) continue;
  const existingCount = annotations.annotations.filter((annotation) => annotation.unit_id === unit.unit_id).length;
  if (existingCount >= 2) continue;
  const existingAnchors = anchorsByUnit.get(unit.unit_id) ?? new Set();
  const anchor = pickAnchor(unit, existingAnchors);
  if (!anchor) continue;
  const profile = annotationProfile(unit);
  const id = `classroom-second-anchor-${slug(unit.unit_id)}`;
  if (annotationIds.has(id)) continue;
  annotations.annotations.push(makeAnnotation({
    id,
    unit_id: unit.unit_id,
    anchor,
    note: noteFor(unit, profile),
    kind: profile.kind,
    claim: profile.claim,
    trail: profile.trail,
    tag: profile.tag
  }));
  annotationIds.add(id);
  existingAnchors.add(anchor.toLowerCase());
  anchorsByUnit.set(unit.unit_id, existingAnchors);
  addedAnnotations += 1;
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

console.log(`Added ${sourceRecords.records.length - sourceById.size} source records.`);
console.log(`Added ${addedGlossary} glossary entries; glossary now has ${glossary.entries.length}.`);
console.log(`Added ${addedReferences} reference cards; references now has ${referenceCards.cards.length}.`);
console.log(`Repaired ${repairedAnnotations} generated classroom annotation anchors.`);
console.log(`Added ${addedAnnotations} annotations; annotations now has ${annotations.annotations.length}.`);
