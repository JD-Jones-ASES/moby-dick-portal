import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

annotations.annotations = annotations.annotations.filter(
  (annotation) => !annotation.tags?.includes("provenance:earlybook-subagent-pass")
);

const candidates = [
  ["chapter-002-the-carpetbag", "watery part of the world", "theme", "Ishmael treats the voyage as a deliberate move away from ordinary life, so the sea is both curiosity and escape."],
  ["chapter-003-the-spouter-inn", "sober cannibal than a drunken Christian", "difficult-material", "The joke flips Ishmael's prejudice, but the racialized language still needs attention because the chapter is learning to undo his fear without erasing it."],
  ["chapter-010-a-bosom-friend", "Through all his unearthly tattooings", "context", "Ishmael reads Queequeg's tattoos as part of his character and history, not as mere decoration."],
  ["chapter-010-a-bosom-friend", "never cringed and never had had a creditor", "context", "The line links dignity to freedom from debt and shame, which is part of why Ishmael finds Queequeg so compelling."],
  ["chapter-012-biographical", "wicked world in all meridians", "theme", "Queequeg's reaction turns the joke back on Christian hypocrisy and shows why he cannot simply absorb the culture around him."],
  ["chapter-012-biographical", "profound desire to learn among the Christians", "teacher-note", "This makes Queequeg's travel feel morally serious: he is not just wandering, he is trying to learn how other people live."],
  ["chapter-022-merry-christmas", "short, cold Christmas", "context", "Melville turns a holiday of warmth into a freezing departure scene, which makes the voyage feel like labor before it feels like adventure."],
  ["chapter-024-the-advocate", "S.W.F. (Sperm Whale Fishery)", "context", "Ishmael knows whaling sounds socially absurd to outsiders, and he uses that embarrassment to build his defense of the trade."],
  ["chapter-024-the-advocate", "Yale College and my Harvard", "theme", "Ishmael claims whaling educated him, so the voyage becomes a school of thought as well as work."],
  ["chapter-024-the-advocate", "pioneer in ferreting out", "context", "The chapter ties whaling to exploration and empire, not just commerce."],
  ["chapter-024-the-advocate", "true mother of that now mighty colony", "context", "Ishmael shows how whale labor helps build colonial history, especially in places like Australia and the Pacific."],
  ["chapter-033-the-specksnyder", "grand political maxim of the sea", "context", "This chapter makes ship rank look like a political system, not just a practical division of labor."],
  ["chapter-035-the-masthead", "problem of the universe revolving in me", "theme", "The masthead is where work turns into reverie, and reverie becomes dangerous because the lookout's mind can drift away from the watch."],
  ["chapter-035-the-masthead", "bill of fare is immutable", "context", "The ship becomes a sealed world where even food feels fixed and far from ordinary life ashore."],
  ["chapter-035-the-masthead", "lean brow and hollow eye", "teacher-note", "Ishmael warns that dreamy people make bad lookouts, which helps students see why the chapter is funny but also serious."],
  ["chapter-035-the-masthead", "half-seen, gliding, beautiful thing", "theme", "The passage shows how the masthead can turn partial glimpses into fantasies, so missing a whale becomes a mental event as much as a practical one."],
  ["chapter-040-midnight-forecastle", "We sing; they sleep", "form", "The forecastle scene works like a chorus, with song fighting off fatigue and fear while the ship keeps moving."],
  ["chapter-043-hark", "Hark!", "form", "The chapter title is an abrupt command to listen, and that interruption helps the novel tighten its warning signal."],
  ["chapter-044-the-chart", "slow but steady pencil trace", "theme", "Ahab's charting makes obsession look disciplined, which is one reason his hunt feels so controlled and so unsettling."],
  ["chapter-044-the-chart", "after the squall", "context", "Ishmael reconstructs Ahab's private labor instead of simply reporting it, which reminds students how much of the captain is inferred rather than directly seen."],
  ["chapter-044-the-chart", "Season-on-the-Line", "context", "The hunt starts to feel seasonal and predictable, which explains why Ahab believes Moby Dick can be found by timing as much as by luck."],
  ["chapter-045-the-affidavit", "perform this part of my task methodically", "teacher-note", "Ishmael openly says he is building a case, so students should read the chapter as an argument for belief, not a neutral report."],
  ["chapter-045-the-affidavit", "natural verity of the main points", "form", "The chapter keeps asking for trust, but it also shows how much proof depends on the storyteller's authority."],
  ["chapter-045-the-affidavit", "economical with your lamps and candles", "context", "Ishmael turns whale oil into ordinary light, quietly reminding readers that comfort and illumination come from dangerous labor."],
  ["chapter-045-the-affidavit", "veracity in the matter", "teacher-note", "This is the chapter's evidence logic in miniature: Ishmael wants to sound legal, but he is still selecting witnesses and weighing trust."]
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
}

