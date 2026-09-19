// ============================================================================
// Physics Constants & Coordinate Utilities
// ============================================================================
// All units SI unless noted. Pressure in hPa where specified.

import { PRESSURE_LEVELS, type PressureLevelValue } from '@/types/atmospheric';

// ── Physical Constants ──────────────────────────────────────────────────────

/** Mean radius of the Earth (m) */
export const R_EARTH = 6.371e6;

/** Gravitational acceleration (m/s²) */
export const G = 9.80665;

/** Specific gas constant for dry air (J/(kg·K)) */
export const R_D = 287.05;

/** Specific gas constant for water vapour (J/(kg·K)) */
export const R_V = 461.5;

/** Standard sea-level pressure (hPa) */
export const P0 = 1013.25;

// ── Coordinate Conversions ──────────────────────────────────────────────────

/** Degrees → Radians */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Radians → Degrees */
export function rad2deg(rad: number): number {
  return rad * (180 / Math.PI);
}

// ── Spherical Grid Spacing ──────────────────────────────────────────────────
// In a spherical coordinate system the metric distance depends on latitude.

/**
 * Zonal (east–west) grid spacing in metres.
 * Δx = R·cos(φ)·Δλ
 * @param lat  latitude in degrees
 * @param dLon longitude spacing in degrees
 */
export function deltaX(lat: number, dLon: number): number {
  return R_EARTH * Math.cos(deg2rad(lat)) * deg2rad(dLon);
}

/**
 * Meridional (north–south) grid spacing in metres.
 * Δy = R·Δφ
 * @param dLat latitude spacing in degrees
 */
export function deltaY(dLat: number): number {
  return R_EARTH * deg2rad(dLat);
}

// ── Lagrangian Particle Motion (Spherical) ──────────────────────────────────
// dλ/dt = u / (R cos φ)
// dφ/dt = v / R
// dp/dt = ω

/**
 * Rate of change of longitude (rad/s).
 */
export function dLambdaDt(u: number, lat: number): number {
  const cosLat = Math.cos(deg2rad(lat));
  if (Math.abs(cosLat) < 1e-10) return 0; // polar singularity guard
  return u / (R_EARTH * cosLat);
}

/**
 * Rate of change of latitude (rad/s).
 */
export function dPhiDt(v: number): number {
  return v / R_EARTH;
}

/**
 * Rate of change of pressure (hPa/s).
 * omega is given in Pa/s; we convert to hPa/s.
 */
export function dPressureDt(omega: number): number {
  return omega / 100; // Pa/s → hPa/s
}

// ── Wind ────────────────────────────────────────────────────────────────────

/** Wind speed magnitude from u, v components */
export function windMagnitude(u: number, v: number): number {
  return Math.sqrt(u * u + v * v);
}

/** Wind direction in radians (mathematical convention, CCW from +x) */
export function windDirection(u: number, v: number): number {
  return Math.atan2(v, u);
}

// ── Pressure–Altitude Approximation ─────────────────────────────────────────
// This is used ONLY for 3D scene positioning, NOT for the simulation physics.
// The simulation uses pressure as the vertical coordinate.

/**
 * Convert pressure (hPa) to approximate geometric altitude (m) using
 * a simplified barometric formula: z ≈ -H·ln(p/p₀), H ≈ 8500 m.
 * This is a VISUALISATION convenience, not a scientific calculation.
 */
export function pressureToApproxAltitude(pressure: number): number {
  const H = 8500; // scale height in metres
  return -H * Math.log(pressure / P0);
}

/**
 * Convert pressure (hPa) to a normalised scene Y coordinate.
 * Maps 1000 hPa → 0 (ground) to 300 hPa → ~60 (top of atmo volume).
 */
export function pressureToSceneY(pressure: number): number {
  const minP = 300;
  const maxP = 1000;
  const t = (maxP - pressure) / (maxP - minP); // 0 at 1000, 1 at 300
  return t * 60; // scene units
}

/**
 * Convert scene Y back to pressure.
 */
export function sceneYToPressure(y: number): number {
  const minP = 300;
  const maxP = 1000;
  const t = y / 60;
  return maxP - t * (maxP - minP);
}

// ── Pressure Level Utilities ────────────────────────────────────────────────

/**
 * Get the two bounding pressure levels for interpolation.
 */
export function getBoundingLevels(pressure: number): [PressureLevelValue, PressureLevelValue] {
  const levels = [...PRESSURE_LEVELS]; // sorted descending: 1000, 850, ...
  for (let i = 0; i < levels.length - 1; i++) {
    if (pressure <= levels[i] && pressure >= levels[i + 1]) {
      return [levels[i], levels[i + 1]];
    }
  }
  // Clamp to range
  if (pressure > levels[0]) return [levels[0], levels[0]];
  return [levels[levels.length - 1], levels[levels.length - 1]];
}

/**
 * Approximate altitude labels for each pressure level (for display only).
 */
export const PRESSURE_ALTITUDE_LABELS: Record<PressureLevelValue, string> = {
  1000: '~0 m (surface)',
  850: '~1.5 km',
  700: '~3 km',
  500: '~5.5 km',
  300: '~9 km',
};

// ── Grid → Scene Coordinate Mapping ─────────────────────────────────────────
// The 3D scene uses a local coordinate system:
//   X: longitude direction (left = west = negative)
//   Y: altitude (pressure-mapped)
//   Z: latitude direction (front = south = positive)

/** Domain bounds for the demo region (degrees) */
export const DEMO_DOMAIN = {
  latMin: 20,
  latMax: 26,
  lonMin: 84,
  lonMax: 92,
};

/** Scene extent in world units */
export const SCENE_EXTENT = {
  xMin: -80,
  xMax: 80,
  zMin: -80,
  zMax: 80,
};

/**
 * Map latitude/longitude to scene XZ coordinates.
 */
export function geoToScene(lat: number, lon: number): { x: number; z: number } {
  const { latMin, latMax, lonMin, lonMax } = DEMO_DOMAIN;
  const { xMin, xMax, zMin, zMax } = SCENE_EXTENT;
  const x = xMin + ((lon - lonMin) / (lonMax - lonMin)) * (xMax - xMin);
  const z = zMax - ((lat - latMin) / (latMax - latMin)) * (zMax - zMin); // south=+z
  return { x, z };
}

/**
 * Map scene XZ coordinates back to latitude/longitude.
 */
export function sceneToGeo(x: number, z: number): { lat: number; lon: number } {
  const { latMin, latMax, lonMin, lonMax } = DEMO_DOMAIN;
  const { xMin, xMax, zMin, zMax } = SCENE_EXTENT;
  const lon = lonMin + ((x - xMin) / (xMax - xMin)) * (lonMax - lonMin);
  const lat = latMin + ((zMax - z) / (zMax - zMin)) * (latMax - latMin);
  return { lat, lon };
}
