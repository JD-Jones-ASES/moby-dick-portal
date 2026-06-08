import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const appUrl = process.env.APP_URL || "http://127.0.0.1:4321";
const outDir = process.env.SCREENSHOT_DIR || ".codex-screenshots";

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
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
}

async function capture(name) {
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = path.join(outDir, name);
  await writeFile(file, Buffer.from(shot.result.data, "base64"));
  return file;
}

await mkdir(outDir, { recursive: true });
await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1906, height: 978, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: appUrl });
await new Promise((resolve) => setTimeout(resolve, 1200));

await evaluate(`
  document.querySelector("#search").value = "whale";
  document.querySelector("#search").dispatchEvent(new Event("input", { bubbles: true }));
`);
const topPath = await capture("reader-top-after-fixes.png");

await evaluate(`
  document.querySelector(".reader-main").scrollTop = document.querySelector(".reader-main").scrollHeight;
`);
await new Promise((resolve) => setTimeout(resolve, 300));
const bottomPath = await capture("reader-bottom-nav-after-fixes.png");

socket.close();

console.log(JSON.stringify({ topPath, bottomPath }, null, 2));
