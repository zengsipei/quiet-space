#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { installAudioProbe, sampleAudioOutput } from "./audio-probe.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Verify native tab visibility and wind audio.\n\nnode verify-audio.mjs --base-url URL --out DIRECTORY\n\nRequires Node 22+, xvfb-run and Chromium. Starts and cleans only its own browser; leaves the supplied server running.");
  process.exit(0);
}
const option = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Supply ${name}`);
  return args[index + 1];
};
const base = new URL(option("--base-url"));
if (!/^https?:$/.test(base.protocol)) throw new Error("Use an HTTP browser instance");
const output = resolve(option("--out"));
mkdirSync(output, { recursive: true });
const profile = mkdtempSync(resolve(output, "browser-"));
const executable = process.env.QUIET_SPACE_BROWSER || (existsSync("/usr/local/bin/chromium") ? "/usr/local/bin/chromium" : "chromium");
const report = { verdict: "NOT VERIFIED", actions: [], errors: [] };
const browser = spawn("xvfb-run", ["-a", executable, "--no-sandbox", "--disable-dev-shm-usage", "--disable-breakpad", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { detached: true, stdio: ["ignore", "ignore", "pipe"] });
let browserLog = "";
let launchError;
let socket;
let sequence = 0;
let cancelled = false;
const pending = new Map();
const pause = (milliseconds) => new Promise((done) => setTimeout(done, milliseconds));
browser.stderr.on("data", (data) => { browserLog += data; });
browser.on("error", (error) => { launchError = error; });
const cancel = () => {
  cancelled = true;
  for (const request of pending.values()) { clearTimeout(request.timeout); request.fail(new Error("Native audio journey cancelled")); }
  pending.clear();
  socket?.close();
};
process.once("SIGINT", cancel);
process.once("SIGTERM", cancel);
const send = (method, params = {}, sessionId) => new Promise((done, fail) => {
  if (cancelled) { fail(new Error("Native audio journey cancelled")); return; }
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); fail(new Error(`${method} timed out`)); }, 60_000);
  pending.set(id, { done, fail, timeout });
  socket.send(JSON.stringify({ id, method, params, sessionId }));
});
const poll = async (read, accepts, description) => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (cancelled) throw new Error("Native audio journey cancelled");
    const value = await read();
    if (accepts(value)) return value;
    await pause(150);
  }
  throw new Error(description);
};

try {
  const endpoint = await poll(() => {
    if (launchError) throw launchError;
    if (browser.exitCode !== null) throw new Error(`Chromium exited ${browser.exitCode}: ${browserLog}`);
    return browserLog.match(/DevTools listening on (ws:\/\/\S+)/)?.[1];
  }, Boolean, "Chromium needs xvfb-run and a working WebGL executable");
  socket = new WebSocket(endpoint);
  await new Promise((done, fail) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", fail, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") report.errors.push(message.params.exceptionDetails.text);
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(message.id);
    if (message.error) request.fail(new Error(message.error.message));
    else request.done(message.result);
  });
  const target = await send("Target.createTarget", { url: "about:blank", newWindow: false });
  const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `(${installAudioProbe.toString()})()` }, sessionId);
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const audio = () => evaluate(`(${sampleAudioOutput.toString()})()`);
  const clickSound = async () => {
    const bounds = await evaluate("(() => { const bounds = document.querySelector('#sound').getBoundingClientRect(); return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }; })()");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...bounds, button: "left", clickCount: 1 }, sessionId);
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...bounds, button: "left", clickCount: 1 }, sessionId);
  };
  await send("Page.navigate", { url: new URL("prototype-hall.html", base).href }, sessionId);
  await send("Page.bringToFront", {}, sessionId);
  await poll(() => evaluate("document.querySelector('#hall')?.dataset.ready === 'true'"), Boolean, "Hall did not render");
  assert.deepEqual(await audio(), [], "Fresh native page must not create audio");
  await clickSound();
  const playing = await poll(audio, (entries) => entries.length === 1 && entries[0].state === "running" && entries[0].rms > 0.0001, "Opt-in must generate native audio output");
  assert.ok(playing[0].rms < 0.1, "Wind must remain low gain");
  report.actions.push({ name: "playing", visibility: await evaluate("document.visibilityState"), output: playing });
  const sibling = await send("Target.createTarget", { url: "about:blank", newWindow: false });
  await send("Target.activateTarget", { targetId: sibling.targetId });
  await poll(() => evaluate("document.visibilityState"), (state) => state === "hidden", "A real background tab must become hidden");
  const background = await poll(audio, (entries) => entries[0]?.state === "suspended", "Hidden page must suspend wind");
  assert.equal(await evaluate("document.querySelector('#sound').getAttribute('aria-pressed')"), "true", "Background suspension must preserve opt-in");
  report.actions.push({ name: "background", visibility: "hidden", output: background });
  await send("Target.closeTarget", { targetId: sibling.targetId });
  await send("Page.bringToFront", {}, sessionId);
  await poll(() => evaluate("document.visibilityState"), (state) => state === "visible", "Restored tab must become visible");
  const foreground = await poll(audio, (entries) => entries[0]?.state === "running" && entries[0].rms > 0.0001, "Restored opt-in must resume wind");
  report.actions.push({ name: "foreground", visibility: "visible", output: foreground });
  const screenshot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(resolve(output, "foreground.png"), Buffer.from(screenshot.data, "base64"));
  await clickSound();
  const muted = await poll(audio, (entries) => entries[0]?.state === "suspended", "Mute must suspend wind");
  report.actions.push({ name: "muted", output: muted });
  assert.deepEqual(report.errors, []);
  report.verdict = "VERIFIED";
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  try {
    if (socket?.readyState === WebSocket.OPEN && !cancelled) {
      await Promise.race([send("Browser.close").catch(() => {}), pause(2000)]);
    }
    for (const request of pending.values()) clearTimeout(request.timeout);
    socket?.close();
    if (browser.pid) {
      const groupExists = () => {
        try { process.kill(-browser.pid, 0); return true; } catch (error) {
          if (error.code === "ESRCH") return false;
          throw error;
        }
      };
      const waitForGroup = async (milliseconds) => {
        const deadline = Date.now() + milliseconds;
        while (groupExists() && Date.now() < deadline) await pause(50);
        return !groupExists();
      };
      const signalGroup = (signal) => {
        try { process.kill(-browser.pid, signal); } catch (error) { if (error.code !== "ESRCH") throw error; }
      };
      if (!await waitForGroup(4000)) {
        signalGroup("SIGTERM");
        if (!await waitForGroup(2000)) {
          signalGroup("SIGKILL");
          if (!await waitForGroup(2000)) throw new Error("The owned browser process group did not stop");
        }
      }
    }
    rmSync(profile, { recursive: true, force: true });
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
  if (report.errors.length) { report.verdict = "NOT VERIFIED"; process.exitCode = 1; }
  writeFileSync(resolve(output, "browser.log"), browserLog);
  writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verdict: report.verdict, output, actions: report.actions.length, errors: report.errors }, null, 2));
}
