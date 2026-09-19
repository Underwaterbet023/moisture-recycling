// ============================================================================
// Synthetic Data Provider — Deterministic Demo Fields
// ============================================================================
// Generates physically coherent synthetic atmospheric fields for demonstration.
// All values are clearly labeled as SYNTHETIC and never presented as observations.

import { PRESSURE_LEVELS, type PressureLevelValue, type AtmosphericCell, type MoistureBudget, type SourceContribution } from '@/types/atmospheric';
import { deg2rad, deltaX, deltaY, pressureToSceneY, DEMO_DOMAIN } from './physics';

// ── Grid Configuration ──────────────────────────────────────────────────────

export const GRID = {
  nLat: 16,
  nLon: 16,
  nLev: PRESSURE_LEVELS.length,
  get dLat() { return (DEMO_DOMAIN.latMax - DEMO_DOMAIN.latMin) / this.nLat; },
  get dLon() { return (DEMO_DOMAIN.lonMax - DEMO_DOMAIN.lonMin) / this.nLon; },
};

// ── Deterministic Field Functions ───────────────────────────────────────────
// These produce smooth, spatially varying fields without randomness.

/**
 * Zonal wind (m/s). Westerly flow with latitude-dependent jet structure.
 * Stronger at upper levels (jet stream effect).
 */
export function syntheticU(lat: number, lon: number, pressure: number, _time: number): number {
  const pNorm = (1000 - pressure) / 700; // 0 at surface, 1 at 300 hPa
  const latRad = deg2rad(lat);
  // Base westerly + jet at ~30°N
  const jet = 5 * Math.exp(-Math.pow((lat - 25) / 3, 2));
  return 3 + jet + pNorm * 8 + 2 * Math.sin(deg2rad(lon) * 2) + Math.sin(_time * 0.0001) * 1.5;
}

/**
 * Meridional wind (m/s). Weak southerly with perturbations.
 */
export function syntheticV(lat: number, lon: number, pressure: number, _time: number): number {
  const pNorm = (1000 - pressure) / 700;
  return -1.5 + 2 * Math.cos(deg2rad(lat - 22) * 3) * Math.sin(deg2rad(lon - 88) * 2)
    + pNorm * 1.5 + Math.cos(_time * 0.00015) * 0.8;
}

/**
 * Pressure vertical velocity ω (Pa/s).
 * Negative = upward motion in pressure coordinates.
 * Upward over source regions (evaporation/convection), downward in sink regions (subsidence).
 */
export function syntheticOmega(lat: number, lon: number, pressure: number, _time: number): number {
  const pNorm = (1000 - pressure) / 700;

  // Upward motion over ocean (evaporation zone, lon < 86)
  const oceanUp = lon < 86 ? -0.08 * Math.exp(-pNorm * 2) : 0;

  // Upward motion over forest/vegetation (22–24°N, 86–88°E)
  const vegUp = Math.exp(-Math.pow((lat - 23) / 2, 2) - Math.pow((lon - 87) / 2, 2)) * -0.06;

  // Downward motion (subsidence) in sink region (24–26°N, 89–91°E)
  const sinkDown = Math.exp(-Math.pow((lat - 25) / 2, 2) - Math.pow((lon - 90) / 2, 2)) * 0.05;

  // Mid-level convergence
  const midLev = pNorm > 0.3 && pNorm < 0.7 ? -0.02 * Math.sin(pNorm * Math.PI) : 0;

  return oceanUp + vegUp + sinkDown + midLev;
}

/**
 * Specific humidity (kg/kg).
 * Decreases with altitude. Higher over ocean and vegetation.
 */
export function syntheticQ(lat: number, lon: number, pressure: number, _time: number): number {
  const pNorm = (1000 - pressure) / 700;

  // Base humidity decreasing exponentially with altitude
  const base = 0.012 * Math.exp(-pNorm * 3);

  // Ocean moisture enhancement
  const oceanMoist = lon < 86 ? 0.004 * Math.exp(-pNorm * 2) : 0;

  // Vegetation moisture
  const vegMoist = Math.exp(-Math.pow((lat - 23) / 3, 2) - Math.pow((lon - 87) / 3, 2))
    * 0.002 * Math.exp(-pNorm * 2);

  // Temporal variation
  const timeVar = Math.sin(_time * 0.0002) * 0.001;

  return Math.max(0.0001, base + oceanMoist + vegMoist + timeVar);
}

// ── Grid Cell Retrieval ─────────────────────────────────────────────────────

/**
 * Get atmospheric data for a specific grid cell.
 */
export function getCell(i: number, j: number, k: number, time: number): AtmosphericCell {
  const lat = DEMO_DOMAIN.latMin + (i + 0.5) * GRID.dLat;
  const lon = DEMO_DOMAIN.lonMin + (j + 0.5) * GRID.dLon;
  const pressure = PRESSURE_LEVELS[k];

  return {
    i, j, k,
    latitude: lat,
    longitude: lon,
    pressure,
    timestamp: `2020-08-01T${Math.floor(12 + time / 3600) % 24}:00:00Z`,
    q: syntheticQ(lat, lon, pressure, time),
    u: syntheticU(lat, lon, pressure, time),
    v: syntheticV(lat, lon, pressure, time),
    omega: syntheticOmega(lat, lon, pressure, time),
    surfacePressure: 1013.25,
  };
}

