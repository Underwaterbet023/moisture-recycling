import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { geoToScene, pressureToSceneY } from '@/simulation/physics';
import { simulationTick, getParticles } from '@/simulation/simulationEngine';
import * as THREE from 'three';

export function MoistureParticles() {
  const { layers, particleDensity } = useSimulationStore();
  const pointsRef = useRef<THREE.Points>(null);

  // Moderate default count for natural elegance rather than clutter
  const baseCount = 2500;
  const maxCount = Math.floor(baseCount * (particleDensity || 0.6));

  const { posArray, colArray } = useMemo(() => {
    return {
      posArray: new Float32Array(maxCount * 3),
      colArray: new Float32Array(maxCount * 3),
    };
  }, [maxCount]);

  useFrame((_, delta) => {
    simulationTick(delta);

    if (!pointsRef.current || !layers.moistureParticles) return;

    const particles = getParticles();
    const geo = pointsRef.current.geometry;

    // Cloud formation condensation center
    const cloudCenterX = 20.0;
    const cloudCenterY = 36.0;
    const cloudCenterZ = -25.0;

    for (let i = 0; i < maxCount; i++) {
      if (i < particles.length) {
        const p = particles[i];
        const { x, z } = geoToScene(p.latitude, p.longitude);
        const y = pressureToSceneY(p.pressure);

        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;

        // Check proximity to cloud condensation core
        const dx = (x - cloudCenterX) / 20.0;
        const dy = (y - cloudCenterY) / 10.0;
        const dz = (z - cloudCenterZ) / 18.0;
        const cloudDistSq = dx * dx + dy * dy + dz * dz;

        // Particle-to-cloud condensation transition:
        // As moisture parcels penetrate into the cloud volume, their visibility
        // softly attenuates, visually representing vapor condensing into the cloud field.
        let cloudFade = 1.0;
        if (cloudDistSq < 1.0) {
          const d = Math.sqrt(cloudDistSq);
          cloudFade = Math.max(0.18, d * 0.95);
        }

        // Subtle glowing moisture colors: soft luminous cyan/white
        if (p.state === 'condensing' || p.state === 'precipitating' || cloudDistSq < 1.0) {
          colArray[i * 3] = 0.88 * cloudFade;
          colArray[i * 3 + 1] = 0.94 * cloudFade;
          colArray[i * 3 + 2] = 1.0 * cloudFade;
        } else if (p.source === 'forest' || p.source === 'agriculture') {
          colArray[i * 3] = 0.4 * cloudFade;
          colArray[i * 3 + 1] = 0.9 * cloudFade;
          colArray[i * 3 + 2] = 0.7 * cloudFade;
        } else {
          colArray[i * 3] = 0.25 * cloudFade;
          colArray[i * 3 + 1] = 0.75 * cloudFade;
          colArray[i * 3 + 2] = 0.95 * cloudFade;
        }
      } else {
        posArray[i * 3 + 1] = -1000;
      }
    }

    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    if (posAttr) posAttr.needsUpdate = true;
    if (colAttr) colAttr.needsUpdate = true;
  });

  if (!layers.moistureParticles) return null;

  const positionAttr = new THREE.BufferAttribute(posArray, 3);
  const colorAttr = new THREE.BufferAttribute(colArray, 3);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <primitive attach="attributes-position" object={positionAttr} />
        <primitive attach="attributes-color" object={colorAttr} />
      </bufferGeometry>
      <pointsMaterial
        size={0.32} // Microscopic size, not large arrows/blobs
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
