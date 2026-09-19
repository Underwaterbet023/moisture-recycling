// ============================================================================
// Simulation Engine — Main Loop Controller
// ============================================================================
// Drives the simulation clock and orchestrates particle updates,
// atmospheric field evaluation, and analytics computation.

import { useSimulationStore } from './simulationStore';
import { advanceParticles, emitParticle } from './trajectoryEngine';
import { getSourceContribution } from './syntheticDataProvider';
import type { MoistureParticle, ParticleSource } from '@/types/particles';
import { QUALITY_PARTICLE_CONFIGS } from '@/types/particles';

// ── Particle Pool ───────────────────────────────────────────────────────────

let particles: MoistureParticle[] = [];
let lastEmitTime = 0;

export function getParticles(): MoistureParticle[] {
  return particles;
}

export function resetParticles(): void {
  particles = [];
  lastEmitTime = 0;
}

// ── Emission Sources ────────────────────────────────────────────────────────

const SOURCES: ParticleSource[] = ['ocean', 'river', 'forest', 'agriculture'];
const SOURCE_WEIGHTS: Record<ParticleSource, number> = {
  ocean: 0.40,
  river: 0.15,
  forest: 0.25,
  agriculture: 0.20,
};

function selectSource(): ParticleSource {
  const r = Math.random();
  let cumulative = 0;
  for (const s of SOURCES) {
    cumulative += SOURCE_WEIGHTS[s];
    if (r < cumulative) return s;
  }
  return 'ocean';
}

// ── Main Tick ───────────────────────────────────────────────────────────────

/**
 * Advance the simulation by dt seconds.
 * Called from the React Three Fiber render loop.
 */
export function simulationTick(dt: number): void {
  const store = useSimulationStore.getState();
  if (!store.isPlaying) return;

  const scaledDt = dt * store.speed * 3600; // Convert to simulation seconds (1 real second = 1 hour at 1x)
  const newTime = store.simulationTime + scaledDt;
  const quality = store.quality;
  const config = QUALITY_PARTICLE_CONFIGS[quality];
  const method = store.integrationMethod;

  // Update simulation time in store
  store.setSimulationTime(newTime);

  // Update timestamp display
  const hours = Math.floor(newTime / 3600) % 24;
  const day = Math.floor(newTime / (3600 * 24));
  const baseDay = 1 + day;
  store.setSimulationTime(newTime);

  // ── Emit new particles ──
  const emitInterval = 1 / config.emissionRate; // seconds between emissions
  if (newTime - lastEmitTime > emitInterval * 3600) {
    const numToEmit = Math.min(5, config.maxParticles - particles.length);
    for (let i = 0; i < numToEmit; i++) {
      if (particles.length < config.maxParticles) {
        particles.push(emitParticle(selectSource(), newTime));
      }
    }
    lastEmitTime = newTime;
  }

  // ── Advance existing particles ──
  particles = advanceParticles(particles, newTime, scaledDt, method);

  // ── Remove dead particles ──
  particles = particles.filter((p) => p.active);

  // ── Update analytics ──
  // Source contribution from synthetic provider
  const contrib = getSourceContribution(newTime);
  store.setSourceContribution(contrib);

  // Simple precipitation rate estimate from converging particles
  const precipitating = particles.filter((p) => p.state === 'precipitating').length;
  store.setPrecipitationRate(Math.max(2, 5 + precipitating * 0.3 + Math.sin(newTime * 0.0001) * 3));

  // ET rate
  store.setEtRate(3.5 + Math.sin(newTime * 0.00015) * 1.5);
}

/**
 * Get particles filtered by current visualization settings.
 */
export function getVisibleParticles(): MoistureParticle[] {
  const store = useSimulationStore.getState();
  const pressure = store.selectedPressure;

  if (pressure === 'all') return particles;

  // Filter to particles near the selected pressure level
  const range = 100; // hPa tolerance
  return particles.filter(
    (p) => Math.abs(p.pressure - pressure) < range
  );
}

/**
 * Get particle count statistics.
 */
export function getParticleStats() {
  const bySource: Record<ParticleSource, number> = {
    ocean: 0, river: 0, forest: 0, agriculture: 0,
  };
  const byState: Record<string, number> = {};

  for (const p of particles) {
    bySource[p.source]++;
    byState[p.state] = (byState[p.state] || 0) + 1;
  }

  return {
    total: particles.length,
    bySource,
    byState,
  };
}
