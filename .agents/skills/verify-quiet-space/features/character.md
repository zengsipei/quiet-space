# Cloaked traveler and third person

## Sub-features

Original modeled hood/mask/cape, articulated movement-driven gait, keys and held buttons,
actual stairs/obstacles, follow orbit/distance, reset/observation, quiet/stale-key clearing,
multi-touch/cancellation and context recovery. Sources: `src/visitor/` and hall geometry/entry.

## How to get to it (user POV)

Open Book Mountain and select “漫步” / M. Use WASD, arrows or hold direction buttons (Space/Enter
when focused). Drag to orbit, wheel/pinch for distance. R resets. A view, M or Escape outside
quiet stay returns to observation. “静坐” freezes person and camera without replaying held input.

## Driving it with Playwright

Run `pnpm verify:character --base-url URL --out DIRECTORY`. The helper samples displayed
pixels and saves original traveler front/back, stair traversal, obstacle stopping, orbit/zoom,
reset, quiet/context and touch captures. Movement waits for rendered change; blocking requires
changed then stationary pixels while still held. Quiet and context restoration retain exact
reduced-motion framing. `--entry-only` checks only root/legacy entry, not these paths.
`--stairs-only` is the focused full-stair, blocking, descent/reset and camera-clearance regression.

Hall's native audio helper runs with `--character`: hold a key while backgrounding a real tab,
prove frames stop, reject stale repeated movement after return and prove fresh input still moves.
Record frame counts only after hidden scheduling is cancelled. Wait for two new foreground
draws before the stale-repeat baseline, so pre-hidden/cached frames and idle gait restoration
cannot be mistaken for resumed input. The four unchanged-pixel assertions remain mandatory.

## Gotchas

Inspect the model images: tags/pixels alone cannot prove Sansa/Sky-inspired original appearance.
No proprietary assets or extra character lights are used. Fixed delays alone do not prove a
walk on software WebGL. Shadows update for actual changed body poses and disappear on returning
to observation. No test pose setters exist. Bounded support/body sweeps are not a full physics
engine; cape cloth is visual, not a separate collision body. Physical-phone performance is unmeasured.
