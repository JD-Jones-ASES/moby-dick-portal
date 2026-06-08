import { readFile, writeFile } from "node:fs/promises";

const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";
const geographyPath = "data/geography/moby-dick.places.json";
const voyageMapPath = "data/maps/moby-dick.voyage-map.json";

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

function status() {
  return {
    content_status: "draft",
    citation_status: "provisional"
  };
}

function trail(id, label, description, tags) {
  return { id, label, description, tags, status: status() };
}

function entity(id, label, kind, aliases = []) {
  return {
    id,
    label,
    kind,
    aliases,
    citations: ["standard-ebooks-moby-dick"],
    status: status()
  };
}

function place(id, label, kind, entityId, coordinates, targets, note) {
  return {
    id,
    label,
    kind,
    entity_id: entityId,
    coordinates,
    coordinate_status: "display-anchor",
    chapter_targets: targets,
    source_note: `${note} Coordinates are display anchors for classroom navigation, not reconstructed route claims.`,
    citations: ["standard-ebooks-moby-dick"],
    status: status()
  };
}

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

const trailAdditions = [
  trail("narrator-and-reliability", "Narrator and Reliability", "Ishmael's shifts between witness, lecturer, comedian, critic, and survivor.", ["character:ishmael", "theme:witness", "form:narration"]),
  trail("labor-hierarchy", "Labor and Hierarchy", "Command, rank, officer authority, forecastle labor, and unequal risk aboard the Pequod.", ["topic:labor", "theme:hierarchy", "topic:shipboard"]),
  trail("death-and-burial", "Death and Burial", "Coffins, funeral language, abandoned bodies, shipwreck, mourning, and survival after catastrophe.", ["theme:death", "theme:survival", "symbol:coffin"]),
  trail("weather-and-navigation", "Weather and Navigation", "Wind, storms, compass work, quadrant readings, log-lines, and the sea as a navigational problem.", ["topic:navigation", "topic:weather", "topic:tools"]),
  trail("violence-and-mercy", "Violence and Mercy", "Cruelty, pity, sermons, animal suffering, rescue, and the possibility of restraint.", ["theme:violence", "theme:mercy", "review:difficult-material"]),
  trail("masculinity-and-command", "Masculinity and Command", "Captaincy, pride, obedience, theatrical selfhood, courage, and fear under pressure.", ["theme:masculinity", "theme:command", "character:ahab"]),
  trail("commerce-and-credit", "Commerce and Credit", "Shares, wages, ownership, insurance-like reasoning, cargo, and the business language of whaling.", ["theme:commerce", "theme:profit", "theme:property"]),
  trail("shore-life-and-home", "Shore Life and Home", "Beds, inns, chapels, wives, owners, ports, and the shore world the voyage leaves behind.", ["topic:shore", "theme:home", "theme:departure"]),
  trail("sleep-dreams-visions", "Sleep, Dreams, and Visions", "Dreams, trances, omens, reveries, prophecy, and altered states of perception.", ["theme:dreams", "theme:prophecy", "theme:perception"]),
  trail("teaching-and-reading", "Teaching and Reading", "Sermons, cetology lessons, definitions, mock scholarship, and the reader's training.", ["form:lesson", "theme:knowledge", "topic:reading"]),
  trail("sound-and-silence", "Sound and Silence", "Songs, cries, sermons, whispers, muteness, unanswered questions, and shipboard voices.", ["theme:sound", "theme:silence", "form:voice"]),
  trail("measurement-and-scale", "Measurement and Scale", "Weights, lengths, skeletons, fossils, maps, ocean size, and the failure of exact measure.", ["theme:scale", "topic:measurement", "topic:cetology"]),
  trail("food-and-appetite", "Food and Appetite", "Meals, hunger, whale meat, sharks, domestic eating, and the grotesque conversion of bodies into food.", ["theme:appetite", "topic:food", "form:grotesque"]),
  trail("ritual-and-ceremony", "Ritual and Ceremony", "Sermons, oaths, baptisms, funerals, coronation images, and labor that becomes ceremony.", ["theme:ritual", "form:sermon", "theme:symbolism"]),
  trail("rescue-and-witness", "Rescue and Witness", "Failed rescue, delayed rescue, abandoned figures, the Rachel, and Ishmael's role as final witness.", ["theme:rescue", "theme:witness", "theme:ending"])
];

