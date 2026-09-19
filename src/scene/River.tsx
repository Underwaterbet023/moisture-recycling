import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  TERRAIN,
  mainRiverPath,
  stream1Path,
  stream2Path,
  stream3Path,
  stream4Path,
  stream5Path,
  stream6Path,
  tributary1Path,
  tributary2Path,
  tributary3Path,
  type SplinePoint,
} from '@/scene/terrainConfig';
import { useSimulationStore } from '@/simulation/simulationStore';
import { riverWaterVertexShader } from '@/scene/shaders/RiverWaterVertex';
import { riverWaterFragmentShader } from '@/scene/shaders/RiverWaterFragment';
import {
  waterfallVertexShader,
  waterfallFragmentShader,
  tarnPoolVertexShader,
  tarnPoolFragmentShader,
} from '@/scene/shaders/WaterfallShader';

// ── Spline River Mesh Generator (5 Cross-Section Vertices with Depth Channel) ─
function createSplineRiverGeometry(
  pathFn: (t: number) => SplinePoint,
  segments: number,
  uvLengthMultiplier = 1.0
): THREE.BufferGeometry {
  const crossPoints = 9;
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const flowDirs: number[] = [];
  const slopes: number[] = [];
  const depths: number[] = [];
  const indices: number[] = [];

  const points: SplinePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push(pathFn(i / segments));
  }

  // Cumulative arc lengths along spline
  const arcLengths: number[] = [0];
  for (let i = 1; i <= segments; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y, curr.z - prev.z);
    arcLengths.push(arcLengths[i - 1] + dist);
  }

  // 9 cross-section vertices for smooth parabolic riverbed channel
  const crossFactors = [-1.0, -0.75, -0.5, -0.25, 0.0, 0.25, 0.5, 0.75, 1.0];
  const crossDepths  = [ 0.0,  0.35,  0.68,  0.90, 1.0, 0.90, 0.68,  0.35, 0.0];
  const yOffsets     = [ 0.0, -0.012, -0.025, -0.038, -0.045, -0.038, -0.025, -0.012, 0.0];

  for (let i = 0; i <= segments; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(segments, i + 1)];

    // Tangent in 3D
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tz = next.z - prev.z;

    const len2D = Math.hypot(tx, tz) || 1;
    const flowX = tx / len2D;
    const flowZ = tz / len2D;

    // Perpendicular bank vector in XZ plane
    const bankX = -flowZ;
    const bankZ = flowX;

    const localSlope = Math.abs(ty) / len2D;
    const halfW = p.w * 0.5;
    const vCoord = arcLengths[i] * 0.45 * uvLengthMultiplier;

    for (let c = 0; c < crossPoints; c++) {
      const f = crossFactors[c];
      const vx = p.x + bankX * (halfW * f);
      const vy = p.y + 0.16 + yOffsets[c];
      const vz = p.z + bankZ * (halfW * f);

      vertices.push(vx, vy, vz);
      normals.push(-bankX * f * 0.08, 1.0, -bankZ * f * 0.08);

      const uCoord = (f + 1.0) * 0.5;
      uvs.push(uCoord, vCoord);

      flowDirs.push(flowX, flowZ);
      slopes.push(localSlope);
      depths.push(crossDepths[c]);
    }

    if (i < segments) {
      const row = i * crossPoints;
      const nextRow = (i + 1) * crossPoints;
      for (let c = 0; c < crossPoints - 1; c++) {
        const a = row + c;
        const b = nextRow + c;
        const c1 = nextRow + c + 1;
        const d = row + c + 1;
        // CCW winding order so normals point upward (+Y)
        indices.push(a, c1, b);
        indices.push(a, d, c1);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aFlowDir', new THREE.Float32BufferAttribute(flowDirs, 2));
  geo.setAttribute('aSlope', new THREE.Float32BufferAttribute(slopes, 1));
  geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
  geo.setIndex(indices);
  return geo;
}

// ── Mountain Glacier & Snowmelt Headwater Sources ────────────────────────────
// Visually marks the exact locations where water emerges from alpine snowpack,
// glaciers, and mountain springs with crystalline tarn pools, ice tongues, and springs.
interface TarnSourceConfig {
  name: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  iceShelfHeight: number;
}

const GLACIER_SOURCES: TarnSourceConfig[] = [
  { name: 'Northeast Summit Glacier Tarn', x: 72.0, y: 38.0, z: -142.0, radius: 4.8, iceShelfHeight: 4.5 },
  { name: 'North Summit Glacial Torrent',  x: 34.0, y: 40.0, z: -148.0, radius: 4.4, iceShelfHeight: 5.0 },
  { name: 'High Crest Snowmelt Pool',      x: 8.0,  y: 35.0, z: -138.0, radius: 3.8, iceShelfHeight: 4.0 },
  { name: 'Granite Col Alpine Springs',    x: -22.0, y: 29.0, z: -120.0, radius: 3.6, iceShelfHeight: 3.5 },
  { name: 'East Pine Brook Headwater Tarn', x: 108.0, y: 31.0, z: -112.0, radius: 4.2, iceShelfHeight: 3.8 },
  { name: 'West Foothills Spring Pool',     x: -16.0, y: 17.0, z: -78.0,  radius: 3.2, iceShelfHeight: 2.5 },
];

function MountainGlacierSources({
  uniforms,
}: {
  uniforms: { uTime: { value: number }; uSunPosition: { value: THREE.Vector3 } };
}) {
  const poolGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(1.0, 32);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const iceShelfGeo = useMemo(() => {
    // Sculpted glacial ice tongue shelf overhang
    const geo = new THREE.CylinderGeometry(0.8, 1.2, 0.8, 16, 2, true, -Math.PI * 0.6, Math.PI * 1.2);
    return geo;
  }, []);

  const springHeadGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.5, 16, 12);
    geo.scale(1, 0.45, 1);
    return geo;
  }, []);

  return (
    <group name="mountain-glacier-sources">
      {GLACIER_SOURCES.map((source, idx) => (
        <group key={idx} position={[source.x, source.y, source.z]}>
          {/* 1. Glacial Cirque Tarn Pool (Crystalline Meltwater) */}
          <mesh geometry={poolGeo} scale={[source.radius, 1, source.radius * 0.9]} position={[0, 0.05, 0]}>
            <shaderMaterial
              vertexShader={tarnPoolVertexShader}
              fragmentShader={tarnPoolFragmentShader}
              uniforms={uniforms}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 2. Overhanging Glacial Ice Shelf / Snow Tongue feeding the tarn */}
          <mesh
            geometry={iceShelfGeo}
            position={[0, source.iceShelfHeight * 0.35, -source.radius * 0.7]}
            scale={[source.radius * 1.1, source.iceShelfHeight * 0.65, source.radius * 0.7]}
            rotation={[0, Math.PI, 0]}
          >
            <meshStandardMaterial
              color="#dbeafe"
              roughness={0.25}
              metalness={0.1}
              emissive="#38bdf8"
              emissiveIntensity={0.15}
            />
          </mesh>

          {/* 3. Bubbling Spring Fountainhead at Pool Center */}
          <mesh geometry={springHeadGeo} scale={source.radius * 0.35} position={[0, 0.12, 0]}>
            <meshBasicMaterial
              color="#e0f2fe"
              transparent
              opacity={0.82}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Dedicated River Surface Flow Particles ──────────────────────────────────
function RiverFlowParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 85;

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.3, 'rgba(224, 242, 254, 0.55)');
      gradient.addColorStop(0.7, 'rgba(186, 230, 253, 0.15)');
      gradient.addColorStop(1.0, 'rgba(186, 230, 253, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Particle simulation state: 70% on main river, 30% on alpine streams & tributaries
  const particleState = useMemo(() => {
    const states: { splineIdx: number; t: number; speed: number; lateral: number }[] = [];
    for (let i = 0; i < count; i++) {
      // 70% trace the main river, 30% cascade down mountain headwaters
      const splineIdx = Math.random() < 0.70 ? 9 : Math.floor(Math.random() * 9);
      states.push({
        splineIdx,
        t: Math.random(),
        speed: 0.12 + Math.random() * 0.14, // Natural downstream flow velocity
        lateral: (Math.random() - 0.5) * 0.65,
      });
    }
    return states;
  }, [count]);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [count]);

  const splines = useMemo(
    () => [
      stream1Path,
      stream2Path,
      stream3Path,
      stream4Path,
      stream5Path,
      stream6Path,
      tributary1Path,
      tributary2Path,
      tributary3Path,
      mainRiverPath,
    ],
    []
  );

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const state = particleState[i];
      // Faster downstream progression on steeper mountain chutes
      const speedMult = state.splineIdx < 6 ? 2.0 : state.splineIdx < 9 ? 1.4 : 1.1;
      state.t += delta * state.speed * speedMult;
      if (state.t > 1.0) {
        state.t = 0.0;
        state.splineIdx = Math.random() < 0.70 ? 9 : Math.floor(Math.random() * 9);
        state.lateral = (Math.random() - 0.5) * 0.65;
      }

      const fn = splines[state.splineIdx];
      const p = fn(state.t);
      const nextP = fn(Math.min(1.0, state.t + 0.02));
      const dx = nextP.x - p.x;
      const dz = nextP.z - p.z;
      const len = Math.hypot(dx, dz) || 1;
      const bankX = -dz / len;
      const bankZ = dx / len;

      // Position particle on the flowing water surface (above water mesh)
      posArray[i * 3]     = p.x + bankX * (p.w * 0.45 * state.lateral);
      posArray[i * 3 + 1] = p.y + 0.16;
      posArray[i * 3 + 2] = p.z + bankZ * (p.w * 0.45 * state.lateral);
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        map={particleTexture}
        size={0.72}
        color="#e0f2fe"
        transparent
        opacity={0.55}
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Riverbed Boulders & Rocks with Foam Wakes ────────────────────────────────
function RiverBoulders() {
  const rockLocations = useMemo(
    () => [
      // Alpine stream rocks
      { x: 62.0, y: 33.5, z: -130.0, s: 0.9, r: 0.4 },
      { x: 56.5, y: 29.2, z: -120.0, s: 0.8, r: 1.2 },
      { x: 37.0, y: 35.8, z: -135.0, s: 0.85, r: 2.1 },
      { x: 41.5, y: 30.5, z: -122.0, s: 0.75, r: 0.8 },
      { x: 12.0, y: 31.2, z: -125.0, s: 0.8, r: 1.5 },
      { x: 15.5, y: 26.5, z: -114.0, s: 0.7, r: 2.7 },
      { x: -14.0, y: 25.0, z: -111.0, s: 0.85, r: 0.3 },
      { x: -6.0, y: 21.2, z: -102.0, s: 0.75, r: 1.8 },
      // Mountain canyon gorge boulders
      { x: 27.2, y: 19.3, z: -86.0, s: 1.2, r: 0.9 },
      { x: 25.0, y: 18.2, z: -82.0, s: 1.1, r: 2.3 },
      // Plunge pool & lower gorge boulders
      { x: 25.4, y: 12.5, z: -72.0, s: 1.3, r: 1.4 },
      { x: 22.0, y: 11.2, z: -66.0, s: 1.0, r: 0.6 },
      // Foothill ripples boulders
      { x: 18.5, y: 8.8, z: -48.0, s: 0.95, r: 2.0 },
      { x: 15.0, y: 7.2, z: -38.0, s: 0.85, r: 1.1 },
    ],
    []
  );

  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.8, 1), []);
  const foamGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(0.8, 1.5, 16);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  return (
    <group name="river-boulders">
      {rockLocations.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]} rotation={[0, b.r, 0]} scale={b.s}>
          {/* Granitic River Boulder */}
          <mesh geometry={rockGeo} castShadow receiveShadow position={[0, -0.1, 0]}>
            <meshStandardMaterial color="#44403c" roughness={0.92} metalness={0.05} />
          </mesh>
          {/* Downstream Foam Wake */}
          <mesh geometry={foamGeo} position={[0, 0.08, 0.4]}>
            <meshBasicMaterial
              color="#f0f9ff"
              transparent
              opacity={0.48}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Mountain Gorge Waterfall & Plunge Pool ──────────────────────────────────
function Waterfall({ uniforms }: { uniforms: { uTime: { value: number }; uSunPosition: { value: THREE.Vector3 } } }) {
  // Cascading water curtain connecting top lip (z=-80, y=17.5) to pool (z=-74, y=12.5)
  const cascadeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(3.8, 7.2, 28, 28);
    geo.rotateX(-Math.PI * 0.38); // Steep downward cascade angle
    return geo;
  }, []);

  // Expanding circular ripples in the plunge pool
  const poolRipplesGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(0.6, 5.2, 32);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Spray mist particles rising from the plunge pool
  const mistPointsRef = useRef<THREE.Points>(null);
  const mistTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.3, 'rgba(224, 242, 254, 0.4)');
      gradient.addColorStop(0.7, 'rgba(186, 230, 253, 0.1)');
      gradient.addColorStop(1.0, 'rgba(186, 230, 253, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const mistGeo = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 4.0;
      pos[i * 3 + 1] = Math.random() * 3.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!mistPointsRef.current) return;
    const posAttr = mistGeo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < 60; i++) {
      arr[i * 3 + 1] += delta * 1.2; // Rise vertically
      if (arr[i * 3 + 1] > 3.8) {
        arr[i * 3 + 1] = 0.2;
        arr[i * 3]     = (Math.random() - 0.5) * 4.0;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group name="waterfall-system" position={[26.0, 15.0, -77.0]}>
      {/* Plunging Waterfall Curtain */}
      <mesh geometry={cascadeGeo}>
        <shaderMaterial
          vertexShader={waterfallVertexShader}
          fragmentShader={waterfallFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Plunge Pool at base of falls */}
      <mesh geometry={poolRipplesGeo} position={[0, -2.4, 3.0]}>
        <meshBasicMaterial
          color="#bae6fd"
          transparent
          opacity={0.52}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rising Waterfall Spray Mist */}
      <points ref={mistPointsRef} geometry={mistGeo} position={[0, -2.2, 3.0]}>
        <pointsMaterial
          map={mistTexture}
          size={0.65}
          color="#e0f2fe"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ── Master River Hydrological Rendering Component ───────────────────────────
export function River() {
  const { layers, timeOfDay } = useSimulationStore();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunPosition: { value: new THREE.Vector3(60, 110, 40) },
    }),
    []
  );

  // 1. Main River Mesh (Origin z = -90 in mountain canyon to Estuary z = 82)
  const mainRiverGeometry = useMemo(() => createSplineRiverGeometry(mainRiverPath, 240, 1.0), []);

  // 2. 3 Major Tributaries
  const trib1Geometry = useMemo(() => createSplineRiverGeometry(tributary1Path, 60, 1.1), []);
  const trib2Geometry = useMemo(() => createSplineRiverGeometry(tributary2Path, 55, 1.1), []);
  const trib3Geometry = useMemo(() => createSplineRiverGeometry(tributary3Path, 65, 1.1), []);

  // 3. 6 Mountain Headwater Streams
  const stream1Geo = useMemo(() => createSplineRiverGeometry(stream1Path, 45, 1.3), []);
  const stream2Geo = useMemo(() => createSplineRiverGeometry(stream2Path, 45, 1.3), []);
  const stream3Geo = useMemo(() => createSplineRiverGeometry(stream3Path, 45, 1.3), []);
  const stream4Geo = useMemo(() => createSplineRiverGeometry(stream4Path, 40, 1.3), []);
  const stream5Geo = useMemo(() => createSplineRiverGeometry(stream5Path, 45, 1.3), []);
  const stream6Geo = useMemo(() => createSplineRiverGeometry(stream6Path, 45, 1.2), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta * 1.5;
    if (timeOfDay === 'morning') uniforms.uSunPosition.value.set(120, 35, -80);
    else if (timeOfDay === 'evening') uniforms.uSunPosition.value.set(-120, 25, -60);
    else uniforms.uSunPosition.value.set(60, 110, 40);
  });

  if (!layers.terrainLandUse) return null;

  return (
    <group name="hydrological-river-system">
      {/* ── Mountain Glacier & Snowmelt Headwater Tarn Sources ────────── */}
      <MountainGlacierSources uniforms={uniforms} />

      {/* ── Main River Channel ─────────────────────────────────────── */}
      <mesh geometry={mainRiverGeometry} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 3 Major Valley Tributaries ────────────────────────────── */}
      <mesh geometry={trib1Geometry} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={trib2Geometry} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={trib3Geometry} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 6 Mountain Headwater Streams ──────────────────────────── */}
      <mesh geometry={stream1Geo} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={stream2Geo} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={stream3Geo} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={stream4Geo} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={stream5Geo} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={stream6Geo} receiveShadow>
        <shaderMaterial
          vertexShader={riverWaterVertexShader}
          fragmentShader={riverWaterFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Mountain Waterfall & Plunge Pool ──────────────────────── */}
      <Waterfall uniforms={uniforms} />

      {/* ── Riverbed Boulders & Downstream Foam Wakes ─────────────── */}
      <RiverBoulders />

      {/* ── Dedicated River Surface Flow Particles ────────────────── */}
      <RiverFlowParticles />
    </group>
  );
}

