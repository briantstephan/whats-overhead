import InfoBadge from './InfoBadge';
import { formatAltitude, formatBearing, formatNm, formatSpeedKt } from '../formatters';
import type { ClosestPlane, Mode } from '../App';

const toDegrees = (rad: number) => (rad * 180) / Math.PI;

type PlaneCardProps = {
  closest: ClosestPlane | null;
  mode: Mode;
  loading: boolean;
};

const PlaneCard = ({ closest, mode, loading }: PlaneCardProps) => {
  if (loading && !closest) {
    return (
      <article className="plane-card ghost">
        <div className="spinner" aria-label="Loading flights" />
        <p className="muted">Scanning the sky…</p>
      </article>
    );
  }

  if (!closest) {
    return (
      <article className="plane-card ghost">
        <p className="muted">No aircraft in range yet.</p>
      </article>
    );
  }

  const label = mode === 'near' ? 'Closest by distance' : 'Closest overhead';
  const { plane, horizontalMeters, altitudeMeters, totalMeters, elevationRad, bearingDeg } = closest;
  const elevationDeg = toDegrees(elevationRad);

  return (
    <article className="plane-card">
      <div className="card-header">
        <p className="eyebrow">{label}</p>
        <h2>{plane.t ?? 'Unknown type'}</h2>
        <p className="flight">{plane.flight ?? 'No callsign'}</p>
      </div>
      <div className="card-metrics">
        <InfoBadge label="Line-of-sight" value={`${formatNm(totalMeters)} @ ${formatBearing(bearingDeg)}`} />
        <InfoBadge label="Altitude" value={formatAltitude(altitudeMeters)} />
        <InfoBadge label="Speed" value={formatSpeedKt(plane.gs)} />
        {mode === 'overhead' && <InfoBadge label="Elevation" value={`${elevationDeg.toFixed(1)}°`} />}
      </div>
    </article>
  );
};

export default PlaneCard;
