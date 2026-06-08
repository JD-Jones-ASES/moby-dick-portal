import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const annotationsPath = "data/annotations/moby-dick.annotations.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();

annotations.annotations = annotations.annotations.filter(
  (annotation) => !annotation.tags?.includes("provenance:thin-unit-floor-pass")
);

const guideUnitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const annotationsByUnit = new Map();

for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

const stopWords = new Set([
  "about",
  "after",
  "again",
  "against",
  "among",
  "before",
  "being",
  "between",
  "could",
  "every",
  "first",
  "from",
  "have",
  "into",
  "like",
  "little",
  "more",
  "most",
  "much",
  "only",
  "other",
  "over",
  "same",
  "shall",
  "some",
  "such",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "though",
  "through",
  "upon",
  "very",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your"
]);

const signalWords = [
  "Ahab",
  "Starbuck",
  "Ishmael",
  "Queequeg",
  "whale",
  "ship",
  "sea",
  "death",
  "life",
  "body",
  "hand",
  "labor",
  "law",
  "God",
  "Jonah",
  "white",
  "fire",
  "storm",
  "compass",
  "coffin",
  "line",
  "gold",
  "blood",
  "soul",
  "mad",
  "strange",
  "wild",
  "world",
  "truth",
  "sign",
  "mark"
];

function slugPart(unitId) {
  return unitId.replace(/^(chapter-\d{3}-|epilogue-)/, "");
}

function getSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]/g) ?? [];
  return matches.map((sentence) => sentence.replace(/\s+/g, " ").trim()).filter((sentence) => sentence.length >= 70);
}

