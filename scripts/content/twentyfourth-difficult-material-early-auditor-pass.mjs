import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";

const replacements = new Map(Object.entries({
  "difficult-review-frontmatter-extracts": "The word `savages` is a colonial slur, not a neutral label. Note that the front matter frames non-European people through a racist hierarchy.",
  "difficult-review-chapter-004-the-counterpane": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-005-breakfast": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-007-the-chapel": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-011-nightgown": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-012-biographical": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-013-wheelbarrow": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-016-the-ship": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-018-his-mark": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-019-the-prophet": "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  "difficult-review-chapter-024-the-advocate": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-027-knights-and-squires": "The passage uses racist nineteenth-century language. Name it plainly, explain that it is not neutral, and do not soften it as period detail.",
  "difficult-review-chapter-028-ahab": "The text frames non-Christian practice as sinful. Note the prejudice plainly and do not present it as neutral observation.",
  "difficult-review-chapter-029-enter-ahab-to-him-stubb": "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  "difficult-review-chapter-031-queen-mab": "The passage uses racialized and colonial language. Name the prejudice directly and keep students from treating the wording as neutral.",
  "difficult-review-chapter-032-cetology": "The passage uses racialized and colonial language. Name the prejudice directly and keep students from treating the wording as neutral.",
  "difficult-review-chapter-034-the-cabin-table": "The passage uses racialized and colonial language. Name the prejudice directly and keep students from treating the wording as neutral.",
  "difficult-review-chapter-036-the-quarterdeck": "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  "difficult-review-chapter-037-sunset": "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  "difficult-review-chapter-038-dusk": "The text frames non-Christian practice as sinful. Note the prejudice plainly and do not present it as neutral observation.",
  "difficult-review-chapter-040-midnight-forecastle": "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  "difficult-review-chapter-041-moby-dick": "The chapter uses racialized language while making a symbolic point. Keep the symbolism and the prejudice separate.",
  "difficult-review-chapter-042-the-whiteness-of-the-whale": "The chapter turns whiteness into a symbol and also relies on racialized assumptions. Keep the symbolic argument and the prejudice separate.",
  "difficult-review-chapter-044-the-chart": "The text uses stigmatizing language for mental illness. Say that it is historical vocabulary, not clinical language, and do not repeat it as diagnosis.",
  "difficult-review-chapter-045-the-affidavit": "The affidavit preserves racist or colonial language inside a legal record. Note that the document records bias; it does not make the wording objective."
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
  annotation.tags = [...new Set([...(annotation.tags ?? []), "review:difficult-material-subagent-polished"])].sort();
  updated += 1;
}

await writeFile(annotationsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, missing }, null, 2));
