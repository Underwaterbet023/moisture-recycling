import { Suspense, lazy, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Settings, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimulationStore } from '@/simulation/simulationStore';

// Lazy-load pages for code splitting
const SimulationPage = lazy(() => import('@/pages/SimulationPage'));
const LagrangianPage = lazy(() => import('@/pages/LagrangianPage'));
const EulerianPage = lazy(() => import('@/pages/EulerianPage'));

// Components
import { Header } from '@/components/Header';
import { ControlPanel } from '@/components/ControlPanel';
import { Legend } from '@/components/Legend';
import { ScientificInspector } from '@/components/ScientificInspector';
import { PressureSlider } from '@/components/PressureSlider';
import { MoistureScene } from '@/scene/MoistureScene';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a1526]">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
            <path d="M12 2C7 8 4 12 4 15a8 8 0 0016 0c0-3-3-7-8-13z" fill="currentColor" />
          </svg>
        </div>
      </div>
      <div className="text-cyan-100 text-xs font-semibold tracking-widest">MOISTURE RECYCLING</div>
      <div className="text-cyan-300/50 text-[10px] mt-1">Loading atmospheric simulation...</div>
    </div>
  );
}

export function App() {
  const activePage = useSimulationStore((s) => s.activePage);
  const dataset = useSimulationStore((s) => s.dataset);

  const [isLeftMinimized, setIsLeftMinimized] = useState(false);
  const [isRightMinimized, setIsRightMinimized] = useState(true);

  const show3D = activePage === 'simulation' || activePage === 'lagrangian' || activePage === 'eulerian';

  return (
    <div className="fixed inset-0 bg-[#07111e] text-cyan-50 overflow-hidden select-none">
      {/* 3D Canvas in background - FULL POINTER EVENTS for Zoom, Pan, Rotate */}
      {show3D && (
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Canvas
            shadows
            dpr={[1, 1.3]}
            gl={{
              antialias: false,
              powerPreference: 'high-performance',
              alpha: false,
            }}
            onCreated={({ gl, scene }) => {
              gl.toneMapping = 4; // THREE.ACESFilmicToneMapping
              gl.toneMappingExposure = 1.05;
              scene.background = null;
            }}
          >
            <color attach="background" args={['#102a45']} />
            <PerspectiveCamera
              makeDefault
              position={[12, 54, 118]}
              fov={45}
              near={0.5}
              far={4000}
            />
            <MoistureScene />
          </Canvas>
        </div>
      )}

      {/* Top Header overlay */}
      <div className="relative z-30 pointer-events-auto shrink-0">
        <Header />
      </div>

      {/* Synthetic Data Banner */}
      {dataset === 'synthetic' && (
        <div className="relative z-20 flex justify-center pointer-events-none mt-1 shrink-0">
          <div className="synthetic-banner pointer-events-auto shadow-md">
            ⚠ SYNTHETIC DEMONSTRATION DATA — Physical Land-Atmosphere Coupling Demo
          </div>
        </div>
      )}

      {/* Middle Interactive UI Layer — flex-1 occupies remaining screen perfectly */}
      <div className="flex-1 flex justify-between p-3 overflow-hidden pointer-events-none relative z-20">
        {/* Left Control Panel & Vertical Pressure Slider */}
        <div className="pointer-events-auto flex items-start gap-2 max-h-full">
          {!isLeftMinimized ? (
            <>
              <div className="w-64 max-h-full flex flex-col">
                <ControlPanel onToggleMinimize={() => setIsLeftMinimized(true)} />
              </div>
              <div className="flex items-center pt-2">
                <PressureSlider />
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsLeftMinimized(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-[rgba(6,14,28,0.85)] backdrop-blur-md text-cyan-300 text-xs shadow-lg hover:bg-cyan-500/20 hover:border-cyan-400 transition-all select-none"
              title="Expand Environment Controls"
            >
              <Settings size={13} className="text-cyan-400" />
              <span className="font-semibold">Controls</span>
              <ChevronRight size={13} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Center Spacer allows 3D interactions anywhere on the landscape */}
        <div className="flex-1 pointer-events-none" />

        {/* Right Inspector & Legend */}
        <div className="pointer-events-auto flex items-start max-h-full mt-2">
          {!isRightMinimized ? (
            <div className="w-64 flex flex-col gap-2 max-h-full overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between px-2 py-1 bg-[rgba(6,14,28,0.7)] rounded-lg border border-cyan-500/20">
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Legend & Info</span>
                <button
                  onClick={() => setIsRightMinimized(true)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors flex items-center gap-0.5 text-[10px]"
                  title="Minimize Legend & Info"
                >
                  <span>Minimize</span>
                  <ChevronRight size={13} />
                </button>
              </div>
              <Legend />
              <ScientificInspector />
            </div>
          ) : (
            <button
              onClick={() => setIsRightMinimized(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-[rgba(6,14,28,0.85)] backdrop-blur-md text-cyan-300 text-xs shadow-lg hover:bg-cyan-500/20 hover:border-cyan-400 transition-all select-none"
              title="Expand Legend & Info"
            >
              <ChevronLeft size={13} className="text-gray-400" />
              <span className="font-semibold">Legend</span>
              <Info size={13} className="text-cyan-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
