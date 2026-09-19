// ============================================================================
// Terrain Configuration — Procedural Landscape Generation
// ============================================================================

import { createNoise2D } from 'simplex-noise';

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const noise1 = createNoise2D(rand);
const noise2 = createNoise2D(rand);
const noise3 = createNoise2D(rand);

// ── Terrain Geographic Extents ──────────────────────────────────────────────

export const TERRAIN = {
  // Main detailed watershed mesh dimensions (units ~ meters in scene scale)
  size: 700,
  segments: 250,
  maxHeight: 52,
  snowLine: 28,
  treeLineLow: 2,
  treeLineHigh: 21,
  oceanLevel: -0.5,
  riverElevation: 0.2,
};

// ── Biomes (Natural Earth & Satellite Observation Palette) ──────────────────

export type Biome = 'ocean' | 'beach' | 'riverbed' | 'farm' | 'grass' | 'forest' | 'rock' | 'snow';

export const BIOME_COLORS: Record<Biome, [number, number, number]> = {
  ocean:    [0.05, 0.22, 0.42],  // Deep oceanic blue
  beach:    [0.72, 0.68, 0.52],  // Coastal sand & pebble strand
  riverbed: [0.20, 0.32, 0.35],  // Saturated riparian silt & pebbles
  farm:     [0.42, 0.52, 0.22],  // Fertile agricultural field pasture
  grass:    [0.30, 0.50, 0.24],  // Rich valley green meadow
  forest:   [0.12, 0.35, 0.16],  // Deep woodland evergreen
  rock:     [0.38, 0.35, 0.32],  // Weathered alpine granitic rock
  snow:     [0.96, 0.98, 1.00],  // Bright mountain snow
};

// ── Continental Coastline Definition ────────────────────────────────────────
// The ocean occupies the western quadrant (x < coastlineX(z)).
// The continental landmass extends continuously eastward (x > coastlineX(z)).

export function coastLineX(z: number): number {
  const baseCoast = -38.0;
  const wander = noise1(z * 0.015, 1.2) * 14.0 + noise2(z * 0.045, 2.5) * 4.0;
  return baseCoast + wander;
}

export function isOcean(x: number, z: number): boolean {
  return x <= coastLineX(z);
}

// ── Hydrological Network Spline Paths ───────────────────────────────────────
// Complete hierarchy:
// 6 Mountain Streams (Alpine snowmelt / glacial cirques)
//   ↓
// 3 Major Tributaries (Gorge canyons)
//   ↓
// Main River (Mountain Basin → Waterfall Gorge → Foothills → Valley → Estuary Delta)
//   ↓
// Ocean

export interface SplinePoint {
  x: number;
  y: number;
  z: number;
  w: number;
}

// ── 6 Mountain Streams ──────────────────────────────────────────────────────

/** Stream 1: Alpine Cirque Glacier Stream (Northeast Summit Peak) */
export function stream1Path(t: number): SplinePoint {
  const z = -142 + t * (-115 - (-142));
  const x = 72 + (52 - 72) * Math.pow(t, 0.85) + Math.sin(t * Math.PI * 2) * 3.0;
  const y = 38.0 - t * 11.0; // 38.0m down to 27.0m
  const w = 3.6 + t * 2.2;
  return { x, y, z, w };
}

/** Stream 2: North Summit Torrent (High Snow Chute) */
export function stream2Path(t: number): SplinePoint {
  const z = -148 + t * (-116 - (-148));
  const x = 34 + (44 - 34) * t - Math.sin(t * Math.PI * 2.5) * 2.5;
  const y = 40.0 - t * 13.0; // 40.0m down to 27.0m
  const w = 3.5 + t * 2.2;
  return { x, y, z, w };
}

