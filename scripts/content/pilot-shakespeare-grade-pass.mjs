// Pilot: Shakespeare-grade public Study notes.
//
// The recovery work proved the platform; this pass proves the VOICE. Each record here is a
// clean, purpose-built, reader-facing Study note that teaches the actual knowledge a
// smart-but-unprepared student lacks (a biblical name, a classical myth, a partitioned nation,
// a blasphemous ritual) and cites a verified public-domain or reference source for it -- the
// bar set by the sibling Shakespeare Portal.
//
// These are authored, not promoted from generated scaffolds. Selector positions are filled by
// scripts/ingest/build-annotation-selectors.mjs from the `anchor` text, and uses-source
// relationships are auto-derived from `citations`. Re-running is idempotent: any prior record
// or source with a pilot id is replaced.
//
// Discipline (every record): exact anchor; teach the reference first, then its function; every
// external claim cites a non-Standard-Ebooks verified source; evidence carries selector-resolves
// + primary-source-checked + adversarial-review (+ tone-review for difficult material); prose is
// free of generation residue and safetyist framing. Lanes covered here: lexical, biblical,
// classical, historical, and difficult-material/tone.

import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const sourcesPath = "data/sources/moby-dick.source-records.json";
const today = "2026-06-08";
const reviewer = "claude-opus";

// New verified support sources this pilot needs (historical + difficult-material lanes).
// Each was checked against the live page on 2026-06-08 before being marked verified.
const pilotSources = [
  {
    id: "britannica-partitions-of-poland",
    kind: "encyclopedia",
    title: "Partitions of Poland",
    author: "Britannica Editors",
    publisher: "Encyclopaedia Britannica",
    url: "https://www.britannica.com/event/Partitions-of-Poland",
    bibliographic_note: "Reference support for the three partitions of Poland by Russia, Prussia, and Austria.",
    accessed: today,
    local_path: null,
    source_note:
      "Britannica page verified 2026-06-08: the three partitions of 1772, 1793, and 1795 by Russia, Prussia, and Austria progressively reduced Poland until the state ceased to exist.",
    license_note: "External reference page; cite for verification only and do not reuse Britannica prose beyond short attributed snippets.",
    citation_status: "verified"
  },
  {
    id: "britannica-manifest-destiny",
    kind: "encyclopedia",
    title: "Manifest Destiny",
    author: "Britannica Editors",
    publisher: "Encyclopaedia Britannica",
    url: "https://www.britannica.com/event/Manifest-Destiny",
    bibliographic_note: "Reference support for 1840s United States territorial expansion: Texas annexation (1845) and the Mexican-American War.",
    accessed: today,
    local_path: null,
    source_note:
      "Britannica page verified 2026-06-08: covers the 1840s doctrine of continental expansion, the 1845 annexation of Texas, and the Mexican-American War.",
    license_note: "External reference page; cite for verification only and do not reuse Britannica prose beyond short attributed snippets.",
    citation_status: "verified"
  },
  {
    id: "us-census-1860-population",
    kind: "historical-primary",
    title: "Population of the United States in 1860 (Eighth Census)",
    author: "United States Census Bureau",
    publisher: "U.S. Government, Department of the Interior",
    url: "https://www.census.gov/library/publications/1864/dec/1860a.html",
    bibliographic_note: "Official decennial census volume; tabulates population by condition (free and slave). The enslaved population was 3,953,760 in 1860.",
    accessed: today,
    local_path: null,
    source_note:
      "U.S. Census Bureau page verified 2026-06-08: official Eighth Census (1860) population volume reporting population by color and condition, including the enslaved population.",
    license_note: "U.S. Government public-domain publication.",
    citation_status: "verified"
  }
];

