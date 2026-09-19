// ============================================================================
// Trajectory Engine — Lagrangian Particle Tracking
// ============================================================================
// Implements Euler and RK4 integration for moisture parcel advection
// on a spherical Earth using pressure as the vertical coordinate.

import { deg2rad, rad2deg, dLambdaDt, dPhiDt, dPressureDt, R_EARTH } from './physics';
import { syntheticU, syntheticV, syntheticOmega, syntheticQ } from './syntheticDataProvider';
import type { MoistureParticle, TrajectoryPoint, ParticleSource } from '@/types/particles';

// ── Velocity Field Evaluation ───────────────────────────────────────────────

interface VelocityField {
  u: number;
  v: number;
  omega: number;
  q: number;
}

function getVelocity(lat: number, lon: number, pressure: number, time: number): VelocityField {
  return {
    u: syntheticU(lat, lon, pressure, time),
    v: syntheticV(lat, lon, pressure, time),
    omega: syntheticOmega(lat, lon, pressure, time),
    q: syntheticQ(lat, lon, pressure, time),
  };
}

// ── State Vector ────────────────────────────────────────────────────────────

interface ParticleState {
  lat: number;   // degrees
  lon: number;   // degrees
  p: number;     // hPa
}

// ── Euler Integration ───────────────────────────────────────────────────────

/**
 * Single Euler step for a moisture parcel.
 * dλ/dt = u / (R cos φ)
 * dφ/dt = v / R
 * dp/dt = ω / 100  (Pa/s → hPa/s)
 */
export function eulerStep(
  state: ParticleState,
  time: number,
  dt: number,
): ParticleState {
  const vel = getVelocity(state.lat, state.lon, state.p, time);

  const dLon = rad2deg(dLambdaDt(vel.u, state.lat)) * dt;
  const dLat = rad2deg(dPhiDt(vel.v)) * dt;
  const dP = dPressureDt(vel.omega) * dt;

  return {
    lon: state.lon + dLon,
    lat: clampLat(state.lat + dLat),
    p: clampPressure(state.p + dP),
  };
}

// ── RK4 Integration ─────────────────────────────────────────────────────────

/**
 * Fourth-order Runge-Kutta integration for higher accuracy.
 */
export function rk4Step(
  state: ParticleState,
  time: number,
  dt: number,
): ParticleState {
  // k1
  const v1 = getVelocity(state.lat, state.lon, state.p, time);
  const k1Lon = rad2deg(dLambdaDt(v1.u, state.lat));
  const k1Lat = rad2deg(dPhiDt(v1.v));
  const k1P = dPressureDt(v1.omega);

  // k2
  const s2: ParticleState = {
    lon: state.lon + k1Lon * dt / 2,
    lat: clampLat(state.lat + k1Lat * dt / 2),
    p: clampPressure(state.p + k1P * dt / 2),
  };
  const v2 = getVelocity(s2.lat, s2.lon, s2.p, time + dt / 2);
  const k2Lon = rad2deg(dLambdaDt(v2.u, s2.lat));
  const k2Lat = rad2deg(dPhiDt(v2.v));
  const k2P = dPressureDt(v2.omega);

  // k3
  const s3: ParticleState = {
    lon: state.lon + k2Lon * dt / 2,
    lat: clampLat(state.lat + k2Lat * dt / 2),
    p: clampPressure(state.p + k2P * dt / 2),
  };
  const v3 = getVelocity(s3.lat, s3.lon, s3.p, time + dt / 2);
  const k3Lon = rad2deg(dLambdaDt(v3.u, s3.lat));
  const k3Lat = rad2deg(dPhiDt(v3.v));
  const k3P = dPressureDt(v3.omega);

  // k4
  const s4: ParticleState = {
    lon: state.lon + k3Lon * dt,
    lat: clampLat(state.lat + k3Lat * dt),
    p: clampPressure(state.p + k3P * dt),
  };
  const v4 = getVelocity(s4.lat, s4.lon, s4.p, time + dt);
  const k4Lon = rad2deg(dLambdaDt(v4.u, s4.lat));
  const k4Lat = rad2deg(dPhiDt(v4.v));
  const k4P = dPressureDt(v4.omega);

  return {
    lon: state.lon + (k1Lon + 2 * k2Lon + 2 * k3Lon + k4Lon) * dt / 6,
    lat: clampLat(state.lat + (k1Lat + 2 * k2Lat + 2 * k3Lat + k4Lat) * dt / 6),
    p: clampPressure(state.p + (k1P + 2 * k2P + 2 * k3P + k4P) * dt / 6),
  };
}

// ── Backward Tracking ───────────────────────────────────────────────────────

/**
 * Backward trajectory: integrate backward in time (negate dt).
 */
