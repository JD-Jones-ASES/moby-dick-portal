import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const today = "2026-06-07";

const deprecatedPublicPromotions = new Set([
  "shark-massacre-delayed-labor"
]);

const internalOnlyDemotions = new Set([
  "titlepage-edition-frame",
  "specksnyder-whaling-hierarchy",
  "line-danger-labor",
  "sperm-whale-head-classification",
  "completion-pass-nantucket-mere-hillock-and-elbow-of-sand",
  "nantucket-sand-sea-power",
  "broad-apparatus-chapter-040-midnight-forecastle-2",
  "subagent-earlybook-midnight-forecastle-we-sing-they-sleep",
  "completion-pass-the-battering-ram-dead-blind-wall",
  "subagent-curated-chapter-014-nantucket-all-beach-without-a-background",
  "broad-apparatus-chapter-015-chowder-1",
  "subagent-curated-chapter-015-chowder-two-enormous-wooden-pots-painted-black",
  "pitchpoling-specialized-skill",
  "moby-dick-rumor-network",
  "chart-rational-obsession",
  "subagent-curated-chapter-044-the-chart-migratory-charts-of-the-sperm-whale",
  "curated-earlybook-chapter-039-first-night-watch-it-s-all-predestinated",
  "subagent-curated-chapter-050-ahab-s-boat-and-crew-fedallah-hair-turbaned-fedallah-remained-a-muffled-mystery",
  "subagent-curated-chapter-058-brit-ripe-and-golden-wheat",
  "subagent-curated-chapter-062-the-dart-the-first-iron-into-the-fish",
  "subagent-curated-chapter-022-merry-christmas-no-need-of-profane-words",
  "imprint-source-chain",
  "pulpit-ship-church",
  "broad-apparatus-chapter-053-the-gam-1",
  "subagent-curated-chapter-053-the-gam-contribute-some-of-that-information",
  "true-pictures-whaling-scenes",
  "broad-apparatus-chapter-071-the-jeroboam-s-story-1",
  "virgin-gam-competition",
  "subagent-curated-chapter-082-the-honor-and-glory-of-whaling-careful-disorderliness-is-the-true-method",
  "subagent-curated-chapter-090-heads-or-tails-there-is-no-intermediate-remainder",
  "broad-apparatus-chapter-091-the-pequod-meets-the-rose-bud-1",
  "broad-apparatus-chapter-121-midnight-the-forecastle-bulwarks-1",
  "completion-pass-midnight-aloft-thunder-and-lightning-plenty-too-much-thunder-up-here",
  "completion-pass-midnight-aloft-thunder-and-lightning-stop-that-thunder",
  "broad-apparatus-chapter-003-the-spouter-inn-2",
  "chapel-tablets-memory",
  "subagent-curated-chapter-011-nightgown-one-warm-spark-in-the-heart",
  "broad-apparatus-chapter-013-wheelbarrow-1",
  "subagent-curated-chapter-018-his-mark-he-must-show-his-papers",
  "broad-apparatus-chapter-020-all-astir-1",
  "merry-christmas-ahab-absence",
  "completion-pass-postscript-dignity-of-whaling",
  "broad-apparatus-chapter-026-knights-and-squires-1",
  "subagent-curated-chapter-026-knights-and-squires-only-some-thirty-arid-summers",
  "subagent-curated-chapter-028-ahab-sacred-retreat-of-the-cabin",
  "pipe-renounces-comfort",
  "subagent-curated-chapter-031-queen-mab-ahab-seemed-a-pyramid",
  "subagent-curated-chapter-033-the-specksnyder-literally-this-word-means-fat-cutter"
]);

