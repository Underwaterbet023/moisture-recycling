import { useSimulationStore } from '@/simulation/simulationStore';
import SourceContributionChart from './SourceContributionChart';
import TimeSeriesChart from './TimeSeriesChart';
import TrajectoryMiniMap from './TrajectoryMiniMap';

export function AnalyticsPanel() {
  const activePage = useSimulationStore((state) => state.activePage);
  const precipitationRate = useSimulationStore((state) => state.precipitationRate);
  const etRate = useSimulationStore((state) => state.etRate);

  if (activePage !== 'simulation' && activePage !== 'lagrangian' && activePage !== 'eulerian') {
    return null;
  }

  return (
    <div className="w-full h-36 flex gap-2 overflow-x-auto custom-scrollbar">
      {/* Card 1: Source Contribution */}
      <div className="flex-1 min-w-[200px] glass-panel p-2 flex flex-col justify-between">
        <h3 className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Source Contribution</h3>
        <div className="flex-1 relative">
          <SourceContributionChart />
        </div>
      </div>

      {/* Card 2: Moisture Transport */}
      <div className="flex-1 min-w-[180px] glass-panel p-2 flex flex-col justify-between">
        <h3 className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Transport & Flux</h3>
        <div className="flex-1 relative flex flex-col items-center justify-center border border-cyan-500/20 rounded bg-black/30 p-2 text-center">
          <span className="text-[10px] text-cyan-300">Vertically Integrated Moisture Flux</span>
          <span className="text-lg font-bold font-mono text-cyan-100 mt-1">248.5</span>
          <span className="text-[9px] text-gray-400">kg · m⁻¹ · s⁻¹</span>
        </div>
      </div>

      {/* Card 3: Rates (Precip & ET) */}
      <div className="flex-1 min-w-[170px] glass-panel p-2 flex flex-col justify-between">
        <h3 className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Surface Fluxes</h3>
        <div className="flex-1 relative flex items-center justify-around border border-cyan-500/20 rounded bg-black/30 p-2">
          <div className="text-center">
            <div className="text-sm font-bold text-white font-mono">{precipitationRate.toFixed(1)}</div>
            <div className="text-[9px] text-cyan-400">Precip (mm/d)</div>
          </div>
          <div className="w-px h-8 bg-cyan-500/20" />
          <div className="text-center">
            <div className="text-sm font-bold text-emerald-400 font-mono">{etRate.toFixed(1)}</div>
            <div className="text-[9px] text-emerald-300">ET (mm/d)</div>
          </div>
        </div>
      </div>

      {/* Card 4: Time Series */}
      <div className="flex-[2] min-w-[280px] glass-panel p-2 flex flex-col justify-between">
        <h3 className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Atmospheric Time Series</h3>
        <div className="flex-1 relative">
          <TimeSeriesChart />
        </div>
      </div>

      {/* Card 5: Trajectory */}
      <div className="flex-1 min-w-[180px] glass-panel p-2 flex flex-col justify-between">
        <h3 className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Moisture Parcel Path</h3>
        <div className="flex-1 relative">
          <TrajectoryMiniMap />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPanel;
