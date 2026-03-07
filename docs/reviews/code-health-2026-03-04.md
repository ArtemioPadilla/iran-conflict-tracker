# Code Health Scan: Iran Conflict Tracker
**Date**: 2026-03-04
**Reviewer**: Centinela (QA Agent)
**Scope**: Full codebase — `src/`, `scripts/`, `.github/workflows/`, config files

## Summary

The codebase is architecturally sound and builds cleanly. The primary quality concerns are a complete absence of automated tests, four instances of duplicated utility functions (DRY violations), one unused constant module, and one unused struct field. No critical bugs were found.

---

## Findings

### Critical (must fix before merge)

None.

### Warning (should fix)

- **[W-1] Duplicated `tierClass` / `tierLabel` functions across four files**
  - Files:
    - `src/components/islands/TimelineSection.tsx:4–9` — local private copies
    - `src/components/islands/MilitaryTabs.tsx:10–16` — local private copies
    - `src/components/islands/map-helpers.ts:13–15` — exported copy
    - `src/lib/tier-utils.ts:1–15` — canonical exported copy
  - Impact: Logic drift. If tier labels change, three files must be updated manually. This already caused a divergence: `MilitaryTabs` uses abbreviated labels ("T1"–"T4") while `TimelineSection` uses full words and `tier-utils` uses "Official"/"Major" etc.
  - Fix: Delete local copies in `TimelineSection.tsx` and `MilitaryTabs.tsx`. Import `tierClass` from `../../lib/tier-utils` (or `map-helpers.ts`). The `map-helpers.ts` copy should also be removed and replaced with a re-export from `tier-utils`.

- **[W-2] `src/lib/constants.ts` is never imported — dead module**
  - Files: `src/lib/constants.ts`
  - Impact: `NAV_SECTIONS` is redefined inline in `Header.astro:10–18`; `MIL_TABS` is redefined inline in `MilitaryTabs.tsx:4–8`. The constants file was presumably created to be the single source of truth but is not used.
  - Fix: Import `NAV_SECTIONS` from `../../lib/constants` in `Header.astro`. Import `MIL_TABS` from `../../lib/constants` in `MilitaryTabs.tsx`. Remove the inline redefinitions.

- **[W-3] `generateSparkline` has a division-by-zero edge case (1-element array)**
  - File: `src/lib/map-utils.ts:8`
  - Code: `const x = (i / (data.length - 1)) * w;` — when `data.length === 1`, this produces `NaN`.
  - Impact: If the AI update script ever produces an `econ.json` entry with a single `sparkData` element, the SVG `<polyline>` will render with `NaN` coordinates, producing an invisible sparkline rather than an error.
  - Fix: Add a guard: `if (data.length === 1) return \`0,${h / 2} ${w},${h / 2}\`;` — render a flat midline for single-point data.

- **[W-4] `dotColor` field in `MapCategory` interface is unused dead data**
  - File: `src/lib/map-utils.ts:20–27`
  - Impact: Minor confusion and maintenance overhead; color is sourced from `color` everywhere.
  - Fix: Remove `dotColor` from the `MapCategory` interface and all four `MAP_CATEGORIES` entries.

- **[W-5] `EconItemSchema` has no `min(2)` constraint on `sparkData` array**
  - File: `src/lib/schemas.ts:88`
  - Current: `sparkData: z.array(z.number())` — allows empty array or single element.
  - Impact: An AI-generated `econ.json` with zero or one data point will pass Zod validation but break the sparkline SVG rendering (see W-3).
  - Fix: Change to `sparkData: z.array(z.number()).min(2)` to enforce at least two data points.

- **[W-6] Deploy workflow triggers on ALL nightly update completions, including failures**
  - File: `.github/workflows/deploy.yml:7–9`
  - Code: `types: [completed]` — does not filter for `success` conclusion.
  - Impact: If the nightly data update fails midway (partial write to `src/data/`), the deploy workflow still fires and may publish a partially-updated or schema-invalid dashboard (though Zod validation during build would catch schema failures).
  - Fix: Add `if: ${{ github.event.workflow_run.conclusion == 'success' }}` as a job-level condition on the deploy job.

- **[W-7] `TimelineSection.tsx` source links fall back to `#` when URL is absent**
  - File: `src/components/islands/TimelineSection.tsx:63`
  - Code: `href={s.url || '#'}`
  - Impact: Clicking a source with no URL silently navigates to `#` — confusing UX. An `<a>` with `href="#"` also submits a history entry.
  - Fix: Render as a `<span>` instead of an `<a>` when `s.url` is not present.

