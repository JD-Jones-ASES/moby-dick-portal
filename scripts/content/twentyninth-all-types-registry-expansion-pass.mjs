import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/sources/moby-dick.source-records.json";
const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";
const geographyPath = "data/geography/moby-dick.places.json";
const voyageMapPath = "data/maps/moby-dick.voyage-map.json";

const sources = JSON.parse(await readFile(sourcePath, "utf8"));
const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const geography = JSON.parse(await readFile(geographyPath, "utf8"));
const voyageMap = JSON.parse(await readFile(voyageMapPath, "utf8"));

function appendMissing(items, additions) {
  const ids = new Set(items.map((item) => item.id));
  let added = 0;
  for (const addition of additions) {
    if (ids.has(addition.id)) continue;
    items.push(addition);
    ids.add(addition.id);
    added += 1;
  }
  return added;
}

function source(id, kind, title, author, publisher, url, note) {
  return {
    id,
    kind,
    title,
    author,
    publisher,
    url,
    bibliographic_note: note,
    accessed: "2026-06-07",
    local_path: null,
    source_note: note,
    license_note: "Added as a provisional citation lead; verify rights, edition, and bibliographic details before publication.",
    citation_status: "provisional"
  };
}

function status() {
  return {
    content_status: "draft",
    citation_status: "provisional"
  };
}

