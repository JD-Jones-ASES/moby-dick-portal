// Immersive reading-room controller for /read/[unit]/.
//
// This module is *processed* by Astro (imported from a non-inline <script>), so it is bundled
// ONCE into a shared, content-hashed, base-path-correct chunk and reused across all 142 reader
// pages instead of being duplicated inline into every page's HTML. It is pure vanilla — no new
// dependency, no framework, no CDN — and works fully offline.
//
// Responsibilities:
//   - Study-note <-> inline-mark sync, glossary marks + in-place popovers, glossary density toggle
//     (ported verbatim from the former inline reader script).
//   - Phase 1 reading room: focus / distraction-free mode, live typography controls, per-chapter
//     reading-progress bar, resume-last-position, and j/k + arrow chapter navigation.
//
// Everything degrades gracefully when localStorage is unavailable (private mode) and honors
// prefers-reduced-motion on every motion path. Each init guards for missing DOM so importing the
// module on a page without a reader is harmless.

import { runInPageFind } from "./in-page-find.js";
import { initAmbient } from "./ambient-sound.js";

const REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- localStorage helpers (never throw; degrade in private mode) ----
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

export function initReader() {
  const gloss = initGlossaryAndNotes();
  initDensityToggle();
  const typo = initTypography();
  const focus = initFocusMode();
  initProgressBar();
  initResume();
  initKeyboardNav();
  initAmbient();

  // Deep-link from the search palette: scroll+highlight a prose term on load and on later
  // same-page #find= changes.
  runInPageFind();
  window.addEventListener("hashchange", runInPageFind);

  // Single coordinated Escape handler: a glossary popover wins first, then focus mode exits.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (gloss && gloss.isOpen()) { gloss.hideAllPops(); return; }
    if (focus && focus.isOn()) { focus.exit(); }
  });

  // Expose for future surfaces (Phase 2 search hand-off) without re-querying.
  return { gloss, typo, focus };
}

