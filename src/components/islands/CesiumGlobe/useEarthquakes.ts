import { useState, useEffect, useRef } from 'react';
import {
  Cartesian3,
  Color,
  type Viewer as CesiumViewer,
  type Entity,
} from 'cesium';

interface Earthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  lon: number;
  lat: number;
  depth: number;
}

/** Fetch seismic data from USGS Earthquake API (free, no key) */
export function useEarthquakes(viewer: CesiumViewer | null, enabled: boolean) {
  const [count, setCount] = useState(0);
  const entitiesRef = useRef<Entity[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled || !viewer) return;

    const fetchQuakes = async () => {
      try {
        const res = await fetch(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
        );
        if (!res.ok) return;

        const data = await res.json();
        const quakes: Earthquake[] = data.features.map((f: any) => ({
          id: f.id,
          mag: f.properties.mag,
          place: f.properties.place,
          time: f.properties.time,
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          depth: f.geometry.coordinates[2],
        }));

        // Remove old entities
        entitiesRef.current.forEach(e => viewer.entities.remove(e));
        entitiesRef.current = [];

        // Add new entities
        quakes.forEach(q => {
          const size = Math.max(4, q.mag * 3);
          // Color by depth: shallow=red, medium=orange, deep=yellow
          const depthNorm = Math.min(q.depth / 300, 1);
          const color = Color.fromHsl(0.08 * depthNorm, 0.9, 0.5, 0.8);

          const entity = viewer.entities.add({
            name: `M${q.mag.toFixed(1)} - ${q.place}`,
            position: Cartesian3.fromDegrees(q.lon, q.lat, 0),
            point: {
              pixelSize: size,
              color,
              outlineColor: color.withAlpha(0.3),
              outlineWidth: 2,
            },
          });
          entitiesRef.current.push(entity);
        });

        setCount(quakes.length);
      } catch (err) {
        console.warn('Failed to fetch earthquake data:', err);
      }
    };

    fetchQuakes();
    intervalRef.current = setInterval(fetchQuakes, 60_000); // Every 60s

    return () => {
      clearInterval(intervalRef.current);
      entitiesRef.current.forEach(e => viewer.entities.remove(e));
      entitiesRef.current = [];
      setCount(0);
    };
  }, [enabled, viewer]);

  return { count };
}
