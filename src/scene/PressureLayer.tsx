import { useSimulationStore } from '@/simulation/simulationStore';
import { pressureToSceneY, SCENE_EXTENT } from '@/simulation/physics';
import { PRESSURE_LEVELS } from '@/types/atmospheric';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function PressureLayer() {
  const { layers, selectedPressure, setSelectedPressure, scientificOverlay } = useSimulationStore();

  if (!layers.pressureSurfaces && !scientificOverlay) return null;

  const width = SCENE_EXTENT.xMax - SCENE_EXTENT.xMin;
  const depth = SCENE_EXTENT.zMax - SCENE_EXTENT.zMin;

  return (
    <group name="pressure-layers">
      {PRESSURE_LEVELS.map((level) => {
        const y = pressureToSceneY(level);
        const isSelected = selectedPressure === level;
        const isMuted = selectedPressure !== 'all' && !isSelected;

        // Subtle transparency so natural landscape remains clear
        const opacity = isSelected ? 0.14 : isMuted ? 0.015 : 0.04;

        return (
          <group key={level} position={[0, y, 0]}>
            {/* Isobaric plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width, depth]} />
              <meshBasicMaterial
                color={isSelected ? '#38bdf8' : '#0284c7'}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Left-edge permanent scientific pressure label */}
            <Html
              position={[SCENE_EXTENT.xMin - 2, 0, 0]}
              center
              style={{ pointerEvents: 'auto', userSelect: 'none' }}
            >
              <button
                onClick={() => setSelectedPressure(isSelected ? 'all' : level)}
                className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all shadow-md ${
                  isSelected
                    ? 'bg-cyan-500/40 border-cyan-300 text-cyan-200 font-bold shadow-[0_0_8px_#22d3ee]'
                    : 'bg-[rgba(6,14,28,0.75)] border-cyan-500/20 text-cyan-400 hover:border-cyan-400/60'
                }`}
                title={`Filter atmospheric view to ${level} hPa isobaric surface`}
              >
                {level} hPa
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
