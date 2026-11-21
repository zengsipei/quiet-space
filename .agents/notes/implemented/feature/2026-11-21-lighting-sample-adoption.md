# Agent Note: The accepted lighting sample supplies the root reading room

Status: implemented

## Problem

The original root page has no complete scene implementation. The working lighting sample and the
subsequent Book Mountain and quiet-stay work remain outside Git history. Acceptance needs a
reproducible static site without redesigning the approved look or losing those existing changes.

## Decision

The root reading room uses the accepted sample's procedural room, furniture, four camera presets,
look controls, bloom and grade. Its approved lighting combines a cool lake-wall and roof wash with
a warm desk lamp, while its atmospheric layer supplies haze and dust motes. The original `proto/`
sample remains a separate reference with its own toolchain, as the repo's layout requires.

The root Vite build also contains the independently reachable Book Mountain page and its existing
quiet-stay controls. These pages share the root dependency graph, build configuration and entry
link, so they land as one green integrated unit rather than an incomplete intermediate snapshot.
The geometry and quiet-stay decisions remain in the
[Book Mountain note](2026-11-20-north-library-book-mountain.md) and
[quiet-stay note](2026-11-21-quiet-stay.md).

Landing cleanup removes inherited source comments and pins root development dependencies to the
already resolved lockfile versions. It changes no scene parameters, camera presets or audio logic.
Browser verification observes real page controls and displayed WebGL pixels, with retained root
and hall screenshots; the hall journey also verifies native audio output and tab lifecycle.

## Alternatives considered

Keeping the sample only under `proto/` preserves an isolated experiment and avoids adopting its
source into the root app. It leaves the site's existing root script without its complete scene,
which does not satisfy the user's acceptance of the sample as the reading-room implementation.

Committing only the night-room files gives a narrower history entry. The current two-entry build,
root link and shared dependency graph already integrate the approved hall work. Splitting them
without rewriting the working snapshot produces an incomplete unit, so the integrated site lands
together and the commit body records that coupling.

## Consequences

The repository now contains the working static reading spaces and the commands that verify them.
The reference and root scene deliberately retain similar code; retaining the original reference
is more valuable here than changing the approved look to eliminate that duplication. Reference
photographs, browser captures and run logs stay ignored and local. Verification establishes the
rendered look and controls on this host, not physical-device performance or a deployment.
