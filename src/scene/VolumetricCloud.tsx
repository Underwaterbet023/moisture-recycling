// ============================================================================
// Volumetric Cloud — Physically Motivated Atmospheric Cloud Formation System
// ============================================================================
// Real-time GPU ray-marched volumetric cloud rendering using 3D Worley &
// Simplex procedural noise, Beer-Lambert light extinction, internal self-shadowing,
// Henyey-Greenstein silver-lining forward scattering, and temporal wind morphing.

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '@/simulation/simulationStore';

// ── GLSL 3D Simplex & Worley Procedural Noise ──────────────────────────────
const cloudVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;

  void main() {
    vLocalPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const cloudFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;

  uniform vec3 uBoxMin;
  uniform vec3 uBoxMax;
  uniform vec3 uCameraPos;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uAmbientSkyColor;
  uniform vec3 uAmbientGroundColor;
  uniform float uTime;
  uniform float uCloudSpeed;
  uniform float uMoistureDensity;
  uniform int uMaxSteps;
  uniform float uStepScale;

  // ── Hash & Procedural 3D Noise Utilities ──
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float hash2D(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // 3D Value / Gradient Noise
  float noise3D(vec3 x) {
    vec3 p = floor(x);
    vec3 w = fract(x);
    vec3 u = w * w * (3.0 - 2.0 * w);

    float n000 = hash(p + vec3(0.0, 0.0, 0.0));
    float n100 = hash(p + vec3(1.0, 0.0, 0.0));
    float n010 = hash(p + vec3(0.0, 1.0, 0.0));
    float n110 = hash(p + vec3(1.0, 1.0, 0.0));
    float n001 = hash(p + vec3(0.0, 0.0, 1.0));
    float n101 = hash(p + vec3(1.0, 0.0, 1.0));
    float n011 = hash(p + vec3(0.0, 1.0, 1.0));
    float n111 = hash(p + vec3(1.0, 1.0, 1.0));

    float x00 = mix(n000, n100, u.x);
    float x10 = mix(n010, n110, u.x);
    float x01 = mix(n001, n101, u.x);
    float x11 = mix(n011, n111, u.x);

    float y0 = mix(x00, x10, u.y);
    float y1 = mix(x01, x11, u.y);

    return mix(y0, y1, u.z);
  }

  // Fast procedural billowy cumulus noise (eliminates expensive 27-cell Worley loops)
  float fastBillowNoise(vec3 p) {
    float n1 = noise3D(p);
    float b1 = 1.0 - abs(n1 * 2.0 - 1.0);
    float n2 = noise3D(p * 2.15 + vec3(1.7, 9.2, 3.4));
    float b2 = 1.0 - abs(n2 * 2.0 - 1.0);
    return b1 * 0.68 + b2 * 0.32;
  }

  // ── Ray-Box Intersection ──
  bool intersectBox(vec3 ro, vec3 rd, vec3 boxMin, vec3 boxMax, out float tNear, out float tFar) {
    vec3 invR = 1.0 / (rd + vec3(1e-6));
    vec3 tbot = invR * (boxMin - ro);
    vec3 ttop = invR * (boxMax - ro);
    vec3 tmin = min(ttop, tbot);
    vec3 tmax = max(ttop, tbot);
    vec2 t = max(tmin.xx, tmin.yz);
    tNear = max(0.0, max(t.x, t.y));
    t = min(tmax.xx, tmax.yz);
    tFar = min(t.x, t.y);
    return tNear <= tFar && tFar > 0.0;
  }

  // ── Cloud Density Function ρ_cloud(x, y, z, t) ──
  float sampleCloudDensity(vec3 pWorld) {
    // Normalize into local box coordinates [-1, 1]
    vec3 boxCenter = (uBoxMin + uBoxMax) * 0.5;
    vec3 boxExtent = (uBoxMax - uBoxMin) * 0.5;
    vec3 pNorm = (pWorld - boxCenter) / boxExtent;

    // Check bounds with soft boundary margin
    if (any(greaterThan(abs(pNorm), vec3(1.0)))) return 0.0;

    // 1. Asymmetric Macro Profile (Stratocumulus / Cumulus profile)
    float radial = length(pNorm.xz);
    if (radial >= 1.0) return 0.0;

    float bottomFade = smoothstep(-1.0, -0.4, pNorm.y);
    float topFade = smoothstep(1.0, 0.2, pNorm.y);
    float horizontalFade = smoothstep(1.0, 0.2, radial);

    float macroShape = bottomFade * topFade * horizontalFade;
    if (macroShape <= 0.01) return 0.0;

    // 2. Temporal wind advection + continuous procedural morphing
    vec3 windAdvect = vec3(uTime * uCloudSpeed * 0.35, 0.0, -uTime * uCloudSpeed * 0.12);
    vec3 morph = vec3(
      sin(uTime * 0.08) * 0.18,
      cos(uTime * 0.06) * 0.12,
      sin(uTime * 0.1) * 0.18
    );
    vec3 sampleCoord = (pWorld * 0.045) + windAdvect + morph;

    float combinedNoise = fastBillowNoise(sampleCoord * 1.6);
    float detailNoise = (noise3D(sampleCoord * 4.2) - 0.5) * 0.18;

    float threshold = 0.30 - (0.12 * macroShape);
    float density = smoothstep(threshold, threshold + 0.42, combinedNoise + detailNoise);

    density *= macroShape * uMoistureDensity;
    return density;
  }

  // ── Single-Probe Light Extinction & Self-Shadowing ──
  float sampleSunTransmittance(vec3 p, float currentDensity) {
    vec3 lightDir = normalize(uSunDirection);
    float lightSample = sampleCloudDensity(p + lightDir * 3.8);
    float opticalDepth = currentDensity * 1.6 + lightSample * 3.0;
    return exp(-opticalDepth * 2.2);
  }

  void main() {
    vec3 ro = uCameraPos;
    vec3 rd = normalize(vWorldPosition - uCameraPos);

    float tNear, tFar;
    if (!intersectBox(ro, rd, uBoxMin, uBoxMax, tNear, tFar)) {
      discard;
    }

    // Pixel jitter to eliminate raymarch slice banding
    float jitter = hash2D(gl_FragCoord.xy) * 0.85;
    float rayLength = tFar - tNear;
    int steps = uMaxSteps;
    float stepSize = (rayLength / float(steps)) * uStepScale;

    vec3 lightDir = normalize(uSunDirection);

    // Henyey-Greenstein phase function for forward scattering / silver-lining rim
    float cosTheta = dot(rd, lightDir);
    float g = 0.52; // Forward scattering asymmetry
    float hg = (1.0 - g * g) / (4.0 * 3.14159265 * pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5));
    // Silver lining intensity
    float forwardScatter = 0.75 + hg * 2.6;

    vec3 accumColor = vec3(0.0);
    float transmittance = 1.0;

    // March through volume
    float t = tNear + jitter * stepSize;
    for (int i = 0; i < 96; i++) {
      if (i >= steps || t >= tFar || transmittance < 0.015) break;

      vec3 p = ro + rd * t;
      float density = sampleCloudDensity(p);

      if (density > 0.002) {
        // Sample single-probe extinction toward sun for self-shadowing
        float sunTrans = sampleSunTransmittance(p, density);

        // Powder effect: cloud edges catch more scattered light than thick dense interiors
        float powder = 1.0 - exp(-density * 3.5);
        float sunExtinction = sunTrans * mix(0.42, 1.0, powder);

        // Vertical position inside cloud (normY: 0 at base, 1 at crest)
        float normY = clamp((p.y - uBoxMin.y) / (uBoxMax.y - uBoxMin.y), 0.0, 1.0);

        // Flat-ish base darkening where precipitation condenses
        float baseDarkening = mix(0.7, 1.0, smoothstep(0.0, 0.45, normY));

        // Sky ambient lighting (cool blue-white on top) to ground ambient (soft earth/haze at bottom)
        vec3 ambient = mix(uAmbientGroundColor, uAmbientSkyColor, normY * 0.8 + 0.2);

        // Direct sunlight with Beer-Lambert self-shadowing & forward scattering
        vec3 directSun = uSunColor * sunExtinction * forwardScatter * baseDarkening;

        // Shadowed underbelly: cool blue-gray tone
        vec3 coolShadow = vec3(0.46, 0.54, 0.66) * (1.0 - sunExtinction) * 0.5;

        // Local scattered light color
        vec3 lightEnergy = directSun + ambient + coolShadow;

        // Beer-Lambert step attenuation
        float alpha = 1.0 - exp(-density * stepSize * 0.48);

        // Natural cloud albedo: clean white on sunlit crests, cool blue-gray in shaded folds
        vec3 sunlitAlbedo = vec3(0.98, 0.98, 1.0);
        vec3 shadeAlbedo = vec3(0.72, 0.78, 0.88);
        vec3 cloudAlbedo = mix(shadeAlbedo, sunlitAlbedo, sunExtinction * normY);

        vec3 sampleColor = cloudAlbedo * lightEnergy;

        // Accumulate radiance
        accumColor += sampleColor * alpha * transmittance;
        transmittance *= (1.0 - alpha);
      }

      t += stepSize;
    }

    float finalAlpha = clamp(1.0 - transmittance, 0.0, 0.96);
    if (finalAlpha < 0.01) discard;

    gl_FragColor = vec4(accumColor, finalAlpha);
  }
`;

export interface VolumetricCloudProps {
  position?: [number, number, number];
  boxSize?: [number, number, number];
}

export function VolumetricCloud({
  position = [22, 38, -26],
  boxSize = [46, 22, 38],
}: VolumetricCloudProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const cloudQuality = useSimulationStore((s) => s.cloudQuality);
  const cloudSpeed = useSimulationStore((s) => s.cloudSpeed);
  const precipitationRate = useSimulationStore((s) => s.precipitationRate);
  const timeOfDay = useSimulationStore((s) => s.timeOfDay);

  // Determine ray-marching step count based on selected Cloud Quality tier
  const maxSteps = useMemo(() => {
    switch (cloudQuality) {
      case 'low':
        return 16;
      case 'medium':
        return 22;
      case 'ultra':
        return 34;
      case 'high':
      default:
        return 26;
    }
  }, [cloudQuality]);

  // Compute bounding box extents in world coordinates
  const { boxMin, boxMax } = useMemo(() => {
    const halfX = boxSize[0] * 0.5;
    const halfY = boxSize[1] * 0.5;
    const halfZ = boxSize[2] * 0.5;
    return {
      boxMin: new THREE.Vector3(position[0] - halfX, position[1] - halfY, position[2] - halfZ),
      boxMax: new THREE.Vector3(position[0] + halfX, position[1] + halfY, position[2] + halfZ),
    };
  }, [position, boxSize]);

  // Lighting parameters based on time of day
  const { sunDir, sunCol, skyAmb, groundAmb } = useMemo(() => {
    if (timeOfDay === 'morning') {
      return {
        sunDir: new THREE.Vector3(-0.7, 0.4, -0.3).normalize(),
        sunCol: new THREE.Vector3(1.0, 0.85, 0.65),
        skyAmb: new THREE.Vector3(0.45, 0.55, 0.75),
        groundAmb: new THREE.Vector3(0.25, 0.28, 0.3),
      };
    } else if (timeOfDay === 'evening') {
      return {
        sunDir: new THREE.Vector3(0.7, 0.25, -0.4).normalize(),
        sunCol: new THREE.Vector3(1.0, 0.65, 0.45),
        skyAmb: new THREE.Vector3(0.5, 0.42, 0.6),
        groundAmb: new THREE.Vector3(0.28, 0.25, 0.28),
      };
    }
    // High noon default: bright direct sunlight with soft sky ambient
    return {
      sunDir: new THREE.Vector3(0.35, 0.85, 0.4).normalize(),
      sunCol: new THREE.Vector3(1.08, 1.05, 0.98),
      skyAmb: new THREE.Vector3(0.58, 0.68, 0.82),
      groundAmb: new THREE.Vector3(0.35, 0.38, 0.38),
    };
  }, [timeOfDay]);

  // Dynamic moisture density factor linked to simulation moisture budget
  // Higher precipitation / moisture convergence -> denser, more billowing cloud
  const moistureDensity = useMemo(() => {
    return Math.min(1.4, Math.max(0.75, 0.85 + (precipitationRate - 5) * 0.05));
  }, [precipitationRate]);

  // Shader Uniforms
  const uniforms = useMemo(() => {
    return {
      uBoxMin: { value: boxMin },
      uBoxMax: { value: boxMax },
      uCameraPos: { value: new THREE.Vector3() },
      uSunDirection: { value: sunDir },
      uSunColor: { value: sunCol },
      uAmbientSkyColor: { value: skyAmb },
      uAmbientGroundColor: { value: groundAmb },
      uTime: { value: 0.0 },
      uCloudSpeed: { value: cloudSpeed },
      uMoistureDensity: { value: moistureDensity },
      uMaxSteps: { value: maxSteps },
      uStepScale: { value: 1.0 },
    };
  }, [boxMin, boxMax, sunDir, sunCol, skyAmb, groundAmb, cloudSpeed, moistureDensity, maxSteps]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const t = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = t;
    materialRef.current.uniforms.uCameraPos.value.copy(camera.position);
    materialRef.current.uniforms.uMoistureDensity.value = moistureDensity;
    materialRef.current.uniforms.uMaxSteps.value = maxSteps;
    materialRef.current.uniforms.uCloudSpeed.value = cloudSpeed;
  });

  return (
    <group name="volumetric-atmospheric-cloud">
      {/* 
        Volume Proxy Mesh:
        Rendered with THREE.DoubleSide so when the camera is outside OR inside
        the bounding volume, the raymarcher starts seamlessly at camera near plane!
      */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={boxSize} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
