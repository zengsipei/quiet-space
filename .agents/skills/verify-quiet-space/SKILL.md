---
name: verify-quiet-space
description: Verify Book Mountain entry, rendering, observation, atmosphere, quiet stay, audio, third-person walking and phone layout in real Chromium.
---

# Verify quiet-space

## Launch and doctor

Run from the repository root after `pnpm install`. Install Chromium with
`pnpm exec playwright install chromium` if no local browser exists. On this host the helper
also detects `/usr/local/bin/chromium`; `QUIET_SPACE_BROWSER` overrides the executable.
SwiftShader flags provide software WebGL in a container.

`pnpm verify:hall --baseline --out .scratch/book-mountain/before` owns an isolated Vite
process group on strict port 5183. HTTP 200 at the root is readiness; an occupied port fails.
Use `--port` for a different owned instance, or `--base-url` to drive and leave a caller's
instance running. Doctor requires a visible, colored WebGL canvas and no browser errors;
failure retains a screenshot/report and exits nonzero, never a passing proxy.

## Drive

Read the [feature map](features/README.md). Only Book Mountain is shipped. The old hall URL
redirects to the root; there is no night-room entry or two-space link journey.

The baseline drives the first two views and drag. The full hall journey drives five buttons /
number keys, drag/zoom/reset, portrait/landscape touch, daylight/dusk, quiet focus/framing,
silent load, opt-in wind, mute and reload. `--stay-only` focuses atmosphere and quiet/audio.
The full and stay-only journeys end with native Chromium audio and tab lifecycle checks.

After `pnpm build`, start a caller-owned production preview and run:

```sh
pnpm verify:hall --base-url http://127.0.0.1:4178 --out .scratch/book-mountain/production
pnpm verify:visit --base-url http://127.0.0.1:4178 --out .scratch/quiet-visit/production
pnpm verify:character --base-url http://127.0.0.1:4178 --out .scratch/third-person/production
```

[Visit](features/visit.md) adds unavailable-WebGL/retry, real context recovery, quiet focus and
phone framing. `--lifecycle-only` / `--reduced-only` focus recovery / idle stability.
`--soak-minutes 15` adds a bounded emulated-phone stay with elapsed time and observed frames.
[Character](features/character.md) drives keys, accessible held buttons, stairs/obstacles,
orbit/zoom, reset, quiet/stale input, context recovery, multi-touch/cancel and the legacy redirect.
`--entry-only` checks root/redirect only, not character appearance or behavior.
`--stairs-only` focuses the real stair route, blocking, descent/reset and camera clearance.

Native audio uses Node 22+, Chromium and `xvfb-run` on Linux. The host package manager supplies
Xvfb if absent. The observer samples the actual native Web Audio destination. Real second tabs
prove hidden-page frame/audio suspension, foreground quiet framing and stale walking-input
clearing; Playwright-managed pages remain visible on this host. Standalone:

`node .agents/skills/verify-quiet-space/scripts/verify-audio.mjs --base-url URL --out DIRECTORY --character`

## Evidence and limitations

Output folders retain PNGs, actions, viewport/pixel observations, errors and verdict in
`report.json`; owned instances add `server.log`. Desktop uses 1440 × 900 (hall) or 1280 × 813
(visit/character); phones use 390 × 844 and 844 × 390. Visually compare the five hall views with
the architectural reference and traveler front/back with the accepted original cape design.
Pixel signatures exclude overlays and cannot prove model fidelity by themselves.

The test-owned frame observer wraps browser scheduling before load, never production camera
or pose setters. Pixel sampling reads the displayed buffer once per frame, then selects the
same grid in memory, avoiding hundreds of synchronous GPU transfers. Stable framing checks
use consecutive matching reduced-motion signatures. Normal-motion captures need visual review.
Browser operations use three-minute budgets for software WebGL; this is not an FPS guarantee.
Audio state/RMS proves output generation and suspension, not listening quality or speaker level.
Emulation and a soak do not measure physical phone battery, heat, FPS or comfort. No configured
CRAP, duplication metric or mutation gate exists; report unavailable, do not invent thresholds.

## Cleanup

Helpers close owned browser contexts and terminate only the process group they create, including
after failure. They never stop a supplied preview. The native helper requests `Browser.close`,
waits for the whole group (not just its Xvfb wrapper), and removes the temporary profile only
then. Cleanup failures enter the report and force `NOT VERIFIED`.

After native shutdown changes, run
`node .agents/skills/verify-quiet-space/scripts/verify-cleanup.mjs --base-url URL --out DIRECTORY`.
It drives real native audio with a delayed owned child writer and proves the report survives
and the profile remains removed. Evidence survives all cleanup.
