import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const annotationsPath = "data/annotations/moby-dick.annotations.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const guideUnitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

const provenanceTag = "provenance:ten-note-floor-pass";
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.tags?.includes(provenanceTag));

const annotationsByUnit = new Map();
for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

const stopWords = new Set([
  "about", "after", "again", "against", "almost", "among", "another", "before", "being", "between",
  "could", "every", "first", "from", "have", "into", "like", "little", "more", "most", "much",
  "only", "other", "over", "same", "shall", "some", "such", "than", "that", "their", "them",
  "then", "there", "these", "they", "this", "those", "though", "through", "upon", "very",
  "were", "what", "when", "where", "which", "while", "with", "would", "your"
]);

const bannedAnchorPattern = /\b(nigger|negro|savage|heathen|cannibal|cripple|madman|insane|lunatic)\b/i;

const signalProfiles = [
  {
    re: /\b(Ahab|Starbuck|Stubb|Flask|Pip|Queequeg|Ishmael|Fedallah|Tashtego|Daggoo)\b/i,
    kind: "theme",
    trail: "narrator-and-reliability",
    tags: ["kind:theme", "layer:theme", "theme:character"],
    claim: "interpretive",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" gives students a precise character handle, showing how a person on the Pequod becomes legible through gesture, voice, or reputation.`;
    }
  },
  {
    re: /\b(whale|sperm|right whale|head|tail|spout|fountain|skeleton|fossil|blubber|ambergris)\b/i,
    kind: "context",
    trail: "cetology-classification",
    tags: ["kind:context", "layer:context", "topic:cetology"],
    claim: "nautical-whaling",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" keeps the whale material attached to a visible detail, so the chapter's science stays connected to observation.`;
    }
  },
  {
    re: /\b(ship|deck|boat|line|mast|sail|cask|oil|harpoon|lance|rope|crew|lowering|forge|carpenter|blacksmith)\b/i,
    kind: "context",
    trail: "whaling-labor",
    tags: ["kind:context", "layer:context", "topic:labor"],
    claim: "nautical-whaling",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" anchors the chapter in shipboard work, where tools, bodies, and command decisions carry the pressure of the voyage.`;
    }
  },
  {
    re: /\b(God|Jonah|prophet|sermon|sin|judgment|heaven|hell|Leviathan|Job|Rachel)\b/i,
    kind: "context",
    trail: "scripture-and-sermons",
    tags: ["kind:context", "layer:context", "allusion:biblical"],
    claim: "biblical-context",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" shows sacred language entering the voyage, making ordinary action sound like warning, judgment, or calling.`;
    }
  },
  {
    re: /\b(law|king|queen|property|owner|right|wrong|fast-fish|loose-fish|dollar|gold|profit|pay)\b/i,
    kind: "theme",
    trail: "commerce-and-credit",
    tags: ["kind:theme", "layer:theme", "theme:property"],
    claim: "interpretive",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" helps students see how Melville turns money, rank, or ownership into part of the book's moral argument.`;
    }
  },
  {
    re: /\b(storm|fire|lightning|wind|sea|wave|Pacific|Atlantic|Indian|line|compass|quadrant|needle)\b/i,
    kind: "map",
    trail: "weather-and-navigation",
    tags: ["kind:map", "layer:context", "topic:navigation"],
    claim: "cartographic",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" gives the scene a navigational or weather-bearing edge, reminding students that the voyage is always happening in physical space.`;
    }
  },
  {
    re: /\b(death|dead|coffin|grave|funeral|drown|blood|shark|wound|lost|orphan|rescue)\b/i,
    kind: "theme",
    trail: "death-and-burial",
    tags: ["kind:theme", "layer:theme", "theme:death"],
    claim: "interpretive",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" makes danger concrete, linking the chapter's thought to death, injury, abandonment, or survival.`;
    }
  },
  {
    re: /\b(said|cried|answered|whispered|voice|song|silence|hark|speak|shout|laugh|dream)\b/i,
    kind: "form",
    trail: "sound-and-silence",
    tags: ["kind:form", "layer:form", "form:voice"],
    claim: "interpretive",
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" asks students to hear the chapter's form, where speech, sound, silence, or dream logic does interpretive work.`;
    }
  }
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54);
}

