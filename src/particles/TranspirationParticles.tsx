import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { SOURCE_REGIONS } from '@/scene/terrainConfig';
import * as THREE from 'three';

export function TranspirationParticles() {
  const { layers } = useSimulationStore();
  const forestRef = useRef<THREE.Points>(null);
  const farmRef = useRef<THREE.Points>(null);

  const forestCount = 600;
  const farmCount = 500;

  const forestData = useMemo(() => {
    const pos = new Float32Array(forestCount * 3);
    for (let i = 0; i < forestCount; i++) {
      pos[i * 3] = SOURCE_REGIONS.forest.x + (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = 4 + Math.random() * 8;
      pos[i * 3 + 2] = SOURCE_REGIONS.forest.z + (Math.random() - 0.5) * 35;
    }
    return new THREE.BufferAttribute(pos, 3);
  }, []);

  const farmData = useMemo(() => {
    const pos = new Float32Array(farmCount * 3);
    for (let i = 0; i < farmCount; i++) {
      pos[i * 3] = SOURCE_REGIONS.agriculture.x + (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = 2 + Math.random() * 6;
      pos[i * 3 + 2] = SOURCE_REGIONS.agriculture.z + (Math.random() - 0.5) * 25;
    }
    return new THREE.BufferAttribute(pos, 3);
  }, []);

  useFrame((_, delta) => {
    if (!layers.transpirationVegetation) return;

    if (forestRef.current) {
      const pos = forestData.array as Float32Array;
      for (let i = 0; i < forestCount; i++) {
        pos[i * 3 + 1] += delta * 1.4; // Rise from canopy
        pos[i * 3] += delta * 1.2;     // Drift into wind
        if (pos[i * 3 + 1] > 18) {
          pos[i * 3] = SOURCE_REGIONS.forest.x + (Math.random() - 0.5) * 35;
          pos[i * 3 + 1] = 4 + Math.random() * 2;
          pos[i * 3 + 2] = SOURCE_REGIONS.forest.z + (Math.random() - 0.5) * 35;
        }
      }
      forestData.needsUpdate = true;
    }

    if (farmRef.current) {
      const pos = farmData.array as Float32Array;
      for (let i = 0; i < farmCount; i++) {
        pos[i * 3 + 1] += delta * 1.3;
        pos[i * 3] += delta * 1.0;
        if (pos[i * 3 + 1] > 14) {
          pos[i * 3] = SOURCE_REGIONS.agriculture.x + (Math.random() - 0.5) * 30;
          pos[i * 3 + 1] = 1.5 + Math.random() * 1.5;
          pos[i * 3 + 2] = SOURCE_REGIONS.agriculture.z + (Math.random() - 0.5) * 25;
        }
      }
      farmData.needsUpdate = true;
    }
  });

  if (!layers.transpirationVegetation) return null;

  return (
    <group name="transpiration-canopy-mist">
      {/* Forest canopy moisture */}
      <points ref={forestRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={forestData} />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          color="#86efac"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Farm crop evapotranspiration */}
      <points ref={farmRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={farmData} />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          color="#bef264"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
