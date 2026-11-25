#!/usr/bin/env node
import { sampleCharacterPixels } from "./character-pixels.mjs";
import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createConnection } from "node:net";
import { installAudioProbe, sampleAudioOutput } from "./audio-probe.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Verify quiet-space through its real browser surface.\n\nOptions:\n  --baseline         Drive the pre-change keyboard/mouse journey\n  --stay-only        Drive only atmosphere, quiet stay and sound\n  --out DIRECTORY    Save PNG and JSON evidence (default .scratch/book-mountain/after)\n  --port NUMBER      Port for a helper-owned Vite instance (default 5183)\n  --base-url URL     Drive an existing instance without terminating it\n  --help             Show this help\n\nQUIET_SPACE_BROWSER can select a Chromium executable.");
  process.exit(0);
}
const option = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Supply a value for ${name}`);
  return args[index + 1];
};
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const output = resolve(root, option("--out", ".scratch/book-mountain/after"));
const port = Number(option("--port", "5183"));
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Choose --port between 1024 and 65535");
const existing = option("--base-url", "");
const base = existing || `http://127.0.0.1:${port}`;
const baseline = args.includes("--baseline");
const stayOnly = args.includes("--stay-only");
if (baseline && stayOnly) throw new Error("Choose either --baseline or --stay-only");
const labels = ["全景", "阶地", "书山", "书墙", "湖窗"];
const report = { verdict: "NOT VERIFIED", base, baseline, stayOnly, actions: [], audio: [], errors: [] };
mkdirSync(output, { recursive: true });
let server;
let browser;
let page;
let serverLog = "";
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
const occupied = () => new Promise((done) => {
  const socket = createConnection({ host: "127.0.0.1", port });
  socket.once("connect", () => { socket.destroy(); done(true); });
  socket.once("error", () => done(false));
});
const observe = (current) => {
  current.on("pageerror", (error) => report.errors.push(error.message));
  current.on("console", (message) => {
    if (message.type() === "error" && !message.location().url.endsWith("favicon.ico")) report.errors.push(`${message.location().url}: ${message.text()}`);
  });
  current.on("requestfailed", (request) => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
};
const pixels = async (current) => current.locator("#hall").evaluate(sampleCharacterPixels);
const capture = async (current, name, settle = false) => {
  await pause(850);
  let observed;
  if (settle) {
    let previous = "";
    let settled = 0;
    await expect.poll(async () => {
      observed = await pixels(current);
      settled = observed.signature === previous ? settled + 1 : 0;
      previous = observed.signature;
      return settled;
    }, { timeout: 180_000, intervals: [100, 250, 500] }).toBeGreaterThanOrEqual(3);
  } else observed = await pixels(current);
  await current.screenshot({ path: resolve(output, `${name}.png`), fullPage: true, animations: "disabled" });
  expect(observed.colors, `${name} must contain rendered architecture`).toBeGreaterThan(12);
  report.actions.push({ name, width: observed.width, height: observed.height, colors: observed.colors, signature: observed.signature });
  return observed.signature;
};
const touchGesture = async (current, kind) => {
  const session = await current.context().newCDPSession(current);
  const point = (x, y, id) => ({ x, y, id, radiusX: 2, radiusY: 2, force: 1 });
  const start = kind === "drag" ? [point(170, 340, 1)] : [point(125, 340, 1), point(255, 340, 2)];
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: start });
  for (let step = 1; step <= 8; step += 1) {
    const moved = kind === "drag" ? [point(170 + step * 12, 340 + step * 3, 1)] : [point(125 - step * 6, 340, 1), point(255 + step * 6, 340, 2)];
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: moved });
    await pause(20);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
};
const audioOutput = (current) => current.evaluate(sampleAudioOutput);
const driveStay = async (current, prefix, touch = false) => {
  const activate = (button) => touch ? button.tap() : button.click();
  const dayButton = current.getByRole("button", { name: "日光", exact: true });
  const duskButton = current.getByRole("button", { name: "暮色", exact: true });
  const quietButton = current.getByRole("button", { name: "静坐", exact: true });
  const exitButton = current.getByRole("button", { name: "离开静坐", exact: true });
  const soundButton = current.getByRole("button", { name: "湖边风声", exact: true });
  await expect(dayButton).toHaveAttribute("aria-pressed", "true");
  await expect(soundButton).toHaveAttribute("aria-pressed", "false");
  expect(await audioOutput(current), "Initial load must not create or autoplay audio").toEqual([]);
  const day = await capture(current, `${prefix}-day`);
  await activate(duskButton);
  await expect(duskButton).toHaveAttribute("aria-pressed", "true");
  const dusk = await capture(current, `${prefix}-dusk`);
  expect(dusk, "Dusk must change rendered lighting, not just button state").not.toBe(day);
  await activate(dayButton);
  expect(await capture(current, `${prefix}-day-restored`), "Daylight must restore the same view and lighting").toBe(day);
  await activate(duskButton);
  await activate(quietButton);
  await expect(current.locator("#space-ui")).toHaveJSProperty("hidden", true);
  await expect(current.locator("#space-ui")).toHaveJSProperty("inert", true);
  await expect(quietButton).toBeHidden();
  await expect(exitButton).toBeVisible();
  await expect(exitButton).toBeFocused();
  expect(await capture(current, `${prefix}-quiet`), "Quiet stay must preserve the dusk framing").toBe(dusk);
  if (touch) await touchGesture(current, "drag");
  else {
    await current.mouse.move(720, 400);
    await current.mouse.down();
    await current.mouse.move(830, 430, { steps: 8 });
    await current.mouse.up();
  }
  const quietLook = await capture(current, `${prefix}-quiet-look`, true);
  expect(quietLook, "Look controls must remain available in quiet stay").not.toBe(dusk);
  await current.keyboard.press("Tab");
  expect(await current.evaluate(() => document.activeElement.closest("#space-ui") === null), "Hidden tools must leave keyboard focus order").toBe(true);
  await activate(exitButton);
  await expect(quietButton).toBeFocused();
  await expect(current.locator("#space-ui")).toHaveJSProperty("hidden", false);
  await expect(quietButton).toBeVisible();
  expect(await pixels(current).then((result) => result.signature), "Exiting quiet stay must preserve the adjusted framing").toBe(quietLook);
  await current.keyboard.press("q");
  await expect(exitButton).toBeVisible();
  await current.keyboard.press("Escape");
  await expect(exitButton).toBeHidden();
  await activate(soundButton);
  await expect(soundButton).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await audioOutput(current)).some((entry) => entry.state === "running" && entry.rms > 0.0001), { timeout: 10_000 }).toBe(true);
  const playing = await audioOutput(current);
  expect(playing.length, "One sound toggle must create only one output graph").toBe(1);
  expect(playing[0].rms, "Wind output must stay at low gain").toBeLessThan(0.1);
  await activate(soundButton);
  await expect(soundButton).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => (await audioOutput(current))[0]?.state).toBe("suspended");
  if (!touch) {
    await soundButton.dblclick({ delay: 20 });
    await expect(soundButton).toHaveAttribute("aria-pressed", "false");
    await expect.poll(async () => (await audioOutput(current))[0]?.state).toBe("suspended");
    expect((await audioOutput(current)).length, "Rapid toggles must reuse the existing graph").toBe(1);
  }
  report.audio.push({ name: prefix, playing, muted: await audioOutput(current) });
  await current.reload({ waitUntil: "networkidle" });
  await expect(dayButton).toHaveAttribute("aria-pressed", "true");
  await expect(soundButton).toHaveAttribute("aria-pressed", "false");
  await expect(quietButton).toBeVisible();
  expect(await audioOutput(current), "Reload must not persist sound opt-in").toEqual([]);
  await current.emulateMedia({ reducedMotion: "reduce" });
  expect(await dayButton.evaluate((button) => getComputedStyle(button).transitionDuration), "Reduced-motion preference must stop decorative UI transitions").toBe("0s");
  await current.emulateMedia({ reducedMotion: "no-preference" });
};

