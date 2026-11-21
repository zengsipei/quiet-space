# Prototype entry and rendering

Readers can open the north library Book Mountain prototype directly or follow its entry from the
night reading room. The library opens as a daylight interior with its architecture visible.

## Sub-features

- `direct`: the prototype URL renders a nonblank scene.
- `entry`: the reading-room link opens that same prototype.
- `health`: the browser has no page errors or failed application requests.

## How to get to it (user POV)

Open `prototype-hall.html`, or open the reading room and choose “探索书山”.

## Driving it with Playwright

Preconditions: the root app is serving and Chromium supports WebGL.

Run the helper with `--baseline` to open the direct entry and capture its WebGL colors and initial
screen. Run the full helper to click `getByRole("link", { name: "探索书山" })` from the reading room,
observe the prototype URL, and capture the rendered scene. `report.json` records the actual pixel
signature and any browser error.

## Gotchas

A loaded canvas element alone proves nothing. The helper samples the WebGL buffer after a rendered
frame and rejects uniform images. Visual reference matching still requires reading the saved PNGs.
