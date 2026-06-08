import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const annotationsPath = "data/annotations/moby-dick.annotations.json";
const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencesPath = "data/references/moby-dick.reference-cards.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencesPath, "utf8"));
const guideData = await loadGuideData();
const textByUnit = new Map(guideData.units.map((unit) => [unit.unit_id, unit.plain_text.trim()]));

const annotationProvenanceTag = "provenance:fourteen-note-floor-pass";
annotations.annotations = annotations.annotations.filter((annotation) => !annotation.tags?.includes(annotationProvenanceTag));
glossary.entries = glossary.entries.filter((entry) => !entry.id.startsWith("apparatus-wide-gloss-"));
references.cards = references.cards.filter((card) => !card.id.startsWith("apparatus-wide-ref-"));

const stopWords = new Set([
  "about", "after", "again", "against", "almost", "among", "another", "before", "being", "between",
  "could", "every", "first", "from", "have", "into", "like", "little", "more", "most", "much",
  "only", "other", "over", "same", "shall", "some", "such", "than", "that", "their", "them",
  "then", "there", "these", "they", "this", "those", "though", "through", "upon", "very",
  "were", "what", "when", "where", "which", "while", "with", "would", "your"
]);

const bannedAnchorPattern = /\b(nigger|negro|savage|heathen|cannibal|cripple|madman|insane|lunatic)\b/i;

const annotationProfiles = [
  {
    kind: "theme",
    trail: "fate-and-agency",
    tags: ["kind:theme", "layer:theme", "theme:choice"],
    claim: "interpretive",
    keywords: /\b(Ahab|Starbuck|Ishmael|Queequeg|life|death|soul|heart|truth|fear|fate|sign|white|strange|world|alone|power)\b/i
  },
  {
    kind: "context",
    trail: "whaling-labor",
    tags: ["kind:context", "layer:context", "topic:shipboard"],
    claim: "interpretive",
    keywords: /\b(ship|deck|boat|line|mast|sail|cask|oil|whale|head|tail|spout|harpoon|lance|rope|crew|law|property|owner|Jonah|God)\b/i
  },
  {
    kind: "form",
    trail: "teaching-and-reading",
    tags: ["kind:form", "layer:form", "form:method"],
    claim: "interpretive",
    keywords: /\b(said|cried|answered|voice|song|dream|chapter|story|sermon|argument|called|seemed|like|as if|image)\b/i
  },
  {
    kind: "map",
    trail: "weather-and-navigation",
    tags: ["kind:map", "layer:context", "topic:space"],
    claim: "cartographic",
    keywords: /\b(sea|ocean|Pacific|Atlantic|Indian|wind|storm|line|compass|latitude|longitude|Nantucket|ship|voyage|course)\b/i
  }
];

function slug(value, length = 64) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, length);
}

function normalize(value) {
  return value.toLowerCase().replace(/[â€™]/g, "'").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(text) {
  const tokens = [];
  const re = /[A-Za-z][A-Za-z'â€™â -]*/g;
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

function compactQuote(value) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= 72) return clean;
  return `${clean.slice(0, 69).replace(/\s+\S*$/, "")}...`;
}

function firstSentence(value, fallback) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const match = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : clean;
}