function tokensWithPositions(sentence) {
  const tokens = [];
  const re = /[A-Za-z][A-Za-z'’⁠-]*/g;
  let match;
  while ((match = re.exec(sentence)) !== null) {
    tokens.push({
      text: match[0],
      lower: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return tokens;
}

function scorePhrase(tokens) {
  let score = 0;
  for (const token of tokens) {
    if (!stopWords.has(token.lower)) score += 2;
    if (signalWords.some((word) => token.text.toLowerCase() === word.toLowerCase())) score += 3;
    if (token.text.length >= 7) score += 1;
    if (/^[A-Z]/.test(token.text)) score += 1;
  }
  return score;
}

function chooseExact(text, existingAnchors) {
  const sentences = getSentences(text)
    .filter((sentence) => !/CHAPTER|ETYMOLOGY|EXTRACTS/.test(sentence))
    .slice(0, 80);
  let best = null;

  for (const sentence of sentences) {
    const tokens = tokensWithPositions(sentence);
    if (tokens.length < 7) continue;
    for (let size = 4; size <= 7; size += 1) {
      for (let i = 0; i <= tokens.length - size; i += 1) {
        const window = tokens.slice(i, i + size);
        const first = window[0].lower;
        const last = window.at(-1).lower;
        if (stopWords.has(first) || stopWords.has(last)) continue;
        const exact = sentence.slice(window[0].start, window.at(-1).end);
        if (exact.length < 18 || exact.length > 70) continue;
        if (!/^[A-Za-z0-9][A-Za-z0-9 '\-]+[A-Za-z0-9]$/.test(exact)) continue;
        if (existingAnchors.some((anchor) => anchor.toLowerCase() === exact.toLowerCase())) continue;
        if ((text.toLowerCase().match(new RegExp(escapeRegExp(exact.toLowerCase()), "g")) ?? []).length !== 1) continue;
        const score = scorePhrase(window) + (size === 5 ? 2 : 0);
        if (!best || score > best.score) best = { exact, score };
      }
    }
  }

  return best?.exact ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classify(unit, text) {
  const lowerTitle = unit.title.toLowerCase();
  const lower = text.toLowerCase();
  if (unit.functions.includes("theatrical") || lowerTitle.includes("midnight") || lowerTitle.includes("quarter-deck")) {
    return {
      kind: "form",
      trail: "voice-and-performance",
      tags: ["kind:form", "layer:form", "form:performance"],
      claim: "interpretive",
      note: "The wording stages speech and gesture as part of the chapter's meaning, so form is carrying pressure alongside plot."
    };
  }
  if (unit.functions.includes("cetology") || /whale|sperm|head|tail|spout|fins?|schools?/.test(lowerTitle)) {
    return {
      kind: "context",
      trail: "cetology-classification",
      tags: ["kind:context", "layer:context", "topic:cetology"],
      claim: "nautical-whaling",
      note: "The selected detail turns whale knowledge into something students can test: observation, classification, and uncertainty all sit together."
    };
  }
  if (unit.functions.includes("whaling-labor") || /labor|deck|line|lowering|try|cutting|carpenter|blacksmith|forge|needle|quadrant/.test(lower)) {
    return {
      kind: "context",
      trail: "whaling-labor",
      tags: ["kind:context", "layer:context", "topic:labor"],
      claim: "nautical-whaling",
      note: "The phrase keeps the ship's work concrete, reminding students that Melville's big ideas are tied to bodies, tools, and risk."
    };
  }
  if (unit.functions.includes("biblical-allusion") || /jonah|god|prophet|sermon|leviathan|job|rachel/.test(lower)) {
    return {
      kind: "context",
      trail: "scripture-and-sermons",
      tags: ["kind:context", "layer:context", "allusion:biblical"],
      claim: "biblical-context",
      note: "Biblical language raises the stakes of the scene by making ordinary decisions sound like judgment, calling, or warning."
    };
  }
  if (unit.functions.includes("legal-political") || /law|king|queen|property|right|wrong|owner|fast-fish|loose-fish/.test(lower)) {
    return {
      kind: "theme",
      trail: "law-property-politics",
      tags: ["kind:theme", "layer:theme", "theme:law"],
      claim: "interpretive",
      note: "The language of rule and possession shows how the novel turns whaling practice into an argument about power."
    };
  }
  if (unit.functions.includes("prophecy") || /prophecy|prophet|fate|sign|omen|dream|warning|foretell/.test(lower)) {
    return {
      kind: "theme",
      trail: "fate-and-agency",
      tags: ["kind:theme", "layer:theme", "theme:fate"],
      claim: "interpretive",
      note: "This moment lets students ask whether the voyage is being chosen, predicted, or trapped by habits already in motion."
    };
  }
  if (/friend|alone|orphan|rescue|care|heart|love|poor/.test(lower)) {
    return {
      kind: "theme",
      trail: "friendship-and-isolation",
      tags: ["kind:theme", "layer:theme", "theme:care"],
      claim: "interpretive",
      note: "The phrase makes care and isolation visible at once, which matters because the voyage repeatedly tests who will answer another person's need."
    };
  }
  return {
    kind: "theme",
    trail: "evidence-and-belief",
    tags: ["kind:theme", "layer:theme", "theme:evidence"],
    claim: "interpretive",
    note: "The wording asks readers to notice how Ishmael builds belief from selected details rather than simply moving the plot forward."
  };
}

function firstSentence(value, fallback) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const match = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : clean;
}

function noteFor(unit, exact, profile) {
  const oneBreath = firstSentence(unit.summaries?.one_breath, `${unit.title} needs a local reading handle.`);
  const why = firstSentence(unit.summaries?.why_it_matters, oneBreath);
  if (profile.trail === "whaling-labor") {
    return `In ${unit.title}, "${exact}" keeps practical work visible inside the chapter's larger pressure. ${oneBreath} ${why}`;
  }
  if (profile.trail === "cetology-classification") {
    return `In ${unit.title}, "${exact}" gives students a concrete detail to test against Ishmael's habits of observing and classifying. ${oneBreath} ${why}`;
  }
  if (profile.trail === "voice-and-performance") {
    return `In ${unit.title}, "${exact}" shows how speech, gesture, or scene timing carries meaning alongside plot. ${oneBreath} ${why}`;
  }
  if (profile.trail === "scripture-and-sermons") {
    return `In ${unit.title}, "${exact}" makes inherited religious language part of the chapter's local pressure. ${oneBreath} ${why}`;
  }
  if (profile.trail === "law-property-politics") {
    return `In ${unit.title}, "${exact}" turns rule, possession, or rank into something students can inspect in the wording. ${oneBreath} ${why}`;
  }
  return `${profile.note} ${oneBreath}`;
}

function makeAnnotation(unit, exact, profile) {
  const reviewQueue = profile.kind === "teacher-note"
    ? ["citation", "source-check", "teacher"]
    : ["citation", "interpretive", "source-check"];
  const keepOutOfInline = new Set(["chapter-062-the-dart", "chapter-090-heads-or-tails"]).has(unit.unit_id);
  return {
    id: `floor-pass-${slugPart(unit.unit_id)}`,
    unit_id: unit.unit_id,
    kind: profile.kind,
    selector: {
      type: "TextQuoteSelector",
      exact
    },
    display: {
      depth: profile.kind === "teacher-note" ? "teacher" : "study",
      priority: 3,
      inline: profile.kind !== "teacher-note" && !keepOutOfInline,
      surfaces: profile.kind === "teacher-note"
        ? ["teacher", "review"]
        : keepOutOfInline
          ? ["trail", "index", "search", "review"]
          : ["reader", "trail", "index", "search"],
      spoiler_level: "none"
    },
    anchor: exact,
    note: noteFor(unit, exact, profile),
    tags: [...profile.tags, "provenance:thin-unit-floor-pass"],
    relationships: [
      {
        type: "belongs-to-trail",
        target: `trail:${profile.trail}`
      },
      {
        type: "uses-source",
        target: "source:standard-ebooks-moby-dick"
      }
    ],
    evidence: [
      {
        claim_type: profile.claim,
        citations: ["standard-ebooks-moby-dick"],
        validation: ["selector-resolves", "needs-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: "2026-06-07",
      method: "source-checked-draft"
    },
    status: {
      content_status: "draft",
      citation_status: "provisional",
      review_queue: reviewQueue
    }
  };
}

let added = 0;
const skipped = [];

for (const unit of manifest.units) {
  if (!(unit.section_type === "chapter" || unit.section_type === "epilogue")) continue;
  const current = annotationsByUnit.get(unit.unit_id) ?? [];
  if (current.length >= 7) continue;
  if (current.some((annotation) => annotation.id === `floor-pass-${slugPart(unit.unit_id)}`)) continue;
  const guideUnit = guideUnitsById.get(unit.unit_id);
  const text = guideUnit?.plain_text ?? "";
  const exact = chooseExact(text, current.map((annotation) => annotation.anchor));
  if (!exact) {
    skipped.push(unit.unit_id);
    continue;
  }
  const profile = classify(unit, text);
  annotations.annotations.push(makeAnnotation(unit, exact, profile));
  added += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
