// ── Ocean Water Multi-Scale 3D Gerstner Wave Vertex Shader ───────────────────
// Generates natural 3D wave interference from 7 non-parallel wave systems.
// Calculates true analytical normals from partial derivatives (tangent x binormal).

export const oceanWaterVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveSlope;
  varying float vWaveHeight;
  uniform float uTime;

  // Gerstner wave formulation with analytical derivatives
  // dir: normalized horizontal propagation vector
  // steepness: Q factor (peakedness)
  // wavelength: crest-to-crest distance (meters)
  // speed: phase velocity scaling
  void addGerstnerWave(
    vec2 dir, float steepness, float wavelength, float speed,
    vec2 pos, float time,
    inout vec3 displace, inout vec3 tangent, inout vec3 binormal
  ) {
    float k = 6.2831853 / wavelength; // Wave number
    float w = sqrt(9.81 * k);         // Deep water dispersion frequency
    float phase = k * dot(dir, pos) - w * time * speed;
    float a = steepness / k;          // Wave amplitude

    float sinP = sin(phase);
    float cosP = cos(phase);

    // Horizontal and vertical trochoidal displacement
    displace.x += dir.x * (a * cosP);
    displace.y += a * sinP;
    displace.z += dir.y * (a * cosP);

    // Tangent vector derivative contributions (along local X)
    // d(pos.x)/dX = 1 - dir.x^2 * S * sinP
    // d(pos.y)/dX = -dir.x * (-dir.y) * S * sinP = dir.x * dir.y * S * sinP
    // d(pos.z)/dX = dir.x * S * cosP
    tangent += vec3(
      -dir.x * dir.x * (steepness * sinP),
      dir.x * dir.y * (steepness * sinP),
      dir.x * (steepness * cosP)
    );

    // Binormal vector derivative contributions (along local Y)
    // d(pos.x)/dY = -dir.y * dir.x * S * sinP
    // d(pos.y)/dY = 1 - dir.y * (-dir.y) * S * sinP = 1 + dir.y^2 * S * sinP
    // d(pos.z)/dY = dir.y * S * cosP
    binormal += vec3(
      -dir.y * dir.x * (steepness * sinP),
      dir.y * dir.y * (steepness * sinP),
      dir.y * (steepness * cosP)
    );
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Plane geometry is rotated -PI/2 around X:
    // local X -> world X, local Y -> world -Z, local Z -> world +Y (vertical elevation)
    vec2 horizontalPos = vec2(pos.x, -pos.y);
    float t = uTime * 1.4; // Active, clearly visible wave propagation

    vec3 displace = vec3(0.0);
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 1.0, 0.0);

    // 4 Coherent eastward-propagating Gerstner ocean swells aligned toward the coast (+X)
    // Small angular spread (+-14 deg) ensures long, continuous rolling wave crests with NO pyramid spikes:
    // 1. Dominant deep-water ocean swell (wavelength 64m, amplitude ~2.0m, +10° heading)
    addGerstnerWave(normalize(vec2(0.985, 0.174)), 0.20, 64.0, 1.75, horizontalPos, t, displace, tangent, binormal);

    // 2. Secondary harmonic swell (wavelength 42m, amplitude ~1.0m, -6° heading)
    addGerstnerWave(normalize(vec2(0.995, -0.100)), 0.15, 42.0, 2.10, horizontalPos, t, displace, tangent, binormal);

    // 3. Modulating wind swell (wavelength 24m, amplitude ~0.46m, +14° heading)
    addGerstnerWave(normalize(vec2(0.970, 0.240)), 0.12, 24.0, 2.60, horizontalPos, t, displace, tangent, binormal);

    // 4. Fine traveling ripple (wavelength 12m, amplitude ~0.15m, -10° heading)
    addGerstnerWave(normalize(vec2(0.985, -0.174)), 0.08, 12.0, 3.20, horizontalPos, t, displace, tangent, binormal);

    // Shoreline damping: waves smoothly diminish near the beach (worldX > -50 down to -34)
    float worldX = (modelMatrix * vec4(pos, 1.0)).x;
    float shoreDamp = clamp((-34.0 - worldX) / 20.0, 0.0, 1.0);
    displace *= shoreDamp;

    // Apply displacement to mesh vertices in local plane space
    pos.x += displace.x;
    pos.y += -displace.z;
    pos.z += displace.y;

    vWaveHeight = displace.y;

    // Compute analytical surface normal from cross product of displaced local tangents
    vec3 analyticalNormal = normalize(cross(tangent, binormal));
    vNormal = normalize((modelMatrix * vec4(analyticalNormal, 0.0)).xyz);

    // Measure local slope (steepness of wave surface relative to vertical)
    vWaveSlope = clamp(1.0 - vNormal.y, 0.0, 1.0);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
