// ============================================================================
// Realistic Precipitation System — Cloud-Coupled Rainfall Droplets
// ============================================================================
// Simulates atmospheric rain droplets emerging beneath the dense volumetric
// cloud base, accelerating downward under gravity toward the terrain and
// mountain runoff catchment, with wind deflection and rate coupling.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { heightAt } from '@/scene/terrainConfig';
import * as THREE from 'three';

// Cloud base height where rain droplets condense and fall
const CLOUD_BASE_Y = 32.0;

export function Precipitation() {
  const { layers, precipitationRate } = useSimulationStore();
  const pointsRef = useRef<THREE.Points>(null);

  // Pool size of rain droplets
  const maxDrops = 1400;

  // Particle state buffers: positions, velocities, lifetimes
  const { positions, colors, velocities, initialX, initialZ } = useMemo(() => {
    const pos = new Float32Array(maxDrops * 3);
    const col = new Float32Array(maxDrops * 3);
    const vel = new Float32Array(maxDrops);
    const initX = new Float32Array(maxDrops);
    const initZ = new Float32Array(maxDrops);

    for (let i = 0; i < maxDrops; i++) {
      // 65% rainfall beneath the primary mountain condensation cloud (X: 10..34, Z: -36..-14)
      // 35% rainfall feeding the high alpine headwaters (X: 30..55, Z: -75..-40)
      const isAlpine = i < maxDrops * 0.35;
      let rx = 0, rz = 0;
      if (isAlpine) {
        rx = 40 + (Math.random() - 0.5) * 45;
        rz = -60 + (Math.random() - 0.5) * 45;
      } else {
        rx = 22 + (Math.random() - 0.5) * 26;
        rz = -25 + (Math.random() - 0.5) * 24;
      }

      initX[i] = rx;
      initZ[i] = rz;

      const ry = Math.random() * CLOUD_BASE_Y;

      pos[i * 3] = rx;
      pos[i * 3 + 1] = ry;
      pos[i * 3 + 2] = rz;

      // Initial downward velocity
      vel[i] = 18 + Math.random() * 14;

      // Realistic raindrop color: translucent, soft water droplet hue (not long blue lines)
      col[i * 3] = 0.72;
      col[i * 3 + 1] = 0.84;
      col[i * 3 + 2] = 0.96;
    }

    return {
      positions: pos,
      colors: col,
      velocities: vel,
      initialX: initX,
      initialZ: initZ,
    };
  }, []);

  useFrame((_, delta) => {
    if (!layers.cloudsPrecipitation || !pointsRef.current) return;

    // Active droplet count scales dynamically with simulation precipitationRate
    // Rate ~ 2 mm/h -> ~400 drops, Rate ~ 12 mm/h -> ~1300 drops
    const activeCount = Math.min(
      maxDrops,
      Math.max(150, Math.floor((precipitationRate / 10) * maxDrops))
    );

    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    const gravity = 28.0; // Gravity acceleration (m/s^2 in scene scale)
    const windSpeedX = 2.2;
    const windSpeedZ = -0.8;

    for (let i = 0; i < maxDrops; i++) {
      const idx = i * 3;

      if (i >= activeCount) {
        // Hide inactive drops below terrain
        posArr[idx + 1] = -100;
        continue;
      }

      // Accelerate droplet downward
      velocities[i] += gravity * delta * 0.4;
      posArr[idx + 1] -= velocities[i] * delta;

      // Gentle atmospheric wind drift
      posArr[idx] += windSpeedX * delta;
      posArr[idx + 2] += windSpeedZ * delta;

      // Check ground/water collision
      const groundY = heightAt(posArr[idx], posArr[idx + 2]);
      if (posArr[idx + 1] <= groundY || posArr[idx + 1] < 0) {
        // Reset droplet to cloud base with natural spatial jitter
        const isAlpine = i < maxDrops * 0.35;
        if (isAlpine) {
          posArr[idx] = 40 + (Math.random() - 0.5) * 45;
          posArr[idx + 2] = -60 + (Math.random() - 0.5) * 45;
        } else {
          posArr[idx] = 22 + (Math.random() - 0.5) * 26;
          posArr[idx + 2] = -25 + (Math.random() - 0.5) * 24;
        }

        // Start directly at cloud base
        posArr[idx + 1] = CLOUD_BASE_Y - Math.random() * 2.5;
        velocities[i] = 16 + Math.random() * 10;
      }

      // Soft opacity gradient: droplets are translucent at birth, most visible mid-fall
      const fallDist = CLOUD_BASE_Y - posArr[idx + 1];
      const brightness = Math.min(0.85, Math.max(0.3, fallDist / 8.0));
      colArr[idx] = 0.75 * brightness;
      colArr[idx + 1] = 0.86 * brightness;
      colArr[idx + 2] = 0.98 * brightness;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (!layers.cloudsPrecipitation) return null;

  const positionAttr = new THREE.BufferAttribute(positions, 3);
  const colorAttr = new THREE.BufferAttribute(colors, 3);

  return (
    <points ref={pointsRef} name="realistic-precipitation-droplets">
      <bufferGeometry>
        <primitive attach="attributes-position" object={positionAttr} />
        <primitive attach="attributes-color" object={colorAttr} />
      </bufferGeometry>
      <pointsMaterial
        size={0.42}
        vertexColors
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