const promotions = new Map([
  [
    "curated-earlybook-chapter-002-the-carpetbag-the-tyre-of-this-carthage",
    "The comparison makes New Bedford and Nantucket feel larger than ordinary towns. Ishmael borrows the scale of old trading empires to describe a whaling economy."
  ],
  [
    "curated-earlybook-chapter-006-the-street-regent-street-is-not-unknown-to-",
    "New Bedford is provincial and international at the same time. Ishmael uses the street scene to show whaling as a global trade, not a local curiosity."
  ],
  [
    "curated-earlybook-chapter-009-the-sermon-five-hundred-gold-coins",
    "Jonah is treated like a wanted man with a price on him. The detail turns Father Mapple's sermon into legal drama as well as moral warning."
  ],
  [
    "broad-apparatus-chapter-016-the-ship-2",
    "Ishmael trusts Queequeg's practical judgment when choosing a ship. Their friendship is becoming a working partnership inside the whaling world."
  ],
  [
    "all-astir-ship-as-workplace",
    "The Pequod is a workplace before it is a symbol. Loading, preparing, and managing the ship make Ahab's later quest depend on ordinary labor."
  ],
  [
    "subagent-earlybook-merry-christmas-short-cold-christmas",
    "The Christmas departure is cold and worklike rather than cozy. Melville makes the voyage feel like labor before it feels like adventure."
  ],
  [
    "curated-earlybook-chapter-031-queen-mab-a-living-thump-and-a-dead-thump",
    "Stubb's joke turns pain into a theory of force. He claims that a blow from a living will feels different from a blow by an object."
  ],
  [
    "broad-apparatus-chapter-048-the-first-lowering-2",
    "Fedallah's clothing is described as dark and funereal before the crew understands his role. Melville lets costume work like an omen."
  ],
  [
    "curated-midbook-chapter-050-ahab-s-boat-and-crew-fedallah-among-whale-wise-people-it-has-o",
    "The passage frames a practical whaling debate: whether a captain should risk himself in the boat. Ahab's obsession is also professionally dangerous."
  ],
  [
    "curated-midbook-chapter-051-the-spirit-spout-some-plumed-and-glittering-god-u",
    "The crew reads the sight as an omen before it can become ordinary whale sign. The chapter makes perception itself part of the voyage's danger."
  ],
  [
    "curated-midbook-chapter-090-heads-or-tails-the-queen-be-respectfully-presen",
    "The joke depends on royal privilege rather than whale anatomy. Ishmael turns a legal custom into comic ownership of a whale's body."
  ],
  [
    "broad-apparatus-chapter-096-the-try-works-1",
    "The brickkiln image makes the Pequod feel like a factory at sea. Whaling turns the ship itself into an industrial furnace."
  ],
  [
    "subagent-earlybook-a-bosom-friend-never-cringed-and-never-had-had-a-creditor",
    "Ishmael links Queequeg's dignity to freedom from debt and social shame. That is part of why Queequeg feels morally impressive to him."
  ],
  [
    "curated-earlybook-chapter-015-chowder-try-pots",
    "The inn name points to try-pots, the kettles used to render whale blubber into oil. Even dinner is framed by the labor of whaling."
  ],
  [
    "prophet-elijah-warning",
    "The stranger's biblical name makes his warning feel larger than ordinary dockside gossip. Melville keeps prophecy half comic and half credible."
  ],
  [
    "broad-apparatus-chapter-024-the-advocate-1",
    "Ishmael knows whaling is socially dismissed, so he argues for its dignity with comic defensiveness. The chapter is advocacy, not neutral description."
  ],
  [
    "broad-apparatus-chapter-024-the-advocate-2",
    "The comparison to celebrated butchers exposes a double standard. Ishmael asks why some forms of violence receive honor while whaling receives contempt."
  ],
  [
    "subagent-earlybook-the-advocate-s-w-f-sperm-whale-fishery",
    "The abbreviation makes the Sperm Whale Fishery sound like a formal credential. Ishmael uses the joke to defend work that polite society may find absurd."
  ],
  [
    "broad-apparatus-chapter-025-postscript-1",
    "The royal table joke extends Ishmael's defense of whaling into absurd ceremony. He wants whale oil and whale labor recognized inside high culture."
  ],
  [
    "curated-earlybook-chapter-029-enter-ahab-to-him-stubb-his-eyes-like-powder-pans",
    "Stubb reads Ahab's eyes like explosive gear. The image makes the captain's mood feel dangerous before Ahab fully explains himself."
  ],
  [
    "broad-apparatus-chapter-032-cetology-1",
    "Ishmael admits that he wants to display the whale systematically. The ambition matters even when the system later looks comic or strained."
  ],
  [
    "broad-apparatus-chapter-032-cetology-2",
    "The phrase names the problem of the whole chapter: Ishmael tries to classify a subject that feels too large and chaotic to fit any system."
  ],
  [
    "broad-apparatus-chapter-033-the-specksnyder-1",
    "The word Specksnyder preserves an older whaling labor hierarchy. Defining it shows that shipboard power depends on specialized work, not only on captains."
  ],
  [
    "curated-earlybook-chapter-033-the-specksnyder-the-first-lives-aft-the-last-for",
    "Whaling has its own labor geography. Officers and ordinary crew literally live in different parts of the ship."
  ],
  [
    "broad-apparatus-chapter-034-the-cabin-table-1",
    "Ahab's indifference at dinner shows command as isolation. Even ordinary shipboard routines become tense when the captain refuses common social signals."
  ],
  [
    "curated-earlybook-chapter-034-the-cabin-table-the-smooth-medallion-shaped-tabl",
    "Ahab uses the ivory leg as a writing surface. The detail makes his injured body part of the ship's command system."
  ],
  [
    "broad-apparatus-chapter-035-the-masthead-2",
    "The Egyptian comparison is comic overreach, but it shows Ishmael's method: even a shipboard job becomes part of a huge cultural history."
  ],
  [
    "broad-apparatus-chapter-040-midnight-forecastle-1",
    "After Ahab's quarter-deck ritual, the forecastle breaks into many voices: jokes, songs, appetite, fear, and bravado. The form keeps the crew from becoming a single obedient chorus."
  ],
  [
    "curated-earlybook-chapter-041-moby-dick-those-uncivilized-seas-mostly-fr",
    "The phrase places Moby Dick inside a global whaling map, but it also carries colonial language for ocean regions. Ishmael's geography is practical and culturally loaded at once."
  ],
  [
    "broad-apparatus-chapter-011-nightgown-1",
    "Ishmael turns bodily comfort into a theory of contrast: warmth is felt because some cold remains. The shared bed becomes philosophical, not only comic."
  ],
  [
    "curated-earlybook-chapter-012-biographical-czar-peter",
    "The allusion is to Peter the Great, who famously studied shipbuilding abroad. Queequeg's royal background is tied to practical labor rather than courtly display."
  ],
  [
    "broad-apparatus-chapter-018-his-mark-1",
    "Ishmael's quick defense of Queequeg makes their friendship public. He has moved from curious observer to companion willing to answer for him."
  ],
  [
    "knights-afraid-of-a-whale",
    "Starbuck's courage includes fear. He respects the whale as a real danger, so his caution becomes a professional virtue rather than cowardice."
  ],
  [
    "ahab-ivory-leg",
    "Ahab enters through absence and bodily evidence before he fully appears. The ivory leg makes the whale encounter visible before the story explains it."
  ],
  [
    "subagent-earlybook-the-chart-season-on-the-line",
    "The phrase treats the hunt as something that can be timed by migratory pattern. Ahab's obsession depends on practical whaling knowledge as well as fury."
  ],
  [
    "subagent-curated-chapter-046-surmises-collateral-prosecution-of-the-voyage",
    "Ahab's private revenge is still attached to the official business of the ship. The chapter keeps profit, labor, and obsession in the same frame."
  ],
  [
    "gam-definition-social-meeting",
    "A gam is a technical whaling custom, but it also becomes a storytelling device. Encounters between ships carry news, rumor, warning, and moral pressure."
  ],
  [
    "jeroboam-gabriel-contagion",
    "Gabriel turns shipboard illness and fear into prophecy. The gam gives Ahab a warning he can hear, dismiss, and later seem to fulfill."
  ],
  [
    "broad-apparatus-chapter-078-cistern-and-buckets-1",
    "The whip is a simple hoisting rig, but the task is dangerous because it happens inside the whale's head. The tool makes the later accident legible."
  ],
  [
    "subagent-midbook-the-pequod-meets-the-virgin-a-clean-one",
    "The joke means the ship has no oil, not that it is morally pure or physically tidy. Whaling slang turns economic failure into comedy."
  ],
  [
    "broad-apparatus-chapter-054-the-town-ho-s-story-1",
    "The Town-Ho enters as another ship met at sea, but the meeting opens into a nested story. Melville uses ship-to-ship contact to move rumor, warning, and narrative across the ocean."
  ],
  [
    "broad-apparatus-chapter-089-fast-fish-and-loose-fish-2",
    "Ishmael treats whaling custom as a legal problem. The chapter uses rules about captured whales to ask who gets to claim property and power."
  ],
  [
    "broad-apparatus-chapter-100-leg-and-arm-1",
    "Ahab and Boomer meet as two captains marked by whale injury. The scene makes their different responses visible before either man argues about Moby Dick."
  ],
  [
    "broad-apparatus-chapter-113-the-forge-1",
    "Ahab finds Perth's calm sorrow harder to bear than rage. The line shows how Ahab prefers madness and force to ordinary human grief."
  ],
  [
    "broad-apparatus-chapter-132-the-symphony-1",
    "Ishmael describes contrast and unity at the same time: sea and sky seem separate, then almost one. The calm matters because it comes just before catastrophe."
  ],
  [
    "curated-latebook-chapter-135-the-chase-third-day-summerhouse-to-the-angels",
    "The image briefly makes creation seem bright and welcoming. The final chase feels harsher because this glimpse of beauty appears and vanishes."
  ],
  [
    "broad-apparatus-chapter-030-the-pipe-1",
    "The pipe should mark ordinary rest, but Ahab cannot settle into it. Giving it up shows obsession crowding out even small habits of comfort."
  ],
  [
    "curated-latebook-chapter-123-the-musket-preventer-tackles",
    "Preventer tackles are extra rigging used to secure control in dangerous conditions. The technical detail helps the storm crisis feel practical, not abstract."
  ],
  [
    "curated-latebook-chapter-093-the-castaway-ship-keepers",
    "Ship-keepers are crew left aboard while the boats chase whales. Pip's trauma begins inside an ordinary work assignment, which makes the accident feel cruelly routine."
  ],
  [
    "completion-pass-the-pulpit-second-flowering-youth",
    "Father Mapple's age is described as renewed rather than simply weakened. That helps explain why his authority feels weathered and forceful at once."
  ],
  [
    "broad-apparatus-chapter-021-going-aboard-1",
    "Ishmael tries to push Elijah away, but the warning has already entered the voyage. The scene shows how hard it is to dismiss an omen cleanly."
  ],
  [
    "midnight-aloft-storm-compression",
    "This tiny chapter works almost like a stage flash. Its brevity makes the storm feel immediate instead of reported from a distance."
  ],
  [
    "curated-latebook-chapter-129-the-cabin-like-cures-like",
    "Ahab borrows an old medical proverb to explain why Pip steadies him. The phrase helps students see how strange and intimate their bond has become."
  ],
  [
    "broad-apparatus-chapter-130-the-hat-1",
    "The whale's imagined nearness suppresses every doubt on deck. Moby Dick dominates the crew before he fully appears."
  ],
  [
    "broad-apparatus-chapter-013-wheelbarrow-2",
    "The wheelbarrow story turns cultural misunderstanding into comedy without making Queequeg foolish. Ishmael has to learn that context changes meaning."
  ],
  [
    "curated-earlybook-chapter-017-the-ramadan-presbyterians-and-pagans-alike",
    "Ishmael's blessing refuses a simple divide between Christian and non-Christian. The line pushes the friendship beyond religious tribalism."
  ],
  [
    "broad-apparatus-chapter-027-knights-and-squires-2",
    "The stage-driver comparison makes Stubb's boatmanship comic and practical. He manages danger by making his working space feel familiar."
  ],
  [
    "broad-apparatus-chapter-087-the-grand-armada-1",
    "The Sunda and Malacca straits place whale movement inside a real global seascape. The herd scene is also a geography lesson."
  ],
  [
    "candles-corpusants",
    "Corpusants are storm lights seen by sailors, but the crew reads them as omens. The scene lets natural event and symbolic terror occupy the same deck."
  ],
  [
    "subagent-gauss-delight-self-sealing-warning",
    "The Delight's warning does not make Ahab reconsider. He folds another ship's disaster back into the logic of the chase."
  ],
  [
    "curated-latebook-epilogue-epilogue-the-devious-cruising-rachel",
    "The Rachel is still searching for its own lost crew. Ishmael's rescue arrives inside another ship's grief, not as a simple happy ending."
  ],
  [
    "broad-apparatus-chapter-003-the-spouter-inn-1",
    "The inn painting is deliberately hard to read. It trains students for a novel where images of whales, ships, and danger often arrive blurred before they become meaningful."
  ],
  [
    "broad-apparatus-chapter-133-the-chase-first-day-1",
    "Ahab's question makes sight the first drama of the chase. Everything depends on who sees the whale, and how quickly that sight becomes command."
  ],
  [
    "ahabs-leg-body-repair",
    "Ahab's injury keeps returning through objects, repairs, and command. His body is part of the ship's material system, not separate from it."
  ],
  [
    "broad-apparatus-chapter-038-dusk-1",
    "Starbuck names the damage Ahab has done to his judgment. The short stage-like chapter lets conscience speak before obedience resumes."
  ],
  [
    "broad-apparatus-chapter-039-first-night-watch-1",
    "Stubb half-understands Starbuck's disturbance but turns it into comic fatalism. The sequence shows each officer processing Ahab differently."
  ],
  [
    "completion-pass-ahab-and-starbuck-in-the-cabin-casks-below-must-have-sprung-a-bad-leak",
    "The leaking oil creates a direct conflict between Starbuck's duty to the ship and Ahab's refusal to pause the hunt."
  ],
  [
    "completion-pass-the-quadrant-nakedness-of-unrelieved-radiance",
    "The sky's brightness makes navigation feel hostile rather than clarifying. Ahab faces a world that gives light without guidance."
  ],
  [
    "rachel-search-refused",
    "The Rachel asks Ahab to interrupt his hunt for a human search. His refusal is one of the clearest moral tests in the final movement."
  ],
  [
    "broad-apparatus-chapter-134-the-chase-second-day-2",
    "The topgallant order shows Ahab converting frustration into more sail. Every delay becomes another demand for speed."
  ],
  [
    "curated-earlybook-chapter-023-the-lee-shore-one-touch-of-land",
    "Land usually promises safety, but Bulkington's chapter reverses that comfort. Here, shore can mean danger and open sea can mean truth."
  ],
  [
    "breakfast-social-comedy",
    "The breakfast scene turns dangerous-looking whalers into awkward hotel guests. Melville deflates heroic sea romance by showing ordinary social embarrassment."
  ],
  [
    "broad-apparatus-chapter-007-the-chapel-1",
    "Ishmael's errand to the chapel moves the story from lodging-house comedy into mourning. Before the Pequod sails, the book makes shipwreck and loss visible."
  ],
  [
    "broad-apparatus-chapter-037-sunset-1",
    "Ahab's soliloquy turns the sea into opposition. The voice is theatrical because he speaks as if even the waves are audience and enemy."
  ],
  [
    "broad-apparatus-chapter-125-the-log-and-line-1",
    "The untouched log-line shows a guidance tool neglected until late. Broken measurement becomes part of the voyage's unraveling."
  ],
  [
    "deck-coffin-line-tubs",
    "The coffin now sits among whaling gear. Melville keeps folding symbol back into practical shipboard use."
  ],
  [
    "broad-apparatus-chapter-124-the-needle-1",
    "The vast wind image makes the whole world seem to push the ship forward. Ahab reads motion as permission."
  ],
  [
    "broad-apparatus-chapter-004-the-counterpane-1",
    "Ishmael links waking beside Queequeg to a childhood memory of fear and uncertainty. The scene makes intimacy feel strange before it becomes trust."
  ],
  [
    "broad-apparatus-chapter-094-a-squeeze-of-the-hand-1",
    "The squeezing work turns whale processing into communal touch. The chapter is strange because labor becomes almost utopian feeling."
  ],
  [
    "broad-apparatus-chapter-104-the-fossil-whale-1",
    "Large words feel ridiculous on small creatures but suitable for Leviathan. Ishmael uses the size of language to match the size of whales."
  ],
  [
    "broad-apparatus-chapter-055-of-the-monstrous-pictures-of-whales-2",
    "The Elephanta example pushes whale imagery into global and ancient settings, while also showing how easily pictures become distorted evidence."
  ],
  [
    "broad-apparatus-chapter-061-stubb-kills-a-whale-2",
    "The drowsy mastheads show how routine can dull attention even in dangerous work. Melville lets labor fatigue shape the action."
  ],
  [
    "broad-apparatus-chapter-068-the-blanket-1",
    "Ishmael's confidence stops at opinion. The skin chapter sounds scientific, but it openly admits uncertainty."
  ],
  [
    "broad-apparatus-chapter-070-the-sphynx-1",
    "Stubb's boast about beheading turns whale anatomy into skilled speed. The severed head then becomes a riddle for Ahab, not only a work product."
  ],
  [
    "curated-midbook-chapter-085-the-fountain-the-whale-can-only-live-by-inhal",
    "The chapter tries to explain the whale's breath and spout. A visible spray becomes a scientific question."
  ],
  [
    "subagent-earlybook-the-affidavit-economical-with-your-lamps-and-candles",
    "Ishmael turns whale oil into ordinary light, reminding readers that comfort and illumination come from dangerous labor."
  ],
  [
    "broad-apparatus-chapter-064-stubb-s-supper-1",
    "The corpse is moored to the ship like cargo and danger at once. After the kill, the whale remains an enormous practical problem."
  ],
  [
    "broad-apparatus-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes-1",
    "Ishmael's list of published whale outlines shows his standards for evidence. He wants better pictures, but he still argues like a whaleman correcting books."
  ],
  [
    "broad-apparatus-chapter-060-the-line-1",
    "The rope comparison mixes technical description with racialized prejudice. Keep the rope facts separate from the harmful analogy Melville's narrator uses."
  ],
  [
    "broad-apparatus-chapter-074-the-sperm-whale-s-head-contrasted-view-1",
    "For the Nantucketer, whale classification begins in use and encounter. The heads matter because whalemen know them through work."
  ],
  [
    "broad-apparatus-chapter-099-the-doubloon-1",
    "The bright coin stands apart from the worn mast hardware. Its power is visual before it is interpretive: everyone can see that Ahab has made it special."
  ],
  [
    "broad-apparatus-chapter-126-the-life-buoy-2",
    "The Manxman's explanation turns sound into omen. The chapter makes the sea seem full of voices from the dead."
  ],
  [
    "albatross-gam-failure",
    "The failed meeting with the Albatross makes communication at sea feel fragile. A gam can bring news, but this one turns into silence and missed warning."
  ],
  [
    "whale-watch-hearse-prophecy",
    "Fedallah's prophecy sounds impossible because its images do not fit ordinary sea life. That strangeness lets Ahab mistake danger for safety."
  ],
  [
    "whiteness-symbol-warning",
    "The chapter does not give one fixed meaning for whiteness. It shows how a symbol can gather purity, terror, blankness, racial ideology, and spiritual dread at once."
  ],
  [
    "bachelor-contrast-joy",
    "The Bachelor is cheerful, successful, and homeward-bound. That contrast makes the Pequod's course look chosen rather than inevitable."
  ],
  [
    "queequeg-coffin-symbol-seed",
    "Queequeg's coffin begins as preparation for death, but it will not keep a single meaning. The object gathers friendship, craft, mortality, and future survival."
  ],
  [
    "subagent-midbook-the-right-whale-s-head-contrasted-view-the-greenlanders-call-the",
    "The chapter shows that whalemen name the same body part differently depending on where and how they work."
  ],
  [
    "broad-apparatus-chapter-083-jonah-historically-regarded-1",
    "Bishop Jebb's answer shows Ishmael treating biblical skepticism like a debate brief. The chapter turns faith, evidence, and argument into comic scholarship."
  ],
  [
    "broad-apparatus-chapter-084-pitchpoling-1",
    "Stubb's presentiment makes technique feel ominous. Even a practical hunting method enters the book's atmosphere of signs."
  ],
  [
    "broad-apparatus-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish-1",
    "The Alabama fossil lets Ishmael compare ancient whales to living ones. Extinction and survival enter the whaling argument."
  ],
  [
    "broad-apparatus-chapter-072-the-monkey-rope-2",
    "Ishmael compares describing the work to doing the work. The sentence turns narrative itself into a tangled rope problem."
  ],
  [
    "cutting-in-industrial-process",
    "The hunt is only the start of the work. Cutting-in shows the whale becoming a processed commodity through coordinated shipboard labor."
  ],
  [
    "broad-apparatus-chapter-102-a-bower-in-the-arsacides-1",
    "Ishmael anticipates a challenge to his authority. The chapter's knowledge claim depends on travel, work, and storytelling credibility."
  ],
  [
    "broad-apparatus-chapter-103-measurement-of-the-whale-s-skeleton-1",
    "The yoked-cattle image makes thinking itself feel undersized for the whale. Measurement becomes a comic struggle against scale."
  ],
  [
    "broad-apparatus-chapter-108-ahab-and-the-carpenter-2",
    "Ahab turns bodily repair into a riddle about what should be hard or soft. The carpenter hears materials; Ahab hears metaphysics."
  ],
  [
    "broad-apparatus-chapter-120-the-deck-towards-the-end-of-the-first-night-watch-1",
    "Ahab's demand for more sail turns weather into defiance. Starbuck hears danger; Ahab hears an opportunity to press harder."
  ],
  [
    "curated-latebook-chapter-121-midnight-the-forecastle-bulwarks-marine-insurance-companies",
    "Stubb's joke points to the business of pricing risk at sea. The banter is comic, but it rests on maritime commerce."
  ],
  [
    "broad-apparatus-chapter-086-the-tail-1",
    "The tail description translates motion into anatomy. Ishmael wants students to see power in shape before seeing it in action."
  ],
  [
    "completion-pass-the-carpenter-thousand-nameless-mechanical-emergencies",
    "The carpenter's value comes from practical intelligence under pressure, the kind of skill the ship needs constantly but rarely celebrates."
  ],
  [
    "subagent-curated-chapter-047-the-mat-maker-using-my-own-hand-for-the-shuttle",
    "The weaving image makes the chapter feel like a miniature version of Melville's craft: the voyage is being woven as it goes."
  ],
  [
    "broad-apparatus-chapter-112-the-blacksmith-1",
    "Perth's patient hammer turns grief into craft. His suffering is not decorative; it shapes the work Ahab will use."
  ],
  [
    "gilder-beauty-danger",
    "The sea's beauty gilds danger without removing it. This quiet chapter matters because it shows why the voyage can still seduce the senses."
  ],
  [
    "pacific-false-peace",
    "The Pacific seems calm and beautiful, but the calm is not safety. Melville uses the ocean's name ironically as the final pursuit nears."
  ],
  [
    "dying-whale-sunset",
    "The dying whale turns toward the sun, and Ahab reads the scene through his own hunger for meaning. Animal death becomes another symbolic mirror."
  ],
  [
    "hark-hidden-crew",
    "The overheard voices reveal that Ahab has brought hidden crew aboard. The tiny chapter makes secrecy audible before Fedallah fully enters the plot."
  ],
  [
    "hyena-practical-joke",
    "Ishmael turns mortal danger into a joke about paperwork and wills. The laughter is defensive: comedy becomes a way to live with risk."
  ],
  [
    "whales-in-paint-public-images",
    "The chapter surveys whales in public images and objects, not only in books. Ishmael is testing how culture pictures what whalemen claim to know directly."
  ],
  [
    "brit-right-whale-food",
    "Brit is the tiny food that draws right whales into feeding grounds. The chapter makes whale magnitude depend on small, almost invisible life."
  ],
  [
    "squid-false-sign",
    "The squid is mistaken for a whale sign, then becomes a sign of uncertainty instead. At sea, seeing something does not always mean knowing what it means."
  ],
  [
    "dart-harpooneer-labor",
    "The chapter argues that the harpooneer is asked to do too much at once. Melville turns hunting technique into a labor critique."
  ],
  [
    "crotch-tool-focus",
    "The crotch is a small tool, but it controls how spare harpoons wait for use. The chapter shows how whaling depends on specialized equipment."
  ],
  [
    "whale-as-dish-consumption",
    "The chapter makes whale consumption comic and uneasy. Ishmael can describe appetite, but he keeps showing how strange it is to turn the whale into food."
  ],
  [
    "broad-apparatus-chapter-066-the-shark-massacre-1",
    "The business after the kill is slow, collective, and exhausting. This sentence reminds students that whaling violence continues as labor."
  ],
  [
    "funeral-whale-body",
    "The dead whale becomes both corpse and spectacle. Melville treats the aftermath of killing as a grotesque public scene, not a clean ending."
  ],
  [
    "stubb-flask-right-whale-balance",
    "Stubb and Flask want a right-whale head to balance the Pequod. Practical superstition turns anatomy into shipboard strategy."
  ],
  [
    "battering-ram-head-power",
    "The sperm whale's head is imagined as a blunt force structure. Melville turns anatomy into an explanation of destructive power."
  ],
  [
    "heidelburgh-tun-case",
    "The whale's head becomes a huge container, compared to the Heidelberg Tun. The joke helps students picture scale through a human-made object."
  ],
  [
    "prairie-phrenology-scale",
    "The chapter borrows phrenology's language, but the whale's face overwhelms the system. Ishmael uses a dubious science to show the limits of reading surfaces."
  ],
  [
    "nut-brain-unknowability",
    "The chapter keeps the whale's brain oddly inaccessible. Measurement and dissection do not make the animal fully knowable."
  ],
  [
    "honor-glory-careful-disorder",
    "Ishmael's heroic history of whaling is intentionally disorderly. The chapter celebrates the profession while making its evidence feel comic and unstable."
  ],
  [
    "schools-social-whales",
    "The chapter treats whales as social groups with patterns and leaders. Ishmael turns whale behavior into a kind of marine sociology."
  ],
  [
    "rose-bud-smell-profit",
    "The Rose-Bud episode makes profit depend on recognizing value inside disgust. Stubb understands the smell as money before others do."
  ],
  [
    "ambergris-commerce-mystery",
    "Ambergris is valuable because it moves from whale body to luxury trade. The chapter turns a disgusting source into perfume economics."
  ],
  [
    "cassock-body-vestment",
    "The whale's skin becomes protective clothing for the mincer. Melville turns butchery into ritual imagery without hiding the physical labor."
  ],
  [
    "lamp-oil-comfort",
    "The lamp chapter connects whale oil to domestic comfort. The soft light depends on the violent labor the voyage has just described."
  ],
  [
    "stowing-down-cycle",
    "After the try-works, the ship is cleaned and reset for the next whale. The chapter shows industrial routine turning horror back into order."
  ],
  [
    "decanter-enderby-history",
    "The Enderby name brings whaling history into a drinking scene. The chapter mixes hospitality, commerce, and imperial sea enterprise."
  ],
  [
    "broad-apparatus-chapter-096-the-try-works-2",
    "The try-works are built into the Pequod's frame. The ship does not merely carry industry; it has been reinforced to become a floating factory."
  ],
  [
    "curated-earlybook-chapter-010-a-bosom-friend-phrenologically-an-excellent-one",
    "Ishmael's praise still borrows from phrenology, a discredited practice of reading character from body shape. The friendship is generous, but its language is historically limited."
  ],
  [
    "subagent-earlybook-a-bosom-friend-through-all-his-unearthly-tattooings",
    "Ishmael begins to read Queequeg's tattoos as signs of character and history, not just as frightening decoration."
  ],
  [
    "subagent-earlybook-the-advocate-true-mother-of-that-now-mighty-colony",
    "Ishmael connects whaling labor to colonial expansion. The defense of whaling is also an argument about how ocean work shapes empires."
  ],
  [
    "subagent-earlybook-the-specksnyder-grand-political-maxim-of-the-sea",
    "The chapter treats ship rank as a political system. Whaling hierarchy is not only practical; it organizes authority, space, and obedience."
  ],
  [
    "subagent-earlybook-the-masthead-bill-of-fare-is-immutable",
    "The ship becomes a sealed world where even food feels fixed. Ishmael turns ordinary provisions into a sign of life cut off from shore."
  ],
  [
    "broad-apparatus-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars-1",
    "The man with the picture and the stump turns whale evidence into public spectacle. Injury, proof, and performance all become part of whaling lore."
  ],
  [
    "subagent-midbook-squid-the-great-live-squid",
    "The squid reminds readers that the whale hunt sits inside a stranger marine world. The ocean is not just backdrop for Ahab's desire."
  ],
  [
    "broad-apparatus-chapter-062-the-dart-1",
    "The Dart turns hunting technique into a lesson about attention. Good whaling requires bodily control, timing, and judgment, not only bravery."
  ],
  [
    "curated-midbook-chapter-062-the-dart-the-harpooneer-is-expected-to-pu",
    "The harpooneer is overloaded at the crucial moment: rowing, balancing, timing, and throwing. Melville turns heroic action back into labor."
  ],
  [
    "curated-midbook-chapter-063-the-crotch-a-notched-stick-of-a-peculiar-fo",
    "The crotch is small boat hardware, but it matters because the harpoon must be ready before danger arrives. Tools shape the hunt before the strike."
  ],
  [
    "broad-apparatus-chapter-065-the-whale-as-a-dish-1",
    "The right-whale tongue example turns appetite into history. Ishmael's food chapter asks how cultures decide which parts of a whale become acceptable use."
  ],
  [
    "curated-midbook-chapter-070-the-sphynx-scientific-anatomical-feat",
    "The beheading is described like a precise anatomical operation. Whaling labor becomes technical, almost surgical, while remaining violent."
  ],
  [
    "broad-apparatus-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him-1",
    "The hanging head keeps unfinished labor beside the ship. Even when the plot turns elsewhere, the whale's body remains a practical problem."
  ],
  [
    "thin-unit-apparatus-chapter-076-battering-ram-belief",
    "Ishmael turns anatomy into persuasion. The chapter is technical, but its real work is convincing readers that whale violence can be credible."
  ],
  [
    "broad-apparatus-chapter-077-the-great-heidelburgh-tun-1",
    "The valuable spermaceti is difficult to reach and easy to waste. Anatomy becomes an extraction problem, not just a description of body parts."
  ],
  [
    "curated-latebook-chapter-092-ambergris-schmerenburgh-or-smeerenberg",
    "The old Dutch whaling settlement helps explain the joke about whale smell. Melville ties odor, history, and whale-processing geography together."
  ],
  [
    "broad-apparatus-chapter-094-a-squeeze-of-the-hand-2",
    "The cosmetic reference links brutal shipboard labor to refinement and luxury. Melville keeps the worlds of extraction and comfort uncomfortably close."
  ],
  [
    "curated-latebook-chapter-099-the-doubloon-belshazzar-s-awful-writing",
    "Ahab reads the coin through the biblical image of writing on a wall. The allusion makes interpretation feel like warning and judgment."
  ],
  [
    "curated-latebook-chapter-126-the-life-buoy-herod-s-murdered-innocents",
    "The cry is compared to the massacre of children in Matthew's nativity story. The allusion deepens the chapter's atmosphere of warning and loss."
  ],
  [
    "right-whale-head-contrast",
    "Ishmael asks readers to learn by contrast: the right whale's head matters because it differs from the sperm whale's. Anatomy becomes a sorting tool."
  ],
  [
    "broad-apparatus-chapter-078-cistern-and-buckets-2",
    "The rope-and-block sequence makes the rescue scene depend on practical coordination. Every fastening and hand matters before Tashtego falls."
  ],
  [
    "broad-apparatus-chapter-082-the-honor-and-glory-of-whaling-1",
    "Ishmael turns whaling into mock chivalry. The joke matters because it shows how hard he works to dignify a bloody trade."
  ],
  [
    "subagent-midbook-jonah-historically-regarded-a-couple-of-whist-tables",
    "Melville treats Jonah's story with comic literalism: the prophet's lodging inside the whale becomes a problem of furniture and space."
  ],
  [
    "broad-apparatus-chapter-097-the-lamp-1",
    "The sailors sleep by whale-oil light, so the hunt returns as ordinary comfort. The chapter quietly connects danger at sea to warmth below deck."
  ],
  [
    "broad-apparatus-chapter-098-stowing-down-and-clearing-up-1",
    "The sealed hatches make extraction look orderly after chaos. The ship has to contain what it has taken from the whale."
  ],
  [
    "broad-apparatus-chapter-101-the-decanter-2",
    "The discovery ship shows whaling tied to exploration and long-distance routes. Commerce and geography move together in Ishmael's industry history."
  ],
  [
    "broad-apparatus-chapter-113-the-forge-2",
    "Ahab can tolerate suffering only when it becomes fury or purpose. Perth's quieter misery unsettles him because it refuses that pattern."
  ],
  [
    "completion-pass-all-astir-preparations-were-hurrying-to-a-close",
    "The chapter turns departure into logistics: sails, canvas, rigging, and stores make the adventure possible before anyone romanticizes it."
  ],
  [
    "carpetbag-poverty-choice",
    "Ishmael travels light, poor, and alone. The small bag keeps the opening grounded in ordinary vulnerability before the book expands into myth."
  ],
  [
    "chowder-bodily-comfort",
    "The chowder chapter is comic, but it also slows the book around food, appetite, and port comfort before the Pequod's danger takes over."
  ],
  [
    "curated-earlybook-chapter-044-the-chart-large-wrinkled-roll-of-yellowish",
    "Ahab's hunt is also a paper-and-data project. The charts show obsession turning practical navigation into a private system."
  ],
  [
    "curated-earlybook-chapter-016-the-ship-yojo-earnestly-enjoined",
    "Queequeg's god is treated as an authority in a real decision, not just comic decoration. Ishmael lets his friend's judgment shape the voyage."
  ],
  [
    "curated-earlybook-chapter-043-hark-there-is-somebody-down-in-the-af",
    "The rumor of someone hidden below deck turns the Pequod into a ship with secrets. Suspicion arrives before Fedallah fully appears."
  ],
  [
    "broad-apparatus-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes-2",
    "The return to Colnett and Cuvier makes the picture chapters cumulative. Ishmael keeps comparing authorities because no single image settles the whale."
  ],
  [
    "broad-apparatus-chapter-058-brit-1",
    "The wheat-field image makes whale feeding beautiful before it becomes technical. Students can see the feeding ground first as a scene, then as a system."
  ],
  [
    "broad-apparatus-chapter-060-the-line-2",
    "The whale-line looks deceptively slight, which is why the chapter keeps stressing danger. A small-looking tool can govern life and death in the boat."
  ],
  [
    "broad-apparatus-chapter-061-stubb-kills-a-whale-1",
    "Ishmael's dreamy masthead mood makes the sudden whale action feel almost enchanted. The hunt begins from drowsiness, not heroic readiness."
  ],
  [
    "broad-apparatus-chapter-064-stubb-s-supper-2",
    "Stubb's bustle gives him temporary command over the aftermath. His comic energy is also a way of managing shipboard work."
  ],
  [
    "broad-apparatus-chapter-067-cutting-in-1",
    "The sea-gods image makes cutting-in feel ritualized and excessive. Industrial work is described with sacrificial language."
  ],
  [
    "curated-midbook-chapter-068-the-blanket-i-use-for-marks-in-my-whale-book",
    "Ishmael studies whales with specimens and notes, not only with books. The detail makes his research practical and hands-on."
  ],
  [
    "broad-apparatus-chapter-069-the-funeral-1",
    "The floating carcass becomes a lingering public sight. The chapter makes the aftermath of extraction ugly and hard to look away from."
  ],
  [
    "broad-apparatus-chapter-072-the-monkey-rope-1",
    "The monkey-rope scene is chaotic because the work happens all at once. Melville makes interdependence feel like physical disorder."
  ],
  [
    "broad-apparatus-chapter-074-the-sperm-whale-s-head-contrasted-view-2",
    "The chapter asks readers to look comparatively. Sperm whale and right whale anatomy become two ways of organizing knowledge."
  ],
  [
    "broad-apparatus-chapter-080-the-nut-1",
    "The skull measurement makes the whale's head feel architectural. Scale itself becomes part of the chapter's argument."
  ],
  [
    "broad-apparatus-chapter-001-loomings-2",
    "Ishmael turns his private pull toward water into a shared human impulse. The opening is personal, but it immediately asks readers to recognize the feeling in themselves."
  ],
  [
    "curated-midbook-chapter-084-pitchpoling-it-became-imperative-to-lance-th",
    "Pitchpoling answers a practical problem: how to strike a whale moving too fast for ordinary approach. The technique makes chase speed visible."
  ],
  [
    "broad-apparatus-chapter-085-the-fountain-1",
    "The chapter begins as an inquiry rather than a settled lesson. Ishmael asks readers to treat the whale's spout as evidence, while admitting that evidence has limits."
  ],
  [
    "broad-apparatus-chapter-086-the-tail-2",
    "The flukes are described with nearly mechanical care. That physical detail grounds the tail's later symbolic force in structure and motion."
  ],
  [
    "broad-apparatus-chapter-088-schools-and-schoolmasters-1",
    "Ishmael divides whale groups by sex and age, then borrows human social language to explain them. The passage mixes observation with projection."
  ],
  [
    "broad-apparatus-chapter-095-the-cassock-1",
    "The idol comparison makes the whale part anatomical, sacred, and unsettling at once. The chapter deliberately mixes work, religion, and body."
  ],
  [
    "broad-apparatus-chapter-102-a-bower-in-the-arsacides-2",
    "The joke about Stubb lecturing anatomy exposes how unlikely Ishmael's knowledge performance can sound. The chapter knows its own absurdity."
  ],
  [
    "broad-apparatus-chapter-104-the-fossil-whale-2",
    "Ishmael jokes that only the heaviest dictionary words can carry fossil whales. Deep time forces the chapter into deliberately oversized language."
  ],
  [
    "broad-apparatus-chapter-105-does-the-whale-s-magnitude-diminish-will-he-perish-2",
    "The tape-measure brings speculation back to physical evidence. Ishmael's question about whale decline depends on size, records, and uncertainty."
  ],
  [
    "thin-unit-apparatus-chapter-129-care-versus-hunt",
    "Pip's care threatens Ahab's purpose because it awakens a competing loyalty. For a moment, refusing the hunt becomes imaginable."
  ],
  [
    "broad-apparatus-chapter-008-the-pulpit-1",
    "Mapple's past as sailor and harpooneer lets the pulpit speak the language of the sea. His sermon belongs to whaling culture, not outside it."
  ],
  [
    "broad-apparatus-chapter-009-the-sermon-1",
    "The congregation sounds like a ship's crew before Mapple fully begins. Melville lets church space and ship space overlap."
  ],
  [
    "queen-mab-dream-warning",
    "Stubb's dream keeps the book's warnings in a comic register. Even jokes and dreams become part of the prophecy system around Ahab."
  ],
  [
    "curated-earlybook-chapter-041-moby-dick-the-unaccompanied-secluded-white",
    "The whale is built into a legend of isolation before readers ever see him. Moby Dick becomes a story circulating at sea before he becomes a visible animal."
  ],
  [
    "curated-latebook-chapter-098-stowing-down-and-clearing-up-shadrach-meshach-and-abednego",
    "The biblical trio survives a furnace, which fits a chapter about oil passing through fire. The allusion makes cleanup feel comic and sacred at once."
  ],
  [
    "curated-latebook-chapter-111-the-pacific-potters-fields",
    "The Pacific becomes a burial ground, not only a peaceful ocean. The biblical phrase qualifies the chapter's calm with graveyard imagery."
  ],
  [
    "curated-midbook-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars-the-tragic-scene-in-which-he-los",
    "The picture turns a whaleman's injury into public display. The moment links bodily evidence, spectacle, and whaling lore."
  ],
  [
    "subagent-midbook-cistern-and-buckets-the-deep-cistern-will-yield-no-more",
    "The whale's head is treated like a well that can run dry. Extraction becomes technical, bodily, and strangely domestic at once."
  ],
  [
    "curated-latebook-chapter-094-a-squeeze-of-the-hand-constantine-s-bath",
    "The tub name shows how whaling work develops its own jargon and jokes. The scene is technical as well as sensual."
  ],
  [
    "broad-apparatus-chapter-101-the-decanter-1",
    "The Rattler detail keeps Enderby history lively rather than abstract. Ishmael turns whaling commerce into adventure record."
  ],
  [
    "broad-apparatus-chapter-034-the-cabin-table-2",
    "The movement from rigging to dinner table makes hierarchy physical. Ahab enters the shared space, but the scene still keeps him emotionally apart."
  ],
  [
    "broad-apparatus-chapter-035-the-masthead-1",
    "Ishmael treats masthead duty as practical lookout work and as an old human habit of watching from heights. A shipboard job becomes part of a larger pattern."
  ],
  [
    "subagent-earlybook-the-chart-after-the-squall",
    "Ishmael reconstructs Ahab's private labor instead of simply reporting it. The chapter reminds readers how much of the captain is inferred rather than directly seen."
  ],
  [
    "curated-midbook-chapter-060-the-line-the-magical-sometimes-horrible-w",
    "The whale-line is essential gear and a deadly hazard. Melville makes an ordinary rope carry the whole risk of the chase."
  ],
  [
    "broad-apparatus-chapter-063-the-crotch-1",
    "The crotch pauses over a small tool because small tools organize the whole chase. The chapter asks readers to respect technical detail."
  ],
  [
    "subagent-midbook-the-whale-as-a-dish-the-whale-would-by-all-hands-be-considered",
    "Ishmael shows that taste is cultural, not natural. Whale meat can be framed as food rather than only as a dead animal."
  ],
  [
    "broad-apparatus-chapter-075-the-right-whale-s-head-contrasted-view-1",
    "The shoemaker's-last comparison makes right-whale anatomy ordinary and strange at once. Ishmael teaches readers to picture the head through familiar objects."
  ],
  [
    "curated-midbook-chapter-077-the-great-heidelburgh-tun-the-great-heidelburgh-tun-of-the",
    "The whale's oil chamber is compared to the Heidelberg Tun, a huge wine cask at Heidelberg Castle. The joke makes anatomy memorable through the scale of storage and drinking."
  ],
  [
    "broad-apparatus-chapter-085-the-fountain-2",
    "The whale's need to surface ties mystery to biology. The spout is symbolic, but it starts from breath and bodily necessity."
  ],
  [
    "broad-apparatus-chapter-092-ambergris-1",
    "The uncertain origin of ambergris lets Ishmael mix science, rumor, and commerce. The chapter is about knowledge as much as perfume."
  ],
  [
    "thin-unit-apparatus-chapter-101-industry-history",
    "The Enderby dates turn whaling into commercial history rather than background scenery. Ishmael places the Pequod's voyage inside a larger industry of ships, firms, and distant hunting grounds."
  ],
  [
    "broad-apparatus-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him-2",
    "The hanging head is both symbol and equipment problem. Melville makes the superstition depend on ordinary tackle strong enough to hold a dangerous weight."
  ],
  [
    "curated-midbook-chapter-075-the-right-whale-s-head-contrasted-view-this-green-barnacled-thing",
    "The local names for parts of the right-whale head turn specialist experience into vocabulary. Ishmael is translating what whalemen notice for readers who have never seen it."
  ],
  [
    "subagent-midbook-the-fountain-one-seventh-or-sunday-of-his-time",
    "The Sunday fraction makes whale breathing feel both measurable and odd. Ishmael turns anatomy into a comparison with human weekly rhythm."
  ],
  [
    "cabin-table-hierarchy",
    "The dinner routine turns rank into habit. Who sits, who serves, and who waits shows that shipboard hierarchy is built into ordinary meals."
  ],
  [
    "subagent-midbook-the-sperm-whale-s-head-contrasted-view-grey-headed-whale",
    "The phrase treats age as something whalemen can read from the body. Ishmael turns the whale's head into a record of experience, not just anatomy."
  ],
  [
    "dedication-hawthorne",
    "The dedication frames the book as an act of admiration before the story begins. That matters because the novel opens with literary kinship as well as whaling subject matter."
  ],
  [
    "cetology-architect-not-builder",
    "The architect image admits that Ishmael's classification will remain unfinished. The chapter is comic, but it also shows the novel trying to organize a subject too large to master."
  ],
  [
    "midnight-chorus-stage-play",
    "Melville writes the forecastle scene like a play, with named speakers and stage directions. The form lets the crew's humor, fear, and fatigue arrive as a public chorus."
  ],
  [
    "broad-apparatus-chapter-053-the-gam-2",
    "Letters make the gam more than a technical custom. A ship meeting can carry family news, delayed messages, and fragile contact with shore."
  ],
  [
    "town-ho-secret-tragedy",
    "The Town-Ho story is told inside another scene, with audience interruptions. The frame shows how rumor, secrecy, and performance shape what counts as truth at sea."
  ],
  [
    "broad-apparatus-chapter-071-the-jeroboam-s-story-2",
    "The signal prepares the meeting before anyone speaks. Ship-to-ship code makes warning, illness, and rumor part of the scene's first meaning."
  ],
  [
    "broad-apparatus-chapter-081-the-pequod-meets-the-virgin-1",
    "The Virgin's captain approaches impatiently, so the gam becomes comic before it becomes competitive. Ship meetings quickly become tests of pride."
  ],
  [
    "broad-apparatus-chapter-006-the-street-1",
    "The New Bedford street scene shows whaling as a global trade before the voyage begins. Ishmael sees the port through the people and goods drawn there by the fishery."
  ],
  [
    "curated-midbook-chapter-082-the-honor-and-glory-of-whaling-the-first-whale-attacked-by-our-",
    "Ishmael recasts whaling through heroic myth rather than profit alone. The classical frame lets him defend the trade as an old, honorable calling."
  ],
  [
    "curated-latebook-chapter-113-the-forge-mother-carey-s-chickens",
    "Mother Carey's chickens are stormy petrels in sailor lore, birds linked with warning weather. The phrase makes the forge scene feel charged with storm signs."
  ],
  [
    "curated-latebook-chapter-117-the-whale-watch-asphaltites",
    "Asphaltites is an old name for the Dead Sea. The place-name darkens Fedallah's prophecy by linking the imagined hearse to a landscape of biblical ruin."
  ],
  [
    "broad-apparatus-chapter-081-the-pequod-meets-the-virgin-2",
    "Starbuck's eye catches the object in the German captain's hand before anyone explains it. The small visual cue starts the chapter's bargaining and embarrassment."
  ],
  [
    "whale-magnitude-extinction",
    "Ishmael asks whether whales can diminish or disappear. For modern readers, the question connects nineteenth-century whaling to later conservation concerns."
  ],
  [
    "broad-apparatus-chapter-017-the-ramadan-1",
    "Ishmael tries to leave Queequeg's ritual alone even while he misunderstands it. The comedy comes from friendship, impatience, and limited knowledge at once."
  ],
  [
    "broad-apparatus-chapter-017-the-ramadan-2",
    "The unanswered door turns Ishmael's curiosity into worry. His friendship with Queequeg is comic, but it is also emotionally serious."
  ],
  [
    "broad-apparatus-chapter-022-merry-christmas-1",
    "Peleg and Bildad's voices clash even in departure. Urgency, profanity, piety, and command all crowd the deck as the voyage begins."
  ],
  [
    "broad-apparatus-chapter-023-the-lee-shore-1",
    "Bulkington's image turns seamanship into a moral choice: the safe-looking shore can be more dangerous than the open sea."
  ],
  [
    "broad-apparatus-chapter-026-knights-and-squires-2",
    "The arid-summer image turns Starbuck into a figure of discipline and restraint. That dryness matters when he later becomes Ahab's strongest conscience."
  ],
  [
    "curated-earlybook-chapter-030-the-pipe-my-pipe-hard-must-it-go-with-me-",
    "Ahab giving up the pipe shows ordinary comfort being stripped away by obsession. Even a small habit can no longer survive his purpose."
  ],
  [
    "subagent-earlybook-biographical-wicked-world-in-all-meridians",
    "Queequeg's reaction turns Ishmael's joke back against the Christian world he has seen. The moment shows why Queequeg cannot simply absorb the culture around him."
  ],
  [
    "subagent-curated-chapter-048-the-first-lowering-casting-loose-the-tackles-and-bands",
    "The first lowering begins with gear being released, not with heroic action. The practical choreography makes the scene feel charged before the boats are fully away."
  ],
  [
    "fedallah-private-crew",
    "Ahab's hidden boat crew shows that he has prepared a private mission inside the public voyage. Fedallah becomes part of the book's secrecy before he becomes fully legible."
  ],
  [
    "subagent-curated-chapter-052-the-albatross-skeleton-of-a-stranded-walrus",
    "The Albatross is described like a sea corpse, which makes the failed meeting feel eerie before anyone understands its warning."
  ],
  [
    "curated-latebook-chapter-096-the-try-works-the-only-true-lamp",
    "Melville contrasts natural sunlight with the deceptive glare of the try-works. The shipboard episode widens into a warning about false illumination."
  ],
  [
    "completion-pass-midnight-aloft-thunder-and-lightning-what-s-the-use-of-thunder",
    "The question cuts the storm down to a worker's immediate discomfort. Ahab may read omens, but the sailor aloft feels weather as labor."
  ],
  [
    "completion-pass-the-log-and-line-all-the-elements-had-combined-to-rot",
    "The rotted log-line shows how a neglected knowledge tool fails when it is finally needed. After Ahab rejects other instruments, broken measurement becomes part of the voyage's unraveling."
  ],
  [
    "broad-apparatus-chapter-135-the-chase-third-day-1",
    "Ahab's repeated question narrows the world to sight and pursuit. At the end, everything depends on whether the whale can be seen."
  ],
  [
    "chase-third-day-towards-thee",
    "Ahab's final speech turns pursuit into total self-definition. He can recognize destruction and still choose to aim himself at it."
  ],
  [
    "broad-apparatus-epilogue-epilogue-1",
    "The circling image places Ishmael at the edge of death before rescue. Survival begins inside the same whirlpool that ends the ship."
  ],
  [
    "extracts-whale-scrapbook",
    "The Extracts build a whale scrapbook from sacred texts, travel writing, science, jokes, and literature. That mixed archive prepares readers for a novel that keeps changing genres."
  ],
  [
    "broad-apparatus-chapter-009-the-sermon-2",
    "The hymn gives the sermon emotional force before its argument arrives. Despair, punishment, and rescue are already in the room."
  ],
  [
    "knights-isolatoes",
    "Ishmael's invented word means people who live as if on separate islands. On the Pequod, it captures the ship's strange mix of solitude and forced fellowship."
  ],
  [
    "subagent-curated-chapter-054-the-town-ho-s-story-as-told-at-the-golden-inn",
    "The heading signals a story inside a story. Moby-Dick keeps slipping into narrated frames, so readers have to notice who is telling and where."
  ],
  [
    "enter-ahab-stubb-command",
    "The chapter title sounds like stage direction, and the scene plays like a tense exchange between authority and comic resistance."
  ],
  [
    "first-night-watch-stubb-response",
    "The Latin stage direction marks the chapter as theater. Stubb's private voice lets readers hear how Ahab's command keeps working on the crew."
  ],
  [
    "subagent-earlybook-the-affidavit-natural-verity-of-the-main-points",
    "The chapter keeps asking for trust, but it also shows how much proof depends on the storyteller's authority."
  ],
  [
    "completion-pass-the-shark-massacre-whole-round-sea-was-one-huge-cheese",
    "The grotesque joke turns horror into an image readers can picture, making the shark scene funny and repulsive at the same time."
  ],
  [
    "curated-midbook-chapter-074-the-sperm-whale-s-head-contrasted-view-where-i-should-like-to-know-will",
    "The suspended whale heads become a live classroom. Ishmael turns the deck into a comparative cetology demonstration."
  ],
  [
    "broad-apparatus-chapter-079-the-prairie-1",
    "The phrenology reference points to a now-discredited nineteenth-century reading system. Ishmael borrows its language while making whale interpretation look absurdly difficult."
  ],
  [
    "curated-midbook-chapter-083-jonah-historically-regarded-two-spouts-in-his-head",
    "Ishmael tests the Jonah story against whalemen's anatomical knowledge. The chapter stages a debate between scripture, observation, and comic literalism."
  ],
  [
    "curated-latebook-chapter-096-the-try-works-greek-fire",
    "Greek fire was a historical incendiary weapon. The comparison makes the try-works blaze feel military, frightening, and hard to control."
  ],
  [
    "curated-latebook-chapter-097-the-lamp-aladdin-s-lamp",
    "The Aladdin allusion turns whale oil into magical domestic comfort. It helps readers see the strange intimacy of living by the product of the hunt."
  ],
  [
    "curated-latebook-chapter-102-a-bower-in-the-arsacides-the-hair-hung-sword-that-so-affr",
    "The whale jaw hangs like Damocles' sword, a sign of danger suspended over power. The image makes the temple scene feel precarious."
  ],
  [
    "curated-latebook-chapter-104-the-fossil-whale-basilosaurus",
    "Basilosaurus is an extinct primitive whale genus. The fossil name helps Ishmael show how whale bones can strain systems of classification."
  ],
  [
    "subagent-midbook-pitchpoling-all-fountains-must-run-wine-today",
    "Stubb's brag turns the strike into holiday language, letting the chapter mix skill, excess, and comic bravado."
  ],
  [
    "subagent-midbook-fast-fish-and-loose-fish-these-laws-might-be-engraven",
    "Melville makes the legal code tiny on purpose, mocking how huge and slippery ownership law can become."
  ],
  [
    "broad-apparatus-chapter-099-the-doubloon-2",
    "The coin is treated like a sacred object because Ahab has assigned it one purpose. The crew reads it through that pressure."
  ],
  [
    "deck-command-watch",
    "The late short chapters use stage-like compression. A few commands can show the whole ship tightening under Ahab's will."
  ],
  [
    "forecastle-bulwarks-crew-fear",
    "The crew's talk at the bulwarks gives readers a lower-deck angle on the storm. Melville keeps returning to collective voices, not only Ahab's."
  ],
  [
    "delight-ironic-name",
    "The ship's name is bitterly ironic because its news is grim. The last gam functions like a final warning before the chase."
  ],
  [
    "broad-apparatus-chapter-002-the-carpetbag-1",
    "Missing the packet forces Ishmael into New Bedford and into the comic ordeal of finding a bed. The delay is what makes the Queequeg encounter possible."
  ],
  [
    "broad-apparatus-chapter-005-breakfast-1",
    "The silent breakfast makes the inn's rough community visible. Ishmael notices laughter because humor becomes one way sailors survive danger and embarrassment."
  ],
  [
    "nightgown-shared-warmth",
    "The chapter pauses the plot for bodily comfort and trust. That warmth makes the later shipboard isolation feel less like the book's only possible world."
  ],
  [
    "broad-apparatus-chapter-012-biographical-1",
    "Queequeg's royal family history pushes back against treating him as a curiosity. Ishmael's account is imperfect, but it gives Queequeg status and a past."
  ],
  [
    "broad-apparatus-chapter-018-his-mark-2",
    "Peleg and Bildad demand papers, but Queequeg's worth is proved through action and skill. The scene tests what kinds of evidence count aboard a whaleship."
  ],
  [
    "his-mark-contract-faith",
    "Queequeg's signature turns friendship, religion, literacy, and labor contract into one scene. The chapter asks who gets recognized as trustworthy in a commercial world."
  ],
  [
    "going-aboard-shadowed-departure",
    "The departure is full of darkness, confusion, and half-seen figures. Melville makes boarding the ship feel like crossing into a different moral climate."
  ],
  [
    "broad-apparatus-chapter-022-merry-christmas-2",
    "Ahab's absence keeps him powerful. Even before readers meet him fully, the cabin becomes a hidden center of pressure."
  ],
  [
    "subagent-earlybook-the-advocate-yale-college-and-my-harvard",
    "Ishmael claims whaling educated him, so the voyage becomes a school of thought as well as work."
  ],
  [
    "broad-apparatus-chapter-027-knights-and-squires-1",
    "Stubb's cheerfulness is not innocence; it is a working style inside danger. His whaleboat feels social even when the work is deadly."
  ],
  [
    "broad-apparatus-chapter-028-ahab-1",
    "Ahab's first full appearance is framed as rule before personality. The language of lordship and dictatorship makes command feel almost sacred and threatening."
  ],
  [
    "broad-apparatus-chapter-029-enter-ahab-to-him-stubb-1",
    "The beautiful weather sharpens the ugliness of the command conflict. Calm surfaces do not prevent tension aboard the Pequod."
  ],
  [
    "broad-apparatus-chapter-031-queen-mab-1",
    "Stubb's dream makes Ahab feel monumental and absurd at once. Comedy becomes a way to speak fear without openly challenging command."
  ]
]);