/** Stream 3: High Ridge Cascades (North-Central Crest) */
export function stream3Path(t: number): SplinePoint {
  const z = -138 + t * (-108 - (-138));
  const x = 8 + (18 - 8) * t + Math.sin(t * Math.PI * 2) * 2.5;
  const y = 35.0 - t * 11.0; // 35.0m down to 24.0m
  const w = 3.2 + t * 2.2;
  return { x, y, z, w };
}

/** Stream 4: Northwest Mountain Gorge (Granite Col) */
export function stream4Path(t: number): SplinePoint {
  const z = -120 + t * (-98 - (-120));
  const x = -22 + (-2 - (-22)) * Math.pow(t, 0.9) - Math.sin(t * Math.PI * 2) * 2.0;
  const y = 29.0 - t * 10.0; // 29.0m down to 19.0m
  const w = 3.2 + t * 2.2;
  return { x, y, z, w };
}

/** Stream 5: Eastern Alpine Spring (Deep Pine Woods Brook) */
export function stream5Path(t: number): SplinePoint {
  const z = -112 + t * (-82 - (-112));
  const x = 108 + (76 - 108) * Math.pow(t, 0.8) + Math.sin(t * Math.PI * 1.8) * 3.5;
  const y = 31.0 - t * 13.0; // 31.0m down to 18.0m
  const w = 3.4 + t * 2.4;
  return { x, y, z, w };
}

/** Stream 6: Western Foothills Wooded Brook */
export function stream6Path(t: number): SplinePoint {
  const z = -78 + t * (-46 - (-78));
  const x = -16 + (10 - (-16)) * Math.pow(t, 0.9) + Math.sin(t * Math.PI * 2.2) * 2.8;
  const y = 17.0 - t * 6.5; // 17.0m down to 10.5m
  const w = 3.4 + t * 2.4;
  return { x, y, z, w };
}

// ── 3 Major Tributaries ─────────────────────────────────────────────────────

/** Tributary 1: Northeast Alpine River (Gathers Streams 1 & 2) */
export function tributary1Path(t: number): SplinePoint {
  const z = -115 + t * (-92 - (-115));
  const x = 48 + (32 - 48) * t + Math.sin(t * Math.PI * 2) * 2.2;
  const y = 27.0 - t * 6.0; // 27.0m down to 21.0m
  const w = 4.8 + t * 2.8;
  return { x, y, z, w };
}

/** Tributary 2: North-Central Gorge River (Gathers Streams 3 & 4) */
export function tributary2Path(t: number): SplinePoint {
  const z = -102 + t * (-88 - (-102));
  const x = 10 + (24 - 10) * t - Math.sin(t * Math.PI * 1.5) * 2.0;
  const y = 21.5 - t * 1.5; // 21.5m down to 20.0m
  const w = 4.6 + t * 2.8;
  return { x, y, z, w };
}

/** Tributary 3: Eastern Valley Tributary (Gathers Stream 5) */
export function tributary3Path(t: number): SplinePoint {
  const z = -82 + t * (-56 - (-82));
  const x = 76 + (32 - 76) * Math.pow(t, 0.85) + Math.sin(t * Math.PI * 2) * 3.0;
  const y = 18.0 - t * 6.0; // 18.0m down to 12.0m
  const w = 4.8 + t * 2.8;
  return { x, y, z, w };
}

/** Tributary 4: Western Foothills Wooded Stream */
export function tributary4Path(t: number): SplinePoint {
  const z = -78 + t * (-46 - (-78));
  const x = -16 + (10 - (-16)) * Math.pow(t, 0.9) + Math.sin(t * Math.PI * 2.2) * 2.8;
  const y = 17.0 - t * 6.5; // 17.0m down to 10.5m
  const w = 3.6 + t * 2.4;
  return { x, y, z, w };
}

// ── Main River Spine ────────────────────────────────────────────────────────
// Originates at z = -90 (confluence of Tributaries 1 & 2 in mountain canyon)
// Waterfall step between z = -80 and z = -74 (drop from 17.5m down to 12.5m)
// Discharges into the ocean estuary delta at z = 82, meeting the sea at coastLineX(82) - 4

