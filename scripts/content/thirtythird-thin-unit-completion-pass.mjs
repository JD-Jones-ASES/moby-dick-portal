import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

annotations.annotations = annotations.annotations.filter(
  (annotation) => !annotation.tags?.includes("provenance:thin-unit-completion-pass")
);

const candidates = [
  ["chapter-008-the-pulpit", "second flowering youth", "context", "Father Mapple's age is described as renewed rather than diminished, which helps explain why his authority feels both weathered and alive."],
  ["chapter-014-nantucket", "mere hillock, and elbow of sand", "form", "The compressed image makes Nantucket feel almost impossibly small, sharpening the comic contrast between a tiny island and a global whaling power."],
  ["chapter-020-all-astir", "preparations were hurrying to a close", "context", "The chapter turns departure into logistics: sails, canvas, rigging, and stores make the adventure possible before anyone romanticizes it."],
  ["chapter-021-going-aboard", "uncertain twilight, strangely peering", "theme", "Elijah's entrance uses dim light and suspicious looking to keep warning alive just as Ishmael and Queequeg approach the ship."],
  ["chapter-025-postscript", "dignity of whaling", "theme", "Ishmael is still defending whaling's status here, which shows how much the book cares about public respect for dirty work."],
  ["chapter-049-the-hyena", "desperado philosophy", "theme", "The phrase names Ishmael's comic fatalism after danger, where laughter becomes a way to live with fear rather than escape it."],
  ["chapter-049-the-hyena", "unseen and unaccountable old joker", "theme", "Ishmael imagines suffering as a joke with no clear author, which makes the chapter's comedy feel brave and uneasy at once."],
  ["chapter-066-the-shark-massacre", "whole round sea was one huge cheese", "form", "The grotesque joke turns horror into an image students can picture, making the shark scene funny and repulsive at the same time."],
  ["chapter-076-the-battering-ram", "dead, blind wall", "context", "The phrase makes the whale's head seem like architecture or armor, which prepares readers for the chapter's argument about impact."],
  ["chapter-107-the-carpenter", "thousand nameless mechanical emergencies", "context", "The carpenter's value comes from practical intelligence under pressure, the kind of skill the ship needs constantly but rarely celebrates."],
  ["chapter-109-ahab-and-starbuck-in-the-cabin", "casks below must have sprung a bad leak", "theme", "The leaking oil creates a direct conflict between Starbuck's duty to the ship and Ahab's refusal to pause the hunt."],
  ["chapter-112-the-blacksmith", "toil were life itself", "theme", "Perth's work is not just employment; the sentence makes labor feel like the rhythm that keeps his damaged life moving."],
  ["chapter-116-the-dying-whale", "only soothed to deeper gloom", "theme", "The dying whale briefly quiets Ahab, but the calm deepens rather than releases his obsession."],
  ["chapter-118-the-quadrant", "nakedness of unrelieved radiance", "form", "The sky's overwhelming brightness makes navigation feel hostile, as if knowledge itself has become too exposed to bear."],
  ["chapter-120-the-deck-towards-the-end-of-the-first-night-watch", "Strike nothing; lash it", "theme", "Ahab's order turns repair into defiance, showing how command language can suppress practical caution."],
  ["chapter-122-midnight-aloft-thunder-and-lightning", "Plenty too much thunder up here", "form", "Tashtego's comic complaint gives the storm a human voice from aloft, keeping the theatrical storm scene grounded in a worker's body."],
  ["chapter-122-midnight-aloft-thunder-and-lightning", "Stop that thunder", "form", "The command is funny because it is impossible, but it also shows Tashtego trying to answer cosmic danger with sailorly impatience."],
  ["chapter-122-midnight-aloft-thunder-and-lightning", "What’s the use of thunder", "theme", "The question turns the storm into a practical problem, cutting Ahab's grand omens down to a worker's immediate discomfort."],
  ["chapter-124-the-needle", "whole world boomed before the wind", "theme", "The weather seems to push everything forward, which makes Ahab's confidence after the storm feel grand and dangerous."],
  ["chapter-125-the-log-and-line", "all the elements had combined to rot", "theme", "The neglected log-line shows how unused knowledge tools decay, a quiet warning after Ahab has already rejected other instruments."]
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
}

function profileFor(kind) {
  if (kind === "form") return { trail: "voice-and-performance", tags: ["kind:form", "layer:form"], claim: "interpretive" };
  if (kind === "context") return { trail: "whaling-labor", tags: ["kind:context", "layer:context"], claim: "nautical-whaling" };
  return { trail: "evidence-and-belief", tags: ["kind:theme", "layer:theme"], claim: "interpretive" };
}

function makeAnnotation(unitId, exact, kind, note) {
  const profile = profileFor(kind);
  return {
    id: `completion-pass-${slug(unitId.replace(/^chapter-\d{3}-/, ""))}-${slug(exact)}`,
    unit_id: unitId,
    kind,
    selector: {
      type: "TextQuoteSelector",
      exact
    },
    display: {
      depth: "study",
      priority: 3,
      inline: false,
      surfaces: ["trail", "index", "search", "review"],
      spoiler_level: "none"
    },
    anchor: exact,
    note,
    tags: [...profile.tags, "provenance:thin-unit-completion-pass"],
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

const existingAnchorsByUnit = new Map();
for (const annotation of annotations.annotations) {
  if (!existingAnchorsByUnit.has(annotation.unit_id)) existingAnchorsByUnit.set(annotation.unit_id, new Set());
  existingAnchorsByUnit.get(annotation.unit_id).add(annotation.anchor.toLowerCase());
}

let added = 0;
const skipped = [];

for (const [unitId, exact, kind, note] of candidates) {
  const text = unitsById.get(unitId)?.plain_text ?? "";
  if (!text.toLowerCase().includes(exact.toLowerCase())) {
    skipped.push({ unitId, exact, reason: "anchor-not-found" });
    continue;
  }
  if (existingAnchorsByUnit.get(unitId)?.has(exact.toLowerCase())) {
    skipped.push({ unitId, exact, reason: "duplicate-anchor" });
    continue;
  }
  annotations.annotations.push(makeAnnotation(unitId, exact, kind, note));
  added += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
