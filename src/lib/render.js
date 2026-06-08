// Server-side rendering of a reading unit's text with inline marks.
//
// Two kinds of marks coexist:
//   - Study annotations  -> <a class="anno-mark">     (solid gold underline; links to a note card)
//   - Glossary terms     -> <button class="gloss-mark"> (dotted accent underline; hover/focus popover)
//
// Correctness rules (load-bearing):
//   - Annotations are AUTHORITATIVE: all kept annotation spans are placed first; a glossary span is
//     admitted only if it overlaps no kept annotation and no earlier kept glossary span. An annotation
//     is never dropped for a glossary mark.
//   - One glossary mark per entry, at the first whole-word occurrence that clears every constraint
//     (so a blocked earliest occurrence falls through to a later valid one).
//   - When two entries contend for the same span (e.g. the word "aft" matched by the entry "aft" and
//     by the variant "aft" of "abaft"), the entry whose CANONICAL term matched wins.
// All matching is on the raw plain_text; output is escaped per text-segment as we walk.

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

// True if any of `terms` occurs in `text` as a whole word (same boundary rule the inline marker
// uses). Used to keep "ghost" glossary cards — terms that only appear as a substring of a larger
// word, e.g. "helm" inside "overwhelmed" or "aft" inside "after" — out of a chapter's sidebar list.
export function termInText(text, terms) {
  const src = text ?? "";
  for (const t of terms) {
    const term = (t ?? "").trim();
    if (term.length < 2) continue;
    if (new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, "i").test(src)) return true;
  }
  return false;
}

export function renderUnit(plainText, annotations = [], glossaryEntries = []) {
  const text = plainText ?? "";

  // 1) Annotation spans (authoritative). Sort, keep earliest non-overlapping.
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

  // 2) Glossary candidates: every whole-word occurrence of each term/variant that clears the
  //    per-occurrence constraints (not offset 0 / drop cap, no paragraph straddle, no annotation
  //    overlap). Carry a `canonical` flag (true when the entry's primary term matched).
  const candidates = [];
  for (const g of glossaryEntries) {
    const terms = [g.term, ...(g.variants ?? [])];
    for (let ti = 0; ti < terms.length; ti++) {
      const term = (terms[ti] ?? "").trim();
      if (term.length < 2) continue;
      const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, "gi");
      let m;
      while ((m = re.exec(text)) !== null) {
        const start = m.index;
        const end = m.index + m[0].length;
        if (m.index === re.lastIndex) re.lastIndex++;
        if (start === 0) continue;
        if (/\n{2,}/.test(text.slice(start, end))) continue;
        if (keptAnno.some((s) => overlaps(start, end, s.start, s.end))) continue;
        candidates.push({ start, end, entry: g, canonical: ti === 0 });
      }
    }
  }
  // Earliest first; on a tie, shorter then canonical-term wins.
  candidates.sort(
    (a, b) => a.start - b.start || a.end - b.end || Number(b.canonical) - Number(a.canonical)
  );
  const keptGloss = [];
  const glossPlaced = [];
  const placedEntries = new Set();
  for (const c of candidates) {
    if (placedEntries.has(c.entry.id)) continue; // one mark per entry
    if (keptGloss.some((s) => overlaps(c.start, c.end, s.start, s.end))) continue;
    keptGloss.push({ type: "gloss", start: c.start, end: c.end, entry: c.entry });
    glossPlaced.push(c.entry.id);
    placedEntries.add(c.entry.id);
  }

  // 3) Merge (mutually non-overlapping now) and walk, escaping text segments.
  const all = [...keptAnno, ...keptGloss].sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const sp of all) {
    out += esc(text.slice(cursor, sp.start));
    const inner = esc(text.slice(sp.start, sp.end));
    if (sp.type === "anno") {
      const id = escAttr(sp.id);
      out += `<a class="anno-mark" id="mark-${id}" data-note="${id}" href="#note-${id}" aria-describedby="note-${id}">${inner}</a>`;
    } else {
      const g = sp.entry;
      const gid = escAttr(g.id);
      const pid = `gpop-${gid}`;
      // The definition span is visually hidden (CSS `.gloss-pop`) — it still serves screen readers
      // via aria-describedby and is the content source the Margin card clones. There is no longer a
      // floating popover; hovering a mark routes its content into the fixed Margin card instead.
      out +=
        `<button type="button" class="gloss-mark" id="gmark-${gid}" data-gloss="${gid}" aria-describedby="${pid}">${inner}</button>` +
        `<span class="gloss-pop" id="${pid}">` +
        `<span class="gp-term">${esc(g.term)}</span>` +
        (g.category ? `<span class="gp-cat">${esc(g.category)}</span>` : "") +
        `<span class="gp-def">${esc(g.definition ?? "")}</span>` +
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
