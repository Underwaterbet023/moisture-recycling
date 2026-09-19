import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/simulation/simulationStore';
import { pressureToSceneY } from '@/simulation/physics';
import { X, Info } from 'lucide-react';

interface RepresentativeParcel {
  id: string;
  label: string;
  color: string;
  glowColor: string;
  localOffset: [number, number, number];
  source: string;
  humidity: string;
  velocity: string;
  trajectoryPoints: [number, number, number][];
}

export function LagrangianParcelsP1P4() {
  const { scientificOverlay, layers, selectedPressure } = useSimulationStore();
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  // Group base position in upper-left atmosphere above the moisture source region
  // Altitude adapts to selected isobaric surface (default 700 hPa -> y ~ 25)
  const baseY = typeof selectedPressure === 'number' ? pressureToSceneY(selectedPressure) : 25.5;
  const baseX = -38.0;
  const baseZ = 14.5;

  // 1. EXACT DETERMINISTIC POSITIONS FOR P1, P2, P3, P4 (UTrack Reference Diamond Cluster)
  //            P1
  //       P2        P3
  //            P4
  const parcels: RepresentativeParcel[] = useMemo(() => [
    {
      id: 'P1',
      label: 'P₁',
      color: '#38bdf8', // Cyan
      glowColor: '#0284c7',
      localOffset: [0, 2.8, -1.5], // Top
      source: 'Marine Evaporation (Ocean)',
      humidity: '0.0142 kg/kg',
      velocity: 'u: 8.4, v: 2.8, w: +0.03 m/s',
      trajectoryPoints: [
        [baseX, baseY + 2.8, baseZ - 1.5],
        [-18, baseY + 4.2, baseZ - 6],
        [2, baseY + 5.0, -12],
        [16, baseY + 4.2, -22],
        [28, baseY + 2.5, -28], // Cloud condensation zone
      ],
    },
    {
      id: 'P2',
      label: 'P₂',
      color: '#60a5fa', // Blue
      glowColor: '#2563eb',
      localOffset: [-3.2, 0.2, 1.8], // Left
      source: 'Riparian Flux (River)',
      humidity: '0.0118 kg/kg',
      velocity: 'u: 7.9, v: 3.1, w: +0.02 m/s',
      trajectoryPoints: [
        [baseX - 3.2, baseY + 0.2, baseZ + 1.8],
        [-20, baseY + 1.5, baseZ - 2],
        [-1, baseY + 2.4, -14],
        [14, baseY + 2.0, -24],
        [25, baseY + 1.0, -30], // Cloud condensation zone
      ],
    },
    {
      id: 'P3',
      label: 'P₃',
      color: '#34d399', // Emerald
      glowColor: '#059669',
      localOffset: [3.2, 0.5, -1.8], // Right
      source: 'Canopy Transpiration (Forest)',
      humidity: '0.0135 kg/kg',
      velocity: 'u: 8.8, v: 2.4, w: +0.04 m/s',
      trajectoryPoints: [
        [baseX + 3.2, baseY + 0.5, baseZ - 1.8],
        [-16, baseY + 2.5, baseZ - 8],
        [3, baseY + 3.4, -16],
        [18, baseY + 2.8, -22],
        [29, baseY + 1.8, -26], // Cloud condensation zone
      ],
    },
    {
      id: 'P4',
      label: 'P₄',
      color: '#a3e635', // Lime
      glowColor: '#65a30d',
      localOffset: [0, -2.4, 1.5], // Bottom
      source: 'Agro-Evapotranspiration (Crops)',
      humidity: '0.0125 kg/kg',
      velocity: 'u: 7.5, v: 3.4, w: +0.01 m/s',
      trajectoryPoints: [
        [baseX, baseY - 2.4, baseZ + 1.5],
        [-22, baseY - 0.8, baseZ + 2],
        [-3, baseY + 0.8, -10],
        [12, baseY + 1.2, -20],
        [24, baseY - 0.5, -28], // Cloud condensation zone
      ],
    },
  ], [baseX, baseY, baseZ]);

  // Trajectory Curves and Tube Geometries
  const trajectoryCurves = useMemo(() => {
    return parcels.map((p) => {
      const vPoints = p.trajectoryPoints.map((pt) => new THREE.Vector3(pt[0], pt[1], pt[2]));
      return new THREE.CatmullRomCurve3(vPoints);
    });
  }, [parcels]);

  const trajectoryGeos = useMemo(() => {
    return trajectoryCurves.map((c) => new THREE.TubeGeometry(c, 64, 0.14, 8, false));
  }, [trajectoryCurves]);

  // Animated moving trajectory tracers (moving dots s in [0, 1] along the paths)
  const tracerRefs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    parcels.forEach((_, idx) => {
      const mesh = tracerRefs[idx].current;
      if (!mesh) return;

      // Each tracer moves along its respective curve s in [0, 1]
      // P1-P4 themselves STAY COMPLETELY FIXED! Only tracers travel
      const speed = 0.08; // Deliberate, smooth, readable transit
      const phase = (time * speed + idx * 0.25) % 1.0;
      const pt = trajectoryCurves[idx].getPointAt(phase);
      mesh.position.copy(pt);
    });
  });

  // Only show when scientificOverlay is ON or sceneLabels is ON
  if (!scientificOverlay && !layers.sceneLabels) {
    return null;
  }

  const badgeStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    userSelect: 'none' as const,
    pointerEvents: 'auto' as const,
  };

  const selectedParcel = parcels.find((p) => p.id === selectedParcelId);

  return (
    <group name="representative-lagrangian-parcels-p1-p4">
      {/* ─────────────────────────────────────────────────────────────────
          1. MASTER "MOISTURE PARCELS" CALLOUT
          Positioned directly above the representative parcel cluster
          ───────────────────────────────────────────────────────────────── */}
      <group position={[baseX, baseY + 6.8, baseZ]}>
        <Html center style={badgeStyle}>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.2)] border border-red-500/70 text-red-300 font-bold text-xs tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>Moisture Parcels</span>
              <span className="text-[10px] text-red-200 font-normal">{"(P₁–P₄)"}</span>
            </div>
            {/* Leader line down into cluster */}
            <div className="w-px h-4 bg-gradient-to-b from-red-500/70 to-transparent" />
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          2. MATHEMATICAL GOVERNING EQUATIONS OVERLAY
          dx/dt = u, dy/dt = v, dz/dt = w
          ───────────────────────────────────────────────────────────────── */}
      <group position={[baseX - 1, baseY - 4.6, baseZ + 1]}>
        <Html center style={badgeStyle}>
          <div className="whitespace-nowrap flex flex-col items-center px-2.5 py-1 rounded bg-[rgba(8,16,32,0.88)] border border-cyan-500/40 backdrop-blur-md text-[10px] font-mono text-cyan-200 shadow-md">
            <div className="text-gray-300 text-[9px] font-sans font-semibold mb-0.5">Lagrangian Advection</div>
            <div>dx/dt = u, dy/dt = v, dz/dt = w</div>
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────────
          3. THE 4 STABLE REPRESENTATIVE PARCELS (P1, P2, P3, P4)
          Fixed spatial positions. Never move across the screen!
          ───────────────────────────────────────────────────────────────── */}
      {parcels.map((p, idx) => {
        const posX = baseX + p.localOffset[0];
        const posY = baseY + p.localOffset[1];
        const posZ = baseZ + p.localOffset[2];
        const isSelected = selectedParcelId === p.id;

        return (
          <group key={p.id} position={[posX, posY, posZ]}>
            {/* Luminous Parcel Sphere Marker */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                setSelectedParcelId(isSelected ? null : p.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[isSelected ? 0.95 : 0.75, 20, 20]} />
              <meshStandardMaterial
                color={p.color}
                emissive={p.color}
                emissiveIntensity={isSelected ? 1.6 : 1.1}
                roughness={0.1}
              />
            </mesh>

            {/* Glowing Halo */}
            <mesh>
              <sphereGeometry args={[isSelected ? 1.5 : 1.25, 16, 16]} />
              <meshBasicMaterial
                color={p.glowColor}
                transparent
                opacity={isSelected ? 0.45 : 0.25}
                wireframe
              />
            </mesh>

            {/* Clean Stable 3D Label: P₁, P₂, P₃, P₄ (NO intrusive source tags) */}
            <Html
              position={[0, 1.8, 0]}
              center
              style={badgeStyle}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedParcelId(isSelected ? null : p.id);
                }}
                className={`font-bold font-mono text-xs px-2 py-0.5 rounded border transition-all shadow-lg ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-[0_0_12px_#ffffff] scale-110'
                    : 'bg-[rgba(6,16,35,0.85)] border-cyan-400/60 text-cyan-200 hover:scale-105 hover:border-cyan-300'
                }`}
                title={`Click to inspect representative parcel ${p.id}`}
              >
                {p.label}
              </button>
            </Html>
          </group>
        );
      })}

      {/* ─────────────────────────────────────────────────────────────────
          4. CURVED 3D LAGRANGIAN TRAJECTORY LINES (From P1-P4 to Sink)
          ───────────────────────────────────────────────────────────────── */}
      {parcels.map((p, idx) => {
        const isSelected = selectedParcelId === p.id;
        const opacity = selectedParcelId ? (isSelected ? 0.9 : 0.15) : 0.45;
        const color = isSelected ? '#ffffff' : p.color;

        return (
          <group key={`traj-${p.id}`}>
            {/* Trajectory Tube */}
            <mesh geometry={trajectoryGeos[idx]}>
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.8 : 0.3}
                transparent
                opacity={opacity}
                depthWrite={false}
              />
            </mesh>

            {/* Moving Trajectory Tracer Dot (Travels along path from source to sink) */}
            <mesh ref={tracerRefs[idx]}>
              <sphereGeometry args={[0.45, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#ffffff' : p.color}
                emissive={isSelected ? '#ffffff' : p.color}
                emissiveIntensity={1.4}
              />
              <pointLight color={p.color} distance={4} intensity={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* ─────────────────────────────────────────────────────────────────
          5. SELECTED PARCEL DETAIL CARD (Only appears when clicked)
          ───────────────────────────────────────────────────────────────── */}
      {selectedParcel && (
        <group position={[baseX + 10, baseY + 4, baseZ]}>
          <Html center style={badgeStyle}>
            <div className="w-64 p-3 rounded-xl bg-[rgba(6,14,30,0.95)] border border-cyan-400/70 text-white backdrop-blur-xl shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono font-bold text-xs px-1.5 py-0.5 rounded text-black"
                    style={{ backgroundColor: selectedParcel.color }}
                  >
                    {selectedParcel.label}
                  </span>
                  <span className="font-semibold text-xs text-cyan-300">
                    Lagrangian Parcel
                  </span>
                </div>
                <button
                  onClick={() => setSelectedParcelId(null)}
                  className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Source:</span>
                  <span className="text-gray-200 font-medium">{selectedParcel.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Pressure Level:</span>
                  <span className="font-mono text-cyan-300">
                    {typeof selectedPressure === 'number' ? `${selectedPressure} hPa` : '700 hPa'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Specific Humidity (q):</span>
                  <span className="font-mono text-gray-200">{selectedParcel.humidity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Velocity (u, v, w):</span>
                  <span className="font-mono text-[10px] text-gray-300">{selectedParcel.velocity}</span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] text-gray-400 text-center italic">
                Lagrangian trajectory highlighted from source to sink.
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