export function mainRiverPath(t: number): SplinePoint {
  const z = -90 + t * (82 - (-90));
  let x = 0;
  if (z < -70) {
    const s = (z - (-90)) / 20;
    x = 28 * (1 - s) + 24 * s + Math.sin(s * Math.PI) * 2;
  } else if (z < -40) {
    const s = (z - (-70)) / 30;
    x = 24 * (1 - s) + 16 * s - Math.sin(s * Math.PI) * 3;
  } else if (z < 35) {
    x = 16 + Math.sin(z * 0.04) * 11 + Math.sin(z * 0.02) * 6;
  } else {
    const s = (z - 35) / 47;
    const midX = 16 + Math.sin(35 * 0.04) * 11 + Math.sin(35 * 0.02) * 6;
    const targetX = coastLineX(z) - 3.5;
    x = midX * (1 - s * s) + targetX * (s * s);
  }

  let y = 0;
  if (z <= -80) {
    const s = (z - (-90)) / 10;
    y = 20.5 - s * 3.0; // 20.5m down to 17.5m
  } else if (z <= -74) {
    const s = (z - (-80)) / 6;
    const dropS = (1 - Math.cos(s * Math.PI)) / 2;
    y = 17.5 - dropS * 5.0; // 17.5m down to 12.5m (waterfall gorge)
  } else if (z <= -40) {
    const s = (z - (-74)) / 34;
    y = 12.5 - s * 5.0; // 12.5m down to 7.5m
  } else if (z <= 35) {
    const s = (z - (-40)) / 75;
    y = 7.5 - s * 5.7; // 7.5m down to 1.8m
  } else {
    const s = (z - 35) / 47;
    y = 1.8 - s * 2.1; // 1.8m down to -0.3m (matches ocean level -0.5m)
  }

  let w = 0;
  if (z < -70) {
    w = 4.8 + (z + 90) * 0.08;
  } else if (z < 35) {
    const s = (z + 70) / 105;
    w = 6.4 + s * 6.6; // 6.4m to 13.0m
  } else {
    const s = (z - 35) / 47;
    w = 13.0 + s * 19.0; // 13.0m to 32.0m estuary delta
  }

  return { x, y, z, w };
}

/** Check if a 2D coordinate is near any stream, tributary, or the main river (including buffer margin) */
export function isNearAnyWater(x: number, z: number, buffer = 3.5): boolean {
  if (isOcean(x, z)) return true;
  if (z >= -92 && z <= 84) {
    const t = Math.max(0, Math.min(1, (z - (-90)) / (82 - (-90))));
    const p = mainRiverPath(t);
    if (Math.abs(x - p.x) < p.w * 0.65 + buffer) return true;
  }
  if (distanceToTributary1(x, z).dist < 3.2 + buffer) return true;
  if (distanceToTributary2(x, z).dist < 3.0 + buffer) return true;
  if (distanceToTributary3(x, z).dist < 3.2 + buffer) return true;
  if (distanceToStream1(x, z).dist < 2.5 + buffer) return true;
  if (distanceToStream2(x, z).dist < 2.5 + buffer) return true;
  if (distanceToStream3(x, z).dist < 2.5 + buffer) return true;
  if (distanceToStream4(x, z).dist < 2.5 + buffer) return true;
  if (distanceToStream5(x, z).dist < 2.5 + buffer) return true;
  if (distanceToStream6(x, z).dist < 2.5 + buffer) return true;
  return false;
}

// ── Compatibility Wrappers for Main River ───────────────────────────────────

export function riverCenterX(z: number): number {
  if (z < -90) return 28;
  if (z > 82) return coastLineX(82) - 3.5;
  const t = (z - (-90)) / (82 - (-90));
  return mainRiverPath(t).x;
}

export function riverWidth(z: number): number {
  if (z < -90) return 2.4;
  if (z > 82) return 24.0;
  const t = (z - (-90)) / (82 - (-90));
  return mainRiverPath(t).w;
}

