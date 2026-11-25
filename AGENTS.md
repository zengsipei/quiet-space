# AGENTS.md

Rules for agents working in this repo. Read the source and the local verification skill before
changing scene behavior; do not infer a permanent restriction from the current implementation.

## Product and layout

quiet-space ships only Book Mountain at the root, with one three.js canvas. The former
`prototype-hall.html` entry redirects to `./`. The night reading room is retired, not a second
product route. `proto/` and `ref/` remain local lighting/reference material and are not shipped.

The current Vite implementation has no application backend, accounts or text input; visit state
is in memory. Backend services and anonymous co-presence are allowed directions, with explicit
data/privacy/lifecycle contracts and truthful visitor-facing claims. See
`docs/specs/complete-quiet-visit.md` and `docs/specs/third-person-visitor.md`.

| Path | What |
| --- | --- |
| `index.html`, `src/prototype-hall/` | Book Mountain architecture, atmosphere and navigation |
| `src/visitor/` | Original cloaked traveler, grounded movement and third-person input |
| `src/lib/` | Rendering lifecycle and audio randomness |
| `proto/` | Accepted lighting sample with its separate reference toolchain |
| `ref/`, `.scratch/` | Local references, drafts and evidence; preserve, do not ship |

## Commands and gates

`pnpm install`; `pnpm dev` serves 127.0.0.1:5178. Run `pnpm typecheck` after coherent
edits and `pnpm build` before production verification. Build output includes one application
entry and the legacy redirect, not two scene bundles. No unit suite or CI is configured.

Read [.agents/skills/verify-quiet-space/SKILL.md](.agents/skills/verify-quiet-space/SKILL.md).
Run `pnpm verify:hall` for observation/atmosphere/touch/native audio. It owns an isolated
strict-port Vite instance; `--base-url` reuses and leaves a caller-owned preview running.
Use `pnpm verify:visit --base-url URL --out DIRECTORY` for fallback, rendering recovery and
phone focus/framing; `pnpm verify:character --base-url URL --out DIRECTORY` for walking.

Scene, material and camera changes require real browser PNGs and visual review. Compare the
five view captures with the architectural reference; compare traveler front/back with its
original design. Pixel counts and typechecking alone do not prove appearance. Preserve actual
floor/solid mesh ownership and exclusive observation/walking camera ownership. Do not add
character lights or change the established architectural lighting to disguise model problems.

Audio needs silent load, actual native output after opt-in and suspended output after mute,
hiding or rendering loss. The hall journey includes the native tab lifecycle leg. Physical
phone frame rate, battery and comfort must be reported separately from emulated evidence.
No CRAP, duplication metric or mutation thresholds are configured; do not invent values.

## Conventions

`CLAUDE.md` stays a one-line pointer here. Use `GLOSSARY.md` terms and keep architectural
decisions in `docs/adr/`; other decisions use the existing notes/tracker conventions.
No comments in source code. No unrequested landing, deployment, reset, clean or reference deletion.
