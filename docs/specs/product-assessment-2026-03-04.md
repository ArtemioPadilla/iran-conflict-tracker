# Product Assessment: Iran Conflict Tracker Dashboard
**Date**: 2026-03-04
**Assessor**: PROMETEO (PM)
**Scope**: Full product audit — UX, features, content, engagement, IA, competitive position, gaps
**Status**: Complete

---

## Executive Summary

The Iran Conflict Tracker is a technically polished, data-dense intelligence dashboard with strong editorial credibility (source tier system) and a compelling dark aesthetic. The product delivers what no major news org currently does: a single-page, structured, multi-domain view of an active conflict with every data point sourced and classified by reliability. This is its core competitive moat.

The critical gaps are: lack of real-time awareness signals, absent mobile UX, no cross-section linking, missing search/filter across all sections, and zero social sharing or embeddability. These gaps prevent it from breaking out of a niche tool into a reference product used by journalists, analysts, and engaged citizens.

---

## 1. User Experience Assessment

### Information Hierarchy

**Rating: B+**

Strengths:
- Hero section immediately conveys the gravity of the situation with bold typographic treatment (Cormorant Garamond at 4.5rem)
- KPI Strip provides at-a-glance situational awareness in the first scroll — exactly right
- Section numbering (01–07) gives users a mental model of scope
- The source tier color system (red/blue/amber/gray) creates a consistent credibility signal across all sections
- Dark theme + noise overlay creates an appropriate intelligence-briefing aesthetic

Weaknesses:
- **No "last updated" prominence**: `meta.lastUpdated` exists in the data but the only place it appears is the footer note. For a live conflict tracker, staleness is critical trust information — it belongs at the top, near the live dot.
- **No section summaries**: Each of the 7 sections launches directly into data with no 1-sentence situational summary. A user landing mid-page has no context for what changed since yesterday.
- **Timeline section (01) is an odd first section**: The historical context starting in 1941 is intellectually honest but buries the current crisis. First-time visitors want "what is happening NOW" before "what led here." The map or KPI strip is a stronger entry point.
- **KPI strip lacks trend indicators**: The 8 KPIs show current values but give no sense of direction (is 555 up or down from yesterday?). Only the econ section has sparklines. KPIs need delta/trend arrows.
- **Contested data warning is subtle**: The amber `CONTESTED` badge on KPIs is small (0.55rem text). For disinformation-sensitive content, this signal deserves more visual weight.

### Navigation Flow

**Rating: C+**

- Sticky header navigation is correct and well-executed
- Nav buttons are very small (0.65rem, 7-item row) — on a 375px mobile screen, these will be illegible or overflow
- **No active section highlighting**: The header nav has an `.active` CSS class but no JavaScript to apply it on scroll. Users cannot tell which section they are in.
- **No "back to top" affordance**: A 7-section single-page app with dense content needs a return mechanism
- **No progress indicator**: No visual cue showing how far through the page the user is
- **Internal cross-linking is absent**: The Claims section references specific events (Minab school, Abraham Lincoln) with no link to the corresponding map point or timeline entry

### Mobile UX

**Rating: D**

This is the most critical UX gap.

- Header nav is 7 buttons in a flex row — **will overflow or compress below readable size on mobile**
- Timeline horizontal scroll on mobile: the 85px `min-width` per era group means users must swipe extensively with no indication of length
- LeafletMap at 500px height is workable on mobile but the filter controls above it will wrap awkwardly
- The CasualtyTable has 7 columns — **horizontal scroll is required on mobile and there is no explicit scroll affordance**
- No hamburger menu or responsive nav pattern implemented
- No `@media (max-width: 768px)` breakpoints observed in the assessed CSS sections beyond the ops-grid (900px collapse)

Only one responsive breakpoint found (`@media (max-width: 900px)` for ops-grid). This is insufficient for a content-dense information product.

### Information Density

**Rating: B**

- The dashboard is appropriately dense for a professional/analyst audience
- Card-based layouts with consistent padding keep content scannable
- The econ sparklines are an excellent density technique — numerical value + trend in minimal space
- **Problem**: The Claims section (2-source comparison cards) is quite verbose per card. On a 5-claim dataset, this section is very tall. A collapsed-by-default view with expand would improve scannability.
- **Problem**: Political Grid (8 quote cards) has no priority ordering. Trump's war justification vs. a Turkish president's diplomatic statement carry very different weight but receive equal visual treatment.

---

## 2. Feature Completeness Assessment

### Present Features

