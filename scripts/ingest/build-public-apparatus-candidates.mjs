import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const glossaryPath = path.join(repoRoot, "data", "glossary", "moby-dick.glossary.json");
const referencePath = path.join(repoRoot, "data", "references", "moby-dick.reference-cards.json");
const manifestPath = path.join(repoRoot, "data", "chapters", "moby-dick.chapter-manifest.json");
const outDir = path.join(repoRoot, "data", "indexes");
const outPath = path.join(outDir, "public-apparatus-candidates.json");

const weakPatterns = [
  /use this (?:card|entry|term)/i,
  /students should/i,
  /ask students/i,
  /review queue/i,
  /needs review/i,
  /the guide should/i,
  /coverage/i,
  /source-index/i,
  /taxonomy-index/i,
  /this card frames/i,
  /useful classroom move/i,
  /one more route/i
];

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

async function writeJson(file, data) {
  await writeFile(file, `${escapeNonAscii(JSON.stringify(data, null, 2))}\n`);
}

function weakHits(text) {
  return weakPatterns
    .filter((pattern) => pattern.test(text ?? ""))
    .map((pattern) => String(pattern).replace(/^\/|\/i$/g, ""));
}

function isPublicGlossary(entry) {
  return entry.status?.definition_status === "student-ready" && entry.status?.citation_status === "verified";
}

function isPublicReference(card) {
  return card.status?.content_status === "student-ready" && card.status?.citation_status === "verified";
}

function scoreGlossary(entry) {
  const hits = weakHits(entry.definition);
  let score = 0;
  const reasons = [];

  if (isPublicGlossary(entry)) {
    score += 20;
    reasons.push("already-public-ready");
  }
  if (["whaling", "nautical", "shipboard", "biblical", "classical", "historical"].includes(entry.category)) {
    score += 5;
    reasons.push("reader-obstacle-category");
  }
  if ((entry.targets ?? []).length >= 2) {
    score += 3;
    reasons.push("multi-unit-term");
  }
  if ((entry.definition ?? "").length >= 35 && (entry.definition ?? "").length <= 220) score += 3;
  if ((entry.citations ?? []).includes("standard-ebooks-moby-dick")) score += 2;
  if ((entry.citations ?? []).length > 1) {
    score += 2;
    reasons.push("support-source-present");
  }
  if (entry.status?.definition_status === "needs-review") score -= 6;
  if (entry.status?.citation_status !== "verified") score -= 1;
  if (hits.length > 0) {
    score -= 12 + hits.length;
    reasons.push("scaffold-prose");
  }

  return { score, reasons, weak_hits: hits };
}

function scoreReference(card) {
  const text = `${card.summary ?? ""} ${card.student_note ?? ""}`;
  const hits = weakHits(text);
  let score = 0;
  const reasons = [];

  if (isPublicReference(card)) {
    score += 20;
    reasons.push("already-public-ready");
  }
  if (["whaling", "nautical", "biblical", "classical", "historical", "literary"].includes(card.kind)) {
    score += 5;
    reasons.push("reader-obstacle-kind");
  }
  if ((card.targets ?? []).length >= 2) {
    score += 3;
    reasons.push("multi-unit-card");
  }
  if ((card.summary ?? "").length >= 60 && (card.summary ?? "").length <= 280) score += 2;
  if ((card.student_note ?? "").length >= 70 && (card.student_note ?? "").length <= 360) score += 3;
  if ((card.citations ?? []).includes("standard-ebooks-moby-dick")) score += 2;
  if ((card.citations ?? []).length > 1) {
    score += 2;
    reasons.push("support-source-present");
  }
  if (card.status?.content_status === "needs-review") score -= 6;
  if (card.status?.citation_status !== "verified") score -= 1;
  if (hits.length > 0) {
    score -= 12 + hits.length;
    reasons.push("scaffold-prose");
  }

  return { score, reasons, weak_hits: hits };
}

function glossaryState(entry, score, hits) {
  if (isPublicGlossary(entry)) return "public-ready";
  if (hits.length > 0) return "likely-retire-or-internal-only";
  if (entry.status?.definition_status === "needs-review") return "review-needed";
  if (score >= 9) return "review-for-promotion";
  if (score >= 5) return "possible-rewrite";
  return "low-value-draft";
}

function referenceState(card, score, hits) {
  if (isPublicReference(card)) return "public-ready";
  if (hits.length > 0) return "likely-retire-or-internal-only";
  if (card.status?.content_status === "needs-review") return "review-needed";
  if (score >= 9) return "review-for-promotion";
  if (score >= 5) return "possible-rewrite";
  return "low-value-draft";
}

function recoveryAction(candidates) {
  if (candidates.some((candidate) => candidate.state === "review-for-promotion")) return "review-existing-candidate";
  if (candidates.some((candidate) => candidate.state === "possible-rewrite")) return "rewrite-existing-candidate";
  return "write-fresh-item";
}

