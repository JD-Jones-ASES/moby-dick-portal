// Build-time data for the guided-exploration pages (trails, entities, path compare). Chapter-level
// membership is the source of truth (never gate on public-note presence): a trail/entity "contains" a
// chapter if ANY annotation in that chapter is tagged trail:<id> / entity:<id>, unioned with the
// generated index's .units[]. Public notes (loadGuideData) are layered on where they exist.

import { readFileSync } from "node:fs";
import path from "node:path";
import taxonomy from "../../data/taxonomy/moby-dick.taxonomy.json";
import { loadGuideData } from "./guide-data.js";
import { renderUnit } from "./render.js";

const root = process.cwd();
const annotations = JSON.parse(
  readFileSync(path.join(root, "data", "annotations", "moby-dick.annotations.json"), "utf8")
).annotations;

function add(map, key, val) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(val);
}

// Membership is annotation-grounded: a chapter belongs to trail:<id> / entity:<id> when an annotation
// in that chapter carries that tag. (The generated annotations-by-*.json .units[] is deliberately NOT
// unioned in — its synthetic floor passes over-inflate some trails, e.g. whaling-labor to 122 chapters
// vs 54 real tags; tags are the honest signal and keep trails distinct.)
const trailUnits = new Map();
const entityUnits = new Map();
for (const a of annotations) {
  if (!a.unit_id) continue;
  for (const tag of a.tags ?? []) {
    if (tag.startsWith("trail:")) add(trailUnits, tag.slice(6), a.unit_id);
    else if (tag.startsWith("entity:")) add(entityUnits, tag.slice(7), a.unit_id);
  }
}

export const trailDefs = taxonomy.trails;     // {id,label,description,tags,status}
export const entityDefs = taxonomy.entities;  // {id,label,kind,aliases,...}
export const entityDefMap = new Map(entityDefs.map((e) => [e.id, e]));
export const trailDefMap = new Map(trailDefs.map((t) => [t.id, t]));

export function trailUnitIds(id) { return [...(trailUnits.get(id) ?? [])]; }
export function entityUnitIds(id) { return [...(entityUnits.get(id) ?? [])]; }

// Order a set of unit_ids by their narrative sequence using a loaded units list.
export function orderUnits(unitIds, unitsBySeq) {
  const set = new Set(unitIds);
  return unitsBySeq.filter((u) => set.has(u.unit_id));
}

// Public annotations carrying a given trail:/entity: tag (notes specifically about this lens).
export function notesForTag(publicAnnotations, prefix, id) {
  const tag = prefix + ":" + id;
  return publicAnnotations.filter((a) => (a.tags ?? []).includes(tag));
}

// Trails/entities that share the most chapters with the given unit set (related lenses).
export function relatedByOverlap(unitIds, kind, selfId, limit = 6) {
  const mine = new Set(unitIds);
  if (!mine.size) return [];
  const source = kind === "trail" ? trailUnits : entityUnits;
  const defMap = kind === "trail" ? trailDefMap : entityDefMap;
  const out = [];
  for (const [id, units] of source) {
    if (id === selfId) continue;
    if (!defMap.has(id)) continue;
    let shared = 0;
    for (const u of units) if (mine.has(u)) shared++;
    if (shared > 0) out.push({ id, shared, def: defMap.get(id) });
  }
  out.sort((a, b) => b.shared - a.shared || a.def.label.localeCompare(b.def.label));
  return out.slice(0, limit);
}

// Trails with at least one chapter of membership, alphabetical — the only ones that get a page/link.
export function coveredTrails() {
  return trailDefs
    .map((t) => ({ ...t, unitCount: (trailUnits.get(t.id) ?? new Set()).size }))
    .filter((t) => t.unitCount > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Entities with at least one chapter of membership — the only ones that get a page/link (mirrors
// coveredTrails, so a future taxonomy entity with no annotations can't ship a dead/empty page).
export function coveredEntities() {
  return entityDefs.filter((e) => (entityUnits.get(e.id) ?? new Set()).size > 0);
}

export function entitiesOfKind(kind) {
  return entityDefs
    .filter((e) => e.kind === kind)
    .map((e) => ({ ...e, unitCount: (entityUnits.get(e.id) ?? new Set()).size }))
    .filter((e) => e.unitCount > 0)
    .sort((a, b) => b.unitCount - a.unitCount || a.label.localeCompare(b.label));
}

export const entityKinds = [...new Set(entityDefs.map((e) => e.kind))];

// The set of annotation ids the reader actually PLACES in prose (renderUnit drops anchors not found in
// the text). Lens pages must link only these — an unplaced note has no #note-<id> target. Computed once
// (memoized) by replaying the reader's own placement over every unit's public annotations.
let _placed = null;
export async function placedNoteIds() {
  if (_placed) return _placed;
  const data = await loadGuideData();
  const set = new Set();
  for (const u of data.units) {
    const anns = data.annotationIndex.units[u.unit_id]?.annotations ?? [];
    if (!anns.length) continue;
    const { placed } = renderUnit(u.plain_text, anns, []);
    for (const id of placed) set.add(id);
  }
  _placed = set;
  return set;
}

// Reverse lookup for the reader breadcrumb: which trails/entities include this chapter.
export function lensesForUnit(unitId) {
  const trails = [];
  for (const [id, units] of trailUnits) {
    if (units.has(unitId) && trailDefMap.has(id)) trails.push({ id, label: trailDefMap.get(id).label });
  }
  const entities = [];
  for (const [id, units] of entityUnits) {
    if (units.has(unitId) && entityDefMap.has(id)) {
      const d = entityDefMap.get(id);
      entities.push({ id, label: d.label, kind: d.kind });
    }
  }
  trails.sort((a, b) => a.label.localeCompare(b.label));
  entities.sort((a, b) => a.label.localeCompare(b.label));
  return { trails, entities };
}
