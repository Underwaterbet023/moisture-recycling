// ============================================================================
// Atmospheric Types — Moisture Recycling Simulation
// ============================================================================

/** Pressure levels used in the atmospheric model (hPa) */
export const PRESSURE_LEVELS = [1000, 850, 700, 500, 300] as const;
export type PressureLevelValue = (typeof PRESSURE_LEVELS)[number];

/** A single atmospheric grid cell */
export interface AtmosphericCell {
  /** Grid indices */
  i: number;
  j: number;
  k: number;
  /** Geographic coordinates */
  latitude: number;   // degrees
  longitude: number;  // degrees
  /** Pressure coordinate (hPa) */
  pressure: PressureLevelValue;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Specific humidity (kg/kg) */
  q: number;
  /** Zonal wind component — eastward (m/s) */
  u: number;
  /** Meridional wind component — northward (m/s) */
  v: number;
  /** Pressure vertical velocity (Pa/s). Negative generally = upward in pressure coords */
  omega: number;
  /** Surface pressure (hPa) */
  surfacePressure: number;
  /** Temperature (K) — optional, for future extension */
  temperature?: number;
}

/** Wind vector at a point */
export interface WindVector {
  u: number;       // zonal (m/s)
  v: number;       // meridional (m/s)
  magnitude: number;
  direction: number; // radians, meteorological convention
}

/** Moisture budget terms for a grid cell */
export interface MoistureBudget {
  /** Spatial derivatives */
  dq_dx: number;  // ∂q/∂x
  dq_dy: number;  // ∂q/∂y
  dq_dp: number;  // ∂q/∂p
  /** Advection */
  horizontalAdvection: number;  // u·∂q/∂x + v·∂q/∂y
  verticalAdvection: number;    // ω·∂q/∂p
  /** Flux */
  moistureFlux: number;         // magnitude of Q vector (kg m⁻¹ s⁻¹)
  moistureFluxX: number;        // Qx component
  moistureFluxY: number;        // Qy component
  /** Flux convergence (positive = convergence = precipitation tendency) */
  fluxConvergence: number;
  /** Source/sink (kg/kg/s) */
  source: number;
}

/** 3D grid dimensions */
export interface GridDimensions {
  nLat: number;
  nLon: number;
  nLev: number;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  levels: PressureLevelValue[];
}

/** Selected grid cell for inspector */
export interface SelectedGridCell {
  i: number;
  j: number;
  k: number;
  latitude: number;
  longitude: number;
  pressure: PressureLevelValue;
  cell: AtmosphericCell;
  budget: MoistureBudget;
}

/** Vertically integrated moisture quantities */
export interface VerticallyIntegrated {
  /** Precipitable water W = (1/g)∫q dp (kg/m²) */
  precipitableWater: number;
  /** Vertically integrated moisture flux Qx = (1/g)∫qu dp (kg m⁻¹ s⁻¹) */
  moistureFluxX: number;
  /** Vertically integrated moisture flux Qy = (1/g)∫qv dp (kg m⁻¹ s⁻¹) */
  moistureFluxY: number;
  /** Moisture flux convergence MFC = -∇·Q */
  convergence: number;
}

/** Source contribution breakdown */
export interface SourceContribution {
  ocean: number;       // fraction
  forest: number;
  agriculture: number;
  river: number;
  otherLand: number;
}

/** Precipitation data for a point/cell */
export interface PrecipitationData {
  rate: number;        // mm/day
  accumulated: number; // mm
  source: SourceContribution;
}

/** Evapotranspiration data */
export interface EvapotranspirationData {
  evaporation: number;      // mm/day
  transpiration: number;    // mm/day
  total: number;            // mm/day
  source: 'ocean' | 'river' | 'forest' | 'agriculture';
}