export function riverWaterElevation(z: number): number {
  if (z < -90) return 20.5;
  if (z > 82) return TERRAIN.oceanLevel;
  const t = (z - (-90)) / (82 - (-90));
  return mainRiverPath(t).y;
}

export function distanceToRiver(x: number, z: number): number {
  if (z < -90 || z > 82) return 999;
  const cx = riverCenterX(z);
  return Math.abs(x - cx);
}

// ── Distance Queries for Streams and Tributaries ────────────────────────────

function checkSplineDistance(
  x: number,
  z: number,
  startZ: number,
  endZ: number,
  pathFn: (t: number) => SplinePoint
): { dist: number; point: SplinePoint; t: number } {
  const minZ = Math.min(startZ, endZ);
  const maxZ = Math.max(startZ, endZ);
  if (z < minZ - 2 || z > maxZ + 2) return { dist: 999, point: { x: 0, y: 0, z: 0, w: 0 }, t: -1 };
  const t = Math.max(0, Math.min(1, (z - startZ) / (endZ - startZ)));
  const p = pathFn(t);
  return { dist: Math.hypot(x - p.x, z - p.z), point: p, t };
}

export function distanceToStream1(x: number, z: number) { return checkSplineDistance(x, z, -142, -115, stream1Path); }
export function distanceToStream2(x: number, z: number) { return checkSplineDistance(x, z, -148, -116, stream2Path); }
export function distanceToStream3(x: number, z: number) { return checkSplineDistance(x, z, -138, -108, stream3Path); }
export function distanceToStream4(x: number, z: number) { return checkSplineDistance(x, z, -120, -98, stream4Path); }
export function distanceToStream5(x: number, z: number) { return checkSplineDistance(x, z, -112, -82, stream5Path); }
export function distanceToStream6(x: number, z: number) { return checkSplineDistance(x, z, -78, -46, stream6Path); }

export function distanceToTributary1(x: number, z: number) { return checkSplineDistance(x, z, -115, -92, tributary1Path); }
export function distanceToTributary2(x: number, z: number) { return checkSplineDistance(x, z, -102, -88, tributary2Path); }
export function distanceToTributary3(x: number, z: number) { return checkSplineDistance(x, z, -82, -56, tributary3Path); }
export function distanceToTributary4(x: number, z: number) { return checkSplineDistance(x, z, -78, -46, tributary4Path); }

// ── Flow Direction Validation Debug Function ────────────────────────────────

