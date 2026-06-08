const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const appUrl = process.env.APP_URL || "http://127.0.0.1:4321";
const targets = await (await fetch(`${endpoint}/json/list`)).json();
let page = targets.find((target) => target.type === "page" && target.url.startsWith(appUrl));

if (!page) {
  await fetch(`${endpoint}/json/new?${encodeURIComponent(appUrl)}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const refreshedTargets = await (await fetch(`${endpoint}/json/list`)).json();
  page = refreshedTargets.find((target) => target.type === "page" && target.url.startsWith(appUrl));
}

if (!page) {
  throw new Error(`No Chrome debugging target found for ${appUrl}`);
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let loadResolver = null;
let id = 0;

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Page.loadEventFired" && loadResolver) {
    loadResolver();
    loadResolver = null;
  }
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
};

await new Promise((resolve) => {
  socket.onopen = resolve;
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const message = { id: ++id, method, params };
    pending.set(message.id, resolve);
    socket.send(JSON.stringify(message));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return response.result.result.value;
}

async function waitForCondition(expression, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

function waitForLoad(timeout = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      loadResolver = null;
      resolve();
    }, timeout);
    loadResolver = () => {
      clearTimeout(timer);
      resolve();
    };
  });
}

await send("Runtime.enable");
await send("Page.enable");
await send("Page.bringToFront");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: "localStorage.clear(); sessionStorage.clear();"
});
await evaluate("localStorage.clear(); sessionStorage.clear(); true");
const freshAppUrl = `${appUrl}${appUrl.includes("?") ? "&" : "?"}smoke=${Date.now()}`;
const loadPromise = waitForLoad();
await send("Page.navigate", { url: freshAppUrl });
await loadPromise;
const launchReady = await waitForCondition(`
  document.querySelector('#reader-title')?.textContent === 'Loomings' &&
  document.querySelector('#previous-unit-bottom')?.disabled === true
`, 10000);

if (!launchReady) {
  const launchState = await evaluate(`JSON.stringify({
    title: document.querySelector('#reader-title')?.textContent ?? null,
    previousDisabled: document.querySelector('#previous-unit-bottom')?.disabled ?? null
  })`);
  throw new Error(`Launch wait failed: ${launchState}`);
}

const title = await evaluate("document.title");
const initialChapter = await evaluate("document.querySelector('#reader-title')?.textContent");
const launchAndNavState = await evaluate(`(() => {
  const search = document.querySelector('#search');
  const clear = document.querySelector('#clear-search');
  search.value = 'whale';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  const inputRect = search.getBoundingClientRect();
  const clearRect = clear.getBoundingClientRect();
  const centerDelta = Math.abs((inputRect.top + inputRect.height / 2) - (clearRect.top + clearRect.height / 2));
  return {
    brandHref: document.querySelector('.brand-lockup')?.getAttribute('href') ?? null,
    clearHidden: clear.hidden,
    clearCenterDelta: Math.round(centerDelta * 100) / 100,
    bottomNavCount: document.querySelectorAll('.reader-bottom-nav .page-nav-button').length,
    bottomPreviousDisabled: document.querySelector('#previous-unit-bottom')?.disabled ?? null,
    bottomNextDisabled: document.querySelector('#next-unit-bottom')?.disabled ?? null,
    nextLabel: document.querySelector('#next-unit-label')?.textContent ?? ''
  };
})()`);
await evaluate("document.querySelector('#depth-study')?.click()");
const studyModeActive = await evaluate("document.querySelector('#depth-study')?.classList.contains('active')");
const annotationLink = await evaluate(`(() => {
  const term = document.querySelector('.annotation-term');
  const card = term ? document.querySelector(\`.note-card[data-annotation="\${term.dataset.annotation}"]\`) : null;
  term?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  return {
    termId: term?.dataset.annotation ?? null,
    cardId: card?.dataset.annotation ?? null,
    termSelected: term?.classList.contains('selected') ?? false,
    cardSelected: card?.classList.contains('selected') ?? false
  };
})()`);
await evaluate(`
  const select = document.querySelector('#path-select');
  select.value = 'classroom_standard';
  select.dispatchEvent(new Event('change'));
`);
const pathTitle = await evaluate("document.querySelector('#path-title')?.textContent");
const storyMapCount = await evaluate("document.querySelectorAll('.story-button').length");

if (annotationLink.termId !== annotationLink.cardId || !annotationLink.termSelected || !annotationLink.cardSelected) {
  throw new Error(`Annotation link smoke check failed: ${JSON.stringify(annotationLink)}`);
}

if (
  launchAndNavState.brandHref !== "/" ||
  launchAndNavState.clearHidden ||
  launchAndNavState.clearCenterDelta > 1 ||
  launchAndNavState.bottomNavCount !== 2 ||
  launchAndNavState.bottomPreviousDisabled !== true ||
  launchAndNavState.bottomNextDisabled !== false ||
  !launchAndNavState.nextLabel.includes("The Carpetbag")
) {
  throw new Error(`Launch/navigation smoke check failed: ${JSON.stringify(launchAndNavState)}`);
}

const glossaryLoadPromise = waitForLoad();
await send("Page.navigate", { url: `${freshAppUrl}&glossary=${Date.now()}` });
await glossaryLoadPromise;
const glossaryLaunchReady = await waitForCondition(`
  document.querySelector('#reader-title')?.textContent === 'Loomings' &&
  document.querySelector('#next-unit-bottom')?.disabled === false
`, 10000);

if (!glossaryLaunchReady) {
  const glossaryLaunchState = await evaluate(`JSON.stringify({
    title: document.querySelector('#reader-title')?.textContent ?? null,
    nextDisabled: document.querySelector('#next-unit-bottom')?.disabled ?? null
  })`);
  throw new Error(`Glossary launch wait failed: ${glossaryLaunchState}`);
}

await evaluate(`(() => {
  document.querySelector('#depth-guide')?.click();
  document.querySelector('#next-unit-bottom')?.click();
  document.querySelector('#next-unit-bottom')?.click();
  return true;
})()`);

const spouterReady = await waitForCondition("document.querySelector('#reader-title')?.textContent === 'The Spouter-Inn'", 10000);
if (!spouterReady) {
  const spouterState = await evaluate(`JSON.stringify({
    title: document.querySelector('#reader-title')?.textContent ?? null,
    nextLabel: document.querySelector('#next-unit-label')?.textContent ?? null,
    previousLabel: document.querySelector('#previous-unit-label')?.textContent ?? null
  })`);
  throw new Error(`Spouter-Inn wait failed: ${spouterState}`);
}
const guideGlossaryState = await evaluate(`(() => {
  const term = document.querySelector('.gloss-term[data-term="queequeg"]');
  term?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, view: window }));
  const popover = document.querySelector('.gloss-popover');
  return {
    chapter: document.querySelector('#reader-title')?.textContent ?? null,
    annotationTerms: document.querySelectorAll('.annotation-term').length,
    glossaryTermCount: document.querySelectorAll('.gloss-term[data-term="queequeg"]').length,
    glossaryPanel: document.querySelector('#glossary-card')?.textContent ?? '',
    studyNotesHidden: document.querySelector('#study-notes-card')?.hidden ?? false,
    popoverHidden: popover?.hidden ?? false
  };
})()`);

if (
  guideGlossaryState.chapter !== "The Spouter-Inn" ||
  guideGlossaryState.annotationTerms !== 0 ||
  guideGlossaryState.glossaryTermCount < 1 ||
  !guideGlossaryState.glossaryPanel.includes("Queequeg") ||
  !guideGlossaryState.studyNotesHidden ||
  !guideGlossaryState.popoverHidden
) {
  throw new Error(`Guide glossary smoke check failed: ${JSON.stringify(guideGlossaryState)}`);
}

socket.close();

console.log(JSON.stringify({
  title,
  initialChapter,
  launchAndNavState,
  studyModeActive,
  annotationLink,
  guideGlossaryState,
  pathTitle,
  storyMapCount
}, null, 2));
