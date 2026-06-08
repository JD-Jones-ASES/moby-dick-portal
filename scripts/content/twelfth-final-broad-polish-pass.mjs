import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "broad-apparatus-chapter-075-the-right-whale-s-head-contrasted-view-1": "The shoemaker's-last comparison makes right-whale anatomy ordinary and strange at once. Ishmael teaches students to picture the head through familiar objects.",
  "broad-apparatus-chapter-077-the-great-heidelburgh-tun-1": "The precious substance is valuable because it is localized and difficult to reach. The chapter turns anatomy into a problem of extraction.",
  "broad-apparatus-chapter-078-cistern-and-buckets-1": "The whip is a simple rig, but the work it enables is dangerous. Understanding the tool makes the accident that follows easier to follow.",
  "broad-apparatus-chapter-078-cistern-and-buckets-2": "The block and rope sequence slows the scene down into labor choreography. Every hand and fastening matters before Tashtego falls.",
  "broad-apparatus-chapter-079-the-prairie-1": "The phrenology reference is historical evidence of a discredited reading system. Ishmael borrows its language while also making whale interpretation look absurdly difficult.",
  "broad-apparatus-chapter-080-the-nut-1": "The skull measurement makes the whale's head feel architectural. Scale itself becomes part of the chapter's argument.",
  "broad-apparatus-chapter-081-the-pequod-meets-the-virgin-1": "The Virgin's captain approaches impatiently, making the gam comic before it becomes competitive. Ship meetings quickly become tests of pride.",
  "broad-apparatus-chapter-081-the-pequod-meets-the-virgin-2": "Starbuck's attention to the object in the captain's hand turns a small visual detail into the start of the chapter's bargaining and embarrassment.",
  "broad-apparatus-chapter-082-the-honor-and-glory-of-whaling-1": "Ishmael inflates whaling into chivalric history. The joke matters because it shows how hard he works to dignify the trade.",
  "broad-apparatus-chapter-083-jonah-historically-regarded-1": "Bishop Jebb's answer shows Ishmael treating biblical skepticism like a debate brief. The chapter turns faith, evidence, and argument into comic scholarship.",
  "broad-apparatus-chapter-084-pitchpoling-1": "Stubb's presentiment makes technique feel ominous. Even a practical hunting method enters the book's atmosphere of signs.",
  "broad-apparatus-chapter-085-the-fountain-1": "The Fountain begins as inquiry rather than certainty. Ishmael invites students to examine whale spouts as evidence with limits.",
  "broad-apparatus-chapter-085-the-fountain-2": "The whale's need to surface ties mystery to biology. The spout is symbolic, but it starts from breath and bodily necessity.",
  "broad-apparatus-chapter-086-the-tail-1": "The tail description translates motion into anatomy. Ishmael wants students to see power in shape before seeing it in action.",
  "broad-apparatus-chapter-086-the-tail-2": "The flukes are described with almost engineering care. The detail grounds the tail's later symbolic force in physical structure.",
  "broad-apparatus-chapter-087-the-grand-armada-1": "The Sunda and Malacca straits place whale movement inside a global seascape. The chapter's herd scene is also a geography lesson.",
  "broad-apparatus-chapter-088-schools-and-schoolmasters-1": "Ishmael divides whale groups by sex and age, then overlays human social language onto animal behavior. Students should track both observation and projection.",
  "broad-apparatus-chapter-091-the-pequod-meets-the-rose-bud-1": "Stubb guesses the hidden value before anyone else admits it. His comic greed is also practical whaling knowledge.",
  "broad-apparatus-chapter-091-the-pequod-meets-the-rose-bud-2": "The smell of the dead whale makes commodity extraction grotesque. Ambergris value begins in rot, not romance.",
  "broad-apparatus-chapter-092-ambergris-1": "The uncertain origin of ambergris lets Ishmael mix science, rumor, and commerce. The chapter is about knowledge as much as perfume.",
  "broad-apparatus-chapter-094-a-squeeze-of-the-hand-1": "The squeezing work turns whale processing into communal touch. The chapter is strange because labor becomes almost utopian feeling.",
  "broad-apparatus-chapter-094-a-squeeze-of-the-hand-2": "The cosmetic reference shows sperm oil crossing from brutal labor into refinement and luxury. Melville keeps those worlds uncomfortably connected.",
  "broad-apparatus-chapter-095-the-cassock-1": "The idol comparison makes the whale part both anatomical and taboo. The chapter deliberately unsettles the boundary between work, religion, and body.",
  "broad-apparatus-chapter-096-the-try-works-1": "The brickkiln image makes the Pequod feel like a factory at sea. Whaling turns the ship itself into an industrial furnace.",
  "broad-apparatus-chapter-096-the-try-works-2": "The strengthened timbers remind students that the try-works are built into the ship's body. The Pequod carries industry in its frame.",
  "broad-apparatus-chapter-097-the-lamp-1": "The sleeping sailors lie in a scene lit by whale oil. The lamp chapter quietly shows how the hunt enters ordinary comfort.",
  "broad-apparatus-chapter-098-stowing-down-and-clearing-up-1": "The sealed hatches make extraction look orderly after chaos. The ship has to hide and contain what it has taken from the whale.",
  "broad-apparatus-chapter-099-the-doubloon-1": "The bright coin stands out against the worn mast hardware. Its value is symbolic because it is visibly set apart from ordinary ship matter.",
  "broad-apparatus-chapter-099-the-doubloon-2": "The coin is treated like a sacred object because Ahab has assigned it one purpose. The crew reads it through that pressure.",
  "broad-apparatus-chapter-101-the-decanter-1": "The Rattler detail keeps Enderby history lively rather than abstract. Ishmael turns whaling commerce into adventure record.",
  "broad-apparatus-chapter-101-the-decanter-2": "The discovery ship shows whaling tied to exploration and imperial routes. Commerce and geography move together.",
  "broad-apparatus-chapter-102-a-bower-in-the-arsacides-1": "Ishmael anticipates a challenge to his authority. The chapter's knowledge claim depends on travel, work, and storytelling credibility.",
  "broad-apparatus-chapter-102-a-bower-in-the-arsacides-2": "The joke about Stubb lecturing anatomy exposes how unlikely Ishmael's knowledge performance can sound. The chapter knows its own absurdity.",
  "broad-apparatus-chapter-103-measurement-of-the-whale-s-skeleton-1": "The yoked-cattle image makes thinking itself feel undersized for the whale. Measurement becomes a comic struggle against scale.",
  "broad-apparatus-chapter-104-the-fossil-whale-1": "Large words feel ridiculous on small creatures but suitable for Leviathan. Ishmael uses language size to match whale size.",
  "broad-apparatus-chapter-104-the-fossil-whale-2": "Ishmael jokes that only the heaviest dictionary words can carry fossil whales. Deep time requires inflated language.",
  "broad-apparatus-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish-1": "The Alabama fossil lets Ishmael compare ancient whales to living ones. Extinction and survival enter the whaling argument.",
  "broad-apparatus-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish-2": "The tape-measure brings speculation back to physical evidence. Ishmael's question about whale decline depends on size, records, and uncertainty.",
  "broad-apparatus-chapter-107-the-carpenter-1": "The carpenter's view of humanity is practical and unsentimental. He sees bodies as materials because his work is repair.",
  "broad-apparatus-chapter-108-ahab-and-the-carpenter-1": "The forge flame in the background links Ahab's leg work to later weapon-making. Repair and violence share the same shipboard workshop.",
  "broad-apparatus-chapter-108-ahab-and-the-carpenter-2": "Ahab turns bodily repair into a riddle about what should be hard or soft. The carpenter hears materials; Ahab hears metaphysics.",
  "broad-apparatus-chapter-112-the-blacksmith-1": "Perth's patient hammer turns grief into craft. His suffering is not decorative; it shapes the work Ahab will use.",
  "broad-apparatus-chapter-113-the-forge-1": "Ahab hears Perth's calm sorrow as almost unbearable. He prefers madness because ordinary grief asks for pity.",
  "broad-apparatus-chapter-113-the-forge-2": "Ahab's impatience with sane misery reveals his own emotional logic. Pain must become fury or purpose for him to tolerate it.",
  "broad-apparatus-chapter-120-the-deck-towards-the-end-of-the-first-night-watch-1": "Ahab's demand for more sail turns weather into defiance. Starbuck hears danger; Ahab hears an opportunity to press harder.",
  "broad-apparatus-chapter-121-midnight-the-forecastle-bulwarks-1": "The forecastle conversation shows sailors noticing contradiction and fear below the level of command. Doubt survives among ordinary voices.",
  "broad-apparatus-chapter-123-the-musket-1": "The storm has forced practical steering, but Starbuck's attention moves toward moral action. Navigation and conscience overlap.",
  "broad-apparatus-chapter-123-the-musket-2": "The compass detail makes the assassination temptation feel tied to course and control. Starbuck imagines changing the voyage by stopping Ahab.",
  "broad-apparatus-chapter-124-the-needle-1": "The vast wind image makes the whole world seem to push the ship forward. Ahab reads motion as permission.",
  "broad-apparatus-chapter-125-the-log-and-line-1": "The untouched log-line shows a guidance tool neglected until late. Broken measurement becomes part of the voyage's unraveling.",
  "broad-apparatus-chapter-126-the-life-buoy-1": "The crew divides the strange sounds through religious and cultural categories. The scene records fear and prejudice at once.",
  "broad-apparatus-chapter-126-the-life-buoy-2": "The Manxman's explanation turns sound into omen. The chapter makes the sea seem full of voices from the dead.",
  "broad-apparatus-chapter-127-the-deck-1": "Ahab's church-aisle image pulls Pip, death, and ceremony into the coffin scene. The object is already changing meanings.",
  "broad-apparatus-chapter-128-the-pequod-meets-the-rachel-1": "The Manxman recognizes the Rachel before her request is known. The gam arrives already marked as grief.",
  "broad-apparatus-chapter-128-the-pequod-meets-the-rachel-2": "Ahab's voice interrupts hope before the Rachel can fully ask. His refusal begins in the timing of the hail.",
  "broad-apparatus-chapter-129-the-cabin-1": "Ahab feels Pip as a cure, which makes the boy dangerous to the hunt. Tenderness threatens obsession.",
  "broad-apparatus-chapter-130-the-hat-1": "Moby Dick's imagined nearness suppresses every doubt on deck. The whale dominates the crew before appearing.",
  "broad-apparatus-chapter-130-the-hat-2": "The loss of humor marks the final narrowing of the voyage. Ordinary crew life disappears under foreshadowing.",
  "broad-apparatus-chapter-131-the-pequod-meets-the-delight-1": "The Delight answers Ahab's question with wreckage instead of words. The warning is visual and immediate.",
  "broad-apparatus-chapter-132-the-symphony-1": "The male-female contrast is dated and strange, but it shows Ishmael trying to name doubleness in a calm before catastrophe.",
  "broad-apparatus-chapter-132-the-symphony-2": "The royal-sun image makes the sea briefly feel married to peace. The beauty matters because Ahab will refuse its alternative.",
  "broad-apparatus-chapter-133-the-chase-first-day-1": "Ahab's upward question makes sight the first drama of the chase. Everything depends on who sees the whale first.",
  "broad-apparatus-chapter-133-the-chase-first-day-2": "The empty answer stretches suspense. The whale controls the scene even before he is visible.",
  "broad-apparatus-chapter-134-the-chase-second-day-1": "Ahab turns absence into command. Not seeing the whale only makes him order more speed.",
  "broad-apparatus-chapter-134-the-chase-second-day-2": "The topgallant order shows Ahab converting frustration into more sail. Every delay becomes acceleration.",
  "broad-apparatus-chapter-135-the-chase-third-day-1": "Ahab's repeated question shows the chase narrowing to sight and pursuit. His world has become the whale's possible appearance.",
  "broad-apparatus-chapter-135-the-chase-third-day-2": "The wake replaces judgment. Ahab treats the whale's path as infallible because following has become his whole logic.",
  "broad-apparatus-epilogue-epilogue-1": "The circling image places Ishmael at the edge of death before rescue. Survival begins in the same whirlpool that ends the ship."
}));

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
let updated = 0;
for (const annotation of data.annotations) {
  const replacement = replacements.get(annotation.id);
  if (!replacement) continue;
  annotation.note = replacement;
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:hand-polished"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated }, null, 2));
