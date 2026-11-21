# North Library Book Mountain prototype

## Problem Statement

quiet-space needs a recognizable, explorable model of the outer Book Mountain hall in the north
Tianfu Library of Humanity and Art. The existing draft has shallow concentric steps and camera
presets that place the observer outside the hall. It misses the reference's defining relationship
between high, undulating book walls, reading terraces, stairs, and the lake-facing curtain wall.

## Solution

Build a daylight, procedural three.js prototype of this one hall. Five curved reading platforms
step away from the lake; six-row book walls and undulating parapets form the artificial terrain.
Two stair lanes cross the terraces. A tall rear book wall, slender white columns, a gently rising
ceiling, reading furniture, interior trees, and a glazed lake view establish the hall's scale.
Keep the independently reachable prototype and add a reading-room entry to it.

## User Stories

- As a visitor, I can open the prototype and recognize the library's terraced Book Mountain.
- As a visitor, I can select 全景, 阶地, 书山, 书墙, and 湖窗 using buttons or keys 1 through 5.
- As a visitor, I can drag to look around, zoom with a wheel or pinch, and restore my selected view.
- As a phone visitor, I can reach every view and reset control in portrait and landscape.
- As a reviewer, I can compare saved browser captures with the cited photographs.

## Implementation Decisions

The data shape is an ordered set of reading tiers: index, elevation, inner radius, outer radius,
and lower elevation. A shared angle-to-radius profile keeps neighboring platforms and book walls
aligned. Book walls have a base elevation, shelf row count, and a crest profile; angular spans
reserve stair lanes. Shelf frames, books, chair parts, leaves, and repeated context objects share
instanced geometry. A seeded generator fixes placement and color choices.

Approximate outer-hall dimensions use a 70-unit glazing radius, five 5-unit platforms, 1.8-unit
terrace rises, and a ceiling rising from 10 to 16 units. These are model parameters inferred from
photographs, not surveyed building dimensions. The reference's 5.1-meter inner-area floor height
does not establish the heights of these outer terraces.

Navigation places the camera at the preset's actual position, rotates the viewing direction while
dragging, and changes field of view to zoom without moving through shelves. Its state belongs to
the prototype. Rendering uses stable daylight and direct tone-mapped WebGL; the prototype does
not need the night scene's animated post-processing chain.

## Testing Decisions

The single verification seam is the running browser page: its links, accessible buttons, input
gestures, and displayed WebGL pixels. Use the existing page boundary rather than exposing scene
internals. Prove the helper before implementation. Capture at 1440 × 900, then drive portrait and
landscape touch contexts. Assert nonuniform rendered pixels, five distinct camera results,
equivalent button and keyboard views, working drag/zoom/reset, fitted controls, and no browser
errors. Typecheck each coherent source edit; build the frozen result and drive its production
preview. Review the actual images against the supplied reference separately from operational
browser checks.

## Out of Scope

The south contemporary art museum, underground shared spaces, inner stacked reading rooms,
special collections, exterior roof landscaping, exact CAD reproduction, free walking, collision
simulation, and a backend are outside the initial release. Reference photographs are retained as
local evidence and are not shipped as scene textures.

## Further Notes

The architectural source is the designer-supplied article at
https://www.gooood.cn/chengdu-museum-of-contemporary-art-tianfu-library-of-humanity-and-art-china-southwest-architectural-design-and-research-institute-corp.htm
and its terraced Book Mountain, night-interior photographs, plan, and section. The model captures
their spatial relationships while making its scale and profiles editable. The implementation is
one complete local tracer bullet, 01-book-mountain, with no blockers after the browser baseline.
