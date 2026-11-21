---
name: verify-quiet-space
description: Verify quiet-space in a real Chromium browser after changes to its scene, camera controls, atmosphere, quiet stay, audio, page entry, or responsive layout.
---

# Verify quiet-space

## Launch

Run from the repository root:

```sh
pnpm install
pnpm exec playwright install chromium
node .agents/skills/verify-quiet-space/scripts/verify.mjs --baseline --out .scratch/book-mountain/before
```

The helper starts an isolated Vite instance on port 5183 with strict port ownership. An HTTP 200
response from `prototype-hall.html` is its readiness signal. `--base-url` drives an instance already
started by the caller, including a production preview. The helper leaves that instance running.

## Doctor

The helper checks HTTP readiness, a visible canvas, a WebGL drawing buffer with multiple colors, and
browser errors. A failed doctor saves a screenshot and a JSON report, then exits nonzero. If a
port is occupied, use another `--port` or pass its intended instance through `--base-url`.

## Drive

Use the [feature map](features/README.md). The baseline journey opens the prototype, switches the
first two views with the number keys, and drags the canvas. Run it before editing an
existing scene. After implementation, run the complete journey without `--baseline`:

```sh
node .agents/skills/verify-quiet-space/scripts/verify.mjs --out .scratch/book-mountain/after
```

The complete journey also follows the reading-room entry, clicks the five view buttons, resets the
view, and drives touch gestures at portrait and landscape mobile sizes. All actions use the actual
page and its controls. The pixel signature comes from the displayed WebGL buffer, without scene
internals or camera setters.

It also switches daylight/dusk, enters and exits quiet stay, restores focus and framing, and
verifies silent load, opt-in wind output, mute and silent reload. `--stay-only` runs this focused
slice. A test-owned observer samples the native Web Audio destination rather than exposing
production controls. See [quiet stay](features/stay.md) for its boundary and limitations.

## Evidence

Each output directory contains full-page PNG captures, `server.log` for a helper-owned instance,
and `report.json` with actions, observed canvas colors, viewport sizes, errors, and the verdict.
Desktop captures use 1440 × 900, light appearance, and a device scale factor of one. Mobile captures
use 390 × 844 and 844 × 390. Visually compare the before/after captures against the reference
photographs; a browser pass proves operation, while visual review proves the model's spatial intent.
Audio evidence records native context state and RMS signal amplitude, not a listening review.

## Cleanup

The helper closes every browser context and terminates only the process group it created, including
after failure. Evidence survives cleanup. It does not terminate an instance passed by `--base-url`.
The native audio helper waits for the whole owned process group before removing its temporary
profile; the Xvfb wrapper exiting alone does not prove Chromium's descendants have stopped writing.
Shutdown failures remain in `report.json` and make the verdict `NOT VERIFIED`.

After changing native browser shutdown, run the delayed-child regression against the same preview:

```sh
node .agents/skills/verify-quiet-space/scripts/verify-cleanup.mjs --base-url http://127.0.0.1:4189 --out .scratch/book-mountain/cleanup
```

It drives real Chromium and the native audio journey, adds an owned child that writes on shutdown,
and checks that a successful audio report survives and the profile stays removed.

## Helpers

The driving surface is Playwright's Chromium browser. The executable helper is
`scripts/verify.mjs`, invoked through Node as shown above. `--help` lists its options. It uses the
installed Playwright browser by default; `QUIET_SPACE_BROWSER` selects a local Chromium executable.
On this development host, the Chromium wrapper at `/usr/local/bin/chromium` is also detected.
The helper supplies SwiftShader flags for software WebGL in a container.
The full and stay-only journeys finish with `scripts/verify-audio.mjs`, a native Chromium tab
journey that uses Node 22+ and `xvfb-run` on this Linux host. Install Xvfb through the host package
manager when missing. Playwright-managed background pages remain visible here, so this helper
uses native tabs to prove hidden-page suspension and foreground resumption. It owns only its
temporary browser/profile and leaves the supplied server running. Its `--help` gives the
standalone invocation; JSON and a foreground PNG stay under the run's `native-audio` directory.
