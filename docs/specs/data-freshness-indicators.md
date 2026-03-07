# Feature: Data Freshness Indicators
**Status**: Approved
**Priority**: P0-Critical
**Date**: 2026-03-04
**Tier**: M

## Problem Statement

The dashboard displays a pulsing red "LIVE" dot in the header and positions itself as a real-time conflict tracker, but provides no visible indication of when data was last updated. The `lastUpdated` timestamp in `meta.json` is buried in the footer note (small text, end of page), and the nightly AI updater shows `lastRun: null` in `update-log.json`, meaning users may be looking at stale data while the header's live indicator signals freshness. Additionally, KPI cards display current values (e.g., "555 killed") with no directional context — users cannot tell if this figure increased overnight or has been unchanged for days.

For a conflict tracker covering an active military operation, this is a trust-breaking gap: the implicit promise of "live intelligence" must be backed by visible, honest freshness signals.

## Glossary

- **Data freshness**: The elapsed time between the displayed data's source date and the current moment
- **Staleness threshold**: The time after which data should be flagged as potentially outdated (proposed: 30 hours for an active conflict; 12 hours for P0-critical KPIs)
- **KPI delta**: The numeric or percentage change in a KPI value compared to the previous update cycle
- **Scroll spy**: JavaScript that tracks the user's scroll position and reflects the active section in the navigation

## Success Metrics

- Primary KPI: "Data age" is visible to 100% of users within the first viewport (no scroll required)
- Secondary KPI: Nav active-state accuracy — the correct nav item highlights as users scroll through each of 7 sections
- How measured: Manual verification post-deploy; visual audit on 3 viewport sizes (375px, 768px, 1440px)
- Staleness warning appears correctly when `lastUpdated` > 30 hours before current time (verifiable by temporarily setting `lastUpdated` to a past value)

## User Stories

### Story 1: Journalist checking data age
As a journalist using the dashboard as a reference source, I want to see immediately how recently the data was updated, so that I know whether to cite it or wait for a fresher update before publishing.

**Acceptance Criteria**

GIVEN I load the dashboard at any time of day
WHEN the hero section renders
THEN I see a visible "Last updated [time ago]" indicator (e.g., "Updated 4h ago") displayed near the hero dateline or KPI strip, above the fold on desktop (1440px) and mobile (375px)

GIVEN the data was last updated more than 30 hours ago (staleness threshold)
WHEN the freshness indicator renders
THEN it displays in amber color with an explicit "Data may be outdated" warning rather than the normal "Updated X ago" in muted text

GIVEN `meta.lastUpdated` equals the current day within the last 12 hours
WHEN the freshness indicator renders
THEN it displays in green with text "Updated today" and no warning state

### Story 2: Returning user tracking casualty figures
As a daily visitor, I want to see directional change arrows on KPI cards, so that I can immediately understand whether the situation has escalated, stabilized, or improved since my last visit.

**Acceptance Criteria**

GIVEN a KPI card has a `delta` field in the data (e.g., `+73` or `-2`)
WHEN the KPI strip renders
THEN I see a colored directional indicator below or beside the value: upward arrow in red (for worsening metrics like deaths), downward in green (for improving metrics), neutral dash if unchanged

GIVEN a KPI card has no `delta` field (field is absent or null)
WHEN the KPI strip renders
THEN no delta indicator appears — the card renders as before, without a placeholder

GIVEN I hover over a KPI delta indicator
WHEN the tooltip renders
THEN it shows "Changed since [previous update date]" so I understand the comparison baseline

### Story 3: Navigating a dense single-page dashboard
As a power user reading through multiple sections, I want the navigation to reflect which section I am currently in, so that I can orient myself and jump to a different section without scrolling back to the top.

**Acceptance Criteria**

GIVEN I have scrolled to any of the 7 dashboard sections
WHEN the section's top edge crosses the 30% mark of the viewport height
THEN the corresponding nav button in the sticky header changes to the `.active` visual state (white text, bordered background per existing CSS)

GIVEN I click a nav button
WHEN the page smooth-scrolls to that section
THEN the active state immediately updates to that section's button without waiting for the scroll to complete

GIVEN I scroll to the very top of the page (above the Timeline section)
WHEN no section is in view
THEN no nav button is in the active state

## Scope

### In Scope
- Freshness indicator component adjacent to the hero dateline or between Hero and KPI strip
- Staleness threshold logic (30h warning, amber color, explicit "may be outdated" copy)
- KPI schema extension: add optional `delta` field (string, e.g., "+73", "-2", "–") and optional `deltaNote` (string for tooltip)
- KPI card delta display (directional arrow + value, colored by metric type)
- Scroll spy: JavaScript that watches IntersectionObserver for section entries and updates nav active state
- "Updated X ago" computed from `meta.lastUpdated` — must be computed client-side (hydrated) since the time is relative to "now"

### Out of Scope
- Real-time WebSocket updates or polling (the site is static; updates are nightly batch)
- Per-section freshness indicators (only global last-update for now)
- Mobile navigation redesign (separate spec: `mobile-responsive-nav`)
- Changelog / "what changed today" view (separate spec: `what-changed-today`)
- Redesigning the tier color system to fix the red collision (separate decision)

## Non-Functional Requirements

- **Performance**: Scroll spy must use `IntersectionObserver` (not scroll event listener) to avoid jank. No measurable LCP or CLS regression.
- **Accessibility**: Freshness indicator must have appropriate `aria-live="polite"` region if it updates dynamically. Color-alone communication must be supplemented with text (staleness states must not rely only on amber/green distinction).
- **Progressive enhancement**: If JavaScript fails to hydrate, the page must still show the static timestamp from `meta.json` (no blank space where the freshness indicator should be). The static fallback is the `footerNote` string which already contains the timestamp.
- **Build validation**: Any changes to `KpiSchema` in `schemas.ts` must remain backward-compatible — `delta` and `deltaNote` are optional fields.

