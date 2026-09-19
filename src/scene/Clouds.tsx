// ============================================================================
// Atmospheric Clouds Component — Volumetric Cloud System & Ground Shadows
// ============================================================================
// Hosts the realistic GPU ray-marched volumetric clouds and soft landscape
// shadows, coupled to the atmospheric moisture transport and condensation field.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { VolumetricCloud } from './VolumetricCloud';
import * as THREE from 'three';

export function Clouds() {
  const layers = useSimulationStore((s) => s.layers);
  const cloudSpeed = useSimulationStore((s) => s.cloudSpeed);
  const shadowGroupRef = useRef<THREE.Group>(null);

  // Soft atmospheric drift for ground shadows
  const driftRef = useRef(0);

  useFrame((_, delta) => {
    if (!layers.cloudsPrecipitation || !shadowGroupRef.current) return;
    driftRef.current += delta * cloudSpeed * 0.4;
    const driftX = Math.sin(driftRef.current * 0.3) * 3.0;
    const driftZ = Math.cos(driftRef.current * 0.25) * 2.0;

    shadowGroupRef.current.position.x = driftX;
    shadowGroupRef.current.position.z = driftZ;
  });

  if (!layers.cloudsPrecipitation) return null;

  return (
    <group name="atmospheric-cloud-system">
      {/* 
        1. PRIMARY OROGRAPHIC VOLUMETRIC CLOUD 
        Positioned directly over the mountain barrier where moisture transport converges,
        forming the condensation core and feeding precipitation to the sink watershed.
      */}
      <VolumetricCloud
        position={[20, 36, -25]}
        boxSize={[46, 22, 38]}
      />

      {/* 
        2. SECONDARY ALPINE VOLUMETRIC CLOUD
        High-altitude stratocumulus bank hugging the distant cordillera peaks,
        providing realistic atmospheric layering and depth.
      */}
      <VolumetricCloud
        position={[45, 43, -56]}
        boxSize={[38, 18, 32]}
      />

      {/* 
        3. REALISTIC SOFT CLOUD SHADOWS ON LANDSCAPE
        Soft, physically motivated diffuse shadows cast onto the terrain,
        forest, and agricultural valley beneath the clouds.
      */}
      <group ref={shadowGroupRef} position={[0, 0.4, 0]}>
        {/* Primary Cloud Shadow */}
        <mesh position={[22, 0.3, -22]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[18, 32]} />
          <meshBasicMaterial
            color="#020817"
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>

        {/* Alpine Cloud Shadow */}
        <mesh position={[46, 0.3, -54]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[15, 32]} />
          <meshBasicMaterial
            color="#020817"
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
