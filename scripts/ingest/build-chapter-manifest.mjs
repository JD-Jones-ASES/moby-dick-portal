import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const sourceBaseDir = path.join(
  repoRoot,
  "vendor",
  "standard-ebooks",
  "herman-melville_moby-dick-master",
  "src",
  "epub"
);
const textDir = path.join(sourceBaseDir, "text");
const opfFile = path.join(sourceBaseDir, "content.opf");
const outDir = path.join(repoRoot, "data", "chapters");
const outFile = path.join(outDir, "moby-dick.chapter-manifest.json");
const summarySeedFile = path.join(outDir, "moby-dick.summary-seeds.json");

const sourceUnits = [
  { file: "titlepage.xhtml", sectionType: "frontmatter" },
  { file: "imprint.xhtml", sectionType: "frontmatter" },
  { file: "dedication.xhtml", sectionType: "frontmatter" },
  { file: "etymology.xhtml", sectionType: "frontmatter" },
  { file: "extracts.xhtml", sectionType: "frontmatter" },
  { file: "halftitlepage.xhtml", sectionType: "frontmatter" },
  ...Array.from({ length: 135 }, (_, index) => ({
    file: `chapter-${index + 1}.xhtml`,
    sectionType: "chapter"
  })),
  { file: "epilogue.xhtml", sectionType: "epilogue" }
];

const functionSeeds = new Map([
  [7, ["narrative", "symbolic"]],
  [8, ["sermon", "symbolic"]],
  [9, ["sermon", "biblical-allusion", "prophecy"]],
  [10, ["narrative", "character"]],
  [11, ["narrative", "character"]],
  [12, ["narrative", "character"]],
  [14, ["narrative", "whaling-labor"]],
  [16, ["narrative", "whaling-labor"]],
  [17, ["narrative", "character"]],
  [18, ["narrative", "character"]],
  [19, ["narrative", "prophecy"]],
  [23, ["narrative", "symbolic"]],
  [24, ["whaling-labor", "legal-political"]],
  [25, ["whaling-labor", "legal-political"]],
  [26, ["character"]],
  [27, ["character"]],
  [28, ["narrative", "character"]],
  [29, ["narrative", "character"]],
  [30, ["character", "symbolic"]],
  [31, ["narrative", "prophecy"]],
  [32, ["cetology"]],
  [33, ["whaling-labor"]],
  [34, ["character", "whaling-labor"]],
  [35, ["whaling-labor", "symbolic"]],
  [36, ["narrative", "character", "prophecy"]],
  [37, ["theatrical", "character"]],
  [38, ["theatrical", "character"]],
  [39, ["theatrical", "character"]],
  [40, ["theatrical", "character"]],
  [41, ["narrative", "symbolic"]],
  [42, ["symbolic"]],
  [43, ["narrative", "transition"]],
  [44, ["narrative", "character"]],
  [45, ["legal-political", "symbolic"]],
  [46, ["narrative", "character"]],
  [47, ["narrative", "symbolic"]],
  [48, ["narrative", "whaling-labor"]],
  [49, ["narrative", "character"]],
  [50, ["narrative", "character"]],
  [51, ["narrative", "symbolic"]],
  [52, ["gam"]],
  [53, ["gam", "whaling-labor"]],
  [54, ["gam", "narrative"]],
  [55, ["cetology", "symbolic"]],
  [56, ["cetology", "symbolic"]],
  [57, ["cetology", "symbolic"]],
  [58, ["cetology", "symbolic"]],
  [59, ["narrative", "symbolic"]],
  [60, ["whaling-labor", "symbolic"]],
  [61, ["narrative", "whaling-labor"]],
  [62, ["whaling-labor"]],
  [63, ["whaling-labor"]],
  [64, ["whaling-labor", "character"]],
  [65, ["whaling-labor", "symbolic"]],
  [66, ["whaling-labor"]],
  [67, ["whaling-labor"]],
  [68, ["cetology", "symbolic"]],
  [69, ["whaling-labor", "symbolic"]],
  [70, ["whaling-labor", "symbolic"]],
  [71, ["gam", "prophecy"]],
  [72, ["whaling-labor", "character"]],
  [73, ["whaling-labor", "character"]],
  [74, ["cetology"]],
  [75, ["cetology"]],
  [76, ["cetology"]],
  [77, ["cetology"]],
  [78, ["narrative", "whaling-labor"]],
  [79, ["cetology", "symbolic"]],
  [80, ["cetology"]],
  [81, ["gam", "narrative", "whaling-labor"]],
  [82, ["cetology", "biblical-allusion"]],
  [83, ["biblical-allusion", "cetology"]],
  [84, ["whaling-labor"]],
  [85, ["cetology"]],
  [86, ["cetology", "symbolic"]],
  [87, ["narrative", "whaling-labor"]],
  [88, ["cetology", "whaling-labor"]],
  [89, ["legal-political", "symbolic"]],
  [90, ["legal-political", "symbolic"]],
  [91, ["gam", "whaling-labor"]],
  [92, ["whaling-labor"]],
  [93, ["narrative", "character"]],
  [94, ["whaling-labor", "symbolic"]],
  [95, ["whaling-labor", "symbolic"]],
  [96, ["narrative", "whaling-labor", "symbolic"]],
  [97, ["whaling-labor", "symbolic"]],
  [98, ["whaling-labor"]],
  [99, ["symbolic", "theatrical"]],
  [100, ["gam", "character"]],
  [101, ["whaling-labor"]],
  [102, ["cetology"]],
  [103, ["cetology"]],
  [104, ["cetology"]],
  [105, ["cetology"]],
  [106, ["narrative", "character"]],
  [107, ["theatrical", "whaling-labor"]],
  [108, ["theatrical", "character"]],
  [109, ["narrative", "character"]],
  [110, ["narrative", "character"]],
  [111, ["transition", "symbolic"]],
  [112, ["character", "whaling-labor"]],
  [113, ["narrative", "whaling-labor", "symbolic"]],
  [114, ["transition", "symbolic"]],
  [115, ["gam"]],
  [116, ["narrative", "symbolic"]],
  [117, ["prophecy", "symbolic"]],
  [118, ["narrative", "character"]],
  [119, ["narrative", "prophecy", "symbolic"]],
  [120, ["theatrical", "character"]],
  [121, ["theatrical", "character"]]
]);

