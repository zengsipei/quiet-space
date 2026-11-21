# Build and test

The repository root builds the night reading room and the north-library Book Mountain prototype.
The separate `proto` tree is a lighting reference, not a prerequisite package.

## Build

- `pnpm typecheck` checks the root TypeScript source without emitting files.
- `pnpm build` typechecks and builds both HTML entries as a static Vite site.
- `pnpm dev` starts the app on 127.0.0.1:5178.
- `pnpm preview --host 127.0.0.1` serves the built site on port 4178.
- The root pnpm lockfile fixes the dependency graph. Only esbuild's installation build is allowed.

## Browser verification

There is no unit test suite or CI. Scene, lighting, material and camera changes require a real
browser journey and visual review of the resulting images against the architectural reference.

Read the project-local [verification skill](../../.agents/skills/verify-quiet-space/SKILL.md).
Install Chromium through Playwright, then run `pnpm verify:hall`. The helper owns an isolated
strict-port Vite server on 5183, drives the page with Playwright, checks displayed WebGL pixels,
and retains desktop and touch evidence. It closes Chromium between desktop and mobile journeys
to release software WebGL resources, and cleans up only the instance it starts.

For production evidence, build first and start the preview. Run:

```sh
pnpm verify:hall --base-url http://127.0.0.1:4178 --out .scratch/book-mountain/production
```

The helper does not stop a caller-owned preview. The root source is the test target; there are no
workspace packages or stale distribution copies to resolve.

## Cost and cadence

Typechecks cost seconds and run after coherent source edits. The complete browser journey costs
minutes under software WebGL on this host. Freeze source before the final build and full journey,
inspect its five desktop views and portrait/landscape images, and repeat only when a change or a
failure requires it. A pixel/control pass establishes operation, not measured CAD accuracy or
hardware performance.

The complete journey also verifies atmosphere reversal without camera changes, quiet-stay
visibility and focus restoration, silent initial load, native Web Audio output after opt-in,
mute/suspension, and silent reload. `--stay-only` drives this slice without the older camera
journeys. The audio observer attaches an analyser at the browser's audio destination; it adds
no production scene or audio controls and records context state plus sampled output amplitude.
The final audio lifecycle leg needs Node 22+, Chromium and Xvfb on Linux. It drives a separate
native browser because this host's Playwright-managed background pages remain visible. Real
tab switching must suspend and resume opted-in wind. A child report and foreground PNG remain
under `native-audio`; the temporary browser/profile are cleaned, not the caller's preview.
