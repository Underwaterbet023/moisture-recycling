import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TERRAIN } from '@/scene/terrainConfig';
import { useSimulationStore } from '@/simulation/simulationStore';
import { oceanWaterVertexShader } from '@/scene/shaders/OceanWaterVertex';
import { oceanWaterFragmentShader } from '@/scene/shaders/OceanWaterFragment';

export function Ocean() {
  const { layers, timeOfDay } = useSimulationStore();
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunPosition: { value: new THREE.Vector3(60, 110, 40) },
    }),
    []
  );

  // Decouple visual water time from scientific simulation time for continuous, natural wave flow
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    uniforms.uTime.value += delta * 1.35;

    if (timeOfDay === 'morning') uniforms.uSunPosition.value.set(120, 35, -80);
    else if (timeOfDay === 'evening') uniforms.uSunPosition.value.set(-120, 25, -60);
    else uniforms.uSunPosition.value.set(60, 110, 40);
  });

  if (!layers.terrainLandUse) return null;

  return (
    <mesh
      ref={meshRef}
      position={[-800, TERRAIN.oceanLevel, -30]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[1600, 2400, 320, 320]} />
      <shaderMaterial
        vertexShader={oceanWaterVertexShader}
        fragmentShader={oceanWaterFragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}


