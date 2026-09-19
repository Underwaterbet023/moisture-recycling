import React from 'react';
import { useSimulationStore } from '@/simulation/simulationStore';
import { MapPin, Droplets, Info } from 'lucide-react';

export const ScientificInspector: React.FC = () => {
  const { selectedGridCell, selectedParticle } = useSimulationStore();

  const cell = selectedGridCell?.cell;
  const budget = selectedGridCell?.budget;
  const particle = selectedParticle?.particle;

  if (!selectedGridCell && !particle) {
    return null;
  }

  return (
    <div className="glass-panel pointer-events-auto w-full text-white rounded-xl border border-[rgba(0,180,255,0.2)] bg-[rgba(6,14,28,0.7)] backdrop-blur-md overflow-y-auto custom-scrollbar p-2 text-xs space-y-2 max-h-80 shadow-lg">
      {/* Grid Cell Inspection */}
      {selectedGridCell && cell && budget && (
        <div className="space-y-1.5">
          <h2 className="font-semibold text-cyan-300 border-b border-white/10 pb-1 flex items-center gap-1.5 text-xs">
            <MapPin size={13} className="text-cyan-400" /> Selected Grid Cell
          </h2>

          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400 font-sans">Coord:</span>
              <span>{selectedGridCell.latitude.toFixed(2)}°N, {selectedGridCell.longitude.toFixed(2)}°E</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400 font-sans">Pressure:</span>
              <span>{selectedGridCell.pressure} hPa</span>
            </div>

            <div className="h-px bg-white/10 my-0.5" />
            <div className="text-cyan-400 font-sans text-[9px] uppercase font-semibold">State Variables</div>

            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Sp. Humidity:</span>
              <span>{(cell.q * 1000).toFixed(2)} g/kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Zonal Wind:</span>
              <span>{cell.u.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Merid. Wind:</span>
              <span>{cell.v.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Vert. Vel.:</span>
              <span>{cell.omega.toFixed(4)} Pa/s</span>
            </div>

            <div className="h-px bg-white/10 my-0.5" />
            <div className="text-cyan-400 font-sans text-[9px] uppercase font-semibold">Moisture Budget</div>

            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">∂q/∂x:</span>
              <span>{budget.dq_dx.toExponential(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">∂q/∂y:</span>
              <span>{budget.dq_dy.toExponential(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">∂q/∂p:</span>
              <span>{budget.dq_dp.toExponential(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Horiz. Adv.:</span>
              <span>{budget.horizontalAdvection.toExponential(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Vert. Adv.:</span>
              <span>{budget.verticalAdvection.toExponential(2)}</span>
            </div>
            <div className="flex justify-between text-cyan-200">
              <span className="text-gray-400 font-sans">Flux:</span>
              <span>{budget.moistureFlux.toExponential(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Particle Inspection */}
      {particle && (
        <div className="space-y-2 border-t border-white/10 pt-2">
          <h2 className="font-semibold text-cyan-300 border-b border-white/10 pb-1 flex items-center gap-1.5 text-xs">
            <Droplets size={13} className="text-cyan-400" /> Inspected Moisture Parcel
          </h2>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Parcel ID:</span>
              <span>#{particle.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Source:</span>
              <span className="capitalize text-cyan-300">{particle.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Coord:</span>
              <span>{particle.latitude.toFixed(2)}°N, {particle.longitude.toFixed(2)}°E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Pressure:</span>
              <span>{particle.pressure.toFixed(1)} hPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">q:</span>
              <span>{(particle.q * 1000).toFixed(2)} g/kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Mass:</span>
              <span>{particle.mass.toExponential(2)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">State:</span>
              <span className="capitalize text-emerald-400">{particle.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-sans">Distance:</span>
              <span>{particle.distanceTraveled.toFixed(1)} km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
