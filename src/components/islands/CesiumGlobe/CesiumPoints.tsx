import { Entity, PointGraphics, EllipseGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, VerticalOrigin, HorizontalOrigin, LabelStyle, NearFarScalar, DistanceDisplayCondition } from 'cesium';
import type { MapPoint } from '../../../lib/schemas';
import { catToCesiumColor, markerPixelSize, frontZoneRadius } from './cesium-helpers';

interface Props {
  points: MapPoint[];
  onSelect: (pt: MapPoint) => void;
}

const MAJOR_LABELS = new Set([
  'tehran', 'natanz', 'isfahan', 'lincoln', 'ford',
  'hormuz', 'beirut', 'israel_r', 'tel_aviv',
  'dubai', 'red_sea', 'riyadh',
]);

export default function CesiumPoints({ points, onSelect }: Props) {
  return (
    <>
      {points.map(pt => {
        const color = catToCesiumColor(pt.cat);
        const showLabel = pt.base || MAJOR_LABELS.has(pt.id);
        const isFront = pt.cat === 'front';
        const pixelSize = markerPixelSize(pt.cat, pt.tier);

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
              color={color}
              outlineColor={color.withAlpha(0.4)}
              outlineWidth={pt.tier === 1 ? 3 : 1}
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

            {/* Labels for important points */}
            {showLabel && (
              <LabelGraphics
                text={pt.base ? `\u2B1F ${pt.label}` : pt.label}
                font="11px 'DM Sans', sans-serif"
                fillColor={Color.fromCssColorString('#e8e9ed')}
                outlineColor={Color.fromCssColorString('#0a0b0e')}
                outlineWidth={2}
                style={LabelStyle.FILL_AND_OUTLINE}
                verticalOrigin={VerticalOrigin.BOTTOM}
                horizontalOrigin={HorizontalOrigin.CENTER}
                pixelOffset={new Cartesian3(0, -14, 0) as any}
                scaleByDistance={new NearFarScalar(1e4, 1.0, 5e6, 0.4)}
                distanceDisplayCondition={new DistanceDisplayCondition(0, 5e6)}
              />
            )}
          </Entity>
        );
      })}
    </>
  );
}
