# Atmosphere, quiet stay and optional wind

## Sub-features

Daylight/dusk lighting, reversible quiet stay, focus restoration and opt-in local wind. Source:
the hall shell, main entry, lighting controller and wind generator under `src/prototype-hall/`.

## How to get to it (user POV)

Open the hall. Daylight is selected and sound is off. The top settings offer “日光”, “暮色”,
“湖边风声” and “静坐”. A quiet scene keeps only “离开静坐”; Escape also restores the tools.

## Driving it with Playwright

Run the complete helper or add `--stay-only`. Compare day/dusk WebGL pixels and restore daylight
at the same framing. Enter quiet stay, verify hidden/inert tools and focused exit, and leave by
button and keyboard without camera changes. Enable wind and observe running, low-amplitude
native Web Audio output; mute and verify suspension. Reload into silent daylight. Repeat in
portrait and landscape touch contexts and inspect the saved captures.
The final native-browser leg opens a real second tab, confirms hidden-page suspension, closes
that tab and verifies resumed opt-in output in the foreground.

## Gotchas

The native audio observer is installed before the page loads and attaches an analyser at its
audio destination. It adds no production audio setters. Signal measurements prove generation,
not speaker volume or a human listening review. Visual inspection, not signatures alone,
establishes dusk readability, daylight depth and the uncluttered quiet scene.
Software WebGL can take seconds per frame. Gesture captures wait for consecutive stable pixel
signatures before testing unchanged framing; preset captures need no animation-settling loop.
The native tab leg avoids the managed browser's always-visible background pages on this host.
Browser actions and captures use the same three-minute budget as stable-pixel checks; a default
30-second action timeout can expire between software-rendered frames on this host. The longer
budget changes no pixel, focus, visibility or audio assertion and is not a frame-rate claim.
