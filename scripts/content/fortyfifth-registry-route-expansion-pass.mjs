import { readFile, writeFile } from "node:fs/promises";

const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";
const geographyPath = "data/geography/moby-dick.places.json";
const voyageMapPath = "data/maps/moby-dick.voyage-map.json";

const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const geography = JSON.parse(await readFile(geographyPath, "utf8"));
const voyageMap = JSON.parse(await readFile(voyageMapPath, "utf8"));

function status() {
  return {
    content_status: "draft",
    citation_status: "provisional"
  };
}

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
    source_note: `${note} Coordinates are classroom display anchors, not reconstructed route evidence.`,
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
  trail("short-chapters-big-turns", "Short Chapters, Big Turns", "Compact chapters whose small size hides a major shift in symbol, command, weather, or consequence.", ["form:short-chapter", "theme:turning-point"]),
  trail("objects-that-change-meaning", "Objects That Change Meaning", "Objects such as the doubloon, pipe, coffin, lamp, line, compass, and quadrant as they move between practical use and symbol.", ["symbol:object", "topic:tools"]),
  trail("crew-voices", "Crew Voices", "Moments when sailors other than Ahab and Ishmael shape the sound, fear, humor, or conscience of the voyage.", ["form:voice", "topic:crew"]),
  trail("failed-warnings", "Failed Warnings", "Warnings, prophecies, ship encounters, and pleas for help that Ahab hears without changing course.", ["theme:warning", "theme:choice"]),
  trail("whale-body-as-book", "Whale Body As Book", "Chapters where Ishmael reads heads, bones, skin, oil, and size as if the whale body were an archive.", ["topic:cetology", "theme:reading"]),
  trail("domesticity-at-sea", "Domesticity At Sea", "Beds, meals, lamps, pipes, squeezing, sewing, cleaning, and other domestic-feeling acts aboard or near the ship.", ["theme:home", "topic:shipboard"]),
  trail("isolation-and-fellowship", "Isolation And Fellowship", "The book's movement between loneliness, chosen friendship, crew solidarity, and final abandonment.", ["theme:isolation", "theme:fellowship"]),
  trail("knowledge-under-strain", "Knowledge Under Strain", "Moments where classification, testimony, measurement, prophecy, or navigation fails under pressure.", ["theme:knowledge", "theme:limits"]),
  trail("body-and-instrument", "Body And Instrument", "Peg legs, hands, heads, ropes, needles, lances, and tools that blur bodies with ship equipment.", ["theme:body", "topic:tools"]),
  trail("aftermath-and-survival", "Aftermath And Survival", "Late chapters where rescue, witness, wreckage, and memory determine what remains after the hunt.", ["theme:survival", "theme:witness"])
];

const entityAdditions = [
  entity("the-lamp", "The Lamp", "symbol", ["lamp"]),
  entity("ahabs-pipe", "Ahab's Pipe", "symbol", ["pipe"]),
  entity("the-line", "The Line", "symbol", ["whale-line"]),
  entity("the-needle", "The Needle", "symbol", ["compass needle"]),
  entity("the-candles", "The Candles", "symbol", ["St. Elmo's fire"]),
  entity("the-lifebuoy", "The Life-Buoy", "symbol", ["life-buoy"]),
  entity("the-deck", "The Deck", "place", ["deck"]),
  entity("the-cabin", "The Cabin", "place", ["Ahab's cabin"]),
  entity("the-masthead", "The Mast-Head", "place", ["masthead"]),
  entity("the-try-works", "The Try-Works", "place", ["tryworks"]),
  entity("the-lee-shore", "The Lee Shore", "concept", ["lee shore"]),
  entity("fast-fish-loose-fish", "Fast-Fish and Loose-Fish", "concept", ["fast fish", "loose fish"]),
  entity("whiteness", "Whiteness", "theme", ["the whiteness of the whale"]),
  entity("the-blankness", "Blankness", "concept", ["blankness"]),
  entity("isolation-and-fellowship", "Isolation and Fellowship", "theme", ["fellowship", "isolation"]),
  entity("the-carpetbag", "The Carpetbag", "symbol", ["carpetbag"]),
  entity("the-counterpane", "The Counterpane", "symbol", ["counterpane"]),
  entity("pip", "Pip", "character"),
  entity("perth", "Perth", "character", ["the blacksmith"]),
  entity("the-carpenter", "The Carpenter", "character", ["carpenter"]),
  entity("boomer", "Captain Boomer", "character", ["Boomer"]),
  entity("gabriel", "Gabriel", "character"),
  entity("bildad", "Bildad", "character"),
  entity("peleg", "Peleg", "character"),
  entity("elijah", "Elijah", "character"),
  entity("jonah", "Jonah", "allusion"),
  entity("job", "Job", "allusion"),
  entity("narcissus", "Narcissus", "allusion"),
  entity("bulkington", "Bulkington", "character"),
  entity("radney", "Radney", "character"),
  entity("steelkit", "Steelkilt", "character")
];