function profileFor(kind) {
  if (kind === "form") return { trail: "voice-and-performance", tags: ["kind:form", "layer:form"], claim: "interpretive", queue: ["citation", "interpretive", "source-check"] };
  if (kind === "teacher-note") return { trail: "evidence-and-belief", tags: ["kind:teacher-note", "layer:teacher"], claim: "interpretive", queue: ["citation", "teacher", "source-check"] };
  if (kind === "difficult-material") return { trail: "race-empire-global-crew", tags: ["kind:difficult-material", "layer:context", "review:difficult-material"], claim: "difficult-material", queue: ["citation", "difficult-material", "source-check", "tone"] };
  if (kind === "theme") return { trail: "evidence-and-belief", tags: ["kind:theme", "layer:theme"], claim: "interpretive", queue: ["citation", "interpretive", "source-check"] };
  return { trail: "whaling-labor", tags: ["kind:context", "layer:context"], claim: "source-text-observation", queue: ["citation", "source-check"] };
}

function makeAnnotation(unitId, exact, kind, note) {
  const profile = profileFor(kind);
  const id = `subagent-earlybook-${slug(unitId.replace(/^chapter-\d{3}-/, ""))}-${slug(exact)}`;
  const isTeacher = kind === "teacher-note";
  const keepOutOfInline = new Set(["chapter-024-the-advocate", "chapter-035-the-masthead", "chapter-044-the-chart", "chapter-045-the-affidavit"]).has(unitId);
  return {
    id,
    unit_id: unitId,
    kind,
    selector: {
      type: "TextQuoteSelector",
      exact
    },
    display: {
      depth: isTeacher ? "teacher" : "study",
      priority: 3,
      inline: !isTeacher && !keepOutOfInline,
      surfaces: isTeacher
        ? ["teacher", "review"]
        : keepOutOfInline
          ? ["trail", "index", "search", "review"]
          : ["reader", "trail", "index", "search"],
      spoiler_level: "none"
    },
    anchor: exact,
    note,
    tags: [...profile.tags, "provenance:earlybook-subagent-pass"],
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
        validation: kind === "difficult-material" ? ["selector-resolves", "tone-review", "needs-review"] : ["selector-resolves", "needs-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex-subagent",
      created: "2026-06-07",
      method: "subagent-draft"
    },
    status: {
      content_status: kind === "difficult-material" ? "needs-review" : "draft",
      citation_status: "provisional",
      review_queue: profile.queue
    }
  };
}

const existingIds = new Set(annotations.annotations.map((annotation) => annotation.id));
const existingAnchorsByUnit = new Map();
for (const annotation of annotations.annotations) {
  if (!existingAnchorsByUnit.has(annotation.unit_id)) existingAnchorsByUnit.set(annotation.unit_id, new Set());
  existingAnchorsByUnit.get(annotation.unit_id).add(annotation.anchor.toLowerCase());
}

let added = 0;
const skipped = [];

for (const [unitId, exact, kind, note] of candidates) {
  const text = unitsById.get(unitId)?.plain_text ?? "";
  const id = `subagent-earlybook-${slug(unitId.replace(/^chapter-\d{3}-/, ""))}-${slug(exact)}`;
  if (existingIds.has(id)) continue;
  if (!text.toLowerCase().includes(exact.toLowerCase())) {
    skipped.push({ unitId, exact, reason: "anchor-not-found" });
    continue;
  }
  if (existingAnchorsByUnit.get(unitId)?.has(exact.toLowerCase())) {
    skipped.push({ unitId, exact, reason: "duplicate-anchor" });
    continue;
  }
  const annotation = makeAnnotation(unitId, exact, kind, note);
  annotations.annotations.push(annotation);
  existingIds.add(annotation.id);
  if (!existingAnchorsByUnit.has(unitId)) existingAnchorsByUnit.set(unitId, new Set());
  existingAnchorsByUnit.get(unitId).add(exact.toLowerCase());
  added += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
