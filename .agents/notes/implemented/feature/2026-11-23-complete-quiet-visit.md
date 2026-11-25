# Agent Note: A complete quiet visit does not impose a static-only product boundary

Status: implemented

## Problem

The night room's accepted look is usable as a scene but its keyboard-only views exclude phone
visitors from the complete controls. Quiet stay exists only in Book Mountain, which lacks a
direct return link. A prior recommendation also mistakes the current backend-free implementation
for a permanent product constraint; the user explicitly corrects that premise.

## Decision

The two-space navigation described below is superseded by
[Book Mountain only](2026-11-23-book-mountain-only.md). The current release retains this note's
lifecycle, quiet-focus and backend-scope correction, not its retired night-room route.

Both existing spaces provide a complete visit without redesigning their geometry or lighting.
The root has visible view buttons, reset and quiet stay; the hall has a return link. Quiet stay
hides and makes its shell inert, retains the camera, and restores focus on exit. Root look
controls support two-pointer zoom and cancelled pointers while preserving the preset poses.
Book Mountain retains its optional local wind, daylight/dusk and established controls.

Current client-only behavior is an implementation snapshot, not a static-only requirement.
Backend services and real anonymous co-presence remain allowed next increments. Their data,
privacy, disconnect and two-client verification contracts must describe the actual service,
not inherit promises from a prototype. This correction changes no service or collection behavior
in the current release and does not turn a future feature into an implemented one.

One shared browser-lifecycle render loop pauses scheduling on hidden pages, pagehide and
explicit context-loss suspension, and resets delta timing on resume. Scene-specific callbacks
retain their prior delta limits and lighting. Readiness follows an actual rendered frame.
Rendering failure/context loss presents a reload link; restoration retains scene/view/quiet
state. Hall audio also suspends while its renderer is unavailable and respects prior opt-in.

Reduced motion freezes night-room decorative time and grain while deliberate look and zoom
remain available. Normal-motion scene/light/bloom/grade settings remain the accepted ones.
The behavior extends the [existing quiet-stay decision](2026-11-21-quiet-stay.md), rather than
replacing its camera/presentation separation, and preserves the
[lighting adoption](2026-11-21-lighting-sample-adoption.md).

## Alternatives considered

Treat static hosting as a permanent requirement. That matches the present build but invents
a product constraint the user rejects. Describe the current release precisely and allow a
service-backed increment under its own contract instead.

Start with anonymous multiplayer. It would directly supply shared presence but skip the
accepted complete-visit increment and its inconsistent phone/root controls. Multiplayer is
allowed, not implemented by this release; the next increment can focus on its real behavior.

Merge scene renderers and navigation into a common framework. It can reduce apparent duplication,
but mixes different coordinate systems and lighting. Share only scheduling/lifecycle; each
scene retains its own camera, decoration and visible controls.

Assume browser throttling is sufficient. Hidden animation callbacks may be suspended, but an
outstanding request is not explicit application ownership, and context loss needs user feedback.
Cancel owned scheduling and resume deliberately, with native-browser evidence at that boundary.

## Consequences

The two places form a usable quiet visit with discoverable phone controls. Reload and space
navigation start fresh; within a stay, quiet mode and recovery preserve framing. No timer,
progress counter, automatic camera travel or new audio autoplay is added. The verification route
is the [real browser boundary](../testing/2026-11-20-browser-verification.md). Phone-shaped
browser operation and stay evidence do not establish real-phone energy use or frame rate.
Backend/presence work is no longer incorrectly excluded from the product, but remains a separate
future implementation with truthful visitor-facing claims.

## Verification

Typecheck and production build pass. The final production-browser gates are VERIFIED: 25 hall
captures, four native audio actions with root hidden/foreground quiet-framing recovery, and
27 complete-visit captures, all without browser errors. The visit includes 15 emulated-phone
samples over 903785 ms. Real-phone frame rate, battery, temperature and comfort remain unmeasured.
Standards and Spec reviews have zero open findings; Notes and artifact gates pass. These results
verify the complete visit, not a backend or shared-presence feature.
