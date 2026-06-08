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
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  minX = Math.max(0, minX - ((maxX - minX) * 0.08 + 14));
  maxX = Math.min(W, maxX + ((maxX - minX) * 0.08 + 14));
  minY = Math.max(0, minY - ((maxY - minY) * 0.22 + 14));
  maxY = Math.min(H, maxY + ((maxY - minY) * 0.22 + 14));
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const U = Math.max(spanX, spanY) / 100;
  const dotR = U * 0.95;
  const endR = U * 1.4;
  const hitR = U * 2.4;
  const collideR = U * 0.95; // only near-identical points (a dot-width apart) get spread
  const jitterR = U * 1.7;

  // Deterministic golden-angle jitter for stages that pile on the same pixel (NE-shore rooms,
  // the Pacific-finale cluster). Members fan onto a small ring around the shared point; a thin
  // connector is drawn back to the true position. Distinct stages keep their true coordinates.
  const placed = [];
  let clusterCount = 0;
  const nodes = trueNodes.map((n, i) => {
    let dx = 0;
    let dy = 0;
    let jittered = false;
    if (placed.some((p) => Math.hypot(p.tx - n.x, p.ty - n.y) < collideR)) {
      const ang = ((clusterCount++ * 137.5) * Math.PI) / 180;
      dx = Math.cos(ang) * jitterR;
      dy = Math.sin(ang) * jitterR;
      jittered = true;
    }
    const disp = { x: n.x + dx, y: n.y + dy, tx: n.x, ty: n.y };
    placed.push(disp);
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
      jittered
    };
  });

  const route = trueNodes.map((n) => `${r1(n.x)},${r1(n.y)}`).join(" ");

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
    route,
    nodes,
    oceans,
    dotR: r1(dotR),
    endR: r1(endR),
    hitR: r1(hitR),
    fontSize: r1(U * 2.3)
  };
}
