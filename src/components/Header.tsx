import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Sliders, Sun, Sunset, Sunrise } from 'lucide-react';
import { useSimulationStore } from '@/simulation/simulationStore';

export const Header: React.FC = () => {
  const {
    isPlaying,
    togglePlayback,
    stepForward,
    resetSimulation,
    speed,
    setSpeed,
    scientificOverlay,
    toggleScientificOverlay,
    timeOfDay,
    setTimeOfDay,
  } = useSimulationStore();

  return (
    <header className="pointer-events-none flex items-center justify-end px-3 pt-2.5 w-full select-none z-50">
      {/* Floating Essential Simulation Controls */}
      <div className="pointer-events-auto flex items-center gap-2 bg-[rgba(5,10,24,0.85)] backdrop-blur-xl border border-cyan-500/30 rounded-xl px-2.5 py-1.5 shadow-2xl text-white">
        {/* Scientific Overlay Master Toggle */}
        <button
          onClick={toggleScientificOverlay}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
            scientificOverlay
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,212,255,0.4)]'
              : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200'
          }`}
          title="Toggle scientific grid, wind streamlines, and isobaric surfaces overlay"
        >
          <Sliders size={13} />
          <span>Scientific Overlay: {scientificOverlay ? 'ON' : 'OFF'}</span>
        </button>

        {/* Lighting preset */}
        <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5 text-xs">
          <button
            onClick={() => setTimeOfDay('morning')}
            className={`p-1 rounded ${timeOfDay === 'morning' ? 'text-amber-300 bg-white/10' : 'text-gray-400 hover:text-white'}`}
            title="Morning lighting"
          >
            <Sunrise size={13} />
          </button>
          <button
            onClick={() => setTimeOfDay('noon')}
            className={`p-1 rounded ${timeOfDay === 'noon' ? 'text-yellow-300 bg-white/10' : 'text-gray-400 hover:text-white'}`}
            title="Noon daylight"
          >
            <Sun size={13} />
          </button>
          <button
            onClick={() => setTimeOfDay('evening')}
            className={`p-1 rounded ${timeOfDay === 'evening' ? 'text-orange-300 bg-white/10' : 'text-gray-400 hover:text-white'}`}
            title="Evening / Golden hour"
          >
            <Sunset size={13} />
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-cyan-500/20">
          <button
            onClick={togglePlayback}
            className="p-1 hover:text-cyan-400 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={14} className="text-cyan-400" /> : <Play size={14} />}
          </button>
          <button
            onClick={stepForward}
            className="p-1 hover:text-cyan-400 transition-colors"
            title="Step Forward (+1 hr)"
          >
            <SkipForward size={14} />
          </button>
          <button
            onClick={resetSimulation}
            className="p-1 hover:text-cyan-400 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw size={14} />
          </button>

          <div className="w-px h-3 bg-white/20 mx-1" />

          {/* Speed */}
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-transparent text-[11px] text-cyan-300 outline-none cursor-pointer"
          >
            <option value="0.5" className="bg-[#0a1428]">0.5x</option>
            <option value="1" className="bg-[#0a1428]">1x</option>
            <option value="2" className="bg-[#0a1428]">2x</option>
            <option value="5" className="bg-[#0a1428]">5x</option>
          </select>
        </div>
      </div>
    </header>
  );
};
