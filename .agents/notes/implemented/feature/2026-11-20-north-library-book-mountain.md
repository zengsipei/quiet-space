# Agent Note: North library Book Mountain as a bounded architectural prototype

Status: implemented

## Problem

The library's identity depends on high, winding book walls, stepped reading platforms and a
panoramic lake-facing hall. Shallow circular steps and exterior camera placements cannot express
that relationship. The first release needs a recognizable model without claiming surveyed accuracy
or expanding to the neighboring art museum.

## Decision

The prototype models the north library's outer Book Mountain hall in daylight. Five reading
terraces share a radial terrain profile; intermediate walls carry six shelf rows, a solid wave
crest, and closed ends. Two stair lanes cross the terraces. A tall rear collection wall, white
columns, a rising canopy, reading furniture and interior trees complete the hall. The glazing opens
onto simplified lake, park and skyline context.

The model interprets the designer-supplied photographs and section. Its scale and crest profiles
are adjustable approximations. The inner reading area's documented 5.1-meter floor height does
not determine the outer terrace heights. Reference photographs remain local evidence rather than
distributed textures.

Five interior camera presets expose the hall, terraces, Book Mountain, rear book wall and lake
window. Drag changes the viewing direction; wheel and pinch change field of view while keeping
the camera inside the hall. Reset restores the selected preset. The navigation state belongs to
this prototype, and the existing reading room provides a link to it.

## Scope

- `src/prototype-hall`

## Alternatives considered

Keeping the shallow concentric draft offers the smallest implementation change. It loses the
reference's six-row bookcase faces, undulating parapets and stair circulation, so it cannot satisfy
the architectural goal.

A surveyed or imported mesh would offer stronger geometric fidelity. No such model accompanies
the reference, and constructing that asset first would move the initial release beyond the supplied
photographic evidence. Procedural profiles keep its assumptions visible and editable.

Sharing the reading room's look controller minimizes control code. Its preset orientation mirrors
the camera position, and a global correction would change the existing room. Prototype-local
navigation gives this hall stable interior viewpoints without expanding the change's surface.

OrbitControls provides established orbit and zoom gestures. Orbiting around a target can place
the observer through the book walls or outside the hall. Fixed-position look and bounded field-of-view
zoom fit these deliberately chosen observation points.

## Consequences

The initial scene is recognizable and independently explorable while retaining a small, static
site. A shared terrain profile aligns platforms, shelves, circulation and furniture; repeated
books and furniture use instanced geometry. Fixed daylight avoids the night scene's animated
post-processing cost and makes camera evidence repeatable.

The dimensions, skyline, furniture and tree forms are interpretations. The prototype does not
provide free walking or exact drawing reproduction. A future surveyed model can replace the
geometry without changing the page's camera choices or navigation contract. Verification uses
the [browser evidence decision](../testing/2026-11-20-browser-verification.md).
