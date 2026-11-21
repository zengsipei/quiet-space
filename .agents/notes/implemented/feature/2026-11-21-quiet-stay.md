# Agent Note: Quiet stay is presentation state, not camera travel

Status: implemented

## Problem

The recognizable Book Mountain model is a place to inspect rather than a quiet place to stay.
Fixed flat lighting and persistent overlays compete with the scene. Adding more architecture
does not solve the visitor's need for atmosphere and fewer distractions.

## Decision

The existing model receives daylight and dusk lighting profiles, an explicit quiet-stay mode and
optional locally synthesized wind. Atmosphere updates sky/fog, exposure, lights and the shared
lamp material; the lighting controller invalidates cached shadows. Geometry supplies the lamp
material without owning sky state. View selection and look/zoom stay independent.

Quiet stay hides and makes the shell inert while focusing its sole exit. Exiting restores the
quiet control's focus, not a camera preset. Q toggles the mode and Escape leaves it; held keys do
not repeatedly toggle. The scene remains interactive and no timer, automatic camera movement
or fullscreen permission interrupts a stay. Desktop and touch layouts keep settings separate
from the existing view bar, and dusk uses a readable dark interface.

Sound stays off on load and follows the [local wind decision](../../../../docs/adr/0001-local-ambient-wind.md).
The initial architectural scope remains the [bounded Book Mountain](2026-11-20-north-library-book-mountain.md).

## Scope

- `src/prototype-hall`

## Alternatives considered

Expanding the architectural model can improve fidelity but does not reduce interface distraction
or add control over atmosphere. This iteration preserves the approved geometry and view presets.

Reusing the night room's bloom/grain chain gives a familiar stylized look. It adds animated
post-processing cost and makes repeatable daylight pixels harder to compare with the library
reference. Direct static tone mapping keeps the scene and the existing verification boundary.

Automatic camera drift or fullscreen can make a scene feel immersive. Both take control away
from a visitor and complicate gesture/exit behavior, so quiet stay only changes the interface.

## Consequences

One scene serves both exploration and quiet stay without duplicating geometry or navigation.
Presentation resets on reload and preferences remain only in memory. The browser journey follows
the existing [verification boundary](../testing/2026-11-20-browser-verification.md), including
actual rendered lighting and native audio output without production camera/audio setters.
Static screenshots still need visual inspection, and sound measurements do not replace listening.

## Verification

The frozen source passes typecheck and build. Its production journey is VERIFIED with 25 desktop
and touch captures and zero browser errors. Five daylight views retain the architectural
relationships in the reference; dusk adds warm reading-light accents. Portrait and landscape
controls fit and quiet scenes retain only the exit. Input/pixel checks establish atmosphere
reversal, focus and framing restoration, continued quiet-mode look controls, silent reload,
reduced-motion UI, rapid sound toggles and usable fallback without Web Audio.

The native child report is VERIFIED with four observed lifecycle steps: visible/running,
hidden/suspended, foreground/running and muted/suspended. Initial opted-in RMS is about 0.0032,
below the 0.1 low-gain ceiling. Physical device performance and speaker listening remain unmeasured.
