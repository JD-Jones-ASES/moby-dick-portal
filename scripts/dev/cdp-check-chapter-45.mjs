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

if (!page) throw new Error(`No Chrome debugging target found for ${appUrl}`);

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
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
  if (response.result.exceptionDetails) {
    throw new Error(response.result.exceptionDetails.text);
  }
  return response.result.result.value;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Page.bringToFront");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: appUrl });
await new Promise((resolve) => setTimeout(resolve, 1200));

const state = await evaluate(`(() => {
  document.querySelector('#source-all')?.click();
  document.querySelector('#depth-study')?.click();
  const search = document.querySelector('#search');
  search.value = 'Affidavit';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  const target = [...document.querySelectorAll('.unit-button')].find((button) => button.textContent.includes('The Affidavit'));
  target?.click();
  const terms = [...document.querySelectorAll('.annotation-term')].map((term) => ({
    text: term.textContent,
    id: term.dataset.annotation
  }));
  const notes = [...document.querySelectorAll('.note-card')].map((card) => ({
    anchor: card.querySelector('strong')?.textContent ?? '',
    kind: card.querySelector('span')?.textContent ?? ''
  }));
  const badFragments = [...document.querySelectorAll('.annotation-term, .note-card strong')]
    .map((node) => node.textContent ?? '')
    .filter((text) => /^(ood,|ow |vidual|iately|st,|ite |ism |garded|b stood|aking|at crew|th his|antoms|f the whale|o enter|untain|ntable|rto,|ld have|fe,|riners|etween|te whale|nly,|hich |ird )/.test(text));
  return {
    title: document.querySelector('#reader-title')?.textContent ?? null,
    sourceAllActive: document.querySelector('#source-all')?.classList.contains('active') ?? false,
    studyActive: document.querySelector('#depth-study')?.classList.contains('active') ?? false,
    visibleUnitCount: document.querySelectorAll('.unit-button').length,
    terms,
    notes,
    badFragments
  };
})()`);

socket.close();

if (state.title !== "The Affidavit") throw new Error(`Expected Chapter 45 title, got ${state.title}`);
if (!state.sourceAllActive) throw new Error("Whole Book source mode is not active.");
if (!state.studyActive) throw new Error("Study mode is not active.");
if (state.badFragments.length) throw new Error(`Found clipped annotation fragments: ${JSON.stringify(state.badFragments)}`);
if (!state.terms.some((term) => term.text === "So far as what there may be")) {
  throw new Error(`Expected repaired Chapter 45 annotation term not found: ${JSON.stringify(state.terms)}`);
}

console.log(JSON.stringify(state, null, 2));
