import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="pointer-events-none bg-[rgba(5,10,24,0.85)] border-t border-cyan-500/10 text-white flex items-center justify-between px-4 h-6 w-full fixed bottom-0 left-0 z-50 text-[10px] text-gray-500">
      <div className="font-semibold text-cyan-500/50">Moisture Recycling</div>
      <div>Atmospheric Science • Hydrology • Land–Atmosphere Interaction • Scientific Visualization</div>
      <div>Indian Institute of Technology Kharagpur</div>
    </footer>
  );
};
