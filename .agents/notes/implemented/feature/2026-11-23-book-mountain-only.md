# Agent Note: Book Mountain is the sole shipped space

Status: implemented

## Problem

The latest user request removes the night reading room while retaining Book Mountain and its
third-person avatar. Leaving the root pointed at the old room, or retaining two authoritative
entry shells and test journeys, would preserve a product the user explicitly rejects.

## Decision

Book Mountain opens at the root. The former hall URL is a small refresh/fallback-link redirect,
not another scene bundle. Night-room-only runtime, scene, look and post-processing source is
removed. The local lighting sample, reference photographs and ignored evidence remain intact.
The hall's architecture, daylight/dusk settings and optional wind are retained.

This supersedes the two-space navigation portion of the
[complete visit](2026-11-23-complete-quiet-visit.md), not its rendering lifecycle, quiet focus,
silent-load audio or correction of the invented static-only restriction. Backend and anonymous
co-presence remain valid later directions with their own contracts, not current claims.

The [walking visitor](2026-11-23-third-person-visitor.md) retains exclusive camera/input
ownership and scene-derived floor support in the only remaining scene. Its original cape
design takes visual cues from the small rounded visitors on [Sansa Temple](https://sansatemple.com/)
and the soft cloaked silhouettes on [Sky's official site](https://www.thatskygame.com/).
Reference screenshots and the official Sky image remain ignored study material, never shipped
assets. The independently operated sansatemple.net site is not the original site's authority.

## Alternatives considered

Keep the night room accessible but unlink it. This preserves old bookmarks cheaply, but still
ships the rejected second space and its source/test obligations. Remove it from the application;
preserved local samples already provide historical reference.

Copy the full hall shell to both URLs. This avoids a redirect, but creates two entry copies
that can drift and implies two maintained surfaces. One root shell plus a tiny compatibility
redirect keeps old hall bookmarks useful without retaining another product route.

Delete the lighting/reference trees too. This would reduce local clutter, but they are not
shipped runtime and removing them loses accepted reference material without a user request.

## Consequences

Product entry, source and browser verification now agree on one space. Old hall bookmarks
remain usable. Night-room compatibility is intentionally not promised; sample history remains
local. Hall, visit/recovery and character journeys are still separate gates at the same real
browser seam, with no production pose setters or unmeasured hardware claims.

The frozen production build passes typecheck and build. The current single-space journeys are
VERIFIED: 25 hall actions, 25 visit/recovery actions and 27 character actions, with no reported
errors. The hall's final native leg passes four audio actions and actual quiet/walking tab
lifecycle checks. Root observation, daylight/dusk and traveler/phone captures are visually
reviewed. This round does not establish physical-phone performance or add a new long-stay soak.
