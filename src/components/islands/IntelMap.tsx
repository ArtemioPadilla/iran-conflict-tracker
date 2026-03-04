import { useState, useMemo } from 'react';
import type { MapPoint, MapLine } from '../../lib/schemas';
import {
  geoToSVG,
  COUNTRY_PATHS,
  MAP_CATEGORIES,
  COUNTRY_COLORS,
  COUNTRY_LABELS,
} from '../../lib/map-utils';

// ── Helpers ──

function tierLabelFull(t: number): string {
  return t === 1
    ? 'Tier 1 \u2014 Official'
    : t === 2
      ? 'Tier 2 \u2014 Major Outlet'
      : t === 3
        ? 'Tier 3 \u2014 Institutional'
        : 'Tier 4';
}

function tierClass(t: number): string {
  return t === 1 ? 't1' : t === 2 ? 't2' : t === 3 ? 't3' : 't4';
}

function lineColor(cat: string): string {
  if (cat === 'strike') return 'rgba(231,76,60,0.2)';
  if (cat === 'retaliation') return 'rgba(243,156,18,0.2)';
  if (cat === 'front') return 'rgba(155,89,182,0.25)';
  return 'rgba(52,152,219,0.2)';
}

function arrowMarker(cat: string): string {
  if (cat === 'strike') return 'arrow-red';
  if (cat === 'retaliation') return 'arrow-amber';
  if (cat === 'front') return 'arrow-purple';
  return 'arrow-blue';
}

// ── Props ──

interface Props {
  points: MapPoint[];
  lines: MapLine[];
}

// ── Component ──

