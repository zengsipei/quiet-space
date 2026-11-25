# quiet-space

A quiet Book Mountain website rendered with three.js. The root opens the north Tianfu Library
of Humanity and Art's outer reading hall: five curved reading terraces, book walls, stair lanes,
reading furniture, interior trees and lake-facing glazing. The night room is no longer shipped.
The former hall URL redirects to the root; local lighting samples and references remain intact.

The current Vite release has no application backend, accounts or text input. This is a snapshot,
not a static-only requirement. Backend services and anonymous shared presence remain possible
under an explicit data, privacy and lifecycle contract; neither is claimed as implemented.

## Run

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5178/`. Select one of five views with its button or number key (1–5).
Drag to look, wheel or pinch to zoom, and press R / “复位” to reset.

## Third-person traveler

Select “漫步” or press M. An original rounded traveler appears: pearl hood, dark mask, small
luminous eyes, a warm clay cape with a pale hem, and short articulated limbs. Sansa Temple's
quiet, small-avatar presence and Sky's soft cloaked silhouettes inform the direction, without
copying character models, cosmetics, textures or game mechanics.

Use WASD, arrow keys or hold the visible direction buttons. Space / Enter holds a focused
direction button. Drag to orbit; wheel or pinch changes camera distance. Movement is camera-
relative and diagonals keep the same pace. The gait and cape move only while walking.

The traveler starts facing a stair lane and uses actual treads, floors and furniture for support
and collision. High ledges and unsupported drops are blocked; there is no jumping or flight.
The camera shortens against geometry and the body fades if it would fill the lens. R resets
both person and camera. Toggle M, press Escape outside quiet stay, or select a view to observe.

## Quiet stay

“日光” / “暮色” preserves your view while changing atmosphere. “静坐” / Q hides tools without
moving the camera; “离开静坐” / Escape restores focus and controls. In observation you can
still look around. In walking, quiet stay freezes the person and follow camera.

Lake wind is synthesized locally, low gain and opt-in. Every load starts silent. Hidden pages
and rendering loss suspend wind and frame scheduling. Foreground/context recovery keeps the
pose but clears held inputs; a fresh press is required. Rendering failure offers “重新加载”.
During walking, reduced motion removes follow/heading easing; no idle motion is added.
State lives only in browser memory.

## Verify

`pnpm typecheck` and `pnpm build` are the build gates. Read the
[verification skill](.agents/skills/verify-quiet-space/SKILL.md) before browser verification.
`pnpm verify:hall` owns an isolated Vite instance and verifies observation, atmosphere,
touch and native audio. For a built preview, use:

```sh
pnpm preview --host 127.0.0.1
pnpm verify:hall --base-url http://127.0.0.1:4178 --out .scratch/book-mountain/production
pnpm verify:visit --base-url http://127.0.0.1:4178 --out .scratch/quiet-visit/production
pnpm verify:character --base-url http://127.0.0.1:4178 --out .scratch/third-person/production
```

Visit checks rendering recovery, fallback/retry, focus and phone framing. Character checks
walking, stairs, obstacles, orbit, touch cancellation and the legacy redirect. Hall's native
Chromium tab leg proves hidden/foreground behavior and actual audio output (Node 22+ and Xvfb
on Linux). PNGs and JSON reports stay in ignored `.scratch/`. Browser operation and screenshots
are not real-phone performance, battery, comfort or a listening review. Optional visit
`--soak-minutes 15` records an emulated-phone stay, not a hardware measurement.

## References and layout

The [designer-supplied architectural article](https://www.gooood.cn/chengdu-museum-of-contemporary-art-tianfu-library-of-humanity-and-art-china-southwest-architectural-design-and-research-institute-corp.htm)
provides the Book Mountain plan, section and photographs. Dimensions are interpretations, not
surveyed geometry. The south museum and inner reading rooms are outside this release.

| Path | Purpose |
| --- | --- |
| `index.html`, `src/prototype-hall/` | Book Mountain, its atmosphere and observation controls |
| `prototype-hall.html` | Legacy entry redirect, not another space |
| `src/visitor/` | Original traveler and grounded third-person controls |
| `src/lib/` | Render lifecycle and seeded audio randomness |
| `proto/`, `ref/` | Local lighting sample and references; not shipped |
| `docs/specs/`, `.agents/notes/` | Accepted scope and decisions |

Agent rules: [AGENTS.md](AGENTS.md). Vocabulary: [GLOSSARY.md](GLOSSARY.md).