| Feature | Status | Quality |
|---------|--------|---------|
| KPI strip with contested flags | Present | Good |
| Historical timeline (click to expand) | Present | Good |
| Leaflet map with categories + timeline slider | Present | Very Good |
| Military ops tabbed view | Present | Good |
| Casualty table with tier badges | Present | Good |
| Economic sparkline cards | Present | Very Good |
| Contested claims matrix | Present | Excellent |
| Political quotes grid | Present | Fair |
| Source legend | Present | Good |
| Nightly AI data refresh | Present | Very Good |
| Zod schema validation on build | Present | Excellent |

### Missing Features

**P0 — Critical gaps (blocks core use case):**

1. **No active section indicator in nav**: Users cannot orient themselves. This is a pure CSS/JS addition.
2. **No mobile navigation**: The header nav overflows on small screens. Blocks mobile users entirely.
3. **No "data freshness" indicator at top**: `lastUpdated` timestamp is buried in footer. Live conflict trackers live or die on this signal.

**P1 — High-value gaps (significantly improves product):**

4. **No search**: With 27 map points, ~20 timeline events, 15+ strike targets, 8+ political quotes — users cannot find specific entities (e.g., "Natanz", "Khamenei", "Kuwait").
5. **No share/embed**: No OG meta tags for social sharing, no section deep-link copy buttons, no embed code for iframes. This prevents the product from spreading virally.
6. **No notification/alert system**: Users who return daily to track updates have no way to see what changed since their last visit. A "New since last visit" banner or change log view would be high value.
7. **KPI trend deltas missing**: KPIs show current values but not directional change. "555 killed" tells less than "555 killed (+73 since yesterday)."

**P2 — Medium-value gaps:**

8. **No cross-section linking**: Clicking "Minab" in the Claims section should open the Minab point on the map. Clicking the "Feb 28 STRIKES BEGIN" timeline event should show the map filtered to that date.
9. **No print/PDF export**: Analysts and journalists need a clean print version. CSS print media queries + a header print button would suffice.
10. **No timeline legend for event types**: The timeline uses color-coded dots (red=military, blue=diplomatic, amber=humanitarian) but there is no legend visible to users. Only the CSS class names encode this.
11. **Political section needs sourcing**: Political quotes have no source chips, no dates, no links to original statements. Every other section has tier badges; political does not.
12. **Asset cards lack tier badges**: The Assets tab in MilitaryTabs renders `<div className="asset-card">` with no tier/source display. The schema (`AssetSchema`) doesn't even have a `tier` field.

**P3 — Nice-to-have:**

13. **No dark/light mode toggle**: The dark theme is the right default for the aesthetic, but some users (print, accessibility) need a light option.
14. **No language alternatives**: The conflict is global; Arabic, Hebrew, or Persian versions would massively expand reach.
15. **No RSS/JSON API endpoint**: Power users and aggregators would benefit from a machine-readable feed.
16. **No related links section**: No outbound links to primary sources, CENTCOM briefings, UN statements, etc. at a summary level.

---

## 3. Content Strategy Assessment

### Data Freshness

**Rating: B+**

- Nightly AI update at 6 AM UTC is appropriate for a developing conflict
- The `update-log.json` schema exists but `lastRun: null` — the update mechanism has never successfully committed data. This is a critical operational gap to monitor.
- `meta.lastUpdated` is manually set to `"2026-03-02T14:30:00-05:00"` — two days behind current date (today is Day 3, March 4). This suggests the AI updater is not running.
- **Risk**: If the AI updater fails silently, the site continues showing stale data with a "LIVE" indicator in the header. This is a credibility-destroying failure mode.

### Source Credibility Display

**Rating: A-**

This is the product's strongest differentiator. The 4-tier system is:
- Consistently applied across timeline, map, military, and casualties
- Color-coded with semantic meaning (red=official, blue=major outlet, amber=institutional, gray=unverified)
- Documented in the footer source legend
- Applied at data-point granularity (not just section-level)

Gaps:
- Political section has no source chips (significant inconsistency)
- Asset cards have no tier (schema gap)
- The source legend is at the bottom — most users never reach it
- Tier 1 is colored red, which also means "strikes/danger" throughout the UI. This creates an unintended semantic collision: high-credibility sources visually read as "alarming."

### Contested Data Handling

**Rating: A**

- The `contested` field with 5 values (`yes/no/evolving/heavily/partial`) is sophisticated and honest
- The Claims Matrix is the standout section — side-by-side source comparison with explicit resolution assessments is rare in conflict journalism
- Casualty table's `note` field provides essential context for contested figures
- KPI `contestNote` correctly surfaces the range dispute inline

