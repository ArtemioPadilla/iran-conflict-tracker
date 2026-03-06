import { Entity, PointGraphics, EllipseGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, VerticalOrigin, HorizontalOrigin, LabelStyle, NearFarScalar, DistanceDisplayCondition } from 'cesium';
import type { MapPoint } from '../../../lib/schemas';
import { catToCesiumColor, markerPixelSize, frontZoneRadius } from './cesium-helpers';

interface Props {
  points: MapPoint[];
  onSelect: (pt: MapPoint) => void;
}

/** Detect if this asset is a naval vessel (carrier, destroyer, etc.) */
function isNavalVessel(pt: MapPoint): boolean {
  if (pt.cat !== 'asset') return false;
  const l = pt.label.toLowerCase();
  return l.includes('uss ') || l.includes('cvn') || l.includes('ddg') || l.includes('navy');
}

/** Detect if this asset is an air base */
function isAirBase(pt: MapPoint): boolean {
  if (pt.cat !== 'asset') return false;
  return !!pt.base;
}

/** Patrol/ops zone radius for naval vessels */
function navalZoneRadius(pt: MapPoint): number {
  const l = pt.label.toLowerCase();
  if (l.includes('lincoln') || l.includes('ford')) return 80_000; // Carrier strike group
  return 40_000;
}

export default function CesiumPoints({ points, onSelect }: Props) {
  return (
    <>
      {points.map(pt => {
        const color = catToCesiumColor(pt.cat);
        const isFront = pt.cat === 'front';
        const isShip = isNavalVessel(pt);
        const isBase = isAirBase(pt);
        const isAsset = pt.cat === 'asset';

        // All assets get labels, plus major strike/retaliation/front points
        const showLabel = isAsset || isFront || pt.tier === 1;

        // Carriers and ships get much bigger markers
        let pixelSize = markerPixelSize(pt.cat, pt.tier);
        if (isShip) pixelSize = 14;
        else if (isBase) pixelSize = 10;

        // Ship color is brighter blue, bases are slightly different
        let markerColor = color;
        if (isShip) markerColor = Color.fromCssColorString('#00ccff');
        else if (isBase) markerColor = Color.fromCssColorString('#4aa3df');

        // Label icon prefix
        let labelPrefix = '';
        if (isShip) labelPrefix = '\u2693 '; // anchor ⚓
        else if (isBase) labelPrefix = '\u2B1F '; // pentagon ⬟

        return (
          <Entity
            key={pt.id}
            position={Cartesian3.fromDegrees(pt.lon, pt.lat, 0)}
            name={pt.label}
            description={pt.sub}
            onClick={() => onSelect(pt)}
          >
            <PointGraphics
              pixelSize={pixelSize}
              color={markerColor}
              outlineColor={markerColor.withAlpha(isShip ? 0.6 : 0.4)}
              outlineWidth={isShip ? 4 : pt.tier === 1 ? 3 : 1}
              scaleByDistance={new NearFarScalar(1e4, 1.5, 5e6, 0.5)}
            />

            {/* Front zones — translucent ellipse */}
            {isFront && (
              <EllipseGraphics
                semiMajorAxis={frontZoneRadius(pt.id)}
                semiMinorAxis={frontZoneRadius(pt.id)}
                material={color.withAlpha(0.08)}
                outline
                outlineColor={color.withAlpha(0.25)}
                outlineWidth={1}
              />
            )}

            {/* Naval vessel patrol zones — blue ring */}
            {isShip && (
              <EllipseGraphics
                semiMajorAxis={navalZoneRadius(pt)}
                semiMinorAxis={navalZoneRadius(pt)}
                material={markerColor.withAlpha(0.05)}
                outline
                outlineColor={markerColor.withAlpha(0.3)}
                outlineWidth={2}
              />
            )}

            {/* Air base ops radius */}
            {isBase && (
              <EllipseGraphics
                semiMajorAxis={50_000}
                semiMinorAxis={50_000}
                material={markerColor.withAlpha(0.03)}
                outline
                outlineColor={markerColor.withAlpha(0.15)}
                outlineWidth={1}
              />
            )}

            {/* Labels */}
            {showLabel && (
              <LabelGraphics
                text={`${labelPrefix}${pt.label}`}
                font={isShip ? "bold 12px 'DM Sans', sans-serif" : "11px 'DM Sans', sans-serif"}
                fillColor={isShip ? Color.fromCssColorString('#00eeff') : Color.fromCssColorString('#e8e9ed')}
                outlineColor={Color.fromCssColorString('#0a0b0e')}
                outlineWidth={2}
                style={LabelStyle.FILL_AND_OUTLINE}
                verticalOrigin={VerticalOrigin.BOTTOM}
                horizontalOrigin={HorizontalOrigin.CENTER}
                pixelOffset={new Cartesian3(0, -14, 0) as any}
                scaleByDistance={new NearFarScalar(1e4, 1.0, 5e6, 0.4)}
                distanceDisplayCondition={new DistanceDisplayCondition(0, isAsset ? 8e6 : 5e6)}
              />
            )}
          </Entity>
        );
      })}
    </>
  );
}
