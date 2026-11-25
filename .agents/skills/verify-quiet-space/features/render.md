# Book Mountain entry and rendering

## Sub-features

Root entry, legacy redirect and visible colored architecture, without a night-room route.

## How to get to it (user POV)

Open `/`. An old `prototype-hall.html` bookmark redirects to the same Book Mountain root.

## Driving it with Playwright

The hall helper opens the root, verifies the Book Mountain heading, nonblank WebGL and absence
of a return-night link. Character's `--entry-only` also navigates the old URL, observes the
actual redirect, waits for rendered readiness and saves a capture. Errors fail the report.

## Gotchas

A canvas or HTTP 200 alone proves nothing. Read displayed pixels and saved PNGs. The legacy
HTML has a refresh and fallback link, not a second maintained scene shell or character bundle.