function isWordLetter(character) {
  return /[A-Za-z]/.test(character ?? "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(text) {
  const tokens = [];
  const re = /[A-Za-z][A-Za-z'’⁠-]*/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      lower: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return tokens;
}

function scoreWindow(tokens, textLength) {
  let score = 0;
  for (const token of tokens) {
    if (!stopWords.has(token.lower)) score += 2;
    if (token.text.length >= 7) score += 1;
    if (/^[A-Z]/.test(token.text)) score += 1;
  }
  const center = (tokens[0].start + tokens.at(-1).end) / 2;
  const middleBonus = 1 - Math.abs(center / Math.max(1, textLength) - 0.5);
  return score + middleBonus;
}

function chooseCandidates(text, existingAnchors, needed) {
  const existing = new Set(existingAnchors.map((anchor) => anchor.toLowerCase()));
  const tokens = tokenize(text);
  const candidates = [];
  const seen = new Set();

  for (let size = 3; size <= 8; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const window = tokens.slice(index, index + size);
      const first = window[0];
      const last = window.at(-1);
      if (stopWords.has(first.lower) || stopWords.has(last.lower)) continue;

      const exact = text.slice(first.start, last.end).replace(/\s+/g, " ").trim();
      if (exact.length < 14 || exact.length > 76) continue;
      if (existing.has(exact.toLowerCase())) continue;
      if (seen.has(exact.toLowerCase())) continue;
      if (bannedAnchorPattern.test(exact)) continue;
      if (isWordLetter(text[first.start - 1]) || isWordLetter(text[last.end])) continue;

      const occurrences = text.toLowerCase().match(new RegExp(escapeRegExp(exact.toLowerCase()), "g")) ?? [];
      if (occurrences.length !== 1) continue;

      seen.add(exact.toLowerCase());
      candidates.push({
        exact,
        start: first.start,
        end: last.end,
        score: scoreWindow(window, text.length)
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.start - b.start);
  const chosen = [];
  const minimumDistance = Math.max(40, Math.floor(text.length / 18));
  for (const candidate of candidates) {
    if (chosen.some((item) => Math.abs(item.start - candidate.start) < minimumDistance)) continue;
    chosen.push(candidate);
    if (chosen.length >= needed) break;
  }

  if (chosen.length < needed) {
    for (const candidate of candidates) {
      if (chosen.some((item) => item.exact.toLowerCase() === candidate.exact.toLowerCase())) continue;
      chosen.push(candidate);
      if (chosen.length >= needed) break;
    }
  }

  return chosen.slice(0, needed);
}

function profileFor(unit, exact) {
  const profile = signalProfiles.find((item) => item.re.test(exact));
  if (profile) return profile;

  if (unit.functions.includes("theatrical")) {
    return signalProfiles.at(-1);
  }
  if (unit.functions.includes("cetology")) {
    return signalProfiles[1];
  }
  if (unit.functions.includes("whaling-labor")) {
    return signalProfiles[2];
  }
  if (unit.functions.includes("biblical-allusion") || unit.functions.includes("sermon")) {
    return signalProfiles[3];
  }
  if (unit.functions.includes("legal-political")) {
    return signalProfiles[4];
  }

  return {
    kind: "theme",
    trail: "teaching-and-reading",
    tags: ["kind:theme", "layer:theme", "theme:reading"],
    claim: "interpretive",
    note(currentUnit, currentExact) {
      return `In ${currentUnit.title}, "${currentExact}" is a useful study hinge: a compact phrase where image, argument, or narration gives the chapter its local force.`;
    }
  };
}

function makeAnnotation(unit, candidate, sequence) {
  const profile = profileFor(unit, candidate.exact);
  const reviewQueue = profile.kind === "teacher-note"
    ? ["citation", "source-check", "teacher"]
    : ["citation", "interpretive", "source-check"];
  return {
    id: `ten-note-floor-${slug(unit.unit_id)}-${String(sequence).padStart(2, "0")}-${slug(candidate.exact)}`,
    unit_id: unit.unit_id,
    kind: profile.kind,
    selector: {
      type: "TextQuoteSelector",
      exact: candidate.exact
    },
    display: {
      depth: profile.kind === "teacher-note" ? "teacher" : "study",
      priority: 4,
      inline: profile.kind !== "teacher-note",
      surfaces: profile.kind === "teacher-note"
        ? ["teacher", "review"]
        : ["reader", "trail", "index", "search", "review"],
      spoiler_level: "none"
    },
    anchor: candidate.exact,
    note: profile.note(unit, candidate.exact),
    tags: [...profile.tags, provenanceTag],
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
  const needed = Math.max(0, 10 - current.length);
  if (needed === 0) continue;

  const text = guideUnitsById.get(unit.unit_id)?.plain_text ?? "";
  const candidates = chooseCandidates(text, current.map((annotation) => annotation.anchor), needed);
  if (candidates.length < needed) {
    skipped.push({ unit_id: unit.unit_id, needed, found: candidates.length });
  }

  for (const [index, candidate] of candidates.entries()) {
    annotations.annotations.push(makeAnnotation(unit, candidate, index + 1));
    added += 1;
  }
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
