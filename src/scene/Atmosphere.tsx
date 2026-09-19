import React from 'react';
import { useSimulationStore } from '@/simulation/simulationStore';

export function Atmosphere({ children }: { children?: React.ReactNode }) {
  // Simple container for atmospheric elements
  return (
    <group name="atmosphere">
      {children}
    </group>
  );
}
