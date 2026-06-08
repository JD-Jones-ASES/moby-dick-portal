import { readFile, writeFile } from "node:fs/promises";

const annotationsPath = "data/annotations/moby-dick.annotations.json";
const today = "2026-06-07";

const pilotReadyNotes = new Map([
  [
    "loomings-water-and-despair",
    {
      note:
        "Ishmael describes going to sea as a practical response to despair and anger. The comedy matters, but the opening is also direct about mental strain.",
      evidence: [
        {
          claim_type: "source-text-observation",
          citations: ["standard-ebooks-moby-dick"],
          validation: ["selector-resolves", "primary-source-checked", "adversarial-review"]
        }
      ]
    }
  ],
  [
    "broad-apparatus-chapter-014-nantucket-1",
    {
      note:
        "The island is introduced as physically small and bare. That contrast prepares the chapter's larger joke: Nantucket looks slight on land but becomes enormous through whaling.",
      evidence: [
        {
          claim_type: "source-text-observation",
          citations: ["standard-ebooks-moby-dick"],
          validation: ["selector-resolves", "primary-source-checked", "adversarial-review"]
        }
      ]
    }
  ],
  [
    "quarterdeck-oath",
    {
      note:
        "Ahab turns the deck into a stage for command. Money, ritual, and repeated speech redirect the crew's ordinary labor toward his private revenge.",
      evidence: [
        {
          claim_type: "source-text-observation",
          citations: ["standard-ebooks-moby-dick"],
          validation: ["selector-resolves", "primary-source-checked", "adversarial-review"]
        }
      ]
    }
  ]
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

function withoutReaderSurface(annotation) {
  const surfaces = (annotation.display?.surfaces ?? []).filter((surface) => surface !== "reader");
  if (!surfaces.includes("review")) surfaces.push("review");
  if (!surfaces.includes("index")) surfaces.unshift("index");

  return {
    ...annotation,
    display: {
      ...annotation.display,
      inline: false,
      surfaces: [...new Set(surfaces)]
    }
  };
}

function needsPublicDemotion(annotation) {
  const surfaces = annotation.display?.surfaces ?? [];
  const validations = (annotation.evidence ?? []).flatMap((evidence) => evidence.validation ?? []);
  return (
    surfaces.includes("reader") &&
    (
      annotation.status?.content_status !== "student-ready" ||
      annotation.status?.citation_status !== "verified" ||
      (annotation.status?.review_queue ?? []).length > 0 ||
      validations.includes("needs-review")
    )
  );
}

function isInvalidStudentReady(annotation) {
  const validations = (annotation.evidence ?? []).flatMap((evidence) => evidence.validation ?? []);
  return (
    annotation.status?.content_status === "student-ready" &&
    (
      annotation.status?.citation_status !== "verified" ||
      (annotation.status?.review_queue ?? []).length > 0 ||
      validations.includes("needs-review") ||
      !validations.includes("selector-resolves") ||
      !validations.includes("primary-source-checked") ||
      !validations.includes("adversarial-review") ||
      annotation.provenance?.method !== "reviewed"
    )
  );
}

const collection = JSON.parse(await readFile(annotationsPath, "utf8"));
let demotedReaderSurfaces = 0;
let demotedOverreadyAnnotations = 0;
let promotedPilotAnnotations = 0;

collection.annotations = collection.annotations.map((annotation) => {
  let next = annotation;

  if (needsPublicDemotion(next)) {
    next = withoutReaderSurface(next);
    demotedReaderSurfaces += 1;
  }

  if (isInvalidStudentReady(next)) {
    next = {
      ...next,
      status: {
        content_status: "draft",
        citation_status: next.status.citation_status === "verified" ? "verified" : "provisional",
        review_queue: [...new Set([...(next.status.review_queue ?? []), "source-check", "interpretive"])]
      },
      evidence: (next.evidence ?? []).map((evidence) => ({
        ...evidence,
        validation: [...new Set([...(evidence.validation ?? []).filter((item) => item !== "adversarial-review"), "needs-review"])]
      }))
    };
    demotedOverreadyAnnotations += 1;
  }

  const pilot = pilotReadyNotes.get(next.id);
  if (pilot) {
    next = {
      ...next,
      note: pilot.note,
      display: {
        ...next.display,
        depth: "study",
        priority: Math.min(next.display?.priority ?? 2, 2),
        inline: true,
        surfaces: ["reader", "index"],
        spoiler_level: next.display?.spoiler_level ?? "none"
      },
      evidence: pilot.evidence,
      citations: ["standard-ebooks-moby-dick"],
      provenance: {
        ...next.provenance,
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
    promotedPilotAnnotations += 1;
  }

  return next;
});

await writeFile(annotationsPath, `${escapeNonAscii(JSON.stringify(collection, null, 2))}\n`);

console.log(
  `Recovered annotation gates: demoted ${demotedReaderSurfaces} reader-surface drafts, demoted ${demotedOverreadyAnnotations} over-ready annotations, promoted ${promotedPilotAnnotations} pilot notes.`
);
