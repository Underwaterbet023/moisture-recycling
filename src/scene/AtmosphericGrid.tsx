import { useMemo, useRef } from 'react';
import { useSimulationStore } from '@/simulation/simulationStore';
import { SCENE_EXTENT, pressureToSceneY, sceneToGeo, sceneYToPressure } from '@/simulation/physics';
import { PRESSURE_LEVELS } from '@/types/atmospheric';
import { computeMoistureBudget, GRID } from '@/simulation/syntheticDataProvider';
import { getCell } from '@/simulation/syntheticDataProvider';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';

export function AtmosphericGrid() {
  const layers = useSimulationStore((s) => s.layers);
  const setSelectedGridCell = useSimulationStore((s) => s.setSelectedGridCell);
  const selectedGridCell = useSimulationStore((s) => s.selectedGridCell);
  const simulationTime = useSimulationStore((s) => s.simulationTime);
  const lineRef = useRef<THREE.LineSegments>(null);

  const { geometry, cellWidth, cellDepth } = useMemo(() => {
    const pts: number[] = [];
    const hSegs = 8;

    const w = SCENE_EXTENT.xMax - SCENE_EXTENT.xMin;
    const d = SCENE_EXTENT.zMax - SCENE_EXTENT.zMin;
    const cw = w / hSegs;
    const cd = d / hSegs;

    // Horizontal grid lines at each pressure level
    for (const pLev of PRESSURE_LEVELS) {
      const y = pressureToSceneY(pLev);
      for (let i = 0; i <= hSegs; i++) {
        const z = SCENE_EXTENT.zMin + i * cd;
        pts.push(SCENE_EXTENT.xMin, y, z, SCENE_EXTENT.xMax, y, z);
      }
      for (let i = 0; i <= hSegs; i++) {
        const x = SCENE_EXTENT.xMin + i * cw;
        pts.push(x, y, SCENE_EXTENT.zMin, x, y, SCENE_EXTENT.zMax);
      }
    }

    // Vertical lines connecting pressure levels
    const yMin = pressureToSceneY(PRESSURE_LEVELS[0]);
    const yMax = pressureToSceneY(PRESSURE_LEVELS[PRESSURE_LEVELS.length - 1]);
    for (let ix = 0; ix <= hSegs; ix++) {
      for (let iz = 0; iz <= hSegs; iz++) {
        const x = SCENE_EXTENT.xMin + ix * cw;
        const z = SCENE_EXTENT.zMin + iz * cd;
        pts.push(x, yMin, z, x, yMax, z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return { geometry: geo, cellWidth: cw, cellDepth: cd };
  }, []);

  if (!layers.atmosphericGrid) return null;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const { x, y, z } = e.point;
    const { lat, lon } = sceneToGeo(x, z);
    const pressure = sceneYToPressure(y);

    // Find nearest grid indices
    const i = Math.max(0, Math.min(GRID.nLat - 1, Math.floor((lat - 20) / GRID.dLat)));
    const j = Math.max(0, Math.min(GRID.nLon - 1, Math.floor((lon - 84) / GRID.dLon)));
    const k = PRESSURE_LEVELS.reduce((best, p, idx) =>
      Math.abs(p - pressure) < Math.abs(PRESSURE_LEVELS[best] - pressure) ? idx : best, 0);

    const cell = getCell(i, j, k, simulationTime);
    const budget = computeMoistureBudget(i, j, k, simulationTime);

    setSelectedGridCell({
      i, j, k,
      latitude: cell.latitude,
      longitude: cell.longitude,
      pressure: cell.pressure,
      cell,
      budget,
    });
  };

  return (
    <group name="atmospheric-grid">
      <lineSegments ref={lineRef}>
        <primitive attach="geometry" object={geometry} />
        <lineBasicMaterial color="#1e40af" transparent opacity={0.12} />
      </lineSegments>

      {/* Invisible click target */}
      <mesh
        position={[0, 30, 0]}
        visible={false}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={[160, 60, 160]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Highlight selected cell (if not the dedicated cloud formation box) */}
      {selectedGridCell && !(selectedGridCell.i === 3 && selectedGridCell.j === 4 && selectedGridCell.k === 2) && (
        <mesh position={[
          SCENE_EXTENT.xMin + (selectedGridCell.j + 0.5) * cellWidth,
          pressureToSceneY(selectedGridCell.pressure),
          SCENE_EXTENT.zMax - (selectedGridCell.i + 0.5) * cellDepth,
        ]}>
          <boxGeometry args={[cellWidth, 8, cellDepth]} />
          <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
