#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Verify native browser child cleanup with real Chromium.\n\nnode verify-cleanup.mjs --base-url URL --out DIRECTORY\n\nRequires the native audio journey's Node, Chromium and Xvfb setup. Adds a test-owned delayed writer to the browser process group; audio and CDP remain real.");
  process.exit(0);
}
const option = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Supply ${name}`);
  return args[index + 1];
};
const base = option("--base-url");
const output = resolve(option("--out"));
const nativeOutput = resolve(output, "native-audio");
const directory = fileURLToPath(new URL(".", import.meta.url));
const executable = process.env.QUIET_SPACE_BROWSER || (existsSync("/usr/local/bin/chromium") ? "/usr/local/bin/chromium" : "chromium");
const report = { verdict: "NOT VERIFIED", errors: [] };
mkdirSync(output, { recursive: true });

try {
  const child = spawnSync(process.execPath, [resolve(directory, "verify-audio.mjs"), "--base-url", base, "--out", nativeOutput], {
    env: { ...process.env, QUIET_SPACE_REAL_BROWSER: executable, QUIET_SPACE_BROWSER: resolve(directory, "fixtures/slow-shutdown-chromium.sh") },
    stdio: "inherit",
    timeout: 180_000,
  });
  if (child.error) throw child.error;
  await new Promise((done) => setTimeout(done, 1500));
  assert.equal(child.status, 0, "The native browser journey must exit successfully");
  const native = JSON.parse(readFileSync(resolve(nativeOutput, "report.json"), "utf8"));
  assert.equal(native.verdict, "VERIFIED");
  assert.deepEqual(native.actions.map((action) => action.name), ["playing", "background", "foreground", "muted"]);
  assert.deepEqual(native.errors, []);
  assert.deepEqual(readdirSync(nativeOutput).filter((name) => name.startsWith("browser-")), [], "The profile must stay removed after the browser's delayed child stops");
  report.verdict = "VERIFIED";
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verdict: report.verdict, output, errors: report.errors }, null, 2));
}
