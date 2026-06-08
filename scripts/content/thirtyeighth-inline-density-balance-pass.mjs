import { readFile, writeFile } from "node:fs/promises";
import { loadGuideData } from "../../src/lib/guide-data.js";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const layersPath = "data/annotations/moby-dick.annotation-layers.json";

const annotations = JSON.parse(await readFile(annotationsPath, "utf8"));
const layers = JSON.parse(await readFile(layersPath, "utf8"));
const guideData = await loadGuideData();
const unitsById = new Map(guideData.units.map((unit) => [unit.unit_id, unit]));
const threshold = layers.density_thresholds.study_inline_marks_per_paragraph;

const adjustableTags = new Set([
  "provenance:ten-note-floor-pass",
  "provenance:subagent-curated-overlay-pass"
]);

function paragraphRanges(text) {
  const ranges = [];
  let offset = 0;
  for (const paragraph of text.split(/\n{2,}/)) {
    const start = offset;
    const end = start + paragraph.length;
    ranges.push({ start, end });
    offset = end + 2;
  }
  return ranges;
}

function isReaderInline(annotation) {
  return annotation.display?.inline !== false && (annotation.display?.surfaces ?? ["reader"]).includes("reader");
}

function isAdjustable(annotation) {
  return (annotation.tags ?? []).some((tag) => adjustableTags.has(tag));
}

function demoteInline(annotation) {
  annotation.display.inline = false;
  annotation.display.surfaces = (annotation.display.surfaces ?? []).filter((surface) => surface !== "reader");
  if (!annotation.display.surfaces.includes("review")) annotation.display.surfaces.push("review");
}

let demoted = 0;
const warnings = [];

for (const unit of guideData.units) {
  const unitAnnotations = annotations.annotations
    .filter((annotation) => annotation.unit_id === unit.unit_id)
    .filter((annotation) => Number.isInteger(annotation.selector?.position?.start))
    .sort((a, b) => a.selector.position.start - b.selector.position.start);

  for (const paragraph of paragraphRanges(unit.plain_text)) {
    const inlineInParagraph = unitAnnotations.filter((annotation) => {
      const start = annotation.selector.position.start;
      const end = annotation.selector.position.end;
      return isReaderInline(annotation) && start >= paragraph.start && end <= paragraph.end;
    });

    if (inlineInParagraph.length <= threshold) continue;

    const adjustable = inlineInParagraph
      .filter(isAdjustable)
      .sort((a, b) => (b.display?.priority ?? 3) - (a.display?.priority ?? 3) || b.selector.position.start - a.selector.position.start);
    const needed = inlineInParagraph.length - threshold;

    if (adjustable.length < needed) {
      warnings.push({ unit_id: unit.unit_id, inline: inlineInParagraph.length, adjustable: adjustable.length, needed });
    }

    for (const annotation of adjustable.slice(0, needed)) {
      demoteInline(annotation);
      demoted += 1;
    }
  }
}

await writeFile(annotationsPath, `${JSON.stringify(annotations, null, 2)}\n`);

console.log(JSON.stringify({ demoted, warnings }, null, 2));