const narrativeCoreRequired = new Set([
  ...Array.from({ length: 23 }, (_, index) => index + 1),
  28, 29, 30, 31, 36, 41, 44, 46, 48, 50, 51, 71, 93, 96, 106, 109, 110, 113, 117, 118, 119,
  ...Array.from({ length: 14 }, (_, index) => index + 122)
]);

const classroomRequired = new Set([...narrativeCoreRequired, 26, 27, 32, 37, 38, 39, 40, 42, 52, 53, 54, 78, 81, 87, 89, 90, 99, 100, 115, 128, 131, 132]);
const classroomRecommended = new Set([24, 25, 33, 34, 35, 45, 47, 55, 56, 60, 61, 64, 67, 68, 70, 72, 74, 75, 83, 84, 85, 86, 94, 102, 103, 104, 105, 107, 108, 111, 112, 114, 116, 120, 121]);

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#8217;", "'")
    .replaceAll("&#x2019;", "'")
    .replaceAll("&#8212;", "-")
    .replaceAll("&#x2014;", "-");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function relativeSourcePath(file) {
  return path
    .join("vendor", "standard-ebooks", "herman-melville_moby-dick-master", "src", "epub", "text", file)
    .replaceAll("\\", "/");
}

function relativeEpubPath(file) {
  return path
    .join("vendor", "standard-ebooks", "herman-melville_moby-dick-master", "src", "epub", file)
    .replaceAll("\\", "/");
}

function titleForSource(file, source) {
  const titleMatch =
    source.match(/<p epub:type="title">([\s\S]*?)<\/p>/) ??
    source.match(/<h[1-6][^>]*epub:type="title"[^>]*>([\s\S]*?)<\/h[1-6]>/) ??
    source.match(/<title>([\s\S]*?)<\/title>/);

  if (titleMatch) return stripTags(titleMatch[1]);
  return file.replace(/\.xhtml$/, "");
}

function starterFunctions(sectionType, number) {
  if (sectionType === "frontmatter") return ["prefatory"];
  if (sectionType === "epilogue") return ["narrative"];
  if (functionSeeds.has(number)) return functionSeeds.get(number);
  if (number >= 1 && number <= 23) return ["narrative"];
  if (number >= 122 && number <= 135) return ["narrative"];
  return ["unknown"];
}

