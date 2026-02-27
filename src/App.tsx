import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PlaneCard from './components/PlaneCard';
import InfoBadge from './components/InfoBadge';
import { SEARCH_RADIUS_NM, API_BASE, MODE_STORAGE_KEY } from './utils/constants';
import { toLineOfSightMetrics } from './utils/geo';
import type { Coordinates } from './utils/geo';
import type { Aircraft, AdsbResponse } from './types/aircraft';
import './App.css';

export type Mode = 'near' | 'overhead';

export type ClosestPlane = {
  plane: Aircraft;
  horizontalMeters: number;
  altitudeMeters: number;
  totalMeters: number;
  elevationRad: number;
  bearingDeg: number;
};

const ModeToggle = ({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) => (
  <div className="mode-toggle" role="tablist" aria-label="Viewing mode">
    {(['near', 'overhead'] as Mode[]).map((value) => (
      <button
        key={value}
        role="tab"
        aria-selected={mode === value}
        className={`toggle-pill ${mode === value ? 'active' : ''}`}
        onClick={() => onChange(value)}
      >
        <span className="pill-label">{value === 'near' ? 'Nearest' : 'Overhead'}</span>
      </button>
    ))}
    <span className={`toggle-highlight ${mode}`} aria-hidden="true" />
  </div>
);

const App = () => {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'near';
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    return stored === 'overhead' ? 'overhead' : 'near';
  });
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message || 'Unable to access location.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  const { data: planes = [], isFetching, refetch, error: fetchError } = useQuery<Aircraft[]>({
    queryKey: ['planes', coords?.lat, coords?.lon],
    enabled: Boolean(coords),
    queryFn: async () => {
      if (!coords) return [] as Aircraft[];
      const url = `${API_BASE}/v2/point/${coords.lat}/${coords.lon}/${SEARCH_RADIUS_NM}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setLastUpdated(new Date());

      const data: AdsbResponse = await response.json();
      return Array.isArray(data?.ac) ? data.ac : [];
    },
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const closest = useMemo(() => {
    if (!coords || planes.length === 0) return null;

    let best: ClosestPlane | null = null;

    planes.forEach((plane) => {
      if (plane.lat == null || plane.lon == null) return;
      if (!plane.alt_geom || plane.alt_geom <= 0) return;

      const { horizontalMeters, altitudeMeters, totalMeters, elevationRad, bearingDeg } = toLineOfSightMetrics(coords, {
        lat: plane.lat,
        lon: plane.lon,
        altFeet: plane.alt_geom
      });

      if (mode === 'near') {
        if (!best || totalMeters < best.totalMeters) {
          best = { plane, horizontalMeters, altitudeMeters, totalMeters, elevationRad, bearingDeg };
        }
        return;
      }

      const isBetterElevation = !best || elevationRad > best.elevationRad;
      const isTieAndCloser =
        best && Math.abs(elevationRad - best.elevationRad) < 1e-4 && horizontalMeters < best.horizontalMeters;

      if (isBetterElevation || isTieAndCloser) {
        best = { plane, horizontalMeters, altitudeMeters, totalMeters, elevationRad, bearingDeg };
      }
    });

    return best;
  }, [coords, planes, mode]);

  const locationLabel = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : 'Waiting for GPS…';

  const errorMessage = geoError || (fetchError instanceof Error ? fetchError.message : null);

  return (
    <div className="page">
      <div className="glow" aria-hidden="true" />
      <header className="hero">
        <div>
          <p className="eyebrow">what's overhead</p>
          <h1>Planes above your head, in real time.</h1>
          <p className="lede">
            Using your GPS position and ADS-B data, see which aircraft is nearest to you or
            directly overhead. Grant location access to start scanning.
          </p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </header>

      <main className="layout">
        <section className="status-row">
          <InfoBadge label="Location" value={locationLabel} />
          <InfoBadge label="Range" value={`${SEARCH_RADIUS_NM} nm`} />
          <InfoBadge label="Last update" value={lastUpdated ? lastUpdated.toLocaleTimeString() : '—'} />
          <button className="ghost-button" onClick={() => refetch()} disabled={!coords || isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </section>

        {errorMessage && <div className="alert">{errorMessage}</div>}

        <section className="cards">
          <PlaneCard closest={closest} mode={mode} loading={isFetching} />
        </section>
      </main>

      <footer className="footer">
        <p className="muted">
          Flight data provided by <a href="https://www.adsb.lol/" target="_blank" rel="noreferrer">ADSB.lol</a>.
        </p>
      </footer>
    </div>
  );
};

export default App;
