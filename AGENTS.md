# AGENTS.md

Rules for any agent working in this repo. Read this before changing code, and read the repo's own
files instead of guessing: this file names the commands, the layout and the gates.

## What this repo is

quiet-space is a static WebGL site: quiet reading spaces rendered with three.js on one canvas per page,
built as a static Vite site with no backend, no accounts and no text input. Everything that would be
collected about a visitor stays in the browser's memory, and the page says so in its own footer.

## Layout

| Path | What |
| --- | --- |
| `index.html`, `src/main.ts`, `src/scene/` | The night reading room |
| `prototype-hall.html`, `src/prototype-hall/` | North-library Book Mountain with daylight/dusk and quiet stay |
| `proto/` | The lighting sample the look came from. A complete three.js room, camera presets and post-processing, kept as the reference implementation |
| `ref/` | Photographs and page captures the room's look was taken from. Local reference, not shipped |

The root app builds both pages. `proto/` remains the lighting reference, with its own toolchain.
The prototype's coordinates and camera controls belong to its scene; the reading room keeps its
existing controls and atmosphere.

## Commands

Run at the repository root:

```sh
pnpm install
pnpm typecheck      # tsc --noEmit, about 3 seconds
pnpm dev            # vite on 127.0.0.1:5178
pnpm build
pnpm verify:hall    # browser journey, PNGs and JSON in .scratch/book-mountain/after
```

The browser journey needs Chromium. Read
[verify-quiet-space](.agents/skills/verify-quiet-space/SKILL.md) before driving the prototype.

## Gates

- `pnpm typecheck` is the cheap gate. Run it after every edit; a three.js scene fails at runtime long
  before it fails at compile time, so this only proves the types.
- Scene, lighting and material changes need a real browser check: open the page, take a screenshot
  under the same viewport and theme as the previous one, and keep it as evidence. Numbers in a
  post-processing chain are not visible in a diff.
- There is no CI. A repo that skips either check is unverified, not clean.
- For the Book Mountain prototype, run `pnpm verify:hall` and visually compare its five view captures
  with the architectural reference. The script verifies controls and rendered pixels, not CAD accuracy.
- Atmosphere and quiet-stay changes must preserve framing. Audio checks need silent load, actual
  native output after opt-in and suspended output after mute, not only an active button.

## Decisions and vocabulary

`docs/adr/` holds decisions that outlive a change. `GLOSSARY.md` holds the scene's vocabulary: use
its terms in code, in tickets and in prose, and record a term there when a change settles one.

## Conventions

- `CLAUDE.md` points at this file. Keep it a one-line pointer.
- Drafts, captures and run logs stay in `.scratch/`, which is ignored.
- No comments in code. A constraint that cannot be expressed in the code itself belongs in the ADR or
  in `GLOSSARY.md`.
