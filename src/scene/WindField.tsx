import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { SCENE_EXTENT, pressureToSceneY, sceneToGeo } from '@/simulation/physics';
import { PRESSURE_LEVELS } from '@/types/atmospheric';
import { syntheticU, syntheticV } from '@/simulation/syntheticDataProvider';
import * as THREE from 'three';

export function WindField() {
  const layers = useSimulationStore((s) => s.layers);
  const particleRef = useRef<THREE.Points>(null);

  // Subtle flowing streamline particles (no giant yellow triangles)
  const count = 600;

  const { particlePositions, velocities, particlePosAttr } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = SCENE_EXTENT.xMin + Math.random() * (SCENE_EXTENT.xMax - SCENE_EXTENT.xMin);
      const z = SCENE_EXTENT.zMin + Math.random() * (SCENE_EXTENT.zMax - SCENE_EXTENT.zMin);
      const pIdx = Math.floor(Math.random() * PRESSURE_LEVELS.length);
      const y = pressureToSceneY(PRESSURE_LEVELS[pIdx]);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }

    return {
      particlePositions: pos,
      velocities: vels,
      particlePosAttr: new THREE.BufferAttribute(pos, 3),
    };
  }, []);

  useFrame((_, delta) => {
    if (!layers.windVectors || !particleRef.current) return;

    const pos = particlePosAttr.array as Float32Array;
    const simTime = useSimulationStore.getState().simulationTime;

    for (let i = 0; i < count; i++) {
      const x = pos[i * 3];
      const z = pos[i * 3 + 2];
      const { lat, lon } = sceneToGeo(x, z);

      const u = syntheticU(lat, lon, 850, simTime);
      const v = syntheticV(lat, lon, 850, simTime);

      // Smooth horizontal flow velocity
      pos[i * 3] += u * delta * 1.8;
      pos[i * 3 + 2] -= v * delta * 1.8;

      // Wrap around domain boundaries
      if (pos[i * 3] > SCENE_EXTENT.xMax) pos[i * 3] = SCENE_EXTENT.xMin;
      if (pos[i * 3] < SCENE_EXTENT.xMin) pos[i * 3] = SCENE_EXTENT.xMax;
      if (pos[i * 3 + 2] > SCENE_EXTENT.zMax) pos[i * 3 + 2] = SCENE_EXTENT.zMin;
      if (pos[i * 3 + 2] < SCENE_EXTENT.zMin) pos[i * 3 + 2] = SCENE_EXTENT.zMax;
    }

    particlePosAttr.needsUpdate = true;
  });

  if (!layers.windVectors) return null;

  return (
    <group name="wind-streamlines">
      <points ref={particleRef}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={particlePosAttr} />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          color="#38bdf8"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
