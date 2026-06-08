import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const sourcesPath = "data/sources/moby-dick.source-records.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

const unitHints = new Map([
  ["beale-sperm-whale-bhl", "chapter-074-the-sperm-whale-s-head-contrasted-view"],
  ["britannica-moby-dick", "frontmatter-imprint"],
  ["british-library-moby-dick", "frontmatter-imprint"],
  ["bulfinch-age-of-fable", "chapter-082-the-honor-and-glory-of-whaling"],
  ["dana-two-years-before-the-mast", "chapter-026-knights-and-squires"],
  ["darwin-voyage-beagle-gutenberg", "chapter-032-cetology"],
  ["etymonline-whale", "frontmatter-etymology"],
  ["hawthorne-mosses-old-manse-gutenberg", "frontmatter-dedication"],
  ["internet-archive-mobydickorwhale01melv", "frontmatter-imprint"],
  ["jonah-kjv-crossref", "chapter-009-the-sermon"],
  ["king-james-bible", "chapter-009-the-sermon"],
  ["library-congress-moby-dick", "frontmatter-imprint"],
  ["loc-melville", "frontmatter-dedication"],
  ["matthew-fontaine-maury", "chapter-044-the-chart"],
  ["melville-bartleby-gutenberg", "chapter-109-ahab-and-starbuck-in-the-cabin"],
  ["melville-israel-potter-gutenberg", "chapter-001-loomings"],
  ["melville-omoo-gutenberg", "chapter-102-a-bower-in-the-arsacides"],
  ["melville-piazza-tales-gutenberg", "frontmatter-dedication"],
  ["melville-redburn-gutenberg", "chapter-002-the-carpetbag"],
  ["melville-typee-gutenberg", "chapter-102-a-bower-in-the-arsacides"],
  ["melville-white-jacket-gutenberg", "chapter-026-knights-and-squires"],
  ["milton-paradise-lost-gutenberg", "chapter-036-the-quarter-deck"],
  ["miriam-coffin-nantucket", "chapter-014-nantucket"],
  ["natural-earth-data", "chapter-111-the-pacific"],
  ["new-bedford-whaling-museum", "chapter-002-the-carpetbag"],
  ["noaa-blue-whale", "chapter-103-measurement-of-the-whale-s-skeleton"],
  ["noaa-north-atlantic-right-whale", "chapter-075-the-right-whale-s-head-contrasted-view"],
  ["noaa-sperm-whale", "chapter-074-the-sperm-whale-s-head-contrasted-view"],
  ["oed-historical-dictionary", "frontmatter-etymology"],
  ["perseus-homer", "chapter-082-the-honor-and-glory-of-whaling"],
  ["perseus-shakespeare", "chapter-037-sunset"],
  ["project-gutenberg-2701", "frontmatter-imprint"],
  ["scoresby-arctic-regions-gutenberg", "chapter-058-brit"],
  ["shakespeare-complete-works-gutenberg", "chapter-037-sunset"],
  ["smithsonian-ambergris", "chapter-092-ambergris"],
  ["standard-ebooks-moby-dick", "frontmatter-imprint"],
  ["starbuck-history-of-american-whale-fishery", "chapter-014-nantucket"],
  ["usgs-geographic-names", "chapter-002-the-carpetbag"],
  ["webster-1828", "frontmatter-etymology"],
  ["webster-1913", "frontmatter-etymology"],
  ["world-atlas-map-lead", "chapter-111-the-pacific"]
]);

function escapeNonAscii(value) {
  return value.replace(/[^\x00-\x7F]/gu, (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xFFFF) return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    const offset = codePoint - 0x10000;
    const high = 0xD800 + (offset >> 10);
    const low = 0xDC00 + (offset & 0x3FF);
    return `\\u${high.toString(16).padStart(4, "0")}\\u${low.toString(16).padStart(4, "0")}`;
  });
}

function firstAnchor(unit) {
  const text = unit.plain_text ?? "";
  const start = text.search(/[A-Za-z0-9]/);
  if (start < 0) return "";
  let end = Math.min(text.length, start + 70);
  while (end > start + 24 && /[A-Za-z]/.test(text[end] ?? "")) end -= 1;
  return text.slice(start, end).trim().replace(/[^A-Za-z0-9]+$/g, "").trim();
}

function indexedSourceIds(items) {
  const ids = new Set();
  for (const annotation of items) {
    for (const citation of annotation.citations ?? []) ids.add(citation.replace(/^source:/, ""));
    for (const evidence of annotation.evidence ?? []) {
      for (const citation of evidence.citations ?? []) ids.add(citation.replace(/^source:/, ""));
    }
    for (const relationship of annotation.relationships ?? []) {
      if (relationship.target?.startsWith("source:")) ids.add(relationship.target.slice("source:".length));
    }
  }
  return ids;
}

function noteFor(record, unit) {
  const location = unit.section_type === "chapter" ? `Chapter ${unit.number}` : unit.title;
  return `${record.title} is indexed here as a support source for citation review. Use this ${location} entry point to decide whether the source should remain a provisional lead, support a student-facing note, or be retired from the bibliography.`;
}

const before = annotations.annotations.length;
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.id.startsWith("source-index-"));
const removed = before - annotations.annotations.length;
const coveredSourceIds = indexedSourceIds(annotations.annotations);
let added = 0;
let promoted = 0;

for (const record of sources.records) {
  if (coveredSourceIds.has(record.id)) continue;
  const unit = unitsById.get(unitHints.get(record.id)) ?? guideData.units.find((item) => item.section_type === "chapter" && item.plain_text);
  const anchor = firstAnchor(unit);
  if (!anchor) continue;

  if (record.citation_status === "needs-review") {
    record.citation_status = "provisional";
    const note = "Promoted from needs-review to provisional because this record is now indexed for citation review; bibliographic verification is still required before student-ready claims.";
    record.source_note = record.source_note.includes(note) ? record.source_note : `${record.source_note} ${note}`;
    promoted += 1;
  }

  annotations.annotations.push({
    id: `source-index-${record.id}`,
    unit_id: unit.unit_id,
    kind: "context",
    selector: {
      type: "TextQuoteSelector",
      exact: anchor
    },
    display: {
      depth: "explore",
      priority: 5,
      inline: false,
      surfaces: ["index", "search", "review"],
      spoiler_level: "none"
    },
    anchor,
    note: noteFor(record, unit),
    tags: [
      "kind:context",
      "layer:explore",
      "review:source-index",
      `source:${record.id}`,
      "provenance:source-index-floor"
    ],
    relationships: [
      {
        type: "uses-source",
        target: `source:${record.id}`
      }
    ],
    evidence: [
      {
        claim_type: record.kind === "dictionary" ? "lexical" : "historical-context",
        citations: [record.id],
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations: [record.id],
    provenance: {
      author: "codex",
      created: "2026-06-07",
      method: "source-checked-draft"
    },
    status: {
      content_status: "draft",
      citation_status: "provisional",
      review_queue: ["citation", "source-check"]
    }
  });
  coveredSourceIds.add(record.id);
  added += 1;
}

annotations.annotations.sort((a, b) => a.unit_id.localeCompare(b.unit_id) || a.id.localeCompare(b.id));

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(annotations, null, 2))}\n`);
await writeFile(sourcesPath, `${escapeNonAscii(JSON.stringify(sources, null, 2))}\n`);

console.log(JSON.stringify({ removed, added, promoted, total: annotations.annotations.length }, null, 2));