/**
 * Get interpolated atmospheric values at arbitrary lat/lon/pressure.
 * Uses trilinear interpolation within the grid.
 */
export function getInterpolated(lat: number, lon: number, pressure: number, time: number): AtmosphericCell {
  // For the synthetic provider, we just evaluate the smooth functions directly
  return {
    i: -1, j: -1, k: -1,
    latitude: lat,
    longitude: lon,
    pressure: pressure as PressureLevelValue,
    timestamp: '',
    q: syntheticQ(lat, lon, pressure, time),
    u: syntheticU(lat, lon, pressure, time),
    v: syntheticV(lat, lon, pressure, time),
    omega: syntheticOmega(lat, lon, pressure, time),
    surfacePressure: 1013.25,
  };
}

// ── Moisture Budget Calculation ─────────────────────────────────────────────

/**
 * Compute moisture budget terms for a grid cell using finite differences.
 */
export function computeMoistureBudget(i: number, j: number, k: number, time: number): MoistureBudget {
  const cell = getCell(i, j, k, time);
  const lat = cell.latitude;

  // Spatial derivatives using central differences (or forward/backward at boundaries)
  const dx = deltaX(lat, GRID.dLon);
  const dy = deltaY(GRID.dLat);

  // ∂q/∂x
  let dq_dx: number;
  if (j > 0 && j < GRID.nLon - 1) {
    const qPlus = getCell(i, j + 1, k, time).q;
    const qMinus = getCell(i, j - 1, k, time).q;
    dq_dx = (qPlus - qMinus) / (2 * dx);
  } else if (j === 0) {
    dq_dx = (getCell(i, j + 1, k, time).q - cell.q) / dx;
  } else {
    dq_dx = (cell.q - getCell(i, j - 1, k, time).q) / dx;
  }

  // ∂q/∂y
  let dq_dy: number;
  if (i > 0 && i < GRID.nLat - 1) {
    const qPlus = getCell(i + 1, j, k, time).q;
    const qMinus = getCell(i - 1, j, k, time).q;
    dq_dy = (qPlus - qMinus) / (2 * dy);
  } else if (i === 0) {
    dq_dy = (getCell(i + 1, j, k, time).q - cell.q) / dy;
  } else {
    dq_dy = (cell.q - getCell(i - 1, j, k, time).q) / dy;
  }

  // ∂q/∂p
  let dq_dp: number;
  if (k > 0 && k < GRID.nLev - 1) {
    const qAbove = getCell(i, j, k + 1, time).q;
    const qBelow = getCell(i, j, k - 1, time).q;
    const pAbove = PRESSURE_LEVELS[k + 1];
    const pBelow = PRESSURE_LEVELS[k - 1];
    dq_dp = (qAbove - qBelow) / ((pAbove - pBelow) * 100); // convert hPa to Pa
  } else if (k === 0) {
    const qAbove = getCell(i, j, k + 1, time).q;
    const dp = (PRESSURE_LEVELS[k + 1] - PRESSURE_LEVELS[k]) * 100;
    dq_dp = (qAbove - cell.q) / dp;
  } else {
    const qBelow = getCell(i, j, k - 1, time).q;
    const dp = (PRESSURE_LEVELS[k] - PRESSURE_LEVELS[k - 1]) * 100;
    dq_dp = (cell.q - qBelow) / dp;
  }

  const horizontalAdvection = -(cell.u * dq_dx + cell.v * dq_dy);
  const verticalAdvection = -(cell.omega * dq_dp);

  // Moisture flux magnitude (vertically local)
  const moistureFluxX = cell.q * cell.u;
  const moistureFluxY = cell.q * cell.v;
  const moistureFlux = Math.sqrt(moistureFluxX ** 2 + moistureFluxY ** 2);

  // Flux convergence (simplified — full version uses vertically integrated values)
  const fluxConvergence = -(dq_dx * cell.u + dq_dy * cell.v);

  const source = horizontalAdvection + verticalAdvection + fluxConvergence;

  return {
    dq_dx,
    dq_dy,
    dq_dp,
    horizontalAdvection,
    verticalAdvection,
    moistureFlux,
    moistureFluxX,
    moistureFluxY,
    fluxConvergence,
    source,
  };
}

// ── Source Contribution ─────────────────────────────────────────────────────

/**
 * Get source contribution (from simulation particle statistics).
 * In synthetic mode, returns plausible demo values that evolve with time.
 */
export function getSourceContribution(time: number): SourceContribution {
  const t = time * 0.0001;
  const base = { ocean: 0.42, forest: 0.18, agriculture: 0.20, river: 0.12, otherLand: 0.08 };
  // Small temporal oscillation
  const osc = Math.sin(t) * 0.03;
  return {
    ocean: base.ocean + osc,
    forest: base.forest - osc * 0.5,
    agriculture: base.agriculture + osc * 0.3,
    river: base.river - osc * 0.2,
    otherLand: base.otherLand + osc * 0.1,
  };
}
