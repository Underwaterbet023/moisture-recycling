// ============================================================================
// Simulation Types
// ============================================================================

export type ActivePage = 'simulation' | 'lagrangian' | 'eulerian';
export type VisualizationMode = 'combined' | 'lagrangian' | 'eulerian' | 'physical';
export type QualityLevel = 'low' | 'medium' | 'high' | 'research';
export type DatasetType = 'synthetic' | 'era5';
export type CameraPreset = 'global' | 'regional' | 'atmosphere' | 'cloud' | 'grid' | 'particleFollow';
export type TrackingMode = 'forward' | 'backward';
export type IntegrationMethod = 'euler' | 'rk4';
export type CloudQuality = 'low' | 'medium' | 'high' | 'ultra';

/** Layer toggle identifier */
export type LayerId =
  | 'atmosphericGrid'
  | 'pressureSurfaces'
  | 'windVectors'
  | 'moistureParticles'
  | 'particleTrails'
  | 'cloudsPrecipitation'
  | 'evaporationOceanRiver'
  | 'transpirationVegetation'
  | 'terrainLandUse'
  | 'farmTractor'
  | 'sceneLabels'
  | 'gridPoints';

/** Layer configuration entry */
export interface LayerConfig {
  id: LayerId;
  label: string;
  defaultOn: boolean;
}

/** All available layers */
export const ALL_LAYERS: LayerConfig[] = [
  { id: 'atmosphericGrid', label: 'Atmospheric Grid', defaultOn: false },
  { id: 'pressureSurfaces', label: 'Pressure Surfaces', defaultOn: false },
  { id: 'windVectors', label: 'Wind Streamlines', defaultOn: false },
  { id: 'moistureParticles', label: 'Moisture Particles', defaultOn: true },
  { id: 'particleTrails', label: 'Particle Trails', defaultOn: false },
  { id: 'cloudsPrecipitation', label: 'Clouds & Rain', defaultOn: true },
  { id: 'evaporationOceanRiver', label: 'Evaporation Mist', defaultOn: true },
  { id: 'transpirationVegetation', label: 'Canopy Transpiration', defaultOn: true },
  { id: 'terrainLandUse', label: 'Terrain & Land Use', defaultOn: true },
  { id: 'farmTractor', label: 'Farmland & Crops', defaultOn: true },
  { id: 'sceneLabels', label: 'Scene Labels', defaultOn: false },
  { id: 'gridPoints', label: 'Grid Points', defaultOn: false },
];

/** Time series data point */
export interface TimeSeriesPoint {
  time: string;
  value: number;
}

/** Time series dataset */
export interface TimeSeriesData {
  precipitation: TimeSeriesPoint[];
  et: TimeSeriesPoint[];
  specificHumidity: TimeSeriesPoint[];
  moistureFlux: TimeSeriesPoint[];
}

/** Loading state messages */
export const LOADING_MESSAGES = [
  'Loading atmospheric data...',
  'Interpolating wind field...',
  'Calculating moisture trajectories...',
  'Computing moisture budget...',
  'Updating particle field...',
  'Rendering atmospheric volume...',
] as const;

/** Camera preset configurations with optimal angles looking across regional watershed */
export const CAMERA_PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  global: { position: [12, 54, 118], target: [18, 10, -12] },    // Cinematic continental watershed view
  regional: { position: [48, 36, 60], target: [25, 8, -5] },     // Agricultural basin & forest foothills
  atmosphere: { position: [10, 85, 75], target: [18, 30, -22] },  // Atmospheric volume overview
  cloud: { position: [14, 43, 14], target: [20, 36, -25] },       // Close-up volumetric cloud formation
  grid: { position: [42, 60, 50], target: [10, 18, -10] },       // Eulerian grid angle
  particleFollow: { position: [20, 30, 25], target: [5, 14, -5] },
};
