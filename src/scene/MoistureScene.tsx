import { Suspense } from 'react';
import { Atmosphere } from './Atmosphere';
import { PressureLayer } from './PressureLayer';
import { AtmosphericGrid } from './AtmosphericGrid';
import { WindField } from './WindField';
import { Clouds } from './Clouds';
import { Precipitation } from './Precipitation';
import { SceneLabels } from './SceneLabels';
import { ScientificOverlayLayer } from './ScientificOverlayLayer';
import { Terrain } from './Terrain';
import { Ocean } from './Ocean';
import { River } from './River';
import { Forest } from './Forest';
import { Farm } from './Farm';
import { SkyDome, SceneLights } from './SkyDome';
import { CameraRig } from './CameraRig';
import { MoistureParticles } from '@/particles/MoistureParticles';
import { ParticleTrails } from '@/particles/ParticleTrails';
import { EvaporationParticles } from '@/particles/EvaporationParticles';
import { TranspirationParticles } from '@/particles/TranspirationParticles';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';

export function MoistureScene() {
  return (
    <>
      <SkyDome />
      <SceneLights />
      <CameraRig />

      {/* Primary Realistic 3D Landscape */}
      <Suspense fallback={null}>
        <Terrain />
        <Ocean />
        <River />
        <Forest />
        <Farm />
      </Suspense>

      {/* Scientific Overlay Layers (Conditional via store) */}
      <Atmosphere>
        <PressureLayer />
        <AtmosphericGrid />
        <WindField />
      </Atmosphere>

      {/* Atmospheric Processes & Moisture Flow */}
      <MoistureParticles />
      <ParticleTrails />
      <EvaporationParticles />
      <TranspirationParticles />

      {/* Atmosphere Formations */}
      <Clouds />
      <Precipitation />
      <SceneLabels />

      {/* Complete UTrack Scientific Annotation & Arrow System */}
      <ScientificOverlayLayer />

      {/* Refined Post-processing (subtle, non-neon) */}
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.75} luminanceSmoothing={0.3} intensity={0.4} />
        <Vignette offset={0.2} darkness={0.5} />
        <SMAA />
      </EffectComposer>
    </>
  );
}
