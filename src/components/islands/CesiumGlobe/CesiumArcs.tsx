import { Entity, PolylineGraphics } from 'resium';
import { useMemo } from 'react';
import { PolylineDashMaterialProperty } from 'cesium';
import type { MapLine } from '../../../lib/schemas';
import { arc3D, lineToCesiumColor, lineWidth, lineDashPattern } from './cesium-helpers';

interface Props {
  lines: MapLine[];
}

export default function CesiumArcs({ lines }: Props) {
  return (
    <>
      {lines.map(line => (
        <ArcEntity key={line.id} line={line} />
      ))}
    </>
  );
}

function ArcEntity({ line }: { line: MapLine }) {
  const positions = useMemo(() => arc3D(line.from, line.to), [line.from, line.to]);
  const color = useMemo(() => lineToCesiumColor(line.cat), [line.cat]);
  const material = useMemo(
    () => new PolylineDashMaterialProperty({ color, dashLength: lineDashPattern(line.cat) }),
    [color, line.cat],
  );

  return (
    <Entity name={line.label}>
      <PolylineGraphics
        positions={positions}
        width={lineWidth(line.cat)}
        material={material}
      />
    </Entity>
  );
}
