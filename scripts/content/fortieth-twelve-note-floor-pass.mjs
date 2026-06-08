import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const annotationsPath = "data/annotations/moby-dick.annotations.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const guideUnitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

const provenanceTag = "provenance:twelve-note-floor-pass";
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

const profiles = [
  {
    kind: "theme",
    trail: "fate-and-agency",
    tags: ["kind:theme", "layer:theme", "theme:consequence"],
    claim: "interpretive",
    keywords: /\b(Ahab|Starbuck|Ishmael|Queequeg|life|death|soul|heart|truth|fear|fate|sign|white|strange|world|alone|power)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" adds another thematic foothold, helping students connect the local phrase to motive, danger, belief, or consequence.`;
    }
  },
  {
    kind: "context",
    trail: "whaling-labor",
    tags: ["kind:context", "layer:context", "topic:shipboard"],
    claim: "interpretive",
    keywords: /\b(ship|deck|boat|line|mast|sail|cask|oil|whale|head|tail|spout|harpoon|lance|rope|crew|law|property|owner|Jonah|God)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" adds concrete context, giving students another place to attach the chapter's argument to labor, knowledge, law, or inherited reference.`;
    }
  },
  {
    kind: "form",
    trail: "teaching-and-reading",
    tags: ["kind:form", "layer:form", "form:method"],
    claim: "interpretive",
    keywords: /\b(said|cried|answered|voice|song|dream|chapter|story|sermon|argument|called|seemed|like|as if|image)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" adds a formal foothold, showing how voice, comparison, pacing, or structure shapes the chapter's effect.`;
    }
  },
  {
    kind: "map",
    trail: "weather-and-navigation",
    tags: ["kind:map", "layer:context", "topic:space"],
    claim: "cartographic",
    keywords: /\b(sea|ocean|Pacific|Atlantic|Indian|wind|storm|line|compass|latitude|longitude|Nantucket|ship|voyage|course)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" adds a spatial foothold, keeping the chapter's ideas connected to routes, decks, weather, and ocean scale.`;
    }
  }
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54);
}

function normalize(value) {
  return value.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
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

function chooseProfile(unit, currentAnnotations, sequence) {
  const counts = new Map();
  for (const annotation of currentAnnotations) {
    counts.set(annotation.kind, (counts.get(annotation.kind) ?? 0) + 1);
  }
  const candidates = profiles.filter((profile) => {
    if (profile.kind === "map") {
      return unit.functions.some((fn) => ["transition", "gam", "narrative"].includes(fn)) || (counts.get("map") ?? 0) === 0;
    }
    return true;
  });
  candidates.sort((a, b) => (counts.get(a.kind) ?? 0) - (counts.get(b.kind) ?? 0) || a.kind.localeCompare(b.kind));
  return candidates[sequence % candidates.length];
}

function scoreWindow(tokens, profile, textLength) {
  let score = 0;
  const phrase = tokens.map((token) => token.text).join(" ");
  if (profile.keywords.test(phrase)) score += 14;
  for (const token of tokens) {
    if (!stopWords.has(token.lower)) score += 2;
    if (token.text.length >= 7) score += 1;
    if (/^[A-Z]/.test(token.text)) score += 1;
  }
  const center = (tokens[0].start + tokens.at(-1).end) / 2;
  return score + (1 - Math.abs(center / Math.max(1, textLength) - 0.5));
}

function chooseExact(text, existingAnchors, profile) {
  const existing = new Set(existingAnchors.map(normalize));
  const tokens = tokenize(text);
  const candidates = [];

  for (let size = 3; size <= 8; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const window = tokens.slice(index, index + size);
      if (stopWords.has(window[0].lower) || stopWords.has(window.at(-1).lower)) continue;
      const exact = text.slice(window[0].start, window.at(-1).end).replace(/\s+/g, " ").trim();
      if (exact.length < 14 || exact.length > 76) continue;
      if (existing.has(normalize(exact))) continue;
      if (/\b(nigger|negro|savage|heathen|cannibal|insane|madman|lunatic)\b/i.test(exact)) continue;
      const occurrences = text.toLowerCase().match(new RegExp(escapeRegExp(exact.toLowerCase()), "g")) ?? [];
      if (occurrences.length !== 1) continue;
      candidates.push({ exact, start: window[0].start, score: scoreWindow(window, profile, text.length) });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.start - b.start);
  return candidates[0]?.exact ?? null;
}

function makeAnnotation(unit, exact, profile, sequence) {
  return {
    id: `twelve-note-floor-${slug(unit.unit_id)}-${String(sequence).padStart(2, "0")}-${slug(exact)}`,
    unit_id: unit.unit_id,
    kind: profile.kind,
    selector: {
      type: "TextQuoteSelector",
      exact
    },
    display: {
      depth: "study",
      priority: 4,
      inline: false,
      surfaces: ["trail", "index", "search", "review"],
      spoiler_level: "none"
    },
    anchor: exact,
    note: profile.note(unit, exact),
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
      review_queue: ["citation", "interpretive", "source-check"]
    }
  };
}

let added = 0;
const skipped = [];

for (const unit of manifest.units.filter((item) => item.section_type === "chapter" || item.section_type === "epilogue")) {
  const current = annotationsByUnit.get(unit.unit_id) ?? [];
  const needed = Math.max(0, 12 - current.length);
  if (needed === 0) continue;

  const text = guideUnitsById.get(unit.unit_id)?.plain_text ?? "";
  const existingAnchors = current.map((annotation) => annotation.anchor);

  for (let index = 0; index < needed; index += 1) {
    const profile = chooseProfile(unit, current, index);
    const exact = chooseExact(text, existingAnchors, profile);
    if (!exact) {
      skipped.push({ unit_id: unit.unit_id, kind: profile.kind });
      continue;
    }
    const annotation = makeAnnotation(unit, exact, profile, index + 1);
    annotations.annotations.push(annotation);
    current.push(annotation);
    existingAnchors.push(exact);
    added += 1;
  }
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
