// Static build-time endpoint: emits dist/search-index.json (served at
// `${BASE_URL}search-index.json`) during `astro build`. Because it derives from loadGuideData(), the
// index is regenerated on every build and can never go stale — no prepare:data, no committed JSON.
// The search palette lazy-loads this file on first open.

import { loadGuideData } from "../lib/guide-data.js";
import { buildSearchIndex } from "../lib/search-index.js";

export async function GET() {
  const data = await loadGuideData();
  const index = buildSearchIndex(data);
  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