// Each entry: { id, unit_id, kind, anchor, note, claim_type, citations, tone? }
const SE = "standard-ebooks-moby-dick";
const pilotRecords = [
  // --- Chapter 1, Loomings: biblical + classical + difficult-material ---
  {
    id: "loomings-ishmael-name",
    unit_id: "chapter-001-loomings",
    kind: "context",
    anchor: "Call me Ishmael",
    claim_type: "biblical-context",
    citations: [SE, "king-james-bible"],
    note:
      "The narrator never claims this is his real name; he only asks to be called Ishmael. Genesis gives the name to Abraham's first son, born to the servant Hagar and cast out into the wilderness, of whom God foretells that he will be a wild man, his hand against every man and every man's hand against him (Genesis 16:12). The borrowed name marks the speaker as an outcast and wanderer before his story even begins."
  },
  {
    id: "loomings-narcissus",
    unit_id: "chapter-001-loomings",
    kind: "context",
    anchor: "Narcissus",
    claim_type: "classical-context",
    citations: [SE, "bulfinch-age-of-fable"],
    note:
      "Narcissus, in the Greek myth retold in Bulfinch's Age of Fable, falls in love with his own reflection in a pool and, unable to grasp it, wastes away and drowns. Melville calls the story the key to it all: the water that draws Ishmael shows every onlooker the same thing, the beautiful and ungraspable image of the self that can never be seized."
  },
  {
    id: "loomings-jove-sea-brother",
    unit_id: "chapter-001-loomings",
    kind: "context",
    anchor: "own brother of Jove",
    claim_type: "classical-context",
    citations: [SE, "bulfinch-age-of-fable"],
    note:
      "Jove is the Roman name for Jupiter, king of the gods, the Greek Zeus. His brother is Neptune, or Poseidon, who rules the sea. Ishmael's point is that the Greeks and Romans ranked the ocean almost level with the sky, handing it a god of equally royal blood. The aside treats reverence for the sea as something ancient and serious, not a modern fancy."
  },
  {
    id: "loomings-two-orchard-thieves",
    unit_id: "chapter-001-loomings",
    kind: "context",
    anchor: "the two orchard thieves",
    claim_type: "biblical-context",
    citations: [SE, "king-james-bible"],
    note:
      "The two orchard thieves are Adam and Eve, who ate the forbidden fruit in the garden of Eden (Genesis 3). Ishmael jokes that having to pay for anything is part of the curse humanity inherited from that first theft, with labor, debt, and discomfort all flowing from the Fall. The throwaway line quietly casts money and work as a form of punishment."
  },
  {
    id: "loomings-monied-man-heaven",
    unit_id: "chapter-001-loomings",
    kind: "context",
    anchor: "on no account can a monied man enter heaven",
    claim_type: "biblical-context",
    citations: [SE, "king-james-bible"],
    note:
      "This echoes Jesus's warning that it is easier for a camel to go through the eye of a needle than for a rich man to enter the kingdom of God (Matthew 19:24). Ishmael half-credits the idea that money is the root of all earthly ills (1 Timothy 6:10) yet delights in being paid. The comedy is that he quotes scripture against wealth while cheerfully chasing his wages."
  },
  {
    id: "loomings-who-aint-a-slave",
    unit_id: "chapter-001-loomings",
    kind: "context",
    anchor: "Who ain’t a slave? Tell me that",
    claim_type: "historical-context",
    citations: [SE, "us-census-1860-population"],
    tone: true,
    note:
      "When Moby-Dick appeared in 1851, the United States census already counted more than three million people held as property, a figure that neared four million by 1860. Ishmael stretches slavery into a universal figure for anyone who takes orders, which can make a real and specific atrocity sound like everyone's ordinary lot. The line reads as period rhetoric, not a moral verdict the book has settled."
  },

  // --- Chapter 14, Nantucket: historical (Poland, expansion) + biblical (Psalm 107) ---
  {
    id: "nantucket-partitions-poland",
    unit_id: "chapter-014-nantucket",
    kind: "context",
    anchor: "the three pirate powers did Poland",
    claim_type: "historical-context",
    citations: [SE, "britannica-partitions-of-poland"],
    note:
      "The three pirate powers are Russia, Prussia, and Austria, who in three partitions (1772, 1793, and 1795) divided up Poland until it vanished from the map of Europe entirely. Melville's grim joke is that Nantucket whalemen have parcelled out the oceans among themselves just as coolly as those empires carved up a defenseless nation."
  },
  {
    id: "nantucket-manifest-destiny",
    unit_id: "chapter-014-nantucket",
    kind: "context",
    anchor: "Let America add Mexico to Texas, and pile Cuba upon Canada",
    claim_type: "historical-context",
    citations: [SE, "britannica-manifest-destiny"],
    note:
      "This catalogs the expansionist appetite of Melville's own moment: the United States had just annexed Texas in 1845 and taken vast Mexican land in the war of 1846 to 1848, while politicians openly coveted Cuba and eyed British Canada. Ishmael lists the land-grabs to claim the Nantucketer out-conquers them all, owning two-thirds of the globe by owning the sea."
  },
  {
    id: "nantucket-go-down-to-the-sea",
    unit_id: "chapter-014-nantucket",
    kind: "context",
    anchor: "in Bible language, goes down to it in ships",
    claim_type: "biblical-context",
    citations: [SE, "king-james-bible"],
    note:
      "Melville flags the borrowing himself. The phrase comes from Psalm 107, they that go down to the sea in ships, that do business in great waters, these see the works of the Lord (Psalm 107:23-24). By lending the Nantucketer's daily trade the cadence of scripture, Ishmael quietly raises ordinary whaling labor toward something like a sacred calling."
  },

  // --- Chapter 36, The Quarter-Deck: lexical + biblical ritual ---
  {
    id: "quarterdeck-spanish-ounce",
    unit_id: "chapter-036-the-quarterdeck",
    kind: "context",
    anchor: "this Spanish ounce of gold",
    claim_type: "lexical",
    citations: [SE, "webster-1913"],
    note:
      "A Spanish ounce of gold is a doubloon, a thick Spanish coin that Ishmael values here at sixteen American dollars, a serious sum for a sailor (Webster). Nailing it to the mainmast turns Ahab's private hatred into a public wager: every man on watch now has a glittering personal stake in raising one particular whale."
  },
  {
    id: "quarterdeck-pope-footwashing",
    unit_id: "chapter-036-the-quarterdeck",
    kind: "context",
    anchor: "the great Pope washes the feet of beggars, using his tiara for ewer",
    claim_type: "biblical-context",
    citations: [SE, "king-james-bible"],
    note:
      "Ahab points to the Catholic rite in which the Pope, on the Thursday before Easter, washes the feet of the poor in imitation of Jesus washing his disciples' feet (John 13:4-5); the tiara is the Pope's tall ceremonial crown, here used as a water-jug. By making his officers serve the harpooneers, Ahab borrows that staged humility to bind every rank to his oath."
  },
  {
    id: "quarterdeck-murderous-chalices",
    unit_id: "chapter-036-the-quarterdeck",
    kind: "context",
    anchor: "Commend the murderous chalices",
    claim_type: "biblical-context",
    citations: [SE, "king-james-bible"],
    note:
      "Ahab stages the oath as a black sacrament. The detached harpoon sockets become chalices and the grog becomes sacramental wine, echoing the Last Supper, where Jesus passes the cup and says, drink ye all of it, for this is my blood (Matthew 26:27-28). The communion of the church is turned inside out into a shared vow of killing."
  },
  {
    id: "quarterdeck-leyden-jar",
    unit_id: "chapter-036-the-quarterdeck",
    kind: "context",
    anchor: "the Leyden jar of his own magnetic life",
    claim_type: "lexical",
    citations: [SE, "webster-1913"],
    note:
      "A Leyden jar is an early device for storing static electricity, the first practical capacitor, which holds a charge until it is released in one sudden shock (Webster). Ahab imagines his own will as such a stored charge that he could discharge into his mates, making his fixed purpose feel like a physical force he might pour straight into other men."
  }
];

