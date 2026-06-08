// Build-time geometry for the voyage map. Projects Natural Earth land + the ordered voyage
// waypoints into an equirectangular SVG space, recentering longitude so the map's seam falls in
// the route's largest empty longitude gap (avoids a misleading line across the antimeridian), and
// spacing clustered stages with a deterministic golden-angle jitter. Pure data in, pure data out.

import { createRequire } from "node:module";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const landTopo = require("world-atlas/land-110m.json");

const W = 1000;
const H = 500;
const r1 = (n) => Math.round(n * 10) / 10;
const ri = (n) => Math.round(n);

// Central meridian = antipode of the middle of the largest longitude gap with no waypoints.
function centralMeridian(lons) {
  const s = [...new Set(lons)].sort((a, b) => a - b);
  let bestGap = -1;
  let seam = 0;
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    const b = i + 1 < s.length ? s[i + 1] : s[0] + 360;
    const gap = b - a;
    if (gap > bestGap) {
      bestGap = gap;
      seam = (a + b) / 2;
    }
  }
  seam = ((seam + 540) % 360) - 180;
  return ((seam + 180 + 540) % 360) - 180; // antipode, normalized to [-180,180)
}

export function buildVoyageMap(waypoints) {
  const wps = (waypoints ?? []).filter((w) => Array.isArray(w.coordinates));
  if (wps.length === 0) throw new Error("voyage-map: no waypoints with coordinates");

  const central = centralMeridian(wps.map((w) => w.coordinates[0]));
  const shift = (lon) => ((lon - central + 540) % 360) - 180;
  const projX = (lon) => ((shift(lon) + 180) / 360) * W;
  const projY = (lat) => ((90 - lat) / 180) * H;

  // Land path. Break a ring's path when consecutive points jump more than half the map width
  // (i.e., across the recentered seam) so seam-crossing polygons don't streak across the map.
  const fc = feature(landTopo, landTopo.objects.land);
  const geom = fc.features ? fc.features[0].geometry : fc.geometry;
  if (!geom?.coordinates?.length) throw new Error("voyage-map: empty land feature");
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  let landPath = "";
  for (const poly of polys) {
    for (const ring of poly) {
      let d = "";
      let prevX = null;
      for (let i = 0; i < ring.length; i++) {
        const x = projX(ring[i][0]);
        const y = projY(ring[i][1]);
        if (i === 0 || (prevX != null && Math.abs(x - prevX) > W * 0.5)) d += `M${ri(x)},${ri(y)}`;
        else d += `L${ri(x)},${ri(y)}`;
        prevX = x;
      }
      landPath += `${d}Z`;
    }
  }

  // Waypoints in narrative order.
  const sorted = [...wps].sort((a, b) => (a.chapter_start ?? 0) - (b.chapter_start ?? 0));
  const trueNodes = sorted.map((w) => ({ w, x: projX(w.coordinates[0]), y: projY(w.coordinates[1]) }));

  // viewBox cropped to the route bounds (+ padding), clamped to the map rectangle.
  const xs = trueNodes.map((n) => n.x);
  const ys = trueNodes.map((n) => n.y);
  const rawMinX = Math.min(...xs);
  const rawMaxX = Math.max(...xs);
  const rawMinY = Math.min(...ys);
  const rawMaxY = Math.max(...ys);
  const padX = (rawMaxX - rawMinX) * 0.08 + 14;
  const padY = (rawMaxY - rawMinY) * 0.22 + 14;
  const minX = Math.max(0, rawMinX - padX);
  const maxX = Math.min(W, rawMaxX + padX);
  const minY = Math.max(0, rawMinY - padY);
  const maxY = Math.min(H, rawMaxY + padY);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const U = Math.max(spanX, spanY) / 100;
  const dotR = U * 0.7;
  const endR = U * 1.05;
  const hitR = U * 2.2;
  const minSep = dotR * 2.1; // required clearance between any two placed dots (just over a diameter)
  const jitterR = U * 1.5;

  // A dot is moved whenever its true position lands within minSep of an ALREADY-PLACED (final) dot —
  // this is the true overlap criterion, so an un-jittered dot can't be hit by an earlier jittered one.
  // It then walks successive golden-angle slots (widening the ring after each full turn) and takes the
  // first that clears every placed dot; a thin connector is drawn from the moved dot to its true spot.
  const placed = []; // final {x,y,tx,ty}
  let clusterCount = 0;
  const nodes = trueNodes.map((n, i) => {
    let px = n.x;
    let py = n.y;
    let jittered = false;
    const clearOf = (x, y) => placed.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.y - y)), Infinity);
    if (clearOf(n.x, n.y) < minSep) {
      jittered = true;
      let bestClear = -1;
      let bx = n.x;
      let by = n.y;
      for (let k = 0; k < 48; k++) {
        const ang = ((clusterCount + k) * 137.5 * Math.PI) / 180;
        const r = jitterR * (1 + Math.floor(k / 10) * 0.5);
        const x = n.x + Math.cos(ang) * r;
        const y = n.y + Math.sin(ang) * r;
        const clear = clearOf(x, y);
        if (clear > bestClear) {
          bestClear = clear;
          bx = x;
          by = y;
        }
        if (clear >= minSep) {
          clusterCount += k + 1;
          break;
        }
        if (k === 47) clusterCount += k + 1;
      }
      px = bx;
      py = by;
    }
    const disp = { x: px, y: py, tx: n.x, ty: n.y };
    placed.push(disp);
    // Only draw a connector for dots that moved noticeably; tiny nudges need none.
    const movedFar = jittered && Math.hypot(px - n.x, py - n.y) > dotR * 1.1;
    return {
      id: n.w.id,
      label: n.w.label,
      chapter_start: n.w.chapter_start ?? null,
      chapter_end: n.w.chapter_end ?? null,
      n: i + 1,
      tx: r1(n.x),
      ty: r1(n.y),
      x: r1(disp.x),
      y: r1(disp.y),
      jittered: movedFar
    };
  });

  const graticule = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = projX(lon);
    graticule.push(`M${ri(x)},${ri(minY)}L${ri(x)},${ri(maxY)}`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = projY(lat);
    graticule.push(`M${ri(minX)},${ri(y)}L${ri(maxX)},${ri(y)}`);
  }

  const oceans = [
    { t: "Atlantic", lon: -34, lat: 22 },
    { t: "Indian", lon: 72, lat: -30 },
    { t: "Pacific", lon: -150, lat: 6 }
  ]
    .map((o) => ({ t: o.t, x: r1(projX(o.lon)), y: r1(projY(o.lat)) }))
    .filter((o) => o.x >= minX && o.x <= maxX && o.y >= minY && o.y <= maxY);

  return {
    viewBox: `${r1(minX)} ${r1(minY)} ${r1(spanX)} ${r1(spanY)}`,
    landPath,
    graticule: graticule.join(""),
    nodes,
    oceans,
    dotR: r1(dotR),
    endR: r1(endR),
    hitR: r1(hitR),
    dotActiveR: r1(U * 1.15),
    endActiveR: r1(U * 1.5),
    fontSize: r1(U * 2.3)
  };
}
