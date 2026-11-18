# Build and test

quiet-space has two trees. Only `proto/`, the lighting sample, builds today; the root scaffold fails
until `src/main.ts` lands, and that failure is not a broken change.

## Build

- Verify the types: `cd proto && pnpm typecheck` (`tsc --noEmit`, about 3 seconds).
- Build: `cd proto && pnpm build` (`vite build`); the root `pnpm build` is `tsc --noEmit && vite build`.
- `proto/pnpm-lock.yaml` is the lockfile for that tree; the root has none yet.

## Test

There is no test suite and no CI. The gates are the typecheck above plus a real browser check for any
scene, lighting or material change: `cd proto && pnpm dev` serves 127.0.0.1:5173, and the capture is
kept under the same viewport and theme as the previous one. Numbers in a post-processing chain do not
show up in a diff, so a typecheck alone does not verify them.

## Cost

One typecheck run costs seconds, so it runs after every edit. Nothing here is parallel and nothing is
slow enough to batch.