const entityAdditions = [
  entity("father-mapple", "Father Mapple", "character", ["Mapple"]),
  entity("tashtego", "Tashtego", "character"),
  entity("daggoo", "Daggoo", "character"),
  entity("fleece", "Fleece", "character", ["the cook"]),
  entity("queequeg-coffin", "Queequeg's Coffin", "symbol", ["life-buoy"]),
  entity("doubloon", "The Doubloon", "symbol", ["gold coin"]),
  entity("compass", "Compass", "symbol", ["Ahab's compass"]),
  entity("quadrant", "Quadrant", "symbol", ["navigation instrument"]),
  entity("log-line", "Log-Line", "symbol", ["ship's log-line"]),
  entity("try-works", "Try-Works", "topic", ["tryworks"]),
  entity("monkey-rope", "Monkey-Rope", "symbol"),
  entity("harpoon", "Harpoon", "topic"),
  entity("lance", "Lance", "topic"),
  entity("whaleboat", "Whaleboat", "topic"),
  entity("pequod", "Pequod", "ship", ["the Pequod"]),
  entity("rachel", "Rachel", "ship"),
  entity("delight", "Delight", "ship"),
  entity("bachelor", "Bachelor", "ship"),
  entity("rose-bud", "Rose-Bud", "ship", ["Bouton de Rose"]),
  entity("town-ho", "Town-Ho", "ship"),
  entity("jeroboam", "Jeroboam", "ship"),
  entity("albatross", "Albatross", "ship"),
  entity("samuel-enderby", "Samuel Enderby", "ship"),
  entity("moby-dick", "Moby Dick", "animal", ["white whale"]),
  entity("sperm-whale", "Sperm Whale", "animal"),
  entity("right-whale", "Right Whale", "animal"),
  entity("giant-squid", "Giant Squid", "animal", ["squid"]),
  entity("sharks", "Sharks", "animal"),
  entity("starbuck-conscience", "Starbuck's Conscience", "theme", ["conscience"]),
  entity("ahab-revenge", "Ahab's Revenge", "theme", ["revenge"]),
  entity("ishmael-witness", "Ishmael as Witness", "theme", ["survivor"]),
  entity("shipboard-command", "Shipboard Command", "concept", ["captaincy"]),
  entity("forecastle", "Forecastle", "place", ["foc'sle"]),
  entity("quarterdeck", "Quarterdeck", "place"),
  entity("spouter-inn", "Spouter-Inn", "place"),
  entity("whaleman-chapel", "Whaleman's Chapel", "place"),
  entity("giant-cask", "Giant Cask", "symbol", ["Heidelberg Tun"]),
  entity("lima", "Lima", "place"),
  entity("pacific-ocean", "Pacific Ocean", "place"),
  entity("indian-ocean", "Indian Ocean", "place"),
  entity("atlantic-ocean", "Atlantic Ocean", "place"),
  entity("equator", "Equator", "place", ["the Line"])
];

const placeAdditions = [
  place("spouter-inn-display", "Spouter-Inn Display", "other", "spouter-inn", [-70.9342, 41.6362], ["chapter-003-the-spouter-inn", "chapter-004-the-counterpane"], "New Bedford inn setting for Ishmael and Queequeg's first shared scenes."),
  place("whalemans-chapel-display", "Whaleman's Chapel Display", "other", "whaleman-chapel", [-70.9342, 41.6362], ["chapter-007-the-chapel", "chapter-008-the-pulpit", "chapter-009-the-sermon"], "Chapel setting for memorial tablets and Father Mapple's Jonah sermon."),
  place("pequod-deck-display", "Pequod Deck Display", "ship-route-stage", "quarterdeck", [-45.0, 20.0], ["chapter-036-the-quarterdeck", "chapter-099-the-doubloon", "chapter-127-the-deck"], "Shipboard command space where Ahab turns objects and ceremonies into pressure on the crew."),
  place("forecastle-display", "Forecastle Display", "ship-route-stage", "forecastle", [-44.5, 19.5], ["chapter-040-midnight-forecastle", "chapter-121-midnight-the-forecastle-bulwarks"], "Crew space for songs, jokes, fear, and collective speech."),
  place("try-works-display", "Try-Works Display", "ship-route-stage", "try-works", [50.0, -35.0], ["chapter-096-the-try-works", "chapter-098-stowing-down-and-clearing-up"], "Deck-work display point for rendering whale oil and resetting the ship."),
  place("ambergris-encounter-stage", "Ambergris Encounter Stage", "ocean-region", "indian-ocean", [58.0, -30.0], ["chapter-091-the-pequod-meets-the-rose-bud", "chapter-092-ambergris"], "Middle-voyage encounter where foul decay turns unexpectedly into value."),
  place("enderby-encounter-stage", "Enderby Encounter Stage", "ocean-region", "pacific-ocean", [-128.0, -10.0], ["chapter-100-leg-and-arm", "chapter-101-the-decanter"], "Meeting stage for Captain Boomer, the Samuel Enderby, and competing responses to Moby Dick."),
  place("bachelor-encounter-stage", "Bachelor Encounter Stage", "ocean-region", "pacific-ocean", [-145.0, -6.0], ["chapter-115-the-pequod-meets-the-bachelor"], "Contrast point for a successful homeward-bound ship against the Pequod's grim pursuit."),
  place("rachel-encounter-stage", "Rachel Encounter Stage", "ocean-region", "pacific-ocean", [-154.0, -3.0], ["chapter-128-the-pequod-meets-the-rachel"], "Late warning stage where rescue is requested and refused."),
  place("delight-encounter-stage", "Delight Encounter Stage", "ocean-region", "pacific-ocean", [-154.2, -2.5], ["chapter-131-the-pequod-meets-the-delight"], "Final warning stage where wreckage and loss foreshadow the chase."),
  place("final-wreck-display", "Final Wreck Display", "ocean-region", "pacific-ocean", [-155.0, 0.0], ["chapter-135-the-chase-third-day", "epilogue-epilogue"], "Display point for the Pequod's sinking and Ishmael's survival."),
  place("jonah-sea-display", "Jonah Sea Display", "ocean-region", "jonah", [34.0, 32.0], ["chapter-009-the-sermon", "chapter-083-jonah-historically-regarded"], "Allusion display anchor for Jonah material; not a claim about the Pequod's route."),
  place("heidelberg-tun-display", "Heidelberg Tun Display", "landmark", "giant-cask", [8.715, 49.41], ["chapter-077-the-great-heidelburgh-tun"], "European comparison point for Ishmael's whale-head analogy."),
  place("lima-display", "Lima Display", "city-or-island", "lima", [-77.0428, -12.0464], ["chapter-054-the-town-ho-s-story"], "Port display anchor for the Town-Ho's nested narration frame."),
  place("sperm-whale-ground-display", "Sperm Whale Ground Display", "ocean-region", "sperm-whale", [125.0, -8.0], ["chapter-087-the-grand-armada", "chapter-088-schools-and-schoolmasters"], "Classroom map anchor for whale schools and eastern-seas encounter material."),
  place("right-whale-ground-display", "Right Whale Ground Display", "ocean-region", "right-whale", [40.0, -42.0], ["chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him"], "Classroom map anchor for the right-whale episode and the superstition around paired heads."),
  place("coffin-life-buoy-display", "Coffin Life-Buoy Display", "ship-route-stage", "queequeg-coffin", [-153.5, -4.5], ["chapter-110-queequeg-in-his-coffin", "chapter-126-the-life-buoy", "chapter-127-the-deck", "epilogue-epilogue"], "Shipboard object trail where Queequeg's coffin becomes the means of rescue."),
  place("doubloon-display", "Doubloon Display", "ship-route-stage", "doubloon", [-146.0, -7.0], ["chapter-036-the-quarterdeck", "chapter-099-the-doubloon"], "Object display point for Ahab's reward coin and the crew's competing interpretations.")
];

