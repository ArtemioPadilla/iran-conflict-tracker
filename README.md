# 2026 Iran Conflict — Intelligence Dashboard

A comprehensive, source-cited intelligence dashboard tracking the 2026 Iran-US/Israel conflict (Operation Epic Fury / Roaring Lion). Built with Astro 5, TypeScript, and React — auto-updated nightly via AI web search.

**[→ Live Dashboard](https://artpad6.github.io/iran-conflict-tracker/)**

---

## Overview

This dashboard visualizes the ongoing conflict that began February 28, 2026, when the US and Israel launched coordinated strikes on Iran. It covers the full historical arc from 1941 through the present day across seven sections, with all data points individually sourced and classified by reliability tier.

### Sections

| # | Section | Description |
|---|---------|-------------|
| 01 | **Historical Timeline** | Interactive timeline from 1941 Allied invasion through Feb 28, 2026 strikes. Click any node for sourced details. |
| 02 | **Intelligence Map** | SVG theater map with 30+ plotted points: strike targets, retaliation hits, US assets, active fronts. Filterable by category. |
| 03 | **Military Operations** | Tabbed view: strike targets in Iran, Iranian retaliation across Gulf/Israel, US assets deployed. |
| 04 | **Humanitarian Impact** | Casualty table with contested/verified badges for every figure. |
| 05 | **Economic Impact** | Market data with sparkline charts: Brent, WTI, gold, S&P 500, VIX, Iranian rial. |
| 06 | **Contested Claims** | Side-by-side source comparison for the most disputed claims, with resolution assessments. |
| 07 | **Political & Diplomatic** | Key statements from all parties with role/affiliation context. |

### Source Tier System

Every data point is classified:

- 🔴 **Tier 1 — Primary/Official**: CENTCOM, IDF, White House, IAEA, UN, government statements
- 🔵 **Tier 2 — Major Outlet**: Reuters, AP, CNN, BBC, NPR, Al Jazeera, Bloomberg, WaPo
- 🟡 **Tier 3 — Institutional**: Oxford Economics, CSIS, HRW, HRANA, Hengaw, NetBlocks
- ⚪ **Tier 4 — Unverified**: Social media, IRGC military claims, unattributed video

---

## Tech Stack

- **[Astro 5](https://astro.build)** — static site generator with TypeScript
- **React** — interactive islands (map, timeline, military tabs)
- **Zod** — runtime schema validation for data integrity
- **Anthropic Claude / OpenAI** — nightly AI-powered data updates via web search
- **GitHub Actions** — CI/CD: auto-deploy + scheduled data refresh

---

## Project Structure

```
iran-conflict-tracker/
├── src/
│   ├── pages/index.astro              # Composition root
│   ├── layouts/BaseLayout.astro       # HTML shell, fonts, scroll animations
│   ├── components/
│   │   ├── static/                    # Server-rendered (zero JS shipped)
│   │   │   ├── Header.astro
│   │   │   ├── Hero.astro
│   │   │   ├── KpiStrip.astro
│   │   │   ├── CasualtyTable.astro
│   │   │   ├── EconGrid.astro
│   │   │   ├── ClaimsMatrix.astro
│   │   │   ├── PoliticalGrid.astro
│   │   │   ├── SourceLegend.astro
│   │   │   └── Footer.astro
│   │   └── islands/                   # Client-hydrated React components
│   │       ├── TimelineSection.tsx
│   │       ├── IntelMap.tsx
│   │       └── MilitaryTabs.tsx
│   ├── data/                          # JSON data files (AI-updatable)
│   │   ├── kpis.json
│   │   ├── timeline.json
│   │   ├── map-points.json
│   │   ├── map-lines.json
│   │   ├── strike-targets.json
│   │   ├── retaliation.json
│   │   ├── assets.json
│   │   ├── casualties.json
│   │   ├── econ.json
│   │   ├── claims.json
│   │   ├── political.json
│   │   ├── meta.json
│   │   └── update-log.json
│   ├── lib/                           # Shared utilities & types
│   │   ├── schemas.ts                 # Zod schemas (single source of truth)
│   │   ├── map-utils.ts              # SVG map projection & data
│   │   ├── tier-utils.ts             # Source tier helpers
│   │   └── constants.ts              # UI structure constants
│   └── styles/global.css             # Dark theme stylesheet
├── scripts/
│   └── update-data.ts                 # AI nightly update script
├── .github/workflows/
│   ├── deploy.yml                     # Build + deploy to GitHub Pages
│   └── update-data.yml                # Nightly AI data refresh
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Nightly AI Updates

The dashboard data is automatically refreshed daily at 6 AM UTC via GitHub Actions. The update script uses AI with web search to find new developments and updates all data sections.

### Supported Providers

| Provider | API Key Env Var | Model Env Var | Default Model |
|----------|----------------|---------------|---------------|
| **Anthropic** (default) | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` |
| **OpenAI** | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-4o` |

Set `AI_PROVIDER` to `anthropic` or `openai` to choose the provider.

### Run locally

```bash
# Using Anthropic (default)
ANTHROPIC_API_KEY=sk-ant-... npm run update-data

# Using OpenAI
AI_PROVIDER=openai OPENAI_API_KEY=sk-... npm run update-data

# Update specific sections only
UPDATE_SECTIONS=timeline,kpis,casualties npm run update-data
```

### GitHub Actions setup

1. Go to repo **Settings → Secrets and variables → Actions**
2. Add `ANTHROPIC_API_KEY` (and/or `OPENAI_API_KEY`)
3. Optionally add `AI_PROVIDER` if using OpenAI

The workflow commits changes to `src/data/` and pushes to `main`, which triggers the deploy workflow automatically.

---

## Deployment

### GitHub Pages (Recommended)

1. Go to repo **Settings → Pages**
2. Set source to **GitHub Actions**
3. The included workflow auto-deploys on every push to `main`
4. Site available at: `https://<username>.github.io/iran-conflict-tracker/`

### Other hosts

```bash
npm run build
# Deploy the dist/ directory to any static host
```

---

## Disclaimer

This dashboard aggregates publicly available information from multiple sources and perspectives. It does not endorse any particular political position or narrative. All contested claims are explicitly marked. Source classifications reflect general reliability tiers, not endorsements of specific reporting.

---

## License

MIT — use freely, attribute if you'd like.