export function backwardStep(
  state: ParticleState,
  time: number,
  dt: number,
  method: 'euler' | 'rk4',
): ParticleState {
  return method === 'rk4'
    ? rk4Step(state, time, -dt)
    : eulerStep(state, time, -dt);
}

// ── Particle Update ─────────────────────────────────────────────────────────

/**
 * Advance a single moisture particle by dt seconds.
 */
export function advanceParticle(
  particle: MoistureParticle,
  time: number,
  dt: number,
  method: 'euler' | 'rk4' = 'euler',
): MoistureParticle {
  if (!particle.active) return particle;

  const state: ParticleState = {
    lat: particle.latitude,
    lon: particle.longitude,
    p: particle.pressure,
  };

  const newState = method === 'rk4'
    ? rk4Step(state, time, dt)
    : eulerStep(state, time, dt);

  // Get humidity at new position
  const newQ = syntheticQ(newState.lat, newState.lon, newState.p, time + dt);

  // Compute distance traveled (great-circle approximation)
  const dLat = deg2rad(newState.lat - state.lat);
  const dLon = deg2rad(newState.lon - state.lon);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(state.lat)) * Math.cos(deg2rad(newState.lat)) * Math.sin(dLon / 2) ** 2;
  const dist = 2 * R_EARTH * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) / 1000; // km

  // Add trajectory point
  const trajPoint: TrajectoryPoint = {
    latitude: newState.lat,
    longitude: newState.lon,
    pressure: newState.p,
    time: time + dt,
    q: newQ,
  };

  // Determine state
  let newParticleState = particle.state;
  if (particle.age < 300) {
    newParticleState = 'rising';
  } else if (newState.p < 600) {
    newParticleState = 'transported';
  } else if (newQ > 0.01 && newState.p > 800) {
    newParticleState = 'condensing';
  }

  // Check if particle should precipitate (simplified: reaches sink region at low altitude)
  const inSink = newState.lat > 24 && newState.lon > 89 && newState.p > 850;
  if (inSink && newQ > 0.005) {
    newParticleState = 'precipitating';
  }

  return {
    ...particle,
    latitude: newState.lat,
    longitude: newState.lon,
    pressure: newState.p,
    q: newQ,
    age: particle.age + dt,
    state: newParticleState,
    distanceTraveled: particle.distanceTraveled + dist,
    trajectory: [...particle.trajectory.slice(-(200 - 1)), trajPoint],
    active: particle.age + dt < 3600 * 24 * 5, // max 5 days
  };
}

// ── Batch Particle Advection ────────────────────────────────────────────────

/**
 * Advance all active particles. Can be called from main thread or worker.
 */
export function advanceParticles(
  particles: MoistureParticle[],
  time: number,
  dt: number,
  method: 'euler' | 'rk4' = 'euler',
): MoistureParticle[] {
  return particles.map((p) => advanceParticle(p, time, dt, method));
}

// ── Particle Emission ───────────────────────────────────────────────────────

let nextId = 0;

/**
 * Create a new moisture particle at a source region.
 */
export function emitParticle(source: ParticleSource, time: number): MoistureParticle {
  const id = nextId++;
  const DEMO = {
    latMin: 20, latMax: 26, lonMin: 84, lonMax: 92,
  };

  let lat: number, lon: number, pressure: number;

  switch (source) {
    case 'ocean':
      lat = DEMO.latMin + Math.random() * 3;
      lon = DEMO.lonMin + Math.random() * 2;
      pressure = 1000 - Math.random() * 50;
      break;
    case 'river':
      lat = 22 + Math.random() * 2;
      lon = 87 + Math.random() * 1;
      pressure = 1000 - Math.random() * 30;
      break;
    case 'forest':
      lat = 22.5 + Math.random() * 2;
      lon = 86.5 + Math.random() * 1.5;
      pressure = 1000 - Math.random() * 40;
      break;
    case 'agriculture':
      lat = 23 + Math.random() * 2;
      lon = 89 + Math.random() * 2;
      pressure = 1000 - Math.random() * 20;
      break;
  }

  return {
    id,
    latitude: lat,
    longitude: lon,
    pressure,
    q: syntheticQ(lat, lon, pressure, time),
    mass: 0.001 + Math.random() * 0.005,
    source,
    destination: null,
    age: 0,
    state: 'evaporating',
    trajectory: [{
      latitude: lat,
      longitude: lon,
      pressure,
      time,
      q: syntheticQ(lat, lon, pressure, time),
    }],
    distanceTraveled: 0,
    active: true,
    precipitatedMass: 0,
  };
}

// ── Utilities ───────────────────────────────────────────────────────────────

function clampLat(lat: number): number {
  return Math.max(-89, Math.min(89, lat));
}

function clampPressure(p: number): number {
  return Math.max(200, Math.min(1050, p));
}
