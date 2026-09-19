import { Html } from '@react-three/drei';
import { useSimulationStore } from '@/simulation/simulationStore';
import { SOURCE_REGIONS } from '@/scene/terrainConfig';

export function SceneLabels() {
  const { layers, scientificOverlay } = useSimulationStore();

  // Only show when sceneLabels is explicitly toggled or scientificOverlay is active
  if (!layers.sceneLabels && !scientificOverlay) return null;

  const badgeStyle = {
    color: '#e2f3ff',
    fontSize: '10px',
    fontFamily: 'system-ui, sans-serif',
    pointerEvents: 'none' as const,
    whiteSpace: 'nowrap' as const,
    backgroundColor: 'rgba(10, 20, 40, 0.75)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(0, 212, 255, 0.25)',
    backdropFilter: 'blur(4px)',
    letterSpacing: '0.02em',
  };

  return (
    <group name="physical-source-labels">
      {/* 1. Evaporation (Ocean) */}
      <Html position={[SOURCE_REGIONS.ocean.x, 3, SOURCE_REGIONS.ocean.z]} center style={badgeStyle}>
        Evaporation (Ocean)
      </Html>

      {/* 2. Evaporation (River) */}
      <Html position={[SOURCE_REGIONS.river.x, 2.5, SOURCE_REGIONS.river.z]} center style={badgeStyle}>
        Evaporation (River)
      </Html>

      {/* 3. Transpiration (Forest) */}
      <Html position={[SOURCE_REGIONS.forest.x, 8, SOURCE_REGIONS.forest.z]} center style={badgeStyle}>
        Transpiration (Forest)
      </Html>

      {/* 4. Evapotranspiration (Crops) */}
      <Html position={[SOURCE_REGIONS.agriculture.x, 5, SOURCE_REGIONS.agriculture.z]} center style={badgeStyle}>
        Evapotranspiration (Crops)
      </Html>
    </group>
  );
}
