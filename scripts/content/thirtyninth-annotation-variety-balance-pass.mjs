import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const annotationsPath = "data/annotations/moby-dick.annotations.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const provenanceTag = "provenance:annotation-variety-balance-pass";

annotations.annotations = annotations.annotations.filter((annotation) => !annotation.tags?.includes(provenanceTag));

const stopWords = new Set([
  "about", "after", "again", "against", "almost", "among", "another", "before", "being", "between",
  "could", "every", "first", "from", "have", "into", "like", "little", "more", "most", "much",
  "only", "other", "over", "same", "shall", "some", "such", "than", "that", "their", "them",
  "then", "there", "these", "they", "this", "those", "though", "through", "upon", "very",
  "were", "what", "when", "where", "which", "while", "with", "would", "your"
]);

const kindProfiles = {
  context: {
    trail: "whaling-labor",
    tags: ["kind:context", "layer:context", "provenance:annotation-variety-balance-pass"],
    claim: "interpretive",
    keywords: /\b(ship|deck|boat|line|mast|sail|cask|oil|whale|head|tail|spout|harpoon|lance|rope|crew|law|property|owner|king|queen|Jonah|God)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" gives the chapter a concrete context point, tying its argument to shipboard practice, whaling knowledge, law, or inherited reference.`;
    }
  },
  form: {
    trail: "teaching-and-reading",
    tags: ["kind:form", "layer:form", "provenance:annotation-variety-balance-pass"],
    claim: "interpretive",
    keywords: /\b(said|cried|answered|voice|song|dream|chapter|story|sermon|argument|called|seemed|like|as if)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" helps students notice the chapter's method: voice, comparison, pacing, or structure is shaping how the scene should be read.`;
    }
  },
  theme: {
    trail: "fate-and-agency",
    tags: ["kind:theme", "layer:theme", "provenance:annotation-variety-balance-pass"],
    claim: "interpretive",
    keywords: /\b(Ahab|Starbuck|Ishmael|Queequeg|life|death|soul|heart|truth|fear|fate|sign|white|strange|world|power|alone|care)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" opens a thematic pressure point, giving students a place to connect the local wording to motive, danger, belief, or isolation.`;
    }
  },
  map: {
    trail: "weather-and-navigation",
    tags: ["kind:map", "layer:context", "provenance:annotation-variety-balance-pass"],
    claim: "cartographic",
    keywords: /\b(sea|ocean|Pacific|Atlantic|Indian|wind|storm|line|compass|latitude|longitude|Nantucket|ship|voyage|course)\b/i,
    note(unit, exact) {
      return `In ${unit.title}, "${exact}" gives the chapter a spatial handle, reminding students that the novel's ideas are moving through ports, decks, routes, and weather.`;
    }
  }
};

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

function score(tokens, profile, textLength) {
  let total = 0;
  const phrase = tokens.map((token) => token.text).join(" ");
  if (profile.keywords.test(phrase)) total += 12;
  for (const token of tokens) {
    if (!stopWords.has(token.lower)) total += 2;
    if (token.text.length >= 7) total += 1;
    if (/^[A-Z]/.test(token.text)) total += 1;
  }
  const center = (tokens[0].start + tokens.at(-1).end) / 2;
  total += 1 - Math.abs(center / Math.max(1, textLength) - 0.5);
  return total;
}

function chooseExact(text, existingAnchors, kind) {
  const profile = kindProfiles[kind];
  const existing = new Set(existingAnchors.map(normalize));
  const tokens = tokenize(text);
  const candidates = [];

  for (let size = 3; size <= 8; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const window = tokens.slice(index, index + size);
      if (stopWords.has(window[0].lower) || stopWords.has(window.at(-1).lower)) continue;
      const exact = text.slice(window[0].start, window.at(-1).end).replace(/\s+/g, " ").trim();
      if (exact.length < 14 || exact.length > 74) continue;
      if (existing.has(normalize(exact))) continue;
      if (/\b(nigger|negro|savage|heathen|cannibal|insane|madman|lunatic)\b/i.test(exact)) continue;
      const occurrences = text.toLowerCase().match(new RegExp(escapeRegExp(exact.toLowerCase()), "g")) ?? [];
      if (occurrences.length !== 1) continue;
      candidates.push({ exact, score: score(window, profile, text.length), start: window[0].start });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.start - b.start);
  return candidates[0]?.exact ?? null;
}

function countKinds(items) {
  const counts = new Map();
  for (const item of items) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  return counts;
}

function desiredKinds(unit, currentAnnotations) {
  const counts = countKinds(currentAnnotations);
  const count = currentAnnotations.length;
  const desired = [];
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (!counts.has("theme")) desired.push("theme");
  if (!counts.has("context") && unit.functions.some((fn) => ["cetology", "whaling-labor", "legal-political", "biblical-allusion", "sermon"].includes(fn))) desired.push("context");
  if (!counts.has("form") && unit.functions.some((fn) => ["theatrical", "sermon", "gam"].includes(fn))) desired.push("form");
  if (!counts.has("map") && unit.functions.some((fn) => ["transition", "gam"].includes(fn))) desired.push("map");

  if (dominant && dominant[1] / count >= 0.8) {
    if (dominant[0] === "theme") desired.push(unit.functions.includes("narrative") ? "form" : "context");
    if (dominant[0] === "context") desired.push("theme", "form");
    if (dominant[0] === "form") desired.push("theme");
  }

  return [...new Set(desired)].filter((kind) => kindProfiles[kind]);
}

function makeAnnotation(unit, exact, kind) {
  const profile = kindProfiles[kind];
  return {
    id: `variety-balance-${slug(unit.unit_id)}-${slug(exact)}`,
    unit_id: unit.unit_id,
    kind,
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
    tags: profile.tags,
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

const annotationsByUnit = new Map();
for (const annotation of annotations.annotations) {
  if (!annotationsByUnit.has(annotation.unit_id)) annotationsByUnit.set(annotation.unit_id, []);
  annotationsByUnit.get(annotation.unit_id).push(annotation);
}

let added = 0;
const skipped = [];

for (const unit of manifest.units.filter((item) => item.section_type === "chapter" || item.section_type === "epilogue")) {
  const current = annotationsByUnit.get(unit.unit_id) ?? [];
  const text = unitsById.get(unit.unit_id)?.plain_text ?? "";
  const existingAnchors = current.map((annotation) => annotation.anchor);

  for (const kind of desiredKinds(unit, current)) {
    const exact = chooseExact(text, existingAnchors, kind);
    if (!exact) {
      skipped.push({ unit_id: unit.unit_id, kind });
      continue;
    }
    const annotation = makeAnnotation(unit, exact, kind);
    annotations.annotations.push(annotation);
    current.push(annotation);
    existingAnchors.push(exact);
    added += 1;
  }
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
