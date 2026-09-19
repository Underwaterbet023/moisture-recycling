import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/simulation/simulationStore';
import { CAMERA_PRESETS } from '@/types/simulation';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { cameraPreset } = useSimulationStore();
  const { camera, gl } = useThree();

  useEffect(() => {
    if (controlsRef.current && cameraPreset && CAMERA_PRESETS[cameraPreset as keyof typeof CAMERA_PRESETS]) {
      const preset = CAMERA_PRESETS[cameraPreset as keyof typeof CAMERA_PRESETS];
      // Directly set position on preset change so user has immediate, full control
      camera.position.set(...(preset.position as [number, number, number]));
      controlsRef.current.target.set(...(preset.target as [number, number, number]));
      controlsRef.current.update();
    }
  }, [cameraPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      domElement={gl.domElement}
      enableDamping={true}
      dampingFactor={0.08}
      enableZoom={true}
      zoomSpeed={1.5}
      enableRotate={true}
      rotateSpeed={0.9}
      enablePan={true}
      panSpeed={0.9}
      minDistance={10}
      maxDistance={350}
      maxPolarAngle={Math.PI / 2 - 0.05}
      makeDefault
    />
  );
}
