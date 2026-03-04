# 2026 Iran Conflict — Intelligence Dashboard

A comprehensive, source-cited, static intelligence dashboard tracking the 2026 Iran-US/Israel conflict (Operation Epic Fury / Roaring Lion).

**[→ Live Dashboard](https://YOUR_USERNAME.github.io/iran-conflict-dashboard/)**

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
| 06 | **Contested Claims** | Side-by-side source comparison for the 5 most disputed claims, with resolution assessments. |
| 07 | **Political & Diplomatic** | Key statements from all parties with role/affiliation context. |

### Source Tier System

Every data point is classified:

- 🔴 **Tier 1 — Primary/Official**: CENTCOM, IDF, White House, IAEA, UN, government statements
- 🔵 **Tier 2 — Major Outlet**: Reuters, AP, CNN, BBC, NPR, Al Jazeera, Bloomberg, WaPo
- 🟡 **Tier 3 — Institutional**: Oxford Economics, CSIS, HRW, HRANA, Hengaw, NetBlocks
- ⚪ **Tier 4 — Unverified**: Social media, IRGC military claims, unattributed video

---

## Project Structure

```
iran-conflict-dashboard/
├── index.html                    # Page structure (HTML only)
├── css/
│   └── style.css                 # All styles (~1,150 lines)
├── data/
│   └── dashboard-data.js         # ALL dashboard data (edit this to update)
├── js/
│   └── app.js                    # Rendering logic (reads from data)
├── .github/
│   └── workflows/
│       └── deploy.yml            # Auto-deploy to GitHub Pages on push
└── README.md
```

### Key Design: Data Separation

**All data lives in `data/dashboard-data.js`**. The rendering logic in `js/app.js` never contains hardcoded facts. To update the dashboard:

1. Edit `data/dashboard-data.js`
2. Push to `main`
3. GitHub Pages auto-deploys

### Data Arrays

| Array | Purpose |
|-------|---------|
| `NAV_SECTIONS` | Navigation links |
| `KPI_DATA` | Top-level stat cards |
| `TIMELINE_DATA` | Historical events grouped by era |
| `COUNTRY_PATHS` | SVG map country outlines |
| `MAP_POINTS` | Map markers (strike targets, retaliation, assets, fronts) |
| `MAP_CATEGORIES` | Map legend categories |
| `MAP_LINES` | Strike/retaliation arc vectors |
| `MIL_TABS` | Military operations tab labels |
| `STRIKE_TARGETS` | US/Israel strike locations |
| `RETALIATION_DATA` | Iranian retaliation targets |
| `ASSETS_DATA` | US military assets deployed |
| `CASUALTY_DATA` | Casualty figures by category |
| `ECON_DATA` | Economic indicators with sparkline data |
| `CLAIMS_DATA` | Contested claims with both sides |
| `POL_DATA` | Political statements |

---

## Deployment

### Option A: GitHub Pages (Recommended)

1. **Create repo on GitHub**

   Go to [github.com/new](https://github.com/new), name it `iran-conflict-dashboard`, make it public.

2. **Push this code**

   ```bash
   cd iran-conflict-dashboard
   git init
   git add .
   git commit -m "Initial dashboard deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/iran-conflict-dashboard.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**

   Go to repo → **Settings** → **Pages** → Source: **GitHub Actions**.

   The included workflow (`.github/workflows/deploy.yml`) will auto-deploy on every push to `main`.

4. **Access at**: `https://YOUR_USERNAME.github.io/iran-conflict-dashboard/`

### Option B: Any Static Host

This is a pure static site (no build step, no dependencies). Drop the files on any web server, S3 bucket, Netlify, Vercel, Cloudflare Pages, etc.

```bash
# Netlify
npx netlify-cli deploy --prod --dir=.

# Vercel
npx vercel --prod

# Python local server
python3 -m http.server 8000
```

---

## Updating Data

### Add a new timeline event

In `data/dashboard-data.js`, find the `TIMELINE_DATA` array and add to the appropriate era:

```js
{ year: 'Mar 3', title: 'New Event', type: 'military',
  detail: 'Description of what happened...',
  sources: [{ name: 'CNN', tier: 2, url: 'https://...' }] },
```

### Add a map point

```js
// In MAP_POINTS array:
{ id: 'new_target', lon: 51.4, lat: 35.7, cat: 'strike',
  label: 'New Target', sub: 'Details about this location', tier: 1 },
```

### Add a casualty row

```js
// In CASUALTY_DATA array:
{ category: 'New Category', killed: '10', injured: '25',
  source: 'CNN', tier: 2, contested: 'no', note: '' },
```

### Update a KPI

Just change the `value` field in the relevant `KPI_DATA` entry.

---

## Extending

### Add a new era to the timeline

```js
// Add a new object to TIMELINE_DATA:
{ era: 'New Era Name',
  events: [
    { year: '2030', title: '...', type: 'military', detail: '...', sources: [...] },
  ]},
```

### Add a new map category

```js
// In MAP_CATEGORIES:
{ id: 'humanitarian', label: 'Humanitarian Sites', color: '#2ecc71', dotColor: '#2ecc71' },
```

### Add a new section

1. Add HTML section in `index.html`
2. Add data array in `data/dashboard-data.js`
3. Add render function in `js/app.js`
4. Add to `NAV_SECTIONS` array
5. Call render function in `DOMContentLoaded`

---

## Tech Stack

- **Zero dependencies** — pure HTML, CSS, vanilla JS
- **No build step** — edit and deploy
- **SVG map** — hand-plotted coordinates, no tile server needed
- **CSS animations** — scroll-triggered reveals, map pulses, sparklines
- **Responsive** — works on mobile (map scrolls horizontally)

---

## Disclaimer

This dashboard aggregates publicly available information from multiple sources and perspectives. It does not endorse any particular political position or narrative. All contested claims are explicitly marked. Source classifications reflect general reliability tiers, not endorsements of specific reporting.

---

## License

MIT — use freely, attribute if you'd like.
