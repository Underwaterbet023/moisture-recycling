import React, { useState } from 'react';
import { Cloud, Droplets, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Layers, Wind, Sparkles } from 'lucide-react';

export const Legend: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="glass-panel pointer-events-auto w-full text-white rounded-xl border border-[rgba(0,180,255,0.2)] bg-[rgba(6,14,28,0.75)] backdrop-blur-md p-2.5 text-xs z-40 max-h-72 overflow-y-auto custom-scrollbar shadow-xl">
      <div
        className="flex items-center justify-between border-b border-white/10 pb-1.5 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-cyan-300 text-xs">UTrack Scientific Legend</span>
        </div>
        <button className="text-gray-400 hover:text-white p-0.5">
          {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-1.5 mt-2 text-[10px]">
          {/* Lagrangian Moisture Tracking */}
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[9px]">
              Lagrangian
            </span>
            <span className="text-gray-200">Moisture Tracking System</span>
          </div>

          {/* Moisture Parcels P1-P4 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 font-bold font-mono text-[9px]">
              <span className="px-1 rounded bg-sky-500/30 text-sky-300">P₁</span>
              <span className="px-1 rounded bg-blue-500/30 text-blue-300">P₂</span>
              <span className="px-1 rounded bg-emerald-500/30 text-emerald-300">P₃</span>
              <span className="px-1 rounded bg-lime-500/30 text-lime-300">P₄</span>
            </div>
            <span className="text-gray-200">Representative Moisture Parcels</span>
          </div>

          {/* Model Inputs */}
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded bg-fuchsia-950 border border-fuchsia-500/50 text-fuchsia-300 font-mono font-bold text-[9px]">
              Input
            </span>
            <span className="text-gray-200">Variables (q, u, v, w, t, tcw, evf, nwf)</span>
          </div>

          {/* Atmospheric Grid Cell */}
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-[9px]">
              P(i,j,k,t)
            </span>
            <span className="text-gray-200">Eulerian Grid State Cell</span>
          </div>

          <div className="h-px bg-white/10 my-1.5" />

          {/* Yellow Source-Atmosphere Flux */}
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-1 rounded bg-amber-400 shadow-[0_0_5px_#fbbf24]" />
            <span className="text-amber-300 font-medium">Moisture Source Region ET (Rising Flux)</span>
          </div>

          {/* Wind Advection */}
          <div className="flex items-center gap-2">
            <div className="text-cyan-400 font-bold">→</div>
            <span className="text-gray-200">Atmospheric Moisture Transport (u, v)</span>
          </div>

          {/* Upward Fluxes */}
          <div className="flex items-center gap-2">
            <ArrowUp size={11} className="text-sky-400" />
            <span className="text-gray-200">Evaporation (Ocean & River)</span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUp size={11} className="text-emerald-400" />
            <span className="text-gray-200">Transpiration (Forest Canopy)</span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUp size={11} className="text-lime-400" />
            <span className="text-gray-200">Evapotranspiration (Farmland Crops)</span>
          </div>

          {/* Precipitation to Sink */}
          <div className="flex items-center gap-2">
            <ArrowDown size={11} className="text-purple-400" />
            <span className="text-purple-300 font-medium">Precipitation to Sink Region</span>
          </div>

          {/* Clouds & Rain */}
          <div className="flex items-center gap-2">
            <Cloud size={11} className="text-sky-200" />
            <span className="text-gray-200">Cloud Formation (Condensation)</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets size={11} className="text-blue-300" />
            <span className="text-gray-200">Rain Droplets / Deposition</span>
          </div>

          {/* Hydrological Loop */}
          <div className="flex items-center gap-2">
            <div className="text-blue-400 font-bold">~</div>
            <span className="text-gray-200">Mountain Runoff → River → Ocean</span>
          </div>

          <div className="h-px bg-white/10 my-1.5" />

          {/* Pressure Surfaces */}
          <div className="flex items-center gap-2">
            <Layers size={11} className="text-cyan-400" />
            <span className="text-gray-300">Isobaric Surfaces (1000–300 hPa)</span>
          </div>
        </div>
      )}
    </div>
  );
};
