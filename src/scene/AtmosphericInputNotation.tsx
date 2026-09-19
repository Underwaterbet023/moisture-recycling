import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/simulation/simulationStore';
import { SOURCE_REGIONS, SINK_REGION, CLOUD_REGION } from './terrainConfig';
import { getCell, computeMoistureBudget } from '@/simulation/syntheticDataProvider';
import { Info, X } from 'lucide-react';

const INPUT_VARS_EXPLANATION = [
  { symbol: 'q', name: 'Specific Humidity', unit: 'kg/kg', desc: 'Moisture mass per total air mass in parcel' },
  { symbol: 'u', name: 'Zonal Wind', unit: 'm/s', desc: 'West-to-East horizontal atmospheric velocity' },
  { symbol: 'v', name: 'Meridional Wind', unit: 'm/s', desc: 'South-to-North horizontal atmospheric velocity' },
  { symbol: 'w', name: 'Vertical Velocity (ω)', unit: 'Pa/s / m/s', desc: 'Vertical air motion and parcel lifting' },
  { symbol: 't', name: 'Time Coordinate', unit: 'UTC / sec', desc: 'Temporal tracking integration step' },
  { symbol: 'tcw', name: 'Total Column Water', unit: 'kg/m²', desc: 'Vertically integrated atmospheric water vapor' },
  { symbol: 'evf', name: 'Evaporation Flux Input', unit: 'mm/day', desc: 'Surface moisture flux entering parcel' },
  { symbol: 'nwf', name: 'Net Moisture Flux', unit: 'kg/(m²·s)', desc: 'Net moisture divergence/convergence balance' },
];



