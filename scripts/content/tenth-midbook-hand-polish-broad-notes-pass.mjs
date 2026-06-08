import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "broad-apparatus-chapter-034-the-cabin-table-1": "Ahab's indifference at dinner shows command as isolation. Even ordinary shipboard routines become tense when the captain refuses common social signals.",
  "broad-apparatus-chapter-034-the-cabin-table-2": "The movement from shrouds to dinner table makes hierarchy physical. Ahab enters the shared space, but the scene still keeps him emotionally apart.",
  "broad-apparatus-chapter-035-the-masthead-1": "Ishmael treats masthead duty as both practical lookout work and an ancient human habit of watching from heights.",
  "broad-apparatus-chapter-035-the-masthead-2": "The Egyptian comparison is comic overreach, but it shows Ishmael's method: even a shipboard job becomes part of a huge cultural history.",
  "broad-apparatus-chapter-037-sunset-1": "Ahab's soliloquy turns the sea into opposition. The voice is theatrical because he speaks as if even the waves are an audience and an enemy.",
  "broad-apparatus-chapter-038-dusk-1": "Starbuck names the damage Ahab has done to his judgment. The short stage-like chapter lets conscience speak before obedience resumes.",
  "broad-apparatus-chapter-039-first-night-watch-1": "Stubb half-understands Starbuck's disturbance but turns it into his own comic fatalism. The sequence shows each officer processing Ahab differently.",
  "broad-apparatus-chapter-040-midnight-forecastle-1": "The forecastle scene refuses a single noble mood. Sailors answer Ahab's ritual with jokes, songs, fear, appetite, and competing voices.",
  "broad-apparatus-chapter-040-midnight-forecastle-2": "The song folds whaling into performance. The crew turns labor, danger, and captain-centered loyalty into a chorus.",
  "broad-apparatus-chapter-044-the-chart-1": "Ahab's nightly pencil work makes obsession look disciplined. He studies migration patterns, but the chart serves desire as much as navigation.",
  "broad-apparatus-chapter-046-surmises-1": "Ishmael is trying to infer Ahab's motives from limited evidence. The chapter matters because the narrator admits explanation is a pressure, not a certainty.",
  "broad-apparatus-chapter-048-the-first-lowering-1": "Fedallah's first appearance is staged as shock and suspicion. The description carries plot mystery and racialized menace at the same time, so it needs careful reading.",
  "broad-apparatus-chapter-048-the-first-lowering-2": "The clothing detail makes Fedallah look funereal before the crew understands his role. Melville turns costume into omen.",
  "broad-apparatus-chapter-053-the-gam-1": "The gam is a practical social system for ships far from home. Ishmael explains it so later meetings feel like a maritime network, not random interruptions.",
  "broad-apparatus-chapter-053-the-gam-2": "Letters make the gam emotionally important. A ship meeting can carry family news, delayed messages, and fragile contact with shore.",
  "broad-apparatus-chapter-055-of-the-monstrous-pictures-of-whales-2": "The Elephanta example pushes whale imagery into global and ancient settings, while also showing how easily pictures become distorted evidence.",
  "broad-apparatus-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes-1": "Ishmael's list of published whale outlines shows his standards for evidence. He wants better pictures, but he still argues like a whaleman correcting books.",
  "broad-apparatus-chapter-056-of-the-less-erroneous-pictures-of-whales-and-the-true-pictures-of-whaling-scenes-2": "The return to Colnett and Cuvier makes these picture chapters cumulative. Ishmael keeps comparing authorities because no single image settles the whale.",
  "broad-apparatus-chapter-057-of-whales-in-paint-in-teeth-in-wood-in-sheet-iron-in-stone-in-mountains-in-stars-1": "The man with the picture and stump turns whale representation into public performance. Evidence, injury, and spectacle all get mixed together.",
  "broad-apparatus-chapter-058-brit-1": "The wheat-field image makes whale feeding beautiful before it becomes technical. Students can see ecology first as a scene, then as a system.",
  "broad-apparatus-chapter-060-the-line-1": "The racialized comparison of hemp and Manilla rope turns technical description into period prejudice. Keep the rope facts separate from the harmful analogy.",
  "broad-apparatus-chapter-060-the-line-2": "The whale-line looks deceptively slight, which is exactly why the chapter stresses danger. A small-looking tool can govern life and death in the boat.",
  "broad-apparatus-chapter-061-stubb-kills-a-whale-1": "Ishmael's dreamy masthead mood makes the sudden whale action feel almost enchanted. The hunt begins from drowsiness, not heroic readiness.",
  "broad-apparatus-chapter-061-stubb-kills-a-whale-2": "The drowsy mastheads show how routine can dull attention even in dangerous work. Melville lets labor fatigue shape the action.",
  "broad-apparatus-chapter-062-the-dart-1": "The Dart turns a hunting technique into a lesson about divided attention. Good whaling requires bodily control, not just courage.",
  "broad-apparatus-chapter-063-the-crotch-1": "The Crotch pauses over a small tool because small tools organize the whole chase. The chapter trains students to respect technical detail.",
  "broad-apparatus-chapter-064-stubb-s-supper-1": "The corpse is moored to the ship like cargo and danger at once. After the kill, the whale remains an enormous practical problem.",
  "broad-apparatus-chapter-064-stubb-s-supper-2": "Stubb's bustle gives him temporary command over the aftermath. His comic energy is also a labor-management style.",
  "broad-apparatus-chapter-065-the-whale-as-a-dish-1": "The right-whale tongue example turns appetite into history. Ishmael's food chapter is really about how cultures decide what parts of whales can be used.",
  "broad-apparatus-chapter-066-the-shark-massacre-1": "The business after the kill is slow, collective, and exhausting. This sentence reminds students that whaling violence continues as labor.",
  "broad-apparatus-chapter-067-cutting-in-1": "The sea-gods image makes cutting-in feel ritualized and excessive. Industrial work is described with sacrificial language.",
  "broad-apparatus-chapter-068-the-blanket-1": "Ishmael's confidence stops at opinion. The skin chapter is scientific-sounding, but it openly admits uncertainty.",
  "broad-apparatus-chapter-069-the-funeral-1": "The floating carcass becomes a public, lingering sight. The chapter makes the aftermath of extraction ugly and hard to look away from.",
  "broad-apparatus-chapter-070-the-sphynx-1": "Stubb's boast about beheading turns whale anatomy into skilled speed. The severed head then becomes a riddle for Ahab, not only a work product.",
  "broad-apparatus-chapter-071-the-jeroboam-s-story-1": "The Pequod cannot easily reach the Jeroboam, so the gam begins as distance and signal rather than fellowship. Communication at sea is fragile.",
  "broad-apparatus-chapter-071-the-jeroboam-s-story-2": "The signal sets up a meeting governed by warning, illness, and rumor. Before anyone speaks, the ship-to-ship code tells students to expect trouble.",
  "broad-apparatus-chapter-072-the-monkey-rope-1": "The monkey-rope scene is chaotic because the work is simultaneous. Melville makes interdependence feel like physical disorder.",
  "broad-apparatus-chapter-072-the-monkey-rope-2": "Ishmael compares describing the work to doing the work. The sentence turns narrative itself into a tangled rope problem.",
  "broad-apparatus-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him-1": "The suspended sperm-whale head keeps unfinished labor literally hanging beside the ship while the plot turns toward another whale.",
  "broad-apparatus-chapter-073-stubb-and-flask-kill-a-right-whale-and-then-have-a-talk-over-him-2": "The tackles holding the head make superstition depend on hardware. If the rig fails, the symbolic plan fails too.",
  "broad-apparatus-chapter-074-the-sperm-whale-s-head-contrasted-view-1": "For the Nantucketer, whale classification begins in use and encounter. The heads matter because whalemen know them through work.",
  "broad-apparatus-chapter-074-the-sperm-whale-s-head-contrasted-view-2": "The chapter asks students to look comparatively. Sperm whale and right whale anatomy become two ways of organizing knowledge."
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