## Data Requirements

- **Input**: `meta.lastUpdated` (ISO 8601 string, already in data) — no new data file needed
- **Input change**: `kpis.json` schema addition — optional `delta: string` and `deltaNote: string` fields on each KPI object
- **Output**: Computed "time ago" string rendered client-side; KPI card delta display
- **Privacy**: No user data collected or stored. Time comparison is client-side only.
- **AI updater**: The nightly `update-data.ts` script should populate `delta` fields on each KPI based on the previous cycle's values. Implementation note for Forja: the script should save previous values before overwriting, then compute and write deltas.

## Business Rules

- Time-ago display format:
  - < 1 hour: "Updated X min ago"
  - 1–23 hours: "Updated Xh ago"
  - 24–47 hours: "Updated yesterday"
  - 48+ hours: "Updated X days ago" (amber staleness warning triggered)
- Staleness threshold: 30 hours from `lastUpdated` triggers amber warning. This is intentionally conservative — a nightly update cycle means 30h = one missed cycle.
- KPI delta direction semantics are metric-specific. The `delta` string is signed ("+73", "-2"). The color of the delta indicator is determined by context: for casualty KPIs, an increase is red; for an economic indicator like "Flights Cancelled" a decrease would be positive (green). Initially, all upward deltas on red/amber KPIs are red, all downward deltas are green. An explicit override field (`deltaPositiveIsGood: boolean`) can be added later.
- Scroll spy fires on `IntersectionObserver` with `threshold: 0.3` and `rootMargin: '-56px 0px 0px 0px'` (accounting for the 56px sticky header height).
- If `meta.lastUpdated` is absent or unparseable, the freshness indicator must show "Last update time unknown" rather than crashing.

## Constraints & Assumptions

- **Constraints**:
  - Site is static (Astro SSG) — freshness indicator must be a React island (client:load) to access `Date.now()` for relative time computation
  - Cannot change nightly update schedule (GitHub Actions is locked at 6 AM UTC)
  - Must not introduce any new npm dependencies if possible (use native IntersectionObserver API)
- **Assumptions**:
  - `meta.lastUpdated` will be correctly maintained by the AI updater once it runs
  - The `update-log.json` `lastRun: null` state is a setup gap (GitHub Action never configured with API key), not a code bug
  - KPI delta values will initially be manually authored in the JSON until the AI updater is extended to compute them

## Dependencies

- **Technical**: `KpiSchema` in `src/lib/schemas.ts` — delta fields must be added as optional
- **Technical**: `KpiStrip.astro` — currently a static Astro component; if delta display requires "time ago" it must either stay static (with pre-computed delta strings) or become a React island for relative-time. The KPI delta string itself ("+73") can be static; only the freshness "X ago" needs hydration.
- **Data**: Nightly `update-data.ts` script must be extended to write delta values (P1 dependency — can launch without deltas in data, adding "–" as the default)
- **Business**: Staleness thresholds (30h) need sign-off; could be debated if the conflict is static for a period

## Risks & Rollback

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scroll spy causes layout jitter or performance issues | Low | Medium | Use IntersectionObserver with debounce; test on low-end device |
| Staleness warning triggers incorrectly (timezone issues in ISO comparison) | Medium | High | Always compare in UTC; add unit tests for boundary conditions |
| Adding delta fields to KPI schema breaks existing AI updater | Low | Medium | `delta` is optional in schema; updater will pass validation even if it doesn't write the field |
| "Updated X ago" is client-computed, so SSG prerender shows placeholder | Low | Low | Render the static timestamp as fallback text; JS replaces with relative form |

- **Rollback criteria**: If staleness warning triggers incorrectly and shows amber state when data is fresh (hurting credibility), revert the threshold logic. The freshness indicator itself (showing a static timestamp) is safe to keep.

## Open Questions

1. Where exactly should the freshness indicator live? Options: (a) next to the hero dateline, (b) between Hero and KPI strip, (c) inside the sticky header next to the live dot. Option (c) would make it always visible — preferred.
2. Should the "LIVE" dot in the header change color based on staleness? Red when fresh, amber when stale, gray when > 48h stale? This would be a strong signal but could confuse users who associate "red" with active conflict status rather than data freshness.
3. Should delta direction for economic metrics be inverted automatically, or should the `deltaPositiveIsGood` field be launched in this sprint?

## Testing Considerations

- **Critical test paths** (ranked by failure probability x business impact):
  1. Staleness threshold boundary: set `lastUpdated` to exactly 29h ago → green/neutral; 31h ago → amber warning. Wrong boundary = false credibility signal (highest business risk).
  2. Scroll spy accuracy: rapidly scroll through all 7 sections and verify nav active state matches visible section. Failure = user confusion and loss of trust in nav.
  3. `meta.lastUpdated` parse failure: set field to empty string or invalid ISO → must show "unknown" gracefully, not throw or blank.
- **Test data needs**: A test fixture with `lastUpdated` set to specific relative timestamps (1h, 12h, 30h, 48h ago). Since time is relative to "now", tests should mock `Date.now()`.
- **Non-functional concerns**: Scroll spy performance on mobile (IntersectionObserver is fine; scroll listener is not acceptable). Accessibility audit on freshness indicator for screen reader (`aria-live` region if dynamic).
