# quiet-space feature map

Root dependencies and WebGL-capable Chromium are prerequisites. The hall helper owns strict port
5183 or drives a caller-owned `--base-url`. The local lighting sample is not the application.

| Feature | Entry | Proof |
| --- | --- | --- |
| [Book Mountain entry/rendering](render.md) | Root or legacy hall redirect | Colored WebGL, heading, no night-room link or browser errors |
| [Camera presets](views.md) | Five buttons or 1–5 | Distinct pixels; key/button equivalence and reset |
| [Look/zoom/mobile](navigation.md) | Canvas gestures | Changed framing, restored preset and no phone overflow |
| [Atmosphere/quiet/wind](stay.md) | Top settings or Q/Escape | Reversible lighting/focus, silent load, actual native audio |
| [Visit/recovery](visit.md) | Root and retry | Stable framing, context restoration and optional bounded stay |
| [Cloaked traveler](character.md) | M / “漫步” and held arrows | Visible original person, stairs/obstacles, orbit and retained recovery pose |

Run `pnpm verify:hall`, then `pnpm verify:visit --base-url URL --out DIRECTORY` and
`pnpm verify:character --base-url URL --out DIRECTORY` sequentially against a frozen build.
Scene/model changes also need visual PNG review. Each feature file names Sub-features, How to
get to it (user POV), Driving it with Playwright, and Gotchas. Failures stay in reports; a missing
precondition is not a pass. Report physical-device and unavailable metric evidence separately.
