// ============================================================================
// Central Simulation Store — Zustand
// ============================================================================

import { create } from 'zustand';
import type {
  ActivePage,
  VisualizationMode,
  QualityLevel,
  DatasetType,
  CameraPreset,
  TrackingMode,
  IntegrationMethod,
  LayerId,
} from '@/types/simulation';
import type { PressureLevelValue, SelectedGridCell, SourceContribution } from '@/types/atmospheric';
import type { SelectedParticle } from '@/types/particles';

// ── Default Layers (REALISTIC ENVIRONMENT DEFAULT) ──────────────────────────
// Atmospheric grid, pressure surfaces, wind vectors, and intrusive labels are OFF by default.
// The realistic landscape, water, vegetation, clouds, and moisture flow are the HERO.
const defaultLayers: Record<LayerId, boolean> = {
  atmosphericGrid: false,           // OFF by default
  pressureSurfaces: false,          // OFF by default
  windVectors: false,               // OFF by default
  moistureParticles: true,          // ON (tiny glowing particles)
  particleTrails: false,            // OFF by default (clean view)
  cloudsPrecipitation: true,        // ON
  evaporationOceanRiver: true,      // ON (mist plumes)
  transpirationVegetation: true,    // ON (canopy mist)
  terrainLandUse: true,             // ON (realistic 3D landscape)
  farmTractor: true,                // ON (farmland & crops)
  sceneLabels: false,               // Minimal/OFF by default
  gridPoints: false,                // OFF
};

export interface SimulationStore {
  // ── Navigation ──
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;

  // ── Scientific Overlay Master Toggle ──
  scientificOverlay: boolean;
  toggleScientificOverlay: () => void;
  setScientificOverlay: (v: boolean) => void;

  // ── Time & Playback ──
  simulationTime: number;
  isPlaying: boolean;
  speed: number;
  timestamp: string;
  setSimulationTime: (t: number) => void;
  setIsPlaying: (v: boolean) => void;
  togglePlayback: () => void;
  setSpeed: (s: number) => void;
  stepForward: () => void;
  resetSimulation: () => void;

  // ── Dataset ──
  dataset: DatasetType;
  setDataset: (d: DatasetType) => void;

  // ── Visualization & Quality ──
  visualizationMode: VisualizationMode;
  setVisualizationMode: (m: VisualizationMode) => void;
  quality: QualityLevel;
  setQuality: (q: QualityLevel) => void;

  // ── Pressure Level ──
  selectedPressure: PressureLevelValue | 'all';
  setSelectedPressure: (p: PressureLevelValue | 'all') => void;

  // ── Layers ──
  layers: Record<LayerId, boolean>;
  toggleLayer: (id: LayerId) => void;
  setLayer: (id: LayerId, value: boolean) => void;

  // ── Camera ──
  cameraPreset: CameraPreset;
  setCameraPreset: (p: CameraPreset) => void;

  // ── Tracking ──
  trackingMode: TrackingMode;
  setTrackingMode: (m: TrackingMode) => void;
  integrationMethod: IntegrationMethod;
  setIntegrationMethod: (m: IntegrationMethod) => void;

  // ── Selection ──
  selectedParticle: SelectedParticle | null;
  setSelectedParticle: (p: SelectedParticle | null) => void;
  selectedGridCell: SelectedGridCell | null;
  setSelectedGridCell: (c: SelectedGridCell | null) => void;

  // ── Analytics ──
  sourceContribution: SourceContribution;
  setSourceContribution: (s: SourceContribution) => void;
  precipitationRate: number;
  setPrecipitationRate: (r: number) => void;
  etRate: number;
  setEtRate: (r: number) => void;

  // ── Particle Settings ──
  particleDensity: number;
  setParticleDensity: (d: number) => void;
  trailLengthMultiplier: number;
  setTrailLengthMultiplier: (m: number) => void;

  // ── Lighting / Time of Day ──
  timeOfDay: 'morning' | 'noon' | 'evening';
  setTimeOfDay: (t: 'morning' | 'noon' | 'evening') => void;

