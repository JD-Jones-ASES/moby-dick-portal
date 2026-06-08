import { readFile, writeFile } from "node:fs/promises";

const glossaryPath = "data/glossary/moby-dick.glossary.json";
const referencePath = "data/references/moby-dick.reference-cards.json";

const glossaryPromotions = new Map([
  ["aboard", "On or into a ship. The word often marks the move from shore life into shipboard rules."],
  ["aft", "Toward the rear of a ship."],
  ["astern", "Behind a ship or toward its stern."],
  ["belay", "To secure a rope; in speech, to stop or hold off."],
  ["forecastle", "The forward part of a ship where ordinary sailors traditionally live or gather."],
  ["masthead", "A lookout post high on a mast. Whalers watch from there for signs of whales."],
  ["nantucket", "The Massachusetts island that serves as the novel's whaling center and the Pequod's home port."],
  ["queequeg", "A skilled harpooneer and Ishmael's closest companion."],
  ["starbuck", "The Pequod's chief mate. He is competent, cautious, and often the clearest moral check on Ahab."],
  ["pequod", "The whaling ship Ahab commands."],
  ["cetology", "The study or classification of whales. Ishmael uses it to test how humans organize knowledge."],
  ["fast-fish", "In Ishmael's explanation, a whale already attached to a ship or boat and therefore claimed as property."],
  ["loose-fish", "In Ishmael's explanation, a whale not attached to anyone and therefore available for another ship to claim."],
  ["jonah", "A biblical prophet who tries to flee a command and is swallowed by a great fish."],
  ["specksnyder", "A whaling officer or chief harpooneer in older usage. Ishmael uses the term to explain whaling hierarchy."],
  ["abaft", "Toward the stern or behind a point on a vessel."],
  ["ahab", "The Pequod's captain. His biblical name helps frame the novel's concern with command, idolatry, and obsession."],
  ["anvil", "A heavy iron block used in forging metal; the blacksmith chapters make practical labor feel symbolic."],
  ["baleen", "Comb-like plates in some whales' mouths used to filter food. Sperm whales are toothed whales, so baleen helps clarify Melville's whale categories."],
  ["ballast", "Heavy material used to steady a vessel; figuratively, anything that gives weight or balance."],
  ["binnacle", "A case or stand near the helm that holds a ship's compass."],
  ["blasphemy", "Speech or action treated as insulting to God or sacred things."],
  ["blubber", "The whale's thick fat layer, cut from the body and boiled into oil. Many labor chapters turn blubber into profit."],
  ["boats", "In whaling scenes, small open whaleboats carry crews close enough to hunt the whale."],
  ["bowsprit", "A spar projecting from a ship's bow. It helps students picture the ship as a working structure."],
  ["brace", "A rope used to swing a yard; also a verb for making ready or tightening."],
  ["braces", "Ropes used to swing or control yards and sails."],
  ["breach", "For a whale, to leap partly or wholly out of the water. The word turns whale movement into visible force."],
  ["brit", "Tiny sea life that serves as food for right whales; Melville makes it look like yellow fields on the sea."],
  ["bulwarks", "The raised sides of a ship above the deck. Characters often lean, watch, or brace themselves at the bulwarks."],
  ["cabin", "A room aboard ship, often associated with officers or command."],
  ["cables", "Heavy ropes or chains used for anchoring and towing."],
  ["capstan", "A rotating machine used for hauling heavy ropes or anchors."],
  ["captain", "The commanding officer of a ship; on the Pequod this authority concentrates around Ahab."],
  ["case", "In whaling, the large oil-containing chamber in a sperm whale's head. Melville's head chapters distinguish it from ordinary anatomy."],
  ["chief-mate", "The senior mate under the captain. Starbuck has authority, but not enough to overrule Ahab."],
  ["cooper", "A worker who makes or repairs barrels. On a whaling ship, barrels matter because oil must be stored."],
  ["crotch", "A support in a whaleboat for holding a harpoon or lance ready."],
  ["cutting-in", "The process of stripping blubber from a whale alongside the ship. It turns the hunt into heavy industrial labor."],
  ["deck", "A ship's working floor, often the stage for command, labor, and confrontation."],
  ["doubloon", "A Spanish gold coin. Ahab nails one to the mast as the reward for spotting Moby Dick."],
  ["elijah", "A biblical prophet's name used for the strange Nantucket figure who warns Ishmael and Queequeg before they sail."],
  ["firmament", "An old word for the heavens or sky, especially in biblical style. Melville uses it to make sea events feel cosmic."],
  ["fluke", "One side of a whale's tail. The fluke matters because it is powerful, dangerous, and symbolically charged."],
  ["flukes", "The two broad lobes of a whale's tail."],
  ["log", "A device or record used to measure or track a ship's movement."],
  ["gale", "A strong wind at sea, below hurricane force but still dangerous to ships."],
  ["shroud", "A rope or cable supporting a mast; the word can also carry burial associations."],
  ["rigging", "The ropes, chains, and tackle that support and control a ship's masts and sails."],
  ["line-tub", "A tub holding the coiled whale-line in a whaleboat."],
  ["gabriel", "A biblical angel's name given to the fevered prophet aboard the Jeroboam."],
  ["hawser", "A thick rope or cable used for towing or mooring."],
  ["mizzen", "The mast behind the mainmast on many sailing vessels."],
  ["spermaceti", "A waxy substance from the sperm whale's head, prized by whalers and often misunderstood by older writers."],
  ["harpooneer", "A specialized whaler who throws the harpoon in the first attack on a whale."],
  ["phrenology", "A discredited nineteenth-century practice of reading character from skull shape."],
  ["keel", "The central structural beam along the bottom of a ship."],
  ["ambergris", "A valuable waxy substance associated with sperm whales and used in perfume."],
  ["cassock", "A long clerical garment; Melville uses the word as a startling religious analogy for whale processing."],
  ["amelia", "A ship named in Ishmael's whaling-history account as part of early British sperm-whaling in the South Sea."],
  ["prometheus", "A mythic figure associated with defiance, suffering, and stolen fire."],
  ["queen-mab", "A fairy figure best known from Shakespeare's Romeo and Juliet; Stubb's dream chapter borrows the name for comic prophecy."],
  ["waif", "A flag or marker used to claim a whale or signal possession."],
  ["main-top", "A platform or working area high on the mainmast."],
  ["log-line", "A line used with a log to estimate a ship's speed through the water."],
  ["job", "A biblical sufferer whose book includes Leviathan and language of unanswerable power."],
  ["hatchway", "An opening in a ship's deck leading below."],
  ["helm", "The steering apparatus of a ship; also the place or act of steering."],
  ["physiologist", "A student or writer of bodily structure and function; Ishmael borrows the pose of scientific authority."],
  ["sovereign", "A ruler or supreme authority; the word often carries political force."],
  ["samuel-enderby", "A real British whaling-house name used for one of the ships Ahab encounters."],
  ["reef", "To reduce the area of a sail in strong wind."],
  ["life-buoy", "A floating rescue device; in Moby-Dick the life-buoy becomes inseparable from Queequeg's coffin."],
  ["monomania", "An obsessive fixation on one idea. The term helps describe Ahab's narrowing mind, but it is historically loaded."],
  ["malady", "An illness or deep disorder; Ahab uses the word for the condition Pip seems to soothe and intensify."],
  ["oars", "Long poles used to row boats, especially the whaleboats lowered from the ship."],
  ["spar", "A pole such as a mast, yard, or boom used in a ship's rigging."],
  ["wake", "The track of disturbed water left behind a ship or whale."],
  ["leeward", "Away from the wind, or on the sheltered side. The term helps readers follow ship movement and risk."],
  ["new-bedford", "The Massachusetts whaling port where Ishmael first arrives before continuing to Nantucket."],
  ["right-whale", "A baleen whale type often contrasted with the sperm whale."],
  ["sounding", "Measuring water depth, often with a weighted line."],
  ["squall", "A sudden violent gust of wind, often with rain."],
  ["hammock", "A hanging bed used by sailors."],
  ["mariner", "A sailor or seafarer."],
  ["whaleboat", "A small boat lowered from the ship for chasing and striking whales."],
  ["flask", "The Pequod's third mate. He is blunt, combative, and eager for whaling work."],
  ["stubb", "The Pequod's second mate. He jokes through danger and stays unnervingly calm."],
  ["cleat", "A fitting used to secure a rope."],
  ["train-oil", "Oil rendered from whale blubber, commercially central to the whaling world."],
  ["porpoise", "A small toothed whale relative; Ishmael mentions it while discussing whale meat as food."],
  ["shark-massacre", "The killing of sharks around a whale carcass. The scene shows violence continuing after the hunt."],
  ["demigods", "Beings partly divine and partly mortal; Ishmael uses heroic language to inflate whaling history."],
  ["bull", "A male whale; Ishmael uses the term while describing whale social groups."],
  ["school", "A group of whales, especially the bands Ishmael describes after the Grand Armada."],
  ["metempsychosis", "The supposed passing of a soul from one body to another."],
  [
    "apparatus-floor-gloss-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-1",
    "Whale images appear in carvings, signs, rocks, mountains, and stars, showing how often humans remake whales through imagination."
  ],
  [
    "apparatus-floor-gloss-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-2",
    "Bad whale pictures reveal how hard it is to represent a whale accurately from distance, memory, or fantasy."
  ],
  ["squid", "A large sea creature mistaken at first for the White Whale, turning natural observation into omen."],
  ["stiletto", "A narrow dagger; the word makes Daggoo's sudden cry sound sharp and stabbing."],
  [
    "apparatus-floor-gloss-chapter-069-the-funeral-1",
    "The whale's drifting body becomes a grotesque mock funeral, surrounded by sharks below and seabirds above."
  ],
  [
    "apparatus-floor-gloss-chapter-069-the-funeral-2",
    "A floating whale carcass can become a false sea warning, making distant ships mistake it for danger ahead."
  ],
  ["heidelburgh-tun", "A huge wine cask at Heidelberg; Melville uses it as a comic analogy for the sperm whale's case."],
  ["quoin", "A wedge-shaped piece or angle; Ishmael uses the term while dividing the whale's head into parts."],
  [
    "apparatus-floor-gloss-chapter-091-the-pequod-meets-the-rose-bud-1",
    "Ambergris can turn a rotten whale into sudden profit, making disgust and luxury occupy the same object."
  ],
  [
    "apparatus-floor-gloss-chapter-091-the-pequod-meets-the-rose-bud-2",
    "Working tackle means the ropes and gear that let sailors handle heavy whale bodies and shipboard loads."
  ],
  ["anathema", "Something cursed or set apart for rejection; Stubb uses the word in the comic, foul-smelling Rose-Bud episode."],
  [
    "apparatus-floor-gloss-chapter-103-measurement-of-the-whale-s-skeleton-1",
    "Measuring a whale skeleton lets Ishmael turn awe into numbers, while still admitting that the living whale exceeds the display."
  ],
  [
    "apparatus-floor-gloss-chapter-103-measurement-of-the-whale-s-skeleton-2",
    "The skeleton display makes the whale visible as structure, but not as the full living creature Ishmael keeps chasing in language."
  ],
  ["arsacides", "Islanders in Ishmael's account who preserve and display a sperm whale skeleton."],
  [
    "apparatus-floor-gloss-chapter-043-hark-1",
    "Belowdecks noises suggest hidden people or movement inside the ship, turning a brief night-watch scene into suspense."
  ],
  [
    "apparatus-floor-gloss-chapter-043-hark-2",
    "The after-hold is a storage space below deck; in Hark! it becomes the source of suspicious sounds."
  ],
  [
    "short-unit-gloss-chapter-097-the-lamp-1",
    "The ship's lamps burn whale oil, so the product of the hunt lights even the sailors' sleeping quarters."
  ],
  ["hyena", "A scavenging animal associated with harsh laughter; Ishmael uses the image for his grim comic response to whaling danger."]
]);