---

## 4. Engagement Assessment

### Interactive Elements Quality

**Rating: B+**

- Leaflet map is the strongest interactive element: real tile-backed map, arc lines, category filters, timeline playback, click-to-detail panel. This is sophisticated.
- Timeline timeline playback (200ms/day) is a compelling "watch the conflict unfold" feature that most users will never discover (no onboarding, no hint text)
- Click-to-expand timeline events work cleanly with smooth animation
- MilitaryTabs keyboard navigation: tabs are `<button>` elements, which is correct
- **Missing hover affordances**: Timeline nodes have hover states but no tooltip/preview before clicking

### Discoverability of Features

**Rating: D+**

This is a major engagement gap. The product has rich interactive features that users cannot discover:

- The timeline slider's Play button is the most powerful feature on the page. There is no visual indicator that it exists until you scroll past the filter controls into the map area.
- No onboarding tooltip, walkthrough, or "How to use this dashboard" explainer
- The map info panel appears only after clicking a point — with no "click points for details" affordance visible until after the map loads (the legend bar hints at this but appears after the map)
- Timeline's horizontal scroll has no visible scroll indicator or "more to the right" arrow
- Filter toggle buttons have no count badges showing how many items each category contains

### Call-to-Actions

**Rating: F**

There are zero CTAs in the current implementation:
- No "Share this dashboard" button
- No "Bookmark / return here" prompt
- No "Subscribe to updates" or "Follow for alerts"
- No "Report an error" or "Suggest a source" mechanism
- No "Embed this section" for media outlets

For a product with genuine journalistic value, the absence of any sharing or engagement mechanism is a significant miss.

---

## 5. Information Architecture Assessment

### Section Ordering

**Current order**: Timeline → Map → Military → Humanitarian → Economic → Contested → Political

**Assessment**: The ordering is logical for a deep reader but wrong for a first-time visitor.