  // ── Volumetric Cloud Settings ──
  cloudQuality: 'low' | 'medium' | 'high' | 'ultra';
  setCloudQuality: (q: 'low' | 'medium' | 'high' | 'ultra') => void;
  cloudSpeed: number;
  setCloudSpeed: (s: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  activePage: 'simulation',
  setActivePage: (page) => {
    set({ activePage: page });
    // In Eulerian mode, enable grid
    if (page === 'eulerian') {
      set((s) => ({
        layers: { ...s.layers, atmosphericGrid: true, pressureSurfaces: true, windVectors: true },
        scientificOverlay: true,
      }));
    }
  },

  scientificOverlay: false,
  toggleScientificOverlay: () => {
    const next = !get().scientificOverlay;
    set((s) => ({
      scientificOverlay: next,
      layers: {
        ...s.layers,
        atmosphericGrid: next,
        pressureSurfaces: next,
        windVectors: next,
        sceneLabels: next,
        particleTrails: next,
      },
    }));
  },
  setScientificOverlay: (v) => {
    set((s) => ({
      scientificOverlay: v,
      layers: {
        ...s.layers,
        atmosphericGrid: v,
        pressureSurfaces: v,
        windVectors: v,
        sceneLabels: v,
        particleTrails: v,
      },
    }));
  },

  simulationTime: 0,
  isPlaying: true, // Playing by default so flow is visible immediately
  speed: 1,
  timestamp: '2020-08-01 12:00 UTC',
  setSimulationTime: (t) => set({ simulationTime: t }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (s) => set({ speed: s }),
  stepForward: () => set((s) => ({ simulationTime: s.simulationTime + 3600 })),
  resetSimulation: () => set({
    simulationTime: 0,
    isPlaying: true,
    selectedParticle: null,
    selectedGridCell: null,
  }),

  dataset: 'synthetic',
  setDataset: (d) => set({ dataset: d }),

  visualizationMode: 'combined',
  setVisualizationMode: (m) => set({ visualizationMode: m }),

  quality: 'high',
  setQuality: (q) => set({ quality: q }),

  selectedPressure: 'all',
  setSelectedPressure: (p) => set({ selectedPressure: p }),

  layers: defaultLayers,
  toggleLayer: (id) => set((s) => ({
    layers: { ...s.layers, [id]: !s.layers[id] },
  })),
  setLayer: (id, value) => set((s) => ({
    layers: { ...s.layers, [id]: value },
  })),

  cameraPreset: 'global',
  setCameraPreset: (p) => set({ cameraPreset: p }),

  trackingMode: 'forward',
  setTrackingMode: (m) => set({ trackingMode: m }),
  integrationMethod: 'euler',
  setIntegrationMethod: (m) => set({ integrationMethod: m }),

  selectedParticle: null,
  setSelectedParticle: (p) => set({ selectedParticle: p }),
  selectedGridCell: null,
  setSelectedGridCell: (c) => set({ selectedGridCell: c }),

  sourceContribution: { ocean: 0.42, forest: 0.18, agriculture: 0.20, river: 0.12, otherLand: 0.08 },
  setSourceContribution: (s) => set({ sourceContribution: s }),
  precipitationRate: 8.5,
  setPrecipitationRate: (r) => set({ precipitationRate: r }),
  etRate: 4.2,
  setEtRate: (r) => set({ etRate: r }),

  particleDensity: 0.5,
  setParticleDensity: (d) => set({ particleDensity: d }),
  trailLengthMultiplier: 1,
  setTrailLengthMultiplier: (m) => set({ trailLengthMultiplier: m }),

  timeOfDay: 'noon',
  setTimeOfDay: (t) => set({ timeOfDay: t }),

  cloudQuality: 'high',
  setCloudQuality: (q) => set({ cloudQuality: q }),
  cloudSpeed: 0.1,
  setCloudSpeed: (s) => set({ cloudSpeed: s }),
}));
