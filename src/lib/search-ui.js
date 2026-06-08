// Deep Search command palette (⌘/Ctrl-K). Vanilla; bundled once by Astro and loaded on every page
// via Layout.astro. The index JSON is lazy-loaded on first open and searched in memory (708 records,
// simple string matching — no Web Worker needed). Navigation uses each record's pre-baked, base-path-
// correct `path`; chapter matches append `#find=<query>` so the reader scrolls+highlights the term.

import { tokenize } from "./search-tokenize.js";

// Sanctioned base use: BASE_URL only (never a hardcoded "/moby-dick-portal/"). Record paths are
// already absolute, so this is the one place the client touches the base — to fetch the index.
const BASE = import.meta.env.BASE_URL || "/";
const INDEX_URL = (BASE.endsWith("/") ? BASE : BASE + "/") + "search-index.json";

const TYPES = [
  { key: "chapter", label: "Chapters" },
  { key: "trail", label: "Trails" },
  { key: "entity", label: "People & places" },
  { key: "glossary", label: "Glossary" },
  { key: "note", label: "Study notes" }
];
const PER_GROUP = 6;

let index = null;          // { records: [...] } once loaded
let loading = null;        // in-flight fetch promise
let flat = [];            // currently rendered options, in display order
let active = -1;          // index into `flat`
let lastQuery = "";
let els = null;           // cached DOM
let debounceT = 0;

export function initSearch() {
  const overlay = document.getElementById("search-overlay");
  if (!overlay) return;
  els = {
    overlay,
    input: document.getElementById("search-input"),
    results: document.getElementById("search-results"),
    status: document.getElementById("search-status"),
    openBtn: document.getElementById("search-open")
  };
  if (!els.input || !els.results) return;

  labelShortcut();

  els.openBtn && els.openBtn.addEventListener("click", open);
  overlay.querySelectorAll("[data-search-close]").forEach((n) => n.addEventListener("click", close));

  // Global shortcut: ⌘/Ctrl-K toggles; "/" opens when not typing in a field.
  document.addEventListener("keydown", (e) => {
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (e.key === "/" && !isOpen() && !isTyping(document.activeElement)) {
      e.preventDefault();
      open();
    }
  });

  // Focus trap: only the input and the close button are tabbable inside the dialog (options are
  // tabindex=-1), so cycle Tab between them and never let focus leak to the page behind the modal.
  overlay.addEventListener("keydown", (e) => {
    // Escape closes from ANY focused element in the dialog (input handles its own too; this covers the
    // close button and any future focusables).
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== "Tab") return;
    const stops = [els.input, overlay.querySelector(".search-close")].filter(Boolean);
    if (stops.length < 2) return;
    e.preventDefault();
    const i = stops.indexOf(document.activeElement);
    const nextI = e.shiftKey ? (i <= 0 ? stops.length - 1 : i - 1) : (i === stops.length - 1 ? 0 : i + 1);
    stops[nextI].focus();
  });

  // Keys while the palette is open live on the input; stop Escape from also reaching the reader.
  els.input.addEventListener("keydown", onInputKey);
  els.input.addEventListener("input", () => {
    clearTimeout(debounceT);
    debounceT = setTimeout(() => runSearch(els.input.value), 90);
  });
}

function isOpen() { return els.overlay.classList.contains("open"); }
function isTyping(el) {
  if (!el) return false;
  const t = el.tagName;
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || el.isContentEditable;
}
function announce(msg) { if (els.status) els.status.textContent = msg; }
function setExpanded(on) { els.input.setAttribute("aria-expanded", String(!!on)); }
// Confine assistive-tech (virtual cursor / swipe-explore), not just Tab, by marking the page behind
// the dialog inert while it is open. The overlay is a sibling AFTER these, so it stays interactive.
function backgroundInert(on) {
  [".site-header", "main", ".site-footer"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.toggleAttribute("inert", on);
  });
}