const freshGlossaryEntries = [
  {
    id: "hyena",
    term: "hyena",
    category: "symbolic",
    definition: "A scavenging animal associated with harsh laughter; Ishmael uses the image for his grim comic response to whaling danger.",
    variants: ["hyenas"],
    targets: ["chapter-049-the-hyena"],
    citations: ["standard-ebooks-moby-dick"],
    status: {
      definition_status: "student-ready",
      citation_status: "verified"
    }
  }
];

const glossaryTermOverrides = new Map([
  ["short-unit-gloss-chapter-097-the-lamp-1", "whale-oil lamps"]
]);

const referencePromotions = new Map([
  [
    "cetology-and-classification",
    {
      summary: "The cetology chapters classify whales, but they also test the limits of classification itself.",
      student_note:
        "These chapters can feel like interruptions. They matter because Ishmael wants knowledge to be orderly, while whales and language keep exceeding his categories."
    }
  ],
  [
    "fast-fish-property",
    {
      summary: "Ishmael turns a whaling rule about possession into a broader meditation on law, empire, and who gets to claim what.",
      student_note:
        "This is one of Melville's clearest methods: begin with a technical whaling custom, then let it expand into politics and moral argument."
    }
  ],
  [
    "coffin-life-buoy-symbol",
    {
      summary: "Queequeg's coffin changes meanings: death object, crafted possession, ship equipment, and survival device.",
      student_note:
        "The symbol works because it does not stop being a coffin when it becomes useful. Survival depends on an object marked by death."
    }
  ],
  [
    "whaling-as-labor",
    {
      summary: "The Pequod is not only an adventure setting; it is a workplace organized around danger, hierarchy, bodily skill, and profit.",
      student_note:
        "When the book pauses for ropes, blubber, try-works, or shipboard routines, it is often showing the labor system that makes Ahab's quest possible."
    }
  ],
  [
    "extracts-as-archive",
    {
      summary: "The extracts make the whale a problem collected across cultures, genres, and centuries.",
      student_note:
        "The prefatory collage is not ordinary plot. It shows that the whale arrives already surrounded by books, myths, jokes, sermons, and reports."
    }
  ],
  [
    "ahab-biblical-name",
    {
      summary: "Ahab's name carries biblical associations with corrupt kingship, idolatry, and destructive authority.",
      student_note:
        "Students do not need a full Bible background to notice the effect: Melville gives his captain a name that already sounds like a warning about rule and obsession."
    }
  ],
  [
    "carpenters-bench",
    {
      summary: "The carpenter's workspace gathers repair, measurement, tools, comedy, and bodily improvisation.",
      student_note:
        "The scene reads better when students connect the jokes to real shipboard labor and to Ahab's dependence on practical craft."
    }
  ],
  [
    "case-junk-and-spermaceti",
    {
      summary: "Several head chapters distinguish the sperm whale's oil-bearing parts and the labor of extracting them.",
      student_note:
        "When vocabulary gets dense, keep the core idea in view: the whale's head is being translated into valuable substances through dangerous work."
    }
  ],
  [
    "craftsmen-around-ahab",
    {
      summary: "The carpenter and blacksmith chapters show practical workers drawn into Ahab's symbolic mission.",
      student_note:
        "These chapters are not only comic side scenes. They show how skilled labor gets bent toward Ahab's obsession."
    }
  ],
  [
    "fossil-whales-and-deep-time",
    {
      summary: "The fossil-whale chapters expand the book's scale from shipboard labor to geology, extinction, and ancient life.",
      student_note:
        "They matter because they make the whale older than the voyage and larger than any single hunt."
    }
  ],
  [
    "gams-and-news",
    {
      summary: "A gam is a meeting between whaling ships, often for news, mail, supplies, stories, and warnings.",
      student_note:
        "The gams keep reminding students that the Pequod is part of a wider whaling world, even as Ahab narrows every encounter to Moby Dick."
    }
  ],
  [
    "right-whale-feeding-and-brit",
    {
      summary: "The brit chapters show a different whale ecology from the sperm-whale hunt that drives Ahab.",
      student_note:
        "These chapters help students see that Melville's whales are not interchangeable. Feeding habits, body parts, and value shape how crews look at each species."
    }
  ],
  [
    "right-whale-head-superstition",
    {
      summary: "The crew kills a right whale partly because Stubb and Flask believe its head will balance or protect the ship.",
      student_note:
        "The chapter mixes practical seamanship, superstition, and casual violence. It is a strong place to ask how work habits become beliefs."
    }
  ],
  [
    "shipboard-hierarchy",
    {
      summary: "The Pequod runs through ranks: captain, mates, harpooneers, specialists, and ordinary sailors.",
      student_note:
        "That hierarchy matters because Ahab's private obsession can move the whole ship only because command structure already exists."
    }
  ],
  [
    "sperm-whale-anatomy",
    {
      summary: "Melville's sperm-whale chapters focus on head, spout, skin, tail, skeleton, and oil-bearing parts.",
      student_note:
        "The anatomy chapters are not only trivia. They show how work, profit, awe, and incomplete science all meet in the body of the whale."
    }
  ],
  [
    "sperm-whale-head-as-weapon",
    {
      summary: "The Battering-Ram chapter explains why the sperm whale's head can be imagined as a force of impact.",
      student_note:
        "This card connects anatomy to plot: Ishmael's technical description prepares readers to believe that the whale's body can damage ships."
    }
  ],
  [
    "whaling-houses-and-global-industry",
    {
      summary: "The Decanter links the Samuel Enderby to the history and geography of British and American sperm whaling.",
      student_note:
        "Names, dates, ports, and firms widen the voyage into an industry, so Ahab's hunt moves through global commercial history."
    }
  ],
  [
    "boarding-house-comedy",
    {
      summary: "The early inn chapters use comedy to make fear, class, race, and intimacy visible.",
      student_note:
        "The jokes lower Ishmael's guard before the friendship with Queequeg becomes serious."
    }
  ],
  [
    "communal-eating-and-early-fellowship",
    {
      summary: "Breakfast and Chowder use shared meals to move Ishmael from isolation toward shipboard society.",
      student_note:
        "Food scenes become social tests, showing how strangers become companions before the voyage turns them into a crew."
    }
  ],
  [
    "inns-chapels-thresholds",
    {
      summary: "Before the Pequod sails, public rooms train readers to notice strangers, rituals, warnings, and grief.",
      student_note:
        "The shore chapters build the social and religious pressures that the voyage carries out to sea."
    }
  ],
  [
    "jonah-and-mapples-sermon",
    {
      summary: "Father Mapple retells Jonah as a story about fleeing duty, facing judgment, and speaking truth.",
      student_note:
        "The sermon acts as a warning system for the voyage. The hard question is who recognizes the warning and who ignores it."
    }
  ],
  [
    "friendship-contract",
    {
      summary: "Ishmael and Queequeg's bond becomes emotional, domestic, religious, and practical.",
      student_note:
        "The friendship teaches Ishmael a different kind of loyalty before the ship's hierarchy takes over."
    }
  ],
  [
    "queequeg-before-the-pequod",
    {
      summary: "Biographical and Wheelbarrow give Queequeg a past, a comic social presence, and a practical path toward the ship.",
      student_note:
        "These chapters keep Queequeg from being only Ishmael's first impression; he has history, skill, humor, and agency."
    }
  ],
  [
    "nantucket-mythmaking",
    {
      summary: "The Nantucket chapters turn a real whaling port into legend.",
      student_note:
        "The humor and exaggeration show how economic history can become national myth."
    }
  ],
  [
    "prophecy-on-the-dock",
    {
      summary: "Warnings cluster around the Pequod before departure.",
      student_note:
        "The warnings do not stop the voyage; they teach readers to carry dread forward."
    }
  ],
  [
    "postscript-and-whaling-prestige",
    {
      summary: "The Postscript adds comic evidence to Ishmael's defense of whaling dignity.",
      student_note:
        "The small chapter shows Ishmael still arguing for whaling's cultural importance after The Advocate."
    }
  ],
  [
    "ahab-and-stubb-first-conflict",
    {
      summary: "Enter Ahab; To Him, Stubb stages command as a clash between ordinary sailor speech and Ahab's absolutism.",
      student_note:
        "Stubb jokes, but Ahab makes even joking dangerous. The chapter rehearses later conflicts over obedience."
    }
  ],
  [
    "pequod-as-system",
    {
      summary: "The ship gathers owners, officers, harpooneers, sailors, profit, discipline, and obsession into one moving world.",
      student_note:
        "Job titles and routines matter because they explain how Ahab's will travels through an institution."
    }
  ],
  [
    "lookout-and-perception",
    {
      summary: "Masthead and lookout scenes turn seeing into work, temptation, and risk.",
      student_note:
        "Watching the sea becomes practical labor and also a metaphor for interpretation."
    }
  ],
  [
    "soliloquy-sequence",
    {
      summary: "Chapters 37 through 39 let Ahab, Starbuck, and Stubb speak in theatrical isolation.",
      student_note:
        "The short chapters reveal conflicts that ordinary narration might hide."
    }
  ],
  [
    "white-whale-before-whiteness",
    {
      summary: "The book first gives Moby Dick a history, then turns whiteness into a philosophical problem.",
      student_note:
        "Separating these chapters helps readers distinguish rumor about a whale from meditation on a symbol."
    }
  ],
  [
    "comedy-under-pressure",
    {
      summary: "Comic scenes often arrive near danger, not outside it.",
      student_note:
        "The jokes show how Ishmael and the crew live with fear, monotony, and violence."
    }
  ],
  [
    "pictures-and-misreading",
    {
      summary: "Whale pictures become a way to study error, distance, and representation.",
      student_note:
        "The visual chapters show how hard it is to know a whale from images alone."
    }
  ],
  [
    "labor-tools-and-small-chapters",
    {
      summary: "Several short chapters isolate a tool, action, or technique so whaling can be seen as skilled work.",
      student_note:
        "The scale is deliberate: tiny objects can hold the whole industry together."
    }
  ],
  [
    "eating-the-whale",
    {
      summary: "The whale-as-food chapter turns industrial whaling into questions of appetite, custom, disgust, and use.",
      student_note:
        "The novel keeps asking what it means to turn an enormous living body into products, meals, and jokes."
    }
  ],
  [
    "violence-after-the-hunt",
    {
      summary: "The killing of a whale is followed by more bodily labor, danger, and extraction.",
      student_note:
        "Whaling violence does not end when the whale dies; the aftermath remains part of the work."
    }
  ],
  [
    "processing-the-whale",
    {
      summary: "The middle labor chapters show whale hunting as industrial extraction.",
      student_note:
        "These chapters answer the practical question of what happens after a whale is killed."
    }
  ],
  [
    "whale-body-as-text",
    {
      summary: "Ishmael repeatedly treats the whale's body as something to read, classify, and misread.",
      student_note:
        "This connects anatomy chapters to the novel's larger worry about interpretation."
    }
  ],
  [
    "owners-and-risk",
    {
      summary: "Peleg and Bildad turn whaling danger into contracts, shares, investment, and moral language.",
      student_note:
        "Before Ahab appears, the novel shows that whaling is already a business structure that can make danger sound ordinary."
    }
  ],
  [
    "religion-before-voyage",
    {
      summary: "The chapel, pulpit, and sermon frame the voyage with grief, judgment, duty, and sacred warning.",
      student_note:
        "The religious shore chapters matter because the voyage carries their warnings into Ahab's command world."
    }
  ],
  [
    "ship-as-workplace",
    {
      summary: "The Pequod runs through ranks, watches, shares, and routines as much as through symbolism.",
      student_note:
        "Shipboard structure helps explain how one captain's purpose can move many different workers toward the same danger."
    }
  ],
  [
    "whiteness-and-reading-risk",
    {
      summary: "The whiteness chapter collects meanings until the symbol becomes unstable and disturbing.",
      student_note:
        "Readers should resist a single fixed meaning. Melville makes whiteness powerful partly by letting meanings clash."
    }
  ],
  [
    "affidavit-and-belief",
    {
      summary: "The Affidavit defends the story's plausibility by piling up witness-like testimony and named examples.",
      student_note:
        "The chapter matters because a wild story suddenly wants to sound evidentiary, almost legal."
    }
  ],
  [
    "first-lowering-chaos",
    {
      summary: "The first lowering turns anticipation into weather, speed, confusion, and bodily risk.",
      student_note:
        "After many preparatory chapters, whaling becomes immediate action. The danger is no longer theoretical."
    }
  ],
  [
    "chart-and-control",
    {
      summary: "Ahab's chart joins knowledge, calculation, and obsession.",
      student_note:
        "The chart is a real tool, but the chapter asks whether Ahab's tools are serving judgment or desire."
    }
  ],
  [
    "false-sightings-and-desire",
    {
      summary: "Spirit-Spout, Squid, and The Hat turn seeing into suspense, mistake, omen, and desire.",
      student_note:
        "The crew often sees through expectation. Ahab's hunt changes how ordinary sights are interpreted."
    }
  ],
  [
    "ahab-leg-object",
    {
      summary: "Ahab's ivory leg links injury, command, repair, dependence, and symbolic force.",
      student_note:
        "The leg is not only a physical detail. It keeps Ahab's wound visible while showing how much his authority relies on other people's labor."
    }
  ],
  [
    "ahab-and-starbuck",
    {
      summary: "Starbuck is Ahab's most sustained moral counterforce, but he cannot finally redirect the captain's will.",
      student_note:
        "Their scenes are strongest when read together: conscience keeps speaking, yet command and obsession keep tightening."
    }
  ],
  [
    "calm-before-destruction",
    {
      summary: "Late quiet chapters make beauty feel temporary and unstable before the final chase closes in.",
      student_note:
        "The pauses matter because they offer emotional alternatives to Ahab's pursuit, even as the plot keeps moving toward destruction."
    }
  ],
  [
    "navigation-versus-obsession",
    {
      summary: "Ahab's navigation scenes show technical command being bent toward one destructive aim.",
      student_note:
        "In these chapters, instruments and seamanship still work, but Ahab narrows their purpose until skill becomes another servant of obsession."
    }
  ],
  [
    "forecastle-polyphony",
    {
      summary: "The forecastle chapters let many sailors' voices interrupt the captain-centered plot.",
      student_note:
        "The Pequod is a mixed global crew, not only Ahab's private instrument. These scenes keep that wider human world audible."
    }
  ],
  [
    "storm-command",
    {
      summary: "The storm chapters test Ahab's authority against fear, electricity, and crew resistance.",
      student_note:
        "Storm scenes make command physical. Weather, tools, and frightened sailors all press against Ahab's effort to control meaning."
    }
  ],
  [
    "coffin-life-buoy",
    {
      summary: "Queequeg's coffin becomes a life-buoy, turning a death object into a rescue object before the ending.",
      student_note:
        "The transformation matters because it lets the book's darkest object carry Ishmael into survival."
    }
  ],
  [
    "pip-and-ahab-below-deck",
    {
      summary: "Pip's loyalty and Ahab's damaged tenderness come into conflict with the hunt below deck.",
      student_note:
        "Pip reaches a side of Ahab that almost looks humanly responsive, but the pursuit still wins."
    }
  ],
  [
    "final-gams-as-ethical-tests",
    {
      summary: "The late ship meetings test whether Ahab can respond to another crew's suffering.",
      student_note:
        "The Rachel and the Delight make refusal visible. Ahab keeps choosing the chase over urgent human claims."
    }
  ],
  [
    "final-chase-day-structure",
    {
      summary: "The ending unfolds over three chase days, with pursuit becoming ritual escalation.",
      student_note:
        "Each day increases damage, narrows choices, and confirms Ahab's isolation from the people around him."
    }
  ],
  [
    "late-mercy-tests",
    {
      summary: "Late encounters repeatedly give Ahab chances to choose human claims over the chase.",
      student_note:
        "The ending is built from refusals, not simple fate. Several chapters show Ahab meeting reasons to stop and pressing on."
    }
  ],
  [
    "ahabs-command-performance",
    {
      summary: "Ahab often commands by staging scenes that make others participate in his obsession.",
      student_note:
        "The Quarterdeck is the clearest example, but later chapters keep showing command as theater, ritual, and pressure."
    }
  ],
  [
    "new-bedford-street-global-port",
    {
      summary: "The Street turns New Bedford into a compact view of global whaling money, labor, fashion, and movement.",
      student_note:
        "Before the Pequod appears, the town already shows the wider economy that will make the voyage possible."
    }
  ],
  [
    "departure-work-rhythm",
    {
      summary: "All Astir and The Mat-Maker show the voyage forming through preparation, weaving, and ordinary work.",
      student_note:
        "The plot advances through labor before it advances through chase. Routine work keeps gathering pressure around Ahab's unseen purpose."
    }
  ],
  [
    "bulkington-and-the-lee-shore",
    {
      summary: "Bulkington's brief return lets Ishmael imagine truth as risk, exposure, and refusal of safe shore life.",
      student_note:
        "The chapter is short but important because it turns a minor sailor into an emblem of dangerous independence."
    }
  ],
  [
    "surmise-and-interpretive-pressure",
    {
      summary: "Surmises shows Ishmael building explanations from partial evidence, rumor, and pressure.",
      student_note:
        "The chapter reminds readers that the narrator often has to infer motives rather than simply report them."
    }
  ],
  [
    "town-ho-as-nested-story",
    {
      summary: "The Town-Ho's Story turns shipboard violence into a nested tale told through several layers of audience and memory.",
      student_note:
        "The frame matters because Melville makes storytelling itself part of the evidence, suspense, and uncertainty."
    }
  ],
  [
    "sphynx-and-unreadable-body",
    {
      summary: "Ahab questions the whale's severed head as if it could reveal hidden knowledge.",
      student_note:
        "The scene makes the whale body feel like an unreadable oracle: present, enormous, and silent."
    }
  ],
  [
    "virgin-gam-and-competition",
    {
      summary: "The Jungfrau gam turns whaling into competition, embarrassment, and economic pressure between ships.",
      student_note:
        "This meeting shows the Pequod inside a working industry where reputation and success matter as much as danger."
    }
  ],
  [
    "body-parts-and-sacred-language",
    {
      summary: "The Cassock uses religious language for whale anatomy and processing work.",
      student_note:
        "The shock comes from the mixture: sacred vocabulary is attached to bloody industrial labor."
    }
  ],
  [
    "cleanup-after-extraction",
    {
      summary: "Stowing Down and Clearing Up turns the whale's body into stored oil, then restores the ship's temporary order.",
      student_note:
        "The clean deck does not erase the violence of extraction. It only prepares the ship to repeat the cycle."
    }
  ],
  [
    "apparatus-deep-ref-chapter-099-the-doubloon-1",
    {
      summary: "The doubloon becomes a shared object that each major character reads according to his own desire or fear.",
      student_note:
        "The chapter is a compact lesson in interpretation: one coin produces many meanings because each reader brings a different pressure to it."
    }
  ],
  [
    "arsacides-skeleton-display",
    {
      summary: "The Arsacides chapters use a displayed whale skeleton to test what measurement and spectacle can explain.",
      student_note:
        "The skeleton gives Ishmael facts and scale, but it also proves how much of the living whale remains beyond display."
    }
  ],
  [
    "bachelor-as-false-ending",
    {
      summary: "The Bachelor offers cheer, profit, and homeward motion just as Ahab presses deeper into refusal.",
      student_note:
        "The meeting matters because another ending is visible: success, return, and fellowship. The Pequod cannot take it."
    }
  ],
  [
    "opening-water-meditation",
    {
      summary: "Loomings links mood, city life, money, death-thoughts, and water before the plot begins.",
      student_note:
        "The famous first sentence opens into emotional diagnosis: Ishmael goes to sea because staying ashore has become dangerous to his mind."
    }
  ],
  [
    "apparatus-floor-ref-chapter-043-hark",
    {
      summary: "Hark! builds suspense from whispers, small sounds, and the suspicion of hidden people below deck.",
      student_note:
        "The chapter is brief because the uncertainty is the point. The ship begins to feel secretive before the crew understands why."
    }
  ],
  [
    "monkey-rope-dependence",
    {
      summary: "The monkey-rope makes human dependence literal by tying Ishmael's safety to Queequeg's dangerous work.",
      student_note:
        "The scene turns friendship and labor into shared bodily risk, one of the novel's clearest images of interdependence."
    }
  ],
  [
    "grand-armada-contrast",
    {
      summary: "The Grand Armada holds violence, panic, tenderness, and stillness inside the same whale herd.",
      student_note:
        "The calm center complicates simple adventure reading: whaling can look thrilling, brutal, beautiful, and vulnerable at once."
    }
  ],
  [
    "apparatus-deep-ref-chapter-088-schools-and-schoolmasters-1",
    {
      summary: "Schools and Schoolmasters turns whale behavior into a social lesson about age, sex, grouping, and solitude.",
      student_note:
        "The chapter deepens cetology by showing Ishmael using animal life to think through human social language and its limits."
    }
  ],
  [
    "apparatus-deep-ref-chapter-017-the-ramadan-1",
    {
      summary: "The Ramadan shows Ishmael caring for Queequeg while misunderstanding Queequeg's religious practice.",
      student_note:
        "Care and confusion coexist here, which makes the cross-cultural friendship more complicated than simple tolerance."
    }
  ],
  [
    "short-unit-ref-chapter-097-the-lamp-1",
    {
      summary: "The Lamp shows whale oil lighting the sailors' sleeping quarters after the try-works chapters.",
      student_note:
        "The tiny chapter makes extraction intimate: the product of the whale hunt becomes ordinary light inside the ship."
    }
  ],
  [
    "apparatus-deep-ref-chapter-117-the-whale-watch-1",
    {
      summary: "Fedallah's prophecy seems to promise safety while actually tightening the terms of Ahab's doom.",
      student_note:
        "The riddles matter because they return during the chase. Ahab hears them through desire, not caution."
    }
  ],
  [
    "short-unit-ref-chapter-120-the-deck-towards-the-end-of-the-first-night-watch-1",
    {
      summary: "A short storm exchange shows Starbuck urging practical caution while Ahab turns command into defiance.",
      student_note:
        "The scene matters because seamanship and theatrical will collide in just a few lines."
    }
  ],
  [
    "apparatus-wide-ref-chapter-050-ahab-s-boat-and-crew-fedallah-1",
    {
      summary: "The chapter explains Ahab's hidden boat crew and Fedallah's unsettling closeness to him.",
      student_note:
        "Fedallah becomes part of the novel's doom structure, but the immediate problem is practical: Ahab has been keeping a private crew inside a public voyage."
    }
  ]
]);

