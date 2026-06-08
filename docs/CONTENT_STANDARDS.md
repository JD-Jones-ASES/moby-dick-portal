# Content Standards

## Voice

Write for smart students who lack background knowledge. Be concise, neutral, and concrete.

Good student-facing prose:

- Explains the obstacle at the moment it appears.
- Defines unfamiliar terms without showing off.
- Names interpretive uncertainty when it exists.
- Avoids treating Melville's difficult material as quaint or harmless.

## Summary Standards

Each chapter should eventually have:

- `one_breath_summary`: one sentence.
- `student_summary`: one short paragraph.
- `why_it_matters`: one short paragraph explaining plot, theme, form, or classroom value.

## Annotation Standards

Annotations should answer one of these questions:

- What does this word or phrase mean?
- What cultural, historical, biblical, classical, or nautical knowledge is assumed?
- Why does this formal move matter?
- How does this chapter affect a selected reading path?

Annotate only when the note removes a real obstacle or adds source-backed context that a smart but unprepared reader would not already have. Do not annotate merely because a passage is thematically available, atmospheric, or convenient for an index.

Do not publish:

- Plot recap that belongs in a chapter summary.
- Generic literary language such as "useful hinge," "pressure point," "foothold," "sets up," or "underscores" unless the note names a concrete textual mechanism.
- Internal workflow language about review queues, support sources, provisional leads, or whether a note should later be kept.
- Source-index, taxonomy-index, teacher-review, or other apparatus scaffolds in the reader-facing Study layer.
- Safetyism or moralizing. Difficult material should be identified directly and historically, not framed as a verdict on the reader.

Every interpretive annotation should include a citation trail before publication. Unsourced annotations stay provisional. Draft/provisional notes may exist in data and review indexes, but only `student-ready` notes belong in the public Study layer.

## Publication Gate

Reader-facing annotations must pass all of these checks:

- The selected anchor is exact and worth annotating.
- The note explains a genuine vocabulary, allusion, history, form, source, or interpretation problem.
- The prose is concise, concrete, and free of generation residue.
- The citation trail supports the claim being made.
- Difficult-material notes are clinical and historically specific, with no trigger-warning idiom in the annotation itself.
- The record has `status.content_status: "student-ready"`.

Anything else belongs in Explore, Teacher, Search, or Review data until it is rewritten and checked.

## Shakespeare-Grade External-Source Rule

The sibling Shakespeare Portal is the quality benchmark. Its public notes are dominated by
notes that *teach the knowledge a student lacks* — what a word meant, what a myth or scripture
says, what a historical reference points to — and each grounds that claim in a real source
(OED, an Arden edition, a historical study). Pure thematic observation is the exception, not
the rule.

Moby-Dick public notes follow the same discipline, expressed through the `evidence[].claim_type`
field. A note's claim type declares what kind of help it gives, and that determines the source
it must carry:

| `claim_type` | The note teaches… | Required support |
|---|---|---|
| `lexical` | a word or phrase's meaning | a dictionary source (`webster-1913`, `webster-1828`, `oed-historical-dictionary`, `etymonline-whale`) |
| `biblical-context` | a biblical name, story, or echo | `king-james-bible` / `jonah-kjv-crossref` |
| `classical-context` | a classical myth, figure, or allusion | `bulfinch-age-of-fable`, `perseus-homer`, `livius-cicero-damocles`, etc. |
| `historical-context` | a historical person, event, place, or practice | the relevant encyclopedia/primary/secondary record |
| `nautical-whaling` | whaling labor, gear, or cetology | a whaling source (`beale-…`, `scoresby-…`, `dana-…`, `starbuck-…`, NOAA, etc.) |
| `cartographic` / `publication-context` | place/route or printing/edition facts | a map or publication source |
| `difficult-material` | racism, empire, religion, slavery, mental illness | a historical source **and** `tone-review` evidence |
| `source-text-observation` / `interpretive` | a close-reading crux from the text itself | the Melville text only (`standard-ebooks-moby-dick`) |

**The rule, enforced in `validate-basic.mjs`:** any `student-ready` reader note whose evidence
carries an external-knowledge claim type (everything above `difficult-material`) must cite at
least one non–`standard-ebooks-moby-dick` source in that evidence record. Only genuine
close-reading cruxes may stand on the text alone — and they should be a deliberate minority.

**Voice:** teach the missing reference *first*, then show its function in the passage. Name the
chapter/verse or work in plain words. `audit:content` reports the public claim-type mix and the
count of observation-only notes so the corpus can be steered toward teaching, not just observing.

## Difficult Material

The project must handle racism, empire, religious prejudice, mental illness language, violence, and animal suffering directly and clinically. Do not sanitize the text, endorse its assumptions, or surprise students with context-free harm.
