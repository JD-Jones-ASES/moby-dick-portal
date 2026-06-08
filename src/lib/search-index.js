// Build-time construction of the offline search index. Runs during `astro build` (via the
// src/pages/search-index.json.js endpoint) from the SAME loadGuideData() the pages use, so the index
// can never drift from the rendered content and needs no separate prepare:data step or committed
// artifact. Imports site.js freely — this is server/build code.
//
// One record per searchable thing: chapters (full prose, so search is genuinely full-text), public
// glossary terms, and public study notes. Trails/entities are intentionally NOT indexed yet — their
// pages don't exist until Phase 4; indexing them now would emit dead links. Phase 4 adds them here.

import { unitHref, unitKicker, withBase, primaryClaim, claimInfo } from "./site.js";
import { termBlob } from "./search-tokenize.js";

function clip(text, max) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export function buildSearchIndex(data) {
  const records = [];

  // --- Chapters / reading units (full prose) ---
  const ordered = [...data.units].sort((a, b) => a.sequence - b.sequence);
  for (const u of ordered) {
    const kicker = unitKicker(u);
    const title = u.title ? `${kicker}: ${u.title}` : kicker;
    const summary = u.summaries?.one_breath ?? "";
    const why = u.summaries?.why_it_matters ?? "";
    const snippet = summary || clip(u.plain_text, 180);
    records.push({
      id: u.unit_id,
      type: "chapter",
      title,
      snippet,
      path: unitHref(u.unit_id),
      terms: termBlob([u.title, kicker, summary, why, u.plain_text]),
      tt: termBlob([u.title, kicker])
    });
  }

  // --- Public glossary terms ---
  for (const g of data.glossary) {
    const variants = (g.variants ?? []).join(" ");
    records.push({
      id: g.id,
      type: "glossary",
      title: g.term,
      snippet: clip(g.definition, 220),
      path: withBase(`glossary/#g-${g.id}`),
      terms: termBlob([g.term, variants, g.definition, g.category]),
      tt: termBlob([g.term, variants])
    });
  }

  // --- Public study notes ---
  for (const a of data.annotations) {
    const claim = claimInfo(primaryClaim(a));
    records.push({
      id: a.id,
      type: "note",
      title: a.anchor ?? "Study note",
      snippet: clip(a.note, 220),
      path: unitHref(a.unit_id) + `#note-${a.id}`,
      terms: termBlob([a.anchor, a.note, claim.label]),
      tt: termBlob([a.anchor])
    });
  }

  const byType = records.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  return { version: 1, count: records.length, byType, records };
}