export function validateRiverFlow(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const splines: [string, (t: number) => SplinePoint][] = [
    ['Stream 1', stream1Path],
    ['Stream 2', stream2Path],
    ['Stream 3', stream3Path],
    ['Stream 4', stream4Path],
    ['Stream 5', stream5Path],
    ['Stream 6', stream6Path],
    ['Tributary 1', tributary1Path],
    ['Tributary 2', tributary2Path],
    ['Tributary 3', tributary3Path],
    ['Main River', mainRiverPath],
  ];

  for (const [name, fn] of splines) {
    let prevY = 9999;
    for (let i = 0; i <= 100; i++) {
      const p = fn(i / 100);
      if (p.y > prevY + 1e-5) {
        errors.push(`${name} fails downhill check at step ${i}: y=${p.y.toFixed(3)} > prevY=${prevY.toFixed(3)}`);
      }
      prevY = p.y;
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ── Continuous Mountain Range Procedural Generator ──────────────────────────
// Forms an expansive, natural alpine cordillera spanning the ENTIRE northern and
// northeastern horizon (x from -35 to 600+, z from -20 to -600+) with connected
// ridgelines, glacial cols, and towering snowy peaks.

function mountainRangeElevation(x: number, z: number): number {
  if (z > -20) return 0;

  // Ramps up smoothly from z = -20 to z = -70, then continues into the deep northern horizon
  const depthT = Math.min(1.0, Math.max(0, (-z - 20) / 50.0));
  // High continental interior / back cordillera continues to rise
  const deepInterior = 1.0 + Math.min(0.35, Math.max(0, (-z - 90) * 0.0015));

  // Taper at western ocean margin (so mountains meet the sea gracefully)
  const distFromWest = Math.min(1.0, Math.max(0, (x - (-34)) / 22.0));

  // 1. Multi-octave ridged alpine noise (sharp arêtes, glacial cirques, knife-edge cols)
  const r1 = 1.0 - Math.abs(noise1(x * 0.016 + 1.2, z * 0.014 + 0.8));
  const r2 = 1.0 - Math.abs(noise2(x * 0.034 - 0.4, z * 0.030 + 1.5));
  const r3 = 1.0 - Math.abs(noise3(x * 0.072 + 0.9, z * 0.062 - 0.6));
  const ridgeBase = Math.pow(r1 * 0.52 + r2 * 0.36 + r3 * 0.22, 1.35) * 44.0;

  // 2. Towering massif domes & summits across the continental spine
  const massif = Math.max(0, noise1(x * 0.01 + 3.0, z * 0.009 - 2.0)) * 14.0;

  // 3. Peak cluster harmonics (ensures high peaks repeat rhythmically across all longitudes)
  const peakMod = Math.sin(x * 0.042) * 3.5 + Math.cos(x * 0.088 + z * 0.03) * 3.0;

  const alpineH = Math.max(4.0, ridgeBase + massif + peakMod);
  return depthT * alpineH * distFromWest * deepInterior;
}

// ── Channel Carving Utility ─────────────────────────────────────────────────

function applyChannelCarve(
  h: number,
  dist: number,
  waterY: number,
  width: number,
  depth: number,
  valleyExpansion = 2.2
): number {
  const valleyWidth = width * valleyExpansion;
  if (dist >= valleyWidth) return h;

  const halfW = width * 0.5;
  const bankMargin = 0.08;

  if (dist <= halfW) {
    // Parabolic bed carving inside the active river channel
    const normD = dist / halfW;
    const bedTarget = (waterY - depth) + (depth + bankMargin) * (normD * normD);
    return Math.min(h, bedTarget);
  } else {
    // Smooth transition from bank edge up into the valley floor
    const normV = (dist - halfW) / (valleyWidth - halfW);
    const smoothV = normV * normV * (3.0 - 2.0 * normV);
    const bankY = waterY + bankMargin;
    const targetY = bankY * (1.0 - smoothV) + h * smoothV;
    return Math.min(h, targetY);
  }
}

// ── Master Height Function heightAt(x, z) ───────────────────────────────────

export function heightAt(x: number, z: number): number {
  const clX = coastLineX(z);

  // Ocean seabed: slopes down smoothly below the ocean water to prevent any z-fighting or clipping
  if (x <= clX) {
    const distOffshore = clX - x;
    return TERRAIN.oceanLevel - 1.5 - Math.min(24.0, distOffshore * 0.35 + Math.pow(Math.min(distOffshore, 40.0) * 0.12, 2.0));
  }

  // Distance inland from coastline
  const distFromCoast = x - clX;
  const coastalSlope = Math.min(1.0, distFromCoast / 22.0);

  // 1. Base rolling terrain (regional undulation)
  const baseNoise =
    noise1(x * 0.012, z * 0.012) * 2.5 +
    noise2(x * 0.028, z * 0.028) * 1.5 +
    noise3(x * 0.065, z * 0.065) * 0.6;
  let h = Math.max(0.8, 3.8 + baseNoise);

  // 2. Continuous alpine cordillera across northern horizon (all x, z < -20)
  const mtnH = mountainRangeElevation(x, z);
  h += mtnH;

  // 3. Foothill transitional relief (between mountains and alluvial plains)
  if (z > -65 && z < -20 && x > -15) {
    const ftT = (1.0 - Math.abs((z - (-42)) / 22.0)) * Math.min(1.0, (x + 15) / 40.0);
    h += Math.max(0, ftT) * (6.0 + noise2(x * 0.04, z * 0.04) * 4.0);
  }

  // 4. Eastern continental rolling hills & wooded uplands (x > 75, z > -25)
  if (x > 75 && z > -25) {
    const eastFactor = Math.min(1.0, (x - 75) / 55.0);
    const eastHills =
      Math.max(0, noise2(x * 0.018, z * 0.016)) * 14.0 +
      Math.max(0, noise3(x * 0.038, z * 0.035)) * 5.5;
    h += eastHills * eastFactor;
  }

  // 5. Southern coastal lowlands & gentle knolls (z > 65)
  if (z > 65) {
    const southFactor = Math.min(1.0, (z - 65) / 60.0);
    const southHills = Math.max(0, noise1(x * 0.015, z * 0.015)) * 6.5;
    h += southHills * southFactor;
  }

  // 6. Agricultural alluvial plain (gently sloping, fertile lowland)
  if (x > 15 && x < 95 && z > -15 && z < 70) {
    const farmT = Math.min(1.0, (x - 15) / 20.0) * Math.min(1.0, (95 - x) / 20.0) *
                  Math.min(1.0, (z + 15) / 20.0) * Math.min(1.0, (70 - z) / 20.0);
    h = h * (1.0 - farmT * 0.6) + (2.0 + noise3(x * 0.03, z * 0.03) * 0.4) * (farmT * 0.6);
  }

  // ── Carve Main River Channel & Valley (z in [-90, 82]) ───────────────────
  if (z >= -90 && z <= 82 && !isOcean(x, z)) {
    const t = (z - (-90)) / (82 - (-90));
    const p = mainRiverPath(t);
    const dRiver = Math.abs(x - p.x);
    // Depth from 0.7m (mountain gorge) to 1.1m (valley) to 1.8m (estuary)
    const channelDepth = 0.7 + t * 1.1;
    h = applyChannelCarve(h, dRiver, p.y, p.w, channelDepth, 2.4);
  }

  // ── Carve 3 Tributary Gorges ─────────────────────────────────────────────
  const trib1 = distanceToTributary1(x, z);
  if (trib1.t >= 0 && !isOcean(x, z)) {
    h = applyChannelCarve(h, trib1.dist, trib1.point.y, trib1.point.w, 0.65, 2.2);
  }

  const trib2 = distanceToTributary2(x, z);
  if (trib2.t >= 0 && !isOcean(x, z)) {
    h = applyChannelCarve(h, trib2.dist, trib2.point.y, trib2.point.w, 0.65, 2.2);
  }

  const trib3 = distanceToTributary3(x, z);
  if (trib3.t >= 0 && !isOcean(x, z)) {
    h = applyChannelCarve(h, trib3.dist, trib3.point.y, trib3.point.w, 0.65, 2.2);
  }

  // ── Carve 6 Mountain Stream Chutes ───────────────────────────────────────
  const s1 = distanceToStream1(x, z);
  if (s1.t >= 0 && !isOcean(x, z)) h = applyChannelCarve(h, s1.dist, s1.point.y, s1.point.w, 0.55, 2.0);

  const s2 = distanceToStream2(x, z);
  if (s2.t >= 0 && !isOcean(x, z)) h = applyChannelCarve(h, s2.dist, s2.point.y, s2.point.w, 0.55, 2.0);

  const s3 = distanceToStream3(x, z);
  if (s3.t >= 0 && !isOcean(x, z)) h = applyChannelCarve(h, s3.dist, s3.point.y, s3.point.w, 0.55, 2.0);

  const s4 = distanceToStream4(x, z);
  if (s4.t >= 0 && !isOcean(x, z)) h = applyChannelCarve(h, s4.dist, s4.point.y, s4.point.w, 0.55, 2.0);

  const s5 = distanceToStream5(x, z);
  if (s5.t >= 0 && !isOcean(x, z)) h = applyChannelCarve(h, s5.dist, s5.point.y, s5.point.w, 0.55, 2.0);

  const s6 = distanceToStream6(x, z);
  if (s6.t >= 0 && !isOcean(x, z)) h = applyChannelCarve(h, s6.dist, s6.point.y, s6.point.w, 0.55, 2.0);

  // Smooth shoreline transition: ensure elevation gently meets ocean level at the beach
  const smoothCoast = Math.sin((coastalSlope * Math.PI) / 2.0);
  h = TERRAIN.oceanLevel + (h - TERRAIN.oceanLevel) * Math.pow(smoothCoast, 1.6);

  return h;
}

// ── Slope ───────────────────────────────────────────────────────────────────

export function slopeAt(x: number, z: number): number {
  const e = 1.4;
  const hx = heightAt(x + e, z) - heightAt(x - e, z);
  const hz = heightAt(x, z + e) - heightAt(x, z - e);
  return Math.sqrt(hx * hx + hz * hz) / (2 * e);
}

// ── Biome Classification ────────────────────────────────────────────────────

export function biomeAt(x: number, z: number, h: number): Biome {
  if (isOcean(x, z)) return 'ocean';

  // Coastal beach strand
  const clX = coastLineX(z);
  if (x - clX < 5.0 && h < 1.4) return 'beach';

  // Riverbed channels (within river cross-section)
  if (z >= -90 && z <= 82) {
    const t = (z - (-90)) / (82 - (-90));
    const p = mainRiverPath(t);
    const d = Math.abs(x - p.x);
    if (d < p.w * 0.55 && h <= p.y + 0.12) return 'riverbed';
  }

  if (distanceToTributary1(x, z).dist < 1.4) return 'riverbed';
  if (distanceToTributary2(x, z).dist < 1.3) return 'riverbed';
  if (distanceToTributary3(x, z).dist < 1.4) return 'riverbed';
  if (distanceToTributary4(x, z).dist < 1.3) return 'riverbed';

  if (distanceToStream1(x, z).dist < 0.9) return 'riverbed';
  if (distanceToStream2(x, z).dist < 0.9) return 'riverbed';
  if (distanceToStream3(x, z).dist < 0.8) return 'riverbed';
  if (distanceToStream4(x, z).dist < 0.8) return 'riverbed';
  if (distanceToStream5(x, z).dist < 0.9) return 'riverbed';
  if (distanceToStream6(x, z).dist < 0.9) return 'riverbed';

  // Alpine snow caps
  if (h > TERRAIN.snowLine) return 'snow';

  // Crags and cliffs
  const slope = slopeAt(x, z);
  if (h > TERRAIN.treeLineHigh || (slope > 1.8 && h > 10.0)) return 'rock';

  // Agricultural basin
  if (x > 24 && x < 85 && z > 0 && z < 60 && h < 5.5 && slope < 0.8) return 'farm';

  // Forest across foothills and midlands
  if (h > TERRAIN.treeLineLow && h < TERRAIN.treeLineHigh && slope < 1.6) return 'forest';

  return 'grass';
}

// ── Regional Process Coordinates ────────────────────────────────────────────

export const SOURCE_REGIONS = {
  ocean: { x: -65, z: 15, label: 'Evaporation from Ocean' },
  river: { x: riverCenterX(20), z: 20, label: 'Evaporation from River' },
  forest: { x: 5, z: -35, label: 'Transpiration from Forests & Foothills' },
  agriculture: { x: 50, z: 30, label: 'Evapotranspiration from Crops' },
};

export const SINK_REGION = {
  x: 45,
  z: -20,
  radius: 35,
  label: 'Precipitation to Sink Watershed',
};

export const CLOUD_REGION = {
  x: 35,
  z: -45,
  label: 'Cloud Formation & Mountain Condensation',
};
