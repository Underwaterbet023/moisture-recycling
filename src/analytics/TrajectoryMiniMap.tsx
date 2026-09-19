import { useSimulationStore } from '@/simulation/simulationStore';

export default function TrajectoryMiniMap() {
  const selectedParticle = useSimulationStore((state) => state.selectedParticle);

  const particle = selectedParticle?.particle;

  return (
    <div className="w-full h-full relative bg-black/40 rounded border border-cyan-500/20 overflow-hidden flex items-center justify-center">
      {/* Compass rose */}
      <div className="absolute top-1 left-1 text-[9px] font-mono text-cyan-500/60 flex flex-col items-center leading-none">
        <span>N</span>
        <span className="text-[7px]">W + E</span>
        <span>S</span>
      </div>

      <svg className="w-full h-full p-2" viewBox="0 0 100 100">
        {/* Subtle grid */}
        <line x1="20" y1="0" x2="20" y2="100" stroke="rgba(0,212,255,0.05)" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,212,255,0.05)" />
        <line x1="80" y1="0" x2="80" y2="100" stroke="rgba(0,212,255,0.05)" />
        <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(0,212,255,0.05)" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,212,255,0.05)" />
        <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(0,212,255,0.05)" />

        {/* Demo Trajectory path */}
        <path
          d="M 20 80 Q 40 40 80 30"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />

        {/* Points */}
        <circle cx="20" cy="80" r="3" fill="#22c55e" />
        <circle cx="80" cy="30" r="3" fill="#ef4444" />
      </svg>

      <div className="absolute bottom-1 left-1 flex gap-2 text-[8px] bg-black/50 px-1 rounded">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Source
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> Sink
        </span>
      </div>

      {particle && (
        <div className="absolute top-1 right-1 text-[8px] bg-cyan-900/80 text-cyan-100 px-1 rounded">
          ID: {particle.id} ({particle.source})
        </div>
      )}
    </div>
  );
}
