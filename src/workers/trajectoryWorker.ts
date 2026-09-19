// ============================================================================
// Trajectory Web Worker
// ============================================================================
// Offloads particle trajectory computation to a background thread.
// Receives particle batch + atmospheric state, returns updated positions.

// Note: In the current synthetic mode, calculations are fast enough for the main thread.
// This worker is prepared for when real ERA5 data with heavy interpolation is connected.

import { advanceParticles } from '../simulation/trajectoryEngine';
import type { MoistureParticle } from '../types/particles';

export interface TrajectoryWorkerInput {
  particles: MoistureParticle[];
  time: number;
  dt: number;
  method: 'euler' | 'rk4';
}

export interface TrajectoryWorkerOutput {
  particles: MoistureParticle[];
}

self.onmessage = (e: MessageEvent<TrajectoryWorkerInput>) => {
  const { particles, time, dt, method } = e.data;
  const updated = advanceParticles(particles, time, dt, method);
  self.postMessage({ particles: updated } satisfies TrajectoryWorkerOutput);
};
