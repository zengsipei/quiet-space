# Quiet stay in Book Mountain

## Problem Statement

The existing hall feels like a modeling demonstration: lighting is flat, overlays remain visible,
and visitors cannot choose an ambient sound. It needs a quiet-stay experience without expanding
the model or disrupting its five observation views.

## Solution

Offer layered daylight and dusk, an explicit reduced-interface quiet stay, and locally generated
lakeside wind that starts only on opt-in. This prototype increment is client-side, private and
silent by default; it does not restrict future releases to a static or backend-free design.

## User Stories

1. As a visitor, I can switch atmosphere without changing my current framing.
2. As a visitor, I can restore daylight and its original rendered lighting.
3. As a visitor, I can hide titles and tools while keeping drag and zoom available.
4. As a visitor, I can exit by a visible button or Escape without resetting the camera.
5. As a keyboard visitor, I can use Q, view shortcuts and reset.
6. As a visitor, I hear nothing until I explicitly enable wind, and can mute it at any time.
7. As a visitor, sound stops in a hidden page and reload starts in silent daylight.
8. As a phone visitor, all controls fit portrait and landscape layouts.
9. As a visitor requesting reduced motion, decorative UI transitions stop.
10. As a visitor without Web Audio, the scene remains usable with a clear notice.

## Implementation Decisions

Atmosphere is daylight or dusk. A profile owns sky/fog, exposure and light settings. Geometry
supplies its shared lamp material; the lighting controller updates it and invalidates shadows.
Atmosphere never owns navigation state.

Quiet stay is an explicit boolean. The shell becomes hidden and inert; focus moves to the exit
and returns to the quiet control on exit. There is no automatic camera travel or timer.

Wind uses one lazily created looped seeded-noise/filter/gain graph. Desired sound state and
page visibility govern context suspension. Repeated toggles converge to the latest request.
Audio failure leaves sound off and displays a notice. Preferences stay only in memory.

## Testing Decisions

The user confirmed one seam: the running browser page, its controls, rendered WebGL pixels and
native browser audio output. Retain existing navigation checks and add reversible lighting,
quiet-mode visibility/focus/framing, silent load, low-gain opt-in audio, suspension and reload
checks. Drive desktop and both phone orientations. Keep before/production captures for visual
review; typecheck coherent edits and build before the final journey.

## Out of Scope

This original atmosphere increment excludes architecture expansion, measured CAD, walking,
collision, timers, music, uploaded recordings, backend, accounts, persistence and landing.
Walking is now specified separately in `third-person-visitor.md`; backend and shared presence
remain allowed product directions, not prohibited capabilities.

## Further Notes

One coupled vertical slice implements the approved scope. Existing uncommitted work is preserved.
Signal measurements prove sound generation rather than a human listening review or speaker level.