Recommended order for news-driven discovery:
1. **Map** (spatial "where is it happening" is the most visceral entry point)
2. **KPI Strip** (already above timeline, correct)
3. **Timeline** (historical context after orientation)
4. **Military** (what's happening on the ground)
5. **Contested Claims** (what's disputed — high credibility signal, should be earlier)
6. **Humanitarian** (human cost)
7. **Economic** (market impact)
8. **Political** (diplomatic context)

The current placement of Political last is correct (it is a supporting context section). Economic being section 5 before Contested Claims (section 6) is debatable — claims are higher editorial value.

### Cross-Referencing Between Sections

**Rating: D**

This is the largest IA failure. Each section is a data silo:
- The Claims section references the Minab school strike — there is a map point for it, but no link
- The Timeline's "STRIKES BEGIN" event references operations visible in Military tabs — no link
- The Humanitarian table's "Iran civilians" row relates to map points — no link
- The Economic section's Strait of Hormuz data relates to the map's Hormuz front point — no link

A well-architected conflict tracker should allow users to navigate from fact to fact across dimensions.

### Data Relationships

The underlying data has natural relationships that are not surfaced in the UI:
- `map-points.json` and `strike-targets.json` share location entities but are not cross-referenced
- `timeline.json` events correlate to `map-points.json` dates but are not linked
- `claims.json` disputes reference entities in `casualties.json` and `map-points.json`

---

## 6. Competitive Edge Assessment

### What Makes This Unique

1. **Source tier transparency**: No major conflict tracker applies per-data-point source credibility classification at this granularity. Reuters, BBC, NYT conflict trackers show data without this signal.
2. **Contested claims matrix**: The side-by-side dispute format with explicit resolution assessments is genuinely novel. This is a differentiator worth marketing.
3. **Multi-domain coverage in one page**: Military + economic + humanitarian + diplomatic + geographic in one coherent layout is rare. Most trackers specialize.
4. **AI-powered nightly updates**: Automated data refresh with schema validation prevents data drift. This is a meaningful operational advantage for a solo-developed product.
5. **Historical arc**: Starting from 1941 provides context that breaking news cannot. The 85-year timeline is a moat — it took research to build.
6. **Playback timeline on map**: The ability to replay the conflict's progression day by day is a powerful storytelling feature not found in most news org maps.

### What's Missing vs. Competitors

Compared to Liveuamap, ISW, or NYT conflict maps:

1. **No real-time updates** (Liveuamap updates hourly via community reports)
2. **No user contribution mechanism** (ISW takes tips)
3. **No embed/API** (many outlets embed ISW maps)
4. **No mobile app or PWA** (Liveuamap has a mobile app)
5. **No comparison/historical baseline** (ISW tracks front-line changes day-over-day with explicit comparison)
6. **No video/media integration** (most outlets surface verified video evidence inline)
7. **No internationalization** (ISW publishes in Ukrainian; Al Jazeera in Arabic/English)

---

## 7. Priority Product Gap Recommendations

### P0 — Fix immediately (blocks trust/usability)

| # | Gap | Why P0 | Effort |
|---|-----|--------|--------|
| P0.1 | Active nav section indicator (scroll spy) | Users lose orientation; CSS class exists but JS missing | XS |
| P0.2 | Data freshness badge at hero level | `lastUpdated` 2 days stale; live dot misleads | XS |
| P0.3 | Mobile nav (hamburger / collapsible) | Header nav overflows on <768px; mobile = majority of traffic | S |
| P0.4 | Update-log health monitoring | `lastRun: null` means AI updater never ran; stale data risk | S |

### P1 — Next sprint (high user value)

| # | Gap | Why P1 | Effort |
|---|-----|--------|--------|
| P1.1 | KPI trend deltas (yesterday vs today) | Current values lack directional context | S |
| P1.2 | OG meta tags + section sharing | Enables social distribution; zero cost | S |
| P1.3 | Political section source chips | Inconsistent with all other sections; trust gap | XS |
| P1.4 | "What changed today" changelog view | Returning users need a diff, not a full re-read | M |
| P1.5 | Timeline event type legend | Users cannot decode dot color meanings | XS |
| P1.6 | Asset schema + display tier badges | Inconsistency with rest of military section | XS |

### P2 — Roadmap (meaningful UX improvements)

| # | Gap | Why P2 | Effort |
|---|-----|--------|--------|
| P2.1 | Global search across all sections | Power user need; enables journalism use case | M |
| P2.2 | Cross-section deep linking | Map → Claims → Timeline navigation | M |
| P2.3 | Print/PDF export | Analyst/journalist workflow | S |
| P2.4 | Claims section: collapse-by-default | Page length reduction on dense claims | XS |
| P2.5 | Feature discoverability tooltips | Map play button, timeline scroll hints | S |
| P2.6 | Political quote dates + source links | Data quality gap | XS |

### P3 — Future consideration

| # | Gap | Why P3 | Effort |
|---|-----|--------|--------|
| P3.1 | JSON feed / RSS endpoint | Power users, aggregators | M |
| P3.2 | Arabic/Persian language toggle | Geographic audience expansion | L |
| P3.3 | "Report an error" mechanism | Community trust signal | M |
| P3.4 | PWA / installable dashboard | Mobile engagement | L |
| P3.5 | Historical front-line comparison | Day-over-day diff on map | L |

---

## Feature Spec Priorities for Immediate Action

Based on the above, the following specs should be written and handed to Forja:

1. **`data-freshness-indicators`** (Tier S) — Surface `lastUpdated` prominently, add KPI trend deltas, add scroll-spy nav active state
2. **`mobile-responsive-nav`** (Tier M) — Full responsive nav with hamburger menu + mobile layout fixes for timeline and tables
3. **`social-sharing-og`** (Tier S) — OG meta tags, section share buttons, Twitter/X card support
4. **`what-changed-today`** (Tier M) — Changelog view comparing yesterday's vs today's data, surfacing new/updated entries
5. **`cross-section-linking`** (Tier M) — Deep links between Claims, Map, and Timeline entities

---

## Open Questions

1. **Audience definition**: Is the primary audience (a) general public following the news, (b) analysts/journalists needing sourced reference, or (c) researchers? The answer changes section ordering and density decisions significantly.
2. **Update frequency**: Is nightly sufficient if the conflict escalates significantly? Should there be a manual trigger UI for emergency updates?
3. **AI updater status**: Why is `update-log.json` showing `lastRun: null`? Has the GitHub Action ever successfully run? This needs investigation before trusting the "nightly update" claim.
4. **Tier 1 = red collision**: The tier-1 (most credible) color is red, which is the same as strikes/danger. Should tier colors be redesigned to avoid this semantic collision?
5. **Political section strategy**: Currently 8 quotes from 6 actors. Is the goal comprehensive diplomatic coverage or editorial curation of the most impactful statements? This determines whether the section should grow or stay curated.
