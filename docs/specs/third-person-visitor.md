# Third-person cloaked traveler

## Problem Statement

The visitor should inhabit Book Mountain through a visible quiet avatar rather than only view
camera presets. The user's latest scope removes the night room and asks for Sansa Temple /
Sky-inspired character modeling. Earlier two-space walking drafts are superseded.

## Solution

Book Mountain opens directly at `/`; the former hall URL redirects there. “漫步” / M reveals an
original small cloaked traveler and transfers camera/input ownership from observation to walking.
The direction pad is visible only while walking, and is hidden with the rest of the tools in quiet stay.
The existing architecture and daylight/dusk lighting remain unchanged. The local sample and
reference trees stay intact but are not shipped.

## User Stories

- As a visitor I open the root and enter Book Mountain, without a night-room link or route.
- As a visitor I walk a modeled traveler with keys or held accessible direction buttons.
- As a visitor I orbit to see the face/cape, adjust distance and traverse supported stairs.
- As a quiet visitor I freeze the walking pose, then return with focus and no stale movement.
- As a phone visitor I combine movement and orbit, pinch, cancel touches and reset safely.

## Implementation Decisions

The original design uses childlike proportions, a rounded pearl hood, a dark oval mask, restrained
luminous eyes, short limbs and a clay cape with pale hem. Local mesh geometry supplies the model;
no Sansa/Sky assets, cosmetics, textures, emblems or proprietary rigs are copied. Sansa's small
quiet-avatar presence and Sky's soft cloaked silhouette are references, not new religious,
flying or multiplayer mechanics. The face/cape use existing scene lighting and no extra lights.

Data shape: a scene-owned articulated body plus feet and heading; actual floor/solid meshes;
a walk session with mode, suspended-input flag, held keys/pointers, orbit and spawn pose.
Observation owns presets; only one controller writes the camera at a time.

Camera-relative WASD/arrows normalize diagonal speed. Pointer capture and Space/Enter support
held buttons; canvas drag orbits and wheel/pinch changes distance. Real floors, bounded climb/drop
and subdivided body sweeps prevent unsupported traversal and block furnishings. Camera rays
shorten against geometry; near-body opacity preserves scene visibility. No full physics promise.

R resets character and follow camera. A view, M or Escape outside quiet stay restores observation.
Quiet stay freezes movement/orbit and keeps pose. Blur, cancellation, hidden pages, pagehide and
context loss clear held inputs; stale auto-repeat cannot resume walking. Foreground recovery
resets frame time. Gait/cape move only during actual walking; reduced motion removes easing.
Shadows update on changed walking poses and mode transitions, not every observation frame.

## Testing Decisions

Reuse the accepted running-browser seam: actual controls, rendered pixels, native tabs/audio and
visual PNG review. Root-only expectations fail against the prior production build first. Verify
root/legacy entry, traveler front/back, gait, keys/buttons, stairs, obstacles, orbit/zoom, quiet
and context recovery, multi-touch/cancellation and both phone orientations. Run hall, visit and
character journeys against the frozen production build. No production test pose setters.
Physical-device performance remains separate; no numeric CRAP/duplication/mutation gate exists.

## Out of Scope

No jump, flight, combat, scoring, avatar editor, automatic sit, imported assets, online movement
synchronization, new audio, accounts or storage. Backend and anonymous presence remain allowed
future directions, not forbidden capabilities or features claimed by this release.

## Further Notes

No commit, push, tracker publication or deployment is requested in this round. Earlier evidence
remains local history, not verification for the new single-space scope.
