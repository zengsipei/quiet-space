# AGENTS.md

Rules for any agent working in this repo. Read this before changing code, and read the repo's own
files instead of guessing: this file names the commands, the layout and the gates.

## What this repo is

quiet-space is a single-page WebGL scene: a quiet reading room rendered with three.js on one canvas,
built as a static Vite site with no backend, no accounts and no text input. Everything that would be
collected about a visitor stays in the browser's memory, and the page says so in its own footer.

## Layout

| Path | What |
| --- | --- |
| `index.html`, `src/` | The app being built: page shell, styles, and the scene modules |
| `proto/` | The lighting sample the look came from. A complete three.js room, camera presets and post-processing, kept as the reference implementation |
| `ref/` | Photographs and page captures the room's look was taken from. Local reference, not shipped |

`proto/` is the only tree that builds today. The root scaffold is mid-iteration: its `index.html`
loads `/src/main.ts`, which does not exist yet, so `pnpm build` and `pnpm dev` at the root fail until
that file lands. Work in `proto/` until the root tree takes over.

## Commands

Run inside `proto/`:

```sh
pnpm install
pnpm typecheck      # tsc --noEmit, about 3 seconds
pnpm dev            # vite on 127.0.0.1:5173
pnpm build
```

The root `package.json` has the same three scripts for the app that is replacing the sample.

## Gates

- `pnpm typecheck` is the cheap gate. Run it after every edit; a three.js scene fails at runtime long
  before it fails at compile time, so this only proves the types.
- Scene, lighting and material changes need a real browser check: open the page, take a screenshot
  under the same viewport and theme as the previous one, and keep it as evidence. Numbers in a
  post-processing chain are not visible in a diff.
- There is no CI. A repo that skips either check is unverified, not clean.

## Decisions and vocabulary

`docs/adr/` holds decisions that outlive a change. `GLOSSARY.md` holds the scene's vocabulary: use
its terms in code, in tickets and in prose, and record a term there when a change settles one.

## Conventions

- `CLAUDE.md` points at this file. Keep it a one-line pointer.
- Drafts, captures and run logs stay in `.scratch/`, which is ignored.
- No comments in code. A constraint that cannot be expressed in the code itself belongs in the ADR or
  in `GLOSSARY.md`.