const placeAdditions = [
  place("loomings-waterfront-display", "Loomings Waterfront Display", "landmark", "manhattan", [-74.01, 40.706], ["chapter-001-loomings"], "Display point for Ishmael's opening pull toward water."),
  place("carpetbag-route-display", "Carpetbag Route Display", "ship-route-stage", "the-carpetbag", [-72.8, 41.2], ["chapter-002-the-carpetbag"], "Shore-route point for Ishmael's cold movement toward the whaling world."),
  place("counterpane-room-display", "Counterpane Room Display", "other", "the-counterpane", [-70.9342, 41.6362], ["chapter-004-the-counterpane"], "Interior display point for Ishmael and Queequeg's first morning of intimacy and fear."),
  place("lee-shore-display", "Lee Shore Display", "ocean-region", "the-lee-shore", [-55, 30], ["chapter-023-the-lee-shore"], "Conceptual ocean display point for Bulkington and the risk of spiritual shore-safety."),
  place("masthead-display", "Mast-Head Display", "ship-route-stage", "the-masthead", [-42, 23], ["chapter-035-the-masthead"], "Vertical shipboard display point for lookout, reverie, and danger."),
  place("line-display", "The Line Display", "ship-route-stage", "the-line", [-18, 2], ["chapter-060-the-line", "chapter-061-stubb-kills-a-whale"], "Shipboard work display point for the whale-line's practical and symbolic danger."),
  place("squeeze-display", "Squeeze Display", "ship-route-stage", "isolation-and-fellowship", [48, -34], ["chapter-094-a-squeeze-of-the-hand"], "Deck-work display point for the chapter's surprising fellowship inside labor."),
  place("lamp-display", "The Lamp Display", "ship-route-stage", "the-lamp", [54, -33], ["chapter-097-the-lamp"], "Short labor-symbol chapter display point for oil, light, and whaling's domestic reward."),
  place("cabin-confrontation-display", "Cabin Confrontation Display", "ship-route-stage", "the-cabin", [-143, -9], ["chapter-109-ahab-and-starbuck-in-the-cabin"], "Interior display point for Starbuck's moral confrontation with Ahab."),
  place("blacksmith-forge-display", "Blacksmith Forge Display", "ship-route-stage", "harpoon", [-144, -9], ["chapter-112-the-blacksmith", "chapter-113-the-forge"], "Shipboard craft display point where tools and bodies carry the pressure of revenge."),
  place("needle-display", "Needle Display", "ship-route-stage", "the-needle", [-150, -7], ["chapter-124-the-needle"], "Navigation display point where Ahab remakes instrument failure into command theater."),
  place("final-masthead-display", "Final Mast-Head Display", "ship-route-stage", "the-masthead", [-154.8, -0.5], ["chapter-133-the-chase-first-day", "chapter-134-the-chase-second-day"], "Final lookout display point for sighting, chase, and escalating loss.")
];

const waypointAdditions = [
  waypoint("loomings-shore-water", "Shore to Water", 1, 1, [-74.01, 40.706], "The first chapter turns a private mood into a movement toward the sea."),
  waypoint("spouter-inn-room", "Spouter-Inn Room", 3, 4, [-70.9342, 41.6362], "Fear of Queequeg changes into recognition and intimacy."),
  waypoint("lee-shore-threshold", "Lee Shore Threshold", 23, 23, [-55, 30], "Bulkington's brief return marks the moral risk of choosing the open sea."),
  waypoint("ahab-appears", "Ahab Appears", 28, 30, [-47, 24], "The captain's body, silence, and pipe begin turning rumor into command presence."),
  waypoint("masthead-reverie", "Mast-Head Reverie", 35, 35, [-42, 23], "A lookout chapter becomes a lesson in perception, dreaming, and danger."),
  waypoint("white-whale-theory", "White Whale Theory", 41, 45, [-35, 18], "Ishmael pauses the action to explain Ahab's obsession and the whale's symbolic terror."),
  waypoint("line-and-kill", "Line and Kill", 60, 62, [-18, 2], "Technical rope-work and whale-killing make danger practical rather than abstract."),
  waypoint("whale-body-reading", "Whale Body Reading", 68, 80, [48, -36], "The whale body becomes anatomy, measurement, comparison, and interpretive problem."),
  waypoint("squeeze-and-lamp", "Squeeze and Lamp", 94, 97, [53, -33], "Labor briefly becomes fellowship and light before the voyage tightens again."),
  waypoint("blacksmith-forge", "Blacksmith Forge", 112, 113, [-144, -9], "The ship's craft workers help turn Ahab's obsession into tools."),
  waypoint("needle-and-log", "Needle and Log", 124, 125, [-150, -7], "Navigation instruments fail or are remade while Ahab keeps asserting control."),
  waypoint("final-witness", "Final Witness", 135, 135, [-155, 0], "The wreck resolves the voyage into survival, rescue, and the burden of telling.")
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
