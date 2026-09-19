// ============================================================================
// Particle Types — Moisture Recycling Simulation
// ============================================================================

/** Moisture source categories */
export type ParticleSource = 'ocean' | 'river' | 'forest' | 'agriculture';

/** Particle lifecycle state */
export type ParticleState = 'evaporating' | 'rising' | 'transported' | 'condensing' | 'precipitating' | 'deposited';

/** A single point in a particle's trajectory history */
export interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  pressure: number;     // hPa
  time: number;         // simulation seconds
  q: number;            // specific humidity at that point
}

/** Core moisture particle data — stored in typed arrays for GPU performance */
export interface MoistureParticle {
  /** Unique identifier */
  id: number;
  /** Current geographic position */
  latitude: number;
  longitude: number;
  /** Current pressure level (hPa) */
  pressure: number;
  /** Specific humidity carried (kg/kg) */
  q: number;
  /** Mass of moisture (kg) */
  mass: number;
  /** Source region */
  source: ParticleSource;
  /** Destination / sink (if precipitated) */
  destination: ParticleSource | 'sink' | null;
  /** Age in simulation seconds */
  age: number;
  /** Lifecycle state */
  state: ParticleState;
  /** Trajectory history */
  trajectory: TrajectoryPoint[];
  /** Total distance traveled (km) */
  distanceTraveled: number;
  /** Whether particle is active in simulation */
  active: boolean;
  /** Precipitated mass (kg) — how much has been deposited */
  precipitatedMass: number;
}

/** Particle color mapping by source */
export const PARTICLE_COLORS: Record<ParticleSource, string> = {
  ocean: '#00c8ff',     // cyan
  river: '#4090ff',     // blue
  forest: '#34d399',    // green
  agriculture: '#80e060', // light green
};

/** Particle state colors */
export const STATE_COLORS: Record<ParticleState, string> = {
  evaporating: '#00d4ff',
  rising: '#40b0ff',
  transported: '#3080d0',
  condensing: '#ffffff',
  precipitating: '#8080ff',
  deposited: '#404060',
};

/** Selected particle info for inspector panel */
export interface SelectedParticle {
  particle: MoistureParticle;
  screenPosition: { x: number; y: number };
}

/** Particle system configuration */
export interface ParticleConfig {
  maxParticles: number;
  trailLength: number;
  emissionRate: number;       // particles per second
  maxAge: number;             // max lifetime in simulation seconds
  maxTrajectoryDuration: number; // seconds
}

/** Quality-dependent particle configs */
export const QUALITY_PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
  low: {
    maxParticles: 1000,
    trailLength: 20,
    emissionRate: 5,
    maxAge: 3600 * 24,
    maxTrajectoryDuration: 3600 * 48,
  },
  medium: {
    maxParticles: 5000,
    trailLength: 50,
    emissionRate: 15,
    maxAge: 3600 * 24 * 2,
    maxTrajectoryDuration: 3600 * 72,
  },
  high: {
    maxParticles: 20000,
    trailLength: 100,
    emissionRate: 40,
    maxAge: 3600 * 24 * 3,
    maxTrajectoryDuration: 3600 * 120,
  },
  research: {
    maxParticles: 50000,
    trailLength: 200,
    emissionRate: 100,
    maxAge: 3600 * 24 * 5,
    maxTrajectoryDuration: 3600 * 240,
  },
};
