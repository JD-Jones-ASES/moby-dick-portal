import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "data", "chapters", "moby-dick.chapter-manifest.json");
const outDir = path.join(repoRoot, "data", "paths");

const inclusionLevels = ["required", "recommended", "optional", "summary-only", "defer", "excluded"];

function rationaleFor(pathId, unit, level) {
  if (pathId === "full_text") return "The full-text path preserves every source reading unit in Standard Ebooks order.";
  if (unit.section_type === "frontmatter") {
    if (level === "recommended") return "This prefatory unit helps students see Melville's frame and source habits before the narrative begins.";
    if (level === "summary-only") return "This prefatory unit can be summarized for a fast plot route while remaining recoverable.";
    return "This source unit is kept available without interrupting the selected path.";
  }
  if (unit.section_type === "epilogue") return "The epilogue explains Ishmael's survival and completes the frame of the story.";

  if (pathId === "narrative_core") {
    if (level === "required") return "Required for a coherent first-pass plot route through Ishmael, Queequeg, Ahab, the Pequod, and the final chase.";
    return "Skipped as full prose in the shortest route, but represented by a summary so the reader can recover context.";
  }

  if (pathId === "classroom_standard") {
    if (level === "required") return "Required for the default classroom path because it carries plot, character, form, or a major symbolic movement.";
    if (level === "recommended") return "Recommended as a compact way to preserve Melville's whaling, cetology, legal, symbolic, or formal range.";
    if (level === "optional") return "Useful enrichment for classes with more time or a focused thematic trail.";
    return "Deferred from the default classroom sequence while remaining available on demand.";
  }

  return "Path rationale pending.";
}

function buildScope(units, pathId) {
  const scope = {
    required_units: 0,
    recommended_units: 0,
    optional_units: 0,
    summary_only_units: 0,
    deferred_units: 0,
    word_count_required: 0
  };

  for (const unit of units) {
    const level = pathId === "full_text" ? "required" : unit.paths[pathId] ?? "defer";
    if (level === "required") {
      scope.required_units += 1;
      scope.word_count_required += unit.word_count;
    } else if (level === "recommended") {
      scope.recommended_units += 1;
    } else if (level === "optional") {
      scope.optional_units += 1;
    } else if (level === "summary-only") {
      scope.summary_only_units += 1;
    } else if (level === "defer") {
      scope.deferred_units += 1;
    }
  }

  return scope;
}

function buildPath(manifest, config) {
  const unitRules = manifest.units.map((unit) => {
    const level = config.id === "full_text" ? "required" : unit.paths[config.id] ?? "defer";
    if (!inclusionLevels.includes(level)) {
      throw new Error(`Unknown inclusion level "${level}" for ${unit.unit_id} in ${config.id}`);
    }

    return {
      unit_id: unit.unit_id,
      section_type: unit.section_type,
      number: unit.number,
      title: unit.title,
      level,
      rationale: rationaleFor(config.id, unit, level)
    };
  });

  return {
    id: config.id,
    title: config.title,
    audience: config.audience,
    description: config.description,
    goals: config.goals,
    scope: buildScope(manifest.units, config.id),
    unit_rules: unitRules,
    omission_rationale: config.omission_rationale,
    status: {
      classification_confidence: "medium",
      citation_status: "provisional"
    }
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const configs = [
    {
      id: "full_text",
      title: "Full Text",
      audience: "Readers studying or teaching the whole Standard Ebooks text.",
      description: "Every reading unit in source order, with optional guide layers available but no abridgment.",
      goals: [
        "Preserve the complete source text.",
        "Make all abridged-path omissions reversible.",
        "Keep prefatory matter, chapters, epilogue, and source order visible."
      ],
      omission_rationale: "Nothing is omitted in this path."
    },
    {
      id: "narrative_core",
      title: "Narrative Core",
      audience: "Students who need the shortest coherent first pass through the story.",
      description: "A fast route through the opening shore chapters, the Pequod's departure, Ahab's declared hunt, major warnings, late conflict, and the final chase.",
      goals: [
        "Keep the plot understandable without permanent cuts.",
        "Preserve Ishmael and Queequeg's bond, Ahab's quest, the voyage's warnings, and the ending.",
        "Represent skipped chapters by summary so students can reenter the full text."
      ],
      omission_rationale: "Most encyclopedic, cetological, legal, and labor chapters are summarized rather than read as full prose in order to reduce first-pass load."
    },
    {
      id: "classroom_standard",
      title: "Classroom Standard",
      audience: "Teachers and students who want a balanced route through plot, form, symbols, whaling knowledge, and major set pieces.",
      description: "A default teaching path that keeps the narrative spine while restoring selected middle chapters that show why the novel is stranger and richer than its plot.",
      goals: [
        "Preserve the plot while making Melville's digressive design visible.",
        "Include major character, cetology, gam, whaling-labor, symbolic, legal-political, and theatrical chapters.",
        "Give teachers a defensible default path that can expand into thematic trails."
      ],
      omission_rationale: "The path defers repeated or highly specialized chapters unless they are especially useful for classroom discussion, thematic range, or continuity."
    }
  ];

  await mkdir(outDir, { recursive: true });
  for (const config of configs) {
    const readingPath = buildPath(manifest, config);
    await writeFile(path.join(outDir, `${config.id}.json`), `${JSON.stringify(readingPath, null, 2)}\n`);
  }

  console.log(`Wrote ${configs.length} reading paths to ${path.relative(repoRoot, outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
