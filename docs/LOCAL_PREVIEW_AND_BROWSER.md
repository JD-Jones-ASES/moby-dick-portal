# Local Preview And Browser Control

This project can be previewed normally with Astro, but Codex's managed shell may clean up detached child processes when a tool command returns. That was the reason earlier preview servers appeared to start and then disappeared.

## Recommended Preview

From a normal user terminal:

```powershell
cd C:\GitHub_Files\Melville
npm.cmd run dev -- --host 127.0.0.1 --port 4321
```

Use `npm.cmd` on this Windows machine. Calling `npm` directly from PowerShell can hit the local script-execution policy because `npm.ps1` is blocked.

If the site has already been built and you only need the static output:

```powershell
cd C:\GitHub_Files\Melville
npm.cmd run build
npm.cmd run serve:dist
```

## Codex Preview Launch

If Codex needs to leave a server running, launch it outside the sandbox with approval:

```powershell
Start-Process -FilePath "npm.cmd" -ArgumentList @("run","dev","--","--host","127.0.0.1","--port","4321") -WorkingDirectory "C:\GitHub_Files\Melville" -WindowStyle Hidden
```

Foreground `npm.cmd run dev -- --host 127.0.0.1 --port 4321` works inside the tool shell, but it blocks until timed out. Sandbox-launched detached processes may be killed when the command returns.

## Browser Control

The Codex in-app browser connector currently fails before reaching Chrome with:

```text
windows sandbox failed: spawn setup refresh
```

Treat that as a Codex desktop/browser-runtime issue, not a project issue and not a sign that Chrome lacks access to the site.

The reliable fallback is Chrome DevTools Protocol with a separate Chrome profile:

```powershell
New-Item -ItemType Directory -Force -Path C:\tmp\codex-chrome-profile | Out-Null
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList @("--remote-debugging-port=9222","--user-data-dir=C:\tmp\codex-chrome-profile","--new-window","http://127.0.0.1:4321")
```

Then verify click-through control:

```powershell
cd C:\GitHub_Files\Melville
npm.cmd run smoke:browser
```

Expected result includes:

```json
{
  "title": "Moby-Dick Student Guide",
  "initialChapter": "Loomings",
  "launchAndNavState": "...",
  "studyModeActive": true,
  "pathTitle": "Classroom Standard",
  "storyMapCount": 7
}
```

If using a different app URL or debugging port:

```powershell
$env:APP_URL = "http://127.0.0.1:4322"
$env:CDP_ENDPOINT = "http://127.0.0.1:9223"
npm.cmd run smoke:browser
```

## No Extra Install Needed

No Playwright, Puppeteer, or additional package install is required for the current smoke test. Node 24 provides the WebSocket client used by `scripts/dev/cdp-smoke.mjs`.
