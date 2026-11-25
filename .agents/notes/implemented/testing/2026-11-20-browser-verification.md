# Agent Note: Browser pixels and input gestures verify the Book Mountain prototype

Status: implemented

## Problem

A passing three.js typecheck does not reveal an exterior camera, an occluding column, a blank
canvas or unusable phone controls. The repo needs a repeatable user journey whose proof survives
browser shutdown, and architectural fidelity still needs review against the supplied photographs.

## Decision

The current product is [Book Mountain only](../feature/2026-11-23-book-mountain-only.md).
Root/legacy entry and the original traveler replace the historical two-space paths below.
Hall, visit/recovery and character remain separate journeys at this same browser seam. Their
pixel observer reads the displayed buffer once, then samples its grid in memory rather than
performing hundreds of synchronous GPU transfers; visual and behavioral assertions are retained.
Native foreground frame counts use the confirmed hidden/cancelled state as their baseline, not
the earlier request to open another tab. Extra visible frames can occur before actual hiding.
Walking waits for two fresh foreground draws before testing stale input: the first can restore
the cached view and return released gait/shadows to idle. Four subsequent pixel comparisons
still reject repeated movement; a fresh key must then change the rendered scene. This is a
browser-frame ownership boundary, not a production pose setter or a weakened motion assertion.

The running browser page is the single verification boundary. A Playwright helper starts an
isolated strict-port Vite instance or drives a caller-owned preview. It opens the actual entry,
selects every camera with buttons and keys, drags, zooms and resets, then repeats touch input in
portrait and landscape. PNG captures and a JSON action report survive cleanup.

The helper samples the displayed WebGL drawing buffer after a frame. Multiple colors reject a
blank image; distinct signatures prove that camera changes affect the scene rather than only the
HTML overlay. Button and keyboard results must agree, and reset must restore the preset's
signature. The helper exposes no scene or camera setters. Desktop and touch runs use separate
Chromium processes so software WebGL resources are released between contexts.

The project-local skill carries four maintained feature journeys: entry/rendering, camera
presets, look/zoom/mobile layout, and quiet-stay/atmosphere/audio. Its baseline journey is proven
before scene implementation.
The completed model is typechecked, built, driven through its production preview, and reviewed
visually against the architectural reference.

The complete-visit journey adds the root's visible controls and two-way links, touch look/pinch,
quiet framing and focus, browser context failure/recovery and retry. Reduced-motion captures
freeze decorative pixels for exact framing checks; a separate normal root capture preserves the
accepted appearance check. A test-owned scheduling observer records ready time and pending
frames at the browser boundary. The native tab leg verifies cancellation when the hall or root
is hidden and compares the root's quiet pixels after foreground return. A bounded emulated-phone
stay samples elapsed time and observed frames, explicitly separate from physical-device evidence.

Native browser shutdown requests `Browser.close`, then waits for the entire owned process group,
escalating to TERM and KILL only when needed. Profile removal follows group termination, not the
Xvfb wrapper's exit. Cleanup errors enter the saved report and fail verification rather than
discarding completed audio observations. A real-Chromium regression adds a delayed child writer
to that group: the old ordering fails with `ENOTEMPTY`, while group-aware shutdown leaves the
verified audio report and no profile.

## Alternatives considered

Unit tests for each geometry builder can cheaply count vertices or assert dimensions. They do
not show what the visitor sees, and encoding these approximate modeling choices as exact values
would mainly mirror the implementation. The browser page provides stronger evidence for this
visual prototype.

Screenshot hashes alone offer a simple camera-change check. HTML button state and animated grain
can change a hash while the scene stays fixed, so the helper compares rendered WebGL pixels and
saves the full page separately for human review.

Manual screenshots need no browser dependency. They leave input equivalence, pinch behavior,
reset, and cleanup to repeated improvised checks. A maintained helper makes those journeys
reproducible, while visual inspection remains responsible for architectural intent.

Retrying profile deletion would mask the shutdown race without proving ownership had ended. The
group boundary prevents live descendants from recreating the profile and keeps failures explicit.

## Consequences

Verification adds a development-only Playwright dependency and needs Chromium with WebGL. The
helper supplies a software rendering route for containers and terminates only its own instances.
Evidence documents operational behavior rather than measured CAD accuracy, hardware frame rate,
or every future reading room. The feature map must expand when another user-facing surface lands.
Quiet stay adds a native audio-destination observer, with no production audio setters. A separate
native Chromium tab journey verifies hidden-page suspension and foreground resumption because
managed browser pages remain visible on this host. It uses Node 22+ and Xvfb on Linux and cleans
its own browser/profile. Gesture captures wait for consecutive stable rendered signatures before
asserting framing preservation, rather than assuming a software-rendering frame rate. A suspended
analyser can retain a nonzero last buffer; context suspension proves output has stopped, and RMS
measurements establish live signal only while the context is running.
Desktop and mobile actions and captures share the stable-pixel check's three-minute budget.
Production replays hit Playwright's default 30-second screenshot and click timeouts while the
rendered scene and selected controls remained correct. A larger browser-boundary wait avoids
mistaking slow software-rendered frames for missing controls; it changes no behavioral assertion
and provides no hardware performance guarantee.
The scope of the current model is recorded in the
[Book Mountain decision](../feature/2026-11-20-north-library-book-mountain.md).
