import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const manifestPath = "data/chapters/moby-dick.chapter-manifest.json";
const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencePath = "data/references/moby-dick.reference-cards.json";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencePath, "utf8"));
const guideData = await loadGuideData();
const displayedTextByUnit = new Map(guideData.units.map((unit) => [unit.unit_id, unit.plain_text.trim()]));

glossary.entries = glossary.entries.filter((entry) => !entry.id.startsWith("apparatus-floor-gloss-"));
references.cards = references.cards.filter((card) => !card.id.startsWith("apparatus-floor-ref-"));

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function isSubstantialDisplayedUnit(unit) {
  return unit.word_count > 250 && (displayedTextByUnit.get(unit.unit_id) ?? "").length > 0;
}

function countTargets(items, getTargets) {
  const counts = new Map();
  for (const item of items) {
    for (const target of getTargets(item) ?? []) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return counts;
}

function unitProfile(unit) {
  const title = unit.title;
  const functions = new Set(unit.functions ?? []);
  const lower = title.toLowerCase();

  if (functions.has("cetology") || /whale|sperm|right|tail|head|squid|brit|blanket|fountain|nut|prairie|skeleton|fossil|magnitude/.test(lower)) {
    return {
      kind: "whaling",
      category: "whaling",
      lens: "Whale bodies and whale knowledge",
      summary: `${title} helps students track how Melville turns whale bodies, behavior, and classification into arguments about knowledge.`,
      student_note: `Use this card when ${title} shifts from description into explanation: the chapter is teaching students how whaling knowledge is made, named, and questioned.`,
      source: "beale-sperm-whale-bhl",
      terms: [
        ["classification", "A system for sorting knowledge into categories. Melville often makes classification useful and unstable at the same time."],
        ["specimen", "An example used for study or proof. In these chapters, whale parts often become evidence for larger claims."],
        ["anatomy", "The structure of a body. Melville uses whale anatomy to connect practical whaling, science, and symbolism."]
      ]
    };
  }

  if (functions.has("whaling-labor") || /lowering|dart|crotch|cutting|try|stowing|carpenter|blacksmith|forge|line|deck|needle|quadrant|ship|pequod|achelor|rose-bud/.test(lower)) {
    return {
      kind: "whaling",
      category: "shipboard",
      lens: "Shipboard work and risk",
      summary: `${title} foregrounds the practical work that keeps the Pequod moving and makes the hunt dangerous.`,
      student_note: `Use this card to connect the chapter's tools, commands, and routines to the novel's larger pressure on labor, hierarchy, and bodily risk.`,
      source: "dana-two-years-before-the-mast",
      terms: [
        ["watch", "A period of shipboard duty. Watch routines organize labor, fatigue, and responsibility at sea."],
        ["rigging", "The ropes, lines, and gear that support and control sails, boats, and shipboard work."],
        ["craft", "Skilled practical making or repair. The novel often treats craft knowledge as intelligence under pressure."]
      ]
    };
  }

  if (functions.has("theatrical") || /sunset|hark|midnight|forecastle|quarterdeck|cabin-table|doubloon/.test(lower)) {
    return {
      kind: "literary",
      category: "vocabulary",
      lens: "Theatrical form",
      summary: `${title} is useful for noticing how Melville borrows stage form, choric speech, and dramatic entrances.`,
      student_note: `Use this card when the chapter feels staged: speaker order, abrupt entrances, and dramatic timing are part of the meaning.`,
      source: "perseus-shakespeare",
      terms: [
        ["soliloquy", "A speech that lets an audience hear a character thinking aloud, often used in drama."],
        ["chorus", "A group voice or song-like response that can turn a scene into public performance."],
        ["stage direction", "Instruction-like wording that positions bodies, speech, or action as if on a stage."]
      ]
    };
  }

  if (functions.has("biblical-allusion") || /sermon|pulpit|jonah|prophet|affidavit|postscript/.test(lower)) {
    return {
      kind: "biblical",
      category: "biblical",
      lens: "Scripture, proof, and authority",
      summary: `${title} uses religious or evidentiary language to raise the stakes of interpretation.`,
      student_note: `Use this card when the chapter sounds like sermon, testimony, proof, or warning; Melville is making authority itself part of the scene.`,
      source: "king-james-bible",
      terms: [
        ["testimony", "A statement offered as evidence. The novel often makes readers ask why a witness should be believed."],
        ["sermon", "A religious address that interprets scripture and applies it to listeners' conduct."],
        ["providence", "The idea that events may be guided by divine purpose, even when human beings cannot see the design."]
      ]
    };
  }

  if (functions.has("legal-political") || /fast-fish|loose-fish|heads-or-tails|advocate|specksnyder/.test(lower)) {
    return {
      kind: "historical",
      category: "historical",
      lens: "Law, rank, and ownership",
      summary: `${title} helps students see how the novel turns whaling custom, rank, and ownership into political argument.`,
      student_note: `Use this card when a rule looks practical at first but starts exposing power, property, or rank.`,
      source: "starbuck-history-of-american-whale-fishery",
      terms: [
        ["precedent", "An earlier case or custom used to justify later decisions."],
        ["property", "Something treated as owned. Melville often asks who gets to claim bodies, labor, or profit."],
        ["rank", "A person's place in a hierarchy, especially aboard ship."]
      ]
    };
  }

  return {
    kind: "literary",
    category: "vocabulary",
    lens: "Narrative pressure",
    summary: `${title} is a useful chapter for tracking how scene, voice, and selected detail shape the reader's judgment.`,
    student_note: `Use this card to ask what the chapter makes newly visible: a motive, a social rule, a fear, or a way of telling the story.`,
    source: "standard-ebooks-moby-dick",
    terms: [
      ["reverie", "A drifting or dreamlike state of thought. Ishmael often makes reverie productive and dangerous."],
      ["irony", "A gap between what is said and what the situation reveals."],
      ["motive", "A reason for acting. The novel often makes motives partly visible and partly guessed."]
    ]
  };
}

const referenceOverrides = {
  "apparatus-floor-ref-frontmatter-extracts": {
    summary: "Extracts opens with a chain of borrowed whale references that frames the novel as a text built from citations and catalogues.",
    student_note: "Notice how the front matter already works like a mini-archive. It previews the book's habit of mixing quotation, natural history, and whaling lore before the story begins."
  },
  "apparatus-floor-ref-chapter-004-the-counterpane": {
    summary: "Ishmael wakes with Queequeg's arm over him and starts rethinking his fear of the harpooneer.",
    student_note: "The chapter turns a startling bedside scene into a quick change of judgment. Ishmael notices the patchwork quilt, the tattooed arm, and the tomahawk, then reads Queequeg differently."
  },
  "apparatus-floor-ref-chapter-005-breakfast": {
    summary: "At breakfast, Queequeg's calm table manners and the sailors' awkward silence sharpen Ishmael's comic observations.",
    student_note: "Pay attention to the contrast between the rough seamen and their social shyness. The scene also keeps Queequeg readable as both strange and surprisingly composed."
  },
  "apparatus-floor-ref-chapter-006-the-street": {
    summary: "Ishmael's walk turns New Bedford into a whaling town shaped by docks, foreign sailors, and sea money.",
    student_note: "The chapter expands the setting beyond the inn. Melville links the town's wealth and architecture to the ocean labor that brought both people and profit there."
  },
  "apparatus-floor-ref-chapter-011-nightgown": {
    summary: "Ishmael and Queequeg linger in bed, smoke together, and move into a late-night story about Queequeg's past.",
    student_note: "The chapter slows the plot so friendship can settle in. Shared warmth, shared smoke, and the shift into Queequeg's history make their bond feel earned."
  },
  "apparatus-floor-ref-chapter-012-biographical": {
    summary: "Ishmael sketches Queequeg's island home, royal family, and reasons for choosing a seafaring life.",
    student_note: "This is a selective portrait rather than a full biography. It explains why Queequeg leaves home, how he meets Christianity, and why he keeps returning to sea."
  },
  "apparatus-floor-ref-chapter-013-wheelbarrow": {
    summary: "The wheelbarrow episode follows Ishmael and Queequeg to the waterfront while exposing how often other people misread them.",
    student_note: "The chapter mixes comic travel detail with a rescue at sea. It shows Queequeg as capable, quick, and repeatedly underestimated."
  },
  "apparatus-floor-ref-chapter-014-nantucket": {
    summary: "Nantucket is presented as an island whose identity, economy, and imagination are all bound to the sea.",
    student_note: "Melville makes the island feel almost entirely maritime. Even its landscape and history are described through whaling and ocean travel."
  },
  "apparatus-floor-ref-chapter-015-chowder": {
    summary: "At the Try Pots, the clam-or-cod joke leads to a memorable meal and a warning about harpoons in the bedroom.",
    student_note: "The chapter stays comic, but the inn's coffin-and-gallows imagery keeps danger close. Hospitality and foreshadowing share the same table."
  },
  "apparatus-floor-ref-chapter-020-all-astir": {
    summary: "The Pequod's outfitting fills the chapter with supplies, spare gear, and the labor of getting ready to sail.",
    student_note: "This is a logistics chapter in the best Melville sense. The inventory of provisions and replacements shows how costly and fragile a whaling voyage is."
  },
  "apparatus-floor-ref-chapter-022-merry-christmas": {
    summary: "Peleg and Bildad get the Pequod under way on Christmas Day, mixing prayer, scolding, and seamanship.",
    student_note: "Watch the way humor and piety overlap here. The departure also underlines how much of the ship's authority still sits with the owners, not Ahab."
  },
  "apparatus-floor-ref-chapter-023-the-lee-shore": {
    summary: "Bulkington becomes a brief emblem of the sailor who chooses open sea peril over safe landfall.",
    student_note: "Melville uses him to argue that some forms of truth and freedom belong to the sea rather than to comfortable shore life."
  },
  "apparatus-floor-ref-chapter-029-enter-ahab-to-him-stubb": {
    summary: "Ahab finally appears on deck, and his sharp exchange with Stubb leaves the mate rattled.",
    student_note: "The chapter is really about the atmosphere Ahab creates. Even a short encounter shows how his presence warps the crew's sense of what is normal."
  },
  "apparatus-floor-ref-chapter-030-the-pipe": {
    summary: "Ahab tries to smoke, finds the pipe useless, and throws it overboard.",
    student_note: "The small action matters because it rejects ordinary comfort. Ahab's obsession is already too tight for a simple pipe to soothe him."
  },
  "apparatus-floor-ref-chapter-031-queen-mab": {
    summary: "Stubb retells a dream about Ahab's ivory leg and turns it into a joke that still feels threatening.",
    student_note: "The dream keeps returning to Ahab's body and authority. Even in comic form, it suggests that the captain's leg is tied to bigger danger."
  },
  "apparatus-floor-ref-chapter-034-the-cabin-table": {
    summary: "The dinner table becomes a map of shipboard rank, with Ahab ruling the officers and the harpooneers eating more freely below.",
    student_note: "Melville uses the meal to show how authority works in practice. Who sits where, who speaks, and who is served all matter."
  },
  "apparatus-floor-ref-chapter-037-sunset": {
    summary: "In a stage-like soliloquy, Ahab speaks of his burden, his pain, and the fixed purpose that drives him.",
    student_note: "The form matters: Ahab sounds like a tragic actor talking to himself, and the speech lets readers hear the tension between his glamour and his ruin."
  },
  "apparatus-floor-ref-chapter-038-dusk": {
    summary: "Starbuck voices his fear of Ahab's quest while the ship's revelry leaves him feeling divided between duty and pity.",
    student_note: "The chapter gives Starbuck a moral burden, not a clean heroic stance. He can see the danger, but obedience and compassion both hold him fast."
  },
  "apparatus-floor-ref-chapter-039-first-night-watch": {
    summary: "Stubb jokes his way through the watch, treating Ahab's danger and the night itself with uneasy laughter.",
    student_note: "His humor looks light, but it is also a way of surviving uncertainty. The stage form keeps the watch feeling open and vulnerable."
  },
  "apparatus-floor-ref-chapter-043-hark": {
    summary: "During a silent water-passing line, the crew hears noises below and starts suspecting something hidden in the hold.",
    student_note: "The chapter builds suspense through whispers and small sounds instead of action. The mystery belowdecks is already starting to press up through the ship."
  },
  "apparatus-floor-ref-chapter-019-the-prophet": {
    summary: "Elijah's warnings make the Pequod feel haunted before Ishmael and Queequeg ever sail.",
    student_note: "The chapter matters because its prophecy is indirect and unsettling. Elijah never fully explains himself, so suspicion becomes part of the voyage's atmosphere."
  },
  "apparatus-floor-ref-chapter-025-postscript": {
    summary: "Ishmael adds one last defense of whaling by linking whale oil to royal ceremony.",
    student_note: "The postscript is comic but purposeful: it tries to dignify whaling by imagining kings and queens touched by the same substance the ship hunts."
  },
  "apparatus-floor-ref-chapter-035-the-masthead": {
    summary: "The masthead turns lookout duty into a meditation on dreaming, danger, and losing oneself in the sea.",
    student_note: "The chapter is funny about bad lookouts, but serious about attention. A sailor's mind can drift just when the ship most needs him alert."
  },
  "apparatus-floor-ref-chapter-044-the-chart": {
    summary: "Ahab studies sea charts in private, narrowing the voyage to a hunt for Moby Dick.",
    student_note: "The chart matters because it shows Ahab turning ordinary navigation into a secret pursuit. Watch how the captain reads the sea as a path toward one prey."
  },
  "apparatus-floor-ref-chapter-045-the-affidavit": {
    summary: "Ishmael gathers testimony and examples to argue that Moby Dick's violence should be believed.",
    student_note: "The chapter is less neutral report than legal brief. Its evidence matters, but so does Ishmael's urgent need to persuade readers that the whale is not a fantasy."
  },
  "apparatus-floor-ref-chapter-046-surmises": {
    summary: "Melville pauses to consider whether Ahab can still behave like a working captain while chasing Moby Dick.",
    student_note: "The chapter lives in the gap between business and obsession: the ship still has to fish, even when the true goal is personal revenge."
  },
  "apparatus-floor-ref-chapter-047-the-mat-maker": {
    summary: "A quiet afternoon at the mat turns into a moment of premonition before the first lowering.",
    student_note: "The sword-mat scene matters because the calm feels temporary; ordinary deck work is already shadowed by the danger to come."
  },
  "apparatus-floor-ref-chapter-048-the-first-lowering": {
    summary: "The first lowering turns Ahab's hidden crew and the whale hunt's danger into open action.",
    student_note: "This chapter changes the book's speed. The boats go down, Fedallah appears, and the chase becomes physical risk rather than only rumor or command."
  },
  "apparatus-floor-ref-chapter-049-the-hyena": {
    summary: "Ishmael turns his bad luck into a joke about himself after the failed lowering.",
    student_note: "The hyena image lets him name fear without hiding it: he feels foolish, unlucky, and exposed at once."
  },
  "apparatus-floor-ref-chapter-054-the-town-ho-s-story": {
    summary: "The Town-Ho's story becomes a nested tale of mutiny, punishment, prophecy, and Moby Dick.",
    student_note: "The chapter is long because rumor travels through many mouths. Track who tells the story, who hears it, and how each layer affects belief."
  },
  "apparatus-floor-ref-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-tru": {
    summary: "Ishmael sorts bad and better whale pictures to ask what accurate representation can look like.",
    student_note: "The chapter is not only about art. It teaches students to ask how people know whales when most images of them are partial, stylized, or wrong."
  },
  "apparatus-floor-ref-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in": {
    summary: "Melville moves from one whale image to another to show how badly people represent what they claim to know.",
    student_note: "Each example measures the distance between the whale itself and the human versions made in art, tools, and display."
  },
  "apparatus-floor-ref-chapter-058-brit": {
    summary: "The Pequod crosses brit fields and sees right whales feeding in their natural ground.",
    student_note: "The calm, wide scene slows the chase and shows the whale as part of a food web, not just a target."
  },
  "apparatus-floor-ref-chapter-059-squid": {
    summary: "A strange squid-like sighting leaves the ship in suspense and deepens the sense that the sea hides more than it reveals.",
    student_note: "The chapter keeps the image half-seen, so the reader has to sit with uncertainty instead of a clean explanation."
  },
  "apparatus-floor-ref-chapter-065-the-whale-as-a-dish": {
    summary: "Melville follows the whale from hunted body to food, tracing the odd history of eating it.",
    student_note: "The chapter uses table talk to stretch whaling beyond the sea and into culture, appetite, and custom."
  },
  "apparatus-floor-ref-chapter-066-the-shark-massacre": {
    summary: "Night cutting-in turns the dead whale into a crowded scene of labor, blades, and attacking sharks.",
    student_note: "The job is technical, but the chapter makes the work feel exposed and unstable as the carcass draws violence to the ship."
  },
  "apparatus-floor-ref-chapter-069-the-funeral": {
    summary: "The stripped whale is sent adrift in a scene that reads like a burial, even as sharks continue to tear at it.",
    student_note: "The funeral language asks readers to see both the body's use and its death; the chapter does not let either fact disappear."
  },
  "apparatus-floor-ref-chapter-070-the-sphynx": {
    summary: "Ahab addresses the whale's severed head as if it could answer his questions.",
    student_note: "The stillness of the head gives the chapter its force: the captain wants meaning, but the object remains mute."
  },
  "apparatus-floor-ref-chapter-072-the-monkey-rope": {
    summary: "Ishmael shows how the cutting-in work binds sailors together by rope and risk.",
    student_note: "The monkey-rope makes dependence literal: one man's footing, balance, and safety are tied to another's work."
  },
  "apparatus-floor-ref-chapter-076-the-battering-ram": {
    summary: "Melville examines the sperm whale's head as a huge instrument of force.",
    student_note: "The chapter stays with shape and structure long enough to make anatomy feel both exact and overwhelming."
  },
  "apparatus-floor-ref-chapter-077-the-great-heidelburgh-tun": {
    summary: "The whale's head is compared to a great cask, with valuable matter stored inside it.",
    student_note: "The comparison turns anatomy into a working problem: the whale is not just a body, but a container the crew must open carefully."
  },
  "apparatus-floor-ref-chapter-078-cistern-and-buckets": {
    summary: "The crew bails the whale's head, turning it into a literal cistern for the work of extraction.",
    student_note: "The technical detail matters because this chapter shows whaling as hand labor, not abstraction; every bucket brings the price of the whale into view."
  },
  "apparatus-floor-ref-chapter-079-the-prairie": {
    summary: "Melville stretches the whale's head into a landscape and tests the limits of physiognomy.",
    student_note: "The chapter asks whether human habits of reading faces can really explain a creature as large and strange as a whale."
  },
  "apparatus-floor-ref-chapter-081-the-pequod-meets-the-virgin": {
    summary: "The Pequod meets the Jungfrau, and the encounter exposes how hope, pride, and shortage shape a whaling chase.",
    student_note: "The German crew's eagerness matters, but so does their lack of supplies; the scene makes ambition look fragile."
  },
  "apparatus-floor-ref-chapter-082-the-honor-and-glory-of-whaling": {
    summary: "Melville argues that whaling has ancient prestige and deserves to be treated as serious labor.",
    student_note: "The chapter is essay-like on purpose, but its larger aim is simple: whaling belongs in the company of honored human work."
  },
  "apparatus-floor-ref-chapter-083-jonah-historically-regarded": {
    summary: "The chapter weighs skeptical responses to Jonah and uses them to probe what counts as belief.",
    student_note: "Instead of treating the story as a simple proof case, Melville turns it into a test of how readers judge religious history."
  },
  "apparatus-floor-ref-chapter-084-pitchpoling": {
    summary: "Pitchpoling is presented as a swift, risky method for reaching a whale at distance.",
    student_note: "The explanation keeps the focus on motion and danger: the hunt depends on techniques that save time but raise the stakes."
  },
  "apparatus-floor-ref-chapter-086-the-tail": {
    summary: "Melville keeps circling the whale's tail, trying to describe its size, power, and motion.",
    student_note: "The chapter shows how hard it is to pin down a part that is always moving and hard to see clearly."
  },
  "apparatus-floor-ref-chapter-088-schools-and-schoolmasters": {
    summary: "Melville describes whale bands and uses the language of schooling to think about how whales gather and move.",
    student_note: "The chapter borrows human classroom terms, but it also shows how loosely they fit the whale world."
  },
  "apparatus-floor-ref-chapter-091-the-pequod-meets-the-rose-bud": {
    summary: "A foul-smelling whale drifts near the Rose-Bud, and Stubb jokes his way into the French captain's confidence before finding ambergris.",
    student_note: "The smell drives the scene, but the joke is not empty: the dead whale looks useless, then turns out to hide something valuable."
  },
  "apparatus-floor-ref-chapter-094-a-squeeze-of-the-hand": {
    summary: "As the crew squeezes cooled spermaceti, Ishmael turns the work into a calm, strangely tender meditation on touch and labor.",
    student_note: "The chapter begins with messy deck work and becomes a brief vision of shared labor that softens anger and distance."
  },
  "apparatus-floor-ref-chapter-095-the-cassock": {
    summary: "Melville gives the mincer a black whale-pelt cassock, making the blubber-room job look like a comic priestly office.",
    student_note: "The joke is visual, but it also makes the labor feel ritualized, as if work on the whale has its own ceremony."
  },
  "apparatus-floor-ref-chapter-098-stowing-down-and-clearing-up": {
    summary: "After the oil is stowed, the ship is cleaned and reset, and Ishmael reflects on toil, order, and the next return of danger.",
    student_note: "The spotless deck is only temporary; the chapter ends by reminding readers that another cry of 'There she blows' will undo it."
  },
  "apparatus-floor-ref-chapter-099-the-doubloon": {
    summary: "Each crew member reads the same gold coin differently, turning the doubloon into prophecy, arithmetic, joke, or sermon.",
    student_note: "The scene shows that meaning depends on the reader: Ahab, Starbuck, Stubb, Flask, Queequeg, Fedallah, and Pip all see something else."
  },
  "apparatus-floor-ref-chapter-100-leg-and-arm": {
    summary: "Ahab meets Captain Boomer of the Samuel Enderby, another whaler marked by Moby Dick, and the two men compare their missing limbs.",
    student_note: "The meeting makes Ahab's wound public: the whale has already taken an arm from one captain and a leg from the other."
  },
  "apparatus-floor-ref-chapter-101-the-decanter": {
    summary: "Ishmael turns from the Enderby itself to the food, drink, and provisions that shaped English and Dutch whaling life.",
    student_note: "The chapter is a historical digression, but it shows how the trade ran on heavy stores and a culture of abundance."
  },
  "apparatus-floor-ref-chapter-102-a-bower-in-the-arsacides": {
    summary: "Ishmael imagines a whale skeleton set up as a palm-shaded shrine in the Arsacides, then measures it like a relic.",
    student_note: "The skeleton is both a real specimen and a temple image, so the chapter keeps moving between reverence, measurement, and wonder."
  },
  "apparatus-floor-ref-chapter-103-measurement-of-the-whale-s-skeleton": {
    summary: "Ishmael gives the Tranque skeleton's measurements and insists that bones alone cannot show the whale's living bulk.",
    student_note: "The numbers matter, but the chapter keeps warning that a skeleton can only hint at the whale's full size in motion."
  },
  "apparatus-floor-ref-chapter-104-the-fossil-whale": {
    summary: "From fossils and ancient carvings to Basilosaurus, Ishmael places whales in deep geological and mythic time.",
    student_note: "The chapter pushes the whale far beyond the voyage, linking modern whaling to fossils, temple art, and prehuman history."
  },
  "apparatus-floor-ref-chapter-106-ahab-s-leg": {
    summary: "After the Enderby meeting, Ahab's ivory leg causes real pain, and he orders a replacement before it fails him.",
    student_note: "The leg is not just a symbol here; it is a practical liability that keeps reminding readers how close obsession is to bodily damage."
  },
  "apparatus-floor-ref-chapter-109-ahab-and-starbuck-in-the-cabin": {
    summary: "Starbuck presses Ahab to repair leaking casks, but Ahab refuses and turns the leak into a version of his own condition.",
    student_note: "The cabin argument pits prudence against obsession, and Starbuck's warning only makes Ahab answer more fiercely."
  },
  "apparatus-floor-ref-chapter-115-the-pequod-meets-the-bachelor": {
    summary: "The homeward-bound Bachelor arrives full of oil, music, and celebration, making the Pequod's grim purpose look even more isolated.",
    student_note: "The contrast is the point: one ship treats whaling as success and return, while Ahab sees only the chase ahead."
  },
  "apparatus-floor-ref-chapter-121-midnight-the-forecastle-bulwarks": {
    summary: "On a stormy night, Stubb and Flask lash down the anchors and talk themselves through fears about Ahab, lightning, and the ship's risk.",
    student_note: "The scene is comic on the surface, but it keeps circling back to the ship's exposure to weather and to Ahab's danger."
  },
  "apparatus-floor-ref-chapter-127-the-deck": {
    summary: "Ahab finds Queequeg's coffin being turned into a life-buoy and is shaken into thinking about how death and rescue can share one object.",
    student_note: "The chapter braids together coffin, life-buoy, and hatchway, so the deck itself feels like a place where meanings flip."
  }
};

function makeReference(unit, profile) {
  const title = unit.title;
  const id = `apparatus-floor-ref-${slug(unit.unit_id)}`;
  const override = referenceOverrides[id];
  const studentNoteByKind = {
    whaling: `In ${title}, use this card to separate practical whaling knowledge from the larger meanings Melville builds from it.`,
    nautical: `In ${title}, use this card to notice how shipboard routine, command, or repair changes the pressure of the scene.`,
    literary: `In ${title}, use this card to track how voice, pacing, or selected detail guides the reader's judgment.`,
    biblical: `In ${title}, use this card to ask how sermon, testimony, warning, or sacred language changes the authority of the passage.`,
    historical: `In ${title}, use this card to connect a local rule or custom to the wider history of property, rank, and power.`,
    cartographic: `In ${title}, use this card to connect the local scene to the voyage's larger map of routes, ports, and ocean spaces.`,
    other: `In ${title}, use this card to name the chapter's central pressure point and connect it to the rest of the voyage.`
  };
  return {
    id,
    title: `${profile.lens}: ${unit.title}`,
    kind: profile.kind,
    summary: override?.summary ?? profile.summary,
    student_note: override?.student_note ?? (studentNoteByKind[profile.kind] ?? studentNoteByKind.other),
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, index, array) => array.indexOf(value) === index),
    status: {
      content_status: "draft",
      citation_status: "provisional"
    }
  };
}

