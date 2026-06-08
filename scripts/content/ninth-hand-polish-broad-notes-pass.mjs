import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "broad-apparatus-frontmatter-imprint-1": "The imprint makes the edition's labor visible. That matters for this guide because the full source text, licensing trail, and later student layers all depend on editorial work students rarely see.",
  "broad-apparatus-frontmatter-etymology-1": "The old grammar-duster is comic, but he also makes scholarship feel mortal and dusty. The whale-hunt begins in books before it begins at sea.",
  "broad-apparatus-frontmatter-extracts-1": "The Sub-Sub is both a joke and a warning: Moby-Dick will be built from other people's fragments as well as from Ishmael's voice.",
  "broad-apparatus-frontmatter-extracts-2": "This complaint about thankless labor fits the Extracts themselves. The archive is funny, excessive, and already anxious about whether anyone will value the work of gathering it.",
  "broad-apparatus-chapter-001-loomings-2": "Ishmael turns his private pull toward water into a shared human impulse. The move helps students see that the opening is personal but not merely private.",
  "broad-apparatus-chapter-002-the-carpetbag-1": "Missing the packet forces Ishmael into New Bedford and into the comic ordeal of finding a bed. The delay is what makes the Queequeg encounter possible.",
  "broad-apparatus-chapter-002-the-carpetbag-2": "Ishmael starts turning Nantucket into legend before he ever reaches it. The island is introduced as mythic whaling ground, not just a destination.",
  "broad-apparatus-chapter-003-the-spouter-inn-1": "The inn's painting is deliberately hard to read. It trains students for a novel where images of whales, ships, and danger often arrive blurred before they become meaningful.",
  "broad-apparatus-chapter-003-the-spouter-inn-2": "The picture's central mystery pulls Ishmael's attention the way the white whale will later pull the whole book's attention: uncertain, ominous, and hard to name.",
  "broad-apparatus-chapter-004-the-counterpane-1": "Ishmael links waking beside Queequeg to a childhood memory of fear and uncertainty. The scene makes intimacy feel strange before it becomes trust.",
  "broad-apparatus-chapter-004-the-counterpane-2": "The comic word resurrection gives a frightening childhood memory a religious echo. Ishmael often handles fear by turning it into language he can shape.",
  "broad-apparatus-chapter-005-breakfast-1": "The silent breakfast makes the inn's rough community visible. Ishmael notices laughter because humor becomes one way sailors survive danger and embarrassment.",
  "broad-apparatus-chapter-006-the-street-1": "The New Bedford street scene gives students an early glimpse of whaling as a global industry. The voyage begins in a port already crowded with distant worlds.",
  "broad-apparatus-chapter-007-the-chapel-1": "Ishmael's errand to the chapel moves the story from lodging-house comedy into mourning. Before the Pequod sails, the book makes shipwreck and loss visible.",
  "broad-apparatus-chapter-008-the-pulpit-1": "Mapple's past as sailor and harpooneer lets the pulpit speak the language of the sea. His sermon belongs to whaling culture, not outside it.",
  "broad-apparatus-chapter-009-the-sermon-1": "The congregation sounds like a ship's crew before Mapple fully begins. Melville lets church space and ship space overlap.",
  "broad-apparatus-chapter-009-the-sermon-2": "The hymn gives the sermon emotional force before its argument arrives. Despair, punishment, and rescue are already in the room.",
  "broad-apparatus-chapter-010-a-bosom-friend-1": "Ishmael's language is affectionate and prejudiced at the same time. Students should notice both his growing openness to Queequeg and the limits of his vocabulary.",
  "broad-apparatus-chapter-010-a-bosom-friend-2": "Ishmael recognizes dignity in Queequeg before he fully knows how to describe it respectfully. The friendship develops inside that tension.",
  "broad-apparatus-chapter-011-nightgown-1": "The warmth chapter turns comfort into philosophy. Ishmael uses the shared bed to think about contrast, companionship, and what can be felt only because something else is cold.",
  "broad-apparatus-chapter-012-biographical-1": "Queequeg's royal family history pushes back against treating him as a curiosity. Ishmael's account is imperfect, but it gives Queequeg status and a past.",
  "broad-apparatus-chapter-013-wheelbarrow-1": "The harpoon on shore is funny because Queequeg carries his sea identity into ordinary town life. The joke also reminds students that his skill is never far away.",
  "broad-apparatus-chapter-013-wheelbarrow-2": "The borrowed wheelbarrow story turns cultural misunderstanding into comedy without making Queequeg foolish. It is Ishmael who has to learn how context changes meaning.",
  "broad-apparatus-chapter-014-nantucket-1": "Nantucket is introduced as physically small but imaginatively enormous. The joke prepares students for the island's outsized whaling power.",
  "broad-apparatus-chapter-015-chowder-1": "The Try Pots sign turns food, ship gear, and whaling imagery into one doorway. Even dinner is staged through the materials of the voyage.",
  "broad-apparatus-chapter-016-the-ship-2": "Ishmael trusts Queequeg's practical judgment when choosing a ship. The moment shows their friendship becoming a working partnership.",
  "broad-apparatus-chapter-017-the-ramadan-1": "Ishmael tries to respect Queequeg's ritual while also misunderstanding it. The chapter's comedy comes from concern, impatience, and cultural limits at once.",
  "broad-apparatus-chapter-017-the-ramadan-2": "The unanswered door turns Ishmael's curiosity into worry. His friendship with Queequeg is comic, but it is also emotionally serious.",
  "broad-apparatus-chapter-018-his-mark-1": "Ishmael's quick defense of Queequeg shows the friendship becoming public. He is no longer only observing Queequeg; he is willing to answer for him.",
  "broad-apparatus-chapter-018-his-mark-2": "Peleg and Bildad demand papers, but Queequeg's worth is proved through action and skill. The scene tests what kinds of evidence count aboard a whaleship.",
  "broad-apparatus-chapter-019-the-prophet-1": "Elijah's shabby appearance makes prophecy feel marginal rather than grand. Warning comes from someone easy to dismiss.",
  "broad-apparatus-chapter-019-the-prophet-2": "Elijah's scarred face makes his warning bodily and unsettling. The chapter turns prophecy into atmosphere before it becomes information.",
  "broad-apparatus-chapter-020-all-astir-1": "Ishmael and Queequeg are nearly aboard, but they still sleep ashore. The chapter catches the in-between feeling before departure becomes irreversible.",
  "broad-apparatus-chapter-021-going-aboard-1": "Ishmael tries to push Elijah away, but the warning has already entered the voyage. The scene shows how hard it is to dismiss a bad omen cleanly.",
  "broad-apparatus-chapter-022-merry-christmas-1": "Peleg and Bildad's voices clash even in departure: urgency, profanity, piety, and command all crowd the deck at once.",
  "broad-apparatus-chapter-022-merry-christmas-2": "Ahab's absence keeps him powerful. Even before students meet him fully, the cabin becomes a hidden center of pressure.",
  "broad-apparatus-chapter-023-the-lee-shore-1": "Bulkington's image turns seamanship into a moral choice: the safe-looking shore can be more dangerous than the open sea.",
  "broad-apparatus-chapter-024-the-advocate-1": "Ishmael knows whaling is socially dismissed, so he argues for its dignity with comic defensiveness. The chapter is advocacy, not neutral description.",
  "broad-apparatus-chapter-024-the-advocate-2": "The comparison to celebrated butchers exposes a double standard. Ishmael asks why some forms of violence receive honor while whaling receives contempt.",
  "broad-apparatus-chapter-025-postscript-1": "The royal table joke extends Ishmael's defense of whaling into absurd ceremony. He wants whale oil and whale labor recognized inside high culture.",
  "broad-apparatus-chapter-026-knights-and-squires-1": "Starbuck's dry, austere description makes his seriousness physical. His body seems shaped by restraint before we hear much from him.",
  "broad-apparatus-chapter-026-knights-and-squires-2": "The arid-summer image turns Starbuck into a figure of discipline and lack. This matters when he later becomes the main conscience against Ahab.",
  "broad-apparatus-chapter-027-knights-and-squires-1": "Stubb's cheerfulness is not innocence; it is a working style inside danger. His whaleboat feels social even when the work is deadly.",
  "broad-apparatus-chapter-027-knights-and-squires-2": "The stage-driver comparison makes Stubb's boatmanship comic and practical. He manages danger by making his space feel familiar.",
  "broad-apparatus-chapter-028-ahab-1": "Ahab's first full appearance is framed as rule before personality. The language of lordship and dictatorship makes command feel almost sacred and threatening.",
  "broad-apparatus-chapter-028-ahab-2": "Elijah's earlier warnings return when Ahab appears. Melville makes prophecy work by echo: a strange comment becomes meaningful later.",
  "broad-apparatus-chapter-029-enter-ahab-to-him-stubb-1": "The beautiful weather sharpens the ugliness of the command conflict. Calm surfaces do not prevent tension aboard the Pequod.",
  "broad-apparatus-chapter-030-the-pipe-1": "Ahab's pipe should be a sign of ordinary human ease, but he cannot inhabit it. Giving it up shows how obsession pushes out comfort.",
  "broad-apparatus-chapter-031-queen-mab-1": "Stubb's dream makes Ahab feel monumental and absurd at once. Comedy becomes a way to speak fear without openly challenging command.",
  "broad-apparatus-chapter-032-cetology-1": "Ishmael admits he wants to display the whale systematically. The ambition matters even when the system later looks comic or strained.",
  "broad-apparatus-chapter-032-cetology-2": "The phrase classification of chaos names the whole problem of Cetology. Ishmael tries to make order while knowing the subject resists it.",
  "broad-apparatus-chapter-033-the-specksnyder-1": "The word Specksnyder preserves an older labor hierarchy. Defining it shows how whaling power depends on specialized work, not only on captains."
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