const waypointAdditions = [
  waypoint("new-bedford-chapel", "New Bedford Chapel", 7, 9, [-70.9342, 41.6362], "Memorial tablets and the Jonah sermon teach readers how the voyage will think about risk, judgment, and survival."),
  waypoint("nantucket-contract", "Nantucket Contract", 16, 18, [-70.0995, 41.2835], "The ship, owners, crew, and profit system turn Ishmael's desire for sea into a signed voyage."),
  waypoint("quarterdeck-oath", "Quarterdeck Oath", 36, 36, [-45.0, 20.0], "Ahab makes the private hunt public and binds the crew to the white whale."),
  waypoint("forecastle-chorus", "Forecastle Chorus", 40, 40, [-44.5, 19.5], "The crew's midnight voices widen the book from captain-centered drama to many languages and fears."),
  waypoint("first-gams", "First Gams", 52, 55, [-30.0, 10.0], "Ship encounters begin turning the ocean into a network of rumor, warnings, and competing knowledge."),
  waypoint("cutting-in-work", "Cutting-In Work", 66, 72, [42.0, -35.0], "The whale body becomes labor, rope, risk, tools, sharks, and shared dependence."),
  waypoint("head-and-measurement", "Head and Measurement", 74, 80, [50.0, -36.0], "Ishmael moves from whale heads to measurement, anatomy, and the limits of reading a body."),
  waypoint("tryworks-and-oil", "Try-Works and Oil", 94, 98, [55.0, -34.0], "Rendering, squeezing, cleaning, and stowing show how whale bodies become cargo and routine."),
  waypoint("enderby-contrast", "Enderby Contrast", 100, 101, [-128.0, -10.0], "Captain Boomer's missing arm throws Ahab's missing leg into sharper relief."),
  waypoint("coffin-to-life-buoy", "Coffin to Life-Buoy", 110, 127, [-153.5, -4.5], "Queequeg's coffin slowly changes meaning until it becomes the object that can save Ishmael."),
  waypoint("rachel-refusal", "Rachel Refusal", 128, 128, [-154.0, -3.0], "Ahab refuses a rescue mission, making the moral cost of the chase painfully direct."),
  waypoint("epilogue-survival", "Epilogue Survival", 135, 135, [-155.0, 0.0], "The wreck leaves one witness, and the book's survival depends on Ishmael's rescue.")
];

const added = {
  trails: appendMissing(taxonomy.trails, trailAdditions),
  entities: appendMissing(taxonomy.entities, entityAdditions),
  places: appendMissing(geography.places, placeAdditions),
  waypoints: appendMissing(voyageMap.waypoints, waypointAdditions)
};

await writeFile(taxonomyPath, `${JSON.stringify(taxonomy, null, 2)}\n`);
await writeFile(geographyPath, `${JSON.stringify(geography, null, 2)}\n`);
await writeFile(voyageMapPath, `${JSON.stringify(voyageMap, null, 2)}\n`);

console.log(JSON.stringify(added, null, 2));