const referenceTitleOverrides = new Map([
  ["short-unit-ref-chapter-097-the-lamp-1", "The Lamp and Whale Oil"]
]);

const glossaryCitationOverrides = new Map([
  ["heidelburgh-tun", ["standard-ebooks-moby-dick", "heidelberg-castle-tun"]]
]);

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

async function writeJson(file, data) {
  await writeFile(file, `${escapeNonAscii(JSON.stringify(data, null, 2))}\n`);
}

const glossary = JSON.parse(await readFile(glossaryPath, "utf8"));
const references = JSON.parse(await readFile(referencePath, "utf8"));
let promotedGlossary = 0;
let promotedReferences = 0;
let addedGlossary = 0;

glossary.entries = glossary.entries.map((entry) => {
  const definition = glossaryPromotions.get(entry.id);
  if (!definition) return entry;
  promotedGlossary += 1;
  return {
    ...entry,
    term: glossaryTermOverrides.get(entry.id) ?? entry.term,
    definition,
    citations: glossaryCitationOverrides.get(entry.id) ?? [...new Set([...(entry.citations ?? []), "standard-ebooks-moby-dick"])],
    status: {
      definition_status: "student-ready",
      citation_status: "verified"
    }
  };
});

const glossaryIds = new Set(glossary.entries.map((entry) => entry.id));
for (const entry of freshGlossaryEntries) {
  if (glossaryIds.has(entry.id)) continue;
  glossary.entries.push(entry);
  glossaryIds.add(entry.id);
  addedGlossary += 1;
}

