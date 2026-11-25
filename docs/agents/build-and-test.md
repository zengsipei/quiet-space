# Build and test

The root builds Book Mountain and a legacy hall-URL redirect. The removed night room is not
part of the build. The separate `proto/` lighting reference has its own toolchain and is not
a prerequisite. Static Vite output describes this release, not a permanent backend prohibition.

## Build

- `pnpm typecheck` checks root TypeScript without emitting files.
- `pnpm build` typechecks and builds the root scene plus redirect.
- `pnpm dev` serves 127.0.0.1:5178; `pnpm preview --host 127.0.0.1` serves the built site on 4178.
- The root lockfile owns the dependency graph. No unit test suite, CI or metric/mutation gate exists.

## Browser gates

Read the [verification skill](../../.agents/skills/verify-quiet-space/SKILL.md). Chromium with
WebGL is required. `pnpm verify:hall` owns an isolated strict-port Vite instance on 5183 and
checks five views, gestures, daylight/dusk, quiet stay and native audio. It closes desktop
Chromium before touch checks to release software WebGL resources.

For frozen production evidence, build and start a caller-owned preview, then run all three:

```sh
pnpm verify:hall --base-url http://127.0.0.1:4178 --out .scratch/book-mountain/production
pnpm verify:visit --base-url http://127.0.0.1:4178 --out .scratch/quiet-visit/production
pnpm verify:character --base-url http://127.0.0.1:4178 --out .scratch/third-person/production
```

Visit checks fallback/retry, quiet focus/framing, context restoration and phone layout.
Character checks the original traveler, stair/obstacle movement, follow-camera control, quiet
input suspension, multi-touch and the old URL redirect. Inspect front/back and mobile PNGs;
rendered-pixel signatures prove operation, not visual fidelity or full capsule physics.

Hall's native tab leg uses Node 22+, Chromium and Xvfb on Linux. It proves actual low-gain audio,
hidden-page suspension, foreground resumption, preserved quiet framing and stale walking-key
clearing. The cleanup regression remains required after native shutdown changes. Helpers stop
only their own browser/process group and never a supplied preview. Failures retain evidence
and exit nonzero. The optional visit soak is emulated-phone evidence, not hardware performance.
