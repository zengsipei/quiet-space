# quiet-space

Quiet reading spaces rendered with three.js, one canvas per page. The site is a static Vite build
with no backend, accounts, or text input.

The night reading room opens at the root. Its “探索书山” link opens the daylight
[Book Mountain prototype](prototype-hall.html), an interpretation of the north Tianfu Library of
Humanity and Art's outer reading hall. The first model includes five curved reading terraces,
undulating book walls, two stair lanes, a tall rear collection wall, a rising ceiling, white
columns, reading furniture, interior trees, and lake-facing glazing.

## Run

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5178/prototype-hall.html`. Select a view with its button or keys 1–5; drag to
look, use the wheel or pinch to zoom, and press R or “复位” to reset the selected view.

## Stay quietly

The Book Mountain hall offers “日光” and “暮色”. Daylight separates warm sunlight from cooler
shadows; dusk brings a lower sun and warm reading lights. Changing atmosphere preserves the
selected view and any framing changes.

Select “静坐” or press Q to hide titles and tools. Drag and zoom remain available. Use the
visible “离开静坐” button or Escape to return to the controls without resetting the camera.
These presentation changes do not alter the night reading room.

“湖边风声” is optional, quiet synthesized wind, not a field recording. Sound is off initially.
Its first enabled click creates a local Web Audio graph; muting or hiding the page suspends it.
No audio assets are fetched and no preferences are stored. Reload starts in silent daylight.
If audio is unavailable, a notice appears and the scene remains usable.

## Verify

```sh
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm verify:hall
```

The browser helper drives every prototype control at desktop and mobile sizes, starts and cleans
up its own Vite instance, and saves PNGs plus a JSON action report under `.scratch/book-mountain/after`.
To drive a built preview, start `pnpm preview --host 127.0.0.1`, then run
`pnpm verify:hall --base-url http://127.0.0.1:4178 --out .scratch/book-mountain/production`.
For a focused atmosphere, quiet-stay and audio check, add `--stay-only`; the complete journey
includes those checks plus the existing navigation journeys.
The native audio lifecycle leg needs Node 22+ and Xvfb on Linux, as described in the verification skill.
See the [verification skill](.agents/skills/verify-quiet-space/SKILL.md) for browser setup,
feature journeys, and evidence requirements.

## Architectural reference

The [designer-supplied gooood article](https://www.gooood.cn/chengdu-museum-of-contemporary-art-tianfu-library-of-humanity-and-art-china-southwest-architectural-design-and-research-institute-corp.htm)
provides the Book Mountain photographs, plan, and section. The model approximates their spatial
relationships; its dimensions and context are adjustable interpretations, not surveyed geometry.
The first release covers the north outer hall. The south art museum, underground spaces, and inner
reading rooms are outside its scope. Reference photographs remain local and are not shipped as
textures.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html`, `src/scene/` | Night reading room |
| `prototype-hall.html`, `src/prototype-hall/` | Daylight Book Mountain model and navigation |
| `proto/` | Original lighting reference with its own toolchain |
| `.agents/skills/verify-quiet-space/` | Maintained browser journey and feature map |
| `docs/specs/` | Settled feature scope |
| `.agents/notes/` | Modeling and verification decisions |
| `ref/`, `.scratch/` | Local references, drafts, and captures; not shipped |

Agent rules are in [AGENTS.md](AGENTS.md). Domain terms are in [GLOSSARY.md](GLOSSARY.md).
