#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { installAudioProbe, sampleAudioOutput } from "./audio-probe.mjs";
import { installFrameProbe } from "./frame-probe.mjs";
import { sampleCharacterPixels } from "./character-pixels.mjs";

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
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `(${installFrameProbe.toString()})()` }, sessionId);
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
  await send("Page.navigate", { url: base.href }, sessionId);
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
  await poll(() => evaluate("window.__frameProbe.pending.size"), (count) => count === 0, "Hidden hall must cancel its scheduled frame");
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
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  await send("Page.navigate", { url: base.href }, sessionId);
  await poll(() => evaluate("document.querySelector('#hall')?.dataset.ready === 'true'"), Boolean, "Book Mountain did not render");
  assert.deepEqual(await audio(), [], "Book Mountain must load silently");
  for (const key of ["2", "q"]) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key }, sessionId);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key }, sessionId);
  }
  await poll(() => evaluate("document.querySelector('#exit-quiet').hidden"), (hidden) => hidden === false, "Book Mountain must enter quiet stay");
  const beforeBackground = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  const rootSibling = await send("Target.createTarget", { url: "about:blank", newWindow: false });
  await send("Target.activateTarget", { targetId: rootSibling.targetId });
  await poll(() => evaluate("document.visibilityState"), (state) => state === "hidden", "Book Mountain must become hidden");
  await poll(() => evaluate("window.__frameProbe.pending.size"), (count) => count === 0, "Hidden Book Mountain must cancel its scheduled frame");
  const rootFrames = await evaluate("window.__frameProbe.frames");
  report.hallLifecycle = [{ name: "hidden", visibility: "hidden", pendingFrames: 0, frames: rootFrames }];
  await send("Target.closeTarget", { targetId: rootSibling.targetId });
  await send("Page.bringToFront", {}, sessionId);
  await poll(() => evaluate("document.visibilityState"), (state) => state === "visible", "Book Mountain must return to the foreground");
  await poll(() => evaluate("window.__frameProbe.frames"), (count) => count > rootFrames, "Book Mountain must resume rendering");
  assert.equal(await evaluate("document.querySelector('#hall').dataset.view"), "2");
  assert.equal(await evaluate("document.querySelector('#space-ui').hidden"), true);
  const restoredRoot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  assert.equal(restoredRoot.data, beforeBackground.data, "Foreground return must retain quiet framing and reduced-motion pixels");
  writeFileSync(resolve(output, "hall-foreground.png"), Buffer.from(restoredRoot.data, "base64"));
  report.hallLifecycle.push({ name: "foreground", visibility: "visible", view: "2", quiet: true });
  if (args.includes("--character")) {
    const pixels = () => evaluate(`(${sampleCharacterPixels.toString()})(document.querySelector('#hall'))`);
    for (const key of ["Escape", "m"]) {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key }, sessionId);
      await send("Input.dispatchKeyEvent", { type: "keyUp", key }, sessionId);
    }
    await poll(() => evaluate("document.querySelector('#walk').getAttribute('aria-pressed')"), (pressed) => pressed === "true", "Book Mountain must enter walking");
    const initialPerson = await pixels();
    assert.ok(initialPerson.colors > 12, "Walking must render a colored space");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "w" }, sessionId);
    await poll(pixels, (current) => current.signature !== initialPerson.signature, "A native held key must move the rendered person");
    const walkingSibling = await send("Target.createTarget", { url: "about:blank", newWindow: false });
    await send("Target.activateTarget", { targetId: walkingSibling.targetId });
    await poll(() => evaluate("document.visibilityState"), (state) => state === "hidden", "Walking tab must become hidden");
    await poll(() => evaluate("window.__frameProbe.pending.size"), (count) => count === 0, "Hidden walking tab must cancel rendering");
    const walkingFrames = await evaluate("window.__frameProbe.frames");
    report.hallWalking = [{ name: "hidden", visibility: "hidden", pendingFrames: 0, frames: walkingFrames }];
    await send("Target.closeTarget", { targetId: walkingSibling.targetId });
    await send("Page.bringToFront", {}, sessionId);
    await poll(() => evaluate("document.visibilityState"), (state) => state === "visible", "Walking tab must become visible");
    await poll(() => evaluate("window.__frameProbe.frames"), (count) => count >= walkingFrames + 2, "Walking tab must draw two fresh foreground frames before the pixel baseline");
    report.walkingBaseline = { hiddenFrames: walkingFrames, foregroundFrames: await evaluate("window.__frameProbe.frames"), reducedMotion: await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches") };
    const returnedPerson = await pixels();
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "w", autoRepeat: true }, sessionId);
    for (let frame = 0; frame < 4; frame += 1) assert.equal((await pixels()).signature, returnedPerson.signature, "Foreground return must not resume old or repeated movement");
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "w" }, sessionId);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "a" }, sessionId);
    await poll(pixels, (current) => current.signature !== returnedPerson.signature, "A fresh key must remain usable after foreground return");
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a" }, sessionId);
    const walkingScreenshot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(resolve(output, "hall-walking-foreground.png"), Buffer.from(walkingScreenshot.data, "base64"));
    report.hallWalking.push({ name: "foreground", visibility: "visible", staleInputStopped: true, freshInputMoved: true });
  }
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
