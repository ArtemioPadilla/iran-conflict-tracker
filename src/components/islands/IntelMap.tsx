import { useState, useEffect, useMemo, useCallback } from 'react';
import type { MapPoint, MapLine } from '../../lib/schemas';
import { MAP_CATEGORIES } from '../../lib/map-utils';
import { tierLabelFull, tierClass } from './map-helpers';
import LeafletMap from './LeafletMap';
import TimelineSlider from './TimelineSlider';

interface Props {
  points: MapPoint[];
  lines: MapLine[];
}

export default function IntelMap({ points, lines }: Props) {
  // ── Filters ──
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(['strike', 'retaliation', 'asset', 'front']),
  );
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // ── Timeline ──
  const dateRange = useMemo(() => {
    const allDates = [
      ...points.map(p => p.date),
      ...lines.map(l => l.date),
    ].sort();
    return {
      min: allDates[0] || '2025-12-01',
      max: allDates[allDates.length - 1] || '2026-03-04',
    };
  }, [points, lines]);

  const [currentDate, setCurrentDate] = useState(dateRange.max);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play/pause auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 1);
        const next = d.toISOString().split('T')[0];
        if (next > dateRange.max) {
          setIsPlaying(false);
          return dateRange.max;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, dateRange.max]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev) {
        // If at end, restart from beginning
        setCurrentDate(cur =>
          cur >= dateRange.max ? dateRange.min : cur,
        );
      }
      return !prev;
    });
  }, [dateRange]);

  // ── Filtering ──
  const toggleFilter = (cat: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredPoints = useMemo(
    () =>
      points.filter(
        p => activeFilters.has(p.cat) && p.date <= currentDate,
      ),
    [points, activeFilters, currentDate],
  );

  const filteredLines = useMemo(
    () =>
      lines.filter(
        l => activeFilters.has(l.cat) && l.date <= currentDate,
      ),
    [lines, activeFilters, currentDate],
  );

  const selectedCategory = selectedPoint
    ? MAP_CATEGORIES.find(c => c.id === selectedPoint.cat)
    : null;

  return (
    <section className="section" id="sec-map">
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
              <span className="fdot" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Leaflet map */}
        <LeafletMap
          points={filteredPoints}
          lines={filteredLines}
          onSelectPoint={setSelectedPoint}
        />

        {/* Timeline slider */}
        <TimelineSlider
          minDate={dateRange.min}
          maxDate={dateRange.max}
          currentDate={currentDate}
          isPlaying={isPlaying}
          onDateChange={setCurrentDate}
          onTogglePlay={togglePlay}
        />

        {/* Info panel */}
        {selectedPoint && selectedCategory && (
          <div className="map-info-panel visible">
            <button
              className="map-info-close"
              onClick={() => setSelectedPoint(null)}
              aria-label="Close info panel"
            >
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

        {/* Legend bar */}
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