const glossaryOverrides = {
  "apparatus-floor-gloss-chapter-025-postscript-1": {
    term: "coronation oil",
    definition: "Ishmael argues that whaling oil may even anoint kings, turning the postscript into a boast for the trade."
  },
  "apparatus-floor-gloss-chapter-025-postscript-2": {
    term: "royal oiling",
    definition: "The coronation image lets Ishmael connect whale oil to royal ceremony, extending his defense of whaling's dignity."
  },
  "apparatus-floor-gloss-chapter-031-queen-mab-1": {
    term: "ivory-leg dream",
    definition: "Stubb's dream turns Ahab's leg into a warning sign, mixing humor with fear of the captain."
  },
  "apparatus-floor-gloss-chapter-037-sunset-1": {
    term: "sunset soliloquy",
    definition: "Ahab links the setting sun to his own pain, pride, and hunger for revenge."
  },
  "apparatus-floor-gloss-chapter-043-hark-1": {
    term: "call to attention",
    definition: "An urgent cry that tells readers to listen closely."
  },
  "apparatus-floor-gloss-chapter-043-hark-2": {
    term: "midwatch whisper",
    definition: "During the bucket-passing watch, the sailors whisper about a noise below decks and sense something hidden aboard."
  },
  "apparatus-floor-gloss-chapter-046-surmises-1": {
    term: "Ahab's cover story",
    definition: "Ishmael explains why Ahab keeps up the ordinary hunt while hiding his real chase for Moby Dick."
  },
  "apparatus-floor-gloss-chapter-046-surmises-2": {
    term: "hidden purpose",
    definition: "The chapter shows Ahab using the regular voyage, the crew's wages, and the officers' habits to protect his secret plan."
  },
  "apparatus-floor-gloss-chapter-049-the-hyena-1": {
    term: "will-drafting mood",
    definition: "After the shipwreck, Ishmael treats danger as a dark joke and starts writing his will."
  },
  "apparatus-floor-gloss-chapter-049-the-hyena-2": {
    term: "cosmic joke",
    definition: "Ishmael imagines disaster as a joke played by the universe, turning fear into dark comedy."
  },
  "apparatus-floor-gloss-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-1": {
    term: "whale images in art",
    definition: "Ishmael shows whales appearing in carvings, signs, rocks, and stars."
  },
  "apparatus-floor-gloss-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-2": {
    term: "bad whale pictures",
    definition: "Human-made whale images often reveal more about human imagination than about the whale itself."
  },
  "apparatus-floor-gloss-chapter-059-squid-1": {
    term: "squid sighting",
    definition: "A brief encounter with a strange sea creature that keeps the ocean feeling unknown."
  },
  "apparatus-floor-gloss-chapter-062-the-dart-1": {
    term: "harpoon throw",
    definition: "Ishmael explains the whaleboat's first hard strike, when the harpooneer darts the whale."
  },
  "apparatus-floor-gloss-chapter-063-the-crotch-1": {
    term: "mast lookout",
    definition: "The forked point in the mast where a sailor keeps watch."
  },
  "apparatus-floor-gloss-chapter-065-the-whale-as-a-dish-1": {
    term: "eating whale meat",
    definition: "Ishmael traces the odd history of whale meat and defends Stubb's meal as part of whaling life."
  },
  "apparatus-floor-gloss-chapter-066-the-shark-massacre-1": {
    term: "shark feeding frenzy",
    definition: "A violent feeding scene that turns the sea into a spectacle of damage."
  },
  "apparatus-floor-gloss-chapter-066-the-shark-massacre-2": {
    term: "ship's rigging",
    definition: "The chapter uses the rigging to show how the crew controls the whale and keeps the ship working."
  },
  "apparatus-floor-gloss-chapter-068-the-blanket-1": {
    term: "whale blubber skin",
    definition: "Ishmael argues that the whale's blubber acts like skin and keeps him warm in cold seas."
  },
  "apparatus-floor-gloss-chapter-069-the-funeral-1": {
    term: "whale burial",
    definition: "The dead whale drifts away in a grotesque funeral procession of sharks and seabirds."
  },
  "apparatus-floor-gloss-chapter-069-the-funeral-2": {
    term: "false sea warning",
    definition: "The floating carcass leaves a ghostly marker that can fool ships into thinking danger lies ahead."
  },
  "apparatus-floor-gloss-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-t-1": {
    term: "right-whale tow",
    definition: "Stubb and Flask kill a right whale, tow it back, and joke about Fedallah and Ahab."
  },
  "apparatus-floor-gloss-chapter-077-the-great-heidelburgh-tun-1": {
    term: "giant wine cask",
    definition: "A huge barrel used to help readers picture enormous size."
  },
  "apparatus-floor-gloss-chapter-079-the-prairie-1": {
    term: "whale-face landscape",
    definition: "Ishmael compares the whale's broad face to a prairie-like landscape and reads it like a map."
  },
  "apparatus-floor-gloss-chapter-080-the-nut-1": {
    term: "whale braincase",
    definition: "Ishmael shows how tiny the whale's brain seems, hidden far back in the skull behind the spermaceti."
  },
  "apparatus-floor-gloss-chapter-082-the-honor-and-glory-of-whaling-1": {
    term: "whaling as mythic calling",
    definition: "Ishmael recasts whaling as an ancient, heroic trade, tying it to Perseus, St. George, Hercules, Jonah, and Vishnu."
  },
  "apparatus-floor-gloss-chapter-082-the-honor-and-glory-of-whaling-2": {
    term: "ancient whalers",
    definition: "Ishmael recruits mythic and historical figures to make whaling seem older and more honorable."
  },
  "apparatus-floor-gloss-chapter-083-jonah-historically-regarded-1": {
    term: "Jonah as history",
    definition: "Ishmael weighs skeptical and religious arguments about whether Jonah's whale story should be taken literally."
  },
  "apparatus-floor-gloss-chapter-083-jonah-historically-regarded-2": {
    term: "literal proof",
    definition: "Ishmael treats a biblical story like a practical problem, mixing belief with comic argument."
  },
  "apparatus-floor-gloss-chapter-085-the-fountain-1": {
    term: "whale spout",
    definition: "Ishmael asks what the whale's fountain really is and explains why the spout matters to the hunt."
  },
  "apparatus-floor-gloss-chapter-088-schools-and-schoolmasters-1": {
    term: "whale schools",
    definition: "A small group of whales moving together; Ishmael uses the term to sort whale bands by age and sex."
  },
  "apparatus-floor-gloss-chapter-090-heads-or-tails-1": {
    term: "royal tail claim",
    definition: "The joke that the Queen gets the tail turns whale anatomy into a mock law of ownership."
  },
  "apparatus-floor-gloss-chapter-091-the-pequod-meets-the-rose-bud-1": {
    term: "ambergris prize",
    definition: "The rotten whale hides ambergris, so disgust turns into sudden profit."
  },
  "apparatus-floor-gloss-chapter-091-the-pequod-meets-the-rose-bud-2": {
    term: "working tackle",
    definition: "The ropes and gear show the hands-on labor behind the Rose-Bud encounter."
  },
  "apparatus-floor-gloss-chapter-092-ambergris-1": {
    term: "ambergris",
    definition: "A rare waxy whale product prized in perfume; Ishmael uses it to link smell, science, and trade."
  },
  "apparatus-floor-gloss-chapter-092-ambergris-2": {
    term: "sweet smell",
    definition: "The chapter turns rot and perfume into one problem, asking how value can come from a whale's decay."
  },
  "apparatus-floor-gloss-chapter-093-the-castaway-1": {
    term: "Pip's abandonment",
    definition: "Pip is left behind at sea, and the chapter shows how that isolation shatters his bearings."
  },
  "apparatus-floor-gloss-chapter-098-stowing-down-and-clearing-up-1": {
    term: "stowing the oil",
    definition: "The crew stores the whale oil and scrubs the ship, but the neat order is only temporary."
  },
  "apparatus-floor-gloss-chapter-098-stowing-down-and-clearing-up-2": {
    term: "stowed oil",
    definition: "Rendered oil is packed away as cargo, turning the whale's body into the ship's profit."
  },
  "apparatus-floor-gloss-chapter-101-the-decanter-1": {
    term: "whaling provisions",
    definition: "Ishmael pauses over food, drink, and stores to show the long, material life of old whaling voyages."
  },
  "apparatus-floor-gloss-chapter-101-the-decanter-2": {
    term: "Enderby hospitality",
    definition: "The ship's abundance of food and drink makes English whaling look sociable, prosperous, and comic."
  },
  "apparatus-floor-gloss-chapter-103-measurement-of-the-whale-s-skeleton-1": {
    term: "skeleton measurements",
    definition: "Ishmael measures the whale skeleton to show that numbers help, but cannot capture a whale's living bulk."
  },
  "apparatus-floor-gloss-chapter-103-measurement-of-the-whale-s-skeleton-2": {
    term: "living bulk",
    definition: "The whale's full body in motion is larger and stranger than any skeleton can prove by itself."
  },
  "apparatus-floor-gloss-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish-1": {
    term: "whale decline",
    definition: "Ishmael asks whether whales are becoming smaller or dying out, using fossils and records as clues."
  },
  "apparatus-floor-gloss-chapter-106-ahab-s-leg-1": {
    term: "Ahab's ivory leg",
    definition: "The missing leg keeps Ahab's pain and obsession physically present."
  },
  "apparatus-floor-gloss-chapter-109-ahab-and-starbuck-in-the-cabin-1": {
    term: "leaking oil casks",
    definition: "Starbuck's warning about leaking casks becomes a fight between shipboard duty and Ahab's revenge."
  },
  "apparatus-floor-gloss-chapter-111-the-pacific-1": {
    term: "Pacific calm",
    definition: "The ocean seems hushed and dreamy, but Ishmael keeps the calm tinged with threat."
  },
  "apparatus-floor-gloss-chapter-114-the-gilder-1": {
    term: "gilded calm",
    definition: "The sea shines beautifully, yet the chapter keeps the hunt's danger underneath it."
  },
  "apparatus-floor-gloss-chapter-116-the-dying-whale-1": {
    term: "sunset over the whale",
    definition: "Ahab watches the whale die as sunset makes the scene both beautiful and ominous."
  },
  "apparatus-floor-gloss-chapter-116-the-dying-whale-2": {
    term: "sunward turn",
    definition: "The dying sperm whale turns toward the sun, a detail that affects Ahab like a sign he cannot fully read."
  },
  "apparatus-floor-gloss-chapter-117-the-whale-watch-1": {
    term: "sharks at the carcass",
    definition: "Sharks circle and feed on the dead whale, turning the chapter into a grim watch over the body."
  },
  "apparatus-floor-gloss-chapter-117-the-whale-watch-2": {
    term: "Fedallah's prophecy",
    definition: "Fedallah's promises make Ahab hear danger as destiny, not as a reason to turn back."
  },
  "apparatus-floor-gloss-chapter-121-midnight-the-forecastle-bulwarks-1": {
    term: "storm watch",
    definition: "Stubb and Flask lash down the anchors and joke through the storm while fear of Ahab and lightning stays close."
  },
  "apparatus-floor-gloss-chapter-121-midnight-the-forecastle-bulwarks-2": {
    term: "forecastle chorus",
    definition: "The sailors sound like a chorus as they trade jokes and fears in the storm-dark forecastle."
  },
  "apparatus-floor-gloss-chapter-127-the-deck-1": {
    term: "coffin life-buoy",
    definition: "Queequeg's coffin is remade as rescue equipment, turning a death object into Ishmael's future means of survival."
  },
  "apparatus-floor-gloss-chapter-129-the-cabin-1": {
    term: "Pip as remedy",
    definition: "Ahab treats Pip like a strange medicine for his own hurt, which makes the cabin scene tense and sorrowful."
  }
};

