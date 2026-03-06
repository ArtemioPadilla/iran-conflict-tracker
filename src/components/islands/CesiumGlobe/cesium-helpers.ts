import { Cartesian3, Color } from 'cesium';
import { MAP_CATEGORIES } from '../../../lib/map-utils';

/** Convert category ID to Cesium Color */
export function catToCesiumColor(cat: string, alpha = 1.0): Color {
  const hex = MAP_CATEGORIES.find(c => c.id === cat)?.color || '#888888';
  return Color.fromCssColorString(hex).withAlpha(alpha);
}

/** Convert category ID to line Cesium Color */
export function lineToCesiumColor(cat: string): Color {
  if (cat === 'strike') return Color.fromCssColorString('#e74c3c').withAlpha(0.7);
  if (cat === 'retaliation') return Color.fromCssColorString('#f39c12').withAlpha(0.7);
  if (cat === 'front') return Color.fromCssColorString('#9b59b6').withAlpha(0.7);
  return Color.fromCssColorString('#3498db').withAlpha(0.7);
}

/** Generate a 3D arc between two lon/lat points with altitude peak */
export function arc3D(
  from: [number, number],
  to: [number, number],
  segments = 60,
  peakAltitude = 150_000,
): Cartesian3[] {
  const positions: Cartesian3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lon = from[0] + (to[0] - from[0]) * t;
    const lat = from[1] + (to[1] - from[1]) * t;
    const alt = Math.sin(t * Math.PI) * peakAltitude;
    positions.push(Cartesian3.fromDegrees(lon, lat, alt));
  }
  return positions;
}

/** Marker pixel size based on category and tier */
export function markerPixelSize(cat: string, tier: number): number {
  if (cat === 'front') return 10;
  if (cat === 'asset') return 8;
  if (tier === 1) return 8;
  return 6;
}

/** Line width based on category */
export function lineWidth(cat: string): number {
  if (cat === 'strike') return 2.0;
  if (cat === 'retaliation') return 1.5;
  return 1.0;
}

/** Line dash pattern (in pixels) */
export function lineDashPattern(cat: string): number {
  if (cat === 'strike') return 16;
  if (cat === 'retaliation') return 8;
  if (cat === 'front') return 4;
  return 12;
}

/** Front zone radius in meters */
export function frontZoneRadius(id: string): number {
  if (id === 'hormuz') return 60_000;
  return 40_000;
}

/** Tier label for info panel */
export function tierLabelFull(t: number): string {
  return t === 1
    ? 'Tier 1 — Official'
    : t === 2
      ? 'Tier 2 — Major Outlet'
      : t === 3
        ? 'Tier 3 — Institutional'
        : 'Tier 4';
}

/** Tier CSS class for styling */
export function tierClass(t: number): string {
  return t === 1 ? 't1' : t === 2 ? 't2' : t === 3 ? 't3' : 't4';
}
