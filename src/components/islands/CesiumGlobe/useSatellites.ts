import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cartesian3,
  Color,
  type Viewer as CesiumViewer,
  type Entity,
} from 'cesium';
import * as satellite from 'satellite.js';

interface SatRecord {
  name: string;
  satrec: satellite.SatRec;
}

interface SatPosition {
  name: string;
  lon: number;
  lat: number;
  alt: number; // km
}

/** Fetch TLE data from CelesTrak and propagate satellite positions */
export function useSatellites(
  viewer: CesiumViewer | null,
  enabled: boolean,
  groups: string[] = ['gps-ops', 'resource', 'active'],
) {
  const [count, setCount] = useState(0);
  const satsRef = useRef<SatRecord[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const animRef = useRef<number>(0);

  // Fetch TLE data
  useEffect(() => {
    if (!enabled) return;

    const fetchTLEs = async () => {
      try {
        // Fetch military-relevant satellite groups
        const tleText = await fetch(
          'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
        ).then(r => r.text());

        const lines = tleText.trim().split('\n');
        const records: SatRecord[] = [];

        for (let i = 0; i < lines.length - 2; i += 3) {
          const name = lines[i].trim();
          const tleLine1 = lines[i + 1].trim();
          const tleLine2 = lines[i + 2].trim();

          if (!tleLine1.startsWith('1') || !tleLine2.startsWith('2')) continue;

          try {
            const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
            records.push({ name, satrec });
          } catch {
            // Skip malformed TLE
          }
        }

        // Filter to a manageable subset (first 100 for performance)
        satsRef.current = records.slice(0, 100);
        setCount(satsRef.current.length);
      } catch (err) {
        console.warn('Failed to fetch TLE data:', err);
      }
    };

    fetchTLEs();
  }, [enabled]);

  // Propagate positions in animation loop
  useEffect(() => {
    if (!enabled || !viewer || satsRef.current.length === 0) return;

    // Clean up previous entities
    entitiesRef.current.forEach(e => viewer.entities.remove(e));
    entitiesRef.current = [];

    // Create entities for each satellite
    satsRef.current.forEach(sat => {
      const entity = viewer.entities.add({
        name: sat.name,
        point: {
          pixelSize: 3,
          color: Color.fromCssColorString('#00ff88').withAlpha(0.8),
        },
        label: {
          text: '',
          show: false,
        },
      });
      entitiesRef.current.push(entity);
    });

    const updatePositions = () => {
      const now = new Date();
      const gmst = satellite.gstime(now);

      satsRef.current.forEach((sat, i) => {
        const entity = entitiesRef.current[i];
        if (!entity) return;

        try {
          const posVel = satellite.propagate(sat.satrec, now);
          if (typeof posVel.position === 'boolean') return;

          const geodetic = satellite.eciToGeodetic(posVel.position, gmst);
          const lon = satellite.degreesLong(geodetic.longitude);
          const lat = satellite.degreesLat(geodetic.latitude);
          const alt = geodetic.height * 1000; // km to m

          entity.position = Cartesian3.fromDegrees(lon, lat, alt) as any;
        } catch {
          // Propagation failed for this satellite
        }
      });

      animRef.current = requestAnimationFrame(updatePositions);
    };

    animRef.current = requestAnimationFrame(updatePositions);

    return () => {
      cancelAnimationFrame(animRef.current);
      entitiesRef.current.forEach(e => viewer.entities.remove(e));
      entitiesRef.current = [];
    };
  }, [enabled, viewer, count]);

  return { count };
}