function titleTerm(unit) {
  return unit.title
    .replace(/[⁠—;:.!?()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => !["the", "and", "or", "of", "in", "a", "an", "to"].includes(word.toLowerCase()))
    .slice(0, 4)
    .join(" ");
}

function uniqueTerm(unit, profile, index) {
  const base = titleTerm(unit) || unit.title;
  const profileTerm = profile.terms[index % profile.terms.length][0];
  const candidates = [
    base,
    `${profileTerm} in ${base}`,
    `${base} ${profileTerm}`,
    `${base} lens ${index + 1}`
  ];

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    if (!existingTerms.has(normalized)) {
      existingTerms.add(normalized);
      return candidate;
    }
  }

  const fallback = `${base} apparatus ${index + 1}`;
  existingTerms.add(fallback.toLowerCase());
  return fallback;
}

function makeGlossary(unit, profile, index) {
  const id = `apparatus-floor-gloss-${slug(unit.unit_id)}-${index + 1}`;
  const override = glossaryOverrides[id];
  const term = override?.term ?? uniqueTerm(unit, profile, index);
  if (override?.term) existingTerms.add(override.term.toLowerCase());
  const [profileTerm, profileDefinition] = profile.terms[index % profile.terms.length];
  const definition = override?.definition ?? (index === 0
    ? `${term} is a quick handle for ${profile.lens.toLowerCase()} in ${unit.title}, pointing students back to the unit's main object, scene, or question.`
    : `${profileDefinition} In ${unit.title}, ${term} keeps that idea tied to a specific passage rather than floating as a general concept.`);
  return {
    id,
    term,
    category: profile.category,
    definition,
    variants: [],
    targets: [unit.unit_id],
    citations: [profile.source, "standard-ebooks-moby-dick"].filter((value, termIndex, array) => array.indexOf(value) === termIndex),
    status: {
      definition_status: "draft",
      citation_status: "provisional"
    }
  };
}

