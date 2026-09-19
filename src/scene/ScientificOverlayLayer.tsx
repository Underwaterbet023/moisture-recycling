import React from 'react';
import { ScientificArrows } from './ScientificArrows';
import { LagrangianParcelsP1P4 } from './LagrangianParcelsP1P4';
import { AtmosphericInputNotation } from './AtmosphericInputNotation';

export function ScientificOverlayLayer() {
  return (
    <group name="utrack-scientific-annotation-system">
      <ScientificArrows />
      <LagrangianParcelsP1P4 />
      <AtmosphericInputNotation />
    </group>
  );
}