// ---------------------------------------------------------------------------
// Study-note <-> mark sync + glossary marks + popovers  (ported from inline script)
// ---------------------------------------------------------------------------
function initGlossaryAndNotes() {
  const scrollOpts = { block: "nearest", behavior: REDUCE ? "auto" : "smooth" };

  // ---- Study-note <-> mark sync ----
  function clearAnno() {
    document.querySelectorAll(".anno-mark.active, .note.active").forEach((el) => el.classList.remove("active"));
  }
  function activateAnno(id) {
    clearAnno();
    const m = document.getElementById("mark-" + id);
    const n = document.getElementById("note-" + id);
    if (m) m.classList.add("active");
    if (n) { n.classList.add("active"); }
  }
  document.querySelectorAll(".anno-mark").forEach((m) =>
    m.addEventListener("click", () => activateAnno(m.dataset.note))
  );
  document.querySelectorAll(".note[id^='note-']").forEach((n) =>
    n.addEventListener("click", () => activateAnno(n.id.replace(/^note-/, "")))
  );

  // ---- Glossary marks <-> cards + popover ----
  // openMark = id of the currently shown popover; pinned = it was opened by an explicit
  // click (mark or card) and should survive pointer-leave until Escape / outside / another open.
  let openMark = null;
  let pinned = false;
  let popHovered = false;
  function hideAllPops() {
    document.querySelectorAll(".gloss-pop:not([hidden])").forEach((p) => {
      p.hidden = true;
      p.classList.remove("below", "flip-left");
    });
    document.querySelectorAll(".gloss-mark.active, .gloss.active").forEach((el) => el.classList.remove("active"));
    openMark = null;
    pinned = false;
    popHovered = false;
  }
  function placePop(mark, pop) {
    pop.hidden = false;
    pop.classList.remove("below", "flip-left");
    if (mark.getBoundingClientRect().top < 150) pop.classList.add("below");
    if (pop.getBoundingClientRect().right > window.innerWidth - 8) pop.classList.add("flip-left");
  }
  // scroll defaults to false: hovering/focusing a term reveals its popover and highlights its
  // sidebar card IN PLACE and never moves the page. Only an explicit click scrolls (a sidebar
  // card click brings its word into view in the prose).
  function showGloss(id, fromCard, scroll = false) {
    const mark = document.getElementById("gmark-" + id);
    const pop = document.getElementById("gpop-" + id);
    const card = document.getElementById("gcard-" + id);
    if (mark) mark.classList.add("active");
    if (card) card.classList.add("active");
    if (mark && pop) placePop(mark, pop);
    if (scroll) {
      if (fromCard && mark) mark.scrollIntoView(scrollOpts);
      else if (!fromCard && card) card.scrollIntoView(scrollOpts);
    }
    openMark = id;
  }
  document.querySelectorAll(".gloss-mark").forEach((mark) => {
    const id = mark.dataset.gloss;
    const pop = document.getElementById("gpop-" + id);
    mark.addEventListener("mouseenter", () => {
      if (openMark === id) return;
      if (openMark) hideAllPops();
      showGloss(id, false);
    });
    mark.addEventListener("mouseleave", () => {
      // defer so a move into the popover (which sets popHovered) can cancel the close
      setTimeout(() => {
        if (openMark === id && !pinned && !popHovered) hideAllPops();
      }, 90);
    });
    mark.addEventListener("focus", () => { if (openMark !== id) { hideAllPops(); showGloss(id, false); } });
    mark.addEventListener("blur", () => { if (openMark === id && !pinned) hideAllPops(); });
    mark.addEventListener("click", (e) => {
      e.preventDefault();
      if (openMark === id && pinned) hideAllPops();
      else { hideAllPops(); showGloss(id, false); pinned = true; }
    });
    if (pop) {
      pop.addEventListener("mouseenter", () => { popHovered = true; openMark = id; });
      pop.addEventListener("mouseleave", () => { popHovered = false; if (openMark === id && !pinned) hideAllPops(); });
    }
  });
  document.querySelectorAll(".gloss[data-gloss]").forEach((card) => {
    const id = card.dataset.gloss;
    // Click a card -> scroll its word into view in the prose (explicit "find it"); focus alone
    // (keyboard tab) only highlights, no scroll.
    card.addEventListener("click", () => { hideAllPops(); showGloss(id, true, true); pinned = true; });
    card.addEventListener("focus", () => { if (openMark === id) return; hideAllPops(); showGloss(id, true, false); pinned = true; });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".gloss-wrap") && !e.target.closest(".gloss[data-gloss]")) hideAllPops();
  });
  document.addEventListener("focusin", (e) => {
    if (openMark && !e.target.closest(".gloss-wrap") && !e.target.closest(".gloss[data-gloss]")) hideAllPops();
  });

  return { hideAllPops, isOpen: () => openMark !== null };
}

// ---------------------------------------------------------------------------
// Glossary-marks density toggle  (ported from inline script)
// ---------------------------------------------------------------------------
function initDensityToggle() {
  const toggle = document.getElementById("gloss-toggle");
  const prose = document.getElementById("prose");
  if (!toggle || !prose) return;
  const KEY = "mdp-gloss";
  function apply(on) {
    prose.classList.toggle("gloss-quiet", !on);
    toggle.setAttribute("aria-pressed", String(on));
    toggle.textContent = "Glossary marks: " + (on ? "on" : "off");
  }
  let on = true;
  if (lsGet(KEY) === "off") on = false;
  apply(on);
  toggle.addEventListener("click", () => {
    on = !on;
    apply(on);
    lsSet(KEY, on ? "on" : "off");
  });
}

// ---------------------------------------------------------------------------
// Typography controls  (mdp-typo)
// Writes scoped --reader-* custom props on <html>; .prose consumes them via var() fallbacks, so
// the no-flash head script in Layout.astro can apply the same values before first paint.
// ---------------------------------------------------------------------------
const TYPO_KEY = "mdp-typo";
const TYPO_DEFAULT = { size: "1.18rem", leading: "1.75", measure: "70ch", family: "var(--serif)" };
const SIZE_MIN = 0.95, SIZE_MAX = 1.62, SIZE_STEP = 0.06;
const LEAD_MIN = 1.4, LEAD_MAX = 2.1, LEAD_STEP = 0.1;

function readTypo() {
  let saved = null;
  try { saved = JSON.parse(lsGet(TYPO_KEY) || "null"); } catch (e) {}
  return Object.assign({}, TYPO_DEFAULT, saved && typeof saved === "object" ? saved : null);
}
function clamp(n, lo, hi) { return Math.min(Math.max(n, lo), hi); }

