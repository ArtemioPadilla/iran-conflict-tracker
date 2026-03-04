# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static intelligence dashboard tracking the 2026 Iran-US/Israel conflict. Built with Astro 5, TypeScript, and React islands for interactive sections. Data stored as JSON files, auto-updated nightly via Claude API.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Type-check + build static site to dist/
npm run preview    # Preview built site
npm run update-data  # Run AI data update (requires ANTHROPIC_API_KEY or OPENAI_API_KEY)
```

## Deployment

- **Build + deploy**: `.github/workflows/deploy.yml` — triggers on push to `main`, builds Astro, deploys `dist/` to GitHub Pages
- **Nightly data update**: `.github/workflows/update-data.yml` — runs at 6 AM UTC, calls AI with web search to update JSON data files, commits changes, which triggers the deploy workflow
- Supports dual providers: Anthropic (default) or OpenAI
- Env vars: `AI_PROVIDER` (`anthropic`|`openai`), `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_MODEL`, `OPENAI_MODEL`
- At minimum, set the API key secret for your chosen provider in GitHub repo settings

## Architecture

```
src/data/*.json          →  src/pages/index.astro  →  Astro components
  (JSON data files)          (imports + composes)       (static .astro + React islands)
src/lib/schemas.ts       →  scripts/update-data.ts
  (Zod schemas)              (AI nightly updater — Anthropic or OpenAI)
```

### Data Layer (`src/data/`)

All dashboard content lives in individual JSON files: `kpis.json`, `timeline.json`, `map-points.json`, `map-lines.json`, `strike-targets.json`, `retaliation.json`, `assets.json`, `casualties.json`, `econ.json`, `claims.json`, `political.json`, `meta.json`. The nightly update script modifies these files directly.

`update-log.json` tracks the last run time and per-section status.

### Schemas (`src/lib/schemas.ts`)

Single source of truth for all data types. Zod schemas are used both by Astro components (via inferred TypeScript types) and the update script (for runtime validation of Claude's responses).

### Static Components (`src/components/static/`)

Server-rendered Astro components — zero client-side JS: `Header`, `Hero`, `KpiStrip`, `CasualtyTable`, `EconGrid`, `ClaimsMatrix`, `PoliticalGrid`, `SourceLegend`, `Footer`.

### React Islands (`src/components/islands/`)

Client-hydrated interactive components using `client:load`:
- **`TimelineSection.tsx`** — click-to-expand event detail panel
- **`IntelMap.tsx`** — SVG map with filter toggles and info panel (most complex component)
- **`MilitaryTabs.tsx`** — tabbed strike/retaliation/assets view

### Utilities (`src/lib/`)

- `map-utils.ts` — `geoToSVG()` projection, `COUNTRY_PATHS`, `MAP_CATEGORIES`, `COUNTRY_COLORS`, `COUNTRY_LABELS`, `generateSparkline()`
- `tier-utils.ts` — `tierClass()`, `tierLabel()`, `contestedBadge()`
- `constants.ts` — `NAV_SECTIONS`, `MIL_TABS`

### Adding a new dashboard section

1. Add JSON data file in `src/data/`
2. Add Zod schema in `src/lib/schemas.ts`
3. Create component in `src/components/static/` (or `islands/` if interactive)
4. Import data and component in `src/pages/index.astro`
5. Add entry to `NAV_SECTIONS` in `src/lib/constants.ts`
6. Add update function in `scripts/update-data.ts` if it should be auto-updated

## Data Conventions

Every data point carries a source tier classification:
- **Tier 1**: Official/primary (CENTCOM, IDF, White House, UN)
- **Tier 2**: Major outlet (Reuters, AP, BBC, CNN)
- **Tier 3**: Institutional (CSIS, HRW, Oxford Economics)
- **Tier 4**: Unverified (social media, unattributed)

Casualty figures use a `contested` field (`'yes'`/`'no'`/`'evolving'`/`'heavily'`/`'partial'`).

## SVG Map

The theater map in `IntelMap.tsx` is generated entirely in React — no mapping library. Country outlines are lon/lat arrays in `COUNTRY_PATHS` (`src/lib/map-utils.ts`), projected via `geoToSVG()` (lon 25–65°E → x 0–1000, lat 20–42°N → y 600–0). Map points and bezier arc lines are rendered as SVG with category-based color coding.

## CSS

Global stylesheet at `src/styles/global.css`. Dark theme via CSS custom properties on `:root`. Key color semantics: `--accent-red` (strikes), `--accent-amber` (retaliation), `--accent-blue` (US assets), `--accent-purple` (active fronts). Tier colors: `--tier-1` through `--tier-4`.