references.cards = references.cards.map((card) => {
  const promotion = referencePromotions.get(card.id);
  if (!promotion) return card;
  promotedReferences += 1;
  return {
    ...card,
    title: referenceTitleOverrides.get(card.id) ?? card.title,
    summary: promotion.summary,
    student_note: promotion.student_note,
    citations: [...new Set([...(card.citations ?? []), "standard-ebooks-moby-dick"])],
    status: {
      content_status: "student-ready",
      citation_status: "verified"
    }
  };
});

if (promotedGlossary !== glossaryPromotions.size) {
  const ids = new Set(glossary.entries.map((entry) => entry.id));
  const missing = [...glossaryPromotions.keys()].filter((id) => !ids.has(id));
  throw new Error(`Missing glossary promotion ids: ${missing.join(", ")}`);
}

if (promotedReferences !== referencePromotions.size) {
  const ids = new Set(references.cards.map((card) => card.id));
  const missing = [...referencePromotions.keys()].filter((id) => !ids.has(id));
  throw new Error(`Missing reference promotion ids: ${missing.join(", ")}`);
}

glossary.entries.sort((left, right) => left.id.localeCompare(right.id));

await writeJson(glossaryPath, glossary);
await writeJson(referencePath, references);

console.log(`Promoted ${promotedGlossary} glossary entries, added ${addedGlossary} glossary entries, and promoted ${promotedReferences} reference cards for public reader use.`);
