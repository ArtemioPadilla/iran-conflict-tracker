import { useState, useEffect, useRef } from 'react';
import {
  Cartesian3,
  Color,
  type Viewer as CesiumViewer,
  type Entity,
} from 'cesium';

interface FlightState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
  true_track: number | null;
  on_ground: boolean;
}

/** Fetch live flight data from OpenSky Network (free tier) */
export function useFlights(viewer: CesiumViewer | null, enabled: boolean) {
  const [count, setCount] = useState(0);
  const entitiesRef = useRef<Map<string, Entity>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled || !viewer) return;

    const fetchFlights = async () => {
      try {
        // Middle East bounding box
        const url =
          'https://opensky-network.org/api/states/all?lamin=12&lamax=42&lomin=24&lomax=65';
        const res = await fetch(url);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.states) return;

        const flights: FlightState[] = data.states.map((s: any[]) => ({
          icao24: s[0],
          callsign: s[1]?.trim() || null,
          origin_country: s[2],
          longitude: s[5],
          latitude: s[6],
          baro_altitude: s[7],
          velocity: s[9],
          true_track: s[10],
          on_ground: s[8],
        }));

        const airborne = flights.filter(
          f => !f.on_ground && f.longitude != null && f.latitude != null,
        );

        // Track which IDs we've seen this update
        const seenIds = new Set<string>();

        airborne.forEach(f => {
          seenIds.add(f.icao24);
          const alt = (f.baro_altitude || 10000) * 1; // meters
          const pos = Cartesian3.fromDegrees(f.longitude!, f.latitude!, alt);

          const existing = entitiesRef.current.get(f.icao24);
          if (existing) {
            existing.position = pos as any;
          } else {
            const entity = viewer.entities.add({
              name: f.callsign || f.icao24,
              position: pos,
              point: {
                pixelSize: 4,
                color: Color.fromCssColorString('#00aaff').withAlpha(0.7),
                outlineColor: Color.fromCssColorString('#00aaff').withAlpha(0.3),
                outlineWidth: 1,
              },
            });
            entitiesRef.current.set(f.icao24, entity);
          }
        });

        // Remove stale entities
        for (const [id, entity] of entitiesRef.current) {
          if (!seenIds.has(id)) {
            viewer.entities.remove(entity);
            entitiesRef.current.delete(id);
          }
        }

        setCount(airborne.length);
      } catch (err) {
        console.warn('Failed to fetch flight data:', err);
      }
    };

    fetchFlights();
    intervalRef.current = setInterval(fetchFlights, 15_000); // Every 15s (rate limit friendly)

    return () => {
      clearInterval(intervalRef.current);
      entitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
      entitiesRef.current.clear();
      setCount(0);
    };
  }, [enabled, viewer]);

  return { count };
}