function open() {
  els.overlay.hidden = false;
  // next frame so the CSS transition runs
  requestAnimationFrame(() => els.overlay.classList.add("open"));
  els.overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("search-lock");
  backgroundInert(true);
  els.input.focus();
  els.input.select();
  loadIndex();
  if (!els.input.value) renderHint();
}

function close() {
  els.overlay.classList.remove("open");
  els.overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("search-lock");
  backgroundInert(false); // restore the page before returning focus into it
  setExpanded(false);
  // hide after the transition; harmless if it fires late
  setTimeout(() => { if (!isOpen()) els.overlay.hidden = true; }, 180);
  active = -1;
  els.openBtn && els.openBtn.focus();
}

function loadIndex() {
  if (index || loading) return loading;
  loading = fetch(INDEX_URL)
    .then((r) => { if (!r.ok) throw new Error("index " + r.status); return r.json(); })
    .then((data) => { index = data; if (els.input.value) runSearch(els.input.value); })
    .catch(() => { renderMessage("Search is unavailable offline until it has loaded once."); })
    .finally(() => { loading = null; });
  return loading;
}

function onInputKey(e) {
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); move(1); return; }
  if (e.key === "ArrowUp") { e.preventDefault(); move(-1); return; }
  if (e.key === "Enter") {
    e.preventDefault();
    activate(flat[active >= 0 ? active : 0]);
  }
}

function move(dir) {
  if (!flat.length) return;
  active = (active + dir + flat.length) % flat.length;
  flat.forEach((o, i) => {
    o.el.setAttribute("aria-selected", String(i === active));
    o.el.classList.toggle("active", i === active);
  });
  const cur = flat[active];
  els.input.setAttribute("aria-activedescendant", cur.el.id);
  cur.el.scrollIntoView({ block: "nearest" });
}

// ---- search + scoring ----
function runSearch(raw) {
  lastQuery = (raw || "").trim();
  if (!lastQuery) { renderHint(); return; }
  if (!index) { if (!loading) loadIndex(); return; }

  let tokens = tokenize(lastQuery);
  if (!tokens.length && lastQuery.length >= 2) tokens = [lastQuery.toLowerCase()];
  if (!tokens.length) { renderHint(); return; }

  const scored = [];
  for (const rec of index.records) {
    const s = score(rec, tokens);
    if (s > 0) scored.push({ rec, s });
  }
  scored.sort((a, b) => b.s - a.s || a.rec.title.length - b.rec.title.length);
  render(scored);
}

function score(rec, tokens) {
  let total = 0;
  for (const tok of tokens) {
    const inTerms = matchLevel(rec.terms, tok);
    if (!inTerms) return 0; // AND: every token must appear somewhere
    total += inTerms;
    total += matchLevel(rec.tt, tok) * 1.5; // title/term boost
  }
  return total;
}

// 6 = exact token, 4 = prefix of a token, 2 = substring; 0 = absent. `blob` is space-padded.
function matchLevel(blob, tok) {
  if (!blob) return 0;
  if (blob.indexOf(" " + tok + " ") >= 0) return 6;
  if (blob.indexOf(" " + tok) >= 0) return 4;
  if (blob.indexOf(tok) >= 0) return 2;
  return 0;
}