export default function IntelMap({ points, lines }: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(['strike', 'retaliation', 'asset', 'front'])
  );
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const toggleFilter = (cat: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const closeInfo = () => setSelectedPoint(null);

  // Pre-compute country outline SVG path data
  const countryOutlines = useMemo(() => {
    return Object.entries(COUNTRY_PATHS).map(([name, coords]) => {
      const pts = coords.map(([lon, lat]) => geoToSVG(lon, lat));
      const d =
        pts
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
          .join(' ') + 'Z';
      const fill = COUNTRY_COLORS[name] || 'rgba(100,100,120,0.03)';
      const strokeColor = name === 'iran' ? 'rgba(231,76,60,0.25)' : 'rgba(100,110,130,0.2)';
      const strokeW = name === 'iran' ? 1.2 : 0.6;
      return { name, d, fill, strokeColor, strokeW };
    });
  }, []);

  // Pre-compute country label positions
  const labelPositions = useMemo(() => {
    return COUNTRY_LABELS.map(cl => {
      const [x, y] = geoToSVG(cl.lon, cl.lat);
      return { ...cl, x, y };
    });
  }, []);

  // Pre-compute Strait of Hormuz blockade indicator
  const hormuz = useMemo(() => {
    const [hx1, hy1] = geoToSVG(56.1, 27.0);
    const [hx2, hy2] = geoToSVG(56.4, 26.2);
    const textX = (hx1 + hx2) / 2 + 15;
    const textY = (hy1 + hy2) / 2;
    return { hx1, hy1, hx2, hy2, textX, textY };
  }, []);

  // Find selected point category for info panel
  const selectedCategory = selectedPoint
    ? MAP_CATEGORIES.find(c => c.id === selectedPoint.cat)
    : null;

  return (
    <section className="section fade-in" id="sec-map">
      <div className="section-header">
        <span className="section-num">02</span>
        <h2 className="section-title">Theater of Operations</h2>
        <span className="section-count">Live Intel Map</span>
      </div>

      <div className="map-container">
        {/* Filter controls */}
        <div className="map-controls">
          {MAP_CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`map-filter${activeFilters.has(c.id) ? ' active' : ''}`}
              data-cat={c.id}
              onClick={() => toggleFilter(c.id)}
            >
              <span
                className="fdot"
                style={{ background: c.color }}
              />
              {c.label}
            </button>
          ))}
        </div>

        {/* SVG map wrapper */}
        <div className="map-svg-wrap">
          <svg
            viewBox="0 0 1000 600"
            xmlns="http://www.w3.org/2000/svg"
            style={{ background: '#0d0f14' }}
          >
            {/* ── Defs: grid, glow, arrow markers ── */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="rgba(42,45,58,0.3)"
                  strokeWidth="0.5"
                />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id="arrow-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <path d="M0,0 L6,2 L0,4" fill="rgba(231,76,60,0.5)" />
              </marker>
              <marker id="arrow-amber" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <path d="M0,0 L6,2 L0,4" fill="rgba(243,156,18,0.5)" />
              </marker>
              <marker id="arrow-purple" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <path d="M0,0 L6,2 L0,4" fill="rgba(155,89,182,0.5)" />
              </marker>
              <marker id="arrow-blue" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <path d="M0,0 L6,2 L0,4" fill="rgba(52,152,219,0.5)" />
              </marker>
            </defs>

            {/* ── Grid background ── */}
            <rect width="1000" height="600" fill="url(#grid)" />

            {/* ── Water bodies ── */}
            {/* Mediterranean Sea */}
            <path
              d="M0,230 Q100,250 150,300 Q180,340 200,380 L220,480 L250,560 L280,600 L0,600Z"
              fill="rgba(52,152,219,0.06)"
              stroke="rgba(52,152,219,0.12)"
              strokeWidth="0.5"
            />
            {/* Persian Gulf */}
            <path
              d="M570,340 Q590,360 620,380 Q640,400 650,420 Q660,440 670,460 Q680,470 700,475 Q720,470 740,460 Q760,450 775,440 Q790,430 800,420 Q790,400 780,390 Q770,380 760,370 Q740,360 720,355 Q700,350 680,345 Q660,340 640,335 Q620,330 600,340Z"
              fill="rgba(52,152,219,0.08)"
              stroke="rgba(52,152,219,0.15)"
              strokeWidth="0.7"
            />
            {/* Caspian Sea */}
            <path
              d="M620,0 Q640,20 650,50 Q660,80 655,110 Q650,130 640,140 Q625,150 615,140 Q605,120 600,100 Q595,70 600,40 Q605,15 620,0Z"
              fill="rgba(52,152,219,0.08)"
              stroke="rgba(52,152,219,0.12)"
              strokeWidth="0.5"
            />
            {/* Red Sea */}
            <path
              d="M280,450 Q290,480 300,510 Q310,540 320,570 L310,600 L270,600 Q270,570 275,540 Q278,510 280,480 Z"
              fill="rgba(52,152,219,0.06)"
              stroke="rgba(52,152,219,0.12)"
              strokeWidth="0.5"
            />
            {/* Arabian Sea */}
            <path
              d="M800,420 Q810,440 830,470 Q860,500 900,530 L1000,600 L1000,560 Q950,530 900,500 Q860,470 830,440 Q810,420 800,410Z"
              fill="rgba(52,152,219,0.06)"
              stroke="rgba(52,152,219,0.12)"
              strokeWidth="0.5"
            />

            {/* ── Country outlines ── */}
            {countryOutlines.map(c => (
              <path
                key={c.name}
                d={c.d}
                fill={c.fill}
                stroke={c.strokeColor}
                strokeWidth={c.strokeW}
                strokeLinejoin="round"
              />
            ))}

            {/* ── Country labels ── */}
            {labelPositions.map(cl => (
              <text
                key={cl.name}
                x={cl.x.toFixed(1)}
                y={cl.y.toFixed(1)}
                fill={cl.color}
                fontFamily="JetBrains Mono, monospace"
                fontSize={cl.size}
                letterSpacing="0.15em"
                textAnchor="middle"
                fontStyle={cl.italic ? 'italic' : undefined}
              >
                {cl.name}
              </text>
            ))}

            {/* ── Connection lines (strike/retaliation arcs) ── */}
            {lines.map((line, i) => {
              const [x1, y1] = geoToSVG(line.from[0], line.from[1]);
              const [x2, y2] = geoToSVG(line.to[0], line.to[1]);
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2 - 30;
              const visible = activeFilters.has(line.cat);
              return (
                <path
                  key={`line-${i}`}
                  className="map-line"
                  data-cat={line.cat}
                  d={`M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`}
                  fill="none"
                  stroke={lineColor(line.cat)}
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                  markerEnd={`url(#${arrowMarker(line.cat)})`}
                  style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s' }}
                />
              );
            })}

            {/* ── Map points ── */}
            {points.map(pt => {
              const [x, y] = geoToSVG(pt.lon, pt.lat);
              const cat = pt.cat;
              const color = MAP_CATEGORIES.find(c => c.id === cat)?.color || '#888';
              const isActive = pt.id === 'tehran' || pt.id === 'lincoln';
              const hidden = !activeFilters.has(cat);
              const labelY = y - (isActive ? 10 : 7);

              return (
                <g
                  key={pt.id}
                  className={`map-point${isActive ? ' map-point-active' : ''}${hidden ? ' hidden' : ''}`}
                  data-cat={cat}
                  data-id={pt.id}
                  onClick={() => setSelectedPoint(pt)}
                >
                  {/* Active pulse ring */}
                  {isActive && (
                    <circle
                      cx={x.toFixed(1)}
                      cy={y.toFixed(1)}
                      r="12"
                      fill="none"
                      stroke={color}
                      strokeWidth="0.5"
                      opacity="0.3"
                    >
                      <animate attributeName="r" values="8;18;8" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Filled dot */}
                  <circle
                    cx={x.toFixed(1)}
                    cy={y.toFixed(1)}
                    r={isActive ? '5' : '3.5'}
                    fill={color}
                    opacity="0.85"
                  />
                  {/* Outline ring */}
                  <circle
                    cx={x.toFixed(1)}
                    cy={y.toFixed(1)}
                    r={isActive ? '5' : '3.5'}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.4"
                  />
                  {/* Label */}
                  <text
                    x={x.toFixed(1)}
                    y={labelY.toFixed(1)}
                    fill={color}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={isActive ? '7' : '5.5'}
                    textAnchor="middle"
                    letterSpacing="0.06em"
                    fontWeight={isActive ? '600' : '400'}
                    opacity="0.9"
                  >
                    {pt.label.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* ── Strait of Hormuz blockade indicator ── */}
            <line
              x1={hormuz.hx1.toFixed(1)}
              y1={hormuz.hy1.toFixed(1)}
              x2={hormuz.hx2.toFixed(1)}
              y2={hormuz.hy2.toFixed(1)}
              stroke="rgba(231,76,60,0.5)"
              strokeWidth="2.5"
              strokeDasharray="5,3"
            >
              <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            </line>
            <text
              x={hormuz.textX.toFixed(1)}
              y={hormuz.textY.toFixed(1)}
              fill="rgba(231,76,60,0.6)"
              fontFamily="JetBrains Mono, monospace"
              fontSize="5"
              letterSpacing="0.1em"
            >
              BLOCKED
            </text>
          </svg>
        </div>

        {/* ── Info panel (shown on point click) ── */}
        {selectedPoint && selectedCategory && (
          <div className="map-info-panel visible">
            <button className="map-info-close" onClick={closeInfo} aria-label="Close info panel">
              &times;
            </button>
            <div className="map-info-type" style={{ color: selectedCategory.color }}>
              {selectedCategory.label}
            </div>
            <div className="map-info-title">{selectedPoint.label}</div>
            <div className="map-info-body">{selectedPoint.sub}</div>
            <div style={{ marginTop: '0.6rem' }}>
              <span
                className={`source-chip ${tierClass(selectedPoint.tier)}`}
                style={{ fontSize: '0.5rem' }}
              >
                {tierLabelFull(selectedPoint.tier)}
              </span>
            </div>
          </div>
        )}

        {/* ── Legend bar ── */}
        <div className="map-legend-bar">
          {MAP_CATEGORIES.map(c => (
            <span key={c.id} className="map-legend-item">
              <span
                className="fdot"
                style={{
                  background: c.color,
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
              {' '}{c.label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto' }}>
            Scroll / drag to pan &bull; Click points for details
          </span>
        </div>
      </div>
    </section>
  );
}
