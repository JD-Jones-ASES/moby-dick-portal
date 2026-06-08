import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");
const manifestPath = path.join(repoRoot, "data", "chapters", "moby-dick.chapter-manifest.json");
const outDir = path.join(repoRoot, "data", "indexes");
const outPath = path.join(outDir, "public-annotation-candidates.json");

const pilotUnits = new Set([
  "chapter-001-loomings",
  "chapter-014-nantucket",
  "chapter-036-the-quarterdeck"
]);

const strongKindScore = {
  gloss: 5,
  context: 5,
  form: 4,
  theme: 3,
  map: 2,
  "difficult-material": 1,
  "teacher-note": -20
};

const scaffoldIdPatterns = [
  /^source-index-/,
  /^entity-index-/,
  /^trail-index-/,
  /^entity-registry-/,
  /^teacher-/,
  /^teacher-discussion-/,
  /^teacher-review-/,
  /^floor-pass-/,
  /^ten-note-floor-/,
  /^twelve-note-floor-/,
  /^fourteen-note-floor-/,
  /^whole-book-density-/,
  /^classroom-second-anchor-/,
  /^apparatus-(?:floor|deep|wide)-/,
  /^short-unit-/
];

const weakNotePatterns = [
  /useful (?:study )?hinge/i,
  /pressure point/i,
  /foothold/i,
  /source-index/i,
  /taxonomy-index/i,
  /teacher review/i,
  /review queue/i,
  /provisional lead/i,
  /coverage/i,
  /passage-level study point/i,
  /close-reading checkpoint/i,
  /The note points/i,
  /is worth pausing over/i,
  /The phrase ["“]/i,
  /In [^,]+, ["“]/i,
  /Use ["“]/i,
  /Use this (?:passage|chapter|card|entry)/i,
  /Ask students/i,
  /keeps .* visible inside/i,
  /gives .* a .* handle/i,
  /another place to test/i,
  /chapter's larger pressure/i,
  /source-text entry point/i,
  /Explore and Teacher views/i,
  /frames the text as a standard edition/i
];

const strongNoteSignals = [
  /\bmeans\b/i,
  /\brefers to\b/i,
  /\ballusion\b/i,
  /\bbiblical\b/i,
  /\bclassical\b/i,
  /\bwhaling\b/i,
  /\bship\b/i,
  /\bdeck\b/i,
  /\bstage\b/i,
  /\britual\b/i,
  /\bcontrast\b/i,
  /\bturns?\b/i,
  /\bshows?\b/i,
  /\bprepares?\b/i
];

const sourceSupportSignalPatterns = [
  {
    label: "biblical-place-or-figure",
    pattern:
      /\b(?:biblical|Bible|Jonah|Herod|Innocents|Belshazzar|Leviathan|Gabriel|Elijah|Shadrach|Meshach|Abednego|Gomorrah|Asphaltites|Dead Sea|Potters[’'] Fields?)\b/i
  },
  {
    label: "literary-or-mythic-allusion",
    pattern:
      /\b(?:Prometheus|Hercules|Perseus|St\. George|Vishnu|Queen Mab|Shakespeare|Damocles|Aladdin|Greek fire|Mother Carey|classical|mythic|mythological|fairy-tale|allusion)\b/i
  },
  {
    label: "historical-method-or-authority",
    pattern:
      /\b(?:Peter the Great|Czar Peter|Peter I|phrenology|phrenological|physiognomy|physiognomic|Gall|Spurzheim|Lavater|Pliny|Basilosaurus|Pompey[’']s Pillar|Denderah|Heidelburgh Tun|Heidelberg Tun|Brandreth[’']s pills|patent-medicine|whitehorse)\b/i
  }
];

const toneReviewSignalPattern =
  /\b(?:racialized|racist|racial|colonial language|colonial-era|colonial expansion|slavery|coerced-labor|prejudice|prejudiced|exoticizing|savage|cannibal|civilized|Pagan|non-Christian|harmful|mental-health|stigmatizing|clinical diagnosis|period racial|period simile|imperial|empire)\b/i;

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

function hasScaffoldId(annotation) {
  return scaffoldIdPatterns.some((pattern) => pattern.test(annotation.id));
}

function weakPatternHits(note) {
  return weakNotePatterns
    .filter((pattern) => pattern.test(note ?? ""))
    .map((pattern) => String(pattern).replace(/^\/|\/i$/g, ""));
}

function scoreAnnotation(annotation, unit) {
  const note = annotation.note ?? "";
  const exact = annotation.selector?.exact ?? annotation.anchor ?? "";
  const weakHits = weakPatternHits(note);
  const validations = (annotation.evidence ?? []).flatMap((evidence) => evidence.validation ?? []);
  const evidenceTypes = new Set((annotation.evidence ?? []).map((evidence) => evidence.claim_type));
  const hasSupportBeyondSourceText = (annotation.citations ?? []).some((citation) => citation !== "standard-ebooks-moby-dick");
  const sourceSupportNeeded = sourceSupportSignalHits(annotation).filter(() => !hasSupportBeyondSourceText);
  const toneReviewText = `${annotation.anchor ?? ""} ${note}`;
  const toneReviewNeeded = toneReviewSignalPattern.test(toneReviewText);
  let score = 0;
  const reasons = [];

  score += strongKindScore[annotation.kind] ?? 0;
  if (["gloss", "context", "form"].includes(annotation.kind)) reasons.push("reader-obstacle-kind");
  if (annotation.status.content_status === "student-ready") {
    score += 20;
    reasons.push("already-public-ready");
  }
  if (annotation.status.content_status === "draft") score += 2;
  if (annotation.status.content_status === "needs-review") score -= 8;
  if (annotation.status.citation_status === "verified") score += 3;
  if (annotation.status.review_queue?.includes("citation")) score -= 1;
  if (annotation.status.review_queue?.includes("difficult-material")) score -= 4;
  if (validations.includes("primary-source-checked")) score += 2;
  if (hasSupportBeyondSourceText) {
    score += 3;
    reasons.push("support-source-present");
  }
  if (sourceSupportNeeded.length > 0) {
    score -= 4;
    reasons.push("support-source-needed");
  }
  if (toneReviewNeeded) {
    score -= 6;
    reasons.push("tone-review-needed");
  }
  if ([...evidenceTypes].some((type) => type !== "source-text-observation" && type !== "interpretive")) {
    score += 3;
    reasons.push("contextual-evidence-type");
  }
  if (exact.length >= 18 && exact.length <= 180) {
    score += 2;
    reasons.push("usable-anchor-length");
  }
  if (note.length >= 90 && note.length <= 360) score += 2;
  if (strongNoteSignals.some((pattern) => pattern.test(note))) score += 2;
  if (unit?.paths?.classroom_standard === "required") {
    score += 2;
    reasons.push("classroom-required-unit");
  }
  if (pilotUnits.has(annotation.unit_id)) score += 2;
  if (hasScaffoldId(annotation)) {
    score -= 12;
    reasons.push("scaffold-id");
  }
  if (weakHits.length > 0) {
    score -= 12 + weakHits.length;
    reasons.push("scaffold-prose");
  }
  if (annotation.kind === "teacher-note") reasons.push("teacher-only-kind");
  if ((annotation.display?.surfaces ?? []).includes("reader")) reasons.push("reader-surface");

  return {
    score,
    reasons,
    weak_hits: weakHits,
    source_support_needed: sourceSupportNeeded,
    tone_review_needed: toneReviewNeeded
  };
}

function sourceSupportSignalHits(annotation) {
  const text = `${annotation.anchor ?? ""} ${annotation.note ?? ""}`;
  return sourceSupportSignalPatterns
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.label);
}

function candidateState(annotation, score, weakHits, sourceSupportNeeded, toneReviewNeeded) {
  if (annotation.status.content_status === "student-ready") return "public-ready";
  if (annotation.kind === "teacher-note") return "teacher-only-internal";
  if ((annotation.tags ?? []).includes("review:retire-candidate") || (annotation.tags ?? []).includes("review:internal-only")) return "retired-internal";
  if (hasScaffoldId(annotation) || weakHits.length > 0 || annotation.kind === "teacher-note") return "likely-retire-or-internal-only";
  if (toneReviewNeeded) return "tone-and-source-review";
  if (sourceSupportNeeded.length > 0 || annotation.status.review_queue?.includes("citation")) return "source-support-review";
  if (annotation.kind === "difficult-material") return "tone-and-source-review";
  if (score >= 9) return "review-for-promotion";
  if (score >= 5) return "possible-rewrite";
  return "low-value-draft";
}

function normalizedAnchor(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function anchorsOverlap(a, b) {
  const left = normalizedAnchor(a);
  const right = normalizedAnchor(b);
  if (left.length < 16 || right.length < 16) return false;
  return left.includes(right) || right.includes(left);
}

const annotations = JSON.parse(await readFile(annotationsPath, "utf8")).annotations;
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const unitsById = new Map(manifest.units.map((unit) => [unit.unit_id, unit]));

const candidateRecords = annotations.map((annotation) => {
  const unit = unitsById.get(annotation.unit_id);
  const {
    score,
    reasons,
    weak_hits: weakHits,
    source_support_needed: sourceSupportNeeded,
    tone_review_needed: toneReviewNeeded
  } = scoreAnnotation(annotation, unit);
  return {
    id: annotation.id,
    unit_id: annotation.unit_id,
    unit_title: unit?.title ?? annotation.unit_id,
    sequence: unit?.sequence ?? 9999,
    kind: annotation.kind,
    score,
    state: candidateState(annotation, score, weakHits, sourceSupportNeeded, toneReviewNeeded),
    anchor: annotation.anchor,
    note: annotation.note,
    status: annotation.status,
    citations: annotation.citations ?? [],
    evidence_types: [...new Set((annotation.evidence ?? []).map((evidence) => evidence.claim_type))].sort(),
    reasons,
    weak_hits: weakHits,
    source_support_needed: sourceSupportNeeded,
    tone_review_needed: toneReviewNeeded
  };
});

const publicReadyAnchorsByUnit = new Map();
for (const candidate of candidateRecords.filter((item) => item.state === "public-ready")) {
  if (!publicReadyAnchorsByUnit.has(candidate.unit_id)) publicReadyAnchorsByUnit.set(candidate.unit_id, []);
  publicReadyAnchorsByUnit.get(candidate.unit_id).push(candidate.anchor);
}

for (const candidate of candidateRecords) {
  if (candidate.state === "public-ready") continue;
  if (!["review-for-promotion", "possible-rewrite", "low-value-draft"].includes(candidate.state)) continue;
  const publicAnchors = publicReadyAnchorsByUnit.get(candidate.unit_id) ?? [];
  if (!publicAnchors.some((publicAnchor) => anchorsOverlap(candidate.anchor, publicAnchor))) continue;

  candidate.score -= 12;
  candidate.reasons.push("overlaps-public-anchor");
  candidate.state = candidate.score >= 5 ? "possible-rewrite" : "likely-retire-or-internal-only";
}

candidateRecords.sort((a, b) => b.score - a.score || a.sequence - b.sequence || a.id.localeCompare(b.id));

const publicReady = candidateRecords.filter((candidate) => candidate.state === "public-ready");
const promotionCandidates = candidateRecords.filter((candidate) => candidate.state === "review-for-promotion");
const sourceSupportCandidates = candidateRecords.filter((candidate) => candidate.state === "source-support-review");
const toneAndSourceCandidates = candidateRecords.filter((candidate) => candidate.state === "tone-and-source-review");
const rewriteCandidates = candidateRecords.filter((candidate) => candidate.state === "possible-rewrite");
const retireCandidates = candidateRecords.filter((candidate) => candidate.state === "likely-retire-or-internal-only");
const retiredInternal = candidateRecords.filter((candidate) => candidate.state === "retired-internal");
const teacherOnlyInternal = candidateRecords.filter((candidate) => candidate.state === "teacher-only-internal");

const byUnit = manifest.units.map((unit) => {
  const unitCandidates = candidateRecords.filter((candidate) => candidate.unit_id === unit.unit_id);
  return {
    unit_id: unit.unit_id,
    sequence: unit.sequence,
    title: unit.title,
    section_type: unit.section_type,
    classroom_level: unit.paths.classroom_standard,
    public_ready_count: unitCandidates.filter((candidate) => candidate.state === "public-ready").length,
    review_for_promotion_count: unitCandidates.filter((candidate) => candidate.state === "review-for-promotion").length,
    source_support_review_count: unitCandidates.filter((candidate) => candidate.state === "source-support-review").length,
    possible_rewrite_count: unitCandidates.filter((candidate) => candidate.state === "possible-rewrite").length,
    tone_and_source_review_count: unitCandidates.filter((candidate) => candidate.state === "tone-and-source-review").length,
    low_value_draft_count: unitCandidates.filter((candidate) => candidate.state === "low-value-draft").length,
    likely_retire_or_internal_only_count: unitCandidates.filter((candidate) => candidate.state === "likely-retire-or-internal-only").length,
    top_candidates: unitCandidates
      .filter((candidate) => ["public-ready", "review-for-promotion", "source-support-review", "possible-rewrite", "tone-and-source-review"].includes(candidate.state))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, 5)
      .map((candidate) => candidate.id)
  };
});

const classroomUnitsWithoutPublicReady = byUnit
  .filter((unit) => unit.section_type !== "frontmatter")
  .filter((unit) => unit.classroom_level === "required" || unit.classroom_level === "recommended")
  .filter((unit) => unit.public_ready_count === 0)
  .map((unit) => unit.unit_id);

const wholeBookUnitsWithoutPublicReady = byUnit
  .filter((unit) => unit.section_type !== "frontmatter")
  .filter((unit) => unit.public_ready_count === 0)
  .map((unit) => unit.unit_id);

function reviewActionFor(unitCandidates) {
  if (unitCandidates.some((candidate) => candidate.state === "review-for-promotion")) return "review-existing-candidate";
  if (unitCandidates.some((candidate) => candidate.state === "source-support-review")) return "review-source-support";
  if (unitCandidates.some((candidate) => candidate.state === "tone-and-source-review")) return "review-difficult-material";
  if (unitCandidates.some((candidate) => candidate.state === "possible-rewrite")) return "rewrite-existing-anchor";
  return "write-fresh-note";
}

function candidateSummary(candidate) {
  return {
    id: candidate.id,
    state: candidate.state,
    kind: candidate.kind,
    score: candidate.score,
    anchor: candidate.anchor,
    note: candidate.note,
    status: candidate.status,
    citations: candidate.citations,
    reasons: candidate.reasons,
    weak_hits: candidate.weak_hits
  };
}

function recoveryPriorityBase(unit, scope) {
  if (scope === "classroom") return unit.classroom_level === "required" ? 100 : 70;
  if (unit.classroom_level === "required") return 100;
  if (unit.classroom_level === "recommended") return 70;
  return 40;
}

function buildRecoveryQueue(unitIds, scope) {
  return byUnit
    .filter((unit) => unitIds.includes(unit.unit_id))
    .map((unit) => {
    const unitCandidates = candidateRecords
      .filter((candidate) => candidate.unit_id === unit.unit_id)
      .filter((candidate) => ["review-for-promotion", "source-support-review", "tone-and-source-review", "possible-rewrite"].includes(candidate.state))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const action = reviewActionFor(unitCandidates);
    const priorityScore =
      recoveryPriorityBase(unit, scope) +
      Math.min(unit.review_for_promotion_count * 5, 20) +
      Math.min(unit.source_support_review_count * 4, 16) +
      Math.min(unit.tone_and_source_review_count * 3, 12) +
      Math.min(unit.possible_rewrite_count * 2, 10);

    return {
      unit_id: unit.unit_id,
      sequence: unit.sequence,
      title: unit.title,
      section_type: unit.section_type,
      classroom_level: unit.classroom_level,
      priority_score: priorityScore,
      recovery_action: action,
      public_ready_count: unit.public_ready_count,
      review_for_promotion_count: unit.review_for_promotion_count,
      source_support_review_count: unit.source_support_review_count,
      tone_and_source_review_count: unit.tone_and_source_review_count,
      possible_rewrite_count: unit.possible_rewrite_count,
      candidate_count: unitCandidates.length,
      candidates: unitCandidates.slice(0, 5).map(candidateSummary)
    };
  })
  .sort((a, b) => b.priority_score - a.priority_score || a.sequence - b.sequence);
}

function recoveryUnitsWithAction(queue, actions) {
  return queue.filter((unit) => actions.includes(unit.recovery_action));
}

const classroomRecoveryQueue = buildRecoveryQueue(classroomUnitsWithoutPublicReady, "classroom");
const wholeBookRecoveryQueue = buildRecoveryQueue(wholeBookUnitsWithoutPublicReady, "whole-book");

const recoveryReviewActions = ["review-existing-candidate", "review-source-support", "review-difficult-material"];
const recoveryUnitsWithReviewCandidates = recoveryUnitsWithAction(classroomRecoveryQueue, recoveryReviewActions);
const recoveryUnitsWithRewriteCandidates = recoveryUnitsWithAction(classroomRecoveryQueue, ["rewrite-existing-anchor"]);
const recoveryUnitsNeedingFreshAnnotation = recoveryUnitsWithAction(classroomRecoveryQueue, ["write-fresh-note"]);
const wholeBookRecoveryUnitsWithReviewCandidates = recoveryUnitsWithAction(wholeBookRecoveryQueue, recoveryReviewActions);
const wholeBookRecoveryUnitsWithRewriteCandidates = recoveryUnitsWithAction(wholeBookRecoveryQueue, ["rewrite-existing-anchor"]);
const wholeBookRecoveryUnitsNeedingFreshAnnotation = recoveryUnitsWithAction(wholeBookRecoveryQueue, ["write-fresh-note"]);

await mkdir(outDir, { recursive: true });
await writeJson(outPath, {
  generated_from: [
    "data/annotations/moby-dick.annotations.json",
    "data/chapters/moby-dick.chapter-manifest.json"
  ],
  rubric: {
    public_ready:
      "Already promoted and still passing the public annotation gate.",
    review_for_promotion:
      "Likely useful to readers, but still requires source/tone/adversarial review and usually a rewrite before promotion.",
    source_support_review:
      "Potentially useful, but the note contains a named allusion, place, historical method, or external-context claim that needs a support citation before public promotion.",
    possible_rewrite:
      "May contain a useful anchor or idea, but the prose or metadata is too weak for direct promotion.",
    likely_retire_or_internal_only:
      "Scaffold, teacher-only, index-only, or generated floor material that should not become reader-facing without a fresh rewrite."
  },
  counts: {
    annotations: candidateRecords.length,
    public_ready: publicReady.length,
    review_for_promotion: promotionCandidates.length,
    source_support_review: sourceSupportCandidates.length,
    tone_and_source_review: toneAndSourceCandidates.length,
    possible_rewrite: rewriteCandidates.length,
    retired_internal: retiredInternal.length,
    teacher_only_internal: teacherOnlyInternal.length,
    likely_retire_or_internal_only: retireCandidates.length,
    classroom_units_without_public_ready: classroomUnitsWithoutPublicReady.length,
    classroom_recovery_units: classroomRecoveryQueue.length,
    classroom_recovery_units_with_review_candidates: recoveryUnitsWithReviewCandidates.length,
    classroom_recovery_units_with_rewrite_candidates: recoveryUnitsWithRewriteCandidates.length,
    classroom_recovery_units_needing_fresh_annotation: recoveryUnitsNeedingFreshAnnotation.length,
    whole_book_units_without_public_ready: wholeBookUnitsWithoutPublicReady.length,
    whole_book_recovery_units: wholeBookRecoveryQueue.length,
    whole_book_recovery_units_with_review_candidates: wholeBookRecoveryUnitsWithReviewCandidates.length,
    whole_book_recovery_units_with_rewrite_candidates: wholeBookRecoveryUnitsWithRewriteCandidates.length,
    whole_book_recovery_units_needing_fresh_annotation: wholeBookRecoveryUnitsNeedingFreshAnnotation.length
  },
  next_review_queue: promotionCandidates.slice(0, 50),
  next_source_support_queue: sourceSupportCandidates.slice(0, 50),
  next_tone_and_source_queue: toneAndSourceCandidates.slice(0, 50),
  next_rewrite_queue: rewriteCandidates.slice(0, 50),
  retired_internal_sample: retiredInternal.slice(0, 50),
  teacher_only_internal_sample: teacherOnlyInternal.slice(0, 50),
  likely_retire_or_internal_only_sample: retireCandidates.slice(0, 50),
  classroom_units_without_public_ready: classroomUnitsWithoutPublicReady,
  classroom_recovery_queue: classroomRecoveryQueue,
  whole_book_units_without_public_ready: wholeBookUnitsWithoutPublicReady,
  whole_book_recovery_queue: wholeBookRecoveryQueue,
  units: byUnit,
  candidates: candidateRecords
});

console.log(
  `Built public annotation candidate index: ${publicReady.length} ready, ${promotionCandidates.length} promotion candidates, ${sourceSupportCandidates.length} source-support candidates, ${toneAndSourceCandidates.length} tone/source candidates, ${rewriteCandidates.length} rewrite candidates, ${retiredInternal.length} retired internal, ${teacherOnlyInternal.length} teacher-only internal, ${retireCandidates.length} likely internal/retire.`
);
