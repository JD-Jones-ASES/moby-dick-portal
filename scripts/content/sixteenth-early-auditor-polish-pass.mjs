import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "classroom-second-anchor-chapter-010-a-bosom-friend": "Ishmael crosses from fear to trust here and treats Queequeg as a companion, not a threat.",
  "whole-book-density-chapter-010-a-bosom-friend-3": "This scene locks in Ishmael's bond with Queequeg, so later chapters can assume real friendship.",
  "classroom-second-anchor-chapter-011-nightgown": "The shared bed makes Queequeg feel warm, talkative, and ordinary instead of frightening.",
  "whole-book-density-chapter-011-nightgown-3": "The warmth and conversation turn Queequeg from a threat into a private companion.",
  "classroom-second-anchor-chapter-012-biographical": "Queequeg's royal background gives him a past and rank that outrun Ishmael's first assumptions.",
  "whole-book-density-chapter-012-biographical-3": "The son-of-a-king detail turns the chapter from comic biography into a claim about Queequeg's dignity.",
  "classroom-second-anchor-chapter-013-wheelbarrow": "The wheelbarrow joke shows Ishmael misreading Queequeg's ordinary tool as a strange custom.",
  "classroom-second-anchor-chapter-014-nantucket": "Nantucket is tiny on land but huge because its economy depends on whaling.",
  "whole-book-density-chapter-014-nantucket-3": "Ishmael keeps linking the island's scale to the wealth and labor built on whale work.",
  "classroom-second-anchor-chapter-015-chowder": "The Try Pots scene uses food and talk to introduce Nantucket life before the Pequod.",
  "whole-book-density-chapter-015-chowder-3": "The meal slows the book down so students see appetite and local commerce beside the voyage plot.",
  "classroom-second-anchor-chapter-016-the-ship": "Signing onto the Pequod turns the friendship into a work arrangement inside a bigger hierarchy.",
  "whole-book-density-chapter-016-the-ship-3": "The shipboard contract binds Ishmael and Queequeg to Ahab's unseen command.",
  "classroom-second-anchor-chapter-017-the-ramadan": "Ishmael misreads Queequeg's fast and has to learn that another religion can look unfamiliar without being absurd.",
  "whole-book-density-chapter-017-the-ramadan-3": "The fast becomes a test of patience: Ishmael waits, worries, and realizes he does not understand what Queequeg is doing.",
  "classroom-second-anchor-chapter-018-his-mark": "Queequeg's mark forces the owners to treat skill and trust as proof, not appearance or paperwork.",
  "whole-book-density-chapter-018-his-mark-3": "Queequeg's signature officially brings him into the Pequod's labor system.",
  "classroom-second-anchor-chapter-019-the-prophet": "Elijah's warning makes the voyage feel haunted before Ahab appears.",
  "whole-book-density-chapter-019-the-prophet-3": "The warning sticks because Ishmael cannot fully dismiss it, even when he tries.",
  "classroom-second-anchor-chapter-020-all-astir": "The ship is being readied for departure while Ahab stays offstage, so the chapter builds suspense through ordinary work.",
  "whole-book-density-chapter-020-all-astir-3": "This is the last busy pause before the voyage begins in earnest.",
  "classroom-second-anchor-chapter-021-going-aboard": "Boarding in the dark keeps Elijah's warning active and makes the ship feel harder to read.",
  "whole-book-density-chapter-021-going-aboard-3": "The pre-dawn boarding pushes Ishmael and Queequeg from shore life into the ship's uncertainty.",
  "classroom-second-anchor-chapter-022-merry-christmas": "The Pequod leaves on Christmas Day, but the holiday is stripped of comfort by weather and command.",
  "whole-book-density-chapter-022-merry-christmas-3": "The departure scene joins piety, labor, and control, so the voyage starts under pressure.",
  "classroom-second-anchor-chapter-023-the-lee-shore": "Bulkington's brief appearance turns shore safety into a false comfort.",
  "whole-book-density-chapter-023-the-lee-shore-3": "The chapter praises open-sea living as a hard, risky alternative to land.",
  "classroom-second-anchor-chapter-024-the-advocate": "Ishmael argues that whaling deserves respect because it is skilled work that depends on risk and cooperation.",
  "whole-book-density-chapter-024-the-advocate-3": "The defense of whaling keeps the novel honest about labor instead of treating the voyage as pure adventure."
}));

const data = JSON.parse(await readFile(annotationsPath, "utf8"));
const missing = [];
let updated = 0;

for (const [id, note] of replacements) {
  const annotation = data.annotations.find((item) => item.id === id);
  if (!annotation) {
    missing.push(id);
    continue;
  }
  annotation.note = note;
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:subagent-quality-repair"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, missing }, null, 2));
