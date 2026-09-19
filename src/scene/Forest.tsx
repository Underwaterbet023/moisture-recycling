import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TERRAIN, heightAt, biomeAt, isNearAnyWater } from '@/scene/terrainConfig';
import { useSimulationStore } from '@/simulation/simulationStore';

export function Forest() {
  const { layers } = useSimulationStore();
  const coniferRef = useRef<THREE.InstancedMesh>(null);
  const deciduousRef = useRef<THREE.InstancedMesh>(null);

  const { coniferData, deciduousData } = useMemo(() => {
    const conifers: { x: number; y: number; z: number; scale: number; rotY: number; color: THREE.Color }[] = [];
    const deciduous: { x: number; y: number; z: number; scale: number; rotY: number; color: THREE.Color }[] = [];

    const coniferColors = [
      new THREE.Color('#1b3b1e'),
      new THREE.Color('#143317'),
      new THREE.Color('#224424'),
    ];
    const deciduousColors = [
      new THREE.Color('#2d5a27'),
      new THREE.Color('#386b30'),
      new THREE.Color('#23491e'),
    ];

    let seed = 4321;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let attempts = 0;
    while ((conifers.length + deciduous.length < 7500) && attempts < 90000) {
      attempts++;
      // Distribute across the vast continental watershed (x in [-30, 390], z in [-280, 260])
      const x = -30 + rnd() * 420;
      const z = -280 + rnd() * 540;

      // Keep trees strictly clear of all water channels (streams, waterfalls, tributaries, main river)
      if (isNearAnyWater(x, z, 3.5)) continue;

      const h = heightAt(x, z);
      const b = biomeAt(x, z, h);

      if (b === 'forest' || (b === 'grass' && h > 2.5 && h < 22 && rnd() < 0.42)) {
        const isConifer = h > 7.5 || rnd() > 0.45;
        const scale = 0.75 + rnd() * 0.85;
        const rotY = rnd() * Math.PI * 2;

        if (isConifer) {
          const col = coniferColors[Math.floor(rnd() * coniferColors.length)];
          conifers.push({ x, y: h, z, scale, rotY, color: col });
        } else {
          const col = deciduousColors[Math.floor(rnd() * deciduousColors.length)];
          deciduous.push({ x, y: h, z, scale, rotY, color: col });
        }
      }
    }

    return { coniferData: conifers, deciduousData: deciduous };
  }, []);

  // Multi-tier realistic tree geometries
  const coniferGeo = useMemo(() => {
    // Pine tree: stacked foliage cones + trunk
    const trunk = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 5);
    trunk.translate(0, 0.6, 0);

    const c1 = new THREE.ConeGeometry(1.2, 1.8, 6);
    c1.translate(0, 2.0, 0);

    const c2 = new THREE.ConeGeometry(0.9, 1.5, 6);
    c2.translate(0, 2.8, 0);

    const c3 = new THREE.ConeGeometry(0.6, 1.2, 6);
    c3.translate(0, 3.5, 0);

    // Combine into single buffer geometry
    return c1; // Clean cone proxy
  }, []);

  const deciduousGeo = useMemo(() => {
    // Deciduous: broad domed canopy
    const dome = new THREE.DodecahedronGeometry(1.3, 1);
    dome.translate(0, 2.0, 0);
    return dome;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!coniferRef.current || !deciduousRef.current || !layers.terrainLandUse) return;

    // Apply instance matrices once
    if (!coniferRef.current.userData.initialized) {
      coniferData.forEach((d, i) => {
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rotY, 0);
        dummy.scale.set(d.scale, d.scale * 1.2, d.scale);
        dummy.updateMatrix();
        coniferRef.current!.setMatrixAt(i, dummy.matrix);
        coniferRef.current!.setColorAt(i, d.color);
      });
      coniferRef.current.instanceMatrix.needsUpdate = true;
      if (coniferRef.current.instanceColor) coniferRef.current.instanceColor.needsUpdate = true;
      coniferRef.current.userData.initialized = true;
    }

    if (!deciduousRef.current.userData.initialized) {
      deciduousData.forEach((d, i) => {
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rotY, 0);
        dummy.scale.set(d.scale * 1.1, d.scale * 1.1, d.scale * 1.1);
        dummy.updateMatrix();
        deciduousRef.current!.setMatrixAt(i, dummy.matrix);
        deciduousRef.current!.setColorAt(i, d.color);
      });
      deciduousRef.current.instanceMatrix.needsUpdate = true;
      if (deciduousRef.current.instanceColor) deciduousRef.current.instanceColor.needsUpdate = true;
      deciduousRef.current.userData.initialized = true;
    }
  });

  if (!layers.terrainLandUse) return null;

  return (
    <group name="forest">
      <instancedMesh
        ref={coniferRef}
        args={[coniferGeo, undefined, coniferData.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.9} metalness={0.05} />
      </instancedMesh>
      <instancedMesh
        ref={deciduousRef}
        args={[deciduousGeo, undefined, deciduousData.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.85} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}