function buildRecord(record) {
  const validation = ["selector-resolves", "primary-source-checked", "adversarial-review"];
  if (record.tone) validation.push("tone-review");
  return {
    id: record.id,
    unit_id: record.unit_id,
    kind: record.kind,
    selector: { type: "TextQuoteSelector", exact: record.anchor },
    display: { depth: "study", priority: 2, inline: true, surfaces: ["reader", "index"], spoiler_level: "none" },
    anchor: record.anchor,
    note: record.note,
    tags: ["pilot:shakespeare-grade", `claim:${record.claim_type}`],
    relationships: [],
    evidence: [{ claim_type: record.claim_type, citations: record.citations, validation }],
    citations: record.citations,
    provenance: { author: "claude-opus", created: today, method: "reviewed", reviewer, reviewed: today },
    status: { content_status: "student-ready", citation_status: "verified", review_queue: [] }
  };
}

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

// 1) Ensure the new verified support sources exist (idempotent replace by id).
const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
const pilotSourceIds = new Set(pilotSources.map((source) => source.id));
sources.records = [...sources.records.filter((record) => !pilotSourceIds.has(record.id)), ...pilotSources];
await writeFile(sourcesPath, `${escapeNonAscii(JSON.stringify(sources, null, 2))}\n`);

// 2) Author the public Study notes (idempotent replace by id).
const collection = JSON.parse(await readFile(annotationsPath, "utf8"));
const pilotIds = new Set(pilotRecords.map((record) => record.id));
const kept = collection.annotations.filter((annotation) => !pilotIds.has(annotation.id));
const replaced = collection.annotations.length - kept.length;
collection.annotations = [...kept, ...pilotRecords.map(buildRecord)];
await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(collection, null, 2))}\n`);

console.log(`Ensured ${pilotSources.length} verified pilot sources.`);
console.log(`Authored ${pilotRecords.length} Shakespeare-grade pilot Study notes (replaced ${replaced} prior pilot records).`);
