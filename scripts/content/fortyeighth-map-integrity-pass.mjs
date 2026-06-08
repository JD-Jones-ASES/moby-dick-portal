import { readFile, writeFile } from "node:fs/promises";

const voyageMapPath = "data/maps/moby-dick.voyage-map.json";
const voyageMap = JSON.parse(await readFile(voyageMapPath, "utf8"));

voyageMap.waypoints = voyageMap.waypoints.filter((waypoint) => waypoint.id !== "nightgown-room");

const coordinateOffsets = new Map([
  ["new-bedford-chapel", [-70.9242, 41.6462]],
  ["spouter-inn-room", [-70.9442, 41.6262]],
  ["nantucket-contract", [-70.0895, 41.2935]],
  ["epilogue-survival", [-154.8, 0.2]],
  ["final-witness", [-155.2, -0.2]]
]);

let adjusted = 0;
for (const waypoint of voyageMap.waypoints) {
  const coordinates = coordinateOffsets.get(waypoint.id);
  if (!coordinates) continue;
  waypoint.coordinates = coordinates;
  adjusted += 1;
}

voyageMap.waypoints.push({
  id: "nightgown-room",
  label: "Nightgown Room",
  chapter_start: 11,
  chapter_end: 11,
  coordinates: [-70.9142, 41.6262],
  student_note: "A quiet room scene turns Ishmael and Queequeg's friendship into warmth, trust, and domestic comedy before the move toward Nantucket."
});

voyageMap.waypoints.sort((a, b) => a.chapter_start - b.chapter_start || a.chapter_end - b.chapter_end || a.id.localeCompare(b.id));

await writeFile(voyageMapPath, `${JSON.stringify(voyageMap, null, 2)}\n`);

console.log(JSON.stringify({ added: 1, adjusted }, null, 2));
