import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TERRAIN, heightAt, biomeAt, BIOME_COLORS, slopeAt, coastLineX } from '@/scene/terrainConfig';
import { useSimulationStore } from '@/simulation/simulationStore';

export function Terrain() {
  const layers = useSimulationStore((s) => s.layers);
  const meshRef = useRef<THREE.Mesh>(null);

  // Continental center offset to balance western ocean and eastern landmass
  const originX = 60;
  const originZ = -30;

  // ── 1. High-Detail Core Watershed Terrain (700m x 700m) ───────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN.size,
      TERRAIN.size,
      TERRAIN.segments,
      TERRAIN.segments
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const worldX = pos.getX(i) + originX;
      const worldZ = pos.getZ(i) + originZ;

      const clX = coastLineX(worldZ);
      const h = heightAt(worldX, worldZ);
      
      // Plunge offshore seabed deep beneath ocean water so terrain never z-fights with ocean waves
      if (worldX < clX - 2.5) {
        pos.setY(i, -25.0);
      } else {
        pos.setY(i, h);
      }

      const biome = biomeAt(worldX, worldZ, h);
      const slope = slopeAt(worldX, worldZ);
      const rgb = BIOME_COLORS[biome];
      colorObj.setRGB(rgb[0], rgb[1], rgb[2]);

      // Steep rock cliffs & exposed stone ridges (layered stratigraphy on high mountain faces)
      if (slope > 1.35 && h > 14.0 && biome !== 'riverbed') {
        const rockMix = Math.min(0.85, (slope - 1.35) * 0.7);
        const strata = Math.sin(h * 1.6 + worldZ * 0.08) * 0.04;
        colorObj.lerp(new THREE.Color(0.42 + strata, 0.40 + strata, 0.38 + strata), rockMix);
      }

      // Summit snow caps on high cordillera peaks (elevation > 28m)
      if (h > 28.0 && slope < 1.1) {
        const snowFactor = Math.min(1.0, (h - 28.0) / 6.0) * Math.max(0, 1.0 - slope / 1.1);
        colorObj.lerp(new THREE.Color(0.96, 0.98, 1.0), snowFactor * 0.95);
      }

      // Coastal beach sand shoreline blending
      if (biome === 'beach' || (biome === 'grass' && h < 1.6 && worldX < -20)) {
        colorObj.lerp(new THREE.Color(0.72, 0.68, 0.52), 0.7);
      }

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [originX, originZ]);

  // ── 2. Extended Continental Horizon Mantle (1800m x 1800m) ────────────────
  const skirtGeometry = useMemo(() => {
    const skirtGeo = new THREE.PlaneGeometry(1800, 1800, 72, 72);
    skirtGeo.rotateX(-Math.PI / 2);
    const pos = skirtGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const colorObj = new THREE.Color();

    const halfDetail = TERRAIN.size / 2 - 8;

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const worldX = lx + originX;
      const worldZ = lz + originZ;

      const clX = coastLineX(worldZ);
      const h = heightAt(worldX, worldZ);
      const biome = biomeAt(worldX, worldZ, h);
      const slope = slopeAt(worldX, worldZ);
      const rgb = BIOME_COLORS[biome];
      colorObj.setRGB(rgb[0], rgb[1], rgb[2]);

      // Apply alpine rock and snow shading to horizon cordillera
      if (slope > 1.35 && h > 14.0 && biome !== 'riverbed') {
        const rockMix = Math.min(0.85, (slope - 1.35) * 0.7);
        colorObj.lerp(new THREE.Color(0.42, 0.40, 0.38), rockMix);
      }
      if (h > 28.0) {
        const snowFactor = Math.min(1.0, (h - 28.0) / 6.0);
        colorObj.lerp(new THREE.Color(0.96, 0.98, 1.0), snowFactor * 0.95);
      }

      // In offshore ocean, plunge skirt vertices deep beneath the ocean surface
      if (worldX < clX - 2.5) {
        pos.setY(i, -35.0);
      } else {
        const isInside = Math.abs(lx) < halfDetail && Math.abs(lz) < halfDetail;
        pos.setY(i, isInside ? -50.0 : h);
      }

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }

    skirtGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    skirtGeo.computeVertexNormals();
    return skirtGeo;
  }, [originX, originZ]);

  if (!layers.terrainLandUse) return null;

  return (
    <group name="terrain-group">
      {/* Seamless surrounding continental mantle extending 1800m to the horizon */}
      <mesh geometry={skirtGeometry} position={[originX, 0, originZ]} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.82}
          metalness={0.03}
          flatShading={false}
        />
      </mesh>

      {/* Main high-resolution detailed watershed terrain */}
      <mesh ref={meshRef} geometry={geometry} position={[originX, 0, originZ]} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.78}
          metalness={0.05}
          flatShading={false}
        />
      </mesh>
    </group>
  );
}
