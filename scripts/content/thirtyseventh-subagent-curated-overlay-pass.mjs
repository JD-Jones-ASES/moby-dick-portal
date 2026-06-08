import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const provenanceTag = "provenance:subagent-curated-overlay-pass";

annotations.annotations = annotations.annotations.filter((annotation) => !annotation.tags?.includes(provenanceTag));

const candidates = [
  ["chapter-011-nightgown", "one warm spark in the heart", "theme", "Ishmael turns bodily comfort into a shared, almost domestic intimacy."],
  ["chapter-014-nantucket", "all beach, without a background", "map", "Nantucket feels like a thin edge of land, cut off from the wider world."],
  ["chapter-015-chowder", "Two enormous wooden pots painted black", "context", "The try-pots make whaling look industrial and bodily, not romantic."],
  ["chapter-016-the-ship", "the very ship for us", "theme", "Queequeg's choice pushes the voyage toward fate, not simple preference."],
  ["chapter-017-the-ramadan", "Presbyterians and Pagans alike", "theme", "Ishmael starts by collapsing religious difference into shared human discipline."],
  ["chapter-018-his-mark", "he must show his papers", "context", "Identity on the dock becomes a matter of proof and permission."],
  ["chapter-021-going-aboard", "imperfect misty dawn", "form", "The departure is visually uncertain, matching Ishmael's unsettled state."],
  ["chapter-022-merry-christmas", "No need of profane words", "form", "Holiday language does not soften the ship; work and command still rule."],
  ["chapter-023-the-lee-shore", "landlessness alone resides highest truth", "theme", "Bulkington becomes a figure for choosing the sea over shore-bound safety."],
  ["chapter-024-the-advocate", "preeminently presuming and ridiculous", "theme", "Ishmael defends whaling by mocking how outsiders dismiss it."],
  ["chapter-025-postscript", "castor of state", "form", "A tiny household object gets turned into mock ceremonial grandeur."],
  ["chapter-026-knights-and-squires", "Only some thirty arid summers", "context", "Starbuck is introduced as already weathered by the life he leads."],
  ["chapter-027-knights-and-squires", "coal-black negro-savage", "difficult-material", "This is period racist language; read it as historical prejudice in the narration, not as neutral description."],
  ["chapter-028-ahab", "sacred retreat of the cabin", "context", "Ahab's cabin is a hidden center of power, not a private refuge."],
  ["chapter-029-enter-ahab-to-him-stubb", "The warmly cool, clear, ringing", "theme", "The weather imagery makes the voyage feel overripe and strangely luxurious."],
  ["chapter-030-the-pipe", "my pipe! hard must it go", "theme", "Ahab gives up ordinary comfort as part of hardening himself for vengeance."],
  ["chapter-031-queen-mab", "Ahab seemed a pyramid", "theme", "The dream turns Ahab into a monumental, nearly immovable force."],
  ["chapter-032-cetology", "classification of the constituents of a chaos", "form", "Cetology is orderly only on the surface; the chaos is the point."],
  ["chapter-033-the-specksnyder", "Literally this word means Fat-Cutter", "context", "Whaling vocabulary stays close to meat, labor, and the body."],
  ["chapter-034-the-cabin-table", "pale loaf-of-bread face", "context", "Dough-Boy's pale face and service role make him comic and slightly ghostly."],
  ["chapter-035-the-masthead", "move your foot or hand an inch", "theme", "Masthead watching can become a trance where a tiny movement means danger."],
  ["chapter-036-the-quarterdeck", "footprints of his one unsleeping", "theme", "Ahab's forehead reads like a visible map of obsession."],
  ["chapter-037-sunset", "Iron Crown of Lombardy", "theme", "The crown image makes Ahab's power look imperial and burdensome."],
  ["chapter-038-dusk", "But he drilled deep down", "theme", "Starbuck can see how deeply Ahab has drilled into conscience and reason."],
  ["chapter-039-first-night-watch", "it's all predestinated", "theme", "Stubb uses fate-talk as comic armor against fear."],
  ["chapter-040-midnight-forecastle", "Oh, boys, don't be sentimental", "form", "Song and sea-work mix here, with humor standing in for solemnity."],
  ["chapter-041-moby-dick", "A wild, mystical, sympathetical feeling", "theme", "Ishmael feels a dangerous sympathy with Ahab's war on the whale."],
  ["chapter-043-hark", "knitting-needles fifty miles at sea", "context", "The tiny sound clue feels absurdly domestic in the middle of the ocean."],
  ["chapter-044-the-chart", "migratory charts of the sperm whale", "map", "Ahab turns whale movement into cartography, hoping the world can be plotted."],
  ["chapter-045-the-affidavit", "truth requires full as much bolstering", "form", "The affidavit tries to make the story read like sworn evidence."],
  ["chapter-046-surmises", "collateral prosecution of the voyage", "theme", "Ahab's revenge is still riding alongside the ordinary whaling mission, so the chapter keeps profit, labor, and obsession in the same frame."],
  ["chapter-047-the-mat-maker", "using my own hand for the shuttle", "form", "The weaving image makes the chapter feel like a miniature version of Melville's own craft: the voyage is being woven as it goes."],
  ["chapter-048-the-first-lowering", "casting loose the tackles and bands", "context", "The first lowering is staged like a charged, almost ghostly event, which keeps the scene from feeling like simple action-adventure."],
  ["chapter-049-the-hyena", "peril of life and limb", "theme", "Ishmael's joke has a grim edge here: whaling is not just risky, it normalizes risk as part of daily life."],
  ["chapter-050-ahab-s-boat-and-crew-fedallah", "hair-turbaned Fedallah remained a muffled mystery", "context", "Fedallah enters as a vivid but unreadable figure, and the chapter keeps his influence deliberately hard to pin down."],
  ["chapter-051-the-spirit-spout", "silvery silence, not a solitude", "theme", "The sea looks beautiful, but the beauty feels haunted, which is exactly how this omen-laced chapter wants to feel."],
  ["chapter-052-the-albatross", "skeleton of a stranded walrus", "context", "The Albatross is described like a sea corpse, echoing the Pequod's own eerie, weathered presence."],
  ["chapter-053-the-gam", "contribute some of that information", "form", "Melville pauses to define a shipboard custom, showing that a gam is really a social exchange built around information."],
  ["chapter-054-the-town-ho-s-story", "As told at the Golden Inn", "form", "This heading signals the nested-story structure, reminding readers that Moby-Dick keeps slipping into stories within stories."],
  ["chapter-055-of-the-monstrous-pictures-of-whales", "paint to you as well as", "form", "Ishmael is openly struggling to translate the whale into words, so the chapter becomes a correction of bad visual habits."],
  ["chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes", "monstrous stories of them", "form", "Melville keeps testing printed authorities against lived experience, which makes the chapter part satire and part field guide."],
  ["chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars", "holding a painted board", "context", "The whale's image survives in public memory and street life, so one old injury becomes part of the book's wider visual archive."],
  ["chapter-058-brit", "ripe and golden wheat", "context", "The feeding ground briefly looks like farmland, which turns the whale scene into something like harvest imagery before the violence returns."],
  ["chapter-059-squid", "golden finger laid across them", "theme", "The sea flips from calm to uncanny in a blink, and the squid becomes a brief glimpse of hidden marine life."],
  ["chapter-060-the-line", "close coiling to which it must", "context", "This chapter explains why the whale-line is dangerous in itself: the tool that catches the whale can also catch the crew."],
  ["chapter-061-stubb-kills-a-whale", "the spell of sleep", "context", "The still sea makes the crew drowsy, which gives the coming strike a sleepy, strangely vulnerable atmosphere."],
  ["chapter-062-the-dart", "the first iron into the fish", "context", "The chapter emphasizes how much force and timing the first strike requires, and how physical the hierarchy of whaling is."],
  ["chapter-063-the-crotch", "grow the chapters", "form", "Melville suddenly becomes self-aware and jokes about his own chapter structure just as the narrative gets technical."],
  ["chapter-064-stubb-s-supper", "the enormousness of the mass", "context", "The tow itself becomes a labor scene, and the whale's scale makes the work feel almost comic and overwhelming."],
  ["chapter-066-the-shark-massacre", "all hands to set about it", "context", "The butchery is organized ship labor, not a side detail, and everyone has to join in."],
  ["chapter-069-the-funeral", "white body of the beheaded whale", "theme", "The carcass is treated like a funeral object, but the sea keeps making the scene grotesque instead of solemn."],
  ["chapter-070-the-sphynx", "beheading of the Sperm Whale", "context", "Melville frames whale-beheading as skilled surgery, not romance, which keeps the bodily labor in view."],
  ["chapter-071-the-jeroboam-s-story", "atmosphere of sacredness", "theme", "Gabriel's mania shows how quickly superstition and charisma can make delusion look holy to a frightened crew."],
  ["chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him", "the best we can do now", "form", "Melville keeps deferring the head study, which makes this chapter feel like a busy pause inside a larger argument."],
  ["chapter-076-the-battering-ram", "satisfactorily settle this matter", "form", "The chapter asks readers to stop treating the whale head as a blank shape and actually think through its force and structure."],
  ["chapter-077-the-great-heidelburgh-tun", "Now comes the Baling of the Case", "form", "The grand title is doing real work here: the whale's head is being split into compartments so Ishmael can anatomize it."],
  ["chapter-079-the-prairie", "faces of horses, birds, serpents", "form", "Melville is testing pseudo-science here, using physiognomy to show how shaky attempts to read faces can be."],
  ["chapter-082-the-honor-and-glory-of-whaling", "careful disorderliness is the true method", "form", "This line names Melville's own method: whaling may look chaotic, but the chapter argues that the chaos has its own logic."],
  ["chapter-088-schools-and-schoolmasters", "small detached bands are occasionally observed", "context", "Melville starts classifying whale groups by size and sex, turning natural history into a social taxonomy."],
  ["chapter-090-heads-or-tails", "there is no intermediate remainder", "form", "The legal division of the whale is made to look total and absurd at once, which is exactly the chapter's point."]
];

