import { FEET_TO_METERS, NM_IN_METERS } from './utils/constants';

export const formatNm = (meters: number) => `${(meters / NM_IN_METERS).toFixed(1)} nm`;
export const formatAltitude = (meters: number) =>
  `${Math.round(meters / FEET_TO_METERS).toLocaleString()} ft`;

export const feetToMeters = (feet: number) => feet * FEET_TO_METERS;

export const formatSpeedKt = (kt?: number) =>
  kt == null ? '—' : `${Math.round(kt)} kt`;

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const formatBearing = (deg: number) => {
  const wrapped = ((deg % 360) + 360) % 360;
  const idx = Math.round(wrapped / 45) % 8;
  return `${wrapped.toFixed(0)}° ${CARDINALS[idx]}`;
};
