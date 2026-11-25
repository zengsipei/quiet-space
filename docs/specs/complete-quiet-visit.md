# Complete quiet Book Mountain visit

## Problem Statement

A quiet-space visit needs discoverable controls, phone operation and safe rendering/audio
recovery. The latest user request keeps only Book Mountain; the earlier two-space requirement
is superseded, not a permanent requirement to preserve the night room.

## Solution

Serve Book Mountain at the root, with five observation views, daylight/dusk, optional lake wind,
quiet stay and a separate third-person walking mode. The former hall entry redirects to the
root. Preserve architecture/lighting and local reference trees, not the removed product route.

## User Stories

Visitors can choose a view, look/zoom, reset, hide the tools and recover focus without losing
framing. Phone visitors have visible controls and touch look/pinch. A rendering failure shows a
reload action; context restoration or foreground return keeps the view without stale input.

## Implementation Decisions

One scene owns rendering and one active controller owns camera/input. A lifecycle render loop
cancels owned frames on hidden pages, pagehide or context loss and resets elapsed time on resume.
Ready follows a rendered frame. Quiet stay makes the shell hidden/inert and retains the camera.
Walking's freeze/input contract is in [third-person visitor](third-person-visitor.md).

Wind is lazy, synthesized locally and silent on every load. Hidden/unavailable rendering suspends
output; opt-in resumes only when available, and failure leaves sound off with a notice.

No application backend, accounts or stored visit data exists in this release. This is not a
static-only restriction: backend and anonymous presence require their own truthful data,
privacy, disconnect and two-client verification contracts before being claimed.

## Testing Decisions

The running-browser seam verifies five views, touch and framing, quiet focus, unavailable WebGL,
reload and actual context recovery. Native tabs verify hidden/foreground frames and audio.
Walking adds its character journey. Production PNGs, rendered-pixel observations and action
reports are retained; visual architecture/model review remains necessary. An optional 15-minute
emulated-phone soak is not a real-device frame-rate, battery or comfort measurement.

## Out of Scope

No timers, progress counters, automatic travel, autoplay, production backend, multiplayer,
account system, persistence or deployment. These exclusions describe this increment only.

## Further Notes

The historical lighting sample stays in `proto/`. The shipped entry is Book Mountain only.
