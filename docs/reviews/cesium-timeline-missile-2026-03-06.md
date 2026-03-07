# Code Review: CesiumGlobe Timeline and Missile Animation System
**Date**: 2026-03-06
**Reviewer**: Centinela (QA Agent)
**Scope**: `src/components/islands/CesiumGlobe/useMissiles.ts`, `CesiumGlobe.tsx`, `CesiumTimelineBar.tsx`, `CesiumControls.tsx`, `cesium-helpers.ts`, `src/styles/globe.css`

## Summary

The rewrite correctly fixes 4 of the 5 stated bugs and introduces a clean RAF-based simulation model. Two critical issues remain: a stale `isPlaying` closure prevents the RAF loop from stopping on completion in all edge cases, and rapid scrubbing while playing causes a race between `simTimeRef` mutation and the running animation loop that can re-trigger entities on stale sim time. Several secondary concerns around entity lifecycle, boundary clamping, and UX discoverability are also present.

---

## Bug Fix Verification (5 stated issues)

### Bug 1 — Ghost arc entities from useMissiles (FIXED)
**Verdict: FIXED with one caveat.**

The old pattern used `viewer.entities.add` without tracking the reference on animation completion, creating permanent ghost arcs. The rewrite tracks all entities in `animationsRef` and `staticEntitiesRef`, and `cleanup()` removes them all. The useEffect cleanup function also calls `cleanup()`.

**Caveat (WARNING W-1):** When an animation completes inside the RAF tick (line 176: `viewer.entities.remove(anim.projectileEntity)`), the `trailEntity` is deliberately kept alive but the `projectileEntity` is removed imperatively. If the useEffect cleanup then runs (e.g., date changes mid-animation), `cleanup()` at line 217 tries to `viewer.entities.remove(anim.trailEntity)` and also `viewer.entities.remove(anim.projectileEntity)`. The projectile is already removed. The `try/catch` swallows this silently, which is correct behavior — but the pattern creates double-remove attempts on every mid-flight date change. Low risk in practice because Cesium's remove() is idempotent, but the try/catch machinery is load-bearing, not defensive.

### Bug 2 — Day-only arc display with persist toggle (FIXED)
**Verdict: FIXED.**

