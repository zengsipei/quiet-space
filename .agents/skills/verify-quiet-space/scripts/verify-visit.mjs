#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { installFrameProbe } from "./frame-probe.mjs";
import { sampleCharacterPixels } from "./character-pixels.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Verify the complete quiet visit in real Chromium.\n\nnode verify-visit.mjs --base-url URL --out DIRECTORY [--baseline | --reduced-only | --lifecycle-only] [--soak-minutes 15]\n\nDrives a caller-owned server; captures controls and WebGL pixels and closes only its own browser. --baseline captures the accepted root. A soak is phone-shaped software-browser evidence, not physical-device performance.");
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
const soakMinutes = args.includes("--soak-minutes") ? Number(option("--soak-minutes")) : 0;
if (!Number.isInteger(soakMinutes) || soakMinutes < 0 || soakMinutes > 60) throw new Error("Use a whole-number soak duration from 0 to 60 minutes");
mkdirSync(output, { recursive: true });
const report = { verdict: "NOT VERIFIED", base: base.href, actions: [], errors: [] };
const executablePath = process.env.QUIET_SPACE_BROWSER || (existsSync("/usr/local/bin/chromium") ? "/usr/local/bin/chromium" : undefined);
let browser;
let page;
const capture = async (name) => {
  const pixels = await page.locator("canvas").evaluate(sampleCharacterPixels);
  expect(pixels.colors, `${name} must contain the Book Mountain`).toBeGreaterThan(12);
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true, animations: "disabled" });
  report.actions.push({ name, ...pixels });
  return pixels.signature;
};
const observe = (current) => {
  current.on("pageerror", (error) => report.errors.push(error.message));
  current.on("requestfailed", (request) => report.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
};
const ready = async () => {
  await expect(page.locator("canvas")).toHaveAttribute("data-ready", "true", { timeout: 180_000 });
  await expect(page.locator("#status")).toBeHidden();
};
const recoverContext = async (prefix) => {
  const before = await capture(`${prefix}-before-loss`);
  await page.locator("canvas").evaluate((canvas) => {
    window.__lostContext = canvas.getContext("webgl2").getExtension("WEBGL_lose_context");
    if (!window.__lostContext) throw new Error("Chromium must expose the context-loss testing extension");
    window.__lostContext.loseContext();
  });
  await expect(page.locator("#status")).toContainText("恢复");
  await expect(page.getByRole("link", { name: "重新加载", exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.__frameProbe.pending.size)).toBe(0);
  await page.screenshot({ path: resolve(output, `${prefix}-context-lost.png`), fullPage: true });
  await page.evaluate(() => window.__lostContext.restoreContext());
  await ready();
  assert.equal(await capture(`${prefix}-context-restored`), before, "Context restoration must preserve reduced-motion framing");
};
const touchGesture = async (kind) => {
  const session = await page.context().newCDPSession(page);
  const send = (type, touchPoints) => session.send("Input.dispatchTouchEvent", { type, touchPoints });
  const center = { x: 195, y: 430 };
  await send("touchStart", kind === "drag" ? [{ ...center, id: 1 }] : [{ x: 135, y: 430, id: 1 }, { x: 255, y: 430, id: 2 }]);
  for (let step = 1; step <= 8; step += 1) {
    await send("touchMove", kind === "drag" ? [{ x: center.x + step * 10, y: center.y + step * 3, id: 1 }] : [{ x: 135 - step * 5, y: 430, id: 1 }, { x: 255 + step * 5, y: 430, id: 2 }]);
  }
  await send(kind === "cancel" ? "touchCancel" : "touchEnd", []);
  await session.detach();
  await page.waitForTimeout(1000);
};

try {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 813 }, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: args.includes("--reduced-only") || args.includes("--lifecycle-only") ? "reduce" : "no-preference" });
  desktop.setDefaultTimeout(180_000);
  await desktop.addInitScript(installFrameProbe);
  page = await desktop.newPage();
  observe(page);
  await page.goto(base.href, { waitUntil: "networkidle" });
  await ready();
  if (args.includes("--lifecycle-only")) {
    await ready();
    await recoverContext("root");
  } else if (args.includes("--reduced-only")) {
    await page.waitForTimeout(1500);
    const still = await capture("root-reduced-before");
    await page.waitForTimeout(1500);
    assert.equal(await capture("root-reduced-after"), still, "Reduced motion must freeze decorative pixels while idle");
  } else if (args.includes("--baseline")) {
    await capture("accepted-root");
  } else {
    await ready();
    await capture("accepted-root");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(1500);
    const still = await capture("root-reduced-before");
    await page.waitForTimeout(1500);
    assert.equal(await capture("root-reduced-after"), still, "Reduced motion must freeze decorative pixels while idle");
    await expect(page.getByRole("button", { name: "全景", exact: true })).toBeVisible();
    const signatures = [];
    for (const label of ["全景", "阶地", "书山", "书墙", "湖窗"]) {
      const button = page.getByRole("button", { name: label, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await page.waitForTimeout(1500);
      signatures.push(await capture(`root-${label}`));
    }
    assert.equal(new Set(signatures).size, 5);
    for (let index = 0; index < signatures.length; index += 1) {
      await page.keyboard.press(String(index + 1));
      assert.equal(await capture(`root-key-${index + 1}`), signatures[index], "Keyboard and button presets must agree");
    }
    await page.keyboard.press("1");
    await page.mouse.move(720, 400);
    await page.mouse.down();
    await page.mouse.move(1010, 455, { steps: 12 });
    await page.mouse.up();
    const dragged = await capture("root-drag");
    assert.notEqual(dragged, signatures[0]);
    await page.mouse.wheel(0, -350);
    assert.notEqual(await capture("root-zoom"), dragged);
    await page.getByRole("button", { name: "复位", exact: true }).click();
    assert.equal(await capture("root-reset"), signatures[0]);
    await page.getByRole("button", { name: "静坐", exact: true }).click();
    await expect(page.locator("#space-ui")).toBeHidden();
    assert.equal(await page.locator("#space-ui").evaluate((shell) => shell.inert), true);
    await expect(page.getByRole("button", { name: "离开静坐", exact: true })).toBeFocused();
    assert.equal(await capture("root-quiet"), signatures[0], "Quiet stay must preserve camera framing");
    await recoverContext("root-quiet");
    await expect(page.getByRole("button", { name: "离开静坐", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "静坐", exact: true })).toBeFocused();
    await page.keyboard.press("q");
    await page.getByRole("button", { name: "离开静坐", exact: true }).click();
    await expect(page.getByRole("button", { name: "静坐", exact: true })).toBeFocused();
    await expect(page.getByRole("link", { name: "回到夜读室", exact: true })).toHaveCount(0);
    await desktop.close();
    const fallback = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    fallback.setDefaultTimeout(180_000);
    await fallback.addInitScript(() => {
      if (window.name === "verify-webgl-restored") return;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        return type === "webgl2" || type === "webgl" || type === "experimental-webgl" ? null : original.call(this, type, ...options);
      };
    });
    for (const path of ["", "prototype-hall.html"]) {
      page = await fallback.newPage();
      observe(page);
      await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
      await expect(page.locator("#status")).toContainText("WebGL");
      await page.screenshot({ path: resolve(output, `fallback-${path ? "hall" : "root"}.png`), fullPage: true });
      await page.evaluate(() => { window.name = "verify-webgl-restored"; });
      await page.getByRole("link", { name: "重新加载", exact: true }).click();
      await ready();
      await page.close();
    }
    await fallback.close();
    await browser.close();
    browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: "light", isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    mobile.setDefaultTimeout(180_000);
    await mobile.addInitScript(installFrameProbe);
    page = await mobile.newPage();
    observe(page);
    await page.goto(base.href, { waitUntil: "networkidle" });
    await ready();
    report.mobileReadyMs = await page.evaluate(() => window.__frameProbe.renderedReadyMs);
    assert.ok(report.mobileReadyMs > 0, "Ready must follow an observed browser frame");
    for (const label of ["全景", "阶地", "书山", "书墙", "湖窗", "复位", "静坐"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeInViewport();
    }
    await page.getByRole("button", { name: "全景", exact: true }).tap();
    const portrait = await capture("mobile-portrait");
    await touchGesture("drag");
    const touched = await capture("mobile-drag");
    assert.notEqual(touched, portrait);
    await touchGesture("pinch");
    assert.notEqual(await capture("mobile-pinch"), touched);
    await touchGesture("cancel");
    assert.equal(await page.locator("canvas").evaluate((canvas) => canvas.style.cursor), "grab");
    await page.getByRole("button", { name: "复位", exact: true }).tap();
    assert.equal(await capture("mobile-reset"), portrait);
    await page.getByRole("button", { name: "静坐", exact: true }).tap();
    assert.equal(await capture("mobile-quiet"), portrait);
    await page.getByRole("button", { name: "离开静坐", exact: true }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await capture("mobile-landscape");
    for (const label of ["全景", "阶地", "书山", "书墙", "湖窗", "复位", "静坐"]) await expect(page.getByRole("button", { name: label, exact: true })).toBeInViewport();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (soakMinutes) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "静坐", exact: true }).tap();
      report.soak = { physicalDevice: false, requestedMinutes: soakMinutes, samples: [] };
      const started = Date.now();
      await capture("soak-start");
      for (let minute = 1; minute <= soakMinutes; minute += 1) {
        await page.waitForTimeout(60_000);
        await ready();
        await expect(page.getByRole("button", { name: "离开静坐", exact: true })).toBeVisible();
        const observed = await page.evaluate(() => ({ frames: window.__frameProbe.frames, pending: window.__frameProbe.pending.size }));
        const previous = report.soak.samples.at(-1);
        if (previous) assert.ok(observed.frames > previous.frames, "The stay must continue rendering");
        report.soak.samples.push({ minute, elapsedMs: Date.now() - started, ...observed });
        assert.deepEqual(report.errors, []);
      }
      await capture("soak-end");
      await page.getByRole("button", { name: "离开静坐", exact: true }).tap();
      await expect(page.getByRole("button", { name: "静坐", exact: true })).toBeFocused();
    }
  }
  assert.deepEqual(report.errors, []);
  report.verdict = "VERIFIED";
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
  if (page && !page.isClosed()) await page.screenshot({ path: resolve(output, "failure.png"), fullPage: true }).catch(() => {});
} finally {
  await browser?.close();
  writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verdict: report.verdict, output, actions: report.actions.length, errors: report.errors }, null, 2));
}
