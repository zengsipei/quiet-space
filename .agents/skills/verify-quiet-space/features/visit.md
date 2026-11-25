# Quiet Book Mountain visit and recovery

## Sub-features

Root views, quiet focus/framing, reduced motion, actual-frame readiness, unavailable WebGL,
retry and context restoration. Sources: root shell, hall entry and render loop.

## How to get to it (user POV)

Open Book Mountain at the root, choose a view, enter “静坐” and use the visible exit / Escape.
Phones use the same controls, drag and pinch. Rendering failure provides “重新加载”.

## Driving it with Playwright

Run `pnpm verify:visit --base-url URL --out DIRECTORY` against a production preview. It
captures normal/reduced motion, five button/key views, reset, quiet inertness and focus. The
real context-loss extension proves paused frames and restored framing. Unavailable-WebGL cases
mock only the browser context boundary, restore it and drive the real retry. Touch uses native
CDP drag/pinch/cancel and both orientations. Optional `--soak-minutes 15` records an emulated stay.

Run hall too: its native tab leg proves actual hidden scheduling/audio suspension and foreground
quiet framing. Walking recovery belongs to the character journey, not observation assertions.

## Gotchas

No scene setters are exposed. Browser scheduling/pixels are the accepted seam. Reduced motion
supports exact framing checks; normal captures still need visual review. Emulation establishes
operation, not phone battery, heat, FPS or comfort. The removed night room is not a regression
surface. Backend/shared presence is allowed but neither required nor claimed by this release.
