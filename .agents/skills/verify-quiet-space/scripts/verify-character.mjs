import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { installFrameProbe } from "./frame-probe.mjs";
import { sampleCharacterPixels } from "./character-pixels.mjs";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Supply ${name}`);
  return args[index + 1];
};
const base = new URL(option("--base-url"));
if (!/^https?:$/.test(base.protocol)) throw new Error("Use an HTTP browser instance");
const output = resolve(option("--out"));
mkdirSync(output, { recursive: true });
const report = { verdict: "NOT VERIFIED", base: base.href, actions: [], errors: [] };
const executablePath = process.env.QUIET_SPACE_BROWSER || (existsSync("/usr/local/bin/chromium") ? "/usr/local/bin/chromium" : undefined);
let browser;
let page;
let cancelled = false;
const cancel = () => { cancelled = true; void browser?.close(); };
process.once("SIGINT", cancel);
process.once("SIGTERM", cancel);
const sample = () => page.locator("canvas").evaluate(sampleCharacterPixels);
const capture = async (name) => {
  const pixels = await sample();
  expect(pixels.colors, `${name} must display the space`).toBeGreaterThan(12);
  await page.screenshot({ path: resolve(output, `${name}.png`), animations: "disabled" });
  report.actions.push({ name, ...pixels });
  return pixels.signature;
};
const ready = async () => {
  await expect(page.locator("canvas")).toHaveAttribute("data-ready", "true", { timeout: 180_000 });
  await expect(page.locator("#status")).toBeHidden();
};
const hold = async (key, duration) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(800);
};
const move = async (key, previous) => {
  await page.keyboard.down(key);
  await expect.poll(async () => (await sample()).signature, { timeout: 180_000, intervals: [500] }).not.toBe(previous);
  await page.keyboard.up(key);
  await page.waitForTimeout(800);
};
const reachObstacle = async (key, previous) => {
  await page.keyboard.down(key);
  let last = previous;
  let changed = false;
  let stationary = 0;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const current = (await sample()).signature;
    changed ||= current !== previous;
    stationary = current === last ? stationary + 1 : 0;
    last = current;
    if (stationary >= 4) break;
  }
  assert.ok(changed && stationary >= 4, "Held movement must reach a visible obstacle and then stop");
};
const observe = () => {
  page.setDefaultTimeout(180_000);
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("requestfailed", (request) => report.errors.push(request.url() + ": " + request.failure()?.errorText));
};
const launch = () => chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const inputSuspension = async (prefix) => {
  await page.keyboard.down("w");
  await page.getByRole("button", { name: "静坐", exact: true }).click();
  await capture(prefix + "-held-input-quiet");
  await page.keyboard.press("Escape");
  const resumed = await capture(prefix + "-input-resumed");
  await page.keyboard.down("w");
  for (let frame = 0; frame < 3; frame += 1) assert.equal((await sample()).signature, resumed, "A stale repeated key must not restart walking after quiet stay");
  await page.keyboard.up("w");
  await capture(prefix + "-stale-key-cleared");
};
const recover = async (prefix) => {
  const before = await capture(prefix + "-before-loss");
  await page.locator("canvas").evaluate((canvas) => {
    window.__characterContext = canvas.getContext("webgl2").getExtension("WEBGL_lose_context");
    if (!window.__characterContext) throw new Error("Chromium must expose the real context-loss extension");
    window.__characterContext.loseContext();
  });
  await expect(page.locator("#status")).toContainText("恢复");
  await expect(page.getByRole("link", { name: "重新加载", exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.__frameProbe.pending.size)).toBe(0);
  await page.screenshot({ path: resolve(output, prefix + "-context-lost.png") });
  await page.evaluate(() => window.__characterContext.restoreContext());
  await ready();
  assert.equal(await capture(prefix + "-restored"), before, "Recovery must retain the person and third-person framing");
};
const hallJourney = async () => {
  await ready();
  const observation = await capture("hall-observation");
  const walk = page.getByRole("button", { name: "漫步", exact: true });
  await walk.click();
  await expect(walk).toHaveAttribute("aria-pressed", "true");
  const spawn = await capture("hall-person");
  assert.notEqual(spawn, observation);
  if (!args.includes("--stairs-only")) {
    await page.mouse.move(780, 405);
    await page.mouse.down();
    await page.mouse.move(256, 405, { steps: 24 });
    await page.mouse.up();
    const front = await capture("traveler-front");
    assert.notEqual(front, spawn, "Orbit must show the modeled face and cloak");
    await page.mouse.wheel(0, -240);
    assert.notEqual(await capture("traveler-zoom"), front);
    await page.getByRole("button", { name: "复位", exact: true }).click();
    assert.equal(await capture("traveler-reset-orbit"), spawn);
    await move("ArrowUp", spawn);
    assert.notEqual(await capture("traveler-arrow"), spawn);
    await page.getByRole("button", { name: "复位", exact: true }).click();
    await page.getByRole("button", { name: "向前走", exact: true }).focus();
    await move(" ", spawn);
    assert.notEqual(await capture("traveler-button-keyboard"), spawn);
    await page.getByRole("button", { name: "复位", exact: true }).click();
  }
  await hold("w", 14_000);
  const stairs = await capture("hall-person-stairs");
  assert.notEqual(stairs, spawn, "Walking must traverse the hall's stair route");
  assert.equal(await capture("hall-person-stopped"), stairs);
  await reachObstacle("w", stairs);
  await page.keyboard.up("w");
  const landing = await capture("hall-person-rear-landing");
  const clearance = await sample();
  assert.ok(clearance.peak > 160 && clearance.colors > 35, "Camera clearance must retain the lit space instead of filling the lens with the person");
  assert.notEqual(landing, stairs, "The complete stair route must remain traversable");
  await move("s", landing);
  assert.notEqual(await capture("hall-person-descending"), landing);
  if (args.includes("--stairs-only")) {
    await page.getByRole("button", { name: "复位", exact: true }).click();
    assert.equal(await capture("hall-stairs-reset"), spawn);
    return;
  }
  await page.getByRole("button", { name: "暮色", exact: true }).click();
  await expect(walk).toHaveAttribute("aria-pressed", "true");
  const dusk = await capture("hall-person-dusk");
  await page.getByRole("button", { name: "静坐", exact: true }).click();
  assert.equal(await capture("hall-person-quiet"), dusk);
  const frozen = await sample();
  await page.keyboard.press("w");
  await page.mouse.wheel(0, -150);
  assert.equal((await sample()).signature, frozen.signature, "Quiet stay freezes both visitor and follow camera");
  await recover("hall-person-quiet");
  await page.keyboard.press("Escape");
  await inputSuspension("hall");
  await page.getByRole("button", { name: "日光", exact: true }).click();
  await page.getByRole("button", { name: "复位", exact: true }).click();
  assert.equal(await capture("hall-person-reset"), spawn);
  await page.keyboard.press("1");
  await expect(walk).toHaveAttribute("aria-pressed", "false");
  assert.equal(await capture("hall-observation-return"), observation);
  await expect(page.locator(".walk-pad")).toBeHidden();
};
const mobileJourney = async (prefix) => {
  await ready();
  const walk = page.getByRole("button", { name: "漫步", exact: true });
  await walk.click();
  const spawn = await capture(prefix + "-portrait");
  const forward = await page.getByRole("button", { name: "向前走", exact: true }).boundingBox();
  assert.ok(forward);
  const padTouch = { x: forward.x + forward.width / 2, y: forward.y + forward.height / 2, id: 1 };
  const session = await page.context().newCDPSession(page);
  const send = (type, touchPoints) => session.send("Input.dispatchTouchEvent", { type, touchPoints });
  await send("touchStart", [padTouch, { x: 280, y: 310, id: 2 }]);
  await expect.poll(async () => (await sample()).signature, { timeout: 180_000 }).not.toBe(spawn);
  await send("touchMove", [padTouch, { x: 335, y: 340, id: 2 }]);
  await capture(prefix + "-move-and-orbit");
  await send("touchCancel", []);
  const stopped = await capture(prefix + "-touch-cancelled");
  for (let frame = 0; frame < 3; frame += 1) assert.equal((await sample()).signature, stopped, "Cancelling either touch control must clear its held input");
  await send("touchStart", [{ x: 220, y: 330, id: 1 }, { x: 330, y: 330, id: 2 }]);
  for (let step = 1; step <= 8; step += 1) await send("touchMove", [{ x: 220 - step * 5, y: 330, id: 1 }, { x: 330 + step * 5, y: 330, id: 2 }]);
  await send("touchEnd", []);
  assert.notEqual(await capture(prefix + "-pinch"), stopped);
  await session.detach();
  await page.setViewportSize({ width: 844, height: 390 });
  await capture(prefix + "-landscape");
  const outside = await page.locator("#walk, #reset, #views button, .walk-pad button").evaluateAll((controls) => controls.some((control) => {
    const bounds = control.getBoundingClientRect();
    return bounds.left < 0 || bounds.right > innerWidth || bounds.top < 0 || bounds.bottom > innerHeight;
  }));
  assert.equal(outside, false, "Visible walking and view controls must fit the phone viewport");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await capture(prefix + "-normal-landscape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await walk.click();
  await page.setViewportSize({ width: 390, height: 844 });
};
try {
  browser = await launch();
  if (cancelled) throw new Error("Character journey cancelled");
  page = await browser.newPage({ viewport: { width: 1280, height: 813 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await page.context().addInitScript(installFrameProbe);
  observe();
  await page.goto(base.href, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "书山", exact: true })).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole("link", { name: "回到夜读室", exact: true })).toHaveCount(0);
  await ready();
  await expect(page.locator(".walk-pad")).toBeHidden({ timeout: 3000 });
  if (!args.includes("--entry-only")) {
    await hallJourney();
    if (!args.includes("--stairs-only")) {
      await browser.close();
      browser = await launch();
      page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
      await page.context().addInitScript(installFrameProbe);
      observe();
      await page.goto(base.href, { waitUntil: "networkidle" });
      await mobileJourney("hall-touch");
      report.phone = { emulated: true, physicalDevice: false };
    }
  }
  await page.goto(new URL("prototype-hall.html", base).href, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(base.href);
  await expect(page.getByRole("heading", { name: "书山", exact: true })).toBeVisible();
  await ready();
  await capture("legacy-book-mountain-redirect");
  assert.deepEqual(report.errors, []);
  report.verdict = "VERIFIED";
} catch (error) {
  report.failure = cancelled ? "Character journey cancelled" : error instanceof Error ? error.message : String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: resolve(output, "failure.png") }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser?.close();
  writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(report.verdict + ": " + output);
}
