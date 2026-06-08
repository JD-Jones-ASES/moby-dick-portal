// Server-side rendering of a reading unit's text with inline marks.
//
// Two kinds of marks coexist:
//   - Study annotations  -> <a class="anno-mark">     (solid gold underline; links to a note card)
//   - Glossary terms     -> <button class="gloss-mark"> (dotted accent underline; hover/focus popover)
//
// Correctness rule (load-bearing): annotations are AUTHORITATIVE. We keep all annotation spans first,
// then admit a glossary span only if it overlaps no kept annotation span and no earlier kept glossary
// span. An annotation is never dropped to make room for a glossary mark. All matching is done on the
// raw plain_text; output is escaped per text-segment as we walk, so inserted tag offsets stay correct.

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s) {
  return esc(s).replace(/"/g, "&quot;");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// First whole-word, case-insensitive occurrence of any of `terms` in `text`. ASCII corpus, so a
// boundary class (not \b) handles hyphenated terms ("try-works") and substring cases ("aft" vs "abaft").
function firstWholeWordMatch(text, terms) {
  let best = -1;
  let bestLen = 0;
  for (const raw of terms) {
    const term = (raw ?? "").trim();
    if (term.length < 2) continue;
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, "i");
    const m = re.exec(text);
    if (m && (best === -1 || m.index < best)) {
      best = m.index;
      bestLen = m[0].length;
    }
  }
  return best === -1 ? null : { start: best, end: best + bestLen };
}

export function renderUnit(plainText, annotations = [], glossaryEntries = []) {
  const text = plainText ?? "";

  // 1) Annotation spans (authoritative). Existing behavior: sort, keep earliest non-overlapping.
  const annoSpans = [];
  for (const a of annotations) {
    const anchor = a.anchor ?? a.selector?.exact;
    if (!anchor) continue;
    let start = a.selector?.position?.start;
    let end = a.selector?.position?.end;
    if (typeof start !== "number" || typeof end !== "number" || text.slice(start, end) !== anchor) {
      const idx = text.indexOf(anchor);
      if (idx < 0) continue;
      start = idx;
      end = idx + anchor.length;
    }
    annoSpans.push({ type: "anno", start, end, id: a.id });
  }
  annoSpans.sort((a, b) => a.start - b.start || a.end - b.end);
  const keptAnno = [];
  const placed = [];
  let lastEnd = -1;
  for (const sp of annoSpans) {
    if (sp.start >= lastEnd) {
      keptAnno.push(sp);
      placed.push(sp.id);
      lastEnd = sp.end;
    }
  }

  // 2) Glossary spans, filtered against kept annotations and each other.
  const glossCandidates = [];
  for (const g of glossaryEntries) {
    const terms = [g.term, ...(g.variants ?? [])];
    const hit = firstWholeWordMatch(text, terms);
    if (!hit) continue;
    if (hit.start === 0) continue; // protect the drop-cap on the first paragraph
    if (/\n{2,}/.test(text.slice(hit.start, hit.end))) continue; // never straddle a paragraph break
    glossCandidates.push({ type: "gloss", start: hit.start, end: hit.end, entry: g });
  }
  glossCandidates.sort((a, b) => a.start - b.start || a.end - b.end);
  const keptGloss = [];
  const glossPlaced = [];
  for (const g of glossCandidates) {
    if (keptAnno.some((s) => overlaps(g.start, g.end, s.start, s.end))) continue;
    if (keptGloss.some((s) => overlaps(g.start, g.end, s.start, s.end))) continue;
    keptGloss.push(g);
    glossPlaced.push(g.entry.id);
  }

  // 3) Merge (mutually non-overlapping now) and walk, escaping text segments.
  const all = [...keptAnno, ...keptGloss].sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const sp of all) {
    out += esc(text.slice(cursor, sp.start));
    const inner = esc(text.slice(sp.start, sp.end));
    if (sp.type === "anno") {
      out += `<a class="anno-mark" id="mark-${sp.id}" data-note="${escAttr(sp.id)}" href="#note-${escAttr(sp.id)}">${inner}</a>`;
    } else {
      const g = sp.entry;
      const pid = `gpop-${g.id}`;
      out +=
        `<span class="gloss-wrap">` +
        `<button type="button" class="gloss-mark" id="gmark-${escAttr(g.id)}" data-gloss="${escAttr(g.id)}" aria-describedby="${pid}">${inner}</button>` +
        `<span class="gloss-pop" role="tooltip" id="${pid}" hidden>` +
        `<span class="gp-term">${esc(g.term)}</span>` +
        (g.category ? `<span class="gp-cat">${esc(g.category)}</span>` : "") +
        `<span class="gp-def">${esc(g.definition ?? "")}</span>` +
        `</span>` +
        `</span>`;
    }
    cursor = sp.end;
  }
  out += esc(text.slice(cursor));

  const paragraphs = out
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  return { html: paragraphs, placed, glossPlaced };
}
