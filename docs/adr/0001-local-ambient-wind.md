# ADR-0001: Generate optional ambient wind locally

Status: accepted

## Context

Book Mountain needs optional soft ambient sound while remaining a private static site. A visitor
must not receive autoplay or retain a previous sound preference on the next load. Audio failures
must not make the three-dimensional space unavailable.

## Decision

Use one lazily created Web Audio graph. A seeded noise buffer loops through low/high-pass
filters and a low-gain output. The first explicit sound request creates it; subsequent requests
reuse it. Serialized reconciliation converges to the most recent requested state. Mute fades
briefly before suspension; a hidden page sets gain to zero and suspends immediately. Disposal
closes the context. Audio failure restores the off state and displays a page notice.

No audio file, stream, third-party request or stored preference is involved. The name lakeside
wind describes a synthesized atmosphere, not an authentic recording from the library.

## Alternatives

A recording gives a more natural sound and can capture the real location. It introduces asset
licensing, provenance, download size and a source that this prototype does not have. A stream
also adds network requests and availability dependencies. Local synthesis keeps those concerns
outside the site and gives sound a bounded lifecycle.

Persisting sound preference reduces repeated clicks. It can surprise a returning visitor and
conflicts with silent initial load, so each new page starts off.

## Consequences

Sound remains opt-in and inexpensive to ship. The browser must support Web Audio and permit a
user-activated context. The result is deliberately simplified wind rather than a field recording.
Output-state measurements verify signal generation, not a visitor's speaker level or perception.