export function AtmosphericInputNotation() {
  const { scientificOverlay, layers, setSelectedGridCell, simulationTime } = useSimulationStore();
  const [showInputModal, setShowInputModal] = useState(false);

  // Show when scientific overlay is ON or sceneLabels is ON
  if (!scientificOverlay && !layers.sceneLabels) {
    return null;
  }

  const badgeStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'auto' as const,
    userSelect: 'none' as const,
  };

  return (
    <group name="scientific-annotations-and-input-notations">
      {/* ─────────────────────────────────────────────────────────────────
          1. "LAGRANGIAN MOISTURE TRACKING"
          Signature green header box from UTrack reference model
          Anchored in upper atmosphere above trajectories
          ───────────────────────────────────────────────────────────────── */}
      <group position={[-16, 47, -10]}>
        <Html center style={badgeStyle}>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(10,25,18,0.85)] border border-emerald-500/70 text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="font-bold text-xs tracking-wider uppercase text-white">
                Lagrangian Moisture Tracking
              </span>
            </div>
            {/* Subtle leader line down toward trajectories */}
            <div className="w-px h-5 bg-gradient-to-b from-emerald-500/70 to-transparent" />
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          2. INPUT (q, u, v, w, t, tcw, evf, nwf)
          Mathematical input variables badge with interactive tooltip modal
          ───────────────────────────────────────────────────────────────── */}
      <group position={[-18, 38, -6]}>
        <Html center style={badgeStyle}>
          <div className="relative flex flex-col items-center">
            <div
              onClick={() => setShowInputModal(!showInputModal)}
              className="cursor-pointer group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(28,10,36,0.85)] border border-fuchsia-500/70 text-fuchsia-200 backdrop-blur-md shadow-[0_0_14px_rgba(217,70,239,0.35)] transition-all hover:scale-105 hover:border-fuchsia-400"
              title="Click to inspect model input variables"
            >
              <span className="font-mono font-bold text-xs text-fuchsia-300">
                Input (q, u, v, w, t, tcw, evf, nwf)
              </span>
              <Info size={12} className="text-fuchsia-400 group-hover:text-fuchsia-200 animate-pulse" />
            </div>

            {/* Leader line to input field */}
            <div className="w-px h-4 bg-gradient-to-b from-fuchsia-500/60 to-transparent" />

            {/* Interactive Tooltip Modal explaining all 8 variables */}
            {showInputModal && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 p-3 rounded-xl bg-[rgba(8,12,24,0.95)] border border-fuchsia-500/40 text-white backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                    <span className="font-semibold text-xs text-fuchsia-300">
                      UTrack Model Atmospheric Inputs
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowInputModal(false); }}
                    className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px] max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {INPUT_VARS_EXPLANATION.map((item) => (
                    <div key={item.symbol} className="flex items-start gap-2 p-1 rounded bg-white/5 border border-white/5">
                      <span className="font-mono font-bold text-fuchsia-300 w-7 shrink-0 text-center bg-fuchsia-950/60 rounded px-1">
                        {item.symbol}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-200">{item.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">[{item.unit}]</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[9px] text-gray-500 mt-2 italic text-center">
                  Definitions follow the selected UTrack/moisture-budget formulation.
                </p>
              </div>
            )}
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          3. CLOUD FORMATION & ATMOSPHERIC STATE P(i, j, k, t)
          Scientific annotation pointing gracefully down to the volumetric cloud
          ───────────────────────────────────────────────────────────────── */}
      <group position={[20, 48, -26]}>
        <Html position={[0, 0, 0]} center style={badgeStyle}>
          <div className="flex flex-col items-center">
            <div
              onClick={() => {
                const cell = getCell(3, 4, 2, simulationTime);
                const budget = computeMoistureBudget(3, 4, 2, simulationTime);
                setSelectedGridCell({
                  i: 3,
                  j: 4,
                  k: 2,
                  latitude: cell.latitude,
                  longitude: cell.longitude,
                  pressure: cell.pressure,
                  cell,
                  budget,
                });
              }}
              className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(6,18,36,0.92)] border border-sky-400/80 text-sky-200 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.45)] hover:scale-105 transition-all"
              title="Click to inspect Cloud Formation and Eulerian cell state P(3, 4, 2, t)"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-sky-300 animate-pulse shadow-[0_0_8px_#38bdf8]" />
              <span className="font-bold text-xs text-white tracking-wide">
                Cloud Formation
              </span>
              <span className="font-mono font-bold text-[10px] text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/50">
                P(i, j, k, t)
              </span>
            </div>
            {/* Sleek thin leader line pointing down to the atmospheric cloud */}
            <div className="w-px h-6 bg-gradient-to-b from-sky-400/80 to-transparent" />
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          4. MOISTURE SOURCE REGION
          Demarcation badge + subtle ground perimeter
          ───────────────────────────────────────────────────────────────── */}
      <group position={[-42, 2.5, 20]}>
        <Html center style={badgeStyle}>
          <div className="px-2.5 py-1 rounded-lg bg-[rgba(5,20,15,0.85)] border border-emerald-500/60 text-emerald-300 backdrop-blur-md shadow-[0_0_12px_rgba(168,85,129,0.3)] text-xs font-semibold tracking-wide flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Moisture Source Region</span>
          </div>
        </Html>

        {/* Subtle perimeter indicator on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[28, 29.5, 48]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          5. ET FROM MOISTURE SOURCE REGION
          (Along upward moisture pathway from source to atmosphere)
          ───────────────────────────────────────────────────────────────── */}
      <group position={[-38, 16, 18]}>
        <Html center style={badgeStyle}>
          <div className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[rgba(26,20,8,0.88)] border border-amber-500/60 text-amber-200 backdrop-blur-sm text-[11px] font-semibold tracking-wide shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">↑</span>
            <span>ET from the moisture source region</span>
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          6. MOISTURE TRANSPORT
          (Main horizontal atmospheric advection pathway)
          ───────────────────────────────────────────────────────────────── */}
      <group position={[4, 36, -14]}>
        <Html center style={badgeStyle}>
          <div className="px-2.5 py-1 rounded-lg bg-[rgba(6,22,40,0.88)] border border-cyan-400/70 text-cyan-200 backdrop-blur-md shadow-[0_0_12px_rgba(0,240,255,0.4)] text-xs font-semibold tracking-wide flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">→</span>
            <span>Moisture Transport</span>
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          8. PRECIPITATION TO THE SINK REGION
          Purple callout from reference diagram pointing to sink
          ───────────────────────────────────────────────────────────────── */}
      <group position={[38, 20, -28]}>
        <Html center style={badgeStyle}>
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-lg bg-[rgba(26,10,40,0.88)] border border-purple-500/70 text-purple-200 backdrop-blur-md shadow-[0_0_14px_rgba(168,85,247,0.4)] text-xs font-bold tracking-wide flex items-center gap-1.5">
              <span className="text-purple-400 font-bold">↓</span>
              <span>Precipitation to the Sink Region</span>
            </div>
            <div className="w-px h-4 bg-purple-500/60" />
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          9. SINK REGION
          Demarcation badge + subtle watershed boundary
          ───────────────────────────────────────────────────────────────── */}
      <group position={[SINK_REGION.x, 4.5, SINK_REGION.z]}>
        <Html center style={badgeStyle}>
          <div className="px-2.5 py-1 rounded-lg bg-[rgba(20,12,38,0.85)] border border-purple-400/60 text-purple-300 backdrop-blur-md shadow-[0_0_10px_rgba(168,85,247,0.25)] text-xs font-semibold tracking-wide flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Sink Region (Watershed Basin)</span>
          </div>
        </Html>

        {/* Subtle ground boundary ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[24, 25.5, 48]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          10. HYDROLOGICAL CYCLE CLOSURE: RUNOFF & DISCHARGE
          ───────────────────────────────────────────────────────────────── */}
      <group position={[32, 28, -100]}>
        <Html center style={badgeStyle}>
          <div className="px-2 py-0.5 rounded bg-[rgba(6,18,34,0.8)] border border-cyan-500/30 text-cyan-200 backdrop-blur-sm text-[10px]">
            Mountain Runoff / Streamflow
          </div>
        </Html>
      </group>

      <group position={[-42, 5.0, 72]}>
        <Html center style={badgeStyle}>
          <div className="px-2 py-0.5 rounded bg-[rgba(6,18,34,0.8)] border border-cyan-500/30 text-cyan-200 backdrop-blur-sm text-[10px]">
            River Discharge (Estuary Delta)
          </div>
        </Html>
      </group>
    </group>
  );
}
