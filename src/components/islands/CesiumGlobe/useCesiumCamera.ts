import { useCallback } from 'react';
import { Cartesian3, Math as CesiumMath } from 'cesium';
import type { CesiumComponentRef } from 'resium';
import type { Viewer as CesiumViewer } from 'cesium';
import { CAMERA_PRESETS, type CameraPresetKey } from '../../../lib/cesium-config';

export function useCesiumCamera(viewerRef: React.RefObject<CesiumComponentRef<CesiumViewer> | null>) {
  const flyTo = useCallback((presetKey: CameraPresetKey) => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const preset = CAMERA_PRESETS[presetKey];
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(preset.lon, preset.lat, preset.alt),
      orientation: {
        heading: CesiumMath.toRadians(preset.heading),
        pitch: CesiumMath.toRadians(preset.pitch),
        roll: 0,
      },
      duration: 2.0,
    });
  }, [viewerRef]);

  return { flyTo };
}
