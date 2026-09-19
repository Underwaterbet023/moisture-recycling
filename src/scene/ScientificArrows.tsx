import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '@/simulation/simulationStore';

// ============================================================================
// 1. CURVED ARROW PRIMITIVE (Smooth Catmull-Rom tube with animated flow pulses)
// ============================================================================

interface CurvedArrowProps {
  points: [number, number, number][];
  color: string;
  radius?: number;
  headSize?: [number, number]; // [radius, height]
  flowSpeed?: number;
  particleCount?: number;
  opacity?: number;
  emissiveIntensity?: number;
}

function CurvedArrow({
  points,
  color,
  radius = 0.22,
  headSize = [0.65, 1.6],
  flowSpeed = 0.4,
  particleCount = 5,
  opacity = 0.88,
  emissiveIntensity = 0.5,
}: CurvedArrowProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { curve, tubeGeo, headPos, headRot } = useMemo(() => {
    const vPoints = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const c = new THREE.CatmullRomCurve3(vPoints);
    const tGeo = new THREE.TubeGeometry(c, 48, radius, 8, false);

    // Arrowhead position and orientation at curve end
    const endPoint = c.getPoint(1);
    const tangent = c.getTangent(1).normalize();

    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    const rot = new THREE.Euler().setFromQuaternion(quat);

    return {
      curve: c,
      tubeGeo: tGeo,
      headPos: endPoint.toArray() as [number, number, number],
      headRot: rot,
    };
  }, [points, radius]);

  // Animated pulse particles moving along arrow shaft
  const { posAttr } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const p = curve.getPoint(i / particleCount);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    }
    return {
      posAttr: new THREE.BufferAttribute(pos, 3),
    };
  }, [curve, particleCount]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * flowSpeed;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const u = (t + i / particleCount) % 1.0;
      const pt = curve.getPoint(u);
      arr[i * 3] = pt.x;
      arr[i * 3 + 1] = pt.y;
      arr[i * 3 + 2] = pt.z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* Arrow Shaft Tube */}
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {/* Arrow Head Cone */}
      <mesh position={headPos} rotation={headRot}>
        <coneGeometry args={[headSize[0], headSize[1], 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity + 0.2}
          roughness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Internal Flow Particles */}
      {particleCount > 0 && (
        <points ref={pointsRef}>
          <bufferGeometry>
            <primitive attach="attributes-position" object={posAttr} />
          </bufferGeometry>
          <pointsMaterial
            size={0.65}
            color="#ffffff"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

// ============================================================================
// 2. STRAIGHT VECTOR ARROW (Eulerian Wind Field — Thin, Directional, Straight)
// ============================================================================

interface StraightVectorArrowProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  radius?: number;
  headSize?: [number, number]; // [radius, height]
  flowSpeed?: number;
  particleCount?: number;
  opacity?: number;
}

function StraightVectorArrow({
  start,
  end,
  color,
  radius = 0.12,
  headSize = [0.45, 1.3],
  flowSpeed = 0.5,
  particleCount = 4,
  opacity = 0.8,
}: StraightVectorArrowProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { shaftGeo, shaftPos, shaftRot, headPos, headRot, dir, len } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const vDiff = new THREE.Vector3().subVectors(vEnd, vStart);
    const totalLen = vDiff.length();
    const vDir = vDiff.clone().normalize();

    const headLen = headSize[1];
    const shaftLen = Math.max(0.1, totalLen - headLen);

    // Shaft center
    const sPos = vStart.clone().add(vDir.clone().multiplyScalar(shaftLen * 0.5));
    // Head center
    const hPos = vStart.clone().add(vDir.clone().multiplyScalar(shaftLen + headLen * 0.5));

    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vDir);
    const rot = new THREE.Euler().setFromQuaternion(quat);

    const sGeo = new THREE.CylinderGeometry(radius, radius, shaftLen, 8);

    return {
      shaftGeo: sGeo,
      shaftPos: sPos.toArray() as [number, number, number],
      shaftRot: rot,
      headPos: hPos.toArray() as [number, number, number],
      headRot: rot,
      dir: vDir,
      len: totalLen,
    };
  }, [start, end, radius, headSize]);

  // Flow particles along the vector
  const { posAttr } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vStart = new THREE.Vector3(...start);
    for (let i = 0; i < particleCount; i++) {
      const p = vStart.clone().add(dir.clone().multiplyScalar((i / particleCount) * len));
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    }
    return {
      posAttr: new THREE.BufferAttribute(pos, 3),
    };
  }, [start, dir, len, particleCount]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * flowSpeed;
    const arr = posAttr.array as Float32Array;
    const vStart = new THREE.Vector3(...start);

    for (let i = 0; i < particleCount; i++) {
      const u = (t + i / particleCount) % 1.0;
      const pt = vStart.clone().add(dir.clone().multiplyScalar(u * len));
      arr[i * 3] = pt.x;
      arr[i * 3 + 1] = pt.y;
      arr[i * 3 + 2] = pt.z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* Straight Shaft */}
      <mesh position={shaftPos} rotation={shaftRot} geometry={shaftGeo}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.2}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {/* Aerodynamic Arrowhead */}
      <mesh position={headPos} rotation={headRot}>
        <coneGeometry args={[headSize[0], headSize[1], 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.15}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Speed Flow Dots */}
      {particleCount > 0 && (
        <points ref={pointsRef}>
          <bufferGeometry>
            <primitive attach="attributes-position" object={posAttr} />
          </bufferGeometry>
          <pointsMaterial
            size={0.45}
            color="#ffffff"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

// ============================================================================
// 3. VERTICAL FLUX ARROW (Rising Thermal / Evapotranspiration Flux ↑ ↑ ↑)
// ============================================================================

interface VerticalFluxArrowProps {
  base: [number, number, number];
  height: number;
  color: string;
  waveAmp?: number;
  radius?: number;
  flowSpeed?: number;
  particleCount?: number;
}

function VerticalFluxArrow({
  base,
  height,
  color,
  waveAmp = 0.4,
  radius = 0.16,
  flowSpeed = 0.42,
  particleCount = 4,
}: VerticalFluxArrowProps) {
  // Gentle organic sinusoidal wavy path rising upward
  const points = useMemo<[number, number, number][]>(() => {
    const [x, y, z] = base;
    return [
      [x, y, z],
      [x + waveAmp * 0.8, y + height * 0.35, z + waveAmp * 0.4],
      [x - waveAmp * 0.6, y + height * 0.7, z - waveAmp * 0.3],
      [x, y + height, z],
    ];
  }, [base, height, waveAmp]);

  return (
    <CurvedArrow
      points={points}
      color={color}
      radius={radius}
      headSize={[0.55, 1.4]}
      flowSpeed={flowSpeed}
      particleCount={particleCount}
      opacity={0.85}
      emissiveIntensity={0.5}
    />
  );
}

// ============================================================================
// 4. PRECIPITATION DOWNWARD ARROW (Cloud-to-Ground Watershed Rain Flux ↓ ↓ ↓)
// ============================================================================

interface PrecipitationArrowProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  radius?: number;
  flowSpeed?: number;
  particleCount?: number;
}

function PrecipitationArrow({
  start,
  end,
  color = '#818cf8', // Rain violet/blue
  radius = 0.22,
  flowSpeed = 0.55,
  particleCount = 5,
}: PrecipitationArrowProps) {
  const points = useMemo<[number, number, number][]>(() => {
    const midX = (start[0] + end[0]) * 0.5 + 0.3;
    const midY = (start[1] + end[1]) * 0.5;
    const midZ = (start[2] + end[2]) * 0.5;
    return [start, [midX, midY, midZ], end];
  }, [start, end]);

  return (
    <CurvedArrow
      points={points}
      color={color}
      radius={radius}
      headSize={[0.7, 1.7]}
      flowSpeed={flowSpeed}
      particleCount={particleCount}
      opacity={0.92}
      emissiveIntensity={0.55}
    />
  );
}

// ============================================================================
// 5. MASTER SCIENTIFIC ARROW SYSTEM (UTrack Moisture Model V2 Hierarchy)
// ============================================================================

export function ScientificArrows() {
  const { scientificOverlay, layers } = useSimulationStore();

  // Show if scientific overlay is active, or if windVectors/sceneLabels are enabled
  if (!scientificOverlay && !layers.windVectors && !layers.sceneLabels) {
    return null;
  }

  return (
    <group name="scientific-process-arrows-utrack-v2">
      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1: MOISTURE SOURCE REGION UPWARD ET FLUX
          (Replaces the giant thick yellow roller-coaster arc with 3 slender,
           elegant upward golden arrows rising from the source perimeter)
          ───────────────────────────────────────────────────────────────── */}
      <CurvedArrow
        points={[
          [-46, 2.5, 24],
          [-44, 13, 20],
          [-41, 23, 17],
        ]}
        color="#fbbf24" // Bright golden amber
        radius={0.20}
        headSize={[0.6, 1.5]}
        flowSpeed={0.38}
        particleCount={4}
        opacity={0.9}
        emissiveIntensity={0.6}
      />
      <CurvedArrow
        points={[
          [-40, 2.8, 18],
          [-39, 14, 16],
          [-38, 25, 14],
        ]}
        color="#f59e0b" // Rich amber
        radius={0.22}
        headSize={[0.65, 1.6]}
        flowSpeed={0.4}
        particleCount={5}
        opacity={0.92}
        emissiveIntensity={0.65}
      />
      <CurvedArrow
        points={[
          [-34, 3.2, 12],
          [-35, 14, 13],
          [-36, 24, 13],
        ]}
        color="#fbbf24"
        radius={0.19}
        headSize={[0.58, 1.5]}
        flowSpeed={0.36}
        particleCount={4}
        opacity={0.9}
        emissiveIntensity={0.6}
      />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2: DOMINANT HORIZONTAL ATMOSPHERIC TRANSPORT ARROW
          (The prominent, continuous atmospheric highway:
           Moisture Source Region -> Lagrangian P1-P4 -> Cloud -> Sink)
          ───────────────────────────────────────────────────────────────── */}
      <CurvedArrow
        points={[
          [-34, 27, 13],
          [-16, 31, 2],
          [4, 33, -10],
          [20, 33, -20],
          [34, 31, -26],
        ]}
        color="#00f0ff" // High-visibility electric cyan
        radius={0.32}   // Commanding, prominent shaft
        headSize={[0.95, 2.3]}
        flowSpeed={0.45}
        particleCount={9}
        opacity={0.95}
        emissiveIntensity={0.7}
      />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 3: EULERIAN WIND FIELD (Straight Directional Cyan Arrows)
          (Distinct visual language: thin, straight, showing wind vector U)
          ───────────────────────────────────────────────────────────────── */}
      <StraightVectorArrow
        start={[-46, 42, 0]}
        end={[24, 42, -22]}
        color="#38bdf8"
        radius={0.12}
        headSize={[0.45, 1.3]}
        flowSpeed={0.52}
        particleCount={5}
        opacity={0.78}
      />
      <StraightVectorArrow
        start={[-32, 46, 18]}
        end={[36, 46, -6]}
        color="#38bdf8"
        radius={0.12}
        headSize={[0.45, 1.3]}
        flowSpeed={0.5}
        particleCount={5}
        opacity={0.75}
      />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 4: VERTICAL SURFACE SOURCE FLUX ARROWS (↑ ↑ ↑)
          (Multiple rising arrows per zone representing continuous flux fields)
          ───────────────────────────────────────────────────────────────── */}

      {/* 4A. Ocean Evaporation (3 vertical rising arrows from sea surface) */}
      <VerticalFluxArrow base={[-70, 0.6, 25]} height={17} color="#38bdf8" waveAmp={0.5} />
      <VerticalFluxArrow base={[-60, 0.6, 6]} height={18} color="#38bdf8" waveAmp={0.6} />
      <VerticalFluxArrow base={[-52, 0.6, -16]} height={17} color="#38bdf8" waveAmp={0.5} />

      {/* 4B. River Evaporation (2 vertical rising arrows from river channel) */}
      <VerticalFluxArrow base={[-11, 1.8, 22]} height={15} color="#60a5fa" waveAmp={0.4} />
      <VerticalFluxArrow base={[-5, 2.2, -6]} height={15} color="#60a5fa" waveAmp={0.4} />

      {/* 4C. Forest Transpiration (3 vertical rising arrows from tree canopy) */}
      <VerticalFluxArrow base={[-1, 5.0, -36]} height={16} color="#34d399" waveAmp={0.45} />
      <VerticalFluxArrow base={[7, 7.5, -40]} height={16} color="#34d399" waveAmp={0.5} />
      <VerticalFluxArrow base={[15, 9.0, -32]} height={15} color="#34d399" waveAmp={0.45} />

      {/* 4D. Crops Evapotranspiration (3 vertical rising arrows from farmland) */}
      <VerticalFluxArrow base={[38, 2.5, 20]} height={16} color="#a3e635" waveAmp={0.5} />
      <VerticalFluxArrow base={[48, 2.6, 32]} height={16} color="#a3e635" waveAmp={0.55} />
      <VerticalFluxArrow base={[58, 2.8, 14]} height={16} color="#a3e635" waveAmp={0.5} />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 5: STRONG DOWNWARD PRECIPITATION ARROWS (↓ ↓ ↓)
          (From cloud base directly into land / sink watershed basin)
          ───────────────────────────────────────────────────────────────── */}
      <PrecipitationArrow
        start={[26, 24, -36]}
        end={[29, 6.0, -33]}
        color="#818cf8"
        radius={0.22}
        flowSpeed={0.55}
        particleCount={5}
      />
      <PrecipitationArrow
        start={[34, 25, -31]}
        end={[37, 5.0, -28]}
        color="#a855f7" // Vibrant purple
        radius={0.24}
        flowSpeed={0.58}
        particleCount={6}
      />
      <PrecipitationArrow
        start={[42, 24, -26]}
        end={[44, 5.5, -23]}
        color="#818cf8"
        radius={0.22}
        flowSpeed={0.55}
        particleCount={5}
      />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 6: CLOUD CONDENSATION INFLOW
          (Moisture entering the cloud condensation zone)
          ───────────────────────────────────────────────────────────────── */}
      <CurvedArrow
        points={[
          [18, 33, -20],
          [24, 32, -26],
        ]}
        color="#93c5fd"
        radius={0.16}
        headSize={[0.5, 1.2]}
        flowSpeed={0.32}
        particleCount={3}
        opacity={0.8}
      />
      <CurvedArrow
        points={[
          [34, 31, -25],
          [30, 30, -30],
        ]}
        color="#93c5fd"
        radius={0.16}
        headSize={[0.5, 1.2]}
        flowSpeed={0.32}
        particleCount={3}
        opacity={0.8}
      />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 7: HYDROLOGICAL LOOP CONNECTION (Mountain Runoff -> River -> Ocean)
          (Visually connects snowmelt to river to ocean closing the cycle)
          ───────────────────────────────────────────────────────────────── */}

      {/* 7A. Alpine Snowmelt Runoff (High mountain ridge descending through gorge) */}
      <CurvedArrow
        points={[
          [42, 36, -130],
          [28, 23, -98],
          [18, 13, -72],
        ]}
        color="#38bdf8"
        radius={0.24}
        headSize={[0.75, 1.8]}
        flowSpeed={0.46}
        particleCount={5}
        opacity={0.9}
      />

      {/* 7B. River Gorge & Valley Streamflow (Waterfall gorge connecting to main river) */}
      <CurvedArrow
        points={[
          [14, 10, -58],
          [-2, 4.0, -15],
          [-8, 2.2, 22],
        ]}
        color="#38bdf8"
        radius={0.24}
        headSize={[0.75, 1.8]}
        flowSpeed={0.44}
        particleCount={5}
        opacity={0.88}
      />

      {/* 7C. River Discharge (River mouth into coastal ocean) */}
      <CurvedArrow
        points={[
          [-16, 1.8, 48],
          [-28, 1.2, 75],
          [-52, 0.4, 82],
        ]}
        color="#3b82f6"
        radius={0.26}
        headSize={[0.8, 1.8]}
        flowSpeed={0.42}
        particleCount={5}
        opacity={0.9}
      />
    </group>
  );
}
