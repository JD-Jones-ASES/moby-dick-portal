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

const freshAppUrl = `${appUrl}${appUrl.includes("?") ? "&" : "?"}sidebar=${Date.now()}`;
const loadPromise = waitForLoad();
await send("Page.navigate", { url: freshAppUrl });
await loadPromise;
await new Promise((resolve) => setTimeout(resolve, 300));

const result = await evaluate(`(() => {
  const payload = JSON.parse(document.querySelector('#guide-data').textContent);
  const expectedCount = payload.units.length;
  const pathSelect = document.querySelector('#path-select');
  const search = document.querySelector('#search');
  const clearSearch = document.querySelector('#clear-search');
  const sourceAll = document.querySelector('#source-all');
  const allTrail = () => [...document.querySelectorAll('#function-filters button')].find((button) => button.dataset.function === 'all')?.click();
  const report = [];

  for (const path of ['narrative_core', 'classroom_standard', 'full_text']) {
    pathSelect.value = path;
    pathSelect.dispatchEvent(new Event('change', { bubbles: true }));
    sourceAll.click();
    allTrail();
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    clearSearch.hidden = true;

    const buttons = [...document.querySelectorAll('#unit-list .unit-button')];
    const labels = buttons.map((button) => button.textContent);
    report.push({
      path,
      count: buttons.length,
      first: labels[0] ?? '',
      chapterOne: labels.find((label) => label.includes('Ch. 1')) ?? '',
      chapter135: labels.find((label) => label.includes('Ch. 135')) ?? '',
      epilogue: labels.find((label) => label.includes('Epilogue')) ?? ''
    });
  }

  return { expectedCount, report };
})()`);

const failures = result.report.filter((item) => (
  item.count !== result.expectedCount ||
  !item.chapterOne.includes("Loomings") ||
  !item.chapter135.includes("The Chase") ||
  !item.epilogue.includes("Epilogue")
));

socket.close();

if (failures.length) {
  throw new Error(`Whole Book sidebar check failed: ${JSON.stringify({ expectedCount: result.expectedCount, failures }, null, 2)}`);
}

console.log(JSON.stringify(result, null, 2));
