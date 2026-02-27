import { feetToMeters } from '../formatters';

export type Coordinates = {
  lat: number;
  lon: number;
};

export const haversineMeters = (a: Coordinates, b: Coordinates) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
};

export const toLineOfSightMetrics = (
  user: Coordinates,
  plane: { lat: number; lon: number; altFeet: number }
) => {
  const horizontalMeters = haversineMeters(user, { lat: plane.lat, lon: plane.lon });
  const altitudeMeters = feetToMeters(plane.altFeet);
  const totalMeters = Math.hypot(horizontalMeters, altitudeMeters);
  const elevationRad = Math.atan2(altitudeMeters, Math.max(horizontalMeters, 1));
  const bearingDeg = bearingDegrees(user, { lat: plane.lat, lon: plane.lon });

  return { horizontalMeters, altitudeMeters, totalMeters, elevationRad, bearingDeg };
};

export const bearingDegrees = (a: Coordinates, b: Coordinates) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};