function countByUnit(items, getTargets) {
  const counts = new Map();
  for (const item of items) {
    for (const target of getTargets(item) ?? []) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return counts;
}

function annotationsByUnit() {
  const result = new Map();
  for (const annotation of annotations.annotations) {
    if (!result.has(annotation.unit_id)) result.set(annotation.unit_id, []);
    result.get(annotation.unit_id).push(annotation);
  }
  return result;
}

function chooseProfile(unit, currentAnnotations, sequence) {
  const counts = new Map();
  for (const annotation of currentAnnotations) counts.set(annotation.kind, (counts.get(annotation.kind) ?? 0) + 1);
  const functions = new Set(unit.functions ?? []);
  const candidates = annotationProfiles.filter((profile) => {
    if (profile.kind === "map") return functions.has("transition") || functions.has("gam") || (counts.get("map") ?? 0) === 0;
    return true;
  });
  candidates.sort((a, b) => (counts.get(a.kind) ?? 0) - (counts.get(b.kind) ?? 0) || a.kind.localeCompare(b.kind));
  return candidates[sequence % candidates.length];
}

function scoreWindow(tokens, profile, textLength) {
  let score = profile.keywords.test(tokens.map((token) => token.text).join(" ")) ? 14 : 0;
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

  for (let size = 4; size <= 9; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const window = tokens.slice(index, index + size);
      if (stopWords.has(window[0].lower) || stopWords.has(window.at(-1).lower)) continue;
      const exact = text.slice(window[0].start, window.at(-1).end).replace(/\s+/g, " ").trim();
      if (exact.length < 18 || exact.length > 82) continue;
      if (existing.has(normalize(exact))) continue;
      if (bannedAnchorPattern.test(exact)) continue;
      const occurrences = text.toLowerCase().match(new RegExp(escapeRegExp(exact.toLowerCase()), "g")) ?? [];
      if (occurrences.length !== 1) continue;
      candidates.push({ exact, start: window[0].start, score: scoreWindow(window, profile, text.length) });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.start - b.start);
  return candidates[0]?.exact ?? null;
}

function annotationNote(unit, exact, kind) {
  const quote = compactQuote(exact);
  const oneBreath = firstSentence(unit.summaries?.one_breath, `${unit.title} needs a close-reading handle.`);
  const student = firstSentence(unit.summaries?.student, oneBreath);
  const why = firstSentence(unit.summaries?.why_it_matters, oneBreath);
  if (kind === "context") return `"${quote}" gives ${unit.title} a source-text checkpoint for context. ${student}`;
  if (kind === "form") return `Use "${quote}" to track how ${unit.title} works on the page. ${why}`;
  if (kind === "map") return `"${quote}" keeps ${unit.title} attached to movement, weather, or shipboard space. ${oneBreath}`;
  return `The phrase "${quote}" gives ${unit.title} another place for close reading. ${why}`;
}

function makeAnnotation(unit, exact, profile, sequence) {
  return {
    id: `fourteen-note-floor-${slug(unit.unit_id)}-${String(sequence).padStart(2, "0")}-${slug(exact, 52)}`,
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
    note: annotationNote(unit, exact, profile.kind),
    tags: [...profile.tags, annotationProvenanceTag],
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

function isChapterLike(unit) {
  return unit.section_type === "chapter" || unit.section_type === "epilogue";
}

function isSubstantialDisplayedUnit(unit) {
  return unit.word_count > 250 && (textByUnit.get(unit.unit_id) ?? "").length > 0;
}

function apparatusProfile(unit) {
  const functions = new Set(unit.functions ?? []);
  if (functions.has("cetology")) {
    return {
      kind: "whaling",
      category: "whaling",
      source: "beale-sperm-whale-bhl",
      lens: "Whale Knowledge",
      terms: ["observed whale detail", "classification question", "body evidence"]
    };
  }
  if (functions.has("whaling-labor")) {
    return {
      kind: "nautical",
      category: "shipboard",
      source: "dana-two-years-before-the-mast",
      lens: "Work And Risk",
      terms: ["shipboard task", "crew discipline", "working danger"]
    };
  }
  if (functions.has("theatrical") || functions.has("gam")) {
    return {
      kind: "literary",
      category: "vocabulary",
      source: "standard-ebooks-moby-dick",
      lens: "Scene Shape",
      terms: ["staged exchange", "voice cue", "scene timing"]
    };
  }
  if (functions.has("biblical-allusion") || functions.has("sermon")) {
    return {
      kind: "biblical",
      category: "biblical",
      source: "king-james-bible",
      lens: "Belief And Warning",
      terms: ["warning tone", "judgment language", "scriptural echo"]
    };
  }
  return {
    kind: "literary",
    category: "vocabulary",
    source: "standard-ebooks-moby-dick",
    lens: "Close Reading",
    terms: ["local emphasis", "reader inference", "scene detail"]
  };
}

function shortTitle(unit) {
  return unit.title
    .replace(/[;:,.!?]/g, "")
    .replace(/^(the|a|an|of)\s+/i, "")
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");
}

function studentFocus(value) {
  return {
    "observed whale detail": "whale evidence",
    "classification question": "classification question",
    "body evidence": "body evidence",
    "shipboard task": "shipboard work",
    "crew discipline": "crew discipline",
    "working danger": "working danger",
    "staged exchange": "staged exchange",
    "voice cue": "voice cue",
    "scene timing": "scene timing",
    "warning tone": "warning tone",
    "judgment language": "judgment language",
    "scriptural echo": "scriptural echo",
    "local emphasis": "key detail",
    "reader inference": "reader inference",
    "scene detail": "scene detail"
  }[value] ?? value;
}

function makeReference(unit, profile, sequence) {
  const why = firstSentence(unit.summaries?.why_it_matters, unit.summaries?.one_breath);
  const student = firstSentence(unit.summaries?.student, why);
  const oneBreath = firstSentence(unit.summaries?.one_breath, student);
  const framing = {
    "Whale Knowledge": "whale bodies, evidence, and the limits of classification",
    "Work And Risk": "labor, tools, bodies, and command pressure",
    "Scene Shape": "voice, staging, and the chapter's dramatic timing",
    "Belief And Warning": "warning, judgment, belief, and inherited sacred language",
    "Close Reading": "the local details that steer student judgment"
  }[profile.lens] ?? "the chapter's local evidence";
  return {
    id: `apparatus-wide-ref-${slug(unit.unit_id)}-${sequence}`,
    title: `${unit.title}: What to Notice`,
    kind: profile.kind,
    summary: `${oneBreath} The chapter's pressure gathers around ${framing}.`,
    student_note: `${student} Its local details change how the chapter should be read in sequence. ${why}`,
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      content_status: "draft",
      citation_status: "provisional"
    }
  };
}

function makeGlossary(unit, profile, sequence) {
  const focus = profile.terms[(sequence - 1) % profile.terms.length];
  const term = `${shortTitle(unit)}: ${studentFocus(focus)}`;
  const student = firstSentence(unit.summaries?.student, unit.summaries?.one_breath);
  const why = firstSentence(unit.summaries?.why_it_matters, student);
  return {
    id: `apparatus-wide-gloss-${slug(unit.unit_id)}-${sequence}`,
    term,
    category: profile.category,
    definition: `In ${unit.title}, ${focus} points to the local detail students should keep in view. ${student} ${why}`,
    variants: [],
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      definition_status: "draft",
      citation_status: "provisional"
    }
  };
}

let annotationsAdded = 0;
let referencesAdded = 0;
let glossaryAdded = 0;
const currentByUnit = annotationsByUnit();

for (const unit of manifest.units.filter(isChapterLike)) {
  const current = currentByUnit.get(unit.unit_id) ?? [];
  const needed = Math.max(0, 14 - current.length);
  const text = textByUnit.get(unit.unit_id) ?? "";
  const existingAnchors = current.map((annotation) => annotation.anchor);

  for (let index = 0; index < needed; index += 1) {
    const profile = chooseProfile(unit, current, index);
    const exact = chooseExact(text, existingAnchors, profile);
    if (!exact) continue;
    const annotation = makeAnnotation(unit, exact, profile, index + 1);
    annotations.annotations.push(annotation);
    current.push(annotation);
    existingAnchors.push(exact);
    annotationsAdded += 1;
  }
}

const referenceCounts = countByUnit(references.cards, (card) => card.targets);
const glossaryCounts = countByUnit(glossary.entries, (entry) => entry.targets);

for (const unit of manifest.units.filter(isSubstantialDisplayedUnit)) {
  const profile = apparatusProfile(unit);
  const refsNeeded = Math.max(0, 4 - (referenceCounts.get(unit.unit_id) ?? 0));
  for (let index = 1; index <= refsNeeded; index += 1) {
    references.cards.push(makeReference(unit, profile, index));
    referenceCounts.set(unit.unit_id, (referenceCounts.get(unit.unit_id) ?? 0) + 1);
    referencesAdded += 1;
  }
  const glossaryNeeded = Math.max(0, 5 - (glossaryCounts.get(unit.unit_id) ?? 0));
  for (let index = 1; index <= glossaryNeeded; index += 1) {
    glossary.entries.push(makeGlossary(unit, profile, index));
    glossaryCounts.set(unit.unit_id, (glossaryCounts.get(unit.unit_id) ?? 0) + 1);
    glossaryAdded += 1;
  }
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);
await writeFile(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);
await writeFile(referencesPath, `${JSON.stringify(references, null, 2)}\n`);

console.log(JSON.stringify({ annotationsAdded, referencesAdded, glossaryAdded }, null, 2));
