# Look, zoom, and mobile layout

Readers drag to look around and zoom with the wheel or a two-finger gesture. The five view controls
remain usable on touch devices and after a portrait-to-landscape resize.

## Sub-features

- `drag`: a canvas drag changes the rendered direction.
- `wheel`: the wheel changes the framing.
- `touch`: touch drag and pinch change the rendered direction and framing.
- `resize`: the canvas and controls fit portrait and landscape screens.

## How to get to it (user POV)

Open the prototype, drag its background, and use the wheel or two fingers. Press R or use “复位”
to return to the selected view.

## Driving it with Playwright

Preconditions: the prototype is rendered and touch emulation is available in Chromium.

The helper drives `page.mouse` for desktop drag, then checks a changed WebGL signature; the complete
journey also checks wheel zoom.
The complete journey opens a touch context at 390 × 844, clicks all five view buttons, dispatches
actual touch events through Chromium's input protocol, and checks the rendered result. It resizes
to 844 × 390 and saves the landscape image. Horizontal document overflow is a failure.

## Gotchas

Mouse emulation alone is not touch evidence. Touch input must reach the canvas, and screenshot
evidence must survive browser cleanup. Camera damping needs to settle before comparing signatures.
The helper restarts Chromium between desktop and touch contexts to release software WebGL resources
on memory-limited hosts. It still drives both complete journeys and keeps all captures.