function starterPaths(sectionType, number, file) {
  const paths = { full_text: "required" };

  if (sectionType === "frontmatter") {
    paths.narrative_core = file === "etymology.xhtml" || file === "extracts.xhtml" ? "summary-only" : "defer";
    paths.classroom_standard = file === "etymology.xhtml" || file === "extracts.xhtml" ? "recommended" : "optional";
    return paths;
  }

  if (sectionType === "epilogue") {
    paths.narrative_core = "required";
    paths.classroom_standard = "required";
    return paths;
  }

  if (narrativeCoreRequired.has(number)) {
    paths.narrative_core = "required";
  } else {
    paths.narrative_core = "summary-only";
  }

  if (classroomRequired.has(number)) {
    paths.classroom_standard = "required";
  } else if (classroomRecommended.has(number)) {
    paths.classroom_standard = "recommended";
  } else if (starterFunctions("chapter", number).includes("unknown")) {
    paths.classroom_standard = "defer";
  } else {
    paths.classroom_standard = "optional";
  }

  return paths;
}

async function main() {
  const availableFiles = new Set(await readdir(textDir));
  const opf = await readFile(opfFile, "utf8");
  const summarySeeds = JSON.parse(await readFile(summarySeedFile, "utf8"));
  const summariesByUnitId = new Map(summarySeeds.summaries.map((summary) => [summary.unit_id, summary]));
  const missing = sourceUnits.filter(({ file }) => !availableFiles.has(file));
  if (missing.length > 0) {
    throw new Error(`Missing expected Standard Ebooks text files: ${missing.map(({ file }) => file).join(", ")}`);
  }

  const units = [];

  for (const [index, { file, sectionType }] of sourceUnits.entries()) {
    const numberMatch = file.match(/^chapter-(\d+)\.xhtml$/);
    const number = numberMatch ? Number(numberMatch[1]) : null;
    const source = await readFile(path.join(textDir, file), "utf8");
    const title = titleForSource(file, source);
    const bodyMatch = source.match(/<section[\s\S]*?>([\s\S]*?)<\/section>/);
    const plainText = stripTags(bodyMatch ? bodyMatch[1] : source);
    const wordCount = plainText ? plainText.split(/\s+/).length : 0;
    const fileSlug = slugifyTitle(file.replace(/\.xhtml$/, ""));
    const slugBase = number === null
      ? `${sectionType}-${fileSlug}`
      : `chapter-${String(number).padStart(3, "0")}-${slugifyTitle(title)}`;
    const seededSummary = summariesByUnitId.get(slugBase);

    units.push({
      unit_id: slugBase,
      sequence: index + 1,
      section_type: sectionType,
      number,
      slug: slugBase,
      title,
      source_path: relativeSourcePath(file),
      word_count: wordCount,
      functions: starterFunctions(sectionType, number),
      paths: starterPaths(sectionType, number, file),
      summaries: {
        one_breath: seededSummary?.one_breath ?? "",
        student: seededSummary?.student ?? "",
        why_it_matters: seededSummary?.why_it_matters ?? ""
      },
      metadata_status: {
        classification_confidence: sectionType === "chapter" && starterFunctions(sectionType, number).includes("unknown") ? "low" : "medium",
        citation_status: "provisional"
      },
      citations: []
    });
  }

  const chapterCount = units.filter((unit) => unit.section_type === "chapter").length;
  const frontmatterCount = units.filter((unit) => unit.section_type === "frontmatter").length;
  const epilogueCount = units.filter((unit) => unit.section_type === "epilogue").length;
  const generated = {
    generated_from: "Standard Ebooks XHTML",
    source_spine: relativeEpubPath("content.opf"),
    unit_count: units.length,
    chapter_count: chapterCount,
    frontmatter_count: frontmatterCount,
    epilogue_count: epilogueCount,
    units,
    chapters: units.filter((unit) => unit.section_type === "chapter")
  };

  if (!opf.includes('<itemref idref="epilogue.xhtml"/>')) {
    throw new Error("Expected epilogue.xhtml in Standard Ebooks spine.");
  }

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(generated, null, 2)}\n`);
  console.log(`Wrote ${generated.unit_count} reading units (${generated.chapter_count} chapters) to ${path.relative(repoRoot, outFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