function initTypography() {
  const root = document.documentElement;
  const dock = document.querySelector(".reader-dock");
  let state = readTypo();

  function applyVars() {
    root.style.setProperty("--reader-size", state.size);
    root.style.setProperty("--reader-leading", state.leading);
    root.style.setProperty("--reader-measure", state.measure);
    root.style.setProperty("--reader-font", state.family);
  }
  function save() { lsSet(TYPO_KEY, JSON.stringify(state)); }
  function syncPressed() {
    if (!dock) return;
    dock.querySelectorAll("[data-typo='measure']").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.val === state.measure)));
    dock.querySelectorAll("[data-typo='family']").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.val === state.family)));
  }
  function commit() { applyVars(); save(); syncPressed(); }

  applyVars();
  syncPressed();
  if (!dock) return { get: () => state };

  // Polite live region: stepper buttons have no visible value, so announce the new size/spacing
  // (and the min/max bound when clamped) for screen-reader users.
  const status = dock.querySelector("#typo-status");
  function announce(msg) { if (status) status.textContent = msg; }
  const EPS = 1e-9;

  function stepSize(dir) {
    const next = clamp((parseFloat(state.size) || 1.18) + dir * SIZE_STEP, SIZE_MIN, SIZE_MAX);
    state.size = next.toFixed(2) + "rem";
    commit();
    announce(next >= SIZE_MAX - EPS ? "Largest text size"
      : next <= SIZE_MIN + EPS ? "Smallest text size"
      : "Text size " + Math.round((next / 1.18) * 100) + " percent");
  }
  function stepLead(dir) {
    const next = clamp((parseFloat(state.leading) || 1.75) + dir * LEAD_STEP, LEAD_MIN, LEAD_MAX);
    state.leading = next.toFixed(2);
    commit();
    announce(next >= LEAD_MAX - EPS ? "Loosest line spacing"
      : next <= LEAD_MIN + EPS ? "Tightest line spacing"
      : "Line spacing " + next.toFixed(2));
  }
  const on = (sel, fn) => { const el = dock.querySelector(sel); if (el) el.addEventListener("click", fn); };
  on("[data-typo='size-inc']", () => stepSize(1));
  on("[data-typo='size-dec']", () => stepSize(-1));
  on("[data-typo='lead-inc']", () => stepLead(1));
  on("[data-typo='lead-dec']", () => stepLead(-1));
  dock.querySelectorAll("[data-typo='measure']").forEach((b) =>
    b.addEventListener("click", () => { state.measure = b.dataset.val; commit(); announce("Line width " + (b.textContent || "").trim()); }));
  dock.querySelectorAll("[data-typo='family']").forEach((b) =>
    b.addEventListener("click", () => { state.family = b.dataset.val; commit(); announce((b.textContent || "").trim() + " typeface"); }));
  on("[data-typo='reset']", () => { state = Object.assign({}, TYPO_DEFAULT); commit(); announce("Reading type reset to default"); });

  return { get: () => state };
}

// ---------------------------------------------------------------------------
// Focus / distraction-free mode  (mdp-focus)
// data-focus lives on <html> so the no-flash head script can set it before paint; the visual
// effect is scoped in CSS to body.reader-page, so it never alters non-reader pages.
// ---------------------------------------------------------------------------
const FOCUS_KEY = "mdp-focus";
function initFocusMode() {
  const root = document.documentElement;
  const btn = document.getElementById("focus-toggle");
  function isOn() { return root.dataset.focus === "on"; }
  function set(on) {
    root.dataset.focus = on ? "on" : "";
    if (btn) btn.setAttribute("aria-pressed", String(on));
    lsSet(FOCUS_KEY, on ? "on" : "off");
  }
  // Reflect any pre-paint state the head script applied.
  if (btn) btn.setAttribute("aria-pressed", String(isOn()));
  if (btn) btn.addEventListener("click", () => set(!isOn()));
  return { isOn, exit: () => set(false), enter: () => set(true) };
}

