import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, ZoomControl, Circle, Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint, MapLine } from '../../lib/schemas';
import { catColor, lineColor } from './map-helpers';

interface Props {
  points: MapPoint[];
  lines: MapLine[];
  onSelectPoint: (pt: MapPoint) => void;
}

/** Interpolate an arc between two [lat, lng] points using a sine curve offset */
function arcPositions(
  from: [number, number],
  to: [number, number],
  segments = 40,
): LatLngExpression[] {
  const positions: LatLngExpression[] = [];
  const dlat = to[0] - from[0];
  const dlng = to[1] - from[1];
  const dist = Math.sqrt(dlat * dlat + dlng * dlng);
  const amplitude = dist * 0.18;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = from[0] + dlat * t;
    const lng = from[1] + dlng * t;
    const offset = Math.sin(t * Math.PI) * amplitude;
    const nx = -dlng / dist;
    const ny = dlat / dist;
    positions.push([lat + nx * offset, lng + ny * offset]);
  }
  return positions;
}

/** Determine marker radius based on category and tier */
function markerRadius(cat: string, tier: number): number {
  if (cat === 'front') return 8;
  if (cat === 'asset') return 6;
  if (tier === 1) return 6;
  return 5;
}

/** Determine if point should show permanent label */
function showPermanentLabel(pt: MapPoint): boolean {
  if (pt.base) return true;
  const majorLabels = new Set([
    'tehran', 'natanz', 'isfahan', 'lincoln', 'ford',
    'hormuz', 'beirut', 'israel_r', 'tel_aviv',
    'dubai', 'red_sea', 'riyadh',
  ]);
  return majorLabels.has(pt.id);
}

/** Determine line weight based on category */
function lineWeight(cat: string): number {
  if (cat === 'strike') return 1.8;
  if (cat === 'retaliation') return 1.5;
  return 1.2;
}

/** Determine line dash pattern */
function lineDash(cat: string): string {
  if (cat === 'strike') return '8,4';
  if (cat === 'retaliation') return '4,6';
  if (cat === 'front') return '2,4';
  return '6,4';
}

/** Create a DivIcon for military bases */
function baseIcon(): L.DivIcon {
  return L.divIcon({
    className: 'base-marker',
    html: '<span class="base-marker-inner">⬟</span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function LeafletMap({ points, lines, onSelectPoint }: Props) {
  const center: LatLngExpression = [29, 49];

  const basePoints = points.filter(p => p.base);
  const frontPoints = points.filter(p => p.cat === 'front');
  const regularPoints = points.filter(p => p.cat !== 'front' && !p.base);

  return (
    <MapContainer
      center={center}
      zoom={5}
      minZoom={4}
      maxZoom={8}
      style={{ width: '100%', height: '100%', background: '#0d0f14' }}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <ZoomControl position="topright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Active front zones — soft glowing circles */}
      {frontPoints.map(pt => (
        <Circle
          key={`zone-${pt.id}`}
          center={[pt.lat, pt.lon]}
          radius={pt.id === 'hormuz' ? 60000 : 40000}
          pathOptions={{
            color: '#9b59b6',
            fillColor: '#9b59b6',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
            dashArray: '4,4',
          }}
          className="front-zone-pulse"
        />
      ))}

      {/* Connection lines — arc vectors */}
      {lines.map((line, i) => {
        const from: [number, number] = [line.from[1], line.from[0]];
        const to: [number, number] = [line.to[1], line.to[0]];
        const positions = arcPositions(from, to);
        const color = lineColor(line.cat);
        return (
          <Polyline
            key={`line-${i}`}
            positions={positions}
            pathOptions={{
              color,
              weight: lineWeight(line.cat),
              opacity: 0.5,
              dashArray: lineDash(line.cat),
            }}
          >
            <Tooltip className="dark-tooltip">{line.label}</Tooltip>
          </Polyline>
        );
      })}

      {/* Military bases — pentagon icon, always visible */}
      {basePoints.map(pt => (
        <Marker
          key={pt.id}
          position={[pt.lat, pt.lon]}
          icon={baseIcon()}
          eventHandlers={{ click: () => onSelectPoint(pt) }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -14]}
            className="dark-tooltip base-tooltip"
          >
            🏛 {pt.label}
          </Tooltip>
        </Marker>
      ))}

      {/* Front zone markers */}
      {frontPoints.map(pt => {
        const color = catColor(pt.cat);
        return (
          <CircleMarker
            key={pt.id}
            center={[pt.lat, pt.lon]}
            radius={markerRadius(pt.cat, pt.tier)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 2,
            }}
            className="marker-pulse"
            eventHandlers={{ click: () => onSelectPoint(pt) }}
          >
            <Tooltip
              permanent={showPermanentLabel(pt)}
              direction="top"
              offset={[0, -10]}
              className="dark-tooltip"
            >
              {pt.label}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Regular map points — sorted so tier-1 renders on top */}
      {[...regularPoints]
        .sort((a, b) => b.tier - a.tier)
        .map(pt => {
          const color = catColor(pt.cat);
          const isPermanent = showPermanentLabel(pt);
          const radius = markerRadius(pt.cat, pt.tier);

          return (
            <CircleMarker
              key={pt.id}
              center={[pt.lat, pt.lon]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: pt.tier === 1 ? 0.9 : 0.7,
                weight: pt.tier === 1 ? 2 : 1,
              }}
              className={pt.tier === 1 ? 'marker-pulse' : undefined}
              eventHandlers={{ click: () => onSelectPoint(pt) }}
            >
              <Tooltip
                permanent={isPermanent}
                direction="top"
                offset={[0, -8]}
                className="dark-tooltip"
              >
                {pt.label}
              </Tooltip>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