function buildUnitRecoveryQueue(units, records, publicTargetUnits, scope) {
  return units
    .filter((unit) => unit.section_type !== "frontmatter")
    .filter((unit) => !publicTargetUnits.has(unit.unit_id))
    .map((unit) => {
      const candidates = records
        .filter((record) => (record.targets ?? []).includes(unit.unit_id))
        .filter((record) => ["review-for-promotion", "possible-rewrite", "review-needed"].includes(record.state))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      const action = recoveryAction(candidates);
      const priorityScore = 40 + Math.min(candidates.filter((candidate) => candidate.state === "review-for-promotion").length * 5, 20);
      return {
        unit_id: unit.unit_id,
        sequence: unit.sequence,
        title: unit.title,
        scope,
        priority_score: priorityScore,
        recovery_action: action,
        candidate_count: candidates.length,
        candidates: candidates.slice(0, 5).map((candidate) => ({
          id: candidate.id,
          state: candidate.state,
          score: candidate.score,
          label: candidate.label,
          text: candidate.text,
          citations: candidate.citations,
          reasons: candidate.reasons,
          weak_hits: candidate.weak_hits
        }))
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score || a.sequence - b.sequence);
}

const glossary = JSON.parse(await readFile(glossaryPath, "utf8")).entries;
const references = JSON.parse(await readFile(referencePath, "utf8")).cards;
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const nonFrontmatterUnits = manifest.units.filter((unit) => unit.section_type !== "frontmatter");

const glossaryCandidates = glossary.map((entry) => {
  const { score, reasons, weak_hits } = scoreGlossary(entry);
  return {
    id: entry.id,
    type: "glossary",
    label: entry.term,
    category: entry.category,
    score,
    state: glossaryState(entry, score, weak_hits),
    text: entry.definition,
    targets: entry.targets ?? [],
    citations: entry.citations ?? [],
    status: entry.status,
    reasons,
    weak_hits
  };
});

const referenceCandidates = references.map((card) => {
  const { score, reasons, weak_hits } = scoreReference(card);
  return {
    id: card.id,
    type: "reference",
    label: card.title,
    kind: card.kind,
    score,
    state: referenceState(card, score, weak_hits),
    text: `${card.summary} ${card.student_note}`,
    targets: card.targets ?? [],
    citations: card.citations ?? [],
    status: card.status,
    reasons,
    weak_hits
  };
});

glossaryCandidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
referenceCandidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

const publicGlossary = glossaryCandidates.filter((candidate) => candidate.state === "public-ready");
const publicReferences = referenceCandidates.filter((candidate) => candidate.state === "public-ready");
const publicGlossaryTargetUnits = new Set(publicGlossary.flatMap((candidate) => candidate.targets).filter((target) => nonFrontmatterUnits.some((unit) => unit.unit_id === target)));
const publicReferenceTargetUnits = new Set(publicReferences.flatMap((candidate) => candidate.targets).filter((target) => nonFrontmatterUnits.some((unit) => unit.unit_id === target)));
const glossaryRecoveryQueue = buildUnitRecoveryQueue(nonFrontmatterUnits, glossaryCandidates, publicGlossaryTargetUnits, "glossary");
const referenceRecoveryQueue = buildUnitRecoveryQueue(nonFrontmatterUnits, referenceCandidates, publicReferenceTargetUnits, "reference");

function countByState(candidates, state) {
  return candidates.filter((candidate) => candidate.state === state).length;
}

await mkdir(outDir, { recursive: true });
await writeJson(outPath, {
  generated_from: [
    "data/glossary/moby-dick.glossary.json",
    "data/references/moby-dick.reference-cards.json",
    "data/chapters/moby-dick.chapter-manifest.json"
  ],
  rubric: {
    public_ready: "Already promoted and passing the public reader gate.",
    review_for_promotion: "Likely useful to readers, but still requires source/tone review and often a prose rewrite.",
    possible_rewrite: "May contain a useful term/card, but should be rewritten before promotion.",
    likely_retire_or_internal_only: "Generated or scaffold prose that should not become public without a fresh rewrite."
  },
  counts: {
    glossary_entries: glossaryCandidates.length,
    public_glossary_entries: publicGlossary.length,
    glossary_review_for_promotion: countByState(glossaryCandidates, "review-for-promotion"),
    glossary_possible_rewrite: countByState(glossaryCandidates, "possible-rewrite"),
    glossary_review_needed: countByState(glossaryCandidates, "review-needed"),
    glossary_likely_retire_or_internal_only: countByState(glossaryCandidates, "likely-retire-or-internal-only"),
    glossary_units_without_public_entry: glossaryRecoveryQueue.length,
    reference_cards: referenceCandidates.length,
    public_reference_cards: publicReferences.length,
    reference_review_for_promotion: countByState(referenceCandidates, "review-for-promotion"),
    reference_possible_rewrite: countByState(referenceCandidates, "possible-rewrite"),
    reference_review_needed: countByState(referenceCandidates, "review-needed"),
    reference_likely_retire_or_internal_only: countByState(referenceCandidates, "likely-retire-or-internal-only"),
    reference_units_without_public_card: referenceRecoveryQueue.length
  },
  next_glossary_review_queue: glossaryCandidates.filter((candidate) => candidate.state === "review-for-promotion").slice(0, 50),
  next_reference_review_queue: referenceCandidates.filter((candidate) => candidate.state === "review-for-promotion").slice(0, 50),
  glossary_recovery_queue: glossaryRecoveryQueue,
  reference_recovery_queue: referenceRecoveryQueue,
  glossary_candidates: glossaryCandidates,
  reference_candidates: referenceCandidates
});

console.log(
  `Built public apparatus candidate index: ${publicGlossary.length} public glossary, ${publicReferences.length} public references, ${glossaryRecoveryQueue.length} glossary unit gaps, ${referenceRecoveryQueue.length} reference unit gaps.`
);
