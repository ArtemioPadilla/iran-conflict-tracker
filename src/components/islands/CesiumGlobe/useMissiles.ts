import { useEffect, useRef } from 'react';
import {
  Cartesian3,
  Color,
  CallbackProperty,
  PolylineGlowMaterialProperty,
  type Viewer as CesiumViewer,
  type Entity,
} from 'cesium';
import type { MapLine } from '../../../lib/schemas';
import { arc3D, catToCesiumColor, lineWidth, arcMaterial } from './cesium-helpers';

interface MissileAnimation {
  lineId: string;
  realStart: number;        // performance.now() when spawned
  realDuration: number;     // ms of real wall-clock time
  arcPositions: Cartesian3[];
  trailEntity: Entity | null;
  projectileEntity: Entity | null;
  completed: boolean;
}

/** Minimum real-time duration so animations are always visible */
const MIN_REAL_MS = 2500;
const MAX_CONCURRENT = 10;
/** Stagger between successive missile launches (real ms) */
const STAGGER_MS = 300;

/**
 * Renders arcs for the current date's lines.
 * - When playing: animates strike/retaliation with real-time-synced trails + projectiles.
 * - When not playing: shows all lines as static arcs.
 * - On date/lines change: cleans up all entities and rebuilds.
 */
export function useMissiles(
  viewer: CesiumViewer | null,
  lines: MapLine[],
  currentDate: string,
  isPlaying: boolean,
  simTimeRef: React.RefObject<number>,
): void {
  const animationsRef = useRef<MissileAnimation[]>([]);
  const staticEntitiesRef = useRef<Entity[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Clean up everything from the previous render
    cleanup(viewer, animationsRef.current, staticEntitiesRef.current);
    animationsRef.current = [];
    staticEntitiesRef.current = [];
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (lines.length === 0) return;

    // Determine which lines to animate vs show static
    const toAnimate: MapLine[] = [];
    const toStatic: MapLine[] = [];

    for (const line of lines) {
      if (isPlaying && (line.cat === 'strike' || line.cat === 'retaliation')) {
        toAnimate.push(line);
      } else {
        toStatic.push(line);
      }
    }

    // Render static arcs immediately
    for (const line of toStatic) {
      const positions = arc3D(line.from, line.to);
      const entity = viewer.entities.add({
        name: line.label,
        polyline: {
          positions,
          width: lineWidth(line.cat),
          material: arcMaterial(line.cat),
        },
      });
      staticEntitiesRef.current.push(entity);
    }

    // Cap animated lines
    const animatable = toAnimate.slice(0, MAX_CONCURRENT);
    // Overflow goes to static
    for (const line of toAnimate.slice(MAX_CONCURRENT)) {
      const positions = arc3D(line.from, line.to);
      const entity = viewer.entities.add({
        name: line.label,
        polyline: {
          positions,
          width: lineWidth(line.cat),
          material: arcMaterial(line.cat),
        },
      });
      staticEntitiesRef.current.push(entity);
    }

    if (animatable.length === 0) return;

    const baseTime = performance.now();

    for (let i = 0; i < animatable.length; i++) {
      const line = animatable[i];
      const arcPositions = arc3D(line.from, line.to, 60, 150_000);
      const color = catToCesiumColor(line.cat);

      const anim: MissileAnimation = {
        lineId: line.id,
        realStart: baseTime + i * STAGGER_MS,
        realDuration: MIN_REAL_MS,
        arcPositions,
        trailEntity: null,
        projectileEntity: null,
        completed: false,
      };

      // Trail entity — polyline that grows as missile advances (real-time based)
      anim.trailEntity = viewer.entities.add({
        polyline: {
          positions: new CallbackProperty(() => {
            if (anim.completed) return anim.arcPositions;
            const elapsed = performance.now() - anim.realStart;
            const progress = Math.min(Math.max(elapsed / anim.realDuration, 0), 1);
            const segCount = Math.max(1, Math.floor(progress * anim.arcPositions.length));
            return anim.arcPositions.slice(0, segCount);
          }, false) as any,
          width: lineWidth(line.cat) + 1,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: color.withAlpha(0.9),
          }),
        },
      });

      // Projectile entity — bright point at the missile head
      anim.projectileEntity = viewer.entities.add({
        position: new CallbackProperty(() => {
          if (anim.completed) return anim.arcPositions[anim.arcPositions.length - 1];
          const elapsed = performance.now() - anim.realStart;
          const progress = Math.min(Math.max(elapsed / anim.realDuration, 0), 1);
          const idx = Math.min(
            Math.floor(progress * (anim.arcPositions.length - 1)),
            anim.arcPositions.length - 1,
          );
          return anim.arcPositions[idx];
        }, false) as any,
        point: {
          pixelSize: 6,
          color: Color.WHITE,
          outlineColor: color.withAlpha(0.8),
          outlineWidth: 4,
        },
      });

      animationsRef.current.push(anim);
    }

    // Animation tick loop — check for completion
    const tick = () => {
      if (!viewer || viewer.isDestroyed()) {
        rafRef.current = 0;
        return;
      }

      let anyActive = false;

      for (const anim of animationsRef.current) {
        if (anim.completed) continue;

        const elapsed = performance.now() - anim.realStart;
        if (elapsed >= anim.realDuration) {
          // Animation complete — remove projectile, freeze trail
          if (anim.projectileEntity) {
            try { viewer.entities.remove(anim.projectileEntity); } catch { /* ok */ }
            anim.projectileEntity = null;
          }
          if (anim.trailEntity?.polyline) {
            anim.trailEntity.polyline.positions = anim.arcPositions as any;
          }
          anim.completed = true;
        } else {
          anyActive = true;
        }
      }

      if (anyActive) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (!viewer.isDestroyed()) {
        cleanup(viewer, animationsRef.current, staticEntitiesRef.current);
      }
      animationsRef.current = [];
      staticEntitiesRef.current = [];
    };
  }, [viewer, currentDate, isPlaying, lines]);
}

function cleanup(
  viewer: CesiumViewer,
  anims: MissileAnimation[],
  statics: Entity[],
) {
  for (const anim of anims) {
    if (anim.trailEntity) {
      try { viewer.entities.remove(anim.trailEntity); } catch { /* ok */ }
    }
    if (anim.projectileEntity) {
      try { viewer.entities.remove(anim.projectileEntity); } catch { /* ok */ }
    }
  }
  for (const entity of statics) {
    try { viewer.entities.remove(entity); } catch { /* ok */ }
  }
}