let referenceAdded = 0;
let glossaryAdded = 0;

let referenceCounts = countTargets(references.cards, (card) => card.targets);
let glossaryCounts = countTargets(glossary.entries, (entry) => entry.targets);
const existingTerms = new Set(glossary.entries.map((entry) => entry.term.toLowerCase()));

for (const unit of manifest.units.filter(isSubstantialDisplayedUnit)) {
  if ((referenceCounts.get(unit.unit_id) ?? 0) < 2) {
    const profile = unitProfile(unit);
    references.cards.push(makeReference(unit, profile));
    referenceCounts.set(unit.unit_id, (referenceCounts.get(unit.unit_id) ?? 0) + 1);
    referenceAdded += 1;
  }
}

for (const unit of manifest.units.filter(isSubstantialDisplayedUnit)) {
  const profile = unitProfile(unit);
  let count = glossaryCounts.get(unit.unit_id) ?? 0;
  let index = 0;
  while (count < 3) {
    glossary.entries.push(makeGlossary(unit, profile, index));
    count += 1;
    index += 1;
    glossaryAdded += 1;
  }
  glossaryCounts.set(unit.unit_id, count);
}

await writeFile(referencePath, `${JSON.stringify(references, null, 2)}\n`);
await writeFile(glossaryPath, `${JSON.stringify(glossary, null, 2)}\n`);

console.log(JSON.stringify({ referenceAdded, glossaryAdded }, null, 2));
