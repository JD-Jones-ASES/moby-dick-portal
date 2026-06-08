// Server-side rendering of a reading unit's text with inline Study-annotation marks.
// Annotations carry validated selector positions over the unit's plain_text; we wrap
// each non-overlapping anchor in a link to its note, then split into paragraphs.

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderUnit(plainText, annotations = []) {
  const text = plainText ?? "";
  const spans = [];

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
    spans.push({ start, end, id: a.id });
  }

  spans.sort((a, b) => a.start - b.start || a.end - b.end);

  // Drop overlaps (keep the earliest-starting mark).
  const kept = [];
  const placed = [];
  let lastEnd = -1;
  for (const sp of spans) {
    if (sp.start >= lastEnd) {
      kept.push(sp);
      placed.push(sp.id);
      lastEnd = sp.end;
    }
  }

  let out = "";
  let cursor = 0;
  for (const sp of kept) {
    out += esc(text.slice(cursor, sp.start));
    out +=
      `<a class="anno-mark" id="mark-${sp.id}" data-note="${sp.id}" href="#note-${sp.id}">` +
      esc(text.slice(sp.start, sp.end)) +
      "</a>";
    cursor = sp.end;
  }
  out += esc(text.slice(cursor));

  const paragraphs = out
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  return { html: paragraphs, placed };
}
