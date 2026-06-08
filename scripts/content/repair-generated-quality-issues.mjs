import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGuideData } from "../../src/lib/guide-data.js";

const repoRoot = process.cwd();
const annotationsPath = path.join(repoRoot, "data", "annotations", "moby-dick.annotations.json");

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

const repairs = {
  "teacher-review-frontmatter-imprint": {
    anchor: "This particular ebook is based on",
    note: "Teacher review: use the imprint to show students that editions have source chains. This guide depends on Standard Ebooks, Project Gutenberg, Internet Archive scans, and public-domain/CC0 licensing choices."
  },
  "whole-book-density-frontmatter-imprint-2": {
    anchor: "The source text and artwork in this ebook",
    note: "The imprint separates the public-domain source text from the edition work around it. That distinction matters for a project that keeps Melville's text intact while adding metadata."
  },
  "whole-book-density-frontmatter-imprint-3": {
    anchor: "Standard Ebooks is a volunteer-driven project",
    note: "The imprint frames the edition as volunteer public-literature work. It gives students a quick view of how a modern digital edition reaches them."
  },
  "teacher-review-frontmatter-etymology": {
    anchor: "While you take in hand to school others",
    note: "Teacher review: the etymology section is comic scholarship. Use it to prepare students for a book that chases the whale through dictionaries, languages, jokes, and uncertainty."
  },
  "teacher-review-frontmatter-extracts": {
    anchor: "higgledy-piggledy whale statements",
    note: "Teacher review: the Extracts are an archive collage, not a plot preface. Ask students why Melville begins with many voices about whales before Ishmael's own voice takes over."
  },
  "difficult-review-frontmatter-extracts": {
    note: "The phrase around `savages` uses colonial classification language. The guide should name that frame directly and keep students from treating the label as neutral evidence."
  },
  "teacher-review-chapter-001-loomings": {
    anchor: "This is my substitute for pistol and ball",
    note: "Teacher review: this opening makes Ishmael's voice comic and dangerous at once. Keep the discussion grounded in despair, escape, and the way humor controls a dark confession."
  },
  "whole-book-density-chapter-001-loomings-3": {
    anchor: "With a philosophical flourish Cato throws himself upon his sword",
    note: "Ishmael's classical joke sits beside suicidal language. The sentence shows how the chapter mixes learning, comedy, and real psychological pressure."
  },
  "teacher-review-chapter-002-the-carpetbag": {
    anchor: "duly arrived in New Bedford",
    note: "Teacher review: this chapter turns arrival into isolation. New Bedford first appears through cold, darkness, money pressure, and Ishmael's uncertain place in a strange town."
  },
  "difficult-review-chapter-002-the-carpetbag": {
    note: "The phrase `negro church` uses period racial language while Ishmael describes a cold, segregated-feeling city scene. Flag the wording and ask what social world the travel episode exposes."
  },
  "teacher-review-chapter-003-the-spouter-inn": {
    anchor: "Such unaccountable masses of shades and shadows",
    note: "Teacher review: begin with the inn painting before the bed-sharing comedy. The chapter teaches students how Ishmael interprets confusing signs before he interprets Queequeg."
  },
  "whole-book-density-chapter-003-the-spouter-inn-3": {
    anchor: "what most puzzled and confounded you",
    note: "The Spouter-Inn painting trains readers to live with uncertainty. Ishmael's effort to read the image anticipates his later effort to read whales, omens, and people."
  },
  "teacher-review-chapter-013-wheelbarrow": {
    anchor: "away we went down to the Moss",
    note: "Teacher review: this travel chapter tests Ishmael and Queequeg's public friendship. The wheelbarrow comedy gives way to Queequeg's composure and practical courage."
  },
  "whole-book-density-chapter-013-wheelbarrow-3": {
    anchor: "Queequeg now and then stopping to adjust",
    note: "Queequeg's harpoon remains visible even in a comic travel scene. The detail keeps his whaling identity present before the shipboard plot begins."
  },
  "teacher-review-chapter-033-the-specksnyder": {
    anchor: "Specksnyder or Chief Harpooneer reigned supreme",
    note: "Teacher review: this chapter is about authority structures inside whaling. Use the Specksnyder to show that ship hierarchy changes when hunting skill becomes central."
  },
  "teacher-review-chapter-047-the-mat-maker": {
    anchor: "the intermitting dull sound of the sword",
    note: "Teacher review: make students track how ordinary mat-making becomes a fate image. The chapter's calm rhythm matters because it breaks just before action resumes."
  },
  "teacher-review-chapter-053-the-gam": {
    anchor: "the peculiar usages of whaling-vessels when meeting each other",
    note: "Teacher review: teach the gam as a social custom and information network. Ahab's refusal of ordinary exchange reveals how narrow his purpose has become."
  },
  "teacher-review-chapter-061-stubb-kills-a-whale": {
    anchor: "Suddenly bubbles seemed bursting beneath my closed eyes",
    note: "Teacher review: this chapter moves from dreamlike calm to killing. Keep the moral discomfort visible after students understand the technical action."
  },
  "teacher-review-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him": {
    anchor: "Tall spouts were seen to leeward",
    note: "Teacher review: separate the practical hunt from the symbolic head-balancing logic. The chapter shows work, superstition, and comic talk operating together."
  },
  "whole-book-density-chapter-043-hark-2": {
    anchor: "only broken by the occasional flap of a sail",
    note: "The quiet soundscape makes the hidden noise more theatrical. Melville builds suspense through tiny interruptions rather than explanation."
  },
  "whole-book-density-chapter-043-hark-3": {
    anchor: "There again⁠—there it is!",
    note: "The repeated whisper turns suspicion into stage action. The chapter lets overheard speech reveal what the official ship order hides."
  },
  "whole-book-density-chapter-049-the-hyena-2": {
    anchor: "a vast practical joke",
    note: "Ishmael's comedy is a response to danger, not a denial of it. The phrase gives students a handle for his survival style."
  },
  "whole-book-density-chapter-049-the-hyena-3": {
    anchor: "There is nothing like the perils of whaling",
    note: "The chapter makes whaling danger produce a strange philosophy. Ishmael's joke becomes a way to live with fear."
  },
  "teacher-review-chapter-082-the-honor-and-glory-of-whaling": {
    anchor: "a careful disorderliness is the true method",
    note: "Teacher review: this phrase is Ishmael's defense of his own method. Use it to discuss how the book's wandering structure can still be purposeful."
  },
  "teacher-review-chapter-100-leg-and-arm": {
    anchor: "one empty arm of this jacket streamed behind him",
    note: "Teacher review: compare Boomer's missing arm with Ahab's missing leg. The gam becomes a mirror scene about injury, adaptation, and obsession."
  },
  "teacher-review-chapter-111-the-pacific": {
    anchor: "Potters’ Fields of all four continents",
    note: "Teacher review: do not let the chapter's calm become simple peace. The Pacific is serene, but Ishmael also imagines it as a burial ground."
  },
  "teacher-review-chapter-128-the-pequod-meets-the-rachel": {
    anchor: "Have ye seen a whaleboat adrift?",
    note: "Teacher review: center the ethical refusal. The Rachel asks for help finding missing children, and Ahab chooses the private chase instead."
  }
};

const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
let repaired = 0;
const skipped = [];

for (const annotation of annotations.annotations) {
  const repair = repairs[annotation.id];
  if (!repair) continue;
  const unit = unitsById.get(annotation.unit_id);
  if (repair.anchor) {
    if (!unit?.plain_text.includes(repair.anchor)) {
      skipped.push(`${annotation.id}: replacement anchor not found`);
      continue;
    }
    annotation.anchor = repair.anchor;
    annotation.selector = { type: "TextQuoteSelector", exact: repair.anchor };
  }
  annotation.note = repair.note;
  repaired += 1;
}

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify({ annotations: annotations.annotations }, null, 2))}\n`);

console.log(`Repaired ${repaired} generated quality issues.`);
if (skipped.length) {
  console.warn(`Skipped ${skipped.length} repairs:`);
  for (const item of skipped) console.warn(`- ${item}`);
}
