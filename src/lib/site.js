// Shared helpers for the multi-page portal: base-aware links, claim-type display
// metadata, and source-record lookups for citation rendering.

import sourceData from "../../data/sources/moby-dick.source-records.json";

const BASE = import.meta.env.BASE_URL; // e.g. "/moby-dick-portal/"

export function withBase(p) {
  const clean = String(p).replace(/^\/+/, "");
  return BASE.endsWith("/") ? BASE + clean : `${BASE}/${clean}`;
}

export function unitHref(unitId) {
  return withBase(`read/${unitId}/`);
}

export const sourceMap = new Map(sourceData.records.map((r) => [r.id, r]));

export function sourceInfo(id) {
  return sourceMap.get(id) ?? { id, title: id, url: null, author: null };
}

// Display metadata for each evidence claim type. `cls` drives the badge color.
export const claimMeta = {
  "biblical-context": { label: "Biblical", cls: "biblical" },
  "classical-context": { label: "Classical / literary", cls: "classical" },
  "historical-context": { label: "Historical", cls: "historical" },
  "nautical-whaling": { label: "Whaling & sea", cls: "nautical" },
  lexical: { label: "Word", cls: "lexical" },
  cartographic: { label: "Place", cls: "historical" },
  "publication-context": { label: "Publishing", cls: "historical" },
  "source-text-observation": { label: "Close reading", cls: "textual" },
  interpretive: { label: "Interpretation", cls: "textual" }
};

export function claimInfo(type) {
  return claimMeta[type] ?? { label: type, cls: "textual" };
}

// The claim type that best describes what a note teaches (prefer external knowledge).
export function primaryClaim(annotation) {
  const ev = annotation.evidence ?? [];
  const ext = ev.find(
    (e) => e.claim_type !== "source-text-observation" && e.claim_type !== "interpretive"
  );
  return (ext ?? ev[0])?.claim_type ?? "source-text-observation";
}

// External (non-Melville-text) sources a note cites.
export function externalCitations(annotation) {
  const set = new Set();
  for (const e of annotation.evidence ?? []) {
    for (const c of e.citations ?? []) if (c && c !== "standard-ebooks-moby-dick") set.add(c);
  }
  for (const c of annotation.citations ?? []) if (c && c !== "standard-ebooks-moby-dick") set.add(c);
  return [...set];
}

export const pathMeta = {
  narrative_core: { label: "Narrative Core", short: "Core", blurb: "The shortest coherent path through the plot." },
  classroom_standard: { label: "Classroom Standard", short: "Classroom", blurb: "A balanced syllabus path for teachers." },
  full_text: { label: "Full Text", short: "Full", blurb: "Every word, with the full apparatus." }
};

export function unitKicker(unit) {
  if (unit.section_type === "chapter") return `Chapter ${unit.number}`;
  if (unit.section_type === "epilogue") return "Epilogue";
  return "Front matter";
}

// Human labels for the unit `functions` classification (thematic browsing).
export const functionMeta = {
  narrative: "Narrative",
  symbolic: "Symbol",
  character: "Character",
  "whaling-labor": "Whaling labor",
  cetology: "Cetology",
  theatrical: "Theater / form",
  prophecy: "Prophecy",
  gam: "Gam (ship meeting)",
  "legal-political": "Law & politics",
  "biblical-allusion": "Biblical",
  sermon: "Sermon",
  transition: "Transition",
  prefatory: "Front matter"
};

export function readingUnits(units) {
  return units
    .filter((u) => u.section_type === "chapter" || u.section_type === "epilogue")
    .sort((a, b) => a.sequence - b.sequence);
}
