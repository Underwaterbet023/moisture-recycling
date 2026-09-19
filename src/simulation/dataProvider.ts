// ============================================================================
// Data Provider Abstraction
// ============================================================================
// Abstracts data access so the UI can work with either synthetic demo data
// or real ERA5 data from a Python FastAPI backend.

import type { AtmosphericCell, MoistureBudget, SourceContribution, VerticallyIntegrated } from '@/types/atmospheric';
import * as synthetic from './syntheticDataProvider';

// ── Provider Interface ──────────────────────────────────────────────────────

export interface DataProvider {
  readonly name: string;
  readonly type: 'synthetic' | 'era5';

  getCell(i: number, j: number, k: number, time: number): AtmosphericCell;
  getInterpolated(lat: number, lon: number, pressure: number, time: number): AtmosphericCell;
  computeMoistureBudget(i: number, j: number, k: number, time: number): MoistureBudget;
  getSourceContribution(time: number): SourceContribution;
}

// ── Synthetic Data Provider ─────────────────────────────────────────────────

export class SyntheticDataProvider implements DataProvider {
  readonly name = 'Synthetic Demo Data';
  readonly type = 'synthetic' as const;

  getCell(i: number, j: number, k: number, time: number): AtmosphericCell {
    return synthetic.getCell(i, j, k, time);
  }

  getInterpolated(lat: number, lon: number, pressure: number, time: number): AtmosphericCell {
    return synthetic.getInterpolated(lat, lon, pressure, time);
  }

  computeMoistureBudget(i: number, j: number, k: number, time: number): MoistureBudget {
    return synthetic.computeMoistureBudget(i, j, k, time);
  }

  getSourceContribution(time: number): SourceContribution {
    return synthetic.getSourceContribution(time);
  }
}

// ── ERA5 Data Provider (Stub — for future FastAPI backend) ──────────────────

export class ERA5DataProvider implements DataProvider {
  readonly name = 'ERA5 Reanalysis';
  readonly type = 'era5' as const;
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  getCell(_i: number, _j: number, _k: number, _time: number): AtmosphericCell {
    // TODO: Fetch from /api/atmosphere
    throw new Error('ERA5 data provider not yet connected. Use synthetic mode.');
  }

  getInterpolated(_lat: number, _lon: number, _pressure: number, _time: number): AtmosphericCell {
    throw new Error('ERA5 data provider not yet connected. Use synthetic mode.');
  }

  computeMoistureBudget(_i: number, _j: number, _k: number, _time: number): MoistureBudget {
    throw new Error('ERA5 data provider not yet connected. Use synthetic mode.');
  }

  getSourceContribution(_time: number): SourceContribution {
    throw new Error('ERA5 data provider not yet connected. Use synthetic mode.');
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────

let activeProvider: DataProvider = new SyntheticDataProvider();

export function getDataProvider(): DataProvider {
  return activeProvider;
}

export function setDataProvider(provider: DataProvider): void {
  activeProvider = provider;
}

// ── API Endpoints (for future FastAPI backend) ──────────────────────────────
// These are documented here for the backend developer:
//
// GET  /api/atmosphere?lat=&lon=&pressure=&time=  → AtmosphericCell
// GET  /api/humidity?bounds=&pressure=&time=       → HumidityField
// GET  /api/wind?bounds=&pressure=&time=           → WindField
// GET  /api/precipitation?bounds=&time=            → PrecipitationField
// GET  /api/evapotranspiration?bounds=&time=       → ETField
// GET  /api/trajectory?particleId=                 → Trajectory
// GET  /api/moisture-budget?i=&j=&k=&time=        → MoistureBudget
// GET  /api/moisture-flux?bounds=&time=            → MoistureFluxField
// GET  /api/source-contribution?sink=&time=        → SourceContribution
