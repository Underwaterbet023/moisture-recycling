import React, { useState } from 'react';
import {
  Layers,
  CloudRain,
  Wind,
  Droplets,
  Map,
  Activity,
  Settings,
  Cloud,
  Mountain,
  Sprout,
  Navigation,
  Eye,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Camera,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { useSimulationStore } from '@/simulation/simulationStore';
import { ALL_LAYERS, LayerId, VisualizationMode, QualityLevel, CameraPreset } from '@/types/simulation';

const layerIcons: Record<LayerId, React.ReactNode> = {
  atmosphericGrid: <Map size={13} />,
  pressureSurfaces: <Layers size={13} />,
  windVectors: <Wind size={13} />,
  moistureParticles: <CloudRain size={13} />,
  particleTrails: <Navigation size={13} />,
  cloudsPrecipitation: <Cloud size={13} />,
  evaporationOceanRiver: <Droplets size={13} />,
  transpirationVegetation: <Activity size={13} />,
  terrainLandUse: <Mountain size={13} />,
  farmTractor: <Sprout size={13} />,
  sceneLabels: <Eye size={13} />,
  gridPoints: <Settings size={13} />,
};

const PROCESS_STEPS = [
  {
    step: 1,
    title: '1. Marine & River Evaporation',
    preset: 'regional' as CameraPreset,
    desc: 'Solar irradiance warms ocean & river water surfaces, causing upward vapor flux into lower atmosphere.',
  },
  {
    step: 2,
    title: '2. Terrestrial Transpiration',
    preset: 'regional' as CameraPreset,
    desc: 'Forest canopies and agricultural crops transpire moisture upward via stomatal exchange.',
  },
  {
    step: 3,
    title: '3. Atmospheric Wind Transport',
    preset: 'atmosphere' as CameraPreset,
    desc: 'Zonal (u), meridional (v), and vertical (w) wind velocities advect Lagrangian moisture parcels P₁–P₄.',
  },
  {
    step: 4,
    title: '4. Orographic Cloud Formation',
    preset: 'atmosphere' as CameraPreset,
    desc: 'Ascending air parcels cool to dew point, condensing water vapor into dense cloud mass.',
  },
  {
    step: 5,
    title: '5. Precipitation to Sink Region',
    preset: 'regional' as CameraPreset,
    desc: 'Over-saturated cloud droplets coalesce into rain, depositing precipitation into the sink watershed.',
  },
  {
    step: 6,
    title: '6. Runoff, River & Oceanic Cycle',
    preset: 'global' as CameraPreset,
    desc: 'Alpine snowmelt feeds streams and the river gorge, discharging water back into the ocean.',
  },
];

interface ControlPanelProps {
  onToggleMinimize?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onToggleMinimize }) => {
  const {
    layers,
    toggleLayer,
    visualizationMode,
    setVisualizationMode,
    quality,
    setQuality,
    cameraPreset,
    setCameraPreset,
    scientificOverlay,
    setScientificOverlay,
    cloudQuality,
    setCloudQuality,
    cloudSpeed,
    setCloudSpeed,
  } = useSimulationStore();

  const [isExplaining, setIsExplaining] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const handleStartExplain = () => {
    setIsExplaining(!isExplaining);
    if (!isExplaining) {
      setScientificOverlay(true);
      setCurrentStepIdx(0);
      setCameraPreset(PROCESS_STEPS[0].preset);
    }
  };

  const handleNextStep = () => {
    const next = (currentStepIdx + 1) % PROCESS_STEPS.length;
    setCurrentStepIdx(next);
    setCameraPreset(PROCESS_STEPS[next].preset);
  };

  const handlePrevStep = () => {
    const prev = (currentStepIdx - 1 + PROCESS_STEPS.length) % PROCESS_STEPS.length;
    setCurrentStepIdx(prev);
    setCameraPreset(PROCESS_STEPS[prev].preset);
  };

  return (
    <div className="glass-panel pointer-events-auto w-full flex flex-col text-white rounded-xl border border-[rgba(0,180,255,0.2)] bg-[rgba(6,14,28,0.7)] backdrop-blur-md custom-scrollbar text-xs z-40 p-2 space-y-2 max-h-full overflow-y-auto shadow-2xl transition-all">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <h2 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-xs">
          <Settings size={14} className="text-cyan-400" /> Controls
        </h2>
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors flex items-center gap-0.5 text-[10px]"
            title="Minimize Controls"
          >
            <span>Minimize</span>
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      <>
        {/* Step-by-Step "Explain Process" Mode */}
        <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-1.5 space-y-1">
          <div className="flex items-center justify-between">
            <button
              onClick={handleStartExplain}
              className={`w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded font-semibold text-[11px] transition-all border ${
                isExplaining
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,212,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <PlayCircle size={13} className="text-cyan-400" />
              <span>{isExplaining ? 'Stop Explanation' : 'Explain Process (Tour)'}</span>
            </button>
          </div>

          {isExplaining && (
            <div className="space-y-1 pt-1 text-[10px] border-t border-white/10">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>{PROCESS_STEPS[currentStepIdx].title}</span>
                <span className="text-gray-400 text-[9px]">{currentStepIdx + 1}/{PROCESS_STEPS.length}</span>
              </div>
              <p className="text-gray-300 leading-tight text-[10px]">
                {PROCESS_STEPS[currentStepIdx].desc}
              </p>
              <div className="flex items-center justify-between pt-0.5 gap-1">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-0.5 px-1 rounded bg-black/40 border border-white/10 hover:bg-white/10 text-gray-300 text-[10px]"
                >
                  Prev
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-0.5 px-1 rounded bg-cyan-500/30 border border-cyan-400/50 hover:bg-cyan-500/50 text-cyan-200 font-medium text-[10px]"
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Camera View Preset */}
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 uppercase font-semibold flex items-center gap-1">
            <Camera size={11} className="text-cyan-400" /> Perspective
          </label>
          <div className="grid grid-cols-2 gap-1">
            {(['global', 'regional', 'atmosphere', 'cloud'] as CameraPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setCameraPreset(p)}
                className={`py-1 px-1.5 rounded capitalize text-[10px] transition-all font-medium border ${
                  cameraPreset === p
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'bg-black/30 text-gray-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {p === 'global' ? 'Cinematic' : p === 'cloud' ? 'Cloud Focus' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Visualization Mode */}
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 uppercase font-semibold">Mode</label>
          <select
            value={visualizationMode}
            onChange={(e) => setVisualizationMode(e.target.value as VisualizationMode)}
            className="w-full bg-black/40 border border-cyan-500/20 rounded p-1 text-xs outline-none text-white cursor-pointer"
          >
            <option value="combined">Natural Environment + Moisture</option>
            <option value="lagrangian">Lagrangian Parcel Tracking</option>
            <option value="eulerian">Eulerian Flux Grid Analysis</option>
            <option value="physical">Physical Surface Only</option>
          </select>
        </div>

        {/* Quality */}
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 uppercase font-semibold">Density / Quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as QualityLevel)}
            className="w-full bg-black/40 border border-cyan-500/20 rounded p-1 text-xs outline-none text-white cursor-pointer"
          >
            <option value="low">Low (1K parcels)</option>
            <option value="medium">Medium (5K parcels)</option>
            <option value="high">High (20K parcels)</option>
            <option value="research">Research (50K parcels)</option>
          </select>
        </div>

        {/* Volumetric Cloud Settings */}
        <div className="space-y-1 pt-1 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-sky-400 uppercase font-semibold flex items-center gap-1">
              <Cloud size={11} /> Cloud Quality
            </label>
            <span className="text-[9px] font-mono text-gray-400 capitalize">{cloudQuality}</span>
          </div>
          <select
            value={cloudQuality}
            onChange={(e) => setCloudQuality(e.target.value as any)}
            className="w-full bg-black/40 border border-sky-500/20 rounded p-1 text-xs outline-none text-white cursor-pointer"
          >
            <option value="low">Low (Fast Raymarch)</option>
            <option value="medium">Medium (Standard)</option>
            <option value="high">High (Volumetric FBM)</option>
            <option value="ultra">Ultra (Deep Extinction)</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Cloud Drift Speed</span>
            <span className="font-mono text-sky-300">{cloudSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.02}
            max={0.3}
            step={0.01}
            value={cloudSpeed}
            onChange={(e) => setCloudSpeed(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Layer Toggles */}
        <div className="space-y-1.5 pt-1.5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-400 uppercase font-semibold">Layers</label>
          </div>
          <div className="space-y-1 pr-1">
            {ALL_LAYERS.map((layer) => (
              <div
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className="flex items-center justify-between p-1 rounded hover:bg-white/5 cursor-pointer select-none transition-colors border border-transparent hover:border-cyan-500/10"
              >
                <div className="flex items-center gap-1.5 text-gray-300 text-[10px]">
                  {layerIcons[layer.id]}
                  <span>{layer.label}</span>
                </div>
                <div className={`toggle-switch ${layers[layer.id] ? 'active' : ''}`} />
              </div>
            ))}
          </div>
        </div>
      </>
    </div>
  );
};