const profiles = {
  context: { trail: "whaling-labor", tags: ["kind:context", "layer:context"], claim: "interpretive" },
  form: { trail: "teaching-and-reading", tags: ["kind:form", "layer:form"], claim: "interpretive" },
  map: { trail: "weather-and-navigation", tags: ["kind:map", "layer:context"], claim: "cartographic" },
  theme: { trail: "fate-and-agency", tags: ["kind:theme", "layer:theme"], claim: "interpretive" },
  "difficult-material": { trail: "race-empire-global-crew", tags: ["kind:difficult-material", "layer:context", "review:difficult-material"], claim: "difficult-material" }
};

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 56);
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9'⁠-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findExact(text, requested) {
  const requestedNorm = normalize(requested);
  const tokens = [];
  const re = /[A-Za-z][A-Za-z'’⁠-]*/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  for (let size = 3; size <= 9; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const window = tokens.slice(index, index + size);
      const phrase = window.map((token) => token.text).join(" ");
      if (normalize(phrase) === requestedNorm) return text.slice(window[0].start, window.at(-1).end);
    }
  }
  return null;
}

function makeAnnotation(unitId, exact, kind, note) {
  const profile = profiles[kind] ?? profiles.theme;
  const difficult = kind === "difficult-material";
  return {
    id: `subagent-curated-${slug(unitId)}-${slug(exact)}`,
    unit_id: unitId,
    kind,
    selector: {
      type: "TextQuoteSelector",
      exact
    },
    display: {
      depth: difficult ? "teacher" : "study",
      priority: difficult ? 2 : 3,
      inline: !difficult,
      surfaces: difficult ? ["teacher", "review"] : ["reader", "trail", "index", "search", "review"],
      spoiler_level: difficult ? "teacher-only" : "none"
    },
    anchor: exact,
    note,
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
        validation: difficult ? ["selector-resolves", "tone-review", "needs-review"] : ["selector-resolves", "needs-review"]
      }
    ],
    citations: ["standard-ebooks-moby-dick"],
    provenance: {
      author: "codex",
      created: "2026-06-07",
      method: "subagent-draft"
    },
    status: {
      content_status: difficult ? "needs-review" : "draft",
      citation_status: "provisional",
      review_queue: difficult ? ["citation", "tone", "difficult-material", "source-check"] : ["citation", "interpretive", "source-check"]
    }
  };
}

const existingAnchors = new Set(annotations.annotations.map((annotation) => `${annotation.unit_id}\t${normalize(annotation.anchor ?? "")}`));
let added = 0;
const skipped = [];

for (const [unitId, requestedExact, kind, note] of candidates) {
  const text = unitsById.get(unitId)?.plain_text ?? "";
  const exact = findExact(text, requestedExact);
  if (!exact) {
    skipped.push({ unitId, exact: requestedExact, reason: "anchor-not-found" });
    continue;
  }
  const key = `${unitId}\t${normalize(exact)}`;
  if (existingAnchors.has(key)) {
    skipped.push({ unitId, exact, reason: "duplicate-anchor" });
    continue;
  }
  annotations.annotations.push(makeAnnotation(unitId, exact, kind, note));
  existingAnchors.add(key);
  added += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ added, skipped }, null, 2));
