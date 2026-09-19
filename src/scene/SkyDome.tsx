import { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import { useSimulationStore } from '@/simulation/simulationStore';

export function SkyDome() {
  const timeOfDay = useSimulationStore((s) => s.timeOfDay);

  const sunPosition: [number, number, number] = useMemo(() => {
    switch (timeOfDay) {
      case 'morning':
        return [120, 35, -80];
      case 'evening':
        return [-120, 25, -60];
      case 'noon':
      default:
        return [60, 110, 40];
    }
  }, [timeOfDay]);

  // Atmospheric sky background colors
  const { skyTop, skyHorizon, groundColor } = useMemo(() => {
    switch (timeOfDay) {
      case 'morning':
        return {
          skyTop: '#133560',
          skyHorizon: '#e09865',
          groundColor: '#1a2218',
        };
      case 'evening':
        return {
          skyTop: '#0c1e3d',
          skyHorizon: '#d26a42',
          groundColor: '#121815',
        };
      case 'noon':
      default:
        return {
          skyTop: '#1a5ba8',
          skyHorizon: '#78aedf',
          groundColor: '#1b2d3d',
        };
    }
  }, [timeOfDay]);

  return (
    <>
      {/* 360-degree atmospheric sky sphere preventing any white void */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[2500, 32, 32]} />
        <meshBasicMaterial
          color={skyTop}
          side={1} /* BackSide */
          depthWrite={false}
        />
      </mesh>

      {/* Sky scattering dome */}
      <Sky
        distance={2400}
        sunPosition={sunPosition}
        turbidity={7}
        rayleigh={1.4}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      {/* Ambient hemisphere light to ground colors from sky and earth */}
      <hemisphereLight
        color={skyHorizon}
        groundColor={groundColor}
        intensity={0.65}
      />
    </>
  );
}

export function SceneLights() {
  const timeOfDay = useSimulationStore((s) => s.timeOfDay);

  const { sunPos, sunColor, sunIntensity, ambientIntensity, ambientColor, fogColor } = useMemo(() => {
    switch (timeOfDay) {
      case 'morning':
        return {
          sunPos: [120, 45, -80] as [number, number, number],
          sunColor: '#ffd8ad',
          sunIntensity: 2.4,
          ambientIntensity: 0.45,
          ambientColor: '#8ca6cc',
          fogColor: '#4f6c88',
        };
      case 'evening':
        return {
          sunPos: [-120, 32, -60] as [number, number, number],
          sunColor: '#ff9a55',
          sunIntensity: 2.0,
          ambientIntensity: 0.4,
          ambientColor: '#6f7e94',
          fogColor: '#3d445c',
        };
      case 'noon':
      default:
        return {
          sunPos: [60, 110, 40] as [number, number, number],
          sunColor: '#fff8ea',
          sunIntensity: 2.8,
          ambientIntensity: 0.55,
          ambientColor: '#9ac2e8',
          fogColor: '#4d7ea8',
        };
    }
  }, [timeOfDay]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <directionalLight
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-280}
        shadow-camera-right={280}
        shadow-camera-top={280}
        shadow-camera-bottom={-280}
        shadow-camera-near={10}
        shadow-camera-far={750}
        shadow-bias={-0.0002}
      />
      {/* Gentle blue skylight fill opposite to the sun */}
      <directionalLight position={[-60, 80, -50]} intensity={0.4} color="#5e9bd1" />
      {/* Deep atmospheric horizon fog (not white) */}
      <fogExp2 attach="fog" args={[fogColor, 0.0008]} />
    </>
  );
}
