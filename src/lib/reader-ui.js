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
  const margin = initMarginNote();
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

  // Single coordinated Escape handler: dismiss the Margin card first, then exit focus mode.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (margin && margin.isOpen()) { margin.hide(); return; }
    if (focus && focus.isOn()) { focus.exit(); }
  });

  // Expose for future surfaces (Phase 2 search hand-off) without re-querying.
  return { margin, typo, focus };
}

// ---------------------------------------------------------------------------
// Margin card: the single fixed surface for "the last thing you moused over".
//
// Hovering/focusing any inline glossary mark OR study-note mark — or its sidebar card — routes that
// item's content into one fixed card, so the page never jumps to the sidebar and no popover has to
// be positioned. Two modes, so it never permanently covers the prose:
//   - HOVER / focus = a transient peek that fades a moment after you move away (keeps the page clean).
//   - CLICK a mark or card = pin it open; it then persists until the close button, Escape, or you
//     click another mark. A pinned card ignores incidental hovers so your reference stays put.
// It lives outside the (hideable) sidebar, so it still works in Focus mode.
// ---------------------------------------------------------------------------
const MN_HIDE_DELAY = 1500;
function initMarginNote() {
  const box = document.getElementById("margin-note");
  const content = box && box.querySelector(".mn-content");
  const closeBtn = box && box.querySelector(".mn-close");
  if (!box || !content) return null;
  const scrollOpts = { block: "center", behavior: REDUCE ? "auto" : "smooth" };
  let pinned = false;
  let hideTimer = 0;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clearActive() {
    document.querySelectorAll(".anno-mark.active, .note.active, .gloss-mark.active, .gloss.active")
      .forEach((node) => node.classList.remove("active"));
  }
  function cancelHide() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; } }
  function scheduleHide() { if (pinned) return; cancelHide(); hideTimer = setTimeout(hide, MN_HIDE_DELAY); }
  function hide() { cancelHide(); pinned = false; box.hidden = true; box.classList.remove("is-note"); clearActive(); }
  function present(kind, isNote, nodes, markEl, sidebarEl, pin) {
    cancelHide();
    clearActive();
    box.classList.toggle("is-note", isNote);
    content.replaceChildren(el("span", "mn-kind", kind), ...nodes);
    box.hidden = false;
    box.scrollTop = 0;
    if (markEl) markEl.classList.add("active");
    if (sidebarEl) sidebarEl.classList.add("active");
    if (pin) pinned = true;
  }

  // Glossary: build fresh card content from the hidden gloss-pop definition span (falls back to the
  // sidebar card if a term has a sidebar card but no inline mark on this page).
  function showGloss(id, markEl, pin) {
    const pop = document.getElementById("gpop-" + id);
    const card = document.getElementById("gcard-" + id);
    let cat = "", term = "", def = "";
    if (pop) {
      const c = pop.querySelector(".gp-cat"); if (c) cat = c.textContent;
      const t = pop.querySelector(".gp-term"); if (t) term = t.textContent;
      const d = pop.querySelector(".gp-def"); if (d) def = d.textContent;
    } else if (card) {
      const c = card.querySelector(".cat"); if (c) cat = c.textContent;
      const dt = card.querySelector("dt"); if (dt && dt.firstChild) term = dt.firstChild.textContent.trim();
      const dd = card.querySelector("dd"); if (dd) def = dd.textContent;
    }
    const nodes = [];
    if (cat) nodes.push(el("span", "gp-cat", cat));
    nodes.push(el("span", "gp-term", term));
    nodes.push(el("span", "gp-def", def));
    present("Glossary", false, nodes, markEl || document.getElementById("gmark-" + id), card, pin);
  }

  // Study note: clone the sidebar note's children (claim badge, quoted anchor, body, citation). The
  // cloned anchor link still points at the in-prose mark, so it works as an explicit "see it in
  // context" link from inside the card.
  function showNote(id, markEl, pin) {
    const note = document.getElementById("note-" + id);
    if (!note) return;
    const nodes = [...note.children].map((c) => c.cloneNode(true));
    present("Study note", true, nodes, markEl || document.getElementById("mark-" + id), note, pin);
  }

  // ---- Inline marks: hover/focus peek; click pins (and never jumps the page) ----
  document.querySelectorAll(".gloss-mark").forEach((mark) => {
    const id = mark.dataset.gloss;
    mark.addEventListener("mouseenter", () => { if (!pinned) showGloss(id, mark, false); });
    mark.addEventListener("mouseleave", scheduleHide);
    mark.addEventListener("focus", () => { if (!pinned) showGloss(id, mark, false); });
    mark.addEventListener("blur", scheduleHide);
    mark.addEventListener("click", (e) => { e.preventDefault(); showGloss(id, mark, true); });
  });
  document.querySelectorAll(".anno-mark").forEach((mark) => {
    const id = mark.dataset.note;
    mark.addEventListener("mouseenter", () => { if (!pinned) showNote(id, mark, false); });
    mark.addEventListener("mouseleave", scheduleHide);
    mark.addEventListener("focus", () => { if (!pinned) showNote(id, mark, false); });
    mark.addEventListener("blur", scheduleHide);
    // Was an <a href="#note-…"> that jumped the page — now it pins the note in the card instead.
    mark.addEventListener("click", (e) => { e.preventDefault(); showNote(id, mark, true); });
  });

  // ---- Sidebar cards: hover peeks; click pins and brings the passage into view ----
  document.querySelectorAll(".gloss[data-gloss]").forEach((card) => {
    const id = card.dataset.gloss;
    card.addEventListener("mouseenter", () => { if (!pinned) showGloss(id, null, false); });
    card.addEventListener("mouseleave", scheduleHide);
    card.addEventListener("focus", () => { if (!pinned) showGloss(id, null, false); });
    card.addEventListener("blur", scheduleHide);
    card.addEventListener("click", () => {
      showGloss(id, null, true);
      const mark = document.getElementById("gmark-" + id);
      if (mark) mark.scrollIntoView(scrollOpts);
    });
  });
  document.querySelectorAll(".note[id^='note-']").forEach((note) => {
    const id = note.id.replace(/^note-/, "");
    note.addEventListener("mouseenter", () => { if (!pinned) showNote(id, null, false); });
    note.addEventListener("mouseleave", scheduleHide);
    note.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;        // let the quote / citation links do their own thing
      showNote(id, null, true);
      const mark = document.getElementById("mark-" + id);
      if (mark) mark.scrollIntoView(scrollOpts);
    });
  });

  // Hovering/focusing the card itself keeps it up (e.g. to click a citation); leaving re-arms the fade.
  box.addEventListener("mouseenter", cancelHide);
  box.addEventListener("mouseleave", scheduleHide);
  box.addEventListener("focusin", cancelHide);
  box.addEventListener("focusout", scheduleHide);
  if (closeBtn) closeBtn.addEventListener("click", hide);

  return { hide, isOpen: () => !box.hidden };
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
