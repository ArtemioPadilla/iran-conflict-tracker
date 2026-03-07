# Technical Debt Register

Last updated: 2026-03-04 by Centinela (QA Agent)

## Format

| ID | Severity | Title | File(s) | Impact | Effort | Status |
|---|---|---|---|---|---|---|

---

## Active Items

| ID | Severity | Title | File(s) | Impact | Effort | Status |
|---|---|---|---|---|---|---|
| TD-001 | P2 (Medium) | `tierClass` / `tierLabel` duplicated in 4 / 3 files | `TimelineSection.tsx`, `MilitaryTabs.tsx`, `map-helpers.ts`, `tier-utils.ts` | Logic drift on tier label changes | Low | Open |
| TD-002 | P2 (Medium) | `constants.ts` never imported — orphaned module | `src/lib/constants.ts` | Silent drift of NAV_SECTIONS and MIL_TABS | Low | Open |
| TD-003 | P2 (Medium) | `generateSparkline` division by zero with 1-element array | `src/lib/map-utils.ts:8` | Invisible sparkline SVG if AI returns single data point | Low | Open |
| TD-004 | P2 (Medium) | Deploy fires even on failed nightly update | `.github/workflows/deploy.yml:7–9` | Unnecessary build triggered; could expose partial data | Low | Open |
| TD-005 | P2 (Medium) | `set:html` on AI-generated `heroHeadline` — XSS risk | `src/components/static/Hero.astro:12` | Build-time XSS injection via compromised AI response | Medium | Open |
| TD-006 | P3 (Low) | `dotColor` field unused in `MapCategory` interface | `src/lib/map-utils.ts:20–27` | Dead data confuses contributors | Low | Open |
| TD-007 | P3 (Low) | `ACTIVE_IDS` hard-coded in LeafletMap — breaks if point IDs change | `src/components/islands/LeafletMap.tsx:38` | Silent regression when `map-points.json` IDs change | Low | Open |
| TD-008 | P3 (Low) | Hormuz blockade hard-coded — not updatable by AI script | `src/components/islands/LeafletMap.tsx:40–43` | Map feature can't be deactivated without code change | Medium | Open |
| TD-009 | P3 (Low) | MilitaryTabs date range label is hard-coded | `src/components/islands/MilitaryTabs.tsx:57` | Date shows "Feb 28 – Mar 2" forever regardless of data updates | Low | Open |
| TD-010 | P3 (Low) | `attributionControl={false}` violates Carto ToS | `src/components/islands/LeafletMap.tsx:56` | Legal/ToS compliance risk | Low | Open |
| TD-011 | P3 (Low) | `.env` not in `.gitignore` | `.gitignore` | Risk of accidental credential commit | Low | Open |
| TD-012 | P3 (Low) | `EconItemSchema.sparkData` has no `min(2)` constraint | `src/lib/schemas.ts:88` | Invalid sparkline data passes Zod but breaks SVG rendering | Low | Open |
| TD-013 | P3 (Low) | `writeFileSync` in update script is non-atomic | `scripts/update-data.ts:67` | Partial write on crash leaves corrupt JSON | Medium | Open |
| TD-014 | P3 (Low) | No test framework or test coverage | Entire codebase | Regressions undetected; blocks release readiness | High | Open |
| TD-015 | P3 (Low) | No CHANGELOG.md | Root | Release tracking impossible | Low | Open (partially resolved — CHANGELOG needed) |

| TD-016 | P1 (High) | Re-render storm at max playback speed (86400x) — `setCurrentDate` on every RAF frame | `CesiumGlobe.tsx:149` | 60 re-renders/sec at max speed, entity churn, visible frame drops | Low | Resolved |
| TD-017 | P2 (Medium) | `dayToDate()` uses local timezone but `dateToDay()` uses UTC — off-by-one on UTC± boundaries | `CesiumTimelineBar.tsx:45–49` | Users in UTC+N timezones get wrong date on slider scrub near midnight | Low | Open |
| TD-018 | P2 (Medium) | `activeCount` return from `useMissiles` is dead — hook returns a value never consumed | `useMissiles.ts:208`, `CesiumGlobe.tsx:296` | Silent API contract violation; count is always stale | Low | Open |
| TD-019 | P2 (Medium) | `null as any` type coercion in `MissileAnimation` init — type safety gap | `useMissiles.ts:115–116` | If exception between init and assign, null entity enters animationsRef | Low | Open |
| TD-020 | P3 (Low) | `creditDiv` and `Camera.DEFAULT_VIEW_RECTANGLE` set at module scope — breaks SSR and multi-viewer | `CesiumGlobe.tsx:44,54` | Would throw in SSR context; affects all Cesium viewers globally | Low | Open |
| TD-021 | P3 (Low) | Prev/next navigation buttons give no feedback at timeline boundaries | `CesiumTimelineBar.tsx:129–148` | Silent no-op confuses users at first/last event date | Low | Open |
| TD-022 | P3 (Low) | Magic number `43_200_000` (noon offset) duplicated in CesiumGlobe | `CesiumGlobe.tsx:112,187` | DRY violation; easy to update one but miss the other | Low | Open |

---

## Resolved Items

| ID | Severity | Title | File(s) | Resolution | Date |
|---|---|---|---|---|---|
| TD-016 | P1 (High) | Re-render storm at max playback speed (86400x) | `CesiumGlobe.tsx:113,148-154` | Throttled `setCurrentDate` to max 5Hz (200ms) via `lastDateUpdateRef` | 2026-03-07 |
