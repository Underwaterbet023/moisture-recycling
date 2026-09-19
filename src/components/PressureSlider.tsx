import React from 'react';
import { useSimulationStore } from '@/simulation/simulationStore';
import { PRESSURE_LEVELS, PressureLevelValue } from '@/types/atmospheric';

export const PressureSlider: React.FC = () => {
  const { selectedPressure, setSelectedPressure } = useSimulationStore();

  return (
    <div
      className="glass-panel pointer-events-auto flex flex-col items-center py-2 px-1 rounded-full border border-[rgba(30,120,200,0.25)] bg-[rgba(10,20,40,0.75)] backdrop-blur-xl text-xs select-none shadow-lg ml-2"
      title="Vertical atmospheric coordinate shown using pressure levels."
    >
      <button
        onClick={() => setSelectedPressure('all')}
        className={`w-7 h-7 rounded-full flex items-center justify-center mb-3 transition-all text-[10px] font-semibold ${
          selectedPressure === 'all'
            ? 'bg-cyan-400 text-black font-bold shadow-[0_0_8px_#22d3ee]'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        All
      </button>

      <div className="relative flex flex-col items-center space-y-3">
        {/* Track line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-900/50 -z-10 left-1/2 -translate-x-1/2" />

        {[...PRESSURE_LEVELS].reverse().map((level: PressureLevelValue) => {
          const isSelected = selectedPressure === level;
          return (
            <button
              key={level}
              onClick={() => setSelectedPressure(level)}
              className={`w-8 h-6 flex items-center justify-center rounded text-[10px] font-mono transition-all z-10 ${
                isSelected
                  ? 'bg-cyan-400 text-black font-bold shadow-[0_0_8px_#22d3ee]'
                  : 'bg-black/60 text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/50'
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
};