const sourceAdditions = [
  source("melville-bartleby-gutenberg", "source-text", "Bartleby, the Scrivener", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/11231", "Melville prose context for refusal, work, and narrator ethics."),
  source("melville-redburn-gutenberg", "source-text", "Redburn: His First Voyage", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/8118", "Melville maritime context for apprenticeship, labor, and travel writing."),
  source("melville-israel-potter-gutenberg", "source-text", "Israel Potter", "Herman Melville", "Project Gutenberg", "https://www.gutenberg.org/ebooks/15422", "Melville context for history, nation, and wandering protagonists."),
  source("milton-paradise-lost-gutenberg", "classical-text", "Paradise Lost", "John Milton", "Project Gutenberg", "https://www.gutenberg.org/ebooks/26", "Allusion lead for epic scale, rebellion, Satanic rhetoric, and providential argument."),
  source("shakespeare-complete-works-gutenberg", "classical-text", "The Complete Works of William Shakespeare", "William Shakespeare", "Project Gutenberg", "https://www.gutenberg.org/ebooks/100", "Allusion lead for tragedy, soliloquy, stage form, Lear, Macbeth, and Hamlet echoes."),
  source("jonah-kjv-crossref", "biblical-text", "Book of Jonah, King James Version", "Various", "King James Bible Online", "https://www.kingjamesbibleonline.org/Jonah-Chapter-1/", "Focused scriptural lead for Father Mapple's sermon and later Jonah allusions."),
  source("matthew-maury-physical-geography-sea", "historical-primary", "The Physical Geography of the Sea", "Matthew Fontaine Maury", "Project Gutenberg", "https://www.gutenberg.org/ebooks/40696", "Nineteenth-century oceanography lead for currents, routes, and sea knowledge."),
  source("darwin-voyage-beagle-gutenberg", "historical-primary", "The Voyage of the Beagle", "Charles Darwin", "Project Gutenberg", "https://www.gutenberg.org/ebooks/944", "Natural-history travel lead for comparative oceanic observation and taxonomy."),
  source("hawthorne-mosses-old-manse-gutenberg", "source-text", "Mosses from an Old Manse", "Nathaniel Hawthorne", "Project Gutenberg", "https://www.gutenberg.org/ebooks/512", "Author-context lead for Melville's dedication and dark romance atmosphere."),
  source("usgs-geographic-names", "map", "Geographic Names Information System", "U.S. Geological Survey", "U.S. Geological Survey", "https://www.usgs.gov/tools/geographic-names-information-system-gnis", "Map-data lead for future coordinate verification of United States places."),
  source("natural-earth-data", "map", "Natural Earth", "Natural Earth", "Natural Earth", "https://www.naturalearthdata.com/", "Open map-data lead for future route and ocean-region display cleanup."),
  source("world-atlas-map-lead", "map", "World Atlas", "National Geographic Society", "National Geographic Society", "https://www.nationalgeographic.org/encyclopedia/atlas/", "General map-reference lead for classroom geography review.")
];

const trailAdditions = [
  ["books-and-knowledge", "Books and Knowledge", "Libraries, citations, footnotes, affidavits, and mock scholarship as Melville builds and tests authority.", ["theme:knowledge", "form:citation", "topic:books"]],
  ["whiteness-and-terror", "Whiteness and Terror", "The white whale, color symbolism, blankness, fear, race, and spiritual uncertainty.", ["theme:whiteness", "theme:symbolism", "review:difficult-material"]],
  ["profit-and-extraction", "Profit and Extraction", "Oil, ambergris, markets, ownership, bodies, and the conversion of whale life into value.", ["theme:profit", "topic:extraction", "topic:whaling"]],
  ["friendship-and-isolation", "Friendship and Isolation", "Companionship, care, sleeping arrangements, rescue, loneliness, and abandoned duty.", ["theme:friendship", "theme:isolation"]],
  ["bodies-and-vulnerability", "Bodies and Vulnerability", "Hands, legs, wounds, drowning, risk, pain, disability language, and bodily dependence aboard ship.", ["theme:bodies", "theme:vulnerability", "review:difficult-material"]],
  ["ecological-scale", "Ecological Scale", "Whale size, extinction arguments, ocean immensity, deep time, and modern ecological questions.", ["topic:ecology", "theme:scale", "topic:cetology"]],
  ["comedy-and-grotesque", "Comedy and Grotesque", "Comic exaggeration, odd bodies, slapstick, grotesque labor, and jokes that carry pressure.", ["form:comedy", "form:grotesque"]],
  ["scripture-and-sermons", "Scripture and Sermons", "Sermon form, biblical quotation, prophecy, judgment, mercy, Job, Jonah, Rachel, and Ahab.", ["allusion:biblical", "form:sermon", "theme:judgment"]],
  ["colonial-contact", "Colonial Contact", "Pacific travel, racialized description, empire, conversion language, and global labor.", ["theme:empire", "theme:race", "review:difficult-material"]],
  ["fate-and-agency", "Fate and Agency", "Predestination, choice, prophecy, habits, vows, chance, and the limits of refusal.", ["theme:fate", "theme:agency", "theme:prophecy"]],
  ["craft-and-making", "Craft and Making", "Carpenters, blacksmiths, coopers, gear, repair work, tools, and the intelligence of manual craft.", ["topic:craft", "topic:tools", "topic:labor"]],
  ["endings-and-survival", "Endings and Survival", "Final warnings, rescue failures, the sinking, Ishmael's survival, and how the narrative can still be told.", ["theme:survival", "theme:ending", "theme:witness"]]
].map(([id, label, description, tags]) => ({ id, label, description, tags, status: status() }));

const entityAdditions = [
  ["elijah", "Elijah", "character", ["prophet-like stranger"]],
  ["peleg", "Peleg", "character", ["Captain Peleg"]],
  ["bildad", "Bildad", "character", ["Captain Bildad"]],
  ["bulkington", "Bulkington", "character", []],
  ["aunt-charity", "Aunt Charity", "character", ["Charity"]],
  ["boomer", "Boomer", "character", ["Captain Boomer"]],
  ["captain-gardiner", "Captain Gardiner", "character", ["Gardiner"]],
  ["perth", "Perth", "character", ["blacksmith"]],
  ["the-carpenter", "The Carpenter", "character", ["carpenter"]],
  ["fleece", "Fleece", "character", ["the cook", "cook"]],
  ["jonah", "Jonah", "allusion", []],
  ["job", "Job", "allusion", []],
  ["leviathan", "Leviathan", "allusion", []],
  ["shakespearean-tragedy", "Shakespearean Tragedy", "form", ["tragedy"]],
  ["epic-catalog", "Epic Catalog", "form", ["catalog"]],
  ["whiteness", "Whiteness", "theme", ["white whale"]],
  ["fate", "Fate", "theme", ["predestination"]],
  ["agency", "Agency", "theme", ["choice"]],
  ["labor", "Labor", "topic", ["work"]],
  ["profit", "Profit", "topic", ["market"]],
  ["ecology", "Ecology", "topic", ["environment"]],
  ["cape-verde", "Cape Verde", "place", ["St. Jago"]],
  ["azores", "Azores", "place", []],
  ["cape-good-hope", "Cape of Good Hope", "place", []],
  ["crozet-islands", "Crozet Islands", "place", ["Crozetts"]],
  ["kerguelen", "Kerguelen", "place", ["Desolation Island"]],
  ["java-sea", "Java Sea", "place", ["Sunda seas"]],
  ["japan-sea-stage", "Japan Sea Stage", "place", ["Japan"]],
  ["sag-harbor", "Sag Harbor", "place", []],
  ["arsacides", "Arsacides", "place", []]
].map(([id, label, kind, aliases]) => ({
  id,
  label,
  kind,
  aliases,
  citations: ["standard-ebooks-moby-dick"],
  status: status()
}));

function place(id, label, kind, entityId, coordinates, targets, note) {
  return {
    id,
    label,
    kind,
    entity_id: entityId,
    coordinates,
    coordinate_status: "display-anchor",
    chapter_targets: targets,
    source_note: `${note} Coordinates are display anchors, not reconstructed route claims.`,
    citations: ["standard-ebooks-moby-dick"],
    status: status()
  };
}

const placeAdditions = [
  place("sag-harbor", "Sag Harbor", "port", "sag-harbor", [-72.2926, 40.9979], ["chapter-012-biographical", "chapter-071-the-jeroboam-s-story"], "Whaling-port and captain-background reference point."),
  place("cape-verde-st-jago", "Cape Verde / St. Jago", "island", "cape-verde", [-23.6052, 15.1201], ["chapter-054-the-town-ho-s-story"], "Atlantic island-stage lead for the Town-Ho's Story."),
  place("azores", "Azores", "island", "azores", [-28.0, 38.5], ["chapter-052-the-albatross", "chapter-053-the-gam"], "Atlantic whaling-route reference stage."),
  place("cape-good-hope", "Cape of Good Hope", "landmark", "cape-good-hope", [18.4741, -34.3568], ["chapter-053-the-gam", "chapter-089-fast-fish-and-loose-fish"], "Cape-route reference for the transition toward Indian Ocean material."),
  place("crozet-islands", "Crozet Islands", "island", "crozet-islands", [51.0, -46.4], ["chapter-052-the-albatross"], "Southern Ocean place-name lead for whaling geography."),
  place("kerguelen-desolation", "Kerguelen / Desolation Island", "island", "kerguelen", [69.35, -49.35], ["chapter-052-the-albatross"], "Southern Ocean place-name lead for the novel's global reach."),
  place("java-sea-sunda", "Java Sea / Sunda Stage", "ocean-region", "java-sea", [110.0, -6.0], ["chapter-087-the-grand-armada"], "Display stage for the Grand Armada's eastern-seas setting."),
  place("japan-sea-stage", "Japan Sea Stage", "ocean-region", "japan-sea-stage", [142.0, 34.0], ["chapter-111-the-pacific", "chapter-133-the-chase-first-day"], "Late-voyage display stage for Ahab's approach toward the final chase."),
  place("arsacides-display", "Arsacides Display Stage", "island", "arsacides", [160.0, -9.0], ["chapter-102-a-bower-in-the-arsacides"], "Pacific island-stage lead for the skeleton and measurement chapters."),
  place("peru-current-stage", "Peru Current Stage", "ocean-region", "pacific-ocean", [-82.0, -12.0], ["chapter-111-the-pacific"], "Pacific route-context lead for ocean-current and navigation discussion."),
  place("tahiti-display-stage", "Tahiti Display Stage", "island", "pacific-ocean", [-149.4, -17.65], ["chapter-048-the-first-lowering", "chapter-131-the-pequod-meets-the-delight"], "Pacific island display lead for global crew and route context."),
  place("line-equator", "Equatorial Line", "ocean-region", "pacific-ocean", [-150.0, 0.0], ["chapter-111-the-pacific", "chapter-132-the-symphony"], "Display anchor for equatorial late-voyage motion.")
];

function waypoint(id, label, start, end, coordinates, note) {
  return {
    id,
    label,
    chapter_start: start,
    chapter_end: end,
    coordinates,
    student_note: note
  };
}

const waypointAdditions = [
  waypoint("sag-harbor-background", "Sag Harbor Background", 12, 13, [-72.2926, 40.9979], "Captain histories and whaling-port reputations widen the shore world before Nantucket."),
  waypoint("first-lowering-atlantic", "First Lowering Atlantic", 48, 51, [-20.0, 0.0], "The first lowering turns Ahab's announced hunt into dangerous labor on the water."),
  waypoint("town-ho-atlantic", "Town-Ho Story Atlantic", 54, 54, [-24.0, 16.0], "A nested ship story shows how rumor, mutiny, and prophecy travel between crews."),
  waypoint("squid-and-armada", "Squid and Armada", 59, 87, [110.0, -6.0], "The voyage moves through false signs, whale schools, and the enormous scale of ocean life."),
  waypoint("law-and-labor-middle", "Law and Labor Middle Voyage", 88, 105, [55.0, -38.0], "The middle book turns whale bodies into law, labor, oil, anatomy, fossils, and arguments about extinction."),
  waypoint("pacific-craft", "Pacific Craft", 106, 118, [-140.0, -12.0], "Ahab's body, tools, craft workers, and navigation instruments come under pressure."),
  waypoint("storm-and-omens", "Storm and Omens", 119, 124, [-152.0, -8.0], "Weather, fire, compass failure, and the log-line make the ship feel trapped in signs."),
  waypoint("search-and-warning", "Search and Warning", 128, 131, [-154.0, -4.0], "The Rachel and Delight make rescue and warning visible just before the final pursuit."),
  waypoint("symphony-threshold", "Symphony Threshold", 132, 132, [-154.5, -2.0], "Ahab briefly hears another possible future before returning to the chase.")
];

const added = {
  sources: appendMissing(sources.records, sourceAdditions),
  trails: appendMissing(taxonomy.trails, trailAdditions),
  entities: appendMissing(taxonomy.entities, entityAdditions),
  places: appendMissing(geography.places, placeAdditions),
  waypoints: appendMissing(voyageMap.waypoints, waypointAdditions)
};

await writeFile(sourcePath, `${JSON.stringify(sources, null, 2)}\n`);
await writeFile(taxonomyPath, `${JSON.stringify(taxonomy, null, 2)}\n`);
await writeFile(geographyPath, `${JSON.stringify(geography, null, 2)}\n`);
await writeFile(voyageMapPath, `${JSON.stringify(voyageMap, null, 2)}\n`);

console.log(JSON.stringify(added, null, 2));
