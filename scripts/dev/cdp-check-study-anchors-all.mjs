const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const appUrl = process.env.APP_URL || "http://127.0.0.1:4321";

const badFragmentPatterns = [
  /\bood,/i,
  /\bow\s/i,
  /\bvidual/i,
  /\bation\b/i,
  /\bing\b/i
];

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

const freshAppUrl = `${appUrl}${appUrl.includes("?") ? "&" : "?"}studyAnchors=${Date.now()}`;
const loadPromise = waitForLoad();
await send("Page.navigate", { url: freshAppUrl });
await loadPromise;
await new Promise((resolve) => setTimeout(resolve, 300));

const result = await evaluate(`(() => {
  const payload = JSON.parse(document.querySelector('#guide-data').textContent);
  const expectedUnits = payload.units.length;
  const pathSelect = document.querySelector('#path-select');
  const search = document.querySelector('#search');
  const sourceAll = document.querySelector('#source-all');
  const depthStudy = document.querySelector('#depth-study');
  const trailAll = () => [...document.querySelectorAll('#function-filters button')].find((button) => button.dataset.function === 'all')?.click();
  const isLetter = (value) => /[A-Za-z]/.test(value || '');

  pathSelect.value = 'full_text';
  pathSelect.dispatchEvent(new Event('change', { bubbles: true }));
  sourceAll.click();
  depthStudy.click();
  trailAll();
  search.value = '';
  search.dispatchEvent(new Event('input', { bubbles: true }));

  const unitButtons = [...document.querySelectorAll('#unit-list .unit-button')];
  const boundaryProblems = [];
  const suspiciousFragments = [];
  const unitsChecked = [];
  let termCount = 0;

  function previousText(node) {
    let current = node.previousSibling;
    while (current) {
      const text = current.textContent || '';
      if (text.length) return text;
      current = current.previousSibling;
    }
    return '';
  }

  function nextText(node) {
    let current = node.nextSibling;
    while (current) {
      const text = current.textContent || '';
      if (text.length) return text;
      current = current.nextSibling;
    }
    return '';
  }

  for (const button of unitButtons) {
    button.click();
    const title = document.querySelector('#reader-title')?.textContent ?? '';
    const unitText = button.textContent ?? '';
    unitsChecked.push({ title, unitText });

    for (const term of document.querySelectorAll('.annotation-term')) {
      const text = term.textContent || '';
      const before = previousText(term).slice(-1);
      const after = nextText(term).slice(0, 1);
      const first = text.slice(0, 1);
      const last = text.slice(-1);
      termCount += 1;

      if ((isLetter(before) && isLetter(first)) || (isLetter(after) && isLetter(last))) {
        boundaryProblems.push({
          title,
          id: term.dataset.annotation ?? '',
          text,
          before,
          after
        });
      }

      if (${JSON.stringify(badFragmentPatterns.map((pattern) => pattern.source))}.some((source) => new RegExp(source, 'i').test(text))) {
        suspiciousFragments.push({
          title,
          id: term.dataset.annotation ?? '',
          text
        });
      }
    }
  }

  return {
    expectedUnits,
    renderedUnits: unitButtons.length,
    checkedUnits: unitsChecked.length,
    termCount,
    boundaryProblems,
    suspiciousFragments
  };
})()`);

socket.close();

if (
  result.renderedUnits !== result.expectedUnits ||
  result.checkedUnits !== result.expectedUnits ||
  result.boundaryProblems.length ||
  result.suspiciousFragments.length
) {
  throw new Error(`Whole-book Study anchor check failed: ${JSON.stringify(result, null, 2)}`);
}

console.log(JSON.stringify({
  expectedUnits: result.expectedUnits,
  checkedUnits: result.checkedUnits,
  termCount: result.termCount,
  boundaryProblems: result.boundaryProblems.length,
  suspiciousFragments: result.suspiciousFragments.length
}, null, 2));
