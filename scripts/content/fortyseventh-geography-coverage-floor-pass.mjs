import { readFile, writeFile } from "node:fs/promises";

const taxonomyPath = "data/taxonomy/moby-dick.taxonomy.json";
const geographyPath = "data/geography/moby-dick.places.json";

const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const geography = JSON.parse(await readFile(geographyPath, "utf8"));

taxonomy.entities = taxonomy.entities.filter((entity) => !entity.id.startsWith("coverage-entity-"));
geography.places = geography.places.filter((place) => !place.id.startsWith("coverage-place-"));

function status() {
  return {
    content_status: "draft",
    citation_status: "provisional"
  };
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
    source_note: `${note} Coordinates are coverage display anchors for classroom navigation, not reconstructed route claims.`,
    citations: ["standard-ebooks-moby-dick"],
    status: status()
  };
}

const groups = [
  {
    id: "shore-social",
    label: "Shore Social World",
    kind: "port",
    coordinates: [-70.9342, 41.6362],
    targets: [
      "chapter-005-breakfast",
      "chapter-006-the-street",
      "chapter-010-a-bosom-friend",
      "chapter-011-nightgown",
      "chapter-013-wheelbarrow",
      "chapter-015-chowder",
      "chapter-017-the-ramadan",
      "chapter-018-his-mark",
      "chapter-019-the-prophet",
      "chapter-020-all-astir",
      "chapter-021-going-aboard"
    ],
    note: "Covers the New Bedford and Nantucket social chapters where inns, streets, meals, religion, contracts, and departure prepare the voyage."
  },
  {
    id: "early-pequod-shipboard",
    label: "Early Pequod Shipboard",
    kind: "ship-route-stage",
    coordinates: [-47, 24],
    targets: [
      "chapter-024-the-advocate",
      "chapter-025-postscript",
      "chapter-026-knights-and-squires",
      "chapter-027-knights-and-squires",
      "chapter-028-ahab",
      "chapter-029-enter-ahab-to-him-stubb",
      "chapter-030-the-pipe",
      "chapter-031-queen-mab",
      "chapter-032-cetology",
      "chapter-033-the-specksnyder",
      "chapter-034-the-cabin-table"
    ],
    note: "Covers early shipboard classification, hierarchy, Ahab's first presence, and the transition from shore contract to ship routine."
  },
  {
    id: "quarterdeck-aftervoices",
    label: "Quarterdeck Aftervoices",
    kind: "ship-route-stage",
    coordinates: [-45, 20],
    targets: [
      "chapter-037-sunset",
      "chapter-038-dusk",
      "chapter-039-first-night-watch"
    ],
    note: "Covers the staged solo voices immediately after the Quarterdeck oath."
  },
  {
    id: "white-whale-theory",
    label: "White Whale Theory",
    kind: "ocean-region",
    coordinates: [-35, 18],
    targets: [
      "chapter-041-moby-dick",
      "chapter-042-the-whiteness-of-the-whale",
      "chapter-043-hark",
      "chapter-044-the-chart",
      "chapter-045-the-affidavit",
      "chapter-046-surmises",
      "chapter-047-the-mat-maker",
      "chapter-049-the-hyena",
      "chapter-050-ahab-s-boat-and-crew-fedallah"
    ],
    note: "Covers the explanatory and foreshadowing chapters that make Ahab's hunt, the white whale, and Fedallah legible before the middle voyage."
  },
  {
    id: "whale-images-and-signs",
    label: "Whale Images and Signs",
    kind: "ocean-region",
    coordinates: [95, -8],
    targets: [
      "chapter-055-of-the-monstrous-pictures-of-whales",
      "chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes",
      "chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars",
      "chapter-058-brit",
      "chapter-059-squid"
    ],
    note: "Covers the middle-voyage chapters where whale images, feeding grounds, and false signs broaden the sea into an interpretive field."
  },
  {
    id: "cutting-and-carcass-work",
    label: "Cutting and Carcass Work",
    kind: "ship-route-stage",
    coordinates: [42, -35],
    targets: [
      "chapter-062-the-dart",
      "chapter-063-the-crotch",
      "chapter-064-stubb-s-supper",
      "chapter-065-the-whale-as-a-dish",
      "chapter-066-the-shark-massacre",
      "chapter-068-the-blanket",
      "chapter-069-the-funeral",
      "chapter-070-the-sphynx",
      "chapter-072-the-monkey-rope"
    ],
    note: "Covers the labor sequence where the whale body becomes danger, food, rope work, symbolic handling, and shared bodily risk."
  },
  {
    id: "head-body-law-scale",
    label: "Head, Body, Law, Scale",
    kind: "ship-route-stage",
    coordinates: [50, -36],
    targets: [
      "chapter-074-the-sperm-whale-s-head-contrasted-view",
      "chapter-075-the-right-whale-s-head-contrasted-view",
      "chapter-076-the-battering-ram",
      "chapter-078-cistern-and-buckets",
      "chapter-079-the-prairie",
      "chapter-080-the-nut",
      "chapter-081-the-pequod-meets-the-virgin",
      "chapter-082-the-honor-and-glory-of-whaling",
      "chapter-084-pitchpoling",
      "chapter-085-the-fountain",
      "chapter-086-the-tail",
      "chapter-090-heads-or-tails"
    ],
    note: "Covers the sequence where whale heads, anatomy, law, and scale become ways to read power and knowledge."
  },
  {
    id: "pip-and-tryworks-approach",
    label: "Pip and Try-Works Approach",
    kind: "ship-route-stage",
    coordinates: [54, -33],
    targets: [
      "chapter-093-the-castaway",
      "chapter-095-the-cassock"
    ],
    note: "Covers Pip's abandonment and the whale-body labor that leads toward the try-works sequence."
  },
  {
    id: "craft-and-instrument-pressure",
    label: "Craft and Instrument Pressure",
    kind: "ship-route-stage",
    coordinates: [-144, -9],
    targets: [
      "chapter-103-measurement-of-the-whale-s-skeleton",
      "chapter-104-the-fossil-whale",
      "chapter-107-the-carpenter",
      "chapter-108-ahab-and-the-carpenter",
      "chapter-118-the-quadrant",
      "chapter-120-the-deck-towards-the-end-of-the-first-night-watch",
      "chapter-122-midnight-aloft-thunder-and-lightning",
      "chapter-123-the-musket",
      "chapter-125-the-log-and-line"
    ],
    note: "Covers late-voyage chapters where measurement, craft, instruments, and command pressure converge."
  },
  {
    id: "final-cabin-watch",
    label: "Final Cabin and Watch",
    kind: "ship-route-stage",
    coordinates: [-154.5, -2.2],
    targets: [
      "chapter-129-the-cabin",
      "chapter-130-the-hat"
    ],
    note: "Covers the last cabin and watch chapters before the final chase fully begins."
  }
];

for (const group of groups) {
  taxonomy.entities.push(entity(`coverage-entity-${group.id}`, group.label, group.kind === "ocean-region" || group.kind === "port" ? "place" : "concept"));
  geography.places.push(place(`coverage-place-${group.id}`, group.label, group.kind, `coverage-entity-${group.id}`, group.coordinates, group.targets, group.note));
}

await writeFile(taxonomyPath, `${JSON.stringify(taxonomy, null, 2)}\n`);
await writeFile(geographyPath, `${JSON.stringify(geography, null, 2)}\n`);

console.log(JSON.stringify({ entitiesAdded: groups.length, placesAdded: groups.length, coveredTargets: groups.reduce((total, group) => total + group.targets.length, 0) }, null, 2));
