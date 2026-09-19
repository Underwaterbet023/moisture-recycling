import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { heightAt } from '@/scene/terrainConfig';
import { useSimulationStore } from '@/simulation/simulationStore';

export function Farm() {
  const layers = useSimulationStore((s) => s.layers);
  const cropRowsRef = useRef<THREE.InstancedMesh>(null);
  const soilPlotsRef = useRef<THREE.InstancedMesh>(null);

  // Distinct agricultural plots with tilled soil beds and raised crop rows
  const { plots, cropRows } = useMemo(() => {
    const plotList: { x: number; y: number; z: number; w: number; d: number; col: THREE.Color }[] = [];
    const rowsList: { x: number; y: number; z: number; len: number; col: THREE.Color }[] = [];

    const cropColors = [
      new THREE.Color('#628628'), // lush green wheat
      new THREE.Color('#a4b33a'), // golden grain
      new THREE.Color('#4c7221'), // deep green legume
    ];
    const soilColor = new THREE.Color('#4a3d2c'); // rich warm arable soil loam

    // 6 distinct field plots across the fertile agricultural alluvial plain
    const fieldConfigs = [
      { startX: 25, startZ: 2, width: 26, depth: 20, colorIdx: 0 },
      { startX: 55, startZ: 2, width: 28, depth: 20, colorIdx: 1 },
      { startX: 25, startZ: 26, width: 26, depth: 22, colorIdx: 2 },
      { startX: 55, startZ: 26, width: 28, depth: 22, colorIdx: 0 },
      { startX: 25, startZ: 52, width: 24, depth: 18, colorIdx: 1 },
      { startX: 53, startZ: 52, width: 26, depth: 18, colorIdx: 2 },
    ];

    fieldConfigs.forEach((cfg) => {
      const cx = cfg.startX + cfg.width / 2;
      const cz = cfg.startZ + cfg.depth / 2;
      const cy = heightAt(cx, cz) + 0.08;

      plotList.push({
        x: cx,
        y: cy,
        z: cz,
        w: cfg.width,
        d: cfg.depth,
        col: soilColor,
      });

      // Rows inside this field plot
      const rowSpacing = 1.2;
      const numRows = Math.floor(cfg.depth / rowSpacing);
      for (let r = 0; r < numRows; r++) {
        const rz = cfg.startZ + 1 + r * rowSpacing;
        const rx = cx;
        const ry = heightAt(rx, rz) + 0.22;
        rowsList.push({
          x: rx,
          y: ry,
          z: rz,
          len: cfg.width - 2,
          col: cropColors[cfg.colorIdx],
        });
      }
    });

    return { plots: plotList, cropRows: rowsList };
  }, []);

  const soilGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const rowGeo = useMemo(() => new THREE.BoxGeometry(1, 0.25, 0.45), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instance transforms
  useMemo(() => {
    // Handled in render refs
  }, []);

  const onSoilRender = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh || mesh.userData.ready) return;
    plots.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(p.w, p.d, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, p.col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.ready = true;
  };

  const onRowsRender = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh || mesh.userData.ready) return;
    cropRows.forEach((r, i) => {
      dummy.position.set(r.x, r.y, r.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(r.len, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, r.col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.ready = true;
  };

  if (!layers.farmTractor) return null;

  return (
    <group name="farm-landscape">
      {/* Dark soil plot bases */}
      <instancedMesh
        ref={onSoilRender}
        args={[soilGeo, undefined, plots.length]}
        receiveShadow
      >
        <meshStandardMaterial roughness={0.95} metalness={0.02} />
      </instancedMesh>

      {/* Raised crop rows */}
      <instancedMesh
        ref={onRowsRender}
        args={[rowGeo, undefined, cropRows.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial roughness={0.8} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}