// ---- rendering ----
function render(scored) {
  flat = [];
  active = -1;
  els.input.removeAttribute("aria-activedescendant");
  if (!scored.length) { renderMessage(`No matches for “${escapeHtml(lastQuery)}”.`); return; }

  const tokens = tokenize(lastQuery);
  if (!tokens.length && lastQuery.length >= 2) tokens.push(lastQuery.toLowerCase());

  let html = "";
  let n = 0;
  for (const { key, label } of TYPES) {
    const group = scored.filter((x) => x.rec.type === key);
    if (!group.length) continue;
    const shown = group.slice(0, PER_GROUP);
    // role=group + aria-label keeps the listbox's children to groups/options; the head/more <p> are
    // decorative (aria-hidden) so they don't pollute option counting in screen readers.
    html += `<div class="sr-group" role="group" aria-label="${escapeAttr(label)}"><p class="sr-grouphead" aria-hidden="true">${label} <span class="sr-count">${group.length}</span></p>`;
    for (const { rec } of shown) {
      const id = "sr-opt-" + n++;
      // tabindex=-1: options are arrow-navigated via aria-activedescendant; focus stays on the input,
      // and Tab is trapped to the input/close button (see initSearch), so focus can't escape the modal.
      html += `<a class="sr-opt" id="${id}" role="option" tabindex="-1" aria-selected="false" href="${escapeAttr(navUrl(rec))}" data-idx="${flat.length}">` +
        `<span class="sr-type sr-type-${rec.type}">${typeShort(rec.type)}</span>` +
        `<span class="sr-main"><span class="sr-title">${highlight(rec.title, tokens)}</span>` +
        `<span class="sr-snip">${highlight(rec.snippet, tokens)}</span></span></a>`;
      flat.push({ rec, _idHolder: id });
    }
    if (group.length > shown.length) {
      html += `<p class="sr-more" aria-hidden="true">+${group.length - shown.length} more ${label.toLowerCase()}</p>`;
    }
    html += "</div>";
  }
  els.results.innerHTML = html;

  // wire option elements
  const opts = els.results.querySelectorAll(".sr-opt");
  opts.forEach((el, i) => {
    flat[i].el = el;
    el.addEventListener("click", (e) => { e.preventDefault(); activate(flat[i].rec); });
    el.addEventListener("mousemove", () => setActive(i));
  });
  if (flat.length) setActive(0);
  setExpanded(flat.length > 0);
  announce(scored.length + (scored.length === 1 ? " result" : " results"));
}

function setActive(i) {
  active = i;
  flat.forEach((o, j) => {
    o.el.setAttribute("aria-selected", String(j === i));
    o.el.classList.toggle("active", j === i);
  });
  els.input.setAttribute("aria-activedescendant", flat[i].el.id);
}

function navUrl(rec) {
  return rec.type === "chapter" && lastQuery ? rec.path + "#find=" + encodeURIComponent(lastQuery) : rec.path;
}
function activate(rec) {
  if (!rec) return;
  window.location.href = navUrl(rec);
  close();
}

function renderHint() {
  flat = []; active = -1;
  els.input.removeAttribute("aria-activedescendant");
  setExpanded(false);
  els.results.innerHTML = `<p class="sr-hint">Search all 142 chapters, ${index ? index.byType.glossary : 114} glossary terms, and study notes. Use ↑ ↓ to move, ↵ to open.</p>`;
}
function renderMessage(msg) {
  flat = []; active = -1;
  els.input.removeAttribute("aria-activedescendant");
  setExpanded(false);
  els.results.innerHTML = `<p class="sr-hint">${msg}</p>`;
  announce(msg);
}

// ---- helpers ----
function typeShort(t) {
  return t === "chapter" ? "Ch" : t === "glossary" ? "Term" : t === "trail" ? "Trail" : t === "entity" ? "Entity" : "Note";
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }
function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Highlight on the RAW text and escape per-segment, so a query token can never collide with the
// "&amp;"/"&lt;"/"&gt;" produced by escaping (a token like "amp" must not split a literal "&").
function highlight(text, tokens) {
  const raw = String(text || "");
  if (!tokens.length) return escapeHtml(raw);
  const re = new RegExp("(" + tokens.map(escapeReg).join("|") + ")", "gi");
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(raw)) !== null) {
    if (m.index === re.lastIndex) { re.lastIndex++; continue; } // guard zero-length matches
    out += escapeHtml(raw.slice(last, m.index)) + "<mark>" + escapeHtml(m[0]) + "</mark>";
    last = m.index + m[0].length;
  }
  return out + escapeHtml(raw.slice(last));
}

function labelShortcut() {
  const kbd = els.openBtn && els.openBtn.querySelector("kbd");
  if (!kbd) return;
  const mac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
  kbd.textContent = mac ? "⌘K" : "Ctrl K";
}