### Suggestion (consider)

- **[S-1] `update-data.ts` is 483 lines — consider splitting into per-section modules**
  - The file contains 9 independent updater functions plus bootstrap logic. Splitting into `src/updaters/*.ts` would improve discoverability and make testing individual sections easier.

- **[S-2] Hard-coded `ACTIVE_IDS` set in `LeafletMap.tsx`**
  - File: `src/components/islands/LeafletMap.tsx:38`
  - `const ACTIVE_IDS = new Set(['tehran', 'lincoln'])` — map point IDs are data concerns, not component concerns. This will break silently if the IDs in `map-points.json` change.
  - Suggestion: Add an `active?: boolean` field to `MapPointSchema` (already optional-but-unused in the schema) and use it here.

- **[S-3] Hard-coded Hormuz blockade line in `LeafletMap.tsx`**
  - File: `src/components/islands/LeafletMap.tsx:40–43`
  - The blockade is hard-coded coordinates that cannot be updated by the AI nightly script. Should be driven from `map-lines.json`.

- **[S-4] MilitaryTabs date range label is hard-coded**
  - File: `src/components/islands/MilitaryTabs.tsx:57`
  - `"Feb 28 – Mar 2"` — this does not update with the nightly data refresh.
  - Suggestion: Add a `lastUpdated` field to military data or source it from `meta.json`.

- **[S-5] `MIL_TABS` `as const` type prevents use of `constants.ts` export without re-typing**
  - Both `constants.ts` and `MilitaryTabs.tsx` define `MIL_TABS as const`. When consolidating (see W-2), ensure the component imports the typed version.

---

## Dead Code Scan

| Category | Findings |
|---|---|
| Unused imports | 0 — all imports are consumed |
| Unused functions | `dotColor` field never accessed in `MapCategory` interface (W-4) |
| Unused modules | `src/lib/constants.ts` is never imported (W-2) |
| Commented-out code | 0 blocks found |
| Unreachable code | 0 found |
| Duplicate logic | `tierClass` defined in 4 places; `tierLabel` defined in 3 places; `MIL_TABS` defined in 2 places; `NAV_SECTIONS` defined in 2 places (W-1, W-2) |

---

## Code Quality

- **Clean Code**: Function sizes are generally excellent — all under 30 lines. Naming is clear and consistent. The main violation is DRY (W-1, W-2).
- **Code smells found**:
  - Primitive obsession: tier represented as `number | string | 'all'` across different schemas and utilities with no unified type.
  - Feature envy: `LeafletMap.tsx` reaches into map point domain logic (deciding which IDs are "active") via hard-coded set.
- **Refactoring suggestions**:
  - Extract Method: `arcPositions()` in `LeafletMap.tsx` is clean and could be moved to `map-helpers.ts` for reuse.
  - Consolidate: Merge `map-helpers.ts` into `tier-utils.ts` + `map-utils.ts` — the file adds a thin layer with no clear conceptual boundary.

---

## Architecture Compliance

- **Dependency direction**: Clean. Data schemas (`lib/`) are imported by components, not vice versa. The update script (`scripts/`) imports from `src/lib/schemas.ts` which is appropriate.
- **Layer separation**: Static components and React islands are properly separated. No business logic bleeds into infrastructure.
- **Screaming Architecture**: Folder names accurately communicate intent (`islands/`, `static/`, `data/`, `lib/`).
- **Violations**: `constants.ts` exports constants that are duplicated locally instead of being imported — the module exists but is disconnected from the system (W-2).

---

## Test Quality

**No tests exist anywhere in this codebase.**

- Zero test files found in `src/`, `scripts/`, or root.
- No test framework configured (`package.json` has no `vitest`, `jest`, or `playwright`).
- FIRST compliance: N/A
- AC traceability: N/A (no spec file exists)
- Risk coverage: None — the highest-risk paths (AI JSON parsing, Zod schema validation, sparkline generation) are completely untested.

---

## Verdict

**APPROVED WITH CONDITIONS**

The codebase builds cleanly, is architecturally sound, and has no critical bugs. However, conditions for merge are:

1. **W-2** (dead constants module): Consolidate or import — the current state creates silent drift risk.
2. **W-5** (missing schema min constraint): Fix before the next AI update cycle to prevent sparkline crashes.
3. **W-6** (deploy on failed update): Fix to prevent publishing partial data.

All other warnings should be resolved in a follow-up before the next major feature addition.
