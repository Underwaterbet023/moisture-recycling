import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { riverCenterX, riverWaterElevation } from '@/scene/terrainConfig';
import * as THREE from 'three';

export function EvaporationParticles() {
  const { layers } = useSimulationStore();
  const oceanRef = useRef<THREE.Points>(null);
  const riverRef = useRef<THREE.Points>(null);

  const oceanCount = 800;
  const riverCount = 400;

  // Tiny misty micro-droplets rising from water
  const oceanData = useMemo(() => {
    const pos = new Float32Array(oceanCount * 3);
    for (let i = 0; i < oceanCount; i++) {
      pos[i * 3] = -75 + Math.random() * 45;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    return new THREE.BufferAttribute(pos, 3);
  }, []);

  const riverData = useMemo(() => {
    const pos = new Float32Array(riverCount * 3);
    for (let i = 0; i < riverCount; i++) {
      const z = -80 + Math.random() * 155;
      const cx = riverCenterX(z);
      const cy = riverWaterElevation(z);
      pos[i * 3] = cx + (Math.random() - 0.5) * 4.0;
      pos[i * 3 + 1] = cy + Math.random() * 5.0;
      pos[i * 3 + 2] = z;
    }
    return new THREE.BufferAttribute(pos, 3);
  }, []);

  useFrame((_, delta) => {
    if (!layers.evaporationOceanRiver) return;

    if (oceanRef.current) {
      const pos = oceanData.array as Float32Array;
      for (let i = 0; i < oceanCount; i++) {
        pos[i * 3 + 1] += delta * 1.8; // Gentle upward rise
        pos[i * 3] += delta * 0.8;     // Slight eastward atmospheric drift (+x)
        if (pos[i * 3 + 1] > 12) {
          pos[i * 3] = -75 + Math.random() * 45;
          pos[i * 3 + 1] = 0.2;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
        }
      }
      oceanData.needsUpdate = true;
    }

    if (riverRef.current) {
      const pos = riverData.array as Float32Array;
      for (let i = 0; i < riverCount; i++) {
        pos[i * 3 + 1] += delta * 1.5;
        pos[i * 3] += delta * 0.4;
        const z = pos[i * 3 + 2];
        const cy = riverWaterElevation(z);
        if (pos[i * 3 + 1] > cy + 8.0) {
          const newZ = -80 + Math.random() * 155;
          const cx = riverCenterX(newZ);
          const baseCy = riverWaterElevation(newZ);
          pos[i * 3] = cx + (Math.random() - 0.5) * 4.0;
          pos[i * 3 + 1] = baseCy + 0.2;
          pos[i * 3 + 2] = newZ;
        }
      }
      riverData.needsUpdate = true;
    }
  });

  if (!layers.evaporationOceanRiver) return null;

  return (
    <group name="evaporation-mist">
      <points ref={oceanRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={oceanData} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#93c5fd"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={riverRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={riverData} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#93c5fd"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
