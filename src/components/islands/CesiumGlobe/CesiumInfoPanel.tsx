import type { MapPoint } from '../../../lib/schemas';
import { MAP_CATEGORIES } from '../../../lib/map-utils';
import { tierLabelFull, tierClass } from './cesium-helpers';

interface Props {
  point: MapPoint;
  onClose: () => void;
}

export default function CesiumInfoPanel({ point, onClose }: Props) {
  const category = MAP_CATEGORIES.find(c => c.id === point.cat);
  if (!category) return null;

  return (
    <div className="globe-info-panel">
      <button className="globe-info-close" onClick={onClose} aria-label="Close info panel">
        &times;
      </button>
      <div className="globe-info-type" style={{ color: category.color }}>
        {category.label}
      </div>
      <div className="globe-info-title">{point.label}</div>
      <div className="globe-info-body">{point.sub}</div>
      <div className="globe-info-meta">
        <span className={`source-chip ${tierClass(point.tier)}`} style={{ fontSize: '0.6rem' }}>
          {tierLabelFull(point.tier)}
        </span>
        <span className="globe-info-date">{point.date}</span>
        <span className="globe-info-coords">
          {point.lat.toFixed(2)}°N, {point.lon.toFixed(2)}°E
        </span>
      </div>
    </div>
  );
}
