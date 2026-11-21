# Camera presets

Five views let readers inspect the complete hall, terraces, Book Mountain, book wall, and lake-facing
window. Each is reachable with a button and the corresponding number key.

## Sub-features

- `buttons`: all five buttons change the selected view and the rendered scene.
- `keys`: keys 1 through 5 select the same views.
- `reset`: R restores the current preset and its zoom.

## How to get to it (user POV)

Open the prototype and use the bottom view controls. Desktop readers can press 1 through 5.

## Driving it with Playwright

Preconditions: the rendered prototype is visible.

The baseline helper presses the first two number keys and saves the resulting captures. The complete
helper clicks `getByRole("button", { name: label, exact: true })` for “全景”, “阶地”, “书山”,
“书墙”, and “湖窗”; each button must have `aria-pressed="true"`. It then presses the number keys
and compares the resulting WebGL signature with the corresponding clicked view.

## Gotchas

A changed button label is not camera evidence. Compare the rendered buffer signatures, which
exclude the HTML overlay. Use the fixed desktop viewport for meaningful visual comparison.
