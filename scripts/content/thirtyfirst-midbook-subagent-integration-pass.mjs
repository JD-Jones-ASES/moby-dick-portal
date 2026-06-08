import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));

annotations.annotations = annotations.annotations.filter(
  (annotation) => !annotation.tags?.includes("provenance:midbook-subagent-pass")
);

const candidates = [
  ["chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars", "skrimshander articles", "form", "This points to sailors' carved art, so the chapter is also about whalemen turning scraps of bone and tooth into their own record of the voyage."],
  ["chapter-058-brit", "sprinkling or mistifying pots", "context", "Melville starts from whale feeding and turns it into a picture of the whole sea as a living, moving system."],
  ["chapter-059-squid", "the great live squid", "context", "The squid shows the ocean food chain in action and reminds readers that the whale hunt sits inside a much stranger marine world."],
  ["chapter-061-stubb-kills-a-whale", "a portly burgher smoking his pipe of a warm afternoon", "form", "This comic simile makes the whale look almost domestic for a second, which makes the sudden violence of the hunt feel sharper."],
  ["chapter-064-stubb-s-supper", "like many old blacks", "difficult-material", "Melville uses racist shorthand here to describe Fleece's body, so students should read the phrase as period prejudice rather than neutral description."],
  ["chapter-065-the-whale-as-a-dish", "the whale would by all hands be considered a noble dish", "context", "Ishmael is showing that taste is cultural, not natural, and that whale meat can be framed as food rather than only as a dead animal."],
  ["chapter-066-the-shark-massacre", "Ex officio professors of Sabbath breaking are all whalemen", "context", "The line twists religious language into irony, showing how whaling life collides with Sabbath ideas and moral rules."],
  ["chapter-067-cutting-in", "ten thousand red oxen to the sea gods", "form", "Cutting in is described like a sacrifice, which makes industrial labor feel ritualized and almost ceremonial."],
  ["chapter-068-the-blanket", "I have several such dried bits", "form", "Ishmael is acting like a collector and archivist here, turning whale material into evidence for reading and remembering."],
  ["chapter-069-the-funeral", "There's your law of precedents", "theme", "This is Melville's warning that once a false story gets repeated, it can start to behave like official truth."],
  ["chapter-070-the-sphynx", "where unrecorded names and navies rust", "theme", "The head becomes a memorial to forgotten lives, so Ahab's questions open onto a much larger history of death at sea."],
  ["chapter-072-the-monkey-rope", "an elongated Siamese ligature united us", "theme", "The rope makes Ishmael and Queequeg physically dependent on each other, turning friendship into a literal survival system."],
  ["chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him", "shark well goberned", "teacher-note", "Fleece's sermon flips the shark into a moral example, so the chapter becomes a strange lesson in appetite, self-control, and public speech."],
  ["chapter-074-the-sperm-whale-s-head-contrasted-view", "grey-headed whale", "context", "Ishmael treats age as visible knowledge here, so the head becomes a way of reading experience, not just anatomy."],
  ["chapter-075-the-right-whale-s-head-contrasted-view", "the Greenlanders call the", "context", "The chapter shows that whalemen name the same body part differently, depending on where and how they work."],
  ["chapter-076-the-battering-ram", "paved with horses' hoofs", "context", "This image helps students see the whale's head as armor, not softness, and explains why the animal can take such punishment."],
  ["chapter-077-the-great-heidelburgh-tun", "the great Heidelburgh Tun of the Sperm Whale", "context", "Melville turns the whale into a storage vessel for wealth, so anatomy and profit start to look like the same thing."],
  ["chapter-078-cistern-and-buckets", "the deep cistern will yield no more", "context", "The head is treated like a well, which makes the extraction of oil feel both technical and absurdly intimate."],
  ["chapter-079-the-prairie", "I rejoice in my spine", "theme", "Ishmael is using pseudo-science to talk about himself, so the chapter also becomes a small self-portrait."],
  ["chapter-080-the-nut", "wears a false brow to the common world", "theme", "The point is that the whale's outward appearance hides its real power, which is a habit the novel keeps teaching readers to notice."],
  ["chapter-081-the-pequod-meets-the-virgin", "a clean one", "context", "The joke about a ship being clean is really about oil shortage, so the scene makes whaling economy feel immediate and practical."],
  ["chapter-082-the-honor-and-glory-of-whaling", "Those were the knightly days of our profession", "context", "Ishmael is deliberately inflating whaling into epic history here, which shows how hard he works to dignify the trade."],
  ["chapter-083-jonah-historically-regarded", "a couple of whist-tables", "context", "This is one of Melville's funniest literal readings of Jonah's problem, turning a biblical argument into a room-size puzzle."],
  ["chapter-084-pitchpoling", "all fountains must run wine today", "form", "Stubb's brag turns the strike into holiday language, letting the chapter mix skill, excess, and comic bravado."],
  ["chapter-085-the-fountain", "one seventh or Sunday of his time", "context", "Ishmael measures whale breathing against human rhythms, which makes the biology feel oddly familiar and strange at once."],
  ["chapter-086-the-tail", "Could annihilation occur to matter", "theme", "The tail is treated as concentrated destructive force, but the chapter also keeps admiring its beauty and grace."],
  ["chapter-087-the-grand-armada", "the straits of Sunda and Malacca", "context", "The geography matters here because the hunt is not local at all; it sits inside global routes, trade, and piracy."],
  ["chapter-088-schools-and-schoolmasters", "young vigorous males, or bulls", "context", "The chapter uses whale groupings to think about sex, age, and social order, not just animal classification."],
  ["chapter-089-fast-fish-and-loose-fish", "These laws might be engraven", "form", "Melville makes the legal code tiny on purpose, which is his way of mocking how huge and slippery the law can be."],
  ["chapter-090-heads-or-tails", "Ye tail is ye Queen's", "context", "The joke shows law dividing the whale by rank, not by biology, so ownership looks arbitrary and royal power looks absurdly hungry."]
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
}

function profileFor(kind) {
  if (kind === "form") {
    return { trail: "voice-and-performance", tags: ["kind:form", "layer:form"], claim: "interpretive", queue: ["citation", "interpretive", "source-check"] };
  }
  if (kind === "teacher-note") {
    return { trail: "whaling-labor", tags: ["kind:teacher-note", "layer:teacher"], claim: "interpretive", queue: ["citation", "teacher", "source-check"] };
  }
  if (kind === "difficult-material") {
    return { trail: "race-empire-global-crew", tags: ["kind:difficult-material", "layer:context", "review:difficult-material"], claim: "difficult-material", queue: ["citation", "difficult-material", "source-check", "tone"] };
  }
  if (kind === "theme") {
    return { trail: "evidence-and-belief", tags: ["kind:theme", "layer:theme"], claim: "interpretive", queue: ["citation", "interpretive", "source-check"] };
  }
  return { trail: "whaling-labor", tags: ["kind:context", "layer:context"], claim: "source-text-observation", queue: ["citation", "source-check"] };
}

function makeAnnotation(unitId, exact, kind, note) {
  const profile = profileFor(kind);
  const id = `subagent-midbook-${slug(unitId.replace(/^chapter-\d{3}-/, ""))}-${slug(exact)}`;
  const isTeacher = kind === "teacher-note";
  const keepOutOfInline = new Set(["chapter-067-cutting-in"]).has(unitId);
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
    tags: [...profile.tags, "provenance:midbook-subagent-pass"],
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
  const id = `subagent-midbook-${slug(unitId.replace(/^chapter-\d{3}-/, ""))}-${slug(exact)}`;
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
