import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '@/simulation/simulationStore';
import { geoToScene, pressureToSceneY } from '@/simulation/physics';
import { getParticles } from '@/simulation/simulationEngine';
import * as THREE from 'three';

export function ParticleTrails() {
  const layers = useSimulationStore((s) => s.layers);
  const selectedParticle = useSimulationStore((s) => s.selectedParticle);

  const trailCount = 50;
  const trailLength = 20;
  const totalVerts = trailCount * trailLength;

  const posAttr = useMemo(() => {
    const arr = new Float32Array(totalVerts * 3);
    return new THREE.BufferAttribute(arr, 3);
  }, [totalVerts]);

  const colAttr = useMemo(() => {
    const arr = new Float32Array(totalVerts * 3);
    return new THREE.BufferAttribute(arr, 3);
  }, [totalVerts]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', posAttr);
    g.setAttribute('color', colAttr);
    return g;
  }, [posAttr, colAttr]);

  const mat = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  }), []);

  const lineObj = useMemo(() => {
    const l = new THREE.LineSegments(geo, mat);
    return l;
  }, [geo, mat]);

  useFrame(() => {
    if (!layers.particleTrails) return;

    const particles = getParticles();
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;
    let idx = 0;

    for (let t = 0; t < trailCount && t < particles.length; t++) {
      const p = particles[t];
      const traj = p.trajectory;
      const isSelected = selectedParticle?.particle.id === p.id;

      for (let j = 0; j < trailLength; j++) {
        if (j < traj.length) {
          const pt = traj[Math.max(0, traj.length - trailLength + j)];
          const { x, z } = geoToScene(pt.latitude, pt.longitude);
          const y = pressureToSceneY(pt.pressure);
          posArr[idx] = x;
          posArr[idx + 1] = y;
          posArr[idx + 2] = z;

          const alpha = j / trailLength;
          if (isSelected) {
            colArr[idx] = 0; colArr[idx + 1] = alpha; colArr[idx + 2] = 1;
          } else {
            colArr[idx] = 0; colArr[idx + 1] = alpha * 0.6; colArr[idx + 2] = alpha * 0.8;
          }
        } else {
          posArr[idx] = 0; posArr[idx + 1] = -1000; posArr[idx + 2] = 0;
          colArr[idx] = 0; colArr[idx + 1] = 0; colArr[idx + 2] = 0;
        }
        idx += 3;
      }
    }

    // Zero out unused
    while (idx < totalVerts * 3) {
      posArr[idx] = 0; posArr[idx + 1] = -1000; posArr[idx + 2] = 0;
      colArr[idx] = 0; colArr[idx + 1] = 0; colArr[idx + 2] = 0;
      idx += 3;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (!layers.particleTrails) return null;

  return <primitive object={lineObj} />;
}