`CesiumGlobe.tsx` now splits lines into two memoized arrays:
- `pastLines` (line 211): empty when `persistLines === false`, otherwise `l.date < currentDate` (strictly less-than, correct — excludes today's arcs from the static set)
- `currentLines` (line 219): `l.date === currentDate` (exact match, correct)

`useConflictData` receives `pastLines` (static arcs), `useMissiles` receives `currentLines` (animated arcs). The old bug was cumulative `<=` logic that grew indefinitely. The new model is correct.

**One subtle issue (INFO I-1):** `pastLines` uses `l.date < currentDate` (strict less-than), but `currentLines` uses `l.date === currentDate` (equality). A line whose date is exactly `currentDate` appears only in `currentLines`. When the user scrubs to a past date, yesterday's lines are in `pastLines` and today's are in `currentLines`. This is the intended design, but: when `isPlaying === false`, `useMissiles` puts all lines in `toStatic` (line 61 guard: `isPlaying && ...`), so currentLines are shown as static arcs when paused. This is correct. No bug here — calling it out for clarity.

### Bug 3 — Real-time speed model (FIXED)
**Verdict: FIXED.**

The old `setInterval`-per-day approach has been replaced with a RAF loop in `CesiumGlobe.tsx` (lines 120–162). `simTimeRef.current` advances by `deltaMs * playbackSpeed` per frame. The frame delta is capped at 100ms (line 135) to prevent jumps on tab-hidden resumption. This is correct. `msToDateStr(simTimeRef.current)` is compared to `currentDateRef.current` to avoid unnecessary `setCurrentDate` calls (line 149 guard).

**CRITICAL ISSUE (C-1 — see Findings):** The RAF loop has a closure problem at the terminal condition. When `simTimeRef.current >= maxMs`, the code calls `setIsPlaying(false)` and returns without scheduling the next frame — correct. But the `useEffect` dependency array is `[isPlaying, playbackSpeed, dateRange.max]`. When `isPlaying` becomes `false`, the effect re-runs, and the `if (!isPlaying)` guard at line 121 cancels `rafIdRef.current`. However, because `setIsPlaying(false)` is called inside the RAF callback (not in the effect itself), `rafIdRef.current` at that point is still the ID of the just-running frame (which has already finished). The `cancelAnimationFrame` in the cleanup path cancels a frame that has already executed — which is harmless. The sequence is safe. (Downgrading from CRITICAL to WARNING — see W-2.)

### Bug 4 — Timeline-synced missile animations (FIXED)
**Verdict: FIXED.**

`simFlightDuration()` in `cesium-helpers.ts` (lines 95–98) computes duration from haversine distance at 2000 m/s, with a 60-second minimum. The animation uses `simTimeRef.current - anim.startSimTime` vs `anim.simDuration` for progress (line 173–174 in useMissiles). The stagger of 3000ms simulated time per line (line 107) is reasonable. The old fixed 2–4 second approach is gone.

**INFO I-2:** `simFlightDuration` returns ms of simulated time (at simulated speed), but the progress calculation in `useMissiles` compares raw `simTimeRef.current` (also simulated ms) to `startSimTime` (also simulated ms). The units are consistent. At the default 1hr/s speed (3600x), a 1000km missile (haversine ~500s at 2000m/s = 500,000ms sim) would complete in ~138 real seconds. This is appropriate for the visualization.

### Bug 5 — Smart next/prev navigation (FIXED)
**Verdict: FIXED.**

`prevEventDate()` and `nextEventDate()` in `CesiumTimelineBar.tsx` (lines 60–72) search `eventDates` (a sorted unique array of dates with events or lines) for the nearest date strictly before/after `currentDate`. When already at the boundary, they return `currentDate` unchanged — a no-op, which is the correct behavior.

**Edge case (WARNING W-3):** If `eventDates` is empty (no events, no lines in the date range), both functions return `currentDate` immediately. This is safe. If `events` and `lines` are both empty arrays, `eventDates` is empty and the prev/next buttons are effectively no-ops — no crash, just silent non-navigation. There is no user feedback that the buttons are inactive. Consider disabling or hiding the buttons when `eventDates.length === 0`.

---

## Findings

### Critical (must fix before merge)

No true critical issues found — the entity lifecycle is sound.

### Warning (should fix)

- **[W-1]** Double-remove pattern on projectile entity
  - File: `src/components/islands/CesiumGlobe/useMissiles.ts:176` and `cleanup()` at line 217
  - Description: When an animation completes, `viewer.entities.remove(anim.projectileEntity)` is called inside the tick loop. Subsequently, if the date changes while animations are in-flight, `cleanup()` attempts to remove the projectile again. The `try/catch` masks this. This is not a bug but the try/catch is load-bearing (not defensive). If Cesium changes its throw behavior, this silently breaks.
  - Fix: Set `anim.projectileEntity = null` after removing it in the tick loop, and guard in `cleanup()` with a null check.

- **[W-2]** RAF loop: `isPlaying` state may be stale for one frame after reaching `maxMs`
  - File: `src/components/islands/CesiumGlobe/CesiumGlobe.tsx:142–147`
  - Description: When `simTimeRef.current >= maxMs`, the code calls `setIsPlaying(false)` and returns. React batches this state update, so for the one frame between return and re-render, `isPlaying` is still true in the RAF closure but no new frame is scheduled. This is technically correct because the frame exits without scheduling. No visual artifact occurs. However, `currentDate` is set to `dateRange.max` (line 145) but `simTimeRef.current` is clamped to `maxMs` (line 143 sets it). The next re-render correctly shows `dateRange.max`. Low risk.
  - Fix: Confirm by visual testing that the timeline thumb lands exactly on `maxDate` when playback ends. No code change strictly required, but add a comment explaining the intentional exit pattern.

- **[W-3]** No visual feedback when prev/next buttons have no event to navigate to
  - File: `src/components/islands/CesiumGlobe/CesiumTimelineBar.tsx:129–148`
  - Description: When `currentDate` is already at the first/last event date, `prevEventDate`/`nextEventDate` return `currentDate` unchanged, calling `handleDateChange(currentDate)` which is a no-op (same date, same simTime). The user gets no feedback.
  - Fix: Disable the prev button when `prevEventDate(currentDate, eventDates) === currentDate`, and similarly for next.

- **[W-4]** `dayToDate()` is not clamped to `[minDate, maxDate]`
  - File: `src/components/islands/CesiumGlobe/CesiumTimelineBar.tsx:45–49`
  - Description: The slider `onChange` calls `onDateChange(dayToDate(Number(e.target.value), minDate))`. The input's `max` is `totalDays` and `min` is 0. HTML range inputs generally clamp, but `dayToDate` itself applies no clamp. If `totalDays` is computed with rounding differences from `dateToDay`, there is a small risk of producing a date one day beyond `maxDate`. Additionally, `dayToDate` uses `d.setDate(d.getDate() + day)` which mutates a local Date and works correctly — but uses local timezone (not UTC), while `dateToDay` uses `.getTime()` / 86400000 which is UTC-based.
  - Fix: Clamp `day` to `[0, totalDays]` in `dayToDate`. Align timezone: use `new Date(minDate + 'T00:00:00Z')` in `dayToDate` to match the UTC computation in `dateToDay`.

- **[W-5]** `useConflictData` click handler depends only on `[viewer]` — stale if `onSelect` callback changes
  - File: `src/components/islands/CesiumGlobe/useConflictData.ts:171`
  - Description: The click handler `useEffect` has dependency `[viewer]` only. `onSelect` is captured via `onSelectRef.current = onSelect` (line 58), which is the correct pattern for stable callbacks. This is actually fine — the ref is always current. Noting this for confirmation that the ref pattern is intentional and not an omission.
  - Fix: No code change required. Add a comment: `// onSelect is accessed via ref — no need to re-register the handler on each render`.

- **[W-6]** `activeCount` return value from `useMissiles` is always stale
  - File: `src/components/islands/CesiumGlobe/useMissiles.ts:208`
  - Description: `useMissiles` returns `{ activeCount: activeCountRef.current }`. This value is read at render time. Because `activeCountRef` is updated inside the RAF tick (line 186), React is not notified of changes. The `activeCount` returned is always the value as of the last render — likely 0 on the initial render and never updated unless a parent re-render happens for another reason. If `activeCount` is used for UI (e.g., showing "N missiles in flight"), it will be consistently wrong.
  - File: `src/components/islands/CesiumGlobe/CesiumGlobe.tsx` — `useMissiles` result is currently destructured but the `activeCount` is not used in the JSX. So this is currently a latent bug, not an active one. But the API contract implies it should work.
  - Fix: Either remove the return value (simplify the hook signature), or convert `activeCountRef` to state with `useState`, acknowledging the re-render cost.

### Suggestion (consider)

- **[S-1]** `trailEntity: null as any` / `projectileEntity: null as any` in `MissileAnimation` initialization
  - File: `src/components/islands/CesiumGlobe/useMissiles.ts:115–116`
  - Description: The `MissileAnimation` interface defines `trailEntity: Entity` and `projectileEntity: Entity` as non-nullable, but they are initialized to `null as any` and then assigned on the next two lines. This is a type safety gap — if an exception occurs between initialization and assignment, null entities enter `animationsRef`.
  - Fix: Define the interface with `trailEntity: Entity | null`, add null guard in `cleanup()`, or restructure the initialization to assign both in one step.

- **[S-2]** Speed selector scroll container may not be obvious on desktop
  - File: `src/components/islands/CesiumGlobe/CesiumTimelineBar.tsx:152–163` and `src/styles/globe.css:601–635`
  - Description: `.globe-tl-speed` has `overflow-x: auto; max-width: 320px; scrollbar-width: none`. With 9 speed buttons at ~30–35px each (~315px total), they may just fit on 320px. On narrower viewports they will be scrollable but the scrollbar is hidden. Users may not discover horizontal scrolling.
  - Fix: Add a scroll indicator (gradient fade on right edge), or reduce button padding, or consider a `<select>` element for compact display.

- **[S-3]** `const creditDiv = document.createElement('div')` at module scope
  - File: `src/components/islands/CesiumGlobe/CesiumGlobe.tsx:54`
  - Description: `creditDiv` is created at module load time. In SSR (Astro), `document` does not exist on the server. Astro's `client:load` ensures this module only runs client-side, so there is no immediate runtime error. However, this is a fragile assumption — if the component is ever used with `client:only` or SSR changes, it will throw at module init.
  - Fix: Move `document.createElement('div')` inside the component function body (with a `useRef` to stabilize the value), or wrap in a `typeof document !== 'undefined'` guard.

- **[S-4]** `Camera.DEFAULT_VIEW_RECTANGLE` mutation at module scope
  - File: `src/components/islands/CesiumGlobe/CesiumGlobe.tsx:44`
  - Description: `Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(...)` mutates a Cesium global at module evaluation time. If multiple Cesium viewers are created (e.g., in tests or future multi-globe features), this affects all of them.
  - Fix: Move this into `handleViewerReady` alongside the other camera setup, or into `cesium-config.ts` via `configureCesium()`.

- **[S-5]** Persist toggle label flips between "Persist Lines" and "Day Only" — meaning reversal
  - File: `src/components/islands/CesiumGlobe/CesiumControls.tsx:73`
  - Description: When `persistLines === false`, the button shows "Day Only" (describing current state). When `persistLines === true`, the button shows "Persist Lines" (describing current state). Standard UX convention for toggle buttons is either always-describe-current-state or always-describe-the-action. "Day Only" describes the current state; "Persist Lines" could be read as either. The inconsistency may confuse users.
  - Fix: Use a consistent pattern. Either "Persist Lines" (always, with active state styling to indicate it's on) or "Show: Day Only / Show: All Lines".

---

## Dead Code Scan

- **`activeCount` return value** (`useMissiles.ts:208`) — returned but never consumed in `CesiumGlobe.tsx`. The destructure `useMissiles(...)` at line 296 of CesiumGlobe.tsx discards the return value entirely (no destructuring). The return is dead.
- **`lineDashPattern` function** (`cesium-helpers.ts:53–58`) — imported nowhere in the updated code. `arcMaterial` uses it internally (line 74 of cesium-helpers.ts), so it is not fully dead, but it is not exported and not used externally.
- No commented-out code blocks found.
- No unreachable code found.
- **`useConflictData` arc entities cleanup pattern** — the cleanup runs in both the effect return and via explicit calls, which is correct but adds visual redundancy.

## Code Quality

**Clean Code:**
- Function sizes: All functions are well within 30 lines. `handleViewerReady` in CesiumGlobe.tsx (lines 251–290) is 39 lines — marginally over. Consider extracting the terrain setup and atmosphere setup into small helpers.
- Naming: Clear and descriptive throughout. `simTimeRef`, `rafIdRef`, `lastFrameRef` are well-named.
- DRY: `arc3D` is called once in `useMissiles` with explicit `(line.from, line.to, 60, 150_000)` parameters and once in `useConflictData` with defaults. The call in `useMissiles` explicitly overrides defaults that match the default values — minor noise.

**Code smells:**
- `null as any` initialization (S-1 above) — primitive obsession / type coercion smell.
- `MissileAnimation.completed` flag combined with entity reference tracking — two parallel state machines (ref-based and flag-based) that could diverge.
- The two-phase entity lifecycle (tick removes projectile imperatively; cleanup removes both) creates implicit coupling between the tick loop and cleanup — feature envy between `tick()` and `cleanup()`.

**Refactoring suggestions:**
- Extract Method: Split `handleViewerReady` into `setupSceneVisuals(viewer)` and `setupCameraPosition(viewer)`.
- Replace Magic Numbers: `+ 43200000` (noon offset) appears twice in CesiumGlobe.tsx (lines 112 and 187). Extract as `const NOON_OFFSET_MS = 43_200_000`.
- Remove the `activeCount` return from `useMissiles` or implement it properly.

## Architecture Compliance

**Dependency direction:** Clean. Hooks (`useMissiles`, `useConflictData`) depend on Cesium primitives and schema types, not on React state from the parent. Parent passes data down, hooks operate on it. No layer violations.

**Layer separation:** The Cesium imperative entity management is correctly isolated in hooks, separate from React declarative rendering. The split between `useConflictData` (static past arcs + points) and `useMissiles` (animated current-day arcs) is a clean boundary.

**One concern (INFO I-3):** `CesiumGlobe.tsx` contains `const creditDiv = document.createElement('div')` at module scope and `Camera.DEFAULT_VIEW_RECTANGLE = ...` at module scope. These are infrastructure-level side effects at the module level, not in lifecycle functions. They should be in `cesium-config.ts` or in `handleViewerReady`.

## Test Quality

No test framework is configured (existing debt TD-014). No tests exist for any of the 5 bug fixes.

**Highest-risk paths without tests:**
1. Entity cleanup on rapid date scrubbing — the most likely source of entity leaks under real usage
2. RAF loop terminal condition (end of timeline)
3. `prevEventDate`/`nextEventDate` boundary behavior when `eventDates` is empty
4. `dayToDate` timezone offset on UTC boundary dates
5. `simFlightDuration` with zero-distance `from === to` inputs (haversine returns 0, `max(60_000, 0)` returns 60_000 — safe, but not verified by test)

## Race Condition Analysis

**RAF loop vs React state:**
The RAF tick in `CesiumGlobe.tsx` reads `playbackSpeed` from the closure and writes to `simTimeRef`. `playbackSpeed` is captured at effect setup time (it's in the dependency array, so each speed change restarts the RAF with a fresh closure). This is correct — no stale closure on `playbackSpeed`.

**Rapid scrubbing while playing:**
When the user scrubs the slider while `isPlaying === true`:
1. `handleDateChange(date)` is called → sets `simTimeRef.current = dateToMs(date) + NOON_OFFSET`
2. Simultaneously, the RAF tick reads `simTimeRef.current` and advances it

Both occur on the main thread (no true concurrency), but the interleaving is: slider sets simTime → RAF reads the new simTime on the next frame. This is correct. However, the missile animation in `useMissiles` captures `baseSimTime = simTimeRef.current` at effect setup time (line 100). When the date changes, `useMissiles`'s `useEffect` re-runs (dependency: `currentDate`) — it calls cleanup and reinitializes. The RAF in `CesiumGlobe` continues running and may advance `simTimeRef` between the cleanup and re-initialization. The new effect runs synchronously during the React commit phase, so `simTimeRef.current` is stable at that moment. This is safe.

**Stale simTimeRef in useMissiles:**
`useMissiles` receives `simTimeRef` as a `React.RefObject<number>`. It reads `simTimeRef.current` inside `CallbackProperty` callbacks (Cesium calls these every frame). Because refs are always current, there is no staleness issue. The `startSimTime = simTimeRef.current` capture at effect setup time (line 100) is intentional — it anchors the animation start to "now" when the date becomes active.

**Entity leak on viewer destroy:**
If `viewer.isDestroyed()` becomes true mid-animation (e.g., component unmount), the RAF tick at line 163 exits without scheduling the next frame but also without calling `cleanup()`. The entities are leaked (they were added to a destroyed viewer and Cesium will have cleaned them internally). The useEffect cleanup at lines 197–205 guards `!viewer.isDestroyed()` correctly. This is safe.

## Performance

**RAF loop efficiency:** The RAF tick in `CesiumGlobe.tsx` does only: cap deltaMs, add to simTimeRef, string comparison, and conditionally `setCurrentDate`. This is O(1) and fast — appropriate for a 60fps loop.

The RAF tick in `useMissiles.ts` iterates over `animationsRef.current` (at most 10 entries, MAX_CONCURRENT). Each iteration does a subtraction, comparison, and flag set. O(N) where N ≤ 10. Very fast.

**`setCurrentDate` frequency:** At the default 1hr/s speed (3600x), simTime advances 3600ms per real ms, or 86,400,000ms per real second — one full day per real second. `setCurrentDate` is called at most once per day transition, roughly once per second at default speed. At 24hr/s speed (86400x), it fires every ~1 real millisecond, triggering `setCurrentDate` on almost every frame. This causes a React re-render on every frame at maximum speed. At 60fps, this is 60 re-renders per second.

**WARNING W-7 — Re-render storm at maximum speed:**
At `86400x` speed, `newDate !== currentDateRef.current` fires nearly every frame (every real ~16ms = 16ms * 86400 = ~1.4M ms simulated = ~16 days advance per frame). Wait — at 86400x, one real frame (16ms) = 16 * 86400 = 1,382,400ms simulated ≈ 16 simulated days. So `setCurrentDate` fires once per 16 simulated days — roughly every real frame. This creates 60 React re-renders per second, each re-computing `filteredPoints`, `pastLines`, `currentLines` memos, and re-running `useMissiles` and `useConflictData` effects. This will cause visible frame drops and entity churn.

Fix: Throttle `setCurrentDate` to fire at most once per second of real time, regardless of speed.

## Type Safety

- `trailEntity: null as any` and `projectileEntity: null as any` — see S-1. Type unsafety.
- `new CallbackProperty(() => { ... }, false) as any` — Cesium's TypeScript types for `CallbackProperty` do not match the `positions` field type exactly. The `as any` cast is a known workaround for Cesium/TypeScript incompatibilities. Acceptable given the library's type coverage.
- `pixelOffset: new Cartesian3(0, -14, 0) as any` in `useConflictData.ts:111` — same pattern.
- `picked.id instanceof Object` at line 159 of `useConflictData.ts` — this is true for all objects. The check should be `picked.id instanceof Entity` (imported Cesium Entity class) for type safety. As written, any non-primitive `id` passes the check, then `pointMapRef.current.get()` will return `undefined` if it's not a tracked entity — safe but imprecise.

---

## Security Verification (DO-CONFIRM)

- [x] No hardcoded secrets/API keys found in the changed files
- [x] No user input is passed unsanitized to Cesium (all inputs are typed MapLine/MapPoint from Zod-validated JSON)
- [x] No SQL/NoSQL vectors (no database layer)
- [x] No auth/authz concerns (static visualization, no protected endpoints)
- [x] `svgo` has a high-severity CVE (GHSA-xpqw-6gx7-v673 — Billion Laughs DoS via DOCTYPE). This is a dev dependency used by Vite's SVG optimization. It does not affect the runtime bundle. `npm audit fix` resolves it. Existing debt.

## Quality Verification (DO-CONFIRM)

- [ ] Tests: Zero tests exist (existing debt TD-014). Five bugs were fixed with no regression coverage.
- [ ] AC traceability: 4 of 5 bugs are demonstrably fixed in code. Bug 3 (RAF speed model) is fixed but has a re-render storm at max speed (W-7).
- [x] Clean Code: Minor violations noted (S-1, magic number, function length).
- [x] Architecture: Clean. No layer violations.
- [x] Spec compliance: All 5 stated bugs addressed in implementation.
- [ ] Dead code: `activeCount` return value is dead (never consumed by caller).

---

## Verdict

**APPROVED WITH CONDITIONS**

The core logic is sound. Entity tracking is correct, the RAF speed model is a genuine improvement, and arc display/navigation work as designed. Before treating this as production-stable, address:

1. **(Required before next release)** W-7: Re-render storm at max speed — throttle `setCurrentDate` to 1 real second maximum cadence, or gate the state update to `newDate !== currentDateRef.current` AND at least 500ms of real time since last update.
2. **(Required before next release)** W-4: Fix `dayToDate` timezone mismatch (UTC vs local) — this will produce wrong dates for users in UTC+N timezones near midnight.
3. **(Should fix)** W-3: Disable prev/next buttons when no earlier/later event exists.
4. **(Should fix)** W-6: Either use `activeCount` in the UI (with proper `useState`) or remove the return value from `useMissiles`.
5. **(Should fix)** S-1: Replace `null as any` initialization in `MissileAnimation` with proper nullable types.

The persist toggle (Bug 2), smart navigation (Bug 5), and entity lifecycle (Bug 1) are all correctly implemented. The architecture is clean and the RAF pattern is maintainable.