try {
  if (!existing) {
    if (await occupied()) throw new Error(`Port ${port} is occupied. Choose --port or use --base-url for the intended instance.`);
    server = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    server.stdout.on("data", (data) => { serverLog += data; });
    server.stderr.on("data", (data) => { serverLog += data; });
    server.on("error", (error) => report.errors.push(error.message));
  }
  const deadline = Date.now() + 25_000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    if (server && server.exitCode !== null) throw new Error(`Vite exited before readiness: ${serverLog}`);
    try { ready = (await fetch(`${base}/`, { signal: AbortSignal.timeout(1000) })).status === 200; } catch {}
    if (!ready) await pause(250);
  }
  if (!ready) throw new Error(`The prototype did not become ready at ${base}`);
  const localBrowser = "/usr/local/bin/chromium";
  const executablePath = process.env.QUIET_SPACE_BROWSER || (existsSync(localBrowser) ? localBrowser : undefined);
  const launchOptions = { executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };
  browser = await chromium.launch(launchOptions);
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light" });
  desktop.setDefaultTimeout(180_000);
  await desktop.addInitScript(installAudioProbe);
  page = await desktop.newPage();
  observe(page);
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "书山", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "回到夜读室", exact: true })).toHaveCount(0);
  await expect(page.locator("#hall")).toBeVisible();
  const signatures = [];
  for (let index = 0; index < (stayOnly ? 0 : baseline ? 2 : labels.length); index += 1) {
    if (baseline) await page.keyboard.press(String(index + 1));
    else {
      const button = page.getByRole("button", { name: labels[index], exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
    signatures.push(await capture(page, `desktop-${index + 1}`));
  }
  if (!stayOnly) expect(new Set(signatures).size, "Presets must render distinct views").toBe(baseline ? 2 : 5);
  if (!baseline && !stayOnly) {
    for (let index = 0; index < labels.length; index += 1) {
      await page.keyboard.press(String(index + 1));
      await pause(850);
      expect(await pixels(page).then((result) => result.signature), `Key ${index + 1} must select ${labels[index]}`).toBe(signatures[index]);
    }
  }
  if (!stayOnly) {
    await page.keyboard.press("1");
    await pause(850);
    await page.mouse.move(720, 400);
    await page.mouse.down();
    await page.mouse.move(870, 450, { steps: 12 });
    await page.mouse.up();
    const dragged = await capture(page, "desktop-drag");
    expect(dragged, "Dragging must change the rendered view").not.toBe(signatures[0]);
    if (!baseline) {
      await page.mouse.wheel(0, -350);
      expect(await capture(page, "desktop-zoom"), "Wheel zoom must change the rendered framing").not.toBe(dragged);
      await page.keyboard.press("r");
      expect(await capture(page, "desktop-reset"), "Reset must restore the current preset").toBe(signatures[0]);
    }
  }
  if (!baseline) {
    await driveStay(page, "desktop-stay");
    await desktop.addInitScript(() => Object.defineProperty(window, "AudioContext", { value: undefined, configurable: true }));
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "湖边风声", exact: true }).click();
    await expect(page.getByRole("button", { name: "湖边风声", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("status")).toHaveText("暂时无法播放风声，仍可安静浏览。");
    await page.getByRole("button", { name: "静坐", exact: true }).click();
    await capture(page, "desktop-audio-unavailable-quiet");
    await page.getByRole("button", { name: "离开静坐", exact: true }).click();
    await desktop.close();
    await browser.close();
    browser = await chromium.launch(launchOptions);
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: "light" });
    mobile.setDefaultTimeout(180_000);
    await mobile.addInitScript(installAudioProbe);
    const phone = await mobile.newPage();
    page = phone;
    observe(phone);
    await phone.goto(`${base}/`, { waitUntil: "networkidle" });
    if (!stayOnly) {
      for (let index = 0; index < labels.length; index += 1) {
        const button = phone.getByRole("button", { name: labels[index], exact: true });
        await expect(button).toBeInViewport();
        await button.tap();
        await expect(button).toHaveAttribute("aria-pressed", "true");
      }
      await phone.getByRole("button", { name: "全景", exact: true }).tap();
      const portrait = await capture(phone, "mobile-portrait");
      await touchGesture(phone, "drag");
      const touched = await capture(phone, "mobile-drag");
      expect(touched, "Touch drag must change the rendered direction").not.toBe(portrait);
      await touchGesture(phone, "pinch");
      expect(await capture(phone, "mobile-pinch"), "Pinch must change the rendered framing").not.toBe(touched);
      await phone.getByRole("button", { name: "复位", exact: true }).tap();
      expect(await capture(phone, "mobile-reset"), "Touch reset must restore the current preset").toBe(portrait);
    }
    await driveStay(phone, "mobile-stay", true);
    await phone.setViewportSize({ width: 844, height: 390 });
    await capture(phone, "mobile-landscape");
    for (const name of ["日光", "暮色", "静坐", "湖边风声", "复位"]) {
      await expect(phone.getByRole("button", { name, exact: true })).toBeInViewport();
    }
    await phone.getByRole("button", { name: "暮色", exact: true }).tap();
    await phone.getByRole("button", { name: "静坐", exact: true }).tap();
    await capture(phone, "mobile-landscape-quiet");
    await phone.getByRole("button", { name: "离开静坐", exact: true }).tap();
    expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "The mobile document must fit horizontally").toBe(true);
    await mobile.close();
    await browser.close();
    browser = undefined;
    const nativeOutput = resolve(output, "native-audio");
    await new Promise((done, fail) => {
      const child = spawn(process.execPath, [fileURLToPath(new URL("./verify-audio.mjs", import.meta.url)), "--base-url", base, "--out", nativeOutput, "--character"], { cwd: root, stdio: "inherit" });
      child.once("error", fail);
      child.once("exit", (code) => code === 0 ? done() : fail(new Error(`Native audio journey exited ${code}`)));
    });
    report.lifecycle = JSON.parse(readFileSync(resolve(nativeOutput, "report.json"), "utf8"));
  }
  expect(report.errors, "Browser errors must be resolved").toEqual([]);
  report.verdict = "VERIFIED";
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  if (page && !page.isClosed()) await page.screenshot({ path: resolve(output, "failure.png"), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server?.pid) {
    try { process.kill(-server.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  }
  if (server) writeFileSync(resolve(output, "server.log"), serverLog);
  writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verdict: report.verdict, output, actions: report.actions.length, errors: report.errors }, null, 2));
}
