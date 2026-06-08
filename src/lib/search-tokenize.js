// Shared tokenizer for the offline search index. Used at BUILD time by search-index.js to turn a
// record's text into a unique-token "terms" blob, and at RUNTIME by search-ui.js to tokenize the
// query the SAME way, so query tokens line up exactly with indexed tokens. Pure, dependency-free.

// A small, deliberately conservative stop list: very common function words that add index weight and
// noise without helping a student find a passage. Kept short so domain words ("whale", "white",
// "god", "sea", "ship") and short meaningful tokens survive.
const STOP = new Set(
  ("a an and are as at be been but by for from had has have he her his i if in into is it its me my " +
   "no nor not of on or our so than that the their them then there these they this to was were what " +
   "when which who will with you your")
    .split(" ")
);

// Lowercase, split on anything that isn't a latin letter or digit, drop stopwords + 1-char tokens,
// and (optionally) de-duplicate. Accented letters are folded so "vertù" matches "vertu".
export function tokenize(text, { unique = true } = {}) {
  const lower = String(text == null ? "" : text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip combining diacritics
  const out = [];
  const seen = unique ? new Set() : null;
  const re = /[a-z0-9]+/g;
  let m;
  while ((m = re.exec(lower)) !== null) {
    const t = m[0];
    if (t.length < 2) continue;
    if (STOP.has(t)) continue;
    if (seen) {
      if (seen.has(t)) continue;
      seen.add(t);
    }
    out.push(t);
  }
  return out;
}

// A space-padded token blob (" a b c ") so callers can test word boundaries cheaply:
//   blob.includes(" word ")  -> exact token
//   blob.includes(" word")   -> a token starts with `word` (prefix)
//   blob.includes("word")    -> substring of some token
export function termBlob(parts) {
  const joined = Array.isArray(parts) ? parts.join(" ") : String(parts);
  const toks = tokenize(joined, { unique: true });
  return toks.length ? " " + toks.join(" ") + " " : "";
}
