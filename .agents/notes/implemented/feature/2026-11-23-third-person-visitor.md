# Agent Note: Walking has one local person and exclusive camera ownership

Status: implemented

## Problem

Book Mountain supports observing a view but needs a visible controllable person. Adding
one can accidentally preserve the old camera controller's writes, invent a second floor map,
or replay held movement after quiet stay and rendering recovery. Book Mountain has curved floors, actual stair treads and a static observation-shadow lifecycle.

## Decision

Walking is an explicit Book Mountain mode. An original small traveler has a pearl hood, dark
mask, luminous eyes, short limbs and a clay cape with pale hem. Rounded proportions and a quiet
stance reference Sansa Temple; soft cloak silhouettes reference Sky without importing either
product's assets or copying cosmetics/emblems. Articulated gait and cape motion follow actual
movement, with no idle bob or extra character lights.
Observation remains the default; leaving walking restores its selected preset and hides the
person and direction pad. The pad's authored grid display explicitly honors its hidden attribute;
otherwise browser-default hidden styling loses to the grid rule and leaves inactive arrows
visible during observation. The original view values, geometry, lighting and opt-in audio are retained.

The active controller exclusively owns the camera and canvas input. Walking supports camera-
relative normalized WASD/arrows, held directional buttons, orbit and bounded distance. Actual
floor and solid meshes come from the hall scene builders. Foot support, limited climb/drop and
subdivided body sweeps block obstacles and unsupported edges; hall treads supply stair height.
The center support ray and maximum climb/drop remain bounded by one step. Footprint edge rays
can see two step heights below the body: a 0.5 m footprint spans two 0.15 m risers, so requiring
every edge sample to lie within the center's single-step ray length falsely stops the second
tread. The center still rejects unsupported drops; wider edge sampling adds no ramp or floor map.
The follow camera shortens against those same surfaces. This is bounded walking, not a full
rigid-body simulation or arbitrary climbing.
Within body clearance, the person fades rather than filling the lens with a clothing surface.
Its position persists, and opacity returns as soon as the camera has clearance. Normal walking
and observation retain opaque material rendering.

The render loop supplies active-frame elapsed time. Walking bounds that time at 250 ms and
subdivides movement; foreground recovery never accumulates a teleport. Hidden/context recovery
resets the loop clock rather than accumulating a teleport. Hall shadows update for changed
person poses and on mode transitions, while ordinary observation retains static shadow ownership.

Quiet stay freezes the walking person and camera. Release, cancellation, lost capture, blur,
hidden pages and rendering loss clear held input. Auto-repeated keys not already held cannot
start a new walk after resumption. A fresh press can. This retains the lifecycle foundation of the
[complete visit](2026-11-23-complete-quiet-visit.md) under the
[Book Mountain-only scope](2026-11-23-book-mountain-only.md), without changing quiet observation into
an automatic sit animation, or undoing its allowance for future backend/shared-presence work.

## Alternatives considered

Import a rigged character and physics engine. This offers more realistic animation and general
collision, but introduces asset provenance and a broad toolchain for a bounded quiet walk.
Local articulated geometry and scene-derived support are enough for this increment; imported
models and stronger physics remain possible later.

Use camera-only free flight. It reuses existing look controls cheaply, but supplies neither a
visible modeled person nor grounded third-person movement, so it does not satisfy the request.

Keep both camera controllers active. It minimizes entry edits, but makes two writers overwrite
the same pose and leaves captured gestures alive across mode changes. Explicit input/camera
ownership is smaller than reconciling two simultaneous controllers.

Duplicate a collision map from architectural dimensions. It makes simple rectangles easy,
but curved book walls, furniture and actual stair heights drift from the rendered scene.
Scene builders provide references to the meshes they already construct instead.

Shrink the footprint or replace the stairs with a hidden ramp. Either can bypass short edge
rays, but the former weakens body clearance and the latter duplicates the rendered terrain.
Keep body radius and center climb/drop limits; allow edge rays to span neighboring real treads.

## Consequences

Book Mountain can be inhabited on desktop or a touch browser, without new audio, accounts,
network synchronization or position persistence. Moving hall shadows add rendering work;
software-browser screenshots cannot establish phone frame rate, battery or comfort. The body
sweep is deliberately bounded and does not promise climbing, jumping or full capsule physics.
The real-browser verification boundary remains the owning test seam, not exported scene setters.

The final production character journey is VERIFIED with 27 recorded actions and no errors,
including front/back appearance, real stairs and obstacles, observation reversal, touch and
rendering recovery. Focused stairs evidence closes the short edge-ray defect; before/after entry
evidence closes the visible hidden-pad defect. The final hall native leg also proves hidden-frame
cancellation, four unchanged stale-repeat samples and movement after a fresh key press. These
checks do not measure physical-phone performance or claim a new long-stay soak.