// ---------------------------------------------------------------------------
// Per-chapter reading progress bar
// Computed from the prose region's position each animation frame — O(1) regardless of chapter
// length, so it stays smooth on long chapters (Cetology) without per-paragraph observers.
// ---------------------------------------------------------------------------
function initProgressBar() {
  const bar = document.getElementById("reading-progress-bar");
  const prose = document.getElementById("prose");
  if (!bar || !prose) return;
  let ticking = false;
  function update() {
    ticking = false;
    const rect = prose.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const h = rect.height;
    const denom = h - vh;
    // Always measured against the PROSE region only — never the document/sidebar/footer height,
    // so a short chapter with a tall notes column can't read 100% while the prose is still on screen.
    let pct = denom > 0
      ? -rect.top / denom                  // normal chapter: 0 at the top, 1 at the last screenful
      : (h > 0 ? (vh - rect.top) / h : 0);  // short chapter: fraction of prose scrolled into view
    pct = clamp(pct, 0, 1);
    bar.style.transform = "scaleX(" + pct + ")";
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

// ---------------------------------------------------------------------------
// Resume last reading position  (mdp-resume-<unit_id>, LRU-capped via mdp-resume-index)
// ---------------------------------------------------------------------------
const RESUME_INDEX = "mdp-resume-index";
const RESUME_CAP = 50;
function initResume() {
  const reader = document.querySelector(".reader[data-unit-id]");
  const unitId = reader && reader.dataset.unitId;
  if (!unitId) return;
  const KEY = "mdp-resume-" + unitId;

  // Own scroll restoration so the explicit mdp-resume jump is authoritative: otherwise the UA's
  // own restoration (on reload / back-forward) runs around load — after this deferred module — and
  // would override our position. Fragment (#hash) navigation still scrolls to the anchor normally.
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}

  // Restore — but never fight an explicit deep link (#note-…/#mark-… from search etc.).
  if (!location.hash) {
    const y = parseInt(lsGet(KEY) || "0", 10);
    if (y > 0) {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      // Jump instantly — never animate the restore past `html { scroll-behavior: smooth }`.
      window.scrollTo({ top: Math.min(y, max), left: 0, behavior: "instant" });
    }
  }

  function touchIndex() {
    let arr = [];
    try { arr = JSON.parse(lsGet(RESUME_INDEX) || "[]"); } catch (e) {}
    if (!Array.isArray(arr)) arr = [];
    arr = arr.filter((id) => id !== unitId);
    arr.unshift(unitId);
    while (arr.length > RESUME_CAP) { const old = arr.pop(); lsDel("mdp-resume-" + old); }
    lsSet(RESUME_INDEX, JSON.stringify(arr));
  }
  function dropFromIndex() {
    let arr = [];
    try { arr = JSON.parse(lsGet(RESUME_INDEX) || "[]"); } catch (e) {}
    if (!Array.isArray(arr)) return;
    lsSet(RESUME_INDEX, JSON.stringify(arr.filter((id) => id !== unitId)));
  }
  function save() {
    const y = Math.round(window.scrollY || window.pageYOffset || 0);
    if (y > 4) { lsSet(KEY, String(y)); touchIndex(); }
    else { lsDel(KEY); dropFromIndex(); }
  }
  let t = 0;
  function schedule() { clearTimeout(t); t = setTimeout(save, 400); }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });
}

// ---------------------------------------------------------------------------
// Keyboard chapter navigation: j / ArrowRight -> next, k / ArrowLeft -> prev.
// Reads hrefs from the existing pager so no server data is threaded into client JS.
// ---------------------------------------------------------------------------
function initKeyboardNav() {
  const pager = document.querySelector(".pager");
  if (!pager) return;
  const prevA = pager.querySelector("a.card:not(.next)");
  const nextA = pager.querySelector("a.card.next");
  if (!prevA && !nextA) return;

  function isTyping(el) {
    if (!el) return false;
    const t = el.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return true;
    if (el.isContentEditable) return true;
    return !!(el.closest && el.closest(".reader-dock"));
  }
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    if (isTyping(document.activeElement)) return;
    if (document.querySelector("#search-overlay.open")) return; // don't navigate behind the open palette
    if (e.key === "j" || e.key === "ArrowRight") {
      if (nextA) { e.preventDefault(); window.location.href = nextA.href; }
    } else if (e.key === "k" || e.key === "ArrowLeft") {
      if (prevA) { e.preventDefault(); window.location.href = prevA.href; }
    }
  });
}
