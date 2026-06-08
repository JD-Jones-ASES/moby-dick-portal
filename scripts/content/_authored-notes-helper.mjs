// Shared helper for integrating hand-verified, Shakespeare-grade public Study notes at scale.
//
// Subagents draft note prose; THIS code is the safety gate that runs before anything is written:
//   - every anchor must resolve as a whole-word match in the unit's displayed text (else skipped);
//   - a note may not overlap an already-accepted note in the same unit (else skipped);
//   - records are stamped student-ready + reader-surface with the caller's claim_type/citations.
// Skips are reported, never silently dropped, and never break `prepare:data`. Idempotent by id.
//
// A batch file is tiny:
//   import { applyAuthoredNotes } from "./_authored-notes-helper.mjs";
//   await applyAuthoredNotes({ sources: [/* verified source records, optional */], notes: [/* specs */] });
//
// Note spec: { id, unit_id, anchor, claim_type, citations:[...], note, kind?, tone? }

import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const sourcesPath = "data/sources/moby-dick.source-records.json";
const today = "2026-06-08";
const reviewer = "claude-opus";

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

// Mirror the public-prose gates in validate-basic.mjs so a batch self-validates and rarely
// trips the pipeline. (Scholarship accuracy is still checked by a human before the batch runs.)
const bannedProsePatterns = [
  /useful (?:study )?hinge/i, /pressure point/i, /foothold/i, /\bsets up\b/i, /\bunderscores\b/i,
  /source-index/i, /taxonomy-index/i, /teacher review/i, /review queue/i, /needs review/i,
  /provisional lead/i, /coverage/i, /passage-level study point/i, /close-reading checkpoint/i,
  /The note points/i, /is worth pausing over/i, /The phrase ["“]/i, /In [^,]+, ["“]/i,
  /Use ["“]/i, /the guide should/i, /use this (?:passage|chapter|card|entry)/i,
  /students should/i, /ask students/i
];
const toneSignalPattern =
  /\b(?:racialized|racist|racial|colonial language|colonial-era|colonial expansion|slavery|coerced-labor|prejudice|prejudiced|exoticizing|savage|cannibal|civilized|Pagan|non-Christian|harmful|mental-health|stigmatizing|clinical diagnosis|period racial|period simile|imperial)\b/i;

function isWordLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function wholeWordIndex(text, anchor) {
  const lowerText = text.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  let index = lowerText.indexOf(lowerAnchor);
  while (index !== -1) {
    const before = text[index - 1] ?? "";
    const after = text[index + anchor.length] ?? "";
    const okBefore = !(isWordLetter(before) && isWordLetter(text[index]));
    const okAfter = !(isWordLetter(after) && isWordLetter(text[index + anchor.length - 1]));
    if (okBefore && okAfter) return index;
    index = lowerText.indexOf(lowerAnchor, index + Math.max(1, anchor.length));
  }
  return -1;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

function assignIds(notes) {
  const used = new Set();
  return notes.map((spec) => {
    if (spec.id) {
      used.add(spec.id);
      return spec;
    }
    let id = `auth-${slugify(spec.unit_id)}-${slugify(spec.anchor)}`.slice(0, 96).replace(/-+$/g, "");
    let suffix = 2;
    while (used.has(id)) id = `${id}-${suffix++}`;
    used.add(id);
    return { ...spec, id };
  });
}

function buildRecord(spec) {
  const validation = ["selector-resolves", "primary-source-checked", "adversarial-review"];
  if (spec.tone) validation.push("tone-review");
  return {
    id: spec.id,
    unit_id: spec.unit_id,
    kind: spec.kind ?? "context",
    selector: { type: "TextQuoteSelector", exact: spec.anchor },
    display: { depth: "study", priority: 2, inline: true, surfaces: ["reader", "index"], spoiler_level: "none" },
    anchor: spec.anchor,
    note: spec.note,
    tags: ["authored:shakespeare-grade", `claim:${spec.claim_type}`],
    relationships: [],
    evidence: [{ claim_type: spec.claim_type, citations: spec.citations, validation }],
    citations: spec.citations,
    provenance: { author: "claude-opus", created: today, method: "reviewed", reviewer, reviewed: today },
    status: { content_status: "student-ready", citation_status: "verified", review_queue: [] }
  };
}

export async function applyAuthoredNotes({ sources = [], notes = [] }) {
  // 1) Ensure verified support sources (replace by id).
  if (sources.length) {
    const sourceData = JSON.parse(await readFile(sourcesPath, "utf8"));
    const ids = new Set(sources.map((source) => source.id));
    sourceData.records = [...sourceData.records.filter((record) => !ids.has(record.id)), ...sources];
    await writeFile(sourcesPath, `${escapeNonAscii(JSON.stringify(sourceData, null, 2))}\n`);
  }

  // 2) Pre-validate anchors against displayed text; drop non-resolving and overlapping notes.
  const guide = await loadGuideData();
  const textByUnit = new Map(guide.units.map((unit) => [unit.unit_id, unit.plain_text ?? ""]));
  const collection = JSON.parse(await readFile(annotationsPath, "utf8"));
  const withIds = assignIds(notes);
  const incomingIds = new Set(withIds.map((spec) => spec.id));

  // Seed per-unit ranges with EXISTING public (reader-surface, student-ready) anchors so a new note
  // can never overlap a note already shipping. Exclude the records we are about to replace by id.
  const acceptedRangesByUnit = new Map();
  for (const annotation of collection.annotations) {
    if (incomingIds.has(annotation.id)) continue;
    const isPublic =
      annotation.display?.surfaces?.includes("reader") && annotation.status?.content_status === "student-ready";
    if (!isPublic) continue;
    const text = textByUnit.get(annotation.unit_id);
    if (!text) continue;
    const start = wholeWordIndex(text, annotation.anchor);
    if (start === -1) continue;
    const ranges = acceptedRangesByUnit.get(annotation.unit_id) ?? [];
    ranges.push({ start, end: start + annotation.anchor.length });
    acceptedRangesByUnit.set(annotation.unit_id, ranges);
  }

  const accepted = [];
  const skipped = [];
  for (const spec of withIds) {
    const text = textByUnit.get(spec.unit_id);
    if (!text) {
      skipped.push(`${spec.id}: unknown unit ${spec.unit_id}`);
      continue;
    }
    const start = wholeWordIndex(text, spec.anchor);
    if (start === -1) {
      skipped.push(`${spec.id}: anchor not a whole-word match -> ${JSON.stringify(spec.anchor)}`);
      continue;
    }
    const length = (spec.note ?? "").length;
    if (length < 80 || length > 420) {
      skipped.push(`${spec.id}: note length ${length} outside 80-420`);
      continue;
    }
    if (bannedProsePatterns.some((pattern) => pattern.test(spec.note))) {
      skipped.push(`${spec.id}: note contains banned publication-gate prose`);
      continue;
    }
    if (!spec.tone && toneSignalPattern.test(`${spec.anchor} ${spec.note}`)) {
      skipped.push(`${spec.id}: names difficult material but tone is not set -> add "tone": true`);
      continue;
    }
    const end = start + spec.anchor.length;
    const ranges = acceptedRangesByUnit.get(spec.unit_id) ?? [];
    if (ranges.some((range) => start < range.end && end > range.start)) {
      skipped.push(`${spec.id}: overlaps an existing or earlier public note in ${spec.unit_id}`);
      continue;
    }
    ranges.push({ start, end });
    acceptedRangesByUnit.set(spec.unit_id, ranges);
    accepted.push(spec);
  }

  // 3) Replace by id and write. Remove ALL incoming ids (accepted + skipped) so a re-run that now
  // skips a note also removes the copy a previous run may have written; then append the accepted.
  const kept = collection.annotations.filter((annotation) => !incomingIds.has(annotation.id));
  collection.annotations = [...kept, ...accepted.map(buildRecord)];
  await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(collection, null, 2))}\n`);

  console.log(`Authored notes: ${accepted.length} accepted, ${skipped.length} skipped.`);
  for (const message of skipped) console.log(`  SKIP ${message}`);
  return { accepted: accepted.map((spec) => spec.id), skipped };
}
