// In-page find for prose deep-links. The search palette sends a chapter match to the reader as
// `…/read/<unit>/#find=<query>`; on load the reader calls runInPageFind(), which scrolls to and
// highlights the first occurrence of the query in the prose. Pure vanilla; honors reduced motion.
//
// The reader's resume-scroll restore is guarded by `!location.hash`, so a #find hash naturally takes
// precedence over the saved scroll position — the search jump wins, as intended.

import { tokenize } from "./search-tokenize.js";

const REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function runInPageFind() {
  const prose = document.getElementById("prose");
  if (!prose) return;
  clearFind(prose); // so a second find (hashchange) doesn't stack highlights
  const m = (location.hash || "").match(/^#find=(.*)$/);
  if (!m) return;
  let q;
  try { q = decodeURIComponent(m[1]); } catch (e) { q = m[1]; }
  q = (q || "").replace(/\s+/g, " ").trim();
  if (!q) return;

  // Try the literal phrase first. Chapter search uses token-AND matching, so a multi-word query can
  // match a chapter where the words aren't adjacent — fall back to the first significant token so the
  // reader always lands on (and highlights) a real matching word instead of silently doing nothing.
  if (findAndReveal(prose, q)) return;
  for (const tok of tokenize(q)) {
    if (findAndReveal(prose, tok)) return;
  }
}

function findAndReveal(prose, needle) {
  const nl = needle.toLowerCase();

  // 1) Precise: first occurrence inside a single text node — wrap it in <mark class="find-hit">.
  const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const idx = node.nodeValue.toLowerCase().indexOf(nl);
    if (idx < 0) continue;
    try {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + needle.length);
      const mark = document.createElement("mark");
      mark.className = "find-hit";
      range.surroundContents(mark);
      reveal(mark);
      return true;
    } catch (e) {
      // surroundContents can throw on partial-node boundaries; fall through to the paragraph pass.
      break;
    }
  }

  // 2) Fallback: the needle spans element boundaries (e.g. across a glossary mark). Flash the first
  //    paragraph that contains it so the reader still lands in the right place.
  const paras = prose.querySelectorAll("p");
  for (const p of paras) {
    if ((p.textContent || "").toLowerCase().includes(nl)) {
      p.classList.add("find-hit-block");
      reveal(p);
      return true;
    }
  }
  return false;
}

function reveal(el) {
  el.scrollIntoView({ block: "center", behavior: REDUCE ? "auto" : "smooth" });
}

// Remove highlights from a prior find so re-running (same-page hashchange) doesn't accumulate them.
function clearFind(root) {
  root.querySelectorAll("mark.find-hit").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });
  root.querySelectorAll(".find-hit-block").forEach((el) => el.classList.remove("find-hit-block"));
}
