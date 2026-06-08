import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const today = "2026-06-07";

const paths = {
  annotations: path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json"),
  glossary: path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json"),
  references: path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json"),
  sources: path.join(repoRoot, "data", "sources", "moby-dick.source-records.json"),
  geography: path.join(repoRoot, "data", "geography", "moby-dick.places.json"),
  taxonomy: path.join(repoRoot, "data", "taxonomy", "moby-dick.taxonomy.json")
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

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function hasId(items, id) {
  return items.some((item) => item.id === id);
}

function includesTerm(text, term) {
  return new RegExp(`(^|[^A-Za-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i").test(text);
}

function findGlossaryTargets(candidate, guideData) {
  if (candidate.targets?.length) return candidate.targets;
  const terms = unique([candidate.term, ...(candidate.variants ?? [])]);
  const matches = guideData.units.filter((unit) => terms.some((term) => includesTerm(unit.plain_text, term)));
  const preferred = matches.filter((unit) => unit.paths.classroom_standard === "required" || unit.paths.classroom_standard === "recommended");
  return (preferred.length ? preferred : matches).slice(0, candidate.limit ?? 10).map((unit) => unit.unit_id);
}

function selectorFor(text, anchor) {
  const index = text.toLowerCase().indexOf(anchor.toLowerCase());
  if (index === -1) return null;
  const exact = text.slice(index, index + anchor.length);
  return {
    type: "TextQuoteSelector",
    exact,
    prefix: text.slice(Math.max(0, index - 64), index),
    suffix: text.slice(index + exact.length, index + exact.length + 64),
    position: { start: index, end: index + exact.length, generated: true }
  };
}

function sentenceCandidates(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 55 && sentence.length <= 180)
    .filter((sentence) => !/chapter\s+\d+/i.test(sentence));
}

function noteForFunction(unit, mode) {
  const primary = unit.functions[0] ?? "narrative";
  const labels = {
    narrative: "This passage advances the story while also showing what Ishmael chooses to emphasize.",
    character: "This passage is useful for tracking how character is built through gesture, speech, pressure, and reaction.",
    cetology: "This passage turns whale knowledge into a reading problem: facts matter, but the method of organizing them matters too.",
    "whaling-labor": "This passage anchors the novel in shipboard work, where tools, bodies, danger, and hierarchy meet.",
    gam: "This passage helps students see the gam as a storytelling device, not just an interruption between ships.",
    sermon: "This passage shows how religious language shapes the voyage before the Pequod fully enters the plot.",
    theatrical: "This passage asks to be heard as staged speech, with voice and performance doing part of the meaning.",
    symbolic: "This passage turns a concrete object or image into a symbolic pressure point.",
    prophecy: "This passage keeps omen, prediction, and choice tangled together rather than separating them cleanly.",
    "legal-political": "This passage lets legal or political language enter the sea story and widen its stakes.",
    "biblical-allusion": "This passage draws on biblical language so that a local scene feels older and larger than itself.",
    transition: "This passage helps students notice how the book shifts between modes without leaving the voyage behind.",
    prefatory: "This passage belongs to the book's threshold, where sources, names, and framing teach readers how to enter."
  };
  if (mode === "question") {
    return "A useful classroom question here is what the passage makes visible, what it leaves unresolved, and why Melville places that pressure at this point in the book.";
  }
  return labels[primary] ?? labels.narrative;
}

const newSources = [
  ["etymonline-whale", "dictionary", "Online Etymology Dictionary: Whale", "Douglas Harper", "Online Etymology Dictionary", "https://www.etymonline.com/word/whale", "Lexical support for whale-word history; verify page details before publication."],
  ["oed-historical-dictionary", "dictionary", "Oxford English Dictionary", "Oxford University Press", "Oxford University Press", "https://www.oed.com/", "Subscription historical dictionary source for future verification of nineteenth-century vocabulary."],
  ["noaa-right-whale", "encyclopedia", "North Atlantic Right Whale", "NOAA Fisheries", "National Oceanic and Atmospheric Administration", "https://www.fisheries.noaa.gov/species/north-atlantic-right-whale", "Modern biological support for right-whale context and conservation-sensitive notes."],
  ["noaa-blue-whale", "encyclopedia", "Blue Whale", "NOAA Fisheries", "National Oceanic and Atmospheric Administration", "https://www.fisheries.noaa.gov/species/blue-whale", "Modern biological support for scale comparisons in whale-science notes."],
  ["miriam-coffin-nantucket", "historical-secondary", "Nantucket and the Whale Fishery", "Miriam Coffin", "Project Gutenberg", "https://www.gutenberg.org/ebooks/46698", "Public-domain fiction/history-adjacent context for Nantucket whaling culture; needs careful use."],
  ["starbuck-history-of-american-whale-fishery", "historical-secondary", "History of the American Whale Fishery", "Alexander Starbuck", "Internet Archive", "https://archive.org/details/historyofamerica00star", "Nineteenth-century history source for American whaling context."],
  ["dana-two-years-before-the-mast", "historical-primary", "Two Years Before the Mast", "Richard Henry Dana Jr.", "Project Gutenberg", "https://www.gutenberg.org/ebooks/4277", "Primary-context support for shipboard labor and nautical vocabulary."],
  ["matthew-fontaine-maury", "historical-primary", "The Physical Geography of the Sea", "Matthew Fontaine Maury", "Project Gutenberg", "https://www.gutenberg.org/ebooks/66969", "Nineteenth-century oceanographic context for currents, winds, and route imagination."],
  ["britannica-moby-dick", "encyclopedia", "Moby Dick", "Encyclopaedia Britannica", "Encyclopaedia Britannica", "https://www.britannica.com/topic/Moby-Dick-novel-by-Melville", "General reference for publication and reception context; verify before student-ready use."],
  ["loc-melville", "historical-secondary", "Herman Melville", "Library of Congress", "Library of Congress", "https://www.loc.gov/item/n50007955/herman-melville-1819-1891/", "Authority and collection context for Melville."],
  ["perseus-homer", "classical-text", "Homeric Texts", "Various", "Perseus Digital Library", "https://www.perseus.tufts.edu/hopper/collection?collection=Perseus:collection:Greco-Roman", "Classical reference support for Homeric and epic comparison notes."],
  ["perseus-shakespeare", "other", "Shakespeare Collection", "William Shakespeare", "Perseus Digital Library", "https://www.perseus.tufts.edu/hopper/collection?collection=Perseus:collection:Shakespeare", "Reference support for stage, soliloquy, and tragic form comparisons."],
  ["melville-typee-gutenberg", "historical-primary", "Typee", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/1900", "Melville's earlier Pacific narrative, useful for travel-writing and colonial-contact context."],
  ["melville-omoo-gutenberg", "historical-primary", "Omoo", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/4045", "Melville's earlier Pacific narrative, useful for South Seas and empire context."],
  ["british-library-moby-dick", "historical-secondary", "Discovering Literature: Moby-Dick", "British Library", "British Library", "https://www.bl.uk/works/moby-dick", "General literary context source for future verification."]
].map(([id, kind, title, author, publisher, url, source_note]) => ({
  id,
  kind,
  title,
  author,
  publisher,
  url,
  bibliographic_note: source_note,
  accessed: today,
  local_path: null,
  source_note,
  license_note: "Added as a provisional citation lead; verify rights and exact bibliographic details before publication.",
  citation_status: "provisional"
}));

const glossaryCandidates = [
  ["abaft", "nautical", "Toward the stern or behind a point on a vessel.", ["aft"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["aft", "nautical", "Near or toward the stern of a ship.", ["abaft"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["amidships", "nautical", "Near the middle part of a ship.", ["midships"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["astern", "nautical", "Behind the ship or toward its stern.", [], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["binnacle", "nautical", "A case or stand near the helm that holds a ship's compass.", ["binnacles"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["boatswain", "shipboard", "A ship's officer or petty officer responsible for deck work, rigging, and crew tasks.", ["boatswain's"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["bowsprit", "nautical", "A spar projecting forward from a ship's bow.", ["bowsprits"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["braces", "nautical", "Ropes used to swing or control yards and sails.", ["brace"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["bulwarks", "nautical", "The raised sides of a ship above the deck, offering protection at the edge.", ["bulwark"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["cables", "nautical", "Heavy ropes or chains used for anchoring and towing.", ["cable"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["capstan", "nautical", "A rotating machine used to haul heavy ropes, cables, or anchors.", ["capstans"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["cathead", "nautical", "A projecting timber near the bow used in handling an anchor.", ["cat-head"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["cleat", "nautical", "A fitting used to secure a rope.", ["cleats"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["companionway", "nautical", "A stair or passage between a ship's decks.", ["companion-way"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["davits", "nautical", "Small cranes or supports used to lower and raise boats.", ["davit"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["forecastle", "shipboard", "The forward part of a ship, often crew quarters and a social space for sailors.", ["forecastle's"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["gaff", "nautical", "A spar used to support the head of a fore-and-aft sail.", ["gaffs"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["halyard", "nautical", "A rope used to raise or lower a sail, yard, or flag.", ["halyards"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["hawsers", "nautical", "Large ropes or cables used for mooring or towing.", ["hawser"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["helm", "nautical", "The steering position or steering apparatus of a ship.", ["helms"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["hold", "shipboard", "The storage space below a ship's deck.", ["holds"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["jib", "nautical", "A triangular sail set forward of the foremast.", ["jibs"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["keel", "nautical", "The central structural backbone along the bottom of a ship.", ["keels"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["larboard", "nautical", "An older term for the left side of a ship, later replaced by port.", ["port"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["mainmast", "nautical", "The principal mast of a sailing ship.", ["main-mast"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["mizzen", "nautical", "The mast or sail toward the stern on many sailing ships.", ["mizzenmast", "mizen"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["scuppers", "nautical", "Openings that let water drain from a ship's deck.", ["scupper"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["stanchions", "nautical", "Upright supports or posts on a ship.", ["stanchion"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["starboard", "nautical", "The right side of a ship when facing forward.", [], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["stern", "nautical", "The rear part of a ship.", ["sterns"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["tack", "nautical", "A sailing maneuver or the lower corner of a sail, depending on context.", ["tacked", "tacking"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["taffrail", "nautical", "The rail around the stern of a ship.", ["taffrails"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["tiller", "nautical", "A lever used to steer a vessel.", ["tillers"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["topsail", "nautical", "A sail set above a lower sail on a mast.", ["top-sail", "topsails"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["boats", "whaling", "In whaling scenes, small open whaleboats carry crews close enough to hunt the whale.", ["whaleboat", "whaleboats"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["boat-steerer", "whaling", "A skilled whaleman who often handled the harpoon and helped manage the boat during the chase.", ["boatsteerer", "boat-steerers"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["crotch", "whaling", "A support in a whaleboat for holding a harpoon or lance ready.", ["crotches"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["cutting-in", "whaling", "The process of cutting strips of blubber from a captured whale.", ["cutting in"], ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl"]],
  ["flukes", "whaling", "The two broad lobes of a whale's tail.", ["fluke"], ["standard-ebooks-moby-dick", "noaa-sperm-whale"]],
  ["harpooneer", "whaling", "A whaler assigned to strike the whale with a harpoon.", ["harpooneers"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["lance", "whaling", "A sharp weapon used after the harpoon to kill a whale.", ["lances"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["line-tub", "whaling", "A tub holding the coiled whale-line in a whaleboat.", ["line tub", "line-tubs"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["mincer", "whaling", "A worker or tool associated with cutting whale blubber into pieces for trying out.", ["mincers"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["pitchpoling", "whaling", "A whaling technique in which a lance-like weapon is thrown at a whale from a boat.", ["pitchpole", "pitchpoler"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["spermaceti", "whaling", "A waxy oil-like substance from the sperm whale's head, commercially valuable in Melville's whaling world.", ["spermacetti"], ["standard-ebooks-moby-dick", "beale-sperm-whale-bhl", "noaa-sperm-whale"]],
  ["spout", "whaling", "The visible breath or vapor from a whale at the surface.", ["spouts", "spouted"], ["standard-ebooks-moby-dick", "noaa-sperm-whale"]],
  ["try-works", "whaling", "The brick furnace and pots aboard a whaleship used to render blubber into oil.", ["tryworks"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["waif", "whaling", "A marker or flag used to claim a whale or signal possession.", ["waifs"], ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["Jonah", "biblical", "The biblical prophet swallowed by a great fish; Father Mapple's sermon makes Jonah central to the novel's moral frame.", ["Jonah's"], ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["Leviathan", "biblical", "A biblical sea creature whose name becomes a large-scale way of imagining the whale.", ["leviathans"], ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["Job", "biblical", "A biblical figure associated with suffering, questioning, and divine mystery.", ["Job's"], ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["Rachel", "biblical", "A biblical name associated with grief for lost children; the ship Rachel carries that emotional echo near the end.", ["Rachel's"], ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["Jeroboam", "biblical", "A biblical king's name used for one of the ships the Pequod meets.", ["Jeroboam's"], ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["Samuel Enderby", "historical", "A real British whaling-house name used for one of the ships Ahab encounters.", ["Enderby"], ["standard-ebooks-moby-dick", "starbuck-history-of-american-whale-fishery"]],
  ["doubloon", "historical", "A Spanish gold coin; Ahab nails one to the mast as reward and symbol.", ["doubloons"], ["standard-ebooks-moby-dick"]],
  ["quadrant", "nautical", "A navigational instrument used to measure altitude and aid in finding position at sea.", ["quadrants"], ["standard-ebooks-moby-dick", "matthew-fontaine-maury"]],
  ["log-line", "nautical", "A line used with a log to estimate a ship's speed through the water.", ["log and line", "log-line"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["parsee", "historical", "A member of a Zoroastrian community from South Asia; Fedallah is described through this term, often with exoticizing language that needs careful handling.", ["Parsee", "Parsees"], ["standard-ebooks-moby-dick"]],
  ["cannibal", "historical", "A word the novel uses for Queequeg and others; in the guide it should be treated as racialized, colonial language rather than a neutral label.", ["cannibals"], ["standard-ebooks-moby-dick"]],
  ["hammock", "shipboard", "A hanging bed used aboard ships.", ["hammocks"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["watch", "shipboard", "A period of duty aboard ship, or the crew assigned to that period.", ["watches"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["mess", "shipboard", "A group who eat together aboard ship, or the meal itself.", ["messes"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["lee", "nautical", "The side sheltered from the wind; a lee shore can be dangerous because wind drives a ship toward land.", ["leeward"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["squall", "nautical", "A sudden violent gust or storm at sea.", ["squalls"], ["standard-ebooks-moby-dick", "matthew-fontaine-maury"]],
  ["reef", "nautical", "To reduce the area of a sail in strong wind.", ["reefed", "reefing"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["shroud", "nautical", "A rope or cable supporting a mast; the word can also carry burial associations.", ["shrouds"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["sounding", "nautical", "Measuring water depth, often with a weighted line.", ["soundings"], ["standard-ebooks-moby-dick", "dana-two-years-before-the-mast"]],
  ["ambergris", "whaling", "A valuable substance associated with sperm whales and perfume; the novel treats it as both comic and commercial.", [], ["standard-ebooks-moby-dick", "smithsonian-ambergris"]],
  ["phrenology", "historical", "A discredited nineteenth-century practice of reading character from skull shape.", ["phrenological"], ["standard-ebooks-moby-dick"]],
  ["physiognomy", "historical", "The practice of reading character from appearance; now treated with skepticism and historical caution.", ["physiognomically"], ["standard-ebooks-moby-dick"]],
  ["metempsychosis", "classical", "The supposed passing of a soul from one body to another.", [], ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]],
  ["apotheosis", "classical", "The elevation of someone or something to divine status.", [], ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]],
  ["Prometheus", "classical", "A mythic figure associated with defiance, suffering, and stolen fire.", ["Promethean"], ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]],
  ["Narcissus", "classical", "A mythic figure whose self-gazing helps frame Ishmael's opening meditation on water.", ["Narcissus"], ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]],
  ["sphinx", "classical", "A mythic riddle-figure; Melville uses the word to make the whale's head feel ancient and unreadable.", ["Sphynx"], ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]],
  ["pasteboard", "vocabulary", "Thin stiff card; Ahab's phrase about striking through the pasteboard mask means attacking the visible surface of things.", [], ["standard-ebooks-moby-dick", "webster-1913"]],
  ["inscrutable", "vocabulary", "Impossible or very difficult to understand.", [], ["standard-ebooks-moby-dick", "webster-1913"]],
  ["ineffable", "vocabulary", "Too great, strange, or intense to be put fully into words.", [], ["standard-ebooks-moby-dick", "webster-1913"]],
  ["omnitooled", "vocabulary", "Equipped for every kind of work; in the guide this kind of word needs checking against Melville's exact usage.", [], ["standard-ebooks-moby-dick", "webster-1913"]]
];

const referenceCandidates = [
  ["opening-water-meditation", "Opening Water Meditation", "literary", "The opening chapter links mood, city life, money, death-thoughts, and water before the plot begins.", "Students can read the famous first sentence as emotional diagnosis: Ishmael goes to sea because staying ashore has become dangerous to his mind.", ["chapter-001-loomings"]],
  ["boarding-house-comedy", "Boarding-House Comedy", "literary", "The early inn chapters use comedy to make fear, class, race, and intimacy visible.", "The jokes matter because they lower Ishmael's guard before the friendship with Queequeg becomes serious.", ["chapter-002-the-carpetbag", "chapter-003-the-spouter-inn", "chapter-004-the-counterpane"]],
  ["religion-before-voyage", "Religion Before The Voyage", "biblical", "The chapel and sermon frame whaling as a moral and spiritual journey before it is an adventure.", "Students can ask how much of Father Mapple's sermon remains active once Ahab takes command.", ["chapter-007-the-chapel", "chapter-008-the-pulpit", "chapter-009-the-sermon"]],
  ["friendship-contract", "Friendship And Contract", "literary", "Ishmael and Queequeg's bond becomes emotional, domestic, religious, and practical.", "The friendship is not a side plot; it teaches Ishmael a different kind of loyalty before the ship's hierarchy takes over.", ["chapter-010-a-bosom-friend", "chapter-011-nightgown", "chapter-018-his-mark"]],
  ["nantucket-mythmaking", "Nantucket Mythmaking", "historical", "The Nantucket chapters turn a real whaling port into legend.", "The humor and exaggeration help students see how economic history becomes national myth.", ["chapter-014-nantucket", "chapter-016-the-ship"]],
  ["owners-and-risk", "Owners And Risk", "historical", "Peleg and Bildad convert danger into contract, shares, and moral language.", "The business of whaling begins before the ship sails, and the novel makes that business morally strange.", ["chapter-016-the-ship", "chapter-018-his-mark"]],
  ["prophecy-on-the-dock", "Prophecy On The Dock", "biblical", "Warnings cluster around the Pequod before departure.", "The warnings do not stop the voyage; they teach readers to carry dread forward.", ["chapter-019-the-prophet", "chapter-021-going-aboard", "chapter-022-merry-christmas"]],
  ["ahab-delayed-entrance", "Ahab's Delayed Entrance", "literary", "Ahab is talked about long before he fully appears.", "Delay turns Ahab into a pressure before he becomes a person on deck.", ["chapter-016-the-ship", "chapter-028-ahab", "chapter-036-the-quarterdeck"]],
  ["ship-as-workplace", "Ship As Workplace", "nautical", "The Pequod runs through ranks, watches, shares, and routines as much as through symbolism.", "Ahab's private mission works only because the ship's ordinary labor system keeps functioning.", ["chapter-026-knights-and-squires", "chapter-027-knights-and-squires", "chapter-033-the-specksnyder"]],
  ["quarterdeck-as-stage", "Quarterdeck As Stage", "literary", "Ahab turns command into public theater.", "The scene works like drama: speech, props, chorus, and ritual all help bind the crew to one desire.", ["chapter-036-the-quarterdeck", "chapter-040-midnight-forecastle"]],
  ["soliloquy-sequence", "Soliloquy Sequence", "literary", "Chapters 37 through 39 let Ahab, Starbuck, and Stubb speak in theatrical isolation.", "These short chapters give students access to conflict that ordinary narration might hide.", ["chapter-037-sunset", "chapter-038-dusk", "chapter-039-first-night-watch"]],
  ["white-whale-before-whiteness", "White Whale Before Whiteness", "literary", "The book first gives Moby Dick a history, then turns whiteness into a philosophical problem.", "Separating these chapters helps students see the difference between rumor about a whale and meditation on a symbol.", ["chapter-041-moby-dick", "chapter-042-the-whiteness-of-the-whale"]],
  ["chart-and-control", "Chart And Control", "cartographic", "Ahab's chart suggests knowledge, calculation, and obsession.", "The chart is a tool, but the chapter also asks whether tools are serving judgment or desire.", ["chapter-044-the-chart", "chapter-118-the-quadrant"]],
  ["affidavit-and-belief", "Affidavit And Belief", "literary", "The affidavit chapter defends the story's plausibility by piling up testimony.", "Students can ask why a wild book spends so much energy sounding evidentiary.", ["chapter-045-the-affidavit"]],
  ["first-lowering-chaos", "First Lowering Chaos", "whaling", "The first lowering converts anticipation into danger, speed, weather, and confusion.", "This chapter is a hinge: whaling stops being an idea and becomes bodily risk.", ["chapter-048-the-first-lowering"]],
  ["fedallah-and-fear", "Fedallah And Fear", "historical", "Fedallah is surrounded by prophecy, racialized description, and crew suspicion.", "The guide should help students notice both the plot function and the stereotype pressure around him.", ["chapter-050-ahab-s-boat-and-crew-fedallah", "chapter-117-the-whale-watch"]],
  ["gam-network", "Gam Network", "nautical", "Ship meetings create a network of stories, warnings, and missed obligations.", "Each gam tests whether Ahab can listen to anyone else's story.", ["chapter-052-the-albatross", "chapter-053-the-gam", "chapter-071-the-jeroboam-s-story", "chapter-128-the-pequod-meets-the-rachel"]],
  ["pictures-and-misreading", "Pictures And Misreading", "literary", "Whale pictures become a way to study error, distance, and representation.", "The visual chapters are about how hard it is to know a whale from images alone.", ["chapter-055-of-the-monstrous-pictures-of-whales", "chapter-056-of-the-less-erroneous-pictures-of-whales", "chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars"]],
  ["line-danger", "The Line And Danger", "whaling", "The whale-line is useful, deadly, and hard to escape.", "The tool becomes a symbol because it literally binds workers to danger.", ["chapter-060-the-line", "chapter-062-the-dart", "chapter-063-the-crotch"]],
  ["stubb-comedy-violence", "Stubb's Comedy And Violence", "literary", "Stubb's humor often appears beside brutality.", "Students should notice how laughter can make violence easier to watch and harder to judge.", ["chapter-061-stubb-kills-a-whale", "chapter-064-stubb-s-supper"]],
  ["processing-the-whale", "Processing The Whale", "whaling", "The middle labor chapters show whale hunting as industrial extraction.", "These chapters answer the practical question of what happens after a whale is killed.", ["chapter-067-cutting-in", "chapter-068-the-blanket", "chapter-069-the-funeral"]],
  ["heads-and-knowledge", "Heads And Knowledge", "whaling", "The head chapters turn anatomy into interpretation.", "Ishmael keeps treating the whale's body as a text, but the body resists being read completely.", ["chapter-074-the-sperm-whale-s-head-contrasted-view", "chapter-075-the-right-whale-s-head-contrasted-view", "chapter-080-the-nut"]],
  ["monkey-rope-dependence", "Monkey-Rope Dependence", "literary", "The monkey-rope makes interdependence physical.", "This is one of the clearest images of shared risk in the book.", ["chapter-072-the-monkey-rope"]],
  ["grand-armada-contrast", "Grand Armada Contrast", "whaling", "The Grand Armada chapter holds violence and tenderness in the same scene.", "The calm center of the herd complicates any simple reading of whaling adventure.", ["chapter-087-the-grand-armada"]],
  ["law-of-fish", "Law Of Fish", "historical", "Fast-Fish and Loose-Fish turns whaling law into political satire.", "The legal joke widens into questions about property, empire, and power.", ["chapter-089-fast-fish-and-loose-fish", "chapter-090-heads-or-tails"]],
  ["pip-trauma", "Pip And Trauma", "historical", "Pip's abandonment changes his role in the novel.", "The guide should treat Pip's scenes with care: the book's older language can be harsh, but his insight becomes central.", ["chapter-093-the-castaway", "chapter-125-the-log-and-line"]],
  ["tryworks-night", "Try-Works At Night", "literary", "The try-works scene combines labor, fire, temptation, and spiritual disorientation.", "This chapter is a strong checkpoint for how the voyage changes perception itself.", ["chapter-096-the-try-works"]],
  ["coffin-transformations", "Coffin Transformations", "symbolic", "Queequeg's coffin changes meaning several times before the end.", "Tracking the coffin helps students see how objects carry memory across chapters.", ["chapter-110-queequeg-in-his-coffin", "chapter-126-the-life-buoy", "epilogue-epilogue"]],
  ["tools-fail", "Tools Fail", "nautical", "Late navigation tools break, burn, or are rejected.", "The failure of tools makes Ahab's command feel increasingly cut off from ordinary seamanship.", ["chapter-118-the-quadrant", "chapter-124-the-needle", "chapter-125-the-log-and-line"]],
  ["storm-command", "Storm And Command", "literary", "The storm chapters test Ahab's authority against fear, electricity, and crew resistance.", "These chapters make command feel theatrical, spiritual, and physically dangerous at once.", ["chapter-119-the-candles", "chapter-123-the-musket"]],
  ["rachel-refusal", "Rachel's Refusal Test", "biblical", "The Rachel asks Ahab to interrupt the chase for another family's loss.", "Ahab's refusal makes the final ethical stakes painfully clear.", ["chapter-128-the-pequod-meets-the-rachel"]],
  ["symphony-before-chase", "The Symphony Before The Chase", "literary", "The Symphony gives Ahab one last chance to imagine another relation to home, love, and Starbuck.", "The chapter matters because it lets readers feel the road not taken.", ["chapter-132-the-symphony"]],
  ["three-day-chase-structure", "Three-Day Chase Structure", "literary", "The final chase uses repetition, escalation, and narrowing choice.", "Read the three chapters as one structure: damage accumulates, warnings fail, and alternatives disappear.", ["chapter-133-the-chase-first-day", "chapter-134-the-chase-second-day", "chapter-135-the-chase-third-day"]],
  ["epilogue-survival", "Epilogue Survival", "biblical", "The epilogue explains Ishmael's survival through aftermath, rescue, and biblical echo.", "The ending makes survival feel both accidental and charged with the duty to tell.", ["epilogue-epilogue"]]
];

const newPlaces = [
  ["atlantic-threshold", "Atlantic Threshold", "ocean-region", "atlantic-ocean", [-55, 36], ["chapter-022-merry-christmas", "chapter-023-the-lee-shore"]],
  ["azores-display-stage", "Azores Display Stage", "ocean-region", "atlantic-ocean", [-28, 38], ["chapter-052-the-albatross", "chapter-053-the-gam"]],
  ["cape-verde-display-stage", "Cape Verde Display Stage", "ocean-region", "atlantic-ocean", [-24, 16], ["chapter-054-the-town-ho-s-story"]],
  ["equatorial-atlantic", "Equatorial Atlantic", "ocean-region", "atlantic-ocean", [-20, 0], ["chapter-048-the-first-lowering", "chapter-051-the-spirit-spout"]],
  ["south-atlantic-whaling-ground", "South Atlantic Whaling Ground", "ocean-region", "atlantic-ocean", [-20, -35], ["chapter-061-stubb-kills-a-whale", "chapter-067-cutting-in"]],
  ["cape-of-good-hope-stage", "Cape of Good Hope Stage", "ship-route-stage", "indian-ocean", [18.5, -34.3], ["chapter-052-the-albatross", "chapter-071-the-jeroboam-s-story"]],
  ["western-indian-ocean", "Western Indian Ocean", "ocean-region", "indian-ocean", [55, -15], ["chapter-087-the-grand-armada", "chapter-089-fast-fish-and-loose-fish"]],
  ["equatorial-indian-ocean", "Equatorial Indian Ocean", "ocean-region", "indian-ocean", [75, 0], ["chapter-091-the-pequod-meets-the-rose-bud", "chapter-096-the-try-works"]],
  ["sunda-seas-display-stage", "Sunda Seas Display Stage", "ocean-region", "indian-ocean", [105, -7], ["chapter-100-leg-and-arm", "chapter-102-a-bower-in-the-arsacides"]],
  ["western-pacific-entry", "Western Pacific Entry", "ocean-region", "pacific-ocean", [140, -10], ["chapter-111-the-pacific", "chapter-114-the-gilder"]],
  ["equatorial-pacific-stage", "Equatorial Pacific Stage", "ocean-region", "pacific-ocean", [-170, 0], ["chapter-116-the-dying-whale", "chapter-117-the-whale-watch"]],
  ["storm-pacific-stage", "Storm Pacific Stage", "ocean-region", "pacific-ocean", [-160, -10], ["chapter-119-the-candles", "chapter-124-the-needle"]],
  ["rachel-search-stage", "Rachel Search Stage", "ocean-region", "pacific-ocean", [-158, 3], ["chapter-128-the-pequod-meets-the-rachel"]],
  ["delight-warning-stage", "Delight Warning Stage", "ocean-region", "pacific-ocean", [-157, 1], ["chapter-131-the-pequod-meets-the-delight"]],
  ["epilogue-rescue-stage", "Epilogue Rescue Stage", "ocean-region", "pacific-ocean", [-154, -1], ["epilogue-epilogue"]]
].map(([id, label, kind, entity_id, coordinates, chapter_targets]) => ({
  id,
  label,
  kind,
  entity_id,
  coordinates,
  coordinate_status: "display-anchor",
  chapter_targets,
  source_note: "Broad display anchor for a reading-map stage, not a reconstructed historical coordinate.",
  citations: ["standard-ebooks-moby-dick"],
  status: { content_status: "draft", citation_status: "provisional" }
}));

const taxonomyEntities = [
  ["elijah", "Elijah", "character", ["Elijah's"]],
  ["bildad", "Bildad", "character", ["Captain Bildad", "Bildad's"]],
  ["peleg", "Peleg", "character", ["Captain Peleg", "Peleg's"]],
  ["bulkington", "Bulkington", "character", ["Bulkington's"]],
  ["gabriel", "Gabriel", "character", ["Gabriel's"]],
  ["radney", "Radney", "character", ["Radney's"]],
  ["steelkit", "Steelkilt", "character", ["Steelkilt's"]],
  ["town-ho", "Town-Ho", "ship", ["Town-Ho's"]],
  ["rachel", "Rachel", "ship", ["Rachel's"]],
  ["jeroboam", "Jeroboam", "ship", ["Jeroboam's"]],
  ["samuel-enderby", "Samuel Enderby", "ship", ["Enderby"]],
  ["delight", "Delight", "ship", ["Delight's"]],
  ["whale-line", "Whale-line", "concept", ["line"]],
  ["try-works", "Try-works", "concept", ["tryworks"]],
  ["quarterdeck", "Quarterdeck", "form", ["quarter-deck"]],
  ["gam-form", "Gam", "form", ["gams"]],
  ["jonah-sermon", "Jonah Sermon", "allusion", ["Jonah"]],
  ["leviathan", "Leviathan", "allusion", ["Leviathan"]],
  ["narcissus", "Narcissus", "allusion", ["Narcissus"]],
  ["prometheus", "Prometheus", "allusion", ["Promethean"]]
].map(([id, label, kind, aliases]) => ({
  id,
  label,
  kind,
  aliases,
  citations: ["standard-ebooks-moby-dick"],
  status: { content_status: "draft", citation_status: "provisional" }
}));

const taxonomyTrails = [
  ["shipboard-tools", "Shipboard Tools", "A trail for tools, instruments, and work objects that carry practical and symbolic force.", ["topic:tools", "topic:nautical"]],
  ["ships-and-gams", "Ships and Gams", "A trail for the named ships whose meetings test Ahab's ability to hear other stories.", ["form:gam", "topic:ships"]],
  ["navigation-and-failure", "Navigation and Failure", "A trail for charts, compass, quadrant, log-line, and moments when knowledge tools fail.", ["topic:navigation", "theme:failure"]],
  ["objects-that-transform", "Objects That Transform", "A trail for objects whose meanings change across the voyage.", ["theme:symbolism", "topic:objects"]],
  ["labor-after-death", "Labor After Death", "A trail for the processing, cutting, rendering, and cleanup after whale deaths.", ["topic:whaling", "topic:labor"]],
  ["voice-and-performance", "Voice and Performance", "A trail for sermons, soliloquies, choruses, songs, and stage-like speech.", ["form:theatrical", "form:voice"]],
  ["evidence-and-belief", "Evidence and Belief", "A trail for affidavits, testimony, rumor, and Ishmael's efforts to make readers believe.", ["theme:evidence", "theme:belief"]],
  ["care-and-refusal", "Care and Refusal", "A trail for moments when rescue, friendship, pity, or duty is offered and accepted or refused.", ["theme:care", "theme:ethics"]]
].map(([id, label, description, tags]) => ({
  id,
  label,
  description,
  tags,
  status: { content_status: "draft", citation_status: "provisional" }
}));

function referenceCard([id, title, kind, summary, student_note, targets]) {
  return {
    id,
    title,
    kind,
    summary,
    student_note,
    targets,
    citations: ["standard-ebooks-moby-dick"],
    status: { content_status: "draft", citation_status: "provisional" }
  };
}

async function main() {
  const guideData = await loadGuideData();
  const sources = await readJson(paths.sources);
  const glossary = await readJson(paths.glossary);
  const references = await readJson(paths.references);
  const geography = await readJson(paths.geography);
  const taxonomy = await readJson(paths.taxonomy);
  const annotations = await readJson(paths.annotations);
  const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

  let addedSources = 0;
  for (const record of newSources) {
    if (!hasId(sources.records, record.id)) {
      sources.records.push(record);
      addedSources += 1;
    }
  }

  let addedGlossary = 0;
  for (const [term, category, definition, variants, citations] of glossaryCandidates) {
    const id = slug(term);
    if (hasId(glossary.entries, id)) continue;
    const candidate = { term, variants };
    const targets = findGlossaryTargets(candidate, guideData);
    if (!targets.length) continue;
    glossary.entries.push({
      id,
      term,
      category,
      definition,
      variants,
      targets,
      citations,
      status: { definition_status: "draft", citation_status: "provisional" }
    });
    addedGlossary += 1;
  }

  let addedReferences = 0;
  for (const candidate of referenceCandidates.map(referenceCard)) {
    if (!hasId(references.cards, candidate.id)) {
      references.cards.push(candidate);
      addedReferences += 1;
    }
  }

  let addedPlaces = 0;
  for (const place of newPlaces) {
    if (!hasId(geography.places, place.id)) {
      geography.places.push(place);
      addedPlaces += 1;
    }
  }

  let addedEntities = 0;
  for (const entity of taxonomyEntities) {
    if (!hasId(taxonomy.entities, entity.id)) {
      taxonomy.entities.push(entity);
      addedEntities += 1;
    }
  }

  let addedTrails = 0;
  for (const trail of taxonomyTrails) {
    if (!hasId(taxonomy.trails, trail.id)) {
      taxonomy.trails.push(trail);
      addedTrails += 1;
    }
  }

  const existingAnnotationIds = new Set(annotations.annotations.map((annotation) => annotation.id));
  const existingAnchorsByUnit = new Map();
  for (const annotation of annotations.annotations) {
    if (!existingAnchorsByUnit.has(annotation.unit_id)) existingAnchorsByUnit.set(annotation.unit_id, []);
    existingAnchorsByUnit.get(annotation.unit_id).push(annotation.anchor.toLowerCase());
  }

  let addedAnnotations = 0;
  for (const unit of guideData.units.filter((candidate) => candidate.section_type !== "frontmatter" || candidate.word_count > 30)) {
    const sentencePool = sentenceCandidates(unit.plain_text);
    const existingAnchors = existingAnchorsByUnit.get(unit.unit_id) ?? [];
    const desired = unit.word_count > 1200 ? 2 : 1;
    let used = 0;

    for (const sentence of sentencePool) {
      if (used >= desired) break;
      const lower = sentence.toLowerCase();
      if (existingAnchors.some((anchor) => anchor.includes(lower) || lower.includes(anchor))) continue;
      const id = `broad-apparatus-${unit.unit_id}-${used + 1}`;
      if (existingAnnotationIds.has(id)) {
        used += 1;
        continue;
      }
      const selector = selectorFor(unit.plain_text, sentence);
      if (!selector) continue;
      const kind = unit.functions.includes("theatrical") || unit.functions.includes("gam") || unit.functions.includes("sermon") ? "form" : unit.functions.includes("cetology") || unit.functions.includes("whaling-labor") || unit.functions.includes("biblical-allusion") ? "context" : "theme";
      annotations.annotations.push({
        id,
        unit_id: unit.unit_id,
        kind,
        selector,
        display: {
          depth: "explore",
          priority: 4,
          inline: false,
          surfaces: ["index", "search", "review"],
          spoiler_level: unit.number && unit.number > 100 ? "mild" : "none"
        },
        anchor: selector.exact,
        note: noteForFunction(unit, used === 0 ? "checkpoint" : "question"),
        tags: unique([`kind:${kind}`, "layer:explore", `function:${unit.functions[0] ?? "unknown"}`, "review:broad-pass"]),
        relationships: [
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
          review_queue: ["source-check", "citation", "interpretive"]
        }
      });
      existingAnnotationIds.add(id);
      existingAnchors.push(lower);
      used += 1;
      addedAnnotations += 1;
    }
  }

  await writeJson(paths.sources, sources);
  await writeJson(paths.glossary, glossary);
  await writeJson(paths.references, references);
  await writeJson(paths.geography, geography);
  await writeJson(paths.taxonomy, taxonomy);
  await writeJson(paths.annotations, annotations);

  console.log(JSON.stringify({
    addedSources,
    addedGlossary,
    addedReferences,
    addedPlaces,
    addedEntities,
    addedTrails,
    addedAnnotations,
    totals: {
      sources: sources.records.length,
      glossary: glossary.entries.length,
      references: references.cards.length,
      geography: geography.places.length,
      entities: taxonomy.entities.length,
      trails: taxonomy.trails.length,
      annotations: annotations.annotations.length
    }
  }, null, 2));
}

await main();
