# quiet-space feature map

Baseline preconditions: install the root dependencies, have Chromium available, and leave port 5183
free. The helper starts and cleans up its own Vite instance. A separately started build is driven
with `--base-url`. The lighting sample under `proto` is reference material rather than this app.

| Feature | Entry | Proof |
| --- | --- | --- |
| [Prototype entry and rendering](render.md) | Direct prototype URL or reading-room link | Visible colored WebGL buffer, entry screenshot, no browser errors |
| [Camera presets](views.md) | Five view buttons or number keys | Five distinct rendered pixel signatures and captures |
| [Look, zoom, and mobile layout](navigation.md) | Canvas gestures and reset | Changed rendered view, restored preset, touch and resize captures |
| [Atmosphere, quiet stay and optional wind](stay.md) | Top settings or Q/Escape | Reversible lighting, hidden/inert tools, native audio output and silent reload |

Run `node .agents/skills/verify-quiet-space/scripts/verify.mjs --out .scratch/book-mountain/after`
for the complete map. `--baseline` captures the existing keyboard and mouse journey before changes.
`--stay-only` drives the new presentation and audio slice without the older camera journey.
Report every failed journey in `report.json`; an unavailable precondition is a failure, not a pass.
Each feature file contains Sub-features, How to get to it (user POV), Driving it with Playwright,
and Gotchas, in that order.