const citationOverrides = new Map([
  ["curated-earlybook-chapter-009-the-sermon-five-hundred-gold-coins", ["standard-ebooks-moby-dick", "jonah-kjv-crossref"]],
  ["curated-earlybook-chapter-012-biographical-czar-peter", ["standard-ebooks-moby-dick", "britannica-peter-the-great"]],
  ["prophet-elijah-warning", ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["broad-apparatus-chapter-021-going-aboard-1", ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["jeroboam-gabriel-contagion", ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["broad-apparatus-chapter-083-jonah-historically-regarded-1", ["standard-ebooks-moby-dick", "jonah-kjv-crossref"]],
  ["broad-apparatus-chapter-104-the-fossil-whale-1", ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["curated-latebook-chapter-099-the-doubloon-belshazzar-s-awful-writing", ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["curated-latebook-chapter-126-the-life-buoy-herod-s-murdered-innocents", ["standard-ebooks-moby-dick", "king-james-bible"]],
  ["right-whale-head-contrast", ["standard-ebooks-moby-dick", "scoresby-arctic-regions-gutenberg"]],
  ["subagent-midbook-jonah-historically-regarded-a-couple-of-whist-tables", ["standard-ebooks-moby-dick", "jonah-kjv-crossref"]],
  ["heidelburgh-tun-case", ["standard-ebooks-moby-dick", "heidelberg-castle-tun"]],
  [
    "curated-midbook-chapter-077-the-great-heidelburgh-tun-the-great-heidelburgh-tun-of-the",
    ["standard-ebooks-moby-dick", "heidelberg-castle-tun"]
  ],
  ["prairie-phrenology-scale", ["standard-ebooks-moby-dick", "webster-1913"]],
  [
    "curated-earlybook-chapter-010-a-bosom-friend-phrenologically-an-excellent-one",
    ["standard-ebooks-moby-dick", "webster-1913"]
  ],
  [
    "curated-latebook-chapter-098-stowing-down-and-clearing-up-shadrach-meshach-and-abednego",
    ["standard-ebooks-moby-dick", "king-james-bible"]
  ],
  ["curated-latebook-chapter-111-the-pacific-potters-fields", ["standard-ebooks-moby-dick", "king-james-bible"]],
  [
    "curated-midbook-chapter-082-the-honor-and-glory-of-whaling-the-first-whale-attacked-by-our-",
    ["standard-ebooks-moby-dick", "bulfinch-age-of-fable"]
  ],
  [
    "curated-latebook-chapter-113-the-forge-mother-carey-s-chickens",
    ["standard-ebooks-moby-dick", "brewer-mother-careys-chickens"]
  ],
  [
    "curated-latebook-chapter-117-the-whale-watch-asphaltites",
    ["standard-ebooks-moby-dick", "king-james-bible", "britannica-supplement-asphaltites-wikisource"]
  ],
  ["whale-magnitude-extinction", ["standard-ebooks-moby-dick", "noaa-sperm-whale"]],
  ["broad-apparatus-chapter-079-the-prairie-1", ["standard-ebooks-moby-dick", "britannica-phrenology"]],
  [
    "curated-midbook-chapter-083-jonah-historically-regarded-two-spouts-in-his-head",
    ["standard-ebooks-moby-dick", "king-james-bible"]
  ],
  ["curated-latebook-chapter-096-the-try-works-greek-fire", ["standard-ebooks-moby-dick", "britannica-greek-fire"]],
  ["curated-latebook-chapter-097-the-lamp-aladdin-s-lamp", ["standard-ebooks-moby-dick", "project-gutenberg-aladdin"]],
  [
    "curated-latebook-chapter-102-a-bower-in-the-arsacides-the-hair-hung-sword-that-so-affr",
    ["standard-ebooks-moby-dick", "livius-cicero-damocles"]
  ],
  ["curated-latebook-chapter-104-the-fossil-whale-basilosaurus", ["standard-ebooks-moby-dick", "britannica-basilosaurus"]]
]);

const claimTypeOverrides = new Map([
  ["curated-earlybook-chapter-009-the-sermon-five-hundred-gold-coins", "biblical-context"],
  ["prophet-elijah-warning", "biblical-context"],
  ["broad-apparatus-chapter-021-going-aboard-1", "biblical-context"],
  ["jeroboam-gabriel-contagion", "biblical-context"],
  ["broad-apparatus-chapter-083-jonah-historically-regarded-1", "biblical-context"],
  ["broad-apparatus-chapter-104-the-fossil-whale-1", "biblical-context"],
  ["curated-latebook-chapter-099-the-doubloon-belshazzar-s-awful-writing", "biblical-context"],
  ["curated-latebook-chapter-126-the-life-buoy-herod-s-murdered-innocents", "biblical-context"],
  ["curated-earlybook-chapter-012-biographical-czar-peter", "historical-context"],
  ["right-whale-head-contrast", "nautical-whaling"],
  ["subagent-midbook-jonah-historically-regarded-a-couple-of-whist-tables", "biblical-context"],
  ["heidelburgh-tun-case", "historical-context"],
  ["curated-midbook-chapter-077-the-great-heidelburgh-tun-the-great-heidelburgh-tun-of-the", "historical-context"],
  ["prairie-phrenology-scale", "historical-context"],
  ["curated-earlybook-chapter-010-a-bosom-friend-phrenologically-an-excellent-one", "historical-context"],
  ["curated-latebook-chapter-098-stowing-down-and-clearing-up-shadrach-meshach-and-abednego", "biblical-context"],
  ["curated-latebook-chapter-111-the-pacific-potters-fields", "biblical-context"],
  ["curated-midbook-chapter-082-the-honor-and-glory-of-whaling-the-first-whale-attacked-by-our-", "classical-context"],
  ["curated-latebook-chapter-113-the-forge-mother-carey-s-chickens", "historical-context"],
  ["curated-latebook-chapter-117-the-whale-watch-asphaltites", "biblical-context"],
  ["whale-magnitude-extinction", "interpretive"],
  ["broad-apparatus-chapter-079-the-prairie-1", "historical-context"],
  ["curated-midbook-chapter-083-jonah-historically-regarded-two-spouts-in-his-head", "biblical-context"],
  ["curated-latebook-chapter-096-the-try-works-greek-fire", "historical-context"],
  ["curated-latebook-chapter-097-the-lamp-aladdin-s-lamp", "classical-context"],
  ["curated-latebook-chapter-102-a-bower-in-the-arsacides-the-hair-hung-sword-that-so-affr", "classical-context"],
  ["curated-latebook-chapter-104-the-fossil-whale-basilosaurus", "historical-context"]
]);

const toneReviewPromotionIds = new Set([
  "curated-earlybook-chapter-017-the-ramadan-presbyterians-and-pagans-alike",
  "subagent-earlybook-the-advocate-true-mother-of-that-now-mighty-colony",
  "curated-earlybook-chapter-041-moby-dick-those-uncivilized-seas-mostly-fr",
  "whiteness-symbol-warning",
  "broad-apparatus-chapter-060-the-line-1",
  "decanter-enderby-history"
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

const collection = JSON.parse(await readFile(annotationsPath, "utf8"));
let promoted = 0;

collection.annotations = collection.annotations.map((annotation) => {
  if (internalOnlyDemotions.has(annotation.id)) {
    return {
      ...annotation,
      display: {
        ...annotation.display,
        depth: "explore",
        priority: Math.max(annotation.display?.priority ?? 3, 3),
        inline: false,
        surfaces: ["index", "review"],
        spoiler_level: annotation.display?.spoiler_level ?? "none"
      },
      evidence: [
        {
          claim_type: "source-text-observation",
          citations: ["standard-ebooks-moby-dick"],
          validation: ["selector-resolves", "primary-source-checked"]
        }
      ],
      citations: ["standard-ebooks-moby-dick"],
      provenance: {
        ...annotation.provenance,
        method: "reviewed",
        reviewer: "codex",
        reviewed: today,
        retired: today,
        retired_reason: "internal-only-public-duplicate-or-thin-note"
      },
      tags: [...new Set([...(annotation.tags ?? []), "review:internal-only"])].sort(),
      status: {
        content_status: "draft",
        citation_status: "verified",
        review_queue: ["source-check"]
      }
    };
  }

  if (deprecatedPublicPromotions.has(annotation.id)) {
    return {
      ...annotation,
      display: {
        ...annotation.display,
        depth: "explore",
        priority: Math.max(annotation.display?.priority ?? 3, 3),
        inline: false,
        surfaces: ["index", "review"],
        spoiler_level: annotation.display?.spoiler_level ?? "none"
      },
      evidence: [
        {
          claim_type: "difficult-material",
          citations: ["standard-ebooks-moby-dick"],
          validation: ["selector-resolves", "needs-review", "tone-review"]
        }
      ],
      citations: ["standard-ebooks-moby-dick"],
      provenance: {
        ...annotation.provenance,
        method: "reviewed",
        reviewer: "codex",
        reviewed: today
      },
      status: {
        content_status: "needs-review",
        citation_status: "provisional",
        review_queue: [
          ...new Set([
            ...(annotation.status?.review_queue ?? []),
            "citation",
            "difficult-material",
            "source-check",
            "tone"
          ])
        ]
      }
    };
  }

  const note = promotions.get(annotation.id);
  if (!note) return annotation;
  promoted += 1;
  const citations = citationOverrides.get(annotation.id) ?? ["standard-ebooks-moby-dick"];
  const claimType = claimTypeOverrides.get(annotation.id) ?? "source-text-observation";
  const validation = ["selector-resolves", "primary-source-checked", "adversarial-review"];
  if (toneReviewPromotionIds.has(annotation.id)) validation.push("tone-review");

  return {
    ...annotation,
    note,
    display: {
      ...annotation.display,
      depth: "study",
      priority: Math.min(annotation.display?.priority ?? 2, 2),
      inline: true,
      surfaces: ["reader", "index"],
      spoiler_level: annotation.display?.spoiler_level ?? "none"
    },
    evidence: [
      {
        claim_type: claimType,
        citations,
        validation
      }
    ],
    citations,
    provenance: {
      ...annotation.provenance,
      method: "reviewed",
      reviewer: "codex",
      reviewed: today
    },
    status: {
      content_status: "student-ready",
      citation_status: "verified",
      review_queue: []
    }
  };
});

if (promoted !== promotions.size) {
  const foundIds = new Set(collection.annotations.map((annotation) => annotation.id));
  const missing = [...promotions.keys()].filter((id) => !foundIds.has(id));
  throw new Error(`Could not find all promotion records. Missing: ${missing.join(", ")}`);
}

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(collection, null, 2))}\n`);
console.log(`Promoted ${promoted} reviewed Study annotations.`);
